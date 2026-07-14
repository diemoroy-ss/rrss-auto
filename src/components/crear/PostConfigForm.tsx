"use client";

import React from "react";
import Link from "next/link";
import VoiceMic from "../VoiceMic";
import StatusModal from "../StatusModal";

interface PostConfigFormProps {
  idea: string;
  setIdea: (val: string) => void;
  imageExpectation: string;
  setImageExpectation: (val: string) => void;
  postText: string;
  setPostText: (val: string) => void;
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
  allowVideo?: boolean;
  creationMode: 'ai' | 'manual';
  setCreationMode: (val: 'ai' | 'manual') => void;
  manualFiles: File[];
  setManualFiles: (files: File[] | ((prev: File[]) => File[])) => void;
  manualCaption: string;
  setManualCaption: (val: string) => void;
  isAdmin?: boolean;
  manualTemplates?: any[];
  selectedTemplate?: any;
  setSelectedTemplate?: any;
  loadingTemplates?: boolean;
  onUploadNewTemplate?: (file: File) => void;
  onDeleteTemplate?: (tmpl: any) => Promise<void>;
  hideSubmit?: boolean;
  showScheduler?: boolean;
  setShowScheduler?: (val: boolean) => void;
  constraints?: any;
  /** Define qué sección renderizar: 'parameters' (Columna Izquierda) o 'content' (Columna Derecha) */
  renderSection: 'parameters' | 'content';
}

export default function PostConfigForm({
  idea, setIdea,
  imageExpectation, setImageExpectation,
  postText, setPostText,
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
  improveLoading, previewLoading, loading, error, allowVideo = true,
  creationMode, setCreationMode,
  manualFiles, setManualFiles,
  manualCaption, setManualCaption,
  isAdmin, manualTemplates = [], selectedTemplate, setSelectedTemplate, loadingTemplates, onUploadNewTemplate, onDeleteTemplate,
  hideSubmit = false, showScheduler = false, setShowScheduler,
  constraints,
  renderSection
}: PostConfigFormProps) {
  const [localStatusModal, setLocalStatusModal] = React.useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);
  
  React.useEffect(() => {
    if (networks.tiktok && postType !== 'Reel') {
      setPostType('Reel');
    }
  }, [networks.tiktok, postType, setPostType]);

  const maxChars = constraints?.safeCharLimit || 1000;
  const currentLength = creationMode === 'ai' ? postText.length : manualCaption.length;
  const isOverLimit = currentLength > maxChars;

  // RENDER SECCIÓN 1: PARAMETROS (COLUMNA IZQUIERDA)
  if (renderSection === 'parameters') {
    return (
      <div className="premium-card space-y-6">
        {/* MODO DE CREACIÓN: IA VS MANUAL */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Modo de Creación</label>
          <div className="relative flex bg-slate-100 p-1.5 rounded-2xl w-full shadow-inner border border-slate-200">
               <div 
                 className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200/50 transition-all duration-300 ease-out"
                 style={{ left: creationMode === 'ai' ? '6px' : 'calc(50% + 0px)' }}
               />
               <button 
                 type="button"
                 onClick={() => setCreationMode('ai')} 
                 className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors z-10 ${creationMode === 'ai' ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 🤖 Generar con IA
               </button>
               <button 
                 type="button"
                 onClick={() => setCreationMode('manual')} 
                 className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors z-10 ${creationMode === 'manual' ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 📤 Subida Manual
               </button>
          </div>
        </div>

        {/* REDES DE DESTINO */}
        <div id="tour-step-networks">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Redes de destino</label>
          <div className="flex flex-wrap gap-3">
            {hasFb && (
              <button 
                type="button" 
                title="Facebook"
                onClick={() => setNetworks(prev => ({...prev, facebook: !prev.facebook}))} 
                className={`w-12 h-12 rounded-xl border transition-all duration-300 flex items-center justify-center ${
                  networks.facebook ? 'bg-[#1877F2] text-white border-[#1877F2] shadow-md scale-105' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
            )}
            {hasIg && (
              <button 
                type="button" 
                title="Instagram"
                onClick={() => setNetworks(prev => ({...prev, instagram: !prev.instagram}))} 
                className={`w-12 h-12 rounded-xl border transition-all duration-300 flex items-center justify-center ${
                  networks.instagram ? 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white border-transparent shadow-md scale-105' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </button>
            )}
            {hasLi && (
              <button 
                type="button" 
                title="LinkedIn"
                onClick={() => setNetworks(prev => ({...prev, linkedin: !prev.linkedin}))} 
                className={`w-12 h-12 rounded-xl border transition-all duration-300 flex items-center justify-center ${
                  networks.linkedin ? 'bg-[#0077B5] text-white border-[#0077B5] shadow-md scale-105' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9H7.12v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.65h-3.56V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z"/>
                </svg>
              </button>
            )}
            {hasTt && (
              <button 
                type="button" 
                title="TikTok"
                onClick={() => setNetworks(prev => ({...prev, tiktok: !prev.tiktok}))} 
                className={`w-12 h-12 rounded-xl border transition-all duration-300 flex items-center justify-center ${
                  networks.tiktok ? 'bg-black text-white border-black shadow-md scale-105' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.96 1.21 2.28 2.06 3.77 2.44v3.91c-1.3-.08-2.59-.53-3.69-1.3-1.1-.77-1.95-1.87-2.45-3.14v7.88c.03 2.24-.65 4.43-1.95 6.22-1.3 1.79-3.21 2.99-5.38 3.39-2.17.4-4.44.02-6.39-1.07C2 21.6 1.11 19.53 1.02 17.29c-.09-2.24.63-4.44 2.03-6.2 1.4-1.76 3.42-2.92 5.67-3.23.7-.1-1.3-.01.59-.02v4c-1.36.14-2.61.83-3.41 1.9-.8 1.07-1.12 2.42-.89 3.75.23 1.33.99 2.51 2.08 3.24 1.09.73 2.42.92 3.66.52 1.24-.4 2.21-1.34 2.66-2.56.45-1.22.4-2.57-.14-3.75-.15-.33-.31-.65-.49-.95.01-3.69-.01-7.39.02-11.08z"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* RUBRO / NEGOCIO */}
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

            {/* CAMPO 2: TEXTO DE LA PUBLICACIÓN */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  ✍️ Texto de la publicación
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleImproveWithAI}
                    disabled={improveLoading || !idea}
                    className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                  >
                    {improveLoading ? 'Creando...' : '✨ Generar con IA'}
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={previewLoading || !imageExpectation}
                    className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-wider disabled:bg-slate-200 disabled:text-slate-400 shadow-sm transition-all"
                  >
                    {previewLoading ? '...' : (postType === 'Reel' || networks.tiktok) ? '🎬 Crear Video' : '🖼️ Previsualizar'}
                  </button>
                </div>
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
                className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider"
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
                  <span className="text-xl">📸</span>
                  <span className="text-[8px] font-black uppercase text-center mt-1">Subir</span>
                </label>
                {manualTemplates?.slice(0, 7).map((tmpl) => {
                  const isVideo = tmpl.type === 'video' || tmpl.url.match(/\.(mp4|mov|webm|quicktime)/i) || tmpl.url.includes("video");
                  return (
                    <div 
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate?.(tmpl)}
                      className={`relative w-full aspect-square rounded-xl cursor-pointer overflow-hidden transition-all border ${
                        selectedTemplate?.id === tmpl.id ? 'ring-2 ring-indigo-500 border-transparent scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {isVideo ? (
                        <div className="w-full h-full bg-slate-950 flex items-center justify-center text-sm">🎬</div>
                      ) : (
                        <img src={tmpl.url} alt="Thumbnail" className="w-full h-full object-cover" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
