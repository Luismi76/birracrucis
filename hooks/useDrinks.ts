"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Drink = {
    id: string;
    type: string;
    createdAt: string;
    user: { id: string; name: string | null; image: string | null };
    paidBy: { id: string; name: string | null; image: string | null } | null;
    stop: { id: string; name: string };
};

type DrinksResponse = {
    drinks: Drink[];
};

async function fetchDrinks(routeId: string): Promise<DrinksResponse> {
    const res = await fetch(`/api/routes/${routeId}/drinks`);
    if (!res.ok) throw new Error("Error al obtener bebidas");
    const data = await res.json();
    return data.ok ? { drinks: data.drinks } : { drinks: [] };
}

type AddDrinkParams = {
    routeId: string;
    stopId: string;
    type: string;
    paidById?: string;
};

async function addDrink({ routeId, stopId, type, paidById }: AddDrinkParams): Promise<Drink> {
    const res = await fetch(`/api/routes/${routeId}/drinks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopId, type, paidById }),
    });
    if (!res.ok) throw new Error("Error al añadir bebida");
    const data = await res.json();
    return data.drink;
}

export function useDrinks(routeId: string, stopId?: string) {
    return useQuery({
        queryKey: ["drinks", routeId],
        queryFn: () => fetchDrinks(routeId),
        staleTime: 10000, // 10 segundos
        refetchInterval: 10000, // Refetch cada 10 segundos (reemplaza el polling manual)
        enabled: !!routeId,
        select: (data) => ({
            drinks: stopId ? data.drinks.filter(d => d.stop.id === stopId) : data.drinks,
            allDrinks: data.drinks,
        }),
    });
}

export function useAddDrink(routeId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { stopId: string; type: string; paidById?: string }) =>
            addDrink({ routeId, ...params }),
        onSuccess: (newDrink) => {
            // Añadir la nueva bebida al cache
            queryClient.setQueryData<DrinksResponse>(["drinks", routeId], (old) =>
                old ? { drinks: [newDrink, ...old.drinks] } : { drinks: [newDrink] }
            );
        },
    });
}
