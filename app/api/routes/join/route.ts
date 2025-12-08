// app/api/routes/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS, rateLimitExceededResponse } from "@/lib/rate-limit";

type JoinRouteBody = {
  inviteCode: string;
  guestName?: string;
  guestId?: string;
};

// POST /api/routes/join - Unirse a una ruta con código de invitación
export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const rateLimitResult = rateLimit(`routes:join:${clientId}`, RATE_LIMIT_CONFIGS.standard);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json());
    const { inviteCode, guestName, guestId: existingGuestId } = body;

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json({ ok: false, error: "Código de invitación requerido" }, { status: 400 });
    }

    let userId: string | null = null;
    let guestId: string | null = null;
    let name: string | null = null;
    let avatar: string | null = null;

    // 1. Caso Usuario Autenticado
    if (session?.user?.email) {
      const user = await prisma.user.upsert({
        where: { email: session.user.email },
        update: { name: session.user.name, image: session.user.image },
        create: { email: session.user.email, name: session.user.name, image: session.user.image },
      });
      userId = user.id;
      name = user.name;
      avatar = user.image;
    }
    // 2. Caso Invitado
    else {
      if (!guestName || typeof guestName !== "string") {
        return NextResponse.json({ ok: false, error: "Debes iniciar sesión o elegir un nombre de invitado" }, { status: 401 });
      }
      name = guestName;
      guestId = existingGuestId || crypto.randomUUID();
      avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}`;
    }

    // Buscar ruta
    const route = await prisma.route.findFirst({
      where: { inviteCode: { equals: inviteCode.toUpperCase(), mode: "insensitive" } },
      include: { stops: { orderBy: { order: "asc" } }, _count: { select: { participants: true } } },
    });

    if (!route) {
      return NextResponse.json({ ok: false, error: "Código no válido" }, { status: 404 });
    }

    // Verificar si ya existe
    let existingParticipant = null;

    if (userId) {
      existingParticipant = await prisma.participant.findUnique({
        where: { routeId_userId: { routeId: route.id, userId } }
      });
    } else if (guestId) {
      existingParticipant = await prisma.participant.findUnique({
        where: { routeId_guestId: { routeId: route.id, guestId } }
      });
    }

    if (existingParticipant) {
      const response = NextResponse.json({
        ok: true,
        route,
        message: "Ya eres participante",
        alreadyJoined: true,
        isGuest: !userId,
        guestId: !userId ? guestId : null
      });
      // Si es invitado y ya existía, refrescamos cookie por si acaso
      if (!userId && guestId) {
        response.cookies.set("guestId", guestId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30 // 30 días
        });
      }
      return response;
    }

    // Crear participante
    // Para invitados: guestId debe ser string, userId debe ser null
    // Para usuarios: userId debe ser string, guestId debe ser null
    await prisma.participant.create({
      data: {
        routeId: route.id,
        ...(userId ? { userId } : { guestId: guestId!, name, avatar }),
      }
    });

    const response = NextResponse.json({
      ok: true,
      route,
      message: "Te has unido correctamente",
      alreadyJoined: false,
      isGuest: !userId,
      guestId: !userId ? guestId : null
    });

    // Si es invitado, establecer cookie
    if (!userId && guestId) {
      response.cookies.set("guestId", guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30 // 30 días
      });
    }

    return response;

  } catch (error) {
    console.error("Error en POST /api/routes/join:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return NextResponse.json({
      ok: false,
      error: "Error al unirse a la ruta",
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 });
  }
}

// GET /api/routes/join?code=ABC123&guestId=XYZ
export async function GET(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const rateLimitResult = rateLimit(`routes:join-info:${clientId}`, RATE_LIMIT_CONFIGS.standard);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

  try {
    const { searchParams } = new URL(req.url);
    const inviteCode = searchParams.get("code");
    const guestId = searchParams.get("guestId");

    if (!inviteCode) {
      return NextResponse.json({ ok: false, error: "Código de invitación requerido" }, { status: 400 });
    }

    const route = await prisma.route.findFirst({
      where: { inviteCode: { equals: inviteCode.toUpperCase(), mode: "insensitive" } },
      include: {
        stops: { orderBy: { order: "asc" }, select: { id: true, name: true, address: true, order: true } },
        creator: { select: { name: true, image: true } },
        _count: { select: { participants: true } },
      },
    });

    if (!route) {
      return NextResponse.json({ ok: false, error: "Código no válido" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    let isParticipant = false;

    if (session?.user?.id) {
      const p = await prisma.participant.findUnique({
        where: { routeId_userId: { routeId: route.id, userId: session.user.id } }
      });
      isParticipant = !!p;
    } else if (guestId) {
      // @ts-ignore
      const p = await prisma.participant.findUnique({
        where: { routeId_guestId: { routeId: route.id, guestId } }
      });
      isParticipant = !!p;
    }

    const response = NextResponse.json({
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

    if (isParticipant && guestId && !session?.user) {
      response.cookies.set("guestId", guestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30 // 30 días
      });
    }

    return response;
  } catch (error) {
    console.error("Error en GET /api/routes/join:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener información" }, { status: 500 });
  }
}
