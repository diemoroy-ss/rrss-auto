"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import BrandHeader from "../../components/BrandHeader";
import BrandFooter from "../../components/BrandFooter";
import DotCanvas from "../../components/DotCanvas";
import PageTracker from "../../components/PageTracker";
import WebChatWidget from "../../components/WebChatWidget";
import {
  FaPlay,
  FaVideo,
  FaImage,
  FaFileAlt,
  FaWhatsapp,
  FaSearch,
  FaCheck,
  FaArrowRight,
  FaTimes,
  FaExpand,
  FaLayerGroup,
  FaMagic,
  FaStar,
} from "react-icons/fa";
import { FLOW_COMMANDS, FlowCommandDef } from "../../lib/flow-command-translator";
import { HARDCODED_STYLES, PromptTemplate } from "../../lib/prompt-templates";
import { DEFAULT_TEXT_TEMPLATES, TextTemplate, formatTemplateText } from "../../lib/text-templates";

const WA_BASE_URL = "https://wa.me/56930825301";

// Imagen de respaldo garantizada en Firebase Storage
const FALLBACK_IMG =
  "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_macro_product_shot_image_1791910011818.jpg?alt=media&token=756d24c1-8169-42e0-b2ca-afd2cbb10a38";

// Videos reales demostrativos para los 20 comandos maestros
const SAMPLE_VIDEOS: Record<string, { videoUrl: string; posterUrl: string }> = {
  "/360 product orbit": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_360_product_orbit_video_1791908370384.mp4?alt=media&token=255d8c89-98e8-4a22-a30a-d8a2feb6f8af",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_360_product_orbit_image_1791908361375.jpg?alt=media&token=8587c752-bbde-49e9-9766-2e0a7e5bd16b",
  },
  "/water splash reveal": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_water_splash_reveal_video_1791909074089.mp4?alt=media&token=1ddff927-8722-42f2-8c42-384ab59fa9df",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_water_splash_reveal_image_1791909068083.jpg?alt=media&token=5b2327ed-ee9c-4db3-ac83-0df70ec12f4c",
  },
  "/fresh food reveal": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_fresh_food_reveal_video_1791908993033.mp4?alt=media&token=4ea5d4e0-4c00-4d38-b2e8-009570c14128",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_fresh_food_reveal_image_1791908932525.jpg?alt=media&token=2f817f96-ef93-4740-998c-c2826d3adb13",
  },
  "/macro product shot": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_macro_product_shot_video_1791910036356.mp4?alt=media&token=675a7d7e-a182-44da-b858-81427a4a8255",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_macro_product_shot_image_1791910011818.jpg?alt=media&token=756d24c1-8169-42e0-b2ca-afd2cbb10a38",
  },
  "/ice reveal": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_water_splash_reveal_video_1791909074089.mp4?alt=media&token=1ddff927-8722-42f2-8c42-384ab59fa9df",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_water_splash_reveal_image_1791909068083.jpg?alt=media&token=5b2327ed-ee9c-4db3-ac83-0df70ec12f4c",
  },
  "/fire sizzle reveal": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_smoke_reveal_video_1791912556524.mp4?alt=media&token=fe380098-be2f-44ef-b847-fd532d47a692",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_smoke_reveal_image_1791912549918.webp?alt=media&token=b064d1f1-508e-4a34-b6f5-e487b682dacf",
  },
  "/smoke reveal": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_smoke_reveal_video_1791912556524.mp4?alt=media&token=fe380098-be2f-44ef-b847-fd532d47a692",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_smoke_reveal_image_1791912549918.webp?alt=media&token=b064d1f1-508e-4a34-b6f5-e487b682dacf",
  },
  "/powder explosion reveal": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_smoke_reveal_video_1791912556524.mp4?alt=media&token=fe380098-be2f-44ef-b847-fd532d47a692",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_smoke_reveal_image_1791912549918.webp?alt=media&token=b064d1f1-508e-4a34-b6f5-e487b682dacf",
  },
  "/neon glow reveal": {
    videoUrl: "/rrss1.mp4",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_times_square_3d_reveal_image_1791914453800.webp?alt=media&token=d4aa6e39-63ee-4f12-bde2-2f73b6b515d8",
  },
  "/gold luxury reveal": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_macro_product_shot_video_1791910036356.mp4?alt=media&token=675a7d7e-a182-44da-b858-81427a4a8255",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_macro_product_shot_image_1791910011818.jpg?alt=media&token=756d24c1-8169-42e0-b2ca-afd2cbb10a38",
  },
  "/nature botanical reveal": {
    videoUrl: "/rrss2.mp4",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_water_splash_reveal_image_1791909068083.jpg?alt=media&token=5b2327ed-ee9c-4db3-ac83-0df70ec12f4c",
  },
  "/coffee steam pour": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_fresh_food_reveal_video_1791908993033.mp4?alt=media&token=4ea5d4e0-4c00-4d38-b2e8-009570c14128",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_fresh_food_reveal_image_1791908932525.jpg?alt=media&token=2f817f96-ef93-4740-998c-c2826d3adb13",
  },
  "/beverage fizz pour": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_water_splash_reveal_video_1791909074089.mp4?alt=media&token=1ddff927-8722-42f2-8c42-384ab59fa9df",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_water_splash_reveal_image_1791909068083.jpg?alt=media&token=5b2327ed-ee9c-4db3-ac83-0df70ec12f4c",
  },
  "/texture glide": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_macro_product_shot_video_1791910036356.mp4?alt=media&token=675a7d7e-a182-44da-b858-81427a4a8255",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_macro_product_shot_image_1791910011818.jpg?alt=media&token=756d24c1-8169-42e0-b2ca-afd2cbb10a38",
  },
  "/packaging unbox": {
    videoUrl: "/rrss3.mp4",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_360_product_orbit_image_1791908361375.jpg?alt=media&token=8587c752-bbde-49e9-9766-2e0a7e5bd16b",
  },
  "/Times Square 3D reveal": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_times_square_3d_reveal_video_1791914460145.mp4?alt=media&token=aa6ddf8a-5b0e-4c97-b902-50ccf5ee2deb",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_times_square_3d_reveal_image_1791914453800.webp?alt=media&token=d4aa6e39-63ee-4f12-bde2-2f73b6b515d8",
  },
  "/speed ramp showcase": {
    videoUrl: "/rrss4.mp4",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_360_product_orbit_image_1791908361375.jpg?alt=media&token=8587c752-bbde-49e9-9766-2e0a7e5bd16b",
  },
  "/cinematic drone flyby": {
    videoUrl: "/rrss5.mp4",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_times_square_3d_reveal_image_1791914453800.webp?alt=media&token=d4aa6e39-63ee-4f12-bde2-2f73b6b515d8",
  },
  "/split screen showcase": {
    videoUrl: "/rrss6.mp4",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_fresh_food_reveal_image_1791908932525.jpg?alt=media&token=2f817f96-ef93-4740-998c-c2826d3adb13",
  },
  "/holographic tech reveal": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_times_square_3d_reveal_video_1791914460145.mp4?alt=media&token=aa6ddf8a-5b0e-4c97-b902-50ccf5ee2deb",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_times_square_3d_reveal_image_1791914453800.webp?alt=media&token=d4aa6e39-63ee-4f12-bde2-2f73b6b515d8",
  },
};

type LibraryTab = "all" | "videos" | "text-templates" | "photos" | "demos";

interface SelectedModalItem {
  type: "video" | "photo" | "poster" | "text-template" | "demo";
  title: string;
  category: string;
  description: string;
  command?: string;
  cameraMovement?: string;
  physicsEffect?: string;
  lightingStyle?: string;
  imageUrl?: string;
  videoUrl?: string;
  templateObj?: TextTemplate;
}

export default function BibliotecaPublicaPage() {
  const [activeTab, setActiveTab] = useState<LibraryTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalItem, setModalItem] = useState<SelectedModalItem | null>(null);

  // Estados sincronizados desde Firestore con valores por defecto
  const [styles, setStyles] = useState<PromptTemplate[]>(HARDCODED_STYLES);
  const [textTemplates, setTextTemplates] = useState<TextTemplate[]>(DEFAULT_TEXT_TEMPLATES);
  const [prospectDemos, setProspectDemos] = useState<any[]>([]);
  const [loadingDynamic, setLoadingDynamic] = useState<boolean>(true);

  // Cargar dinámicamente desde la API pública los estilos reales de Firestore (los mismos que están en la App)
  useEffect(() => {
    let isMounted = true;
    async function loadPublicData() {
      try {
        const res = await fetch("/api/public/biblioteca");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (Array.isArray(data.styles) && data.styles.length > 0) {
              setStyles(data.styles);
            }
            if (Array.isArray(data.textTemplates) && data.textTemplates.length > 0) {
              setTextTemplates(data.textTemplates);
            }
            if (Array.isArray(data.demosWithText)) {
              setProspectDemos(data.demosWithText);
            }
          }
        }
      } catch (err) {
        console.warn("[Biblioteca] Usando plantillas base offline:", err);
      } finally {
        if (isMounted) setLoadingDynamic(false);
      }
    }
    loadPublicData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Separar estilos de imagen: Fotos limpias vs Afiches comerciales con texto
  const photoStyles = useMemo(() => {
    return styles.filter((s) => !s.isCommercialPoster);
  }, [styles]);

  // Filtrado de Videos (20 Comandos de Video)
  const filteredVideos = useMemo(() => {
    if (activeTab === "photos" || activeTab === "text-templates" || activeTab === "demos") return [];
    return FLOW_COMMANDS.filter((cmd) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        cmd.name.toLowerCase().includes(q) ||
        cmd.command.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
      );
    });
  }, [activeTab, searchQuery]);

  // Filtrado de Plantillas de Texto & Afiches (las que tienen textos y llaman la atención)
  const filteredTextTemplates = useMemo(() => {
    if (activeTab === "videos" || activeTab === "photos" || activeTab === "demos") return [];
    return textTemplates.filter((tpl) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q) ||
        tpl.badgeText.toLowerCase().includes(q) ||
        tpl.ctaText.toLowerCase().includes(q)
      );
    });
  }, [activeTab, textTemplates, searchQuery]);

  // Filtrado de Fotos de Producto Limpias (Sin texto)
  const filteredPhotos = useMemo(() => {
    if (activeTab === "videos" || activeTab === "text-templates" || activeTab === "demos") return [];
    return photoStyles.filter((s) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });
  }, [activeTab, photoStyles, searchQuery]);

  // Filtrado de Muestras / Demos de Prospectos Reales generadas
  const filteredDemos = useMemo(() => {
    if (activeTab === "videos" || activeTab === "photos" || activeTab === "text-templates") return [];
    return prospectDemos.filter((d) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.businessName.toLowerCase().includes(q) ||
        d.productName.toLowerCase().includes(q) ||
        d.rubro.toLowerCase().includes(q) ||
        d.styleTitle.toLowerCase().includes(q)
      );
    });
  }, [activeTab, prospectDemos, searchQuery]);

  const totalResults =
    filteredVideos.length +
    filteredTextTemplates.length +
    filteredPhotos.length +
    filteredDemos.length;

  // Generador de URL contextualizada para WhatsApp
  const getWhatsAppLink = (itemTitle: string, itemType: string) => {
    const text = encodeURIComponent(
      `¡Hola! Estuve viendo la biblioteca pública de Santisoft y me encantó el estilo "${itemTitle}" (${itemType}). Quiero ver cómo quedaría aplicado a mi negocio.`
    );
    return `${WA_BASE_URL}?text=${text}`;
  };

  /**
   * Renderiza el componente visual de la plantilla de texto
   * (con tipografía, badges, ribbons de precio y botones superpuestos)
   */
  const renderTextTemplateCanvas = (template: TextTemplate, isModal = false) => {
    const layout = template.layoutPosition || "top_banner";
    const bgImage = template.previewSampleImage || FALLBACK_IMG;

    const sampleProduct = "Combo Burger";
    const samplePrice = "$19.900";

    const title = formatTemplateText(template.headlinePattern, {
      productName: sampleProduct,
      price: samplePrice,
    });
    const sub = template.subheadlinePattern
      ? formatTemplateText(template.subheadlinePattern, {
          productName: sampleProduct,
          price: samplePrice,
        })
      : null;

    return (
      <div
        className={`relative w-full ${
          isModal ? "aspect-[4/5] max-w-sm mx-auto" : "aspect-[4/5]"
        } rounded-2xl overflow-hidden bg-slate-950 shadow-2xl select-none`}
      >
        {/* Foto de producto base */}
        <img
          src={bgImage}
          alt={template.name}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMG;
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* ═══ 1. SPLIT LATERAL (Texto a la izquierda, plato a la derecha) ═══ */}
        {layout === "split_left" && (
          <>
            <div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-black/95 via-black/80 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between z-10 pointer-events-none">
              <div className="w-[58%] space-y-1 sm:space-y-1.5 pt-1">
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow"
                  style={{
                    backgroundColor: template.badgeBgColor,
                    color: template.badgeTextColor,
                  }}
                >
                  {template.badgeText}
                </span>

                <h3
                  className={`font-black leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-left ${
                    template.headlineFont === "script_handwritten"
                      ? "font-serif italic text-lg sm:text-xl text-amber-300"
                      : "font-sans uppercase text-base sm:text-lg text-white"
                  }`}
                  style={{ color: template.headlineColor }}
                >
                  {title}
                </h3>

                {sub && (
                  <p className="text-white/90 text-[10px] font-semibold line-clamp-2 drop-shadow leading-tight">
                    {sub}
                  </p>
                )}

                <div className="pt-1">
                  <span
                    className="inline-block px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black shadow border border-black/20"
                    style={{
                      backgroundColor: template.priceBgColor || "#fbbf24",
                      color: template.priceTextColor || "#0f172a",
                    }}
                  >
                    {samplePrice}
                  </span>
                </div>
              </div>

              <div className="w-[55%] pb-1">
                <div
                  className="px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase text-center shadow-lg truncate border border-black/20"
                  style={{
                    backgroundColor: template.ctaBgColor,
                    color: template.ctaTextColor,
                  }}
                >
                  {template.ctaText}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ 2. RECETAS E INGREDIENTES ═══ */}
        {layout === "recipe_ingredients" && (
          <>
            <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-black/95 via-black/70 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/95 via-black/80 to-transparent pointer-events-none z-10" />

            <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between z-10 pointer-events-none text-center">
              <div className="space-y-1 pt-1">
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow"
                  style={{
                    backgroundColor: template.badgeBgColor,
                    color: template.badgeTextColor,
                  }}
                >
                  {template.badgeText}
                </span>

                <h3
                  className="font-black leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-base sm:text-lg uppercase"
                  style={{ color: template.headlineColor }}
                >
                  {title}
                </h3>
              </div>

              <div className="space-y-1.5 pb-1">
                {template.ingredients && template.ingredients.length > 0 && (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {template.ingredients.slice(0, 3).map((ing, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-[9px] font-bold text-amber-300 border border-amber-500/30 shadow"
                      >
                        {ing.icon || "✓"} {ing.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-center">
                  <div
                    className="px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase text-center shadow-lg border border-black/20"
                    style={{
                      backgroundColor: template.ctaBgColor,
                      color: template.ctaTextColor,
                    }}
                  >
                    {template.ctaText}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ 3. TOP BANNER (Cabecera superior tradicional & espacio limpio) ═══ */}
        {layout !== "split_left" && layout !== "recipe_ingredients" && (
          <>
            <div className="absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-black/95 via-black/65 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

            {/* Ribbon de precio en esquina superior derecha */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <span
                className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black tracking-wide shadow-xl border border-black/30"
                style={{
                  backgroundColor: template.priceBgColor || "#fbbf24",
                  color: template.priceTextColor || "#0f172a",
                }}
              >
                {samplePrice}
              </span>
            </div>

            <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between z-10 text-center pointer-events-none">
              <div className="space-y-1 pt-1 px-1">
                <div className="flex justify-center mb-1">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow border border-white/10"
                    style={{
                      backgroundColor: template.badgeBgColor,
                      color: template.badgeTextColor,
                    }}
                  >
                    {template.badgeText}
                  </span>
                </div>

                <h3
                  className={`font-black leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] text-center ${
                    template.headlineFont === "script_handwritten"
                      ? "font-serif italic text-lg sm:text-xl text-amber-300"
                      : template.headlineFont === "elegant_serif"
                      ? "font-serif text-base sm:text-lg tracking-wide text-white"
                      : "font-sans uppercase text-base sm:text-lg text-white"
                  }`}
                  style={{ color: template.headlineColor }}
                >
                  {title}
                </h3>

                {sub && (
                  <p className="text-white/95 text-[10px] sm:text-[11px] font-semibold tracking-wide drop-shadow line-clamp-1">
                    {sub}
                  </p>
                )}
              </div>

              <div className="pb-1 px-2 flex justify-center">
                <div
                  className="px-3.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider uppercase text-center shadow-xl truncate max-w-[190px] border border-black/20"
                  style={{
                    backgroundColor: template.ctaBgColor,
                    color: template.ctaTextColor,
                  }}
                >
                  {template.ctaText}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen selection:bg-orange-500 selection:text-white">
      <PageTracker page="biblioteca" />
      <DotCanvas />
      <WebChatWidget />

      <div className="promo">
        <span className="on-air"></span>
        CATÁLOGO VISUAL PÚBLICO ·{" "}
        <strong>
          20 COMANDOS DE VIDEO &bull; PLANTILLAS DE TEXTO PUBLICITARIAS &bull; FOTOGRAFÍA HD
        </strong>
      </div>

      <BrandHeader />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24 space-y-12">
        {/* Hero de la Biblioteca */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-400/40 text-orange-400 text-xs font-bold tracking-wide">
            <FaLayerGroup className="text-xs" />
            Catálogo Visual Oficial de Nuestros Agentes
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
            Biblioteca de Estilos,
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-amber-200">
              Plantillas de Texto &amp; Videos.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Explora exactamente el mismo catálogo que tienen nuestros agentes especializados en la
            aplicación: afiches con capas tipográficas que llaman la atención, 20 comandos de video en
            formato vertical 9:16 y fotografía de producto con iluminación cinematográfica.
          </p>
        </section>

        {/* Barra de Filtros y Buscador */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                Todos ({totalResults})
              </button>

              <button
                onClick={() => setActiveTab("videos")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "videos"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <FaVideo /> Videos 9:16 ({FLOW_COMMANDS.length})
              </button>

              <button
                onClick={() => setActiveTab("text-templates")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "text-templates"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <FaFileAlt /> Plantillas de Texto ({textTemplates.length})
              </button>

              <button
                onClick={() => setActiveTab("photos")}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "photos"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <FaImage /> Fotos Limpias ({photoStyles.length})
              </button>

              {prospectDemos.length > 0 && (
                <button
                  onClick={() => setActiveTab("demos")}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "demos"
                      ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <FaStar /> Demos Reales ({prospectDemos.length})
                </button>
              )}
            </div>

            {/* Buscador */}
            <div className="relative w-full md:w-72">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por estilo, plato, comando..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-orange-500/60 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title="Limpiar búsqueda"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Mostrando <strong className="text-white">{totalResults}</strong> estilos y formatos listos
            </span>
            <span className="text-orange-400 font-semibold flex items-center gap-1">
              <FaMagic className="text-[10px]" /> Sincronizado en tiempo real con la App
            </span>
          </div>
        </section>

        {/* ───────────── 1. SECCIÓN PLANTILLAS DE TEXTO (AFICHES COMERCIALES CON TEXTO) ───────────── */}
        {filteredTextTemplates.length > 0 && (
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-base">
                  <FaFileAlt />
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Plantillas de Texto &amp; Afiches Comerciales
                  </h2>
                  <p className="text-xs text-slate-400">
                    Capas tipográficas diseñadas para vender: titulares llamativos, ribbons de precio,
                    insignias y llamados a la acción sin tapar el producto.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                {filteredTextTemplates.length} plantillas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTextTemplates.map((template) => (
                <article
                  key={template.id}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 p-5 space-y-4 flex flex-col justify-between transition-all group hover:-translate-y-0.5 shadow-xl"
                >
                  <div className="space-y-3">
                    {/* Render visual interactivo de la plantilla con texto */}
                    {renderTextTemplateCanvas(template)}

                    <div className="flex items-start justify-between gap-2 pt-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          {template.category}
                        </span>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {template.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {template.description}
                    </p>

                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                        <FaCheck /> Texto, precio y botón integrados
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {template.layoutPosition === "split_left"
                          ? "Composición Split Lateral: texto al costado y plato libre a la derecha."
                          : template.layoutPosition === "recipe_ingredients"
                          ? "Ficha de receta con ingredientes y atributos destacados."
                          : "Cabecera superior de impacto con plato 100% visible."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() =>
                        setModalItem({
                          type: "text-template",
                          title: template.name,
                          category: template.category,
                          description: template.description,
                          templateObj: template,
                        })
                      }
                      className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      <FaExpand className="text-[10px]" /> Ver afiche en grande
                    </button>

                    <a
                      href={getWhatsAppLink(template.name, "Plantilla de Texto")}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <FaWhatsapp /> Solicitar afiche
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ───────────── 2. SECCIÓN VIDEOS CINEMÁTICOS 9:16 (20 COMANDOS) ───────────── */}
        {filteredVideos.length > 0 && (
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-orange-500/15 text-orange-400 text-base">
                  <FaVideo />
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Videos Verticales 9:16 (Comandos de Agentes)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Animaciones de producto, giros 360°, humo, agua, fuego y efectos cinemáticos para Reels, TikTok y Shorts
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-orange-400">
                {filteredVideos.length} comandos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((cmd) => {
                const sample = SAMPLE_VIDEOS[cmd.command] || SAMPLE_VIDEOS["/360 product orbit"];
                const videoSrc = sample?.videoUrl;
                const posterSrc = sample?.posterUrl || FALLBACK_IMG;

                return (
                  <article
                    key={cmd.command}
                    className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-orange-500/40 p-5 space-y-4 flex flex-col justify-between transition-all group hover:-translate-y-0.5 shadow-xl"
                  >
                    <div className="space-y-3">
                      {/* Video Player 9:16 vertical con poster */}
                      <div className="relative aspect-[9/12] rounded-2xl overflow-hidden bg-black border border-slate-800 group-hover:border-orange-500/50 transition-colors">
                        <video
                          src={videoSrc}
                          poster={posterSrc}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur px-2.5 py-1 rounded-full text-[10px] text-orange-400 font-bold border border-orange-500/30 flex items-center gap-1">
                          <FaPlay className="text-[8px]" /> 9:16 HD
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-2 pt-1">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                            {cmd.category}
                          </span>
                          <h3 className="text-base font-bold text-white group-hover:text-orange-300 transition-colors">
                            {cmd.name}
                          </h3>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {cmd.description}
                      </p>

                      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 font-mono text-[11px]">
                        <div className="text-orange-400 font-bold truncate">
                          Comando: {cmd.command}
                        </div>
                        <div className="text-slate-400 text-[10px] line-clamp-1">
                          Cámara: {cmd.cameraMovement}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() =>
                          setModalItem({
                            type: "video",
                            title: cmd.name,
                            category: cmd.category,
                            description: cmd.description,
                            command: cmd.command,
                            cameraMovement: cmd.cameraMovement,
                            physicsEffect: cmd.physicsEffect,
                            lightingStyle: cmd.lightingStyle,
                            videoUrl: videoSrc,
                            imageUrl: posterSrc,
                          })
                        }
                        className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
                      >
                        <FaExpand className="text-[10px]" /> Ver pantalla completa
                      </button>

                      <a
                        href={getWhatsAppLink(cmd.name, "Comando de Video")}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500 text-orange-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <FaWhatsapp /> Solicitar estilo
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ───────────── 3. SECCIÓN FOTOGRAFÍA DE PRODUCTO & SERVICIOS ───────────── */}
        {filteredPhotos.length > 0 && (
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 text-base">
                  <FaImage />
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Fotografía de Producto &amp; Servicios (Sin Texto)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Estilos fotográficos limpios, iluminación de estudio y fondos cuidados según las directrices de arte de la App
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400">
                {filteredPhotos.length} estilos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((style) => (
                <article
                  key={style.id}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 p-5 space-y-4 flex flex-col justify-between transition-all group hover:-translate-y-0.5 shadow-xl"
                >
                  <div className="space-y-3">
                    {/* Imagen de preview visible con fallback */}
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                      <img
                        src={style.previewUrl || FALLBACK_IMG}
                        alt={style.title}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_IMG;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur px-2.5 py-1 rounded-md text-[10px] text-white font-mono">
                        Foto de Producto
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 pt-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          {style.category}
                        </span>
                        <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                          {style.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {style.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() =>
                        setModalItem({
                          type: "photo",
                          title: style.title,
                          category: style.category,
                          description: style.description,
                          imageUrl: style.previewUrl || FALLBACK_IMG,
                        })
                      }
                      className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      <FaExpand className="text-[10px]" /> Ver detalle
                    </button>

                    <a
                      href={getWhatsAppLink(style.title, "Foto de Producto")}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <FaWhatsapp /> Probar estilo
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ───────────── 4. SECCIÓN DEMOS REALES GENERADAS ───────────── */}
        {filteredDemos.length > 0 && (
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-500/15 text-purple-400 text-base">
                  <FaStar />
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Muestras Reales Creadas por Nuestros Agentes
                  </h2>
                  <p className="text-xs text-slate-400">
                    Piezas comerciales generadas para negocios gastronómicos, comercios y marcas locales
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-purple-400">
                {filteredDemos.length} muestras
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDemos.map((demo) => (
                <article
                  key={demo.id}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 p-5 space-y-4 flex flex-col justify-between transition-all group hover:-translate-y-0.5 shadow-xl"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                      <img
                        src={demo.imageUrl || FALLBACK_IMG}
                        alt={demo.businessName}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_IMG;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {demo.offerText && (
                        <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg">
                          {demo.offerText}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                        {demo.rubro} &bull; {demo.businessName}
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                        {demo.productName}
                      </h3>
                    </div>

                    {demo.copyText && (
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {demo.copyText}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() =>
                        setModalItem({
                          type: "demo",
                          title: `${demo.businessName} - ${demo.productName}`,
                          category: demo.rubro,
                          description: demo.copyText || demo.styleTitle,
                          imageUrl: demo.imageUrl,
                          videoUrl: demo.videoUrl || undefined,
                        })
                      }
                      className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      <FaExpand className="text-[10px]" /> Ver muestra
                    </button>

                    <a
                      href={getWhatsAppLink(demo.businessName, "Muestra Comercial")}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <FaWhatsapp /> Quiero algo así
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ───────────── LLAMADO A LA ACCIÓN FINAL ───────────── */}
        <section className="pt-10">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-8 sm:p-14 text-center space-y-6 shadow-2xl border border-orange-500/30">
            {/* Resplandor decorativo de fondo */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
                ✨ Publica como los Grandes
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                ¿Listo para que tus redes publiquen con estos estilos todos los días?
              </h2>

              <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Tú solo tomas la foto con tu celular y apruebas desde WhatsApp. Nuestros agentes se
                encargan del video, afiche comercial, redacción persuasiva y publicación automática.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {/* Botón Principal: Ver cómo funciona */}
              <Link
                href="/como-funciona"
                style={{ color: "#ffffff" }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 !text-white font-black text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-center"
              >
                Ver cómo funciona <FaArrowRight className="text-xs" />
              </Link>

              {/* Botón Secundario: Ver planes y precios */}
              <Link
                href="/#planes"
                style={{ color: "#ffffff" }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 !text-white font-black text-sm border border-slate-700 hover:border-slate-600 shadow-md transition-all flex items-center justify-center text-center"
              >
                Ver planes y precios
              </Link>

              {/* Botón WhatsApp */}
              <a
                href={getWhatsAppLink("Biblioteca General", "Consulta de Planes")}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#ffffff" }}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 !text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40"
              >
                <FaWhatsapp className="text-base" /> Hablar por WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Modal Unificado de Ampliación (Video, Foto, Plantilla de Texto o Demo) */}
        {modalItem && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <button
                onClick={() => setModalItem(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800"
                aria-label="Cerrar modal"
              >
                <FaTimes />
              </button>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  {modalItem.category}
                </span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-xs text-slate-300 font-semibold uppercase">
                  {modalItem.type === "video"
                    ? "Video Vertical 9:16"
                    : modalItem.type === "text-template"
                    ? "Plantilla de Texto Publicitaria"
                    : modalItem.type === "demo"
                    ? "Muestra Comercial"
                    : "Fotografía HD"}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {modalItem.title}
              </h3>

              {/* Render de Video, Plantilla de Texto o Imagen según el tipo */}
              {modalItem.type === "text-template" && modalItem.templateObj ? (
                <div className="max-w-xs mx-auto">
                  {renderTextTemplateCanvas(modalItem.templateObj, true)}
                </div>
              ) : modalItem.videoUrl ? (
                <div className="aspect-[9/12] max-w-xs mx-auto rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl">
                  <video
                    src={modalItem.videoUrl}
                    poster={modalItem.imageUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : modalItem.imageUrl ? (
                <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
                  <img
                    src={modalItem.imageUrl}
                    alt={modalItem.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                    className="w-full h-auto object-cover max-h-[420px]"
                  />
                </div>
              ) : null}

              <div className="space-y-3 text-sm text-slate-300">
                <p className="leading-relaxed">{modalItem.description}</p>

                {modalItem.command && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <p className="font-mono text-xs text-orange-400 font-bold">
                      Comando: {modalItem.command}
                    </p>
                    {modalItem.cameraMovement && (
                      <p className="text-xs">
                        <strong className="text-slate-300">Cámara:</strong> {modalItem.cameraMovement}
                      </p>
                    )}
                    {modalItem.physicsEffect && (
                      <p className="text-xs">
                        <strong className="text-amber-400">Física:</strong> {modalItem.physicsEffect}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setModalItem(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold"
                >
                  Cerrar
                </button>
                <a
                  href={getWhatsAppLink(modalItem.title, modalItem.type)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg"
                >
                  <FaWhatsapp /> Solicitar este estilo por WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <BrandFooter />
    </div>
  );
}
