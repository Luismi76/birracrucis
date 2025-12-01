"use client";

import { useState, useEffect } from "react";

type Photo = {
  id: string;
  url: string;
  caption: string | null;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
  stop: {
    name: string;
  } | null;
};

type PhotoGalleryProps = {
  routeId: string;
  refreshTrigger?: number;
};

export default function PhotoGallery({ routeId, refreshTrigger }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [hashtag, setHashtag] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`/api/routes/${routeId}/photos`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setPhotos(data.photos);
          setHashtag(data.hashtag);
        }
      }
    } catch (err) {
      console.error("Error fetching photos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [routeId, refreshTrigger]);

  const handleShare = async (photo: Photo, platform: "twitter" | "whatsapp" | "copy") => {
    const text = photo.caption
      ? `${photo.caption} ${hashtag}`
      : `${hashtag}`;

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
      case "copy":
        await navigator.clipboard.writeText(text);
        alert("Copiado al portapapeles");
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">No hay fotos todavia</p>
        <p className="text-xs mt-1">Se el primero en compartir!</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid de fotos */}
      <div className="grid grid-cols-3 gap-1">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="aspect-square bg-slate-100 overflow-hidden hover:opacity-90 transition-opacity"
          >
            <img
              src={photo.url}
              alt={photo.caption || "Foto"}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Modal de foto ampliada */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              {selectedPhoto.user.image ? (
                <img
                  src={selectedPhoto.user.image}
                  alt={selectedPhoto.user.name || "Usuario"}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  {selectedPhoto.user.name?.charAt(0) || "?"}
                </div>
              )}
              <div>
                <p className="font-bold">{selectedPhoto.user.name || "Anonimo"}</p>
                {selectedPhoto.stop && (
                  <p className="text-xs text-white/70">{selectedPhoto.stop.name}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Imagen */}
          <div className="flex-1 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || "Foto"}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Footer con caption y compartir */}
          <div className="p-4 text-white" onClick={(e) => e.stopPropagation()}>
            {selectedPhoto.caption && (
              <p className="mb-3">{selectedPhoto.caption}</p>
            )}
            <p className="text-purple-400 text-sm mb-3">{hashtag}</p>

            <div className="flex gap-2">
              <button
                onClick={() => handleShare(selectedPhoto, "twitter")}
                className="flex-1 bg-[#1DA1F2] py-2 rounded-lg font-medium text-sm"
              >
                Compartir en X
              </button>
              <button
                onClick={() => handleShare(selectedPhoto, "whatsapp")}
                className="flex-1 bg-[#25D366] py-2 rounded-lg font-medium text-sm"
              >
                WhatsApp
              </button>
              <button
                onClick={() => handleShare(selectedPhoto, "copy")}
                className="px-4 bg-white/20 py-2 rounded-lg font-medium text-sm"
              >
                #
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
