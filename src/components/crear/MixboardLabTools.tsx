"use client";

import React, { useState } from "react";
import {
  MIXBOARD_PRESETS,
  MixboardPreset,
  MixboardPresetId,
  PosterConfig,
  PosterSlideConfig,
} from "../../types/poster";

// ══════════════════════════════════════════════════════════════════════════════
// 1. BARRA ARQUITECTO DE BLUEPRINT (TYPOGRAPHY & LAYOUT GENERATOR)
// ══════════════════════════════════════════════════════════════════════════════
interface MixboardBlueprintBarProps {
  idea: string;
  setIdea: (val: string) => void;
  posterConfig: PosterConfig;
  setPosterConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  businessType?: string;
  activeProfile?: any;
  activeSlideIndex: number;
  onApplyBlueprint: (blueprint: {
    prompt: string;
    fields: {
      mainText?: string;
      sloganText?: string;
      priceText?: string;
      ctaText?: string;
      primaryColor?: string;
      postCopy?: string;
    };
    preset: MixboardPreset;
  }) => void;
}

export function MixboardBlueprintBar({
  idea,
  setIdea,
  posterConfig,
  setPosterConfig,
  businessType,
  activeProfile,
  activeSlideIndex,
  onApplyBlueprint,
}: MixboardBlueprintBarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPresetId = posterConfig.mixboardPreset || "dark_saas";
  const selectedPreset =
    MIXBOARD_PRESETS.find((p) => p.id === selectedPresetId) || MIXBOARD_PRESETS[0];

  const handleSelectPreset = (presetId: MixboardPresetId) => {
    const found = MIXBOARD_PRESETS.find((p) => p.id === presetId);
    setPosterConfig((prev) => ({
      ...prev,
      mixboardPreset: presetId,
      visualStyle: found?.visualStyle || prev.visualStyle,
      primaryColor: found?.paletteColors[3] || found?.paletteColors[1] || prev.primaryColor,
    }));
  };

  const handleGenerateBlueprint = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeSlide = posterConfig.slides?.[activeSlideIndex];
      const res = await fetch("/api/ai/mixboard-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: activeSlide?.imageExpectation || idea,
          businessType: businessType || activeProfile?.businessType || "Negocio",
          businessName: activeProfile?.name || posterConfig.businessName || "Marca",
          presetId: selectedPresetId,
          aspectRatio: posterConfig.aspectRatio === "9:16" ? "9:16" : "1:1",
          slideNumber: activeSlideIndex + 1,
          slideRole: activeSlide?.role || `Slide ${activeSlideIndex + 1}`,
          existingTexts: {
            mainText: activeSlide?.mainText || posterConfig.mainText,
            sloganText: activeSlide?.sloganText || posterConfig.sloganText,
            priceText: activeSlide?.priceText || posterConfig.priceText,
            ctaText: activeSlide?.ctaText || posterConfig.ctaText,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al estructurar blueprint.");
      }

      const data = await res.json();
      if (data.blueprintPrompt && data.extractedFields) {
        onApplyBlueprint({
          prompt: data.blueprintPrompt,
          fields: data.extractedFields,
          preset: selectedPreset,
        });
      }
    } catch (err: any) {
      console.error("[MixboardBlueprintBar] Error:", err);
      setError(err.message || "No pudimos conectar con nuestros agentes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden mb-8">
      {/* Glow ambiental */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-900/60 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-base shadow-md">
              🧪
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-white uppercase">
                  Arquitecto de Blueprint Mixboard
                </h3>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Slide {activeSlideIndex + 1}
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80 font-medium">
                Nuestros agentes transforman tu idea en un layout publicitario con tipografía y composición limpia.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest hidden sm:inline">
            Metodología Google Mixboard
          </span>
        </div>

        {/* Presets visuales */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">
            1. Elige la Dirección de Arte / Atmósfera
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {MIXBOARD_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-indigo-600/40 border-indigo-400 ring-2 ring-indigo-400/40 shadow-lg scale-102"
                      : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{preset.emoji}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-[11px] font-black text-white leading-tight">
                      {preset.label}
                    </div>
                  </div>
                  {/* Paleta miniatura */}
                  <div className="flex items-center gap-1 mt-2">
                    {preset.paletteColors.slice(0, 4).map((c, ci) => (
                      <span
                        key={ci}
                        className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input de Idea rápida & Botón disparador */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1">
          <input
            type="text"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="¿De qué trata este cartel o slide? (Ej: 50% OFF en servicios para PyMEs hasta fin de mes)"
            className="flex-1 bg-slate-950/70 border border-indigo-500/30 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-medium"
          />
          <button
            type="button"
            onClick={handleGenerateBlueprint}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>🧬</span>
            )}
            <span>{loading ? "Estructurando..." : "Estructurar Blueprint con Agentes"}</span>
          </button>
        </div>

        {error && (
          <p className="text-xs text-rose-300 font-semibold bg-rose-950/50 border border-rose-800/60 p-2.5 rounded-xl">
            ⚠️ {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. RANURA DE REFERENCIA DE ESTILO & ADAPTADOR DE COMPETENCIA EN 1 CLIC
// ══════════════════════════════════════════════════════════════════════════════
interface MixboardStyleReferenceSlotProps {
  activeSlideIndex: number;
  slideConfig?: PosterSlideConfig;
  posterStyleReferenceUrl?: string;
  slide1ImageUrl?: string;
  businessName?: string;
  businessType?: string;
  postType?: string;
  carouselCount?: number;
  idea?: string;
  presetId?: MixboardPresetId;
  onUpdateStyleReference: (url: string, traits?: ("palette" | "lighting" | "typography" | "layout")[]) => void;
  onToggleLockStyleFromSlide1: (lock: boolean) => void;
  onUploadImage?: (file: File) => Promise<string | void>;
  uploading?: boolean;
  onApplyCompetitorAdaptation?: (result: {
    prompt: string;
    competitorInsight?: string;
    fields: {
      mainText?: string;
      sloganText?: string;
      priceText?: string;
      ctaText?: string;
      primaryColor?: string;
      postCopy?: string;
    };
    adaptedSlides?: Array<{
      slideNumber: number;
      sloganText?: string;
      mainText?: string;
      ctaText?: string;
      imageExpectation?: string;
    }> | null;
  }) => void;
}

export function MixboardStyleReferenceSlot({
  activeSlideIndex,
  slideConfig,
  posterStyleReferenceUrl,
  slide1ImageUrl,
  businessName,
  businessType,
  postType = "Post",
  carouselCount = 5,
  idea = "",
  presetId = "dark_saas",
  onUpdateStyleReference,
  onToggleLockStyleFromSlide1,
  onUploadImage,
  uploading = false,
  onApplyCompetitorAdaptation,
}: MixboardStyleReferenceSlotProps) {
  const currentRefUrl = slideConfig?.styleReferenceUrl || posterStyleReferenceUrl || "";
  const isLockedFromSlide1 = Boolean(slideConfig?.lockStyleFromSlide1);
  const isSlideAboveOne = activeSlideIndex > 0;

  const [competitorNote, setCompetitorNote] = useState("");
  const [adapting, setAdapting] = useState(false);
  const [adaptError, setAdaptError] = useState<string | null>(null);
  const [competitorInsight, setCompetitorInsight] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadImage) {
      setAdaptError(null);
      const uploadedUrl = await onUploadImage(file);
      if (uploadedUrl) {
        onUpdateStyleReference(uploadedUrl);
      }
    }
  };

  const handleOpenMetaAdLibrary = () => {
    const q = competitorNote.trim() || businessType || businessName || "promocion";
    const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(q)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleAdaptToMyBrand = async () => {
    if (!currentRefUrl && !competitorNote.trim() && !idea.trim()) {
      setAdaptError("Sube una captura del post de tu competencia o escribe el gancho que quieres adaptar.");
      return;
    }

    setAdapting(true);
    setAdaptError(null);
    setCompetitorInsight(null);

    try {
      const res = await fetch("/api/ai/mixboard-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea,
          competitorHookOrNote: competitorNote.trim(),
          referenceImageUrl: currentRefUrl || undefined,
          businessName: businessName || "Mi Negocio",
          businessType: businessType || "Comercio / Servicios",
          presetId,
          postType,
          isCarouselSequence: postType === "Carrusel",
          carouselCount: postType === "Carrusel" ? carouselCount : 1,
          slideNumber: activeSlideIndex + 1,
          slideRole: slideConfig?.role || `Slide ${activeSlideIndex + 1}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No pudimos analizar y adaptar esa referencia.");
      }

      if (data.competitorInsight) {
        setCompetitorInsight(data.competitorInsight);
      }

      if (onApplyCompetitorAdaptation && data.blueprintPrompt && data.extractedFields) {
        onApplyCompetitorAdaptation({
          prompt: data.blueprintPrompt,
          competitorInsight: data.competitorInsight,
          fields: data.extractedFields,
          adaptedSlides: data.adaptedSlides || null,
        });
      }
    } catch (err: any) {
      console.error("[MixboardStyleReferenceSlot] Adapt Error:", err);
      setAdaptError(err.message || "Error al adaptar la referencia a tu marca.");
    } finally {
      setAdapting(false);
    }
  };

  return (
    <div className="bg-purple-50/60 border-2 border-purple-200/90 rounded-2xl p-4 space-y-3.5 min-w-0 w-full">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-base shrink-0 mt-0.5">🕵️‍♂️</span>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider leading-tight">
              Clonador de Estilo & Adaptador de Competencia (1 Clic)
            </h4>
            <p className="text-[10px] text-purple-800/80 font-medium leading-snug mt-0.5">
              Sube un post o anuncio ganador de tu competencia (o pega su gancho) y nuestros agentes adaptarán su estilo visual y sus textos a tu marca.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenMetaAdLibrary}
          title="Ver anuncios activos reales en la Biblioteca de Anuncios de Meta"
          className="text-[10px] font-black text-purple-900 bg-white hover:bg-purple-100 border border-purple-300 px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
        >
          <span>🔎</span>
          <span>Buscar Ads de Competencia</span>
        </button>
      </div>

      {/* Opción para Slides 2 a 5: Anclar estilo de la Lámina 1 */}
      {isSlideAboveOne && slide1ImageUrl && (
        <div className="bg-white border border-purple-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide1ImageUrl}
              alt="Slide 1 Ref"
              className="w-10 h-10 rounded-lg object-cover border border-purple-300 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-800 leading-tight truncate">
                🔗 Anclar línea gráfica del Slide 1
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">
                Crea una escena nueva para el Slide {activeSlideIndex + 1} manteniendo la paleta y tipografía del Slide 1.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleLockStyleFromSlide1(!isLockedFromSlide1)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              isLockedFromSlide1
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300"
            }`}
          >
            {isLockedFromSlide1 ? "✓ Anclado" : "Activar"}
          </button>
        </div>
      )}

      {/* Subida de captura o afiche de competencia / inspiración */}
      {!isLockedFromSlide1 && (
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {currentRefUrl ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-500 shrink-0 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentRefUrl} alt="Estilo Ref" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStyleReference("");
                    setCompetitorInsight(null);
                  }}
                  className="absolute top-0 right-0 bg-slate-900/80 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-bl-lg hover:bg-rose-600 cursor-pointer"
                  title="Quitar referencia"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-dashed border-purple-300 hover:border-purple-500 rounded-xl text-[11px] font-bold text-purple-900 cursor-pointer transition-all hover:bg-purple-50 shrink-0 shadow-2xs">
                <span>🖼️</span>
                <span>{uploading ? "Subiendo captura..." : "Subir post/afiche de competencia"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={competitorNote}
                onChange={(e) => setCompetitorNote(e.target.value)}
                placeholder="O pega aquí el gancho/texto del post que te gustó o tu oferta para adaptarlo..."
                className="w-full bg-white border border-purple-200 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all"
              />
              <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                {currentRefUrl
                  ? "✓ Captura cargada: imitaremos su estética visual. Pulsa el botón de abajo para adaptar también sus textos a tu negocio."
                  : "Puedes subir un pantallazo de cualquier anuncio ganador o escribir su gancho arriba."}
              </p>
            </div>
          </div>

          {/* Botón de 1 Clic: Extraer Gancho y Adaptar Textos a Mi Marca */}
          {onApplyCompetitorAdaptation && (
            <button
              type="button"
              onClick={handleAdaptToMyBrand}
              disabled={adapting || uploading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-purple-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {adapting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analizando estructura y adaptando a tu marca...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>
                    {postType === "Carrusel"
                      ? "Adaptar gancho, textos y láminas a mi negocio (1 Clic)"
                      : "Adaptar gancho y textos a mi negocio (1 Clic)"}
                  </span>
                </>
              )}
            </button>
          )}

          {competitorInsight && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] font-medium flex items-start justify-between gap-2 animate-in fade-in">
              <div className="flex items-start gap-1.5 min-w-0">
                <span className="shrink-0">💡</span>
                <span className="leading-snug">
                  <b className="font-black">Estructura adaptada a tu marca:</b> {competitorInsight}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCompetitorInsight(null)}
                className="text-emerald-700 hover:text-emerald-950 font-black text-xs px-1 cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
          )}

          {adaptError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold">
              ⚠️ {adaptError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. BARRA DE RETOQUE EN VIVO DEBAJO DEL PREVIEW (LIVE CANVAS RETOUCH)
// ══════════════════════════════════════════════════════════════════════════════
interface MixboardLiveRetouchBarProps {
  activeSlideIndex: number;
  currentImageUrl?: string;
  isRetouching?: boolean;
  onApplyRetouch: (instruction: string) => void;
}

export function MixboardLiveRetouchBar({
  activeSlideIndex,
  currentImageUrl,
  isRetouching = false,
  onApplyRetouch,
}: MixboardLiveRetouchBarProps) {
  const [instruction, setInstruction] = useState("");

  if (!currentImageUrl) return null;

  const quickPresets = [
    "Más contraste en los textos",
    "Fondo más oscuro y cinematográfico",
    "Destacar más el producto al centro",
    "Iluminación más cálida con acentos dorados",
    "Hacer el botón de acción más llamativo",
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!instruction.trim() || isRetouching) return;
    onApplyRetouch(instruction.trim());
    setInstruction("");
  };

  return (
    <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl p-4 text-white space-y-3 shadow-lg animate-in fade-in duration-300 mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <div>
            <h5 className="text-xs font-black uppercase tracking-wider text-indigo-300">
              Retoque en Vivo sobre esta Lámina
            </h5>
            <p className="text-[10px] text-slate-400 font-medium">
              Modifica detalles puntuales sobre este mismo diseño sin partir de cero.
            </p>
          </div>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-200 border border-indigo-700/60 shrink-0">
          Slide {activeSlideIndex + 1}
        </span>
      </div>

      {/* Chips de 1 clic */}
      <div className="flex flex-wrap gap-1.5">
        {quickPresets.map((preset, pi) => (
          <button
            key={pi}
            type="button"
            disabled={isRetouching}
            onClick={() => onApplyRetouch(preset)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/40 text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-400 transition-all cursor-pointer disabled:opacity-40"
          >
            + {preset}
          </button>
        ))}
      </div>

      {/* Input libre y botón de acción */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          disabled={isRetouching}
          placeholder="¿Qué ajuste puntual deseas aplicar? (Ej: Cambia el fondo a azul marino profundo)"
          className="flex-1 bg-slate-950 border border-indigo-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
        />
        <button
          type="submit"
          disabled={isRetouching || !instruction.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          {isRetouching ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>⚡</span>
          )}
          <span>{isRetouching ? "Ajustando..." : "Aplicar"}</span>
        </button>
      </form>
    </div>
  );
}
