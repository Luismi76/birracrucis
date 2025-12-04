"use client";

interface RouteOptimizerProps {
    onOptimize: () => void;
    preOptimizeDistance: number | null;
    currentDistance: number | null;
    formatDistance: (meters: number) => string;
    disabled: boolean;
    barsCount: number;
}

export default function RouteOptimizer({
    onOptimize,
    preOptimizeDistance,
    currentDistance,
    formatDistance,
    disabled,
    barsCount,
}: RouteOptimizerProps) {
    const showSavings = preOptimizeDistance !== null && currentDistance !== null && preOptimizeDistance > currentDistance;

    return (
        <div className="space-y-2">
            <button
                onClick={onOptimize}
                disabled={disabled || barsCount < 2}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-200 active:scale-95 flex items-center justify-center gap-2"
            >
                <span>✨</span> Optimizar Ruta
            </button>

            {showSavings && (
                <div className="bg-green-100 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="text-green-600 font-bold text-sm">
                        🎉 Ahorraste {Math.round(preOptimizeDistance - currentDistance)} m
                    </span>
                </div>
            )}
        </div>
    );
}
