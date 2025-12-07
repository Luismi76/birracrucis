import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST - Enviar un nudge (meter prisa)
// POST - Enviar un nudge (meter prisa)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    let userId: string | undefined;
    let guestId: string | undefined;

    // Check auth
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = user?.id;
    } else {
      guestId = req.cookies.get("guestId")?.value;
    }

    if (!userId && !guestId) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

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
    const session = await getServerSession(authOptions);
    const guestId = req.cookies.get("guestId")?.value;

    if (!session?.user?.email && !guestId) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
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
