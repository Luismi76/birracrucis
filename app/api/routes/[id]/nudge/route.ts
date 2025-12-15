import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserIds } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// POST - Enviar un nudge (meter prisa)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentUser(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const { userId, guestId } = getUserIds(auth.user);

    const { id: routeId } = await params;
    const body = await req.json();
    const { message, targetUserId, targetGuestId } = body;

    const nudge = await prisma.nudge.create({
      data: {
        routeId,
        senderId: userId || null,
        senderGuestId: guestId || null,
        message: message || "¡Date prisa, te estamos esperando!",
        targetUserId,
        targetGuestId
      },
      include: {
        sender: { select: { name: true, image: true } },
        targetUser: { select: { name: true } }
      },
    });

    // Notify via Pusher
    const { pusherServer } = await import('@/lib/pusher');
    try {
      await pusherServer.trigger(`route-${routeId}`, "nudge", {
        id: nudge.id,
        message: nudge.message,
        senderId: nudge.senderId || nudge.senderGuestId,
        senderName: nudge.sender?.name || "Alguien",
        targetUserId: nudge.targetUserId,
        targetGuestId: nudge.targetGuestId,
        createdAt: nudge.createdAt.toISOString()
      });
    } catch (e) {
      console.error("Pusher error:", e);
    }

    return NextResponse.json({ ok: true, nudge });
  } catch (error) {
    console.error("Error en POST /api/routes/[id]/nudge:", error);
    return NextResponse.json({ ok: false, error: "Error al enviar aviso" }, { status: 500 });
  }
}

// GET - Obtener nudges recientes (últimos 5 minutos)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentUser(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const { id: routeId } = await params;

    // Obtener nudges de los últimos 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const nudges = await prisma.nudge.findMany({
      where: {
        routeId,
        createdAt: { gte: fiveMinutesAgo },
      },
      include: {
        sender: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ ok: true, nudges });
  } catch (error) {
    console.error("Error en GET /api/routes/[id]/nudge:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener avisos" }, { status: 500 });
  }
}
