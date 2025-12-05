"use client";

import { useEffect, useState, useRef } from "react";

type PlaceDetails = {
    rating?: number;
    user_ratings_total?: number;
    photos?: google.maps.places.PlacePhoto[];
    price_level?: number;
    opening_hours?: {
        isOpen: (date?: Date) => boolean | undefined;
    };
    formatted_address?: string;
    url?: string; // Link to google maps
};

export default function BarPlaceInfo({ placeId, name }: { placeId?: string | null, name: string }) {
    const [details, setDetails] = useState<PlaceDetails | null>(null);
    const [loading, setLoading] = useState(false);
    // No need to display this div, just ref for the service
    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!placeId || !window.google || !window.google.maps || !window.google.maps.places) {
            return;
        }

        setLoading(true);
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));

        service.getDetails({
            placeId: placeId,
            fields: ['rating', 'user_ratings_total', 'photos', 'price_level', 'opening_hours', 'url', 'formatted_address']
        }, (result, status) => {
            setLoading(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
                // Cast result to match our stricter/looser type if needed, or just trust runtime
                setDetails(result as any);
            }
        });

    }, [placeId]);

    if (!placeId) return null;

    if (loading) {
        return <div className="animate-pulse h-16 bg-slate-100 rounded-lg w-full mb-4"></div>;
    }

    if (!details) return null;

    const photoUrl = details.photos && details.photos.length > 0 ? details.photos[0].getUrl({ maxWidth: 400 }) : null;
    let isOpen: boolean | undefined | null = null;
    if (details.opening_hours && typeof details.opening_hours.isOpen === 'function') {
        try {
            isOpen = details.opening_hours.isOpen();
        } catch (e) {
            console.warn("Error checking isOpen", e);
        }
    }

    return (
        <div className="mb-4">
            {/* Foto Header */}
            {photoUrl && (
                <div className="w-full h-32 rounded-lg overflow-hidden mb-3 relative">
                    <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 text-white">
                        <span className="text-xs font-bold drop-shadow-md bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                            {details.formatted_address?.split(',')[0]}
                        </span>
                    </div>
                </div>
            )}

            {/* Info Grid */}
            <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                {/* Rating */}
                {details.rating && (
                    <div className="flex flex-col items-center border-r border-slate-100 pr-4">
                        <span className="text-xl font-bold text-slate-800 flex items-center gap-1">
                            {details.rating} <span className="text-amber-500">★</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                            {details.user_ratings_total} reseñas
                        </span>
                    </div>
                )}

                {/* Status / Price */}
                <div className="flex-1">
                    {details.price_level !== undefined && (
                        <p className="text-xs font-bold text-slate-600 mb-1">
                            {Array(details.price_level).fill('€').join('')}
                        </p>
                    )}
                    {isOpen !== null && isOpen !== undefined && (
                        <p className={`text-xs font-medium ${isOpen ? 'text-green-600' : 'text-red-500'}`}>
                            {isOpen ? 'Abierto ahora' : 'Cerrado'}
                        </p>
                    )}
                    {details.url && (
                        <a href={details.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline block mt-1">
                            Ver en Google Maps ↗
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
