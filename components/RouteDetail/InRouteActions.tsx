"use client";

import { Crown, Beer, Bell, SkipForward, ArrowRight, UserPlus, MapPin, Dices, Camera, Flag } from "lucide-react";

type InRouteActionsProps = {
    // Estado actual
    isAtBar: boolean;
    isRouteComplete: boolean;
    distToBar: number | null;
    routeStatus: string; // NUEVO: Para saber si está completada

    // Acciones disponibles
    onCheckIn: () => void;
    onAddRound: () => void;
    onPhotoClick: () => void;
    onNudgeClick: () => void;
    onSpinClick: () => void;
    onSkipClick: () => void;
    onNextBarClick: () => void;
    onInviteClick: () => void;
    onNavigate: () => void;
    onFinishClick?: () => void; // Finalizar ruta (solo creator)

    // Datos del bar actual
    barName: string;
    roundsCount: number;
    plannedRounds: number;

    // Usuario
    currentUser?: {
        name?: string | null;
        image?: string | null;
    };
};

export default function InRouteActions({
    isAtBar,
    isRouteComplete,
    distToBar,
    routeStatus,
    onCheckIn,
    onAddRound,
    onPhotoClick,
    onNudgeClick,
    onSpinClick,
    onSkipClick,
    onNextBarClick,
    onNavigate,
    barName,
    roundsCount,
    plannedRounds,
    currentUser,
    onFinishClick
}: InRouteActionsProps) {

    // VISTA ÚNICA: BARRA SUPERIOR INFORMATIVA (Sin botones)
    return (
        <div className="w-full bg-white border-b border-slate-200 pointer-events-auto shadow-sm z-30 flex items-center justify-between p-2 gap-2">
            {/* Finish Button (Only for Creator AND route not completed) */}
            {onFinishClick && routeStatus !== "completed" ? (
                <button
                    onClick={onFinishClick}
                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center active:scale-95 transition-transform border border-red-200 flex-none"
                    title="Finalizar Ruta"
                >
                    <Flag className="w-4 h-4" />
                </button>
            ) : (
                <div className="w-8" />
            )}

            {/* Info Bar */}
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-center text-center">
                {/* Simplified to just show Bar Name prominently */}
                <div className="min-w-0 flex flex-col items-center">
                    {isAtBar && <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">ESTÁS EN</p>}
                    <h3 className="text-sm font-black text-slate-800 truncate max-w-[200px] leading-tight">{barName}</h3>
                </div>
            </div>

            {/* Distancia / Rondas */}
            <div className="flex-none px-2 text-right">
                {isAtBar ? (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Rondas</span>
                        <span className="text-sm font-black text-slate-900 leading-none">{roundsCount}/{plannedRounds}</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">A</span>
                        <div>
                            <span className="text-lg font-black text-slate-900 leading-none">{distToBar ? distToBar : "?"}</span>
                            <span className="text-[10px] font-bold text-slate-500 ml-0.5">m</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
