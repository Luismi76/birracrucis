"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const LOADING_MESSAGES = [
    "Tirando una caña bien fresquita...",
    "Buscando los mejores bares...",
    "Calculando la ruta más corta (o la más divertida)...",
    "Refrigerando los servidores...",
    "Afinando la puntería...",
    "Cargando barriles...",
    "¿Otra ronda?",
];

interface BeerLoaderProps {
    className?: string;
    showText?: boolean;
}

export default function BeerLoader({ className, showText = true }: BeerLoaderProps) {
    const [message, setMessage] = useState(LOADING_MESSAGES[0]);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
        setMessage(LOADING_MESSAGES[randomIndex]);
    }, []);

    return (
        <div className={cn("flex flex-col items-center justify-center", className)}>
            <div className="relative mb-8">
                {/* Beer Glass Animation */}
                <div className="w-16 h-20 border-4 border-amber-600 rounded-b-xl border-t-0 relative overflow-hidden bg-slate-200/30">
                    <div className="absolute bottom-0 left-0 right-0 bg-amber-400 animate-[fillBeer_2s_ease-in-out_infinite]">
                        <div className="absolute top-0 left-0 right-0 h-4 bg-white/80 animate-[foam_2s_ease-in-out_infinite] -translate-y-2"></div>
                        {/* Bubbles */}
                        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-white/40 rounded-full animate-[bubble_1.5s_linear_infinite]"></div>
                        <div className="absolute bottom-4 right-3 w-1 h-1 bg-white/40 rounded-full animate-[bubble_1.2s_linear_infinite_0.5s]"></div>
                        <div className="absolute bottom-1 left-5 w-2 h-2 bg-white/40 rounded-full animate-[bubble_1.8s_linear_infinite_0.2s]"></div>
                    </div>
                    {/* Handle */}
                    <div className="absolute top-4 -right-5 w-4 h-10 border-4 border-l-0 border-amber-600 rounded-r-lg"></div>
                </div>
            </div>

            {showText && (
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 animate-pulse text-center px-4">
                    {message}
                </h2>
            )}


        </div>
    );
}
