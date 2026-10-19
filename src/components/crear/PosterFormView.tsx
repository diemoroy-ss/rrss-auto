"use client";

import React, { useState } from "react";
import type { PosterConfig, VisualStyle, ContactType, PosterLayout, PosterSlideConfig } from "../../types/poster";
import { DEFAULT_POSTER_SLIDES } from "../../types/poster";
import VoiceMic from "../VoiceMic";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaGoogle, FaYoutube, FaTwitter } from "react-icons/fa";
import { isPlatformAllowed } from "../../lib/plans";

const VISUAL_STYLES: { id: VisualStyle; emoji: string; desc: string }[] = [
  { id: "Moderno",     emoji: "🔷", desc: "Líneas limpias, tipografía fuerte" },
  { id: "Minimalista", emoji: "⬜", desc: "Espacio amplio y equilibrio sobrio" },
  { id: "Llamativo",   emoji: "🎨", desc: "Colores vivos y alto contraste" },
  { id: "Elegante",    emoji: "✨", desc: "Estilo premium, sobrio y cuidado" },
  { id: "Profesional", emoji: "💼", desc: "Corporativo y de alta confianza" },
  { id: "Vibrante",    emoji: "🌈", desc: "Dinámico, fresco y enérgico" },
];

const CTA_OPTIONS = [
  "¡Pide el tuyo ahora!",
  "Reserva tu hora",
  "Más información",
  "¡Aprovecha la promo!",
  "Escríbenos por WhatsApp",
  "Visítanos hoy",
];

export const CAROUSEL_DEFAULT_SLIDES: { role: string; label: string; placeholder: string; emoji: string; desc: string }[] = [
  { role: "Portada / Gancho", label: "Slide 1: Portada", placeholder: "Ej: ¿Cansado de perder ventas? Descubre esto...", emoji: "🌟", desc: "Titular impactante que frena el scroll" },
  { role: "Problema / Contexto", label: "Slide 2: Problema", placeholder: "Ej: El 80% de los negocios comete este error a diario...", emoji: "❓", desc: "Empatiza con el dolor del cliente" },
  { role: "Solución / Beneficio", label: "Slide 3: Solución", placeholder: "Ej: Con nuestro sistema automatizas todo en minutos...", emoji: "💡", desc: "Presenta tu producto o servicio" },
  { role: "Detalles / Características", label: "Slide 4: Detalles", placeholder: "Ej: Soporte 24/7, sincronización en vivo y sin letra chica...", emoji: "🔍", desc: "Diferenciadores y beneficios clave" },
  { role: "Oferta + Llamado a la Acción", label: "Slide 5: Oferta + CTA", placeholder: "Ej: ¡Solo por hoy 50% OFF! Escríbenos por WhatsApp...", emoji: "🎯", desc: "Llamado a la acción claro o WhatsApp" },
];

interface PosterFormViewProps {
  userPlan?: string;
  posterConfig: PosterConfig;
  setPosterConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  idea: string;
  setIdea: (val: string) => void;
  imageExpectation: string;
  setImageExpectation: (val: string) => void;
  postText: string;
  setPostText: (val: string) => void;
  baseImageUrl?: string;
  setBaseImageUrl?: (val: string) => void;
  onUploadBaseImage?: (file: File) => Promise<void>;
  uploadingBaseImage?: boolean;
  networks: {
    facebook: boolean;
    instagram: boolean;
    linkedin: boolean;
    tiktok: boolean;
    googleBusiness: boolean;
    youtube: boolean;
    x: boolean;
  };
  setNetworks: (val: any) => void;
  hasFb: boolean;
  hasIg: boolean;
  hasLi: boolean;
  hasTt: boolean;
  hasGbp?: boolean;
  hasYt?: boolean;
  hasX?: boolean;
  needsConnection: boolean;
  activeProfile?: any;
  userLogo?: string;
  previewLoading: boolean;
  improveLoading: boolean;
  handleGeneratePreview: () => void;
  handleImproveWithAI: () => void;
  isAdmin?: boolean;
  catalogoItems?: any[];
  selectedCatalogoItem?: any;
  setSelectedCatalogoItem?: (item: any) => void;
  postType?: string;
  carouselCount?: number;
  activeSlideIndex?: number;
  setActiveSlideIndex?: (idx: number) => void;
}

export default function PosterFormView({
  userPlan,
  posterConfig,
  setPosterConfig,
  idea,
  setIdea,
  imageExpectation,
  setImageExpectation,
  postText,
  setPostText,
  baseImageUrl,
  setBaseImageUrl,
  onUploadBaseImage,
  uploadingBaseImage,
  networks,
  setNetworks,
  hasFb,
  hasIg,
  hasLi,
  hasTt,
  hasGbp,
  hasYt,
  hasX,
  needsConnection,
  activeProfile,
  userLogo,
  previewLoading,
  improveLoading,
  handleGeneratePreview,
  handleImproveWithAI,
  isAdmin,
  catalogoItems = [],
  selectedCatalogoItem,
  setSelectedCatalogoItem,
  postType = "Post",
  carouselCount = 5,
  activeSlideIndex = 0,
  setActiveSlideIndex,
}: PosterFormViewProps) {
  const [showCustomCta, setShowCustomCta] = useState(false);
  const [customCta, setCustomCta] = useState("");
  const [internalSlideIdx, setInternalSlideIdx] = useState(0);

  const currentSlideIdx = setActiveSlideIndex ? activeSlideIndex : internalSlideIdx;
  const setCurrentSlideIdx = (idx: number) => {
    if (setActiveSlideIndex) setActiveSlideIndex(idx);
    else setInternalSlideIdx(idx);
  };

  const update = <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) => {
    setPosterConfig((prev) => ({ ...prev, [key]: value, enabled: true }));
  };

  const updateSlideField = (field: 'mainText' | 'priceText' | 'sloganText' | 'ctaText', value: string) => {
    setPosterConfig((prev) => {
      const existingSlides = prev.slides && prev.slides.length > 0 ? [...prev.slides] : [...DEFAULT_POSTER_SLIDES];
      while (existingSlides.length <= currentSlideIdx) {
        existingSlides.push({
          slideNumber: existingSlides.length + 1,
          role: CAROUSEL_DEFAULT_SLIDES[existingSlides.length]?.role || `Slide ${existingSlides.length + 1}`,
          mainText: "",
          priceText: "",
          sloganText: "",
          ctaText: "",
        });
      }
      existingSlides[currentSlideIdx] = {
        ...existingSlides[currentSlideIdx],
        [field]: value,
      };
      return {
        ...prev,
        [field]: value,
        slides: existingSlides,
        enabled: true,
      };
    });
  };

  const handleSelectSlide = (idx: number) => {
    setCurrentSlideIdx(idx);
    const targetSlide = posterConfig.slides?.[idx];
    if (targetSlide) {
      setPosterConfig((prev) => ({
        ...prev,
        activeSlideIndex: idx,
        mainText: targetSlide.mainText ?? "",
        priceText: targetSlide.priceText ?? "",
        sloganText: targetSlide.sloganText ?? "",
        ctaText: targetSlide.ctaText || prev.ctaText,
      }));
    }
  };

  const handleCtaClick = (opt: string) => {
    setShowCustomCta(false);
    if (postType === "Carrusel") {
      updateSlideField("ctaText", opt);
    } else {
      update("ctaText", opt);
    }
  };

  const handleCustomCta = (val: string) => {
    setCustomCta(val);
    if (postType === "Carrusel") {
      updateSlideField("ctaText", val);
    } else {
      update("ctaText", val);
    }
  };

  const maxChars = networks.x ? 280 : 2200;
  const isOverLimit = postText.length > maxChars;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Selector de Producto del Catálogo (si tiene) */}
      {catalogoItems.length > 0 && setSelectedCatalogoItem && (
        <div className="bg-white border-2 border-amber-200/80 rounded-2xl p-5 shadow-xs">
          <label className="block text-xs font-black text-amber-900 uppercase tracking-wider mb-2">
            🛍️ Cargar datos desde tu Catálogo (opcional)
          </label>
          <select
            value={selectedCatalogoItem?.id || ""}
            onChange={(e) => {
              const found = catalogoItems.find((i: any) => i.id === e.target.value);
              setSelectedCatalogoItem(found || null);
              if (found) {
                if (found.name) {
                  update("mainText", found.name);
                  if (!idea) setIdea(found.name);
                }
                if (found.offerPrice || found.price) {
                  update("includePrice", true);
                  update("priceText", found.offerPrice ? `PROMO ${found.offerPrice}` : found.price);
                }
                if (found.imageUrl && setBaseImageUrl) {
                  setBaseImageUrl(found.imageUrl);
                }
              }
            }}
            className="w-full border-2 border-slate-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none bg-white"
          >
            <option value="">— Ninguno (crear afiche desde cero) —</option>
            {catalogoItems.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.type === "producto" ? "📦" : "⚙️"} {item.name}
                {item.offerPrice ? ` · PROMO ${item.offerPrice}` : item.price ? ` · ${item.price}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Fila Superior: Composición (Izquierda) vs Foto Real + Copy (Derecha) */}
      <div className="grid lg:grid-cols-12 gap-8 items-stretch">
        {/* COLUMNA IZQUIERDA: Composición y Dirección de Arte (mismo alto total que derecha) */}
        <div className="lg:col-span-6 flex flex-col w-full">
          {/* Card 1: Dirección de Arte y Composición Espacial */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex-1 flex flex-col justify-between h-full space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">📐</span>
                              <div>
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                  Composición y Dirección de Arte
                                </h4>
                                <p className="text-[11px] font-medium text-slate-500">
                                  Disposición espacial del diseño para balancear texto y producto
                                </p>
                              </div>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                              Diseño Visual
                            </span>
                          </div>
              
                          {/* Layouts disponibles */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => update("layout", "auto")}
                              className={`p-3 rounded-2xl border text-left transition-all ${
                                !posterConfig.layout || posterConfig.layout === "auto"
                                  ? "border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                                  : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-base">🧠</span>
                                <span className="text-xs font-black">Automático</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium leading-tight">
                                Nuestros agentes eligen el mejor encuadre según tu producto.
                              </p>
                            </button>
              
                            <button
                              type="button"
                              onClick={() => update("layout", "split_left")}
                              className={`p-3 rounded-2xl border text-left transition-all ${
                                posterConfig.layout === "split_left"
                                  ? "border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                                  : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-base">📐</span>
                                <span className="text-xs font-black">Split Lateral</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium leading-tight">
                                Texto nítido a la izquierda y producto despejado a la derecha.
                              </p>
                            </button>
              
                            <button
                              type="button"
                              onClick={() => update("layout", "top_banner")}
                              className={`p-3 rounded-2xl border text-left transition-all ${
                                posterConfig.layout === "top_banner"
                                  ? "border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                                  : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-base">📌</span>
                                <span className="text-xs font-black">Cabecera Superior</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium leading-tight">
                                Titular llamativo arriba y escena fotográfica en el centro.
                              </p>
                            </button>
              
                            <button
                              type="button"
                              onClick={() => update("layout", "recipe_ingredients")}
                              className={`p-3 rounded-2xl border text-left transition-all ${
                                posterConfig.layout === "recipe_ingredients"
                                  ? "border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                                  : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-base">🥗</span>
                                <span className="text-xs font-black">Ficha Informativa</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium leading-tight">
                                Encuadre cenital con espacio para puntos y características.
                              </p>
                            </button>
                          </div>
              
                          {/* Estilo Visual */}
                          <div className="pt-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                              Estilo Visual del Cartel
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {VISUAL_STYLES.map((style) => {
                                const isSelected = posterConfig.visualStyle === style.id;
                                return (
                                  <button
                                    key={style.id}
                                    type="button"
                                    onClick={() => update("visualStyle", style.id)}
                                    className={`p-2.5 rounded-xl border text-center transition-all ${
                                      isSelected
                                        ? "border-amber-500 bg-amber-50/80 text-amber-950 font-black shadow-xs ring-1 ring-amber-400/30"
                                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300 font-bold"
                                    }`}
                                  >
                                    <span className="text-base block mb-0.5">{style.emoji}</span>
                                    <span className="text-xs block leading-tight">{style.id}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
            </div>

            {/* Banner al pie para equilibrar la altura con la columna derecha */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-2xl flex items-start gap-3 mt-4">
              <span className="text-lg shrink-0">🎨</span>
              <div className="space-y-0.5">
                <p className="text-[11px] font-black text-amber-950">Dirección de Arte Asistida</p>
                <p className="text-[10px] text-amber-900 leading-relaxed font-medium">
                  Nuestros agentes aplican jerarquía tipográfica, proporciones áureas y contraste cromático para que tu afiche capte la atención en el feed en menos de 2 segundos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Foto Real de tu Producto + Copy para el Post en Redes */}
        <div className="lg:col-span-6 space-y-6 w-full flex flex-col justify-between">
          {/* Card 2: Foto Real del Producto o Escena Publicitaria */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">📸</span>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                              Foto Real de tu Producto (Opcional)
                            </h4>
                            <p className="text-[11px] font-medium text-slate-500">
                              Sube tu producto o deja que nuestros agentes diseñen la escena fotográfica
                            </p>
                          </div>
                        </div>
                        {baseImageUrl && setBaseImageUrl && (
                          <button
                            type="button"
                            onClick={() => setBaseImageUrl("")}
                            className="text-[11px] text-rose-600 font-bold hover:underline"
                          >
                            Quitar foto
                          </button>
                        )}
                      </div>
          
                      {baseImageUrl ? (
                        <div className="flex items-center gap-3.5 p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl">
                          <img
                            src={baseImageUrl}
                            alt="Producto base"
                            className="w-16 h-16 rounded-xl object-cover border border-amber-200 shrink-0 shadow-xs"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-amber-950 truncate">Foto del producto activa</p>
                            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                              Nuestros agentes montarán el afiche y la composición alrededor de esta imagen.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-amber-50 border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-2xl text-xs font-bold text-slate-700 hover:text-amber-800 transition-all w-full shadow-inner">
                            <span>{uploadingBaseImage ? "⏳ Subiendo imagen..." : "📤 Subir foto de tu producto"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingBaseImage}
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (onUploadBaseImage) await onUploadBaseImage(file);
                              }}
                            />
                          </label>
                          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-[11px] text-slate-500 font-medium leading-relaxed">
                            💡 <b>¿No tienes una foto a mano?</b> No te preocupes. Nuestros agentes generarán una escena fotográfica de alta resolución basada en la descripción que indiques abajo.
                          </div>
                        </div>
                      )}
          
                      {/* Campo: Idea o Escena Visual del Afiche */}
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-black text-slate-800">
                            💡 ¿Cómo imaginas la escena o ambiente publicitario?
                          </label>
                          <VoiceMic
                            onResult={(text) => {
                              const nextVal = idea ? `${idea} ${text}` : text;
                              setIdea(nextVal);
                              setImageExpectation(nextVal);
                            }}
                            className="scale-85"
                          />
                        </div>
                        <textarea
                          value={idea || imageExpectation || ""}
                          onChange={(e) => {
                            setIdea(e.target.value);
                            setImageExpectation(e.target.value);
                          }}
                          placeholder="Ej: Hamburguesa gourmet con queso cheddar derretido sobre tabla de madera oscura, iluminación cálida de estudio y fondo elegante..."
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl outline-none text-xs font-semibold text-slate-800 resize-none min-h-[90px] focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                        />
                      </div>
                    </div>
          
                    {/* Card 3: Copy Persuasivo para Redes y Botón de Generación */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                            Copy para el Post en Redes
                          </h4>
                          <p className="text-[11px] font-medium text-slate-500">
                            El texto persuasivo que acompañará al afiche en Facebook e Instagram
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleImproveWithAI}
                          disabled={improveLoading}
                          className="bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider disabled:opacity-50 transition-all shadow-xs shrink-0"
                        >
                          {improveLoading ? "Redactando..." : "✨ Redactar con Agentes"}
                        </button>
                      </div>
          
                      <div
                        className={`border rounded-2xl bg-slate-50/60 overflow-hidden flex flex-col focus-within:border-amber-500 focus-within:bg-white transition-all ${
                          isOverLimit ? "border-rose-300" : "border-slate-200"
                        }`}
                      >
                        <textarea
                          value={postText}
                          onChange={(e) => setPostText(e.target.value)}
                          placeholder="Escribe el copy o pulsa 'Redactar con Agentes' para que nuestro equipo redacte el mensaje comercial con hashtags y llamado a la acción..."
                          className={`w-full bg-transparent px-4 py-3 text-xs outline-none resize-none min-h-[110px] font-semibold leading-relaxed ${
                            isOverLimit ? "text-rose-600" : "text-slate-800"
                          }`}
                          maxLength={maxChars + 500}
                        />
                        <div className="px-4 py-2 bg-white/70 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <VoiceMic
                            onResult={(text) => setPostText(postText + (postText ? " " : "") + text)}
                            className="scale-75"
                          />
                          <span className={isOverLimit ? "text-rose-600 font-bold" : "text-slate-400 font-medium"}>
                            {postText.length} / {maxChars}
                          </span>
                        </div>
                      </div>
                    </div>
        </div>
      </div>

      {/* Fila Inferior: Card Textos del Cartel (A TODO EL ANCHO) */}
      <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">✍️</span>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                            Textos del Cartel {postType === "Carrusel" ? `(Slide ${currentSlideIdx + 1} de ${carouselCount || 5})` : "(en la imagen)"}
                          </h4>
                          <p className="text-[11px] font-medium text-slate-500">
                            {postType === "Carrusel" 
                              ? "Define los textos específicos para cada diapositiva de tu carrusel"
                              : "Elementos que irán impresos en el afiche publicitario"}
                          </p>
                        </div>
                      </div>
                      {postType === "Carrusel" && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                          Diapositiva {currentSlideIdx + 1}/{carouselCount || 5}
                        </span>
                      )}
                    </div>

        {/* Selector de Diapositiva 1 por 1 para Carrusel */}
                    {postType === "Carrusel" && (
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                            <span>📑</span> Selecciona la diapositiva a editar:
                          </span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                            {CAROUSEL_DEFAULT_SLIDES[currentSlideIdx]?.role || `Slide ${currentSlideIdx + 1}`}
                          </span>
                        </div>
        
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                          {Array.from({ length: carouselCount || 5 }).map((_, idx) => {
                            const isCurrent = currentSlideIdx === idx;
                            const roleInfo = CAROUSEL_DEFAULT_SLIDES[idx] || { emoji: "📑", label: `Slide ${idx + 1}` };
                            const hasCustomText = Boolean(posterConfig.slides?.[idx]?.mainText);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectSlide(idx)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                  isCurrent
                                    ? "bg-amber-600 text-white shadow-sm scale-102"
                                    : "bg-white text-slate-700 border border-slate-200 hover:border-amber-300"
                                }`}
                              >
                                <span>{roleInfo.emoji}</span>
                                <span>Slide {idx + 1}</span>
                                {hasCustomText && <span className={isCurrent ? "text-amber-200" : "text-emerald-500"}>●</span>}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-amber-800 font-medium">
                          💡 <b>{CAROUSEL_DEFAULT_SLIDES[currentSlideIdx]?.label}:</b> {CAROUSEL_DEFAULT_SLIDES[currentSlideIdx]?.desc}
                        </p>
                      </div>
                    )}

        {/* Subgrid de 2 Columnas para los Campos de Texto a Todo el Ancho */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Subcolumna 1: Mensaje Principal y Marca */}
          <div className="space-y-4">
            {/* Titular Principal */}
                        <div>
                          <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center justify-between">
                            <span>📝 Titular {postType === "Carrusel" ? `del Slide ${currentSlideIdx + 1}` : "Principal del Cartel"} *</span>
                            <span className="text-[10px] text-amber-700 font-bold">Impreso en el diseño</span>
                          </label>
                          <input
                            type="text"
                            value={posterConfig.mainText || ""}
                            onChange={(e) => {
                              if (postType === "Carrusel") {
                                updateSlideField("mainText", e.target.value);
                              } else {
                                update("mainText", e.target.value);
                              }
                            }}
                            placeholder={
                              postType === "Carrusel"
                                ? CAROUSEL_DEFAULT_SLIDES[currentSlideIdx]?.placeholder || "Titular de esta diapositiva..."
                                : "Ej: GRAN INAUGURACIÓN, 50% OFF, MENÚ EJECUTIVO..."
                            }
                            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none text-xs font-black text-slate-800 focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                          />
                        </div>

            {/* Slogan */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                          <label className="text-xs font-black text-slate-800 flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={posterConfig.includeSlogan}
                              onChange={(e) => update("includeSlogan", e.target.checked)}
                              className="w-4 h-4 accent-amber-600 rounded"
                            />
                            <span>💬 Slogan o Frase Gancho</span>
                          </label>
                          {posterConfig.includeSlogan && (
                            <input
                              type="text"
                              value={posterConfig.sloganText || ""}
                              onChange={(e) => {
                                if (postType === "Carrusel") {
                                  updateSlideField("sloganText", e.target.value);
                                } else {
                                  update("sloganText", e.target.value);
                                }
                              }}
                              placeholder="Ej: Calidad garantizada en cada bocado"
                              className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl outline-none text-xs font-bold text-slate-800 focus:border-amber-500 shadow-xs"
                            />
                          )}
                        </div>

            {/* Nombre del Negocio y Logo */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={posterConfig.includeBusinessName}
                              onChange={(e) => {
                                update("includeBusinessName", e.target.checked);
                                if (e.target.checked && activeProfile?.name) {
                                  update("businessName", activeProfile.name);
                                }
                              }}
                              className="w-4 h-4 accent-amber-600 rounded shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-black text-slate-800 block truncate">🏢 Nombre Comercial</span>
                              <span className="text-[9px] text-slate-500 block truncate">{posterConfig.businessName || activeProfile?.name || "Tu marca"}</span>
                            </div>
                          </label>
            
                          <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={posterConfig.includeLogo}
                              onChange={(e) => update("includeLogo", e.target.checked)}
                              className="w-4 h-4 accent-amber-600 rounded shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-black text-slate-800 block truncate">🖼️ Incluir Logo</span>
                              <span className="text-[9px] text-slate-500 block truncate">
                                {userLogo || activeProfile?.logoUrl ? "Logo disponible" : "Desde perfil"}
                              </span>
                            </div>
                          </label>
                        </div>
          </div>

          {/* Subcolumna 2: Oferta, Llamado a la Acción y Contacto */}
          <div className="space-y-4">
            {/* Precio o Promoción */}
                        <div className="p-3.5 bg-amber-50/50 border border-amber-200/70 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-amber-950 flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={posterConfig.includePrice}
                                onChange={(e) => update("includePrice", e.target.checked)}
                                className="w-4 h-4 accent-amber-600 rounded"
                              />
                              <span>💲 Incluir Precio o Promoción Destacada</span>
                            </label>
                          </div>
                          {posterConfig.includePrice && (
                            <input
                              type="text"
                              value={posterConfig.priceText || ""}
                              onChange={(e) => {
                                if (postType === "Carrusel") {
                                  updateSlideField("priceText", e.target.value);
                                } else {
                                  update("priceText", e.target.value);
                                }
                              }}
                              placeholder="Ej: $9.990 · 2x1 Solo Hoy · Desde $15.000"
                              className="w-full bg-white border border-amber-300 px-3.5 py-2.5 rounded-xl outline-none text-xs font-bold text-slate-800 focus:border-amber-500 shadow-xs"
                            />
                          )}
                        </div>

            {/* Llamado a la Acción (CTA) */}
                        <div>
                          <label className="block text-xs font-black text-slate-800 mb-2">
                            📣 Llamado a la Acción (CTA en el Afiche)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {CTA_OPTIONS.map((opt) => {
                              const isSelected = !showCustomCta && posterConfig.ctaText === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleCtaClick(opt)}
                                  className={`px-3 py-2 rounded-xl border text-[11px] font-bold text-left transition-all ${
                                    isSelected
                                      ? "border-amber-500 bg-amber-50 text-amber-900 shadow-xs ring-1 ring-amber-400/20"
                                      : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
            
                          {/* Botón y campo de CTA personalizado */}
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => setShowCustomCta(!showCustomCta)}
                              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                                showCustomCta
                                  ? "border-amber-500 bg-amber-50 text-amber-900"
                                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              ✏️ Otro texto personalizado
                            </button>
                            {showCustomCta && (
                              <input
                                type="text"
                                value={customCta}
                                onChange={(e) => handleCustomCta(e.target.value)}
                                placeholder="Escribe tu llamado a la acción..."
                                className="mt-2 w-full bg-white border border-amber-300 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none"
                              />
                            )}
                          </div>
                        </div>

            {/* Datos de Contacto */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
                          <label className="text-xs font-black text-slate-800 flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={posterConfig.includeContact}
                              onChange={(e) => {
                                update("includeContact", e.target.checked);
                                if (e.target.checked) {
                                  if (activeProfile?.phone) {
                                    update("contactType", "whatsapp");
                                    update("contactValue", activeProfile.phone);
                                  } else if (activeProfile?.email) {
                                    update("contactType", "email");
                                    update("contactValue", activeProfile.email);
                                  }
                                }
                              }}
                              className="w-4 h-4 accent-amber-600 rounded"
                            />
                            <span>📱 Datos de Contacto en el Cartel</span>
                          </label>
            
                          {posterConfig.includeContact && (
                            <div className="flex gap-2">
                              <select
                                value={posterConfig.contactType || "whatsapp"}
                                onChange={(e) => update("contactType", e.target.value as ContactType)}
                                className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none"
                              >
                                <option value="whatsapp">WhatsApp</option>
                                <option value="phone">Teléfono</option>
                                <option value="email">Email</option>
                              </select>
                              <input
                                type="text"
                                value={posterConfig.contactValue || ""}
                                onChange={(e) => update("contactValue", e.target.value)}
                                placeholder="+56 9 1234 5678"
                                className="flex-1 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none"
                              />
                            </div>
                          )}
                        </div>

            {/* Color de Acento */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <span>🎨</span> Color principal de acento
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={posterConfig.primaryColor || "#f59e0b"}
                              onChange={(e) => update("primaryColor", e.target.value)}
                              className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
                            />
                            <span className="text-[11px] font-mono font-bold text-slate-500">
                              {posterConfig.primaryColor || "#f59e0b"}
                            </span>
                          </div>
                        </div>
          </div>
        </div>
      </div>

      {/* Botón Principal de Generación del Cartel (A todo el ancho para mantener ambas columnas cuadradas) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => handleGeneratePreview()}
          disabled={
            previewLoading ||
            (!idea.trim() &&
              !posterConfig.mainText?.trim() &&
              !imageExpectation.trim() &&
              !postText.trim())
          }
          className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 px-6 rounded-2xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {previewLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Diseñando {postType === "Carrusel" ? `Carrusel de ${carouselCount || 5} Afiches` : "Afiche Publicitario"}...</span>
            </>
          ) : (
            <>
              <span className="text-lg">🎯</span>
              <span>{postType === "Carrusel" ? `Diseñar Carrusel de ${carouselCount || 5} Afiches` : "Diseñar Afiche Publicitario"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
