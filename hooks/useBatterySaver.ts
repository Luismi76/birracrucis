import { useState, useEffect } from "react";

type BatterySaverMode = "off" | "low" | "aggressive";

export function useBatterySaver() {
    const [mode, setMode] = useState<BatterySaverMode>("off");
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

    useEffect(() => {
        if (typeof navigator === "undefined" || !("getBattery" in navigator)) {
            return;
        }

        // @ts-ignore - Battery API no está en tipos estándar
        navigator.getBattery().then((battery) => {
            const updateBatteryLevel = () => {
                const level = battery.level * 100;
                setBatteryLevel(level);

                // Auto-activar modo ahorro según batería
                if (level < 20) {
                    setMode("aggressive");
                } else if (level < 40) {
                    setMode("low");
                }
            };

            updateBatteryLevel();
            battery.addEventListener("levelchange", updateBatteryLevel);

            return () => {
                battery.removeEventListener("levelchange", updateBatteryLevel);
            };
        });
    }, []);

    // Configuración según modo
    const config = {
        off: {
            gpsInterval: 5000, // 5 segundos
            mapRefreshInterval: 3000,
            enableAnimations: true,
            enableBackgroundSync: true,
        },
        low: {
            gpsInterval: 10000, // 10 segundos
            mapRefreshInterval: 5000,
            enableAnimations: true,
            enableBackgroundSync: true,
        },
        aggressive: {
            gpsInterval: 30000, // 30 segundos
            mapRefreshInterval: 10000,
            enableAnimations: false,
            enableBackgroundSync: false,
        },
    };

    return {
        mode,
        setMode,
        batteryLevel,
        config: config[mode],
        isLowBattery: batteryLevel !== null && batteryLevel < 20,
    };
}
