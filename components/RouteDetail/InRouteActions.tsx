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
    barName,
    roundsCount,
    plannedRounds
}: InRouteActionsProps) {

    // CASO 0: Ruta Completada
    if (isRouteComplete) {
        return (
            <div className="p-4 bg-white/90 backdrop-blur rounded-t-3xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-black text-slate-900">🎉 ¡Ruta Completada!</h2>
                    <p className="text-slate-500">¿Qué tal la resaca de mañana?</p>
                </div>
                <button className="w-full py-4 bg-green-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-all mb-2 flex items-center justify-center gap-2">
                    <span>💸</span> Ver Cuentas Finales
                </button>
            </div>
        );
    }

    // CASO 1: En camino al bar (Lejos)
    if (!isAtBar) {
        return (
            <div className="p-4 bg-white/90 backdrop-blur rounded-t-3xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] animate-slide-up">
                {/* Info de distancia */}
                <div className="flex items-center justify-between mb-4 px-2">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Próxima parada</p>
                        <h3 className="text-lg font-bold text-slate-800 truncate max-w-[200px]">{barName}</h3>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-slate-900">{distToBar ? distToBar : "?"}</span>
                        <span className="text-xs font-bold text-slate-500 ml-1">metros</span>
                    </div>
                </div>

                {/* Botón Principal: HE LLEGADO (Check-in Manual) */}
                <button
                    onClick={onCheckIn}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xl font-bold shadow-xl shadow-slate-300 active:scale-95 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <MapPin className="w-6 h-6 text-amber-500" />
                    <span>📍 He Llegado Manualmente</span>
                </button>
                <p className="text-center text-[10px] text-slate-400 mt-3">
                    El check-in automático se activará al acercarte (30m)
                </p>
            </div>
        );
    }

    // CASO 2: En el bar (Listo para la acción)
    const isOverRounds = roundsCount >= plannedRounds;

    return (
        <div className="p-4 bg-white/90 backdrop-blur rounded-t-3xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] animate-slide-up space-y-3">

            {/* Botón Gigante: PEDIR RONDA */}
            <button
                onClick={onAddRound}
                className="w-full py-6 bg-amber-500 text-white rounded-3xl text-2xl font-black shadow-xl shadow-amber-200 active:scale-95 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Beer className="w-8 h-8 fill-white/20" />
                <span className="relative z-10">¡OTRA RONDA! 🍻</span>
            </button>

            {/* Grid de Acciones Secundarias */}
            <div className="grid grid-cols-3 gap-3">
                {/* Foto */}
                <button
                    onClick={onPhotoClick}
                    className="aspect-square flex flex-col items-center justify-center bg-slate-50 border-2 border-slate-100 rounded-2xl active:bg-slate-100 active:scale-95 transition-all"
                >
                    <Camera className="w-6 h-6 text-slate-700 mb-1" />
                    <span className="text-xs font-bold text-slate-600">Foto</span>
                </button>

                {/* Meter Prisa */}
                <button
                    onClick={onNudgeClick}
                    className="aspect-square flex flex-col items-center justify-center bg-slate-50 border-2 border-slate-100 rounded-2xl active:bg-slate-100 active:scale-95 transition-all"
                >
                    <Bell className="w-6 h-6 text-slate-700 mb-1" />
                    <span className="text-xs font-bold text-slate-600">Prisa</span>
                </button>

                {/* Saltar / Info */}
                <button
                    onClick={onNextBarClick}
                    className={`aspect-square flex flex-col items-center justify-center border-2 rounded-2xl active:scale-95 transition-all ${isOverRounds ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-100"}`}
                >
                    <ArrowRight className={`w-6 h-6 mb-1 ${isOverRounds ? "text-green-600" : "text-slate-400"}`} />
                    <span className={`text-xs font-bold ${isOverRounds ? "text-green-700" : "text-slate-500"}`}>Siguiente</span>
                </button>
            </div>

            {isOverRounds && (
                <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-2 rounded-xl text-center animate-pulse">
                    ✅ Rondas cumplidas. ¡Vámonos al siguiente!
                </div>
            )}
        </div>
    );
}
