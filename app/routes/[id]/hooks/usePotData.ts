import { useState, useEffect, useCallback } from "react";

type PotData = {
  currentAmount: number;
  targetAmount: number;
  participantsCount: number;
  paidCount: number;
};

type UsePotDataOptions = {
  routeId: string;
  participantsCount: number;
  refreshInterval?: number;
};

type UsePotDataReturn = {
  potData: PotData;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function usePotData({
  routeId,
  participantsCount,
  refreshInterval = 10000,
}: UsePotDataOptions): UsePotDataReturn {
  const [potData, setPotData] = useState<PotData>({
    currentAmount: 0,
    targetAmount: 0,
    participantsCount: 0,
    paidCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPotData = useCallback(async () => {
    if (!routeId) return;

    try {
      const res = await fetch(`/api/routes/${routeId}/pot`);

      if (!res.ok) {
        throw new Error(`Failed to fetch pot data: ${res.status}`);
      }

      const data = await res.json();

      if (data.ok && data.pot) {
        const pot = data.pot;
        const availableBalance = (pot.totalCollected || 0) - (pot.totalSpent || 0);

        setPotData({
          currentAmount: availableBalance,
          targetAmount: (pot.amountPerPerson || 0) * (pot.participantCount || 0),
          participantsCount: pot.participantCount || 0,
          paidCount: pot.contributions?.length || 0,
        });
        setError(null);
      }
    } catch (err) {
      console.error('[POT] Error fetching pot data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [routeId]);

  // Fetch inicial
  useEffect(() => {
    fetchPotData();
  }, [fetchPotData]);

  // Refresh cuando cambia el número de participantes
  useEffect(() => {
    fetchPotData();
  }, [participantsCount, fetchPotData]);

  // Auto-refresh periódico
  useEffect(() => {
    if (!routeId || refreshInterval <= 0) return;

    const interval = setInterval(fetchPotData, refreshInterval);
    return () => clearInterval(interval);
  }, [routeId, refreshInterval, fetchPotData]);

  return {
    potData,
    isLoading,
    error,
    refresh: fetchPotData,
  };
}
