"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Application Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                ¡Se ha derramado la cerveza!
            </h2>

            <p className="text-slate-600 dark:text-slate-400 max-w-md mb-2">
                Ha ocurrido un error inesperado. No te preocupes, suele arreglarse pidiendo otra ronda.
            </p>

            {error.message && (
                <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded text-xs font-mono text-slate-500 max-w-xs mb-6 truncate w-full">
                    Error: {error.message}
                </div>
            )}

            <Button
                onClick={reset}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 gap-2"
            >
                <RefreshCcw className="w-4 h-4" />
                Intentar de nuevo
            </Button>
        </div>
    );
}
