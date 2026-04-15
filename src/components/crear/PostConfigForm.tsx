"use client";

import React from "react";
import Link from "next/link";

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
  networks: { facebook: boolean; instagram: boolean; linkedin: boolean };
  setNetworks: React.Dispatch<React.SetStateAction<{ facebook: boolean; instagram: boolean; linkedin: boolean }>>;
  hasFb: boolean;
  hasIg: boolean;
  hasLi: boolean;
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
}

export default function PostConfigForm({
  idea, setIdea,
  postType, setPostType,
  carouselCount, setCarouselCount,
  businessType, setBusinessType,
  date, setDate,
  time, setTime,
  networks, setNetworks,
  hasFb, hasIg, hasLi,
  needsConnection,
  handleImproveWithAI,
  handleGeneratePreview,
  handleSubmit,
  improveLoading, previewLoading, loading, error, allowVideo = true,
  creationMode, setCreationMode,
  manualFiles, setManualFiles,
  manualCaption, setManualCaption,
  isAdmin, manualTemplates = [], selectedTemplate, setSelectedTemplate, loadingTemplates, onUploadNewTemplate
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
        
        {/* MODO DE CREACIÓN: IA VS MANUAL (REFINADA) */}
        <div className="relative flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner border border-slate-200">
             {/* Animated Pill Background */}
             <div 
               className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200/50 transition-all duration-300 ease-out"
               style={{ left: creationMode === 'ai' ? '6px' : 'calc(50% + 0px)' }}
             />
             <button 
               type="button"
               onClick={() => setCreationMode('ai')} 
               className={`relative flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors z-10 \${creationMode === 'ai' ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
             >
               <span className="\${creationMode === 'ai' ? 'scale-110 drop-shadow-sm' : 'grayscale opacity-60'} transition-all">🤖</span> Generar con IA
             </button>
             <button 
               type="button"
               onClick={() => setCreationMode('manual')} 
               className={`relative flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors z-10 \${creationMode === 'manual' ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
             >
               <span className="\${creationMode === 'manual' ? 'scale-110 drop-shadow-sm' : 'grayscale opacity-60'} transition-all">📤</span> Subida Manual
             </button>
        </div>

        {/* RUBRO / NEGOCIO */}
        <div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tu Rubro o Tipo de Negocio</label>
           <input 
             type="text" 
             value={businessType} 
             onChange={e => setBusinessType(e.target.value)}
             placeholder="Ej: Gastrobar, Tienda de Mascotas, Coaching Online..."
             className="w-full bg-slate-50 border-2 border-slate-100 px-6 py-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700 hover:border-slate-200"
           />
        </div>

         {/* POST TYPE SELECTOR */}
        <div id="tour-step-type">
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tipo de Publicación</label>
           <div className="grid grid-cols-4 gap-3" role="radiogroup" aria-label="Tipo de Publicación">
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

        {/* ANIMATED CAROUSEL COUNT INPUT */}
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

        {/* INPUT IDEA / MEDIA UPLOAD */}
        {creationMode === 'ai' ? (
          <div id="tour-step-idea">
            <div className="flex flex-wrap justify-between items-end gap-4 mb-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tu Idea Base</label>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={handleImproveWithAI}
                  disabled={improveLoading || !idea}
                  className="bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-indigo-200 shadow-sm"
                >
                  {improveLoading ? 'Refinando...' : '✨ Mejorar con IA'}
                </button>
                <button 
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={previewLoading || !idea}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                >
                  {previewLoading ? 'Generando...' : '🖼️ Ver Previsualización'}
                </button>
              </div>
            </div>
            <div className="relative border-2 border-slate-100 rounded-[28px] bg-slate-50/50 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50 transition-all overflow-hidden flex items-start">
                <span className="pl-6 pt-6 text-xl">💡</span>
                <textarea
                  value={idea}
                  onChange={e => setIdea(e.target.value)}
                  placeholder="Describe lo que quieres publicar..."
                  className="w-full bg-transparent px-4 py-6 text-base text-slate-800 outline-none placeholder:text-slate-400 min-h-[160px] resize-none font-medium leading-relaxed"
                  maxLength={1000}
                />
            </div>
            <p className="text-[10px] font-black text-slate-300 mt-3 text-right uppercase tracking-widest">{idea.length} / 1000 Caracteres</p>
          </div>
        ) : (
          <div className="animate-in slide-in-from-top-4 fade-in">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tu Galería</label>
            
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h5 className="font-bold text-slate-700 text-sm">Selecciona o sube una imagen</h5>
                    {loadingTemplates && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                    {/* Botón de subir nuevo */}
                    <label className="relative flex flex-col items-center justify-center bg-indigo-50/50 border-2 border-dashed border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 rounded-2xl cursor-pointer group hover:scale-105 transition-all text-indigo-500 aspect-square">
                        <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/webp" 
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0] && onUploadNewTemplate) {
                                    const f = e.target.files[0];
                                    if (f.size / (1024*1024) > 10) {
                                        alert("Imagen demasiado grande. Máx 10MB");
                                        return;
                                    }
                                    onUploadNewTemplate(f);
                                }
                            }}
                            className="hidden" 
                        />
                        <span className="text-3xl mb-1 group-hover:-translate-y-1 transition-transform">➕</span>
                        <span className="text-[10px] font-black uppercase">Nueva Foto</span>
                    </label>

                    {/* Lista de templates del usuario */}
                    {manualTemplates?.map((tmpl) => (
                         // eslint-disable-next-line @next/next/no-img-element
                        <img 
                            key={tmpl.id}
                            src={tmpl.url} 
                            alt="Template" 
                            onClick={() => setSelectedTemplate?.(tmpl)}
                            className={`w-full aspect-square object-cover rounded-2xl cursor-pointer transition-all hover:scale-105 shadow-sm \${selectedTemplate?.id === tmpl.id ? 'ring-4 ring-indigo-500 scale-105 drop-shadow-md' : 'opacity-80 hover:opacity-100 hover:ring-2 hover:ring-indigo-300'}`}
                        />
                    ))}
                    
                    {!loadingTemplates && (!manualTemplates || manualTemplates.length === 0) && (
                        <div className="col-span-1 sm:col-span-2 md:col-span-3 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <span className="text-2xl opacity-50 mb-2">📁</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">No hay imágenes en tu galería</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Texto de la publicación (Caption)</label>
              <div className="relative border-2 border-slate-100 rounded-[28px] bg-slate-50/50 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50 transition-all overflow-hidden flex items-start">
                  <span className="pl-6 pt-6 text-xl">✍️</span>
                  <textarea
                    value={manualCaption}
                    onChange={e => setManualCaption(e.target.value)}
                    placeholder="Escribe el texto que acompañará tu post..."
                    className="w-full bg-transparent px-4 py-6 text-base text-slate-800 outline-none placeholder:text-slate-400 min-h-[160px] resize-none font-medium leading-relaxed"
                  />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* RESTO DEL FORMULARIO */}
      <div id="tour-step-schedule" className="premium-card space-y-8">
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

        <div id="tour-step-networks">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Redes de destino</label>
          <div className="grid grid-cols-3 gap-4">
            <button type="button" onClick={() => setNetworks(prev => ({...prev, facebook: !prev.facebook}))} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 font-bold text-xs ${networks.facebook ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
              <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 text-lg">🔵</span>
              Facebook
            </button>
            <button type="button" onClick={() => setNetworks(prev => ({...prev, instagram: !prev.instagram}))} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 font-bold text-xs ${networks.instagram ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
              <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-pink-600 text-lg">🟣</span>
              Instagram
            </button>
            <button type="button" onClick={() => setNetworks(prev => ({...prev, linkedin: !prev.linkedin}))} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 font-bold text-xs ${networks.linkedin ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}>
              <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-sky-600 text-lg">💼</span>
              LinkedIn
            </button>
          </div>
          {!hasFb && !hasIg && !hasLi && (
              <p className="text-[10px] font-bold text-slate-400 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">⚠️ Nota: Las opciones de redes están limitadas porque no hay cuentas vinculadas.</p>
          )}
        </div>
      </div>

      <button disabled={loading} type="submit" className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black text-lg py-5 px-8 rounded-[28px] transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4 hover:scale-[1.02]">
        {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <><span>{needsConnection ? '💾' : '🤖'}</span> {needsConnection ? 'Guardar Idea' : 'Automatizar y Publicar'}</>}
      </button>
    </form>
  );
}
