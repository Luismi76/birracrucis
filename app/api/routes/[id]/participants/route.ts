// app/api/routes/[id]/participants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/routes/[id]/participants - Obtener participantes con sus ubicaciones
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routeId } = await params;

    const participants = await prisma.participant.findMany({
      where: { routeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Filtrar solo los que tienen ubicación reciente (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeParticipants = participants
      .filter(p => p.lastLat && p.lastLng && p.lastSeenAt && p.lastSeenAt > fiveMinutesAgo)
      .map(p => ({
        odId: p.id,
        odIduserId: p.userId,
        name: p.user.name,
        image: p.user.image,
        lat: p.lastLat,
        lng: p.lastLng,
        lastSeenAt: p.lastSeenAt,
      }));

    return NextResponse.json({ ok: true, participants: activeParticipants });
  } catch (error) {
    console.error("Error en GET /api/routes/[id]/participants:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener participantes" }, { status: 500 });
  }
}

// POST /api/routes/[id]/participants - Actualizar mi ubicación
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
    const body = await req.json();
    const { lat, lng } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ ok: false, error: "lat y lng son requeridos" }, { status: 400 });
    }

    // Obtener o crear usuario
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: { name: session.user.name, image: session.user.image },
      create: { email: session.user.email, name: session.user.name, image: session.user.image },
    });

    // Verificar que el usuario es participante de esta ruta
    const participant = await prisma.participant.findUnique({
      where: {
        routeId_userId: {
          routeId,
          userId: user.id,
        },
      },
    });

    if (!participant) {
      // Auto-unirse si no es participante
      await prisma.participant.create({
        data: {
          routeId,
          userId: user.id,
          lastLat: lat,
          lastLng: lng,
          lastSeenAt: new Date(),
        },
      });
    } else {
      // Actualizar ubicación
      await prisma.participant.update({
        where: { id: participant.id },
        data: {
          lastLat: lat,
          lastLng: lng,
          lastSeenAt: new Date(),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en POST /api/routes/[id]/participants:", error);
    return NextResponse.json({ ok: false, error: "Error al actualizar ubicación" }, { status: 500 });
  }
}
