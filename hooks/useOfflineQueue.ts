import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

type QueuedAction = {
    id: string;
    type: "add_round" | "check_in" | "add_photo" | "send_nudge";
    data: any;
    timestamp: number;
};

export function useOfflineQueue() {
    const [queue, setQueue] = useState<QueuedAction[]>([]);
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== "undefined" ? navigator.onLine : true
    );
    const [isSyncing, setIsSyncing] = useState(false);

    // Detectar cambios en conectividad
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Conexión restaurada. Sincronizando...");
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning("Sin conexión. Las acciones se guardarán localmente.");
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Cargar queue del localStorage
    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = localStorage.getItem("offline_queue");
        if (saved) {
            try {
                setQueue(JSON.parse(saved));
            } catch (e) {
                console.error("Error loading offline queue:", e);
            }
        }
    }, []);

    // Guardar queue en localStorage
    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem("offline_queue", JSON.stringify(queue));
    }, [queue]);

    // Añadir acción a la queue
    const enqueue = useCallback((action: Omit<QueuedAction, "id" | "timestamp">) => {
        const queuedAction: QueuedAction = {
            ...action,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
        };
        setQueue((prev) => [...prev, queuedAction]);
        return queuedAction.id;
    }, []);

    // Sincronizar queue cuando vuelva la conexión
    const syncQueue = useCallback(async () => {
        if (!isOnline || queue.length === 0 || isSyncing) return;

        setIsSyncing(true);
        const errors: string[] = [];

        for (const action of queue) {
            try {
                // Ejecutar acción según tipo
                switch (action.type) {
                    case "add_round":
                        await fetch(`/api/stops/${action.data.stopId}/checkin`, {
                            method: "POST",
                        });
                        break;
                    case "check_in":
                        await fetch(`/api/stops/${action.data.stopId}/checkin`, {
                            method: "POST",
                        });
                        break;
                    case "add_photo":
                        // TODO: Implementar subida de foto
                        break;
                    case "send_nudge":
                        await fetch(`/api/routes/${action.data.routeId}/nudge`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(action.data),
                        });
                        break;
                }
            } catch (error) {
                console.error(`Error syncing action ${action.id}:`, error);
                errors.push(action.id);
            }
        }

        // Remover acciones sincronizadas exitosamente
        setQueue((prev) => prev.filter((a) => errors.includes(a.id)));
        setIsSyncing(false);

        if (errors.length === 0) {
            toast.success(`${queue.length} acciones sincronizadas`);
        } else {
            toast.error(`${errors.length} acciones fallaron al sincronizar`);
        }
    }, [isOnline, queue, isSyncing]);

    // Auto-sincronizar cuando vuelva la conexión
    useEffect(() => {
        if (isOnline && queue.length > 0) {
            syncQueue();
        }
    }, [isOnline, queue.length, syncQueue]);

    return {
        isOnline,
        queue,
        queueSize: queue.length,
        enqueue,
        syncQueue,
        isSyncing,
    };
}
