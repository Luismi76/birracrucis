
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id: routeId } = params;

        // Verificar que la ruta existe y el usuario es el creador
        const route = await prisma.route.findUnique({
            where: { id: routeId },
            include: { creator: true }
        });

        if (!route) {
            return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
        }

        // Permitir solo al creador finalizar la ruta
        // Nota: Si el creador es null (ruta antigua), nadie puede finalizarla, o podríamos permitir a admins.
        // Asumimos validación por email del creador.
        if (route.creator?.email !== session.user.email) {
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
                    routeDate: updatedRoute.date,
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
