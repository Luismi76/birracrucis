import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST - Enviar un nudge (meter prisa) a los rezagados
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

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario es participante de la ruta
    const participant = await prisma.participant.findUnique({
      where: { routeId_userId: { routeId, userId: user.id } },
    });

    if (!participant) {
      return NextResponse.json({ ok: false, error: "No eres participante de esta ruta" }, { status: 403 });
    }

    const body = await req.json();
    const message = body.message || "¡Date prisa, te estamos esperando!";

    // Crear el nudge
    const nudge = await prisma.nudge.create({
      data: {
        routeId,
        senderId: user.id,
        message,
      },
      include: {
        sender: { select: { name: true, image: true } },
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
