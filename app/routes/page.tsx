// src/app/routes/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteRouteButton from "@/components/DeleteRouteButton";
import UserMenu from "@/components/UserMenu";

// Desactivar caché para que siempre muestre datos frescos
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RoutesPage() {
  const routes = await prisma.route.findMany({
    include: { stops: true },
    orderBy: { date: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Birracrucis creados</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/routes/new"
            className="text-sm px-3 py-2 rounded bg-amber-600 text-white"
          >
            + Nuevo
          </Link>
          <UserMenu />
        </div>
      </div>

      {routes.length === 0 && (
        <p className="text-sm text-slate-600">
          Aún no hay rutas creadas. Crea la primera desde{" "}
          <Link href="/routes/new" className="text-amber-700 underline">
            aquí
          </Link>
          .
        </p>
      )}

      <div className="space-y-3">
        {routes.map((route) => (
          <Link
            key={route.id}
            href={`/routes/${route.id}`}
            className="block border rounded p-3 hover:bg-slate-50 transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">{route.name}</h2>
                <p className="text-xs text-slate-600">
                  {new Date(route.date).toLocaleString()}
                </p>
              </div>
              <div className="text-right text-xs text-slate-700 flex flex-col items-end gap-2">
                <p>
                  {route.stops.length}{" "}
                  {route.stops.length === 1 ? "bar" : "bares"}
                </p>
                <DeleteRouteButton routeId={route.id} routeName={route.name} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
