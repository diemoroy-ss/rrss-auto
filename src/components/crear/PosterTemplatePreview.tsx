"use client";

import React from "react";
import type { PosterLayout, VisualStyle } from "../../types/poster";

interface PosterTemplatePreviewProps {
  layout: PosterLayout;
  visualStyle: VisualStyle;
  primaryColor?: string;
  mainText?: string;
  sloganText?: string;
  priceText?: string;
  includePrice?: boolean;
  ctaText?: string;
  businessName?: string;
  includeBusinessName?: boolean;
  includeLogo?: boolean;
  includeSlogan?: boolean;
  includeMainText?: boolean;
  includeContact?: boolean;
  contactType?: string;
  contactValue?: string;
  aspectRatio?: "1:1" | "4:5" | "9:16";
  generatedImageUrl?: string;
  isGenerating?: boolean;
  slideNumber?: number;
  totalSlides?: number;
  onRegenerate?: () => void;
  onOpenEditor?: () => void;
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
  businessName = "Tu Marca",
  includeBusinessName = true,
  includeLogo = true,
  includeSlogan = true,
  includeMainText = true,
  includeContact = false,
  contactType = "whatsapp",
  contactValue = "",
  aspectRatio = "1:1",
  generatedImageUrl,
  isGenerating = false,
  slideNumber,
  totalSlides,
  onRegenerate,
  onOpenEditor,
}: PosterTemplatePreviewProps) {
  const hasImage = Boolean(generatedImageUrl && generatedImageUrl.trim().length > 0);

  // Modos de visualización:
  // "afiche" -> Muestra la imagen generada con las capas de texto tipográficas en tiempo real encima
  // "image" -> Muestra solo la imagen limpia generada sin capas de texto
  // "blueprint" -> Muestra el esquema técnico wireframe sin foto
  const [viewMode, setViewMode] = React.useState<"afiche" | "image" | "blueprint">("afiche");
  const [showSafeZone, setShowSafeZone] = React.useState<boolean>(false);

  // Al recibir una nueva imagen generada, asegurar que se active el modo afiche en vivo
  React.useEffect(() => {
    if (hasImage && viewMode === "blueprint") {
      setViewMode("afiche");
    }
  }, [hasImage]);

  // Si no hay imagen, forzamos blueprint
  const activeViewMode = hasImage ? viewMode : "blueprint";

  // Solo se muestra si el usuario NO lo ha borrado (no es string vacío) y está habilitado por su toggle
  const hasTitle = (includeMainText !== false) && Boolean(mainText && mainText.trim().length > 0);
  const displayTitle = hasTitle ? mainText!.trim() : null;

  const hasSlogan = Boolean(includeSlogan) && Boolean(sloganText && sloganText.trim().length > 0);
  const displaySlogan = hasSlogan ? sloganText!.trim() : null;

  const hasPrice = Boolean(includePrice) && Boolean(priceText && priceText.trim().length > 0);
  const displayPrice = hasPrice ? priceText!.trim() : null;

  const hasCta = Boolean(ctaText && ctaText.trim().length > 0);
  const displayCta = hasCta ? ctaText!.trim() : null;

  const hasBrand = Boolean(includeBusinessName) && Boolean(businessName && businessName.trim().length > 0);
  const displayBrand = hasBrand ? businessName!.trim() : null;

  const hasContact = Boolean(includeContact) && Boolean(contactValue && contactValue.trim().length > 0);
  const displayContact = hasContact
    ? `${contactType === "whatsapp" ? "WhatsApp" : contactType === "email" ? "Email" : "Tel"}: ${contactValue!.trim()}`
    : null;

  const renderLayoutBody = (hasBackgroundPhoto: boolean) => {
    return (
      <>
        {/* ── LAYOUT 1: SPLIT LATERAL ── */}
        {layout === "split_left" && (
          <div className="relative z-10 h-full grid grid-cols-12 gap-2.5">
            {/* Columna Izquierda: Textos y CTA */}
            <div className={`col-span-7 flex flex-col justify-between py-1 pr-1 ${hasBackgroundPhoto ? "border-r border-white/20" : "border-r border-white/10"}`}>
              <div className="space-y-2">
                {displayBrand && (
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-slate-200 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs w-fit border border-white/10 shadow-xs">
                    {includeLogo && (
                      <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: primaryColor }} />
                    )}
                    <span className="truncate">{displayBrand}</span>
                  </div>
                )}
                <div>
                  {displayTitle && (
                    <h5 className="text-[12px] font-black leading-tight tracking-tight uppercase line-clamp-3 text-white drop-shadow-lg">
                      {displayTitle}
                    </h5>
                  )}
                  {displaySlogan && (
                    <p className="text-[9px] text-slate-200 font-medium leading-tight mt-1 line-clamp-2 drop-shadow-md">
                      {displaySlogan}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {displayPrice && (
                  <div
                    className="inline-block text-[10px] font-black px-2.5 py-0.5 rounded-lg shadow-md"
                    style={{ backgroundColor: primaryColor, color: "#111827" }}
                  >
                    {displayPrice}
                  </div>
                )}
                {displayContact && (
                  <div className="text-[8px] font-bold text-slate-200 bg-black/60 px-2 py-0.5 rounded-lg backdrop-blur-xs truncate border border-white/10">
                    {displayContact}
                  </div>
                )}
                {displayCta && (
                  <div className="w-full bg-white text-slate-950 text-[9px] font-black py-1.5 px-2 rounded-lg text-center uppercase tracking-wider shadow-md truncate">
                    {displayCta}
                  </div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Foto o Producto */}
            {!hasBackgroundPhoto ? (
              <div className="col-span-5 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/20 rounded-xl p-2 text-center">
                <span className="text-xl mb-1">📸</span>
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 leading-tight">
                  Zona de Producto Despejada
                </span>
              </div>
            ) : (
              <div className="col-span-5 flex items-center justify-center pointer-events-none" />
            )}
          </div>
        )}

        {/* ── LAYOUT 2: CABECERA SUPERIOR ── */}
        {layout === "top_banner" && (
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Bloque Superior: Titular y Marca */}
            {(displayBrand || displayTitle || displaySlogan || displayPrice) && (
              <div className="bg-slate-950/85 backdrop-blur-xs p-2 rounded-xl border border-white/15 space-y-1 shadow-md">
                {(displayBrand || displayPrice) && (
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-300">
                    <span className="truncate">{displayBrand || ""}</span>
                    {displayPrice && (
                      <span
                        className="px-2 py-0.5 rounded-md font-bold ml-auto shadow-xs"
                        style={{ backgroundColor: primaryColor, color: "#111827" }}
                      >
                        {displayPrice}
                      </span>
                    )}
                  </div>
                )}
                {displayTitle && (
                  <h5 className="text-[12px] font-black leading-tight tracking-tight uppercase text-white drop-shadow-md text-center">
                    {displayTitle}
                  </h5>
                )}
                {displaySlogan && (
                  <p className="text-[8px] text-slate-200 font-medium text-center line-clamp-1">
                    {displaySlogan}
                  </p>
                )}
              </div>
            )}

            {/* Centro: Foto libre */}
            {!hasBackgroundPhoto ? (
              <div className="flex-1 my-2 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/20 rounded-xl text-center p-2">
                <span className="text-2xl mb-1">📸</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                  Escena Fotográfica Central
                </span>
              </div>
            ) : (
              <div className="flex-1 my-2 pointer-events-none" />
            )}

            {/* Pie: Contacto y CTA */}
            {(displayContact || displayCta) && (
              <div className="space-y-1.5 pt-1">
                {displayContact && (
                  <div className="text-center text-[8px] font-bold text-slate-200 bg-black/60 py-0.5 px-2 rounded-md backdrop-blur-xs border border-white/10">
                    {displayContact}
                  </div>
                )}
                {displayCta && (
                  <div
                    className="w-full text-[9px] font-black py-1.5 px-3 rounded-lg text-center uppercase tracking-wider shadow-md truncate"
                    style={{ backgroundColor: primaryColor, color: "#111827" }}
                  >
                    {displayCta}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── LAYOUT 3: FICHA INFORMATIVA ── */}
        {layout === "recipe_ingredients" && (
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Cabecera */}
            {(displayBrand || displayTitle) && (
              <div className="text-center space-y-0.5 bg-slate-950/70 backdrop-blur-xs p-1.5 rounded-xl border border-white/10">
                {displayBrand && (
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 block">
                    {displayBrand}
                  </span>
                )}
                {displayTitle && (
                  <h5 className="text-[11px] font-black uppercase text-white tracking-tight leading-tight drop-shadow-md">
                    {displayTitle}
                  </h5>
                )}
              </div>
            )}

            {/* Centro Foto */}
            {!hasBackgroundPhoto ? (
              <div className="h-20 my-1 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/20 rounded-xl">
                <span className="text-lg">🍽️ / 📦</span>
                <span className="text-[7px] font-black uppercase text-slate-400">Encuadre Cenital</span>
              </div>
            ) : (
              <div className="flex-1 my-1 pointer-events-none" />
            )}

            {/* Puntos de Información / Ficha */}
            <div className="grid grid-cols-3 gap-1 my-1">
              <div className="bg-black/65 backdrop-blur-xs rounded-md p-1 text-center border border-white/10 shadow-xs">
                <span className="text-[7px] block font-bold" style={{ color: primaryColor }}>Punto 1</span>
                <span className="text-[7px] block text-slate-200 truncate">Calidad</span>
              </div>
              <div className="bg-black/65 backdrop-blur-xs rounded-md p-1 text-center border border-white/10 shadow-xs">
                <span className="text-[7px] block font-bold" style={{ color: primaryColor }}>Punto 2</span>
                <span className="text-[7px] block text-slate-200 truncate">Rapidez</span>
              </div>
              <div className="bg-black/65 backdrop-blur-xs rounded-md p-1 text-center border border-white/10 shadow-xs">
                <span className="text-[7px] block font-bold" style={{ color: primaryColor }}>Punto 3</span>
                <span className="text-[7px] block text-slate-200 truncate">Garantía</span>
              </div>
            </div>

            {/* Pie CTA */}
            {(displayPrice || displayCta) && (
              <div className="flex items-center justify-between gap-1 pt-1">
                {displayPrice && (
                  <span
                    className="text-[9px] font-black px-2 py-1 rounded-md shadow-md"
                    style={{ backgroundColor: primaryColor, color: "#111827" }}
                  >
                    {displayPrice}
                  </span>
                )}
                {displayCta && (
                  <div className="flex-1 bg-white text-slate-900 text-[8px] font-black py-1 px-2 rounded-md text-center uppercase tracking-wider truncate shadow-sm">
                    {displayCta}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── LAYOUT 4: AUTOMÁTICO (EQUILIBRADO) ── */}
        {(layout === "auto" || !layout) && (
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Fila Superior: Marca y Precio */}
            {(displayBrand || displayPrice) && (
              <div className="flex items-center justify-between gap-2">
                {displayBrand && (
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-200 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs border border-white/10 shadow-xs flex items-center gap-1">
                    {includeLogo && (
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
                    )}
                    <span className="truncate">{displayBrand}</span>
                  </span>
                )}
                {displayPrice && (
                  <span
                    className="text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-md ml-auto"
                    style={{ backgroundColor: primaryColor, color: "#111827" }}
                  >
                    {displayPrice}
                  </span>
                )}
              </div>
            )}

            {/* Bloque Central: Titular y Slogan */}
            {(displayTitle || displaySlogan) && (
              <div className="my-auto py-2 text-center space-y-1.5">
                {displayTitle && (
                  <h5 className="text-[13px] font-black uppercase leading-tight tracking-tight text-white drop-shadow-xl px-2">
                    {displayTitle}
                  </h5>
                )}
                {displaySlogan && (
                  <p className="text-[9px] text-slate-200 font-medium px-2 line-clamp-2 drop-shadow-md">
                    {displaySlogan}
                  </p>
                )}
              </div>
            )}

            {/* Pie: Contacto y CTA */}
            {(displayContact || displayCta) && (
              <div className="space-y-1.5 pt-1">
                {displayContact && (
                  <div className="text-center text-[7.5px] font-bold text-slate-200 bg-black/60 py-0.5 px-2 rounded-full backdrop-blur-xs border border-white/10">
                    {displayContact}
                  </div>
                )}
                {displayCta && (
                  <div
                    className="w-full text-[9px] font-black py-1.5 px-3 rounded-xl text-center uppercase tracking-wider shadow-lg truncate"
                    style={{ backgroundColor: primaryColor, color: "#111827" }}
                  >
                    {displayCta}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="w-full bg-slate-900/95 p-4 rounded-2xl border border-slate-800 text-white shadow-inner flex flex-col items-center">
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
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("afiche")}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  activeViewMode === "afiche" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-400 hover:text-white"
                }`}
                title="Ver el afiche completo con textos y precios en tiempo real"
              >
                ✨ Afiche en Vivo
              </button>
              <button
                type="button"
                onClick={() => setViewMode("image")}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  activeViewMode === "image" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-400 hover:text-white"
                }`}
                title="Ver solo la imagen fotográfica sin textos montados"
              >
                📷 Solo Foto
              </button>
              <button
                type="button"
                onClick={() => setViewMode("blueprint")}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  activeViewMode === "blueprint" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-400 hover:text-white"
                }`}
                title="Ver esquema técnico wireframe"
              >
                📐 Esquema
              </button>
            </div>
          )}
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
          <span className="bg-slate-800 px-2 py-0.5 rounded-lg text-slate-300 font-mono text-[10px]">
            {aspectRatio}
          </span>
        </div>
      </div>

      {/* CASO 1: MODO AFICHE EN VIVO (IMAGEN DE FONDO + CAPAS DE TEXTO TIPOGRÁFICAS EN TIEMPO REAL) */}
      {activeViewMode === "afiche" && hasImage && (
        <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-200">
          <div
            className={`w-full ${aspectRatio === "9:16" ? "max-w-[220px]" : "max-w-[280px]"} bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500/60 shadow-2xl relative select-none transition-all duration-300 group flex flex-col justify-between p-3.5`}
            style={{
              aspectRatio: aspectRatio === "9:16" ? "9/16" : aspectRatio === "4:5" ? "4/5" : "1/1",
              boxShadow: `0 12px 35px -10px ${primaryColor}40`,
            }}
          >
            {/* Imagen fotográfica de fondo */}
            <img
              src={generatedImageUrl}
              alt={displayTitle || "Fondo afiche"}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />

            {/* Overlay sutil para asegurar contraste óptimo de textos */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/65 pointer-events-none" />

            {/* Badges superiores informativos */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center pointer-events-none z-20">
              <span className="bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-400/30 shadow-md">
                {slideNumber ? `Slide ${slideNumber}` : "Afiche"} · En Vivo
              </span>
              <span className="bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/20">
                {aspectRatio}
              </span>
            </div>

            {/* Renderizado de textos en vivo sobre la imagen */}
            <div className="relative z-10 h-full flex flex-col justify-between pt-6">
              {renderLayoutBody(true)}
            </div>

            {/* Overlay Guía de Zona Segura Universal de Instagram */}
            {showSafeZone && (
              <div className="absolute inset-0 pointer-events-none z-30">
                {aspectRatio === "4:5" ? (
                  <div className="w-full h-full flex flex-col justify-between">
                    <div className="h-[10%] bg-rose-950/80 border-b border-rose-400/80 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-[7px] font-black uppercase text-rose-200 tracking-wider bg-rose-900/90 px-1.5 py-0.5 rounded border border-rose-400/60 shadow">
                        ⚠️ Se recorta en Grid Cuadrado (1:1)
                      </span>
                    </div>
                    <div className="flex-1 border-2 border-dashed border-emerald-400/90 mx-[14%] my-1 rounded-lg flex flex-col justify-between p-1 relative">
                      <div className="text-[7px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/40 w-fit mx-auto shadow">
                        ✓ Zona Segura Universal
                      </div>
                      <div className="text-[6.5px] font-mono text-emerald-300/80 text-center">
                        Visible en Feed y Cuadrícula
                      </div>
                    </div>
                    <div className="h-[12%] bg-rose-950/80 border-t border-rose-400/80 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-[7px] font-black uppercase text-rose-200 tracking-wider bg-rose-900/90 px-1.5 py-0.5 rounded border border-rose-400/60 shadow">
                        ⚠️ Se recorta en Grid Cuadrado (1:1)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex justify-between">
                    {/* En Grid Vertical 4:5 de Instagram, una imagen 1:1 pierde 15% a la izquierda */}
                    <div className="w-[15%] h-full bg-rose-950/80 border-r border-rose-400/80 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-[6px] font-black uppercase text-rose-200 tracking-tighter bg-rose-900/90 px-1 py-1 rounded border border-rose-400/60 -rotate-90 shadow whitespace-nowrap">
                        ⚠️ Recorte Lateral
                      </span>
                    </div>
                    {/* Caja segura central 70% */}
                    <div className="flex-1 h-full border-2 border-dashed border-emerald-400/90 my-[10%] mx-1 rounded-lg flex flex-col justify-between p-1 relative">
                      <div className="text-[6.5px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/40 w-fit mx-auto shadow">
                        ✓ Zona Segura (70% central)
                      </div>
                      <div className="text-[6px] font-mono text-emerald-300/80 text-center">
                        Visible en Grid Vertical y Feed
                      </div>
                    </div>
                    {/* En Grid Vertical 4:5 de Instagram, una imagen 1:1 pierde 15% a la derecha */}
                    <div className="w-[15%] h-full bg-rose-950/80 border-l border-rose-400/80 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-[6px] font-black uppercase text-rose-200 tracking-tighter bg-rose-900/90 px-1 py-1 rounded border border-rose-400/60 rotate-90 shadow whitespace-nowrap">
                        ⚠️ Recorte Lateral
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Acciones debajo del Afiche */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 w-full max-w-[280px]">
            <a
              href={generatedImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 py-1 px-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20"
            >
              <span>🔍</span> Abrir imagen en pestaña nueva
            </a>
            {onOpenEditor && (
              <button
                type="button"
                onClick={onOpenEditor}
                className="text-[11px] font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>✏️</span> Editor de capas
              </button>
            )}
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

      {/* CASO 2: MODO SOLO FOTO (VER FOTO PURA SIN CAPAS DE TEXTO) */}
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
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />

            {/* Badges superiores */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center pointer-events-none">
              <span className="bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-400/30 shadow-md">
                {slideNumber ? `Slide ${slideNumber}` : "Afiche"} · Solo Foto
              </span>
              <span className="bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/20">
                {aspectRatio}
              </span>
            </div>

            {/* Overlay Guía de Zona Segura Universal de Instagram */}
            {showSafeZone && (
              <div className="absolute inset-0 pointer-events-none z-30">
                {aspectRatio === "4:5" ? (
                  <div className="w-full h-full flex flex-col justify-between">
                    <div className="h-[10%] bg-rose-950/80 border-b border-rose-400/80 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-[7px] font-black uppercase text-rose-200 tracking-wider bg-rose-900/90 px-1.5 py-0.5 rounded border border-rose-400/60 shadow">
                        ⚠️ Se recorta en Grid Cuadrado (1:1)
                      </span>
                    </div>
                    <div className="flex-1 border-2 border-dashed border-emerald-400/90 mx-[14%] my-1 rounded-lg flex flex-col justify-between p-1 relative">
                      <div className="text-[7px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/40 w-fit mx-auto shadow">
                        ✓ Zona Segura Universal
                      </div>
                      <div className="text-[6.5px] font-mono text-emerald-300/80 text-center">
                        Visible en Feed y Cuadrícula
                      </div>
                    </div>
                    <div className="h-[12%] bg-rose-950/80 border-t border-rose-400/80 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-[7px] font-black uppercase text-rose-200 tracking-wider bg-rose-900/90 px-1.5 py-0.5 rounded border border-rose-400/60 shadow">
                        ⚠️ Se recorta en Grid Cuadrado (1:1)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex justify-between">
                    {/* En Grid Vertical 4:5 de Instagram, una imagen 1:1 pierde 15% a la izquierda */}
                    <div className="w-[15%] h-full bg-rose-950/80 border-r border-rose-400/80 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-[6px] font-black uppercase text-rose-200 tracking-tighter bg-rose-900/90 px-1 py-1 rounded border border-rose-400/60 -rotate-90 shadow whitespace-nowrap">
                        ⚠️ Recorte Lateral
                      </span>
                    </div>
                    {/* Caja segura central 70% */}
                    <div className="flex-1 h-full border-2 border-dashed border-emerald-400/90 my-[10%] mx-1 rounded-lg flex flex-col justify-between p-1 relative">
                      <div className="text-[6.5px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/40 w-fit mx-auto shadow">
                        ✓ Zona Segura (70% central)
                      </div>
                      <div className="text-[6px] font-mono text-emerald-300/80 text-center">
                        Visible en Grid Vertical y Feed
                      </div>
                    </div>
                    {/* En Grid Vertical 4:5 de Instagram, una imagen 1:1 pierde 15% a la derecha */}
                    <div className="w-[15%] h-full bg-rose-950/80 border-l border-rose-400/80 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-[6px] font-black uppercase text-rose-200 tracking-tighter bg-rose-900/90 px-1 py-1 rounded border border-rose-400/60 rotate-90 shadow whitespace-nowrap">
                        ⚠️ Recorte Lateral
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
            {onOpenEditor && (
              <button
                type="button"
                onClick={onOpenEditor}
                className="text-[11px] font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>✏️</span> Editor de capas
              </button>
            )}
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

      {/* CASO 3: MODO ESQUEMA WIREFRAME (SIN FOTO O ANTES DE GENERAR) */}
      {(activeViewMode === "blueprint" || !hasImage) && (
        <div className="flex flex-col items-center w-full animate-in fade-in duration-200">
          <div
            className={`w-full ${aspectRatio === "9:16" ? "max-w-[220px]" : "max-w-[280px]"} bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700/60 shadow-2xl relative flex flex-col justify-between p-3.5 select-none transition-all duration-300`}
            style={{
              aspectRatio: aspectRatio === "9:16" ? "9/16" : aspectRatio === "4:5" ? "4/5" : "1/1",
              boxShadow: `0 10px 30px -10px ${primaryColor}25`,
            }}
          >
            {/* Marca de agua de fondo simulando fotografía */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />

            {/* Badges superiores informativos */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center pointer-events-none z-20">
              <span className="bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-400/30 shadow-md">
                {slideNumber ? `Slide ${slideNumber}` : "Afiche"} · Esquema
              </span>
              <span className="bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/20">
                {aspectRatio}
              </span>
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between pt-6">
              {renderLayoutBody(false)}
            </div>

            {/* Overlay Guía de Zona Segura Universal de Instagram */}
            {showSafeZone && (
              <div className="absolute inset-0 pointer-events-none z-30">
                {aspectRatio === "4:5" ? (
                  <div className="w-full h-full flex flex-col justify-between">
                    <div className="h-[10%] bg-rose-950/80 border-b border-rose-400/80 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-[7px] font-black uppercase text-rose-200 tracking-wider bg-rose-900/90 px-1.5 py-0.5 rounded border border-rose-400/60 shadow">
                        ⚠️ Se recorta en Grid Cuadrado (1:1)
                      </span>
                    </div>
                    <div className="flex-1 border-2 border-dashed border-emerald-400/90 mx-[14%] my-1 rounded-lg flex flex-col justify-between p-1 relative">
                      <div className="text-[7px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/40 w-fit mx-auto shadow">
                        ✓ Zona Segura Universal
                      </div>
                      <div className="text-[6.5px] font-mono text-emerald-300/80 text-center">
                        Visible en Feed y Cuadrícula
                      </div>
                    </div>
                    <div className="h-[12%] bg-rose-950/80 border-t border-rose-400/80 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-[7px] font-black uppercase text-rose-200 tracking-wider bg-rose-900/90 px-1.5 py-0.5 rounded border border-rose-400/60 shadow">
                        ⚠️ Se recorta en Grid Cuadrado (1:1)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex justify-between">
                    {/* En Grid Vertical 4:5 de Instagram, una imagen 1:1 pierde 15% a la izquierda */}
                    <div className="w-[15%] h-full bg-rose-950/80 border-r border-rose-400/80 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-[6px] font-black uppercase text-rose-200 tracking-tighter bg-rose-900/90 px-1 py-1 rounded border border-rose-400/60 -rotate-90 shadow whitespace-nowrap">
                        ⚠️ Recorte Lateral
                      </span>
                    </div>
                    {/* Caja segura central 70% */}
                    <div className="flex-1 h-full border-2 border-dashed border-emerald-400/90 my-[10%] mx-1 rounded-lg flex flex-col justify-between p-1 relative">
                      <div className="text-[6.5px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/40 w-fit mx-auto shadow">
                        ✓ Zona Segura (70% central)
                      </div>
                      <div className="text-[6px] font-mono text-emerald-300/80 text-center">
                        Visible en Grid Vertical y Feed
                      </div>
                    </div>
                    {/* En Grid Vertical 4:5 de Instagram, una imagen 1:1 pierde 15% a la derecha */}
                    <div className="w-[15%] h-full bg-rose-950/80 border-l border-rose-400/80 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-[6px] font-black uppercase text-rose-200 tracking-tighter bg-rose-900/90 px-1 py-1 rounded border border-rose-400/60 rotate-90 shadow whitespace-nowrap">
                        ⚠️ Recorte Lateral
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-400 font-medium text-center mt-3 max-w-xs leading-tight">
            {hasImage
              ? "💡 Modo esquema: viendo la cuadrícula y estructura tipográfica sin la fotografía de fondo."
              : `💡 Vista previa en vivo: al escribir o modificar textos abajo, los verás cambiar aquí al instante. Al pulsar "Diseñar", nuestros agentes generarán la escena fotográfica de fondo.`}
          </p>
        </div>
      )}
    </div>
  );
}
