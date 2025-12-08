"use client";

import { useState } from "react";

type ReactionType = "good_beer" | "great_food" | "good_music" | "good_vibe";

type Reaction = {
    type: ReactionType;
    emoji: string;
    label: string;
    count: number;
    userReacted: boolean;
};

type QuickReactionsProps = {
    barId: string;
    reactions: Reaction[];
    onReact?: (type: ReactionType) => void;
};

export default function QuickReactions({
    barId,
    reactions,
    onReact,
}: QuickReactionsProps) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
            {/* Header */}
            <h3 className="font-bold text-slate-800 mb-3 text-sm">
                ⚡ Reacciones Rápidas
            </h3>

            {/* Reactions grid */}
            <div className="grid grid-cols-2 gap-2">
                {reactions.map((reaction) => (
                    <button
                        key={reaction.type}
                        onClick={() => onReact?.(reaction.type)}
                        className={`p-3 rounded-lg border-2 transition-all active:scale-95 ${reaction.userReacted
                                ? "bg-amber-50 border-amber-300 shadow-sm"
                                : "bg-slate-50 border-slate-200 hover:border-amber-200"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-2xl">{reaction.emoji}</span>
                            {reaction.count > 0 && (
                                <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${reaction.userReacted
                                            ? "bg-amber-200 text-amber-800"
                                            : "bg-slate-200 text-slate-600"
                                        }`}
                                >
                                    {reaction.count}
                                </span>
                            )}
                        </div>
                        <p
                            className={`text-xs font-semibold ${reaction.userReacted ? "text-amber-700" : "text-slate-600"
                                }`}
                        >
                            {reaction.label}
                        </p>
                    </button>
                ))}
            </div>

            {/* Total reactions */}
            {reactions.some((r) => r.count > 0) && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500">
                        {reactions.reduce((sum, r) => sum + r.count, 0)} reacciones totales
                    </p>
                </div>
            )}
        </div>
    );
}
