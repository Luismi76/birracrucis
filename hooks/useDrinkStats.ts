"use client";

import { useQuery } from "@tanstack/react-query";

export type DrinkStats = Record<string, number>; // userId -> count

type DrinkStatsApiResponse = {
    ok: boolean;
    stats?: {
        byUser: Array<{
            userId: string;
            _count: { id: number };
        }>;
    };
};

async function fetchDrinkStats(routeId: string): Promise<DrinkStats> {
    const res = await fetch(`/api/routes/${routeId}/drinks`);
    if (!res.ok) {
        throw new Error("Error al obtener estadísticas de bebidas");
    }

    const data: DrinkStatsApiResponse = await res.json();

    if (data.ok && data.stats?.byUser) {
        const statsMap: DrinkStats = {};
        data.stats.byUser.forEach((stat) => {
            if (stat.userId) {
                statsMap[stat.userId] = stat._count.id;
            }
        });
        return statsMap;
    }

    return {};
}

export function useDrinkStats(routeId: string) {
    return useQuery({
        queryKey: ["drinkStats", routeId],
        queryFn: () => fetchDrinkStats(routeId),
        staleTime: 30000, // 30 segundos
        refetchInterval: 30000, // Auto-refresh cada 30s
        refetchIntervalInBackground: false, // No refrescar en background
        enabled: !!routeId,
    });
}
