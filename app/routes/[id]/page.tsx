// app/routes/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import RouteDetailWrapper from "./RouteDetailWrapper";

type RoutePageProps = {
  // En Next 16 params es una Promise
  params: Promise<{ id: string }>;
};

export default async function RouteDetailPage({ params }: RoutePageProps) {
  const { id } = await params;

  if (!id) {
    console.error("RouteDetailPage sin id en params");
    return notFound();
  }

  // Obtener sesión y ruta en paralelo
  const [session, route] = await Promise.all([
    getServerSession(authOptions),
    prisma.route.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: { order: "asc" },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: { participants: true },
        },
      },
    }),
  ]);

  // Obtener el ID del usuario actual
  let currentUserId: string | undefined;
  if (session?.user?.email) {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    currentUserId = currentUser?.id;
  }

  if (!route) {
    return notFound();
  }

  // Determinar si el usuario actual es el creador
  let isCreator = false;
  if (session?.user?.email && route.creator?.email) {
    isCreator = session.user.email === route.creator.email;
  }

  // Adaptamos los stops al tipo que espera el componente cliente
  const clientStops = route.stops.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    plannedRounds: s.plannedRounds,
    maxRounds: s.maxRounds,
    actualRounds: s.actualRounds,
  }));

  // Formatear startTime como HH:MM
  const startTimeStr = route.startTime
    ? route.startTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "12:00";

  return (
    <RouteDetailWrapper
      routeId={route.id}
      routeName={route.name}
      routeDate={route.date.toISOString()}
      startTime={startTimeStr}
      routeStatus={route.status}
      currentUserId={currentUserId}
      inviteCode={route.inviteCode}
      stops={clientStops}
      isCreator={isCreator}
      creatorName={route.creator?.name || null}
      participantsCount={route._count.participants}
    />
  );
}
