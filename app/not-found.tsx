import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
            <div className="mb-6 relative">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="120"
                    height="120"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-300 dark:text-slate-700"
                >
                    <path d="M7 2h10l-2 18H9L7 2z" />
                    <path d="M4.5 10h15" />
                    <path d="M5 22h14" />
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-4xl font-black text-amber-500 dark:text-amber-400 rotate-12 bg-slate-50 dark:bg-slate-950 px-2 border-2 border-slate-200 dark:border-slate-800 rounded-lg">
                    404
                </div>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                ¡Vaya! La botella está vacía
            </h1>

            <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
                No hemos podido encontrar la página que buscas. Puede que se haya perdido en una ruta de bares o que nunca existió.
            </p>

            <div className="flex gap-4 flex-col sm:flex-row">
                <Link href="/">
                    <Button size="lg" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600">
                        Volver al Inicio
                    </Button>
                </Link>
                <Link href="/create">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                        Crear Nueva Ruta
                    </Button>
                </Link>
            </div>
        </div>
    );
}
