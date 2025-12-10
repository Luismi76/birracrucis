"use client";

import Image from "next/image";
import BeerLoader from "@/components/ui/BeerLoader";
import { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 500); // Esperar a que termine la animación
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-amber-500 to-orange-600 transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"
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
