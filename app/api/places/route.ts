// src/app/api/places/route.ts
import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

type GooglePlace = {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
};

type GooglePlacesResponse = {
  status: string;
  results?: GooglePlace[];
};

type BarResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  userRatingsTotal: number;
};

async function fetchPlacesByType(
  type: "bar" | "restaurant",
  lat: string,
  lng: string,
  radius: string
): Promise<GooglePlace[]> {
  if (!GOOGLE_API_KEY) {
    throw new Error("No está configurado GOOGLE_MAPS_API_KEY en el .env");
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  );

  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", radius);
  url.searchParams.set("type", type);
  url.searchParams.set("key", GOOGLE_API_KEY);

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text();
    console.error(
      `Error respuesta Google Places (${type}):`,
      res.status,
      text
    );
    throw new Error(
      `Error al llamar a Google Places (${type}): ${res.status}`
    );
  }

  const data = (await res.json()) as GooglePlacesResponse;

  if (data.status === "OK") {
    return data.results ?? [];
  }

  if (data.status === "ZERO_RESULTS") {
    return [];
  }

  console.error(`Respuesta no OK de Places (${type}):`, data);
  throw new Error(`Google Places (${type}) devolvió estado ${data.status}`);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius") ?? "800"; // metros (por defecto 800m)

    if (!lat || !lng) {
      return NextResponse.json(
        { ok: false, error: "Parámetros lat y lng son obligatorios" },
        { status: 400 }
      );
    }

    // Validar que sean números válidos
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return NextResponse.json(
        { ok: false, error: "Las coordenadas deben ser números válidos" },
        { status: 400 }
      );
    }

    // Validar rangos válidos de coordenadas
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return NextResponse.json(
        { ok: false, error: "Las coordenadas están fuera de rango válido" },
        { status: 400 }
      );
    }

    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "No está configurado GOOGLE_MAPS_API_KEY en el .env" },
        { status: 500 }
      );
    }

    // Pedimos bares y restaurantes en paralelo
    const [barsPlaces, restaurantPlaces] = await Promise.all([
      fetchPlacesByType("bar", lat, lng, radius),
      fetchPlacesByType("restaurant", lat, lng, radius),
    ]);

    // Unimos resultados y eliminamos duplicados por place_id
    const allPlaces = [...barsPlaces, ...restaurantPlaces];
    const uniqueMap = new Map<string, GooglePlace>();

    for (const place of allPlaces) {
      if (!uniqueMap.has(place.place_id)) {
        uniqueMap.set(place.place_id, place);
      }
    }

    const uniquePlaces = Array.from(uniqueMap.values());

    // Filtramos los que no tengan coordenadas válidas
    const validPlaces = uniquePlaces.filter((place) => {
      const loc = place.geometry?.location;
      return (
        loc &&
        typeof loc.lat === "number" &&
        typeof loc.lng === "number"
      );
    });

    const bars: BarResult[] = validPlaces.map((place) => {
      const location = place.geometry!.location!;
      return {
        placeId: place.place_id,
        name: place.name,
        address:
          place.vicinity ??
          place.formatted_address ??
          "",
        lat: location.lat,
        lng: location.lng,
        rating: place.rating ?? null,
        userRatingsTotal: place.user_ratings_total ?? 0,
      };
    });

    return NextResponse.json({
      ok: true,
      count: bars.length,
      bars,
    });
  } catch (error) {
    console.error("Error en GET /api/places:", error);
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
