"use client";

import { useSession } from "next-auth/react";
import { usePhotos, useDeletePhoto, type Photo } from "@/hooks/usePhotos";


type StopInfo = {
  id: string;
  name: string;
  order?: number; // Optional as it might come from diff types
};

type PhotoGalleryProps = {
  routeId: string;
  stops?: StopInfo[]; // Optional to allow usage without stops too
  refreshTrigger?: number;
};

export default function PhotoGallery({ routeId, stops = [] }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filter, setFilter] = useState<'all' | 'challenges'>('all');

  const { data, isLoading } = usePhotos(routeId);
  const photos = data?.photos ?? [];
  const hashtag = data?.hashtag ?? "";

  // Filter photos based on selected tab
  const filteredPhotos = filter === 'challenges'
    ? photos.filter(p => p.challengeId)
    : photos;

  // Group photos by Stop
  const groupedPhotos = filteredPhotos.reduce((acc, photo) => {
    const stopId = photo.stopId || "general";
    if (!acc[stopId]) {
      acc[stopId] = {
        name: photo.stop?.name || "Fotos Generales",
        photos: [],
        stopId: stopId
      };
    }
    acc[stopId].photos.push(photo);
    return acc;
  }, {} as Record<string, { name: string; photos: Photo[]; stopId: string }>);

  // Sort groups based on Route Stops order
  const sortedGroups = Object.values(groupedPhotos).sort((a, b) => {
    if (a.stopId === "general") return 1; // General at the end (or beginning?)
    if (b.stopId === "general") return -1;

    const indexA = stops.findIndex(s => s.id === a.stopId);
    const indexB = stops.findIndex(s => s.id === b.stopId);

    // If not found in stops list (shouldn't happen), push to end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

  const handleShare = async (photo: Photo) => {
    const text = photo.caption
      ? `${photo.caption} ${hashtag}`
      : `${hashtag}`;

    try {
      if (navigator.share) {
        // Intentar compartir con archivo si es posible
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const file = new File([blob], `birracrucis-${Date.now()}.jpg`, { type: "image/jpeg" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Birracrucis",
            text: text,
          });
          return;
        }

        // Fallback a compartir solo texto/url si no deja archivos
        await navigator.share({
          title: "Birracrucis",
          text: text,
          url: photo.url
        });
      } else {
        // Fallback para desktop
        await navigator.clipboard.writeText(photo.url);
        alert("Enlace copiado al portapapeles (Tu navegador no soporta compartir nativo)");
      }
    } catch (err) {
      console.error("Error compartiendo:", err);
    }
  };

  if (isLoading) {
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
    <div className="space-y-4 pb-20">
      {/* Filter Tabs */}
      <div className="flex gap-2 px-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${filter === 'all'
            ? 'bg-purple-600 text-white shadow-md'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
        >
          Todas ({photos.length})
        </button>
        <button
          onClick={() => setFilter('challenges')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${filter === 'challenges'
            ? 'bg-amber-500 text-white shadow-md'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
        >
          <span>🏆</span>
          Desafíos ({photos.filter(p => p.challengeId).length})
        </button>
      </div>

      {filteredPhotos.length === 0 && filter === 'challenges' ? (
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-sm">No hay fotos de desafíos todavía</p>
          <p className="text-xs mt-1">Completa desafíos para capturar momentos especiales!</p>
        </div>
      ) : (
        sortedGroups.map((group) => (
          <div key={group.stopId} className="space-y-2">
            {/* Header de Sección */}
            <div className="px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">
                {group.name}
              </h3>
              <span className="text-xs text-slate-400 font-normal">({group.photos.length})</span>
            </div>

            {/* Grid de fotos del grupo */}
            <div className="grid grid-cols-3 gap-0.5">
              {group.photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="aspect-square bg-slate-100 overflow-hidden hover:opacity-90 transition-opacity active-scale relative rounded-xl shadow-sm border border-slate-100"
                >
                  <OptimizedImage
                    src={photo.url}
                    alt={photo.caption || "Foto"}
                    className="w-full h-full object-cover"
                  />

                  {/* Trophy badge for challenge photos */}
                  {photo.challengeId && (
                    <div className="absolute top-1 right-1 bg-amber-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-md flex items-center gap-0.5">
                      <span>🏆</span>
                    </div>
                  )}

                  {/* Mini badge si tiene caption o usuario */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                    <p className="text-[10px] text-white truncate font-medium text-left px-1">
                      {photo.user.name?.split(' ')[0]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal de foto ampliada */}
      {
        selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/90 z-[100] flex flex-col"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                {selectedPhoto.user.image ? (
                  <img
                    src={selectedPhoto.user.image}
                    alt={selectedPhoto.user.name || "Usuario"}
                    className="w-10 h-10 rounded-full border-2 border-purple-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold border-2 border-white">
                    {selectedPhoto.user.name?.charAt(0) || "?"}
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm">{selectedPhoto.user.name || "Anonimo"}</p>
                  {selectedPhoto.challengeId && (
                    <p className="text-xs text-amber-300 flex items-center gap-1">
                      <span>🏆</span> Desafío completado
                    </p>
                  )}
                  {selectedPhoto.stop && (
                    <p className="text-xs text-white/70 flex items-center gap-1">
                      <span>📍</span> {selectedPhoto.stop.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Imagen */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || "Foto"}
                className="max-w-full max-h-full object-contain shadow-2xl"
              />
            </div>

            {/* Footer con caption y compartir */}
            <div className="p-4 bg-gradient-to-t from-black/80 to-transparent" onClick={(e) => e.stopPropagation()}>
              {selectedPhoto.caption && (
                <p className="text-white text-lg font-medium mb-2">{selectedPhoto.caption}</p>
              )}
              <p className="text-purple-300 text-sm mb-4 font-mono">{hashtag}</p>

              <button
                onClick={() => handleShare(selectedPhoto)}
                className="w-full bg-white text-black py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-95 transition-all mb-3"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Compartir Foto
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
}
