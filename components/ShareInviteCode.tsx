"use client";

import { useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Share2,
  MessageCircle,
  Twitter,
  Facebook,
  Link as LinkIcon,
  X
} from "lucide-react";

type ShareInviteCodeProps = {
  inviteCode: string;
  routeName: string;
};

export default function ShareInviteCode({ inviteCode, routeName }: ShareInviteCodeProps) {
  const [showShare, setShowShare] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${inviteCode}`
    : `/join/${inviteCode}`;

  const copyToClipboard = async (text: string, message: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success(message);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed"; // Prevent scrolling
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          document.execCommand('copy');
          toast.success(message);
        } catch (err) {
          console.error(err);
          toast.error("No se pudo copiar automáticamente");
        }
        document.body.removeChild(textarea);
      }
    } catch {
      toast.error("Error al copiar");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete a ${routeName}`,
          text: `🍺 ¡Vente de ruta! Únete a "${routeName}" en Birracrucis.\n\nCódigo: ${inviteCode}`,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setShowShare(true);
        }
      }
    } else {
      setShowShare(true);
    }
  };

  const socialLinks = [
    {
      name: "WhatsApp",
      icon: <MessageCircle className="w-5 h-5" />,
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
      icon: <MessageCircle className="w-5 h-5" />, // Telegram doesn't have a distinct Lucide icon, using MessageCircle
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
      icon: <Twitter className="w-5 h-5" />,
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
      icon: <Facebook className="w-5 h-5" />,
      color: "bg-[#1877F2] hover:bg-[#166fe5] text-white",
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
      }
    }
  ];

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-amber-900 flex items-center gap-2 text-base">
          <span className="text-xl">🎟️</span> Invitar Amigos
        </h3>
        <button
          onClick={handleShare}
          className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-600 transition-all shadow-md active:scale-95 flex items-center gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" />
          Compartir
        </button>
      </div>

      {/* QR Code - Grande y central */}
      <div className="flex justify-center mb-4">
        <div className="bg-white p-4 rounded-2xl border-2 border-amber-100 shadow-inner">
          <QRCodeSVG
            value={shareUrl}
            size={180}
            level="M"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#1e293b"
          />
        </div>
      </div>

      <p className="text-center text-xs text-amber-700 mb-4">
        Escanea el QR o comparte el código
      </p>

      {/* Código de Invitación */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-white rounded-xl px-4 py-3 font-mono text-2xl font-bold text-center tracking-[0.3em] text-slate-800 border-2 border-amber-100 shadow-inner select-all">
          {inviteCode}
        </div>
        <button
          onClick={() => copyToClipboard(inviteCode, "Código copiado")}
          className="px-4 py-3 rounded-xl font-bold transition-all bg-white text-amber-600 border-2 border-amber-100 hover:bg-amber-50 hover:border-amber-200 active:scale-95 shadow-sm"
          title="Copiar código"
        >
          <Copy className="w-5 h-5" />
        </button>
      </div>

      {/* Link completo - más discreto */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white/60 rounded-lg px-3 py-2 text-xs text-slate-500 truncate border border-amber-100 font-mono select-all">
          {shareUrl}
        </div>
        <button
          onClick={() => copyToClipboard(shareUrl, "Enlace copiado al portapapeles")}
          className="text-amber-700 hover:text-amber-900 rounded p-1 hover:bg-amber-100 transition-colors"
          title="Copiar enlace"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modal de compartir (Custom Fallback/Desktop) */}
      {showShare && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800">Compartir Invitación</h3>
              <button
                onClick={() => setShowShare(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
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

            <button
              onClick={() => {
                copyToClipboard(shareUrl, "Enlace copiado al portapapeles");
                setShowShare(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all active:scale-95 font-bold"
            >
              <LinkIcon className="w-4 h-4" />
              Copiar Enlace
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
