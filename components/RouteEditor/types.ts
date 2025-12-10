// Tipos compartidos para RouteEditor

export type PlaceResult = {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating: number | null;
    userRatingsTotal: number;
};

export type BarConfig = {
    placeId: string;
    bar: PlaceResult;
    plannedRounds: number;
    maxRounds?: number;
    isStart: boolean;
    stayDuration: number; // minutos de estancia en el bar
};

export type RouteStop = {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    order: number;
    plannedRounds: number;
    maxRounds: number | null;
    googlePlaceId: string | null;
};

export type RouteData = {
    id: string;
    name: string;
    date: string | null; // ISO string
    stops: RouteStop[];
    // Campos de configuración de tiempo
    startMode: "manual" | "scheduled" | "all_present";
    startTime: string | null; // ISO string
    hasEndTime: boolean;
    endTime: string | null; // ISO string
    defaultStayDuration?: number;
    // Campos de visibilidad
    isPublic: boolean;
    isDiscovery?: boolean;
    description: string | null;
    originalRouteId?: string | null;
};

export interface RouteEditorProps {
    initialData?: RouteData;
}
