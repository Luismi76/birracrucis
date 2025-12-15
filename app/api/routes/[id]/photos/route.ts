import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserIds } from "@/lib/auth-helpers";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS, rateLimitExceededResponse } from "@/lib/rate-limit";
import { uploadImage, ensureBucket } from "@/lib/minio";

// POST - Subir una foto
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting - endpoint de escritura (subir fotos)
  const clientId = getClientIdentifier(req);
  const rateLimitResult = await rateLimit(`photos:upload:${clientId}`, RATE_LIMIT_CONFIGS.write);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

  try {
    const auth = await getCurrentUser(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const { userId, guestId: finalGuestId } = getUserIds(auth.user);
    const { id: routeId } = await params;

    // Verificar que es participante de la ruta
    let isParticipant = false;

    if (userId) {
      const participant = await prisma.participant.findUnique({
        where: { routeId_userId: { routeId, userId } },
      });
      isParticipant = !!participant;
    } else if (finalGuestId) {
      const participant = await prisma.participant.findUnique({
        where: { routeId_guestId: { routeId, guestId: finalGuestId } },
      });
      isParticipant = !!participant;
    }

    if (!isParticipant) {
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

    // Determinar la URL final de la imagen
    let finalUrl = url;

    // Si es base64 y MinIO está configurado, subir a MinIO
    const isBase64 = url.startsWith("data:image/");
    const minioConfigured = !!process.env.MINIO_ENDPOINT;

    if (isBase64 && minioConfigured) {
      try {
        await ensureBucket();
        const fileName = `${routeId}/${nanoid(12)}`;
        finalUrl = await uploadImage(url, fileName);
      } catch {
        // Si falla MinIO, guardamos base64 como fallback
      }
    }

    // Crear la foto
    const photo = await prisma.photo.create({
      data: {
        routeId,
        userId: userId || undefined, // undefined para que Prisma lo ignore si es null y no viole tipos si fuera required, pero ahora es optional
        guestId: finalGuestId || undefined,
        url: finalUrl,
        caption: caption || null,
        stopId: stopId || null,
      },
      include: {
        user: { select: { name: true, image: true } },
        stop: { select: { name: true } },
      },
    });

    // Gamification Trigger
    if (userId) {
      const { checkAndAwardBadges } = await import('@/lib/gamification');
      // No esperamos (fire and forget) para no bloquear respuesta
      checkAndAwardBadges(userId, "PHOTO_UPLOADED", routeId).catch(e => console.error("Gamification error:", e));
    }

    return NextResponse.json({ ok: true, photo }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/routes/[id]/photos:", error);
    return NextResponse.json({
      ok: false,
      error: `Error al subir foto: ${(error as any)?.message || "Error desconocido"}`
    }, { status: 500 });
  }
}

// GET - Obtener todas las fotos de la ruta
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting - endpoint estándar
  const clientId = getClientIdentifier(req);
  const rateLimitResult = await rateLimit(`photos:get:${clientId}`, RATE_LIMIT_CONFIGS.standard);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

  try {
    const auth = await getCurrentUser(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const { userId: currentUserId, guestId: currentGuestId } = getUserIds(auth.user);
    const { id: routeId } = await params;

    // Obtener la ruta con su nombre para el hashtag
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      select: { name: true },
    });

    if (!route) {
      return NextResponse.json({ ok: false, error: "Ruta no encontrada" }, { status: 404 });
    }

    // Obtener fotos y marcar ownership
    const photos = await prisma.photo.findMany({
      where: { routeId },
      include: {
        user: { select: { name: true, image: true } },
        stop: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const PHOTOS_WITH_OWNERSHIP = photos.map(p => ({
      ...p,
      isMine: (currentUserId && p.userId === currentUserId) || (currentGuestId && p.guestId === currentGuestId)
    }));

    // Generar hashtag
    const hashtag = `#${route.name.replace(/\s+/g, "")}Birracrucis`;

    return NextResponse.json({ ok: true, photos: PHOTOS_WITH_OWNERSHIP, hashtag, routeName: route.name });
  } catch (error) {
    console.error("Error en GET /api/routes/[id]/photos:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener fotos" }, { status: 500 });
  }
}
