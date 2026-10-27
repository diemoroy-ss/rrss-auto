"use client";

import React, { useState } from "react";
import Link from "next/link";

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
        title: "3 claves que debes revisar antes de automatizar tus redes",
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
        title: " Antes vs. Después + Enlace directo a tu catálogo",
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
  const [activeMainTab, setActiveMainTab] = useState<"landing" | "spy">("landing");
  const [heroDemo, setHeroDemo] = useState<HeroTabKey>("carrusel");
  const [selectedNiche, setSelectedNiche] = useState<NicheKey>("all");
  const [compSearch, setCompSearch] = useState("");
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [adaptedPost, setAdaptedPost] = useState<CompetitorWinner | null>(
    COMPETITOR_POSTS[0]
  );

  const currentHero = HERO_DEMOS[heroDemo];
  const filteredCompetitors =
    selectedNiche === "all"
      ? COMPETITOR_POSTS
      : COMPETITOR_POSTS.filter((p) => p.niche === selectedNiche);

  const handleSimulateScan = () => {
    const target = compSearch.trim() || "@competidor_destacado";
    setScanNotice(
      `Nuestros agentes analizaron las publicaciones y anuncios con mayor permanencia de ${target} y extrajeron sus estructuras ganadoras.`
    );
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white pb-24">
      {/* Glow Superior Ambiental */}
      <div className="fixed inset-x-0 top-0 h-96 bg-gradient-to-b from-indigo-600/15 via-purple-600/5 to-transparent pointer-events-none" />

      {/* BARRA SUPERIOR STICKY */}
      <header className="sticky top-0 z-50 bg-[#0b1021]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-500/25"
            >
              SP
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-tight">
                  SocialPilot
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Maqueta en Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Arquitectura rápida de entender + Escáner de Competencia en 1 Clic
              </p>
            </div>
          </div>

          {/* Selector de Pestañas + Botón al Panel Real */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center bg-[#060913] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveMainTab("landing")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMainTab === "landing"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                1. Nueva Portada (Estilo AdGenius)
              </button>
              <button
                type="button"
                onClick={() => setActiveMainTab("spy")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMainTab === "spy"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                2. Demo: Anuncios de Competencia
              </button>
            </div>

            <Link
              href="/automatizacion-rrss/panel/crear"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20 shrink-0"
            >
              Probar en Estudio Real →
            </Link>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* PESTAÑA 1: NUEVA PORTADA SOCIALPILOT (ESTILO ADGENIUS)                */}
      {/* ===================================================================== */}
      {activeMainTab === "landing" && (
        <main className="relative z-10 max-w-6xl mx-auto px-4 pt-10 space-y-20">
          {/* 1. HERO ULTRA CLARO EN 5 SEGUNDOS */}
          <section className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tu propio equipo de agentes de diseño, copy y publicación automática
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-[1.1]">
              Crea y publica el contenido de un mes{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400 bg-clip-text text-transparent">
                en 5 minutos
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Pega tu web o tu Instagram. Nuestros agentes extraen tu marca, revisan qué
              publicaciones le están funcionando a tu competencia y te arman carruseles,
              afiches y reels listos para publicar.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/automatizacion-rrss/panel/crear"
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
              >
                Empezar ahora con mi negocio →
              </Link>
              <button
                type="button"
                onClick={() => setActiveMainTab("spy")}
                className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all cursor-pointer"
              >
                🕵️‍♂️ Ver cómo espía a tu competencia
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              En español · Respeta las zonas seguras de Instagram · Publica directo en 6 redes
            </p>

            {/* CONSOLA INTERACTIVA EN EL HERO */}
            <div className="mt-8 bg-[#0f1629] border border-slate-800 rounded-3xl p-5 sm:p-7 text-left shadow-2xl max-w-5xl mx-auto space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Simulador en vivo — Haz clic en una tarea:
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setHeroDemo("carrusel")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      heroDemo === "carrusel"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-[#090d1a] text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    🎨 Crear un carrusel (Desde tu web)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroDemo("competencia")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      heroDemo === "competencia"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-[#090d1a] text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    🔥 Adaptar un post de tu competencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroDemo("semana")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      heroDemo === "semana"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-[#090d1a] text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    📅 Tu semana de contenido
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <div className="lg:col-span-5 flex flex-col justify-between gap-3">
                  <div className="p-4 rounded-2xl bg-[#090d1a] border border-slate-800 space-y-1.5">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                      Tú pides en 1 línea:
                    </span>
                    <p className="text-sm font-semibold italic text-slate-100 leading-relaxed">
                      {currentHero.prompt}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400">
                        ✓ Respuesta de nuestros agentes:
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {currentHero.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentHero.agentNote}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {currentHero.slides.map((slide, idx) => (
                    <div
                      key={idx}
                      className="bg-[#090d1a] border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-black text-indigo-400">
                            {slide.num}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300">
                            {slide.tag}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                          {slide.title}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                        {slide.sub}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 2. BENTO DE 4 BENEFICIOS DIRECTOS */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                Más contenido. Menos trabajo.
              </span>
              <h2 className="text-2xl sm:text-4xl font-black">
                Todo lo que necesitas para vender en redes sin complicarte
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="text-3xl">🗓️</div>
                <h3 className="font-black text-base text-white">Un mes completo</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pide una publicación suelta o arma el calendario del mes y déjalo
                  programado para que salga solo en Instagram, Facebook, TikTok y LinkedIn.
                </p>
              </div>

              <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="text-3xl">🧲</div>
                <h3 className="font-black text-base text-white">Carruseles que retienen</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Secuencias de 3 a 10 slides donde cada lámina mantiene tu línea gráfica y
                  cuenta con controles de texto independientes.
                </p>
              </div>

              <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="text-3xl">🕵️‍♂️</div>
                <h3 className="font-black text-base text-white">Anuncios que ya venden</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No partas de una hoja en blanco. Escanea qué publicaciones llevan más de 30
                  días activas en tu competencia y adáptalas en 1 clic.
                </p>
              </div>

              <div className="bg-[#0f1629] border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="text-3xl">🎯</div>
                <h3 className="font-black text-base text-white">Hecho para tu marca</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nuestros agentes usan tu logo real, tus colores, tu catálogo de productos y
                  cuidan la zona segura para que nada se corte en el celular.
                </p>
              </div>
            </div>
          </section>

          {/* 3. LOS 4 PASOS VISUALES ("ASÍ TRABAJA TU NUEVO EQUIPO") */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                Cómo funciona
              </span>
              <h2 className="text-2xl sm:text-4xl font-black">
                Así trabaja tu nuevo equipo de agentes
              </h2>
              <p className="text-sm text-slate-400">
                De una simple idea a tus redes publicadas en cuatro pasos claros.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Paso 01 */}
              <div className="bg-[#0f1629] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between gap-5">
                <div className="space-y-2.5">
                  <span className="inline-block px-3 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 font-black text-xs">
                    01 · Tu marca lista en segundos
                  </span>
                  <h3 className="text-xl font-black text-white">
                    Pega tu link o tu Instagram
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Sin formularios eternos. Pegas la web o el Instagram de tu negocio y
                    nuestros agentes guardan tu logo, paleta de colores, estilo y catálogo.
                  </p>
                </div>

                <div className="bg-[#090d1a] border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 font-bold text-xs">
                      ✓ ADN Extraído
                    </span>
                    <span className="text-xs font-mono text-slate-400 truncate">
                      instagram.com/tu.negocio
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-4 h-4 rounded-full bg-indigo-500 border border-white/20" />
                    <span className="w-4 h-4 rounded-full bg-amber-400 border border-white/20" />
                    <span className="w-4 h-4 rounded-full bg-emerald-500 border border-white/20" />
                  </div>
                </div>
              </div>

              {/* Paso 02 */}
              <div className="bg-[#0f1629] border-2 border-indigo-500/50 rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-lg shadow-indigo-500/10">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block px-3 py-1 rounded-lg bg-amber-500/15 text-amber-300 font-black text-xs">
                      02 · Escáner de Competencia Activo
                    </span>
                    <Link
                      href="/automatizacion-rrss/panel/crear"
                      className="text-xs font-bold text-indigo-400 hover:underline"
                    >
                      Ya disponible en Nuevo Post →
                    </Link>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    Encuentra ideas que ya funcionan
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Nuestros agentes escanean anuncios y publicaciones ganadoras en tu rubro
                    (o leen cualquier captura que subas) para adaptar su gancho a tu negocio.
                  </p>
                </div>

                <div className="bg-[#090d1a] border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-black text-amber-400">🔥 Ganador detectado: </span>
                    <span className="text-slate-300">
                      Carrusel &ldquo;3 señales antes de elegir...&rdquo; (+45 días activo)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMainTab("spy")}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shrink-0 cursor-pointer"
                  >
                    Ver Demo
                  </button>
                </div>
              </div>

              {/* Paso 03 */}
              <div className="bg-[#0f1629] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between gap-5">
                <div className="space-y-2.5">
                  <span className="inline-block px-3 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 font-black text-xs">
                    03 · Diseño + Copy + Publicación
                  </span>
                  <h3 className="text-xl font-black text-white">
                    Crea y deja programado en tus redes
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Nuestros agentes diseñan el afiche, la historia o las láminas del
                    carrusel, redactan el copy persuasivo y lo publican a la mejor hora.
                  </p>
                </div>

                <div className="bg-[#090d1a] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 font-semibold">
                    Publicación directa:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-pink-500/15 text-pink-300">
                      Instagram
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300">
                      Facebook
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300">
                      TikTok
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300">
                      LinkedIn
                    </span>
                  </div>
                </div>
              </div>

              {/* Paso 04 */}
              <div className="bg-[#0f1629] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between gap-5">
                <div className="space-y-2.5">
                  <span className="inline-block px-3 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 font-black text-xs">
                    04 · Retoque en vivo o por WhatsApp
                  </span>
                  <h3 className="text-xl font-black text-white">
                    Pide los cambios que quieras
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    ¿Quieres cambiar un título, usar la foto real de tu producto o ajustar un
                    color? Lo haces en 1 clic en pantalla o pidiéndolo desde tu WhatsApp.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-[#090d1a] border border-slate-800 text-xs font-semibold text-slate-200">
                    &ldquo;Cambia el texto&rdquo;
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#090d1a] border border-slate-800 text-xs font-semibold text-slate-200">
                    &ldquo;Usa mi foto real&rdquo;
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-[#090d1a] border border-slate-800 text-xs font-semibold text-slate-200">
                    &ldquo;Ponlo en formato Historia&rdquo;
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. COMPARATIVA RÁPIDA EN 2 COLUMNAS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-[#0f1629] border border-slate-800 rounded-3xl p-7 space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                Crear todo a mano
              </span>
              <h3 className="text-xl font-black text-white">Horas perdidas cada semana</h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-black">✕</span>
                  <span>Horas pensando qué publicar frente a la hoja en blanco</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-black">✕</span>
                  <span>Plantillas genéricas que se ven iguales a las de todos</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-black">✕</span>
                  <span>Textos cortados al subirlos al feed de Instagram</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-black">✕</span>
                  <span>Pagar herramientas separadas para diseñar, programar y fidelizar</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#0f1629] border-2 border-indigo-500/60 rounded-3xl p-7 space-y-4 shadow-xl shadow-indigo-500/10">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Con SocialPilot
              </span>
              <h3 className="text-xl font-black text-white">Listo y publicado en 5 minutos</h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-100">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-black">✓</span>
                  <span>Ideas probadas basadas en lo que ya le funciona a tu competencia</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-black">✓</span>
                  <span>Carruseles, afiches y reels con tu logo, colores y catálogo</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-black">✓</span>
                  <span>Zona segura calibrada para que se vea impecable en celular</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-black">✓</span>
                  <span>Publicación automática + Club Fideliza + Control por WhatsApp</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 5. HECHO PARA NEGOCIOS COMO EL TUYO */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                Para quién es
              </span>
              <h2 className="text-2xl sm:text-4xl font-black">
                Hecho para negocios como el tuyo
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-[#0f1629] border border-slate-800 rounded-3xl p-6 space-y-3">
                <span className="text-xs font-black text-indigo-400">
                  🏪 Tienes un negocio local
                </span>
                <h3 className="font-black text-lg text-white">
                  Restaurante, clínica, salón, tienda o gimnasio
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Muestra tus promociones, llena tu agenda y premia a tus clientes frecuentes
                  con tarjetas digitales sin depender de diseñadores externos.
                </p>
                <div className="p-3.5 rounded-2xl bg-[#090d1a] border border-slate-800 text-xs italic text-slate-200">
                  &ldquo;Hazme un carrusel con las promociones de esta semana.&rdquo;
                </div>
              </div>

              <div className="bg-[#0f1629] border border-slate-800 rounded-3xl p-6 space-y-3">
                <span className="text-xs font-black text-emerald-400">
                  🛍️ Vendes productos
                </span>
                <h3 className="font-black text-lg text-white">
                  Por catálogo, tienda online o directo por WhatsApp
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sube la foto real de tu producto y nuestros agentes crean el afiche comercial
                  con precio, oferta y llamado a la acción listo para publicar.
                </p>
                <div className="p-3.5 rounded-2xl bg-[#090d1a] border border-slate-800 text-xs italic text-slate-200">
                  &ldquo;Quiero 3 posts para lanzar mi nueva colección con 20% OFF.&rdquo;
                </div>
              </div>

              <div className="bg-[#0f1629] border border-slate-800 rounded-3xl p-6 space-y-3">
                <span className="text-xs font-black text-amber-400">
                  👨‍💼 Eres profesional o marca personal
                </span>
                <h3 className="font-black text-lg text-white">
                  Consultor, corredor, abogado, médico o especialista
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Comparte lo que sabes en carruseles educativos que posicionan tu autoridad y
                  atraen clientes sin pasar el domingo frente al computador.
                </p>
                <div className="p-3.5 rounded-2xl bg-[#090d1a] border border-slate-800 text-xs italic text-slate-200">
                  &ldquo;Hazme un carrusel con 5 errores que comete mi cliente antes de
                  contratar.&rdquo;
                </div>
              </div>

              <div className="bg-[#0f1629] border border-slate-800 rounded-3xl p-6 space-y-3">
                <span className="text-xs font-black text-purple-400">
                  🚀 Llevas varias marcas o sucursales
                </span>
                <h3 className="font-black text-lg text-white">
                  Agencia, community manager o grupo de negocios
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cambia de perfil en un clic. Cada marca conserva su propio logo, colores,
                  catálogo y redes conectadas por separado.
                </p>
                <div className="p-3.5 rounded-2xl bg-[#090d1a] border border-slate-800 text-xs italic text-slate-200">
                  &ldquo;Arma el plan de contenido de la semana para este cliente.&rdquo;
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 2: DEMO INTERACTIVA "ANUNCIOS QUE FUNCIONAN EN TU COMPETENCIA" */}
      {/* ===================================================================== */}
      {activeMainTab === "spy" && (
        <main className="relative z-10 max-w-6xl mx-auto px-4 pt-10 space-y-8">
          <div className="bg-[#0f1629] border border-slate-800 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-black">
                🔥 Ya integrado en tu Estudio Creativo (Nuevo Post)
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Publicaciones y anuncios que funcionan en tu competencia
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Nuestros agentes rastrean los anuncios activos con mayor permanencia en tu
                rubro. Elige cualquiera y adáptalo en 1 clic con tu marca, tus colores y tu
                oferta.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value as NicheKey)}
                className="bg-[#090d1a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-indigo-500"
              >
                <option value="all">Todos los rubros</option>
                <option value="gastronomia">🍔 Gastronomía / Cafeterías</option>
                <option value="salud">🦷 Clínicas / Salud / Estética</option>
                <option value="retail">🛍️ Tiendas / E-commerce / Servicios</option>
              </select>

              <div className="flex items-center bg-[#090d1a] border border-slate-700 rounded-xl px-3 py-1.5 gap-2">
                <span className="text-xs text-slate-500">@</span>
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
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer"
                >
                  Escanear
                </button>
              </div>
            </div>
          </div>

          {scanNotice && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-indigo-200">{scanNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setScanNotice(null)}
                className="text-slate-400 hover:text-white font-black cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Grilla de Anuncios Ganadores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredCompetitors.map((post) => {
              const isSelected = adaptedPost?.id === post.id;
              return (
                <div
                  key={post.id}
                  className={`bg-[#0f1629] rounded-3xl p-6 flex flex-col justify-between gap-5 transition-all ${
                    isSelected
                      ? "border-2 border-indigo-500 shadow-xl shadow-indigo-500/15"
                      : "border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-indigo-400">
                        {post.competitor}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-bold">
                        {post.activeDays}
                      </span>
                    </div>

                    <div className="inline-block px-2.5 py-1 rounded-lg bg-[#090d1a] border border-slate-800 text-xs font-semibold text-slate-300">
                      📐 {post.format}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#090d1a] border border-slate-800 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400">
                        Gancho que están usando:
                      </span>
                      <p className="text-sm font-black text-white leading-snug">
                        {post.hook}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-black text-amber-400">
                        💡 Por qué les funciona:
                      </span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {post.whyItWorks}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAdaptedPost(post)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    ✨ Adaptar este Post a mi Marca (1 Clic)
                  </button>
                </div>
              );
            })}
          </div>

          {/* Vista Previa de Adaptación en 1 Clic */}
          {adaptedPost && (
            <div className="bg-[#0f1629] border-2 border-indigo-500 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 text-xs font-black mb-1.5">
                    ✓ Estructura adaptada por nuestros agentes a tu negocio
                  </span>
                  <h3 className="text-xl font-black text-white">
                    Así queda pre-cargado en el Paso 2 de tu Estudio Creativo
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mantenemos la psicología de conversión del post de{" "}
                    <b className="text-indigo-300">{adaptedPost.competitor}</b>, pero con tus
                    propios titulares, oferta y láminas independientes.
                  </p>
                </div>

                <Link
                  href="/automatizacion-rrss/panel/crear"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition-all"
                >
                  Abrir en Estudio Creativo Real →
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                <div className="lg:col-span-5 space-y-3">
                  <div className="p-4 rounded-2xl bg-[#090d1a] border border-slate-800 space-y-1">
                    <span className="text-xs font-black text-indigo-400">
                      Nuevo Titular adaptado a Tu Marca:
                    </span>
                    <p className="text-sm font-black text-white">
                      {adaptedPost.adaptedHook}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#090d1a] border border-slate-800 space-y-1">
                    <span className="text-xs font-black text-emerald-400">
                      Llamado a la Acción (CTA):
                    </span>
                    <p className="text-xs text-slate-200">{adaptedPost.adaptedCTA}</p>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-[#090d1a] border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Láminas pre-cargadas con checkboxes independientes:
                  </div>
                  <div className="space-y-2">
                    {adaptedPost.adaptedSlides.map((slideText, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#0f1629] border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-4 h-4 accent-indigo-600 rounded"
                          />
                          <span className="font-semibold text-slate-100">{slideText}</span>
                        </div>
                        <span className="text-emerald-400 font-bold text-[11px] shrink-0">
                          Listo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
