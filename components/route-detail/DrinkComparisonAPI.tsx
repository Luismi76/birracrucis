"use client";

import { useEffect, useState } from "react";
import { Beer, Trophy } from "lucide-react";

type Participant = {
    userId: string;
    userName: string;
    userImage: string | null;
    totalBeers: number;
};

type DrinkComparisonProps = {
    routeId: string;
    currentUserId?: string;
};

export default function DrinkComparisonAPI({
    routeId,
    currentUserId,
}: DrinkComparisonProps) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBeerData() {
            try {
                setLoading(true);
                const response = await fetch(`/api/routes/${routeId}/beers`);

                if (!response.ok) {
                    throw new Error('Failed to fetch beer data');
                }

                const data = await response.json();
                setParticipants(data.participants || []);
            } catch (error) {
                console.error('Error fetching beer data:', error);
                setParticipants([]);
            } finally {
                setLoading(false);
            }
        }

        fetchBeerData();

        // Refresh every 30 seconds
        const interval = setInterval(fetchBeerData, 30000);
        return () => clearInterval(interval);
    }, [routeId]);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-3 animate-shimmer">
                <div className="h-24" />
            </div>
        );
    }

    // Ordenar por cantidad de cervezas (mayor a menor)
    const sortedParticipants = [...participants].sort(
        (a, b) => b.totalBeers - a.totalBeers
    );

    // Tomar solo top 3
    const topThree = sortedParticipants.slice(0, 3);

    if (topThree.length === 0) {
        return (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-bold text-sm text-amber-900 dark:text-amber-100">
                        🍺 Ranking de Consumo
                    </h3>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 text-center py-2">
                    Aún no hay consumo registrado
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-sm text-amber-900 dark:text-amber-100">
                    🍺 Ranking de Consumo
                </h3>
            </div>

            <div className="space-y-2">
                {topThree.map((participant, index) => {
                    const isCurrentUser = participant.userId === currentUserId;
                    const medals = ["🥇", "🥈", "🥉"];

                    return (
                        <div
                            key={participant.userId}
                            className={`flex items-center justify-between p-2 rounded-lg ${isCurrentUser
                                    ? "bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700"
                                    : "bg-white/50 dark:bg-slate-800/50"
                                }`}
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-lg flex-shrink-0">{medals[index]}</span>
                                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                                    {participant.userName}
                                    {isCurrentUser && " (Tú)"}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg flex-shrink-0">
                                <Beer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <span className="text-sm font-bold text-amber-900 dark:text-amber-100">
                                    {participant.totalBeers}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
