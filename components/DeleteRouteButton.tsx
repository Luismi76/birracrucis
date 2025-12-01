"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteRouteButton({ routeId, routeName }: { routeId: string, routeName: string }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Evitar navegación si está dentro de un Link
        e.stopPropagation();

        if (!confirm(`¿Estás seguro de que quieres eliminar la ruta "${routeName}"?`)) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/routes/${routeId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Error al eliminar");

            router.refresh(); // Recargar datos del servidor
            // Si estamos en la página de detalle, volver al listado
            if (window.location.pathname.includes(routeId)) {
                router.push("/routes");
            }
        } catch (error) {
            alert("Error al eliminar la ruta");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors"
            title="Eliminar ruta"
        >
            {isDeleting ? "⏳" : "🗑️"}
        </button>
    );
}
