"use client";

import { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";
import BackButtonHandler from "./BackButtonHandler";
import BottomNavigation from "./BottomNavigation";
import { QueryProvider } from "@/lib/query-client";

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

  return (
    <QueryProvider>
      <BackButtonHandler>
        {children}
        <BottomNavigation />
      </BackButtonHandler>
    </QueryProvider>
  );
}
