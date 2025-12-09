"use client";

import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Award, Target, Crown, Medal } from "lucide-react";
import { toast } from "sonner";

type LeaderboardEntry = {
    userId: string;
    userName: string;
    userImage: string | null;
    totalPoints: number;
    level: number;
    achievementsCount: number;
    routesCompleted: number;
};

type Period = "all" | "month" | "week";

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>("all");

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/leaderboard?period=${period}`);
            if (!res.ok) throw new Error("Error al cargar leaderboard");

            const data = await res.json();
            setLeaderboard(data.leaderboard || []);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            toast.error("Error al cargar el ranking");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [period]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="w-6 h-6 text-amber-500" />;
            case 2:
                return <Medal className="w-6 h-6 text-slate-400" />;
            case 3:
                return <Medal className="w-6 h-6 text-orange-600" />;
            default:
                return null;
        }
    };

    const getRankBadge = (rank: number) => {
        switch (rank) {
            case 1:
                return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
            case 2:
                return "bg-gradient-to-r from-slate-300 to-slate-500 text-white";
            case 3:
                return "bg-gradient-to-r from-orange-400 to-orange-600 text-white";
            default:
                return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 mb-4">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 mb-2">
                        🏆 Ranking Global
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Los mejores cerveceros de la comunidad
                    </p>
                </div>

                {/* Period Filter */}
                <div className="flex gap-2 mb-6 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm">
                    {[
                        { value: "all", label: "Todo el tiempo" },
                        { value: "month", label: "Este mes" },
                        { value: "week", label: "Esta semana" },
                    ].map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setPeriod(option.value as Period)}
                            className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${period === option.value
                                    ? "bg-amber-500 text-white shadow-md"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-600 dark:text-slate-400 mt-4">Cargando ranking...</p>
                    </div>
                )}

                {/* Leaderboard */}
                {!loading && leaderboard.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
                        <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400">
                            No hay datos para este período
                        </p>
                    </div>
                )}

                {!loading && leaderboard.length > 0 && (
                    <div className="space-y-3">
                        {leaderboard.map((entry, index) => {
                            const rank = index + 1;
                            const isTopThree = rank <= 3;

                            return (
                                <div
                                    key={entry.userId}
                                    className={`bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm transition-all hover:shadow-md ${isTopThree ? "ring-2 ring-amber-400 dark:ring-amber-600" : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Rank */}
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${getRankBadge(
                                                rank
                                            )}`}
                                        >
                                            {getRankIcon(rank) || `#${rank}`}
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center overflow-hidden">
                                            {entry.userImage ? (
                                                <img
                                                    src={entry.userImage}
                                                    alt={entry.userName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-white font-bold text-lg">
                                                    {entry.userName.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                                {entry.userName}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Target className="w-3 h-3" />
                                                    Nivel {entry.level}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Award className="w-3 h-3" />
                                                    {entry.achievementsCount} logros
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" />
                                                    {entry.routesCompleted} rutas
                                                </span>
                                            </div>
                                        </div>

                                        {/* Points */}
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                                {entry.totalPoints.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">puntos</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    <p>Mostrando top {leaderboard.length} usuarios</p>
                    <p className="mt-2">
                        💡 Gana puntos completando rutas, desbloqueando logros y haciendo predicciones
                    </p>
                </div>
            </div>
        </div>
    );
}
