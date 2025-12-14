import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HistoryList from "@/components/HistoryList";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import UserMenu from "@/components/UserMenu";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Historial de Rutas | Birracrucis",
  description: "Consulta tus rutas pasadas y estadísticas.",
};

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  // Obtener rutas completadas donde el usuario participó
  const completedRoutes = await prisma.route.findMany({
    where: {
      status: "completed",
      OR: [
        { creatorId: user.id },
        { participants: { some: { userId: user.id } } },
      ],
    },
    include: {
      stops: {
        orderBy: { order: "asc" },
        include: {
          ratings: {
            where: { userId: user.id },
            select: { rating: true },
          },
        },
      },
      creator: { select: { name: true, image: true } },
      _count: {
        select: {
          participants: true,
          photos: true,
          drinks: true,
        },
      },
      drinks: {
        where: { userId: user.id },
        select: { id: true },
      },
      photos: {
        where: { userId: user.id },
        select: { id: true },
      },
    },
    orderBy: { actualEndTime: "desc" },
  });

  // Calcular estadísticas por ruta
  const routesWithStats = completedRoutes.map((route) => {
    const userDrinks = route.drinks.length;
    const userPhotos = route.photos.length;
    const avgRating =
      route.stops.reduce((acc, stop) => {
        const rating = stop.ratings[0]?.rating || 0;
        return acc + rating;
      }, 0) / (route.stops.filter((s) => s.ratings.length > 0).length || 1);

    const duration =
      route.actualStartTime && route.actualEndTime
        ? Math.round(
          (new Date(route.actualEndTime).getTime() -
            new Date(route.actualStartTime).getTime()) /
          60000
        )
        : null;

    return {
      ...route,
      userDrinks,
      userPhotos,
      avgRating: avgRating || 0,
      duration,
    };
  });

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link
            href="/routes"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Historial de Rutas</h1>
        </div>
        <UserMenu />
      </div>

      {routesWithStats.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-4xl mb-3">📜</div>
          <p className="text-slate-600 mb-2">No tienes rutas completadas</p>
          <p className="text-sm text-slate-500">
            Cuando completes una ruta, aparecera aqui con todas las estadisticas
          </p>
          <Link
            href="/routes"
            className="inline-block mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Ver mis rutas
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {routesWithStats.map((route) => (
            <Link
              key={route.id}
              href={`/routes/${route.id}`}
              className="block bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{route.name}</h3>
                    <p className="text-green-100 text-sm">
                      {route.date ? new Date(route.date).toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }) : "Fecha sin definir"}
                    </p>
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    Completada
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="p-4">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{route.stops.length}</p>
                    <p className="text-xs text-slate-500">Bares</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{route.userDrinks}</p>
                    <p className="text-xs text-slate-500">Bebidas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-600">{route.userPhotos}</p>
                    <p className="text-xs text-slate-500">Fotos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {route.avgRating > 0 ? route.avgRating.toFixed(1) : "-"}
                    </p>
                    <p className="text-xs text-slate-500">Rating</p>
                  </div>
                </div>

                {/* Stops visited */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {route.stops.slice(0, 5).map((stop, i) => (
                    <span
                      key={stop.id}
                      className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs"
                    >
                      {i + 1}. {stop.name}
                    </span>
                  ))}
                  {route.stops.length > 5 && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                      +{route.stops.length - 5} mas
                    </span>
                  )}
                </div>

                {/* Footer info */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t">
                  <div className="flex items-center gap-3">
                    {route.creator && (
                      <span className="flex items-center gap-1">
                        {route.creator.image ? (
                          <img
                            src={route.creator.image}
                            alt=""
                            className="w-4 h-4 rounded-full"
                          />
                        ) : (
                          <span>👤</span>
                        )}
                        {route.creatorId === user.id ? "Tu" : route.creator.name}
                      </span>
                    )}
                    <span>👥 {route._count.participants}</span>
                    <span>📸 {route._count.photos}</span>
                  </div>
                  {route.duration && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {Math.floor(route.duration / 60)}h {route.duration % 60}m
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Resumen total */}
      {routesWithStats.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white">
          <h3 className="font-bold mb-3">Resumen Total</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{routesWithStats.length}</p>
              <p className="text-xs text-amber-100">Rutas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {routesWithStats.reduce((acc, r) => acc + r.stops.length, 0)}
              </p>
              <p className="text-xs text-amber-100">Bares</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {routesWithStats.reduce((acc, r) => acc + r.userDrinks, 0)}
              </p>
              <p className="text-xs text-amber-100">Bebidas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {routesWithStats.reduce((acc, r) => acc + r.userPhotos, 0)}
              </p>
              <p className="text-xs text-amber-100">Fotos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
