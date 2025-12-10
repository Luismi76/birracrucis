import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getAuthenticatedUser, getUserIds } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS, rateLimitExceededResponse } from "@/lib/rate-limit";

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
    date?: string | null;
    stops: StopInput[];
    // Campos de configuración de tiempo
    startMode?: "manual" | "scheduled" | "all_present";
    startTime?: string | null; // ISO string
    hasEndTime?: boolean;
    endTime?: string | null; // ISO string
    isPublic?: boolean;
    description?: string | null;
};

// Verifica si el usuario es el creador de la ruta (solo el creador puede modificar/eliminar)
async function canModifyRoute(routeId: string, userId: string): Promise<boolean> {
    const route = await prisma.route.findUnique({
        where: { id: routeId },
        select: { creatorId: true },
    });

    // Solo el creador puede modificar la ruta
    return route?.creatorId === userId;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const route = await prisma.route.findUnique({
            where: { id },
            include: {
                stops: {
                    orderBy: { order: "asc" },
                    include: {
                        _count: { select: { photos: true } }
                    }
                },
                creator: {
                    select: { name: true, image: true }
                },
                _count: {
                    select: { participants: true }
                }
            },
        });

        if (!route) {
            return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
        }

        // Check visibility: Must be public OR user must be creator/participant
        let hasAccess = route.isPublic;

        if (!hasAccess) {
            const auth = await getCurrentUser(req);
            if (auth.ok && auth.user.type === "user") {
                if (route.creatorId === auth.user.id) hasAccess = true;
                else {
                    const participant = await prisma.participant.findUnique({
                        where: { routeId_userId: { routeId: id, userId: auth.user.id } }
                    });
                    if (participant) hasAccess = true;
                }
            }
        }

        if (!hasAccess) {
            return NextResponse.json({ ok: false, error: "No tienes permiso para ver esta ruta" }, { status: 403 });
        }

        return NextResponse.json({ ok: true, route });
    } catch (error) {
        console.error("Error GET route:", error);
        return NextResponse.json({ ok: false, error: "Error al cargar la ruta" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Rate limiting - endpoint de escritura (eliminar ruta)
    const clientId = getClientIdentifier(req);
    const rateLimitResult = await rateLimit(`routes:delete:${clientId}`, RATE_LIMIT_CONFIGS.write);
    if (!rateLimitResult.success) {
        return rateLimitExceededResponse(rateLimitResult.reset);
    }

    try {
        const auth = await getAuthenticatedUser(req);
        if (!auth.ok) {
            return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
        }

        const { id } = await params;

        const canModify = await canModifyRoute(id, auth.user.id);
        if (!canModify) {
            return NextResponse.json(
                { ok: false, error: "No tienes permiso para eliminar esta ruta" },
                { status: 403 }
            );
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
    // Rate limiting - endpoint de escritura (actualizar ruta)
    const clientId = getClientIdentifier(req);
    const rateLimitResult = await rateLimit(`routes:update:${clientId}`, RATE_LIMIT_CONFIGS.write);
    if (!rateLimitResult.success) {
        return rateLimitExceededResponse(rateLimitResult.reset);
    }

    try {
        const auth = await getAuthenticatedUser(req);
        if (!auth.ok) {
            return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
        }

        const { id } = await params;

        const canModify = await canModifyRoute(id, auth.user.id);
        if (!canModify) {
            return NextResponse.json(
                { ok: false, error: "No tienes permiso para editar esta ruta" },
                { status: 403 }
            );
        }

        const body = (await req.json()) as UpdateRouteBody;
        const { name, date, stops, startMode, startTime, hasEndTime, endTime } = body;

        if (!name || !Array.isArray(stops) || stops.length === 0) {
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
                    date: date ? new Date(date) : null,
                    // Campos de tiempo
                    startMode: startMode ?? "manual",
                    startTime: startTime ? new Date(startTime) : null,
                    hasEndTime: hasEndTime ?? false,
                    endTime: endTime ? new Date(endTime) : null,
                    isPublic: body.isPublic ?? false,
                    description: body.description ?? null,
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
