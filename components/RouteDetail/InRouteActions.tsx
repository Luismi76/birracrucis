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
    onInviteClick,
    onNavigate,
    barName,
    roundsCount,
    plannedRounds
}: InRouteActionsProps) {

    // CASO 0: Ruta Completada
    if (isRouteComplete) {
        return (
            <div className="p-4 bg-white/95 backdrop-blur rounded-3xl m-4 shadow-2xl border border-white/50 animate-slide-up">
                <div className="text-center mb-3">
                    <h2 className="text-xl font-black text-slate-900">🎉 ¡Ruta Completada!</h2>
                </div>
                <button className="w-full py-3 bg-green-600 text-white rounded-2xl text-lg font-bold shadow-lg shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <span>💸</span> Ver Cuentas
                </button>
            </div>
        );
    }

    // CASO 1: En camino al bar (Top Toolbar)
    if (!isAtBar) {
        return (
            <div className="w-full bg-white border-b border-slate-200 pointer-events-auto shadow-sm z-30 flex items-center justify-between p-2 gap-2">
                {/* Info Destino (Compacto) */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Ir a</p>
                        <h3 className="text-sm font-bold text-slate-800 truncate">{barName}</h3>
                    </div>
                </div>

                {/* Distancia */}
                <div className="flex-none px-2 text-right">
                    <span className="text-lg font-black text-slate-900">{distToBar ? distToBar : "?"}</span>
                    <span className="text-[10px] font-bold text-slate-500 ml-0.5">m</span>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 flex-none">
                    <button
                        onClick={onPhotoClick}
                        className="p-2.5 bg-slate-100 text-slate-600 rounded-lg active:scale-95 transition-all"
                    >
                        <Camera className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onNavigate}
                        className="py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-bold active:scale-95 transition-all flex items-center gap-1.5"
                    >
                        <MapPin className="w-4 h-4" />
                        <span>Ir</span>
                    </button>
                    <button
                        onClick={onCheckIn}
                        className="py-2 px-3 bg-slate-900 text-white rounded-lg text-sm font-bold active:scale-95 transition-all flex items-center gap-1.5"
                    >
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span>Llegué</span>
                    </button>
                </div>
            </div>
        );
    }

    // CASO 2: En el bar (Top Toolbar)
    const isOverRounds = roundsCount >= plannedRounds;

    return (
        <div className="w-full bg-white border-b border-slate-200 pointer-events-auto shadow-sm z-30 flex items-center justify-between p-2 gap-2">

            {/* Izquierda: Info Bar y Rondas */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-none">
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg border border-amber-100">
                        <Beer className="w-3.5 h-3.5 fill-amber-500" />
                        <span className="text-xs font-black">{roundsCount}/{plannedRounds}</span>
                    </div>
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Estás en</p>
                    <h3 className="text-sm font-bold text-slate-800 truncate">{barName}</h3>
                </div>
            </div>

            {/* Derecha: Botón Principal + Acciones */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onSpinClick}
                    className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100 active:scale-95 transition-all"
                >
                    <Dices className="w-5 h-5" />
                </button>
                <button
                    onClick={onAddRound}
                    className="py-2 px-3 bg-amber-500 text-white rounded-lg text-sm font-bold shadow-sm shadow-amber-200 active:scale-95 transition-all flex items-center gap-1.5"
                >
                    <Beer className="w-4 h-4 fill-white/20" />
                    <span>Ronda</span>
                </button>
            </div>
        </div>
    );
}
