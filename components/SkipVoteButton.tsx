"use client";

import { useState, useEffect } from "react";

type VoteSummary = {
  skip: number;
  stay: number;
  total: number;
  shouldSkip: boolean;
};

type SkipVoteButtonProps = {
  routeId: string;
  stopId: string;
  currentUserId?: string;
  onSkipDecided?: () => void;
};

export default function SkipVoteButton({
  routeId,
  stopId,
  currentUserId,
  onSkipDecided,
}: SkipVoteButtonProps) {
  const [summary, setSummary] = useState<VoteSummary | null>(null);
  const [myVote, setMyVote] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const res = await fetch(`/api/routes/${routeId}/votes?stopId=${stopId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            setSummary(data.summary);
            // Buscar mi voto
            const myVoteData = data.votes.find(
              (v: { user: { id: string }; vote: boolean }) => v.user.id === currentUserId
            );
            if (myVoteData) {
              setMyVote(myVoteData.vote);
            }
            // Si se decide saltar, notificar
            if (data.summary.shouldSkip && onSkipDecided) {
              onSkipDecided();
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching votes:", err);
      }
    };

    fetchVotes();
    const interval = setInterval(fetchVotes, 5000);
    return () => clearInterval(interval);
  }, [routeId, stopId, currentUserId, onSkipDecided]);

  const handleVote = async (vote: boolean) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/routes/${routeId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopId, vote }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setMyVote(vote);
          // Re-fetch para actualizar el resumen
          const summaryRes = await fetch(`/api/routes/${routeId}/votes?stopId=${stopId}`);
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            if (summaryData.ok) {
              setSummary(summaryData.summary);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error voting:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!summary) {
    return (
      <div className="animate-pulse bg-slate-100 rounded-lg p-3 h-20" />
    );
  }

  const skipPercentage = summary.total > 0 ? (summary.skip / summary.total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
        Votacion: Siguiente bar?
      </h4>

      {summary.shouldSkip ? (
        <div className="bg-orange-100 text-orange-800 rounded-lg p-3 text-center font-medium">
          Mayoria decide avanzar al siguiente bar!
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Quedarse ({summary.stay})</span>
              <span>Saltar ({summary.skip})</span>
            </div>
            <div className="h-3 bg-green-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${skipPercentage}%`, marginLeft: `${100 - skipPercentage}%` }}
              />
            </div>
            <p className="text-xs text-center text-slate-400 mt-1">
              {summary.skip + summary.stay} de {summary.total} han votado
            </p>
          </div>

          {/* Botones de votación */}
          <div className="flex gap-2">
            <button
              onClick={() => handleVote(false)}
              disabled={loading}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                myVote === false
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Quedarse
            </button>
            <button
              onClick={() => handleVote(true)}
              disabled={loading}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                myVote === true
                  ? "bg-orange-600 text-white"
                  : "bg-orange-100 text-orange-700 hover:bg-orange-200"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              Saltar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
