"use client";

import { Clock, Users, TrendingUp } from "lucide-react";

type RouteProgressHeaderProps = {
    routeName: string;
    currentBarIndex: number;
    totalBars: number;
    activeParticipants: number;
    completionPercent: number;
    estimatedFinishTime: string | null;
    timeRemaining: string | null;
};

export default function RouteProgressHeader({
    routeName,
    currentBarIndex,
    totalBars,
    activeParticipants,
    completionPercent,
    estimatedFinishTime,
    timeRemaining,
}: RouteProgressHeaderProps) {
    const currentTime = new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 text-white px-4 py-3 shadow-lg relative">
            {/* Línea 1: Nombre y hora */}
            <div className="flex items-center justify-between mb-2">
                <h1 className="font-bold text-lg truncate flex-1">{routeName}</h1>

                <div className="flex items-center gap-2">
                    {/* Hora actual */}
                    <div className="flex items-center gap-1 text-sm bg-white/20 dark:bg-white/10 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>{currentTime}</span>
                    </div>
                </div>
            </div>

            {/* Línea 2: Stats */}
            <div className="flex items-center gap-3 text-xs mb-2">
                <div className="flex items-center gap-1">
                    <span className="font-bold">Bar {currentBarIndex + 1}</span>
                    <span className="opacity-75">de {totalBars}</span>
                </div>
                <div className="w-px h-3 bg-white/30" />
                <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{activeParticipants}</span>
                </div>
                {estimatedFinishTime && (
                    <>
                        <div className="w-px h-3 bg-white/30" />
                        <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>ETA: {estimatedFinishTime}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Línea 3: Barra de progreso */}
            <div className="space-y-1">
                <div className="w-full bg-white/20 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-white dark:bg-slate-100 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${completionPercent}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] opacity-75">
                    <span>{Math.round(completionPercent)}% completado</span>
                    {timeRemaining && <span>{timeRemaining} restante</span>}
                </div>
            </div>
        </div>
    );
}
