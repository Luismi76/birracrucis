"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Participant = {
    id: string;
    odId: string;
    odIduserId: string;
    name: string | null;
    image: string | null;
    lat: number;
    lng: number;
    lastSeenAt: string;
};

type UpdateLocationParams = {
    routeId: string;
    lat: number;
    lng: number;
};

// Fetch participants
async function fetchParticipants(routeId: string): Promise<Participant[]> {
    const res = await fetch(`/api/routes/${routeId}/participants`);
    if (!res.ok) throw new Error("Error al obtener participantes");
    const data = await res.json();
    return data.ok ? data.participants : [];
}

// Update own location
async function updateLocation({ routeId, lat, lng }: UpdateLocationParams): Promise<void> {
    await fetch(`/api/routes/${routeId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
    });
}

export function useParticipants(routeId: string) {
    return useQuery({
        queryKey: ["participants", routeId],
        queryFn: () => fetchParticipants(routeId),
        refetchInterval: 5000, // Refetch cada 5 segundos
        staleTime: 3000, // Considerar stale después de 3 segundos
        enabled: !!routeId,
    });
}

export function useUpdateLocation(routeId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { lat: number; lng: number }) =>
            updateLocation({ routeId, ...params }),
        // Invalidar cache de participantes después de actualizar
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["participants", routeId] });
        },
    });
}
