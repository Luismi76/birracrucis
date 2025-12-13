"use client";

import { useState, useEffect } from "react";
import { Stop } from "./types";

export function BarTooltip({ stop, index }: { stop: Stop; index: number }) {
    const [placeDetails, setPlaceDetails] = useState<{
        photo?: string;
        rating?: number;
    } | null>(null);

    useEffect(() => {
        if (!stop.googlePlaceId) return;

        const service = new google.maps.places.PlacesService(document.createElement('div'));
        service.getDetails(
            {
                placeId: stop.googlePlaceId,
                fields: ['photos', 'rating']
            },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    setPlaceDetails({
                        photo: place.photos?.[0]?.getUrl({ maxWidth: 80, maxHeight: 60 }),
                        rating: place.rating
                    });
                }
            }
        );
    }, [stop.googlePlaceId]);

    const getStatusColor = () => {
        if (stop.actualRounds >= stop.plannedRounds) return "bg-green-500";
        if (stop.actualRounds > 0) return "bg-amber-500";
        return "bg-slate-400";
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-2 min-w-[140px] max-w-[180px] border-2 border-slate-200">
            {/* Número del bar */}
            <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full ${getStatusColor()} text-white flex items-center justify-center text-xs font-bold border-2 border-white`}>
                {index + 1}
            </div>

            {/* Imagen de Google Places */}
            {placeDetails?.photo && (
                <img
                    src={placeDetails.photo}
                    alt={stop.name}
                    className="w-full h-14 object-cover rounded mb-1"
                />
            )}

            {/* Nombre del bar */}
            <h4 className="font-bold text-xs text-slate-800 truncate mb-1">
                {stop.name}
            </h4>

            {/* Rating */}
            {placeDetails?.rating && (
                <div className="flex items-center gap-1 mb-1">
                    <span className="text-amber-500 text-xs">⭐</span>
                    <span className="text-xs font-semibold text-slate-700">
                        {placeDetails.rating.toFixed(1)}
                    </span>
                </div>
            )}

            {/* Rondas */}
            <div className="text-[10px] text-slate-600">
                <span className="font-semibold">{stop.actualRounds}</span>
                <span className="text-slate-400">/{stop.plannedRounds}</span>
                <span className="ml-1">rondas</span>
            </div>
        </div>
    );
}
