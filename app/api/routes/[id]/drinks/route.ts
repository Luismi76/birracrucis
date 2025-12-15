import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getUserIds } from "@/lib/auth-helpers";
import { rateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS, rateLimitExceededResponse } from "@/lib/rate-limit";

// GET - Obtener bebidas de la ruta
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientId = getClientIdentifier(req);
  const rateLimitResult = await rateLimit(`drinks:get:${clientId}`, RATE_LIMIT_CONFIGS.frequent);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

  try {
    const auth = await getCurrentUser(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
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

    // Estadísticas por usuario
    const stats = await prisma.drink.groupBy({
      by: ["userId"],
      where: { routeId, userId: { not: null } },
      _count: { id: true },
    });

    // Estadísticas de guests
    const guestStats = await prisma.drink.groupBy({
      by: ["guestId"],
      where: { routeId, guestId: { not: null } },
      _count: { id: true },
    });

    // Quién ha pagado más
    const paidStats = await prisma.drink.groupBy({
      by: ["paidById"],
      where: { routeId, paidById: { not: null } },
      _count: { id: true },
    });

    return NextResponse.json({
      ok: true,
      drinks,
      stats: {
        byUser: [...stats, ...guestStats.map(g => ({ userId: g.guestId, _count: g._count }))],
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
  const clientId = getClientIdentifier(req);
  const rateLimitResult = await rateLimit(`drinks:add:${clientId}`, RATE_LIMIT_CONFIGS.standard);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

  try {
    const auth = await getCurrentUser(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const { userId, guestId } = getUserIds(auth.user);
    const { id: routeId } = await params;
    const body = await req.json();
    const { stopId, type = "beer", paidById } = body;

    if (!stopId) {
      return NextResponse.json({ ok: false, error: "stopId requerido" }, { status: 400 });
    }

    // Validar que el stop pertenece a la ruta
    const stop = await prisma.routeStop.findFirst({
      where: { id: stopId, routeId },
    });
    if (!stop) {
      return NextResponse.json({ ok: false, error: "Stop no pertenece a esta ruta" }, { status: 400 });
    }

    const drink = await prisma.drink.create({
      data: {
        routeId,
        stopId,
        userId,
        guestId,
        type,
        paidById: paidById || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        paidBy: { select: { id: true, name: true, image: true } },
        stop: { select: { id: true, name: true } },
      },
    });

    // Gamification Trigger
    // Gamification Trigger
    if (userId) {
      console.log(`[API-DRINKS] Triggering gamification for user ${userId} on route ${routeId}`);
      const { checkAndAwardBadges } = await import('@/lib/gamification');
      checkAndAwardBadges(userId, "ROUND_ADDED", routeId)
        .then(badges => console.log(`[API-DRINKS] Gamification result: ${JSON.stringify(badges)}`))
        .catch(e => console.error("Gamification error:", e));
    }

    return NextResponse.json({ ok: true, drink }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/routes/[id]/drinks:", error);
    return NextResponse.json({ ok: false, error: "Error al registrar bebida" }, { status: 500 });
  }
}
