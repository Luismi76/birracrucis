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

    // CASO 1: En camino al bar (Lejos)
    if (!isAtBar) {
        return (
            <div className="w-full bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-white/50 p-3 flex items-center justify-between gap-2 animate-slide-up">
                {/* Info Destino (Compacto) */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 shadow-sm">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Ir a</p>
                        <h3 className="text-base font-bold text-slate-900 truncate">{barName}</h3>
                    </div>
                </div>

                {/* Distancia */}
                <div className="flex-none px-2 text-right">
                    <span className="text-xl font-black text-slate-900">{distToBar ? distToBar : "?"}</span>
                    <span className="text-xs font-bold text-slate-500 ml-0.5">m</span>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 flex-none">
                    <button
                        onClick={onNavigate}
                        className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onCheckIn}
                        className="py-2.5 px-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span>Llegué</span>
                    </button>
                </div>
            </div>
        );
    }

    // CASO 2: En el bar (Listo para la acción)
    const isOverRounds = roundsCount >= plannedRounds;

    return (
        <div className="w-full bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-white/50 p-2 animate-slide-up">
            <div className="flex items-center gap-2">
                {/* Botón Gigante: PEDIR RONDA */}
                <button
                    onClick={onAddRound}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-lg font-black shadow-md shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                >
                    <Beer className="w-5 h-5 fill-white/20" />
                    <span>¡OTRA RONDA!</span>
                </button>

                {/* Acciones Secundarias (Iconos) */}
                <div className="flex gap-2">
                    <button
                        onClick={onPhotoClick}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-xl active:bg-slate-100 active:scale-95 transition-all"
                    >
                        <Camera className="w-5 h-5 text-slate-700" />
                    </button>
                    <button
                        onClick={onSpinClick}
                        className="p-3 bg-purple-50 border border-purple-100 rounded-xl active:bg-purple-100 active:scale-95 transition-all"
                    >
                        <Dices className="w-5 h-5 text-purple-600" />
                    </button>
                    <button
                        onClick={onNudgeClick}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-xl active:bg-slate-100 active:scale-95 transition-all"
                    >
                        <Bell className="w-5 h-5 text-slate-700" />
                    </button>
                    <button
                        onClick={onNextBarClick}
                        className={`p-3 border rounded-xl active:scale-95 transition-all ${isOverRounds ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-50 border-slate-100 text-slate-400"}`}
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
            {isOverRounds && (
                <div className="mt-1 text-center">
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        ✅ Rondas cumplidas
                    </span>
                </div>
            )}
        </div>
    );
}
