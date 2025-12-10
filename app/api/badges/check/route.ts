import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// POST - Check and award badges for current user
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: {
        badges: { include: { badge: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const routeId = body.routeId;

    // Get user's earned badge codes
    const earnedCodes = user.badges.map((ub) => ub.badge.code);

    // Get all badges
    const allBadges = await prisma.badge.findMany();
    const badgeMap = new Map(allBadges.map((b) => [b.code, b.id]));

    // Get stats
    const [
      routesCreated,
      routesParticipated,
      completedRoutes,
      barsVisited,
      totalDrinks,
      drinksPaid,
      totalPhotos,
      totalRatings,
      totalMessages,
      totalNudges,
    ] = await Promise.all([
      prisma.route.count({ where: { creatorId: user.id } }),
      prisma.participant.count({ where: { userId: user.id } }),
      prisma.participant.count({
        where: { userId: user.id, route: { status: "completed" } },
      }),
      prisma.round.groupBy({
        by: ["stopId"],
        where: { userId: user.id },
      }).then((r) => r.length),
      prisma.drink.count({ where: { userId: user.id } }),
      prisma.drink.count({ where: { paidById: user.id } }),
      prisma.photo.count({ where: { userId: user.id } }),
      prisma.barRating.count({ where: { userId: user.id } }),
      prisma.message.count({ where: { userId: user.id } }),
      prisma.nudge.count({ where: { senderId: user.id } }),
    ]);

    const newBadges: string[] = [];

    // Check each badge condition
    const checks: { code: string; condition: boolean }[] = [
      { code: "first_route", condition: completedRoutes >= 1 },
      { code: "route_creator", condition: routesCreated >= 1 },
      { code: "social_butterfly", condition: routesParticipated >= 5 },
      { code: "party_animal", condition: routesParticipated >= 10 },
      { code: "bar_hopper", condition: barsVisited >= 20 },
      { code: "beer_lover", condition: totalDrinks >= 50 },
      { code: "generous", condition: drinksPaid >= 10 },
      { code: "photographer", condition: totalPhotos >= 20 },
      { code: "critic", condition: totalRatings >= 10 },
      { code: "master_organizer", condition: routesCreated >= 10 },
      { code: "legend", condition: completedRoutes >= 25 },
      { code: "chatty", condition: totalMessages >= 100 },
      { code: "nudger", condition: totalNudges >= 10 },
    ];

    for (const check of checks) {
      if (check.condition && !earnedCodes.includes(check.code)) {
        const badgeId = badgeMap.get(check.code);
        if (badgeId) {
          await prisma.userBadge.create({
            data: {
              userId: user.id,
              badgeId,
              routeId: routeId || null,
            },
          });
          newBadges.push(check.code);
        }
      }
    }

    // Get details of new badges
    const newBadgeDetails = allBadges.filter((b) => newBadges.includes(b.code));

    return NextResponse.json({
      ok: true,
      newBadges: newBadgeDetails,
      message:
        newBadges.length > 0
          ? `Desbloqueaste ${newBadges.length} logro(s)!`
          : "No hay nuevos logros",
    });
  } catch (error) {
    console.error("Error checking badges:", error);
    return NextResponse.json({ ok: false, error: "Error checking badges" }, { status: 500 });
  }
}
