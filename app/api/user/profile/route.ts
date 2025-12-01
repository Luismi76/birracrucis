import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - Obtener perfil del usuario con estadísticas
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        badges: {
          include: {
            badge: true,
          },
          orderBy: { earnedAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Estadísticas
    const [
      routesCreated,
      routesParticipated,
      totalDrinks,
      totalPhotos,
      totalRatings,
      barsVisited,
    ] = await Promise.all([
      prisma.route.count({ where: { creatorId: user.id } }),
      prisma.participant.count({ where: { userId: user.id } }),
      prisma.drink.count({ where: { userId: user.id } }),
      prisma.photo.count({ where: { userId: user.id } }),
      prisma.barRating.count({ where: { userId: user.id } }),
      prisma.round.groupBy({
        by: ["stopId"],
        where: { userId: user.id },
      }).then(r => r.length),
    ]);

    // Rutas completadas (donde el usuario participó y la ruta está completada)
    const completedRoutes = await prisma.participant.count({
      where: {
        userId: user.id,
        route: { status: "completed" },
      },
    });

    // Bebidas pagadas por el usuario
    const drinksPaid = await prisma.drink.count({
      where: { paidById: user.id },
    });

    return NextResponse.json({
      ok: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        badges: user.badges.map(ub => ({
          ...ub.badge,
          earnedAt: ub.earnedAt,
        })),
      },
      stats: {
        routesCreated,
        routesParticipated,
        completedRoutes,
        barsVisited,
        totalDrinks,
        drinksPaid,
        totalPhotos,
        totalRatings,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/user/profile:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener perfil" }, { status: 500 });
  }
}
