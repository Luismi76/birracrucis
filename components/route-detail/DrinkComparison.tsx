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
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Beer className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    Ranking de Consumo
                </h3>
            </div>

            {/* Top 3 */}
            <div className="space-y-2">
                {top3.map((participant, index) => {
                    const isCurrentUser = participant.id === currentUserId;
                    const percentage = (participant.beersCount / maxBeers) * 100;
                    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";

                    return (
                        <div
                            key={participant.id}
                            className={`p-3 rounded-lg border-2 transition-all ${isCurrentUser
                                ? "bg-amber-50 border-amber-300"
                                : "bg-slate-50 border-slate-200"
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                {/* Medal */}
                                <span className="text-2xl">{medal}</span>

                                {/* Avatar */}
                                {participant.image ? (
                                    <img
                                        src={participant.image}
                                        alt={participant.name || "Usuario"}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold">
                                        {participant.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                )}

                                {/* Name and count */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 truncate">
                                        {participant.name || "Invitado"}
                                        {isCurrentUser && (
                                            <span className="ml-2 text-xs text-amber-600">(Tú)</span>
                                        )}
                                    </p>
                                </div>

                                {/* Beer count */}
                                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                                    <Beer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    <span className="text-sm font-bold text-amber-900 dark:text-amber-100">
                                        {participant.beersCount}
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${index === 0
                                        ? "bg-amber-500"
                                        : index === 1
                                            ? "bg-slate-400"
                                            : "bg-orange-400"
                                        }`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Others count */}
            {sorted.length > 3 && (
                <p className="text-xs text-slate-500 text-center">
                    +{sorted.length - 3} participantes más
                </p>
            )}
        </div>
    );
}
