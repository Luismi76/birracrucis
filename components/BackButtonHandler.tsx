"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

type BackButtonHandlerProps = {
  children: React.ReactNode;
};

export default function BackButtonHandler({ children }: BackButtonHandlerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Paginas principales de la app (no mostrar confirmacion al salir de estas)
  const mainPages = ["/", "/auth/signin", "/auth/error"];
  const isMainPage = mainPages.includes(pathname);

  // Paginas de ruta activa (mostrar confirmacion si intentan salir)
  const isRoutePage = pathname.startsWith("/routes/") && !pathname.includes("/edit") && !pathname.includes("/new") && !pathname.includes("/history");

  const handleBackNavigation = useCallback(() => {
    // Si estamos en una ruta activa, preguntar antes de salir
    if (isRoutePage) {
      setShowExitDialog(true);
      return true; // Prevenir navegacion
    }

    // Si estamos en /routes, ir a home
    if (pathname === "/routes") {
      router.push("/");
      return true;
    }

    // Si estamos en paginas secundarias, navegar normalmente
    return false;
  }, [isRoutePage, pathname, router]);

  useEffect(() => {
    // Solo activar en navegadores moviles o PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isStandalone && !isMobile) return;

    // Agregar entrada al historial para poder interceptar el boton atras
    const pushDummyState = () => {
      if (!isMainPage) {
        window.history.pushState({ birracrucis: true }, "", window.location.href);
      }
    };

    // Handler para el evento popstate (boton atras)
    const handlePopState = (event: PopStateEvent) => {
      // Verificar si es nuestra entrada dummy
      const shouldPrevent = handleBackNavigation();

      if (shouldPrevent) {
        // Re-agregar la entrada al historial para poder interceptar de nuevo
        pushDummyState();
      }
    };

    // Agregar entrada inicial
    pushDummyState();

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname, isMainPage, handleBackNavigation]);

  // Prevenir cierre accidental con beforeunload
  useEffect(() => {
    if (!isRoutePage) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isRoutePage]);

  const handleConfirmExit = () => {
    setShowExitDialog(false);
    router.push("/routes");
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
    // Re-agregar entrada al historial
    window.history.pushState({ birracrucis: true }, "", window.location.href);
  };

  return (
    <>
      {children}

      {/* Dialog de confirmacion para salir de ruta activa */}
      {showExitDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <div className="text-5xl mb-4">🍺</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Salir de la ruta?
              </h2>
              <p className="text-slate-600 text-sm">
                Puedes volver cuando quieras. Tu progreso esta guardado.
              </p>
            </div>

            <div className="flex border-t">
              <button
                onClick={handleCancelExit}
                className="flex-1 py-4 text-amber-600 font-semibold hover:bg-amber-50 transition-colors"
              >
                Quedarme
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 py-4 text-slate-500 font-medium hover:bg-slate-50 transition-colors border-l"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
