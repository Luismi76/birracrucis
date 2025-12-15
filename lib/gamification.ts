import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export type GamificationTrigger =
    | "ROUND_ADDED"
    | "ROUTE_COMPLETED"
    | "PHOTO_UPLOADED"
    | "ROUTE_CREATED";

interface BadgeDefinition {
    code: string;
    check: (userId: string, context?: any) => Promise<boolean>;
}

export async function checkAndAwardBadges(userId: string, trigger: GamificationTrigger, routeId?: string) {
    console.log(`[Gamification] Checking badges for user ${userId} on trigger ${trigger}`);

    const newBadges: string[] = [];

    // Definición de reglas para cada medalla
    const BadgeRules: Record<string, BadgeDefinition> = {
        "first_route": {
            code: "first_route",
            check: async (uid) => {
                const count = await prisma.participant.count({
                    where: { userId: uid, route: { status: 'completed' } } // O lógica similar
                });
                // Ojo: count includes participation. Simplifiquemos:
                // Si el trigger es finish route, asumimos que se ha completado.
                // Pero check() es asíncrono para verificar globalmente.
                // Mejor: contar rutas participadas con estado completed?
                // La lógica previa contaba Drinks para first_round.
                // Para first_route:
                const completed = await prisma.route.count({
                    where: {
                        participants: { some: { userId: uid } },
                        status: 'completed'
                    }
                });
                return completed >= 1;
            }
        },
        "route_creator": {
            code: "route_creator",
            check: async (uid) => {
                const count = await prisma.route.count({ where: { creatorId: uid } });
                return count >= 1;
            }
        },
        "beer_lover": {
            code: "beer_lover",
            check: async (uid) => {
                const count = await prisma.drink.count({ where: { userId: uid } });
                return count >= 50;
            }
        },
        // Añadir más reglas según necesidad
    };

    const TriggerMap: Record<GamificationTrigger, string[]> = {
        "ROUND_ADDED": ["beer_lover"], // Intenta dar 'Amante de la Cerveza'
        "ROUTE_COMPLETED": ["first_route"],
        "PHOTO_UPLOADED": [], // 'photographer' necesita lógica de conteo
        "ROUTE_CREATED": ["route_creator"]
    };

    const candidates = TriggerMap[trigger] || [];

    for (const badgeCode of candidates) {
        // 1. Verificar si el badge existe en BD
        const badgeId = await getBadgeId(badgeCode);
        if (!badgeId) {
            console.warn(`[Gamification] Badge code '${badgeCode}' not found in DB. Skipping.`);
            continue;
        }

        // 2. Verificar si ya la tiene
        const existing = await prisma.userBadge.findUnique({
            where: {
                userId_badgeId: {
                    userId,
                    badgeId
                }
            }
        });

        if (existing) continue;

        // 3. Verificar condición
        const rule = BadgeRules[badgeCode];
        if (!rule) continue;

        const shouldAward = await rule.check(userId);

        if (shouldAward) {
            // 4. Otorgar medalla
            const earned = await prisma.userBadge.create({
                data: {
                    userId,
                    badgeId,
                    routeId
                },
                include: { badge: true }
            });

            newBadges.push(earned.badge.name);

            // 4. Notificar (Pusher o devolver resultado)
            // Notificamos al propio usuario vía canal privado o global user channel si existiera.
            // Por simplicidad, si estamos en una ruta, enviamos evento a la ruta
            if (routeId) {
                // TODO: Notificar al frontend para mostrar confetti
                try {
                    await pusherServer.trigger(`route-${routeId}`, "badge-earned", {
                        userId,
                        badge: earned.badge,
                        userName: "Usuario" // Idealmente obtener nombre
                    });
                } catch (e) {
                    console.error("Pusher error (badge):", e);
                }
            }
        }
    }

    return newBadges;
}

// Cache simple para IDs de medallas para no hacer query siempre
let badgeCache: Record<string, string> = {};

async function getBadgeId(code: string): Promise<string | null> {
    if (badgeCache[code]) return badgeCache[code];

    const badge = await prisma.badge.findUnique({ where: { code } });
    if (badge) {
        badgeCache[code] = badge.id;
        return badge.id;
    }
    return null;
}
