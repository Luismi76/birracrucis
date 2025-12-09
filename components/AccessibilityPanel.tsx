"use client";

import { useState } from "react";
import { Settings, Battery, Eye, Type } from "lucide-react";

type AccessibilitySettings = {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    screenReaderMode: boolean;
};

type AccessibilityPanelProps = {
    settings: AccessibilitySettings;
    onSettingsChange: (settings: AccessibilitySettings) => void;
};

export default function AccessibilityPanel({
    settings,
    onSettingsChange,
}: AccessibilityPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSetting = (key: keyof AccessibilitySettings) => {
        onSettingsChange({
            ...settings,
            [key]: !settings[key],
        });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-4 z-[100] w-12 h-12 bg-slate-800 dark:bg-slate-700 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 transition-all"
                aria-label="Abrir opciones de accesibilidad"
            >
                <Settings className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-20 right-4 z-[100] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl p-4 w-72">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Accesibilidad
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label="Cerrar"
                >
                    ✕
                </button>
            </div>

            {/* Settings */}
            <div className="space-y-3">
                {/* Alto contraste */}
                <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Alto contraste
                        </span>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.highContrast}
                        onChange={() => toggleSetting("highContrast")}
                        className="w-5 h-5"
                    />
                </label>

                {/* Texto grande */}
                <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Texto grande
                        </span>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.largeText}
                        onChange={() => toggleSetting("largeText")}
                        className="w-5 h-5"
                    />
                </label>

                {/* Movimiento reducido */}
                <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                        <Battery className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Reducir animaciones
                        </span>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.reducedMotion}
                        onChange={() => toggleSetting("reducedMotion")}
                        className="w-5 h-5"
                    />
                </label>

                {/* Lector de pantalla */}
                <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🔊</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Modo lector
                        </span>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.screenReaderMode}
                        onChange={() => toggleSetting("screenReaderMode")}
                        className="w-5 h-5"
                    />
                </label>
            </div>

            {/* Info */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Configuración guardada automáticamente
                </p>
            </div>
        </div>
    );
}
