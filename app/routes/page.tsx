// src/app/routes/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import DeleteRouteButton from "@/components/DeleteRouteButton";
import UserMenu from "@/components/UserMenu";
import MyInvitations from "@/components/MyInvitations";

// Desactivar caché para que siempre muestre datos frescos
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RoutesPage() {
  const session = await getServerSession(authOptions);

  // Si no hay sesión, redirigir al login
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Buscar el usuario en la base de datos
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  // Obtener rutas creadas por el usuario
  const createdRoutes = await prisma.route.findMany({
    where: { creatorId: user.id },
    include: {
      stops: true,
      _count: { select: { participants: true } }
    },
    orderBy: { date: "desc" },
  });

  // Obtener rutas donde el usuario es participante (pero no creador)
  const invitedRoutes = await prisma.route.findMany({
    where: {
      participants: {
        some: { userId: user.id }
      },
      NOT: { creatorId: user.id }
    },
    include: {
      stops: true,
      creator: { select: { name: true } },
      _count: { select: { participants: true } }
    },
    orderBy: { date: "desc" },
  });

  const hasRoutes = createdRoutes.length > 0 || invitedRoutes.length > 0;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mis Birracrucis</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/routes/history"
            className="text-sm px-3 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            title="Historial"
          >
            📜
          </Link>
          <Link
            href="/routes/new"
            className="text-sm px-3 py-2 rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            + Nuevo
          </Link>
          <UserMenu />
        </div>
      </div>

      {/* Invitaciones pendientes */}
      <MyInvitations />

      {!hasRoutes && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-4xl mb-3">🍺</div>
          <p className="text-slate-600 mb-4">
            Aún no tienes rutas. ¡Crea tu primer Birracrucis!
          </p>
          <Link
            href="/routes/new"
            className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Crear ruta
          </Link>
        </div>
      )}

      {/* Rutas creadas por el usuario */}
      {createdRoutes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <span className="text-amber-500">👑</span> Mis rutas creadas ({createdRoutes.length})
          </h2>
          <div className="space-y-3">
            {createdRoutes.map((route) => (
              <Link
                key={route.id}
                href={`/routes/${route.id}`}
                className="block border-2 border-amber-200 bg-amber-50/50 rounded-xl p-4 hover:bg-amber-50 hover:border-amber-300 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-800 truncate">{route.name}</h3>
                      <span className="shrink-0 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                        Creador
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {new Date(route.date).toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span>🍺</span> {route.stops.length} {route.stops.length === 1 ? "bar" : "bares"}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>👥</span> {route._count.participants} {route._count.participants === 1 ? "participante" : "participantes"}
                      </span>
                    </div>
                  </div>
                  <div className="ml-2">
                    <DeleteRouteButton routeId={route.id} routeName={route.name} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Rutas donde el usuario ha sido invitado */}
      {invitedRoutes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <span className="text-blue-500">🎟️</span> Invitaciones ({invitedRoutes.length})
          </h2>
          <div className="space-y-3">
            {invitedRoutes.map((route) => (
              <Link
                key={route.id}
                href={`/routes/${route.id}`}
                className="block border border-slate-200 bg-white rounded-xl p-4 hover:bg-slate-50 hover:border-blue-200 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-800 truncate">{route.name}</h3>
                      <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Invitado
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {new Date(route.date).toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      {route.creator?.name && (
                        <span className="flex items-center gap-1">
                          <span>👤</span> Por {route.creator.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span>🍺</span> {route.stops.length} {route.stops.length === 1 ? "bar" : "bares"}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>👥</span> {route._count.participants}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
