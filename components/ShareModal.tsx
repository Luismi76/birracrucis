"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    Copy,
    MessageCircle,
    Twitter,
    Facebook,
    X,
    Link as LinkIcon
} from "lucide-react";

type ShareModalProps = {
    isOpen: boolean;
    onClose: () => void;
    inviteCode: string;
    routeName: string;
};

export default function ShareModal({ isOpen, onClose, inviteCode, routeName }: ShareModalProps) {
    if (!isOpen) return null;

    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/join/${inviteCode}`
        : `/join/${inviteCode}`;

    const copyToClipboard = async (text: string, message: string) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                toast.success(message);
            } else {
                // Fallback
                const textarea = document.createElement("textarea");
                textarea.value = text;
                textarea.style.position = "fixed";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                try {
                    document.execCommand('copy');
                    toast.success(message);
                } catch (err) {
                    toast.error("No se pudo copiar");
                }
                document.body.removeChild(textarea);
            }
        } catch {
            toast.error("Error al copiar");
        }
    };

    const socialLinks = [
        {
            name: "WhatsApp",
            icon: <MessageCircle className="w-6 h-6" />,
            color: "bg-[#25D366] hover:bg-[#20bd5a] text-white",
            action: () => {
                const text = encodeURIComponent(
                    `🍺 ¡Vente de ruta! Únete a "${routeName}" en Birracrucis.\n\n🔗 Link: ${shareUrl}\n🔑 Código: ${inviteCode}`
                );
                window.open(`https://wa.me/?text=${text}`, "_blank");
            }
        },
        {
            name: "Telegram",
            icon: <MessageCircle className="w-6 h-6" />,
            color: "bg-[#0088cc] hover:bg-[#0077b5] text-white",
            action: () => {
                const text = encodeURIComponent(
                    `🍺 ¡Vente de ruta! Únete a "${routeName}" en Birracrucis.\n\n🔗 Link: ${shareUrl}\n🔑 Código: ${inviteCode}`
                );
                window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, "_blank");
            }
        },
        {
            name: "X (Twitter)",
            icon: <Twitter className="w-6 h-6" />,
            color: "bg-black hover:bg-zinc-800 text-white",
            action: () => {
                const text = encodeURIComponent(
                    `🍺 ¡Vente de ruta! Únete a "${routeName}" en Birracrucis. Código: ${inviteCode}`
                );
                window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, "_blank");
            }
        },
        {
            name: "Facebook",
            icon: <Facebook className="w-6 h-6" />,
            color: "bg-[#1877F2] hover:bg-[#166fe5] text-white",
            action: () => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
            }
        }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span>🚀</span> Compartir Ruta
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-6">

                    {/* Invite Code */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código de Invitación</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-amber-50 border-2 border-amber-100 rounded-xl py-3 px-4 text-center font-mono text-2xl font-bold text-slate-800 tracking-widest select-all">
                                {inviteCode}
                            </div>
                            <button
                                onClick={() => copyToClipboard(inviteCode, "Código copiado")}
                                className="p-4 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors shadow-sm active:scale-95"
                            >
                                <Copy className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Social Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {socialLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={link.action}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 font-medium ${link.color}`}
                            >
                                {link.icon}
                                <span className="text-sm">{link.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Copy Link Button */}
                    <button
                        onClick={() => copyToClipboard(shareUrl, "Enlace copiado")}
                        className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all active:scale-95 font-bold"
                    >
                        <LinkIcon className="w-5 h-5" />
                        Copiar Enlace Directo
                    </button>

                </div>
            </div>
        </div>
    );
}
