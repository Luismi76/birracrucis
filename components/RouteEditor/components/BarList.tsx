"use client";

import type { BarConfig } from "../types";
import BarListItem from "./BarListItem";
import RouteOptimizer from "./RouteOptimizer";

interface BarListProps {
    orderedIds: string[];
    selectedBars: Map<string, BarConfig>;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDragEnd: () => void;
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    onToggleBar: (placeId: string) => void;
    onSetStartBar: (placeId: string) => void;
    onUpdateRounds: (placeId: string, field: "plannedRounds" | "maxRounds", value: string) => void;
    onUpdateStayDuration: (placeId: string, value: string) => void;
    arrivalTimes: Array<{ id: string; arrivalTime: Date; departureTime: Date }>;
    draggedId: string | null;

    // Para RouteOptimizer
    onOptimizeRoute: () => void;
    preOptimizeDistance: number | null;
    routeDistance: number | null;
    formatDistance: (meters: number) => string;


}

export default function BarList({
    orderedIds,
    selectedBars,
    onDragStart,
    onDragOver,
    onDragEnd,
    onMoveUp,
    onMoveDown,
    onToggleBar,
    onSetStartBar,
    onUpdateRounds,
    onUpdateStayDuration,
    arrivalTimes,
    draggedId,
    onOptimizeRoute,
    preOptimizeDistance,
    routeDistance,
    formatDistance,
}: BarListProps) {
    if (orderedIds.length === 0) {
        return (
            <section className="space-y-4">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <span className="bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm">3</span>
                    Selección y Configuración
                </h2>
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <div className="text-4xl mb-3">🍺</div>
                    <p className="text-slate-500 font-medium">No hay bares seleccionados</p>
                    <p className="text-sm text-slate-400 mt-1">Busca y añade bares para crear tu ruta</p>
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <span className="bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm">3</span>
                Selección y Configuración ({orderedIds.length})
            </h2>

            <div className="space-y-4">
                {/* Botón de optimización */}
                {orderedIds.length >= 2 && (
                    <RouteOptimizer
                        onOptimize={onOptimizeRoute}
                        preOptimizeDistance={preOptimizeDistance}
                        currentDistance={routeDistance}
                        formatDistance={formatDistance}
                        disabled={false}
                        barsCount={orderedIds.length}
                    />
                )}

                {/* Lista de bares */}
                <div className="space-y-3 pb-32">
                    {orderedIds.map((id, index) => {
                        const config = selectedBars.get(id);
                        if (!config) return null;

                        const timeInfo = arrivalTimes.find(a => a.id === id);

                        return (
                            <BarListItem
                                key={id}
                                bar={config}
                                index={index}
                                isFirst={index === 0}
                                isLast={index === orderedIds.length - 1}
                                isDragged={draggedId === id}
                                arrivalTime={timeInfo?.arrivalTime}
                                departureTime={timeInfo?.departureTime}
                                onDragStart={(e) => onDragStart(e, id)}
                                onDragOver={(e) => onDragOver(e, id)}
                                onDragEnd={onDragEnd}
                                onMoveUp={() => onMoveUp(index)}
                                onMoveDown={() => onMoveDown(index)}
                                onToggle={() => onToggleBar(id)}
                                onSetStart={() => onSetStartBar(id)}
                                onUpdateRounds={(field, value) => onUpdateRounds(id, field, value)}
                                onUpdateStayDuration={(value) => onUpdateStayDuration(id, value)}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
