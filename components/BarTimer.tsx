"use client";

import { useState, useEffect, useCallback } from "react";

type BarTimerProps = {
  stopName: string;
  scheduledDepartureTime: Date | null;
  durationMinutes: number;
  onTimeUp?: () => void;
};

export default function BarTimer({
  stopName,
  scheduledDepartureTime,
  durationMinutes,
  onTimeUp,
}: BarTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isOvertime, setIsOvertime] = useState(false);
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [alarmDismissed, setAlarmDismissed] = useState(false);

  const playAlarm = useCallback(() => {
    if (alarmDismissed) return;

    // Vibrar si está disponible
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Reproducir sonido de notificación usando Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.value = 0.3;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 500);
    } catch {
      console.log("No se pudo reproducir sonido");
    }
  }, [alarmDismissed]);

  useEffect(() => {
    if (!scheduledDepartureTime) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = scheduledDepartureTime.getTime() - now.getTime();
      const secondsLeft = Math.floor(diff / 1000);

      setTimeLeft(secondsLeft);
      setIsOvertime(secondsLeft < 0);

      // Alarma cuando quedan 5 minutos
      if (secondsLeft === 300 && !alarmTriggered) {
        setAlarmTriggered(true);
        playAlarm();
      }

      // Alarma cuando se acaba el tiempo
      if (secondsLeft === 0) {
        playAlarm();
        if (onTimeUp) onTimeUp();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [scheduledDepartureTime, alarmTriggered, onTimeUp, playAlarm]);

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = absSeconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeLeft === null) return "bg-slate-100 text-slate-600";
    if (isOvertime) return "bg-red-500 text-white";
    if (timeLeft < 300) return "bg-orange-500 text-white"; // Menos de 5 min
    if (timeLeft < 600) return "bg-yellow-500 text-white"; // Menos de 10 min
    return "bg-green-500 text-white";
  };

  const getProgressPercentage = () => {
    if (timeLeft === null || durationMinutes === 0) return 0;
    const totalSeconds = durationMinutes * 60;
    const elapsed = totalSeconds - timeLeft;
    return Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100));
  };

  if (timeLeft === null) {
    return (
      <div className="bg-slate-100 rounded-xl p-4 text-center">
        <p className="text-slate-500 text-sm">Sin tiempo programado</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 ${getTimerColor()} transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-sm">
            {isOvertime ? "Tiempo excedido en" : "Tiempo restante"}
          </span>
        </div>
        {!alarmDismissed && timeLeft <= 300 && timeLeft > 0 && (
          <button
            onClick={() => setAlarmDismissed(true)}
            className="text-xs opacity-75 hover:opacity-100"
          >
            Silenciar
          </button>
        )}
      </div>

      <div className="text-center">
        <p className="text-4xl font-mono font-bold tracking-wider">
          {isOvertime && "-"}{formatTime(timeLeft)}
        </p>
        <p className="text-sm opacity-80 mt-1">{stopName}</p>
      </div>

      {/* Barra de progreso */}
      <div className="mt-3">
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/60 transition-all duration-1000 ease-linear"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 opacity-75">
          <span>Llegada</span>
          <span>Salida</span>
        </div>
      </div>

      {/* Alerta de 5 minutos */}
      {timeLeft <= 300 && timeLeft > 0 && !isOvertime && (
        <div className="mt-3 bg-white/20 rounded-lg p-2 text-center animate-pulse">
          <p className="text-sm font-medium">Quedan menos de 5 minutos!</p>
        </div>
      )}

      {/* Alerta de tiempo excedido */}
      {isOvertime && (
        <div className="mt-3 bg-white/20 rounded-lg p-2 text-center">
          <p className="text-sm font-medium">Es hora de ir al siguiente bar!</p>
        </div>
      )}
    </div>
  );
}
