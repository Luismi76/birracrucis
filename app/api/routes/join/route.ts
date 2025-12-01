// app/api/routes/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type JoinRouteBody = {
  inviteCode: string;
};

// POST /api/routes/join - Unirse a una ruta con código de invitación
export async function POST(req: NextRequest) {
  try {
    // Requiere autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Debes iniciar sesión para unirte a una ruta" },
        { status: 401 }
      );
    }

    // Crear usuario si no existe (JWT mode sin adapter)
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {
        name: session.user.name,
        image: session.user.image,
      },
      create: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
    });

    const body = (await req.json()) as JoinRouteBody;
    const { inviteCode } = body;

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json(
        { ok: false, error: "Código de invitación requerido" },
        { status: 400 }
      );
    }

    // Buscar ruta por código (case insensitive)
    const route = await prisma.route.findFirst({
      where: {
        inviteCode: {
          equals: inviteCode.toUpperCase(),
          mode: "insensitive",
        },
      },
      include: {
        stops: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!route) {
      return NextResponse.json(
        { ok: false, error: "Código de invitación no válido" },
        { status: 404 }
      );
    }

    // Verificar si ya es participante
    const existingParticipant = await prisma.participant.findUnique({
      where: {
        routeId_userId: {
          routeId: route.id,
          userId: user.id,
        },
      },
    });

    if (existingParticipant) {
      // Ya es participante, simplemente devolver la ruta
      return NextResponse.json({
        ok: true,
        route,
        message: "Ya eres participante de esta ruta",
        alreadyJoined: true,
      });
    }

    // Crear participante
    await prisma.participant.create({
      data: {
        routeId: route.id,
        userId: user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      route,
      message: "Te has unido a la ruta correctamente",
      alreadyJoined: false,
    });
  } catch (error) {
    console.error("Error en POST /api/routes/join:", error);
    return NextResponse.json(
      { ok: false, error: "Error al unirse a la ruta" },
      { status: 500 }
    );
  }
}

// GET /api/routes/join?code=ABC123 - Obtener info de ruta por código (sin unirse)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inviteCode = searchParams.get("code");

    if (!inviteCode) {
      return NextResponse.json(
        { ok: false, error: "Código de invitación requerido" },
        { status: 400 }
      );
    }

    const route = await prisma.route.findFirst({
      where: {
        inviteCode: {
          equals: inviteCode.toUpperCase(),
          mode: "insensitive",
        },
      },
      include: {
        stops: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            address: true,
            order: true,
          },
        },
        creator: {
          select: {
            name: true,
            image: true,
          },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!route) {
      return NextResponse.json(
        { ok: false, error: "Código de invitación no válido" },
        { status: 404 }
      );
    }

    // Verificar si el usuario actual ya es participante
    const session = await getServerSession(authOptions);
    let isParticipant = false;

    if (session?.user?.id) {
      const participant = await prisma.participant.findUnique({
        where: {
          routeId_userId: {
            routeId: route.id,
            userId: session.user.id,
          },
        },
      });
      isParticipant = !!participant;
    }

    return NextResponse.json({
      ok: true,
      route: {
        id: route.id,
        name: route.name,
        date: route.date,
        stopsCount: route.stops.length,
        stops: route.stops,
        participantsCount: route._count.participants,
        creator: route.creator,
      },
      isParticipant,
      isAuthenticated: !!session?.user,
    });
  } catch (error) {
    console.error("Error en GET /api/routes/join:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener información de la ruta" },
      { status: 500 }
    );
  }
}
