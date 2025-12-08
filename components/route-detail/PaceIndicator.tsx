"use client";

type PaceIndicatorProps = {
    minutesAhead: number; // Positivo = adelantados, Negativo = retrasados
    show?: boolean;
};

export default function PaceIndicator({ minutesAhead, show = true }: PaceIndicatorProps) {
    if (!show || minutesAhead === 0) return null;

    const isAhead = minutesAhead > 0;
    const isOnTime = Math.abs(minutesAhead) < 5;

    if (isOnTime) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                    <p className="text-sm font-bold text-green-800">Ritmo perfecto</p>
                    <p className="text-xs text-green-600">Vais según lo planeado</p>
                </div>
            </div>
        );
    }

    if (isAhead) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">🐇</span>
                <div className="flex-1">
                    <p className="text-sm font-bold text-blue-800">Ritmo rápido</p>
                    <p className="text-xs text-blue-600">
                        +{Math.abs(minutesAhead)} min adelantados
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">🐢</span>
            <div className="flex-1">
                <p className="text-sm font-bold text-orange-800">Ritmo lento</p>
                <p className="text-xs text-orange-600">
                    -{Math.abs(minutesAhead)} min retrasados
                </p>
            </div>
        </div>
    );
}
