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
        question: "¿Cuántas cervezas tomaremos?",
        icon: TrendingUp,
        color: "green",
    },
    mvp: {
        question: "¿Quién será el MVP?",
        icon: Trophy,
        color: "amber",
    },
    first_arrival: {
        question: "¿Quién llegará primero?",
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
                return ["Participante 1", "Participante 2", "Participante 3"];
            default:
                return [];
        }
    };

    const options = getOptions();

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-2.5">
            {/* Header compacto */}
            <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
                    <Icon className={`w-3.5 h-3.5 text-${config.color}-500`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                        🔮 Predicción
                    </p>
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-100 truncate">
                        {config.question}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[9px] text-indigo-500 dark:text-indigo-400">Premio</p>
                    <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                        +100
                    </p>
                </div>
            </div>

            {/* Options compactas - grid 2 columnas */}
            <div className="grid grid-cols-2 gap-1.5 mb-2">
                {options.slice(0, 4).map((option) => (
                    <button
                        key={option}
                        onClick={() => handleMakePrediction(currentType, option)}
                        disabled={submitting}
                        className={`p-2 rounded-lg font-semibold text-[10px] transition-all ${submitting
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                            : "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-600 active:scale-95"
                            }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            {/* Progress compacto */}
            <div className="text-[9px] text-indigo-600 dark:text-indigo-400 text-center">
                {userPredictions.length} / {Object.keys(PREDICTION_QUESTIONS).length} hechas
            </div>
        </div>
    );
}
