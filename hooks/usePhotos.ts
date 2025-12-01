"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Photo = {
    id: string;
    url: string;
    caption: string | null;
    stopId: string | null;
    userId: string;
    userName: string | null;
    userImage: string | null;
    createdAt: string;
};

async function fetchPhotos(routeId: string): Promise<Photo[]> {
    const res = await fetch(`/api/routes/${routeId}/photos`);
    if (!res.ok) throw new Error("Error al obtener fotos");
    const data = await res.json();
    return data.ok ? data.photos : [];
}

type UploadPhotoParams = {
    routeId: string;
    imageData: string; // base64
    stopId?: string;
    caption?: string;
};

async function uploadPhoto({ routeId, imageData, stopId, caption }: UploadPhotoParams): Promise<Photo> {
    const res = await fetch(`/api/routes/${routeId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData, stopId, caption }),
    });
    if (!res.ok) throw new Error("Error al subir foto");
    const data = await res.json();
    return data.photo;
}

export function usePhotos(routeId: string) {
    return useQuery({
        queryKey: ["photos", routeId],
        queryFn: () => fetchPhotos(routeId),
        staleTime: 30000, // 30 segundos
        enabled: !!routeId,
    });
}

export function useUploadPhoto(routeId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: Omit<UploadPhotoParams, "routeId">) =>
            uploadPhoto({ routeId, ...params }),
        onSuccess: (newPhoto) => {
            // Añadir la nueva foto al cache
            queryClient.setQueryData<Photo[]>(["photos", routeId], (old) =>
                old ? [newPhoto, ...old] : [newPhoto]
            );
        },
    });
}
