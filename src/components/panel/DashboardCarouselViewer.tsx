"use client";

import { useState } from "react";

interface DashboardCarouselViewerProps {
  urls: (string | undefined)[];
  isStory?: boolean;
}

/**
 * Visor de carrusel de imágenes/videos dentro del dashboard.
 * Detecta automáticamente si la URL corresponde a un video.
 */
export default function DashboardCarouselViewer({ urls, isStory }: DashboardCarouselViewerProps) {
  const [index, setIndex] = useState(0);

  const validUrls = urls.filter(Boolean) as string[];
  if (validUrls.length === 0) return null;

  const currentUrl = validUrls[index];
  const isVideo =
    currentUrl.toLowerCase().includes('.mp4') ||
    currentUrl.toLowerCase().includes('.mov') ||
    currentUrl.toLowerCase().includes('.webm') ||
    currentUrl.toLowerCase().includes('video') ||
    currentUrl.toLowerCase().includes('quicktime');

  const containerClass = `rounded-2xl overflow-hidden shadow-sm relative group bg-slate-950 flex-shrink-0 border border-slate-800 flex items-center justify-center w-full ${
    isVideo || isStory
      ? 'aspect-[9/16] max-h-[70vh] max-w-[340px] mx-auto'
      : 'aspect-square max-h-[60vh] max-w-[480px] mx-auto'
  }`;

  return (
    <div className={containerClass}>
      {isVideo ? (
        <video
          src={currentUrl}
          autoPlay
          loop
          muted
          playsInline
          controls
          className="w-full h-full object-contain"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt={`Imagen ${index + 1}`}
          className="w-full h-full object-contain transition-transform group-hover:scale-[1.01] duration-300"
        />
      )}

      {validUrls.length > 1 && (
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-white/10 shrink-0">
          {index + 1} / {validUrls.length}
        </div>
      )}

      {validUrls.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => Math.max(0, prev - 1));
            }}
            disabled={index === 0}
            aria-label="Imagen anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-800 disabled:opacity-30 hover:bg-white transition-all hover:scale-110 font-black text-xl z-20"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => Math.min(validUrls.length - 1, prev + 1));
            }}
            disabled={index === validUrls.length - 1}
            aria-label="Imagen siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-800 disabled:opacity-30 hover:bg-white transition-all hover:scale-110 font-black text-xl z-20"
          >
            →
          </button>
        </>
      )}
    </div>
  );
}
