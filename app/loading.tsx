"use client";

import LogoLoader from "@/components/ui/LogoLoader";
import { useEffect, useState } from "react";

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

export default function Loading() {
    const [theme, setTheme] = useState<SeaonalTheme>('default');

    useEffect(() => {
        setTheme(getSeasonalTheme());
    }, []);

    // Renderizado de efectos según el tema
    const renderThemeEffects = () => {
        switch (theme) {
            case 'christmas':
                return (
                    <>
                        {/* Copos de nieve cayendo (CSS animations simples) */}
                        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                            {[...Array(10)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute text-white/40 animate-fall"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `-10%`,
                                        fontSize: `${Math.random() * 20 + 10}px`,
                                        animationDuration: `${Math.random() * 5 + 3}s`,
                                        animationDelay: `${Math.random() * 2}s`
                                    }}
                                >
                                    ❄️
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 'semana-santa':
                return (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-transparent pointer-events-none z-0" />
                        <div className="absolute bottom-10 left-10 text-4xl opacity-50 animate-pulse">🕯️</div>
                        <div className="absolute bottom-10 right-10 text-4xl opacity-50 animate-pulse delay-700">🕯️</div>
                    </>
                );
            case 'feria':
                return (
                    <>
                        {/* Farolillos en la parte superior */}
                        <div className="absolute top-0 left-0 w-full h-24 overflow-hidden pointer-events-none z-0 flex justify-around">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`text-4xl animate-bounce`} style={{ animationDuration: '3s', animationDelay: `${i * 0.2}s` }}>
                                    🏮
                                </div>
                            ))}
                        </div>
                        {/* Lunares sutiles en el fondo */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none z-0"
                            style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#FFFBEB]">
            <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>

            {/* Background with Mesh Gradient (Same as SplashScreen) */}
            <div className="absolute inset-0 z-0">
                <div className={`absolute top-0 left-0 w-full h-[120%] bg-gradient-to-b opacity-90 transition-colors duration-1000
            ${theme === 'semana-santa' ? 'from-purple-900/80 via-purple-600/60 to-amber-600' : 'from-amber-500 via-orange-500 to-amber-600'}
        `} />
                <div className="absolute -top-[20%] -left-[10%] w-[70vh] h-[70vh] rounded-full bg-orange-400 blur-[100px] opacity-60 animate-pulse" />
                <div className="absolute bottom-[10%] -right-[10%] w-[60vh] h-[60vh] rounded-full bg-amber-300 blur-[80px] opacity-50" />
            </div>

            {renderThemeEffects()}

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Central Logo Loader */}
                <div className="relative mb-8 p-1">
                    {/* Gorro de Santa si es Navidad */}
                    {theme === 'christmas' && (
                        <div className="absolute -top-10 -right-6 text-6xl rotate-12 z-20 animate-bounce cursor-default" style={{ animationDuration: '3s' }}>
                            🎅
                        </div>
                    )}
                    <LogoLoader src="/android-chrome-512x512.png" width={320} height={480} />
                </div>

                <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg mb-2">
                    Birracrucis
                </h1>
                <p className="text-orange-100 font-medium text-lg mb-4 tracking-wide opacity-90">
                    {theme === 'christmas' ? 'Cargando turrones...' : 'Cargando...'}
                </p>
            </div>
        </div>
    );
}
