"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import UserMenu from "@/components/UserMenu";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="flex min-h-screen-safe flex-col relative overflow-hidden bg-[#FFFBEB] font-sans">
      {/* Background Mesh Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[70vh] bg-gradient-to-b from-amber-500/90 via-orange-500/80 to-transparent" />
        <div className="absolute -top-[20%] right-[10%] w-[50vh] h-[50vh] rounded-full bg-orange-400 blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute top-[10%] left-[10%] w-[40vh] h-[40vh] rounded-full bg-amber-300 blur-[100px] opacity-30" />
      </div>

      {/* Header */}
      <header className="relative z-20 flex justify-between items-center py-4 px-6 safe-area-top">
        <div /> {/* Spacer */}
        <UserMenu />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center pt-8 relative z-10 px-6">
        {/* Brand Section */}
        <div className="flex flex-col items-center mb-12 animate-fadeIn">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-110" />
            <Image
              src="/android-chrome-512x512.png"
              alt="Birracrucis"
              width={180}
              height={180}
              priority
              className="drop-shadow-2xl relative z-10 animate-bounce-slow"
            />
          </div>

          <h1 className="text-5xl font-extrabold text-white text-center tracking-tight drop-shadow-md mb-3">
            Birracrucis
          </h1>
          <p className="text-orange-50 text-lg font-medium text-center max-w-xs tracking-wide opacity-90">
            La ruta definitiva con tus amigos
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-auto animate-slideInRight delay-100">
          <FeatureCard icon="🗺️" label="Planifica" delay="0ms" />
          <FeatureCard icon="👥" label="Invita" delay="100ms" />
          <FeatureCard icon="🍻" label="Disfruta" delay="200ms" />
        </div>
      </main>

      {/* Bottom Action Sheet (Floating Glass) */}
      <div className="relative z-20 p-6 pb-safe animate-slideInBottom">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)] border border-white/50">
          <div className="flex flex-col gap-4 w-full">
            {status === "loading" ? (
              <div className="h-16 bg-slate-200/50 rounded-2xl animate-pulse w-full" />
            ) : session ? (
              <>
                <Link
                  href="/routes/new"
                  className="group relative flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 active:from-amber-600 active:to-orange-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span className="text-2xl group-hover:rotate-12 transition-transform">
                    🍺
                  </span>
                  <span className="text-lg">Nueva Ruta</span>
                </Link>

                <Link
                  href="/routes"
                  className="flex items-center justify-center gap-3 bg-white hover:bg-amber-50 text-amber-900 font-bold py-4 px-6 rounded-2xl shadow-sm border border-amber-100 transition-all active:scale-95 active:bg-amber-100"
                >
                  <span className="text-2xl">📋</span>
                  <span className="text-lg">Mis Rutas</span>
                </Link>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="group flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 active:from-amber-600 active:to-orange-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                <span className="text-2xl group-hover:rotate-12 transition-transform">
                  👋
                </span>
                <span className="text-lg">Empezar</span>
              </Link>
            )}
          </div>

          <div className="mt-6 flex justify-center gap-4 text-xs font-medium text-amber-800/60">
            <Link href="/legal/privacidad" className="hover:text-amber-800 transition-colors">
              Privacidad
            </Link>
            <span>•</span>
            <Link href="/legal/terminos" className="hover:text-amber-800 transition-colors">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  label,
  delay,
}: {
  icon: string;
  label: string;
  delay: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg text-white transition-transform hover:-translate-y-1"
      style={{ animationDelay: delay }}
    >
      <span className="text-3xl mb-1 drop-shadow-sm">{icon}</span>
      <span className="text-xs font-semibold tracking-wide opacity-90">
        {label}
      </span>
    </div>
  );
}
