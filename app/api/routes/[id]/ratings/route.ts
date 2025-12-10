import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// GET - Obtener valoraciones de la ruta
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const { id: routeId } = await params;
    const { searchParams } = new URL(req.url);
    const stopId = searchParams.get("stopId");

    const ratings = await prisma.barRating.findMany({
      where: {
        routeId,
        ...(stopId && { stopId }),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        stop: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const avgByStop = await prisma.barRating.groupBy({
      by: ["stopId"],
      where: { routeId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return NextResponse.json({ ok: true, ratings, averages: avgByStop });
  } catch (error) {
    console.error("Error en GET /api/routes/[id]/ratings:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener valoraciones" }, { status: 500 });
  }
}

// POST - Valorar un bar
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
    const body = await req.json();
    const { stopId, rating, comment } = body;

    if (!stopId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: "stopId y rating (1-5) requeridos" }, { status: 400 });
    }

    // Validar que el stop pertenece a la ruta
    const stop = await prisma.routeStop.findFirst({
      where: { id: stopId, routeId },
    });
    if (!stop) {
      return NextResponse.json({ ok: false, error: "Stop no pertenece a esta ruta" }, { status: 400 });
    }

    const barRating = await prisma.barRating.upsert({
      where: {
        routeId_stopId_userId: { routeId, stopId, userId: auth.user.id },
      },
      update: { rating, comment: comment || null },
      create: {
        routeId,
        stopId,
        userId: auth.user.id,
        rating,
        comment: comment || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        stop: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ok: true, rating: barRating });
  } catch (error) {
    console.error("Error en POST /api/routes/[id]/ratings:", error);
    return NextResponse.json({ ok: false, error: "Error al valorar" }, { status: 500 });
  }
}
