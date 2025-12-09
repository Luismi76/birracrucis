"use client";

import { useState, useEffect } from "react";
import { Target } from "lucide-react";

type PredictionType = "total_bars" | "total_beers" | "finish_time" | "mvp";

type Prediction = {
    type: PredictionType;
    label: string;
    icon: string;
    options: string[];
    userPrediction?: string;
};

type PredictionsPanelProps = {
    routeId: string;
    userId: string;
    enabled: boolean;
};

const PREDICTION_CONFIG: Record<PredictionType, { label: string; icon: string }> = {
    total_bars: { label: "Bares visitados", icon: "🏪" },
    total_beers: { label: "Cervezas totales", icon: "🍺" },
    finish_time: { label: "Hora de fin", icon: "⏰" },
    mvp: { label: "MVP del grupo", icon: "👑" },
};

export default function PredictionsPanel({
    routeId,
    userId,
    enabled,
}: PredictionsPanelProps) {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchPredictions() {
            try {
                const response = await fetch(`/api/routes/${routeId}/predictions`);
                if (!response.ok) throw new Error('Failed to fetch predictions');

                const data = await response.json();
                setPredictions(data.predictions || []);
            } catch (error) {
                console.error('Error fetching predictions:', error);
            }
        }

        fetchPredictions();
        const interval = setInterval(fetchPredictions, 30000);
        return () => clearInterval(interval);
    }, [routeId]);

    const handleMakePrediction = async (type: PredictionType, value: string) => {
        if (!enabled || loading) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/routes/${routeId}/predictions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, type, value }),
            });

            if (!response.ok) throw new Error('Failed to make prediction');

            // Refresh predictions
            const refreshResponse = await fetch(`/api/routes/${routeId}/predictions`);
            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                setPredictions(data.predictions || []);
            }
        } catch (error) {
            console.error('Error making prediction:', error);
        } finally {
            setLoading(false);
        }
    };

    if (predictions.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
            {/* Header compacto */}
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                Predicciones
            </h3>

            {/* Predictions compactas - horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {predictions.map((prediction) => (
                    <div
                        key={prediction.type}
                        className="flex-shrink-0 w-32"
                    >
                        {/* Header de predicción */}
                        <div className="text-center mb-1.5">
                            <span className="text-lg">{prediction.icon}</span>
                            <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 leading-tight">
                                {prediction.label}
                            </p>
                        </div>

                        {/* Opciones compactas */}
                        <div className="space-y-1">
                            {prediction.options.slice(0, 3).map((option) => {
                                const isSelected = prediction.userPrediction === option;
                                return (
                                    <button
                                        key={option}
                                        onClick={() => handleMakePrediction(prediction.type, option)}
                                        disabled={!enabled || loading || !!prediction.userPrediction}
                                        className={`w-full px-2 py-1 rounded text-[10px] font-semibold transition-all active:scale-95 disabled:cursor-not-allowed ${isSelected
                                                ? "bg-purple-500 text-white"
                                                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                                            }`}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Indicador de más opciones */}
            {predictions.length > 3 && (
                <div className="text-center mt-1">
                    <p className="text-[9px] text-slate-400 dark:text-slate-500">
                        ← Desliza para ver más →
                    </p>
                </div>
            )}
        </div>
    );
}
