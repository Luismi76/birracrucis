"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type DrinkType = "beer" | "wine" | "cocktail" | "soft" | "tapa" | "other";

export type Drink = {
    id: string;
    type: DrinkType;
    stopId: string;
    userId: string;
    createdAt: string;
};

type DrinkStats = {
    drinks: Drink[];
    stats: {
        total: number;
        byType: Record<DrinkType, number>;
        byUser: Record<string, number>;
    };
};

type AddDrinkParams = {
    routeId: string;
    stopId: string;
    type: DrinkType;
};

const emptyStats: DrinkStats = {
    drinks: [],
    stats: {
        total: 0,
        byType: { beer: 0, wine: 0, cocktail: 0, soft: 0, tapa: 0, other: 0 },
        byUser: {},
    },
};

async function fetchDrinks(routeId: string): Promise<DrinkStats> {
    const res = await fetch(`/api/routes/${routeId}/drinks`);
    if (!res.ok) throw new Error("Error al obtener bebidas");
    const data = await res.json();
    return data.ok ? data : emptyStats;
}

async function addDrink({ routeId, stopId, type }: AddDrinkParams): Promise<void> {
    const res = await fetch(`/api/routes/${routeId}/drinks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopId, type }),
    });
    if (!res.ok) throw new Error("Error al registrar bebida");
}

export function useDrinks(routeId: string) {
    return useQuery({
        queryKey: ["drinks", routeId],
        queryFn: () => fetchDrinks(routeId),
        staleTime: 10000, // 10 segundos
        enabled: !!routeId,
    });
}

export function useAddDrink(routeId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { stopId: string; type: DrinkType }) =>
            addDrink({ routeId, ...params }),
        // Optimistic update
        onMutate: async ({ stopId, type }) => {
            await queryClient.cancelQueries({ queryKey: ["drinks", routeId] });
            const previousData = queryClient.getQueryData<DrinkStats>(["drinks", routeId]);

            if (previousData) {
                queryClient.setQueryData<DrinkStats>(["drinks", routeId], {
                    ...previousData,
                    stats: {
                        ...previousData.stats,
                        total: previousData.stats.total + 1,
                        byType: {
                            ...previousData.stats.byType,
                            [type]: (previousData.stats.byType[type] || 0) + 1,
                        },
                    },
                });
            }

            return { previousData };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["drinks", routeId], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["drinks", routeId] });
        },
    });
}
