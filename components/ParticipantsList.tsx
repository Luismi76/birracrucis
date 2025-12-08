"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { useRouteStream } from "@/hooks/useRouteStream";
import { distanceInMeters, timeAgo } from "@/lib/geo-utils";

type Participant = {
  id: string;
  odId?: string;
  odIduserId?: string;
  name: string | null;
  image: string | null;
  lat: number;
  lng: number;
  lastSeenAt: string | null;
  isActive?: boolean;
  joinedAt?: string;
};

type Stop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type ParticipantsListProps = {
  routeId: string;
  currentUserId?: string;
  currentStop?: Stop | null;
  userPosition?: { lat: number; lng: number } | null;
  participants: Participant[];
};

const RADIUS_METERS = 100;

export default function ParticipantsList({
  routeId,
  currentUserId,
  currentStop,
  userPosition,
  participants,
}: ParticipantsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // SSE handling removed (lifted up)
  /* Internal SSE removed - using props */
  /*
  const handleParticipants = useCallback((data: Participant[]) => {
    setParticipants(data);
  }, []);

  const { status } = useRouteStream({
     routeId,
     enabled: true,
     onParticipants: handleParticipants,
   });
  const status = "disconnected"; 
  */

  const loading = participants.length === 0;

  // Clasificar participantes con memoización
  const { atBar, away, unknown } = useMemo(() => {
    const classifyParticipant = (p: Participant) => {
      if (!p.lat || !p.lng || p.lat === 0 || p.lng === 0 || !p.lastSeenAt) {
        return "unknown";
      }
      if (!currentStop) return "unknown";
      const dist = distanceInMeters(p.lat, p.lng, currentStop.lat, currentStop.lng);
      if (dist <= RADIUS_METERS) return "atBar";
      return "away";
    };

    return {
      atBar: participants.filter(p => classifyParticipant(p) === "atBar"),
      away: participants.filter(p => classifyParticipant(p) === "away"),
      unknown: participants.filter(p => classifyParticipant(p) === "unknown"),
    };
  }, [participants, currentStop]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Header - siempre visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex -space-x-2">
              {participants.slice(0, 4).map((p, i) => (
                <div
                  key={p.id || i}
                  className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-medium overflow-hidden"
                  style={{ zIndex: 4 - i }}
                >
                  {p.image ? (
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    p.name?.charAt(0) || "?"
                  )}
                </div>
              ))}
              {participants.length > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center text-xs font-bold">
                  +{participants.length - 4}
                </div>
              )}
            </div>
          </div>
          <div className="text-left">
            <p className="font-medium text-slate-800">
              {participants.length} Participante{participants.length !== 1 ? "s" : ""}
            </p>
            {currentStop && (
              <p className="text-xs text-slate-500">
                {atBar.length} en el bar, {away.length} de camino
              </p>
            )}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Lista expandida */}
      {isExpanded && (
        <div className="border-t divide-y">
          {/* En el bar */}
          {atBar.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                En el bar ({atBar.length})
              </p>
              <div className="space-y-2">
                {atBar.map((p) => (
                  <ParticipantRow
                    key={p.id}
                    participant={p}
                    isCurrentUser={p.id === currentUserId}
                    status="atBar"
                    currentStop={currentStop}
                  />
                ))}
              </div>
            </div>
          )}

          {/* De camino */}
          {away.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                De camino ({away.length})
              </p>
              <div className="space-y-2">
                {away.map((p) => (
                  <ParticipantRow
                    key={p.id}
                    participant={p}
                    isCurrentUser={p.id === currentUserId}
                    status="away"
                    currentStop={currentStop}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sin ubicacion */}
          {unknown.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-300 rounded-full" />
                Sin ubicacion ({unknown.length})
              </p>
              <div className="space-y-2">
                {unknown.map((p) => (
                  <ParticipantRow
                    key={p.id}
                    participant={p}
                    isCurrentUser={p.id === currentUserId}
                    status="unknown"
                    currentStop={currentStop}
                  />
                ))}
              </div>
            </div>
          )}

          {participants.length === 0 && (
            <div className="p-6 text-center text-slate-400">
              <p>No hay participantes todavia</p>
              <p className="text-sm">Comparte el codigo de invitacion!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ParticipantRow = memo(function ParticipantRow({
  participant,
  isCurrentUser,
  status,
  currentStop,
}: {
  participant: Participant;
  isCurrentUser: boolean;
  status: "atBar" | "away" | "unknown";
  currentStop?: Stop | null;
}) {
  const distance = useMemo(() => {
    if (!currentStop || !participant.lat || !participant.lng) return null;
    return Math.round(distanceInMeters(participant.lat, participant.lng, currentStop.lat, currentStop.lng));
  }, [currentStop, participant.lat, participant.lng]);

  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg ${isCurrentUser ? "bg-amber-50" : "bg-slate-50"}`}>
      {/* Avatar */}
      <div className="relative">
        {participant.image ? (
          <img
            src={participant.image}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center font-medium text-slate-600">
            {participant.name?.charAt(0) || "?"}
          </div>
        )}
        {/* Indicador de estado */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${status === "atBar"
            ? "bg-green-500"
            : status === "away"
              ? "bg-orange-500"
              : "bg-slate-300"
            }`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 truncate flex items-center gap-1">
          {participant.name || "Anonimo"}
          {isCurrentUser && (
            <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
              Tu
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500">
          {status === "atBar" && "En el bar"}
          {status === "away" && distance && `A ${distance}m del bar`}
          {status === "unknown" && "Ubicacion no disponible"}
          {participant.lastSeenAt && (
            <span className="text-slate-400"> · {timeAgo(participant.lastSeenAt)}</span>
          )}
        </p>
      </div>

      {/* Indicador visual */}
      {status === "atBar" && (
        <span className="text-green-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </span>
      )}
      {status === "away" && (
        <span className="text-orange-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
      )}
    </div>
  );
});
