"use client";

import { useState, useRef } from "react";
import { compressImage, getDataUrlSize, formatFileSize, addWatermark } from "@/lib/image-utils";
import { toast } from "sonner"; // Assuming sonner is available based on other files

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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hashtag = `#${routeName.replace(/\s+/g, "")} #Birracrucis #${stopName?.replace(/\s+/g, "")}`;

  const processAndUpload = async (file: File) => {
    setUploading(true);

    try {
      // 1. Validar tamaño original (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("La imagen es demasiado grande (max 10MB)");
      }

      // 2. Comprimir imagen
      let compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        format: "jpeg",
      });

      // 3. Verificar tamaño comprimido (max 2MB)
      const compressedSize = getDataUrlSize(compressed);
      if (compressedSize > 2 * 1024 * 1024) {
        compressed = await compressImage(file, {
          maxWidth: 1000,
          maxHeight: 1000,
          quality: 0.6,
          format: "jpeg",
        });
      }

      // 4. Añadir marca de agua
      const watermarked = await addWatermark(compressed, hashtag);

      // 5. Subir directamente
      const res = await fetch(`/api/routes/${routeId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: watermarked,
          caption: null, // Auto-upload sin caption por ahora
          stopId: stopId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir foto");

      toast.success("Foto subida correctamente");
      onPhotoUploaded?.();
    } catch (err) {
      console.error("Error procesando/subiendo imagen:", err);
      toast.error((err as Error).message || "Error al subir la foto");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUpload(file);
  };

  return (
    <div className="">
      {/* Input oculto para captura */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={() => !uploading && fileInputRef.current?.click()}
        disabled={uploading}
        className={`flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed ${compact ? "py-2 px-3 text-sm" : "w-full py-3 px-4"
          }`}
      >
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            <span>Subiendo...</span>
          </>
        ) : (
          <>
            <svg className={compact ? "w-4 h-4" : "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {compact ? "Foto" : "Tomar Foto"}
          </>
        )}
      </button>
    </div>
  );
}
