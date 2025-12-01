"use client";

import { useState, useEffect } from "react";

type Invitation = {
  id: string;
  invitedEmail: string | null;
  invitedUser: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  invitedBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
  status: string;
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
};

type InvitationManagerProps = {
  routeId: string;
  isCreator: boolean;
};

export default function InvitationManager({ routeId, isCreator }: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`/api/routes/${routeId}/invitations`);
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
    if (isCreator) {
      fetchInvitations();
    } else {
      setLoading(false);
    }
  }, [routeId, isCreator]);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/routes/${routeId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), message: message.trim() || null }),
      });

      const data = await res.json();

      if (data.ok) {
        setSuccess(`Invitacion enviada a ${email}`);
        setEmail("");
        setMessage("");
        fetchInvitations();
      } else {
        setError(data.error || "Error al enviar invitacion");
      }
    } catch (err) {
      setError("Error de conexion");
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("¿Cancelar esta invitacion?")) return;

    try {
      const res = await fetch(`/api/routes/${routeId}/invitations?invitationId=${invitationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchInvitations();
      }
    } catch (err) {
      console.error("Error canceling invitation:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">Pendiente</span>;
      case "accepted":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Aceptada</span>;
      case "rejected":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Rechazada</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario para enviar invitaciones */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invitar participante
        </h3>

        <form onSubmit={handleSendInvitation} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Email del invitado</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="amigo@email.com"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Mensaje (opcional)</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Te espero en la ruta de birras!"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? "Enviando..." : "Enviar invitacion"}
          </button>
        </form>
      </div>

      {/* Lista de invitaciones (solo para creador) */}
      {isCreator && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Invitaciones enviadas ({invitations.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400">
              <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
              Cargando...
            </div>
          ) : invitations.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p>No hay invitaciones todavia</p>
              <p className="text-sm">Invita a tus amigos usando el formulario</p>
            </div>
          ) : (
            <div className="divide-y">
              {invitations.map((inv) => (
                <div key={inv.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                      {inv.invitedUser?.image ? (
                        <img src={inv.invitedUser.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-500 font-medium">
                          {(inv.invitedUser?.name || inv.invitedEmail || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {inv.invitedUser?.name || inv.invitedEmail}
                      </p>
                      <p className="text-xs text-slate-500">
                        {inv.invitedUser?.email || inv.invitedEmail}
                      </p>
                    </div>

                    {/* Estado */}
                    <div className="flex items-center gap-2">
                      {getStatusBadge(inv.status)}
                      {inv.status === "pending" && (
                        <button
                          onClick={() => handleCancelInvitation(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancelar invitacion"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {inv.message && (
                    <p className="mt-2 text-sm text-slate-500 italic">"{inv.message}"</p>
                  )}

                  <p className="mt-1 text-xs text-slate-400">
                    Enviada {new Date(inv.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {inv.respondedAt && (
                      <> · Respondida {new Date(inv.respondedAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}</>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
