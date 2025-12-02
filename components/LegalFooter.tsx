"use client";

import Link from "next/link";

export default function LegalFooter() {
  return (
    <footer className="bg-slate-50 border-t py-4 px-4 text-center text-xs text-slate-500 safe-area-bottom">
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link href="/legal/privacidad" className="hover:text-amber-600 transition-colors">
          Privacidad
        </Link>
        <Link href="/legal/terminos" className="hover:text-amber-600 transition-colors">
          Terminos
        </Link>
        <Link href="/legal/aviso" className="hover:text-amber-600 transition-colors">
          Aviso Legal
        </Link>
        <Link href="/legal/cookies" className="hover:text-amber-600 transition-colors">
          Cookies
        </Link>
      </div>
      <p className="mt-2">
        &copy; {new Date().getFullYear()} Birracrucis. Bebe con responsabilidad.
      </p>
    </footer>
  );
}
