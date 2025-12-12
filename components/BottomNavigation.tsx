"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function BottomNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // No mostrar en paginas de auth o si no hay sesion
  if (!session || pathname.startsWith("/auth") || pathname.startsWith("/admin")) {
    return null;
  }

  // No mostrar en la landing page
  if (pathname === "/") {
    return null;
  }

  // No mostrar en creacion/edicion de rutas (tienen su propia UI completa)
  if (pathname === "/routes/new" || pathname.includes("/edit")) {
    return null;
  }

  // No mostrar dentro de una ruta activa (tiene su propia navegacion) O en la comunidad (mapa full screen)
  if ((pathname.match(/^\/routes\/[^/]+$/) && !pathname.includes("/history")) || pathname === "/routes/community") {
    return null;
  }

  const navItems = [
    {
      href: "/routes",
      label: "Rutas",
      icon: (active: boolean) => (
        <svg className={`w-6 h-6 ${active ? "text-amber-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      href: "/routes/new",
      label: "Nueva",
      icon: (active: boolean) => (
        <div className={`w-12 h-12 -mt-6 rounded-full flex items-center justify-center shadow-lg ${active ? "bg-amber-500" : "bg-amber-500"}`}>
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      ),
      special: true,
    },
    {
      href: "/profile",
      label: "Perfil",
      icon: (active: boolean) => (
        <svg className={`w-6 h-6 ${active ? "text-amber-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href !== "/routes/new");

          if (item.special) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center touch-target active-scale"
                aria-label="Crear nueva ruta"
              >
                {item.icon(isActive)}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 py-2 px-4 touch-target active-scale"
              aria-label={item.label}
            >
              {item.icon(isActive)}
              <span className={`text-xs font-medium ${isActive ? "text-amber-500" : "text-slate-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
