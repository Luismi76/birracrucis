import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthenticatedUser(req);
        if (!auth.ok) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const userId = auth.user.id;

        const now = new Date();

        // Obtener plantillas creadas por el usuario (isTemplate = true)
        const templates = await prisma.route.findMany({
            where: {
                creatorId: userId,
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
                creatorId: userId,
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
                creatorId: userId,
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
                    some: { userId },
                },
                NOT: { creatorId: userId },
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
