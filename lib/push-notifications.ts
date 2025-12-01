import webpush from "web-push";

// Configurar VAPID keys (se generan una vez y se guardan en env)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:noreply@birracrucis.app",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    routeId?: string;
    type?: "nudge" | "invitation" | "chat" | "checkin" | "vote";
  };
};

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        ...payload,
        icon: payload.icon || "/android-chrome-192x192.png",
        badge: payload.badge || "/favicon-32x32.png",
      })
    );
    return true;
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    console.error("Error sending push notification:", error);
    // Si el error es 410 (Gone), la suscripción ya no es válida
    if (err.statusCode === 410) {
      return false; // Indica que debe eliminarse
    }
    return false;
  }
}

// Generar VAPID keys (ejecutar una vez)
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}
