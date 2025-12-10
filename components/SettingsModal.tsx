"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

type SettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

type UserSettings = {
    autoCheckinEnabled: boolean;
    notificationsEnabled: boolean;
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [settings, setSettings] = useState<UserSettings>({
        autoCheckinEnabled: true,
        notificationsEnabled: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Cargar configuración actual
    useEffect(() => {
        if (!isOpen) return;

        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (res.ok) {
                    const data = await res.json();
                    setSettings({
                        autoCheckinEnabled: data.autoCheckinEnabled ?? true,
                        notificationsEnabled: data.notificationsEnabled ?? true,
                    });
                }
            } catch (error) {
                console.error("Error cargando configuración:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [isOpen]);

    const handleToggle = async (key: keyof UserSettings) => {
        const newValue = !settings[key];
        const previousSettings = { ...settings };

        // Optimistic update
        setSettings((prev) => ({ ...prev, [key]: newValue }));
        setSaving(true);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: newValue }),
            });

            if (!res.ok) {
                throw new Error("Error guardando");
            }

            toast.success("Configuración actualizada");
        } catch {
            // Rollback
            setSettings(previousSettings);
            toast.error("Error al guardar configuración");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        Configuración
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                        </div>
                    ) : (
                        <>
                            {/* Auto Check-in */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                        <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">
                                            Check-in automático
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Hacer check-in al llegar a un bar
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggle("autoCheckinEnabled")}
                                    disabled={saving}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${
                                        settings.autoCheckinEnabled
                                            ? "bg-amber-500"
                                            : "bg-slate-300 dark:bg-slate-600"
                                    }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                                            settings.autoCheckinEnabled ? "translate-x-5" : ""
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Notificaciones */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">
                                            Notificaciones
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Recibir avisos y nudges
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggle("notificationsEnabled")}
                                    disabled={saving}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${
                                        settings.notificationsEnabled
                                            ? "bg-blue-500"
                                            : "bg-slate-300 dark:bg-slate-600"
                                    }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                                            settings.notificationsEnabled ? "translate-x-5" : ""
                                        }`}
                                    />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-center text-slate-400">
                        Los cambios se guardan automáticamente
                    </p>
                </div>
            </div>
        </div>
    );
}
