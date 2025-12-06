"use client";

import { MapPin } from "lucide-react";

type Stop = {
    id: string;
    name: string;
    lat: number;
    lng: number;
};

type DevLocationControlProps = {
    activeStop: Stop | undefined;
    onSetPosition: (pos: { lat: number; lng: number }) => void;
};

export default function DevLocationControl({ activeStop, onSetPosition }: DevLocationControlProps) {
    // Solo mostrar en desarrollo
    if (process.env.NODE_ENV !== "development") return null;

    if (!activeStop) return null;

    return (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2">
            <button
                onClick={() => onSetPosition({ lat: activeStop.lat, lng: activeStop.lng })}
                className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 active:scale-95 transition-all flex items-center gap-2"
                title={`Simular estar en ${activeStop.name}`}
            >
                <MapPin className="w-5 h-5" />
                <span className="text-xs font-bold hidden md:inline">Teleport</span>
            </button>
        </div>
    );
}
