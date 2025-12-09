"use client";

import { useState, useEffect } from "react";
import PricePicker from "./PricePicker";

type PotContribution = {
  id: string;
  userId: string | null;
  userName: string | null;
  amount: number;
  paidAt: string;
};

type PotData = {
  enabled: boolean;
  amountPerPerson: number | null;
  totalCollected: number;
  totalSpent: number;
  balance: number;
  contributions: PotContribution[];
  participantCount: number;
};

type PotManagerProps = {
  routeId: string;
  isCreator: boolean;
  currentUserId?: string;
  onSpendFromPot?: (amount: number) => void;
  totalSpent: number; // Gasto actual calculado localmente
};

export default function PotManager({
  routeId,
  isCreator,
  currentUserId,
  onSpendFromPot,
  totalSpent,
}: PotManagerProps) {
  const [potData, setPotData] = useState<PotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [showPricePicker, setShowPricePicker] = useState(false);
  const [configAmount, setConfigAmount] = useState(20);
  const [externalName, setExternalName] = useState("");
  const [showAddExternal, setShowAddExternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Cargar datos del bote
  const fetchPot = async () => {
    try {
      const res = await fetch(`/api/routes/${routeId}/pot`);
      if (!res.ok) {
        // Si hay error del servidor, simplemente no mostramos el bote
        console.warn("Pot API not available:", res.status);
        setPotData(null);
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setPotData(data.pot);
      }
    } catch (err) {
      console.error("Error fetching pot:", err);
      setPotData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPot();
    // Polling cada 10 segundos para actualizar en tiempo real
    const interval = setInterval(fetchPot, 10000);
    return () => clearInterval(interval);
  }, [routeId]);

  // Sincronizar gastos locales con el bote
  useEffect(() => {
    if (potData?.enabled && totalSpent > 0 && totalSpent !== potData.totalSpent) {
      // Actualizar el gasto en el servidor
      fetch(`/api/routes/${routeId}/pot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "spend",
          amount: totalSpent - potData.totalSpent,
        }),
      }).then(() => fetchPot()).catch(console.error);
    }
  }, [totalSpent, potData?.totalSpent, potData?.enabled, routeId]);

  const handleConfigure = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/routes/${routeId}/pot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "configure",
          amountPerPerson: configAmount,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchPot();
        setShowConfig(false);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error al configurar el bote");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm("¿Seguro que quieres desactivar el bote?")) return;
    try {
      const res = await fetch(`/api/routes/${routeId}/pot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchPot();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleContribute = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/routes/${routeId}/pot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "contribute" }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchPot();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error al contribuir");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExternal = async () => {
    if (!externalName.trim()) {
      alert("Escribe el nombre del participante");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/routes/${routeId}/pot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "contribute_external",
          userName: externalName.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchPot();
        setExternalName("");
        setShowAddExternal(false);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error al añadir participante");
    } finally {
      setSubmitting(false);
    }
  };

  const hasContributed = currentUserId
    ? potData?.contributions.some(c => c.userId === currentUserId)
    : false;
  // Cálculos de gamificación - usar totalSpent del servidor, no el prop local
  const balanceAfterSpent = potData ? potData.totalCollected - potData.totalSpent : 0;
  const isNegativeBalance = balanceAfterSpent < 0;

  // Estimación de rondas restantes
  // Si no hay gasto aún, estimamos coste medio por ronda (ej: 3€ * participantes)
  // Si hay gasto, usamos la media real
  const averageRoundCost = totalSpent > 0
    ? totalSpent / Math.max(1, (potData?.totalSpent || 1) / 5) // Hacky approximation if we don't have round count props here, using simplified logic or assuming ~5€ per person per round? 
    // BETTER: We don't have round count here. Let's use a heuristic: 
    // Coste medio ronda ~= (Total Gastado / Rondas Totales) -> We don't have total rounds here.
    // Let's us: Coste medio ronda ~= 3€ * NumParticipantes (Beer + Tapa)
    : (3 * (potData?.participantCount || 1));

  // Heuristic: Average cost per round is roughly TotalSpent / Rounds.
  // We don't have rounds passed here. Let's rely on configured amount per person.
  // If we set 20€ and beer is 3€, we expect ~6 rounds.
  // Rounds Left = Balance / (Participants * 3€)
  const estimatedCostPerRound = (potData?.participantCount || 1) * 3.5; // 3.5€ average per person (Beer 2 + Tapa 1.5)
  const roundsLeft = Math.max(0, Math.floor(balanceAfterSpent / estimatedCostPerRound));

  // Traffic Light Logic
  let statusColor = "bg-emerald-500";
  let statusText = "¡Vamos sobrados! 🤑";
  let statusBg = "bg-emerald-50";
  let statusBorder = "border-emerald-200";

  if (balanceAfterSpent < estimatedCostPerRound * 2) {
    statusColor = "bg-amber-500";
    statusText = "Se acaba la pasta... 😅";
    statusBg = "bg-amber-50";
    statusBorder = "border-amber-200";
  }
  if (balanceAfterSpent < estimatedCostPerRound || isNegativeBalance) {
    statusColor = "bg-red-500";
    statusText = "¡BOTE VACÍO! 🚨";
    statusBg = "bg-red-50";
    statusBorder = "border-red-200";
  }

  const peoplePaid = potData?.contributions.length || 0;
  const peopleTotal = potData?.participantCount || 0;
  const allPaid = peoplePaid >= peopleTotal && peopleTotal > 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
        <div className="h-12 bg-slate-100 rounded-xl w-full" />
      </div>
    );
  }

  // ... (Keep Not Configured Logic same as before, maybe stylized) ...
  if (potData === null) return null;

  if (!potData?.enabled) {
    if (!isCreator) return null;
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-4 text-center">
        <h3 className="font-bold text-emerald-800 mb-2">💰 ¿Ponemos bote?</h3>
        {!showConfig ? (
          <button
            onClick={() => setShowConfig(true)}
            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all active:scale-95"
          >
            Configurar Bote Común
          </button>
        ) : (
          <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm">
            {/* ... Config Form (Existing Logic) ... */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Por cabeza</label>
              <button
                onClick={() => setShowPricePicker(true)}
                className="w-full mt-1 p-3 border-2 border-emerald-100 rounded-xl text-3xl font-black text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                {configAmount.toFixed(0)}€
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfig(false)} className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
              <button onClick={handleConfigure} disabled={submitting} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-md">{submitting ? "..." : "¡Venga!"}</button>
            </div>
          </div>
        )}
        {showPricePicker && (
          <PricePicker
            isOpen={true}
            onClose={() => setShowPricePicker(false)}
            onSelect={(price) => setConfigAmount(price)}
            currentPrice={configAmount}
            title="Bote por persona"
            icon="💰"
          />
        )}
      </div>
    );
  }

  // --- GAMIFIED VIEW ---

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${statusBg} ${statusBorder} ${expanded ? 'shadow-xl scale-[1.02]' : 'shadow-sm'}`}>

      {/* 1. Header: Big Impact Info */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between relative"
      >
        <div className="flex items-center gap-4">
          {/* Semáforo Icon */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner ${statusColor} text-white`}>
            {isNegativeBalance ? "💸" : (roundsLeft > 2 ? "🤑" : "😰")}
          </div>

          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 text-slate-900">Quedan aprox.</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">{roundsLeft}</span>
              <span className="text-sm font-bold text-slate-600">rondas</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className={`block text-2xl font-black ${isNegativeBalance ? 'text-red-600' : 'text-slate-800'}`}>
            {balanceAfterSpent.toFixed(0)}€
          </span>
          <span className="text-xs font-medium text-slate-500">disponibles</span>
        </div>
      </button>

      {/* 2. Expanded: Details & Social Pressure */}
      {expanded && (
        <div className="bg-white/50 border-t border-slate-100 p-4 space-y-4 animate-slide-down">

          {/* Status Message */}
          <div className={`p-3 rounded-xl text-center font-bold ${isNegativeBalance ? 'bg-red-100 text-red-700' : 'bg-white text-slate-700 border border-slate-200'}`}>
            {statusText}
          </div>

          {/* Thermometer / Stats */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-slate-100">
              <span className="block text-xs text-slate-400 font-bold uppercase">Recaudado</span>
              <span className="text-xl font-bold text-emerald-600">{potData.totalCollected.toFixed(0)}€</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-100">
              <span className="block text-xs text-slate-400 font-bold uppercase">Gastado</span>
              <span className="text-xl font-bold text-orange-500">{potData.totalSpent.toFixed(0)}€</span>
            </div>
          </div>

          {/* CTA for Self */}
          {!hasContributed && currentUserId && (
            <button
              onClick={handleContribute}
              disabled={submitting}
              className="w-full py-4 bg-emerald-500 text-white rounded-xl text-lg font-black shadow-xl shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>💸</span>
              ¡Poner mis {potData.amountPerPerson?.toFixed(0)}€!
            </button>
          )}

          {/* Contributors / Morosos List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-2">
              {allPaid ? "👏 Todos han pagado" : "⚠️ Faltan por pagar"}
            </h4>

            {/* Progress Bar */}
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                style={{ width: `${(peoplePaid / Math.max(1, peopleTotal)) * 100}%` }}
              />
            </div>

            {/* Compact List */}
            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50 max-h-32 overflow-y-auto">
              {potData.contributions.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 text-sm">
                  <span className="font-medium text-slate-700">{c.userName || "Anónimo"} {c.userId === currentUserId && "(Tú)"}</span>
                  <span className="text-emerald-600 font-bold text-xs">PAGADO</span>
                </div>
              ))}
              {/* We don't have a list of unpaid users easily unless we cross-ref with participants, which requires passing participants prop. 
                        For now, just showing paid users is safer to avoid logic errors without full participant list. 
                        In future, pass 'participants' to this component to show who hasn't paid. */}
            </div>

            {/* External Add (Creator Only) */}
            {isCreator && (
              <div className="pt-2">
                <button
                  onClick={() => setShowAddExternal(!showAddExternal)}
                  className="text-xs text-slate-400 underline w-full text-center hover:text-slate-600"
                >
                  ¿Alguien ha pagado en mano?
                </button>
                {showAddExternal && (
                  <div className="flex gap-2 mt-2">
                    <input
                      value={externalName}
                      onChange={e => setExternalName(e.target.value)}
                      placeholder="Nombre..."
                      className="flex-1 px-3 py-2 bg-white border rounded-lg text-sm"
                    />
                    <button onClick={handleAddExternal} className="px-4 bg-emerald-500 text-white rounded-lg font-bold">OK</button>
                  </div>
                )}
              </div>
            )}

            {isCreator && (
              <button onClick={handleDisable} className="w-full text-[10px] text-red-300 hover:text-red-500 mt-4">
                Desactivar sistema de bote
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
