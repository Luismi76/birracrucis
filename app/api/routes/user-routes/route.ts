import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const now = new Date();

        // Obtener plantillas creadas por el usuario (isTemplate = true)
        const templates = await prisma.route.findMany({
            where: {
                creatorId: user.id,
                isTemplate: true,
                templateId: null, // Las plantillas no tienen templateId
            },
            include: {
                stops: {
                    orderBy: { order: "asc" },
                },
                _count: {
                    select: {
                        participants: true,
                        editions: true, // Contar cuántas ediciones tiene
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Obtener ediciones pendientes (status = pending, fecha futura)
        const upcomingEditions = await prisma.route.findMany({
            where: {
                creatorId: user.id,
                isTemplate: false,
                status: "pending",
                date: { gte: now },
            },
            include: {
                stops: {
                    orderBy: { order: "asc" },
                },
                _count: {
                    select: { participants: true },
                },
            },
            orderBy: { date: "asc" },
        });

        // Obtener ediciones activas (status = active)
        const activeEditions = await prisma.route.findMany({
            where: {
                creatorId: user.id,
                status: "active",
            },
            include: {
                stops: {
                    orderBy: { order: "asc" },
                },
                _count: {
                    select: { participants: true },
                },
            },
            orderBy: { date: "desc" },
        });

        // Obtener rutas donde el usuario es participante (pero no creador)
        const invitedRoutes = await prisma.route.findMany({
            where: {
                participants: {
                    some: { userId: user.id },
                },
                NOT: { creatorId: user.id },
            },
            include: {
                stops: {
                    orderBy: { order: "asc" },
                },
                creator: {
                    select: { name: true },
                },
                _count: {
                    select: { participants: true },
                },
            },
            orderBy: { date: "desc" },
        });

        return NextResponse.json({
            templates,
            upcomingEditions,
            activeEditions,
            invitedRoutes,
        });
    } catch (error) {
        console.error("Error fetching user routes:", error);
        return NextResponse.json(
            { error: "Error al cargar las rutas" },
            { status: 500 }
        );
    }
}
