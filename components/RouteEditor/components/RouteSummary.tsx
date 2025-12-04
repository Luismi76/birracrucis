"use client";

interface RouteSummaryProps {
    selectedBarsCount: number;
    routeDistance: number | null;
    totalTimes: { totalStayTime: number; walkTime: number; total: number };
    formatDistance: (meters: number) => string;
    startTime: string;
    arrivalTimes: Array<{ id: string; arrivalTime: Date; departureTime: Date }>;
    hasEndTime: boolean;
    endTime: string;
}

export default function RouteSummary({
    selectedBarsCount,
    routeDistance,
    totalTimes,
    formatDistance,
    startTime,
    arrivalTimes,
    hasEndTime,
    endTime,
}: RouteSummaryProps) {
    if (selectedBarsCount === 0) return null;

    const estimatedEndTime = arrivalTimes.length > 0
        ? arrivalTimes[arrivalTimes.length - 1]?.departureTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        : null;

    const isLate = hasEndTime && endTime && estimatedEndTime && estimatedEndTime > endTime;

    return (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-3 space-y-3">
            {/* Tiempos */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <div className="text-xs text-slate-500 font-medium">🍺 En bares</div>
                    <div className="text-lg font-bold text-slate-800">{totalTimes.totalStayTime} min</div>
                </div>
                <div>
                    <div className="text-xs text-slate-500 font-medium">🚶 Caminando</div>
                    <div className="text-lg font-bold text-slate-800">{totalTimes.walkTime} min</div>
                </div>
                <div>
                    <div className="text-xs text-slate-500 font-medium">⏱️ Total</div>
                    <div className="text-lg font-bold text-amber-600">
                        {Math.floor(totalTimes.total / 60)}h {totalTimes.total % 60}m
                    </div>
                </div>
            </div>

            {/* Distancia total */}
            {routeDistance !== null && (
                <div className="text-center text-xs text-slate-500 border-t border-blue-100 pt-2">
                    📍 {formatDistance(routeDistance)} de recorrido
                </div>
            )}

            {/* Horarios */}
            {startTime && arrivalTimes.length > 0 && (
                <div className="bg-white rounded-lg p-2 border border-blue-100">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">🚀 Inicio:</span>
                        <span className="font-bold text-slate-800">{startTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">🏁 Fin estimado:</span>
                        <span className="font-bold text-slate-800">{estimatedEndTime}</span>
                    </div>
                    {hasEndTime && endTime && (
                        <div className="flex justify-between text-sm mt-1 pt-1 border-t border-blue-50">
                            <span className="text-slate-600">🍽️ Reserva:</span>
                            <span className={`font-bold ${isLate ? "text-red-600" : "text-green-600"}`}>
                                {endTime}
                                {isLate ? " ⚠️ ¡Vais tarde!" : " ✅"}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
