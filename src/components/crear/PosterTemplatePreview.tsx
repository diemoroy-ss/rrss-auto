"use client";

import React, { useState, useEffect, useRef } from "react";
import type { PosterLayout, VisualStyle, PosterElementTransforms, TextElementTransform } from "../../types/poster";

type ElementKey = "brand" | "title" | "slogan" | "price" | "cta" | "contact";

const ELEMENT_LABELS: Record<ElementKey, { name: string; emoji: string }> = {
  brand: { name: "Nombre / Marca", emoji: "🏢" },
  title: { name: "Titular Principal", emoji: "📝" },
  slogan: { name: "Slogan / Frase", emoji: "💬" },
  price: { name: "Precio / Oferta", emoji: "💲" },
  cta: { name: "Botón de Acción", emoji: "📣" },
  contact: { name: "Datos de Contacto", emoji: "📱" },
};

const DEFAULT_POSITIONS: Record<
  string,
  Record<ElementKey, { x: number; y: number; fontSize: number; rotation: number }>
> = {
  auto: {
    brand:   { x: 30, y: 11, fontSize: 8.5, rotation: 0 },
    price:   { x: 75, y: 11, fontSize: 9.5, rotation: 0 },
    title:   { x: 50, y: 38, fontSize: 13.5, rotation: 0 },
    slogan:  { x: 50, y: 52, fontSize: 9.5, rotation: 0 },
    contact: { x: 50, y: 81, fontSize: 8, rotation: 0 },
    cta:     { x: 50, y: 89, fontSize: 9.5, rotation: 0 },
  },
  split_left: {
    brand:   { x: 30, y: 12, fontSize: 8.5, rotation: 0 },
    title:   { x: 30, y: 30, fontSize: 12.5, rotation: 0 },
    slogan:  { x: 30, y: 46, fontSize: 9, rotation: 0 },
    price:   { x: 25, y: 64, fontSize: 10, rotation: 0 },
    contact: { x: 30, y: 76, fontSize: 8, rotation: 0 },
    cta:     { x: 30, y: 88, fontSize: 9, rotation: 0 },
  },
  top_banner: {
    brand:   { x: 25, y: 9, fontSize: 8, rotation: 0 },
    price:   { x: 78, y: 9, fontSize: 9, rotation: 0 },
    title:   { x: 50, y: 20, fontSize: 12.5, rotation: 0 },
    slogan:  { x: 50, y: 31, fontSize: 8.5, rotation: 0 },
    contact: { x: 50, y: 83, fontSize: 8, rotation: 0 },
    cta:     { x: 50, y: 91, fontSize: 9, rotation: 0 },
  },
  recipe_ingredients: {
    brand:   { x: 50, y: 8, fontSize: 8, rotation: 0 },
    title:   { x: 50, y: 17, fontSize: 12, rotation: 0 },
    slogan:  { x: 50, y: 27, fontSize: 8.5, rotation: 0 },
    price:   { x: 25, y: 88, fontSize: 9.5, rotation: 0 },
    contact: { x: 50, y: 79, fontSize: 7.5, rotation: 0 },
    cta:     { x: 75, y: 88, fontSize: 9, rotation: 0 },
  },
  split_right: {
    brand:   { x: 70, y: 12, fontSize: 8.5, rotation: 0 },
    title:   { x: 70, y: 30, fontSize: 12.5, rotation: 0 },
    slogan:  { x: 70, y: 46, fontSize: 9, rotation: 0 },
    price:   { x: 75, y: 64, fontSize: 10, rotation: 0 },
    contact: { x: 70, y: 76, fontSize: 8, rotation: 0 },
    cta:     { x: 70, y: 88, fontSize: 9, rotation: 0 },
  },
};

interface PosterTemplatePreviewProps {
  layout: PosterLayout;
  visualStyle: VisualStyle;
  primaryColor?: string;
  mainText?: string;
  sloganText?: string;
  priceText?: string;
  includePrice?: boolean;
  ctaText?: string;
  includeCta?: boolean;
  businessName?: string;
  includeBusinessName?: boolean;
  includeLogo?: boolean;
  includeSlogan?: boolean;
  includeMainText?: boolean;
  includeContact?: boolean;
  contactType?: string;
  contactValue?: string;
  aspectRatio?: "1:1" | "4:5" | "9:16";
  postType?: string;
  generatedImageUrl?: string;
  isGenerating?: boolean;
  slideNumber?: number;
  totalSlides?: number;
  onRegenerate?: () => void;
  onOpenEditor?: () => void;
  elementTransforms?: PosterElementTransforms;
  onChangeTransforms?: (transforms: PosterElementTransforms) => void;
}

export default function PosterTemplatePreview({
  layout,
  visualStyle,
  primaryColor = "#f59e0b",
  mainText,
  sloganText,
  priceText,
  includePrice = false,
  ctaText = "¡Compra Ahora!",
  includeCta = true,
  businessName = "Tu Marca",
  includeBusinessName = true,
  includeLogo = true,
  includeSlogan = true,
  includeMainText = true,
  includeContact = false,
  contactType = "whatsapp",
  contactValue = "",
  aspectRatio = "1:1",
  postType,
  generatedImageUrl,
  isGenerating = false,
  slideNumber,
  totalSlides,
  onRegenerate,
  onOpenEditor,
  elementTransforms,
  onChangeTransforms,
}: PosterTemplatePreviewProps) {
  const hasImage = Boolean(generatedImageUrl && generatedImageUrl.trim().length > 0);
  const isStoryOrReel = postType === "Historia" || postType === "Reel" || aspectRatio === "9:16";

  const [viewMode, setViewMode] = useState<"afiche" | "image" | "blueprint">("afiche");
  const [showSafeZone, setShowSafeZone] = useState<boolean>(false);
  const [selectedKey, setSelectedKey] = useState<ElementKey | null>(null);
  const [draggingKey, setDraggingKey] = useState<ElementKey | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasImage) {
      setViewMode("afiche");
    }
  }, [hasImage, generatedImageUrl, slideNumber]);

  const activeViewMode = hasImage ? viewMode : "blueprint";

  const hasTitle = (includeMainText !== false) && Boolean(mainText && mainText.trim().length > 0);
  const displayTitle = hasTitle ? mainText!.trim() : null;

  const hasSlogan = Boolean(includeSlogan) && Boolean(sloganText && sloganText.trim().length > 0);
  const displaySlogan = hasSlogan ? sloganText!.trim() : null;

  const hasPrice = Boolean(includePrice) && Boolean(priceText && priceText.trim().length > 0);
  const displayPrice = hasPrice ? priceText!.trim() : null;

  const hasCta = (includeCta !== false) && Boolean(ctaText && ctaText.trim().length > 0);
  const displayCta = hasCta ? ctaText!.trim() : null;

  const hasBrand = Boolean(includeBusinessName) && Boolean(businessName && businessName.trim().length > 0);
  const displayBrand = hasBrand ? businessName!.trim() : null;

  const hasContact = Boolean(includeContact) && Boolean(contactValue && contactValue.trim().length > 0);
  const displayContact = hasContact
    ? `${contactType === "whatsapp" ? "WhatsApp" : contactType === "email" ? "Email" : "Tel"}: ${contactValue!.trim()}`
    : null;

  // Obtener transformación (personalizada o por defecto del layout)
  const getTransform = (key: ElementKey) => {
    const custom = elementTransforms?.[key];
    const layoutDefaults = DEFAULT_POSITIONS[layout] || DEFAULT_POSITIONS.auto;
    const def = layoutDefaults[key] || DEFAULT_POSITIONS.auto[key];

    return {
      x: custom?.x ?? def.x,
      y: custom?.y ?? def.y,
      fontSize: custom?.fontSize ?? def.fontSize,
      rotation: custom?.rotation ?? def.rotation,
    };
  };

  const updateTransform = (key: ElementKey, partial: Partial<TextElementTransform>) => {
    const current = getTransform(key);
    const updated = {
      ...(elementTransforms || {}),
      [key]: {
        ...current,
        ...partial,
      },
    };
    onChangeTransforms?.(updated);
  };

  const resetTransform = (key: ElementKey) => {
    if (!elementTransforms) return;
    const next = { ...elementTransforms };
    delete next[key];
    onChangeTransforms?.(next);
  };

  const resetAllTransforms = () => {
    onChangeTransforms?.({});
    setSelectedKey(null);
  };

  // Drag & Drop con Mouse / Touch
  useEffect(() => {
    if (!draggingKey) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;

      const x = Math.max(6, Math.min(94, Math.round(rawX)));
      const y = Math.max(6, Math.min(94, Math.round(rawY)));

      updateTransform(draggingKey, { x, y });
    };

    const handlePointerUp = () => {
      setDraggingKey(null);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [draggingKey, elementTransforms]);

  // Renderizar un elemento interactivo posicionable
  const renderInteractiveElement = (
    key: ElementKey,
    content: React.ReactNode,
    className: string = "",
    styleOverride: React.CSSProperties = {}
  ) => {
    const t = getTransform(key);
    const isSelected = selectedKey === key;
    const isDragging = draggingKey === key;

    return (
      <div
        key={key}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelectedKey(key);
          setDraggingKey(key);
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedKey(key);
        }}
        style={{
          position: "absolute",
          left: `${t.x}%`,
          top: `${t.y}%`,
          transform: `translate(-50%, -50%) rotate(${t.rotation}deg)`,
          fontSize: `${t.fontSize}px`,
          zIndex: isSelected ? 40 : 25,
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "none",
          ...styleOverride,
        }}
        className={`group transition-shadow inline-block max-w-[88%] ${
          isSelected
            ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 rounded-lg shadow-2xl"
            : "hover:ring-1 hover:ring-amber-400/60 rounded-lg"
        } ${className}`}
        title={`Arrastra para mover (${ELEMENT_LABELS[key].name}) · Clic para cambiar tamaño o girar`}
      >
        {content}

        {/* Indicador de posición y ángulo cuando está seleccionado */}
        {isSelected && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-amber-500 text-slate-950 text-[7px] font-black uppercase px-1.5 py-0.2 rounded-full shadow-md whitespace-nowrap pointer-events-none">
            <span>✋ {t.x}%, {t.y}%</span>
            {t.rotation !== 0 && <span>· {t.rotation}°</span>}
          </div>
        )}
      </div>
    );
  };

  // Renderizador de todas las capas interactivas
  const renderInteractiveLayers = () => {
    return (
      <div className="absolute inset-0 z-20 pointer-events-auto">
        {/* Marca / Nombre comercial */}
        {displayBrand &&
          renderInteractiveElement(
            "brand",
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-200 bg-black/75 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/15 shadow-md">
              {includeLogo && (
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs" style={{ backgroundColor: primaryColor }} />
              )}
              <span className="truncate">{displayBrand}</span>
            </div>
          )}

        {/* Titular Principal */}
        {displayTitle &&
          renderInteractiveElement(
            "title",
            <h5 className="font-black leading-tight tracking-tight uppercase text-white drop-shadow-xl text-center px-2 py-0.5 break-words">
              {displayTitle}
            </h5>
          )}

        {/* Slogan */}
        {displaySlogan &&
          renderInteractiveElement(
            "slogan",
            <p className="font-semibold text-slate-200 leading-tight text-center drop-shadow-md bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs max-w-xs">
              {displaySlogan}
            </p>
          )}

        {/* Precio / Oferta Destacada */}
        {displayPrice &&
          renderInteractiveElement(
            "price",
            <div
              className="font-black px-3 py-1 rounded-xl shadow-lg border border-white/20 text-center whitespace-nowrap"
              style={{ backgroundColor: primaryColor, color: "#111827" }}
            >
              {displayPrice}
            </div>
          )}

        {/* Contacto */}
        {displayContact &&
          renderInteractiveElement(
            "contact",
            <div className="text-[7.5px] font-bold text-slate-200 bg-black/75 px-2 py-0.5 rounded-md backdrop-blur-md border border-white/15 shadow-sm text-center">
              {displayContact}
            </div>
          )}

        {/* CTA (Llamado a la acción) */}
        {displayCta &&
          renderInteractiveElement(
            "cta",
            <div
              className="font-black py-1.5 px-3.5 rounded-xl uppercase tracking-wider shadow-xl text-center whitespace-nowrap border border-white/20"
              style={{ backgroundColor: primaryColor, color: "#111827" }}
            >
              {displayCta}
            </div>
          )}
      </div>
    );
  };

  const renderSafeZoneOverlay = () => {
    if (!showSafeZone) return null;

    if (isStoryOrReel) {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between">
          <div className="h-[14%] bg-rose-950/70 border-b border-rose-400/70 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-[7.5px] font-black uppercase text-rose-200 tracking-wider bg-rose-900/90 px-2 py-0.5 rounded border border-rose-400/60 shadow">
              ⚠️ Zona de Perfil & Controles (14%)
            </span>
          </div>
          <div className="flex-1 border-2 border-dashed border-emerald-400/90 mx-3 my-1 rounded-lg flex flex-col justify-between p-1.5 relative">
            <div className="text-[7.5px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-500/40 w-fit mx-auto shadow">
              ✓ Zona Segura Central 9:16
            </div>
            <div className="text-[7px] font-mono text-emerald-300/90 text-center">
              100% visible sin obstrucciones
            </div>
          </div>
          <div className="h-[20%] bg-rose-950/70 border-t border-rose-400/70 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-[7.5px] font-black uppercase text-rose-200 tracking-wider bg-rose-900/90 px-2 py-0.5 rounded border border-rose-400/60 shadow">
              ⚠️ Zona de Copy & Audio (20%)
            </span>
          </div>
        </div>
      );
    }

    if (aspectRatio === "4:5") {
      return (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between">
          <div className="h-[10%] bg-amber-950/80 border-b border-amber-400/80 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-[7.5px] font-black uppercase text-amber-200 tracking-wider bg-amber-900/90 px-2 py-0.5 rounded border border-amber-400/60 shadow">
              ⚠️ Se oculta en Cuadrícula 1:1 del Perfil
            </span>
          </div>
          <div className="flex-1 border-2 border-dashed border-emerald-400/90 mx-2 my-1 rounded-lg flex flex-col justify-between p-1.5 relative">
            <div className="text-[7.5px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-500/40 w-fit mx-auto shadow">
              ✓ Zona Segura 1:1 (Visible en Perfil y Feed)
            </div>
            <div className="text-[7px] font-mono text-emerald-300/90 text-center">
              100% visible en Feed Vertical y Cuadrícula
            </div>
          </div>
          <div className="h-[10%] bg-amber-950/80 border-t border-amber-400/80 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-[7.5px] font-black uppercase text-amber-200 tracking-wider bg-amber-900/90 px-2 py-0.5 rounded border border-amber-400/60 shadow">
              ⚠️ Se oculta en Cuadrícula 1:1 del Perfil
            </span>
          </div>
        </div>
      );
    }

    // Caso 1:1 (Post Cuadrado y Carrusel Cuadrado): En Instagram 1:1 NUNCA hay recorte lateral
    return (
      <div className="absolute inset-0 pointer-events-none z-30 p-2.5 sm:p-3">
        <div className="w-full h-full border-2 border-dashed border-emerald-400/90 rounded-xl flex flex-col justify-between p-2 relative bg-emerald-950/15">
          <div className="text-[7.5px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-500/40 w-fit mx-auto shadow">
            ✓ 100% Visible en Instagram (Feed y Cuadrícula)
          </div>
          <div className="text-[7px] font-mono text-emerald-200/90 text-center bg-slate-950/80 py-0.5 px-2 rounded-md w-fit mx-auto border border-emerald-500/30">
            Sin recorte lateral · Margen de aire recomendado: 8%
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={() => setSelectedKey(null)}
      className="w-full bg-slate-900/95 p-4 rounded-2xl border border-slate-800 text-white shadow-inner flex flex-col items-center"
    >
      {/* Header del Preview con Selector de Vistas */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-1 text-[11px] font-bold">
        {hasImage ? (
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-emerald-400">
            <span>✨</span> {slideNumber ? `Slide ${slideNumber} Listo` : "Afiche Listo"}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-amber-400">
            <span>👁️</span> Vista Previa del Esquema
          </span>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {hasImage && (
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("afiche")}
                className={`px-2.5 py-1 sm:py-0.5 rounded-lg text-xs sm:text-[10px] font-black transition-all cursor-pointer ${
                  activeViewMode === "afiche" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-400 hover:text-white"
                }`}
                title="Ver el afiche completo con textos interactivos en tiempo real"
              >
                ✨ Afiche en Vivo
              </button>
              <button
                type="button"
                onClick={() => setViewMode("image")}
                className={`px-2.5 py-1 sm:py-0.5 rounded-lg text-xs sm:text-[10px] font-black transition-all cursor-pointer ${
                  activeViewMode === "image" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-400 hover:text-white"
                }`}
                title="Ver solo la imagen fotográfica sin textos montados"
              >
                📷 Solo Foto
              </button>
              <button
                type="button"
                onClick={() => setViewMode("blueprint")}
                className={`px-2.5 py-1 sm:py-0.5 rounded-lg text-xs sm:text-[10px] font-black transition-all cursor-pointer ${
                  activeViewMode === "blueprint" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-400 hover:text-white"
                }`}
                title="Ver esquema técnico wireframe"
              >
                📐 Esquema
              </button>
            </div>
          )}

          {!isStoryOrReel && (
            <button
              type="button"
              onClick={() => setShowSafeZone((prev) => !prev)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1 ${
                showSafeZone
                  ? "bg-emerald-600 text-white border-emerald-400 shadow-xs"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
              title="Ver guía de recorte de la cuadrícula de Instagram (Grid 1:1 vs Feed 4:5)"
            >
              <span>📐</span> Zona Segura IG
            </button>
          )}

          {elementTransforms && Object.keys(elementTransforms).length > 0 && (
            <button
              type="button"
              onClick={resetAllTransforms}
              className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-rose-300 hover:text-rose-100 bg-rose-950/60 border border-rose-800 transition-all cursor-pointer"
              title="Restablecer todos los textos a su posición automática original"
            >
              ↩️ Restablecer
            </button>
          )}

          <span className="bg-slate-800 px-2 py-0.5 rounded-lg text-slate-300 font-mono text-[10px]">
            {aspectRatio}
          </span>
        </div>
      </div>

      {/* Barra de Herramientas Flotante para el Elemento Seleccionado (Tamaño y Giro) */}
      {selectedKey && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[320px] mb-3 p-2.5 bg-slate-950/90 border border-amber-500/50 rounded-2xl backdrop-blur-md shadow-2xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-[11px] font-black text-amber-400 flex items-center gap-1.5 truncate">
              <span>{ELEMENT_LABELS[selectedKey].emoji}</span>
              <span>Editando: {ELEMENT_LABELS[selectedKey].name}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateTransform(selectedKey, { x: 50 })}
                className="text-[9px] font-bold text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 cursor-pointer"
                title="Centrar horizontalmente"
              >
                🎯 Centrar X
              </button>
              <button
                type="button"
                onClick={() => resetTransform(selectedKey)}
                className="text-[9px] font-bold text-slate-400 hover:text-rose-300 bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700 cursor-pointer"
                title="Volver a posición original de este texto"
              >
                ↩️
              </button>
              <button
                type="button"
                onClick={() => setSelectedKey(null)}
                className="text-[10px] font-bold text-slate-400 hover:text-white px-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {/* Control de Tamaño */}
            <div className="space-y-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 font-bold">
                <span>📏 Tamaño</span>
                <span className="text-amber-300 font-mono font-black">{getTransform(selectedKey).fontSize}px</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    updateTransform(selectedKey, {
                      fontSize: Math.max(7, Math.round(getTransform(selectedKey).fontSize - 1)),
                    })
                  }
                  className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded-lg font-black text-white flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min="7"
                  max="32"
                  step="0.5"
                  value={getTransform(selectedKey).fontSize}
                  onChange={(e) => updateTransform(selectedKey, { fontSize: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateTransform(selectedKey, {
                      fontSize: Math.min(36, Math.round(getTransform(selectedKey).fontSize + 1)),
                    })
                  }
                  className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded-lg font-black text-white flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Control de Giro / Rotación */}
            <div className="space-y-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 font-bold">
                <span>🔄 Giro</span>
                <span className="text-amber-300 font-mono font-black">{getTransform(selectedKey).rotation}°</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateTransform(selectedKey, { rotation: getTransform(selectedKey).rotation - 5 })}
                  className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-white flex items-center justify-center cursor-pointer text-[9px]"
                  title="Girar -5°"
                >
                  ↺
                </button>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  step="1"
                  value={getTransform(selectedKey).rotation}
                  onChange={(e) => updateTransform(selectedKey, { rotation: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => updateTransform(selectedKey, { rotation: getTransform(selectedKey).rotation + 5 })}
                  className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-white flex items-center justify-center cursor-pointer text-[9px]"
                  title="Girar +5°"
                >
                  ↻
                </button>
              </div>
              {getTransform(selectedKey).rotation !== 0 && (
                <button
                  type="button"
                  onClick={() => updateTransform(selectedKey, { rotation: 0 })}
                  className="text-[8px] text-amber-400 hover:underline block text-center w-full cursor-pointer"
                >
                  Restablecer a 0°
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CASO 1: MODO AFICHE EN VIVO (IMAGEN GENERADA + CAPAS DE TEXTO INTERACTIVAS) */}
      {activeViewMode === "afiche" && hasImage && (
        <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-200">
          <div
            ref={containerRef}
            className={`w-full ${aspectRatio === "9:16" ? "max-w-[220px]" : "max-w-[280px]"} bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500/60 shadow-2xl relative select-none transition-all duration-300 group flex flex-col justify-between`}
            style={{
              aspectRatio: aspectRatio === "9:16" ? "9/16" : aspectRatio === "4:5" ? "4/5" : "1/1",
              boxShadow: `0 12px 35px -10px ${primaryColor}40`,
            }}
          >
            {/* Imagen fotográfica de fondo */}
            <img
              src={generatedImageUrl}
              alt={displayTitle || "Fondo afiche"}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-102 pointer-events-none"
            />

            {/* Overlay sutil para contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-slate-950/60 pointer-events-none" />

            {/* Capas Interactivas con Drag & Drop, Tamaño y Giro */}
            {renderInteractiveLayers()}

            {/* Overlay Guía de Zona Segura Universal de Instagram */}
            {renderSafeZoneOverlay()}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 w-full max-w-[280px]">
            <a
              href={generatedImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 py-1 px-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20"
            >
              <span>🔍</span> Abrir imagen completa
            </a>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                title="Regenerar escena fotográfica con nuestros agentes"
                className="text-[11px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                🔄
              </button>
            )}
          </div>
        </div>
      )}

      {/* CASO 2: MODO SOLO FOTO */}
      {activeViewMode === "image" && hasImage && (
        <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-200">
          <div
            className={`w-full ${aspectRatio === "9:16" ? "max-w-[220px]" : "max-w-[280px]"} bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500/60 shadow-2xl relative select-none transition-all duration-300 group`}
            style={{
              aspectRatio: aspectRatio === "9:16" ? "9/16" : aspectRatio === "4:5" ? "4/5" : "1/1",
              boxShadow: `0 12px 35px -10px ${primaryColor}40`,
            }}
          >
            <img
              src={generatedImageUrl}
              alt={displayTitle || "Fotografía generada"}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 w-full max-w-[280px]">
            <a
              href={generatedImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 py-1 px-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20"
            >
              <span>🔍</span> Abrir en pestaña nueva
            </a>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                title="Regenerar imagen"
                className="text-[11px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                🔄
              </button>
            )}
          </div>
        </div>
      )}

      {/* CASO 3: MODO ESQUEMA WIREFRAME */}
      {(activeViewMode === "blueprint" || !hasImage) && (
        <div className="flex flex-col items-center w-full animate-in fade-in duration-200">
          <div
            ref={containerRef}
            className={`w-full ${aspectRatio === "9:16" ? "max-w-[220px]" : "max-w-[280px]"} bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700/60 shadow-2xl relative select-none transition-all duration-300`}
            style={{
              aspectRatio: aspectRatio === "9:16" ? "9/16" : aspectRatio === "4:5" ? "4/5" : "1/1",
              boxShadow: `0 10px 30px -10px ${primaryColor}25`,
            }}
          >
            {/* Si ya hay imagen generada, mostrarla de fondo para que nunca se oculte */}
            {hasImage && generatedImageUrl && (
              <img
                src={generatedImageUrl}
                alt={displayTitle || "Fondo afiche"}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40 filter grayscale"
              />
            )}
            {/* Fondo simulando textura */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />

            {/* Badges superiores informativos */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center pointer-events-none z-10">
              <span className="bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-400/30 shadow-md">
                {slideNumber ? `Slide ${slideNumber}` : "Afiche"} · Esquema
              </span>
              <span className="bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/20">
                {aspectRatio}
              </span>
            </div>

            {/* Capas Interactivas con Drag & Drop, Tamaño y Giro */}
            {renderInteractiveLayers()}

            {/* Overlay Guía de Zona Segura Universal de Instagram */}
            {renderSafeZoneOverlay()}
          </div>

          <p className="text-[10px] text-slate-400 font-medium text-center mt-3 max-w-xs leading-tight">
            💡 <b>Interactividad activada:</b> Haz clic en cualquier texto del afiche para cambiarle el tamaño o girarlo, o arrástralo para moverlo a tu posición ideal.
          </p>
        </div>
      )}
    </div>
  );
}
