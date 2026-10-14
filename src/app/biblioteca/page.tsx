"use client";

import { useState, useMemo } from "react";
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
  FaFilter,
} from "react-icons/fa";
import { FLOW_COMMANDS, FlowCommandDef } from "../../lib/flow-command-translator";
import { HARDCODED_STYLES, PromptTemplate } from "../../lib/prompt-templates";

const WA_URL =
  "https://wa.me/56930825301?text=Hola!%20Estuve%20revisando%20la%20biblioteca%20p%C3%BAblica%20de%20estilos%20de%20Santisoft%20y%20quiero%20usarlos%20en%20mi%20negocio.";

// Videos reales demostrativos disponibles en Firebase Storage
const SAMPLE_VIDEOS: Record<string, { videoUrl: string; posterUrl: string }> = {
  "/360 product orbit": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_360_product_orbit_video_1791908370384.mp4?alt=media&token=255d8c89-98e8-4a22-a30a-d8a2feb6f8af",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_360_product_orbit_image_1791908361375.jpg?alt=media&token=8587c752-bbde-49e9-9766-2e0a7e5bd16b",
  },
  "/smoke reveal": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_smoke_reveal_video_1791912556524.mp4?alt=media&token=fe380098-be2f-44ef-b847-fd532d47a692",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_smoke_reveal_image_1791912549918.webp?alt=media&token=b064d1f1-508e-4a34-b6f5-e487b682dacf",
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
  "/Times Square 3D reveal": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_times_square_3d_reveal_video_1791914460145.mp4?alt=media&token=aa6ddf8a-5b0e-4c97-b902-50ccf5ee2deb",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_times_square_3d_reveal_image_1791914453800.webp?alt=media&token=d4aa6e39-63ee-4f12-bde2-2f73b6b515d8",
  },
  "/macro product shot": {
    videoUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_macro_product_shot_video_1791910036356.mp4?alt=media&token=675a7d7e-a182-44da-b858-81427a4a8255",
    posterUrl:
      "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_macro_product_shot_image_1791910011818.jpg?alt=media&token=756d24c1-8169-42e0-b2ca-afd2cbb10a38",
  },
};

type LibraryTab = "all" | "videos" | "photos" | "posters";

export default function BibliotecaPublicaPage() {
  const [activeTab, setActiveTab] = useState<LibraryTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideoModal, setSelectedVideoModal] = useState<FlowCommandDef | null>(null);

  // Separar estilos de imagen: Simples vs Afiches con texto
  const photoStyles = useMemo(() => {
    return HARDCODED_STYLES.filter((s) => !s.isCommercialPoster);
  }, []);

  const posterStyles = useMemo(() => {
    return HARDCODED_STYLES.filter((s) => s.isCommercialPoster);
  }, []);

  // Filtrado de elementos
  const filteredVideos = useMemo(() => {
    if (activeTab === "photos" || activeTab === "posters") return [];
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

  const filteredPhotos = useMemo(() => {
    if (activeTab === "videos" || activeTab === "posters") return [];
    return photoStyles.filter((s) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });
  }, [activeTab, photoStyles, searchQuery]);

  const filteredPosters = useMemo(() => {
    if (activeTab === "videos" || activeTab === "photos") return [];
    return posterStyles.filter((s) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });
  }, [activeTab, posterStyles, searchQuery]);

  const totalResults =
    filteredVideos.length + filteredPhotos.length + filteredPosters.length;

  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen selection:bg-orange-500 selection:text-white">
      <PageTracker page="biblioteca" />
      <DotCanvas />
      <WebChatWidget />

      <div className="promo">
        <span className="on-air"></span>
        CATÁLOGO VISUAL PÚBLICO · <strong>20 COMANDOS DE VIDEO &amp; MÁS DE 30 ESTILOS COMERCIALES</strong>
      </div>

      <BrandHeader />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24 space-y-12">
        {/* Hero de la Biblioteca */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-400/40 text-orange-400 text-xs font-bold tracking-wide">
            <FaVideo className="text-xs" />
            Biblioteca Visual de Nuestros Agentes
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
            Estilos y Comandos
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-amber-200">
              Listos para Tus Redes.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Explora el catálogo completo que utilizan nuestros agentes especializados para producir
            videos en formato 9:16, fotografías de producto con iluminación de estudio y afiches
            comerciales con ofertas directas a WhatsApp.
          </p>
        </section>

        {/* Barra de Filtros y Buscador */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                Todos ({FLOW_COMMANDS.length + photoStyles.length + posterStyles.length})
              </button>

              <button
                onClick={() => setActiveTab("videos")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === "videos"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <FaVideo className="text-xs" />
                Videos 9:16 ({FLOW_COMMANDS.length})
              </button>

              <button
                onClick={() => setActiveTab("photos")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === "photos"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <FaImage className="text-xs" />
                Fotos de Producto ({photoStyles.length})
              </button>

              <button
                onClick={() => setActiveTab("posters")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === "posters"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <FaFileAlt className="text-xs" />
                Afiches con Texto ({posterStyles.length})
              </button>
            </div>

            {/* Buscador */}
            <div className="relative w-full md:w-72">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
              <input
                type="text"
                placeholder="Buscar por estilo o rubro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>
              Mostrando <strong className="text-white">{totalResults}</strong> estilos disponibles
            </span>
            <span className="hidden sm:inline">
              Formatos optimizados para Instagram, TikTok, Facebook, YouTube y X
            </span>
          </div>
        </section>

        {/* ───────────── 1. SECCIÓN VIDEOS 9:16 ───────────── */}
        {filteredVideos.length > 0 && (
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-orange-500/15 text-orange-400 text-base">
                  <FaVideo />
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Comandos de Video Cinematográfico (9:16)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cámara lenta, efectos físicos reales, órbitas 360° y animación de marca
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-orange-400">
                {filteredVideos.length} comandos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVideos.map((cmd) => {
                const sample = SAMPLE_VIDEOS[cmd.command];
                return (
                  <article
                    key={cmd.command}
                    className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-orange-500/40 p-5 space-y-4 flex flex-col justify-between transition-all group hover:-translate-y-0.5 shadow-lg"
                  >
                    <div className="space-y-3">
                      {/* Media preview si existe */}
                      {sample && (
                        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-black border border-slate-800 group-hover:border-orange-500/30 transition-all">
                          <video
                            src={sample.videoUrl}
                            poster={sample.posterUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 bg-black/75 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-bold text-white flex items-center gap-1">
                            <FaPlay className="text-[7px] text-orange-400" /> Demo 9:16
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                            {cmd.category}
                          </span>
                          <h3 className="text-base font-bold text-white group-hover:text-orange-300 transition-colors">
                            {cmd.name}
                          </h3>
                        </div>
                        <span className="text-2xl p-2 rounded-xl bg-slate-800/80 text-orange-400 shrink-0">
                          {cmd.icon}
                        </span>
                      </div>

                      <code className="inline-block text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-orange-400">
                        {cmd.command}
                      </code>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {cmd.description}
                      </p>

                      <div className="space-y-1.5 pt-1 text-[11px] text-slate-400">
                        <div className="flex items-start gap-1.5">
                          <strong className="text-slate-300 shrink-0">Cámara:</strong>
                          <span className="truncate">{cmd.cameraMovement}</span>
                        </div>
                        {cmd.physicsEffect && (
                          <div className="flex items-start gap-1.5">
                            <strong className="text-slate-300 shrink-0">Física:</strong>
                            <span className="truncate">{cmd.physicsEffect}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedVideoModal(cmd)}
                        className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
                      >
                        Ver detalles <FaArrowRight className="text-[9px]" />
                      </button>

                      <a
                        href={WA_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
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

        {/* ───────────── 2. SECCIÓN FOTOGRAFÍA DE PRODUCTO & SERVICIOS ───────────── */}
        {filteredPhotos.length > 0 && (
          <section className="space-y-6 pt-6">
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
                    Estilos visuales limpios, iluminación de estudio, fondos cuidados y estética editorial
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400">
                {filteredPhotos.length} estilos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPhotos.map((style) => (
                <article
                  key={style.id}
                  className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 p-5 space-y-4 flex flex-col justify-between transition-all group hover:-translate-y-0.5 shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          {style.category}
                        </span>
                        <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                          {style.name}
                        </h3>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                        Fotografía
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {style.description}
                    </p>

                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Punto de vista &amp; Iluminación
                      </span>
                      <p className="text-xs text-slate-300 font-medium">
                        {style.lighting}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      Formato feed 1:1 y 4:5
                    </span>
                    <a
                      href={WA_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <FaWhatsapp /> Probar estilo
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ───────────── 3. SECCIÓN AFICHES COMERCIALES CON TEXTO ───────────── */}
        {filteredPosters.length > 0 && (
          <section className="space-y-6 pt-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-base">
                  <FaFileAlt />
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Afiches Comerciales &amp; Promociones (Con Texto)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Diseños con ofertas claras, precios destacados, llamados a comprar y botón directo a WhatsApp
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                {filteredPosters.length} plantillas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPosters.map((poster) => (
                <article
                  key={poster.id}
                  className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 p-5 space-y-4 flex flex-col justify-between transition-all group hover:-translate-y-0.5 shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          {poster.category}
                        </span>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {poster.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Afiche
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {poster.description}
                    </p>

                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Elementos Comerciales Integrados
                      </span>
                      <ul className="text-xs text-slate-300 space-y-1">
                        <li className="flex items-center gap-1.5">
                          <FaCheck className="text-[10px] text-emerald-400" />
                          <span>Precios destacados y ofertas porcentuales</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <FaCheck className="text-[10px] text-emerald-400" />
                          <span>Titulares publicitarios con alta legibilidad</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <FaCheck className="text-[10px] text-emerald-400" />
                          <span>Llamado directo a pedir por WhatsApp</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      Feed &amp; Stories
                    </span>
                    <a
                      href={WA_URL}
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

        {/* ───────────── LLAMADO A LA ACCIÓN FINAL ───────────── */}
        <section className="pt-10">
          <div className="rounded-[2.5rem] bg-gradient-to-r from-orange-600 via-amber-600 to-indigo-700 p-8 sm:p-14 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              ¿Listo para que tus redes publiquen con estos estilos todos los días?
            </h2>
            <p className="text-white/90 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Tú solo tomas la foto con tu celular y apruebas desde WhatsApp. Nuestros agentes se
              encargan del video, afiche, redacción y publicación automática.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/como-funciona"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black text-sm shadow-xl transition-all"
              >
                Ver cómo funciona
              </Link>
              <Link
                href="/#planes"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-black/40 hover:bg-black/60 text-white font-black text-sm border border-white/30 transition-all"
              >
                Ver planes y precios
              </Link>
              <a
                href={WA_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <FaWhatsapp className="text-base" /> Hablar por WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Modal de Detalle de Video */}
        {selectedVideoModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedVideoModal(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2"
                aria-label="Cerrar modal"
              >
                <FaTimes />
              </button>

              <div className="flex items-center gap-3">
                <span className="text-3xl p-3 rounded-2xl bg-orange-500/10 text-orange-400">
                  {selectedVideoModal.icon}
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                    {selectedVideoModal.category}
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    {selectedVideoModal.name}
                  </h3>
                </div>
              </div>

              {/* Video demo si existe */}
              {SAMPLE_VIDEOS[selectedVideoModal.command] && (
                <div className="aspect-[9/12] max-w-xs mx-auto rounded-2xl overflow-hidden bg-black border border-slate-800">
                  <video
                    src={SAMPLE_VIDEOS[selectedVideoModal.command].videoUrl}
                    poster={SAMPLE_VIDEOS[selectedVideoModal.command].posterUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-3 text-sm text-slate-300">
                <p>{selectedVideoModal.description}</p>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <p>
                    <strong className="text-orange-400">Movimiento de cámara:</strong>{" "}
                    {selectedVideoModal.cameraMovement}
                  </p>
                  <p>
                    <strong className="text-amber-400">Física &amp; Efectos:</strong>{" "}
                    {selectedVideoModal.physicsEffect}
                  </p>
                  <p>
                    <strong className="text-emerald-400">Iluminación:</strong>{" "}
                    {selectedVideoModal.lightingStyle}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedVideoModal(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold"
                >
                  Cerrar
                </button>
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2"
                >
                  <FaWhatsapp /> Solicitar este estilo
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
