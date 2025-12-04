"use client";

import type { BarConfig } from "../types";

interface BarListItemProps {
    bar: BarConfig;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    isDragged: boolean;
    arrivalTime?: Date;
    departureTime?: Date;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onToggle: () => void;
    onSetStart: () => void;
    onUpdateRounds: (field: "plannedRounds" | "maxRounds", value: string) => void;
    onUpdateStayDuration: (value: string) => void;
}

export default function BarListItem({
    bar,
    index,
    isFirst,
    isLast,
    isDragged,
    arrivalTime,
    departureTime,
    onDragStart,
    onDragOver,
    onDragEnd,
    onMoveUp,
    onMoveDown,
    onToggle,
    onSetStart,
    onUpdateRounds,
    onUpdateStayDuration,
}: BarListItemProps) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            className={`relative group bg-white border-2 rounded-xl p-3 shadow-sm cursor-move transition-all ${isDragged
                    ? "opacity-50 border-amber-400 rotate-2 scale-95"
                    : "border-slate-100 hover:border-amber-200 hover:shadow-md"
                } ${bar.isStart ? "border-amber-400 bg-amber-50/50" : ""}`}
        >
            {/* Conector visual (línea punteada) */}
            {!isLast && (
                <div className="absolute left-[1.65rem] top-[3.5rem] bottom-[-1rem] w-0.5 border-l-2 border-dashed border-slate-200 -z-10"></div>
            )}

            <div className="flex items-start gap-3">
                {/* Número de orden */}
                <div
                    className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${bar.isStart ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                >
                    {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header con nombre y controles */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-slate-800 truncate pr-2">{bar.bar.name}</h3>
                            <p className="text-xs text-slate-500 truncate">{bar.bar.address}</p>
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                            <button
                                onClick={onMoveUp}
                                disabled={isFirst}
                                className="text-slate-400 hover:text-amber-600 disabled:opacity-20 disabled:hover:text-slate-400"
                                title="Subir"
                            >
                                ▲
                            </button>
                            <button
                                onClick={onMoveDown}
                                disabled={isLast}
                                className="text-slate-400 hover:text-amber-600 disabled:opacity-20 disabled:hover:text-slate-400"
                                title="Bajar"
                            >
                                ▼
                            </button>
                        </div>
                        <button
                            onClick={onToggle}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Hora estimada de llegada */}
                    {arrivalTime && departureTime && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                🕐 {arrivalTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                {departureTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                    )}

                    {/* Configuración: Rondas, Tiempo, Inicio */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {/* Rondas planificadas */}
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <span className="text-xs">🍺</span>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={bar.plannedRounds}
                                onChange={(e) => onUpdateRounds("plannedRounds", e.target.value)}
                                className="w-8 text-sm bg-transparent text-center font-bold outline-none"
                            />
                        </div>

                        {/* Tiempo de estancia */}
                        <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                            <span className="text-xs">⏱️</span>
                            <input
                                type="number"
                                min="5"
                                max="120"
                                step="5"
                                value={bar.stayDuration}
                                onChange={(e) => onUpdateStayDuration(e.target.value)}
                                className="w-10 text-sm bg-transparent text-center font-bold outline-none text-blue-700"
                            />
                            <span className="text-xs text-blue-500">min</span>
                        </div>

                        {/* Marcar como inicio */}
                        <label
                            className={`flex items-center gap-1 text-xs font-medium cursor-pointer px-2 py-1 rounded-lg border transition-colors ${bar.isStart
                                    ? "bg-amber-100 text-amber-700 border-amber-200"
                                    : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                }`}
                        >
                            <input
                                type="radio"
                                name="startBar"
                                checked={bar.isStart}
                                onChange={onSetStart}
                                className="hidden"
                            />
                            <span>{bar.isStart ? "🚩 Inicio" : "🏁 Aquí"}</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
