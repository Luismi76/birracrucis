"use client";

import { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    // Solo mostrar splash en la primera visita de la sesión
    const hasVisited = sessionStorage.getItem("birracrucis-visited");
    if (hasVisited) {
      setShowSplash(false);
      setIsFirstVisit(false);
    }
  }, []);

  const handleSplashFinish = () => {
    sessionStorage.setItem("birracrucis-visited", "true");
    setShowSplash(false);
  };

  if (showSplash && isFirstVisit) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return <>{children}</>;
}
