"use client";

import { Beer } from "lucide-react";

type Participant = {
    id: string;
    name: string | null;
    image: string | null;
    beersCount: number;
};

type DrinkComparisonProps = {
    participants: Participant[];
    currentUserId?: string;
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

export default function DrinkComparison({
    participants,
    currentUserId,
}: DrinkComparisonProps) {
    // Ordenar por cantidad de cervezas
    const sorted = [...participants].sort((a, b) => b.beersCount - a.beersCount);
    const top3 = sorted.slice(0, 3);

    if (top3.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
            {/* Header compacto */}
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-2">
                <Beer className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Ranking
            </h3>

            {/* Top 3 ultra compacto */}
            <div className="space-y-1">
                {top3.map((participant, index) => {
                    const isCurrentUser = participant.id === currentUserId;
                    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";

                    return (
                        <div
                            key={participant.id}
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg ${isCurrentUser
                                    ? "bg-amber-50 dark:bg-amber-900/20"
                                    : "bg-slate-50 dark:bg-slate-700/50"
                                }`}
                            title={participant.name || "Invitado"}
                        >
                            {/* Medal */}
                            <span className="text-sm">{medal}</span>

                            {/* Avatar pequeño */}
                            {participant.image ? (
                                <img
                                    src={participant.image}
                                    alt={participant.name || "Usuario"}
                                    className="w-5 h-5 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-amber-500 dark:bg-amber-600 flex items-center justify-center text-white text-[10px] font-bold">
                                    {participant.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                            )}

                            {/* Nombre abreviado */}
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                {getAbbreviatedName(participant.name)}
                                {isCurrentUser && <span className="text-amber-600 dark:text-amber-400">*</span>}
                            </span>

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Beer count badge compacto */}
                            <div className="flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-full">
                                <Beer className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                    {participant.beersCount}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
