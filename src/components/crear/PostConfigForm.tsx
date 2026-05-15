"use client";

import React from "react";
import Link from "next/link";
import VoiceMic from "../VoiceMic";

interface PostConfigFormProps {
  idea: string;
  setIdea: (val: string) => void;
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
  handleSubmit: (e: React.FormEvent) => void;
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
  selectedTemplate?: any | null;
  setSelectedTemplate?: (val: any | null) => void;
  loadingTemplates?: boolean;
  onUploadNewTemplate?: (file: File) => void;
  onDeleteTemplate?: (tmpl: any) => Promise<void>;
  hideSubmit?: boolean;
  showScheduler?: boolean;
  setShowScheduler?: (val: boolean) => void;
}

export default function PostConfigForm({
  idea, setIdea,
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
  hideSubmit = false, showScheduler = false, setShowScheduler
}: PostConfigFormProps) {
  return (
    <form id="create-post-form" onSubmit={handleSubmit} className="space-y-8">
      {error && <div className="p-5 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm border border-rose-100 animate-in fade-in slide-in-from-top-2">{error}</div>}

      {needsConnection && (
        <div className="p-6 bg-amber-50 border-2 border-amber-100 rounded-[28px] flex items-center gap-6 animate-in fade-in slide-in-from-left-4">
          <div className="text-3xl">⚠️</div>
          <div className="flex-1">
            <h4 className="font-black text-amber-900 text-sm tracking-tight">Cuentas no vinculadas</h4>
            <p className="text-amber-800/70 text-xs font-medium mt-1">Puedes guardar tu idea ahora, pero para publicar necesitarás conectar Facebook o Instagram en Configuración.</p>
          </div>
          <Link href="/automatizacion-rrss/panel/configuracion" className="bg-white text-amber-700 px-5 py-2 rounded-xl text-xs font-black shadow-sm border border-amber-200 hover:bg-amber-100 transition-colors">
             Vincular Ahora
          </Link>
        </div>
      )}

      <div id="tour-form-container" className="premium-card space-y-8">
        
        {/* MODO DE CREACIÓN: IA VS MANUAL */}
        <div className="relative flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner border border-slate-200">
             <div 
               className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200/50 transition-all duration-300 ease-out"
               style={{ left: creationMode === 'ai' ? '6px' : 'calc(50% + 0px)' }}
             />
             <button 
               type="button"
               onClick={() => setCreationMode('ai')} 
               className={`relative flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors z-10 ${creationMode === 'ai' ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
             >
               <span className={`${creationMode === 'ai' ? 'scale-110 drop-shadow-sm' : 'grayscale opacity-60'} transition-all`}>🤖</span> Generar con IA
             </button>
             <button 
               type="button"
               onClick={() => setCreationMode('manual')} 
               className={`relative flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors z-10 ${creationMode === 'manual' ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
             >
               <span className={`${creationMode === 'manual' ? 'scale-110 drop-shadow-sm' : 'grayscale opacity-60'} transition-all`}>📤</span> Subida Manual
             </button>
        </div>

        {/* REDES DE DESTINO */}
        <div id="tour-step-networks">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Redes de destino</label>
          <div className="flex flex-wrap gap-4">
            <button 
              type="button" 
              title="Facebook"
              onClick={() => setNetworks(prev => ({...prev, facebook: !prev.facebook}))} 
              className={`w-14 h-14 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center ${
                networks.facebook 
                ? 'bg-[#1877F2] text-white border-[#1877F2] shadow-lg shadow-[#1877F2]/30 scale-105' 
                : 'bg-slate-800 text-slate-400 border-slate-900 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button 
              type="button" 
              title="Instagram"
              onClick={() => setNetworks(prev => ({...prev, instagram: !prev.instagram}))} 
              className={`w-14 h-14 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center ${
                networks.instagram 
                ? 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white border-transparent shadow-lg shadow-pink-500/30 scale-105' 
                : 'bg-slate-800 text-slate-400 border-slate-900 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
            </button>
            <button 
              type="button" 
              title="LinkedIn"
              onClick={() => setNetworks(prev => ({...prev, linkedin: !prev.linkedin}))} 
              className={`w-14 h-14 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center ${
                networks.linkedin 
                ? 'bg-[#0077B5] text-white border-[#0077B5] shadow-lg shadow-[#0077B5]/30 scale-105' 
                : 'bg-slate-800 text-slate-400 border-slate-900 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9H7.12v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.65h-3.56V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z"/>
              </svg>
            </button>
            <button 
              type="button" 
              title="TikTok"
              onClick={() => setNetworks(prev => ({...prev, tiktok: !prev.tiktok}))} 
              className={`w-14 h-14 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center ${
                networks.tiktok 
                ? 'bg-[#000000] text-white border-[#000000] shadow-lg shadow-black/35 scale-105' 
                : 'bg-slate-800 text-slate-400 border-slate-900 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.96 1.21 2.28 2.06 3.77 2.44v3.91c-1.3-.08-2.59-.53-3.69-1.3-1.1-.77-1.95-1.87-2.45-3.14v7.88c.03 2.24-.65 4.43-1.95 6.22-1.3 1.79-3.21 2.99-5.38 3.39-2.17.4-4.44.02-6.39-1.07C2 21.6 1.11 19.53 1.02 17.29c-.09-2.24.63-4.44 2.03-6.2 1.4-1.76 3.42-2.92 5.67-3.23.7-.1-1.3-.01.59-.02v4c-1.36.14-2.61.83-3.41 1.9-.8 1.07-1.12 2.42-.89 3.75.23 1.33.99 2.51 2.08 3.24 1.09.73 2.42.92 3.66.52 1.24-.4 2.21-1.34 2.66-2.56.45-1.22.4-2.57-.14-3.75-.15-.33-.31-.65-.49-.95.01-3.69-.01-7.39.02-11.08z"/>
              </svg>
            </button>
          </div>
          {!hasFb && !hasIg && !hasLi && !hasTt && (
              <p className="text-[10px] font-bold text-slate-400 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">⚠️ Nota: Las opciones de redes están limitadas porque no hay cuentas vinculadas.</p>
          )}
        </div>

        {/* RUBRO / NEGOCIO */}
        <div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tu Rubro o Tipo de Negocio</label>
           <div className="space-y-3">
               <input 
                 type="text" 
                 value={businessType} 
                 onChange={e => setBusinessType(e.target.value)}
                 placeholder="Ej: Gastrobar, Tienda de Mascotas, Coaching Online..."
                 className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700 hover:border-slate-200"
               />
               <div className="flex justify-end">
                 <VoiceMic 
                   onResult={(text) => setBusinessType(businessType + (businessType ? " " : "") + text)} 
                   className="relative"
                 />
               </div>
           </div>

        </div>

         {/* POST TYPE SELECTOR */}
        <div id="tour-step-type">
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tipo de Publicación</label>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Tipo de Publicación">
              {['Post', 'Historia', 'Carrusel', 'Reel'].map(type => {
                 const disabled = type === 'Reel' && !isAdmin;
                 return (
                 <button 
                   key={type}
                   type="button"
                   role="radio"
                   disabled={disabled}
                   title={disabled ? "Solo los administradores pueden generar Reels por el momento." : ""}
                   aria-checked={postType === type}
                   onClick={() => setPostType(type)}
                   className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                     disabled ? 'opacity-50 cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400' :
                     postType === type 
                     ? type === 'Reel' ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm relative overflow-hidden' : 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                     : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                   }`}
                 >
                    {postType === type && type === 'Reel' && <div className="absolute inset-0 bg-rose-500/10 animate-pulse"></div>}
                    <span className={`${postType === type ? 'scale-110' : ''} transition-transform text-2xl relative z-10`}>{type === 'Post' ? '🖼️' : type === 'Historia' ? '📱' : type === 'Carrusel' ? '📑' : '🎬'}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{type} {disabled && '🔒'}</span>
                 </button>
                 )
              })}
           </div>
        </div>

        {/* CAROUSEL COUNT */}
        {postType === 'Carrusel' && (
          <div className="animate-in slide-in-from-top-4 fade-in pt-4">
             <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><span>📑</span> ¿Cuántas imágenes tendrá el carrusel?</label>
             <div className="flex items-center gap-4 bg-indigo-50/50 p-4 border-2 border-indigo-100 rounded-2xl w-fit">
                <input 
                   type="range" 
                   min="2" max="5" 
                   value={carouselCount} 
                   onChange={(e) => setCarouselCount(parseInt(e.target.value))}
                   className="w-32 accent-indigo-600"
                />
                <div className="text-xl font-black text-indigo-700 w-6 items-center flex justify-center">{carouselCount}</div>
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Imágenes</span>
             </div>
          </div>
        )}

        {/* SECCIÓN DE IDEA / CAPTION / IA (PERMANENTE) */}
        <div id="tour-step-idea">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {creationMode === 'ai' ? 'Tu Idea Base' : 'Texto de la publicación (Caption)'}
            </label>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={handleImproveWithAI}
                disabled={improveLoading || (creationMode === 'ai' ? !idea : !manualCaption)}
                className="bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-indigo-200 shadow-sm"
              >
                {improveLoading ? 'Refinando...' : '✨ Mejorar con IA'}
              </button>
              {creationMode === 'ai' && (
                <button 
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={previewLoading || !idea}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                >
                  {previewLoading ? 'Generando...' : '🖼️ Ver Previsualización'}
                </button>
              )}
            </div>
          </div>
          <div className="border-2 border-slate-100 rounded-[28px] bg-slate-50/50 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50 transition-all overflow-hidden flex flex-col">
              <div className="flex items-start">
                <span className="pl-6 pt-6 text-xl">{creationMode === 'ai' ? '💡' : '✍️'}</span>
                <textarea
                  value={creationMode === 'ai' ? idea : manualCaption}
                  onChange={e => creationMode === 'ai' ? setIdea(e.target.value) : setManualCaption(e.target.value)}
                  placeholder={creationMode === 'ai' ? "Describe lo que quieres publicar..." : "Escribe el texto que acompañará tu post..."}
                  className="w-full bg-transparent px-4 py-6 text-base text-slate-800 outline-none placeholder:text-slate-400 min-h-[160px] resize-none font-medium leading-relaxed"
                  maxLength={1000}
                />
              </div>
              <div className="px-6 py-4 bg-white/50 border-t border-slate-100 flex items-center justify-between">
                <VoiceMic 
                  onResult={(text) => {
                    if (creationMode === 'ai') setIdea(idea + (idea ? " " : "") + text);
                    else setManualCaption(manualCaption + (manualCaption ? " " : "") + text);
                  }} 
                  className="relative"
                />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {(creationMode === 'ai' ? idea.length : manualCaption.length)} / 1000 Caracteres
                </p>
              </div>
          </div>
        </div>


        {/* GALERÍA MANUAL (SOLO SI EL MODO ES MANUAL) */}
        {creationMode === 'manual' && (
          <div className="animate-in slide-in-from-top-4 fade-in pt-4 border-t border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tu Galería</label>
            
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                    <h5 className="font-bold text-slate-700 text-sm">Selecciona o sube una imagen o video</h5>
                    {loadingTemplates && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                    {/* Botón de subir nuevo (Siempre el primero) */}
                    <label className="relative flex flex-col items-center justify-center bg-white border-2 border-dashed border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 rounded-2xl cursor-pointer group hover:scale-105 transition-all text-indigo-500 aspect-square shadow-sm">
                        <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" 
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0] && onUploadNewTemplate) {
                                    const f = e.target.files[0];
                                    const isVideo = f.type.startsWith('video/');
                                    const maxSize = isVideo ? 100 : 10;
                                    if (f.size / (1024*1024) > maxSize) {
                                        alert(isVideo ? `Video demasiado grande. Máx ${maxSize}MB` : `Imagen demasiado grande. Máx ${maxSize}MB`);
                                        return;
                                    }
                                    onUploadNewTemplate(f);
                                }
                            }}
                            className="hidden" 
                        />
                        <span className="text-3xl mb-1 group-hover:rotate-12 transition-transform">📸</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter text-center">Subir Foto/Video</span>
                    </label>

                    {/* Lista de templates del usuario */}
                    {manualTemplates?.map((tmpl) => {
                        const isVideo = tmpl.type === 'video' || tmpl.url.match(/\.(mp4|mov|webm|quicktime)/i) || tmpl.url.includes("video");
                        return (
                          <div 
                              key={tmpl.id}
                              onClick={() => setSelectedTemplate?.(tmpl)}
                              className={`group relative w-full aspect-square rounded-2xl cursor-pointer overflow-hidden transition-all hover:scale-105 shadow-sm ${selectedTemplate?.id === tmpl.id ? 'ring-4 ring-indigo-500 scale-105 drop-shadow-md z-10' : 'opacity-80 hover:opacity-100 hover:ring-2 hover:ring-indigo-300'}`}
                          >
                              {isVideo ? (
                                  <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                                      <video src={tmpl.url} className="w-full h-full object-cover opacity-60 pointer-events-none" muted playsInline />
                                      <span className="absolute text-xl z-10">🎬</span>
                                  </div>
                              ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img 
                                      src={tmpl.url} 
                                      alt="Template" 
                                      className="w-full h-full object-cover"
                                  />
                              )}
                              
                              {/* Botón Borrar */}
                              {onDeleteTemplate && (
                                  <button
                                      type="button"
                                      onClick={(e) => {
                                          e.stopPropagation(); // Evitar seleccionar el template al borrar
                                          if (confirm("¿Estás seguro de que deseas eliminar este archivo de tu galería?")) {
                                              onDeleteTemplate(tmpl);
                                          }
                                      }}
                                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-md hover:bg-rose-700 active:scale-95 transition-all opacity-0 group-hover:opacity-100 z-20"
                                      title="Eliminar de la galería"
                                  >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                  </button>
                              )}
                          </div>
                        );
                    })}
                    
                    {!loadingTemplates && (!manualTemplates || manualTemplates.length === 0) && (
                        <div className="col-span-1 sm:col-span-2 md:col-span-3 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <span className="text-2xl opacity-50 mb-2">📁</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Galería Vacía</span>
                        </div>
                    )}
                </div>
            </div>
          </div>
        )}
      </div>
      
      {/* RESTO DEL FORMULARIO */}
      {showScheduler && (
          <div id="tour-step-schedule" className="premium-card space-y-8 animate-in slide-in-from-top-4 fade-in">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Elige la fecha</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Elige la hora</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
              </div>
            </div>
          </div>
      )}

      {!hideSubmit && (
        !showScheduler ? (
           <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => handleSubmit(undefined, true)} disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black text-lg py-5 px-6 rounded-[28px] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] shadow-2xl shadow-slate-900/20">
                 {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>⚡</span> Publicar Ahora</>}
              </button>
              <button type="button" onClick={() => setShowScheduler && setShowScheduler(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg py-5 px-6 rounded-[28px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 hover:-translate-y-1">
                 📅 Aprobar y Agendar
              </button>
           </div>
        ) : (
           <div className="flex gap-4">
              <button type="button" onClick={() => setShowScheduler && setShowScheduler(false)} disabled={loading} className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-lg py-5 px-6 rounded-[28px] transition-all flex items-center justify-center shadow-sm">
                 Cancelar
              </button>
              <button onClick={(e) => handleSubmit(e, false)} disabled={loading} className="w-2/3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-lg py-5 px-8 rounded-[28px] transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-4 hover:-translate-y-1">
                 {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : '✅ Confirmar Agendamiento'}
              </button>
           </div>
        )
      )}
    </form>
  );
}
