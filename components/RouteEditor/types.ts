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
    date: string; // ISO string
    stops: RouteStop[];
};

export interface RouteEditorProps {
    initialData?: RouteData;
}
