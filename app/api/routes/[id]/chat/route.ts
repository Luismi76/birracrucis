import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - Obtener mensajes del chat
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

    return NextResponse.json({ ok: true, messages });
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

    // Verificar que es participante
    const participant = await prisma.participant.findUnique({
      where: { routeId_userId: { routeId, userId: user.id } },
    });

    if (!participant) {
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

    const message = await prisma.message.create({
      data: {
        routeId,
        userId: user.id,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ ok: true, message }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/routes/[id]/chat:", error);
    return NextResponse.json({ ok: false, error: "Error al enviar mensaje" }, { status: 500 });
  }
}
