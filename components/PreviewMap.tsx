"use client";

import { GoogleMap, Marker, useLoadScript, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { useMemo, useState, useCallback, useEffect } from "react";
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

    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

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

    const directionsCallback = useCallback((
        result: google.maps.DirectionsResult | null,
        status: google.maps.DirectionsStatus
    ) => {
        if (status === "OK" && result) {
            setDirectionsResponse(result);
        }
    }, []);

    // Reset directions if stops change
    useEffect(() => {
        setDirectionsResponse(null);
    }, [stops]);

    if (!isLoaded) return <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">Cargando mapa...</div>;

    const origin = stops.length > 0 ? { lat: stops[0].lat, lng: stops[0].lng } : null;
    const destination = stops.length > 1 ? { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng } : null;
    const waypoints = stops.length > 2
        ? stops.slice(1, -1).map(stop => ({ location: { lat: stop.lat, lng: stop.lng }, stopover: true }))
        : [];

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={14}
            options={mapOptions}
        >
            {/* Directions Service */}
            {origin && destination && !directionsResponse && (
                <DirectionsService
                    options={{
                        origin,
                        destination,
                        waypoints,
                        travelMode: google.maps.TravelMode.WALKING,
                    }}
                    callback={directionsCallback}
                />
            )}

            {/* Directions Renderer */}
            {directionsResponse && (
                <DirectionsRenderer
                    options={{
                        directions: directionsResponse,
                        suppressMarkers: true,
                        polylineOptions: {
                            strokeColor: "#8b5cf6", // Violeta
                            strokeOpacity: 0.7,
                            strokeWeight: 4,
                        }
                    }}
                />
            )}

            {stops.map((stop, i) => (
                <Marker
                    key={i}
                    position={{ lat: stop.lat, lng: stop.lng }}
                    label={{ text: (i + 1).toString(), color: "white", fontWeight: "bold" }}
                    icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 12,
                        fillColor: "#f59e0b",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "white",
                    }}
                />
            ))}
        </GoogleMap>
    );
}
