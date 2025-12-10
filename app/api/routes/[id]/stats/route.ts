import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: routeId } = await params;

        // Get all drinks for this route (consolidado desde BeerConsumption)
        const drinks = await prisma.drink.findMany({
            where: { routeId },
            select: {
                id: true,
                userId: true,
                guestId: true,
            },
        });

        // Get participants to map user info
        const participants = await prisma.participant.findMany({
            where: { routeId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        // Count beers per participant
        const stats = participants.map((p) => {
            const odId = p.user?.id || p.guestId;
            // Contar bebidas que coincidan con odId o guestId del participante
            const beersCount = drinks.filter(
                (d) => d.userId === odId || d.guestId === p.guestId
            ).length;

            return {
                id: odId || p.id,
                name: p.user?.name || p.name,
                image: p.user?.image || null,
                beersCount,
            };
        });

        return NextResponse.json({
            ok: true,
            stats,
        });
    } catch (error) {
        console.error("Error fetching participant stats:", error);
        return NextResponse.json(
            { ok: false, error: "Error fetching stats" },
            { status: 500 }
        );
    }
}
