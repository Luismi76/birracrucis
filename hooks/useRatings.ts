"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Rating = {
    id: string;
    rating: number;
    comment: string | null;
    user: { id: string; name: string | null; image: string | null };
    stop: { id: string; name: string };
};

type RatingsResponse = {
    ratings: Rating[];
    averages: { stopId: string; _avg: { rating: number } }[];
};

async function fetchRatings(routeId: string, stopId: string): Promise<RatingsResponse> {
    const res = await fetch(`/api/routes/${routeId}/ratings?stopId=${stopId}`);
    if (!res.ok) throw new Error("Error al obtener valoraciones");
    const data = await res.json();
    return data.ok ? { ratings: data.ratings, averages: data.averages } : { ratings: [], averages: [] };
}

type AddRatingParams = {
    routeId: string;
    stopId: string;
    rating: number;
    comment?: string | null;
};

async function addRating({ routeId, stopId, rating, comment }: AddRatingParams): Promise<Rating> {
    const res = await fetch(`/api/routes/${routeId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopId, rating, comment }),
    });
    if (!res.ok) throw new Error("Error al guardar valoración");
    const data = await res.json();
    return data.rating;
}

export function useRatings(routeId: string, stopId: string) {
    return useQuery({
        queryKey: ["ratings", routeId, stopId],
        queryFn: () => fetchRatings(routeId, stopId),
        staleTime: 30000, // 30 segundos
        enabled: !!routeId && !!stopId,
        select: (data) => {
            const avg = data.averages.find(a => a.stopId === stopId);
            return {
                ratings: data.ratings,
                average: avg?._avg.rating ?? null,
            };
        },
    });
}

export function useAddRating(routeId: string, stopId: string, currentUserId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { rating: number; comment?: string | null }) =>
            addRating({ routeId, stopId, ...params }),
        onSuccess: (newRating) => {
            // Actualizar el cache con la nueva valoración
            queryClient.setQueryData<RatingsResponse>(["ratings", routeId, stopId], (old) => {
                if (!old) return { ratings: [newRating], averages: [] };

                // Remover rating anterior del mismo usuario
                const filteredRatings = old.ratings.filter(r => r.user.id !== currentUserId);
                const newRatings = [newRating, ...filteredRatings];

                // Recalcular media
                const sum = newRatings.reduce((acc, r) => acc + r.rating, 0);
                const newAvg = sum / newRatings.length;

                return {
                    ratings: newRatings,
                    averages: [{ stopId, _avg: { rating: newAvg } }],
                };
            });
        },
    });
}
