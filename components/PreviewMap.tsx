"use client";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useMemo } from "react";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";

type Stop = {
    lat: number;
    lng: number;
};

type PreviewMapProps = {
    stops: Stop[];
};

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    scrollwheel: false,
    draggable: true,
    clickableIcons: false,
};

export default function PreviewMap({ stops }: PreviewMapProps) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    });

    // Calcular centro
    const center = useMemo(() => {
        if (!stops.length) return { lat: 40.4168, lng: -3.7038 };

        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        stops.forEach(s => {
            if (s.lat < minLat) minLat = s.lat;
            if (s.lat > maxLat) maxLat = s.lat;
            if (s.lng < minLng) minLng = s.lng;
            if (s.lng > maxLng) maxLng = s.lng;
        });

        return {
            lat: (minLat + maxLat) / 2,
            lng: (minLng + maxLng) / 2
        };
    }, [stops]);

    if (!isLoaded) return <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">Cargando mapa...</div>;

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={14}
            options={mapOptions}
        >
            {stops.map((stop, i) => (
                <Marker
                    key={i}
                    position={{ lat: stop.lat, lng: stop.lng }}
                    label={{ text: (i + 1).toString(), color: "white", fontWeight: "bold" }}
                />
            ))}
        </GoogleMap>
    );
}
