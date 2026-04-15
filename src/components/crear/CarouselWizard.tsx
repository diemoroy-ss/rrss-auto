"use client";

import React, { useState } from "react";
import CanvasEditor from "./CanvasEditor";

export interface CarouselSlide {
  url: string;
  finalUrl?: string;
  copy: string;
}

interface CarouselWizardProps {
  slides: CarouselSlide[];
  onUpdateSlide: (index: number, finalUrl: string) => void;
  userLogo: string;
  userId: string;
}

export default function CarouselWizard({
  slides,
  onUpdateSlide,
  userLogo,
  userId
}: CarouselWizardProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!slides || slides.length === 0) {
    return (
      <div className="p-8 border-2 border-dashed border-slate-200 rounded-[32px] text-center flex flex-col items-center justify-center min-h-[500px] text-slate-400 lg:sticky lg:top-24">
         <div className="text-6xl mb-4 opacity-50">🖼️</div>
         <h4 className="font-black text-lg mb-2 text-slate-600">Área de Visualización</h4>
         <p className="font-medium text-sm max-w-xs leading-relaxed">Describe tu idea a la izquierda y presiona "Ver Previsualización" para ver cómo quedará tu post.</p>
      </div>
    );
  }

  const currentSlide = slides[activeIndex];
  const isMulti = slides.length > 1;

  return (
    <div className="lg:sticky lg:top-24 space-y-6">
      {isMulti && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all ${
                activeIndex === idx 
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105' 
                : 'bg-white text-slate-500 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              Imagen {idx + 1}
              {slides[idx].finalUrl && <span className="ml-2 text-green-400">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* 
         We use a key based on activeIndex so React completely unmounts and remounts 
         the CanvasEditor for each slide, preventing state leakage between images. 
      */}
      <CanvasEditor 
        key={`canvas-${activeIndex}-${currentSlide.url}`}
        baseImageUrl={currentSlide.url}
        suggestedCopy={currentSlide.copy}
        initialLogoUrl={userLogo}
        userId={userId}
        onSave={(finalUrl) => onUpdateSlide(activeIndex, finalUrl)}
      />
      
      {isMulti && (
        <div className="flex items-center justify-between px-2">
            <button 
               onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
               disabled={activeIndex === 0}
               className="text-slate-500 disabled:opacity-30 font-bold text-xs uppercase hover:text-slate-900 transition-colors"
            >
               ← Anterior
            </button>
            <span className="text-[10px] font-black tracking-widest text-slate-400">{activeIndex + 1} de {slides.length}</span>
            <button 
               onClick={() => setActiveIndex(Math.min(slides.length - 1, activeIndex + 1))}
               disabled={activeIndex === slides.length - 1}
               className="text-slate-500 disabled:opacity-30 font-bold text-xs uppercase hover:text-slate-900 transition-colors"
            >
               Siguiente →
            </button>
        </div>
      )}
    </div>
  );
}
