"use client";

import { MapPin, Navigation } from "lucide-react";

type Participant = {
    id: string;
    name: string | null;
    image: string | null;
    distance: number; // en metros
    isAtBar: boolean;
};

type ParticipantsAtBarProps = {
    participants: Participant[];
    barName: string;
};

// Función para abreviar nombres
function getAbbreviatedName(name: string | null): string {
    if (!name) return "?";

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
        // Un solo nombre: tomar primeras 3 letras
        return parts[0].substring(0, 3).toUpperCase();
    } else if (parts.length === 2) {
        // Dos nombres: iniciales
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    } else {
        // Más de dos nombres: primera inicial + inicial del apellido
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
}

export default function ParticipantsAtBar({
    participants,
    barName,
}: ParticipantsAtBarProps) {
    const atBar = participants.filter((p) => p.isAtBar);
    const onTheWay = participants.filter((p) => !p.isAtBar);

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    En {barName}
                </h3>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {atBar.length}/{participants.length}
                </span>
            </div>

            {/* Participantes en el bar */}
            {atBar.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                        🟢 Aquí ({atBar.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {atBar.map((p) => (
                            <div
                                key={p.id}
                                className="relative group"
                                title={p.name || "Invitado"}
                            >
                                {/* Avatar */}
                                {p.image ? (
                                    <img
                                        src={p.image}
                                        alt={p.name || "Usuario"}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-green-500 dark:border-green-400"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 flex items-center justify-center text-white text-sm font-bold border-2 border-green-400 dark:border-green-500">
                                        {p.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                )}
                                {/* Badge con nombre abreviado */}
                                <div className="absolute -bottom-1 -right-1 bg-green-600 dark:bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white dark:border-slate-800 shadow-sm">
                                    {getAbbreviatedName(p.name)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Participantes de camino */}
            {onTheWay.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                        🔴 De camino ({onTheWay.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {onTheWay.map((p) => (
                            <div
                                key={p.id}
                                className="relative group"
                                title={`${p.name || "Invitado"} - ${p.distance}m`}
                            >
                                {/* Avatar */}
                                {p.image ? (
                                    <img
                                        src={p.image}
                                        alt={p.name || "Usuario"}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-orange-500 dark:border-orange-400"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 flex items-center justify-center text-white text-sm font-bold border-2 border-orange-400 dark:border-orange-500">
                                        {p.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                )}
                                {/* Badge con nombre abreviado */}
                                <div className="absolute -bottom-1 -right-1 bg-orange-600 dark:bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white dark:border-slate-800 shadow-sm">
                                    {getAbbreviatedName(p.name)}
                                </div>
                                {/* Badge de distancia */}
                                <div className="absolute -top-1 -right-1 bg-slate-800 dark:bg-slate-700 text-white text-[8px] font-bold px-1 py-0.5 rounded-full border border-white dark:border-slate-800 shadow-sm flex items-center gap-0.5">
                                    <Navigation className="w-2 h-2" />
                                    {p.distance > 999 ? `${(p.distance / 1000).toFixed(1)}k` : p.distance}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
