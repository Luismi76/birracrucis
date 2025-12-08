"use client";

import { useState } from "react";
import type { PlaceResult, BarConfig } from "../types";

interface AvailableBarsListProps {
    places: PlaceResult[];
    selectedBars: Map<string, BarConfig>;
    centerLat: string;
    centerLng: string;
    onToggleBar: (placeId: string) => void;
    formatDistance: (meters: number) => string;
}

export default function AvailableBarsList({
    places,
    selectedBars,
    centerLat,
    centerLng,
    onToggleBar,
    formatDistance,
}: AvailableBarsListProps) {
    const [sortBy, setSortBy] = useState<"relevance" | "distance">("relevance");

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const availablePlaces = places;

    if (availablePlaces.length === 0) {
        return null;
    }

    const placesWithDistance = availablePlaces.map((place) => ({
        ...place,
        distance: centerLat && centerLng
            ? calculateDistance(parseFloat(centerLat), parseFloat(centerLng), place.lat, place.lng)
            : null
    }));

    const sortedPlaces = [...placesWithDistance].sort((a, b) => {
        if (sortBy === "distance") {
            return (a.distance ?? Infinity) - (b.distance ?? Infinity);
        }
        // Por relevancia: primero rating, luego número de reseñas
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return b.userRatingsTotal - a.userRatingsTotal;
    });

    return (
        <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Bares Disponibles ({availablePlaces.length})
                </h3>
                {/* Selector de ordenación */}
                <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                    <button
                        onClick={() => setSortBy("relevance")}
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${sortBy === "relevance"
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        ⭐ Relevancia
                    </button>
                    <button
                        onClick={() => setSortBy("distance")}
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${sortBy === "distance"
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        📍 Cercanía
                    </button>
                </div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {sortedPlaces.map((place) => (
                    <div
                        key={place.placeId}
                        onClick={() => onToggleBar(place.placeId)}
                        className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 cursor-pointer transition-all"
                    >
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-amber-400 flex items-center justify-center flex-shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline gap-2">
                                <h3 className="font-medium text-slate-700 truncate">{place.name}</h3>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {place.distance !== null && (
                                        <span className="text-xs text-blue-500 font-medium">
                                            {formatDistance(place.distance)}
                                        </span>
                                    )}
                                    {place.rating && (
                                        <span className="text-xs text-amber-500 font-bold flex items-center gap-0.5">
                                            ⭐ {place.rating}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 truncate">{place.address}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
