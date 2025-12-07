"use client";

import { useState, useEffect } from "react";
import { Trophy, Beer, MapPin, Star, X, TrendingUp } from "lucide-react";

type RankingData = {
    userId: string;
    name: string;
    image: string | null;
    rounds: number;
    spent: number;
    barsVisited: number;
    avgRating: number;
};

type RankingViewProps = {
    routeId: string;
    onClose: () => void;
};

export default function RankingView({ routeId, onClose }: RankingViewProps) {
    const [activeTab, setActiveTab] = useState<"rounds" | "spent" | "bars" | "ratings">("rounds");
    const [rankings, setRankings] = useState<RankingData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRankings = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/routes/${routeId}/rankings`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.ok) {
                        setRankings(data.rankings);
                    }
                }
            } catch (err) {
                console.error("Error fetching rankings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRankings();
    }, [routeId]);

    const getSortedRankings = () => {
        const sorted = [...rankings];
        switch (activeTab) {
            case "rounds":
                return sorted.sort((a, b) => b.rounds - a.rounds);
            case "spent":
                return sorted.sort((a, b) => b.spent - a.spent);
            case "bars":
                return sorted.sort((a, b) => b.barsVisited - a.barsVisited);
            case "ratings":
                return sorted.sort((a, b) => b.avgRating - a.avgRating);
            default:
                return sorted;
        }
    };

    const getTabConfig = () => {
        switch (activeTab) {
            case "rounds":
                return { icon: Beer, label: "Más Rondas", color: "amber", getValue: (r: RankingData) => `${r.rounds} rondas` };
            case "spent":
                return { icon: TrendingUp, label: "Más Gastado", color: "green", getValue: (r: RankingData) => `${r.spent.toFixed(2)}€` };
            case "bars":
                return { icon: MapPin, label: "Más Bares", color: "blue", getValue: (r: RankingData) => `${r.barsVisited} bares` };
            case "ratings":
                return { icon: Star, label: "Mejor Valorador", color: "purple", getValue: (r: RankingData) => `${r.avgRating.toFixed(1)} ⭐` };
        }
    };

    const sortedRankings = getSortedRankings();
    const config = getTabConfig();
    const IconComponent = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">

                {/* Header */}
                <div className="relative bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Ranking</h2>
                            <p className="text-sm text-amber-100">Estadísticas del grupo</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                        {[
                            { id: "rounds", icon: Beer, label: "Rondas" },
                            { id: "spent", icon: TrendingUp, label: "Gastado" },
                            { id: "bars", icon: MapPin, label: "Bares" },
                            { id: "ratings", icon: Star, label: "Ratings" },
                        ].map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                                            ? "bg-white text-amber-600 shadow-lg"
                                            : "bg-white/10 text-white hover:bg-white/20"
                                        }`}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
                        </div>
                    ) : sortedRankings.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="font-semibold">No hay datos todavía</p>
                            <p className="text-sm">¡Empezad a pedir rondas!</p>
                        </div>
                    ) : (
                        sortedRankings.map((ranking, index) => {
                            const isPodium = index < 3;
                            const medals = ["🥇", "🥈", "🥉"];

                            return (
                                <div
                                    key={ranking.userId}
                                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isPodium
                                            ? `bg-gradient-to-r ${index === 0
                                                ? "from-amber-50 to-amber-100 border-2 border-amber-300"
                                                : index === 1
                                                    ? "from-slate-50 to-slate-100 border-2 border-slate-300"
                                                    : "from-orange-50 to-orange-100 border-2 border-orange-300"
                                            }`
                                            : "bg-slate-50 border border-slate-200"
                                        }`}
                                >
                                    {/* Position */}
                                    <div className="flex-shrink-0 w-10 text-center">
                                        {isPodium ? (
                                            <span className="text-3xl">{medals[index]}</span>
                                        ) : (
                                            <span className="text-xl font-black text-slate-400">#{index + 1}</span>
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <img
                                            src={ranking.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ranking.name}`}
                                            alt={ranking.name}
                                            className={`w-12 h-12 rounded-full ${isPodium ? "ring-4 ring-amber-400" : "ring-2 ring-slate-200"
                                                }`}
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-800 truncate">{ranking.name}</h3>
                                        <p className="text-sm text-slate-500">{config.getValue(ranking)}</p>
                                    </div>

                                    {/* Icon */}
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-${config.color}-100 flex items-center justify-center`}>
                                        <IconComponent className={`w-5 h-5 text-${config.color}-600`} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
