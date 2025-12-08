"use client";

import { X, Send, Clock, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type NotificationActionsProps = {
    targetName: string;
    onClose: () => void;
    onSend: (message: string) => Promise<void>;
};

export default function NotificationActions({ targetName, onClose, onSend }: NotificationActionsProps) {
    const [loading, setLoading] = useState(false);
    const [customMessage, setCustomMessage] = useState("");

    const handleSend = async (msg: string) => {
        setLoading(true);
        try {
            await onSend(msg);
            toast.success("Aviso enviado correctamente");
            onClose();
        } catch (error) {
            toast.error("Error al enviar el aviso");
        } finally {
            setLoading(false);
        }
    };

    const PREDEFINED_MESSAGES = [
        { icon: <Clock className="w-5 h-5 text-amber-600" />, text: "¡Date prisa!", sub: "Te estamos esperando" },
        { icon: <MapPin className="w-5 h-5 text-blue-600" />, text: "¿Dónde estás?", sub: "Envía ubicación" },
        { icon: <MessageCircle className="w-5 h-5 text-green-600" />, text: "¿Te falta mucho?", sub: "Queremos pedir" },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="relative bg-slate-50 p-6 border-b border-slate-100">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-slate-200/50 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>

                    <div className="flex flex-col gap-1">
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Enviando mensaje a</p>
                        <h2 className="text-2xl font-black text-slate-800">{targetName}</h2>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    {/* Predefined Messages */}
                    {PREDEFINED_MESSAGES.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(item.text)}
                            disabled={loading}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-all active:scale-95 disabled:opacity-50 text-left group"
                        >
                            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
                                {item.icon}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">{item.text}</p>
                                <p className="text-xs text-slate-500">{item.sub}</p>
                            </div>
                        </button>
                    ))}

                    <div className="h-px bg-slate-100 my-2" />

                    {/* Custom Message */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Escribe un mensaje personalizado..."
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && customMessage && handleSend(customMessage)}
                            disabled={loading}
                        />
                        <button
                            onClick={() => customMessage && handleSend(customMessage)}
                            disabled={!customMessage || loading}
                            className="p-3 bg-slate-900 text-white rounded-xl disabled:opacity-50 active:scale-95 transition-all"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
