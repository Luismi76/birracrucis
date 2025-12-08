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
                return <Camera className="w-5 h-5" />;
            case "speed":
                return <Clock className="w-5 h-5" />;
            case "specialty":
                return <Target className="w-5 h-5" />;
            default:
                return <Trophy className="w-5 h-5" />;
        }
    };

    const getColor = () => {
        switch (activeChallenge.type) {
            case "photo":
                return "from-purple-50 to-pink-50 border-purple-200";
            case "speed":
                return "from-orange-50 to-red-50 border-orange-200";
            case "specialty":
                return "from-green-50 to-emerald-50 border-green-200";
            default:
                return "from-amber-50 to-yellow-50 border-amber-200";
        }
    };

    return (
        <div className={`bg-gradient-to-br ${getColor()} border-2 rounded-xl p-4`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                        🎲 Desafío Activo
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                        {activeChallenge.title}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500">Puntos</p>
                    <p className="text-lg font-black text-amber-600">
                        +{activeChallenge.points}
                    </p>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 mb-3">
                {activeChallenge.description}
            </p>

            {/* Action button */}
            {onCompleteChallenge && (
                <button
                    onClick={() => onCompleteChallenge(activeChallenge.id)}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all shadow-md"
                >
                    ✓ Completar Desafío
                </button>
            )}

            {/* Progress */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>
                    {challenges.filter((c) => c.completed).length} / {challenges.length}{" "}
                    completados
                </span>
                <span className="font-semibold">
                    {challenges.reduce((sum, c) => sum + (c.completed ? c.points : 0), 0)}{" "}
                    pts
                </span>
            </div>
        </div>
    );
}
