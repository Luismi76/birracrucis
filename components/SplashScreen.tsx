"use client";

import Image from "next/image";
import BeerLoader from "@/components/ui/BeerLoader";
import { useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
  isReady?: boolean; // Nueva prop: indica si la app está lista para mostrar
}

export default function SplashScreen({ onFinish, isReady = false }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  // Cuando isReady cambia a true, iniciamos el fade out
  if (isReady && !fadeOut) {
    setFadeOut(true);
    setTimeout(onFinish, 500); // Esperar a que termine la animación
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-amber-500 to-orange-600 transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="animate-pulse">
        <Image
          src="/android-chrome-512x512.png"
          alt="Birracrucis"
          width={180}
          height={180}
          priority
          className="drop-shadow-2xl"
        />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-white drop-shadow-lg">
        Birracrucis
      </h1>
      <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
        <BeerLoader showText={true} className="[&_h2]:text-white [&_h2]:text-sm [&_h2]:mt-4" />
      </div>
    </div>
  );
}
