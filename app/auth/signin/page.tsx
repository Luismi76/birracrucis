"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl") || "/";
  // Sanitizar callback para evitar redirección a localhost en móvil
  const callbackUrl = rawCallbackUrl.includes("localhost") ? "/" : rawCallbackUrl;
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100 px-4">
      {/* Logo */}
      <div className="mb-6">
        <Image
          src="/android-chrome-512x512.png"
          alt="Birracrucis"
          width={120}
          height={120}
          priority
          className="drop-shadow-xl"
        />
      </div>

      <h1 className="text-3xl font-bold text-amber-900 mb-2">Birracrucis</h1>
      <p className="text-amber-700 mb-8 text-center">
        Inicia sesión para unirte a la aventura
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
          Error al iniciar sesión. Inténtalo de nuevo.
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {/* Google */}
        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-xl shadow-md border border-gray-200 transition-all active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </button>

        {/* Login Desarrollo */}
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={() => signIn("credentials", {
              username: "dev",
              password: "password",
              callbackUrl
            })}
            className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-6 rounded-xl shadow-md border border-slate-700 transition-all active:scale-95"
          >
            <span className="text-xl">🛠️</span>
            Login Desarrollo (Test)
          </button>
        )}

      </div>

      <p className="mt-8 text-amber-600 text-xs text-center max-w-xs">
        Al continuar, aceptas compartir tu nombre y foto de perfil con los participantes de tus rutas.
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
