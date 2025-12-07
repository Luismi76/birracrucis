import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS, rateLimitExceededResponse } from "@/lib/rate-limit";

// GET - Obtener mensajes del chat
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting - endpoint frecuente (polling de chat)
  const clientId = getClientIdentifier(req);
  const rateLimitResult = rateLimit(`chat:get:${clientId}`, RATE_LIMIT_CONFIGS.frequent);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

  try {
    const session = await getServerSession(authOptions);
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guestId")?.value;

    // Allow both authenticated users and guests
    if (!session?.user?.email && !guestId) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const { id: routeId } = await params;

    // Verify user/guest is a participant
    let isParticipant = false;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      if (user) {
        const participant = await prisma.participant.findUnique({
          where: { routeId_userId: { routeId, userId: user.id } }
        });
        isParticipant = !!participant;
      }
    } else if (guestId) {
      const participant = await prisma.participant.findUnique({
        where: { routeId_guestId: { routeId, guestId } }
      });
      isParticipant = !!participant;
    }

    if (!isParticipant) {
      return NextResponse.json({ ok: false, error: "No eres participante" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since"); // timestamp para obtener solo mensajes nuevos

    const messages = await prisma.message.findMany({
      where: {
        routeId,
        ...(since && { createdAt: { gt: new Date(since) } }),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100, // Limitar a últimos 100 mensajes
    });

    // For guest messages, get participant info
    const messagesWithGuestInfo = await Promise.all(
      messages.map(async (msg: any) => {
        if (msg.guestId) {
          const participant = await prisma.participant.findUnique({
            where: { routeId_guestId: { routeId, guestId: msg.guestId } }
          });
          return {
            ...msg,
            user: {
              id: msg.guestId,
              name: participant?.name || "Invitado",
              image: participant?.avatar || null,
            }
          };
        }
        return msg;
      })
    );

    return NextResponse.json({ ok: true, messages: messagesWithGuestInfo });
  } catch (error) {
    console.error("Error en GET /api/routes/[id]/chat:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener mensajes" }, { status: 500 });
  }
}

// POST - Enviar un mensaje
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting - endpoint de escritura (enviar mensajes)
  const clientId = getClientIdentifier(req);
  const rateLimitResult = rateLimit(`chat:send:${clientId}`, RATE_LIMIT_CONFIGS.standard);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

  try {
    const session = await getServerSession(authOptions);
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guestId")?.value;

    // Allow both authenticated users and guests
    if (!session?.user?.email && !guestId) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const { id: routeId } = await params;

    // Verify user/guest is a participant and get user info if authenticated
    let isParticipant = false;
    let userId: string | null = null;
    let userName: string | null = null;
    let userImage: string | null = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      if (user) {
        const participant = await prisma.participant.findUnique({
          where: { routeId_userId: { routeId, userId: user.id } }
        });
        if (participant) {
          isParticipant = true;
          userId = user.id;
          userName = user.name;
          userImage = user.image;
        }
      }
    } else if (guestId) {
      const participant = await prisma.participant.findUnique({
        where: { routeId_guestId: { routeId, guestId } }
      });
      if (participant) {
        isParticipant = true;
        userName = participant.name;
        userImage = participant.avatar;
      }
    }

    if (!isParticipant) {
      return NextResponse.json({ ok: false, error: "No eres participante" }, { status: 403 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "Mensaje vacío" }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ ok: false, error: "Mensaje muy largo (max 500)" }, { status: 400 });
    }

    // Create message with either userId or guestId
    const messageData: any = {
      routeId,
      content: content.trim(),
    };

    if (userId) {
      messageData.userId = userId;
    } else if (guestId) {
      messageData.guestId = guestId;
    }

    const message = await prisma.message.create({
      data: messageData,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // For guest messages, manually add guest info to response
    const responseMessage = {
      ...message,
      user: message.user || {
        id: guestId!,
        name: userName,
        image: userImage,
      }
    };

    return NextResponse.json({ ok: true, message: responseMessage }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/routes/[id]/chat:", error);
    return NextResponse.json({ ok: false, error: "Error al enviar mensaje" }, { status: 500 });
  }
}
