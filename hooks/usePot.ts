"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type PotData = {
    currentAmount: number;
    targetAmount: number;
    participantsCount: number;
    paidCount: number;
};

type PotApiResponse = {
    ok: boolean;
    pot?: {
        totalCollected: number;
        totalSpent: number;
        amountPerPerson: number;
        participantCount: number;
        contributions: unknown[];
    };
};

async function fetchPot(routeId: string): Promise<PotData> {
    const res = await fetch(`/api/routes/${routeId}/pot`);
    if (!res.ok) {
        throw new Error("Error al obtener datos del bote");
    }

    const data: PotApiResponse = await res.json();

    if (data.ok && data.pot) {
        const pot = data.pot;
        const availableBalance = (pot.totalCollected || 0) - (pot.totalSpent || 0);

        return {
            currentAmount: availableBalance,
            targetAmount: (pot.amountPerPerson || 0) * (pot.participantCount || 0),
            participantsCount: pot.participantCount || 0,
            paidCount: pot.contributions?.length || 0,
        };
    }

    return {
        currentAmount: 0,
        targetAmount: 0,
        participantsCount: 0,
        paidCount: 0,
    };
}

export function usePot(routeId: string) {
    return useQuery({
        queryKey: ["pot", routeId],
        queryFn: () => fetchPot(routeId),
        staleTime: 30000, // 30 segundos
        refetchInterval: 30000, // Auto-refresh cada 30s
        refetchIntervalInBackground: false, // No refrescar en background
        enabled: !!routeId,
    });
}

type SpendParams = {
    amount: number;
    description: string;
};

async function spendFromPot(routeId: string, params: SpendParams): Promise<void> {
    const res = await fetch(`/api/routes/${routeId}/pot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "spend", ...params }),
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al registrar gasto");
    }
}

export function useSpendFromPot(routeId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: SpendParams) => spendFromPot(routeId, params),
        onSuccess: () => {
            // Invalidar cache para refrescar datos
            queryClient.invalidateQueries({ queryKey: ["pot", routeId] });
        },
    });
}
