"use client";

import { RefObject } from "react";
import { Beer, Camera, Bell, Trophy, Star, Users, MapPin } from "lucide-react";
import { PhotoCaptureHandle } from "@/components/PhotoCapture";
import BarPlaceInfo from "@/components/BarPlaceInfo";
import CompletedRouteSummary from "@/components/CompletedRouteSummary";
import {
  RouteProgressHeader,
  PaceIndicator,
  PotWidget,
  ParticipantsAtBar,
  NextBarPreview,
  AchievementsToast,
  DrinkComparison,
  WeatherWidget,
  BarChallenge,
  PredictionsPanel,
  QuickReactions,
} from "@/components/route-detail";
import { distanceInMeters, CHECKIN_RADIUS_METERS } from "@/lib/geo-utils";

type Stop = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  plannedRounds: number;
  googlePlaceId?: string | null;
};

type Participant = {
  id: string;
  name: string | null;
  image: string | null;
  lat: number;
  lng: number;
};

type ParticipantWithDistance = {
  id: string;
  name: string | null;
  image: string | null;
  distance: number;
  isAtBar: boolean;
};

type ParticipantWithBeers = {
  id: string;
  name: string | null;
  image: string | null;
  beersCount: number;
};

type NextBarData = {
  barName: string;
  address: string | null;
  distance: number;
  estimatedArrival: string;
  googlePlaceId?: string | null;
};

type PotData = {
  currentAmount: number;
  targetAmount: number;
  participantsCount: number;
  paidCount: number;
};

type BarPrices = { beer: number; tapa: number };

const DEFAULT_BEER_PRICE = 1.50;
const DEFAULT_TAPA_PRICE = 3.00;

type RouteBottomSheetProps = {
  // Route info
  routeId: string;
  routeName: string;
  routeDate: string;
  routeStatus: string;
  startTime: string;

  // Current state
  activeStop: Stop;
  position: { lat: number; lng: number } | null;
  canCheckIn: boolean;
  rounds: Record<string, number>;
  barPrices: Record<string, BarPrices>;
  currentUserId?: string;

  // Data
  potData: PotData;
  participants: Participant[];
  participantsWithDistance: ParticipantWithDistance[];
  participantsWithBeers: ParticipantWithBeers[];
  nextBarData: NextBarData | null;
  barChallenges: any[];

  // Calculated values
  paceMinutes: number;

  // Refs
  photoCaptureRef: RefObject<PhotoCaptureHandle | null>;

  // Handlers
  onAddRound: (stopId: string) => void;
  onOpenPrices: (stopId: string) => void;
  onOpenRanking: () => void;
  onOpenNotifications: () => void;
  onOpenPhotos: () => void;
  onOpenRatings: () => void;
  onOpenGroup: () => void;
  onShare?: () => void;
};

export default function RouteBottomSheet({
  routeId,
  routeName,
  routeDate,
  routeStatus,
  startTime,
  activeStop,
  position,
  canCheckIn,
  rounds,
  barPrices,
  currentUserId,
  potData,
  participants,
  participantsWithDistance,
  participantsWithBeers,
  nextBarData,
  barChallenges,
  paceMinutes,
  photoCaptureRef,
  onAddRound,
  onOpenPrices,
  onOpenRanking,
  onOpenNotifications,
  onOpenPhotos,
  onOpenRatings,
  onOpenGroup,
  onShare,
}: RouteBottomSheetProps) {
  const vibrate = (pattern: number | number[] = 50) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const prices = barPrices[activeStop.id] || { beer: DEFAULT_BEER_PRICE, tapa: DEFAULT_TAPA_PRICE };
  const roundsRemaining = Math.max(0, Math.ceil((potData.targetAmount - potData.currentAmount) / prices.beer));

  // Si la ruta está completada, mostrar resumen
  if (routeStatus === "completed") {
    return (
      <div className="shrink-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-xl rounded-t-3xl z-40 -mt-4 relative animate-slide-up overflow-y-auto max-h-[25vh]">
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full mx-auto mt-3 mb-1" />
        <CompletedRouteSummary
          routeId={routeId}
          routeName={routeName}
          routeDate={routeDate}
          stops={[activeStop] as any}
          participants={participants as any}
          onViewPhotos={onOpenPhotos}
          onViewRatings={onOpenRatings}
          onViewGroup={onOpenGroup}
          onShare={onShare}
        />
      </div>
    );
  }

  return (
    <div className="shrink-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-xl rounded-t-3xl z-40 -mt-4 relative animate-slide-up overflow-y-auto max-h-[35vh]">
      <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full mx-auto mt-3 mb-1" />

      <div className="p-4 pt-1 space-y-4">
        {/* WIDGETS EN GRID 2 COLUMNAS */}
        <div className="grid grid-cols-2 gap-3 items-start">
          <PotWidget
            currentAmount={potData.currentAmount}
            targetAmount={potData.targetAmount}
            participantsCount={potData.participantsCount}
            paidCount={potData.paidCount}
            roundsRemaining={roundsRemaining}
            defaultersCount={potData.participantsCount - potData.paidCount}
            onClick={onOpenGroup}
          />
          <ParticipantsAtBar
            participants={participantsWithDistance}
            barName={activeStop.name}
          />
        </div>

        {/* PACE INDICATOR */}
        <PaceIndicator minutesAhead={paceMinutes} />

        {/* NEXT BAR PREVIEW */}
        {nextBarData && (
          <NextBarPreview
            barName={nextBarData.barName}
            address={nextBarData.address}
            distance={nextBarData.distance}
            estimatedArrival={nextBarData.estimatedArrival}
            googlePlaceId={nextBarData.googlePlaceId}
            onViewOnMap={() => {}}
          />
        )}

        {/* DRINK COMPARISON & WEATHER */}
        <div className="grid grid-cols-2 gap-3 items-start">
          <DrinkComparison
            participants={participantsWithBeers}
            currentUserId={currentUserId}
          />
          <WeatherWidget lat={activeStop.lat} lng={activeStop.lng} />
        </div>

        {/* ACHIEVEMENTS */}
        <AchievementsToast routeId={routeId} enabled={routeStatus !== "completed"} />

        {/* BAR CHALLENGES & PREDICTIONS */}
        <div className="grid grid-cols-2 gap-3 items-start">
          {barChallenges.length > 0 && (
            <BarChallenge
              barName={activeStop.name}
              challenges={barChallenges}
              onCompleteChallenge={async (id) => {
                photoCaptureRef.current?.trigger();
                (window as any).__pendingChallengeId = id;
              }}
            />
          )}
          <PredictionsPanel
            routeId={routeId}
            userId={currentUserId || ""}
            enabled={routeStatus !== "completed"}
            startTime={startTime}
          />
        </div>

        {/* QUICK REACTIONS */}
        <QuickReactions
          routeId={routeId}
          stopId={activeStop.id}
          userId={currentUserId || ""}
        />

        {/* ACCIONES PRINCIPALES */}
        <div className="flex flex-col gap-3 mb-2">
          {!canCheckIn ? (
            <OnTheWayActions
              position={position}
              activeStop={activeStop}
            />
          ) : (
            <AtBarActions
              activeStop={activeStop}
              onAddRound={() => onAddRound(activeStop.id)}
              onOpenRatings={onOpenRatings}
              onOpenGroup={onOpenGroup}
            />
          )}

          {/* BOTONES SIEMPRE VISIBLES */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <ActionButton icon={Camera} label="Foto" onClick={() => photoCaptureRef.current?.trigger()} />
            <ActionButton icon={Bell} label="Avisar" onClick={onOpenNotifications} color="amber" />
            <ActionButton icon={Trophy} label="Ranking" onClick={onOpenRanking} color="purple" />
          </div>
        </div>

        {/* Google Place Info */}
        <div className="mb-2">
          <BarPlaceInfo placeId={activeStop.googlePlaceId} name={activeStop.name} />
        </div>

        {/* Compact Price Display */}
        {canCheckIn && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => onOpenPrices(activeStop.id)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 transition-all"
            >
              <div className="flex items-center justify-center gap-3 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">💰 Precios:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  🍺 {prices.beer.toFixed(2)}€
                </span>
                <span className="text-slate-400 dark:text-slate-500">|</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  🍴 {prices.tapa.toFixed(2)}€
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">(tap para editar)</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Componentes auxiliares
function OnTheWayActions({
  position,
  activeStop,
}: {
  position: { lat: number; lng: number } | null;
  activeStop: Stop;
}) {
  const distMeters = position
    ? distanceInMeters(position.lat, position.lng, activeStop.lat, activeStop.lng)
    : 0;
  const timeMinutes = Math.ceil(distMeters / 80);

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {position && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 text-center">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
            📍 A {Math.round(distMeters)}m · {timeMinutes} min caminando
          </p>
        </div>
      )}

      <button
        onClick={() => {
          const url = `https://www.google.com/maps/dir/?api=1&destination=${activeStop.lat},${activeStop.lng}&travelmode=walking`;
          window.open(url, '_blank');
        }}
        className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <MapPin className="w-5 h-5" />
        <span>Navegar al Bar</span>
      </button>

      <div className="text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          ⚡ Check-in automático activado
        </p>
      </div>
    </div>
  );
}

function AtBarActions({
  activeStop,
  onAddRound,
  onOpenRatings,
  onOpenGroup,
}: {
  activeStop: Stop;
  onAddRound: () => void;
  onOpenRatings: () => void;
  onOpenGroup: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 text-center">
        <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
          ✅ En {activeStop.name}
        </p>
      </div>

      <button
        onClick={onAddRound}
        className="py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white rounded-2xl font-bold shadow-lg shadow-amber-200 dark:shadow-amber-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Beer className="w-5 h-5" />
        <div className="flex flex-col items-start">
          <span className="text-base">Añadir Ronda</span>
          <span className="text-xs text-amber-100">Registra tu consumición</span>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-2">
        <ActionButton icon={Star} label="Valorar" onClick={onOpenRatings} color="amber" />
        <ActionButton icon={Users} label="Grupo" onClick={onOpenGroup} color="blue" />
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  color = "slate",
}: {
  icon: any;
  label: string;
  onClick: () => void;
  color?: "slate" | "amber" | "blue" | "purple";
}) {
  const colorClasses = {
    slate: "text-slate-700 dark:text-slate-200",
    amber: "text-amber-500 dark:text-amber-400",
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  return (
    <button
      onClick={onClick}
      className="p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-slate-600"
    >
      <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
      <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">{label}</div>
    </button>
  );
}
