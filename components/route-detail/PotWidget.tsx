"use client";

import { DollarSign, Users, AlertCircle, Beer } from "lucide-react";

type PotWidgetProps = {
    currentAmount: number;
    targetAmount: number;
    participantsCount: number;
    paidCount: number;
    roundsRemaining?: number; // Rondas aproximadas que quedan
    defaultersCount?: number; // Número de morosos
    onClick?: () => void;
};

export default function PotWidget({
    currentAmount,
    targetAmount,
    participantsCount,
    paidCount,
    roundsRemaining,
    defaultersCount,
    onClick,
}: PotWidgetProps) {
    const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const isPending = paidCount < participantsCount;
    const hasDefaulters = (defaultersCount || 0) > 0;
    const balance = currentAmount;

    return (
        <button
            onClick={onClick}
            className="w-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-2.5 hover:border-green-300 active:scale-[0.98] transition-all text-left"
        >
            {/* Header con monto principal */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                            Bote Común
                        </p>
                        <p className="text-lg font-black text-green-800 dark:text-green-300">
                            {currentAmount.toFixed(0)}€
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 text-[10px]">
                    <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                        <Users className="w-3 h-3" />
                        <span className="font-semibold">{paidCount}/{participantsCount}</span>
                    </div>
                    {isPending && (
                        <div className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-bold">
                            Pendiente
                        </div>
                    )}
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="mb-1.5">
                <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-green-500 dark:bg-green-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            </div>

            {/* Info adicional: Rondas restantes y avisos */}
            <div className="flex items-center justify-between text-[10px] gap-2">
                {/* Rondas restantes */}
                {roundsRemaining !== undefined && roundsRemaining > 0 && (
                    <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                        <Beer className="w-3 h-3" />
                        <span className="font-semibold">~{roundsRemaining} rondas restantes</span>
                    </div>
                )}

                {/* Aviso de morosos */}
                {hasDefaulters && (
                    <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold">
                        <AlertCircle className="w-3 h-3" />
                        <span>{defaultersCount} {defaultersCount === 1 ? 'moroso' : 'morosos'}</span>
                    </div>
                )}
            </div>
        </button>
    );
}
