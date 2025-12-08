"use client";

import { useState } from "react";
import { Trophy, Clock, Users, TrendingUp } from "lucide-react";

type PredictionType = "first_arrival" | "rounds_count" | "finish_time" | "winner";

type Prediction = {
    id: string;
    type: PredictionType;
    question: string;
    options: string[];
    userPrediction?: string;
    correctAnswer?: string;
    points: number;
};

type PredictionsPanelProps = {
    predictions: Prediction[];
    onMakePrediction?: (predictionId: string, option: string) => void;
};

export default function PredictionsPanel({
    predictions,
    onMakePrediction,
}: PredictionsPanelProps) {
    const [selectedPrediction, setSelectedPrediction] = useState<string | null>(
        null
    );

    const activePredictions = predictions.filter((p) => !p.correctAnswer);

    if (activePredictions.length === 0) return null;

    const currentPrediction = activePredictions[0];

    const getIcon = () => {
        switch (currentPrediction.type) {
            case "first_arrival":
                return <Users className="w-5 h-5 text-blue-500" />;
            case "rounds_count":
                return <TrendingUp className="w-5 h-5 text-green-500" />;
            case "finish_time":
                return <Clock className="w-5 h-5 text-orange-500" />;
            default:
                return <Trophy className="w-5 h-5 text-amber-500" />;
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                        🔮 Predicción
                    </p>
                    <p className="text-sm font-bold text-indigo-900">
                        {currentPrediction.question}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-indigo-500">Premio</p>
                    <p className="text-lg font-black text-amber-600">
                        +{currentPrediction.points}
                    </p>
                </div>
            </div>

            {/* Options */}
            <div className="space-y-2 mb-3">
                {currentPrediction.options.map((option) => (
                    <button
                        key={option}
                        onClick={() => {
                            setSelectedPrediction(option);
                            onMakePrediction?.(currentPrediction.id, option);
                        }}
                        className={`w-full p-3 rounded-lg font-semibold text-sm transition-all ${selectedPrediction === option
                                ? "bg-indigo-500 text-white shadow-md scale-[1.02]"
                                : currentPrediction.userPrediction === option
                                    ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-300"
                                    : "bg-white text-indigo-700 border-2 border-indigo-100 hover:border-indigo-300"
                            }`}
                        disabled={!!currentPrediction.userPrediction}
                    >
                        {option}
                        {currentPrediction.userPrediction === option && " ✓"}
                    </button>
                ))}
            </div>

            {/* Info */}
            {currentPrediction.userPrediction && (
                <div className="bg-indigo-100 border border-indigo-200 rounded-lg p-2 text-center">
                    <p className="text-xs text-indigo-700">
                        ✓ Predicción registrada: <strong>{currentPrediction.userPrediction}</strong>
                    </p>
                </div>
            )}

            {/* Progress */}
            <div className="mt-3 text-xs text-indigo-600 text-center">
                {predictions.filter((p) => p.userPrediction).length} /{" "}
                {predictions.length} predicciones hechas
            </div>
        </div>
    );
}
