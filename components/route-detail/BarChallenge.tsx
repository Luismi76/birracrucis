"use client";

import { useState } from "react";
import { Trophy, Camera, Clock, Target } from "lucide-react";

type ChallengeType = "photo" | "speed" | "specialty" | "hidden";

type Challenge = {
    id: string;
    type: ChallengeType;
    title: string;
    description: string;
    points: number;
    completed: boolean;
};

type BarChallengeProps = {
    barName: string;
    challenges: Challenge[];
    onCompleteChallenge?: (challengeId: string) => void;
};

export default function BarChallenge({
    barName,
    challenges,
    onCompleteChallenge,
}: BarChallengeProps) {
    const activeChallenge = challenges.find((c) => !c.completed);

    if (!activeChallenge) return null;

    const getIcon = () => {
        switch (activeChallenge.type) {
            case "photo":
                return <Camera className="w-3.5 h-3.5" />;
            case "speed":
                return <Clock className="w-3.5 h-3.5" />;
            case "specialty":
                return <Target className="w-3.5 h-3.5" />;
            default:
                return <Trophy className="w-3.5 h-3.5" />;
        }
    };

    const getColor = () => {
        switch (activeChallenge.type) {
            case "photo":
                return "from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800";
            case "speed":
                return "from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800";
            case "specialty":
                return "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800";
            default:
                return "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800";
        }
    };

    return (
        <div className={`bg-gradient-to-br ${getColor()} border rounded-lg p-2.5`}>
            {/* Header compacto */}
            <div className="flex items-center gap-1.5 mb-2">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        🎲 Desafío
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {activeChallenge.title}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">Pts</p>
                    <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                        +{activeChallenge.points}
                    </p>
                </div>
            </div>

            {/* Description compacta */}
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                {activeChallenge.description}
            </p>

            {/* Action button compacto */}
            {onCompleteChallenge && (
                <button
                    onClick={() => onCompleteChallenge(activeChallenge.id)}
                    className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white text-[10px] font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all shadow-sm"
                >
                    ✓ Completar
                </button>
            )}

            {/* Progress compacto */}
            <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400">
                <span>
                    {challenges.filter((c) => c.completed).length} / {challenges.length}{" "}
                    hechos
                </span>
                <span className="font-semibold">
                    {challenges.reduce((sum, c) => sum + (c.completed ? c.points : 0), 0)}{" "}
                    pts
                </span>
            </div>
        </div>
    );
}
