import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        // Obtener rutas completadas donde el usuario participó
        const completedRoutes = await prisma.route.findMany({
            where: {
                status: "completed",
                OR: [
                    { creatorId: user.id },
                    { participants: { some: { userId: user.id } } },
                ],
            },
            include: {
                stops: {
                    orderBy: { order: "asc" },
                    include: {
                        ratings: {
                            where: { userId: user.id },
                            select: { rating: true },
                        },
                    },
                },
                creator: { select: { name: true, image: true } },
                _count: {
                    select: {
                        participants: true,
                        photos: true,
                        drinks: true,
                    },
                },
                drinks: {
                    where: { userId: user.id },
                    select: { id: true },
                },
                photos: {
                    where: { userId: user.id },
                    select: { id: true },
                },
            },
            orderBy: { actualEndTime: "desc" },
        });

        // Calcular estadísticas por ruta
        const routesWithStats = completedRoutes.map((route) => {
            const userDrinks = route.drinks.length;
            const userPhotos = route.photos.length;
            const avgRating =
                route.stops.reduce((acc, stop) => {
                    const rating = stop.ratings[0]?.rating || 0;
                    return acc + rating;
                }, 0) / (route.stops.filter((s) => s.ratings.length > 0).length || 1);

            const duration =
                route.actualStartTime && route.actualEndTime
                    ? Math.round(
                        (new Date(route.actualEndTime).getTime() -
                            new Date(route.actualStartTime).getTime()) /
                        60000
                    )
                    : null;

            return {
                ...route,
                userDrinks,
                userPhotos,
                avgRating: avgRating || 0,
                duration,
            };
        });

        return NextResponse.json(routesWithStats);
    } catch (error) {
        console.error("Error fetching history:", error);
        return NextResponse.json(
            { error: "Error fetching history" },
            { status: 500 }
        );
    }
}
