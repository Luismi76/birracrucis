/**
 * Rate limiter con PostgreSQL
 * Funciona en serverless (Vercel) porque persiste en base de datos
 */

import { prisma } from "@/lib/prisma";

type RateLimitConfig = {
    interval: number; // ventana en ms
    maxRequests: number; // máximo de requests en la ventana
};

/**
 * Verifica si una IP/usuario ha excedido el rate limit
 * Usa PostgreSQL para persistir entre instancias serverless
 */
export async function rateLimit(
    identifier: string,
    config: RateLimitConfig = { interval: 60000, maxRequests: 60 }
): Promise<{ success: boolean; remaining: number; reset: number }> {
    const now = new Date();
    const resetAt = new Date(now.getTime() + config.interval);

    try {
        // Usar upsert atómico para evitar race conditions
        const result = await prisma.$queryRaw<{ count: number; reset_at: Date }[]>`
            INSERT INTO "RateLimit" (id, count, "resetAt")
            VALUES (${identifier}, 1, ${resetAt})
            ON CONFLICT (id) DO UPDATE SET
                count = CASE
                    WHEN "RateLimit"."resetAt" < ${now} THEN 1
                    ELSE "RateLimit".count + 1
                END,
                "resetAt" = CASE
                    WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt}
                    ELSE "RateLimit"."resetAt"
                END
            RETURNING count, "resetAt" as reset_at
        `;

        const { count, reset_at } = result[0];
        const resetTime = reset_at.getTime();

        if (count > config.maxRequests) {
            return {
                success: false,
                remaining: 0,
                reset: resetTime,
            };
        }

        return {
            success: true,
            remaining: config.maxRequests - count,
            reset: resetTime,
        };
    } catch (error) {
        // Si falla la DB, permitir la request (fail open)
        console.error("Rate limit check failed:", error);
        return {
            success: true,
            remaining: config.maxRequests,
            reset: resetAt.getTime(),
        };
    }
}

/**
 * Limpia entradas de rate limit expiradas
 * Llamar periódicamente (ej: cron job o al inicio de la app)
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
    try {
        const result = await prisma.rateLimit.deleteMany({
            where: {
                resetAt: { lt: new Date() },
            },
        });
        return result.count;
    } catch (error) {
        console.error("Rate limit cleanup failed:", error);
        return 0;
    }
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
