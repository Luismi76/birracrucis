import { useState, useEffect } from "react";

type ThemeMode = "light" | "dark" | "auto";

export function useDarkMode() {
    const [mode, setMode] = useState<ThemeMode>("auto");
    const [isDark, setIsDark] = useState(false);

    // Detectar preferencia del sistema
    useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const updateTheme = () => {
            if (mode === "auto") {
                setIsDark(mediaQuery.matches);
            } else {
                setIsDark(mode === "dark");
            }
        };

        updateTheme();
        mediaQuery.addEventListener("change", updateTheme);

        return () => mediaQuery.removeEventListener("change", updateTheme);
    }, [mode]);

    // Detectar hora del día (18:00 - 06:00 = oscuro)
    useEffect(() => {
        if (mode !== "auto") return;

        const checkTime = () => {
            const hour = new Date().getHours();
            const isNightTime = hour >= 18 || hour < 6;
            setIsDark(isNightTime);
        };

        checkTime();
        const interval = setInterval(checkTime, 60000); // Check cada minuto

        return () => clearInterval(interval);
    }, [mode]);

    // Aplicar clase al body
    useEffect(() => {
        if (typeof document === "undefined") return;

        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [isDark]);

    // Guardar preferencia
    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem("theme_mode", mode);
    }, [mode]);

    // Cargar preferencia
    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = localStorage.getItem("theme_mode") as ThemeMode;
        if (saved) {
            setMode(saved);
        }
    }, []);

    return {
        mode,
        setMode,
        isDark,
        toggle: () => setMode(isDark ? "light" : "dark"),
    };
}
