// app/api/routes/[id]/participants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserIds } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS, rateLimitExceededResponse } from "@/lib/rate-limit";

// GET /api/routes/[id]/participants - Obtener participantes con sus ubicaciones
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting - endpoint frecuente
  const clientId = getClientIdentifier(req);
  const rateLimitResult = await rateLimit(`participants:get:${clientId}`, RATE_LIMIT_CONFIGS.frequent);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

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

    // Devolver todos los participantes con su info (User OR Guest)
    const allParticipants = participants.map(p => ({
      id: p.userId || p.guestId || p.id,
      odId: p.id, // Original DB ID
      name: p.user?.name || p.name || "Anónimo",
      image: p.user?.image || p.avatar || null,
      lat: p.lastLat || 0,
      lng: p.lastLng || 0,
      lastSeenAt: p.lastSeenAt?.toISOString() || null,
      isActive: p.isActive,
      joinedAt: p.joinedAt.toISOString(),
      isGuest: !p.userId,
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
    const { id: routeId } = await params;
    const body = await req.json();
    const { lat, lng } = body;

    // Check Route Status First (Privacy Guard)
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      select: { status: true }
    });

    if (!route || route.status === 'completed') {
      return NextResponse.json({ ok: false, error: "Ruta finalizada o no encontrada" }, { status: 403 });
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ ok: false, error: "lat y lng son requeridos" }, { status: 400 });
    }

    const auth = await getCurrentUser(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const { userId, guestId } = getUserIds(auth.user);
    let participantId: string | null = null;

    // 1. Caso Usuario Autenticado
    if (userId) {
      const participant = await prisma.participant.findUnique({
        where: { routeId_userId: { routeId, userId } }
      });

      if (participant) {
        participantId = participant.id;
      } else {
        // Auto-join for logged in users
        const newParticipant = await prisma.participant.create({
          data: { routeId, userId, lastLat: lat, lastLng: lng, lastSeenAt: new Date() },
        });
        participantId = newParticipant.id;
      }
    }
    // 2. Caso Invitado (Cookie)
    else if (guestId) {
      const participant = await prisma.participant.findUnique({
        where: { routeId_guestId: { routeId, guestId } }
      });
      if (participant) participantId = participant.id;
    }

    if (!participantId) {
      return NextResponse.json({ ok: false, error: "No eres participante de esta ruta" }, { status: 403 });
    }

    // Actualizar ubicación
    await prisma.participant.update({
      where: { id: participantId },
      data: { lastLat: lat, lastLng: lng, lastSeenAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en POST /api/routes/[id]/participants:", error);
    return NextResponse.json({ ok: false, error: "Error al actualizar ubicación" }, { status: 500 });
  }
}
