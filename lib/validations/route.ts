import { z } from "zod";

// Validación de fechas segura: acepta string ISO o Date object
const dateSchema = z.union([z.string(), z.date()]).transform((val) => new Date(val)).or(z.null());

// Validación personalizada de coordenadas
const coordinateSchema = z.object({
    lat: z.number().refine(val => !isNaN(val) && val !== 0 && val >= -90 && val <= 90, { message: "Latitud inválida" }),
    lng: z.number().refine(val => !isNaN(val) && val !== 0 && val >= -180 && val <= 180, { message: "Longitud inválida" })
});

const stopSchema = z.object({
    name: z.string().min(1, "El nombre de la parada es obligatorio"),
    address: z.string().optional(),
    lat: coordinateSchema.shape.lat,
    lng: coordinateSchema.shape.lng,
    plannedRounds: z.number().int().min(1).default(1),
    maxRounds: z.number().int().min(1).nullable().optional(),
    googlePlaceId: z.string().nullable().optional(),
    stayDuration: z.number().int().min(5).default(30), // Mínimo 5 minutos
});

export const createRouteSchema = z.object({
    name: z.string().min(3, "El nombre de la ruta debe tener al menos 3 caracteres"),
    date: dateSchema.optional(),
    stops: z.array(stopSchema),
    startMode: z.enum(["manual", "scheduled", "all_present"]).default("manual"),
    startTime: dateSchema.optional(),
    hasEndTime: z.boolean().default(false),
    endTime: dateSchema.optional(),
    isPublic: z.boolean().default(false),
    isDiscovery: z.boolean().default(false),
    createEditionNow: z.boolean().optional(),
    potEnabled: z.boolean().default(false),
    potAmountPerPerson: z.number().min(0).nullable().optional(),
}).refine((data) => {
    // Validación: Si NO es discovery, debe tener al menos 1 parada
    if (!data.isDiscovery && data.stops.length === 0) {
        return false;
    }
    return true;
}, {
    message: "Las rutas normales deben tener al menos una parada",
    path: ["stops"]
}).refine((data) => {
    // Si potEnabled es true, potAmountPerPerson debería ser > 0 (opcional, pero recomendación)
    if (data.potEnabled && (!data.potAmountPerPerson || data.potAmountPerPerson <= 0)) {
        // No fallamos estrictamente aquí si permitimos bote abierto, pero asumiremos monto fijo si se activa.
        // Dejamos flexible por ahora, pero podríamos forzarlo.
        return true;
    }
    return true;
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
