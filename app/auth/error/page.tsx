"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "Hay un problema con la configuración del servidor.",
    AccessDenied: "No tienes permiso para acceder.",
    Verification: "El enlace de verificación ha expirado o ya fue usado.",
    Default: "Ocurrió un error al iniciar sesión.",
  };

  const message = errorMessages[error || ""] || errorMessages.Default;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 px-4">
      <div className="mb-6">
        <Image
          src="/android-chrome-512x512.png"
          alt="Birracrucis"
          width={100}
          height={100}
          className="drop-shadow-xl opacity-50"
        />
      </div>

      <div className="text-6xl mb-4">😵</div>
      <h1 className="text-2xl font-bold text-amber-900 mb-2">Algo salió mal</h1>
      <p className="text-amber-700 mb-6 text-center max-w-xs">{message}</p>

      <Link
        href="/auth/signin"
        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95"
      >
        Intentar de nuevo
      </Link>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
