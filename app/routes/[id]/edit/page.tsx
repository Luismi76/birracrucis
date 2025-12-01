import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RouteEditor from "@/components/RouteEditor";

interface EditRoutePageProps {
    params: Promise<{ id: string }>;
}

export default async function EditRoutePage({ params }: EditRoutePageProps) {
    const { id } = await params;

    const route = await prisma.route.findUnique({
        where: { id },
        include: { stops: true },
    });

    if (!route) {
        notFound();
    }

    // Serializar fechas para pasar a Client Component
    const serializedRoute = {
        ...route,
        date: route.date.toISOString(),
        stops: route.stops.map(stop => ({
            ...stop,
            maxRounds: stop.maxRounds ?? null,
            googlePlaceId: stop.googlePlaceId ?? null,
        })),
    };

    return <RouteEditor initialData={serializedRoute} />;
}
