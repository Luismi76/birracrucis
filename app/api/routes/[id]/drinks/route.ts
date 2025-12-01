import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - Obtener bebidas de la ruta
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

    const drinks = await prisma.drink.findMany({
      where: { routeId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        paidBy: { select: { id: true, name: true, image: true } },
        stop: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular estadísticas por usuario
    const stats = await prisma.drink.groupBy({
      by: ["userId"],
      where: { routeId },
      _count: { id: true },
    });

    // Calcular quién ha pagado más
    const paidStats = await prisma.drink.groupBy({
      by: ["paidById"],
      where: { routeId, paidById: { not: null } },
      _count: { id: true },
    });

    return NextResponse.json({
      ok: true,
      drinks,
      stats: {
        byUser: stats,
        byPayer: paidStats,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/routes/[id]/drinks:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener bebidas" }, { status: 500 });
  }
}

// POST - Registrar una bebida
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

    const body = await req.json();
    const { stopId, type = "beer", paidById } = body;

    if (!stopId) {
      return NextResponse.json({ ok: false, error: "stopId requerido" }, { status: 400 });
    }

    const drink = await prisma.drink.create({
      data: {
        routeId,
        stopId,
        userId: user.id,
        type,
        paidById: paidById || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        paidBy: { select: { id: true, name: true, image: true } },
        stop: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ok: true, drink }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/routes/[id]/drinks:", error);
    return NextResponse.json({ ok: false, error: "Error al registrar bebida" }, { status: 500 });
  }
}
