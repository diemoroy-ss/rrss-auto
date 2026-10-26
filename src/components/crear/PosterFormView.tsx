"use client";

import React, { useState, useRef } from "react";
import type { PosterConfig, VisualStyle, ContactType, PosterLayout, PosterSlideConfig } from "../../types/poster";
import { DEFAULT_POSTER_SLIDES } from "../../types/poster";
import PosterTemplatePreview from "./PosterTemplatePreview";
import {
  MixboardBlueprintBar,
  MixboardStyleReferenceSlot,
  MixboardLiveRetouchBar,
} from "./MixboardLabTools";
import VoiceMic from "../VoiceMic";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaGoogle, FaYoutube, FaTwitter } from "react-icons/fa";
import { isPlatformAllowed } from "../../lib/plans";
import { parsePromptTypographyAndDesign, extractSceneAndTypography } from "../../lib/poster-prompt-parser";

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
  handleGeneratePreview: (forceReplan?: boolean, options?: { singleSlideOnly?: boolean; slideIndex?: number }) => void;
  handleImproveWithAI: () => void;
  isAdmin?: boolean;
  catalogoItems?: any[];
  selectedCatalogoItem?: any;
  setSelectedCatalogoItem?: (item: any) => void;
  postType?: string;
  carouselCount?: number;
  activeSlideIndex?: number;
  setActiveSlideIndex?: (idx: number) => void;
  previewSlides?: { url: string; copy?: string }[];
  onOpenEditor?: (slideIdx?: number) => void;
  onOpenPostModal?: () => void;
  isReadyToPost?: boolean;
  isLabMode?: boolean;
  onApplyLiveRetouch?: (slideIdx: number, instruction: string) => void;
  onUploadStyleReference?: (file: File) => Promise<string | void>;
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
  previewSlides = [],
  onOpenEditor,
  onOpenPostModal,
  isReadyToPost = false,
  isLabMode = false,
  onApplyLiveRetouch,
  onUploadStyleReference,
}: PosterFormViewProps) {
  const [showCustomCta, setShowCustomCta] = useState(false);
  const [customCta, setCustomCta] = useState("");
  const [internalSlideIdx, setInternalSlideIdx] = useState(0);
  const [extractedNotice, setExtractedNotice] = useState<string | null>(null);
  const [slideValidationError, setSlideValidationError] = useState<string | null>(null);
  const sceneTextareaRef = useRef<HTMLTextAreaElement>(null);

  const currentSlideIdx = setActiveSlideIndex ? activeSlideIndex : internalSlideIdx;
  const setCurrentSlideIdx = (idx: number) => {
    setSlideValidationError(null);
    if (setActiveSlideIndex) setActiveSlideIndex(idx);
    else setInternalSlideIdx(idx);
  };

  /**
   * Valida si el usuario subió una imagen de producto o escribió la descripción de la escena
   * antes de proceder al diseño del slide o afiche.
   */
  const validateCanDesign = (options?: { singleSlideOnly?: boolean; slideIndex?: number }): boolean => {
    const isSingle = Boolean(options?.singleSlideOnly);
    const targetIdx = options?.slideIndex ?? currentSlideIdx;

    if (postType === "Carrusel" && isSingle) {
      const targetSlide = posterConfig.slides?.[targetIdx];
      const slideBaseImg = targetSlide?.baseImageUrl || (targetIdx === 0 ? baseImageUrl : "");
      const isUsingSlide1 = Boolean(targetSlide?.useSlide1Image && (posterConfig.slides?.[0]?.imageUrl || posterConfig.slides?.[0]?.baseImageUrl || baseImageUrl));
      const hasImg = Boolean(slideBaseImg || isUsingSlide1);
      const slideDesc = targetSlide?.imageExpectation?.trim() || (targetIdx === 0 ? (imageExpectation?.trim() || idea?.trim()) : "");
      const hasDesc = Boolean(slideDesc);

      if (!hasImg && !hasDesc) {
        const msg = `Para diseñar el Slide ${targetIdx + 1}, debes subir una imagen de tu producto o escribir una breve descripción de la escena en "¿Cómo imaginas la escena?".`;
        setSlideValidationError(msg);
        sceneTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        sceneTextareaRef.current?.focus();
        return false;
      }
    } else if (postType === "Carrusel" && !isSingle) {
      const hasAnyImg = Boolean(baseImageUrl || posterConfig.slides?.some((s) => Boolean(s.baseImageUrl)));
      const hasAnyDesc = Boolean(imageExpectation?.trim() || idea?.trim() || posterConfig.slides?.some((s) => Boolean(s.imageExpectation?.trim())));

      if (!hasAnyImg && !hasAnyDesc) {
        const msg = "Para diseñar las 5 imágenes del carrusel, debes subir una imagen de tu producto o escribir la idea/descripción de la escena que imaginas.";
        setSlideValidationError(msg);
        sceneTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        sceneTextareaRef.current?.focus();
        return false;
      }
    } else {
      // Post individual / Historia / Reel
      const hasImg = Boolean(baseImageUrl);
      const hasDesc = Boolean(imageExpectation?.trim() || idea?.trim());

      if (!hasImg && !hasDesc) {
        const msg = "Para diseñar el afiche, debes subir una imagen de tu producto o escribir una descripción de la escena publicitaria que imaginas.";
        setSlideValidationError(msg);
        sceneTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        sceneTextareaRef.current?.focus();
        return false;
      }
    }

    setSlideValidationError(null);
    return true;
  };

  const update = <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) => {
    setPosterConfig((prev) => ({ ...prev, [key]: value, enabled: true }));
  };

  const updateSlideField = (field: keyof PosterSlideConfig, value: any) => {
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
        ...(currentSlideIdx === 0 ? { [field]: value } : {}),
        slides: existingSlides,
        enabled: true,
      };
    });
  };

  const currentTransforms = postType === "Carrusel"
    ? (posterConfig.slides?.[currentSlideIdx]?.elementTransforms || posterConfig.elementTransforms)
    : posterConfig.elementTransforms;

  const handleUpdateTransforms = (transforms: any) => {
    if (postType === "Carrusel") {
      updateSlideField("elementTransforms", transforms);
    }
    update("elementTransforms", transforms);
  };

  const updateElementTransform = (
    key: "title" | "slogan" | "price" | "cta" | "brand" | "contact",
    partial: any
  ) => {
    const activeTransforms = currentTransforms || {};
    const defaultSizes: Record<string, number> = { title: 14, slogan: 9.5, price: 11, cta: 10, brand: 8.5, contact: 8 };
    const current = activeTransforms[key] || { x: 50, y: 50, fontSize: defaultSizes[key] || 12, rotation: 0 };
    const updated = {
      ...activeTransforms,
      [key]: {
        ...current,
        ...partial,
      },
    };
    handleUpdateTransforms(updated);
  };

  const handleApplyExtractedTypography = (text: string, sourceField?: 'postText' | 'imageExpectation' | 'idea') => {
    const extracted = extractSceneAndTypography(text);
    const parsed = extracted.parsedTypography;
    if (!parsed) return;

    const detectedParts: string[] = [];
    if (parsed.mainText) detectedParts.push(`Titular ("${parsed.mainText.length > 30 ? parsed.mainText.slice(0, 27) + '...' : parsed.mainText}")`);
    if (parsed.sloganText) detectedParts.push(`Slogan ("${parsed.sloganText.length > 25 ? parsed.sloganText.slice(0, 22) + '...' : parsed.sloganText}")`);
    if (parsed.priceText) detectedParts.push(`Precio ("${parsed.priceText}")`);
    if (parsed.ctaText) detectedParts.push(`CTA ("${parsed.ctaText}")`);
    if (parsed.primaryColor) detectedParts.push(`Color (${parsed.primaryColor})`);

    if (detectedParts.length === 0) return;

    if (parsed.ctaText) {
      if (!CTA_OPTIONS.includes(parsed.ctaText)) {
        setShowCustomCta(true);
        setCustomCta(parsed.ctaText);
      } else {
        setShowCustomCta(false);
      }
    } else {
      setShowCustomCta(false);
      setCustomCta("");
    }

    // Si se detectó que es un prompt de afiche completo, cargar la escena visual limpia en imageExpectation e idea
    if (extracted.isPosterPrompt && extracted.sceneDescription) {
      const cleanScene = extracted.sceneDescription;
      if (postType === "Carrusel") {
        updateSlideField("imageExpectation", cleanScene);
      }
      setIdea(cleanScene);
      setImageExpectation(cleanScene);

      // Si se pegó en postText, limpiar el prompt técnico en inglés y dejar un copy comercial en español
      if (sourceField === 'postText') {
        const headline = parsed.mainText || "";
        const slogan = parsed.sloganText || "";
        const cta = parsed.ctaText || "";
        const draftCaption = [headline, slogan, cta].filter(Boolean).join(" · ");
        setPostText(draftCaption);
      }
    }

    if (postType === "Carrusel") {
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
        const updatedSlide = { ...existingSlides[currentSlideIdx] };
        if (parsed.mainText) {
          updatedSlide.mainText = parsed.mainText;
          updatedSlide.includeMainText = true;
        }
        if (parsed.sloganText) {
          updatedSlide.sloganText = parsed.sloganText;
          updatedSlide.includeSlogan = true;
        }
        if (parsed.priceText) {
          updatedSlide.priceText = parsed.priceText;
          updatedSlide.includePrice = true;
        }
        if (parsed.ctaText) {
          updatedSlide.ctaText = parsed.ctaText;
          updatedSlide.includeCta = true;
        }

        existingSlides[currentSlideIdx] = updatedSlide;

        return {
          ...prev,
          mainText: parsed.mainText ?? prev.mainText,
          includeMainText: parsed.includeMainText ?? (parsed.mainText ? true : prev.includeMainText),
          sloganText: parsed.sloganText ?? prev.sloganText,
          includeSlogan: parsed.includeSlogan ?? (parsed.sloganText ? true : prev.includeSlogan),
          priceText: parsed.priceText ?? prev.priceText,
          includePrice: parsed.includePrice ?? (parsed.priceText ? true : prev.includePrice),
          ctaText: parsed.ctaText ?? prev.ctaText,
          includeCta: parsed.includeCta ?? (parsed.ctaText ? true : prev.includeCta),
          primaryColor: parsed.primaryColor ?? prev.primaryColor,
          slides: existingSlides,
          enabled: true,
        };
      });
    } else {
      setPosterConfig((prev) => ({
        ...prev,
        mainText: parsed.mainText ?? prev.mainText,
        includeMainText: parsed.includeMainText ?? (parsed.mainText ? true : prev.includeMainText),
        sloganText: parsed.sloganText ?? prev.sloganText,
        includeSlogan: parsed.includeSlogan ?? (parsed.sloganText ? true : prev.includeSlogan),
        priceText: parsed.priceText ?? prev.priceText,
        includePrice: parsed.includePrice ?? (parsed.priceText ? true : prev.includePrice),
        ctaText: parsed.ctaText ?? prev.ctaText,
        includeCta: parsed.includeCta ?? (parsed.ctaText ? true : prev.includeCta),
        primaryColor: parsed.primaryColor ?? prev.primaryColor,
        enabled: true,
      }));
    }

    setExtractedNotice(
      extracted.isPosterPrompt
        ? `✨ Prompt de afiche detectado: Escena visual y textos configurados automáticamente (${detectedParts.join(" · ")})`
        : `Textos y estilo detectados en el prompt: ${detectedParts.join(" · ")}`
    );
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
        includeMainText: targetSlide.includeMainText ?? Boolean(targetSlide.mainText),
        includeSlogan: targetSlide.includeSlogan ?? Boolean(targetSlide.sloganText),
        includePrice: targetSlide.includePrice ?? Boolean(targetSlide.priceText),
        includeCta: targetSlide.includeCta ?? Boolean(targetSlide.ctaText),
        includeBusinessName: targetSlide.includeBusinessName ?? prev.includeBusinessName,
        includeLogo: targetSlide.includeLogo ?? prev.includeLogo,
      }));
      setImageExpectation(targetSlide.imageExpectation ?? "");
      if (setBaseImageUrl) {
        setBaseImageUrl(targetSlide.baseImageUrl || "");
      }
    } else {
      setImageExpectation("");
      if (setBaseImageUrl) {
        setBaseImageUrl("");
      }
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

  const currentSlideMainText = postType === "Carrusel"
    ? (posterConfig.slides?.[currentSlideIdx]?.mainText ?? (currentSlideIdx === 0 ? (posterConfig.mainText || "") : ""))
    : (posterConfig.mainText || "");

  const currentSlideSloganText = postType === "Carrusel"
    ? (posterConfig.slides?.[currentSlideIdx]?.sloganText ?? (currentSlideIdx === 0 ? (posterConfig.sloganText || "") : ""))
    : (posterConfig.sloganText || "");

  const currentSlidePriceText = postType === "Carrusel"
    ? (posterConfig.slides?.[currentSlideIdx]?.priceText ?? (currentSlideIdx === 0 ? (posterConfig.priceText || "") : ""))
    : (posterConfig.priceText || "");

  const currentSlideCtaText = postType === "Carrusel"
    ? (posterConfig.slides?.[currentSlideIdx]?.ctaText ?? (currentSlideIdx === 0 ? (posterConfig.ctaText || "") : ""))
    : (posterConfig.ctaText || "");

  // Banderas de visibilidad independientes por diapositiva en carruseles
  const isMainTextChecked = postType === "Carrusel"
    ? (posterConfig.slides?.[currentSlideIdx]?.includeMainText ?? (posterConfig.includeMainText !== false))
    : (posterConfig.includeMainText !== false);

  const isSloganChecked = postType === "Carrusel"
    ? (posterConfig.slides?.[currentSlideIdx]?.includeSlogan ?? posterConfig.includeSlogan)
    : posterConfig.includeSlogan;

  const isPriceChecked = postType === "Carrusel"
    ? (posterConfig.slides?.[currentSlideIdx]?.includePrice ?? posterConfig.includePrice)
    : posterConfig.includePrice;

  const isCtaChecked = postType === "Carrusel"
    ? (posterConfig.slides?.[currentSlideIdx]?.includeCta ?? posterConfig.includeCta)
    : posterConfig.includeCta;

  const isBusinessNameChecked = postType === "Carrusel"
    ? (posterConfig.slides?.[currentSlideIdx]?.includeBusinessName ?? posterConfig.includeBusinessName)
    : posterConfig.includeBusinessName;

  const isLogoChecked = postType === "Carrusel"
    ? (posterConfig.slides?.[currentSlideIdx]?.includeLogo ?? posterConfig.includeLogo)
    : posterConfig.includeLogo;

  return (
    <div className="w-full max-w-full overflow-hidden min-w-0 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 🧪 Módulo 1 Mixboard: Arquitecto de Blueprint (Solo en modo Laboratorio) */}
      {isLabMode && (
        <MixboardBlueprintBar
          idea={idea}
          setIdea={setIdea}
          posterConfig={posterConfig}
          setPosterConfig={setPosterConfig}
          businessType={activeProfile?.businessType}
          activeProfile={activeProfile}
          activeSlideIndex={currentSlideIdx}
          onApplyBlueprint={(blueprint) => {
            if (postType === "Carrusel") {
              updateSlideField("imageExpectation", blueprint.prompt);
              if (blueprint.fields.mainText) updateSlideField("mainText", blueprint.fields.mainText);
              if (blueprint.fields.sloganText) updateSlideField("sloganText", blueprint.fields.sloganText);
              if (blueprint.fields.priceText) updateSlideField("priceText", blueprint.fields.priceText);
              if (blueprint.fields.ctaText) updateSlideField("ctaText", blueprint.fields.ctaText);
            } else {
              setImageExpectation(blueprint.prompt);
              if (blueprint.fields.mainText) update("mainText", blueprint.fields.mainText);
              if (blueprint.fields.sloganText) update("sloganText", blueprint.fields.sloganText);
              if (blueprint.fields.priceText) update("priceText", blueprint.fields.priceText);
              if (blueprint.fields.ctaText) update("ctaText", blueprint.fields.ctaText);
            }
            if (blueprint.fields.primaryColor) {
              update("primaryColor", blueprint.fields.primaryColor);
            }
            setExtractedNotice("✨ Blueprint estructurado por nuestros agentes y aplicado al cartel.");
          }}
        />
      )}
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
      <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-stretch min-w-0 w-full">
        {/* COLUMNA IZQUIERDA: Composición y Dirección de Arte (mismo alto total que derecha) */}
        <div className="lg:col-span-6 flex flex-col w-full min-w-0">
          {/* Card 1: Dirección de Arte y Composición Espacial */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex-1 flex flex-col justify-between h-full space-y-6 min-w-0 w-full">
            <div className="space-y-5 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3 min-w-0">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0 mt-0.5 sm:mt-0">📐</span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider break-words leading-tight">
                      Composición y Dirección de Arte
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 break-words mt-0.5">
                      Disposición espacial del diseño para balancear texto y producto
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0 self-start sm:self-center">
                  Diseño Visual
                </span>
              </div>
              
                          {/* Layouts disponibles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => update("layout", "auto")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  !posterConfig.layout || posterConfig.layout === "auto"
                    ? "border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                    : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🧠</span>
                    <span className="text-xs font-black">Automático</span>
                  </div>
                  {/* Mini Diagrama Esquemático */}
                  <div className="w-6 h-6 rounded bg-slate-200/80 p-0.5 flex flex-col justify-between border border-slate-300">
                    <div className="h-1 bg-amber-500 rounded-xs w-3/4" />
                    <div className="h-2.5 bg-slate-400 rounded-xs w-full opacity-60" />
                    <div className="h-1 bg-slate-900 rounded-xs w-1/2" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  Nuestros agentes eligen el mejor encuadre según tu producto.
                </p>
              </button>

              <button
                type="button"
                onClick={() => update("layout", "split_left")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  posterConfig.layout === "split_left"
                    ? "border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                    : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">📐</span>
                    <span className="text-xs font-black">Split Lateral</span>
                  </div>
                  {/* Mini Diagrama Esquemático */}
                  <div className="w-6 h-6 rounded bg-slate-200/80 p-0.5 grid grid-cols-2 gap-0.5 border border-slate-300">
                    <div className="bg-amber-500/80 rounded-xs flex flex-col justify-center gap-0.5 p-0.5">
                      <div className="h-0.5 bg-white rounded-full" />
                      <div className="h-0.5 bg-white/70 rounded-full" />
                    </div>
                    <div className="bg-slate-400 rounded-xs flex items-center justify-center opacity-70">
                      <span className="text-[6px]">📷</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  Texto nítido a la izquierda y producto despejado a la derecha.
                </p>
              </button>

              <button
                type="button"
                onClick={() => update("layout", "top_banner")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  posterConfig.layout === "top_banner"
                    ? "border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                    : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">📌</span>
                    <span className="text-xs font-black">Cabecera Superior</span>
                  </div>
                  {/* Mini Diagrama Esquemático */}
                  <div className="w-6 h-6 rounded bg-slate-200/80 p-0.5 flex flex-col gap-0.5 border border-slate-300">
                    <div className="h-2 bg-amber-500/90 rounded-xs flex items-center justify-center">
                      <div className="h-0.5 w-3/4 bg-white rounded-full" />
                    </div>
                    <div className="flex-1 bg-slate-400 rounded-xs flex items-center justify-center opacity-70">
                      <span className="text-[6px]">📷</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  Titular llamativo arriba y escena fotográfica en el centro.
                </p>
              </button>

              <button
                type="button"
                onClick={() => update("layout", "recipe_ingredients")}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  posterConfig.layout === "recipe_ingredients"
                    ? "border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                    : "border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🥗</span>
                    <span className="text-xs font-black">Ficha Informativa</span>
                  </div>
                  {/* Mini Diagrama Esquemático */}
                  <div className="w-6 h-6 rounded bg-slate-200/80 p-0.5 flex flex-col justify-between border border-slate-300">
                    <div className="h-1 bg-slate-800 rounded-xs w-full" />
                    <div className="h-2 bg-slate-400 rounded-xs flex items-center justify-center opacity-70">
                      <span className="text-[6px]">📦</span>
                    </div>
                    <div className="grid grid-cols-3 gap-0.5">
                      <div className="h-1 bg-amber-500 rounded-xs" />
                      <div className="h-1 bg-amber-500 rounded-xs" />
                      <div className="h-1 bg-amber-500 rounded-xs" />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  Encuadre cenital con espacio para puntos y características.
                </p>
              </button>
            </div>
            </div>

            {/* Previsualización en Vivo de la Plantilla de Texto o Imagen Generada */}
            <div className="mt-4">
              <PosterTemplatePreview
                layout={posterConfig.layout || "auto"}
                visualStyle={posterConfig.visualStyle || "Moderno"}
                primaryColor={posterConfig.primaryColor || "#f59e0b"}
                mainText={
                  postType === "Carrusel"
                    ? (posterConfig.slides?.[currentSlideIdx]?.mainText ?? (currentSlideIdx === 0 ? (posterConfig.mainText || "") : ""))
                    : (posterConfig.mainText || "")
                }
                sloganText={
                  postType === "Carrusel"
                    ? (posterConfig.slides?.[currentSlideIdx]?.sloganText ?? (currentSlideIdx === 0 ? (posterConfig.sloganText || "") : ""))
                    : (posterConfig.sloganText || "")
                }
                priceText={
                  postType === "Carrusel"
                    ? (posterConfig.slides?.[currentSlideIdx]?.priceText ?? (currentSlideIdx === 0 ? (posterConfig.priceText || "") : ""))
                    : (posterConfig.priceText || "")
                }
                includePrice={isPriceChecked}
                ctaText={
                  postType === "Carrusel"
                    ? (posterConfig.slides?.[currentSlideIdx]?.ctaText ?? (currentSlideIdx === 0 ? (posterConfig.ctaText || "") : ""))
                    : (posterConfig.ctaText || "")
                }
                includeCta={isCtaChecked}
                includeMainText={isMainTextChecked}
                includeSlogan={isSloganChecked}
                businessName={posterConfig.businessName || activeProfile?.name}
                includeBusinessName={isBusinessNameChecked}
                includeLogo={isLogoChecked}
                includeContact={posterConfig.includeContact}
                contactType={posterConfig.contactType}
                contactValue={posterConfig.contactValue}
                aspectRatio={postType === "Historia" || postType === "Reel" ? "9:16" : "1:1"}
                postType={postType}
                generatedImageUrl={
                  postType === "Carrusel"
                    ? (posterConfig.slides?.[currentSlideIdx]?.imageUrl ||
                       (posterConfig.slides?.[currentSlideIdx]?.useSlide1Image
                         ? (posterConfig.slides?.[0]?.imageUrl || previewSlides?.[0]?.url)
                         : "") ||
                       previewSlides?.[currentSlideIdx]?.url ||
                       posterConfig.slides?.[currentSlideIdx]?.baseImageUrl ||
                       "")
                    : (posterConfig.imageUrl ||
                       previewSlides?.[0]?.url ||
                       posterConfig.baseImageUrl ||
                       "")
                }
                slideNumber={postType === "Carrusel" ? currentSlideIdx + 1 : undefined}
                totalSlides={postType === "Carrusel" ? (carouselCount || 5) : 1}
                onRegenerate={() => {
                  if (!validateCanDesign({ singleSlideOnly: postType === "Carrusel", slideIndex: currentSlideIdx })) return;
                  handleGeneratePreview(false, { singleSlideOnly: postType === "Carrusel", slideIndex: currentSlideIdx });
                }}
                onOpenEditor={onOpenEditor ? () => onOpenEditor(currentSlideIdx) : undefined}
                elementTransforms={currentTransforms}
                onChangeTransforms={handleUpdateTransforms}
              />
              {/* ⚡ Módulo 3 Mixboard: Barra de Retoque en Vivo debajo del Preview */}
              {isLabMode && onApplyLiveRetouch && (
                <MixboardLiveRetouchBar
                  activeSlideIndex={currentSlideIdx}
                  currentImageUrl={
                    postType === "Carrusel"
                      ? (posterConfig.slides?.[currentSlideIdx]?.imageUrl || previewSlides?.[currentSlideIdx]?.url)
                      : (posterConfig.imageUrl || previewSlides?.[0]?.url)
                  }
                  isRetouching={previewLoading}
                  onApplyRetouch={(instruction) => onApplyLiveRetouch(currentSlideIdx, instruction)}
                />
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Foto Real de tu Producto + Copy para el Post en Redes */}
        <div className="lg:col-span-6 space-y-6 w-full flex flex-col justify-between min-w-0">
          {/* Card 2: Imagen del Producto o Escena Publicitaria */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3 min-w-0">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <span className="text-xl shrink-0 mt-0.5 sm:mt-0">📦</span>
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider break-words leading-tight">
                    Imagen del Producto (Opcional)
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 break-words mt-0.5">
                    Sube una imagen de tu producto o describe la escena para que la generen nuestros agentes
                  </p>
                </div>
              </div>
              {((postType === "Carrusel" ? posterConfig.slides?.[currentSlideIdx]?.baseImageUrl : baseImageUrl) || baseImageUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    if (postType === "Carrusel") {
                      updateSlideField("baseImageUrl", "");
                      updateSlideField("useSlide1Image", false);
                    }
                    if (setBaseImageUrl) setBaseImageUrl("");
                  }}
                  className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer shrink-0 self-start sm:self-center"
                >
                  Quitar foto
                </button>
              )}
            </div>

            {/* Selector para Diapositivas > 1 en Carrusel: ¿Usar imagen del Slide 1 o una nueva? */}
            {postType === "Carrusel" && currentSlideIdx > 0 && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                <span className="text-[11px] font-black text-amber-950 flex items-center gap-1.5">
                  <span>📸</span> Imagen para el Slide {currentSlideIdx + 1} ({CAROUSEL_DEFAULT_SLIDES[currentSlideIdx]?.role}):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const slide1Img =
                        posterConfig.slides?.[0]?.imageUrl ||
                        previewSlides?.[0]?.url ||
                        posterConfig.slides?.[0]?.baseImageUrl ||
                        baseImageUrl ||
                        "";
                      updateSlideField("useSlide1Image", true);
                      updateSlideField("baseImageUrl", "");
                      if (slide1Img) {
                        updateSlideField("imageUrl", slide1Img);
                      }
                      if (setBaseImageUrl) setBaseImageUrl("");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      Boolean(posterConfig.slides?.[currentSlideIdx]?.useSlide1Image)
                        ? "border-amber-500 bg-white text-amber-950 shadow-xs ring-1 ring-amber-400/40"
                        : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {(posterConfig.slides?.[0]?.imageUrl || previewSlides?.[0]?.url || posterConfig.slides?.[0]?.baseImageUrl || baseImageUrl) ? (
                        <img
                          src={posterConfig.slides?.[0]?.imageUrl || previewSlides?.[0]?.url || posterConfig.slides?.[0]?.baseImageUrl || baseImageUrl}
                          alt="Slide 1"
                          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-amber-300 shadow-2xs"
                        />
                      ) : (
                        <span className="text-xl shrink-0">🖼️</span>
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] font-black block truncate">Usar imagen del Slide 1</span>
                        <span className="text-[9px] text-slate-500 block">Misma imagen (No genera nueva)</span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateSlideField("baseImageUrl", "");
                      updateSlideField("imageUrl", "");
                      updateSlideField("useSlide1Image", false);
                      if (setBaseImageUrl) setBaseImageUrl("");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      !Boolean(posterConfig.slides?.[currentSlideIdx]?.useSlide1Image)
                        ? "border-amber-500 bg-white text-amber-950 shadow-xs ring-1 ring-amber-400/40"
                        : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0">✨</span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black block leading-tight">Subir o describir otra</span>
                        <span className="text-[9px] text-slate-500 block">Parte de cero (Nueva imagen)</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Si está usando la imagen del Slide 1, mostrar confirmación */}
            {postType === "Carrusel" && currentSlideIdx > 0 && Boolean(posterConfig.slides?.[currentSlideIdx]?.useSlide1Image) ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">✅</span>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-emerald-950 truncate">Reutilizando imagen del Slide 1</p>
                    <p className="text-[11px] text-emerald-800 font-medium leading-tight mt-0.5">
                      Este slide usa la imagen del Slide 1. Está listo para publicación y no requiere generar otra imagen.
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-200/70 text-emerald-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0">
                  Listo
                </span>
              </div>
            ) : (
            /* Vista previa de imagen activa o botón de subida */
            (postType === "Carrusel" ? (posterConfig.slides?.[currentSlideIdx]?.baseImageUrl || (currentSlideIdx === 0 ? baseImageUrl : "")) : baseImageUrl) ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3.5 p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl">
                  <img
                    src={(postType === "Carrusel" ? (posterConfig.slides?.[currentSlideIdx]?.baseImageUrl || baseImageUrl) : baseImageUrl) || ""}
                    alt="Producto base"
                    className="w-16 h-16 rounded-xl object-cover border border-amber-200 shrink-0 shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-amber-950 truncate">Imagen activa para este Slide</p>
                    <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                      Nuestros agentes tomarán esta imagen como referencia para componer el afiche.
                    </p>
                  </div>
                </div>

                {/* Checkbox de Retoque por Nuestros Agentes */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        postType === "Carrusel"
                          ? (posterConfig.slides?.[currentSlideIdx]?.allowImageRetouch ?? posterConfig.allowImageRetouch ?? true)
                          : (posterConfig.allowImageRetouch ?? true)
                      }
                      onChange={(e) => {
                        const val = e.target.checked;
                        if (postType === "Carrusel") {
                          updateSlideField("allowImageRetouch", val);
                        }
                        update("allowImageRetouch", val);
                      }}
                      className="w-4 h-4 mt-0.5 accent-amber-600 rounded shrink-0 cursor-pointer"
                    />
                    <div className="flex-1 text-xs">
                      <span className="font-black text-slate-900 block">
                        🎨 Retoque y ambientación comercial por nuestros agentes
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium block leading-relaxed mt-0.5">
                        {(postType === "Carrusel"
                          ? (posterConfig.slides?.[currentSlideIdx]?.allowImageRetouch ?? posterConfig.allowImageRetouch ?? true)
                          : (posterConfig.allowImageRetouch ?? true))
                          ? "Nuestros agentes adaptarán la iluminación, sombras y fondo según lo que indiques en la descripción de abajo."
                          : "Usar tu imagen original tal cual (sin modificaciones visuales ni cambios de fondo en el producto)."}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-amber-50 border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-2xl text-xs font-bold text-slate-700 hover:text-amber-800 transition-all w-full shadow-inner">
                  <span>{uploadingBaseImage ? "⏳ Subiendo imagen..." : "📤 Subir imagen de tu producto"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingBaseImage}
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (onUploadBaseImage) {
                        await onUploadBaseImage(file);
                      }
                    }}
                  />
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-[11px] text-slate-500 font-medium leading-relaxed">
                  💡 <b>¿No tienes una imagen a mano?</b> No te preocupes. Nuestros agentes diseñarán una escena publicitaria fotográfica basada en la descripción que indiques abajo.
                </div>
              </div>
            ))}

            {/* 🎨 Módulo 2 Mixboard: Ranura de Referencia de Estilo & Anclaje de Slide 1 (Solo en modo Laboratorio) */}
            {isLabMode && (
              <MixboardStyleReferenceSlot
                activeSlideIndex={currentSlideIdx}
                slideConfig={posterConfig.slides?.[currentSlideIdx]}
                slide1ImageUrl={posterConfig.slides?.[0]?.imageUrl || previewSlides?.[0]?.url}
                onUpdateStyleReference={(url) => {
                  if (postType === "Carrusel") {
                    updateSlideField("styleReferenceUrl", url);
                  }
                  update("styleReferenceUrl", url);
                }}
                onToggleLockStyleFromSlide1={(lock) => {
                  if (postType === "Carrusel") {
                    updateSlideField("lockStyleFromSlide1", lock);
                    if (lock) {
                      const s1Url = posterConfig.slides?.[0]?.imageUrl || previewSlides?.[0]?.url || "";
                      updateSlideField("styleReferenceUrl", s1Url);
                    }
                  }
                }}
                onUploadImage={onUploadStyleReference}
                uploading={uploadingBaseImage}
              />
            )}
          
                      {/* Campo: Idea o Escena Visual del Afiche */}
                      <div className="pt-2 space-y-3">
                        {/* Si el slide actual de carrusel ya tiene imagen generada, mostrarla */}
                        {postType === "Carrusel" && posterConfig.slides?.[currentSlideIdx]?.imageUrl && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={posterConfig.slides[currentSlideIdx].imageUrl}
                                alt="Slide preview"
                                className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mb-0.5">
                                  ✓ Imagen Lista
                                </span>
                                <p className="text-xs font-black text-slate-800 truncate">
                                  Slide {currentSlideIdx + 1}: {CAROUSEL_DEFAULT_SLIDES[currentSlideIdx]?.role}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!validateCanDesign({ singleSlideOnly: true, slideIndex: currentSlideIdx })) return;
                                handleGeneratePreview(false, { singleSlideOnly: true, slideIndex: currentSlideIdx });
                              }}
                              disabled={previewLoading}
                              className="text-[10px] font-black uppercase tracking-wider text-emerald-800 hover:text-emerald-950 bg-white border border-emerald-300 px-2.5 py-1.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                            >
                              🔄 Regenerar
                            </button>
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-black text-slate-800">
                              💡 {postType === "Carrusel" 
                                    ? `¿Cómo imaginas la escena del Slide ${currentSlideIdx + 1} (${CAROUSEL_DEFAULT_SLIDES[currentSlideIdx]?.role})?`
                                    : "¿Cómo imaginas la escena o ambiente publicitario?"}
                            </label>
                            <VoiceMic
                              onResult={(text) => {
                                setSlideValidationError(null);
                                const currentVal = postType === "Carrusel"
                                  ? (posterConfig.slides?.[currentSlideIdx]?.imageExpectation || "")
                                  : (idea || "");
                                const nextVal = currentVal ? `${currentVal} ${text}` : text;
                                if (postType === "Carrusel") {
                                  updateSlideField("imageExpectation", nextVal);
                                }
                                setIdea(nextVal);
                                setImageExpectation(nextVal);
                                handleApplyExtractedTypography(nextVal);
                              }}
                              className="scale-85"
                            />
                          </div>
                          <textarea
                            ref={sceneTextareaRef}
                            value={
                              postType === "Carrusel"
                                ? (posterConfig.slides?.[currentSlideIdx]?.imageExpectation ?? "")
                                : (imageExpectation || idea || "")
                            }
                            onChange={(e) => {
                              setSlideValidationError(null);
                              const val = e.target.value;
                              if (postType === "Carrusel") {
                                updateSlideField("imageExpectation", val);
                              } else {
                                setIdea(val);
                              }
                              setImageExpectation(val);
                              handleApplyExtractedTypography(val);
                            }}
                            placeholder={
                              postType === "Carrusel"
                                ? `Ej: ${CAROUSEL_DEFAULT_SLIDES[currentSlideIdx]?.desc || "Describe la escena fotográfica de este slide"}...`
                                : "Ej: Hamburguesa gourmet con queso cheddar derretido sobre tabla de madera oscura, iluminación cálida de estudio y fondo elegante..."
                            }
                            className={`w-full bg-slate-50 border px-4 py-3 rounded-2xl outline-none text-xs font-semibold text-slate-800 resize-none min-h-[90px] transition-all shadow-inner ${
                              slideValidationError ? "border-rose-400 bg-rose-50/40 ring-2 ring-rose-200" : "border-slate-200 focus:border-amber-500 focus:bg-white"
                            }`}
                          />

                          {extractedNotice && (
                            <div className="mt-2.5 p-3 bg-emerald-50 border border-emerald-200/90 rounded-2xl text-emerald-900 text-xs font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base shrink-0">🎯</span>
                                <span className="truncate">{extractedNotice}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setExtractedNotice(null)}
                                className="text-emerald-700 hover:text-emerald-950 text-xs font-black px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Copy Persuasivo para Redes y Botón de Generación */}
                    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 min-w-0">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider break-words leading-tight">
                            Copy para el Post en Redes {postType === "Carrusel" ? "(Todo el Carrusel)" : ""}
                          </h4>
                          <p className="text-[11px] font-medium text-slate-500 break-words mt-0.5">
                            {postType === "Carrusel" 
                              ? "Texto comercial que conecta la narrativa de todas las láminas al publicar"
                              : "El texto persuasivo que acompañará al afiche en Facebook e Instagram"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleImproveWithAI}
                          disabled={improveLoading}
                          className="bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider disabled:opacity-50 transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-center"
                        >
                          {improveLoading ? "Redactando..." : (postType === "Carrusel" ? "✨ Redactar Copy con Agentes" : "✨ Redactar con Agentes")}
                        </button>
                      </div>
          
                      <div
                        className={`border rounded-2xl bg-slate-50/60 overflow-hidden flex flex-col focus-within:border-amber-500 focus-within:bg-white transition-all ${
                          isOverLimit ? "border-rose-300" : "border-slate-200"
                        }`}
                      >
                        <textarea
                          value={postText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPostText(val);
                            handleApplyExtractedTypography(val, 'postText');
                          }}
                          placeholder={
                            postType === "Carrusel"
                              ? "El copy abarcará todo el carrusel en conjunto. Una vez definidas tus diapositivas, pulsa 'Redactar Copy con Agentes' o escribe tu texto aquí..."
                              : "Escribe el copy o pulsa 'Redactar con Agentes' para que nuestro equipo redacte el mensaje comercial con hashtags y llamado a la acción..."
                          }
                          className={`w-full bg-transparent px-4 py-3 text-xs outline-none resize-none min-h-[110px] font-semibold leading-relaxed ${
                            isOverLimit ? "text-rose-600" : "text-slate-800"
                          }`}
                          maxLength={maxChars + 500}
                        />
                        <div className="px-4 py-2 bg-white/70 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <VoiceMic
                            onResult={(text) => {
                              const nextVal = postText + (postText ? " " : "") + text;
                              setPostText(nextVal);
                              handleApplyExtractedTypography(nextVal, 'postText');
                            }}
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
      <div className="w-full bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xs space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 min-w-0">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <span className="text-xl shrink-0 mt-0.5 sm:mt-0">✍️</span>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider break-words leading-tight">
                Textos del Cartel {postType === "Carrusel" ? `(Slide ${currentSlideIdx + 1} de ${carouselCount || 5} · ${CAROUSEL_DEFAULT_SLIDES[currentSlideIdx]?.role})` : "(en la imagen)"}
              </h4>
              <p className="text-[11px] font-medium text-slate-500 break-words mt-0.5">
                {postType === "Carrusel" 
                  ? `Define los textos para el Slide ${currentSlideIdx + 1} (${CAROUSEL_DEFAULT_SLIDES[currentSlideIdx]?.desc})`
                  : "Elementos que irán impresos en el afiche publicitario"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {extractedNotice && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-850 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1.5 shadow-xs animate-in fade-in">
                <span>✨</span> Textos sincronizados del prompt
              </span>
            )}
            {postType === "Carrusel" && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                Diapositiva {currentSlideIdx + 1}/{carouselCount || 5}
              </span>
            )}
          </div>
        </div>

        {/* Subgrid de 2 Columnas para los Campos de Texto a Todo el Ancho */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Subcolumna 1: Mensaje Principal y Marca */}
          <div className="space-y-4">
            {/* Titular Principal */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                          <label className="text-xs font-black text-slate-800 flex flex-wrap items-center justify-between gap-1.5 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isMainTextChecked}
                                onChange={(e) => {
                                  if (postType === "Carrusel") {
                                    updateSlideField("includeMainText" as any, e.target.checked);
                                  } else {
                                    update("includeMainText", e.target.checked);
                                  }
                                }}
                                className="w-4 h-4 accent-amber-600 rounded"
                              />
                              <span>📝 Titular {postType === "Carrusel" ? `del Slide ${currentSlideIdx + 1}` : "Principal del Cartel"}</span>
                            </div>
                            <span className="text-[10px] text-amber-700 font-bold">Impreso en el diseño</span>
                          </label>
                          {isMainTextChecked && (
                            <textarea
                              rows={2}
                              value={currentSlideMainText}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (postType === "Carrusel") {
                                  updateSlideField("mainText", val);
                                } else {
                                  update("mainText", val);
                                  setPosterConfig((prev) => {
                                    const nextSlides = prev.slides ? [...prev.slides] : [];
                                    if (nextSlides[0]) nextSlides[0] = { ...nextSlides[0], mainText: val };
                                    return { ...prev, mainText: val, slides: nextSlides, enabled: true };
                                  });
                                }
                              }}
                              placeholder={
                                postType === "Carrusel"
                                  ? CAROUSEL_DEFAULT_SLIDES[currentSlideIdx]?.placeholder || "Titular de esta diapositiva..."
                                  : "Ej: GRAN INAUGURACIÓN, 50% OFF, MENÚ EJECUTIVO..."
                              }
                              className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl outline-none text-xs font-black text-slate-800 focus:border-amber-500 transition-all shadow-inner resize-y leading-snug"
                            />
                          )}
                          {isMainTextChecked && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 border-t border-slate-200/60 mt-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-700">📏 Tamaño:</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateElementTransform("title", {
                                      fontSize: Math.max(8, (currentTransforms?.title?.fontSize ?? 14) - 1),
                                    })
                                  }
                                  className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-black flex items-center justify-center cursor-pointer shadow-xs"
                                >
                                  -
                                </button>
                                <span className="font-mono font-black text-amber-700 text-xs px-1">
                                  {currentTransforms?.title?.fontSize ?? 14}px
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateElementTransform("title", {
                                      fontSize: Math.min(36, (currentTransforms?.title?.fontSize ?? 14) + 1),
                                    })
                                  }
                                  className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-black flex items-center justify-center cursor-pointer shadow-xs"
                                >
                                  +
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-700">🔄 Giro:</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateElementTransform("title", {
                                      rotation: (currentTransforms?.title?.rotation ?? 0) - 5,
                                    })
                                  }
                                  className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer text-[10px] shadow-xs"
                                  title="Girar 5° a la izquierda"
                                >
                                  ↺ -5°
                                </button>
                                <span className="font-mono font-black text-amber-700 text-xs px-1">
                                  {currentTransforms?.title?.rotation ?? 0}°
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateElementTransform("title", {
                                      rotation: (currentTransforms?.title?.rotation ?? 0) + 5,
                                    })
                                  }
                                  className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer text-[10px] shadow-xs"
                                  title="Girar 5° a la derecha"
                                >
                                  ↻ +5°
                                </button>
                                {(currentTransforms?.title?.rotation ?? 0) !== 0 && (
                                  <button
                                    type="button"
                                    onClick={() => updateElementTransform("title", { rotation: 0 })}
                                    className="text-[10px] text-amber-700 font-bold underline cursor-pointer ml-1"
                                  >
                                    0°
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

            {/* Slogan */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                          <label className="text-xs font-black text-slate-800 flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSloganChecked}
                              onChange={(e) => {
                                if (postType === "Carrusel") {
                                  updateSlideField("includeSlogan" as any, e.target.checked);
                                } else {
                                  update("includeSlogan", e.target.checked);
                                }
                              }}
                              className="w-4 h-4 accent-amber-600 rounded"
                            />
                            <span>💬 Slogan o Frase Gancho</span>
                          </label>
                          {isSloganChecked && (
                            <textarea
                              rows={3}
                              value={currentSlideSloganText}
                              onChange={(e) => {
                                if (postType === "Carrusel") {
                                  updateSlideField("sloganText", e.target.value);
                                } else {
                                  update("sloganText", e.target.value);
                                }
                              }}
                              placeholder="Ej: Calidad garantizada o puntos clave del slide..."
                              className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl outline-none text-xs font-bold text-slate-800 focus:border-amber-500 shadow-xs resize-y leading-relaxed"
                            />
                          )}
                          {isSloganChecked && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 border-t border-slate-200/60 mt-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-700">📏 Tamaño:</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateElementTransform("slogan", {
                                      fontSize: Math.max(7, (currentTransforms?.slogan?.fontSize ?? 9.5) - 1),
                                    })
                                  }
                                  className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-black flex items-center justify-center cursor-pointer shadow-xs"
                                >
                                  -
                                </button>
                                <span className="font-mono font-black text-amber-700 text-xs px-1">
                                  {currentTransforms?.slogan?.fontSize ?? 9.5}px
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateElementTransform("slogan", {
                                      fontSize: Math.min(26, (currentTransforms?.slogan?.fontSize ?? 9.5) + 1),
                                    })
                                  }
                                  className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-black flex items-center justify-center cursor-pointer shadow-xs"
                                >
                                  +
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-700">🔄 Giro:</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateElementTransform("slogan", {
                                      rotation: (currentTransforms?.slogan?.rotation ?? 0) - 5,
                                    })
                                  }
                                  className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer text-[10px] shadow-xs"
                                  title="Girar 5° a la izquierda"
                                >
                                  ↺ -5°
                                </button>
                                <span className="font-mono font-black text-amber-700 text-xs px-1">
                                  {currentTransforms?.slogan?.rotation ?? 0}°
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateElementTransform("slogan", {
                                      rotation: (currentTransforms?.slogan?.rotation ?? 0) + 5,
                                    })
                                  }
                                  className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer text-[10px] shadow-xs"
                                  title="Girar 5° a la derecha"
                                >
                                  ↻ +5°
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

            {/* Nombre del Negocio y Logo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                              type="checkbox"
                              checked={isBusinessNameChecked}
                              onChange={(e) => {
                                if (postType === "Carrusel") {
                                  updateSlideField("includeBusinessName" as any, e.target.checked);
                                } else {
                                  update("includeBusinessName", e.target.checked);
                                }
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
                              checked={isLogoChecked}
                              onChange={(e) => {
                                if (postType === "Carrusel") {
                                  updateSlideField("includeLogo" as any, e.target.checked);
                                } else {
                                  update("includeLogo", e.target.checked);
                                }
                              }}
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
                                checked={isPriceChecked}
                                onChange={(e) => {
                                  if (postType === "Carrusel") {
                                    updateSlideField("includePrice" as any, e.target.checked);
                                  } else {
                                    update("includePrice", e.target.checked);
                                  }
                                }}
                                className="w-4 h-4 accent-amber-600 rounded"
                              />
                              <span>💲 Incluir Precio o Promoción Destacada</span>
                            </label>
                          </div>
                          {isPriceChecked && (
                            <input
                              type="text"
                              value={currentSlidePriceText}
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
                          {isPriceChecked && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-amber-900 border-t border-amber-200/60 mt-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">📏 Tamaño:</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateElementTransform("price", {
                                      fontSize: Math.max(8, (currentTransforms?.price?.fontSize ?? 11) - 1),
                                    })
                                  }
                                  className="w-6 h-6 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-950 font-black flex items-center justify-center cursor-pointer shadow-xs"
                                >
                                  -
                                </button>
                                <span className="font-mono font-black text-amber-800 text-xs px-1">
                                  {currentTransforms?.price?.fontSize ?? 11}px
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateElementTransform("price", {
                                      fontSize: Math.min(30, (currentTransforms?.price?.fontSize ?? 11) + 1),
                                    })
                                  }
                                  className="w-6 h-6 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-950 font-black flex items-center justify-center cursor-pointer shadow-xs"
                                >
                                  +
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">🔄 Giro:</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateElementTransform("price", {
                                      rotation: (currentTransforms?.price?.rotation ?? 0) - 5,
                                    })
                                  }
                                  className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-950 font-bold cursor-pointer text-[10px] shadow-xs"
                                  title="Girar 5° a la izquierda"
                                >
                                  ↺ -5°
                                </button>
                                <span className="font-mono font-black text-amber-800 text-xs px-1">
                                  {currentTransforms?.price?.rotation ?? 0}°
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateElementTransform("price", {
                                      rotation: (currentTransforms?.price?.rotation ?? 0) + 5,
                                    })
                                  }
                                  className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-950 font-bold cursor-pointer text-[10px] shadow-xs"
                                  title="Girar 5° a la derecha"
                                >
                                  ↻ +5°
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

            {/* Llamado a la Acción (CTA) */}
                        <div>
                          <label className="block text-xs font-black text-slate-800 mb-2">
                            📣 Llamado a la Acción (CTA en el Afiche)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {CTA_OPTIONS.map((opt) => {
                              const isSelected = !showCustomCta && currentSlideCtaText === opt;
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

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-700">📏 Tamaño:</span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateElementTransform("cta", {
                                    fontSize: Math.max(7, (currentTransforms?.cta?.fontSize ?? 10) - 1),
                                  })
                                }
                                className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-black flex items-center justify-center cursor-pointer shadow-xs"
                              >
                                -
                              </button>
                              <span className="font-mono font-black text-amber-700 text-xs px-1">
                                {currentTransforms?.cta?.fontSize ?? 10}px
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateElementTransform("cta", {
                                    fontSize: Math.min(28, (currentTransforms?.cta?.fontSize ?? 10) + 1),
                                  })
                                }
                                className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-black flex items-center justify-center cursor-pointer shadow-xs"
                              >
                                +
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-700">🔄 Giro:</span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateElementTransform("cta", {
                                    rotation: (currentTransforms?.cta?.rotation ?? 0) - 5,
                                  })
                                }
                                className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer text-[10px] shadow-xs"
                                title="Girar 5° a la izquierda"
                              >
                                ↺ -5°
                              </button>
                              <span className="font-mono font-black text-amber-700 text-xs px-1">
                                {currentTransforms?.cta?.rotation ?? 0}°
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateElementTransform("cta", {
                                    rotation: (currentTransforms?.cta?.rotation ?? 0) + 5,
                                  })
                                }
                                className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer text-[10px] shadow-xs"
                                title="Girar 5° a la derecha"
                              >
                                ↻ +5°
                              </button>
                            </div>
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

      {/* Botones de Generación del Cartel / Carrusel */}
      <div className="pt-2">
        {/* Banner de validación de imagen o descripción */}
        {slideValidationError && (
          <div className="mb-3.5 p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-950 shadow-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span className="text-2xl shrink-0 mt-0.5">⚠️</span>
              <div className="min-w-0">
                <h5 className="text-xs font-black uppercase tracking-wider text-rose-900">
                  Falta imagen o descripción del slide
                </h5>
                <p className="text-xs font-semibold text-rose-800 mt-0.5 leading-relaxed">
                  {slideValidationError}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                sceneTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                sceneTextareaRef.current?.focus();
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl shrink-0 transition-all shadow-xs cursor-pointer self-stretch sm:self-center text-center"
            >
              Completar escena ✍️
            </button>
          </div>
        )}

        {postType === "Carrusel" ? (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              {/* Botón 1: Diseñar solo la imagen de la diapositiva seleccionada */}
              {Boolean(posterConfig.slides?.[currentSlideIdx]?.useSlide1Image) ? (
                <div className="w-full bg-emerald-50 border-2 border-emerald-300 text-emerald-950 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">✅</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate">Slide {currentSlideIdx + 1} listo</p>
                      <p className="text-[10px] text-emerald-800 font-semibold truncate">
                        Reutiliza la imagen del Slide 1 (No requiere generar)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateSlideField("useSlide1Image", false);
                      updateSlideField("imageUrl", "");
                    }}
                    className="text-emerald-700 hover:text-emerald-950 text-[10px] font-black uppercase underline shrink-0 cursor-pointer"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!validateCanDesign({ singleSlideOnly: true, slideIndex: currentSlideIdx })) return;
                    handleGeneratePreview(false, { singleSlideOnly: true, slideIndex: currentSlideIdx });
                  }}
                  disabled={previewLoading}
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 px-5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {previewLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Diseñando Slide {currentSlideIdx + 1}...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base">🎨</span>
                      <span>Diseñar solo Slide {currentSlideIdx + 1} ({CAROUSEL_DEFAULT_SLIDES[currentSlideIdx]?.role})</span>
                    </>
                  )}
                </button>
              )}

              {/* Botón 2: Diseñar las 5 imágenes con una sola idea */}
              <button
                type="button"
                onClick={() => {
                  if (!validateCanDesign({ singleSlideOnly: false })) return;
                  handleGeneratePreview(false, { singleSlideOnly: false });
                }}
                disabled={previewLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-5 rounded-2xl text-xs uppercase tracking-wider transition-all border border-slate-700 shadow-md flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="text-base">⚡</span>
                <span>Diseñar las 5 Imágenes con una sola Idea</span>
              </button>
            </div>

            {/* Banner resumen de avance */}
            {posterConfig.slides?.some((s) => Boolean(s.imageUrl)) && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <span className="text-xs font-black text-emerald-950 block">
                      {posterConfig.slides.filter((s) => Boolean(s.imageUrl)).length} de {carouselCount || 5} diapositivas listas
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      Revisa cada slide arriba en la card de Composición
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!postText.trim() && (
                    <button
                      type="button"
                      onClick={handleImproveWithAI}
                      disabled={improveLoading}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>✨</span>
                      <span>{improveLoading ? "Redactando..." : "Redactar Copy con Agentes"}</span>
                    </button>
                  )}
                  {onOpenPostModal && (
                    <button
                      type="button"
                      onClick={onOpenPostModal}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <span>🚀</span> Continuar a Publicar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                if (!validateCanDesign()) return;
                handleGeneratePreview();
              }}
              disabled={
                previewLoading ||
                (!idea.trim() &&
                  !posterConfig.mainText?.trim() &&
                  !imageExpectation.trim() &&
                  !postText.trim() &&
                  !baseImageUrl)
              }
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 px-6 rounded-2xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {previewLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Nuestros agentes están diseñando el afiche...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">🎯</span>
                  <span>{posterConfig.imageUrl || previewSlides?.[0]?.url ? "Rediseñar Afiche Publicitario" : "Diseñar Afiche Publicitario"}</span>
                </>
              )}
            </button>

            {onOpenPostModal && (posterConfig.imageUrl || previewSlides?.[0]?.url) && (
              <button
                type="button"
                onClick={onOpenPostModal}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🚀</span> Publicar / Programar este Afiche
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
