"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaWhatsapp, FaImage, FaVideo, FaShareAlt, FaCheck, FaArrowRight, FaShieldAlt, FaRocket, FaClock, FaStar, FaCopy, FaPenNib } from "react-icons/fa";

// Importación dinámica de RemotionReelPlayer para mantener la carga ultra-rápida en móviles
const RemotionReelPlayer = dynamic(() => import("../../../components/video/RemotionReelPlayer"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[9/16] max-w-[320px] mx-auto bg-slate-900 rounded-3xl flex flex-col items-center justify-center p-6 text-center text-slate-400 border border-slate-800">
      <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-xs font-bold text-slate-300">Cargando reproductor de video...</p>
    </div>
  ),
});

export interface StrategyPillar {
  name: string;
  description: string;
  percentage: number;
  icon?: string;
}

export interface StrategyScheduleItem {
  day: string;
  time: string;
  format: "post" | "carrusel" | "reel";
  objective: string;
  hook: string;
  linkedPublicationId?: string;
}

export interface DemoStrategy {
  objective?: string;
  targetAudience?: string;
  toneAndVoice?: string;
  pillars?: StrategyPillar[];
  schedulePlan?: StrategyScheduleItem[];
  nicheOpportunities?: string[];
}

export interface PublicationItem {
  id: string;
  type: "post" | "carrusel" | "reel";
  title?: string;
  dishOrProductName?: string;
  productPrice?: string;
  hook?: string;
  copy?: string;
  cta?: string;
  visualStyleTitle?: string;
  imageUrl?: string;
  carouselImages?: string[];
  videoUrl?: string;
  remotionComposition?: any;
  reelScript?: {
    hook3s?: string;
    body?: string;
    cta?: string;
  };
  isCommercialPoster?: boolean;
}

interface DemoData {
  id: string;
  prospectName?: string;
  prospectBusiness: string;
  prospectPhone?: string;
  rubro?: string;
  offerText?: string;
  dishOrProductName?: string;
  badgeCustomText?: string;
  generatedPostCaption?: string;
  generatedImageUrl?: string;
  generatedVideoUrl?: string;
  remotionComposition?: any;
  videoStyleTitle?: string;
  videoPromptEnglish?: string;
  logoUrl?: string;
  selectedStyleTitle?: string;
  createdAt?: any;
  publications?: PublicationItem[];
  strategy?: DemoStrategy;
}

interface PlanConfig {
  id: string;
  name: string;
  tagline: string;
  price: number;
  annualPrice?: number;
  postsLimit: number;
  videosLimit: number;
  aiImagesLimit?: number;
  aiVideosLimit?: number;
  seoBlogsLimit?: number;
  multiAccount?: boolean;
  maxAccounts?: number;
  isPopular?: boolean;
  ctaText?: string;
  features?: string[];
}

const DEFAULT_PLANS: Record<string, PlanConfig> = {
  free: {
    id: "free",
    name: "Prueba Gratis",
    tagline: "POR 10 DÍAS",
    price: 0,
    annualPrice: 0,
    postsLimit: 5,
    videosLimit: 0,
    aiImagesLimit: 8,
    aiVideosLimit: 0,
    seoBlogsLimit: 0,
    isPopular: false,
    ctaText: "Probar 5 Posts Gratis",
    features: [
      "5 publicaciones automáticas por 10 días",
      "8 imágenes con nuestros agentes",
      "Todas las redes sociales (IG, FB, TT, YT, X)",
      "1 perfil de marca",
      "Sin tarjeta de crédito"
    ]
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "EMPIEZA A AUTOMATIZAR",
    price: 24990,
    annualPrice: 249900,
    postsLimit: 20,
    videosLimit: 2,
    aiImagesLimit: 20,
    aiVideosLimit: 2,
    seoBlogsLimit: 0,
    isPopular: false,
    ctaText: "Comenzar Starter",
    features: [
      "20 publicaciones en redes al mes",
      "2 videos para Reels / TikTok / Shorts al mes",
      "20 imágenes con nuestros agentes al mes",
      "Todas las redes sociales",
      "1 perfil de marca"
    ]
  },
  growth: {
    id: "growth",
    name: "Growth",
    tagline: "ACELERA TU PRESENCIA",
    price: 44990,
    annualPrice: 449900,
    postsLimit: 40,
    videosLimit: 6,
    aiImagesLimit: 40,
    aiVideosLimit: 6,
    seoBlogsLimit: 2,
    isPopular: true,
    ctaText: "Elegir Growth",
    features: [
      "40 publicaciones en redes al mes",
      "6 videos con locución y guión al mes",
      "40 imágenes con nuestros agentes al mes",
      "2 artículos de Blog SEO/GEO al mes",
      "WhatsApp Bot: revisión y aprobación de posts",
      "Todas las redes sociales"
    ]
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "EL MÁS ELEGIDO",
    price: 89990,
    annualPrice: 899900,
    postsLimit: 80,
    videosLimit: 12,
    aiImagesLimit: 80,
    aiVideosLimit: 12,
    seoBlogsLimit: 8,
    isPopular: false,
    ctaText: "Elegir Pro",
    features: [
      "80 publicaciones en redes al mes",
      "12 videos con locución y guión al mes",
      "80 imágenes con nuestros agentes al mes",
      "8 artículos de Blog SEO/GEO al mes",
      "WhatsApp Bot completo + Radar de Nicho",
      "Meta Ads integrado"
    ]
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "HASTA 3 CUENTAS",
    price: 169990,
    annualPrice: 1699900,
    postsLimit: 200,
    videosLimit: 30,
    aiImagesLimit: 200,
    aiVideosLimit: 30,
    seoBlogsLimit: 20,
    isPopular: false,
    ctaText: "Elegir Business",
    features: [
      "200 publicaciones en redes al mes",
      "30 videos con locución y guión al mes",
      "200 imágenes con nuestros agentes al mes",
      "20 artículos de Blog SEO/GEO al mes",
      "WhatsApp Bot multi-marca",
      "Hasta 3 marcas o cuentas independientes"
    ]
  }
};

const formatPrice = (price: number) => {
  if (!price || price === 0) return "$0";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(price);
};

const sanitizeFeature = (text: string) => {
  if (!text) return "";
  return text
    .replace(/\bIA\b/g, "nuestros agentes")
    .replace(/Inteligencia Artificial/gi, "agentes especializados");
};

const PLAN_DISPLAY_KEYS = ["free", "starter", "growth", "pro"] as const;

const PLAN_META: Record<string, { defaultBadge: string; emoji: string; subtitle: string }> = {
  free: { defaultBadge: "10 Días", emoji: "🎁", subtitle: "Comprueba la calidad en tus redes" },
  starter: { defaultBadge: "Básico", emoji: "⚡", subtitle: "Constancia esencial mes a mes" },
  growth: { defaultBadge: "Crecimiento", emoji: "🚀", subtitle: "El equilibrio perfecto de video y contenido" },
  pro: { defaultBadge: "Avanzado", emoji: "👑", subtitle: "Máximo impacto con Meta Ads" },
};

function WatermarkOverlay({
  size = "normal",
  text = "SANTISOFT · MUESTRA DE PRUEBA",
  showBanner = true,
}: {
  size?: "small" | "normal" | "large";
  text?: string;
  showBanner?: boolean;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Top watermark badge */}
      <div className="flex justify-end">
        <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white font-mono text-[9px] sm:text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1.5 opacity-90">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          MUESTRA DE PRUEBA
        </span>
      </div>

      {/* Diagonal central repeating watermark */}
      <div className="absolute inset-0 flex items-center justify-center -rotate-[24deg] opacity-30">
        <div className="text-center space-y-3">
          <p
            className={`font-black uppercase tracking-[0.22em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${
              size === "small"
                ? "text-[11px] tracking-wider"
                : size === "large"
                ? "text-2xl sm:text-4xl"
                : "text-base sm:text-2xl"
            }`}
          >
            {text}
          </p>
          <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-amber-300 drop-shadow">
            PROPIEDAD DE SANTISOFT · DEMO EXCLUSIVA
          </p>
        </div>
      </div>

      {/* Bottom watermark notice */}
      {showBanner && (
        <div className="flex justify-between items-end">
          <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-slate-200 text-[9px] sm:text-[10px] font-semibold shadow-md">
            🔒 Activa tu plan para obtener versión HD sin marca de agua
          </span>
        </div>
      )}
    </div>
  );
}

export default function PublicProspectDemoPage({ params }: { params?: { id?: string } }) {
  const routeParams = useParams();
  const demoId = (typeof routeParams?.id === "string" ? routeParams.id : null) || params?.id || "";

  const [demo, setDemo] = useState<DemoData | null>(null);
  const [plans, setPlans] = useState<Record<string, PlanConfig>>(DEFAULT_PLANS);
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState<"imagen" | "video">("imagen");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [selectedPubIndex, setSelectedPubIndex] = useState(0);
  const [activeCarouselSlide, setActiveCarouselSlide] = useState(0);
  const [lightboxData, setLightboxData] = useState<{
    isOpen: boolean;
    url: string;
    title?: string;
    subtitle?: string;
    price?: string;
    badge?: string;
    isPoster?: boolean;
  } | null>(null);
  const [imageFitMode, setImageFitMode] = useState<"contain" | "cover">("contain");

  const openLightbox = (imgUrl: string, pub?: any) => {
    setLightboxData({
      isOpen: true,
      url: imgUrl,
      title: pub?.dishOrProductName || pub?.title || demo?.dishOrProductName || demo?.prospectBusiness,
      subtitle: pub?.hook || demo?.offerText,
      price: pub?.productPrice,
      badge: (pub?.isCommercialPoster || pub?.visualStyleTitle?.toLowerCase().includes("poster") || pub?.visualStyleTitle?.toLowerCase().includes("combo") || pub?.visualStyleTitle?.toLowerCase().includes("lanzamiento")) ? "Cartel con Texto" : undefined,
      isPoster: Boolean(pub?.isCommercialPoster || pub?.visualStyleTitle?.toLowerCase().includes("poster")),
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxData(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!demoId) {
      setLoading(false);
      return;
    }
    async function fetchDemo() {
      // 1. Intento primario: API pública de servidor con Admin SDK (garantiza permisos sin importar auth)
      try {
        const apiRes = await fetch(`/api/public/muestras/${encodeURIComponent(demoId)}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" }
        });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.success && apiData.demo) {
            setDemo(apiData.demo);
            if (apiData.plans) {
              setPlans(prev => ({ ...prev, ...apiData.plans }));
            }
            // Si la muestra tiene video (generado o Remotion), darle protagonismo por defecto
            if (apiData.demo.remotionComposition || apiData.demo.generatedVideoUrl) {
              setActiveMediaTab("video");
            }
            setLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.warn("Fallo lectura vía API pública, intentando Firestore cliente:", apiErr);
      }

      // 2. Intento secundario: Fallback cliente directo
      try {
        const ref = doc(db, "admin_prospect_demos", demoId);
        const [snap, plansSnap] = await Promise.all([
          getDoc(ref),
          getDoc(doc(db, "system_config", "plans")).catch(() => null)
        ]);

        if (plansSnap && plansSnap.exists()) {
          setPlans(prev => ({ ...prev, ...(plansSnap.data() as Record<string, PlanConfig>) }));
        }

        if (snap.exists()) {
          const data = snap.data();
          const d: DemoData = {
            id: snap.id,
            prospectName: data.prospectName || "",
            prospectBusiness: data.prospectBusiness || "Tu Negocio",
            prospectPhone: data.prospectPhone || "",
            rubro: data.rubro || "Comercial",
            offerText: data.offerText || "",
            dishOrProductName: data.dishOrProductName || "",
            badgeCustomText: data.badgeCustomText || "",
            generatedPostCaption: data.generatedPostCaption || data.postCaption || "",
            generatedImageUrl: data.generatedImageUrl || "",
            generatedVideoUrl: data.generatedVideoUrl || "",
            remotionComposition: data.remotionComposition || null,
            videoStyleTitle: data.videoStyleTitle || "",
            videoPromptEnglish: data.videoPromptEnglish || "",
            logoUrl: data.logoUrl || "",
            selectedStyleTitle: data.selectedStyleTitle || "Estándar Comercial",
            publications: Array.isArray(data.publications) ? data.publications : [],
            strategy: data.strategy || null,
          };
          setDemo(d);
          // Si tiene video, activar tab video por defecto
          if (d.remotionComposition || d.generatedVideoUrl) {
            setActiveMediaTab("video");
          }
        }
      } catch (err) {
        console.error("Error cargando demo pública:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDemo();
  }, [demoId]);

  // Registro de vista del prospecto (tracking analítico)
  useEffect(() => {
    if (!demoId) return;
    try {
      const sessionKey = `viewed_demo_${demoId}`;
      if (typeof window !== "undefined" && !sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "1");
        fetch(`/api/public/muestras/${encodeURIComponent(demoId)}/view`, {
          method: "POST",
        }).catch(() => {});
      }
    } catch (e) {
      // Ignorar errores de sessionStorage/cookies
    }
  }, [demoId]);

  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      const basePublicUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";
      const shareUrl = `${basePublicUrl}/m/${demoId}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyCaption = () => {
    if (demo?.generatedPostCaption && typeof window !== "undefined") {
      navigator.clipboard.writeText(demo.generatedPostCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    }
  };

  const businessName = demo?.prospectBusiness || "tu negocio";
  const santisoftWhatsAppNumber = "56965909543";
  const contactMsg = encodeURIComponent(
    `¡Hola Santisoft! Vi la propuesta que prepararon sus agentes para ${businessName} (Demo #${demoId.substring(0, 6)}) y me gustaría conversar sobre cómo activarlo para mi marca.`
  );
  const whatsappCtaUrl = `https://wa.me/${santisoftWhatsAppNumber}?text=${contactMsg}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-900">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-slate-800">Cargando propuesta personalizada...</p>
        <p className="text-xs text-slate-500 mt-1">Nuestros agentes prepararon algo especial para tu marca</p>
      </div>
    );
  }

  if (!demo) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans text-slate-900">
        <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-3xl mb-4">
          🔍
        </div>
        <h1 className="text-xl font-black text-slate-900">Propuesta no disponible</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-sm">
          El enlace de esta muestra no existe o ha sido archivado. Contáctanos para solicitar una nueva demostración para tu negocio.
        </p>
        <a
          href={`https://wa.me/${santisoftWhatsAppNumber}?text=${encodeURIComponent("Hola Santisoft! Me gustaría solicitar una propuesta para mi negocio.")}`}
          target="_blank"
          rel="noreferrer"
          className="mt-6 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
        >
          <FaWhatsapp className="text-lg" />
          <span>Solicitar Muestra por WhatsApp</span>
        </a>
      </div>
    );
  }

  const hasVideo = Boolean(demo.remotionComposition || demo.generatedVideoUrl);
  const hasImage = Boolean(demo.generatedImageUrl);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-32 selection:bg-indigo-600 selection:text-white">
      
      {/* Barra Superior de Marca */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/25">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-slate-900">Santisoft</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Agentes de Redes
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleShareLink}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedLink ? <FaCheck className="text-emerald-600" /> : <FaShareAlt />}
            <span>{copiedLink ? "¡Enlace Copiado!" : "Compartir"}</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        
        {/* Banner de Bienvenida Personalizado */}
        <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-4 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-100/60 via-purple-50/40 to-transparent rounded-full blur-2xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Propuesta Exclusiva
            </span>
            <span className="text-xs text-slate-500 font-medium">· {demo.rubro}</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Así lucirán las redes sociales de{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {demo.prospectBusiness}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
              {demo.prospectName ? `Hola ${demo.prospectName}, preparamos` : "Preparamos"} esta muestra con nuestro equipo de agentes especializados para que visualices la calidad, estilo y profesionalismo que publicaremos semana a semana en tus cuentas.
            </p>
          </div>

          {demo.offerText && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-900">
              <span>🎯</span>
              <span className="font-semibold">Oferta / Foco destacado:</span>
              <span className="text-amber-950 font-bold italic">&quot;{demo.offerText}&quot;</span>
            </div>
          )}
        </section>

        {/* SI LA MUESTRA TIENE MÚLTIPLES PUBLICACIONES (POST, CARRUSEL, REEL) */}
        {demo.publications && demo.publications.length > 0 ? (
          (() => {
            const currentPub = demo.publications[selectedPubIndex] || demo.publications[0];
            const isCarousel = currentPub.type === "carrusel";
            const isReel = currentPub.type === "reel";
            const isPost = currentPub.type === "post";
            const slides = isCarousel
              ? (currentPub.carouselImages && currentPub.carouselImages.length > 0
                  ? currentPub.carouselImages
                  : [currentPub.imageUrl || demo.generatedImageUrl].filter(Boolean))
              : [];

            return (
              <div className="space-y-6">
                {/* 1. MOSAICO / GRILLA DE TODAS LAS PUBLICACIONES GENERADAS */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                        <span>✨</span> Publicaciones Diseñadas para {demo.prospectBusiness} ({demo.publications.length})
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Propuestas listas para tus redes. Haz clic en cualquiera para abrir su visualización y copy completo.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      {demo.publications.length} de {demo.publications.length} Disponibles
                    </span>
                  </div>

                  {/* Tarjetas resumen de cada publicación */}
                  <div className={`grid gap-4 ${
                    demo.publications.length === 1
                      ? "grid-cols-1 max-w-md mx-auto"
                      : demo.publications.length === 2
                      ? "grid-cols-1 md:grid-cols-2"
                      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  }`}>
                    {demo.publications.map((pub, idx) => {
                      const isSelected = selectedPubIndex === idx;
                      const pubThumb = pub.type === "carrusel" && pub.carouselImages?.length
                        ? pub.carouselImages[0]
                        : pub.imageUrl || demo.generatedImageUrl;

                      return (
                        <div
                          key={pub.id || idx}
                          onClick={() => {
                            setSelectedPubIndex(idx);
                            setActiveCarouselSlide(0);
                            const el = document.getElementById("visor-detalle");
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className={`group rounded-2xl border-2 p-3.5 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/40 shadow-lg ring-2 ring-indigo-500/20"
                              : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-white shadow-xs"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                                isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                              }`}>
                                <span>{pub.type === "carrusel" ? "🎠" : pub.type === "reel" ? "🎬" : "📸"}</span>
                                <span>{pub.type === "carrusel" ? "Carrusel (3 Slides)" : pub.type === "reel" ? "Reel (9:16)" : "Post Feed (1:1)"}</span>
                              </span>
                              <span className="text-xs font-black text-slate-400">
                                #{idx + 1}
                              </span>
                            </div>

                            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner flex items-center justify-center">
                              <img
                                src={pubThumb}
                                alt={pub.title || "Post"}
                                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                              />
                              <WatermarkOverlay size="small" showBanner={false} />
                              {pub.productPrice && (
                                <div className="absolute top-2 left-2 z-30 bg-black/80 backdrop-blur-md text-emerald-400 font-black text-xs px-2.5 py-0.5 rounded-lg border border-white/20 shadow-md">
                                  {pub.productPrice}
                                </div>
                              )}
                              {pub.type === "carrusel" && (
                                <div className="absolute top-2 right-2 z-30 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20 shadow-md">
                                  3 Slides
                                </div>
                              )}
                              {(pub.isCommercialPoster || pub.visualStyleTitle?.toLowerCase().includes("poster") || pub.visualStyleTitle?.toLowerCase().includes("combo") || pub.visualStyleTitle?.toLowerCase().includes("lanzamiento")) ? (
                                <div className="absolute bottom-2 inset-x-2 z-30 bg-slate-950/85 backdrop-blur-md text-amber-300 text-[10px] font-black py-0.5 px-2 rounded-lg text-center truncate border border-amber-500/30 shadow-md">
                                  🏷️ Cartel con Texto &amp; Precio
                                </div>
                              ) : (
                                <div className="absolute bottom-2 inset-x-2 z-30 bg-slate-950/85 backdrop-blur-md text-emerald-300 text-[10px] font-black py-0.5 px-2 rounded-lg text-center truncate border border-emerald-500/30 shadow-md">
                                  🖼️ Foto Limpia de Producto
                                </div>
                              )}
                            </div>

                            <div>
                              <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {pub.dishOrProductName || pub.title || `Publicación #${idx + 1}`}
                              </h3>
                              {pub.hook && (
                                <p className="text-xs text-slate-600 italic line-clamp-2 mt-1 leading-snug">
                                  &quot;{pub.hook}&quot;
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-200/70 mt-3 flex items-center justify-between text-xs">
                            <span className={`font-bold flex items-center gap-1 ${
                              isSelected ? "text-indigo-600" : "text-slate-500 group-hover:text-indigo-600"
                            }`}>
                              {isSelected ? "✓ Seleccionado abajo" : "Ver detalle y copy →"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {pub.type}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. VISOR INTERACTIVO EN DETALLE */}
                <div id="visor-detalle" className="scroll-mt-24 space-y-3">
                  <div className="flex items-center justify-between gap-2 bg-white border border-slate-200/90 rounded-2xl p-3 px-4 shadow-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPubIndex((prev) => (prev > 0 ? prev - 1 : demo.publications!.length - 1));
                        setActiveCarouselSlide(0);
                      }}
                      disabled={demo.publications.length <= 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      ← Anterior
                    </button>
                    <div className="text-center">
                      <span className="text-xs font-black text-slate-900 block">
                        Inspeccionando Publicación {selectedPubIndex + 1} de {demo.publications.length}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-bold truncate max-w-[200px] sm:max-w-md inline-block">
                        {currentPub.dishOrProductName || currentPub.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPubIndex((prev) => (prev < demo.publications!.length - 1 ? prev + 1 : 0));
                        setActiveCarouselSlide(0);
                      }}
                      disabled={demo.publications.length <= 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>

                {/* ZONA DE VISUALIZACIÓN MULTIMEDIA SEGÚN EL TIPO */}
                <section className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-8 shadow-xs space-y-6">
                  {/* CABECERA DEL FORMATO ACTIVO */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {isCarousel ? "🎠" : isReel ? "🎬" : "📸"}
                      </span>
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {isCarousel
                            ? "Carrusel Multidiapositiva (3 Slides)"
                            : isReel
                            ? "Video Reel Vertical (Formato 9:16)"
                            : "Post Fijo Cuadrado (Feed 1:1)"}
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          {currentPub.title || currentPub.dishOrProductName || `Publicación #${selectedPubIndex + 1}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentPub.productPrice && (
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs">
                          {currentPub.productPrice}
                        </span>
                      )}
                      {currentPub.visualStyleTitle && (
                        <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-xl font-semibold">
                          Estilo: {currentPub.visualStyleTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1. VISTA DE POST ESTÁNDAR 1:1 */}
                  {isPost && (
                    <div className="space-y-4">
                      {/* Control superior de encuadre y zoom */}
                      <div className="flex items-center justify-between text-xs px-1">
                        <div className="flex items-center gap-2">
                          {(currentPub.isCommercialPoster || currentPub.visualStyleTitle?.toLowerCase().includes("poster") || currentPub.visualStyleTitle?.toLowerCase().includes("combo") || currentPub.visualStyleTitle?.toLowerCase().includes("lanzamiento")) ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/30 flex items-center gap-1">
                              <span>🏷️</span> Cartel con Tipografía &amp; Precio
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 flex items-center gap-1">
                              <span>🖼️</span> Fotografía Limpia de Producto
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setImageFitMode(prev => prev === "contain" ? "cover" : "contain")}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Alternar entre ver la imagen completa o recortada al marco"
                          >
                            <span>{imageFitMode === "contain" ? "🔲 Llenar marco" : "👁️ Ver completo"}</span>
                          </button>
                        </div>
                      </div>

                      <div
                        onClick={() => openLightbox(currentPub.imageUrl || demo.generatedImageUrl, currentPub)}
                        className="relative max-w-lg mx-auto aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-xl group cursor-pointer flex items-center justify-center select-none"
                      >
                        <img
                          src={currentPub.imageUrl || demo.generatedImageUrl}
                          alt={currentPub.title || "Post"}
                          className={`w-full h-full transition-transform duration-300 ${
                            imageFitMode === "contain" ? "object-contain" : "object-cover"
                          }`}
                        />

                        {/* Marca de agua de protección comercial */}
                        <WatermarkOverlay size="normal" />

                        {/* Badge sutil flotante en la esquina superior para ampliar */}
                        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          <span className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-md flex items-center gap-1.5">
                            <span>🔍</span> Toca para Ampliar
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => openLightbox(currentPub.imageUrl || demo.generatedImageUrl, currentPub)}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <span>🔍</span> Inspeccionar a Pantalla Completa
                        </button>
                        <a
                          href={`https://wa.me/${santisoftWhatsAppNumber}?text=${encodeURIComponent(
                            `¡Hola Santisoft! Me gustó la propuesta de "${currentPub.dishOrProductName || currentPub.title || demo.prospectBusiness}" que prepararon sus agentes. Quiero activar mi plan para descargar los diseños en alta resolución sin marca de agua.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                          <span>🔒</span> Activar Plan para Descargar sin Marca de Agua
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 2. VISTA DE CARRUSEL MULTIDIAPOSITIVA */}
                  {isCarousel && slides.length > 0 && (
                    <div className="space-y-4">
                      {/* Control superior */}
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-[11px] font-bold text-slate-500">
                          Desliza o usa las miniaturas para ver las {slides.length} diapositivas
                        </span>
                        <button
                          type="button"
                          onClick={() => setImageFitMode(prev => prev === "contain" ? "cover" : "contain")}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>{imageFitMode === "contain" ? "🔲 Llenar marco" : "👁️ Ver completo"}</span>
                        </button>
                      </div>

                      <div
                        onClick={() => openLightbox(slides[activeCarouselSlide], { ...currentPub, title: `${currentPub.dishOrProductName || currentPub.title || "Carrusel"} · Slide ${activeCarouselSlide + 1}` })}
                        className="relative max-w-lg mx-auto aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-xl group cursor-pointer flex items-center justify-center select-none"
                      >
                        <img
                          src={slides[activeCarouselSlide]}
                          alt={`Slide ${activeCarouselSlide + 1}`}
                          className={`w-full h-full transition-transform duration-300 ${
                            imageFitMode === "contain" ? "object-contain" : "object-cover"
                          }`}
                        />

                        {/* Marca de agua de protección comercial */}
                        <WatermarkOverlay size="normal" />

                        {/* Botón Slide Anterior */}
                        {slides.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCarouselSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center font-bold text-sm backdrop-blur-xs transition-all shadow-md cursor-pointer z-30"
                          >
                            ‹
                          </button>
                        )}

                        {/* Botón Slide Siguiente */}
                        {slides.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCarouselSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center font-bold text-sm backdrop-blur-xs transition-all shadow-md cursor-pointer z-30"
                          >
                            ›
                          </button>
                        )}

                        {/* Badge indicador de Slide actual */}
                        <div className="absolute top-3 left-3 z-30 bg-black/75 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/20">
                          Slide {activeCarouselSlide + 1} de {slides.length}
                        </div>

                        {/* Botón Ampliar */}
                        <div className="absolute top-3 right-3 z-30">
                          <span className="px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 shadow-md flex items-center gap-1">
                            🔍 Toca para Ampliar
                          </span>
                        </div>
                      </div>

                      {/* Miniaturas de las diapositivas y puntos abajo (fuera de la foto para no tapar los textos) */}
                      <div className="flex flex-col items-center gap-2 pt-1">
                        {slides.length > 1 && (
                          <div className="flex items-center gap-2">
                            {slides.map((sUrl, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => setActiveCarouselSlide(sIdx)}
                                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-900 ${
                                  activeCarouselSlide === sIdx
                                    ? "border-indigo-600 ring-2 ring-indigo-500/30 scale-105"
                                    : "border-slate-200 opacity-60 hover:opacity-100"
                                }`}
                              >
                                <img src={sUrl} alt={`Thumb ${sIdx + 1}`} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-1">
                          {slides.map((_, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => setActiveCarouselSlide(sIdx)}
                              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                                activeCarouselSlide === sIdx ? "bg-indigo-600 scale-125" : "bg-slate-300 hover:bg-slate-400"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => openLightbox(slides[activeCarouselSlide], { ...currentPub, title: `${currentPub.dishOrProductName || currentPub.title || "Carrusel"} · Slide ${activeCarouselSlide + 1}` })}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <span>🔍</span> Inspeccionar Slide Completo
                        </button>
                        <a
                          href={`https://wa.me/${santisoftWhatsAppNumber}?text=${encodeURIComponent(
                            `¡Hola Santisoft! Quiero activar mi plan para descargar el carrusel completo en alta resolución sin marca de agua para ${demo.prospectBusiness}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                          <span>🔒</span> Activar Plan para Descargar sin Marca de Agua
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 3. VISTA DE REEL VERTICAL 9:16 */}
                  {isReel && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        {/* Video o Frame 9:16 */}
                        <div
                          onClick={() => {
                            if (!currentPub.videoUrl) {
                              openLightbox(currentPub.imageUrl || demo.generatedImageUrl, currentPub);
                            }
                          }}
                          className={`w-full max-w-[280px] aspect-[9/16] rounded-3xl overflow-hidden bg-black border-2 border-slate-200 shadow-2xl relative group shrink-0 ${
                            !currentPub.videoUrl ? "cursor-pointer select-none" : ""
                          }`}
                        >
                          {currentPub.videoUrl ? (
                            <video
                              src={currentPub.videoUrl}
                              controls
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <img
                                src={currentPub.imageUrl || demo.generatedImageUrl}
                                alt="Reel Preview"
                                className="w-full h-full object-cover"
                              />
                              {/* Header sutil sin oscurecer los textos publicitarios de la foto */}
                              <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-black/75 text-white backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                                  🎬 Reel 9:16
                                </span>
                                <span className="text-[10px] font-bold bg-black/75 text-white backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                                  🔍 Toca para Ampliar
                                </span>
                              </div>
                              <div className="absolute bottom-3 left-3 pointer-events-none">
                                <span className="text-[10px] font-bold text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                                  {demo.prospectBusiness}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Desglose de Guión Técnico de Grabación */}
                        <div className="w-full max-w-md bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-left">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                            <span>🎬</span> Guión Técnico del Reel
                          </span>

                          <div className="space-y-2 text-xs">
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                              <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">
                                ⏱️ 0-3 Segundos · Gancho de Retención:
                              </span>
                              <p className="text-slate-800 font-bold italic">
                                &quot;{currentPub.reelScript?.hook3s || currentPub.hook || "Mira esto antes de pedir..."}&quot;
                              </p>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">
                                ⏱️ 3-15 Segundos · Desarrollo & Demostración:
                              </span>
                              <p className="text-slate-700 font-medium leading-relaxed">
                                {currentPub.reelScript?.body || "Tomas en movimiento mostrando la preparación fresca y los ingredientes de primera calidad."}
                              </p>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">
                                ⏱️ 15-25 Segundos · Llamado a la Acción (CTA):
                              </span>
                              <p className="text-slate-700 font-bold">
                                {currentPub.reelScript?.cta || currentPub.cta || "Comenta o contáctanos por WhatsApp para pedir el tuyo hoy."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* PROPUESTA DE COPY ESPECÍFICO PARA ESTA PUBLICACIÓN */}
                <section className="bg-white border border-indigo-100/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-lg">
                        <FaPenNib />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-slate-900">
                            Copy Sugerido para {isCarousel ? "Carrusel" : isReel ? "Reel" : "Post"} #{selectedPubIndex + 1}
                          </h3>
                          {currentPub.dishOrProductName && (
                            <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {currentPub.dishOrProductName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Redactado por nuestros agentes para conectar con tu audiencia y generar ventas directas
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCaption(currentPub.copy)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/20 active:scale-95 cursor-pointer"
                    >
                      {copiedCaption ? <FaCheck className="text-white" /> : <FaCopy />}
                      <span>{copiedCaption ? "¡Copy Copiado!" : "Copiar Texto"}</span>
                    </button>
                  </div>

                  {currentPub.hook && (
                    <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-xs">
                      <span className="text-[10px] font-black uppercase text-purple-700 block mb-0.5">
                        🎣 Gancho de Entrada:
                      </span>
                      <p className="font-bold text-purple-950">&quot;{currentPub.hook}&quot;</p>
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed select-all font-sans font-medium">
                    {currentPub.copy || demo.generatedPostCaption}
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 gap-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Listo para copiar y publicar en tus redes oficiales
                    </span>
                    <span className="text-indigo-600 font-bold">100% Personalizado por nuestros agentes</span>
                  </div>
                </section>
              </div>
            );
          })()
        ) : (
          /* MODO COMPATIBILIDAD CON MUESTRAS ANTIGUAS (1 SOLA IMAGEN / VIDEO) */
          <>
            {/* Switcher de Formatos (Video Reel vs Diseño Gráfico) */}
            {hasImage && hasVideo && (
              <div className="flex justify-center">
                <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab("video")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      activeMediaTab === "video"
                        ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60 font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FaVideo className="text-sm" />
                    <span>Video Reel Animado</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold">
                      9:16
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab("imagen")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      activeMediaTab === "imagen"
                        ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60 font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FaImage className="text-sm" />
                    <span>Diseño Publicitario</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                      Feed 1:1
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ZONA DE VISUALIZACIÓN MULTIMEDIA */}
            <section className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-8 shadow-xs space-y-6">
              {/* FORMATO 1: IMAGEN DE DISEÑO */}
              {activeMediaTab === "imagen" && hasImage && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>🎨</span> Formato Cuadrado 1:1 (Feed Instagram &amp; Facebook)
                    </span>
                    <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg font-semibold">
                      Estilo: {demo.selectedStyleTitle}
                    </span>
                  </div>

                  <div
                    onClick={() => openLightbox(demo.generatedImageUrl, { id: "single", type: "post", title: demo.dishOrProductName || demo.prospectBusiness })}
                    className="relative max-w-lg mx-auto aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-xl group cursor-pointer flex items-center justify-center select-none"
                  >
                    <img
                      src={demo.generatedImageUrl}
                      alt={`Muestra para ${demo.prospectBusiness}`}
                      className="w-full h-full object-contain"
                    />

                    {/* Marca de agua de protección comercial */}
                    <WatermarkOverlay size="normal" />

                    <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <span className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-md flex items-center gap-1.5">
                        <span>🔍</span> Toca para Ampliar
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <a
                      href={`https://wa.me/${santisoftWhatsAppNumber}?text=${encodeURIComponent(
                        `¡Hola Santisoft! Vi la propuesta que prepararon para ${demo.prospectBusiness}. Quiero activar mi plan para descargar los diseños en alta resolución sin marca de agua.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>🔒</span> Activar Plan para Descargar sin Marca de Agua
                    </a>

                    {hasVideo && (
                      <button
                        type="button"
                        onClick={() => setActiveMediaTab("video")}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                      >
                        <FaVideo />
                        <span>Ver en Video Reel (9:16) →</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* FORMATO 2: VIDEO REEL */}
              {(activeMediaTab === "video" || !hasImage) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>🎬</span> Formato Vertical 9:16 (Reel, TikTok &amp; Estados de WhatsApp)
                    </span>
                    {demo.videoStyleTitle && (
                      <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg font-semibold">
                        {demo.videoStyleTitle}
                      </span>
                    )}
                  </div>

                  {demo.remotionComposition ? (
                    <div className="flex justify-center">
                      <div className="w-full max-w-[340px]">
                        <RemotionReelPlayer
                          composition={demo.remotionComposition}
                          companyName={demo.prospectBusiness}
                          companyLogoUrl={demo.logoUrl}
                        />
                      </div>
                    </div>
                  ) : demo.generatedVideoUrl ? (
                    <div className="max-w-[340px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-slate-200 shadow-xl">
                      <video
                        src={demo.generatedVideoUrl}
                        controls
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-3 bg-indigo-50/30 rounded-2xl border border-indigo-100/60 p-6">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center text-xl">
                        🎬
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Video en preparación</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Nuestros agentes están estructurando el guión y las escenas de video para este negocio.
                      </p>
                    </div>
                  )}

                  {hasImage && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveMediaTab("imagen")}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <FaImage className="text-indigo-600" />
                        <span>Ver también versión Diseño Gráfico (Feed 1:1) →</span>
                      </button>
                    </div>
                  )}

                  {demo.videoPromptEnglish && (
                    <div className="max-w-lg mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-left">
                      <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700">
                        <span>✨ Dirección Cinematográfica Planificada</span>
                        <span className="font-mono text-[10px] text-slate-500">24 FPS · 9:16</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-mono">
                        {demo.videoPromptEnglish}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
            
            {/* PROPUESTA DE COPY PARA REDES SOCIALES (REDACTADO POR NUESTROS AGENTES) */}
            {demo.generatedPostCaption && (
              <section className="bg-white border border-indigo-100/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-lg">
                      <FaPenNib />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          Copy Sugerido para tus Redes
                        </h3>
                        {demo.dishOrProductName && (
                          <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {demo.dishOrProductName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Redactado por nuestros agentes para conectar con tu audiencia y generar ventas directas
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/20 active:scale-95 cursor-pointer"
                  >
                    {copiedCaption ? <FaCheck className="text-white" /> : <FaCopy />}
                    <span>{copiedCaption ? "¡Copy Copiado!" : "Copiar Texto"}</span>
                  </button>
                </div>

                {demo.dishOrProductName && (
                  <div className="sm:hidden inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Plato / Producto: {demo.dishOrProductName}
                  </div>
                )}

                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed select-all font-sans font-medium">
                  {demo.generatedPostCaption}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 gap-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Formato listo para copiar y pegar en Instagram, Facebook o WhatsApp
                  </span>
                  <span className="text-indigo-600 font-bold">100% Personalizado por nuestros agentes</span>
                </div>
              </section>
            )}
          </>
        )}

        {/* SECCIÓN: ESTRATEGIA & PLANIFICACIÓN DE CONTENIDO PROPUESTA */}
        {demo.strategy && (
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-1.5 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/80 flex items-center gap-1.5">
                  <span>📊</span> Estrategia &amp; Planificación de Contenido
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Estructurada por nuestros agentes especializados
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Planificación Estratégica para {demo.prospectBusiness}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Nuestros agentes analizaron el rubro de {demo.rubro.toLowerCase()} para diseñar esta hoja de ruta de contenidos orientada a captar clientes, transmitir autoridad y activar pedidos recurrentes.
              </p>
            </div>

            {/* Diagnóstico & Enfoque de Marca */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                  <span>🎯</span> Objetivo Comercial
                </span>
                <p className="text-xs text-slate-800 font-bold leading-relaxed">
                  {demo.strategy.objective || `Maximizar visibilidad local y activar ventas en ${demo.rubro}.`}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 flex items-center gap-1">
                  <span>👥</span> Audiencia Ideal
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {demo.strategy.targetAudience || `Público local interesado en ${demo.rubro.toLowerCase()} que busca calidad y excelente experiencia.`}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <span>🗣️</span> Tono &amp; Voz
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {demo.strategy.toneAndVoice || "Cercano, conversacional ('tú a tú'), directo, persuasivo y antojable."}
                </p>
              </div>
            </div>

            {/* Pilares de Contenido */}
            {demo.strategy.pillars && demo.strategy.pillars.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span>🧱</span> Pilares de Contenido Estratégico
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {demo.strategy.pillars.map((pillar, pIdx) => (
                    <div key={pIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-base">{pillar.icon || "📌"}</span>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                          {pillar.percentage}%
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900">{pillar.name}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                        {pillar.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parrilla / Calendario Semanal Propuesto */}
            {demo.strategy.schedulePlan && demo.strategy.schedulePlan.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span>🗓️</span> Calendario &amp; Distribución de las Publicaciones
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Día y Horario</th>
                        <th className="p-3">Formato</th>
                        <th className="p-3">Objetivo Comercial</th>
                        <th className="p-3">Gancho Utilizado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      {demo.strategy.schedulePlan.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                            <span className="block">{item.day}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{item.time}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                              {item.format === "carrusel" ? "🎠 Carrusel" : item.format === "reel" ? "🎬 Reel" : "📸 Post Feed"}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-800">
                            {item.objective}
                          </td>
                          <td className="p-3 text-slate-600 italic">
                            &quot;{item.hook}&quot;
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Oportunidades de Nicho Detectadas */}
            {demo.strategy.nicheOpportunities && demo.strategy.nicheOpportunities.length > 0 && (
              <div className="pt-2">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <span>💡</span> Oportunidades Detectadas por Nuestros Agentes en tu Rubro
                  </h4>
                  <ul className="text-xs text-amber-950 space-y-1.5 pl-1">
                    {demo.strategy.nicheOpportunities.map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        )}

        {/* SECCIÓN DE PLANES Y TARIFAS DISPONIBLES (100% DINÁMICO DESDE BD) */}
        <section id="planes" className="space-y-6 pt-2 scroll-mt-20">
          <div className="text-center space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Planes Flexibles
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Elige el plan ideal para {demo.prospectBusiness}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Planes transparentes en pesos chilenos actualizados desde nuestra plataforma, sin contratos forzosos. Cancela o cambia de plan cuando quieras.
            </p>

            {/* Switcher de Facturación Mensual vs Anual */}
            <div className="flex items-center justify-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto mt-4">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  !isAnnual ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Pago Mensual
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  isAnnual ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Pago Anual
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isAnnual ? "bg-indigo-500 text-white font-extrabold" : "bg-emerald-100 text-emerald-700 font-bold"
                }`}>
                  -16% Ahorro
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLAN_DISPLAY_KEYS.map((key) => {
              const plan = plans[key] || DEFAULT_PLANS[key];
              if (!plan) return null;

              const isFree = plan.price === 0 || key === "free";
              const isPopular = Boolean(plan.isPopular);

              // Cálculo dinámico de precio según Facturación Mensual vs Anual
              const fullAnnualPrice = plan.annualPrice || Math.round((plan.price * 12) * 0.84);
              const monthlyEquivalentPrice = isFree ? 0 : (isAnnual ? Math.round(fullAnnualPrice / 12) : plan.price);
              const priceFormatted = formatPrice(monthlyEquivalentPrice);
              const fullAnnualFormatted = formatPrice(fullAnnualPrice);

              const meta = PLAN_META[key] || { defaultBadge: "Plan", emoji: "✨", subtitle: "" };
              const badgeText = plan.tagline || meta.defaultBadge;

              const featuresToDisplay: string[] =
                plan.features && plan.features.length > 0
                  ? plan.features.map((f) => sanitizeFeature(f))
                  : [
                      `${plan.postsLimit || 0} publicaciones al mes`,
                      plan.videosLimit ? `${plan.videosLimit} videos Reels / TikTok` : "Sin videos",
                      `${plan.aiImagesLimit || plan.postsLimit || 0} imágenes con tus agentes`,
                      plan.seoBlogsLimit ? `${plan.seoBlogsLimit} artículos Blog SEO al mes` : "Publicación automática",
                    ];

              const billingCycleText = isFree ? "Prueba Gratuita" : (isAnnual ? "Plan Anual con descuento" : "Plan Mensual");
              const waPriceText = isFree ? "Gratis por 10 días" : (isAnnual ? `${priceFormatted}/mes (Facturación Anual ${fullAnnualFormatted})` : `${priceFormatted}/mes`);

              const waText = isFree
                ? `¡Hola Santisoft! Vi la propuesta para ${businessName} (Demo #${demoId.substring(0, 6)}) y me gustaría comenzar con la Prueba Gratuita de ${plan.postsLimit || 5} publicaciones.`
                : `¡Hola Santisoft! Vi la propuesta para ${businessName} y me interesa activar el Plan ${plan.name} en ${billingCycleText} (${waPriceText}). ¿Cuáles son los siguientes pasos?`;

              const waUrl = `https://wa.me/${santisoftWhatsAppNumber}?text=${encodeURIComponent(waText)}`;

              return (
                <div
                  key={key}
                  className={`bg-white rounded-3xl p-5 flex flex-col justify-between transition-all ${
                    isPopular
                      ? "border-2 border-indigo-600 shadow-xl relative ring-4 ring-indigo-500/10"
                      : "border border-slate-200 shadow-xs hover:shadow-md"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      ⭐ Más Recomendado
                    </span>
                  )}

                  <div className={`space-y-3 ${isPopular ? "pt-1" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isPopular
                            ? "bg-indigo-50 text-indigo-700 font-black"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {badgeText}
                      </span>
                      <span className="text-xs">{meta.emoji}</span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-900">
                        {key === "free" ? plan.name : `Plan ${plan.name}`}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{meta.subtitle}</p>
                    </div>

                    <div className="pt-1">
                      <span
                        className={`text-2xl font-black ${
                          isPopular ? "text-indigo-600" : "text-slate-900"
                        }`}
                      >
                        {priceFormatted}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">
                        {isFree ? "/ 10 días" : "/ mes"}
                      </span>
                      {isAnnual && !isFree && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">
                          Facturado anualmente: {fullAnnualFormatted}/año
                        </p>
                      )}
                    </div>

                    <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                      {featuresToDisplay.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <FaCheck className="text-emerald-500 text-xs shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isPopular
                          ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/25"
                          : isFree
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                          : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                      }`}
                    >
                      <FaWhatsapp
                        className={`text-sm ${
                          isPopular
                            ? "text-emerald-300"
                            : isFree
                            ? "text-emerald-600"
                            : "text-emerald-400"
                        }`}
                      />
                      <span>
                        {isFree
                          ? plan.ctaText || `Probar ${plan.postsLimit || 5} Posts Gratis`
                          : `Elegir ${plan.name} (${priceFormatted})`}
                      </span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PLAN BUSINESS Y PLAN AGENCY (MULTIMARCA Y ESCALA) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {plans["business"] && (
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-indigo-900/50 shadow-xl flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30">
                    <span>🏢</span>
                    <span>{plans["business"].tagline || "HASTA 3 CUENTAS"}</span>
                  </div>
                  <h4 className="text-lg font-black text-white">
                    {plans["business"].name || "Plan Business"}: Hasta {plans["business"].maxAccounts || 3} marcas
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {plans["business"].postsLimit} publicaciones, {plans["business"].videosLimit} videos y WhatsApp Bot multimarca.
                  </p>
                  <div className="pt-1">
                    <span className="text-2xl font-black text-white">
                      {formatPrice(isAnnual ? Math.round((plans["business"].annualPrice || plans["business"].price * 10) / 12) : plans["business"].price)}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">/ mes</span>
                    {isAnnual && plans["business"].annualPrice && (
                      <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                        {formatPrice(plans["business"].annualPrice)} / año (Ahorro anual)
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <a
                    href={`https://wa.me/${santisoftWhatsAppNumber}?text=${encodeURIComponent(
                      `¡Hola Santisoft! Vi la propuesta para ${businessName} y me interesa consultar por el Plan Business multi-marca (${formatPrice(plans["business"].price)}/mes).`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    <FaWhatsapp className="text-emerald-400 text-sm" />
                    <span>Consultar Plan Business</span>
                  </a>
                </div>
              </div>
            )}

            {plans["agency"] && (
              <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-purple-900/50 shadow-xl flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold border border-purple-500/30">
                    <span>👑</span>
                    <span>{plans["agency"].tagline || "HASTA 15 CUENTAS"}</span>
                  </div>
                  <h4 className="text-lg font-black text-white">
                    {plans["agency"].name || "Plan Agency"}: Hasta {plans["agency"].maxAccounts || 15} marcas o clientes
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Publicaciones ilimitadas, {plans["agency"].videosLimit} videos y soporte de ejecutivos dedicados para agencias.
                  </p>
                  <div className="pt-1">
                    <span className="text-2xl font-black text-white">
                      {formatPrice(isAnnual ? Math.round((plans["agency"].annualPrice || plans["agency"].price * 10) / 12) : plans["agency"].price)}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">/ mes</span>
                    {isAnnual && plans["agency"].annualPrice && (
                      <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                        {formatPrice(plans["agency"].annualPrice)} / año (Ahorro anual)
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <a
                    href={`https://wa.me/${santisoftWhatsAppNumber}?text=${encodeURIComponent(
                      `¡Hola Santisoft! Vi la propuesta para ${businessName} y me interesa consultar por el Plan Agency (${formatPrice(plans["agency"].price)}/mes).`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                  >
                    <FaWhatsapp className="text-emerald-400 text-sm" />
                    <span>Consultar Plan Agency</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* BENEFICIOS: CÓMO TRABAJAN NUESTROS AGENTES */}
        <section className="space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-black text-slate-900">
              ¿Por qué implementar esto en {demo.prospectBusiness}?
            </h3>
            <p className="text-xs text-slate-500">
              Automatización 360° diseñada para dueños de negocios que no tienen tiempo que perder.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
                <FaClock />
              </div>
              <h4 className="text-sm font-bold text-slate-900">0 Horas de tu Tiempo</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nuestros agentes analizan tu rubro, redactan los copys persuasivos, componen las piezas y las publican automáticamente.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                <FaRocket />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Presencia 100% Constante</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tus redes nunca se quedarán inactivas. Publicaciones, Historias y Reels programados en los mejores horarios de tu audiencia.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                <FaStar />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Sin Costos de Agencia</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Planes transparentes en pesos chilenos desde {formatPrice(plans["starter"]?.price || 24990)}/mes. Sin contratos de permanencia ni cobros sorpresa.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* BARRA FLOTANTE DE ACCIÓN POR WHATSAPP (Mobile First CTA) */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 p-3 sm:p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-900">¿Listo para activar las redes de {demo.prospectBusiness}?</p>
            <p className="text-[11px] text-slate-500">Elige tu plan arriba o consúltanos directamente por WhatsApp.</p>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <a
              href="#planes"
              className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition-colors text-center cursor-pointer border border-slate-200/80 shrink-0"
            >
              Ver Planes
            </a>

            <a
              href={`https://wa.me/${santisoftWhatsAppNumber}?text=${encodeURIComponent(
                `¡Hola Santisoft! Vi la propuesta que prepararon sus agentes para ${businessName} (Demo #${demoId.substring(0, 6)}) y me gustaría recibir información sobre los planes disponibles para comenzar.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <FaWhatsapp className="text-lg" />
              <span>Consultar Planes por WhatsApp</span>
              <FaArrowRight className="text-xs" />
            </a>
          </div>
        </div>
      </footer>

      {/* MODAL LIGHTBOX: INSPECCIÓN DE ALTA RESOLUCIÓN Y DETALLES */}
      {lightboxData && lightboxData.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-6 animate-fadeIn"
          onClick={() => setLightboxData(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[96vh] flex flex-col items-center justify-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra superior de controles */}
            <div className="w-full flex items-center justify-between py-1.5 px-3 text-white bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 truncate pr-2">
                {lightboxData.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                    {lightboxData.badge}
                  </span>
                )}
                <span className="font-extrabold text-xs sm:text-sm truncate">
                  {lightboxData.title}
                </span>
                {lightboxData.price && (
                  <span className="text-xs font-black text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg">
                    {lightboxData.price}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${santisoftWhatsAppNumber}?text=${encodeURIComponent(
                    `¡Hola Santisoft! Estoy revisando la propuesta de "${lightboxData.title || demo.prospectBusiness}". Quiero activar mi plan para descargar los diseños en alta resolución sin marca de agua.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>🔒</span> <span className="hidden sm:inline">Descargar sin Marca de Agua</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxData(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-base transition-all cursor-pointer"
                  title="Cerrar (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenedor de la Imagen: Ajuste perfecto al 100% sin recortes */}
            <div className="relative w-full flex items-center justify-center max-h-[78vh] overflow-hidden rounded-2xl bg-slate-950 border border-white/10 p-2 shadow-2xl">
              <img
                src={lightboxData.url}
                alt={lightboxData.title || "Diseño en Alta Resolución"}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl select-none"
              />
              {/* Marca de agua de protección comercial en Lightbox */}
              <WatermarkOverlay size="large" />
            </div>

            {/* Barra inferior de información y CTA */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 px-2 text-xs text-slate-300">
              <span className="text-[11px] text-slate-400 text-center sm:text-left">
                ✨ Diseño de alta resolución con tipografía publicitaria nítida y composición para captar clientes.
              </span>
              <a
                href={`https://wa.me/${santisoftWhatsAppNumber}?text=${encodeURIComponent(
                  `¡Hola Santisoft! Me gustó la publicación de "${lightboxData.title || demo.prospectBusiness}" (${lightboxData.price || ""}) que prepararon sus agentes para ${demo.prospectBusiness}. ¿Podemos coordinar para publicarla en mis redes?`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-2 shadow-lg transition-all active:scale-95 text-xs cursor-pointer"
              >
                <FaWhatsapp className="text-sm" />
                <span>Pedir esta Publicación por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
