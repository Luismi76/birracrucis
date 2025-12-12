"use client";

import { useState } from "react";
import { MapPin, ChevronUp, ChevronDown, Plus, Minus, Clock, Beer, Navigation } from "lucide-react";

type Stop = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    plannedRounds: number;
};

type DevLocationControlProps = {
    activeStop: Stop | undefined;
    stops: Stop[];
    onSetPosition: (pos: { lat: number; lng: number }) => void;
    rounds: Record<string, number>;
    onSetRounds?: (stopId: string, count: number) => void;
    currentBarIndex: number;
    onTriggerCheckIn?: () => void;
};

export default function DevLocationControl({
    activeStop,
    stops,
    onSetPosition,
    rounds,
    onSetRounds,
    currentBarIndex,
    onTriggerCheckIn
}: DevLocationControlProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!activeStop) return null;

    const currentRounds = rounds[activeStop.id] || 0;
    const nextStop = stops[currentBarIndex + 1];

    return (
        <div className="fixed bottom-24 right-4 z-50 pointer-events-auto">
            {/* Panel expandido */}
            {isExpanded && (
                <div className="bg-slate-800 text-white rounded-2xl shadow-xl mb-2 p-3 w-64 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="text-xs font-bold text-slate-400 mb-2">🛠️ DEV TOOLS</div>

                    {/* Teleport a bares */}
                    <div className="space-y-1 mb-3">
                        <div className="text-[10px] uppercase text-slate-500 font-semibold">Teleport</div>
                        {stops.map((stop, idx) => (
                            <button
                                key={stop.id}
                                onClick={() => onSetPosition({ lat: stop.lat, lng: stop.lng })}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all ${
                                    idx === currentBarIndex
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-700 hover:bg-slate-600'
                                }`}
                            >
                                <MapPin className="w-3 h-3" />
                                <span className="truncate flex-1">{stop.name}</span>
                                <span className="text-slate-400">#{idx + 1}</span>
                            </button>
                        ))}
                    </div>

                    {/* Control de rondas */}
                    {onSetRounds && (
                        <div className="mb-3">
                            <div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Rondas en {activeStop.name}</div>
                            <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-2">
                                <button
                                    onClick={() => onSetRounds(activeStop.id, Math.max(0, currentRounds - 1))}
                                    className="p-1.5 bg-slate-600 rounded hover:bg-slate-500 transition-colors"
                                    disabled={currentRounds <= 0}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <div className="flex-1 text-center">
                                    <span className="text-lg font-bold">{currentRounds}</span>
                                    <span className="text-slate-400 text-sm">/{activeStop.plannedRounds}</span>
                                </div>
                                <button
                                    onClick={() => onSetRounds(activeStop.id, currentRounds + 1)}
                                    className="p-1.5 bg-slate-600 rounded hover:bg-slate-500 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex gap-1 mt-1">
                                <button
                                    onClick={() => onSetRounds(activeStop.id, 0)}
                                    className="flex-1 text-[10px] py-1 bg-slate-700 rounded hover:bg-slate-600"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => onSetRounds(activeStop.id, activeStop.plannedRounds)}
                                    className="flex-1 text-[10px] py-1 bg-emerald-600 rounded hover:bg-emerald-500"
                                >
                                    Completar
                                </button>
                                <button
                                    onClick={() => onSetRounds(activeStop.id, activeStop.plannedRounds + 2)}
                                    className="flex-1 text-[10px] py-1 bg-amber-600 rounded hover:bg-amber-500"
                                >
                                    +Extra
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Acciones rápidas */}
                    <div className="space-y-1">
                        <div className="text-[10px] uppercase text-slate-500 font-semibold">Acciones</div>
                        {nextStop && (
                            <button
                                onClick={() => onSetPosition({ lat: nextStop.lat, lng: nextStop.lng })}
                                className="w-full px-2 py-1.5 bg-blue-600 rounded-lg text-xs flex items-center gap-2 hover:bg-blue-500"
                            >
                                <Navigation className="w-3 h-3" />
                                Ir a siguiente bar ({nextStop.name})
                            </button>
                        )}
                        {/* Simular fin de ruta */}
                        {stops.length > 0 && (
                            <button
                                onClick={() => {
                                    const lastStop = stops[stops.length - 1];
                                    onSetPosition({ lat: lastStop.lat, lng: lastStop.lng });
                                    if (onSetRounds) {
                                        // Completar todas las rondas de todos los bares
                                        stops.forEach(stop => {
                                            onSetRounds(stop.id, stop.plannedRounds);
                                        });
                                    }
                                }}
                                className="w-full px-2 py-1.5 bg-purple-600 rounded-lg text-xs flex items-center gap-2 hover:bg-purple-500"
                            >
                                <Navigation className="w-3 h-3" />
                                🏆 Simular fin de ruta
                            </button>
                        )}
                        {onTriggerCheckIn && (
                            <button
                                onClick={onTriggerCheckIn}
                                className="w-full px-2 py-1.5 bg-green-600 rounded-lg text-xs flex items-center gap-2 hover:bg-green-500"
                            >
                                <Beer className="w-3 h-3" />
                                Forzar Check-in
                            </button>
                        )}
                    </div>

                    {/* Estado actual */}
                    <div className="mt-3 pt-2 border-t border-slate-700 text-[10px] text-slate-400">
                        <div>Bar: {currentBarIndex + 1}/{stops.length}</div>
                        <div>Rondas: {currentRounds}/{activeStop.plannedRounds} {currentRounds >= activeStop.plannedRounds && activeStop.plannedRounds > 0 && '✓'}</div>
                    </div>
                </div>
            )}

            {/* Botón principal */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-3 rounded-full shadow-lg transition-all flex items-center gap-2 ${
                    isExpanded ? 'bg-slate-700 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
                title="Dev Tools"
            >
                <MapPin className="w-5 h-5" />
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
        </div>
    );
}
