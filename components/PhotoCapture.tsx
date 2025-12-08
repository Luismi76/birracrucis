"use client";



import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { compressImage, getDataUrlSize, formatFileSize, addWatermark } from "@/lib/image-utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export type PhotoCaptureHandle = {
  trigger: () => void;
};

type PhotoCaptureProps = {
  routeId: string;
  routeName: string;
  stopId?: string;
  stopName?: string;
  onPhotoUploaded?: () => void;
  compact?: boolean;
};

const PhotoCapture = forwardRef<PhotoCaptureHandle, PhotoCaptureProps>(({
  routeId,
  routeName,
  stopId,
  stopName,
  onPhotoUploaded,
  compact = false,
}, ref) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    trigger: () => {
      fileInputRef.current?.click();
    }
  }));

  const hashtag = `#${routeName.replace(/\s+/g, "")} #Birracrucis #${stopName?.replace(/\s+/g, "")}`;

  const processAndUpload = async (file: File) => {
    setUploading(true);
    const toastId = toast.loading("Procesando y subiendo foto...");

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
          caption: null,
          stopId: stopId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir foto");

      toast.success("Foto subida correctamente", { id: toastId });
      onPhotoUploaded?.();
    } catch (err) {
      console.error("Error procesando/subiendo imagen:", err);
      toast.error((err as Error).message || "Error al subir la foto", { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploading(false);
      return;
    }
    await processAndUpload(file);
  };

  return (
    <>
      {/* Input oculto para captura */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Overlay de carga (Full Screen) */}
      {uploading && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-pink-500" />
          <p className="text-xl font-bold">Subiendo foto...</p>
          <p className="text-sm text-white/70 mt-2">No cierres la app</p>
        </div>
      )}
    </>
  );
});

PhotoCapture.displayName = "PhotoCapture";
export default PhotoCapture;
