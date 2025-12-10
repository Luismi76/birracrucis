import { useState, useCallback } from "react";
import { toast } from "sonner";

const DEFAULT_BEER_PRICE = 1.50;
const DEFAULT_TAPA_PRICE = 3.00;

type Stop = {
  id: string;
  name: string;
  plannedRounds: number;
  actualRounds: number;
};

type BarPrices = Record<string, { beer: number; tapa: number }>;

type UseRouteStateOptions = {
  stops: Stop[];
  routeId: string;
  currentUserId?: string;
};

type UseRouteStateReturn = {
  // Precios
  barPrices: BarPrices;
  setBarPrice: (stopId: string, type: 'beer' | 'tapa', price: number) => void;

  // Rondas
  rounds: Record<string, number>;

  // Contadores de consumo
  beers: Record<string, number>;
  tapas: Record<string, number>;

  // Totales
  totalSpent: number;
  totalBeers: number;
  totalTapas: number;

  // Índice del bar actual
  currentBarIndex: number;
  setCurrentBarIndex: (index: number | ((prev: number) => number)) => void;

  // Acciones
  addRound: (stopId: string, participantsAtBar: number) => Promise<void>;
  goToNextBar: () => void;

  // Estado derivado
  isRouteComplete: boolean;
  completedStops: number;
  canFinishRoute: boolean;
};

export function useRouteState({
  stops,
  routeId,
  currentUserId,
}: UseRouteStateOptions): UseRouteStateReturn {
  // Precios por bar
  const [barPrices, setBarPrices] = useState<BarPrices>(() => {
    const initial: BarPrices = {};
    stops.forEach((s) => {
      initial[s.id] = { beer: DEFAULT_BEER_PRICE, tapa: DEFAULT_TAPA_PRICE };
    });
    return initial;
  });

  // Rondas por bar
  const [rounds, setRounds] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    stops.forEach((s) => {
      initial[s.id] = s.actualRounds;
    });
    return initial;
  });

  // Contadores de bebidas y tapas
  const [beers, setBeers] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    stops.forEach((s) => {
      initial[s.id] = 0;
    });
    return initial;
  });

  const [tapas, setTapas] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    stops.forEach((s) => {
      initial[s.id] = 0;
    });
    return initial;
  });

  // Índice del bar actual
  const [currentBarIndex, setCurrentBarIndex] = useState(() => {
    const index = stops.findIndex(s => s.actualRounds < s.plannedRounds);
    return index !== -1 ? index : stops.length - 1;
  });

  // Actualizar precio de un bar
  const setBarPrice = useCallback((stopId: string, type: 'beer' | 'tapa', price: number) => {
    setBarPrices(prev => ({
      ...prev,
      [stopId]: { ...prev[stopId], [type]: price }
    }));
  }, []);

  // Añadir ronda
  const addRound = useCallback(async (stopId: string, participantsAtBar: number) => {
    // Vibrar
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (!navigator.onLine) {
      toast.error("No tienes conexión a internet");
      return;
    }

    // Actualización optimista
    setRounds(prev => ({ ...prev, [stopId]: (prev[stopId] || 0) + 1 }));
    setBeers(prev => ({ ...prev, [stopId]: (prev[stopId] || 0) + participantsAtBar }));

    // Calcular coste de la ronda
    const beerPrice = barPrices[stopId]?.beer || DEFAULT_BEER_PRICE;
    const Decimal = (await import('decimal.js')).default;
    const roundCost = new Decimal(beerPrice).times(participantsAtBar).toNumber();

    try {
      // Check-in en el bar
      const res = await fetch(`/api/stops/${stopId}/checkin`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to check in');

      // Registrar bebidas
      for (let i = 0; i < participantsAtBar; i++) {
        fetch(`/api/routes/${routeId}/drinks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stopId, type: 'beer' }),
        }).catch(console.error);
      }

      // Actualizar gasto del bote
      const currentStop = stops.find(s => s.id === stopId);
      const description = `Ronda en ${currentStop?.name || 'bar'} (${participantsAtBar} ${participantsAtBar === 1 ? 'persona' : 'personas'})`;

      await fetch(`/api/routes/${routeId}/pot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'spend',
          amount: roundCost,
          description,
        }),
      });

      // Gamificación
      if (currentUserId) {
        try {
          const { recordBeerConsumption, awardAchievement } = await import('@/lib/gamification-helpers');
          await recordBeerConsumption(routeId, currentUserId, stopId, 1);
          await awardAchievement(routeId, currentUserId, 'first_beer');
        } catch (gamificationError) {
          console.error('Gamification error:', gamificationError);
        }
      }

      toast.success("¡Ronda registrada!");
    } catch (err) {
      console.error(err);
      // Revertir actualización optimista
      setRounds(prev => ({ ...prev, [stopId]: Math.max(0, (prev[stopId] || 0) - 1) }));
      setBeers(prev => ({ ...prev, [stopId]: Math.max(0, (prev[stopId] || 0) - participantsAtBar) }));
      toast.error("Error al registrar la ronda. Inténtalo de nuevo.");
    }
  }, [barPrices, routeId, stops, currentUserId]);

  // Ir al siguiente bar
  const goToNextBar = useCallback(() => {
    if (currentBarIndex < stops.length - 1) {
      setCurrentBarIndex(prev => prev + 1);
    } else {
      setCurrentBarIndex(stops.length);
    }
  }, [currentBarIndex, stops.length]);

  // Calcular totales
  const totalSpent = stops.reduce((sum, stop) => {
    const prices = barPrices[stop.id] || { beer: DEFAULT_BEER_PRICE, tapa: DEFAULT_TAPA_PRICE };
    return sum + (beers[stop.id] || 0) * prices.beer + (tapas[stop.id] || 0) * prices.tapa;
  }, 0);

  const totalBeers = Object.values(beers).reduce((sum, b) => sum + b, 0);
  const totalTapas = Object.values(tapas).reduce((sum, t) => sum + t, 0);

  // Estado derivado
  const isRouteComplete = currentBarIndex >= stops.length;
  const completedStops = stops.filter(s => (rounds[s.id] || 0) >= s.plannedRounds).length;

  const lastStop = stops[stops.length - 1];
  const canFinishRoute =
    currentBarIndex >= stops.length - 1 &&
    lastStop &&
    (rounds[lastStop.id] || 0) >= lastStop.plannedRounds;

  return {
    barPrices,
    setBarPrice,
    rounds,
    beers,
    tapas,
    totalSpent,
    totalBeers,
    totalTapas,
    currentBarIndex,
    setCurrentBarIndex,
    addRound,
    goToNextBar,
    isRouteComplete,
    completedStops,
    canFinishRoute,
  };
}
