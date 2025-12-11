"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import UserMenu from "@/components/UserMenu";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="flex min-h-screen-safe flex-col bg-gradient-to-b from-amber-50 to-orange-100 px-4 safe-area-top">
      {/* Header */}
      <header className="flex justify-between items-center py-4">
        <div /> {/* Spacer */}
        <UserMenu />
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center -mt-16">
        {/* Logo */}
        <div className="mb-8 animate-bounce">
          <Image
            src="/android-chrome-512x512.png"
            alt="Birracrucis"
            width={200}
            height={200}
            priority
            className="drop-shadow-xl"
          />
        </div>

        {/* Título y descripción */}
        <h1 className="text-4xl font-bold text-amber-900 mb-2 text-center">
          Birracrucis
        </h1>
        <p className="text-amber-700 text-lg mb-6 text-center max-w-md">
          Organiza rutas de bares con tus amigos
        </p>

        {/* Features rápidas */}
        <div className="flex gap-6 mb-8 text-center">
          <div className="flex flex-col items-center">
            <span className="text-3xl mb-1">🗺️</span>
            <span className="text-xs text-amber-800 font-medium">Planifica</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl mb-1">👥</span>
            <span className="text-xs text-amber-800 font-medium">Invita</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl mb-1">🍻</span>
            <span className="text-xs text-amber-800 font-medium">Disfruta</span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {status === "loading" ? (
            <div className="h-14 bg-amber-200 rounded-xl animate-pulse" />
          ) : session ? (
            <>
              <Link
                href="/routes/new"
                className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95"
              >
                <span className="text-xl">🍺</span>
                Nueva Ruta
              </Link>

              <Link
                href="/routes"
                className="flex items-center justify-center gap-2 bg-white hover:bg-amber-50 text-amber-700 font-bold py-4 px-6 rounded-xl shadow-lg border-2 border-amber-200 transition-all active:scale-95"
              >
                <span className="text-xl">📋</span>
                Mis Rutas
              </Link>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95"
            >
              <span className="text-xl">👋</span>
              Iniciar sesión
            </Link>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center space-y-2">
        <p className="text-amber-600 text-sm">
          Bebe con responsabilidad
        </p>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-amber-500/70">
          <Link href="/legal/privacidad" className="hover:text-amber-600">
            Privacidad
          </Link>
          <Link href="/legal/terminos" className="hover:text-amber-600">
            Terminos
          </Link>
          <Link href="/legal/aviso" className="hover:text-amber-600">
            Aviso Legal
          </Link>
        </div>
      </footer>
    </div>
  );
}
