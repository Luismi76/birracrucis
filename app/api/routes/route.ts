// app/api/routes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS, rateLimitExceededResponse } from "@/lib/rate-limit";

type StopInput = {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  plannedRounds?: number;
  maxRounds?: number | null;
  googlePlaceId?: string | null;
  stayDuration?: number; // minutos de estancia en el bar
};

type CreateRouteBody = {
  name: string;
  date?: string | null;
  stops: StopInput[];
  // Campos de configuración de tiempo
  startMode?: "manual" | "scheduled" | "all_present";
  startTime?: string | null; // ISO string
  hasEndTime?: boolean;
  endTime?: string | null; // ISO string
  isPublic?: boolean;
  isDiscovery?: boolean;
};

// Genera un código de invitación único (8 caracteres, alfanumérico)
function generateInviteCode(): string {
  return nanoid(8).toUpperCase();
}

export async function POST(req: NextRequest) {
  // Rate limiting - endpoint de escritura (crear rutas)
  const clientId = getClientIdentifier(req);
  const rateLimitResult = rateLimit(`routes:create:${clientId}`, RATE_LIMIT_CONFIGS.write);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

  try {
    // Obtener sesión del usuario (opcional por ahora para no romper funcionalidad existente)
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id || null;

    // Si hay sesión pero el usuario no existe en DB, crearlo (JWT mode sin adapter)
    if (session?.user?.email) {
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
      userId = user.id;
    }

    const body = (await req.json()) as CreateRouteBody;
    const { name, date, stops, startMode, startTime, hasEndTime, endTime, isDiscovery } = body;

    // Validation: Name is required. Stops are required unless it's a discovery route.
    if (!name || !Array.isArray(stops) || (stops.length === 0 && !isDiscovery)) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos: name y stops (mínimo 1 para rutas no-discovery) son obligatorios." },
        { status: 400 }
      );
    }

    // Validar coordenadas de cada stop
    const invalidStops: string[] = [];
    stops.forEach((stop, index) => {
      const { lat, lng, name: stopName } = stop;

      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        invalidStops.push(`Stop #${index + 1} "${stopName}": coordenadas inválidas`);
      } else if (lat === 0 && lng === 0) {
        invalidStops.push(`Stop #${index + 1} "${stopName}": coordenadas no pueden ser 0,0`);
      } else if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        invalidStops.push(`Stop #${index + 1} "${stopName}": coordenadas fuera de rango`);
      }
    });

    if (invalidStops.length > 0) {
      return NextResponse.json(
        { ok: false, error: `Coordenadas inválidas:\n${invalidStops.join('\n')}` },
        { status: 400 }
      );
    }

    // Generar código de invitación único
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.route.findUnique({ where: { inviteCode } });
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    const route = await prisma.route.create({
      data: {
        name,
        date: (date && !isNaN(Date.parse(date))) ? new Date(date) : null,
        inviteCode,
        creatorId: userId || null,
        // Public visibility
        isPublic: body.isPublic ?? false,
        isDiscovery: body.isDiscovery ?? false,
        // Template system - new routes are templates by default
        isTemplate: true,
        // Campos de tiempo
        startMode: startMode ?? "manual",
        startTime: startTime ? new Date(startTime) : null,
        hasEndTime: hasEndTime ?? false,
        endTime: endTime ? new Date(endTime) : null,
        stops: {
          create: stops.map((s, index) => ({
            name: s.name,
            address: s.address ?? "",
            lat: s.lat,
            lng: s.lng,
            order: index,
            plannedRounds: s.plannedRounds ?? 1,
            maxRounds: s.maxRounds ?? null,
            googlePlaceId: s.googlePlaceId ?? null,
            stayDuration: s.stayDuration ?? 30,
          })),
        },
        // Si hay usuario, agregarlo como participante automáticamente
        ...(userId && {
          participants: {
            create: {
              userId,
            },
          },
        }),
      },
      include: { stops: true },
    });

    // Si es modo descubrimiento, crear automáticamente una EDICIÓN ACTIVA
    if (body.isDiscovery && userId) {
      // Crear código de invitación para la edición
      let editionInviteCode = generateInviteCode();
      let attCheck = 0;
      while (attCheck < 5) {
        const temp = await prisma.route.findUnique({ where: { inviteCode: editionInviteCode } });
        if (!temp) break;
        editionInviteCode = generateInviteCode();
        attCheck++;
      }

      const activeEdition = await prisma.route.create({
        data: {
          name: route.name, // Mismo nombre que la plantilla
          date: new Date(), // Fecha actual
          creatorId: userId,
          startMode: "manual",
          isTemplate: false,
          templateId: route.id,
          inviteCode: editionInviteCode,
          status: "active", // Ya está activa o lista para empezar? "pending" es mejor si startMode=manual, pero el usuario quiere empezar ya. Pongamos "pending" para que le de a "Empezar" en la UI.
          // Copiar paradas (en discovery suele ser solo 1 inicial)
          stops: {
            create: route.stops.map(s => ({
              name: s.name,
              address: s.address,
              lat: s.lat,
              lng: s.lng,
              order: s.order,
              plannedRounds: s.plannedRounds,
              maxRounds: s.maxRounds,
              googlePlaceId: s.googlePlaceId,
              stayDuration: s.stayDuration
            }))
          },
          participants: {
            create: { userId }
          }
        }
      });

      // Devolver la edición ACTIVA en lugar de la plantilla
      return NextResponse.json({ ok: true, route: activeEdition, isDiscoveryRedirect: true }, { status: 201 });
    }

    return NextResponse.json({ ok: true, route }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/routes:", error);
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
