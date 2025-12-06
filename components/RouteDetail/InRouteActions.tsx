"use client";

import { Crown, Beer, Camera, Bell, SkipForward, ArrowRight, UserPlus, MapPin } from "lucide-react";

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
            <div className="p-3 bg-white/95 backdrop-blur rounded-3xl m-4 shadow-2xl border border-white/50 animate-slide-up">
                {/* Info de distancia (Compacta) */}
                <div className="flex items-center justify-between mb-3 px-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Destino</p>
                            <h3 className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{barName}</h3>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <span className="text-xl font-black text-slate-900">{distToBar ? distToBar : "?"}</span>
                        <span className="text-[10px] font-bold text-slate-500 ml-1">m</span>
                    </div>
                </div>

                {/* Botones de Acción (Grid Compacto) */}
                <div className="flex gap-2">
                    {/* 1. NAVEGAR */}
                    <button
                        onClick={onNavigate}
                        className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-base font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <MapPin className="w-5 h-5" />
                        <span>Ir</span>
                    </button>

                    {/* 2. HE LLEGADO (Check-in Manual) */}
                    <button
                        onClick={onCheckIn}
                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-base font-bold shadow-xl shadow-slate-300 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Crown className="w-5 h-5 text-amber-500" />
                        <span>Ya estoy</span>
                    </button>
                </div>
            </div>
        );
    }

    // CASO 2: En el bar (Listo para la acción)
    const isOverRounds = roundsCount >= plannedRounds;

    return (
        <div className="p-3 bg-white/95 backdrop-blur rounded-3xl m-4 shadow-2xl border border-white/50 animate-slide-up space-y-2">

            {/* Botón Gigante: PEDIR RONDA (Ligeramente más compacto) */}
            <button
                onClick={onAddRound}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl text-xl font-black shadow-xl shadow-amber-200 active:scale-95 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Beer className="w-6 h-6 fill-white/20" />
                <span className="relative z-10">¡OTRA RONDA! 🍻</span>
            </button>

            {/* Grid de Acciones Secundarias (Más bajitas) */}
            <div className="grid grid-cols-3 gap-2">
                {/* Foto */}
                <button
                    onClick={onPhotoClick}
                    className="py-2 flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-xl active:bg-slate-100 active:scale-95 transition-all"
                >
                    <Camera className="w-5 h-5 text-slate-700 mb-0.5" />
                    <span className="text-[10px] font-bold text-slate-600">Foto</span>
                </button>

                {/* Meter Prisa */}
                <button
                    onClick={onNudgeClick}
                    className="py-2 flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-xl active:bg-slate-100 active:scale-95 transition-all"
                >
                    <Bell className="w-5 h-5 text-slate-700 mb-0.5" />
                    <span className="text-[10px] font-bold text-slate-600">Prisa</span>
                </button>

                {/* Saltar / Info */}
                <button
                    onClick={onNextBarClick}
                    className={`py-2 flex flex-col items-center justify-center border rounded-xl active:scale-95 transition-all ${isOverRounds ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-100"}`}
                >
                    <ArrowRight className={`w-5 h-5 mb-0.5 ${isOverRounds ? "text-green-600" : "text-slate-400"}`} />
                    <span className={`text-[10px] font-bold ${isOverRounds ? "text-green-700" : "text-slate-500"}`}>Siguiente</span>
                </button>
            </div>

            {isOverRounds && (
                <div className="bg-green-100 text-green-800 text-[10px] font-bold px-3 py-1.5 rounded-lg text-center animate-pulse">
                    ✅ Rondas cumplidas. ¡Vámonos!
                </div>
            )}
        </div>
    );
}
