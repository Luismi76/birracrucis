"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import SplashScreen from "./SplashScreen";
import BackButtonHandler from "./BackButtonHandler";
import BottomNavigation from "./BottomNavigation";
import CookieConsent from "./CookieConsent";
import InstallPWAPrompt from "./InstallPWAPrompt";
import OnboardingModal from "./OnboardingModal";
import { QueryProvider } from "@/lib/query-client";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Verificar si es primera visita de la sesión
  useEffect(() => {
    const hasVisited = sessionStorage.getItem("birracrucis-visited");
    if (hasVisited) {
      setShowSplash(false);
    }
  }, []);

  // Verificar autenticación y onboarding
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      // Usuario no autenticado - app lista
      setOnboardingChecked(true);
      setIsAppReady(true);
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      // Verificar si necesita onboarding
      fetch("/api/user/profile")
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.profile && !data.profile.onboardingCompleted) {
            setNeedsOnboarding(true);
          }
        })
        .catch(() => {
          // Si falla, continuamos sin onboarding
        })
        .finally(() => {
          setOnboardingChecked(true);
          setIsAppReady(true);
        });
    }
  }, [status, session]);

  // Tiempo mínimo de splash (1 segundo) para evitar flash
  useEffect(() => {
    if (!showSplash) return;

    const minTimer = setTimeout(() => {
      // Si después de 1s el auth sigue loading, esperamos
      // Si ya está listo, el useEffect de arriba ya habrá puesto isAppReady = true
    }, 1000);

    return () => clearTimeout(minTimer);
  }, [showSplash]);

  const handleSplashFinish = () => {
    sessionStorage.setItem("birracrucis-visited", "true");
    setShowSplash(false);
  };

  // Mostrar splash hasta que la app esté lista
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} isReady={isAppReady} />;
  }

  return (
    <QueryProvider>
      <BackButtonHandler>
        {children}
        <BottomNavigation />
        <CookieConsent />
        <InstallPWAPrompt />
        {/* Mostrar onboarding modal si es necesario */}
        {onboardingChecked && needsOnboarding && <OnboardingModal />}
      </BackButtonHandler>
    </QueryProvider>
  );
}
