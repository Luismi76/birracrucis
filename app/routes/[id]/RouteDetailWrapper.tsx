"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import RouteDetailMap from "@/components/RouteDetailMap";
import RouteDetailClient from "./RouteDetailClient";
import ShareInviteCode from "@/components/ShareInviteCode";
import UserMenu from "@/components/UserMenu";

type Stop = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  plannedRounds: number;
  maxRounds: number | null;
  actualRounds: number;
};

type Participant = {
  odId: string;
  odIduserId: string;
  name: string | null;
  image: string | null;
  lat: number;
  lng: number;
  lastSeenAt: string;
};

type RouteDetailWrapperProps = {
  routeId: string;
  routeName: string;
  routeDate: string;
  startTime: string;
  routeStatus: string;
  currentUserId?: string;
  inviteCode: string | null;
  stops: Stop[];
  isCreator: boolean;
  creatorName: string | null;
  participantsCount: number;
};

export default function RouteDetailWrapper({
  routeId,
  routeName,
  routeDate,
  startTime,
  routeStatus,
  currentUserId,
  inviteCode,
  stops,
  isCreator,
  creatorName,
  participantsCount,
}: RouteDetailWrapperProps) {
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleParticipantsChange = useCallback((newParticipants: Participant[]) => {
    setParticipants(newParticipants);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header Compacto */}
      <header className="bg-white border-b shadow-sm safe-area-top">
        <div className="px-4 py-3">
          {/* Fila superior: Volver + Nombre + Acciones */}
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/routes"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            <div className="flex-1 min-w-0 text-center">
              <h1 className="text-lg font-bold text-slate-900 truncate">{routeName}</h1>
              <p className="text-xs text-slate-500">
                {new Date(routeDate).toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Botón Mapa */}
              <button
                onClick={() => setShowMap(!showMap)}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  showMap ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                title={showMap ? "Ocultar mapa" : "Ver mapa"}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>

              {/* Botón Compartir */}
              {inviteCode && (
                <button
                  onClick={() => setShowShare(!showShare)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                    showShare ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Compartir"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              )}

              {/* Botón Editar - Solo para creador */}
              {isCreator && (
                <Link
                  href={`/routes/${routeId}/edit`}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  title="Editar ruta"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
              )}

              {/* Menu de usuario */}
              <UserMenu />
            </div>
          </div>

          {/* Info del creador y participantes */}
          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-slate-500">
            {creatorName && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {isCreator ? "Creado por ti" : `Por ${creatorName}`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {participantsCount} {participantsCount === 1 ? "participante" : "participantes"}
            </span>
          </div>
        </div>

        {/* Panel de Compartir (colapsable) */}
        {showShare && inviteCode && (
          <div className="px-4 pb-3 border-t bg-amber-50">
            <div className="pt-3">
              <ShareInviteCode inviteCode={inviteCode} routeName={routeName} />
            </div>
          </div>
        )}
      </header>

      {/* Mapa Colapsable */}
      {showMap && (
        <div className="h-48 md:h-64 relative border-b shrink-0">
          <RouteDetailMap stops={stops} userPosition={userPosition} participants={participants} />
          {/* Botón para cerrar el mapa */}
          <button
            onClick={() => setShowMap(false)}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-2 shadow-lg hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Contenido Principal - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pb-safe">
          <RouteDetailClient
            stops={stops}
            routeId={routeId}
            routeName={routeName}
            routeDate={routeDate}
            startTime={startTime}
            routeStatus={routeStatus}
            currentUserId={currentUserId}
            onPositionChange={setUserPosition}
            onParticipantsChange={handleParticipantsChange}
            isCreator={isCreator}
          />
        </div>
      </main>

      {/* Mini FAB para mostrar mapa si está oculto */}
      {!showMap && (
        <button
          onClick={() => setShowMap(true)}
          className="fixed bottom-6 right-6 bg-amber-500 text-white rounded-full p-4 shadow-lg hover:bg-amber-600 hover:shadow-xl transition-all active:scale-95 z-10"
          title="Ver mapa"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
