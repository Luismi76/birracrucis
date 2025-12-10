import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// GET - Obtener votos de una parada
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

    if (!stopId) {
      return NextResponse.json({ ok: false, error: "stopId requerido" }, { status: 400 });
    }

    // Validar que el stop pertenece a la ruta
    const stop = await prisma.routeStop.findFirst({
      where: { id: stopId, routeId },
    });
    if (!stop) {
      return NextResponse.json({ ok: false, error: "Stop no pertenece a esta ruta" }, { status: 400 });
    }

    const votes = await prisma.skipVote.findMany({
      where: { routeId, stopId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    const totalParticipants = await prisma.participant.count({
      where: { routeId, isActive: true },
    });

    const skipVotes = votes.filter(v => v.vote === true).length;
    const stayVotes = votes.filter(v => v.vote === false).length;
    const shouldSkip = skipVotes > totalParticipants / 2;

    return NextResponse.json({
      ok: true,
      votes,
      summary: { skip: skipVotes, stay: stayVotes, total: totalParticipants, shouldSkip },
    });
  } catch (error) {
    console.error("Error en GET /api/routes/[id]/votes:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener votos" }, { status: 500 });
  }
}

// POST - Votar para saltar/quedarse en un bar
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
    const { stopId, vote } = body;

    if (!stopId || typeof vote !== "boolean") {
      return NextResponse.json({ ok: false, error: "stopId y vote requeridos" }, { status: 400 });
    }

    // Validar que el stop pertenece a la ruta
    const stop = await prisma.routeStop.findFirst({
      where: { id: stopId, routeId },
    });
    if (!stop) {
      return NextResponse.json({ ok: false, error: "Stop no pertenece a esta ruta" }, { status: 400 });
    }

    const skipVote = await prisma.skipVote.upsert({
      where: {
        routeId_stopId_userId: { routeId, stopId, userId: auth.user.id },
      },
      update: { vote },
      create: {
        routeId,
        stopId,
        userId: auth.user.id,
        vote,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ ok: true, vote: skipVote });
  } catch (error) {
    console.error("Error en POST /api/routes/[id]/votes:", error);
    return NextResponse.json({ ok: false, error: "Error al votar" }, { status: 500 });
  }
}
