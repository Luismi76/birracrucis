import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - Obtener valoraciones de la ruta
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
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

    // Calcular media por bar
    const avgByStop = await prisma.barRating.groupBy({
      by: ["stopId"],
      where: { routeId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return NextResponse.json({
      ok: true,
      ratings,
      averages: avgByStop,
    });
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const { id: routeId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

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

    // Upsert para actualizar o crear valoración
    const barRating = await prisma.barRating.upsert({
      where: {
        routeId_stopId_userId: { routeId, stopId, userId: user.id },
      },
      update: { rating, comment: comment || null },
      create: {
        routeId,
        stopId,
        userId: user.id,
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
