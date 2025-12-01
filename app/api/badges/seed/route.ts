import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BADGES = [
  {
    code: "first_route",
    name: "Primera Ruta",
    description: "Completaste tu primera ruta",
    icon: "🎉",
  },
  {
    code: "route_creator",
    name: "Organizador",
    description: "Creaste tu primera ruta",
    icon: "📋",
  },
  {
    code: "social_butterfly",
    name: "Mariposa Social",
    description: "Participaste en 5 rutas",
    icon: "🦋",
  },
  {
    code: "party_animal",
    name: "Animal de Fiesta",
    description: "Participaste en 10 rutas",
    icon: "🎊",
  },
  {
    code: "bar_hopper",
    name: "Saltabarras",
    description: "Visitaste 20 bares diferentes",
    icon: "🏃",
  },
  {
    code: "beer_lover",
    name: "Amante de la Cerveza",
    description: "Tomaste 50 cervezas",
    icon: "🍺",
  },
  {
    code: "generous",
    name: "Generoso",
    description: "Pagaste 10 rondas",
    icon: "💰",
  },
  {
    code: "photographer",
    name: "Fotografo",
    description: "Tomaste 20 fotos",
    icon: "📸",
  },
  {
    code: "critic",
    name: "Critico",
    description: "Valoraste 10 bares",
    icon: "⭐",
  },
  {
    code: "early_bird",
    name: "Madrugador",
    description: "Llegaste primero a 5 bares",
    icon: "🐦",
  },
  {
    code: "night_owl",
    name: "Buho Nocturno",
    description: "Completaste una ruta que termino despues de las 3am",
    icon: "🦉",
  },
  {
    code: "master_organizer",
    name: "Maestro Organizador",
    description: "Creaste 10 rutas",
    icon: "👑",
  },
  {
    code: "legend",
    name: "Leyenda",
    description: "Completaste 25 rutas",
    icon: "🏆",
  },
  {
    code: "chatty",
    name: "Charlatan",
    description: "Enviaste 100 mensajes en chats de ruta",
    icon: "💬",
  },
  {
    code: "nudger",
    name: "Impaciente",
    description: "Metiste prisa a otros 10 veces",
    icon: "⏰",
  },
];

// POST - Seed badges (run once)
export async function POST() {
  try {
    let created = 0;
    let existing = 0;

    for (const badge of BADGES) {
      const exists = await prisma.badge.findUnique({
        where: { code: badge.code },
      });

      if (!exists) {
        await prisma.badge.create({ data: badge });
        created++;
      } else {
        existing++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Badges seeded: ${created} created, ${existing} already existed`,
    });
  } catch (error) {
    console.error("Error seeding badges:", error);
    return NextResponse.json({ ok: false, error: "Error seeding badges" }, { status: 500 });
  }
}

// GET - List all badges
export async function GET() {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ ok: true, badges });
  } catch (error) {
    console.error("Error listing badges:", error);
    return NextResponse.json({ ok: false, error: "Error listing badges" }, { status: 500 });
  }
}
