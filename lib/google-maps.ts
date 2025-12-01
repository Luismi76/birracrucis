import { Libraries } from "@react-google-maps/api";

// Configuración centralizada para Google Maps
// Las libraries deben ser constantes fuera del componente para evitar
// el warning "LoadScript has been reloaded unintentionally"

export const GOOGLE_MAPS_LIBRARIES: Libraries = ["places"];

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
