"use client";

import { useState, useRef } from "react";

type PhotoCaptureProps = {
  routeId: string;
  routeName: string;
  stopId?: string;
  stopName?: string;
  onPhotoUploaded?: () => void;
  compact?: boolean;
};

export default function PhotoCapture({
  routeId,
  routeName,
  stopId,
  stopName,
  onPhotoUploaded,
  compact = false,
}: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hashtag = `#${routeName.replace(/\s+/g, "")}Birracrucis`;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen es demasiado grande (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setIsCapturing(true);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;

    setUploading(true);
    setError(null);

    try {
      const res = await fetch(`/api/routes/${routeId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: preview,
          caption: caption || null,
          stopId: stopId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir foto");

      // Limpiar estado
      setPreview(null);
      setCaption("");
      setIsCapturing(false);
      onPhotoUploaded?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async (platform: "twitter" | "instagram" | "whatsapp" | "copy") => {
    const text = caption
      ? `${caption} ${hashtag}`
      : `En ${stopName || routeName} ${hashtag}`;

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
          "_blank"
        );
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text)}`,
          "_blank"
        );
        break;
      case "instagram":
        // Instagram no permite compartir texto directamente, copiamos al portapapeles
        await navigator.clipboard.writeText(text);
        alert("Texto copiado. Abre Instagram y pega en tu historia/post.");
        break;
      case "copy":
        await navigator.clipboard.writeText(text);
        alert("Hashtag copiado al portapapeles");
        break;
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setCaption("");
    setIsCapturing(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Input oculto para captura */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!isCapturing ? (
        // Botón para tomar foto
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 ${
            compact ? "py-2 px-3 text-sm" : "w-full py-3 px-4"
          }`}
        >
          <svg className={compact ? "w-4 h-4" : "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {compact ? "Foto" : "Tomar Foto"}
        </button>
      ) : (
        // Preview y opciones
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
          {/* Preview de la imagen */}
          {preview && (
            <div className="relative aspect-square bg-black">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              <button
                onClick={handleCancel}
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="p-4 space-y-4">
            {/* Caption */}
            <div>
              <input
                type="text"
                placeholder="Escribe un comentario..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">{hashtag}</p>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>
            )}

            {/* Botones de compartir */}
            <div className="flex gap-2">
              <button
                onClick={() => handleShare("twitter")}
                className="flex-1 bg-[#1DA1F2] text-white py-2 rounded-lg font-medium text-sm hover:bg-[#1a8cd8] transition-colors"
                title="Twitter/X"
              >
                X
              </button>
              <button
                onClick={() => handleShare("instagram")}
                className="flex-1 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                title="Instagram"
              >
                IG
              </button>
              <button
                onClick={() => handleShare("whatsapp")}
                className="flex-1 bg-[#25D366] text-white py-2 rounded-lg font-medium text-sm hover:bg-[#20bd5a] transition-colors"
                title="WhatsApp"
              >
                WA
              </button>
              <button
                onClick={() => handleShare("copy")}
                className="flex-1 bg-slate-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-slate-700 transition-colors"
                title="Copiar"
              >
                #
              </button>
            </div>

            {/* Botón subir a la galería */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Subiendo...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Subir a Galeria
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
