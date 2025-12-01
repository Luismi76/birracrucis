"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type RouteInvitation = {
  id: string;
  route: {
    id: string;
    name: string;
    date: string;
    creator: { name: string | null; image: string | null };
    _count: { participants: number; stops: number };
  };
  invitedBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
  message: string | null;
  createdAt: string;
};

export default function MyInvitations() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<RouteInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/user/invitations");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setInvitations(data.invitations);
        }
      }
    } catch (err) {
      console.error("Error fetching invitations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleRespond = async (invitationId: string, action: "accept" | "reject") => {
    setResponding(invitationId);

    try {
      const res = await fetch("/api/user/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action }),
      });

      const data = await res.json();

      if (data.ok) {
        if (action === "accept" && data.routeId) {
          router.push(`/routes/${data.routeId}`);
        } else {
          fetchInvitations();
        }
      } else {
        alert(data.error || "Error al responder");
        setResponding(null);
      }
    } catch (err) {
      console.error("Error responding to invitation:", err);
      setResponding(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      <div className="p-3 bg-amber-100 border-b border-amber-200">
        <h3 className="font-semibold text-amber-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Invitaciones pendientes ({invitations.length})
        </h3>
      </div>

      <div className="divide-y divide-amber-200">
        {invitations.map((inv) => (
          <div key={inv.id} className="p-4">
            <div className="flex items-start gap-3 mb-3">
              {/* Avatar del que invita */}
              <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {inv.invitedBy.image ? (
                  <img src={inv.invitedBy.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-amber-700 font-medium">
                    {(inv.invitedBy.name || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{inv.invitedBy.name || "Alguien"}</span>
                  {" "}te ha invitado a:
                </p>
                <p className="font-semibold text-amber-800 truncate">{inv.route.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(inv.route.date).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  {" · "}
                  {inv.route._count.stops} parada{inv.route._count.stops !== 1 ? "s" : ""}
                  {" · "}
                  {inv.route._count.participants} participante{inv.route._count.participants !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {inv.message && (
              <p className="text-sm text-slate-600 italic bg-white/50 p-2 rounded-lg mb-3">
                "{inv.message}"
              </p>
            )}

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={() => handleRespond(inv.id, "accept")}
                disabled={responding === inv.id}
                className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                {responding === inv.id ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Aceptar
                  </>
                )}
              </button>
              <button
                onClick={() => handleRespond(inv.id, "reject")}
                disabled={responding === inv.id}
                className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Rechazar
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center mt-2">
              Recibida {new Date(inv.createdAt).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
