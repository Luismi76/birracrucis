"use client";

import { useState } from "react";

type ShareInviteCodeProps = {
  inviteCode: string;
  routeName: string;
};

export default function ShareInviteCode({ inviteCode, routeName }: ShareInviteCodeProps) {
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${inviteCode}`
    : `/join/${inviteCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores que no soportan clipboard
      const input = document.createElement("input");
      input.value = inviteCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Error copiando link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete a ${routeName}`,
          text: `¡Te invito a una ruta de cervezas! Usa el código: ${inviteCode}`,
          url: shareUrl,
        });
      } catch (err) {
        // Usuario canceló o error
        if ((err as Error).name !== "AbortError") {
          setShowShare(true);
        }
      }
    } else {
      setShowShare(true);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `🍺 ¡Te invito a "${routeName}"!\n\nÚnete con este link:\n${shareUrl}\n\nO usa el código: ${inviteCode}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleTelegram = () => {
    const text = encodeURIComponent(
      `🍺 ¡Te invito a "${routeName}"!\n\nÚnete con este link:\n${shareUrl}\n\nO usa el código: ${inviteCode}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, "_blank");
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-amber-800 flex items-center gap-2">
          <span>🔗</span> Invitar Amigos
        </h3>
        <button
          onClick={handleShare}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors flex items-center gap-2"
        >
          <span>📤</span> Compartir
        </button>
      </div>

      {/* Código de Invitación */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 bg-white rounded-lg px-4 py-3 font-mono text-lg font-bold text-center tracking-widest text-slate-800 border border-amber-200">
          {inviteCode}
        </div>
        <button
          onClick={handleCopyCode}
          className={`px-4 py-3 rounded-lg font-bold transition-all ${
            copied
              ? "bg-green-500 text-white"
              : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-100"
          }`}
        >
          {copied ? "✓" : "📋"}
        </button>
      </div>

      {/* Link completo */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white/50 rounded-lg px-3 py-2 text-xs text-slate-600 truncate border border-amber-100">
          {shareUrl}
        </div>
        <button
          onClick={handleCopyLink}
          className="text-xs text-amber-700 hover:text-amber-800 font-medium whitespace-nowrap"
        >
          Copiar link
        </button>
      </div>

      {/* Modal de compartir */}
      {showShare && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Compartir Invitación</h3>
              <button
                onClick={() => setShowShare(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                <span className="text-2xl">💬</span>
                <span className="font-medium">WhatsApp</span>
              </button>

              <button
                onClick={handleTelegram}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <span className="text-2xl">✈️</span>
                <span className="font-medium">Telegram</span>
              </button>

              <button
                onClick={() => {
                  handleCopyLink();
                  setShowShare(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <span className="text-2xl">🔗</span>
                <span className="font-medium">Copiar Link</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center mt-4">
              Código: <span className="font-mono font-bold">{inviteCode}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
