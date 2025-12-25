"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface LogoLoaderProps {
    src: string;
    className?: string;
    width?: number;
    height?: number;
}

type SeaonalTheme = 'default' | 'christmas' | 'semana-santa' | 'feria';

const getSeasonalTheme = (): SeaonalTheme => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const day = now.getDate();

    // Navidad: 15 Dic - 6 Ene
    if ((month === 11 && day >= 15) || (month === 0 && day <= 6)) return 'christmas';

    // Semana Santa 2025 (Estimada 13-20 Abril)
    if (month === 3 && day >= 13 && day <= 20) return 'semana-santa';

    // Feria 2025 (Estimada 5-11 Mayo)
    if (month === 4 && day >= 5 && day <= 11) return 'feria';

    return 'default';
};

export default function LogoLoader({
    src,
    className,
    width = 300,
    height = 450,
}: LogoLoaderProps) {
    const [theme, setTheme] = useState<SeaonalTheme>('default');

    useEffect(() => {
        setTheme(getSeasonalTheme());
    }, []);

    return (
        <div
            className={cn("relative flex flex-col items-center justify-center", className)}
            style={{ width, height }}
        >
            <style jsx>{`
                @keyframes fall {
                    0% { transform: translateY(-10vh) rotate(0deg); opacity: 0.8; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
                .animate-fall {
                    animation-name: fall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>

            {/* Seasonal Decor - Fixed Overlay for Snow (Screen-wide effect) */}
            {theme === 'christmas' && (
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute text-white/60 animate-fall"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-10%`,
                                fontSize: `${Math.random() * 20 + 15}px`, // 15px to 35px
                                animationDuration: `${Math.random() * 3 + 2}s`, // 2s to 5s
                                animationDelay: `${Math.random() * 5}s`
                            }}
                        >
                            ❄️
                        </div>
                    ))}
                </div>
            )}

            {/* Feria: Farolillos */}
            {theme === 'feria' && (
                <div className="fixed top-0 left-0 w-full flex justify-between z-20 pointer-events-none select-none px-4">
                    {[...Array(6)].map((_, i) => (
                        <span key={i} className="text-[3rem] animate-swing origin-top drop-shadow-md" style={{ animationDelay: `${i * 0.2}s` }}>🏮</span>
                    ))}
                </div>
            )}

            {/* 
         Cruzcampo-style Caña Glass Shape:
         - Taller aspect ratio (~2:3)
         - Slightly tapered (simulated with perspective or just slightly narrower bottom visual weight)
         - Bottom corners are rounded but the base is fairly flat.
      */}
            <div className="relative w-full h-full transform-gpu" style={{ perspective: '1000px' }}>
                {/* Glass Container 
             Using rotateX with perspective to simulate the tapered look (wider top, narrower bottom)
         */}
                <div
                    className="relative w-full h-full border-[6px] border-white/60 border-t-0 rounded-b-[3.5rem] overflow-hidden backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.2)]"
                    style={{
                        // Slight 3D rotation to make the top look wider than the bottom
                        transform: 'rotateX(5deg)',
                        transformOrigin: 'bottom center',
                    }}
                >
                    {/* Liquid Animation - Golden Beer Color (Cruzcampo style) */}
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-yellow-500 via-yellow-400 to-amber-300 animate-[fillGlass_3s_ease-out_forwards]">
                        {/* Bubbles */}
                        <div className="absolute bottom-6 left-1/4 w-2 h-2 bg-white/50 rounded-full animate-[bubble_2s_linear_infinite]" />
                        <div className="absolute bottom-12 right-1/3 w-1.5 h-1.5 bg-white/40 rounded-full animate-[bubble_3s_linear_infinite_0.5s]" />
                        <div className="absolute bottom-8 right-1/4 w-3 h-3 bg-white/30 rounded-full animate-[bubble_4s_linear_infinite_1s]" />
                        <div className="absolute bottom-24 left-1/3 w-2 h-2 bg-white/40 rounded-full animate-[bubble_2.5s_linear_infinite_1.5s]" />

                        {/* Foam Head - Thicker, creamier */}
                        <div className="absolute top-0 w-full h-12 bg-gradient-to-b from-white to-white/90 blur-[2px] -translate-y-6" />

                        {/* Elemento flotando en la cerveza (Semana Santa) */}
                        {theme === 'semana-santa' && (
                            <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 text-4xl opacity-60 animate-pulse mix-blend-overlay">
                                🕯️
                            </div>
                        )}
                    </div>

                    {/* Logo floating inside (Counter-rotate to keep it flat) */}
                    <div
                        className="absolute inset-0 flex items-center justify-center z-10 p-6"
                        style={{ transform: 'rotateX(-5deg)' }}
                    >
                        <Image
                            src={src}
                            alt="Loading..."
                            width={width * 0.75}
                            height={height * 0.75}
                            className="object-contain drop-shadow-2xl animate-bounce-slow opacity-90 mix-blend-multiply"
                            priority
                        />
                    </div>

                    {/* Glass Highlights - Enhanced for "realism" */}
                    <div className="absolute top-0 right-2 w-full h-full bg-gradient-to-l from-white/30 via-transparent to-transparent pointer-events-none rounded-b-[3.5rem]" />
                    <div className="absolute top-4 left-4 w-3 h-3/4 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-[2px]" />
                </div>
            </div>
        </div>
    );
}
