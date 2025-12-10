"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Photo = {
    id: string;
    url: string;
    caption: string | null;
    stopId?: string | null;
    userId?: string;
    challengeId?: string | null;
    guestId?: string | null;
    isMine?: boolean;
    createdAt: string;
    user: {
        name: string | null;
        image: string | null;
    };
    stop: {
        name: string;
    } | null;
};

type PhotosResponse = {
    photos: Photo[];
    hashtag: string;
    routeName: string;
};

async function fetchPhotos(routeId: string): Promise<PhotosResponse> {
    const res = await fetch(`/api/routes/${routeId}/photos`);
    if (!res.ok) throw new Error("Error al obtener fotos");
    const data = await res.json();
    return data.ok ? { photos: data.photos, hashtag: data.hashtag, routeName: data.routeName } : { photos: [], hashtag: "", routeName: "" };
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
        select: (data) => data, // Return full response
    });
}

export function useUploadPhoto(routeId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: Omit<UploadPhotoParams, "routeId">) =>
            uploadPhoto({ routeId, ...params }),
        onSuccess: (newPhoto) => {
            // Añadir la nueva foto al cache
            queryClient.setQueryData<PhotosResponse>(["photos", routeId], (old) =>
                old ? { ...old, photos: [newPhoto, ...old.photos] } : { photos: [newPhoto], hashtag: "", routeName: "" }
            );

        },
    });
}

export function useDeletePhoto(routeId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (photoId: string) => {
            const res = await fetch(`/api/routes/${routeId}/photos/${photoId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Error al eliminar foto");
            return res.json();
        },
        onSuccess: (_, photoId) => {
            // Eliminar la foto del cache
            queryClient.setQueryData<PhotosResponse>(["photos", routeId], (old) =>
                old ? { ...old, photos: old.photos.filter((p) => p.id !== photoId) } : old
            );
        },
    });
}
