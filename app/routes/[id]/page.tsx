// app/routes/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import RouteDetailWrapper from "./RouteDetailWrapper";
import ShareInviteCode from "@/components/ShareInviteCode";

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

  const route = await prisma.route.findUnique({
    where: { id },
    include: {
      stops: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!route) {
    return notFound();
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

  return (
    <div className="flex flex-col h-screen">
      {/* Header - Fixed */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{route.name}</h1>
          <p className="text-xs text-slate-600">
            {new Date(route.date).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href={`/routes/${id}/edit`} className="text-sm text-amber-700 underline">
            ✏️ Editar
          </Link>
          <Link href="/routes" className="text-sm text-amber-700 underline">
            ← Volver
          </Link>
        </div>
      </div>

      {/* Compartir - Solo si tiene inviteCode */}
      {route.inviteCode && (
        <div className="px-4 py-3 bg-white border-b">
          <ShareInviteCode inviteCode={route.inviteCode} routeName={route.name} />
        </div>
      )}

      <RouteDetailWrapper stops={clientStops} />
    </div>
  );
}
