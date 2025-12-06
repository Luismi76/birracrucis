"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Intentar cargar el avatar real desde la DB
  useEffect(() => {
    if (session?.user?.email) {
      // Usar la imagen de sesión como inicial
      setAvatar(session.user.image || null);

      fetch("/api/user/profile")
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.profile?.image) {
            setAvatar(data.profile.image);
          }
        })
        .catch(err => console.error("Error loading avatar:", err));
    }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
      >
        Iniciar sesion
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none"
      >
        {avatar ? (
          <Image
            src={avatar}
            alt={session.user?.name || "Usuario"}
            width={32}
            height={32}
            className="rounded-full border-2 border-amber-400"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
            {session.user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="font-medium text-slate-900 truncate">
              {session.user?.name}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {session.user?.email}
            </p>
          </div>
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mi Perfil
          </Link>
          <Link
            href="/routes"
            onClick={() => setIsOpen(false)}
            className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Mis Rutas
          </Link>
          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
