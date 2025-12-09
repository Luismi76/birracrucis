"use client";

import { useEffect, useRef } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

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
    const lastBatterySaverMode = useRef(batterySaverMode);

    // Show toast when battery saver mode changes
    useEffect(() => {
        if (batterySaverMode !== "off" && batterySaverMode !== lastBatterySaverMode.current) {
            const batteryText = batteryLevel !== null ? ` (${Math.round(batteryLevel)}%)` : "";
            const modeText = batterySaverMode === "aggressive" ? "agresivo" : "activo";

            toast.info(`🔋 Modo ahorro ${modeText}${batteryText}`, {
                description: "Algunas funciones pueden estar limitadas",
                duration: 5000,
            });
        }
        lastBatterySaverMode.current = batterySaverMode;
    }, [batterySaverMode, batteryLevel]);

    // Only show connection status if offline or syncing
    if (isOnline && queueSize === 0) {
        return null;
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
        </div>
    );
}
