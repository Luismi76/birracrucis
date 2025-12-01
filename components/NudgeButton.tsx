"use client";

import { useState, useEffect } from "react";

type Nudge = {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    name: string | null;
    image: string | null;
  };
};

type NudgeButtonProps = {
  routeId: string;
  isAtCurrentStop: boolean;
};

export default function NudgeButton({ routeId, isAtCurrentStop }: NudgeButtonProps) {
  const [sending, setSending] = useState(false);
  const [lastNudge, setLastNudge] = useState<Nudge | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Polling para recibir nudges
  useEffect(() => {
    const fetchNudges = async () => {
      try {
        const res = await fetch(`/api/routes/${routeId}/nudge`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.nudges.length > 0) {
            const latestNudge = data.nudges[0];
            // Solo mostrar si es nuevo
            if (!lastNudge || latestNudge.id !== lastNudge.id) {
              setLastNudge(latestNudge);
              // Solo mostrar notificacion si NO estamos en el bar actual
              if (!isAtCurrentStop) {
                setShowNotification(true);
                // Vibrar si es posible
                if (navigator.vibrate) {
                  navigator.vibrate([200, 100, 200]);
                }
                // Auto-ocultar despues de 5 segundos
                setTimeout(() => setShowNotification(false), 5000);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching nudges:", err);
      }
    };

    fetchNudges();
    const interval = setInterval(fetchNudges, 5000);
    return () => clearInterval(interval);
  }, [routeId, lastNudge, isAtCurrentStop]);

  // Countdown del cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendNudge = async () => {
    if (cooldown > 0) return;

    setSending(true);
    try {
      const res = await fetch(`/api/routes/${routeId}/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "¡Date prisa, te estamos esperando!",
        }),
      });

      if (res.ok) {
        setCooldown(30); // 30 segundos de cooldown
      }
    } catch (err) {
      console.error("Error sending nudge:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Boton para enviar nudge (solo si estas en el bar) */}
      {isAtCurrentStop && (
        <button
          onClick={handleSendNudge}
          disabled={sending || cooldown > 0}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
            cooldown > 0
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-red-500 text-white hover:bg-red-600 active:scale-95 shadow-lg"
          }`}
        >
          {cooldown > 0 ? (
            <>
              <span>Espera {cooldown}s</span>
            </>
          ) : sending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Enviando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Meter Prisa a los Rezagados
            </>
          )}
        </button>
      )}

      {/* Notificacion de nudge recibido */}
      {showNotification && lastNudge && (
        <div
          className="fixed top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-2xl shadow-2xl z-50 animate-bounce"
          onClick={() => setShowNotification(false)}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold">{lastNudge.sender.name || "Alguien"} te mete prisa!</p>
              <p className="text-sm text-white/80">{lastNudge.message}</p>
            </div>
            <button className="text-white/70 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
