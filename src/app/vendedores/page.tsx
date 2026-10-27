"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth, db, storage } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { HARDCODED_STYLES, promptCategories, PromptTemplate, getPromptCategories } from "../../lib/prompt-templates";
import { DEFAULT_TEXT_TEMPLATES, TEXT_TEMPLATE_CATEGORIES, TextTemplate } from "../../lib/text-templates";
import { createButterflyRender, compositeImageClient, BadgeStyle } from "../../lib/image-compositor";
import { removeLogoBackground } from "../../lib/logo-bg-remover";
import LogoMark from "../../components/LogoMark";
import {
  FaWhatsapp,
  FaImage,
  FaUpload,
  FaCheck,
  FaMagic,
  FaCopy,
  FaEye,
  FaTrash,
  FaSearch,
  FaExternalLinkAlt,
  FaSignOutAlt,
  FaMobileAlt,
  FaKey,
  FaPlus,
  FaEdit,
  FaSyncAlt,
  FaPaperPlane,
  FaVideo,
  FaFilm,
  FaPlay,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaFire,
  FaTimesCircle,
  FaTrophy,
  FaUserCheck,
  FaPalette
} from "react-icons/fa";
import { FLOW_COMMANDS, FlowCommandDef } from "../../lib/flow-command-translator";

interface ProspectDemo {
  id?: string;
  prospectName: string;
  prospectBusiness: string;
  prospectPhone: string;
  rubro: string;
  offerText: string;
  badgeCustomText?: string;
  badgeStyle?: BadgeStyle;
  dishOrProductName?: string;
  generatedPostCaption?: string;
  baseImageUrl?: string;
  logoUrl?: string;
  logoPosition?: string;
  logoSize?: number;
  logoTransparent?: boolean;
  selectedStyleId?: string;
  selectedStyleTitle?: string;
  generatedImageUrl?: string;
  canvasImageUrl?: string;
  butterflyUrl?: string;
  generatedVideoUrl?: string;
  videoStyleTitle?: string;
  videoPromptEnglish?: string;
  publicDemoUrl?: string;
  whatsappMessage?: string;
  createdAt?: any;
  status?: "borrador" | "generada" | "enviada";
  createdBy?: string;
  sellerEmail?: string;
  sellerName?: string;
  sentAt?: string;
  // Campos analíticos y pipeline (Puntos 1, 2 y 5)
  viewCount?: number;
  firstViewedAt?: string;
  lastViewedAt?: string;
  lastViewDevice?: string;
  outcome?: "nuevo" | "enviado" | "visto" | "interesado" | "cerrado" | "descartado";
  lastFollowUpAt?: string;
  followUpCount?: number;
  publications?: any[];
  strategy?: any;
  includeWatermark?: boolean;
  isCommercialPoster?: boolean;
}

const COMMON_NICHES = [
  { label: "Gastronomía & Restaurantes", icon: "🍕" },
  { label: "Salud, Dental & Médica", icon: "🩺" },
  { label: "Belleza, Barbería & Spa", icon: "💇" },
  { label: "Fitness, Gimnasio & Crossfit", icon: "🏋️" },
  { label: "Inmobiliaria & Propiedades", icon: "🏠" },
  { label: "Retail, Moda & Calzado", icon: "🛍️" },
  { label: "Servicios Profesionales & B2B", icon: "💼" },
  { label: "Automotriz & Talleres", icon: "🚗" },
  { label: "Turismo, Hotelería & Cabañas", icon: "✈️" },
  { label: "Educación & Cursos", icon: "🎓" },
];

const COUNTRY_CODES = [
  { code: "+56", label: "🇨🇱 Chile (+56)" },
  { code: "+54", label: "🇦🇷 Argentina (+54)" },
  { code: "+52", label: "🇲🇽 México (+52)" },
  { code: "+57", label: "🇨🇴 Colombia (+57)" },
  { code: "+51", label: "🇵🇪 Perú (+51)" },
  { code: "+34", label: "🇪🇸 España (+34)" },
  { code: "+1",  label: "🇺🇸 EE.UU. (+1)" },
];

const ADMIN_EMAILS = [
  "admin@santisoft.cl",
  "diemoroy@gmail.com",
  "spalezcom@gmail.com",
  "santisoftai@gmail.com",
];

const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";
const EVOLUTION_URL = process.env.NEXT_PUBLIC_EVOLUTION_URL || "https://evoapi.grupofugas.cl";
const EVOLUTION_INSTANCE = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || "Santisoft";
const EVOLUTION_API_KEY = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || "6833CC358FA4-42E4-8F45-E74D35CC85A7";
const N8N_EVOAPI_WEBHOOK_URL = "https://n8n.santisoft.cl/webhook/evoapi";

function buildWhatsAppCopy(
  pName: string,
  pBusiness: string,
  pDishOrProduct: string,
  pOffer: string,
  demoId?: string,
  schedulePlan?: any[],
  publications?: any[]
) {
  const namePart = pName.trim() ? `¡Hola ${pName.trim()}!` : "¡Hola!";
  const businessName = pBusiness.trim() || "tu marca";
  const demoLink = demoId
    ? `${PUBLIC_APP_URL}/m/${demoId}`
    : `${PUBLIC_APP_URL}/m/[ID_DE_MUESTRA]`;

  let scheduleSection = "";
  if (Array.isArray(schedulePlan) && schedulePlan.length > 0) {
    const lines = schedulePlan.slice(0, 5).map((item, i) => {
      const numEmoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"][i] || `•`;
      const fmtLabel = item.format === "carrusel" ? "Carrusel (3 slides)" : "Post (1:1)";
      return `${numEmoji} ${item.day || `Día ${i + 1}`} · ${fmtLabel}\n   🎯 ${item.objective || item.hook || "Publicación estratégica"}`;
    }).join("\n\n");
    scheduleSection = `\n\n📅 Plan de Publicaciones Estratégico (Radar de Nicho):\n${lines}`;
  }

  let samplesSection = "";
  if (Array.isArray(publications) && publications.length > 0) {
    const lines = publications.slice(0, 3).map((pub, i) => {
      const fmtIcon = pub.type === "carrusel" ? "🎠" : "📸";
      const briefCopy = (pub.copy || "").split("\n")[0] || pub.title || "Publicación de alto impacto";
      return `${fmtIcon} Muestra #${i + 1} (${pub.visualStyleTitle || "Estilo Visual"}): ${pub.title || pub.dishOrProductName}\n"${briefCopy.length > 110 ? briefCopy.substring(0, 107) + '...' : briefCopy}"`;
    }).join("\n\n");
    samplesSection = `\n\n✨ Publicaciones de Muestra Diseñadas:\n${lines}`;
  }

  return `${namePart} 👋 Estuve revisando lo que hacen en ${businessName} y nuestro equipo de agentes especializados preparó esta propuesta estratégica exclusiva con publicaciones listas para tus redes y planificación de nicho:

🚀 Ver propuesta interactiva completa:
${demoLink}${scheduleSection}${samplesSection}

Diseñamos este contenido con su identidad para que veas la calidad y el impacto que tendrían sus redes semana a semana sin quitarte tiempo.

¿Qué te parece la propuesta para comenzar esta semana?`;
}

function buildFollowUpCopy(
  pName: string,
  pBusiness: string,
  demoId: string,
  viewCount: number = 0
) {
  const namePart = pName.trim() ? `¡Hola ${pName.trim()}!` : "¡Hola!";
  const businessPart = pBusiness.trim() ? ` para ${pBusiness.trim()}` : "";
  const demoLink = `${PUBLIC_APP_URL}/m/${demoId}`;

  if (viewCount > 0) {
    return `${namePart} 👋 Vi que pudiste revisar la propuesta visual que prepararon nuestros agentes${businessPart}.

¿Lograste ver el video reel y la muestra interactiva?

Cuéntame qué te pareció o si te gustaría que ajustemos algún detalle para tu negocio:
${demoLink}

¡Quedo muy atento a tus comentarios!`;
  }

  return `${namePart} 👋 Te compartí arriba la propuesta que diseñaron nuestros agentes${businessPart}.

Te vuelvo a dejar el enlace directo para que puedas mirarlo con calma en 1 minuto:
${demoLink}

Avísame si pudiste abrirlo o si tienes alguna duda para que coordinemos los siguientes pasos.`;
}

function getFollowUpStatus(demo: ProspectDemo) {
  if (demo.outcome === "cerrado" || demo.outcome === "descartado") return null;

  const dateStr = demo.lastFollowUpAt || demo.sentAt || demo.createdAt;
  if (!dateStr) return null;

  const sentTime = new Date(dateStr).getTime();
  if (isNaN(sentTime)) return null;

  const hoursDiff = (Date.now() - sentTime) / (1000 * 60 * 60);

  if (hoursDiff >= 48) {
    return {
      type: "urgent" as const,
      hours: Math.floor(hoursDiff),
      label: `Seguimiento prioritario (+${Math.floor(hoursDiff)}h)`,
    };
  } else if (hoursDiff >= 24) {
    return {
      type: "warning" as const,
      hours: Math.floor(hoursDiff),
      label: `Seguimiento sugerido (+${Math.floor(hoursDiff)}h)`,
    };
  }
  return null;
}

function formatRelativeTime(isoString?: string) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "hace un momento";
  if (diffMins < 60) return `hace ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `hace ${diffDays}d`;
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE PREVIEW VISUAL DE PLANTILLAS DE TEXTO (Respeta la disposición real)
// ════════════════════════════════════════════════════════════════════════════
function TemplateVisualPreview({
  template,
  productName,
  price,
  headline,
  isModal = false,
  showZoomButton = false,
  onOpenModal,
  isCurrentlyApplied = false,
  customImageUrl,
}: {
  template: TextTemplate;
  productName?: string;
  price?: string;
  headline?: string;
  isModal?: boolean;
  showZoomButton?: boolean;
  onOpenModal?: () => void;
  isCurrentlyApplied?: boolean;
  customImageUrl?: string;
}) {
  const layout =
    template.layoutPosition ||
    (template.category === "Split Lateral"
      ? "split_left"
      : template.category === "Recetas & Ingredientes"
      ? "recipe_ingredients"
      : "top_banner");

  const isSplitLeft = layout === "split_left" || template.category === "Split Lateral";
  const isRecipe = layout === "recipe_ingredients" || template.category === "Recetas & Ingredientes";
  const isImpact = template.category === "Ofertas Flash" || template.category === "Delivery";
  const isEditorial = template.category === "Gourmet & Menú" || template.headlineFont === "elegant_serif";

  const rawTitle = headline?.trim()
    ? headline.trim().toUpperCase()
    : template.headlinePattern.replace(
        /\{PRODUCTO\}|\{PLATO\}/gi,
        productName?.trim() || "HAMBURGUESA ESPECIAL"
      );
  const priceDisplay =
    price?.trim() ||
    (template.priceBadgePattern
      ? template.priceBadgePattern.replace("{PRECIO}", "$12.900")
      : "");
  const photoUrl =
    (customImageUrl && typeof customImageUrl === "string" && customImageUrl.startsWith("http"))
      ? customImageUrl
      : (template.previewSampleImage ||
        "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80");
  const scriptText = template.secondaryScriptPattern;
  const ingredients = template.ingredients || [];

  const headlineFontClass =
    template.headlineFont === "script_handwritten"
      ? "font-serif italic"
      : template.headlineFont === "elegant_serif"
      ? "font-serif tracking-wide"
      : template.headlineFont === "serif_script_mix"
      ? "font-serif font-black tracking-tight"
      : template.headlineFont === "bold_textured"
      ? "font-black uppercase tracking-tighter"
      : "font-black uppercase tracking-tight";

  return (
    <div
      className={`relative w-full overflow-hidden bg-slate-950 select-none ${
        isModal ? "aspect-square rounded-2xl border border-slate-800 shadow-xl" : "aspect-[4/3]"
      }`}
    >
      {/* 1. Foto de Fondo */}
      <img
        src={photoUrl}
        alt={template.name}
        className={`absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-300 ${
          !isModal ? "group-hover:scale-105" : ""
        }`}
      />

      {/* 2. Badge de estado "Activa" */}
      {isCurrentlyApplied && (
        <span
          className={`absolute z-30 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-black shadow-md ${
            isModal ? "top-3 left-3 text-[10px]" : "top-1.5 left-1.5 text-[7px]"
          }`}
        >
          ✓ Activa
        </span>
      )}

      {/* 3. Botón de Lupa para abrir modal */}
      {showZoomButton && onOpenModal && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal();
          }}
          className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-[10px] z-30 transition-colors cursor-pointer shadow-md"
          title="Ver diseño completo ampliado"
        >
          👁️
        </button>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          CASO A: SPLIT LATERAL (Texto y precio a la izquierda, plato a la derecha)
         ════════════════════════════════════════════════════════════════════ */}
      {isSplitLeft && (
        <>
          {/* Degradado lateral izquierdo que protege los textos */}
          <div className="absolute inset-y-0 left-0 w-[64%] bg-gradient-to-r from-black/95 via-black/85 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-black/75 to-transparent pointer-events-none z-10" />

          {/* Badge superior (colocado en la esquina superior derecha o izquierda) */}
          {template.badgeText && (
            <div
              className={`absolute z-20 pointer-events-none ${
                isModal ? "top-3 right-3" : "top-1.5 right-1.5"
              }`}
            >
              <span
                className={`font-black uppercase tracking-wider rounded shadow-md truncate ${
                  isModal ? "text-[10px] px-2.5 py-1" : "text-[7px] px-1.5 py-0.5 max-w-[80px]"
                }`}
                style={{
                  backgroundColor: template.badgeBgColor || "#0f172a",
                  color: template.badgeTextColor || "#ffffff",
                }}
              >
                {template.badgeText}
              </span>
            </div>
          )}

          {/* Columna lateral izquierda con los textos */}
          <div
            className={`absolute inset-y-0 left-0 w-[58%] z-20 pointer-events-none flex flex-col justify-center text-left ${
              isModal ? "p-5 space-y-2" : "p-2 space-y-0.5"
            }`}
          >
            {scriptText && (
              <span
                className={`font-serif italic text-amber-300 drop-shadow leading-tight truncate ${
                  isModal ? "text-sm" : "text-[7.5px]"
                }`}
              >
                {scriptText}
              </span>
            )}

            <h3
              className={`${headlineFontClass} leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] ${
                isModal ? "text-2xl" : "text-[10px] line-clamp-2"
              }`}
              style={{ color: template.headlineColor || "#ffffff" }}
            >
              {rawTitle}
            </h3>

            {template.subheadlinePattern && (
              <p
                className={`text-white/85 font-medium leading-snug drop-shadow ${
                  isModal ? "text-xs line-clamp-2" : "text-[7px] line-clamp-1"
                }`}
              >
                {template.subheadlinePattern}
              </p>
            )}

            <div className={`flex items-center gap-1 flex-wrap ${isModal ? "pt-2" : "pt-0.5"}`}>
              {priceDisplay && (
                <span
                  className={`font-black rounded shadow ${
                    isModal ? "text-sm px-2.5 py-0.5" : "text-[7.5px] px-1 py-0.2"
                  }`}
                  style={{
                    backgroundColor: template.priceBgColor || "#fbbf24",
                    color: template.priceTextColor || "#0f172a",
                  }}
                >
                  {priceDisplay}
                </span>
              )}

              <span
                className={`font-black uppercase tracking-wider rounded shadow truncate ${
                  isModal ? "text-xs px-3 py-1.5" : "text-[7px] px-1 py-0.2 max-w-[62px]"
                }`}
                style={{
                  backgroundColor: template.ctaBgColor || "#fbbf24",
                  color: template.ctaTextColor || "#0f172a",
                }}
              >
                {template.ctaText}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          CASO B: RECETA CON INGREDIENTES (Cabecera arriba + Tira de ingredientes abajo)
         ════════════════════════════════════════════════════════════════════ */}
      {isRecipe && (
        <>
          <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-black/90 via-black/60 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/95 via-black/85 to-transparent pointer-events-none z-10" />

          {/* Cabecera superior */}
          <div
            className={`absolute inset-x-0 top-0 text-center z-20 pointer-events-none space-y-0.5 ${
              isModal ? "p-3.5 space-y-1" : "p-1.5"
            }`}
          >
            <div className="flex justify-center">
              <span
                className={`font-black uppercase tracking-wider rounded shadow-md truncate ${
                  isModal ? "text-[10px] px-2.5 py-0.5" : "text-[7px] px-1.5 py-0.2"
                }`}
                style={{
                  backgroundColor: template.badgeBgColor || "#0f172a",
                  color: template.badgeTextColor || "#ffffff",
                }}
              >
                {template.badgeText}
              </span>
            </div>

            <h3
              className={`${headlineFontClass} text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] px-1 leading-tight ${
                isModal ? "text-xl" : "text-[9.5px] truncate"
              }`}
              style={{ color: template.headlineColor }}
            >
              {rawTitle}
            </h3>

            {scriptText && (
              <p
                className={`font-serif italic text-amber-200/90 leading-tight drop-shadow truncate ${
                  isModal ? "text-xs" : "text-[7px]"
                }`}
              >
                {scriptText}
              </p>
            )}
          </div>

          {/* Tira inferior de ingredientes */}
          <div
            className={`absolute inset-x-0 bottom-0 text-center z-20 pointer-events-none ${
              isModal ? "p-3.5 space-y-2" : "p-1 space-y-0.5"
            }`}
          >
            <div className="flex items-center justify-center gap-1 overflow-hidden px-1">
              {(ingredients.length > 0
                ? ingredients
                : [
                    { icon: "🧄", name: "Ajo", amount: "4 dientes" },
                    { icon: "🍝", name: "Pasta", amount: "200 g" },
                    { icon: "🫒", name: "Aceite", amount: "2 cdas" },
                    { icon: "🧀", name: "Queso", amount: "Al gusto" },
                  ]
              )
                .slice(0, isModal ? 5 : 4)
                .map((ing, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center bg-black/65 backdrop-blur-xs border border-white/20 rounded shadow-xs text-center shrink-0 ${
                      isModal ? "px-2 py-1.5 min-w-[55px] rounded-xl" : "px-1 py-0.5 min-w-[28px]"
                    }`}
                  >
                    <span className={isModal ? "text-base mb-0.5" : "text-[8px] leading-none"}>
                      {ing.icon || "🥗"}
                    </span>
                    <span
                      className={`font-bold text-white leading-tight truncate ${
                        isModal ? "text-[9px] max-w-[55px]" : "text-[6.5px] max-w-[32px]"
                      }`}
                    >
                      {ing.name}
                    </span>
                    {isModal && ing.amount && (
                      <span className="text-[8px] text-amber-300 font-medium leading-tight truncate max-w-[55px]">
                        {ing.amount}
                      </span>
                    )}
                  </div>
                ))}
            </div>

            <div className="flex justify-center pt-0.5">
              <span
                className={`font-black uppercase tracking-wider rounded-full shadow-md truncate ${
                  isModal ? "text-xs px-4 py-1.5" : "text-[6.5px] px-2 py-0.5 max-w-[90px]"
                }`}
                style={{
                  backgroundColor: template.ctaBgColor || "#fbbf24",
                  color: template.ctaTextColor || "#0f172a",
                }}
              >
                {template.ctaText}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          CASO C: IMPACTO INFERIOR / OFERTAS FLASH / DELIVERY (Bloque en el tercio inferior)
         ════════════════════════════════════════════════════════════════════ */}
      {!isSplitLeft && !isRecipe && isImpact && (
        <>
          <div className="absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-black/98 via-black/85 to-transparent pointer-events-none z-10" />

          {/* Badge superior llamativo */}
          {template.badgeText && (
            <div
              className={`absolute z-20 pointer-events-none ${
                isModal ? "top-3 left-3" : "top-1.5 left-1.5"
              }`}
            >
              <span
                className={`font-black uppercase tracking-wider rounded shadow-md truncate ${
                  isModal ? "text-xs px-3 py-1" : "text-[7.5px] px-1.5 py-0.5 max-w-[100px]"
                }`}
                style={{
                  backgroundColor: template.badgeBgColor || "#dc2626",
                  color: template.badgeTextColor || "#ffffff",
                }}
              >
                {template.badgeText}
              </span>
            </div>
          )}

          {/* Bloque de impacto en el tercio inferior */}
          <div
            className={`absolute inset-x-0 bottom-0 text-left z-20 pointer-events-none ${
              isModal ? "p-4 space-y-1.5" : "p-2 space-y-0.5"
            }`}
          >
            <h3
              className={`${headlineFontClass} leading-tight drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] ${
                isModal ? "text-2xl" : "text-[10px] truncate"
              }`}
              style={{ color: template.headlineColor || "#fbbf24" }}
            >
              {rawTitle}
            </h3>

            {template.subheadlinePattern && (
              <p
                className={`text-white/90 font-medium leading-tight drop-shadow truncate ${
                  isModal ? "text-xs" : "text-[7px]"
                }`}
              >
                {template.subheadlinePattern}
              </p>
            )}

            <div className={`flex items-center gap-1.5 ${isModal ? "pt-1" : "pt-0.5"}`}>
              {priceDisplay && (
                <span
                  className={`font-black rounded shadow ${
                    isModal ? "text-sm px-3 py-1" : "text-[7.5px] px-1.5 py-0.2"
                  }`}
                  style={{
                    backgroundColor: template.priceBgColor || "#dc2626",
                    color: template.priceTextColor || "#ffffff",
                  }}
                >
                  {priceDisplay}
                </span>
              )}

              <span
                className={`font-black uppercase tracking-wider rounded shadow truncate ${
                  isModal ? "text-xs px-3.5 py-1.5" : "text-[7px] px-1.5 py-0.2 max-w-[80px]"
                }`}
                style={{
                  backgroundColor: template.ctaBgColor || "#fbbf24",
                  color: template.ctaTextColor || "#0f172a",
                }}
              >
                {template.ctaText}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          CASO D: EDITORIAL / GOURMET & MENÚ (Titular estilizado + Centro despejado)
         ════════════════════════════════════════════════════════════════════ */}
      {!isSplitLeft && !isRecipe && !isImpact && isEditorial && (
        <>
          <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-black/85 via-black/50 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/85 to-transparent pointer-events-none z-10" />

          {/* Cabecera Editorial arriba */}
          <div
            className={`absolute inset-x-0 top-0 text-center z-20 pointer-events-none ${
              isModal ? "p-3.5 space-y-1" : "p-1.5 space-y-0.5"
            }`}
          >
            {template.badgeText && (
              <div className="flex justify-center">
                <span
                  className={`font-serif tracking-widest uppercase rounded shadow truncate ${
                    isModal ? "text-[9px] px-2.5 py-0.5" : "text-[6.5px] px-1 py-0.2"
                  }`}
                  style={{
                    backgroundColor: template.badgeBgColor || "rgba(15,23,42,0.8)",
                    color: template.badgeTextColor || "#ffffff",
                  }}
                >
                  {template.badgeText}
                </span>
              </div>
            )}

            <h3
              className={`${headlineFontClass} text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] px-2 leading-tight ${
                isModal ? "text-2xl" : "text-[10px] truncate"
              }`}
              style={{ color: template.headlineColor }}
            >
              {rawTitle}
            </h3>

            {template.subheadlinePattern && (
              <p
                className={`font-serif italic text-amber-200/90 leading-tight drop-shadow truncate ${
                  isModal ? "text-xs" : "text-[7px]"
                }`}
              >
                {template.subheadlinePattern}
              </p>
            )}
          </div>

          {/* Pie Editorial abajo */}
          <div
            className={`absolute inset-x-0 bottom-0 flex items-center justify-between z-20 pointer-events-none ${
              isModal ? "p-4" : "p-1.5"
            }`}
          >
            {priceDisplay ? (
              <span
                className={`font-black rounded shadow ${
                  isModal ? "text-xs px-2.5 py-1" : "text-[7.5px] px-1 py-0.2"
                }`}
                style={{
                  backgroundColor: template.priceBgColor || "#0f172a",
                  color: template.priceTextColor || "#fbbf24",
                }}
              >
                {priceDisplay}
              </span>
            ) : <div />}

            <span
              className={`font-black uppercase tracking-wider rounded shadow truncate ${
                isModal ? "text-xs px-3 py-1.5" : "text-[7px] px-1.5 py-0.2 max-w-[80px]"
              }`}
              style={{
                backgroundColor: template.ctaBgColor || "#fbbf24",
                color: template.ctaTextColor || "#0f172a",
              }}
            >
              {template.ctaText}
            </span>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          CASO E: TOP BANNER / PROMOCIONES & COMBOS (Estándar: Arriba y Pie)
         ════════════════════════════════════════════════════════════════════ */}
      {!isSplitLeft && !isRecipe && !isImpact && !isEditorial && (
        <>
          <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-black/90 via-black/55 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none z-10" />

          {/* Cabecera superior centrada */}
          <div
            className={`absolute inset-x-0 top-0 text-center z-20 pointer-events-none ${
              isModal ? "p-3.5 space-y-1" : "p-1.5 space-y-0.5"
            }`}
          >
            {template.badgeText && (
              <div className="flex justify-center">
                <span
                  className={`font-black uppercase tracking-wider rounded shadow-md truncate ${
                    isModal ? "text-[10px] px-2.5 py-0.5" : "text-[7px] px-1.5 py-0.2"
                  }`}
                  style={{
                    backgroundColor: template.badgeBgColor || "#0f172a",
                    color: template.badgeTextColor || "#ffffff",
                  }}
                >
                  {template.badgeText}
                </span>
              </div>
            )}

            <h3
              className={`${headlineFontClass} text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] px-2 leading-tight ${
                isModal ? "text-2xl" : "text-[10px] truncate"
              }`}
              style={{ color: template.headlineColor }}
            >
              {rawTitle}
            </h3>

            {template.subheadlinePattern && (
              <p
                className={`text-white/90 font-medium leading-tight drop-shadow truncate ${
                  isModal ? "text-xs" : "text-[7px]"
                }`}
              >
                {template.subheadlinePattern}
              </p>
            )}
          </div>

          {/* Pie inferior con precio y botón CTA */}
          <div
            className={`absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none ${
              isModal ? "p-4 gap-2" : "p-1.5"
            }`}
          >
            {priceDisplay && (
              <span
                className={`font-black rounded shadow ${
                  isModal ? "text-xs px-2.5 py-1" : "text-[7.5px] px-1.5 py-0.2"
                }`}
                style={{
                  backgroundColor: template.priceBgColor || "#fbbf24",
                  color: template.priceTextColor || "#0f172a",
                }}
              >
                {priceDisplay}
              </span>
            )}

            <span
              className={`font-black uppercase tracking-wider rounded shadow truncate ${
                isModal ? "text-xs px-3.5 py-1.5" : "text-[7px] px-1.5 py-0.2 max-w-[80px]"
              }`}
              style={{
                backgroundColor: template.ctaBgColor || "#fbbf24",
                color: template.ctaTextColor || "#0f172a",
              }}
            >
              {template.ctaText}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default function VendedoresPwaPage() {
  const router = useRouter();

  // Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loadingAuth, setLoadingAuth] = useState(true);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"crear" | "historial">("crear");

  // Step 1: Prospect Data
  const [prospectName, setProspectName] = useState("");
  const [prospectBusiness, setProspectBusiness] = useState("");
  const [countryCode, setCountryCode] = useState("+56");
  const [prospectPhone, setProspectPhone] = useState("");
  const [rubro, setRubro] = useState(COMMON_NICHES[0].label);
  const [offerText, setOfferText] = useState("");
  const [dishOrProductName, setDishOrProductName] = useState("");

  // Step 2: Assets & Logo
  const [badgeCustomText, setBadgeCustomText] = useState("");
  const [badgeStyle, setBadgeStyle] = useState<BadgeStyle>("sticker-circle");
  const [baseImageFile, setBaseImageFile] = useState<File | null>(null);
  const [baseImagePreview, setBaseImagePreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [removeLogoBg, setRemoveLogoBg] = useState(false);
  const [cleanedLogoUrl, setCleanedLogoUrl] = useState("");
  const [isRemovingLogoBg, setIsRemovingLogoBg] = useState(false);
  const [logoPosition, setLogoPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("top-right");

  // Step 3: Styles & Motor Visual
  const [visualStyleSource, setVisualStyleSource] = useState<"preset_styles" | "commercial_image">("preset_styles");
  const [commercialIdea, setCommercialIdea] = useState("");
  const [commercialIncludeText, setCommercialIncludeText] = useState(true);
  const [commercialCustomText, setCommercialCustomText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isStyleFilterModalOpen, setIsStyleFilterModalOpen] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<PromptTemplate[]>([HARDCODED_STYLES[0]]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(HARDCODED_STYLES[0]);
  const [allTemplates, setAllTemplates] = useState<PromptTemplate[]>(HARDCODED_STYLES);

  // Sincronizar selectedTemplate con el primer estilo seleccionado
  useEffect(() => {
    if (selectedStyles.length > 0) {
      setSelectedTemplate(selectedStyles[0]);
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedStyles]);

  // Manejo de multiselección de estilos (hasta 3)
  const handleToggleStyle = (template: PromptTemplate) => {
    setSelectedStyles((prev) => {
      const exists = prev.some((s) => s.id === template.id);
      if (exists) {
        if (prev.length === 1) return prev; // Mantener al menos 1
        return prev.filter((s) => s.id !== template.id);
      } else {
        if (prev.length >= 3) {
          // Si ya hay 3, rotar reemplazando el último
          return [prev[0], prev[1], template];
        }
        return [...prev, template];
      }
    });
  };

  // Step 4: Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [canvasImageUrl, setCanvasImageUrl] = useState("");
  const [butterflyUrl, setButterflyUrl] = useState("");
  const [createdDemoId, setCreatedDemoId] = useState("");
  const [generatedPostCaption, setGeneratedPostCaption] = useState("");
  const [customWhatsappCopy, setCustomWhatsappCopy] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyPostSuccess, setCopyPostSuccess] = useState(false);

  // Novedades de Laboratorio: Cantidad de Posts (máx 3), Formatos (post y carrusel), Precios y Estrategia
  const [postsCount, setPostsCount] = useState<number>(3); // 1 a 3
  const [allowedTypes, setAllowedTypes] = useState<("post" | "carrusel")[]>([
    "post",
    "carrusel",
  ]);
  const [isCommercialPoster, setIsCommercialPoster] = useState<boolean>(true);
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
  const [productPrice, setProductPrice] = useState<string>("");
  const [generatedPublications, setGeneratedPublications] = useState<any[]>([]);
  const [generatedStrategy, setGeneratedStrategy] = useState<any>(null);
  const [selectedPreviewPubIndex, setSelectedPreviewPubIndex] = useState<number>(0);
  const [isGeneratingSingleImg, setIsGeneratingSingleImg] = useState<boolean>(false);
  const [isRenderingPoster, setIsRenderingPoster] = useState<boolean>(false);
  const [uploadedBaseImageUrl, setUploadedBaseImageUrl] = useState<string>("");
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string>("");
  const [selectedTextTemplateId, setSelectedTextTemplateId] = useState<string>(
    DEFAULT_TEXT_TEMPLATES[0]?.id || ""
  );
  const [textTemplateCategory, setTextTemplateCategory] = useState<string>("Todas");
  const [textTemplateViewMode, setTextTemplateViewMode] = useState<"grid" | "list">("grid");
  const [previewModalTemplate, setPreviewModalTemplate] = useState<TextTemplate | null>(null);

  // Modal para cambiar estilo visual de una publicación individual (#1, #2 o #3)
  const [isChangeStyleModalOpen, setIsChangeStyleModalOpen] = useState<boolean>(false);
  const [changeStylePubIndex, setChangeStylePubIndex] = useState<number>(0);
  const [changeStyleSearch, setChangeStyleSearch] = useState<string>("");
  const [changeStyleCategory, setChangeStyleCategory] = useState<string>("all");

  // Sincronizar la plantilla seleccionada cuando el vendedor cambia de muestra (#1, #2, #3)
  useEffect(() => {
    const activeTplId = generatedPublications[selectedPreviewPubIndex]?.textTemplateId;
    if (activeTplId) {
      setSelectedTextTemplateId(activeTplId);
    }
  }, [selectedPreviewPubIndex, generatedPublications]);

  const handleToggleType = (type: "post" | "carrusel") => {
    setAllowedTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Step 4b: Video Generation State
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState("");
  const [videoError, setVideoError] = useState("");
  const [selectedVideoStyle, setSelectedVideoStyle] = useState<FlowCommandDef>(FLOW_COMMANDS[0]);
  const [selectedVideoCategory, setSelectedVideoCategory] = useState<string>("Todas");
  const [customVideoPrompt, setCustomVideoPrompt] = useState("");
  const [manualVideoUrlInput, setManualVideoUrlInput] = useState("");

  // WhatsApp Sending State
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState<string | null>(null);
  const [whatsAppSuccessMsg, setWhatsAppSuccessMsg] = useState("");
  const [whatsAppErrorMsg, setWhatsAppErrorMsg] = useState("");
  const [attachImageToWhatsApp, setAttachImageToWhatsApp] = useState(false);

  // History State
  const [historyDemos, setHistoryDemos] = useState<ProspectDemo[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"todos" | "vistos" | "interesados" | "cerrados" | "seguimiento">("todos");

  // Estado Seguimiento / Follow-Up (Punto 2)
  const [followUpDemo, setFollowUpDemo] = useState<ProspectDemo | null>(null);
  const [followUpMsg, setFollowUpMsg] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [followUpSuccessMsg, setFollowUpSuccessMsg] = useState("");
  const [followUpErrorMsg, setFollowUpErrorMsg] = useState("");

  // Estado actualización de Outcome (Punto 5)
  const [updatingOutcomeId, setUpdatingOutcomeId] = useState<string | null>(null);

  // Estado Modal Cambiar Contraseña del Vendedor
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [newPassInput, setNewPassInput] = useState("");
  const [confirmPassInput, setConfirmPassInput] = useState("");
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassError, setChangePassError] = useState("");
  const [changePassSuccess, setChangePassSuccess] = useState("");

  // Input refs
  const baseImageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 1. PWA BeforeInstallPrompt listener
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      // Check if iOS
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosInstallModal(true);
      } else {
        alert("Para instalar la app, abre el menú de tu navegador (los tres puntos arriba a la derecha) y selecciona 'Instalar aplicación' o 'Agregar a la pantalla principal'.");
      }
    }
  };

  // 2. Auth Guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/vendedores/login");
        return;
      }
      setCurrentUser(user);

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.data()?.role || "user";
        setUserRole(role);

        const email = (user.email || "").toLowerCase();
        const isAllowed =
          email === "santisoftai@gmail.com" ||
          ADMIN_EMAILS.includes(email) ||
          role === "admin" ||
          role === "vendedor";

        if (!isAllowed) {
          await signOut(auth);
          router.replace("/vendedores/login");
          return;
        }

        // Si debe cambiar su contraseña inicial, abrir modal (solo para cuentas con contraseña tradicional)
        const isGoogleAccount =
          email.endsWith("@gmail.com") ||
          user.providerData.some((p) => p.providerId === "google.com");

        if (!isGoogleAccount && userDoc.data()?.mustChangePassword) {
          setShowChangePassModal(true);
        }

        // Cargar estilos desde Firestore
        try {
          const snap = await getDocs(collection(db, "prompt_library"));
          const loaded: PromptTemplate[] = [];
          const dbIds = new Set<string>();
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            dbIds.add(docSnap.id);
            if (!data.isDeleted && data.title?.trim() && data.prompt?.trim()) {
              loaded.push({
                id: docSnap.id,
                ...data,
                previewUrl: data.previewImageUrl || data.previewUrl || "",
              } as PromptTemplate);
            }
          });
          HARDCODED_STYLES.forEach((style) => {
            if (!dbIds.has(style.id)) loaded.push(style);
          });
          setAllTemplates(loaded);
        } catch (err) {
          console.warn("No se pudo cargar prompt_library, usando estilos locales:", err);
        }
      } catch (err) {
        console.error("Error al validar rol de vendedor:", err);
        router.replace("/vendedores/login");
      } finally {
        setLoadingAuth(false);
      }
    });

    return () => unsub();
  }, [router]);

  // 3. Load History
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/muestras", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.demos)) {
          setHistoryDemos(data.demos);
        }
      }
    } catch (err) {
      console.warn("Error cargando historial de muestras:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "historial" && currentUser) {
      loadHistory();
    }
  }, [activeTab, currentUser]);

  // 4. Actualizar mensaje de WhatsApp automáticamente
  useEffect(() => {
    const defaultMsg = buildWhatsAppCopy(
      prospectName,
      prospectBusiness,
      dishOrProductName,
      offerText,
      createdDemoId,
      generatedStrategy?.schedulePlan,
      generatedPublications
    );
    setCustomWhatsappCopy(defaultMsg);
  }, [prospectName, prospectBusiness, offerText, dishOrProductName, createdDemoId, generatedStrategy, generatedPublications]);

  // 5. Filtro de estilos interactivo y conteo de categorías
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allTemplates.length };
    allTemplates.forEach((t) => {
      const cats = getPromptCategories(t);
      cats.forEach((c) => {
        counts[c] = (counts[c] || 0) + 1;
      });
    });
    return counts;
  }, [allTemplates]);

  const allCategoryNames = useMemo(() => {
    const set = new Set<string>();
    allTemplates.forEach((t) => {
      getPromptCategories(t).forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [allTemplates]);

  const toggleCategory = (cat: string) => {
    if (cat === "all") {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const filteredTemplates = allTemplates.filter((template) => {
    const cats = getPromptCategories(template);
    const matchCategory =
      selectedCategories.length === 0 ||
      selectedCategories.some((c) => cats.includes(c));
    const matchSearch =
      searchTerm.trim() === "" ||
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  // 6. Carga de imagen base
  const handleBaseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBaseImageFile(file);
      const url = URL.createObjectURL(file);
      setBaseImagePreview(url);
      setUploadedBaseImageUrl(url);
    }
  };

  // 7. Carga de logo y eliminación de fondo
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const originalPreview = URL.createObjectURL(file);
      setLogoPreview(originalPreview);

      if (removeLogoBg) {
        setIsRemovingLogoBg(true);
        try {
          const transparentDataUrl = await removeLogoBackground(file);
          setCleanedLogoUrl(transparentDataUrl);
        } catch (bgErr) {
          console.warn("Error eliminando fondo del logo:", bgErr);
        } finally {
          setIsRemovingLogoBg(false);
        }
      } else {
        setCleanedLogoUrl("");
      }
    }
  };

  const handleToggleRemoveLogoBg = async (checked: boolean) => {
    setRemoveLogoBg(checked);
    if (checked) {
      if (logoFile || logoPreview) {
        setIsRemovingLogoBg(true);
        try {
          const transparentDataUrl = await removeLogoBackground(logoFile || logoPreview);
          setCleanedLogoUrl(transparentDataUrl);
        } catch (bgErr) {
          console.warn("Error eliminando fondo del logo:", bgErr);
        } finally {
          setIsRemovingLogoBg(false);
        }
      }
    } else {
      setCleanedLogoUrl("");
    }
  };

  // 8. GENERAR MUESTRA CON AGENTES (Integrado con Laboratorio Multi-Publicación)
  const handleGenerateSample = async () => {
    if (!prospectBusiness.trim()) {
      alert("Por favor indica al menos el nombre del negocio o marca del prospecto.");
      return;
    }

    if (allowedTypes.length === 0) {
      alert("Selecciona al menos un formato de publicación (Post o Carrusel).");
      return;
    }

    setIsGenerating(true);
    setGeneratingStep("Preparando assets y conectando con nuestros agentes...");

    try {
      let uploadedBaseImageUrl = baseImagePreview;
      let uploadedLogoUrl = logoPreview;

      // 1. Subir imagen base si existe
      if (baseImageFile && currentUser?.uid) {
        setGeneratingStep("Subiendo foto real de producto...");
        const baseRef = ref(storage, `admin_demos/base_${Date.now()}_${baseImageFile.name}`);
        const snap = await uploadBytes(baseRef, baseImageFile);
        uploadedBaseImageUrl = await getDownloadURL(snap.ref);
      }

      // 2. Subir logo si existe
      if ((logoFile || cleanedLogoUrl) && currentUser?.uid) {
        setGeneratingStep("Subiendo logo del cliente...");
        let fileToUpload: File | Blob | null = logoFile;
        let ext = logoFile?.name ? logoFile.name.replace(/\.[^/.]+$/, "") : "logo";
        if (removeLogoBg && cleanedLogoUrl) {
          try {
            const blobRes = await fetch(cleanedLogoUrl);
            fileToUpload = await blobRes.blob();
            ext += "_clean.png";
          } catch (_) {}
        }

        if (fileToUpload) {
          const logoRef = ref(storage, `admin_demos/logo_${Date.now()}_${ext}`);
          const snap = await uploadBytes(logoRef, fileToUpload);
          uploadedLogoUrl = await getDownloadURL(snap.ref);
        }
      }

      setUploadedBaseImageUrl(uploadedBaseImageUrl);
      setUploadedLogoUrl(uploadedLogoUrl);

      // 3. Preparar ítems de catálogo con foto real si se subió
      const catalogItems = uploadedBaseImageUrl
        ? [
            {
              name: dishOrProductName.trim() || prospectBusiness.trim(),
              description: offerText.trim() || "",
              price: productPrice.trim() || "",
              imageUrl: uploadedBaseImageUrl,
              hasRealPhoto: true,
            },
          ]
        : [];

      // 4. Preparar estilos seleccionados sanitizados (hasta 3) incluyendo su fórmula maestra (prompt)
      const stylesToSend = (
        selectedStyles.length > 0
          ? selectedStyles.slice(0, 3)
          : selectedTemplate
          ? [selectedTemplate]
          : []
      ).map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        category: s.category,
        previewUrl: s.previewUrl,
        prompt: s.prompt || "",
        styleKeywords: s.styleKeywords || "",
        imageGenBehavior: s.imageGenBehavior || "product",
      }));

      // 5. Teléfono formateado
      const phoneToSave = prospectPhone.trim()
        ? `${countryCode}${prospectPhone.trim().replace(/^0+/, "")}`
        : "";

      setGeneratingStep(
        `Nuestros agentes están analizando el nicho y estructurando la estrategia...`
      );

      const stepTimer1 = setTimeout(() => {
        setGeneratingStep(
          `Diseñando ${postsCount} ${postsCount === 1 ? "publicación" : "publicaciones"} con los estilos seleccionados...`
        );
      }, 4500);

      const stepTimer2 = setTimeout(() => {
        setGeneratingStep(
          `Finalizando las muestras y el plan de 5 posts de nicho...`
        );
      }, 12000);

      const abortController = new AbortController();
      const abortTimeout = setTimeout(() => abortController.abort(), 90000);

      let token = "";
      try {
        token = (await auth.currentUser?.getIdToken()) || "";
      } catch {
        // En PWA offline o token transitorio
      }

      let res: Response;
      try {
        res = await fetch("/api/laboratorio/generar-muestra", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            postsCount,
            allowedTypes,
            businessName: prospectBusiness.trim(),
            prospectName: prospectName.trim() || prospectBusiness.trim(),
            phone: phoneToSave,
            rubro,
            dishOrProductName: dishOrProductName.trim(),
            offerText: offerText.trim(),
            productPrice: productPrice.trim(),
            badgeCustomText: badgeCustomText.trim(),
            visualStyleSource,
            commercialIdea: commercialIdea.trim(),
            commercialIncludeText,
            commercialCustomText: commercialCustomText.trim(),
            isCommercialPoster: visualStyleSource === "commercial_image" ? commercialIncludeText : isCommercialPoster,
            includeWatermark,
            catalogItems,
            selectedStyles: visualStyleSource === "preset_styles" ? stylesToSend : [],
            logoUrl: uploadedLogoUrl || "",
            baseImageUrl: uploadedBaseImageUrl || "",
            sellerName: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Equipo Comercial",
            sellerEmail: currentUser?.email || "vendedores@santisoft.cl",
            userId: currentUser?.uid || "vendedor",
          }),
          signal: abortController.signal,
        });
      } finally {
        clearTimeout(abortTimeout);
        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "No se pudo generar la muestra con nuestros agentes.");
      }

      const data = await res.json();
      if (!data.success && !data.demoId) {
        throw new Error(data.error || "Error al generar la propuesta.");
      }

      const savedDemoId = data.demoId;
      setCreatedDemoId(savedDemoId);
      setGeneratedPublications(data.publications || []);
      setGeneratedStrategy(data.strategy || null);
      setSelectedPreviewPubIndex(0);

      const firstPub = data.publications?.[0];
      const mainImg = firstPub?.imageUrl || uploadedBaseImageUrl || "";
      setGeneratedImageUrl(mainImg);
      setCanvasImageUrl(mainImg);
      setGeneratedPostCaption(firstPub?.copy || "");

      // Mensaje de WhatsApp enriquecido con enlace, plan de 5 posts y copys
      const whatsappMsg =
        data.whatsappMessage ||
        buildWhatsAppCopy(
          prospectName,
          prospectBusiness,
          dishOrProductName,
          offerText,
          savedDemoId,
          data.strategy?.schedulePlan,
          data.publications
        );
      setCustomWhatsappCopy(whatsappMsg);

      // Recargar historial para reflejar la nueva muestra en tiempo real
      loadHistory();

      // Desplazamiento suave hacia la sección de resultados
      if (typeof window !== "undefined") {
        setTimeout(() => {
          const previewEl = document.getElementById("resultado-generacion");
          if (previewEl) {
            previewEl.scrollIntoView({ behavior: "smooth" });
          }
        }, 300);
      }
    } catch (err: any) {
      console.error("Error generando muestra con agentes:", err);
      if (err.name === "AbortError" || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        alert("La generación tomó más tiempo del esperado por la señal móvil o la conexión se interrumpió. Por favor verifica tu internet y vuelve a intentar.");
      } else {
        alert(`Hubo un problema al generar la muestra: ${err.message}`);
      }
    } finally {
      setIsGenerating(false);
      setGeneratingStep("");
    }
  };

  // 8a-1. Abrir modal para cambiar estilo visual de una publicación específica (#1, #2 o #3)
  const openChangeStyleModal = (pubIdx: number) => {
    setChangeStylePubIndex(pubIdx);
    setChangeStyleSearch("");
    setChangeStyleCategory("all");
    setIsChangeStyleModalOpen(true);
  };

  // 8a-2. Aplicar nuevo estilo visual a una publicación
  const handleApplyStyleToPub = (pubIndex: number, newStyle: PromptTemplate) => {
    setGeneratedPublications((prev) => {
      const copy = [...prev];
      if (copy[pubIndex]) {
        copy[pubIndex] = {
          ...copy[pubIndex],
          visualStyleTitle: newStyle.title,
          visualStyleId: newStyle.id,
          visualStylePrompt: newStyle.prompt,
          visualStyleKeywords: newStyle.styleKeywords || "",
        };
      }
      return copy;
    });
    setIsChangeStyleModalOpen(false);
  };

  // 8a-3. Aplicar nuevo estilo y regenerar imagen de inmediato (1 a 1)
  const handleApplyAndRegenerateStyle = async (pubIndex: number, newStyle: PromptTemplate) => {
    handleApplyStyleToPub(pubIndex, newStyle);
    await handleGenerateSingleImage(pubIndex, newStyle);
  };

  // 8b. Generar imagen individualmente (1 por 1) vía webhook de nuestros agentes respetando el estilo asignado
  const handleGenerateSingleImage = async (pubIndex: number, newStyleOverride?: PromptTemplate) => {
    const pub = generatedPublications[pubIndex];
    if (!pub) return;

    const assignedStyleObj =
      newStyleOverride ||
      allTemplates.find(
        (t) =>
          (pub.visualStyleId && t.id === pub.visualStyleId) ||
          (pub.visualStyleTitle && t.title.toLowerCase() === pub.visualStyleTitle.toLowerCase())
      ) ||
      selectedStyles[pubIndex % Math.max(1, selectedStyles.length)] ||
      selectedTemplate ||
      null;

    const styleTitleToSend = newStyleOverride?.title || pub.visualStyleTitle || assignedStyleObj?.title || "";
    const styleIdToSend = newStyleOverride?.id || pub.visualStyleId || assignedStyleObj?.id || "";
    const stylePromptToSend = newStyleOverride?.prompt || pub.visualStylePrompt || assignedStyleObj?.prompt || "";
    const styleKeywordsToSend = newStyleOverride?.styleKeywords || pub.visualStyleKeywords || assignedStyleObj?.styleKeywords || "";

    setIsGeneratingSingleImg(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/laboratorio/generar-imagen-individual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          demoId: createdDemoId,
          pubIndex,
          promptEnglish: newStyleOverride
            ? `Commercial advertising photography of ${pub.dishOrProductName || dishOrProductName || prospectBusiness}, ${newStyleOverride.title}`
            : (pub.imagePromptEnglish || pub.title),
          rubro,
          productName: pub.dishOrProductName || dishOrProductName || prospectBusiness,
          aspectRatio: pub.type === "reel" ? "9:16" : "1:1",
          isCommercialPoster: pub.isCommercialPoster ?? (commercialIncludeText && isCommercialPoster),
          businessName: prospectBusiness || prospectName,
          productDescription: commercialCustomText || offerText || pub.description || pub.title || "",
          price: pub.productPrice || productPrice || "",
          idea: commercialIdea || pub.hook || pub.title || "",
          logoUrl: cleanedLogoUrl || logoPreview || "",
          customBadgeText: badgeCustomText || "",
          styleId: styleIdToSend,
          styleTitle: styleTitleToSend,
          stylePrompt: stylePromptToSend,
          styleKeywords: styleKeywordsToSend,
          baseImageUrl: pub.origBaseImageUrl || uploadedBaseImageUrl || baseImagePreview || "",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "No se pudo generar la imagen individual.");
      }

      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedPublications((prev) => {
          const copy = [...prev];
          if (copy[pubIndex]) {
            copy[pubIndex] = {
              ...copy[pubIndex],
              imageUrl: data.imageUrl,
              baseImageUrl: data.baseImageUrl || data.imageUrl,
              textTemplateId: data.templateId || copy[pubIndex].textTemplateId,
              textTemplateName: data.templateName || copy[pubIndex].textTemplateName,
              visualStyleTitle: styleTitleToSend || copy[pubIndex].visualStyleTitle,
              visualStyleId: styleIdToSend || copy[pubIndex].visualStyleId,
              visualStylePrompt: stylePromptToSend || copy[pubIndex].visualStylePrompt,
              visualStyleKeywords: styleKeywordsToSend || copy[pubIndex].visualStyleKeywords,
            };
          }
          return copy;
        });

        if (pubIndex === 0) {
          setGeneratedImageUrl(data.imageUrl);
          setCanvasImageUrl(data.imageUrl);
        }
      }
    } catch (err: any) {
      console.error("Error generando imagen individual con agentes:", err);
      alert(`No se pudo generar la imagen individual: ${err.message}`);
    } finally {
      setIsGeneratingSingleImg(false);
    }
  };

  // 8c. Renderizar y Guardar Cartel Publicitario con la Plantilla de Texto Seleccionada (para Landing pública)
  const handleRenderAndSavePoster = async (pubIndex: number, explicitTemplateId?: string) => {
    const pub = generatedPublications[pubIndex];
    if (!pub) return;

    // Priorizar siempre pub.baseImageUrl (la imagen limpia estilizada sin textos superpuestos)
    const baseImg = pub.baseImageUrl || pub.origBaseImageUrl || pub.imageUrl || baseImagePreview;
    if (!baseImg) {
      alert("No se encontró una imagen base para estampar los textos. Sube una foto o genera una imagen primero.");
      return;
    }

    const targetTemplateId = explicitTemplateId || selectedTextTemplateId || pub.textTemplateId || "";

    setIsRenderingPoster(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/laboratorio/renderizar-cartel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          demoId: createdDemoId,
          pubIndex,
          baseImageUrl: baseImg,
          productName: pub.dishOrProductName || dishOrProductName.trim() || prospectBusiness.trim(),
          productDescription: commercialCustomText.trim() || offerText.trim() || pub.hook || pub.title || "",
          price: pub.productPrice || productPrice.trim() || "",
          customBadgeText: badgeCustomText.trim() || "",
          businessName: prospectBusiness.trim() || prospectName.trim(),
          rubro,
          aspectRatio: pub.type === "reel" ? "9:16" : "1:1",
          logoUrl: cleanedLogoUrl || logoPreview || "",
          templateId: targetTemplateId,
          currentTemplateId: pub.textTemplateId || "",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "No se pudo renderizar el cartel publicitario.");
      }

      const data = await res.json();
      if (data.imageUrl) {
        if (data.templateId) {
          setSelectedTextTemplateId(data.templateId);
        }
        setGeneratedPublications((prev) => {
          const copy = [...prev];
          if (copy[pubIndex]) {
            const isCarousel = copy[pubIndex].type === "carrusel";
            const updatedCarousel = isCarousel && Array.isArray(copy[pubIndex].carouselImages)
              ? [data.imageUrl, ...copy[pubIndex].carouselImages.slice(1)]
              : copy[pubIndex].carouselImages;

            copy[pubIndex] = {
              ...copy[pubIndex],
              imageUrl: data.imageUrl,
              baseImageUrl: baseImg,
              isCommercialPoster: true,
              textTemplateId: data.templateId || targetTemplateId || copy[pubIndex].textTemplateId,
              textTemplateName: data.templateName || copy[pubIndex].textTemplateName,
              carouselImages: updatedCarousel,
              ...(data.editDocId ? { commercialEditId: data.editDocId } : {}),
            };
          }
          return copy;
        });

        if (pubIndex === 0) {
          setGeneratedImageUrl(data.imageUrl);
          setCanvasImageUrl(data.imageUrl);
        }
      }
    } catch (err: any) {
      console.error("Error renderizando cartel con agentes:", err);
      alert(`No se pudo renderizar el cartel: ${err.message}`);
    } finally {
      setIsRenderingPoster(false);
    }
  };

  // 9. Enviar por WhatsApp vía Evolution API y n8n
  const handleSendWhatsApp = async (overrideDemoId?: string, overridePhone?: string, overrideMsg?: string) => {
    const targetId = overrideDemoId || createdDemoId;
    const rawTargetPhone = overridePhone || (prospectPhone.trim() ? `${countryCode}${prospectPhone.trim().replace(/^0+/, "")}` : "");
    let cleanPhone = rawTargetPhone.replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");
    if (cleanPhone.length === 9 && cleanPhone.startsWith("9")) {
      cleanPhone = "56" + cleanPhone;
    }

    if (!cleanPhone) {
      alert("Por favor ingresa el número de WhatsApp del prospecto para enviar la muestra.");
      return;
    }

    let messageToSend = (overrideMsg || customWhatsappCopy || "").trim();

    // SANITIZACIÓN ESTRICTA:
    // Asegurar que NUNCA se envíe una URL directa de Cloudinary ni placeholders en el texto de WhatsApp.
    // Siempre debe apuntar a la landing interactiva pública: https://rrss.santisoft.cl/m/${targetId}
    if (targetId) {
      const properLandingUrl = `${PUBLIC_APP_URL}/m/${targetId}`;
      messageToSend = messageToSend
        .replace(/https?:\/\/(?:res\.cloudinary\.com|firebasestorage\.googleapis\.com)[^\s]+/g, properLandingUrl)
        .replace(/https?:\/\/[^\s]*\/m\/\[(?:ID_DE_MUESTRA|ENLACE_DE_MUESTRA)\]/g, properLandingUrl)
        .replace(/\[(?:ID_DE_MUESTRA|ENLACE_DE_MUESTRA)\]/g, properLandingUrl);
    }

    if (!messageToSend && targetId) {
      messageToSend = buildWhatsAppCopy(prospectName, prospectBusiness, dishOrProductName, offerText, targetId);
    }

    if (!messageToSend) {
      alert("El mensaje de WhatsApp no puede estar vacío.");
      return;
    }

    setIsSendingWhatsApp(true);
    setSendingWhatsAppId(targetId || "current");
    setWhatsAppSuccessMsg("");
    setWhatsAppErrorMsg("");

    try {
      const token = await auth.currentUser?.getIdToken();

      // Solo adjuntar imagen si está habilitado y es una URL pública compatible (Cloudinary)
      let targetMediaUrl: string | null = null;
      if (attachImageToWhatsApp) {
        const potentialImg = canvasImageUrl || generatedImageUrl;
        if (potentialImg && typeof potentialImg === "string" && potentialImg.includes("cloudinary.com")) {
          targetMediaUrl = potentialImg;
        }
      }

      console.log("[WhatsApp Vendedores] Enviando propuesta a WhatsApp:", { phone: cleanPhone, hasMedia: !!targetMediaUrl });

      let delivered = false;

      // 1. Intento primario: Envío directo desde el navegador (conexión directa vía CORS con Evolution API)
      try {
        console.log("[WhatsApp Vendedores] Intentando entrega directa vía Evolution API (CORS)...");
        const endpoint = targetMediaUrl
          ? `${EVOLUTION_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`
          : `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`;

        const payload = targetMediaUrl
          ? {
              number: cleanPhone,
              mediatype: "image",
              mimetype: "image/jpeg",
              caption: messageToSend,
              media: targetMediaUrl,
            }
          : {
              number: cleanPhone,
              text: messageToSend,
            };

        const evoRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            apikey: EVOLUTION_API_KEY,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000), // Timeout holgado de 30s para Baileys
        });

        if (evoRes.ok) {
          const evoData = await evoRes.json().catch(() => ({}));
          console.log("[WhatsApp Vendedores] ✅ Entregado directamente por Evolution API:", evoData);
          delivered = true;

          // Registro asíncrono en backend y webhook n8n
          fetch("/api/admin/whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ phone: cleanPhone, text: messageToSend, logOnly: true }),
          }).catch(() => {});
        } else {
          const errText = await evoRes.text().catch(() => "");
          console.warn(`[WhatsApp Vendedores] Envío directo respondió ${evoRes.status}: ${errText}. Probando vía backend...`);
        }
      } catch (clientErr: any) {
        console.warn("[WhatsApp Vendedores] Envío directo por navegador omitido:", clientErr.message, "Probando vía backend...");
      }

      // 2. Intento secundario: Si falló el envío directo, intentar vía endpoint del backend
      if (!delivered) {
        const res = await fetch("/api/admin/whatsapp/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            phone: cleanPhone,
            text: messageToSend,
            ...(targetMediaUrl ? { mediaUrl: targetMediaUrl, mediaType: "image" } : {}),
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || data.details?.lastTextError || "No se pudo entregar el mensaje por WhatsApp");
        }
        delivered = true;
      }

      // 3. Notificación complementaria directa a webhook n8n
      fetch(N8N_EVOAPI_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          phone: cleanPhone,
          number: cleanPhone,
          text: messageToSend,
          demoId: targetId || null,
          demoUrl: targetId ? `${PUBLIC_APP_URL}/m/${targetId}` : null,
          deliveryStatus: "sent",
          deliveredMode: "vendedores_pwa",
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {});

      // Actualizar estado a "enviada" en Firestore y persistir el mensaje sanitizado
      if (targetId) {
        const sentIso = new Date().toISOString();
        await fetch("/api/admin/muestras", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: targetId,
            status: "enviada",
            whatsappMessage: messageToSend,
            sentAt: sentIso,
          }),
        });

        // Actualizar en el historial local
        setHistoryDemos((prev) =>
          prev.map((d) => (d.id === targetId ? { ...d, status: "enviada", whatsappMessage: messageToSend, sentAt: sentIso } : d))
        );
      }

      setWhatsAppSuccessMsg(`¡Propuesta enviada con éxito a +${cleanPhone} mediante WhatsApp y n8n!`);
      setTimeout(() => setWhatsAppSuccessMsg(""), 7000);
    } catch (err: any) {
      console.error("[WhatsApp Send Error]:", err);
      setWhatsAppErrorMsg(err.message || "No se pudo enviar el mensaje directamente.");
    } finally {
      setIsSendingWhatsApp(false);
      setSendingWhatsAppId(null);
    }
  };

  // 10. Generar Video Reel (9:16) con Agentes y n8n
  const handleGenerateVideo = async () => {
    const targetImage = canvasImageUrl || generatedImageUrl || baseImagePreview;
    if (!targetImage) {
      alert("Se requiere una imagen generada para crear el video.");
      return;
    }

    setIsGeneratingVideo(true);
    setVideoProgress("Iniciando motor de video con nuestros agentes...");
    setVideoError("");

    try {
      let finalVideoUrl = "";

      // 1. Intento directo al webhook de n8n
      try {
        const payload = {
          prospectBusiness: prospectBusiness.trim() || prospectName.trim(),
          dishOrProductName: dishOrProductName.trim(),
          offerText: offerText.trim(),
          styleTitle: selectedVideoStyle?.name || "Video Comercial Cinemático",
          prompt: customVideoPrompt || selectedVideoStyle?.defaultEnglishPrompt,
          baseImageUrl: targetImage,
          renderMode: "raw",
        };

        const directN8nRes = await fetch("https://n8n.santisoft.cl/webhook/video-premium", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(180000), // 3 min
        });

        if (directN8nRes.ok) {
          const directData = await directN8nRes.json().catch(() => ({}));
          if (directData.videoUrl || directData.url) {
            finalVideoUrl = directData.videoUrl || directData.url;
            console.log("[Video Frontend] ✅ Video recibido directamente de n8n:", finalVideoUrl);
          }
        }
      } catch (clientErr: any) {
        console.warn("[Video Frontend] Intento directo a webhook n8n omitido:", clientErr);
      }

      // 2. Si falló intento directo, llamar al endpoint del servidor /api/ai/image-to-video
      if (!finalVideoUrl) {
        setVideoProgress("Animando escenas y movimiento de cámara con nuestros agentes...");
        const res = await fetch("/api/ai/image-to-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: targetImage,
            prompt: customVideoPrompt || selectedVideoStyle?.defaultEnglishPrompt,
            motionStyle: selectedVideoStyle?.command || "/360 product orbit",
            businessName: prospectBusiness.trim() || prospectName.trim(),
            rubro,
            renderMode: "raw",
            logoUrl: cleanedLogoUrl || logoPreview || "",
            postId: createdDemoId || `demo_${Date.now()}`,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Fallo al generar el video con nuestros agentes.");
        }
        finalVideoUrl = data.videoUrl;
      }

      if (finalVideoUrl) {
        setGeneratedVideoUrl(finalVideoUrl);
        // Persistir en Firestore vinculándolo a la muestra actual
        if (createdDemoId) {
          const token = await auth.currentUser?.getIdToken();
          await fetch("/api/admin/muestras", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              id: createdDemoId,
              generatedVideoUrl: finalVideoUrl,
              videoStyleTitle: selectedVideoStyle?.name || null,
              videoPromptEnglish: customVideoPrompt || null,
            }),
          });

          // Actualizar en el estado de historial local
          setHistoryDemos((prev) =>
            prev.map((d) => (d.id === createdDemoId ? { ...d, generatedVideoUrl: finalVideoUrl } : d))
          );
        }
        setVideoProgress("¡Video 9:16 generado y enlazado con éxito a la propuesta interactiva!");
        setTimeout(() => setVideoProgress(""), 7000);
      } else {
        throw new Error("El motor no retornó una URL de video válida.");
      }
    } catch (err: any) {
      console.error("[Error generating video]:", err);
      setVideoError(err.message || "Error al procesar el video con nuestros agentes.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // 11. Enlazar video MP4 manual
  const handleSaveManualVideo = async () => {
    if (!manualVideoUrlInput.trim() || !createdDemoId) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch("/api/admin/muestras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: createdDemoId,
          generatedVideoUrl: manualVideoUrlInput.trim(),
        }),
      });
      setGeneratedVideoUrl(manualVideoUrlInput.trim());
      setHistoryDemos((prev) =>
        prev.map((d) => (d.id === createdDemoId ? { ...d, generatedVideoUrl: manualVideoUrlInput.trim() } : d))
      );
      setManualVideoUrlInput("");
      alert("¡Video enlazado con éxito a la muestra interactiva!");
    } catch (e: any) {
      alert("Error al enlazar el video: " + e.message);
    }
  };

  // 12. Copiar enlace al portapapeles
  const handleCopyDemoLink = (demoId: string) => {
    const url = `${PUBLIC_APP_URL}/m/${demoId}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // 13. Copiar Copy del Post
  const handleCopyPostCaption = () => {
    if (!generatedPostCaption) return;
    navigator.clipboard.writeText(generatedPostCaption);
    setCopyPostSuccess(true);
    setTimeout(() => setCopyPostSuccess(false), 2500);
  };

  // Alternar marca de agua en landing público para una demo creada
  const handleToggleWatermarkForDemo = async (demoId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    setIncludeWatermark(newVal);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch("/api/admin/muestras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: demoId,
          includeWatermark: newVal,
        }),
      });
      setHistoryDemos((prev) =>
        prev.map((d) => (d.id === demoId ? { ...d, includeWatermark: newVal } : d))
      );
    } catch (err) {
      console.error("Error actualizando marca de agua de demo:", err);
    }
  };

  // 14. Cargar demo anterior al editor
  const handleLoadDemoToEdit = (demo: ProspectDemo) => {
    setProspectName(demo.prospectName || "");
    setProspectBusiness(demo.prospectBusiness || "");
    setRubro(demo.rubro || COMMON_NICHES[0].label);
    setOfferText(demo.offerText || "");
    setDishOrProductName(demo.dishOrProductName || "");
    setBadgeCustomText(demo.badgeCustomText || "");
    if (demo.badgeStyle) setBadgeStyle(demo.badgeStyle);

    if (demo.prospectPhone) {
      const matched = COUNTRY_CODES.find((c) => demo.prospectPhone.startsWith(c.code));
      if (matched) {
        setCountryCode(matched.code);
        setProspectPhone(demo.prospectPhone.slice(matched.code.length));
      } else {
        setProspectPhone(demo.prospectPhone.replace(/^\+/, ""));
      }
    }

    const mainImg = demo.canvasImageUrl || demo.generatedImageUrl || "";
    setGeneratedImageUrl(demo.generatedImageUrl || mainImg);
    setCanvasImageUrl(demo.canvasImageUrl || mainImg);
    setButterflyUrl(demo.butterflyUrl || "");
    setGeneratedVideoUrl(demo.generatedVideoUrl || "");
    setGeneratedPostCaption(demo.generatedPostCaption || "");
    setCreatedDemoId(demo.id || "");
    if (demo.includeWatermark !== undefined) {
      setIncludeWatermark(demo.includeWatermark);
    }

    if (demo.whatsappMessage) {
      const properLandingUrl = demo.id ? `${PUBLIC_APP_URL}/m/${demo.id}` : "";
      const sanitized = properLandingUrl
        ? demo.whatsappMessage
            .replace(/https?:\/\/(?:res\.cloudinary\.com|firebasestorage\.googleapis\.com)[^\s]+/g, properLandingUrl)
            .replace(/https?:\/\/[^\s]*\/m\/\[(?:ID_DE_MUESTRA|ENLACE_DE_MUESTRA)\]/g, properLandingUrl)
            .replace(/\[(?:ID_DE_MUESTRA|ENLACE_DE_MUESTRA)\]/g, properLandingUrl)
        : demo.whatsappMessage;
      setCustomWhatsappCopy(sanitized);
    } else if (demo.id) {
      setCustomWhatsappCopy(
        buildWhatsAppCopy(
          demo.prospectName || "",
          demo.prospectBusiness || "",
          demo.dishOrProductName || "",
          demo.offerText || "",
          demo.id
        )
      );
    }

    if (demo.baseImageUrl) {
      setUploadedBaseImageUrl(demo.baseImageUrl);
      setBaseImagePreview(demo.baseImageUrl);
    }
    if (demo.logoUrl) {
      setUploadedLogoUrl(demo.logoUrl);
      setLogoPreview(demo.logoUrl);
    }
    if (demo.publications && Array.isArray(demo.publications) && demo.publications.length > 0) {
      setGeneratedPublications(demo.publications);
      setSelectedPreviewPubIndex(0);
    }
    if (demo.strategy) {
      setGeneratedStrategy(demo.strategy);
    }

    setActiveTab("crear");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 13.1 Abrir modal de seguimiento (Punto 2)
  const handleOpenFollowUp = (demo: ProspectDemo) => {
    if (!demo.id) return;
    const msg = buildFollowUpCopy(
      demo.prospectName || "",
      demo.prospectBusiness || "",
      demo.id,
      demo.viewCount || 0
    );
    setFollowUpDemo(demo);
    setFollowUpMsg(msg);
    setFollowUpSuccessMsg("");
    setFollowUpErrorMsg("");
  };

  // 13.2 Enviar seguimiento por WhatsApp (Punto 2)
  const handleSendFollowUp = async () => {
    if (!followUpDemo || !followUpDemo.id) return;
    const rawTargetPhone = followUpDemo.prospectPhone || "";
    const cleanPhone = rawTargetPhone.replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");

    if (!cleanPhone) {
      setFollowUpErrorMsg("El prospecto no tiene número de WhatsApp registrado.");
      return;
    }

    if (!followUpMsg.trim()) {
      setFollowUpErrorMsg("El mensaje de seguimiento no puede estar vacío.");
      return;
    }

    setIsSendingFollowUp(true);
    setFollowUpErrorMsg("");
    setFollowUpSuccessMsg("");

    try {
      const token = await auth.currentUser?.getIdToken();
      let delivered = false;

      // 1. Intento directo vía Evolution API (CORS)
      try {
        const evoRes = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            apikey: EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: cleanPhone,
            text: followUpMsg.trim(),
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (evoRes.ok) {
          delivered = true;
          fetch("/api/admin/whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ phone: cleanPhone, text: followUpMsg.trim(), logOnly: true }),
          }).catch(() => {});
        }
      } catch (clientErr) {
        console.warn("Direct follow-up failed, fallback to backend:", clientErr);
      }

      // 2. Intento secundario: Backend fallback
      if (!delivered) {
        const res = await fetch("/api/admin/whatsapp/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            phone: cleanPhone,
            text: followUpMsg.trim(),
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "No se pudo entregar el seguimiento por WhatsApp");
        }
        delivered = true;
      }

      // 3. Notificación complementaria directa a webhook n8n
      fetch(N8N_EVOAPI_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          phone: cleanPhone,
          number: cleanPhone,
          text: followUpMsg.trim(),
          demoId: followUpDemo.id,
          demoUrl: `${PUBLIC_APP_URL}/m/${followUpDemo.id}`,
          isFollowUp: true,
          deliveredMode: "vendedores_pwa_followup",
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {});

      // 4. Actualizar estado y contador de seguimiento en Firestore
      const nowIso = new Date().toISOString();
      const newFollowUpCount = (followUpDemo.followUpCount || 0) + 1;
      await fetch("/api/admin/muestras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: followUpDemo.id,
          lastFollowUpAt: nowIso,
          followUpCount: newFollowUpCount,
        }),
      });

      // 5. Actualizar estado local
      setHistoryDemos((prev) =>
        prev.map((d) =>
          d.id === followUpDemo.id
            ? { ...d, lastFollowUpAt: nowIso, followUpCount: newFollowUpCount }
            : d
        )
      );

      setFollowUpSuccessMsg("¡Seguimiento enviado con éxito por WhatsApp!");
      setTimeout(() => {
        setFollowUpDemo(null);
        setFollowUpSuccessMsg("");
      }, 2000);
    } catch (err: any) {
      console.error("Error al enviar seguimiento:", err);
      setFollowUpErrorMsg(err.message || "Error al enviar el mensaje de seguimiento.");
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  // 13.3 Actualizar estado comercial / outcome del prospecto (Punto 5)
  const handleUpdateOutcome = async (demoId: string, newOutcome: ProspectDemo["outcome"]) => {
    setUpdatingOutcomeId(demoId);
    setHistoryDemos((prev) =>
      prev.map((d) => (d.id === demoId ? { ...d, outcome: newOutcome } : d))
    );

    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch("/api/admin/muestras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: demoId,
          outcome: newOutcome,
        }),
      });
    } catch (err) {
      console.error("Error al guardar estado del prospecto:", err);
    } finally {
      setUpdatingOutcomeId(null);
    }
  };

  // 13. Eliminar demo
  const handleDeleteDemo = async (demoId: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta muestra?")) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/muestras?id=${demoId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setHistoryDemos((prev) => prev.filter((d) => d.id !== demoId));
      } else {
        alert("No se pudo eliminar la muestra.");
      }
    } catch (err) {
      console.error("Error eliminando muestra:", err);
    }
  };

  // 13.5 Cambiar contraseña del vendedor
  const handleChangeMyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError("");
    setChangePassSuccess("");

    if (!newPassInput || newPassInput.length < 6) {
      setChangePassError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassInput !== confirmPassInput) {
      setChangePassError("Las contraseñas no coinciden. Verifícalas.");
      return;
    }

    setChangePassLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/vendedores/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: newPassInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar la contraseña");
      }

      setChangePassSuccess("¡Contraseña actualizada exitosamente!");
      setTimeout(() => {
        setShowChangePassModal(false);
        setNewPassInput("");
        setConfirmPassInput("");
        setChangePassSuccess("");
      }, 2000);
    } catch (err: any) {
      setChangePassError(err.message || "Error al actualizar contraseña");
    } finally {
      setChangePassLoading(false);
    }
  };

  // 14. Logout
  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/vendedores/login");
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-slate-500">Verificando acceso de vendedor...</p>
      </div>
    );
  }

  const cleanPhone = prospectPhone.trim().replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");
  const fullPhoneForPreview = cleanPhone ? `${countryCode}${cleanPhone}` : "";

  // Métricas del pipeline del vendedor (Puntos 1, 2 y 5)
  const totalDemos = historyDemos.length;
  const totalEnviadas = historyDemos.filter(
    (d) => d.status === "enviada" || (d.outcome && d.outcome !== "nuevo")
  ).length;
  const totalVistas = historyDemos.filter((d) => (d.viewCount || 0) > 0).length;
  const openRate = totalEnviadas > 0 ? Math.round((totalVistas / totalEnviadas) * 100) : 0;
  const totalInteresados = historyDemos.filter((d) => d.outcome === "interesado").length;
  const totalCerrados = historyDemos.filter((d) => d.outcome === "cerrado").length;
  const conversionRate = totalEnviadas > 0 ? Math.round((totalCerrados / totalEnviadas) * 100) : 0;
  const totalPendientesSeguimiento = historyDemos.filter(
    (d) => getFollowUpStatus(d) !== null
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20 sm:pb-8">
      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
              <LogoMark size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">Santisoft Muestras</h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-none">
                {currentUser?.displayName || currentUser?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
              >
                <FaMobileAlt /> Instalar App
              </button>
            )}

            {/* Solo mostrar botón de clave para cuentas tradicionales (NO Google) */}
            {!currentUser?.email?.toLowerCase().endsWith("@gmail.com") &&
              !currentUser?.providerData.some((p) => p.providerId === "google.com") && (
                <button
                  onClick={() => {
                    setShowChangePassModal(true);
                    setNewPassInput("");
                    setConfirmPassInput("");
                    setChangePassError("");
                    setChangePassSuccess("");
                  }}
                  title="Cambiar mi contraseña"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  <FaKey className="text-xs text-indigo-600" />
                  <span className="hidden sm:inline">Clave</span>
                </button>
            )}

            <button
              onClick={handleSignOut}
              title="Cerrar Sesión"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
            >
              <FaSignOutAlt className="text-sm" />
            </button>
          </div>
        </div>

        {/* Banner de instalación en móviles si está disponible */}
        {isInstallable && (
          <div className="sm:hidden mt-2 p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">📲</span>
              <span className="text-xs text-indigo-900 font-bold">¿Instalar en tu pantalla de inicio?</span>
            </div>
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs"
            >
              Instalar
            </button>
          </div>
        )}
      </header>

      {/* TABS SWITCHER */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 sticky top-[57px] z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-center p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
          <button
            onClick={() => setActiveTab("crear")}
            className={`flex-1 sm:flex-initial sm:px-6 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "crear"
                ? "bg-white text-indigo-600 shadow-sm font-black"
                : "text-slate-500 hover:text-slate-900 font-bold hover:bg-white/50"
            }`}
          >
            <FaMagic className="text-xs" /> Nueva Muestra
          </button>
          <button
            onClick={() => setActiveTab("historial")}
            className={`flex-1 sm:flex-initial sm:px-6 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "historial"
                ? "bg-white text-indigo-600 shadow-sm font-black"
                : "text-slate-500 hover:text-slate-900 font-bold hover:bg-white/50"
            }`}
          >
            <FaSearch className="text-xs" /> Mis Muestras
            {historyDemos.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-black text-slate-700">
                {historyDemos.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-4xl w-full mx-auto px-4 py-6 sm:px-6 flex-1">
        {activeTab === "crear" ? (
          <div className="space-y-6">
            {/* PASO 1: DATOS DEL PROSPECTO */}
            <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black flex items-center justify-center border border-indigo-100">
                  1
                </span>
                <h2 className="text-sm sm:text-base font-black text-slate-900">Datos del Prospecto</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nombre del Negocio / Marca *
                  </label>
                  <input
                    type="text"
                    required
                    value={prospectBusiness}
                    onChange={(e) => setProspectBusiness(e.target.value)}
                    placeholder="Ej. Parrilladas Don Carlos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nombre del Dueño o Contacto
                  </label>
                  <input
                    type="text"
                    value={prospectName}
                    onChange={(e) => setProspectName(e.target.value)}
                    placeholder="Ej. Don Carlos Muñoz"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    WhatsApp del Prospecto
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-2xl px-2.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={prospectPhone}
                      onChange={(e) => setProspectPhone(e.target.value)}
                      placeholder="9 1234 5678"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Rubro / Industria
                  </label>
                  <select
                    value={rubro}
                    onChange={(e) => setRubro(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
                  >
                    {COMMON_NICHES.map((n) => (
                      <option key={n.label} value={n.label}>
                        {n.icon} {n.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Plato, Producto o Servicio a Destacar
                  </label>
                  <input
                    type="text"
                    value={dishOrProductName}
                    onChange={(e) => setDishOrProductName(e.target.value)}
                    placeholder="Ej. Bife de Chorizo a las Brasas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Precio del Producto / Plato (Opcional)
                  </label>
                  <input
                    type="text"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="Ej. $8.990 o $12.500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Oferta, Promo o Gancho (Opcional)
                  </label>
                  <input
                    type="text"
                    value={offerText}
                    onChange={(e) => setOfferText(e.target.value)}
                    placeholder="Ej. 20% Dto los jueves o 2x1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                </div>
              </div>

              {/* CONFIGURACIÓN AVANZADA DE LABORATORIO: CANTIDAD Y FORMATOS */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                      <span>⚡ Configuración de la Propuesta (Laboratorio)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Nuestros agentes diseñarán las publicaciones y armarán la estrategia completa para el prospecto.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Selector de Cantidad de Publicaciones (Máx 3) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Cantidad de Posts:
                      </label>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {postsCount} {postsCount === 1 ? "publicación" : "publicaciones"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setPostsCount(num)}
                          className={`flex-1 py-2 rounded-xl font-black text-xs transition-all border cursor-pointer ${
                            postsCount === num
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30 scale-102"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Recomendado: 3 publicaciones de muestra para presentar al prospecto.
                    </p>
                  </div>

                  {/* Selector de Formatos de Publicaciones (Solo Post y Carrusel) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Formatos a Incluir:
                      </label>
                      <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        {allowedTypes.length} activos
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "post" as const, label: "Post Cuadrado", icon: "📸", sub: "1:1 Feed" },
                        { id: "carrusel" as const, label: "Carrusel", icon: "🎠", sub: "3 Slides" },
                      ].map((fmt) => {
                        const isChecked = allowedTypes.includes(fmt.id);
                        return (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => handleToggleType(fmt.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isChecked
                                ? "bg-white border-purple-500 shadow-xs ring-1 ring-purple-500/30"
                                : "bg-slate-100 border-slate-200 opacity-60 hover:opacity-90"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{fmt.icon}</span>
                              <span className={`text-[10px] font-black ${isChecked ? "text-purple-600" : "text-transparent"}`}>
                                ✓
                              </span>
                            </div>
                            <div className="mt-1">
                              <span className="text-[11px] font-bold text-slate-800 block leading-tight">{fmt.label}</span>
                              <span className="text-[9px] text-slate-400">{fmt.sub}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* PASO 2: ASSETS (FOTO Y LOGO) */}
            <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black flex items-center justify-center border border-indigo-100">
                  2
                </span>
                <h2 className="text-sm sm:text-base font-black text-slate-900">Foto Real y Logo (Opcional)</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* FOTO BASE */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase text-slate-700">
                      📸 Foto Real del Producto
                    </label>
                    {baseImagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setBaseImageFile(null);
                          setBaseImagePreview("");
                        }}
                        className="text-[11px] text-rose-600 font-bold hover:underline"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  {baseImagePreview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <img
                        src={baseImagePreview}
                        alt="Preview Foto"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => baseImageInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-white"
                    >
                      <FaUpload className="mx-auto text-slate-400 text-lg mb-1" />
                      <p className="text-xs text-slate-700 font-bold">Subir foto desde tu celular</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Si no tienes foto real, nuestros agentes la generarán automáticamente.
                      </p>
                    </div>
                  )}
                  <input
                    ref={baseImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBaseImageChange}
                    className="hidden"
                  />
                </div>

                {/* LOGO */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase text-slate-700">
                      🏷️ Logo del Negocio
                    </label>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview("");
                          setCleanedLogoUrl("");
                        }}
                        className="text-[11px] text-rose-600 font-bold hover:underline"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  {logoPreview ? (
                    <div className="space-y-3">
                      <div className="relative h-24 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-2">
                        <img
                          src={removeLogoBg && cleanedLogoUrl ? cleanedLogoUrl : logoPreview}
                          alt="Preview Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      {/* Quitar fondo toggle */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={removeLogoBg}
                          onChange={(e) => handleToggleRemoveLogoBg(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <span>Quitar fondo del logo automáticamente</span>
                      </label>
                      {isRemovingLogoBg && (
                        <p className="text-[10px] text-indigo-600 font-bold animate-pulse">
                          Recortando fondo del logo...
                        </p>
                      )}

                      {/* Posición del Logo */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Posición del logo en el flyer:
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: "top-left", label: "↖ Arriba Izq" },
                            { id: "top-right", label: "↗ Arriba Der" },
                            { id: "bottom-left", label: "↙ Abajo Izq" },
                            { id: "bottom-right", label: "↘ Abajo Der" },
                          ].map((pos) => (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() => setLogoPosition(pos.id as any)}
                              className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all border ${
                                logoPosition === pos.id
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-white"
                    >
                      <FaUpload className="mx-auto text-slate-400 text-lg mb-1" />
                      <p className="text-xs text-slate-700 font-bold">Subir logo del cliente</p>
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG o WebP</p>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              </div>
            </section>

            {/* PASO 3: SELLO COMERCIAL (BADGE) */}
            <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black flex items-center justify-center border border-indigo-100">
                  3
                </span>
                <h2 className="text-sm sm:text-base font-black text-slate-900">Sello Publicitario en Flyer</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Texto en el Sello (Badge)
                  </label>
                  <input
                    type="text"
                    value={badgeCustomText}
                    onChange={(e) => setBadgeCustomText(e.target.value)}
                    placeholder="Ej. ¡OFERTA DE LA SEMANA! o 2X1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Si lo dejas vacío, usará el texto de la oferta o no pondrá sello.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Estilo de Sello
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "sticker-circle", label: "🔴 Círculo Sticker" },
                      { id: "pill-fire", label: "🔥 Fuego Pill" },
                      { id: "gold-gourmet", label: "✨ Gourmet Oro" },
                      { id: "corner-ribbon", label: "🎗️ Cinta Esquina" },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBadgeStyle(b.id as any)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-left border ${
                          badgeStyle === b.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN 4: ESTILOS VISUALES Y DATOS COMERCIALES DE MUESTRA */}
            <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
              {/* Cabecera de la Sección */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black flex items-center justify-center border border-indigo-100">
                    4
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900">
                      Estilos Visuales y Datos Comerciales de Muestra
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Paso 1: Selecciona hasta 3 estilos visuales · Paso 2: Personaliza los textos y datos de las muestras.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                    🎨 {selectedStyles.length} de 3 estilos seleccionados
                  </span>
                </div>
              </div>

              {/* PASO 1: SELECCIÓN DE ESTILOS VISUALES (HASTA 3) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                      Paso 1
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Selecciona los Estilos Visuales (Máximo 3)
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                    Haz clic para marcar o desmarcar estilos (#1, #2, #3)
                  </p>
                </div>

                {/* BARRA UNIFICADA: BUSCADOR + BOTÓN MODAL FILTRAR ESTILOS */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Buscador Integrado */}
                    <div className="relative flex-1">
                      <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por estilo, temática o palabras clave..."
                        className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs transition-all"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] flex items-center justify-center font-bold transition-colors cursor-pointer"
                          title="Limpiar búsqueda"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Botón Disparador del Modal de Estilos */}
                    <button
                      type="button"
                      onClick={() => setIsStyleFilterModalOpen(true)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-2xs ${
                        selectedCategories.length === 0
                          ? "bg-slate-900 hover:bg-slate-800 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-500/20 shadow-indigo-200"
                      }`}
                      title="Abrir selector de categorías de estilos"
                    >
                      <span>{selectedCategories.length === 0 ? "⚡" : "🎨"}</span>
                      <span className="font-black">
                        {selectedCategories.length === 0
                          ? "Filtrar Estilos"
                          : selectedCategories.length === 1
                          ? selectedCategories[0]
                          : `${selectedCategories.length} Filtros`}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        selectedCategories.length === 0
                          ? "bg-slate-800 text-slate-300 border border-slate-700"
                          : "bg-indigo-700 text-white"
                      }`}>
                        {selectedCategories.length === 0
                          ? allCategoryNames.length
                          : selectedCategories.length === 1
                          ? (categoryCounts[selectedCategories[0]] || 0)
                          : selectedCategories.length}
                      </span>
                    </button>
                  </div>

                  {/* Barra de Filtros Activos si hay categorías seleccionadas */}
                  {selectedCategories.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400 mr-1">Filtrando por:</span>
                        {selectedCategories.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                          >
                            <span>🏷️</span>
                            <span>{cat}</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full font-black">
                              {categoryCounts[cat] || 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== cat))}
                              className="text-indigo-400 hover:text-indigo-800 font-bold ml-0.5 transition-colors cursor-pointer"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCategories([])}
                        className="text-[11px] text-slate-500 hover:text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  )}
                </div>

                {/* GRID DE ESTILOS VISUALES */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-88 overflow-y-auto pr-1">
                  {filteredTemplates.slice(0, 36).map((template) => {
                    const selectedIndex = selectedStyles.findIndex((s) => s.id === template.id);
                    const isSelected = selectedIndex !== -1;

                    return (
                      <div
                        key={template.id}
                        onClick={() => handleToggleStyle(template)}
                        className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all ${
                          isSelected
                            ? "border-indigo-600 ring-2 ring-indigo-600 shadow-md shadow-indigo-600/20 bg-indigo-50/50"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="aspect-square relative overflow-hidden bg-slate-100">
                          {template.previewUrl ? (
                            <img
                              src={template.previewUrl}
                              alt={template.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <FaImage className="text-2xl" />
                            </div>
                          )}

                          {/* Badge Numérico de Selección (#1, #2, #3) */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center gap-1 shadow-md border border-white/20">
                              <FaCheck className="text-[9px]" />
                              <span>#{selectedIndex + 1}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{template.title}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                            {template.category}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PASO 2: TEXTOS COMERCIALES Y PRECIOS PARA LAS MUESTRAS */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">
                      Paso 2
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      ¿Deseas agregar textos y precios a las publicaciones de muestra?
                    </h3>
                  </div>
                  <div
                    onClick={() => setIsCommercialPoster(!isCommercialPoster)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer shrink-0 ${
                      isCommercialPoster ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-all" />
                  </div>
                </div>

                {isCommercialPoster ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-4 animate-in fade-in">
                    <p className="text-xs text-indigo-950 font-medium">
                      Nuestros agentes integrarán tipografías publicitarias llamativas, oferta y precio visible en las muestras para que el prospecto visualice de inmediato el impacto comercial en sus redes.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Producto o Servicio a Destacar
                        </label>
                        <input
                          type="text"
                          value={dishOrProductName}
                          onChange={(e) => setDishOrProductName(e.target.value)}
                          placeholder="Ej. Hamburguesa Doble Cheddar / Limpieza Dental"
                          className="w-full bg-white border border-indigo-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Titular o Texto Comercial Destacado
                        </label>
                        <input
                          type="text"
                          value={commercialCustomText}
                          onChange={(e) => setCommercialCustomText(e.target.value)}
                          placeholder="Ej. ¡2x1 HOY! / ESPECIAL DE LA SEMANA"
                          className="w-full bg-white border border-indigo-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Precio u Oferta
                        </label>
                        <input
                          type="text"
                          value={productPrice}
                          onChange={(e) => setProductPrice(e.target.value)}
                          placeholder="Ej. $19.990 o 30% OFF"
                          className="w-full bg-white border border-indigo-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Llamado a la Acción (CTA) / Botón
                        </label>
                        <input
                          type="text"
                          value={badgeCustomText}
                          onChange={(e) => setBadgeCustomText(e.target.value)}
                          placeholder="Ej. ¡Pide por WhatsApp! o Reserva Aquí"
                          className="w-full bg-white border border-indigo-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Subtítulo o Detalle de la Oferta (Opcional)
                        </label>
                        <input
                          type="text"
                          value={offerText}
                          onChange={(e) => setOfferText(e.target.value)}
                          placeholder="Ej. Incluye papas y bebida · Válido de Lunes a Jueves con todo medio de pago"
                          className="w-full bg-white border border-indigo-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium">
                    Fotografía limpia activada: Las publicaciones de muestra se generarán con estética fotográfica publicitaria pura, sin textos ni precios sobreimpresos en la imagen.
                  </div>
                )}

                {/* OPCIÓN: MARCA DE AGUA EN EL LANDING PÚBLICO */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider">
                        Protección
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">
                        ¿Incluir marca de agua en las imágenes del landing?
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {includeWatermark
                        ? "Activado: Las imágenes en el landing público (/m/...) tendrán el sello de agua de muestra comercial."
                        : "Desactivado: Las imágenes se mostrarán limpias en el landing, sin marca de agua ni sellos sobrepuestos."}
                    </p>
                  </div>
                  <div
                    onClick={() => setIncludeWatermark(!includeWatermark)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer shrink-0 ${
                      includeWatermark ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-all" />
                  </div>
                </div>
              </div>
            </section>

            {/* BOTÓN PRINCIPAL DE GENERACIÓN */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isGenerating || !prospectBusiness.trim()}
                onClick={handleGenerateSample}
                className="w-full py-4 px-6 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-600/25 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm">{generatingStep || "Nuestros agentes están trabajando..."}</span>
                  </>
                ) : (
                  <>
                    <FaMagic className="text-lg text-yellow-300" />
                    <span>
                      ✨ Generar {postsCount} {postsCount === 1 ? "Publicación" : "Publicaciones"} y Estrategia con Agentes
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* RESULTADO DE GENERACIÓN */}
            {(canvasImageUrl || generatedImageUrl || generatedPublications.length > 0) && (() => {
              const activePub = (generatedPublications && generatedPublications.length > 0)
                ? (generatedPublications[selectedPreviewPubIndex] || generatedPublications[0])
                : null;
              const activeImg = activePub?.imageUrl || canvasImageUrl || generatedImageUrl || baseImagePreview || "";
              const activeCleanBaseImg = activePub?.baseImageUrl || activePub?.origBaseImageUrl || activePub?.imageUrl || canvasImageUrl || generatedImageUrl || baseImagePreview || "";
              const activeCopy = activePub?.copy || generatedPostCaption || "";

              return (
                <section
                  id="resultado-generacion"
                  className="bg-white border-2 border-indigo-100 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎉</span>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          {generatedPublications.length > 1
                            ? `Propuesta con ${generatedPublications.length} Publicaciones y Estrategia`
                            : "Muestra Lista para Enviar"}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Diseñada por nuestros agentes con identidad comercial lista para cerrar al prospecto.
                        </p>
                      </div>
                    </div>
                    {createdDemoId && (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 self-start sm:self-auto">
                        ID: {createdDemoId.slice(0, 8)}
                      </span>
                    )}
                  </div>

                  {/* SELECTOR DE PUBLICACIONES SI HAY MÁS DE 1 */}
                  {generatedPublications.length > 1 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        Selecciona la publicación a previsualizar:
                      </label>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {generatedPublications.map((pub, idx) => {
                          const isSel = selectedPreviewPubIndex === idx;
                          const icon = pub.type === "carrusel" ? "🎠" : "📸";
                          const label = pub.type === "carrusel" ? "Carrusel" : "Post 1:1";
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedPreviewPubIndex(idx)}
                              className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all border flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                                isSel
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 scale-102"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span>{icon}</span>
                              <span>#{idx + 1} {label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* IMAGEN / VISUAL GENERADO */}
                    <div className="space-y-3">
                      {/* Barra informativa superior (fuera de la imagen para no tapar los textos del cartel) */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 px-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {activePub?.type === "carrusel" ? (
                            <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black flex items-center gap-1 border border-purple-200">
                              <span>🎠</span> Carrusel (3 Slides)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black flex items-center gap-1 border border-indigo-200">
                              <span>📸</span> Post (1:1 Feed)
                            </span>
                          )}
                          {activePub?.visualStyleTitle && (
                            <button
                              type="button"
                              onClick={() => openChangeStyleModal(selectedPreviewPubIndex)}
                              className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 text-[10px] font-black flex items-center gap-1.5 border border-amber-200 transition-all cursor-pointer shadow-2xs hover:scale-102"
                              title="Haz clic para cambiar el estilo visual de esta publicación"
                            >
                              <span>🎨</span>
                              <span className="truncate max-w-[200px]">{activePub.visualStyleTitle}</span>
                              <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold">Cambiar ▾</span>
                            </button>
                          )}
                        </div>
                        {activePub?.textTemplateName && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            📐 Plantilla: {activePub.textTemplateName}
                          </span>
                        )}
                      </div>

                      <div className="aspect-square relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                        <img
                          src={activeImg}
                          alt="Flyer Muestra"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (generatedImageUrl && target.src !== generatedImageUrl) {
                              target.src = generatedImageUrl;
                            } else if (baseImagePreview && target.src !== baseImagePreview) {
                              target.src = baseImagePreview;
                            }
                          }}
                        />
                      </div>

                      {/* Miniaturas de Carrusel si existen */}
                      {activePub?.type === "carrusel" && activePub?.carouselImages && activePub.carouselImages.length > 1 && (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {activePub.carouselImages.map((slideImg: string, sIdx: number) => (
                            <div key={sIdx} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-2xs">
                              <img src={slideImg} alt={`Slide ${sIdx + 1}`} className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                #{sIdx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* BOTONES DE ACCIÓN: CAMBIAR ESTILO VISUAL Y REGENERAR IMAGEN */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isGeneratingSingleImg || isRenderingPoster}
                          onClick={() => openChangeStyleModal(selectedPreviewPubIndex)}
                          className="w-full py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 shadow-2xs cursor-pointer active:scale-98"
                        >
                          <FaPalette className="text-xs text-indigo-600" />
                          <span>🎨 Cambiar Estilo Visual</span>
                        </button>

                        <button
                          type="button"
                          disabled={isGeneratingSingleImg || isRenderingPoster}
                          onClick={() => handleGenerateSingleImage(selectedPreviewPubIndex)}
                          className={`w-full py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border shadow-xs ${
                            isGeneratingSingleImg
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-indigo-600/20 active:scale-98 cursor-pointer"
                          }`}
                        >
                          {isGeneratingSingleImg ? (
                            <>
                              <FaSyncAlt className="animate-spin text-xs" />
                              <span>Diseñando imagen...</span>
                            </>
                          ) : (
                            <>
                              <FaMagic className="text-xs text-yellow-300" />
                              <span>{activePub?.imageUrl ? "Regenerar Imagen (1 a 1)" : "Generar Imagen"}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* SELECTOR DE PLANTILLAS DE TEXTO (CON PREVIEWS VISUALES) */}
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                            <span>📐</span> Elige la Plantilla de Texto:
                          </label>
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-emerald-200">
                            <button
                              type="button"
                              onClick={() => setTextTemplateViewMode("grid")}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                textTemplateViewMode === "grid"
                                  ? "bg-emerald-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-emerald-700"
                              }`}
                              title="Ver como tarjetas con vista previa visual"
                            >
                              🎴 Previews
                            </button>
                            <button
                              type="button"
                              onClick={() => setTextTemplateViewMode("list")}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                textTemplateViewMode === "list"
                                  ? "bg-emerald-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-emerald-700"
                              }`}
                              title="Ver como lista compacta"
                            >
                              ☰ Lista
                            </button>
                          </div>
                        </div>

                        {/* Filtro de categorías de plantillas de texto */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {TEXT_TEMPLATE_CATEGORIES.map((cat) => {
                            const isCatActive = textTemplateCategory === cat;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setTextTemplateCategory(cat)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap transition-all cursor-pointer border ${
                                  isCatActive
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-emerald-50"
                                }`}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>

                        {/* VISTA 1: GRID DE TARJETAS CON PREVIEWS VISUALES */}
                        {textTemplateViewMode === "grid" ? (
                          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                            {DEFAULT_TEXT_TEMPLATES.filter(
                              (tpl) =>
                                textTemplateCategory === "Todas" ||
                                tpl.category === textTemplateCategory
                            ).map((tpl) => {
                              const isSelected = selectedTextTemplateId === tpl.id;
                              const isCurrentlyApplied = activePub?.textTemplateId === tpl.id;
                              const layoutTag =
                                tpl.layoutPosition === "split_left" || tpl.category === "Split Lateral"
                                  ? "Split Lateral"
                                  : tpl.headlineFont === "elegant_serif" || tpl.category === "Gourmet & Menú"
                                  ? "Editorial"
                                  : tpl.category === "Ofertas Flash" || tpl.category === "Delivery"
                                  ? "Impacto"
                                  : "Cabecera";

                              return (
                                <div
                                  key={tpl.id}
                                  onClick={() => setSelectedTextTemplateId(tpl.id)}
                                  className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all flex flex-col justify-between bg-slate-900 shadow-2xs ${
                                    isSelected
                                      ? "border-emerald-500 ring-2 ring-emerald-500/40 shadow-md scale-[1.01]"
                                      : "border-slate-200 hover:border-emerald-300"
                                  }`}
                                >
                                  {/* Preview Visual fiel de la plantilla con distribución real */}
                                  <TemplateVisualPreview
                                    template={tpl}
                                    productName={dishOrProductName.trim() || prospectBusiness.trim()}
                                    headline={commercialCustomText.trim() || activePub?.title}
                                    price={productPrice.trim()}
                                    isModal={false}
                                    showZoomButton={true}
                                    onOpenModal={() => setPreviewModalTemplate(tpl)}
                                    isCurrentlyApplied={isCurrentlyApplied}
                                    customImageUrl={activeCleanBaseImg}
                                  />

                                  {/* Barra de acción rápida inferior */}
                                  <div className="p-1.5 bg-white flex items-center justify-between gap-1 border-t border-slate-100">
                                    <span className="text-[9px] font-bold text-slate-500 truncate">
                                      {layoutTag}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={isRenderingPoster || isGeneratingSingleImg}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTextTemplateId(tpl.id);
                                        handleRenderAndSavePoster(selectedPreviewPubIndex, tpl.id);
                                      }}
                                      className={`px-2 py-0.5 rounded text-[9px] font-black transition-all cursor-pointer ${
                                        isSelected
                                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                          : "bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700"
                                      }`}
                                    >
                                      {isRenderingPoster && isSelected ? "..." : "Aplicar"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* VISTA 2: LISTADO CON MINIATURA DE FOTO */
                          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                            {DEFAULT_TEXT_TEMPLATES.filter(
                              (tpl) =>
                                textTemplateCategory === "Todas" ||
                                tpl.category === textTemplateCategory
                            ).map((tpl) => {
                              const isSelected = selectedTextTemplateId === tpl.id;
                              const isCurrentlyApplied = activePub?.textTemplateId === tpl.id;
                              const layoutTag =
                                tpl.layoutPosition === "split_left" || tpl.category === "Split Lateral"
                                  ? "Split Izquierdo"
                                  : tpl.headlineFont === "elegant_serif" || tpl.category === "Gourmet & Menú"
                                  ? "Portada Editorial"
                                  : tpl.category === "Ofertas Flash" || tpl.category === "Delivery"
                                  ? "Impacto Inferior"
                                  : "Cabecera Limpia";

                              return (
                                <div
                                  key={tpl.id}
                                  onClick={() => setSelectedTextTemplateId(tpl.id)}
                                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                    isSelected
                                      ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                                      : "bg-white/80 border-slate-200 hover:border-emerald-300 hover:bg-white"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {/* Thumbnail Preview de la Plantilla con layout esquemático real */}
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-900 shadow-2xs">
                                      <img
                                        src={activeCleanBaseImg || tpl.previewSampleImage || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=200&q=80"}
                                        alt={tpl.name}
                                        className="w-full h-full object-cover"
                                      />
                                      {tpl.layoutPosition === "split_left" || tpl.category === "Split Lateral" ? (
                                        <div className="absolute inset-y-0 left-0 w-[55%] bg-black/85 flex flex-col justify-center px-1 pointer-events-none">
                                          <span className="text-[6.5px] font-black text-white leading-none">SPLIT</span>
                                          <span className="text-[5.5px] font-bold text-amber-300 leading-none pt-0.5">TEXTO</span>
                                        </div>
                                      ) : tpl.layoutPosition === "recipe_ingredients" || tpl.category === "Recetas & Ingredientes" ? (
                                        <>
                                          <div className="absolute inset-x-0 top-0 h-[30%] bg-black/80 flex items-center justify-center pointer-events-none">
                                            <span className="text-[5.5px] font-black text-white leading-none">RECETA</span>
                                          </div>
                                          <div className="absolute inset-x-0 bottom-0 h-[35%] bg-black/85 flex items-center justify-center gap-0.5 pointer-events-none">
                                            <span className="text-[6px]">🧄</span>
                                            <span className="text-[6px]">🍝</span>
                                          </div>
                                        </>
                                      ) : (
                                        <span
                                          className="absolute bottom-0 inset-x-0 text-[7px] font-black text-center truncate px-0.5 py-0.2 pointer-events-none"
                                          style={{
                                            backgroundColor: tpl.badgeBgColor || "#0f172a",
                                            color: tpl.badgeTextColor || "#ffffff",
                                          }}
                                        >
                                          {layoutTag}
                                        </span>
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-black text-slate-800 truncate">
                                          {tpl.name}
                                        </p>
                                        {isCurrentlyApplied && (
                                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black shrink-0">
                                            Aplicada
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-500 truncate">
                                        <span className="font-bold text-slate-600">{layoutTag}</span> · {tpl.category}
                                      </p>
                                      <div className="flex items-center gap-1 pt-0.5">
                                        <span
                                          className="w-2.5 h-2.5 rounded-full border border-slate-300"
                                          style={{ backgroundColor: tpl.priceBgColor || tpl.ctaBgColor || "#fbbf24" }}
                                          title="Color de acento"
                                        />
                                        <span className="text-[9px] font-bold text-slate-600 truncate">
                                          CTA: {tpl.ctaText}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewModalTemplate(tpl);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-xs"
                                      title="Ver preview completo"
                                    >
                                      👁️
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isRenderingPoster || isGeneratingSingleImg}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTextTemplateId(tpl.id);
                                        handleRenderAndSavePoster(selectedPreviewPubIndex, tpl.id);
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                        isSelected
                                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                          : "bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700"
                                      }`}
                                    >
                                      {isRenderingPoster && isSelected ? "..." : "Aplicar"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* BOTÓN RENDERIZAR Y GUARDAR CARTEL CON LA PLANTILLA SELECCIONADA */}
                        <button
                          type="button"
                          disabled={isRenderingPoster || isGeneratingSingleImg}
                          onClick={() => handleRenderAndSavePoster(selectedPreviewPubIndex, selectedTextTemplateId)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border shadow-xs ${
                            isRenderingPoster
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20 active:scale-98 cursor-pointer"
                          }`}
                        >
                          {isRenderingPoster ? (
                            <>
                              <FaSyncAlt className="animate-spin text-xs" />
                              <span>Estampando plantilla y guardando en Landing...</span>
                            </>
                          ) : (
                            <>
                              <FaImage className="text-xs" />
                              <span>
                                ✨ Renderizar y Guardar con «
                                {DEFAULT_TEXT_TEMPLATES.find((t) => t.id === selectedTextTemplateId)?.name || "Plantilla Seleccionada"}
                                »
                              </span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* MODAL DE PREVIEW AMPLIADO DE LA PLANTILLA */}
                      {previewModalTemplate && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
                          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 p-5 space-y-4 relative">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 pr-2">
                                <h4 className="text-sm font-black text-slate-900 truncate">
                                  {previewModalTemplate.name}
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  {previewModalTemplate.category}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPreviewModalTemplate(null)}
                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-black cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Mockup visual grande del flyer con distribución real */}
                            <TemplateVisualPreview
                              template={previewModalTemplate}
                              productName={dishOrProductName.trim() || prospectBusiness.trim()}
                              headline={commercialCustomText.trim() || activePub?.title}
                              price={productPrice.trim()}
                              isModal={true}
                              showZoomButton={false}
                              customImageUrl={activeCleanBaseImg}
                            />

                            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                              {previewModalTemplate.description}
                            </p>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTextTemplateId(previewModalTemplate.id);
                                  handleRenderAndSavePoster(selectedPreviewPubIndex, previewModalTemplate.id);
                                  setPreviewModalTemplate(null);
                                }}
                                disabled={isRenderingPoster || isGeneratingSingleImg}
                                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                              >
                                <FaCheck className="text-xs" />
                                <span>Aplicar esta Plantilla</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewModalTemplate(null)}
                                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                              >
                                Cerrar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MODAL PARA CAMBIAR ESTILO VISUAL DE LA PUBLICACIÓN */}
                      {isChangeStyleModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in">
                          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
                            {/* Cabecera del Modal */}
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-black uppercase tracking-wider border border-indigo-400/30">
                                    Publicación #{changeStylePubIndex + 1}
                                  </span>
                                  <h3 className="text-sm sm:text-base font-black truncate">
                                    Cambiar Estilo Visual
                                  </h3>
                                </div>
                                <p className="text-xs text-slate-300 mt-0.5 truncate">
                                  Elige el estilo visual con el que nuestros agentes diseñarán la imagen.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsChangeStyleModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-black transition-colors cursor-pointer shrink-0"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Buscador y Categorías */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
                              <div className="relative">
                                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                                <input
                                  type="text"
                                  value={changeStyleSearch}
                                  onChange={(e) => setChangeStyleSearch(e.target.value)}
                                  placeholder="Buscar estilo (ej. minimalista, arquitectura, producto, magazine, nórdico)..."
                                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                                />
                                {changeStyleSearch && (
                                  <button
                                    type="button"
                                    onClick={() => setChangeStyleSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] flex items-center justify-center font-bold"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              {/* Categorías horizontales */}
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                <button
                                  type="button"
                                  onClick={() => setChangeStyleCategory("all")}
                                  className={`px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap transition-all cursor-pointer border ${
                                    changeStyleCategory === "all"
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  Todos ({allTemplates.length})
                                </button>
                                {allCategoryNames.map((cat) => (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setChangeStyleCategory(cat)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap transition-all cursor-pointer border ${
                                      changeStyleCategory === cat
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Grid de estilos */}
                            <div className="p-4 overflow-y-auto max-h-[55vh] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {allTemplates
                                .filter((tpl) => {
                                  const cats = getPromptCategories(tpl);
                                  const matchCat = changeStyleCategory === "all" || cats.includes(changeStyleCategory);
                                  const q = changeStyleSearch.trim().toLowerCase();
                                  const matchSearch =
                                    !q ||
                                    tpl.title.toLowerCase().includes(q) ||
                                    tpl.description.toLowerCase().includes(q) ||
                                    (tpl.styleKeywords && tpl.styleKeywords.toLowerCase().includes(q));
                                  return matchCat && matchSearch;
                                })
                                .map((tpl) => {
                                  const targetPub = generatedPublications[changeStylePubIndex];
                                  const isCurrent =
                                    targetPub?.visualStyleId === tpl.id ||
                                    targetPub?.visualStyleTitle?.toLowerCase() === tpl.title.toLowerCase();

                                  return (
                                    <div
                                      key={tpl.id}
                                      className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden bg-white shadow-2xs hover:shadow-md ${
                                        isCurrent
                                          ? "border-indigo-600 ring-2 ring-indigo-500/30"
                                          : "border-slate-200 hover:border-indigo-300"
                                      }`}
                                    >
                                      <div>
                                        <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-900">
                                          {tpl.previewUrl ? (
                                            <img
                                              src={tpl.previewUrl}
                                              alt={tpl.title}
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                              <FaImage className="text-2xl" />
                                            </div>
                                          )}
                                          <div className="absolute top-2 left-2">
                                            <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider">
                                              {tpl.category}
                                            </span>
                                          </div>
                                          {isCurrent && (
                                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center gap-1 shadow-md">
                                              <FaCheck className="text-[8px]" /> Actual
                                            </div>
                                          )}
                                        </div>
                                        <div className="p-3 space-y-1">
                                          <h4 className="text-xs font-black text-slate-900 line-clamp-1">
                                            {tpl.title}
                                          </h4>
                                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                                            {tpl.description}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="p-2.5 pt-0 grid grid-cols-2 gap-1.5 border-t border-slate-50 mt-1">
                                        <button
                                          type="button"
                                          onClick={() => handleApplyStyleToPub(changeStylePubIndex, tpl)}
                                          className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer text-center"
                                        >
                                          Elegir
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isGeneratingSingleImg}
                                          onClick={() => handleApplyAndRegenerateStyle(changeStylePubIndex, tpl)}
                                          className="py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black transition-colors cursor-pointer text-center shadow-2xs hover:shadow-md flex items-center justify-center gap-1"
                                        >
                                          <span>✨</span>
                                          <span>Regenerar</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>

                            {/* Pie del modal */}
                            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                              <span>
                                Estilo actual: <strong className="text-slate-900">{generatedPublications[changeStylePubIndex]?.visualStyleTitle || "Sin estilo asignado"}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsChangeStyleModalOpen(false)}
                                className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                              >
                                Cerrar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {createdDemoId && (
                          <a
                            href={`${PUBLIC_APP_URL}/m/${createdDemoId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-black text-center text-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <FaEye className="text-indigo-600" /> Ver Landing Pública ↗
                          </a>
                        )}
                        {createdDemoId && (
                          <button
                            type="button"
                            onClick={() => handleCopyDemoLink(createdDemoId)}
                            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <FaCopy className="text-indigo-600" />
                            {copySuccess ? "¡Copiado!" : "Copiar Enlace"}
                          </button>
                        )}
                      </div>

                      {createdDemoId && (
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{includeWatermark ? "🔒" : "✨"}</span>
                              <span>Marca de agua en landing: {includeWatermark ? "Activada" : "Desactivada"}</span>
                            </span>
                            <p className="text-[10px] text-slate-500">
                              {includeWatermark
                                ? "La landing muestra el sello de agua sobre las fotos."
                                : "La landing muestra las fotos limpias sin sello de agua."}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleWatermarkForDemo(createdDemoId, includeWatermark)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 transition-colors shadow-xs cursor-pointer"
                          >
                            {includeWatermark ? "Quitar marca" : "Poner marca"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* COPY Y ENVÍO POR WHATSAPP */}
                    <div className="space-y-4">
                      {/* CAJA DE ENVÍO POR WHATSAPP */}
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                            <FaWhatsapp className="text-emerald-600 text-base" /> Envío de la Propuesta por WhatsApp
                          </span>
                          {fullPhoneForPreview && (
                            <span className="text-xs font-bold text-emerald-700 font-mono">
                              {fullPhoneForPreview}
                            </span>
                          )}
                        </div>

                        {/* Botón 1: Abrir Directo en WhatsApp (wa.me) */}
                        {fullPhoneForPreview ? (
                          <a
                            href={`https://wa.me/${fullPhoneForPreview.replace("+", "")}?text=${encodeURIComponent(customWhatsappCopy)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transform active:scale-[0.99] transition-all cursor-pointer"
                          >
                            <FaWhatsapp className="text-lg" />
                            <span>Abrir en WhatsApp (wa.me)</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const cleanPhone = (prospectPhone.trim() ? `${countryCode}${prospectPhone.trim().replace(/^0+/, "")}` : "").replace(/[\s\-\(\)\+]/g, "");
                              if (cleanPhone) {
                                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(customWhatsappCopy)}`, "_blank");
                              } else {
                                window.open(`https://wa.me/?text=${encodeURIComponent(customWhatsappCopy)}`, "_blank");
                              }
                            }}
                            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transform active:scale-[0.99] transition-all cursor-pointer"
                          >
                            <FaWhatsapp className="text-lg" />
                            <span>Abrir en WhatsApp con Propuesta</span>
                          </button>
                        )}

                        <div className="flex gap-2">
                          {/* Botón 2: Envío Automático con Evolution API y n8n */}
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp()}
                            disabled={isSendingWhatsApp}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-800 font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isSendingWhatsApp ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                <span>Enviando...</span>
                              </>
                            ) : (
                              <>
                                <FaPaperPlane className="text-emerald-600 text-xs" />
                                <span>Enviar con Agentes</span>
                              </>
                            )}
                          </button>

                          {/* Botón 3: Copiar Texto Completo */}
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof navigator !== "undefined" && navigator.clipboard) {
                                navigator.clipboard.writeText(customWhatsappCopy);
                                setCopySuccess(true);
                                setTimeout(() => setCopySuccess(false), 2500);
                              }
                            }}
                            className="py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-800 font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FaCopy className="text-emerald-600 text-xs" />
                            <span>{copySuccess ? "¡Copiado!" : "Copiar Mensaje"}</span>
                          </button>
                        </div>

                        {/* Checkbox para adjuntar archivo de imagen */}
                        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-emerald-200 hover:bg-emerald-50/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={attachImageToWhatsApp}
                            onChange={(e) => setAttachImageToWhatsApp(e.target.checked)}
                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer shrink-0"
                          />
                          <div className="text-[11px] leading-tight">
                            <span className="font-bold text-slate-800 block">Adjuntar archivo de imagen</span>
                            <span className="text-slate-500 font-normal">
                              Desactivado (recomendado): WhatsApp genera la tarjeta interactiva de la landing con preview de video, publicaciones y copy.
                            </span>
                          </div>
                        </label>

                        {whatsAppSuccessMsg && (
                          <div className="p-3 bg-emerald-100/90 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                            <FaCheck className="text-emerald-600 shrink-0 text-sm" />
                            <span>{whatsAppSuccessMsg}</span>
                          </div>
                        )}

                        {whatsAppErrorMsg && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-2 animate-in fade-in">
                            <div className="font-bold flex items-center gap-1.5">
                              <span>⚠️ {whatsAppErrorMsg}</span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              Puedes enviar la propuesta directamente usando tu aplicación de WhatsApp o WhatsApp Web:
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                const rawP = prospectPhone.trim() ? `${countryCode}${prospectPhone.trim().replace(/^0+/, "")}` : "";
                                let cleanP = rawP.replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");
                                if (cleanP.length === 9 && cleanP.startsWith("9")) cleanP = "56" + cleanP;
                                if (cleanP) {
                                  window.open(`https://wa.me/${cleanP}?text=${encodeURIComponent(customWhatsappCopy)}`, "_blank");
                                } else {
                                  window.open(`https://wa.me/?text=${encodeURIComponent(customWhatsappCopy)}`, "_blank");
                                }
                              }}
                              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
                            >
                              <FaWhatsapp className="text-sm" />
                              <span>Abrir y Enviar en WhatsApp ahora ↗</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* MENSAJE DE WHATSAPP EDITABLE */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Mensaje a Enviar por WhatsApp:
                        </label>
                        <textarea
                          rows={6}
                          value={customWhatsappCopy}
                          onChange={(e) => setCustomWhatsappCopy(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-sans leading-relaxed"
                        />
                      </div>

                      {/* COPY REDACTADO PARA EL POST ACTIVO */}
                      {activeCopy && (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                              📝 Copy de Publicación #{selectedPreviewPubIndex + 1} ({activePub?.type ? activePub.type.toUpperCase() : "POST"})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(activeCopy);
                                setCopyPostSuccess(true);
                                setTimeout(() => setCopyPostSuccess(false), 2000);
                              }}
                              className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <FaCopy /> {copyPostSuccess ? "¡Copiado!" : "Copiar"}
                            </button>
                          </div>
                          {activePub?.hook && (
                            <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50/70 p-2 rounded-xl border border-indigo-100">
                              🎯 Gancho: {activePub.hook}
                            </div>
                          )}
                          <p className="text-xs text-slate-700 line-clamp-4 whitespace-pre-wrap italic">
                            {activeCopy}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RESUMEN DE ESTRATEGIA SEMANAL CREADA POR NUESTROS AGENTES */}
                  {generatedStrategy && (
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white border border-indigo-200/80 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📊</span>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">
                              Estrategia Semanal Diseñada por Nuestros Agentes
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Planificación de contenidos con objetivos claros para captar y retener audiencia.
                            </p>
                          </div>
                        </div>
                        {generatedStrategy.targetAudience && (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 self-start sm:self-auto">
                            🎯 {generatedStrategy.targetAudience}
                          </span>
                        )}
                      </div>

                      {/* Pilares de Contenido */}
                      {generatedStrategy.pillars && generatedStrategy.pillars.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                            Pilares de Contenido:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {generatedStrategy.pillars.map((pillar: any, pIdx: number) => (
                              <div key={pIdx} className="bg-white p-3 rounded-2xl border border-indigo-100 shadow-2xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-black text-slate-900">{pillar.name}</span>
                                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                    {pillar.percentage}%
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                                  {pillar.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Plan de 5 Publicaciones del Radar de Nicho */}
                      {generatedStrategy.schedulePlan && generatedStrategy.schedulePlan.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                              <span>📅</span> Plan de Publicaciones Estratégico (5 Posts · Radar de Nicho):
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              {generatedStrategy.schedulePlan.length} publicaciones planificadas
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                            {generatedStrategy.schedulePlan.slice(0, 5).map((item: any, sIdx: number) => (
                              <div key={sIdx} className="bg-white p-2.5 rounded-2xl border border-slate-200 text-xs shadow-2xs space-y-1">
                                <div className="flex items-center justify-between font-bold text-slate-800">
                                  <span className="text-[11px] font-black text-indigo-900">
                                    {["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"][sIdx] || "•"} {item.day}
                                  </span>
                                  <span className="text-[9px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full uppercase font-black border border-purple-100">
                                    {item.format === "carrusel" ? "Carrusel" : "Post"}
                                  </span>
                                </div>
                                {item.time && (
                                  <div className="text-[10px] text-slate-400 font-medium">
                                    ⏰ {item.time}
                                  </div>
                                )}
                                <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                                  {item.objective || item.hook}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* SECCIÓN 5: GENERADOR DE VIDEO REEL PUBLICITARIO (9:16) */}
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎬</span>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-slate-900">
                          Animar a Video Reel Publicitario (9:16)
                        </h4>
                        <p className="text-xs text-slate-500">
                          Convierte la propuesta visual en un video vertical cinematográfico con nuestros agentes para impacto en Reels y TikTok.
                        </p>
                      </div>
                    </div>
                    {generatedVideoUrl && (
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto flex items-center gap-1">
                        <FaCheck /> Video Activo en Landing
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* COLUMNA 1: SELECTOR DE ESTILO DE MOVIMIENTO */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          1. Estilo de Cámara del Catálogo:
                        </label>
                        <span className="text-[10px] text-indigo-600 font-bold">
                          {selectedVideoStyle?.name} ({selectedVideoStyle?.category})
                        </span>
                      </div>

                      {/* FILTROS INTERACTIVOS DE CATEGORÍAS */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {["Todas", "E-Commerce & Productos", "Servicios & Marcas", "Lanzamientos & Revelación", "Creativos & Tendencias"].map((cat) => {
                          const isActive = selectedVideoCategory === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSelectedVideoCategory(cat)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                isActive
                                  ? "bg-indigo-600 text-white shadow-xs"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>

                      {/* CATÁLOGO DE COMANDOS PRECARGADOS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                        {FLOW_COMMANDS.filter(
                          (cmd) => selectedVideoCategory === "Todas" || cmd.category === selectedVideoCategory
                        ).map((cmd) => {
                          const isSelected = selectedVideoStyle?.command === cmd.command;
                          return (
                            <div
                              key={cmd.command}
                              onClick={() => setSelectedVideoStyle(cmd)}
                              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-indigo-50 border-indigo-600 ring-2 ring-indigo-600/20 shadow-sm"
                                  : "bg-white border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-base">{cmd.icon}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-indigo-700">
                                  {cmd.category}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 leading-tight">{cmd.name}</h5>
                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-snug">{cmd.description}</p>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateVideo}
                        disabled={isGeneratingVideo}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        {isGeneratingVideo ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            <span>{videoProgress || "Animando video con nuestros agentes..."}</span>
                          </>
                        ) : (
                          <>
                            <FaFilm />
                            <span>{generatedVideoUrl ? "Regenerar Video Reel con Agentes" : "Generar Video Reel de la Propuesta"}</span>
                          </>
                        )}
                      </button>

                      {videoError && (
                        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl animate-in fade-in">
                          ⚠️ {videoError}
                        </div>
                      )}

                      {videoProgress && !videoError && !isGeneratingVideo && (
                        <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                          <FaCheck className="text-emerald-600" />
                          <span>{videoProgress}</span>
                        </div>
                      )}

                      {/* Opción de enlace MP4 manual */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500">
                          ¿Ya tienes un video generado? Pega el enlace MP4:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={manualVideoUrlInput}
                            onChange={(e) => setManualVideoUrlInput(e.target.value)}
                            placeholder="https://.../video.mp4"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleSaveManualVideo}
                            disabled={!manualVideoUrlInput.trim()}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Enlazar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 2: PREVISUALIZACIÓN DEL VIDEO EN LA PWA */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        2. Previsualización del Video Reel (9:16):
                      </label>
                      {generatedVideoUrl ? (
                        <div className="space-y-3">
                          <div className="max-w-[260px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-slate-200 shadow-xl relative">
                            <video
                              src={generatedVideoUrl}
                              controls
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1">
                              <FaCheck /> Listo y visible en la landing del prospecto
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-[260px] mx-auto aspect-[9/16] rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-2xl mb-3">
                            🎬
                          </div>
                          <h5 className="text-xs font-bold text-slate-700">Sin video generado aún</h5>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Selecciona un estilo y genera el video para que el prospecto pueda reproducirlo en su landing.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}
          </div>
        ) : (
          /* PESTAÑA: MIS MUESTRAS (HISTORIAL DEL VENDEDOR) */
          <div className="space-y-4">
            {/* PANEL DE MÉTRICAS Y PIPELINE DE CONVERSIÓN (PUNTO 5) */}
            {historyDemos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Muestras
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900">{totalDemos}</span>
                    <span className="text-[10px] font-bold text-slate-400">creadas</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 block mb-1 flex items-center gap-1">
                    <FaEye className="text-xs" /> Aperturas
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-indigo-600">{totalVistas}</span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                      {openRate}%
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1 flex items-center gap-1">
                    <FaFire className="text-xs" /> Interesados
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-amber-600">{totalInteresados}</span>
                    <span className="text-[10px] font-bold text-slate-400">leads</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-1 flex items-center gap-1">
                    <FaTrophy className="text-xs" /> Cierres
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-emerald-600">{totalCerrados}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      {conversionRate}%
                    </span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block mb-1 flex items-center gap-1">
                    <FaClock className="text-xs" /> Seguimiento
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-rose-600">{totalPendientesSeguimiento}</span>
                    <span className="text-[10px] font-bold text-slate-400">pendientes</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Buscar por negocio, contacto o teléfono..."
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={loadingHistory}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <FaSyncAlt className={loadingHistory ? "animate-spin" : ""} />
                  <span>Actualizar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("crear")}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <FaPlus /> <span>Nueva</span>
                </button>
              </div>
            </div>

            {/* PÍLDORAS DE FILTRADO POR ESTADO / EMBUDO */}
            {historyDemos.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
                <button
                  type="button"
                  onClick={() => setHistoryFilter("todos")}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                    historyFilter === "todos"
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Todos ({totalDemos})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("vistos")}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    historyFilter === "vistos"
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <FaEye className="text-xs" /> Abiertas ({totalVistas})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("interesados")}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    historyFilter === "interesados"
                      ? "bg-amber-600 border-amber-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                  }`}
                >
                  <FaFire className="text-xs" /> Interesados ({totalInteresados})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("cerrados")}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    historyFilter === "cerrados"
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  <FaTrophy className="text-xs" /> Cerrados ({totalCerrados})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("seguimiento")}
                  className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    historyFilter === "seguimiento"
                      ? "bg-rose-600 border-rose-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                  }`}
                >
                  <FaClock className="text-xs" /> Por Seguimiento ({totalPendientesSeguimiento})
                </button>
              </div>
            )}

            {loadingHistory ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-slate-500 font-bold">Cargando tus muestras...</p>
              </div>
            ) : historyDemos.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-xl">
                  📋
                </div>
                <h3 className="text-sm font-black text-slate-900">Aún no tienes muestras creadas</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Genera tu primera muestra comercial para sorprender a un prospecto por WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("crear")}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                >
                  <FaMagic /> Crear mi primera muestra
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {historyDemos
                  .filter((d) => {
                    const q = historySearch.toLowerCase();
                    const matchText =
                      !q ||
                      d.prospectBusiness?.toLowerCase().includes(q) ||
                      d.prospectName?.toLowerCase().includes(q) ||
                      d.prospectPhone?.includes(q) ||
                      d.rubro?.toLowerCase().includes(q);

                    if (!matchText) return false;

                    if (historyFilter === "vistos") return (d.viewCount || 0) > 0;
                    if (historyFilter === "interesados") return d.outcome === "interesado";
                    if (historyFilter === "cerrados") return d.outcome === "cerrado";
                    if (historyFilter === "seguimiento") return getFollowUpStatus(d) !== null;

                    return true;
                  })
                  .map((demo) => {
                    const thumb = demo.canvasImageUrl || demo.generatedImageUrl || demo.baseImageUrl || "";
                    const isSent = demo.status === "enviada";
                    const followUpAlert = getFollowUpStatus(demo);
                    const currentOutcome = demo.outcome || (isSent ? "enviado" : "nuevo");

                    return (
                      <div
                        key={demo.id}
                        className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-3xl p-4 shadow-sm hover:shadow-md flex flex-col justify-between space-y-3 transition-all"
                      >
                        <div className="flex gap-3">
                          {thumb ? (
                            <a
                              href={`${PUBLIC_APP_URL}/m/${demo.id}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Ver muestra completa"
                              className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 hover:opacity-90 transition-opacity block group relative"
                            >
                              <img
                                src={thumb}
                                alt={demo.prospectBusiness}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (demo.generatedImageUrl && target.src !== demo.generatedImageUrl) {
                                    target.src = demo.generatedImageUrl;
                                  } else if (demo.baseImageUrl && target.src !== demo.baseImageUrl) {
                                    target.src = demo.baseImageUrl;
                                  }
                                }}
                              />
                            </a>
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                              <FaImage className="text-xl" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <h4 className="text-sm font-black text-slate-900 truncate">
                                {demo.prospectBusiness}
                              </h4>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isSent
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {isSent ? "Enviada" : "Generada"}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 truncate">
                              👤 {demo.prospectName || "Sin contacto"}
                            </p>
                            {demo.dishOrProductName && (
                              <p className="text-[11px] text-indigo-600 font-bold truncate mt-0.5">
                                ⭐ {demo.dishOrProductName}
                              </p>
                            )}
                            {demo.publications && demo.publications.length > 0 && (
                              <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1 mt-1">
                                <span>⚡ {demo.publications.length} {demo.publications.length === 1 ? "publicación" : "publicaciones"}</span>
                              </span>
                            )}
                            {demo.generatedVideoUrl && (
                              <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1 mt-1">
                                <FaFilm className="text-[9px]" /> Con Video Reel
                              </span>
                            )}
                            {demo.prospectPhone && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                📞 +{demo.prospectPhone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* BADGES ANALÍTICOS Y ALERTAS (PUNTOS 1 Y 2) */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {(demo.viewCount || 0) > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <FaEye className="text-[9px]" /> {demo.viewCount} {demo.viewCount === 1 ? "apertura" : "aperturas"}
                              {demo.lastViewedAt && (
                                <span className="text-indigo-400 font-normal">· {formatRelativeTime(demo.lastViewedAt)}</span>
                              )}
                            </span>
                          ) : isSent ? (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                              <FaClock className="text-[9px]" /> No abierta aún
                            </span>
                          ) : null}

                          {demo.followUpCount && demo.followUpCount > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <FaCheckCircle className="text-[9px]" /> {demo.followUpCount} {demo.followUpCount === 1 ? "seguimiento" : "seguimientos"}
                            </span>
                          ) : null}

                          {followUpAlert && (
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                followUpAlert.type === "urgent"
                                  ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              <FaClock className="text-[9px]" /> {followUpAlert.label}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (demo.id) {
                                handleToggleWatermarkForDemo(demo.id, demo.includeWatermark !== false);
                              }
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-colors ${
                              demo.includeWatermark !== false
                                ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            }`}
                            title="Haz clic para cambiar si lleva marca de agua o no en el landing público"
                          >
                            <span>{demo.includeWatermark !== false ? "🔒 Con marca" : "✨ Sin marca"}</span>
                          </button>
                        </div>

                        {/* SELECTOR DE ESTADO COMERCIAL / PIPELINE (PUNTO 5) */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                          <span className="text-slate-500 font-bold flex items-center gap-1">
                            <span>Estado lead:</span>
                          </span>
                          <select
                            value={currentOutcome}
                            disabled={updatingOutcomeId === demo.id}
                            onChange={(e) => demo.id && handleUpdateOutcome(demo.id, e.target.value as any)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-black focus:outline-none border cursor-pointer transition-colors ${
                              currentOutcome === "cerrado"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : currentOutcome === "interesado"
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : currentOutcome === "visto"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : currentOutcome === "enviado"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : currentOutcome === "descartado"
                                ? "bg-slate-100 text-slate-400 border-slate-200"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            <option value="nuevo">Nuevo</option>
                            <option value="enviado">Enviado</option>
                            <option value="visto">Abierto</option>
                            <option value="interesado">Interesado 🔥</option>
                            <option value="cerrado">Cerrado 🏆</option>
                            <option value="descartado">Descartado</option>
                          </select>
                        </div>

                        {/* ACCIONES DE LA TARJETA */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          {isSent ? (
                            <button
                              type="button"
                              onClick={() => handleOpenFollowUp(demo)}
                              className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              title="Hacer seguimiento por WhatsApp"
                            >
                              <FaWhatsapp />
                              <span>Seguimiento</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={sendingWhatsAppId === demo.id}
                              onClick={() => handleSendWhatsApp(demo.id, demo.prospectPhone, demo.whatsappMessage)}
                              className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                            >
                              {sendingWhatsAppId === demo.id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  <span>Enviando...</span>
                                </>
                              ) : (
                                <>
                                  <FaWhatsapp /> <span>Enviar</span>
                                </>
                              )}
                            </button>
                          )}

                          {demo.id && (
                            <a
                              href={`${PUBLIC_APP_URL}/m/${demo.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
                              title="Ver Landing del prospecto"
                            >
                              <FaExternalLinkAlt className="text-xs" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleLoadDemoToEdit(demo)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
                            title="Editar en formulario"
                          >
                            <FaEdit className="text-xs" />
                          </button>

                          {demo.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDemo(demo.id!)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Eliminar muestra"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL / DRAWER INTERACTIVO PARA FILTRAR CATEGORÍAS DE ESTILOS */}
      {isStyleFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>🎨</span> Filtrar Estilos por Categoría
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecciona una o varias categorías para acotar el catálogo de estilos visuales
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStyleFilterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {/* Opción Todos los Estilos */}
              <button
                type="button"
                onClick={() => toggleCategory("all")}
                className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between border cursor-pointer ${
                  selectedCategories.length === 0
                    ? "border-indigo-600 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-500/30"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                    selectedCategories.length === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}>
                    ✨
                  </span>
                  <div>
                    <p className="text-xs font-black text-slate-900">Todos los Estilos</p>
                    <p className="text-[10px] text-slate-500">Ver todo el catálogo completo</p>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {categoryCounts.all || allTemplates.length}
                </span>
              </button>

              {/* Categorías individuales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {allCategoryNames.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  const count = categoryCounts[cat] || 0;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`p-3 rounded-2xl text-left transition-all flex items-center justify-between border cursor-pointer ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-500/30"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                        }`}>
                          🏷️
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">{cat}</span>
                      </div>
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected ? "bg-indigo-200 text-indigo-900" : "bg-slate-100 text-slate-600"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              {selectedCategories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategories([])}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-600 cursor-pointer"
                >
                  Restablecer a todos
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsStyleFilterModalOpen(false)}
                className="ml-auto py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Aplicar Filtros ({selectedCategories.length === 0 ? "Todos" : selectedCategories.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CAMBIAR CONTRASEÑA DEL VENDEDOR */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-[28px] max-w-sm w-full p-6 text-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm">
                  <FaKey />
                </span>
                <h3 className="text-base font-black text-slate-900">Cambiar mi Contraseña</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePassModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-light"
              >
                ✕
              </button>
            </div>

            {changePassSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <FaCheck /> {changePassSuccess}
              </div>
            ) : (
              <form onSubmit={handleChangeMyPassword} className="space-y-4">
                {changePassError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    ⚠️ {changePassError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirmar Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassInput}
                    onChange={(e) => setConfirmPassInput(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowChangePassModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={changePassLoading}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {changePassLoading ? "Guardando..." : "Actualizar Clave"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL INSTRUCCIONES INSTALACIÓN iOS */}
      {showIosInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-[28px] max-w-sm w-full p-6 text-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
              📲
            </div>
            <h3 className="text-base font-black text-slate-900">Instalar en tu iPhone</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              1. En Safari, toca el botón <strong>Compartir</strong> (el ícono cuadrado con flecha hacia arriba ⬆️ en la barra inferior).
              <br /><br />
              2. Desplázate hacia abajo y selecciona <strong>&quot;Añadir a pantalla de inicio&quot;</strong>.
              <br /><br />
              3. ¡Listo! Se abrirá a pantalla completa como una app nativa.
            </p>
            <button
              type="button"
              onClick={() => setShowIosInstallModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE SEGUIMIENTO WHATSAPP (PUNTO 2) */}
      {followUpDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-[28px] max-w-lg w-full p-6 text-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Seguimiento Oportuno
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Seguimiento para {followUpDemo.prospectBusiness}
                </h3>
                <p className="text-xs text-slate-500">
                  Contacto: {followUpDemo.prospectName || "Sin nombre"} · 📞 +{followUpDemo.prospectPhone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFollowUpDemo(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <FaTimesCircle className="text-lg" />
              </button>
            </div>

            {/* Contexto de visualización / analítica */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">👁️</span>
                <div>
                  <p className="font-bold text-slate-800">
                    {(followUpDemo.viewCount || 0) > 0
                      ? `¡El prospecto abrió la propuesta ${followUpDemo.viewCount} ${followUpDemo.viewCount === 1 ? 'vez' : 'veces'}!`
                      : "Aún no ha abierto el enlace de la muestra"}
                  </p>
                  {followUpDemo.lastViewedAt ? (
                    <p className="text-[10px] text-slate-500">
                      Última visita: {formatRelativeTime(followUpDemo.lastViewedAt)}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      Enviada {formatRelativeTime(followUpDemo.createdAt)}
                    </p>
                  )}
                </div>
              </div>
              {followUpDemo.followUpCount && followUpDemo.followUpCount > 0 ? (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                  {followUpDemo.followUpCount} {followUpDemo.followUpCount === 1 ? 'seguimiento previo' : 'seguimientos previos'}
                </span>
              ) : null}
            </div>

            {/* Mensaje de seguimiento */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Mensaje personalizado (redactado por nuestros agentes):
              </label>
              <textarea
                rows={5}
                value={followUpMsg}
                onChange={(e) => setFollowUpMsg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 leading-relaxed focus:bg-white focus:outline-none focus:border-indigo-600 font-sans"
              />
              <p className="text-[10px] text-slate-400">
                Puedes ajustar el mensaje a tu gusto antes de enviarlo. El enlace a la propuesta ya está incluido.
              </p>
            </div>

            {followUpErrorMsg && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-1.5">
                <FaTimesCircle className="text-rose-600 shrink-0" />
                <span>{followUpErrorMsg}</span>
              </div>
            )}

            {followUpSuccessMsg && (
              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-1.5">
                <FaCheckCircle className="text-emerald-600 shrink-0" />
                <span>{followUpSuccessMsg}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleSendFollowUp}
                disabled={isSendingFollowUp}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {isSendingFollowUp ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Enviando por WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <FaWhatsapp className="text-base" />
                    <span>Enviar Seguimiento (Directo)</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/${followUpDemo.prospectPhone.replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "")}?text=${encodeURIComponent(followUpMsg)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  if (followUpDemo.id) {
                    const nowIso = new Date().toISOString();
                    const newCount = (followUpDemo.followUpCount || 0) + 1;
                    auth.currentUser?.getIdToken().then((token) => {
                      fetch("/api/admin/muestras", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ id: followUpDemo.id, lastFollowUpAt: nowIso, followUpCount: newCount }),
                      });
                    });
                    setHistoryDemos((prev) =>
                      prev.map((d) => d.id === followUpDemo.id ? { ...d, lastFollowUpAt: nowIso, followUpCount: newCount } : d)
                    );
                  }
                }}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Abrir en WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
