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

    let user = await prisma.user.findUnique({
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
        // @ts-ignore
        onboardingCompleted: user.onboardingCompleted,
      },
      settings: {
        autoCheckinEnabled: user.autoCheckinEnabled,
        notificationsEnabled: user.notificationsEnabled,
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

// PATCH - Actualizar configuracion del usuario
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { autoCheckinEnabled, notificationsEnabled, image, name, onboardingCompleted } = body;

    const updateData: { autoCheckinEnabled?: boolean; notificationsEnabled?: boolean; image?: string, name?: string, onboardingCompleted?: boolean } = {};

    if (typeof autoCheckinEnabled === "boolean") {
      updateData.autoCheckinEnabled = autoCheckinEnabled;
    }
    if (typeof notificationsEnabled === "boolean") {
      updateData.notificationsEnabled = notificationsEnabled;
    }
    if (typeof image === "string") {
      updateData.image = image;
    }
    if (typeof name === "string") {
      // @ts-ignore
      updateData.name = name;
    }
    // @ts-ignore
    if (body.onboardingCompleted === true) {
      // @ts-ignore
      updateData.onboardingCompleted = true;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        autoCheckinEnabled: true,
        notificationsEnabled: true,
      },
    });

    // Si se actualizó la imagen, forzar actualización en la tabla Participant
    // para que el mapa lo refleje sin esperar al siguiente check-in/sync
    if (updateData.image) {
      // No necesitamos hacer nada explícito si el endpoint GET /participants hace join con User.
      // Verificamos GET /api/routes/[id]/participants/route.ts:
      //   include: { user: { select: { image: true ... } } }
      // ¡Correcto! El front ya lee del usuario.
      // PERO: si el marker usa participant.image y este venía de user.image...
      // Espera, el endpoint GET devuelve `image: p.user.image`.
      // Entonces, con actualizar el User basta.
      // EL PROBLEMA ERA QUE EL POST SOBREESCRIBÍA LA IMAGEN DEL USER CON LA DE LA SESIÓN.
      // Ese fix ya está hecho en el otro archivo.

      // Confirmación: Si la app usa 'session' para mostrar el avatar en el header, 
      // necesitará refrescar la sesión o el cliente leer del perfil.
    }

    return NextResponse.json({
      ok: true,
      settings: {
        autoCheckinEnabled: user.autoCheckinEnabled,
        notificationsEnabled: user.notificationsEnabled,
      },
    });
  } catch (error) {
    console.error("Error en PATCH /api/user/profile:", error);
    return NextResponse.json({ ok: false, error: "Error al actualizar configuracion" }, { status: 500 });
  }
}
