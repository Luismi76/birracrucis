"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

type RouteInfo = {
  id: string;
  name: string;
  date: string;
  stopsCount: number;
  stops: { id: string; name: string; address: string; order: number }[];
  participantsCount: number;
  creator: { name: string | null; image: string | null } | null;
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  route?: RouteInfo;
  isParticipant?: boolean;
  isAuthenticated?: boolean;
  message?: string;
  alreadyJoined?: boolean;
};

export default function JoinRoutePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const code = params.code as string;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);

  // Cargar información de la ruta
  useEffect(() => {
    async function fetchRouteInfo() {
      if (!code) return;

      try {
        const res = await fetch(`/api/routes/join?code=${encodeURIComponent(code)}`);
        const data: ApiResponse = await res.json();

        if (!data.ok) {
          setError(data.error || "Código no válido");
          return;
        }

        setRouteInfo(data.route || null);
        setIsParticipant(data.isParticipant || false);
      } catch {
        setError("Error al cargar la información");
      } finally {
        setLoading(false);
      }
    }

    fetchRouteInfo();
  }, [code]);

  const handleJoin = async () => {
    if (!session) {
      // Guardar el código en sessionStorage para después del login
      sessionStorage.setItem("pendingJoinCode", code);
      signIn(undefined, { callbackUrl: `/join/${code}` });
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const res = await fetch("/api/routes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data: ApiResponse = await res.json();

      if (!data.ok) {
        setError(data.error || "Error al unirse");
        return;
      }

      // Redirigir a la ruta
      router.push(`/routes/${data.route?.id || routeInfo?.id}`);
    } catch {
      setError("Error al unirse a la ruta");
    } finally {
      setJoining(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando invitación...</p>
        </div>
      </div>
    );
  }

  if (error && !routeInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Código no válido</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!routeInfo) return null;

  const formattedDate = new Date(routeInfo.date).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🍺</div>
          <h1 className="text-2xl font-bold text-slate-800">¡Te han invitado!</h1>
          <p className="text-slate-500 text-sm mt-1">Únete a esta aventura cervecera</p>
        </div>

        {/* Info de la Ruta */}
        <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-100">
          <h2 className="text-xl font-bold text-amber-800 mb-2">{routeInfo.name}</h2>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-slate-600">
              <span>📅</span>
              <span className="capitalize">{formattedDate}</span>
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <span>📍</span>
              <span>{routeInfo.stopsCount} paradas</span>
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <span>👥</span>
              <span>{routeInfo.participantsCount} participantes</span>
            </p>
            {routeInfo.creator?.name && (
              <p className="flex items-center gap-2 text-slate-600">
                <span>👤</span>
                <span>Organizado por {routeInfo.creator.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Lista de Paradas */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
            Itinerario
          </h3>
          <div className="space-y-2">
            {routeInfo.stops.slice(0, 5).map((stop, index) => (
              <div key={stop.id} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{stop.name}</p>
                </div>
              </div>
            ))}
            {routeInfo.stops.length > 5 && (
              <p className="text-sm text-slate-500 pl-9">
                +{routeInfo.stops.length - 5} paradas más...
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Botones */}
        {isParticipant ? (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm text-center">
              Ya eres participante de esta ruta
            </div>
            <Link
              href={`/routes/${routeInfo.id}`}
              className="block w-full bg-amber-500 text-white py-4 rounded-xl font-bold text-center hover:bg-amber-600 transition-colors"
            >
              Ver Ruta
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Uniéndote...
                </>
              ) : session ? (
                <>🎉 ¡Unirme a la Fiesta!</>
              ) : (
                <>🔐 Iniciar Sesión y Unirme</>
              )}
            </button>

            {!session && (
              <p className="text-xs text-slate-500 text-center">
                Necesitas una cuenta para unirte
              </p>
            )}
          </div>
        )}

        {/* Link a inicio */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-amber-600">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
