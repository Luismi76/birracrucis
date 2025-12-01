import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS, rateLimitExceededResponse } from "@/lib/rate-limit";
import { uploadImage, ensureBucket } from "@/lib/minio";

// POST - Subir una foto
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting - endpoint de escritura (subir fotos)
  const clientId = getClientIdentifier(req);
  const rateLimitResult = rateLimit(`photos:upload:${clientId}`, RATE_LIMIT_CONFIGS.write);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

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

    // Determinar la URL final de la imagen
    let finalUrl = url;

    // Si es base64 y MinIO está configurado, subir a MinIO
    const isBase64 = url.startsWith("data:image/");
    const minioConfigured = !!process.env.MINIO_ENDPOINT;

    console.log(`[Photos] Base64: ${isBase64}, MinIO configured: ${minioConfigured}, Endpoint: ${process.env.MINIO_ENDPOINT || 'not set'}`);

    if (isBase64 && minioConfigured) {
      try {
        console.log("[Photos] Intentando subir a MinIO...");
        await ensureBucket();
        const fileName = `${routeId}/${nanoid(12)}`;
        finalUrl = await uploadImage(url, fileName);
        console.log(`[Photos] Subido exitosamente a MinIO: ${finalUrl}`);
      } catch (minioError) {
        console.error("[Photos] Error subiendo a MinIO, guardando base64:", minioError);
        // Si falla MinIO, guardamos base64 como fallback
      }
    } else {
      console.log("[Photos] Guardando como base64 (MinIO no configurado o URL externa)");
    }

    // Crear la foto
    const photo = await prisma.photo.create({
      data: {
        routeId,
        userId: user.id,
        url: finalUrl,
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
  // Rate limiting - endpoint estándar
  const clientId = getClientIdentifier(req);
  const rateLimitResult = rateLimit(`photos:get:${clientId}`, RATE_LIMIT_CONFIGS.standard);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult.reset);
  }

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
