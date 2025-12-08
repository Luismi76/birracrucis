"use client";

import { Moon, Sun, Sunset } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";

export default function ThemeToggle() {
    const { mode, setMode, isDark } = useDarkMode();

    return (
        <button
            onClick={() => {
                if (mode === "light") setMode("dark");
                else if (mode === "dark") setMode("auto");
                else setMode("light");
            }}
            className="fixed top-4 right-4 z-50 w-10 h-10 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            aria-label="Cambiar tema"
        >
            {mode === "light" && <Sun className="w-5 h-5 text-amber-500" />}
            {mode === "dark" && <Moon className="w-5 h-5 text-indigo-400" />}
            {mode === "auto" && <Sunset className="w-5 h-5 text-orange-500" />}
        </button>
    );
}
