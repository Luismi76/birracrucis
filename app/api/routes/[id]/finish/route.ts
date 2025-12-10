
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthenticatedUser(req);
        if (!auth.ok) {
            return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
        }

        const { id: routeId } = await params;

        // Verificar que la ruta existe y el usuario es el creador
        const route = await prisma.route.findUnique({
            where: { id: routeId },
            select: { id: true, creatorId: true }
        });

        if (!route) {
            return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
        }

        // Permitir solo al creador finalizar la ruta
        if (route.creatorId !== auth.user.id) {
            return NextResponse.json({ ok: false, error: "Solo el creador puede finalizar la ruta" }, { status: 403 });
        }

        // Actualizar estado
        // Actualizar estado
        const updatedRoute = await prisma.route.update({
            where: { id: routeId },
            data: {
                status: "completed",
                actualEndTime: new Date(),
            },
            include: {
                stops: true,
                participants: {
                    where: { isActive: true, userId: { not: null } },
                    include: { user: true }
                }
            }
        });

        // Enviar correos de resumen
        const emailPromises = updatedRoute.participants.map(async (p) => {
            if (p.user?.email) {
                const { sendRouteSummaryEmail } = await import("@/lib/email");
                return sendRouteSummaryEmail({
                    to: p.user.email,
                    userName: p.user.name || "Participante",
                    routeName: updatedRoute.name,
                    routeDate: updatedRoute.date || updatedRoute.createdAt || new Date(),
                    stopsVisited: updatedRoute.stops.length,
                    totalStops: updatedRoute.stops.length
                });
            }
        });

        await Promise.allSettled(emailPromises);

        return NextResponse.json({ ok: true, route: updatedRoute });

    } catch (error) {
        console.error("Error finishing route:", error);
        return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
    }
}
