"use client";

import React, { useState, useRef, useEffect } from "react";
import { storage } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface CanvasEditorProps {
  baseImageUrl: string;
  suggestedCopy: string;
  initialLogoUrl: string;
  userId: string;
  onSave: (finalUrl: string) => void;
}

export default function CanvasEditor({
  baseImageUrl,
  suggestedCopy,
  initialLogoUrl,
  userId,
  onSave
}: CanvasEditorProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [overlayColor, setOverlayColor] = useState("#ffffff");
  const [overlayFont, setOverlayFont] = useState("Montserrat");
  const [overlaySize, setOverlaySize] = useState("40");
  const [useLogo, setUseLogo] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState("");
  const [isOverlaying, setIsOverlaying] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [error, setError] = useState("");

  const [overlayX, setOverlayX] = useState(50);
  const [overlayY, setOverlayY] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const [userLogo, setUserLogo] = useState(initialLogoUrl);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoX, setLogoX] = useState(10);
  const [logoY, setLogoY] = useState(10);
  const [dragTarget, setDragTarget] = useState<'text' | 'logo' | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Sync initial logo if it changes from parent context
  useEffect(() => {
    setUserLogo(initialLogoUrl);
  }, [initialLogoUrl]);

  const handleMouseDown = (target: 'text' | 'logo') => {
    if (!showEditor || isOverlaying) return;
    setDragTarget(target);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !previewContainerRef.current || !dragTarget) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    if (dragTarget === 'text') {
        setOverlayX(clampedX);
        setOverlayY(clampedY);
    } else {
        setLogoX(clampedX);
        setLogoY(clampedY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !userId) return;

      setIsUploadingLogo(true);
      setError("");

      try {
          const storageRef = ref(storage, `logos/${userId}/corporate_logo_${Date.now()}`);
          const snapshot = await uploadBytes(storageRef, file);
          const dlUrl = await getDownloadURL(snapshot.ref);
          setUserLogo(dlUrl);
      } catch (err) {
          console.error("Logo upload error:", err);
          setError("No pudimos subir el logo. Intenta con una imagen más pequeña.");
      } finally {
          setIsUploadingLogo(false);
      }
  };

  const fonts = ["Montserrat", "Roboto", "Playfair Display", "Bebas Neue", "Outfit"];

  const handleApplyOverlay = async () => {
     if (!baseImageUrl) return;

     setIsOverlaying(true);
     setError("");
     
     const tId = `btf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
     setTicketId(tId);

     try {
       const startRes = await fetch("/api/ai-banner/start", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           ticketId: tId,
           textX: Math.round(overlayX),
           textY: Math.round(overlayY),
           baseImageUrl: baseImageUrl,
           overlayText,
           overlayColor,
           overlayFont,
           overlaySize: parseInt(overlaySize),
           useLogo,
           logoUrl: userLogo,
           logoX: Math.round(logoX),
           logoY: Math.round(logoY),
           userId: userId
         })
       });

       if (!startRes.ok) throw new Error("Error al iniciar Butterfly IA.");

       const checkStatus = async () => {
         try {
           const res = await fetch(`/api/ai-banner/status?ticketId=${tId}`);
           const data = await res.json();

           if (data.status === "done" && data.finalUrl) {
             setFinalImageUrl(data.finalUrl);
             setIsOverlaying(false);
             onSave(data.finalUrl); // Sync up to parent
           } else if (data.status === "error") {
             setError(data.error || "Error al aplicar estilos.");
             setIsOverlaying(false);
           } else {
             setTimeout(checkStatus, 2500);
           }
         } catch (e) {
             console.error("Polling error:", e);
             setError("Perdimos conexión con el generador. Mostrando versión base.");
             setIsOverlaying(false);
         }
       };

       setTimeout(checkStatus, 2000);

     } catch (err: any) {
         console.error(err);
         setError(err.message || "Error inesperado al aplicar estilos.");
         setIsOverlaying(false);
     }
  };

  return (
    <div className="p-8 bg-slate-50 rounded-[32px] border-2 border-slate-100 animate-in zoom-in duration-500 space-y-6 shadow-xl shadow-slate-200/50">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <span className="text-xl">✨</span>
             <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Diseño de Imagen</h4>
          </div>
          {finalImageUrl ? (
             <button onClick={() => setFinalImageUrl("")} className="text-[10px] font-black uppercase bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors">
                Deshacer / Reset
             </button>
          ) : (
             <button onClick={() => setShowEditor(!showEditor)} className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors">
                {showEditor ? 'Cerrar Edición' : 'Editar Imagen'}
             </button>
          )}
       </div>
       
       {error && <div className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</div>}

       <div 
          ref={previewContainerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`aspect-square rounded-[24px] overflow-hidden bg-slate-200 border-4 border-white shadow-xl relative group ${showEditor && !isOverlaying && !finalImageUrl ? 'cursor-crosshair' : ''}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={finalImageUrl || baseImageUrl} alt="AI Output" className="w-full h-full object-cover" />
          
       {/* Overlays before render */}
       {showEditor && overlayText && !finalImageUrl && !isOverlaying && (
           <div 
              onMouseDown={() => handleMouseDown('text')}
              className={`absolute z-20 pointer-events-auto p-4 text-center select-none active:scale-95 transition-transform ${isDragging && dragTarget === 'text' ? 'cursor-grabbing' : 'cursor-grab font-black'}`}
              style={{ 
                  color: overlayColor, 
                  fontFamily: overlayFont, 
                  fontSize: `${overlaySize}px`, 
                  fontWeight: 'bold', 
                  textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                  left: `${overlayX}%`,
                  top: `${overlayY}%`,
                  transform: `translate(-50%, -50%) ${isDragging && dragTarget === 'text' ? 'scale(1.1)' : ''}`,
                  position: 'absolute',
                  whiteSpace: 'nowrap'
              }}
           >
               {overlayText}
               {showEditor && !isDragging && (
                   <div className="absolute -inset-2 border-2 border-dashed border-white/50 rounded-lg animate-pulse pointer-events-none" />
               )}
           </div>
       )}
       {showEditor && useLogo && userLogo && !finalImageUrl && !isOverlaying && (
            <div 
              onMouseDown={() => handleMouseDown('logo')}
              className={`absolute z-20 pointer-events-auto p-2 select-none active:scale-95 transition-transform ${isDragging && dragTarget === 'logo' ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ 
                  left: `${logoX}%`,
                  top: `${logoY}%`,
                  transform: `translate(-50%, -50%) ${isDragging && dragTarget === 'logo' ? 'scale(1.1)' : ''}`,
                  position: 'absolute',
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
              }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={userLogo} alt="Corporate Logo" className="max-w-full max-h-full object-contain" />
                {showEditor && !isDragging && (
                   <div className="absolute -inset-1 border-2 border-dashed border-indigo-400/50 rounded-lg animate-pulse pointer-events-none" />
                )}
            </div>
        )}
        {isOverlaying && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in">
              <div className="text-4xl animate-bounce mb-4">🦋</div>
              <h4 className="text-white font-black tracking-widest uppercase text-sm mb-2">Procesando Diseño</h4>
              <p className="text-slate-300 text-xs font-medium max-w-[200px]">Aplicando capas de texto y logo con IA...</p>
              <div className="mt-4 flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              </div>
          </div>
       )}
    </div>

    {/* Butterfly Editor Controls */}
    {showEditor && !finalImageUrl && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm animate-in slide-in-from-top-4">
            <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">🦋 Butterfly IA (Toque Final)</h5>
            
            <div>
               <label className="block text-[10px] font-bold text-slate-400 mb-1">Texto Principal</label>
               <input type="text" value={overlayText} onChange={e => setOverlayText(e.target.value)} disabled={isOverlaying} placeholder="Ej: 50% OFF" className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Color</label>
                    <div className="flex gap-2">
                        {['#ffffff', '#000000', '#f43f5e', '#3b82f6', '#10b981'].map(color => (
                            <button key={color} type="button" disabled={isOverlaying} onClick={() => setOverlayColor(color)} className={`w-6 h-6 rounded-full border-2 disabled:opacity-50 ${overlayColor === color ? 'border-indigo-500 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Tamaño: {overlaySize}px</label>
                    <input type="range" min="20" max="100" value={overlaySize} onChange={e => setOverlaySize(e.target.value)} disabled={isOverlaying} className="w-full disabled:opacity-50" />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Tipografía</label>
                <select value={overlayFont} onChange={e => setOverlayFont(e.target.value)} disabled={isOverlaying} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                    {fonts.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex gap-2 items-center">
                   <input type="checkbox" id="logoToggle" checked={useLogo} onChange={e => setUseLogo(e.target.checked)} disabled={isOverlaying} className="w-4 h-4 rounded text-indigo-600 disabled:opacity-50" />
                   <label htmlFor="logoToggle" className={`text-xs font-bold cursor-pointer ${isOverlaying ? 'text-slate-400' : 'text-slate-600'}`}>Incluir logo corporativo</label>
                </div>
                
                {useLogo && (
                   <div className="pl-6 space-y-2 animate-in fade-in slide-in-from-top-1">
                      {userLogo ? (
                         <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden">
                               {/* eslint-disable-next-line @next/next/no-img-element */}
                               <img src={userLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                            </div>
                            <button type="button" onClick={() => logoInputRef.current?.click()} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Cambiar</button>
                         </div>
                      ) : (
                         <button type="button" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase hover:border-indigo-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-2">
                            {isUploadingLogo ? <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : '➕ Subir Logo'}
                         </button>
                      )}
                      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                   </div>
                )}
            </div>

            <button type="button" onClick={handleApplyOverlay} disabled={isOverlaying || (!overlayText && !useLogo)} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition-colors mt-4 flex items-center justify-center gap-2">
                {isOverlaying ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Aplicar Capas 🦋'}
            </button>
        </div>
    )}

       <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Copy Sugerido para Redes</label>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-slate-600 text-sm font-medium leading-relaxed italic shadow-inner">
             "{suggestedCopy}"
          </div>
       </div>
    </div>
  );
}
