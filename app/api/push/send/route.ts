import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendPushNotification, PushPayload } from "@/lib/push-notifications";

// POST - Enviar notificación push a usuarios de una ruta
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { routeId, userIds, payload } = body as {
      routeId?: string;
      userIds?: string[];
      payload: PushPayload;
    };

    if (!payload?.title || !payload?.body) {
      return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
    }

    // Obtener suscripciones
    let subscriptions;
    if (userIds && userIds.length > 0) {
      // Enviar a usuarios específicos
      subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: { in: userIds } },
      });
    } else if (routeId) {
      // Enviar a todos los participantes de la ruta
      const participants = await prisma.participant.findMany({
        where: { routeId, isActive: true },
        select: { userId: true },
      });
      const participantIds = participants.map((p) => p.userId);

      subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: { in: participantIds } },
      });
    } else {
      return NextResponse.json({ ok: false, error: "routeId o userIds requerido" }, { status: 400 });
    }

    // Enviar notificaciones
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const success = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );

        // Si la suscripción ya no es válida, eliminarla
        if (!success) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          }).catch(() => {});
        }

        return success;
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;

    return NextResponse.json({ ok: true, sent, total: subscriptions.length });
  } catch (error) {
    console.error("Error en POST /api/push/send:", error);
    return NextResponse.json({ ok: false, error: "Error al enviar notificaciones" }, { status: 500 });
  }
}
