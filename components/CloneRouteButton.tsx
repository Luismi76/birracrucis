"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CloneRouteButtonProps {
    routeId: string;
    routeName: string;
    variant?: "icon" | "full";
    className?: string;
    label?: string;
}

export default function CloneRouteButton({ routeId, routeName, variant = "full", className = "", label = "Utilizar plantilla" }: CloneRouteButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleClone = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation if inside a Link
        e.stopPropagation();

        if (!confirm(`¿Quieres crear una nueva ruta basada en "${routeName}"?`)) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/routes/${routeId}/clone`, {
                method: "POST",
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al clonar la ruta");
            }

            toast.success("Ruta clonada correctamente. Ahora puedes editarla.");
            router.push(`/routes/${data.route.id}/edit`);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error al clonar la ruta");
        } finally {
            setLoading(false);
        }
    };

    if (variant === "icon") {
        return (
            <button
                onClick={handleClone}
                disabled={loading}
                className={`p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 ${className}`}
                title="Clonar ruta"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <span>📋</span>
                )}
            </button>
        );
    }

    return (
        <button
            onClick={handleClone}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 ${className}`}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            ) : (
                <>
                    <span>📋</span> {label}
                </>
            )}
        </button>
    );
}
