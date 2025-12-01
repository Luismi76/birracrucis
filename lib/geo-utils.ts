/**
 * Utilidades geográficas y de tiempo centralizadas
 */

/**
 * Calcula la distancia en metros entre dos puntos usando la fórmula de Haversine
 */
export function distanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return Infinity;
    if ((lat1 === 0 && lon1 === 0) || (lat2 === 0 && lon2 === 0)) return Infinity;

    const R = 6371000; // Radio de la Tierra en metros
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Convierte una fecha a texto relativo (hace X minutos/horas)
 */
export function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "Sin conexion";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return "Hace mucho";
}

/**
 * Formatea la distancia de forma legible
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Radio por defecto para considerar que alguien está "en el bar"
 */
export const CHECKIN_RADIUS_METERS = 100;
