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
            className={`
                relative group bg-white border-2 rounded-xl shadow-sm cursor-move transition-all overflow-hidden
                ${isDragged
                    ? "opacity-50 border-amber-400 rotate-2 scale-95"
                    : "border-slate-100 hover:border-amber-200 hover:shadow-md"
                } 
                ${bar.isStart ? "border-amber-400 bg-amber-50/30" : ""}
            `}
        >
            {/* Conector visual (línea punteada) - Ajustado para no solapar */}
            {!isLast && (
                <div className="absolute left-[1.65rem] top-[4rem] bottom-[-2rem] w-0.5 border-l-2 border-dashed border-slate-200 -z-10"></div>
            )}

            <div className="flex min-h-[140px]">
                {/* 1. Área Principal de Contenido (Izquierda) */}
                <div className="flex-1 p-3 pb-4 pr-12 flex flex-col gap-3">

                    {/* Header: Badge + Info */}
                    <div className="flex items-start gap-3">
                        <div
                            className={`
                                shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm
                                ${bar.isStart ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"}
                            `}
                        >
                            {index + 1}
                        </div>

                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-800 text-base leading-tight truncate">{bar.bar.name}</h3>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{bar.bar.address}</p>

                            {/* Tiempos (si existen) */}
                            {arrivalTime && departureTime && (
                                <div className="mt-2 inline-flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                                    <span className="text-xs font-semibold text-slate-600">
                                        {arrivalTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    <span className="text-slate-300">→</span>
                                    <span className="text-xs font-semibold text-slate-600">
                                        {departureTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controles de Configuración (Rondas, Duración, Inicio) */}
                    <div className="flex flex-wrap items-center gap-2 mt-auto">
                        {/* Rondas */}
                        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                            <span className="px-2 text-xs border-r border-slate-200 bg-slate-100 h-full flex items-center">🍺</span>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={bar.plannedRounds}
                                onChange={(e) => onUpdateRounds("plannedRounds", e.target.value)}
                                className="w-10 py-2 text-center text-sm font-bold bg-transparent outline-none focus:bg-amber-50 transition-colors"
                            />
                        </div>

                        {/* Duración */}
                        <div className="flex items-center bg-blue-50 rounded-lg border border-blue-100 overflow-hidden text-blue-700">
                            <span className="px-2 text-xs border-r border-blue-100 bg-blue-100/50 h-full flex items-center">⏱️</span>
                            <input
                                type="number"
                                min="5"
                                max="180"
                                step="5"
                                value={bar.stayDuration}
                                onChange={(e) => onUpdateStayDuration(e.target.value)}
                                className="w-12 py-2 text-center text-sm font-bold bg-transparent outline-none focus:bg-white transition-colors"
                            />
                            <span className="pr-2 text-[10px] font-bold opacity-60">min</span>
                        </div>

                        {/* Toggle Inicio */}
                        <button
                            onClick={onSetStart}
                            className={`
                                ml-auto px-3 py-2 rounded-lg text-xs font-bold border transition-all active:scale-95
                                ${bar.isStart
                                    ? "bg-amber-100 text-amber-700 border-amber-200 shadow-sm"
                                    : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                }
                            `}
                        >
                            {bar.isStart ? "🚩 Inicio" : "🏁 Aquí"}
                        </button>
                    </div>
                </div>

                {/* 2. Botón Eliminar (Absoluto Top-Right) */}
                <button
                    onClick={onToggle}
                    className="absolute top-0 right-0 p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-bl-xl transition-all z-10"
                    title="Eliminar parada"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* 3. Columna Lateral de Ordenación (Derecha) */}
                <div className="w-12 flex flex-col border-l border-slate-100 bg-slate-50/50">
                    <button
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className="flex-1 flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-20 disabled:hover:bg-transparent transition-colors active:bg-amber-100"
                        title="Mover arriba"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="h-px bg-slate-200"></div>
                    <button
                        onClick={onMoveDown}
                        disabled={isLast}
                        className="flex-1 flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-20 disabled:hover:bg-transparent transition-colors active:bg-amber-100"
                        title="Mover abajo"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
