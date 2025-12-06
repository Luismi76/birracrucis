"use client";

import { Crown, Beer, Bell, SkipForward, ArrowRight, UserPlus, MapPin, Dices, Camera } from "lucide-react";

type InRouteActionsProps = {
    // Estado actual
    isAtBar: boolean;
    isRouteComplete: boolean;
    distToBar: number | null;

    // Acciones disponibles
    onCheckIn: () => void;
    onAddRound: () => void;
    onPhotoClick: () => void;
    onNudgeClick: () => void;
    onSpinClick: () => void; // NUEVO: Ruleta
    onSkipClick: () => void; // TODO: Implementar lógica de skip real
    onNextBarClick: () => void;
    onInviteClick: () => void; // Por si queremos mostrar botón de invitar
    onNavigate: () => void; // Nueva prop

    // Datos del bar actual
    barName: string;
    roundsCount: number;
    plannedRounds: number;
};

export default function InRouteActions({
    isAtBar,
    isRouteComplete,
    distToBar,
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
    plannedRounds
}: InRouteActionsProps) {

    // VISTA ÚNICA: BARRA SUPERIOR INFORMATIVA (Sin botones)
    return (
        <div className="w-full bg-white border-b border-slate-200 pointer-events-auto shadow-sm z-30 flex items-center justify-between p-2 gap-2">
            {/* Info Bar */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAtBar ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    {isAtBar ? <Beer className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">{isAtBar ? 'Estás en' : 'Ir a'}</p>
                    <h3 className="text-sm font-bold text-slate-800 truncate">{barName}</h3>
                </div>
            </div>

            {/* Distancia / Rondas */}
            <div className="flex-none px-2 text-right">
                {isAtBar ? (
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-slate-400 uppercase">Rondas</span>
                        <span className="text-sm font-black text-slate-900">{roundsCount}/{plannedRounds}</span>
                    </div>
                ) : (
                    <>
                        <span className="text-lg font-black text-slate-900">{distToBar ? distToBar : "?"}</span>
                        <span className="text-[10px] font-bold text-slate-500 ml-0.5">m</span>
                    </>
                )}
            </div>
        </div>
    );
}
