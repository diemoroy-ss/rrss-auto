"use client";

import React, { useState, useRef, useEffect } from "react";
import { db, storage } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

interface CanvasEditorProps {
  baseImageUrl: string;
  suggestedCopy: string;
  initialLogoUrl: string;
  userId: string;
  onSave: (finalUrl: string) => void;
  forceOpenEditor?: boolean;
  onRetouch?: (instruction: string) => void;
  isRetouching?: boolean;
}

interface TextLayer {
  text: string;
  color: string;
  font: string;
  size: string;
  x: number;
  y: number;
  textAlign?: 'left' | 'center' | 'right';
  isBold?: boolean;
  isItalic?: boolean;
  shadowLevel?: 'none' | 'soft' | 'strong';
  backgroundColor?: string;
  isPill?: boolean;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: 'normal' | 'wide' | 'widest';
  textStroke?: boolean;
  opacity?: number;
}

export default function CanvasEditor({
  baseImageUrl,
  suggestedCopy,
  initialLogoUrl,
  userId,
  onSave,
  forceOpenEditor = false,
  onRetouch,
  isRetouching = false
}: CanvasEditorProps) {
  const [showEditor, setShowEditor] = useState(forceOpenEditor);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  
  const defaultTextLayers: TextLayer[] = [
    { text: "", color: "#ffffff", font: "Montserrat", size: "40", x: 50, y: 40, textAlign: 'center', isBold: true, isItalic: false, shadowLevel: 'strong', backgroundColor: 'transparent', isPill: false, textTransform: 'none', letterSpacing: 'normal', textStroke: false, opacity: 1 },
    { text: "", color: "#ffffff", font: "Montserrat", size: "30", x: 50, y: 50, textAlign: 'center', isBold: true, isItalic: false, shadowLevel: 'strong', backgroundColor: 'transparent', isPill: false, textTransform: 'none', letterSpacing: 'normal', textStroke: false, opacity: 1 },
    { text: "", color: "#ffffff", font: "Montserrat", size: "20", x: 50, y: 60, textAlign: 'center', isBold: true, isItalic: false, shadowLevel: 'strong', backgroundColor: 'transparent', isPill: false, textTransform: 'none', letterSpacing: 'normal', textStroke: false, opacity: 1 },
  ];
  
  const [textLayers, setTextLayers] = useState<TextLayer[]>(defaultTextLayers);
  const [imagePalette, setImagePalette] = useState<string[]>(['#ffffff', '#000000', '#f43f5e', '#3b82f6', '#10b981', '#facc15']);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);

  const handleGenerateBannerText = async () => {
    setIsGeneratingBanner(true);
    try {
      const res = await fetch("/api/ai/banner-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_text",
          idea: suggestedCopy || "Promoción comercial destacada",
          businessName: "",
          rubro: "General"
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bannerCopy) {
          const b = data.bannerCopy;
          setTextLayers([
            { text: b.badgeText, color: b.badgeTextColor, font: "Montserrat", size: "20", x: 50, y: 15, textAlign: 'center', isBold: true, isItalic: false, shadowLevel: 'soft', backgroundColor: b.badgeBgColor, isPill: true, textTransform: 'uppercase', letterSpacing: 'wide', textStroke: false, opacity: 1 },
            { text: b.mainHeadline, color: b.headlineColor, font: "Montserrat", size: "36", x: 50, y: 35, textAlign: 'center', isBold: true, isItalic: false, shadowLevel: 'strong', backgroundColor: 'transparent', isPill: false, textTransform: 'uppercase', letterSpacing: 'normal', textStroke: false, opacity: 1 },
            { text: b.benefitText, color: b.benefitTextColor, font: "Montserrat", size: "18", x: 50, y: 65, textAlign: 'center', isBold: true, isItalic: false, shadowLevel: 'soft', backgroundColor: b.benefitBgColor, isPill: true, textTransform: 'none', letterSpacing: 'normal', textStroke: false, opacity: 1 },
          ]);
        }
      }
    } catch (e) {
      console.warn("Error generando textos de banner con agente:", e);
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  // Extraer paleta de colores de la imagen
  useEffect(() => {
    if (baseImageUrl) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const colorCounts: Record<string, number> = {};
            const step = 4 * 400; // Sample for performance
            for (let i = 0; i < imageData.length; i += step) {
              const r = Math.round(imageData[i] / 20) * 20;
              const g = Math.round(imageData[i+1] / 20) * 20;
              const b = Math.round(imageData[i+2] / 20) * 20;
              if ((r<30 && g<30 && b<30) || (r>230 && g>230 && b>230)) continue;
              const rgb = `${r},${g},${b}`;
              colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
            }
            const sorted = Object.entries(colorCounts).sort((a,b) => b[1] - a[1]);
            const topColors = sorted.slice(0, 5).map(([rgb]) => {
              const [r, g, b] = rgb.split(',').map(Number);
              return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
            });
            if (topColors.length > 0) {
              setImagePalette(['#ffffff', '#000000', ...topColors]);
            }
          } catch (e) {
            console.warn("CORS issue extracting colors", e);
          }
        };
        img.src = baseImageUrl;
    }
  }, [baseImageUrl]);

  const [useLogo, setUseLogo] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState("");
  const [isOverlaying, setIsOverlaying] = useState(false);
  const [error, setError] = useState("");
  const [retouchInstruction, setRetouchInstruction] = useState("");

  const [isDragging, setIsDragging] = useState(false);

  const [userLogo, setUserLogo] = useState(initialLogoUrl);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoX, setLogoX] = useState(10);
  const [logoY, setLogoY] = useState(10);
  const [logoWidth, setLogoWidth] = useState(80); // Ancho en píxeles del logo/imagen
  const [dragTarget, setDragTarget] = useState<'text' | 'logo' | 'resize' | null>(null);
  const [draggingLayerIndex, setDraggingLayerIndex] = useState<number | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Sync initial logo if it changes from parent context
  useEffect(() => {
    setUserLogo(initialLogoUrl);
  }, [initialLogoUrl]);

  const handleMouseDown = (target: 'text' | 'logo' | 'resize', index?: number) => {
    if (!showEditor || isOverlaying) return;
    setDragTarget(target);
    if (target === 'text' && index !== undefined) {
        setDraggingLayerIndex(index);
        setActiveLayerIndex(index);
    }
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !previewContainerRef.current || !dragTarget) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    if (dragTarget === 'text' && draggingLayerIndex !== null) {
        setTextLayers(prev => {
            const next = [...prev];
            next[draggingLayerIndex] = { ...next[draggingLayerIndex], x: clampedX, y: clampedY };
            return next;
        });
    } else if (dragTarget === 'logo') {
        setLogoX(clampedX);
        setLogoY(clampedY);
    } else if (dragTarget === 'resize') {
        // Redimensionar el logo según el movimiento del mouse
        // Calculamos la distancia del cursor con respecto al centro del logo (logoX, logoY)
        const logoCenterX = (logoX / 100) * rect.width;
        const cursorRelativeX = e.clientX - rect.left;
        // El nuevo ancho será el doble de la distancia horizontal al centro
        const newWidth = Math.max(30, Math.min(300, Math.abs(cursorRelativeX - logoCenterX) * 2));
        setLogoWidth(Math.round(newWidth));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
    setDraggingLayerIndex(null);
  };

  const updateActiveLayer = (updates: Partial<TextLayer>) => {
    setTextLayers(prev => {
        const next = [...prev];
        next[activeLayerIndex] = { ...next[activeLayerIndex], ...updates };
        return next;
    });
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
     
     try {
       const activeLayers = textLayers.filter(l => l.text.trim() !== "");

       const designRef = await addDoc(collection(db, "preview_renders"), {
          baseImageUrl,
          userId,
          textLayers: activeLayers,
          useLogo,
          logoUrl: userLogo,
          logoX,
          logoY,
          logoWidth, // Guardamos el ancho personalizado
          createdAt: new Date()
       });

       const baseUrl = window.location.origin;
       const renderUrl = `${baseUrl}/render/preview?id=${designRef.id}`;
       const butterflyUrl = `https://butterfly.santisoft.cl/link-previews/v1?url=${encodeURIComponent(renderUrl)}`;

       setTimeout(() => {
          setFinalImageUrl(butterflyUrl);
          setIsOverlaying(false);
          onSave(butterflyUrl);
       }, 1500);

     } catch (err: any) {
         console.error(err);
         setError("Error al generar la previsualización.");
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
             <div className="flex gap-2">
                <button 
                  onClick={() => {
                    // Volver a editar conservando el estado anterior
                    setFinalImageUrl("");
                    setShowEditor(true);
                  }} 
                  className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                   Volver a Editar
                </button>
                <button 
                  onClick={() => {
                    // Limpiar y resetear el editor completo
                    setFinalImageUrl("");
                    setShowEditor(false);
                    setTextLayers(defaultTextLayers);
                    setUseLogo(false);
                  }} 
                  className="text-[10px] font-black uppercase bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-200 transition-colors"
                >
                   Resetear Todo
                </button>
             </div>
           ) : (
              <button onClick={() => setShowEditor(!showEditor)} className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors">
                 {showEditor ? 'Cerrar Edición' : 'Editar Imagen'}
              </button>
           )}
       </div>
       
       {error && <div className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</div>}

       {/* CTA: Invitar a abrir el editor para agregar logo u otros elementos */}
       {!showEditor && !finalImageUrl && (
         <button
           type="button"
           onClick={() => setShowEditor(true)}
           className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 group"
         >
           <span className="text-xl animate-bounce group-hover:animate-none">🖼️</span>
           <div className="flex-1 text-left">
             <p className="text-white text-xs font-black uppercase tracking-wider leading-none">¿Quieres agregar tu logo?</p>
             <p className="text-indigo-200 text-[10px] font-medium mt-0.5">Abre el editor para agregar imágenes, textos y más encima del diseño</p>
           </div>
           <span className="text-white/70 text-xs font-bold shrink-0 group-hover:translate-x-1 transition-transform">Abrir Editor →</span>
         </button>
       )}

       {/* Retoque de Imagen */}
       {!finalImageUrl && onRetouch && (
         <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
           <div className="flex items-center gap-2 mb-1">
             <span className="text-sm">🪄</span>
             <p className="text-slate-700 text-xs font-black uppercase tracking-wider">¿Retocar imagen con nuestros agentes?</p>
           </div>
           <p className="text-slate-500 text-[10px] font-medium leading-relaxed">
             Si la imagen tiene un detalle o texto no deseado, indícalo aquí para que nuestros agentes lo corrijan.
           </p>
           <div className="flex items-stretch gap-2 mt-1">
             <input
               type="text"
               value={retouchInstruction}
               onChange={(e) => setRetouchInstruction(e.target.value)}
               placeholder="Ej: Quítale el texto del fondo"
               className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && retouchInstruction.trim()) {
                   onRetouch(retouchInstruction.trim());
                   setRetouchInstruction("");
                 }
               }}
             />
              <button
                type="button"
                disabled={!retouchInstruction.trim() || isRetouching}
                onClick={() => {
                  onRetouch(retouchInstruction.trim());
                  setRetouchInstruction("");
                }}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRetouching ? <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" /> : 'Regenerar'}
              </button>
           </div>
         </div>
       )}

       <div 
          ref={previewContainerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`aspect-square rounded-[24px] overflow-hidden bg-slate-200 border-4 border-white shadow-xl relative group ${showEditor && !isOverlaying && !finalImageUrl ? 'cursor-crosshair' : ''}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {(finalImageUrl || baseImageUrl) ? (
            <img src={finalImageUrl || baseImageUrl} alt="Diseño Publicitario" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-100">
              <span className="text-4xl mb-2">📸</span>
              <span className="text-xs font-bold text-slate-600">Cargando previsualización del diseño...</span>
            </div>
          )}
          
       {/* Overlays before render */}
       {showEditor && !finalImageUrl && !isOverlaying && textLayers.map((layer, idx) => (
           layer.text && (
            <div 
               key={idx}
               onMouseDown={() => handleMouseDown('text', idx)}
               className={`absolute z-20 pointer-events-auto p-4 text-center select-none active:scale-95 transition-transform ${isDragging && draggingLayerIndex === idx ? 'cursor-grabbing' : 'cursor-grab font-black'} ${activeLayerIndex === idx ? 'ring-2 ring-indigo-500/50 rounded-xl' : ''}`}
               style={{ 
                   color: layer.color, 
                   fontFamily: layer.font, 
                   fontSize: `${layer.size}px`, 
                   fontWeight: layer.isBold ? 'bold' : 'normal', 
                   fontStyle: layer.isItalic ? 'italic' : 'normal',
                   textShadow: layer.shadowLevel === 'strong' ? '2px 2px 8px rgba(0,0,0,0.8)' : layer.shadowLevel === 'soft' ? '1px 1px 3px rgba(0,0,0,0.5)' : 'none',
                   backgroundColor: layer.backgroundColor && layer.backgroundColor !== 'transparent' ? layer.backgroundColor : 'transparent',
                   borderRadius: layer.isPill ? '9999px' : '4px',
                   padding: layer.backgroundColor && layer.backgroundColor !== 'transparent' ? '4px 12px' : '0',
                   textTransform: layer.textTransform || 'none',
                   letterSpacing: layer.letterSpacing === 'widest' ? '0.1em' : layer.letterSpacing === 'wide' ? '0.05em' : 'normal',
                   WebkitTextStroke: layer.textStroke ? `1px ${layer.color === '#ffffff' ? '#000000' : '#ffffff'}` : 'none',
                   opacity: layer.opacity ?? 1,
                   textAlign: layer.textAlign || 'center',
                   left: `${layer.x}%`,
                   top: `${layer.y}%`,
                   transform: `translate(-50%, -50%) ${isDragging && draggingLayerIndex === idx ? 'scale(1.1)' : ''}`,
                   position: 'absolute',
                   whiteSpace: 'nowrap'
               }}
            >
                {layer.text}
                {showEditor && activeLayerIndex === idx && !isDragging && (
                    <div className="absolute -inset-2 border-2 border-dashed border-white/50 rounded-lg animate-pulse pointer-events-none" />
                )}
            </div>
           )
       ))}

       {showEditor && useLogo && userLogo && !finalImageUrl && !isOverlaying && (
            <div 
              onMouseDown={() => handleMouseDown('logo')}
              className={`absolute z-20 pointer-events-auto p-2 select-none active:scale-95 transition-transform ${isDragging && dragTarget === 'logo' ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ 
                  left: `${logoX}%`,
                  top: `${logoY}%`,
                  transform: `translate(-50%, -50%) ${isDragging && dragTarget === 'logo' ? 'scale(1.05)' : ''}`,
                  position: 'absolute',
                  width: `${logoWidth}px`,
                  height: `${logoWidth}px`,
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
                <img src={userLogo} alt="Logo o Imagen Adicional" className="max-w-full max-h-full object-contain pointer-events-none select-none" />
                
                {/* Tirador de redimensionamiento (resize handle) en la esquina inferior derecha */}
                {showEditor && !isOverlaying && (
                  <div 
                    onMouseDown={(e) => {
                      e.stopPropagation(); // Evitar arrastrar el logo completo
                      handleMouseDown('resize');
                    }}
                    className="absolute bottom-[-6px] right-[-6px] w-4 h-4 bg-indigo-600 border border-white rounded-full cursor-se-resize shadow-md flex items-center justify-center hover:scale-125 hover:bg-indigo-700 transition-all z-30"
                  >
                    {/* Icono de redimensionamiento */}
                    <span className="text-[8px] text-white font-bold pointer-events-none">↗</span>
                  </div>
                )}

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
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
               <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">🦋 Personalizar Cartel & Capas</h5>
               <span className="text-[10px] font-bold text-slate-400">3 Capas de Texto + Logo</span>
            </div>

            {/* Botón de Generación de Textos de Anuncio con Agente */}
            <button
               type="button"
               onClick={handleGenerateBannerText}
               disabled={isGeneratingBanner}
               className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 group hover:-translate-y-0.5"
            >
               {isGeneratingBanner ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Diseñando Textos con Agente...</>
               ) : (
                  <><span>✨</span> Sugerir Titulares Comerciales (Agente de Banners)</>
               )}
            </button>
            
            <div className="flex gap-2 mb-2">
                {[0, 1, 2].map(i => (
                    <button 
                      key={i}
                      onClick={() => setActiveLayerIndex(i)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeLayerIndex === i ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                        Capa {i+1}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in duration-300" key={activeLayerIndex}>
               <label className="block text-[10px] font-bold text-slate-400 mb-1">Contenido Capa {activeLayerIndex + 1}</label>
               <input 
                  type="text" 
                  value={textLayers[activeLayerIndex].text} 
                  onChange={e => updateActiveLayer({ text: e.target.value })} 
                  disabled={isOverlaying} 
                  placeholder={`Texto para la capa ${activeLayerIndex + 1}...`} 
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50" 
                />
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4 mb-4">
                <div className="flex gap-4 items-start">
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Color de Letra</label>
                        <div className="flex flex-wrap gap-2 items-center">
                            {imagePalette.map(color => (
                                <button 
                                    key={`txt-${color}`} 
                                    type="button" 
                                    disabled={isOverlaying} 
                                    onClick={() => updateActiveLayer({ color })} 
                                    className={`w-6 h-6 rounded-full border-2 disabled:opacity-50 ${textLayers[activeLayerIndex].color === color ? 'border-indigo-500 scale-110' : 'border-slate-200'}`} 
                                    style={{ backgroundColor: color }} 
                                />
                            ))}
                            <input 
                              type="color" 
                              value={textLayers[activeLayerIndex].color}
                              onChange={e => updateActiveLayer({ color: e.target.value })}
                              className="w-6 h-6 p-0 border-0 rounded-full cursor-pointer overflow-hidden disabled:opacity-50"
                              title="Elige color libre"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Color de Fondo</label>
                        <div className="flex flex-wrap gap-2 items-center">
                            <button 
                                type="button" 
                                disabled={isOverlaying} 
                                onClick={() => updateActiveLayer({ backgroundColor: 'transparent' })} 
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] disabled:opacity-50 ${!textLayers[activeLayerIndex].backgroundColor || textLayers[activeLayerIndex].backgroundColor === 'transparent' ? 'border-indigo-500 bg-white' : 'border-slate-200 bg-white'}`}
                                title="Transparente (Sin fondo)"
                            >🚫</button>
                            {imagePalette.map(color => (
                                <button 
                                    key={`bg-${color}`} 
                                    type="button" 
                                    disabled={isOverlaying} 
                                    onClick={() => updateActiveLayer({ backgroundColor: color })} 
                                    className={`w-6 h-6 rounded-full border-2 disabled:opacity-50 ${textLayers[activeLayerIndex].backgroundColor === color ? 'border-indigo-500 scale-110' : 'border-slate-200'}`} 
                                    style={{ backgroundColor: color }} 
                                />
                            ))}
                            <input 
                              type="color" 
                              value={textLayers[activeLayerIndex].backgroundColor === 'transparent' ? '#ffffff' : (textLayers[activeLayerIndex].backgroundColor || '#ffffff')}
                              onChange={e => updateActiveLayer({ backgroundColor: e.target.value })}
                              className="w-6 h-6 p-0 border-0 rounded-full cursor-pointer overflow-hidden disabled:opacity-50"
                              title="Elige fondo libre"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Tamaño: {textLayers[activeLayerIndex].size}px</label>
                        <input 
                            type="range" 
                            min="15" max="120" 
                            value={textLayers[activeLayerIndex].size} 
                            onChange={e => updateActiveLayer({ size: e.target.value })} 
                            disabled={isOverlaying} 
                            className="w-full disabled:opacity-50" 
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Opacidad: {Math.round((textLayers[activeLayerIndex].opacity ?? 1)*100)}%</label>
                        <input 
                            type="range" 
                            min="0.1" max="1" step="0.1"
                            value={textLayers[activeLayerIndex].opacity ?? 1} 
                            onChange={e => updateActiveLayer({ opacity: parseFloat(e.target.value) })} 
                            disabled={isOverlaying} 
                            className="w-full disabled:opacity-50" 
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => updateActiveLayer({ isBold: !textLayers[activeLayerIndex].isBold })} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${textLayers[activeLayerIndex].isBold ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>B</button>
                    <button type="button" onClick={() => updateActiveLayer({ isItalic: !textLayers[activeLayerIndex].isItalic })} className={`px-3 py-1.5 rounded-lg text-xs italic font-serif border transition-colors ${textLayers[activeLayerIndex].isItalic ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>I</button>
                    
                    <select 
                      value={textLayers[activeLayerIndex].shadowLevel || 'strong'} 
                      onChange={e => updateActiveLayer({ shadowLevel: e.target.value as any })}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 text-slate-600 focus:outline-none focus:border-indigo-400 cursor-pointer"
                    >
                        <option value="none">Sin Sombra</option>
                        <option value="soft">Sombra Suave</option>
                        <option value="strong">Sombra Fuerte</option>
                    </select>
                    
                    <select 
                      value={textLayers[activeLayerIndex].textTransform || 'none'} 
                      onChange={e => updateActiveLayer({ textTransform: e.target.value as any })}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 text-slate-600 focus:outline-none focus:border-indigo-400 cursor-pointer"
                    >
                        <option value="none">Aa (Original)</option>
                        <option value="uppercase">AA (Mayúsculas)</option>
                        <option value="lowercase">aa (Minúsculas)</option>
                        <option value="capitalize">Aa Bb (Títulos)</option>
                    </select>

                    <select 
                      value={textLayers[activeLayerIndex].letterSpacing || 'normal'} 
                      onChange={e => updateActiveLayer({ letterSpacing: e.target.value as any })}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 text-slate-600 focus:outline-none focus:border-indigo-400 cursor-pointer"
                    >
                        <option value="normal">↔ Espaciado Normal</option>
                        <option value="wide">↔ Ancho</option>
                        <option value="widest">↔ Extra Ancho</option>
                    </select>

                    <button type="button" onClick={() => updateActiveLayer({ textStroke: !textLayers[activeLayerIndex].textStroke })} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${textLayers[activeLayerIndex].textStroke ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`} title="Borde exterior sólido">Contorno</button>
                    
                    <button type="button" onClick={() => updateActiveLayer({ isPill: !textLayers[activeLayerIndex].isPill })} disabled={!textLayers[activeLayerIndex].backgroundColor || textLayers[activeLayerIndex].backgroundColor === 'transparent'} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${textLayers[activeLayerIndex].isPill ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'} disabled:opacity-50`} title="Fondo redondeado">Fondo Ovalado</button>
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Tipografía</label>
                <select 
                    value={textLayers[activeLayerIndex].font} 
                    onChange={e => updateActiveLayer({ font: e.target.value })} 
                    disabled={isOverlaying} 
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                >
                    {fonts.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex gap-2 items-center">
                   <input type="checkbox" id="logoToggle" checked={useLogo} onChange={e => setUseLogo(e.target.checked)} disabled={isOverlaying} className="w-4 h-4 rounded text-indigo-600 disabled:opacity-50" />
                   <label htmlFor="logoToggle" className={`text-xs font-bold cursor-pointer ${isOverlaying ? 'text-slate-400' : 'text-slate-600'}`}>Incluir logo o imagen adicional</label>
                </div>
                
                {useLogo && (
                   <div className="pl-6 space-y-2 animate-in fade-in slide-in-from-top-1">
                      {userLogo ? (
                         <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden">
                               {/* eslint-disable-next-line @next/next/no-img-element */}
                               <img src={userLogo} alt="Logo o Imagen" className="max-w-full max-h-full object-contain" />
                            </div>
                            <button type="button" onClick={() => logoInputRef.current?.click()} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Cambiar imagen</button>
                         </div>
                      ) : (
                         <button type="button" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase hover:border-indigo-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-2">
                            {isUploadingLogo ? <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : '➕ Adjuntar Imagen / Logo'}
                         </button>
                      )}
                      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                   </div>
                )}
            </div>

            <button 
                type="button" 
                onClick={handleApplyOverlay} 
                disabled={isOverlaying || (textLayers.every(l => !l.text) && !useLogo)} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition-colors mt-4 flex items-center justify-center gap-2"
            >
                {isOverlaying ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Aplicar Cambios 🦋'}
            </button>
        </div>
    )}

    </div>
  );
}
