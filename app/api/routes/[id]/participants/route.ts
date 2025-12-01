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
      where: { routeId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    // Devolver todos los participantes con su info
    const allParticipants = participants.map(p => ({
      id: p.user.id,
      odId: p.id,
      odIduserId: p.userId,
      name: p.user.name,
      image: p.user.image,
      lat: p.lastLat || 0,
      lng: p.lastLng || 0,
      lastSeenAt: p.lastSeenAt?.toISOString() || null,
      isActive: p.isActive,
      joinedAt: p.joinedAt.toISOString(),
    }));

    return NextResponse.json({ ok: true, participants: allParticipants });
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
