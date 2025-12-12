"use client";

import Image from "next/image";
import LogoLoader from "@/components/ui/LogoLoader";
import { useState, useEffect } from "react";

interface SplashScreenProps {
  onFinish: () => void;
  isReady?: boolean; // Nueva prop: indica si la app está lista para mostrar
}

export default function SplashScreen({
  onFinish,
  isReady = false,
}: SplashScreenProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Asegurar que la animación se vea al menos una vez (3.5s)
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Cuando isReady es true Y ha pasado el tiempo mínimo, iniciamos fade out
  useEffect(() => {
    if (isReady && minTimeElapsed && !fadeOut) {
      setFadeOut(true);
      setTimeout(onFinish, 700); // Esperar a que termine la transición de opacidad
    }
  }, [isReady, minTimeElapsed, fadeOut, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ease-out ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
    >
      {/* Background with Mesh Gradient */}
      <div className="absolute inset-0 bg-[#FFFBEB]">
        <div className="absolute top-0 left-0 w-full h-[120%] bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600 opacity-90" />
        <div className="absolute -top-[20%] -left-[10%] w-[70vh] h-[70vh] rounded-full bg-orange-400 blur-[100px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[10%] -right-[10%] w-[60vh] h-[60vh] rounded-full bg-amber-300 blur-[80px] opacity-50" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Central Logo Loader */}
        <div className="relative mb-8 p-1">
          {/* Vaso estilo caña dimensionado manualmente */}
          <LogoLoader src="/android-chrome-512x512.png" width={320} height={480} />
        </div>

        <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg mb-2">
          Birracrucis
        </h1>
        <p className="text-orange-100 font-medium text-lg mb-4 tracking-wide opacity-90">
          La ruta definitiva
        </p>
      </div>
    </div>
  );
}
