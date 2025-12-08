"use client";

import { Wifi, WifiOff, Battery, BatteryLow } from "lucide-react";

type SystemStatusProps = {
    isOnline: boolean;
    queueSize: number;
    batteryLevel: number | null;
    batterySaverMode: string;
};

export default function SystemStatus({
    isOnline,
    queueSize,
    batteryLevel,
    batterySaverMode,
}: SystemStatusProps) {
    if (isOnline && queueSize === 0 && batterySaverMode === "off") {
        return null; // No mostrar nada si todo está bien
    }

    return (
        <div className="fixed top-4 left-4 z-50 space-y-2">
            {/* Estado de conexión */}
            {!isOnline && (
                <div className="bg-orange-500 dark:bg-orange-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-semibold">
                    <WifiOff className="w-4 h-4" />
                    <span>Sin conexión</span>
                    {queueSize > 0 && (
                        <span className="bg-white dark:bg-slate-200 text-orange-500 dark:text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {queueSize}
                        </span>
                    )}
                </div>
            )}

            {/* Sincronizando */}
            {isOnline && queueSize > 0 && (
                <div className="bg-blue-500 dark:bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-semibold animate-pulse">
                    <Wifi className="w-4 h-4" />
                    <span>Sincronizando {queueSize}...</span>
                </div>
            )}

            {/* Modo ahorro de batería */}
            {batterySaverMode !== "off" && (
                <div className="bg-amber-500 dark:bg-amber-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-semibold">
                    {batteryLevel !== null && batteryLevel < 20 ? (
                        <BatteryLow className="w-4 h-4" />
                    ) : (
                        <Battery className="w-4 h-4" />
                    )}
                    <span>
                        Ahorro {batterySaverMode === "aggressive" ? "agresivo" : "activo"}
                    </span>
                    {batteryLevel !== null && (
                        <span className="text-xs">({Math.round(batteryLevel)}%)</span>
                    )}
                </div>
            )}
        </div>
    );
}
