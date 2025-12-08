// app/api/routes/[id]/participants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS, rateLimitExceededResponse } from "@/lib/rate-limit";

// GET /api/routes/[id]/participants - Obtener participantes con sus ubicaciones
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting - endpoint frecuente
  const clientId = getClientIdentifier(req);
  const rateLimitResult = rateLimit(`participants:get:${clientId}`, RATE_LIMIT_CONFIGS.frequent);
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

    const session = await getServerSession(authOptions);
    let participantId: string | null = null;

    // 1. Caso Usuario Autenticado
    if (session?.user?.email) {
      const user = await prisma.user.upsert({
        where: { email: session.user.email },
        update: { name: session.user.name },
        create: { email: session.user.email, name: session.user.name, image: session.user.image },
      });

      const participant = await prisma.participant.findUnique({
        where: { routeId_userId: { routeId, userId: user.id } }
      });

      if (participant) {
        participantId = participant.id;
      } else {
        // Auto-join ONLY for logged in users (legacy behavior, maybe remove?)
        // Keeping it for now as it's useful fallback
        const newParticipant = await prisma.participant.create({
          data: { routeId, userId: user.id, lastLat: lat, lastLng: lng, lastSeenAt: new Date() },
        });
        participantId = newParticipant.id;
      }
    }
    // 2. Caso Invitado (Cookie)
    else {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const guestId = cookieStore.get("guestId")?.value;

      if (guestId) {
        const participant = await prisma.participant.findUnique({
          // @ts-ignore
          where: { routeId_guestId: { routeId, guestId } }
        });
        if (participant) participantId = participant.id;
      }
    }

    if (!participantId) {
      return NextResponse.json({ ok: false, error: "No autorizado o no participante" }, { status: 401 });
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
