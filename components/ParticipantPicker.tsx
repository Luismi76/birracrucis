"use client";

import { X, Bell, User, Users } from "lucide-react";
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
    onSelect: (participant: Participant) => void;
};

export default function ParticipantPicker({ participants, onClose, onSelect }: ParticipantPickerProps) {

    // Simple handler just to pass the participant up
    const handleSelect = (participant: Participant) => {
        onSelect(participant);
        onClose();
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
                            <p className="text-sm text-slate-500">Elige un participante</p>
                        </div>
                    </div>
                </div>

                {/* Participants List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button
                        onClick={() => handleSelect({ id: "all", name: "Todos", image: null })}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center shadow-sm">
                            <Users className="w-5 h-5 text-amber-700" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-bold text-slate-800">Avisar a Todos</h3>
                            <p className="text-xs text-amber-700 font-medium">Notificación general</p>
                        </div>
                    </button>

                    <div className="h-px bg-slate-100 my-2" />

                    {participants.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handleSelect(p)}
                            className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all active:scale-95"
                        >
                            <div className="relative">
                                {p.image ? (
                                    <img src={p.image} alt={p.name || "?"} className="w-12 h-12 rounded-full object-cover border-2 border-slate-100" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-100">
                                        <span className="font-bold text-slate-500 text-lg">{(p.name || "?").charAt(0).toUpperCase()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 text-left">
                                <h3 className="font-bold text-slate-800">{p.name || "Invitado"}</h3>
                                <p className="text-xs text-slate-400">
                                    {p.isGuest ? "Invitado" : "Usuario"}
                                </p>
                            </div>

                            <div className="p-2 rounded-full bg-slate-100 group-hover:bg-amber-100 transition-colors">
                                <Bell className="w-5 h-5 text-slate-400 group-hover:text-amber-600" />
                            </div>
                        </button>
                    ))}

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
