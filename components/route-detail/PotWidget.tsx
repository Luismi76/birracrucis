"use client";

import { DollarSign, Users } from "lucide-react";

type PotWidgetProps = {
    currentAmount: number;
    targetAmount: number;
    participantsCount: number;
    paidCount: number;
    onClick?: () => void;
};

export default function PotWidget({
    currentAmount,
    targetAmount,
    participantsCount,
    paidCount,
    onClick,
}: PotWidgetProps) {
    const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const isPending = paidCount < participantsCount;

    return (
        <button
            onClick={onClick}
            className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 hover:border-green-300 active:scale-[0.98] transition-all text-left"
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wide">
                            Bote Común
                        </p>
                        <p className="text-2xl font-black text-green-800">
                            {currentAmount.toFixed(2)}€
                        </p>
                    </div>
                </div>
                {isPending && (
                    <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[10px] font-bold">
                        Pendiente
                    </div>
                )}
            </div>

            {/* Barra de progreso */}
            <div className="mb-2">
                <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-green-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            </div>

            {/* Info adicional */}
            <div className="flex items-center justify-between text-xs text-green-700">
                <span className="font-semibold">
                    {currentAmount.toFixed(2)}€ / {targetAmount.toFixed(2)}€
                </span>
                <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>
                        {paidCount}/{participantsCount} pagaron
                    </span>
                </div>
            </div>
        </button>
    );
}
