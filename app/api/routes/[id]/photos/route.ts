import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST - Subir una foto
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const { id: routeId } = await params;

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario es participante de la ruta
    const participant = await prisma.participant.findUnique({
      where: { routeId_userId: { routeId, userId: user.id } },
    });

    if (!participant) {
      return NextResponse.json({ ok: false, error: "No eres participante de esta ruta" }, { status: 403 });
    }

    const body = await req.json();
    const { url, caption, stopId } = body;

    if (!url) {
      return NextResponse.json({ ok: false, error: "URL de imagen requerida" }, { status: 400 });
    }

    // Si se proporciona stopId, verificar que pertenece a la ruta
    if (stopId) {
      const stop = await prisma.routeStop.findFirst({
        where: { id: stopId, routeId },
      });
      if (!stop) {
        return NextResponse.json({ ok: false, error: "Parada no encontrada" }, { status: 404 });
      }
    }

    // Crear la foto
    const photo = await prisma.photo.create({
      data: {
        routeId,
        userId: user.id,
        url,
        caption: caption || null,
        stopId: stopId || null,
      },
      include: {
        user: { select: { name: true, image: true } },
        stop: { select: { name: true } },
      },
    });

    return NextResponse.json({ ok: true, photo }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/routes/[id]/photos:", error);
    return NextResponse.json({ ok: false, error: "Error al subir foto" }, { status: 500 });
  }
}

// GET - Obtener todas las fotos de la ruta
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

    // Obtener la ruta con su nombre para el hashtag
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      select: { name: true },
    });

    if (!route) {
      return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
    }

    // Obtener todas las fotos de la ruta
    const photos = await prisma.photo.findMany({
      where: { routeId },
      include: {
        user: { select: { name: true, image: true } },
        stop: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generar hashtag
    const hashtag = `#${route.name.replace(/\s+/g, "")}Birracrucis`;

    return NextResponse.json({ ok: true, photos, hashtag, routeName: route.name });
  } catch (error) {
    console.error("Error en GET /api/routes/[id]/photos:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener fotos" }, { status: 500 });
  }
}
