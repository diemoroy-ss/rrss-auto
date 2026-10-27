"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DotCanvas from "../../components/DotCanvas";
import BrandHeader from "../../components/BrandHeader";
import BrandFooter from "../../components/BrandFooter";
import WebChatWidget from "../../components/WebChatWidget";
import PricingPlans from "../../components/PricingPlans";
import TestimonialsSection from "../../components/TestimonialsSection";
import WhatsAppBotSection from "../../components/WhatsAppBotSection";
import ContactForm from "../../components/ContactForm";

const HERO_VIDEOS = [
  { src: "/rrss1.mp4", label: "Intro · SocialPilot" },
  { src: "/rrss2.mp4", label: "Generación de Contenido" },
  { src: "/rrss3.mp4", label: "Estrategia de 14 días" },
  { src: "/rrss4.mp4", label: "Publicación Automática" },
  { src: "/rrss5.mp4", label: "Métricas y Reportes" },
  { src: "/rrss6.mp4", label: "Empieza Gratis Hoy" },
];

type HeroTabKey = "carrusel" | "competencia" | "semana";
type NicheKey = "all" | "gastronomia" | "salud" | "retail";

interface CompetitorWinner {
  id: string;
  niche: Exclude<NicheKey, "all">;
  competitor: string;
  activeDays: string;
  format: string;
  hook: string;
  whyItWorks: string;
  adaptedHook: string;
  adaptedCTA: string;
  adaptedSlides: string[];
}

const HERO_DEMOS: Record<
  HeroTabKey,
  {
    prompt: string;
    agentNote: string;
    badge: string;
    slides: { num: string; title: string; sub: string; tag: string }[];
  }
> = {
  carrusel: {
    prompt:
      '"Hazme un carrusel de 5 slides sobre por qué nuestros clientes ahorran tiempo, usando los colores de mi web."',
    agentNote:
      "Nuestros agentes leyeron tu web, extrajeron tu paleta y armaron las láminas con textos independientes:",
    badge: "Carrusel 5 Slides · 4:5",
    slides: [
      {
        num: "Slide 1 · Portada",
        title: "¿Sigues perdiendo 6 horas por semana pensando qué subir?",
        sub: "Desliza para ver cómo resolverlo hoy →",
        tag: "Gancho Principal",
      },
      {
        num: "Slide 2 · Problema",
        title: "El problema no es tu producto, es la falta de constancia",
        sub: "Cuando dejas de publicar, tu competencia ocupa tu lugar.",
        tag: "Dolor del Cliente",
      },
      {
        num: "Slide 3 · Solución",
        title: "Tu equipo de agentes diseña y programa por ti",
        sub: "Con tu logo, tus fotos reales y zona segura verificada.",
        tag: "Cierre + CTA",
      },
    ],
  },
  competencia: {
    prompt:
      '"Revisa qué publicación le está funcionando a mi competencia este mes y adáptala a mi negocio con mi oferta."',
    agentNote:
      "Detectamos un anuncio ganador con más de 40 días activo en tu rubro y lo adaptamos a tu marca:",
    badge: "Adaptación en 1 Clic · 1:1",
    slides: [
      {
        num: "1. Detectado en Competencia",
        title: 'Gancho original: "3 cosas que nadie te dice antes de contratar..."',
        sub: "🔥 Activo hace 46 días · Alta tasa de guardados",
        tag: "Anuncio Ganador",
      },
      {
        num: "2. Adaptado a Tu Marca",
        title: "3 claves que debes revisar antes de delegar tus redes",
        sub: "Reescrito con tu tono cercano + Tu logo + Tu oferta",
        tag: "Clonado Inteligente",
      },
      {
        num: "3. Listo para Publicar",
        title: "Programado para Jueves 19:30 hrs (Hora de mayor tráfico)",
        sub: "Publicación automática en Instagram, Facebook y TikTok",
        tag: "Programado",
      },
    ],
  },
  semana: {
    prompt:
      '"Arma mi semana completa de contenido: 1 carrusel educativo, 1 afiche de promoción y 1 historia interactiva."',
    agentNote:
      "Semana completa generada y distribuida automáticamente en tu calendario:",
    badge: "Pack Semanal · Multi-Formato",
    slides: [
      {
        num: "Martes · Carrusel 4:5",
        title: "5 errores comunes en tu rubro y cómo evitarlos paso a paso",
        sub: "Objetivo: Guardados y alcance orgánico",
        tag: "Educativo",
      },
      {
        num: "Jueves · Afiche Oferta 1:1",
        title: "Promoción exclusiva hasta el viernes · Cupos limitados",
        sub: "Objetivo: Mensajes directos a tu WhatsApp",
        tag: "Venta Directa",
      },
      {
        num: "Sábado · Historia 9:16",
        title: "Antes vs. Después + Enlace directo a tu catálogo",
        sub: "Objetivo: Conversión rápida en celulares",
        tag: "Interacción",
      },
    ],
  },
};

const COMPETITOR_POSTS: CompetitorWinner[] = [
  {
    id: "post1",
    niche: "gastronomia",
    competitor: "@burgerclub_oficial",
    activeDays: "🔥 46 días activo en Meta Ads",
    format: "Carrusel (4 Slides · 4:5)",
    hook: '"Por qué nuestra Smash Burger no te cae pesada (El secreto está en el corte)"',
    whyItWorks:
      "Despierta curiosidad inmediata y derriba una objeción real del cliente mostrando el detrás de cámaras.",
    adaptedHook:
      '"El secreto detrás de nuestra especialidad de la casa (y por qué todos vuelven el fin de semana)"',
    adaptedCTA: "Reserva tu mesa o pide directo por nuestro WhatsApp con 15% OFF hoy.",
    adaptedSlides: [
      "Slide 1: El secreto detrás de nuestra especialidad de la casa",
      "Slide 2: Ingredientes frescos seleccionados cada mañana",
      "Slide 3: Preparación al momento en menos de 12 minutos",
      "Slide 4: Pide hoy por WhatsApp y suma puntos en tu tarjeta Fideliza",
    ],
  },
  {
    id: "post2",
    niche: "salud",
    competitor: "@clinica.sonrisa.pro",
    activeDays: "🔥 62 días activo · Alto retorno",
    format: "Carrusel Educativo (5 Slides)",
    hook: '"3 señales silenciosas de que necesitas una evaluación este mes (la #2 casi nadie la nota)"',
    whyItWorks:
      "Usa el efecto curiosidad en la segunda señal y educa sin parecer un anuncio agresivo.",
    adaptedHook:
      '"3 señales de que es momento de agendar tu evaluación preventiva este mes"',
    adaptedCTA: "Agenda tu evaluación inicial por WhatsApp en menos de 1 minuto.",
    adaptedSlides: [
      "Slide 1: 3 señales que no deberías dejar pasar este mes",
      "Slide 2: Señal #1: Molestias recurrentes al final del día",
      "Slide 3: Señal #2: Cambios que notas frente al espejo",
      "Slide 4: Cómo lo resolvemos en 1 sola sesión con nuestro equipo",
      "Slide 5: Escríbenos al WhatsApp y asegura tu cupo de esta semana",
    ],
  },
  {
    id: "post3",
    niche: "retail",
    competitor: "@deco.hogar.estudio",
    activeDays: "🔥 34 días activo · Alta conversión",
    format: "Afiche Comparativo (1:1)",
    hook: '"Cómo se ve tu espacio hoy vs. Cómo queda en 24 horas con el kit correcto"',
    whyItWorks:
      "Contraste visual directo (Antes vs. Después) que permite entender el beneficio en menos de 2 segundos.",
    adaptedHook: '"Transforma tu resultado esta misma semana sin pagar de más"',
    adaptedCTA: "Mira el catálogo disponible y pide asesoría directa por WhatsApp.",
    adaptedSlides: [
      "Titular Principal: Antes vs. Con Nuestra Solución",
      "Subtítulo: Sin instalaciones complicadas y con envío rápido",
      "Botón CTA: Garantía real + Atención personalizada por WhatsApp",
    ],
  },
];

export default function PropuestaLandingPage() {
  const [heroDemo, setHeroDemo] = useState<HeroTabKey>("carrusel");
  const [selectedNiche, setSelectedNiche] = useState<NicheKey>("all");
  const [compSearch, setCompSearch] = useState("");
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [adaptedPost, setAdaptedPost] = useState<CompetitorWinner | null>(
    COMPETITOR_POSTS[0]
  );
  const [activeHeroVideo, setActiveHeroVideo] = useState(0);
  const [modalVideoIndex, setModalVideoIndex] = useState<number | null>(null);

  // Auto-rotación del reproductor de videos 9:16 cada 4.5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroVideo((prev) => (prev + 1) % HERO_VIDEOS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Navegación por teclado para el modal de video en pantalla completa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalVideoIndex === null) return;
      if (e.key === "ArrowLeft") {
        setModalVideoIndex((prev) =>
          prev === null ? 0 : prev === 0 ? HERO_VIDEOS.length - 1 : prev - 1
        );
      } else if (e.key === "ArrowRight") {
        setModalVideoIndex((prev) =>
          prev === null ? 0 : prev === HERO_VIDEOS.length - 1 ? 0 : prev + 1
        );
      } else if (e.key === "Escape") {
        setModalVideoIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalVideoIndex]);

  // IntersectionObserver para el efecto data-reveal de SocialPilot
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll("[data-reveal]");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const currentHero = HERO_DEMOS[heroDemo];
  const filteredCompetitors =
    selectedNiche === "all"
      ? COMPETITOR_POSTS
      : COMPETITOR_POSTS.filter((p) => p.niche === selectedNiche);

  const handleSimulateScan = () => {
    const target = compSearch.trim() || "@competidor_destacado";
    setScanNotice(
      `Nuestros agentes escanearon las publicaciones y anuncios activos de ${target} y extrajeron sus estructuras ganadoras.`
    );
  };

  return (
    <div className="landing-page-root relative overflow-x-hidden">
      <DotCanvas />

      {/* 1. Promo Banner Oficial de SocialPilot */}
      <div className="promo">
        <span className="on-air"></span>
        PRUEBA GRATIS — <strong>7 DÍAS Y 5 PUBLICACIONES GRATIS</strong> · SIN TARJETA DE CRÉDITO
      </div>

      {/* 2. Navbar Oficial de SocialPilot */}
      <BrandHeader />

      {/* ===================================================================== */}
      {/* 3. HERO FUSIÓN: VELOCIDAD EN 5 SEGUNDOS + VIDEOS 9:16 + CONSOLA 1-CLIC */}
      {/* ===================================================================== */}
      <section
        className="hero"
        style={{ borderTop: "none", paddingTop: "68px", paddingBottom: "68px" }}
      >
        <div className="radar"></div>

        {/* Parte Superior del Hero: Titular Directo + Reproductor de Videos Reales 9:16 */}
        <div className="wrap flex flex-col lg:flex-row items-center gap-10 lg:gap-8 relative z-10">
          <div className="hero-head lg:w-7/12 lg:text-left text-center m-0 max-w-none flex flex-col items-center lg:items-start">
            <span className="eyebrow">
              Exclusivo para PyMEs y Negocios en Chile <span className="freq">·</span> Activo 24/7 🟢
            </span>

            <h1 className="lg:text-left text-center leading-[1.08] mt-5 text-3xl sm:text-5xl lg:text-[54px] font-black tracking-tight">
              Crea y publica el contenido de un mes{" "}
              <em>en 5 minutos</em> —{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                por una fracción de lo que cobra una agencia.
              </span>
            </h1>

            <p
              className="sub lg:text-left text-center lg:mx-0 mx-auto mt-5 text-base sm:text-lg leading-relaxed max-w-2xl"
              style={{ color: "var(--ink-dim)" }}
            >
              Pega tu web o tu Instagram. Nuestros agentes extraen el ADN de tu marca,{" "}
              <strong style={{ color: "var(--ink)" }}>
                revisan qué anuncios le funcionan a tu competencia
              </strong>{" "}
              y te dejan el mes completo de carruseles, afiches y reels listos para publicar.
            </p>

            {/* Triple CTA de Alta Conversión */}
            <div className="hero-ctas flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-3 mt-7 w-full">
              <a
                href="https://wa.me/56934428848?text=%C2%A1Hola%20Santisoft!%20Quiero%20recibir%20los%203%20posts%20de%20prueba%20gratis%20creados%20para%20mi%20negocio%20por%20WhatsApp.%20Mi%20rubro%20es%3A%20"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full sm:w-auto justify-center text-center !bg-gradient-to-r !from-emerald-500 !to-teal-500 hover:!from-emerald-600 hover:!to-teal-600 !text-white !font-black !shadow-lg !shadow-emerald-500/30 flex items-center gap-2 !px-6 !py-3.5"
              >
                <span>💬</span> Recibir 3 posts de prueba gratis por WhatsApp
              </a>

              <a
                href="#planes"
                className="btn btn-primary w-full sm:w-auto justify-center text-center !px-6 !py-3.5 !font-black shadow-lg shadow-orange-500/25"
              >
                <span>🚀</span> Probar con mi negocio →
              </a>

              <a
                href="#escaner-competencia"
                className="btn btn-outline w-full sm:w-auto justify-center text-center !px-5 !py-3.5 !font-bold"
              >
                <span>🕵️‍♂️</span> Escáner de Competencia
              </a>
            </div>

            {/* Píldoras de Confianza Rápida (Grilla simétrica 2x3 en móvil y 3x2 en escritorio) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-7">
              <span className="badge on !border-emerald-500/40 text-emerald-400 font-semibold justify-center sm:justify-start !px-2.5 !py-2 !text-[10.5px] sm:!text-[11px] text-center sm:text-left">
                <span className="dot !bg-emerald-400 !shadow-[0_0_6px_#34d399] shrink-0"></span>
                <span className="truncate">Control por WhatsApp</span>
              </span>
              <span className="badge on !border-orange-500/40 text-orange-300 font-semibold justify-center sm:justify-start !px-2.5 !py-2 !text-[10.5px] sm:!text-[11px] text-center sm:text-left">
                <span className="dot shrink-0"></span>
                <span className="truncate">Espía de Competencia</span>
              </span>
              <span className="badge on justify-center sm:justify-start !px-2.5 !py-2 !text-[10.5px] sm:!text-[11px] text-center sm:text-left">
                <span className="dot shrink-0"></span>
                <span className="truncate">IG, FB, TikTok &amp; Shorts</span>
              </span>
              <span className="badge on justify-center sm:justify-start !px-2.5 !py-2 !text-[10.5px] sm:!text-[11px] text-center sm:text-left">
                <span className="dot shrink-0"></span>
                <span className="truncate">Zona Segura Calibrada</span>
              </span>
              <span className="badge on justify-center sm:justify-start !px-2.5 !py-2 !text-[10.5px] sm:!text-[11px] text-center sm:text-left">
                <span className="dot shrink-0"></span>
                <span className="truncate">Policía Anti-Baneos</span>
              </span>
              <span className="badge on justify-center sm:justify-start !px-2.5 !py-2 !text-[10.5px] sm:!text-[11px] text-center sm:text-left">
                <span className="dot shrink-0"></span>
                <span className="truncate">Setup Llave en Mano</span>
              </span>
            </div>
          </div>

          {/* Columna Derecha: Reproductor de Videos Reales 9:16 */}
          <div className="hero-carousel-col lg:w-5/12 w-full flex justify-center lg:justify-end z-10 relative">
            <div
              onClick={() => setModalVideoIndex(activeHeroVideo)}
              className="hero-carousel-wrap relative aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10 group cursor-pointer w-[180px] sm:w-[230px] md:w-[270px] lg:w-full lg:max-w-[330px]"
            >
              {HERO_VIDEOS.map((v, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                    i === activeHeroVideo ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <video
                    src={v.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-5 left-0 right-0 flex justify-center px-3">
                    <span className="bg-black/65 backdrop-blur-md text-white/95 px-3.5 py-1 rounded-full text-[10px] font-mono tracking-widest border border-white/15 uppercase shadow-lg text-center leading-tight">
                      {v.label}
                    </span>
                  </div>
                </div>
              ))}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 z-20 pointer-events-none p-4 text-center">
                <div className="w-14 h-14 rounded-full bg-[#FF6B00] text-white flex items-center justify-center shadow-xl scale-95 group-hover:scale-100 transition-transform">
                  <svg className="w-7 h-7 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="bg-black/80 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full border border-white/20 shadow-lg">
                  🔊 Clic para agrandar y escuchar audio
                </span>
              </div>

              <div className="absolute top-5 right-3.5 z-30">
                <span className="bg-black/70 backdrop-blur-md text-white/90 p-2 rounded-full border border-white/20 shadow-md flex items-center justify-center text-xs">
                  🔊
                </span>
              </div>

              <div className="absolute bottom-5 left-0 right-0 z-30 flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveHeroVideo(idx);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === activeHeroVideo
                        ? "w-6 bg-[#FF6B00] shadow-[0_0_8px_rgba(255,107,0,0.9)]"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                    aria-label={`Ver video ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Parte Inferior del Hero: Consola Interactiva en 1 Clic (Sin pedir correo primero) */}
        <div className="wrap relative z-10 mt-12">
          <div
            className="rounded-3xl p-5 sm:p-7 text-left transition-all"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line-strong)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div
              className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <div className="flex items-center gap-2.5">
                <span className="rrss-dot" />
                <span
                  className="font-mono text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--ink-dim)" }}
                >
                  Prueba cómo trabajan nuestros agentes (Haz clic sin registrarte):
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setHeroDemo("carrusel")}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    heroDemo === "carrusel"
                      ? "bg-[#FF6B00] text-white shadow-md shadow-orange-500/30"
                      : "bg-slate-900/70 text-slate-300 border border-slate-700/80 hover:border-orange-500/50"
                  }`}
                >
                  🎨 Crear un carrusel (Desde tu web)
                </button>
                <button
                  type="button"
                  onClick={() => setHeroDemo("competencia")}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    heroDemo === "competencia"
                      ? "bg-[#FF6B00] text-white shadow-md shadow-orange-500/30"
                      : "bg-slate-900/70 text-slate-300 border border-slate-700/80 hover:border-orange-500/50"
                  }`}
                >
                  🔥 Adaptar un post de tu competencia
                </button>
                <button
                  type="button"
                  onClick={() => setHeroDemo("semana")}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    heroDemo === "semana"
                      ? "bg-[#FF6B00] text-white shadow-md shadow-orange-500/30"
                      : "bg-slate-900/70 text-slate-300 border border-slate-700/80 hover:border-orange-500/50"
                  }`}
                >
                  📅 Tu semana de contenido
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
                <div
                  className="p-4 rounded-2xl space-y-1.5"
                  style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
                >
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-orange-400">
                    Tú pides en 1 línea:
                  </span>
                  <p
                    className="text-sm font-semibold italic leading-relaxed"
                    style={{ color: "var(--ink)" }}
                  >
                    {currentHero.prompt}
                  </p>
                </div>

                <div
                  className="p-4 rounded-2xl space-y-1.5"
                  style={{
                    background: "rgba(34, 197, 94, 0.08)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-400">
                      ✓ Respuesta de nuestros agentes:
                    </span>
                    <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      {currentHero.badge}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                    {currentHero.agentNote}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {currentHero.slides.map((slide, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all hover:border-orange-500/50"
                    style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-orange-400">
                          {slide.num}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300">
                          {slide.tag}
                        </span>
                      </div>
                      <p
                        className="text-xs sm:text-sm font-bold leading-snug"
                        style={{ color: "var(--ink)" }}
                      >
                        {slide.title}
                      </p>
                    </div>
                    <p
                      className="text-xs pt-2.5"
                      style={{ color: "var(--ink-dim)", borderTop: "1px solid var(--line)" }}
                    >
                      {slide.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. BENTO DE 4 PILARES DE VALOR ("MÁS CONTENIDO. MENOS TRABAJO.")       */}
      {/* ===================================================================== */}
      <section className="py-16">
        <div className="wrap">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">Más contenido · Menos trabajo</span>
            <h2>
              Todo resuelto para que vendas más en <em>Redes</em>,{" "}
              <span className="em-p">Google</span> y <span className="em-w">WhatsApp.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8" data-reveal>
            <div className="pillar a !p-6">
              <span className="pillar-tag">01 · CALENDARIO COMPLETO</span>
              <h3 className="!text-xl mt-2">Un mes en minutos</h3>
              <p className="text-xs sm:text-sm mt-2 leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                Pide una pieza suelta o arma todo el mes y déjalo programado para que se publique solo en Instagram, Facebook, TikTok, LinkedIn, YouTube y X.
              </p>
            </div>

            <div className="pillar b !p-6">
              <span className="pillar-tag">02 · SECUENCIAS QUE RETIENEN</span>
              <h3 className="!text-xl mt-2">Carruseles y Reels</h3>
              <p className="text-xs sm:text-sm mt-2 leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                Diseña carruseles de 3 a 10 láminas manteniendo la misma línea gráfica del Slide 1 y con textos independientes por tarjeta.
              </p>
            </div>

            <div className="pillar c !p-6">
              <span className="pillar-tag">03 · ESPÍA DE COMPETENCIA</span>
              <h3 className="!text-xl mt-2">Anuncios que ya venden</h3>
              <p className="text-xs sm:text-sm mt-2 leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                No partas de cero. Nuestros agentes escanean qué anuncios llevan más de 30 días activos en tu rubro y los adaptan a tu marca en 1 clic.
              </p>
            </div>

            <div className="pillar a !p-6">
              <span className="pillar-tag">04 · ADN DE TU NEGOCIO</span>
              <h3 className="!text-xl mt-2">Hecho con tu marca</h3>
              <p className="text-xs sm:text-sm mt-2 leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                Usamos tu logo real, tu paleta de colores, las fotos de tu catálogo y cuidamos la zona segura para que nada se corte en celulares.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. LOS 4 PASOS VISUALES ("ASÍ TRABAJA TU NUEVO EQUIPO DE AGENTES")    */}
      {/* ===================================================================== */}
      <section className="py-16 border-t border-slate-800/70">
        <div className="wrap">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">Cómo funciona · Paso a paso</span>
            <h2>
              Así trabaja tu nuevo <em>equipo de agentes.</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8" data-reveal>
            {/* Paso 01 */}
            <div className="pillar a !p-7 flex flex-col justify-between gap-5">
              <div>
                <span className="pillar-tag">PASO 01 · TU MARCA EN SEGUNDOS</span>
                <h3 className="!text-2xl mt-2">Pega tu web o tu Instagram</h3>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Sin formularios eternos. Pegas el link de tu negocio y nuestros agentes extraen tu logo, colores, tono de comunicación y catálogo de productos.
                </p>
              </div>
              <div
                className="p-4 rounded-xl flex items-center justify-between gap-3"
                style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-bold text-xs">
                    ✓ ADN Extraído
                  </span>
                  <span className="font-mono text-xs truncate" style={{ color: "var(--ink-dim)" }}>
                    instagram.com/tu.negocio
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-4 h-4 rounded-full bg-[#FF6B00] border border-white/20" />
                  <span className="w-4 h-4 rounded-full bg-[#38BDF8] border border-white/20" />
                  <span className="w-4 h-4 rounded-full bg-[#22C55E] border border-white/20" />
                </div>
              </div>
            </div>

            {/* Paso 02 */}
            <div
              className="pillar b !p-7 flex flex-col justify-between gap-5"
              style={{
                borderColor: "var(--signal-line)",
                boxShadow: "0 16px 40px rgba(255,107,0,0.1)",
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="pillar-tag !text-orange-400">
                    PASO 02 · ESCÁNER DE COMPETENCIA
                  </span>
                  <a
                    href="#escaner-competencia"
                    className="text-xs font-bold text-orange-400 hover:underline"
                  >
                    Probar abajo ↓
                  </a>
                </div>
                <h3 className="!text-2xl mt-2">Encuentra publicaciones que ya funcionan</h3>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Nuestros agentes buscan los anuncios con mayor permanencia en tu rubro (o leen la captura que subas) para adaptar su estructura ganadora a tu marca.
                </p>
              </div>
              <div
                className="p-4 rounded-xl flex items-center justify-between gap-3"
                style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
              >
                <div className="text-xs">
                  <strong className="text-orange-400">🔥 Ganador detectado: </strong>
                  <span style={{ color: "var(--ink-dim)" }}>
                    Carrusel &ldquo;3 señales antes de contratar...&rdquo; (+45 días activo)
                  </span>
                </div>
                <a
                  href="#escaner-competencia"
                  className="px-3 py-1.5 rounded-full bg-[#FF6B00] text-white text-xs font-bold shrink-0"
                >
                  Adaptar 1-Clic
                </a>
              </div>
            </div>

            {/* Paso 03 */}
            <div className="pillar c !p-7 flex flex-col justify-between gap-5">
              <div>
                <span className="pillar-tag">PASO 03 · DISEÑO + PUBLICACIÓN</span>
                <h3 className="!text-2xl mt-2">Crea tu pieza y déjala programada</h3>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Nuestros agentes generan las imágenes, redactan el copy persuasivo, auditan hashtags contra shadowban y publican directo en tus redes.
                </p>
              </div>
              <div
                className="p-4 rounded-xl flex flex-wrap items-center justify-between gap-2"
                style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
              >
                <span className="text-xs font-mono" style={{ color: "var(--ink-dim)" }}>
                  Redes sincronizadas:
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300">
                    Instagram
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300">
                    Facebook
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
                    TikTok
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                    LinkedIn
                  </span>
                </div>
              </div>
            </div>

            {/* Paso 04 */}
            <div className="pillar a !p-7 flex flex-col justify-between gap-5">
              <div>
                <span className="pillar-tag">PASO 04 · RETOQUE EN VIVO O WHATSAPP</span>
                <h3 className="!text-2xl mt-2">Pide los cambios que quieras</h3>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  ¿Quieres cambiar el titular, usar la foto real de tu producto o ajustar la iluminación? Lo haces en un clic en pantalla o desde tu WhatsApp.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
                >
                  &ldquo;Cambia el titular&rdquo;
                </span>
                <span
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
                >
                  &ldquo;Usa mi foto real&rdquo;
                </span>
                <span
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
                >
                  &ldquo;Aprobar por WhatsApp&rdquo;
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. ESCÁNER INTERACTIVO DE ANUNCIOS GANADORES DE LA COMPETENCIA        */}
      {/* ===================================================================== */}
      <section id="escaner-competencia" className="py-20 border-t border-slate-800/80">
        <div className="wrap">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">Inteligencia Competitiva en 1 Clic</span>
            <h2>
              Revisa qué publicaciones le funcionan a <em>tu competencia</em> y adáptalas a{" "}
              <span className="em-p">tu marca.</span>
            </h2>
          </div>

          <div
            className="mt-8 rounded-3xl p-6 sm:p-8 space-y-6"
            style={{ background: "var(--panel)", border: "1px solid var(--line-strong)" }}
            data-reveal
          >
            {/* Controles del Escáner */}
            <div
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <div>
                <span className="badge-active-rrss">NUEVO EN ESTUDIO CREATIVO</span>
                <h3 className="text-xl sm:text-2xl font-black mt-2">
                  Simulador de Anuncios Ganadores (+30 días activos)
                </h3>
                <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--ink-dim)" }}>
                  Si un anuncio lleva más de 30 días activo en Meta Ads, es porque genera retorno positivo. Elige uno para ver cómo nuestros agentes lo adaptan a tu negocio.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={selectedNiche}
                  onChange={(e) => setSelectedNiche(e.target.value as NicheKey)}
                  className="rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--line-strong)" }}
                >
                  <option value="all">Todos los rubros</option>
                  <option value="gastronomia">🍔 Gastronomía / Cafeterías</option>
                  <option value="salud">🦷 Clínicas / Salud / Estética</option>
                  <option value="retail">🛍️ Tiendas / E-commerce / Servicios</option>
                </select>

                <div
                  className="flex items-center rounded-xl px-3 py-1.5 gap-2"
                  style={{ background: "var(--bg)", border: "1px solid var(--line-strong)" }}
                >
                  <span className="text-xs text-orange-400 font-mono">@</span>
                  <input
                    type="text"
                    value={compSearch}
                    onChange={(e) => setCompSearch(e.target.value)}
                    placeholder="competidor o rubro..."
                    className="bg-transparent text-xs text-white outline-none w-36 sm:w-44 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleSimulateScan}
                    className="px-3.5 py-1.5 rounded-lg bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Escanear
                  </button>
                </div>
              </div>
            </div>

            {scanNotice && (
              <div
                className="rounded-2xl p-4 flex items-center justify-between gap-3 text-xs"
                style={{
                  background: "var(--signal-soft)",
                  border: "1px solid var(--signal-line)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="rrss-dot" />
                  <span className="font-bold text-orange-200">{scanNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setScanNotice(null)}
                  className="text-orange-300 hover:text-white font-black cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Tarjetas de Competencia */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {filteredCompetitors.map((post) => {
                const isSelected = adaptedPost?.id === post.id;
                return (
                  <div
                    key={post.id}
                    className="rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
                    style={{
                      background: "var(--bg)",
                      border: isSelected
                        ? "2px solid var(--signal)"
                        : "1px solid var(--line)",
                      boxShadow: isSelected
                        ? "0 12px 32px rgba(255,107,0,0.15)"
                        : "none",
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-orange-400">
                          {post.competitor}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-bold">
                          {post.activeDays}
                        </span>
                      </div>

                      <div
                        className="inline-block px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold"
                        style={{ background: "var(--panel)", color: "var(--ink-dim)" }}
                      >
                        📐 {post.format}
                      </div>

                      <div
                        className="p-3.5 rounded-xl space-y-1"
                        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
                      >
                        <span className="text-[11px] font-bold" style={{ color: "var(--ink-dim)" }}>
                          Gancho detectado:
                        </span>
                        <p className="text-sm font-bold leading-snug" style={{ color: "var(--ink)" }}>
                          {post.hook}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-amber-400">
                          💡 Por qué convierte:
                        </span>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                          {post.whyItWorks}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAdaptedPost(post)}
                      className="btn btn-primary w-full justify-center !text-xs !py-2.5"
                    >
                      ✨ Adaptar este Post a mi Marca (1 Clic)
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Resultado Adaptado en 1 Clic */}
            {adaptedPost && (
              <div
                className="rounded-2xl p-5 sm:p-6 space-y-4"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--signal-line)",
                }}
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-3 pb-4"
                  style={{ borderBottom: "1px solid var(--line)" }}
                >
                  <div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-mono text-[11px] font-bold">
                      ✓ Estructura adaptada por nuestros agentes a tu negocio
                    </span>
                    <h4 className="text-lg font-black mt-2">
                      Vista previa lista para tu Estudio Creativo (Paso 2)
                    </h4>
                  </div>

                  <a
                    href="#planes"
                    className="btn btn-primary !text-xs !py-2.5 !px-5"
                  >
                    Probar con mi negocio →
                  </a>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  <div className="lg:col-span-5 space-y-3">
                    <div
                      className="p-4 rounded-xl space-y-1"
                      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
                    >
                      <span className="font-mono text-xs font-bold text-orange-400">
                        Nuevo Titular adaptado a Tu Marca:
                      </span>
                      <p className="text-sm font-bold">{adaptedPost.adaptedHook}</p>
                    </div>
                    <div
                      className="p-4 rounded-xl space-y-1"
                      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
                    >
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        Llamado a la Acción (CTA):
                      </span>
                      <p className="text-xs">{adaptedPost.adaptedCTA}</p>
                    </div>
                  </div>

                  <div
                    className="lg:col-span-7 rounded-xl p-4 space-y-2"
                    style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
                  >
                    <div
                      className="font-mono text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--ink-dim)" }}
                    >
                      Láminas pre-cargadas con checkboxes independientes:
                    </div>
                    {adaptedPost.adaptedSlides.map((slideText, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg text-xs"
                        style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-4 h-4 accent-[#FF6B00] rounded"
                          />
                          <span className="font-semibold">{slideText}</span>
                        </div>
                        <span className="text-emerald-400 font-mono font-bold text-[11px]">
                          Listo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. HECHO PARA NEGOCIOS COMO EL TUYO (IDENTIFICACIÓN RÁPIDA POR RUBRO) */}
      {/* ===================================================================== */}
      <section className="py-16 border-t border-slate-800/70">
        <div className="wrap">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">Casos de uso reales</span>
            <h2>
              Hecho para negocios <em>como el tuyo.</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8" data-reveal>
            <div className="pillar a !p-6 space-y-3">
              <span className="pillar-tag">🏪 NEGOCIO LOCAL O SERVICIO</span>
              <h3 className="!text-xl">Restaurante, clínica, salón, tienda o gimnasio</h3>
              <p className="text-xs sm:text-sm" style={{ color: "var(--ink-dim)" }}>
                Muestra promociones de la semana, llena tu agenda y premia a tus clientes frecuentes con tarjetas digitales Fideliza.
              </p>
              <div
                className="p-3.5 rounded-xl text-xs italic"
                style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
              >
                &ldquo;Hazme un carrusel con las promociones de esta semana y prográmalo para el jueves.&rdquo;
              </div>
            </div>

            <div className="pillar b !p-6 space-y-3">
              <span className="pillar-tag">🛍️ VENTA DE PRODUCTOS</span>
              <h3 className="!text-xl">Catálogo, E-commerce o ventas por WhatsApp</h3>
              <p className="text-xs sm:text-sm" style={{ color: "var(--ink-dim)" }}>
                Sube la foto real de tu producto y nuestros agentes arman la escena comercial con precio, oferta y llamado a la acción.
              </p>
              <div
                className="p-3.5 rounded-xl text-xs italic"
                style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
              >
                &ldquo;Quiero 3 afiches para lanzar mi nueva colección con 20% OFF.&rdquo;
              </div>
            </div>

            <div className="pillar c !p-6 space-y-3">
              <span className="pillar-tag">👨‍💼 PROFESIONAL O MARCA PERSONAL</span>
              <h3 className="!text-xl">Consultor, corredor, abogado, médico o especialista</h3>
              <p className="text-xs sm:text-sm" style={{ color: "var(--ink-dim)" }}>
                Transforma tu conocimiento en carruseles educativos que generan confianza y consultas diarias sin perder tu fin de semana.
              </p>
              <div
                className="p-3.5 rounded-xl text-xs italic"
                style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
              >
                &ldquo;Hazme un carrusel con 5 errores que comete mi cliente antes de contratar.&rdquo;
              </div>
            </div>

            <div className="pillar a !p-6 space-y-3">
              <span className="pillar-tag">🚀 AGENCIA O MULTI-MARCA</span>
              <h3 className="!text-xl">Community managers o grupos con varias sucursales</h3>
              <p className="text-xs sm:text-sm" style={{ color: "var(--ink-dim)" }}>
                Cambia de negocio en 1 clic. Cada perfil mantiene su propio logo, colores, catálogo y redes sociales conectadas de forma independiente.
              </p>
              <div
                className="p-3.5 rounded-xl text-xs italic"
                style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
              >
                &ldquo;Arma el plan de contenido de la semana para este cliente.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. ECOSISTEMA 3 CANALES EXPLICADO EN SIMPLE (REDES + GOOGLE + WA)     */}
      {/* ===================================================================== */}
      <section id="ecosistema" className="py-16 border-t border-slate-800/70">
        <div className="wrap">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">Ecosistema Completo · 3 Canales</span>
            <h2>
              Más allá de Instagram: presencia continua en <em>Redes</em>,{" "}
              <span className="em-p">Google</span> y <span className="em-w">WhatsApp.</span>
            </h2>
          </div>

          <div className="pillars three-col mt-8" data-reveal>
            <div className="pillar a">
              <span className="pillar-tag">CANAL 1 · REDES SOCIALES 360°</span>
              <h3>Redes Sociales 360°</h3>
              <ul className="pillar-list">
                <li>
                  <span className="mark">›</span>
                  <span>
                    <strong>Videos 9:16 y Afiches Comerciales:</strong> 20 estilos visuales para Reels y TikTok, más afiches con precios, ofertas y llamados a WhatsApp.
                  </span>
                </li>
                <li>
                  <span className="mark">›</span>
                  <span>
                    <strong>Espía de Competencia y Radar:</strong> Detección de anuncios ganadores y temas con tracción real en tu rubro.
                  </span>
                </li>
                <li>
                  <span className="mark">›</span>
                  <span>
                    Publicación automática directa en <strong>Instagram, Facebook, TikTok, LinkedIn, YouTube Shorts</strong> y <strong>X</strong>.
                  </span>
                </li>
              </ul>
              <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between text-xs">
                <span className="pillar-note !m-0">Autopublicación directa y sincronizada</span>
                <Link href="/como-funciona" className="text-orange-400 font-bold hover:underline">
                  Ver ejemplos visuales ➔
                </Link>
              </div>
            </div>

            <div className="pillar b">
              <span className="pillar-tag">CANAL 2 · BLOG PARA GOOGLE Y BUSCADORES</span>
              <h3>Aparece cuando te buscan</h3>
              <ul className="pillar-list">
                <li>
                  <span className="mark">›</span>
                  <span>
                    <strong>Artículos listos en tu web:</strong> Nuestros agentes redactan y publican artículos optimizados directo en tu WordPress o Shopify.
                  </span>
                </li>
                <li>
                  <span className="mark">›</span>
                  <span>
                    <strong>Recomendado en buscadores modernos:</strong> Estructuramos tu contenido para que tanto Google como los buscadores conversacionales recomienden a tu negocio.
                  </span>
                </li>
                <li>
                  <span className="mark">›</span>
                  <span>
                    Atrae clientes que están buscando activamente tu servicio en tu ciudad.
                  </span>
                </li>
              </ul>
              <span className="pillar-note">Tráfico orgánico + Posicionamiento continuo</span>
            </div>

            <div className="pillar c">
              <span className="pillar-tag">CANAL 3 · CONTROL POR WHATSAPP + FIDELIZA</span>
              <h3>Mando desde tu celular</h3>
              <ul className="pillar-list">
                <li>
                  <span className="mark">›</span>
                  <span>
                    <strong>Aprobación con 1 mensaje:</strong> Revisa y autoriza las publicaciones de la semana directo desde tu WhatsApp.
                  </span>
                </li>
                <li>
                  <span className="mark">›</span>
                  <span>
                    <strong>Pedidos al vuelo:</strong> Manda una foto o audio con una oferta urgente del día y nuestros agentes arman el post al instante.
                  </span>
                </li>
                <li>
                  <span className="mark">›</span>
                  <span>
                    <strong>Club Fideliza integrado:</strong> Tarjetas digitales de puntos y sellos para que tus clientes vuelvan a comprar.
                  </span>
                </li>
              </ul>
              <span className="pillar-note">Control total desde tu bolsillo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 9. DIFERENCIADOR WHATSAPP BOT EN VIVO                                 */}
      {/* ===================================================================== */}
      <WhatsAppBotSection />

      {/* ===================================================================== */}
      {/* 10. TESTIMONIOS REALES                                                */}
      {/* ===================================================================== */}
      <TestimonialsSection />

      {/* ===================================================================== */}
      {/* 11. ANCLAJE DE PRECIO CHILENO: TABLA DE 3 COLUMNAS EN PESOS (CLP)     */}
      {/* ===================================================================== */}
      <section id="comparativa" className="py-20 border-t border-slate-800/80">
        <div className="wrap">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">Comparativa Directa · Números Reales</span>
            <h2>
              Tres caminos para tus redes.
              <br />
              Uno solo te da <em>ventas y tiempo libre.</em>
            </h2>
          </div>
          <p
            className="text-center max-w-2xl mx-auto -mt-6 mb-12 text-slate-300 text-sm sm:text-base leading-relaxed"
            data-reveal
          >
            Hagamos números claros para el dueño de negocio en Chile. ¿Cuánto te cuesta realmente mantener tus redes activas todos los días?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch" data-reveal>
            {/* Columna 1: Hacerlo tú mismo */}
            <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Opción 1
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    Hacerlo a mano
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Hacerlo tú mismo</h3>
                  <div className="mt-2 text-3xl font-black text-slate-200">
                    $0 <span className="text-sm font-normal text-slate-400">CLP / mes</span>
                  </div>
                  <p className="text-xs text-red-400 font-semibold mt-1">
                    &ldquo;Gratis&rdquo; en dinero, carísimo en tiempo y estrés
                  </p>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>
                      Pierdes <strong>+15 horas al mes</strong> pensando qué publicar y buscando fotos.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>
                      <strong>Estrés el domingo en la noche</strong> improvisando diseños caseros.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>
                      <strong>Redes abandonadas</strong> a la segunda semana por falta de tiempo para operar tu negocio.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>
                      Cero alcance: fotos sin llamadas a la acción que nadie guarda ni compra.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-900/30 text-center text-xs text-red-300 font-medium">
                Resultado: Negocio invisible y dueño agotado.
              </div>
            </div>

            {/* Columna 2: Agencia Tradicional */}
            <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Opción 2
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-900/40 text-red-300">
                    Costoso y lento
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Agencia Tradicional / CM</h3>
                  <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
                    $450.000 – $800.000{" "}
                    <span className="text-xs sm:text-sm font-normal text-slate-400">CLP / mes</span>
                  </div>
                  <p className="text-xs text-red-400 font-semibold mt-1">
                    Presupuesto inalcanzable para la mayoría de PyMEs
                  </p>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>
                      <strong>Reuniones lentas</strong> e interminables hilos de correos para coordinar 8 posts al mes.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>
                      <strong>Textos genéricos y fríos</strong> redactados por personas que no conocen la realidad de tu rubro.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>
                      Tardan <strong>días en responder</strong> cuando necesitas publicar una promo urgente para el fin de semana.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>
                      <strong>Contratos largos</strong> amarrados por 6 a 12 meses sin garantía de resultados.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-900/30 text-center text-xs text-red-300 font-medium">
                Resultado: Pagar una fortuna por un servicio rígido.
              </div>
            </div>

            {/* Columna 3: SocialPilot by Santisoft (DESTACADA) */}
            <div className="relative p-7 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-orange-500 shadow-2xl shadow-orange-500/20 flex flex-col justify-between space-y-6">
              <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg">
                🔥 Recomendado para PyMEs
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                    Opción 3
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Llave en Mano
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">SocialPilot by Santisoft</h3>
                  <div className="mt-2 text-3xl font-black text-white">
                    Desde $59.990{" "}
                    <span className="text-sm font-normal text-slate-400">CLP / mes</span>
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    90% más barato que una agencia y 100% bajo tu control
                  </p>
                </div>
                <ul className="space-y-3 text-xs text-slate-200 pt-2 border-t border-slate-800">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>
                      <strong>Nuestros agentes con tu voz real</strong>: textos persuasivos con la personalidad auténtica de tu negocio.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>
                      <strong>Espía de competencia en 1 clic</strong>: detecta qué anuncios llevan +30 días activos en tu rubro y los adapta a tu marca.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>
                      <strong>Carruseles, Afiches y Reels</strong> con tu logo, colores, catálogo y zona segura calibrada.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>
                      <strong>Policía Anti-Baneos</strong> de Instagram para proteger el alcance y la salud de tu cuenta.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>
                      <strong>Setup Llave en Mano GRATIS</strong>: dejamos tu marca configurada y tu contenido andando.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <a
                  href="https://wa.me/56934428848?text=%C2%A1Hola!%20Quiero%20asegurar%20uno%20de%20los%20cupos%20del%20Plan%20PyME%20Crecimiento%20de%20Santisoft%20con%20Setup%20Gratis."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs text-center flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
                >
                  <span>🚀</span> Asegurar mi cupo con Setup Gratis
                </a>
                <p className="text-[10px] text-center text-slate-400">
                  Garantía Cero Riesgo de 7 días · Cancela cuando quieras
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 12. PLANES Y PRECIOS OFICIALES                                        */}
      {/* ===================================================================== */}
      <section id="planes">
        <div className="wrap">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">Planes</span>
            <h2>
              Escoge tu nivel de <em>automatización.</em>
            </h2>
          </div>
          <PricingPlans />
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 13. CONTACTO + REDES OFICIALES                                        */}
      {/* ===================================================================== */}
      <section id="contacto" className="relative">
        <div className="wrap relative z-10 max-w-3xl">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">Contacto</span>
            <h2>
              ¿Tienes dudas? <em>Hablemos.</em>
            </h2>
            <p
              className="mt-4 font-sans max-w-lg mx-auto"
              style={{ color: "var(--ink-dim)", fontSize: "15px", lineHeight: "1.6" }}
            >
              Déjanos tus datos y te contactaremos a la brevedad para ayudarte a potenciar tu negocio.
            </p>
          </div>

          <div className="panel p-8 md:p-10" data-reveal>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 14. CTA FINAL CON RADAR OFICIAL                                       */}
      {/* ===================================================================== */}
      <div className="final-cta">
        <div className="radar"></div>
        <div className="wrap relative z-10">
          <h2>
            Tu negocio merece verse activo
            <br />
            <em>todos los días.</em>
          </h2>
          <p>
            Empieza hoy con 7 días de prueba gratis o pídenos 3 publicaciones de muestra creadas para tu negocio por WhatsApp.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#planes" className="btn btn-primary">
              Probar con mi negocio (Ver Planes) →
            </a>
            <a
              href="https://wa.me/56934428848?text=%C2%A1Hola%20Santisoft!%20Quiero%20recibir%20los%203%20posts%20de%20prueba%20gratis%20creados%20para%20mi%20negocio."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              💬 Pedir 3 posts gratis por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* 15. Footer Oficial de SocialPilot */}
      <BrandFooter />

      <WebChatWidget />

      {/* ===================================================================== */}
      {/* MODAL DE VIDEO 9:16 EN PANTALLA COMPLETA                              */}
      {/* ===================================================================== */}
      {modalVideoIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6 animate-fade-in"
          onClick={() => setModalVideoIndex(null)}
        >
          <div
            className="relative max-w-sm sm:max-w-md w-full flex flex-col items-center justify-center bg-slate-900/95 rounded-3xl p-3 sm:p-5 border border-white/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between px-2 pb-3 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-white/90 bg-[#FF6B00]/80 px-3 py-1 rounded-full border border-orange-400/30">
                  {HERO_VIDEOS[modalVideoIndex].label}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {modalVideoIndex + 1}/{HERO_VIDEOS.length}
                </span>
              </div>
              <button
                onClick={() => setModalVideoIndex(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors"
                aria-label="Cerrar video"
              >
                ✕
              </button>
            </div>

            <div className="relative w-full aspect-[9/16] max-h-[55vh] sm:max-h-[70vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-inner group">
              <video
                key={modalVideoIndex}
                src={HERO_VIDEOS[modalVideoIndex].src}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              <button
                onClick={() =>
                  setModalVideoIndex((prev) =>
                    prev === null ? 0 : prev === 0 ? HERO_VIDEOS.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center text-lg shadow-xl transition-transform hover:scale-110 active:scale-95 z-30"
                aria-label="Video anterior"
              >
                ‹
              </button>

              <button
                onClick={() =>
                  setModalVideoIndex((prev) =>
                    prev === null ? 0 : prev === HERO_VIDEOS.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center text-lg shadow-xl transition-transform hover:scale-110 active:scale-95 z-30"
                aria-label="Video siguiente"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
