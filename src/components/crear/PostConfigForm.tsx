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
  manualCaption, setManualCaption
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
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner border border-slate-200">
             <button 
               type="button"
               onClick={() => setCreationMode('ai')} 
               className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all \${creationMode === 'ai' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <span>🤖</span> Generar con IA
             </button>
             <button 
               type="button"
               onClick={() => setCreationMode('manual')} 
               className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all \${creationMode === 'manual' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <span>📤</span> Subida Manual
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
                 const disabled = type === 'Reel' && !allowVideo;
                 return (
                 <button 
                   key={type}
                   type="button"
                   role="radio"
                   disabled={disabled}
                   title={disabled ? "Requiere un plan pago para generar videos" : ""}
                   aria-checked={postType === type}
                   onClick={() => setPostType(type)}
                   className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                     disabled ? 'opacity-50 cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400' :
                     postType === type 
                     ? type === 'Reel' ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' : 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                     : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                   }`}
                 >
                    <span className="text-2xl">{type === 'Post' ? '🖼️' : type === 'Historia' ? '📱' : type === 'Carrusel' ? '📑' : '🎬'}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{type} {disabled && '🔒'}</span>
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Sube tus Archivos</label>
            <div className="border-2 border-dashed border-indigo-200 rounded-[28px] bg-indigo-50/30 p-8 flex flex-col items-center justify-center text-center hover:bg-indigo-50/50 hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden group">
              <input 
                type="file" 
                multiple={postType === 'Carrusel'} 
                accept={postType === 'Reel' ? 'video/mp4,video/quicktime' : 'image/jpeg,image/png,image/webp'} 
                onChange={(e) => {
                  if (e.target.files) {
                     const selected = Array.from(e.target.files);
                     const max = postType === 'Carrusel' ? 5 : 1;
                     if (selected.length > max) {
                         alert(`Para formato \${postType} solo puedes subir un máximo de \${max} archivo(s).`);
                         return;
                     }
                     const maxImageMb = 10;
                     const maxVideoMb = 50;
                     let errorMsg = null;
                     
                     for (let f of selected) {
                        const isVid = f.type.includes('video');
                        const sizeMb = f.size / (1024 * 1024);
                        if (isVid && sizeMb > maxVideoMb) errorMsg = `Video demasiado grande (\${sizeMb.toFixed(1)}MB). Máx \${maxVideoMb}MB.`;
                        if (!isVid && sizeMb > maxImageMb) errorMsg = `Imagen demasiado grande (\${sizeMb.toFixed(1)}MB). Máx \${maxImageMb}MB.`;
                     }

                     if (errorMsg) {
                        alert(errorMsg);
                        return;
                     }
                     setManualFiles(selected);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                 {postType === 'Reel' ? '🎬' : '📸'}
              </span>
              <h4 className="text-indigo-900 font-black tracking-tight mb-2">Haz click o arrastra archivos aquí</h4>
              <p className="text-indigo-600/70 text-sm font-medium">
                 {postType === 'Reel' ? 'Sube tu video (MP4, max 50MB)' : postType === 'Carrusel' ? 'Sube hasta 5 imágenes (Max 10MB c/u)' : 'Sube tu imagen (JPG/PNG/WEBP, max 10MB)'}
              </p>
            </div>
            
            {manualFiles.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4">
                 {manualFiles.map((file, i) => (
                    <div key={i} className="relative group bg-slate-100 rounded-xl w-24 h-24 flex-shrink-0 border-2 border-slate-200 overflow-hidden">
                       {file.type.includes('video') ? (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500 bg-slate-200">🎥 Video</div>
                       ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                       )}
                       <button 
                         type="button" 
                         onClick={() => setManualFiles(prev => prev.filter((_, idx) => idx !== i))}
                         className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                       >
                         &times;
                       </button>
                    </div>
                 ))}
              </div>
            )}

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
