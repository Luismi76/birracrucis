"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BarPillProps {
    instanceId: string;
    name: string;
    isStart: boolean;
    plannedRounds: number;
    onRemove: () => void;
    onSetStart: () => void;
}

export default function BarPill({
    instanceId,
    name,
    isStart,
    plannedRounds,
    onRemove,
    onSetStart,
}: BarPillProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: instanceId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
                cursor-grab active:cursor-grabbing select-none shrink-0
                ${isStart
                    ? 'bg-amber-100 text-amber-800 border-2 border-amber-400'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }
                ${isDragging ? 'shadow-lg z-50' : 'hover:shadow-md'}
                transition-shadow
            `}
            {...attributes}
            {...listeners}
        >
            {/* Icono de inicio o número */}
            {isStart && (
                <span className="text-amber-600">🚩</span>
            )}

            {/* Nombre del bar (truncado) */}
            <span className="max-w-[100px] truncate">{name}</span>

            {/* Rondas planeadas */}
            <span className="text-xs opacity-60">🍺{plannedRounds}</span>

            {/* Botón para marcar como inicio */}
            {!isStart && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSetStart();
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-amber-200 text-xs"
                    title="Marcar como inicio"
                >
                    🚩
                </button>
            )}

            {/* Botón eliminar */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-red-200 text-slate-500 hover:text-red-600"
            >
                ×
            </button>
        </div>
    );
}
