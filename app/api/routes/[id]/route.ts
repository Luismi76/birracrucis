import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type StopInput = {
    name: string;
    address?: string;
    lat: number;
    lng: number;
    plannedRounds?: number;
    maxRounds?: number | null;
    googlePlaceId?: string | null;
    stayDuration?: number; // minutos de estancia en el bar
};

type UpdateRouteBody = {
    name: string;
    date: string;
    stops: StopInput[];
    // Campos de configuración de tiempo
    startMode?: "manual" | "scheduled" | "all_present";
    startTime?: string | null; // ISO string
    hasEndTime?: boolean;
    endTime?: string | null; // ISO string
};

// Verifica si el usuario es creador o participante de la ruta
async function canModifyRoute(routeId: string, userId: string): Promise<boolean> {
    const route = await prisma.route.findUnique({
        where: { id: routeId },
        select: { creatorId: true },
    });

    // Si es el creador, puede modificar
    if (route?.creatorId === userId) return true;

    // Si es participante, también puede modificar
    const participant = await prisma.participant.findUnique({
        where: { routeId_userId: { routeId, userId } },
    });
    if (participant) return true;

    return false;
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        // Verificar permisos (solo si hay sesión)
        if (session?.user?.id) {
            const canModify = await canModifyRoute(id, session.user.id);
            if (!canModify) {
                return NextResponse.json(
                    { ok: false, error: "No tienes permiso para eliminar esta ruta" },
                    { status: 403 }
                );
            }
        }

        // Borrar participantes
        await prisma.participant.deleteMany({
            where: { routeId: id },
        });

        // Borrar stops (cascade está configurado, pero por seguridad)
        await prisma.routeStop.deleteMany({
            where: { routeId: id },
        });

        // Borrar ruta
        await prisma.route.delete({
            where: { id },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error DELETE route:", error);
        return NextResponse.json(
            { ok: false, error: "Error al eliminar la ruta" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        // Verificar permisos (solo si hay sesión)
        if (session?.user?.id) {
            const canModify = await canModifyRoute(id, session.user.id);
            if (!canModify) {
                return NextResponse.json(
                    { ok: false, error: "No tienes permiso para editar esta ruta" },
                    { status: 403 }
                );
            }
        }

        const body = (await req.json()) as UpdateRouteBody;
        const { name, date, stops, startMode, startTime, hasEndTime, endTime } = body;

        if (!name || !date || !Array.isArray(stops) || stops.length === 0) {
            return NextResponse.json(
                { ok: false, error: "Datos inválidos" },
                { status: 400 }
            );
        }

        // Transacción para actualizar
        const updatedRoute = await prisma.$transaction(async (tx) => {
            // 1. Actualizar datos básicos y campos de tiempo
            const route = await tx.route.update({
                where: { id },
                data: {
                    name,
                    date: new Date(date),
                    // Campos de tiempo
                    startMode: startMode ?? "manual",
                    startTime: startTime ? new Date(startTime) : null,
                    hasEndTime: hasEndTime ?? false,
                    endTime: endTime ? new Date(endTime) : null,
                },
            });

            // 2. Reemplazar stops (Estrategia simple: borrar y crear)
            // NOTA: Esto resetea actualRounds. Para mantenerlo habría que hacer diffing complejo.
            await tx.routeStop.deleteMany({
                where: { routeId: id },
            });

            await tx.routeStop.createMany({
                data: stops.map((s, index) => ({
                    routeId: id,
                    name: s.name,
                    address: s.address ?? "",
                    lat: s.lat,
                    lng: s.lng,
                    order: index,
                    plannedRounds: s.plannedRounds ?? 1,
                    maxRounds: s.maxRounds ?? null,
                    googlePlaceId: s.googlePlaceId ?? null,
                    stayDuration: s.stayDuration ?? 30,
                    actualRounds: 0, // Reset
                })),
            });

            return route;
        });

        return NextResponse.json({ ok: true, route: updatedRoute });
    } catch (error) {
        console.error("Error PUT route:", error);
        return NextResponse.json(
            { ok: false, error: "Error al actualizar la ruta" },
            { status: 500 }
        );
    }
}
