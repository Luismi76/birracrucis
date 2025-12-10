import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// POST /api/routes/[id]/stops - Agregar una nueva parada a la ruta
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
            select: { creatorId: true },
        });

        if (!route) {
            return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
        }

        if (route.creatorId !== auth.user.id) {
            return NextResponse.json({ ok: false, error: "Solo el creador puede añadir paradas" }, { status: 403 });
        }

        const body = await req.json();
        const { name, lat, lng, googlePlaceId, address, plannedRounds, order } = body;

        if (!name || !lat || !lng) {
            return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
        }

        // Crear la parada
        const stop = await prisma.routeStop.create({
            data: {
                routeId,
                name,
                lat,
                lng,
                address: address || "Dirección desconocida",
                googlePlaceId,
                plannedRounds: plannedRounds || 1,
                order: order || 999,
            },
        });

        return NextResponse.json({ ok: true, stop }, { status: 201 });
    } catch (error) {
        console.error("Error en POST /api/routes/[id]/stops:", error);
        return NextResponse.json({ ok: false, error: "Error al crear parada" }, { status: 500 });
    }
}
