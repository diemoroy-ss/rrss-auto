"use client";

import React, { useRef, useState, useEffect } from "react";
import VoiceMic from "../VoiceMic";
import Link from "next/link";
import { type PosterConfig } from "../../types/poster";
import { UserTemplate } from "../../app/automatizacion-rrss/panel/crear/page";

interface PostConfigFormProps {
  // AI states
  idea: string;
  setIdea: (val: string) => void;
  imageExpectation: string;
  setImageExpectation: (val: string) => void;
  postText: string;
  setPostText: (val: string) => void;

  // Manual states
  creationMode: 'ai' | 'manual';
  setCreationMode: (val: 'ai' | 'manual') => void;
  manualFiles: File[];
  setManualFiles: React.Dispatch<React.SetStateAction<File[]>>;
  manualCaption: string;
  setManualCaption: (val: string) => void;
  manualTemplates: UserTemplate[];
  selectedTemplate: UserTemplate | null;
  setSelectedTemplate: (val: UserTemplate | null) => void;
  loadingTemplates: boolean;
  onUploadNewTemplate?: (file: File) => void;
  onDeleteTemplate?: (tmpl: UserTemplate) => void;

  // General config
  postType: string;
  setPostType: (val: string) => void;
  carouselCount: number;
  setCarouselCount: (val: number) => void;
  businessType: string;
  setBusinessType: (val: string) => void;
  date: string;
  setDate: (val: string) => void;
  time: string;
  setTime: (val: string) => void;
  networks: { facebook: boolean; instagram: boolean; linkedin: boolean; tiktok: boolean };
  setNetworks: React.Dispatch<React.SetStateAction<{ facebook: boolean; instagram: boolean; linkedin: boolean; tiktok: boolean }>>;

  // Poster configuration (For references/logo defaults)
  posterConfig?: PosterConfig;
  setPosterConfig?: React.Dispatch<React.SetStateAction<PosterConfig>>;
  activeProfileLogoUrl?: string;
  activeProfileName?: string;
  activeProfilePhone?: string;
  activeProfileEmail?: string;

  // Handlers & loaders
  hasFb: boolean;
  hasIg: boolean;
  hasLi: boolean;
  hasTt: boolean;
  needsConnection: boolean;
  handleImproveWithAI: () => void;
  handleGeneratePreview: () => void;
  handleSubmit: (e?: React.FormEvent, publishNow?: boolean) => void;
  improveLoading: boolean;
  previewLoading: boolean;
  loading: boolean;
  error: string;
  isAdmin: boolean;
  allowVideo?: boolean;

  // Scheduler control
  showScheduler: boolean;
  setShowScheduler: (val: boolean) => void;

  // Constraints from current selection
  constraints: {
    safeCharLimit: number;
    allowedMediaTypes: string[];
    warnings: string[];
    forcedType: string;
  };

  hideSubmit?: boolean;
  renderSection?: 'parameters' | 'content';
}

export default function PostConfigForm({
  idea, setIdea,
  imageExpectation, setImageExpectation,
  postText, setPostText,
  creationMode, setCreationMode,
  manualFiles, setManualFiles,
  manualCaption, setManualCaption,
  manualTemplates,
  selectedTemplate, setSelectedTemplate,
  loadingTemplates,
  onUploadNewTemplate,
  onDeleteTemplate,
  postType, setPostType,
  carouselCount, setCarouselCount,
  businessType, setBusinessType,
  date, setDate,
  time, setTime,
  networks, setNetworks,
  hasFb, hasIg, hasLi, hasTt,
  needsConnection,
  handleImproveWithAI,
  handleGeneratePreview,
  handleSubmit,
  improveLoading,
  previewLoading,
  loading,
  error,
  isAdmin,
  allowVideo = false,
  showScheduler,
  setShowScheduler,
  constraints,
  hideSubmit = false,
  renderSection
}: PostConfigFormProps) {

  const maxChars = constraints.safeCharLimit;
  const isOverLimit = creationMode === 'ai' ? postText.length > maxChars : manualCaption.length > maxChars;

  // RENDER SECCIÓN 1: PARÁMETROS (COLUMNA IZQUIERDA)
  if (renderSection === 'parameters') {
    return (
      <div className="premium-card space-y-6">
        {/* MODO DE CREACIÓN */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Modo de Creación</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button
              type="button"
              onClick={() => setCreationMode('ai')}
              className={`py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                creationMode === 'ai'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                  : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              🤖 Generar con IA
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('manual')}
              className={`py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                creationMode === 'manual'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                  : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              📥 Subida Manual
            </button>
          </div>
        </div>

        {/* REDES DE DESTINO */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Redes de Destino</label>
          {needsConnection ? (
            <div className="p-4 bg-amber-50 border border-amber-250/60 rounded-2xl text-xs text-amber-800 font-semibold leading-relaxed">
              ⚠️ No tienes cuentas vinculadas. Ve a la sección de <Link href="/automatizacion-rrss/panel/cuentas" className="underline font-bold text-amber-900 hover:text-amber-950">Conexiones</Link> para enlazar tus redes.
            </div>
          ) : (
            <div className="flex gap-3">
              {hasFb && (
                <button
                  type="button"
                  onClick={() => setNetworks({ ...networks, facebook: !networks.facebook })}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black transition-all ${
                    networks.facebook ? 'bg-blue-600 scale-105 shadow-md shadow-blue-500/20' : 'bg-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  f
                </button>
              )}
              {hasIg && (
                <button
                  type="button"
                  onClick={() => setNetworks({ ...networks, instagram: !networks.instagram })}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black transition-all ${
                    networks.instagram ? 'bg-pink-600 scale-105 shadow-md shadow-pink-500/20' : 'bg-slate-200 opacity-60 hover:opacity-100'
                  }`}
                  style={networks.instagram ? { background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' } : {}}
                >
                  📸
                </button>
              )}
              {hasLi && (
                <button
                  type="button"
                  onClick={() => setNetworks({ ...networks, linkedin: !networks.linkedin })}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black transition-all ${
                    networks.linkedin ? 'bg-indigo-700 scale-105 shadow-md shadow-indigo-650/20' : 'bg-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  in
                </button>
              )}
              {hasTt && (
                <button
                  type="button"
                  onClick={() => setNetworks({ ...networks, tiktok: !networks.tiktok })}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black transition-all ${
                    networks.tiktok ? 'bg-slate-900 scale-105 shadow-md shadow-black/20' : 'bg-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  🎵
                </button>
              )}
            </div>
          )}
        </div>

        {/* TU RUBRO O TIPO DE NEGOCIO */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tu Rubro o Tipo de Negocio</label>
          <div className="relative">
            <input 
              type="text" 
              value={businessType} 
              onChange={e => setBusinessType(e.target.value)}
              placeholder="Ej: Gastrobar, Tienda de Mascotas..."
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none text-xs font-bold text-slate-700 focus:border-indigo-400"
            />
            <div className="absolute right-2.5 bottom-2.5">
              <VoiceMic 
                onResult={(text) => setBusinessType(businessType + (businessType ? " " : "") + text)} 
                className="scale-90"
              />
            </div>
          </div>
        </div>

        {/* TIPO DE PUBLICACIÓN */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Tipo de Publicación</label>
          <div className="grid grid-cols-4 gap-2">
            {['Post', 'Historia', 'Carrusel', 'Reel'].map(type => {
              const disabled = networks.tiktok && type !== 'Reel';
              return (
                <button 
                  key={type}
                  type="button"
                  disabled={disabled}
                  onClick={() => setPostType(type)}
                  className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    disabled ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' :
                    postType === type 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{type === 'Post' ? '🖼️' : type === 'Historia' ? '📱' : type === 'Carrusel' ? '📑' : '🎬'}</span>
                  <span className="text-[9px] font-bold uppercase">{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CAROUSEL COUNT */}
        {postType === 'Carrusel' && (
          <div className="animate-in slide-in-from-top-3 pt-2">
             <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">📑 Cantidad de imágenes</label>
             <div className="flex items-center gap-3 bg-indigo-50/50 p-3 border border-indigo-150 rounded-xl w-fit">
                <input 
                   type="range" 
                   min="2" max="5" 
                   value={carouselCount} 
                   onChange={(e) => setCarouselCount(parseInt(e.target.value))}
                   className="w-24 accent-indigo-600"
                />
                <span className="text-xs font-black text-indigo-700">{carouselCount}</span>
             </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER SECCIÓN 2: CONTENIDO (COLUMNA DERECHA)
  if (renderSection === 'content') {
    return (
      <div className="premium-card space-y-6">
        {creationMode === 'ai' ? (
          <div className="space-y-5">
            {/* CAMPO 1: ¿QUÉ IMAGEN QUIERES GENERAR? */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  💡 ¿Qué imagen quieres generar?
                </label>
                <VoiceMic
                  onResult={(text) => setImageExpectation(imageExpectation + (imageExpectation ? " " : "") + text)}
                  className="scale-90"
                />
              </div>
              <textarea
                value={imageExpectation}
                onChange={e => setImageExpectation(e.target.value)}
                placeholder="Describe el estilo y elementos de la imagen que necesitas..."
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none text-xs font-semibold text-slate-700 resize-none min-h-[90px] focus:border-indigo-400"
              />
            </div>

            {/* CAMPO 2: TEXTO DE LA PUBLICACIÓN (BOTÓN MEJORAR CON IA AL LADO DEL TEXTO) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  ✍️ Texto de la publicación
                </label>
                <button
                  type="button"
                  onClick={handleImproveWithAI}
                  disabled={improveLoading}
                  className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider disabled:bg-slate-100 disabled:text-slate-400 transition-all hover:bg-indigo-100/50 shadow-sm"
                >
                  {improveLoading ? 'Creando...' : '✨ Mejorar con IA'}
                </button>
              </div>

              <div className={`border rounded-xl bg-slate-50/50 overflow-hidden flex flex-col focus-within:border-indigo-400 ${
                isOverLimit ? 'border-rose-300' : 'border-slate-200'
              }`}>
                <textarea
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  placeholder="El copy que acompañará tu post..."
                  className={`w-full bg-transparent px-4 py-3 text-sm outline-none resize-none min-h-[110px] font-semibold leading-normal ${
                    isOverLimit ? 'text-rose-600' : 'text-slate-700'
                  }`}
                  maxLength={maxChars + 500}
                />
                <div className="px-4 py-2 bg-white/50 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <VoiceMic
                    onResult={(text) => setPostText(postText + (postText ? " " : "") + text)}
                    className="scale-75"
                  />
                  <span className={isOverLimit ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                    {postText.length} / {maxChars}
                  </span>
                </div>
              </div>

              {/* BOTÓN GENERAR PREVISUALIZACIÓN ABAJO DEL TEXTO CON SPINNER SVG INTEGRADO */}
              <div className="flex gap-2.5 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleGeneratePreview()}
                  disabled={previewLoading || (!imageExpectation.trim() && !idea.trim() && !postText.trim())}
                  className="bg-indigo-600 text-white text-[11px] font-black px-5 py-2.5 rounded-xl uppercase tracking-wider disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 justify-center min-w-[130px] min-h-[36px]"
                >
                  {previewLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    (postType === 'Reel' || networks.tiktok) ? '🎬 Crear Video' : '🖼️ Previsualizar'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* MANUAL MODE */}
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                ✍️ Texto de la publicación (Caption)
              </label>
              <button
                type="button"
                onClick={handleImproveWithAI}
                disabled={improveLoading || !manualCaption}
                className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider disabled:bg-slate-100 disabled:text-slate-400 transition-all hover:bg-indigo-100/50 shadow-sm"
              >
                {improveLoading ? 'Mejorando...' : '✨ Mejorar con IA'}
              </button>
            </div>
            <textarea
              value={manualCaption}
              onChange={e => setManualCaption(e.target.value)}
              placeholder="Escribe el texto que acompañará tu post..."
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none text-xs font-semibold text-slate-700 resize-none min-h-[110px] focus:border-indigo-400"
            />
            {/* GALERÍA MANUAL */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Galería</label>
              <div className="grid grid-cols-4 gap-2">
                <label className="flex flex-col items-center justify-center bg-white border border-dashed border-indigo-200 hover:bg-indigo-50 rounded-xl cursor-pointer aspect-square text-indigo-500 shadow-inner">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0] && onUploadNewTemplate) {
                        onUploadNewTemplate(e.target.files[0]);
                      }
                    }}
                    className="hidden" 
                  />
                  <span className="text-xl">➕</span>
                  <span className="text-[9px] font-bold mt-1">SUBIR</span>
                </label>

                {loadingTemplates ? (
                   <div className="col-span-3 flex items-center justify-center text-xs text-slate-400 font-bold">Cargando galería...</div>
                ) : (
                   manualTemplates.slice(0, 3).map((tmpl) => {
                      const isSelected = selectedTemplate?.id === tmpl.id;
                      const isVid = tmpl.type === 'video';
                      return (
                         <div key={tmpl.id} className="relative group aspect-square rounded-xl overflow-hidden border">
                            <button
                              type="button"
                              onClick={() => setSelectedTemplate(tmpl)}
                              className="w-full h-full text-left"
                            >
                               {isVid ? (
                                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-xs relative">
                                     <span>🎬 Video</span>
                                     {isSelected && <div className="absolute inset-0 bg-indigo-500/20 border-2 border-indigo-500 rounded-xl"></div>}
                                  </div>
                               ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img 
                                    src={tmpl.url} 
                                    alt="User template" 
                                    className={`w-full h-full object-cover transition-all ${isSelected ? 'border-2 border-indigo-500 scale-95' : 'hover:scale-105'}`} 
                                  />
                               )}
                            </button>
                            {onDeleteTemplate && (
                              <button
                                type="button"
                                onClick={() => onDeleteTemplate(tmpl)}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ✕
                              </button>
                            )}
                         </div>
                      );
                   })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER FALLBACK: COMPLETO (Si no se especifica renderSection)
  return null;
}
