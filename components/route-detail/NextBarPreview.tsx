"use client";

import { useEffect, useState } from "react";
import { MapPin, Star, Clock, Navigation } from "lucide-react";

type NextBarPreviewProps = {
    barName: string;
    address: string | null;
    distance: number; // metros
    estimatedArrival: string; // HH:MM
    googlePlaceId?: string | null;
    onViewOnMap?: () => void;
};

export default function NextBarPreview({
    barName,
    address,
    distance,
    estimatedArrival,
    googlePlaceId,
    onViewOnMap,
}: NextBarPreviewProps) {
    const [placeDetails, setPlaceDetails] = useState<{
        photo?: string;
        rating?: number;
    } | null>(null);

    useEffect(() => {
        if (!googlePlaceId || typeof window === "undefined" || (googlePlaceId.length === 25 && googlePlaceId.startsWith("c"))) return;

        // Verificar que Google Maps esté cargado
        if (typeof google === "undefined" || !google.maps || !google.maps.places) {
            return;
        }

        const service = new google.maps.places.PlacesService(
            document.createElement("div")
        );
        service.getDetails(
            {
                placeId: googlePlaceId,
                fields: ["photos", "rating"],
            },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    setPlaceDetails({
                        photo: place.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 200 }),
                        rating: place.rating,
                    });
                }
            }
        );
    }, [googlePlaceId]);

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-blue-500 text-white px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    <span className="font-bold text-sm">Próximo Bar</span>
                </div>
                <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    <span>ETA: {estimatedArrival}</span>
                </div>
            </div>

            {/* Foto del lugar */}
            {placeDetails?.photo && (
                <div className="relative h-32 overflow-hidden">
                    <img
                        src={placeDetails.photo}
                        alt={barName}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
            )}

            {/* Contenido */}
            <div className="p-4 space-y-3">
                {/* Nombre y rating */}
                <div>
                    <h3 className="font-bold text-lg text-blue-900">{barName}</h3>
                    {address && (
                        <p className="text-xs text-blue-600 truncate">{address}</p>
                    )}
                    {placeDetails?.rating && (
                        <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-semibold text-blue-800">
                                {placeDetails.rating.toFixed(1)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-700">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                            {distance < 1000
                                ? `${distance}m`
                                : `${(distance / 1000).toFixed(1)}km`}
                        </span>
                    </div>
                    <button
                        onClick={onViewOnMap}
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 active:scale-95 transition-all"
                    >
                        Ver en mapa
                    </button>
                </div>
            </div>
        </div>
    );
}
