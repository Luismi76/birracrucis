"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { BarConfig } from "./types";

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (config: RouteConfig) => void;
    selectedBars: Map<string, BarConfig>;
    orderedIds: string[];
    routeDistance: number | null;
    routeDuration: number | null;
    suggestedName: string;
    loading: boolean;
}

export interface RouteConfig {
    name: string;
    date: string;
    startTime: string;
    startMode: "manual" | "scheduled" | "all_present";
    potEnabled: boolean;
    potAmount: number;
}

// Generar hora sugerida (próxima hora en punto)
function suggestStartTime(): string {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    return format(now, 'HH:mm');
}

// Generar fecha de hoy
function getTodayDate(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

export default function ConfigModal({
    isOpen,
    onClose,
    onSubmit,
    selectedBars,
    orderedIds,
    routeDistance,
    routeDuration,
    suggestedName,
    loading,
}: ConfigModalProps) {
    const [name, setName] = useState(suggestedName);
    const [date, setDate] = useState(getTodayDate());
    const [startTime, setStartTime] = useState(suggestStartTime());
    const [waitForAll, setWaitForAll] = useState(false);
    const [potEnabled, setPotEnabled] = useState(false);
    const [potAmount, setPotAmount] = useState(20);

    // Actualizar nombre sugerido cuando cambia
    useEffect(() => {
        if (suggestedName && !name) {
            setName(suggestedName);
        }
    }, [suggestedName, name]);

    // Reset al abrir
    useEffect(() => {
        if (isOpen) {
            setDate(getTodayDate());
            setStartTime(suggestStartTime());
            if (!name) {
                setName(suggestedName);
            }
        }
    }, [isOpen, suggestedName, name]);

    const handleSubmit = () => {
        if (!name.trim()) return;

        onSubmit({
            name: name.trim(),
            date,
            startTime,
            startMode: waitForAll ? "all_present" : "scheduled",
            potEnabled,
            potAmount,
        });
    };

    const formatDistance = (meters: number | null) => {
        if (!meters) return "";
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)} km`;
        }
        return `${Math.round(meters)} m`;
    };

    const formatDuration = (minutes: number | null) => {
        if (!minutes) return "";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `~${hours}h ${mins > 0 ? `${mins}min` : ''}`;
        }
        return `~${mins} min`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-lg font-bold text-slate-800">Configurar Ruta</h2>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nombre de la ruta
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ej: Ruta por el centro"
                        />
                    </div>

                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                📅 Fecha
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                🕐 Hora inicio
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Esperar a todos */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <div className="font-medium text-slate-700">Esperar a todos</div>
                            <div className="text-sm text-slate-500">Empezar cuando todos lleguen</div>
                        </div>
                        <button
                            onClick={() => setWaitForAll(!waitForAll)}
                            className={`
                                w-12 h-7 rounded-full transition-colors relative
                                ${waitForAll ? 'bg-amber-500' : 'bg-slate-300'}
                            `}
                        >
                            <div
                                className={`
                                    absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform
                                    ${waitForAll ? 'translate-x-6' : 'translate-x-1'}
                                `}
                            />
                        </button>
                    </div>

                    <div className="border-t border-slate-200" />

                    {/* Bote común */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <div className="font-medium text-slate-700">💰 Bote común</div>
                                <div className="text-sm text-slate-500">Cada uno pone dinero al inicio</div>
                            </div>
                            <button
                                onClick={() => setPotEnabled(!potEnabled)}
                                className={`
                                    w-12 h-7 rounded-full transition-colors relative
                                    ${potEnabled ? 'bg-amber-500' : 'bg-slate-300'}
                                `}
                            >
                                <div
                                    className={`
                                        absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform
                                        ${potEnabled ? 'translate-x-6' : 'translate-x-1'}
                                    `}
                                />
                            </button>
                        </div>

                        {potEnabled && (
                            <div className="flex items-center gap-3 px-4">
                                <input
                                    type="number"
                                    value={potAmount}
                                    onChange={(e) => setPotAmount(parseInt(e.target.value) || 0)}
                                    min={1}
                                    className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-center font-bold text-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                />
                                <span className="text-slate-600">€ por persona</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-200" />

                    {/* Resumen */}
                    <div className="p-4 bg-amber-50 rounded-xl">
                        <div className="text-sm font-medium text-amber-800">
                            📊 Resumen de la ruta
                        </div>
                        <div className="mt-2 text-amber-700">
                            {orderedIds.length} bares
                            {routeDistance && routeDistance > 0 && (
                                <> · {formatDistance(routeDistance)}</>
                            )}
                            {routeDuration && routeDuration > 0 && (
                                <> · {formatDuration(routeDuration)} caminando</>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t p-6">
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim() || loading}
                        className={`
                            w-full py-4 rounded-2xl font-bold text-lg transition-all
                            ${name.trim() && !loading
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }
                        `}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                Creando...
                            </span>
                        ) : (
                            '🚀 Crear Ruta'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
