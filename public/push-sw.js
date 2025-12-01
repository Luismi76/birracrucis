// Service Worker para Push Notifications y Offline Support

const CACHE_NAME = "birracrucis-v1";
const OFFLINE_URL = "/offline.html";

// Recursos a cachear para modo offline
const STATIC_CACHE = [
  "/",
  "/routes",
  "/profile",
  "/auth/signin",
  "/offline.html",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/favicon.ico",
];

// Cachear recursos estáticos al instalar
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE).catch((err) => {
        console.warn("Error caching static resources:", err);
      });
    })
  );
  self.skipWaiting();
});

// Limpiar caches antiguos al activar
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  clients.claim();
});

// Estrategia de fetch: Network First con fallback a cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests del mismo origen
  if (url.origin !== self.location.origin) return;

  // No cachear API requests excepto algunas específicas
  if (url.pathname.startsWith("/api/")) {
    // Cachear solo GETs de rutas para modo offline
    if (request.method === "GET" && url.pathname.match(/\/api\/routes\/[^\/]+$/)) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Clonar y cachear la respuesta
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
            return response;
          })
          .catch(() => {
            // Si falla, intentar desde cache
            return caches.match(request);
          })
      );
      return;
    }
    // Resto de APIs - solo network
    return;
  }

  // Para páginas y assets - Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cachear respuestas exitosas
        if (response.status === 200) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      })
      .catch(async () => {
        // Intentar desde cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si es navegación, mostrar página offline
        if (request.mode === "navigate") {
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) {
            return offlinePage;
          }
        }

        // Fallback genérico
        return new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
        });
      })
  );
});

// Push Notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, icon, badge, tag, data: notifData } = data;

    const options = {
      body: body || "",
      icon: icon || "/android-chrome-192x192.png",
      badge: badge || "/favicon-32x32.png",
      tag: tag || "birracrucis-notification",
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: notifData || {},
      actions: notifData?.type === "invitation"
        ? [
            { action: "accept", title: "Aceptar" },
            { action: "reject", title: "Rechazar" },
          ]
        : notifData?.type === "nudge"
        ? [{ action: "open", title: "Abrir ruta" }]
        : [],
    };

    event.waitUntil(
      self.registration.showNotification(title || "Birracrucis", options)
    );
  } catch (error) {
    console.error("Error processing push event:", error);
  }
});

// Manejar click en notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { data, action } = event.notification;
  let url = "/routes";

  if (data?.url) {
    url = data.url;
  } else if (data?.routeId) {
    url = `/routes/${data.routeId}`;
  }

  // Manejar acciones específicas
  if (action === "accept" && data?.invitationId) {
    // Aceptar invitación - redirigir a la página de rutas
    url = "/routes";
  } else if (action === "reject") {
    // Rechazar - solo cerrar
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Si no, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Manejar cierre de notificación
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);
});

