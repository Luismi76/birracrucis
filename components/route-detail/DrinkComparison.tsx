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

export default function DrinkComparison({
    participants,
    currentUserId,
}: DrinkComparisonProps) {
    // Ordenar por cantidad de cervezas
    const sorted = [...participants].sort((a, b) => b.beersCount - a.beersCount);
    const top3 = sorted.slice(0, 3);
    const maxBeers = top3[0]?.beersCount || 1;

    if (top3.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5">
            {/* Header compacto */}
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-2">
                <Beer className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Ranking de Consumo
            </h3>

            {/* Top 3 compacto */}
            <div className="space-y-1.5">
                {top3.map((participant, index) => {
                    const isCurrentUser = participant.id === currentUserId;
                    const percentage = (participant.beersCount / maxBeers) * 100;
                    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";

                    return (
                        <div
                            key={participant.id}
                            className={`p-2 rounded-lg border transition-all ${isCurrentUser
                                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
                                : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {/* Medal */}
                                <span className="text-lg">{medal}</span>

                                {/* Avatar pequeño */}
                                {participant.image ? (
                                    <img
                                        src={participant.image}
                                        alt={participant.name || "Usuario"}
                                        className="w-6 h-6 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                                        {participant.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                )}

                                {/* Name and count */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                                        {participant.name || "Invitado"}
                                        {isCurrentUser && (
                                            <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400">(Tú)</span>
                                        )}
                                    </p>
                                </div>

                                {/* Beer count badge */}
                                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                                    <Beer className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                        {participant.beersCount}
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar compacta */}
                            <div className="mt-1.5">
                                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1 overflow-hidden">
                                    <div
                                        className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
