"use client";

import { Clock, Users, TrendingUp, MessageCircle, Settings, Moon, Sun, Accessibility } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";

type RouteProgressHeaderProps = {
    routeName: string;
    currentBarIndex: number;
    totalBars: number;
    activeParticipants: number;
    completionPercent: number;
    estimatedFinishTime: string | null;
    timeRemaining: string | null;
    // New props
    userImage?: string | null;
    userName?: string | null;
    unreadMessages?: number;
    onChatClick?: () => void;
    onAccessibilityClick?: () => void;
};

export default function RouteProgressHeader({
    routeName,
    currentBarIndex,
    totalBars,
    activeParticipants,
    completionPercent,
    estimatedFinishTime,
    timeRemaining,
    userImage,
    userName,
    unreadMessages = 0,
    onChatClick,
    onAccessibilityClick,
}: RouteProgressHeaderProps) {
    const currentTime = new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const [showDropdown, setShowDropdown] = useState(false);
    const { theme, setTheme } = useTheme();

    return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 text-white px-4 py-3 shadow-lg relative">
            {/* Línea 1: Nombre, hora y acciones */}
            <div className="flex items-center justify-between mb-2">
                <h1 className="font-bold text-lg truncate flex-1">{routeName}</h1>

                <div className="flex items-center gap-2">
                    {/* Hora actual */}
                    <div className="flex items-center gap-1 text-sm bg-white/20 dark:bg-white/10 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>{currentTime}</span>
                    </div>

                    {/* Botón de Chat con indicador */}
                    <button
                        onClick={onChatClick}
                        className="relative p-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-full transition-colors active:scale-95"
                        aria-label="Chat"
                    >
                        <MessageCircle className="w-5 h-5" />
                        {unreadMessages > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                {unreadMessages > 9 ? '9+' : unreadMessages}
                            </span>
                        )}
                    </button>

                    {/* Avatar con dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-full p-1 transition-colors active:scale-95"
                            aria-label="Menú de usuario"
                        >
                            {userImage ? (
                                <img
                                    src={userImage}
                                    alt={userName || "Usuario"}
                                    className="w-8 h-8 rounded-full border-2 border-white/50"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center border-2 border-white/50">
                                    <span className="text-sm font-bold">
                                        {userName?.charAt(0).toUpperCase() || "?"}
                                    </span>
                                </div>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <>
                                {/* Backdrop para cerrar */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowDropdown(false)}
                                />

                                {/* Menu */}
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-fadeIn">
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                            {userName || "Usuario"}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Participante
                                        </p>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-1">
                                        {/* Theme Toggle */}
                                        <button
                                            onClick={() => {
                                                setTheme(theme === 'dark' ? 'light' : 'dark');
                                                setShowDropdown(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                                        >
                                            {theme === 'dark' ? (
                                                <Sun className="w-4 h-4" />
                                            ) : (
                                                <Moon className="w-4 h-4" />
                                            )}
                                            <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
                                        </button>

                                        {/* Accessibility */}
                                        <button
                                            onClick={() => {
                                                onAccessibilityClick?.();
                                                setShowDropdown(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                                        >
                                            <Accessibility className="w-4 h-4" />
                                            <span>Accesibilidad</span>
                                        </button>

                                        {/* Settings */}
                                        <button
                                            onClick={() => {
                                                // TODO: Open settings modal
                                                setShowDropdown(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span>Configuración</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Línea 2: Stats */}
            <div className="flex items-center gap-3 text-xs mb-2">
                <div className="flex items-center gap-1">
                    <span className="font-bold">Bar {currentBarIndex + 1}</span>
                    <span className="opacity-75">de {totalBars}</span>
                </div>
                <div className="w-px h-3 bg-white/30" />
                <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{activeParticipants}</span>
                </div>
                {estimatedFinishTime && (
                    <>
                        <div className="w-px h-3 bg-white/30" />
                        <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>ETA: {estimatedFinishTime}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Línea 3: Barra de progreso */}
            <div className="space-y-1">
                <div className="w-full bg-white/20 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-white dark:bg-slate-100 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${completionPercent}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] opacity-75">
                    <span>{Math.round(completionPercent)}% completado</span>
                    {timeRemaining && <span>{timeRemaining} restante</span>}
                </div>
            </div>
        </div>
    );
}
