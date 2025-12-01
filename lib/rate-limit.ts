/**
 * Simple in-memory rate limiter
 * Para producción, considera usar @upstash/ratelimit con Redis
 */

type RateLimitConfig = {
    interval: number; // ventana en ms
    maxRequests: number; // máximo de requests en la ventana
};

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

// Store en memoria (se reinicia con el servidor)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpiar entradas expiradas cada minuto
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (entry.resetAt < now) {
                rateLimitStore.delete(key);
            }
        }
    }, 60000);
}

/**
 * Verifica si una IP/usuario ha excedido el rate limit
 * @returns { success: boolean, remaining: number, reset: number }
 */
export function rateLimit(
    identifier: string,
    config: RateLimitConfig = { interval: 60000, maxRequests: 60 }
): { success: boolean; remaining: number; reset: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // Si no hay entrada o ya expiró, crear nueva
    if (!entry || entry.resetAt < now) {
        const newEntry: RateLimitEntry = {
            count: 1,
            resetAt: now + config.interval,
        };
        rateLimitStore.set(identifier, newEntry);
        return {
            success: true,
            remaining: config.maxRequests - 1,
            reset: newEntry.resetAt,
        };
    }

    // Si excedió el límite
    if (entry.count >= config.maxRequests) {
        return {
            success: false,
            remaining: 0,
            reset: entry.resetAt,
        };
    }

    // Incrementar contador
    entry.count++;
    return {
        success: true,
        remaining: config.maxRequests - entry.count,
        reset: entry.resetAt,
    };
}

/**
 * Obtiene el identificador del cliente desde el request
 */
export function getClientIdentifier(request: Request): string {
    // Intentar obtener IP real (Vercel, Cloudflare, etc.)
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    return cfConnectingIp || realIp || forwarded?.split(",")[0] || "unknown";
}

/**
 * Configuraciones predefinidas para diferentes endpoints
 */
export const RATE_LIMIT_CONFIGS = {
    // Endpoints de lectura frecuente (participantes, mensajes)
    frequent: { interval: 10000, maxRequests: 30 }, // 30 req/10s

    // Endpoints normales
    standard: { interval: 60000, maxRequests: 60 }, // 60 req/min

    // Endpoints de escritura (crear rutas, subir fotos)
    write: { interval: 60000, maxRequests: 20 }, // 20 req/min

    // Endpoints sensibles (auth, etc.)
    strict: { interval: 60000, maxRequests: 10 }, // 10 req/min
} as const;

/**
 * Helper para crear respuesta de rate limit exceeded
 */
export function rateLimitExceededResponse(reset: number) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return new Response(
        JSON.stringify({
            ok: false,
            error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos.",
            retryAfter,
        }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": retryAfter.toString(),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": reset.toString(),
            },
        }
    );
}
