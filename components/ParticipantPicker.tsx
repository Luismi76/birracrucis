"use client";

import { X, Bell, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Participant = {
    id: string; // This is the user ID or guest ID depending on isGuest
    name: string | null;
    image: string | null;
    isGuest?: boolean;
};

type ParticipantPickerProps = {
    participants: Participant[];
    onClose: () => void;
    onSelect: (participant: Participant, message?: string) => Promise<void>;
};

export default function ParticipantPicker({ participants, onClose, onSelect }: ParticipantPickerProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [customMessage, setCustomMessage] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleNotify = async (participant: Participant) => {
        setLoadingId(participant.id);
        try {
            await onSelect(participant, customMessage || undefined);
            toast.success(`¡Aviso enviado a ${participant.name || "compañero"}!`);
            onClose();
        } catch (error) {
            toast.error("Error enviando aviso");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="relative bg-slate-50 p-6 border-b border-slate-100">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-slate-200/50 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                            <Bell className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Avisar a alguien</h2>
                            <p className="text-sm text-slate-500">Envía una notificación push</p>
                        </div>
                    </div>
                </div>

                {/* Quick Message Input (Optional) */}
                <div className="p-4 border-b border-slate-100">
                    <input
                        type="text"
                        placeholder="Mensaje opcional (ej: ¡Date prisa!)"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                    />
                </div>

                {/* Participants List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button
                        onClick={() => handleNotify({ id: "all", name: "Todos", image: null })}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center shadow-sm">
                            <Bell className="w-5 h-5 text-amber-700" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-bold text-slate-800">Avisar a Todos</h3>
                            <p className="text-xs text-amber-700 font-medium">Notificación general</p>
                        </div>
                    </button>

                    <div className="h-px bg-slate-100 my-2" />

                    {participants.map((p) => {
                        const isLoading = loadingId === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => handleNotify(p)}
                                disabled={loadingId !== null}
                                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all disabled:opacity-50"
                            >
                                <div className="relative">
                                    {p.image ? (
                                        <img src={p.image} alt={p.name || "?"} className="w-12 h-12 rounded-full object-cover border-2 border-slate-100" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-100">
                                            <span className="font-bold text-slate-500 text-lg">{(p.name || "?").charAt(0).toUpperCase()}</span>
                                        </div>
                                    )}
                                    {isLoading && (
                                        <div className="absolute inset-0 bg-white/50 rounded-full flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 text-left">
                                    <h3 className="font-bold text-slate-800">{p.name || "Invitado"}</h3>
                                    <p className="text-xs text-slate-400">
                                        {p.isGuest ? "Invitado" : "Usuario"}
                                    </p>
                                </div>

                                <div className={`p-2 rounded-full transition-colors ${isLoading ? 'bg-amber-100' : 'bg-slate-100 group-hover:bg-amber-100'}`}>
                                    <Bell className={`w-5 h-5 ${isLoading ? 'text-amber-600' : 'text-slate-400 group-hover:text-amber-600'}`} />
                                </div>
                            </button>
                        );
                    })}

                    {participants.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p>No hay participantes disponibles</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
