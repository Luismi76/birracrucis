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

  const hasContributed = potData?.contributions.some(c => c.userId === currentUserId);
  const balanceAfterSpent = potData ? potData.totalCollected - totalSpent : 0;
  const isLowBalance = balanceAfterSpent < (potData?.amountPerPerson || 0);
  const isNegativeBalance = balanceAfterSpent < 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
          <div className="flex-1 h-4 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Si no hay datos del bote (error de API o campos no existentes), no mostrar nada
  if (potData === null) {
    // Solo el creador ve la opción de activar el bote (cuando el API esté disponible)
    return null;
  }

  // Si el bote no está activado, mostrar opción para activarlo (solo creador)
  if (!potData?.enabled) {
    if (!isCreator) return null;

    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-4">
        {!showConfig ? (
          <button
            onClick={() => setShowConfig(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
          >
            <span className="text-xl">💰</span>
            Activar Bote Comun
          </button>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold text-emerald-800 flex items-center gap-2">
              <span>💰</span> Configurar Bote
            </h3>
            <p className="text-sm text-emerald-700">
              Cada participante pondrá la misma cantidad al inicio. Los gastos se descontarán del bote.
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Cantidad por persona
              </label>
              <button
                onClick={() => setShowPricePicker(true)}
                className="w-full p-3 bg-white border border-emerald-300 rounded-xl text-2xl font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                {configAmount.toFixed(2)}€
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfig(false)}
                className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfigure}
                disabled={submitting}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50"
              >
                {submitting ? "Activando..." : "Activar"}
              </button>
            </div>
          </div>
        )}

        {/* Price Picker para configurar */}
        {showPricePicker && (
          <PricePicker
            isOpen={true}
            onClose={() => setShowPricePicker(false)}
            onSelect={(price) => setConfigAmount(price)}
            currentPrice={configAmount}
            title="Cantidad por persona"
            icon="💰"
          />
        )}
      </div>
    );
  }

  // Bote activado - mostrar estado compacto
  return (
    <div className={`rounded-xl border overflow-hidden ${
      isNegativeBalance
        ? "bg-red-50 border-red-200"
        : isLowBalance
          ? "bg-amber-50 border-amber-200"
          : "bg-emerald-50 border-emerald-200"
    }`}>
      {/* Header compacto - siempre visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span>💰</span>
          <span className="font-bold text-slate-800">Bote</span>
          <span className={`text-lg font-black ${
            isNegativeBalance ? "text-red-500" : isLowBalance ? "text-amber-500" : "text-emerald-600"
          }`}>
            {balanceAfterSpent.toFixed(2)}€
          </span>
          {isNegativeBalance && <span className="text-red-500 text-xs">⚠️</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {potData.contributions.length} pers.
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Botón contribuir - visible si no ha contribuido */}
      {!hasContributed && currentUserId && !expanded && (
        <div className="px-3 pb-3">
          <button
            onClick={handleContribute}
            disabled={submitting}
            className="w-full py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? "..." : `💵 Poner mis ${potData.amountPerPerson?.toFixed(0)}€`}
          </button>
        </div>
      )}

      {/* Contenido expandido */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-200/50">
          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-2 text-center pt-3">
            <div className="bg-white/50 rounded-lg p-2">
              <div className="text-sm font-bold text-slate-700">{potData.amountPerPerson?.toFixed(0)}€</div>
              <div className="text-[10px] text-slate-500">por persona</div>
            </div>
            <div className="bg-white/50 rounded-lg p-2">
              <div className="text-sm font-bold text-emerald-600">{potData.totalCollected.toFixed(0)}€</div>
              <div className="text-[10px] text-slate-500">recaudado</div>
            </div>
            <div className="bg-white/50 rounded-lg p-2">
              <div className="text-sm font-bold text-orange-500">{totalSpent.toFixed(2)}€</div>
              <div className="text-[10px] text-slate-500">gastado</div>
            </div>
          </div>

          {/* Aviso de balance bajo */}
          {isNegativeBalance && (
            <div className="bg-red-100 rounded-lg p-2 text-xs text-red-700">
              ⚠️ Bote en negativo - hay que poner más
            </div>
          )}

          {/* Lista de contribuciones */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600">
                Participantes ({potData.contributions.length})
              </p>
              {isCreator && (
                <button
                  onClick={() => setShowAddExternal(!showAddExternal)}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  + Externo
                </button>
              )}
            </div>

            {/* Añadir participante externo */}
            {showAddExternal && (
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={externalName}
                  onChange={(e) => setExternalName(e.target.value)}
                  className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <button
                  onClick={handleAddExternal}
                  disabled={submitting}
                  className="px-2 py-1 bg-emerald-500 text-white rounded text-xs font-bold hover:bg-emerald-600 disabled:opacity-50"
                >
                  OK
                </button>
              </div>
            )}

            {/* Lista compacta */}
            <div className="bg-white/70 rounded-lg divide-y divide-slate-100 max-h-24 overflow-y-auto text-xs">
              {potData.contributions.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-slate-700">
                    {c.userName || "Usuario"}
                    {c.userId === currentUserId && <span className="text-emerald-600 ml-1">(tú)</span>}
                  </span>
                  <span className="font-bold text-emerald-600">{c.amount.toFixed(0)}€ ✓</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botón para contribuir */}
          {!hasContributed && currentUserId && (
            <button
              onClick={handleContribute}
              disabled={submitting}
              className="w-full py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? "..." : `💵 Poner mis ${potData.amountPerPerson?.toFixed(0)}€`}
            </button>
          )}

          {hasContributed && (
            <div className="text-center text-xs text-emerald-600 font-medium">
              ✓ Ya has puesto tu parte
            </div>
          )}

          {/* Desactivar bote */}
          {isCreator && (
            <button
              onClick={handleDisable}
              className="w-full text-[10px] text-slate-400 hover:text-red-500"
            >
              Desactivar bote
            </button>
          )}
        </div>
      )}
    </div>
  );
}
