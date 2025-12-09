"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global Error:", error);
    }, [error]);

    return (
        <html>
            <body className="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-4 text-center font-sans">
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl font-black mb-4">Error Crítico</h1>
                    <p className="mb-8 text-lg text-slate-600">
                        Algo ha ido muy mal y no podemos cargar la aplicación.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
                    >
                        Recargar aplicación
                    </button>
                </div>
            </body>
        </html>
    );
}
