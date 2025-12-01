"use client";

type Stop = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    plannedRounds: number;
};

type BarPrices = {
    beer: number;
    tapa: number;
};

type RoutePassportProps = {
    stops: Stop[];
    activeStopId: string | null;
    isRouteComplete: boolean;
    rounds: Record<string, number>;
    beers: Record<string, number>;
    tapas: Record<string, number>;
    barPrices: Record<string, BarPrices>;
    totalSpent: number;
    totalBeers: number;
    totalTapas: number;
    showDebug: boolean;
    onTeleport?: (lat: number, lng: number) => void;
};

const DEFAULT_BEER_PRICE = 1.5;
const DEFAULT_TAPA_PRICE = 3.0;

export default function RoutePassport({
    stops,
    activeStopId,
    isRouteComplete,
    rounds,
    beers,
    tapas,
    barPrices,
    totalSpent,
    totalBeers,
    totalTapas,
    showDebug,
    onTeleport,
}: RoutePassportProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span>🗺️</span> Tu Pasaporte
            </h3>
            <div className="space-y-0 relative">
                <div className="absolute left-[1.15rem] top-2 bottom-2 w-0.5 bg-slate-100 -z-10"></div>

                {stops.map((stop, index) => {
                    const isCurrent = stop.id === activeStopId && !isRouteComplete;
                    const roundCount = rounds[stop.id] || 0;
                    const isDone = roundCount >= stop.plannedRounds;
                    const stopBeers = beers[stop.id] || 0;
                    const stopTapas = tapas[stop.id] || 0;
                    const stopPrices = barPrices[stop.id] || { beer: DEFAULT_BEER_PRICE, tapa: DEFAULT_TAPA_PRICE };
                    const stopSpent = stopBeers * stopPrices.beer + stopTapas * stopPrices.tapa;

                    return (
                        <div
                            key={stop.id}
                            className={`flex items-start gap-3 py-3 ${isCurrent ? "scale-105 origin-left transition-transform" : "opacity-80"}`}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 shrink-0 transition-colors ${
                                    isDone
                                        ? "bg-green-500 border-green-100 text-white"
                                        : isCurrent
                                          ? "bg-amber-500 border-amber-100 text-white animate-bounce-slow"
                                          : "bg-white border-slate-200 text-slate-400"
                                }`}
                            >
                                {isDone ? "✓" : index + 1}
                            </div>

                            <div className="flex-1 min-w-0 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-bold truncate ${isCurrent ? "text-slate-900" : "text-slate-600"}`}>
                                        {stop.name}
                                    </h4>
                                    <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            isDone ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                                        }`}
                                    >
                                        {roundCount}/{stop.plannedRounds}
                                    </span>
                                </div>

                                {/* Mini resumen del bar */}
                                {(stopBeers > 0 || stopTapas > 0) && (
                                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                                        {stopBeers > 0 && <span>🍺 {stopBeers}</span>}
                                        {stopTapas > 0 && <span>🍢 {stopTapas}</span>}
                                        <span className="text-green-600 font-medium">{stopSpent.toFixed(2)}€</span>
                                    </div>
                                )}

                                {showDebug && onTeleport && (
                                    <button
                                        onClick={() => onTeleport(stop.lat, stop.lng)}
                                        className="mt-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                    >
                                        📍 Teleport
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Resumen total de gastos */}
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-green-800">Total gastado</span>
                    <span className="text-2xl font-black text-green-600">{totalSpent.toFixed(2)}€</span>
                </div>
                <div className="mt-1 text-xs text-green-600">
                    🍺 {totalBeers} cervezas · 🍢 {totalTapas} tapas
                </div>
            </div>
        </div>
    );
}
