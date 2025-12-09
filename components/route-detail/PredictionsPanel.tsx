"use client";

import { useState, useEffect } from "react";
import { Trophy, Clock, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type PredictionType = "finish_time" | "total_beers" | "mvp" | "first_arrival";

type Prediction = {
    id: string;
    type: PredictionType;
    prediction: string; // JSON string
    result?: string | null;
    isCorrect?: boolean | null;
    points: number;
    createdAt: string;
    user: {
        name: string | null;
    };
};

type PredictionsPanelProps = {
    routeId: string;
    userId: string;
    enabled?: boolean;
};

// Preguntas predefinidas para cada tipo
const PREDICTION_QUESTIONS: Record<PredictionType, {
    question: string;
    icon: typeof Trophy;
    color: string;
}> = {
    finish_time: {
        question: "¿A qué hora terminaremos?",
        icon: Clock,
        color: "orange",
    },
    total_beers: {
        question: "¿Cuántas cervezas tomaremos en total?",
        icon: TrendingUp,
        color: "green",
    },
    mvp: {
        question: "¿Quién será el MVP de la ruta?",
        icon: Trophy,
        color: "amber",
    },
    first_arrival: {
        question: "¿Quién llegará primero al último bar?",
        icon: Users,
        color: "blue",
    },
};

export default function PredictionsPanel({
    routeId,
    userId,
    enabled = true,
}: PredictionsPanelProps) {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Fetch predictions
    const fetchPredictions = async () => {
        if (!enabled) return;

        try {
            const res = await fetch(`/api/routes/${routeId}/predictions`);
            if (!res.ok) throw new Error("Error al cargar predicciones");

            const data = await res.json();
            if (data.ok) {
                setPredictions(data.predictions || []);
            }
        } catch (error) {
            console.error("Error fetching predictions:", error);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchPredictions();
    }, [routeId, enabled]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!enabled) return;

        const interval = setInterval(fetchPredictions, 30000);
        return () => clearInterval(interval);
    }, [routeId, enabled]);

    // Submit prediction
    const handleMakePrediction = async (type: PredictionType, value: string) => {
        if (submitting) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/routes/${routeId}/predictions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    type,
                    prediction: JSON.stringify({ value }),
                }),
            });

            if (!res.ok) throw new Error("Error al guardar predicción");

            const data = await res.json();
            if (data.ok) {
                toast.success("¡Predicción guardada!");
                // Refresh predictions
                await fetchPredictions();
            }
        } catch (error) {
            console.error("Error submitting prediction:", error);
            toast.error("Error al guardar predicción");
        } finally {
            setSubmitting(false);
        }
    };

    // Get user's predictions
    const userPredictions = predictions.filter(p => p.user.name === userId);

    // Get available prediction types (not yet made by user)
    const madeTypes = new Set(userPredictions.map(p => p.type));
    const availableTypes = (Object.keys(PREDICTION_QUESTIONS) as PredictionType[])
        .filter(type => !madeTypes.has(type));

    // Show first available prediction
    if (!enabled || availableTypes.length === 0) return null;

    const currentType = availableTypes[0];
    const config = PREDICTION_QUESTIONS[currentType];
    const Icon = config.icon;

    // Generate options based on type
    const getOptions = (): string[] => {
        switch (currentType) {
            case "finish_time":
                return ["22:00", "23:00", "00:00", "01:00", "02:00+"];
            case "total_beers":
                return ["< 10", "10-20", "20-30", "30-40", "40+"];
            case "mvp":
            case "first_arrival":
                // TODO: Get actual participants
                return ["Participante 1", "Participante 2", "Participante 3"];
            default:
                return [];
        }
    };

    const options = getOptions();

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <Icon className={`w-5 h-5 text-${config.color}-500`} />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                        🔮 Predicción
                    </p>
                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                        {config.question}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-indigo-500 dark:text-indigo-400">Premio</p>
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                        +100
                    </p>
                </div>
            </div>

            {/* Options */}
            <div className="space-y-2 mb-3">
                {options.map((option) => (
                    <button
                        key={option}
                        onClick={() => handleMakePrediction(currentType, option)}
                        disabled={submitting}
                        className={`w-full p-3 rounded-lg font-semibold text-sm transition-all ${submitting
                                ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                                : "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-100 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:scale-[1.02] active:scale-95"
                            }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            {/* Progress */}
            <div className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 text-center">
                {userPredictions.length} / {Object.keys(PREDICTION_QUESTIONS).length} predicciones hechas
            </div>
        </div>
    );
}
