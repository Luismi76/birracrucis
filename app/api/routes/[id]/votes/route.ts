import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - Obtener votos de una parada
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

    if (!stopId) {
      return NextResponse.json({ ok: false, error: "stopId requerido" }, { status: 400 });
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

    // Si más del 50% vota saltar, se salta
    const shouldSkip = skipVotes > totalParticipants / 2;

    return NextResponse.json({
      ok: true,
      votes,
      summary: {
        skip: skipVotes,
        stay: stayVotes,
        total: totalParticipants,
        shouldSkip,
      },
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
    const { stopId, vote } = body; // vote: true = saltar, false = quedarse

    if (!stopId || typeof vote !== "boolean") {
      return NextResponse.json({ ok: false, error: "stopId y vote requeridos" }, { status: 400 });
    }

    // Upsert para actualizar o crear voto
    const skipVote = await prisma.skipVote.upsert({
      where: {
        routeId_stopId_userId: { routeId, stopId, userId: user.id },
      },
      update: { vote },
      create: {
        routeId,
        stopId,
        userId: user.id,
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
