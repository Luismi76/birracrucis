import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - Obtener resumen completo de la ruta
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

    // Get route with all data
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        stops: {
          orderBy: { order: "asc" },
          include: {
            ratings: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
        participants: {
          where: { isActive: true },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    if (!route) {
      return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
    }

    // Get drinks stats
    const drinks = await prisma.drink.findMany({
      where: { routeId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        paidBy: { select: { id: true, name: true } },
        stop: { select: { id: true, name: true } },
      },
    });

    // Drinks by user
    // Drinks by user
    const drinksByUser = drinks.reduce((acc, drink) => {
      const userId = drink.user?.id || drink.guestId;

      if (!userId) return acc;

      if (!acc[userId]) {
        // Si es guest, creamos un objeto de usuario simulado
        const userObj = drink.user || { id: userId, name: "Invitado", image: null };

        acc[userId] = {
          user: userObj,
          count: 0,
          types: {} as Record<string, number>,
        };
      }

      acc[userId].count++;
      acc[userId].types[drink.type] = (acc[userId].types[drink.type] || 0) + 1;
      return acc;
    }, {} as Record<string, { user: { id: string; name: string | null; image: string | null }; count: number; types: Record<string, number> }>);

    // Drinks paid by user
    const drinksPaidByUser = drinks.reduce((acc, drink) => {
      if (drink.paidBy) {
        const userId = drink.paidBy.id;
        if (!acc[userId]) {
          acc[userId] = { user: drink.paidBy, count: 0 };
        }
        acc[userId].count++;
      }
      return acc;
    }, {} as Record<string, { user: NonNullable<typeof drinks[0]["paidBy"]>; count: number }>);

    // Get photos
    const photos = await prisma.photo.findMany({
      where: { routeId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        stop: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Bar ratings summary
    const barRatings = route.stops.map((stop) => {
      const ratings = stop.ratings;
      const avg =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : null;
      return {
        stop: { id: stop.id, name: stop.name },
        avgRating: avg,
        totalRatings: ratings.length,
        ratings: ratings.map((r) => ({
          rating: r.rating,
          comment: r.comment,
          user: r.user,
        })),
      };
    });

    // Best and worst bar
    const ratedBars = barRatings.filter((b) => b.avgRating !== null);
    const bestBar = ratedBars.length > 0
      ? ratedBars.reduce((best, bar) =>
        (bar.avgRating || 0) > (best.avgRating || 0) ? bar : best
      )
      : null;
    const worstBar = ratedBars.length > 0
      ? ratedBars.reduce((worst, bar) =>
        (bar.avgRating || 0) < (worst.avgRating || 0) ? bar : worst
      )
      : null;

    // Chat messages count
    const messagesCount = await prisma.message.count({
      where: { routeId },
    });

    // Awards
    const awards = [];

    // Most drinks
    const drinkRanking = Object.values(drinksByUser).sort((a, b) => b.count - a.count);
    if (drinkRanking.length > 0 && drinkRanking[0].count > 0) {
      awards.push({
        title: "Mas sediento",
        emoji: "🍺",
        winner: drinkRanking[0].user,
        value: `${drinkRanking[0].count} bebidas`,
      });
    }

    // Most generous (paid most)
    const paidRanking = Object.values(drinksPaidByUser).sort((a, b) => b.count - a.count);
    if (paidRanking.length > 0 && paidRanking[0].count > 0) {
      awards.push({
        title: "Mas generoso",
        emoji: "💰",
        winner: paidRanking[0].user,
        value: `${paidRanking[0].count} rondas pagadas`,
      });
    }

    // Most photos
    const photosByUser = photos.reduce((acc, photo) => {
      const userId = photo.user.id;
      if (!acc[userId]) {
        acc[userId] = { user: photo.user, count: 0 };
      }
      acc[userId].count++;
      return acc;
    }, {} as Record<string, { user: typeof photos[0]["user"]; count: number }>);
    const photoRanking = Object.values(photosByUser).sort((a, b) => b.count - a.count);
    if (photoRanking.length > 0 && photoRanking[0].count > 0) {
      awards.push({
        title: "Mejor fotografo",
        emoji: "📸",
        winner: photoRanking[0].user,
        value: `${photoRanking[0].count} fotos`,
      });
    }

    return NextResponse.json({
      ok: true,
      summary: {
        route: {
          id: route.id,
          name: route.name,
          date: route.date,
          status: route.status,
          creator: route.creator,
        },
        stats: {
          totalStops: route.stops.length,
          totalParticipants: route.participants.length,
          totalDrinks: drinks.length,
          totalPhotos: photos.length,
          totalMessages: messagesCount,
        },
        participants: route.participants.map((p) => p.user),
        drinksByUser: Object.values(drinksByUser).sort((a, b) => b.count - a.count),
        drinksPaidByUser: Object.values(drinksPaidByUser).sort((a, b) => b.count - a.count),
        barRatings,
        bestBar,
        worstBar,
        awards,
        photos: photos.slice(0, 20), // Limit photos
      },
    });
  } catch (error) {
    console.error("Error en GET /api/routes/[id]/summary:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener resumen" }, { status: 500 });
  }
}
