"use client";

import { useState, useEffect } from "react";

// Tipo para el evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si ya esta instalada como PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Verificar si ya se descarto el prompt
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Mostrar de nuevo despues de 15 dias si fue descartado explícitamente
    if (dismissedTime && daysSinceDismissed < 15) {
      return;
    }

    // Verificar cuándo se mostró por última vez (para no spammear si solo se ignora)
    const lastShown = localStorage.getItem("pwa-prompt-last-shown");
    const lastShownTime = lastShown ? parseInt(lastShown) : 0;
    const hoursSinceLastShown = (Date.now() - lastShownTime) / (1000 * 60 * 60);

    // Si se mostró hace menos de 24 horas, no mostrar
    if (lastShownTime && hoursSinceLastShown < 24) {
      return;
    }

    // Capturar el evento beforeinstallprompt (Chrome, Edge, Samsung)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Esperar un poco antes de mostrar
      setTimeout(() => {
        setShowPrompt(true);
        localStorage.setItem("pwa-prompt-last-shown", Date.now().toString());
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Para iOS, mostrar instrucciones manuales
    if (iOS && !standalone) {
      setTimeout(() => {
        setShowPrompt(true);
        localStorage.setItem("pwa-prompt-last-shown", Date.now().toString());
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Mostrar el prompt nativo de instalacion
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  // No mostrar si ya esta instalada o no hay prompt disponible
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
            <span className="text-2xl">🍺</span>
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm">Instala Birracrucis</h3>

            {isIOS ? (
              // Instrucciones para iOS
              <p className="text-xs text-slate-500 mt-1">
                Pulsa <span className="inline-flex items-center"><svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L12 14M12 2L8 6M12 2L16 6M4 14V20H20V14" /></svg></span> y luego{" "}
                <strong>&quot;Anadir a pantalla de inicio&quot;</strong>
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                Accede mas rapido y usa la app sin conexion
              </p>
            )}
          </div>

          {/* Boton cerrar */}
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Botones de accion */}
        {!isIOS && deferredPrompt && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 px-3 text-sm text-slate-600 bg-slate-100 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2 px-3 text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-colors"
            >
              Instalar
            </button>
          </div>
        )}

        {/* Instrucciones visuales para iOS */}
        {isIOS && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg py-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Safari &rarr; Compartir &rarr; Anadir a inicio
          </div>
        )}
      </div>
    </div>
  );
}
