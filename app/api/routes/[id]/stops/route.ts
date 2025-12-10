import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST /api/routes/[id]/stops - Agregar una nueva parada a la ruta
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
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

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user || route.creatorId !== user.id) {
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
