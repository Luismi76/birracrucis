"use client";

import { useState, useEffect } from "react";
import { addReaction } from "@/lib/gamification-helpers";
import { toast } from "sonner";

type ReactionType = "fire" | "heart" | "thumbs_up" | "party" | "star";

type Reaction = {
    type: ReactionType;
    emoji: string;
    label: string;
    count: number;
    userReacted: boolean;
};

type QuickReactionsProps = {
    routeId: string;
    stopId: string;
    userId: string;
};

const REACTION_CONFIG: Record<ReactionType, { emoji: string; label: string }> = {
    fire: { emoji: "🔥", label: "Increíble" },
    heart: { emoji: "❤️", label: "Me encanta" },
    thumbs_up: { emoji: "👍", label: "Bueno" },
    party: { emoji: "🎉", label: "Fiesta" },
    star: { emoji: "⭐", label: "Top" },
};

export default function QuickReactions({
    routeId,
    stopId,
    userId,
}: QuickReactionsProps) {
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch reactions from API
    useEffect(() => {
        async function fetchReactions() {
            try {
                const response = await fetch(`/api/routes/${routeId}/reactions`);
                if (!response.ok) throw new Error('Failed to fetch reactions');

                const data = await response.json();
                const stopReactions = data.reactions[stopId] || {};

                // Transform API data to component format
                const formattedReactions: Reaction[] = Object.keys(REACTION_CONFIG).map((type) => ({
                    type: type as ReactionType,
                    emoji: REACTION_CONFIG[type as ReactionType].emoji,
                    label: REACTION_CONFIG[type as ReactionType].label,
                    count: stopReactions[type] || 0,
                    userReacted: false, // TODO: Track user reactions in localStorage or API
                }));

                setReactions(formattedReactions);
            } catch (error) {
                console.error('Error fetching reactions:', error);
            }
        }

        fetchReactions();

        // Refresh every 15 seconds
        const interval = setInterval(fetchReactions, 15000);
        return () => clearInterval(interval);
    }, [routeId, stopId]);

    const handleReact = async (type: ReactionType) => {
        if (loading) return;

        setLoading(true);
        try {
            await addReaction(routeId, userId, stopId, type);

            // Optimistic update
            setReactions(prev => prev.map(r =>
                r.type === type
                    ? { ...r, count: r.count + 1, userReacted: true }
                    : r
            ));

            toast.success(`¡Reacción añadida! ${REACTION_CONFIG[type].emoji}`);
        } catch (error) {
            console.error('Error adding reaction:', error);
            toast.error('Error al añadir reacción');
        } finally {
            setLoading(false);
        }
    };

    if (reactions.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            {/* Header */}
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 text-sm">
                ⚡ Reacciones Rápidas
            </h3>

            {/* Reactions grid */}
            <div className="grid grid-cols-2 gap-2">
                {reactions.map((reaction) => (
                    <button
                        key={reaction.type}
                        onClick={() => handleReact(reaction.type)}
                        disabled={loading || reaction.userReacted}
                        className={`p-3 rounded-lg border-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${reaction.userReacted
                                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-amber-200 dark:hover:border-amber-700"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-2xl">{reaction.emoji}</span>
                            {reaction.count > 0 && (
                                <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${reaction.userReacted
                                            ? "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100"
                                            : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200"
                                        }`}
                                >
                                    {reaction.count}
                                </span>
                            )}
                        </div>
                        <p
                            className={`text-xs font-semibold ${reaction.userReacted
                                    ? "text-amber-700 dark:text-amber-400"
                                    : "text-slate-600 dark:text-slate-300"
                                }`}
                        >
                            {reaction.label}
                        </p>
                    </button>
                ))}
            </div>

            {/* Total reactions */}
            {reactions.some((r) => r.count > 0) && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {reactions.reduce((sum, r) => sum + r.count, 0)} reacciones totales
                    </p>
                </div>
            )}
        </div>
    );
}
