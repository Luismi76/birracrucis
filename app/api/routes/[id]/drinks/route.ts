import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS, rateLimitExceededResponse } from "@/lib/rate-limit";

// GET - Obtener bebidas de la ruta
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting - endpoint frecuente
  const clientId = getClientIdentifier(req);
  const rateLimitResult = rateLimit(`drinks:get:${clientId}`, RATE_LIMIT_CONFIGS.frequent);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

  try {
    const session = await getServerSession(authOptions);
    let userId: string | undefined;
    let guestId: string | undefined;

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

    const drinks = await prisma.drink.findMany({
      where: { routeId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        paidBy: { select: { id: true, name: true, image: true } },
        stop: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular estadísticas (agrupando por quien sea)
    let statsData = {};
    // ... simplificado por ahora, stats complejos para guests requiere refactor mayor

    // Calcular estadísticas por usuario (solo registrados para no romper compatibilidad rápida)
    const stats = await prisma.drink.groupBy({
      by: ["userId"],
      where: { routeId, userId: { not: null } },
      _count: { id: true },
    });

    // Estadisticas de guests
    const guestStats = await prisma.drink.groupBy({
      by: ["guestId"],
      where: { routeId, guestId: { not: null } },
      _count: { id: true }
    });

    // Calcular quién ha pagado más (pagadores siempre son Users por ahora?)
    const paidStats = await prisma.drink.groupBy({
      by: ["paidById"],
      where: { routeId, paidById: { not: null } },
      _count: { id: true },
    });

    return NextResponse.json({
      ok: true,
      drinks,
      stats: {
        byUser: [...stats, ...guestStats.map(g => ({ userId: g.guestId, _count: g._count }))], // Hack mezcla
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
  // Rate limiting - endpoint estándar
  const clientId = getClientIdentifier(req);
  const rateLimitResult = rateLimit(`drinks:add:${clientId}`, RATE_LIMIT_CONFIGS.standard);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

  try {
    const session = await getServerSession(authOptions);
    let userId: string | undefined;
    let guestId: string | undefined;

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
    const { stopId, type = "beer", paidById } = body;

    if (!stopId) {
      return NextResponse.json({ ok: false, error: "stopId requerido" }, { status: 400 });
    }

    const drink = await prisma.drink.create({
      data: {
        routeId,
        stopId,
        userId: userId, // Optional, can be undefined/null
        guestId: guestId, // Optional
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
