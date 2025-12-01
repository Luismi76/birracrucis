"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Cache por defecto 30 segundos
                        staleTime: 30 * 1000,
                        // Mantener en cache 5 minutos
                        gcTime: 5 * 60 * 1000,
                        // Reintentar 2 veces en caso de error
                        retry: 2,
                        // No refetch en window focus (mejor para móvil)
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
