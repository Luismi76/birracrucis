"use client";

import type { BarConfig } from "../types";

interface ReviewStepProps {
    name: string;
    date: string;
    startMode: string;
    startTime: string;
    hasEndTime: boolean;
    endTime: string;
    defaultStayDuration: number;
    isPublic: boolean;
    orderedIds: string[];
    selectedBars: Map<string, BarConfig>;
    routeDistance: number | null;
    routeDuration: number | null;
    isDiscovery?: boolean;
}

export default function ReviewStep({
    name,
    date,
    startMode,
    startTime,
    hasEndTime,
    endTime,
    defaultStayDuration,
    isPublic,
    orderedIds,
    selectedBars,
    routeDistance,
    routeDuration,
    isDiscovery
}: ReviewStepProps) {
    const bars = orderedIds.map(id => selectedBars.get(id)).filter(Boolean);
    const startBar = bars.find(b => b?.isStart);

    // Format Date
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    // Format Start Time
    let startTimeDisplay = "Manual";
    if (startMode === 'scheduled' || startMode === 'all_present') {
        startTimeDisplay = startTime || "--:--";
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold text-slate-800">✅ ¡Todo listo!</h2>
                <p className="text-slate-500">Revisa que no se nos olvida nada</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-800">{name}</h3>
                    <div className="flex items-center gap-2 text-slate-600 mt-1 capitalize">
                        <span>📅</span> {dateStr}
                    </div>
                    {isPublic && (
                        <div className="inline-flex items-center gap-1 mt-3 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                            <span>🌍</span> Ruta Pública
                        </div>
                    )}
                    {isDiscovery && (
                        <div className="inline-flex items-center gap-1 mt-3 ml-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                            <span>🧭</span> Modo Aventura
                        </div>
                    )}
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100/50">
                            <div className="text-xs text-blue-600 font-bold uppercase mb-1">Inicio</div>
                            <div className="font-bold text-slate-800 text-lg">{startTimeDisplay}</div>
                            <div className="text-xs text-slate-500 capitalize">{startMode === 'all_present' ? 'Todos listos' : startMode === 'manual' ? 'Manual' : 'Hora fija'}</div>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100/50">
                            <div className="text-xs text-amber-600 font-bold uppercase mb-1">Ritmo</div>
                            <div className="font-bold text-slate-800 text-lg">{defaultStayDuration} min</div>
                            <div className="text-xs text-slate-500">por parada</div>
                        </div>
                    </div>

                    <div>
                        <div className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex justify-between items-center">
                            <span>Recorrido ({bars.length} paradas)</span>
                            {routeDistance && (
                                <span className="text-amber-600 text-xs">{(routeDistance / 1000).toFixed(1)} km a pie</span>
                            )}
                        </div>

                        {bars.length === 0 && isDiscovery ? (
                            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                                <p className="font-medium">🧭 Sin paradas planificadas</p>
                                <p className="text-xs mt-1">Los bares se detectarán automáticamente cuando estés cerca.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 relative">
                                {/* Línea conectora */}
                                <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-200 -z-10"></div>

                                {bars.map((bar, index) => (
                                    <div key={`bar-${index}`} className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${bar!.isStart ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0 p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                                            <div className="font-bold text-slate-800 truncate">{bar!.bar.name}</div>
                                            <div className="text-xs text-slate-500 truncate">{bar!.bar.address}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>


            <p className="text-center text-xs text-slate-400">
                Podrás editar todo esto más tarde si cambias de opinión.
            </p>
        </div>
    );
}
