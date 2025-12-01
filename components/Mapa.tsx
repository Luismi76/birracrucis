"use client";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";

const defaultCenter = { lat: 43.36, lng: -5.84 }; // tu pueblo de prueba

export function MapaZona() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <div className="w-full h-[400px]">
      <GoogleMap
        zoom={14}
        center={defaultCenter}
        mapContainerClassName="w-full h-full"
      >
        {/* luego aquí metemos los markers de bares */}
      </GoogleMap>
    </div>
  );
}
