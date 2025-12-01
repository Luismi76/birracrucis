// app/api/routes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type StopInput = {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  plannedRounds?: number;
  maxRounds?: number | null;
  googlePlaceId?: string | null;
};

type CreateRouteBody = {
  name: string;
  date: string;
  stops: StopInput[];
};

// Genera un código de invitación único (8 caracteres, alfanumérico)
function generateInviteCode(): string {
  return nanoid(8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    // Obtener sesión del usuario (opcional por ahora para no romper funcionalidad existente)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const body = (await req.json()) as CreateRouteBody;
    const { name, date, stops } = body;

    if (!name || !date || !Array.isArray(stops) || stops.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos: name, date y stops son obligatorios." },
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
        date: new Date(date),
        inviteCode,
        creatorId: userId || null,
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
