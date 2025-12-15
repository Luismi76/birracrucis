"use client";

import LogoLoader from "@/components/ui/LogoLoader";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#FFFBEB]">
            {/* Background with Mesh Gradient (Same as SplashScreen) */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-[120%] bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600 opacity-90" />
                <div className="absolute -top-[20%] -left-[10%] w-[70vh] h-[70vh] rounded-full bg-orange-400 blur-[100px] opacity-60 animate-pulse" />
                <div className="absolute bottom-[10%] -right-[10%] w-[60vh] h-[60vh] rounded-full bg-amber-300 blur-[80px] opacity-50" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Central Logo Loader */}
                <div className="relative mb-8 p-1">
                    <LogoLoader src="/android-chrome-512x512.png" width={320} height={480} />
                </div>

                <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg mb-2">
                    Birracrucis
                </h1>
                <p className="text-orange-100 font-medium text-lg mb-4 tracking-wide opacity-90">
                    Cargando...
                </p>
            </div>
        </div>
    );
}
