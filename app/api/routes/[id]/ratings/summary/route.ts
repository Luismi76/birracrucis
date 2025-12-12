import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener resumen de valoraciones por bar
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: routeId } = await params;

        // Obtener valoraciones agrupadas por stop
        const avgByStop = await prisma.barRating.groupBy({
            by: ["stopId"],
            where: { routeId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        // Obtener nombres de los stops
        const stopIds = avgByStop.map(s => s.stopId);
        const stops = await prisma.routeStop.findMany({
            where: { id: { in: stopIds } },
            select: { id: true, name: true },
        });

        const stopMap = new Map(stops.map(s => [s.id, s.name]));

        const ratings = avgByStop.map(s => ({
            stopId: s.stopId,
            stopName: stopMap.get(s.stopId) || "Bar desconocido",
            avgRating: s._avg.rating || 0,
            totalRatings: s._count.rating || 0,
        }));

        return NextResponse.json({ ok: true, ratings });
    } catch (error) {
        console.error("Error en GET /api/routes/[id]/ratings/summary:", error);
        return NextResponse.json({ ok: false, error: "Error al obtener resumen" }, { status: 500 });
    }
}
