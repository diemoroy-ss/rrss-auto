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

export default function PublicProspectDemoPage({ params }: { params?: { id?: string } }) {
  const routeParams = useParams();
  const demoId = (typeof routeParams?.id === "string" ? routeParams.id : null) || params?.id || "";

  const [demo, setDemo] = useState<DemoData | null>(null);
  const [plans, setPlans] = useState<Record<string, PlanConfig>>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState<"imagen" | "video">("imagen");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  useEffect(() => {
    if (!demoId) {
      setLoading(false);
      return;
    }
    async function fetchDemo() {
      // 1. Intento primario: API pública de servidor con Admin SDK (garantiza permisos sin importar auth)
      try {
        const apiRes = await fetch(`/api/public/muestras/${encodeURIComponent(demoId)}`);
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

              <div className="relative max-w-lg mx-auto aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xl group">
                <img
                  src={demo.generatedImageUrl}
                  alt={`Muestra para ${demo.prospectBusiness}`}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                  <span className="text-[11px] font-bold text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg">
                    {demo.prospectBusiness}
                  </span>
                  <a
                    href={demo.generatedImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 shadow-lg cursor-pointer"
                  >
                    Ver HD
                  </a>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={demo.generatedImageUrl}
                  download={`propuesta_${demo.prospectBusiness}.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <span>⬇️</span> Descargar Diseño en Alta Resolución
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

        {/* SECCIÓN DE PLANES Y TARIFAS DISPONIBLES */}
        <section id="planes" className="space-y-6 pt-2 scroll-mt-20">
          <div className="text-center space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Planes Flexibles
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Elige el plan ideal para {demo.prospectBusiness}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Planes transparentes en pesos chilenos, sin contratos forzosos ni comisiones ocultas. Cancela o cambia de plan cuando quieras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLAN_DISPLAY_KEYS.map((key) => {
              const plan = plans[key] || DEFAULT_PLANS[key];
              if (!plan) return null;

              const isFree = plan.price === 0 || key === "free";
              const isPopular = Boolean(plan.isPopular || key === "growth");
              const priceFormatted = formatPrice(plan.price);
              const meta = PLAN_META[key] || { defaultBadge: "Plan", emoji: "✨", subtitle: "" };
              const badgeText = plan.tagline || meta.defaultBadge;

              const featuresToDisplay: string[] =
                plan.features && plan.features.length > 0
                  ? plan.features.map(f => sanitizeFeature(f))
                  : [
                      `${plan.postsLimit || 0} publicaciones al mes`,
                      plan.videosLimit ? `${plan.videosLimit} videos Reels / TikTok` : "Sin videos",
                      `${plan.aiImagesLimit || plan.postsLimit || 0} imágenes con tus agentes`,
                      plan.seoBlogsLimit ? `${plan.seoBlogsLimit} artículos Blog SEO al mes` : "Publicación automática",
                    ];

              const waText = isFree
                ? `¡Hola Santisoft! Vi la propuesta para ${businessName} (Demo #${demoId.substring(0, 6)}) y me gustaría comenzar con la Prueba Gratuita de ${plan.postsLimit || 5} publicaciones.`
                : `¡Hola Santisoft! Vi la propuesta para ${businessName} y me interesa activar el Plan ${plan.name} (${priceFormatted}/mes). ¿Cuáles son los siguientes pasos?`;

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

          {/* PLAN BUSINESS / MULTI-MARCA SI ESTÁ DISPONIBLE */}
          {plans["business"] && (
            <div className="mt-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white border border-indigo-900/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="space-y-1.5 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30">
                  <span>🏢</span>
                  <span>¿Manejas más de una marca o sucursal?</span>
                </div>
                <h4 className="text-lg sm:text-xl font-black text-white">
                  {plans["business"].name || "Plan Business"}: Hasta {plans["business"].maxAccounts || 3} marcas independientes
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  {plans["business"].postsLimit} publicaciones, {plans["business"].videosLimit} videos y soporte multimarca por {formatPrice(plans["business"].price)}/mes.
                </p>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <a
                  href={`https://wa.me/${santisoftWhatsAppNumber}?text=${encodeURIComponent(
                    `¡Hola Santisoft! Vi la propuesta para ${businessName} y me interesa consultar por el Plan Business multi-marca (${formatPrice(plans["business"].price)}/mes).`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full md:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <FaWhatsapp className="text-emerald-400 text-base" />
                  <span>Consultar Business ({formatPrice(plans["business"].price)})</span>
                </a>
              </div>
            </div>
          )}
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

    </div>
  );
}
