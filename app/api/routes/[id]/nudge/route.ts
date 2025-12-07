import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST - Enviar un nudge (meter prisa)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guestId")?.value;

    if (!session?.user?.email && !guestId) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const { id: routeId } = await params;

    // Identificar al remitente (User o Guest)
    let senderId = "";
    let isGuest = false;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) {
        senderId = user.id;
      }
    } else if (guestId) {
      // Verificar si es participante
      const participant = await prisma.participant.findUnique({
        where: { routeId_guestId: { routeId, guestId } },
      });
      if (participant) {
        senderId = "guest"; // Placeholder, nudges currently require a User sender relation.
        // LIMITATION: Prisma schema currently links Nudge.sender ONLY to User model.
        // To allow guests to send nudges, we either need to:
        // 1. Make senderId nullable and add guestSenderId
        // 2. Or just allow users for now.
        // Given Phase 1 focused on fixing Chat for guests (which has a flexible Message model), 
        // and Nudge model is strict.

        // Let's check Nudge model again.
        // sender    User     @relation("NudgeSender", fields: [senderId]...

        // If the user wants FULL guest support for nudges, we need schema change similar to Message.
        // For now, let's implement validation but realize schema limitation.
      }
    }

    // RE-READING SCHEMA: Nudge requires sender (User). 
    // If I want guests to send nudges, I need to update schema again or skip guest sending for now.
    // The user didn't explicitly ask for "Guest Nudging", just "Notifying specific participant".
    // Assuming the user logged in is the one notifying. 
    // But wait, guests should be able to nudge too? Probably.
    // Let's stick to User senders for now to avoid massive schema refactor unless user complains, 
    // OR quickly add guestSenderId to Nudge schema while we are at it.

    // Actually, I just did `prisma db push`. I can update Nudge to have optional senderId and optional guestSenderId.
    // But let's look at the body first.

    const body = await req.json();
    const { message, targetUserId, targetGuestId } = body;

    // Re-verify User for now (simplest path)
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Solo usuarios registrados pueden enviar avisos por ahora" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

    const nudge = await prisma.nudge.create({
      data: {
        routeId,
        senderId: user.id,
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
    if (!session?.user?.email) {
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
