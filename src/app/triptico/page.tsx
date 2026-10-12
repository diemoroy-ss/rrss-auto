"use client";

import { useState } from "react";
import Link from "next/link";
import BrandHeader from "../../components/BrandHeader";
import BrandFooter from "../../components/BrandFooter";
import DotCanvas from "../../components/DotCanvas";
import {
  FaPlay,
  FaQrcode,
  FaVideo,
  FaImage,
  FaWhatsapp,
  FaCheck,
  FaArrowRight,
  FaFire,
  FaMobileAlt,
  FaDownload,
  FaCopy,
  FaTimes,
  FaEye,
  FaStar,
  FaBolt,
  FaRegCheckCircle
} from "react-icons/fa";

export default function TripticoSalesPage() {
  // Pestaña activa del tríptico (1: Portada/Dolor, 2: Los 3 Motores, 3: Contraportada/Acción)
  const [activeFold, setActiveFold] = useState<number>(2);

  // Modo de visualización: "desplegado" (3 paneles continuos) vs "hojear" (paso a paso)
  const [viewMode, setViewMode] = useState<"hojear" | "desplegado">("desplegado");

  // Demo interactiva del Motor 1: Video
  const [videoBeforeAfter, setVideoBeforeAfter] = useState<"foto" | "video">("video");

  // Demo interactiva del Motor 2: Afiche
  const [posterMode, setPosterMode] = useState<"con_texto" | "sin_texto">("con_texto");

  // Demo interactiva del Motor 3: Menú QR
  const [demoStoreName, setDemoStoreName] = useState<string>("Mi Negocio");
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  // Prompt de Google Flow sugerido para el usuario
  const sampleFlowCommand = "/smoke reveal";
  const sampleFlowPrompt =
    "Cinematic commercial 9:16 vertical video of a gourmet double artisan burger with melting cheddar cheese. Slow cinematic push-in dolly forward. A warm, dense cloud of barbecue smoke rolls over the surface and parts dramatically in slow motion, revealing sizzling beef texture and glistening glaze. Premium warm studio key lighting with volumetric rim glow. Hyper-realistic, 60fps, 4K commercial aesthetic.";

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(`${sampleFlowCommand}\n\n${sampleFlowPrompt}`);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative selection:bg-indigo-500 selection:text-white">
      <DotCanvas />
      <BrandHeader />

      {/* ── BANNER SUPERIOR DE IMPACTO ── */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-indigo-600 text-white text-xs font-black py-2 px-4 text-center tracking-wider uppercase flex items-center justify-center gap-2 relative z-20">
        <FaBolt className="text-yellow-200" />
        <span>Resumen Ejecutivo &amp; Tríptico Comercial de Santisoft</span>
        <span className="hidden sm:inline bg-black/30 px-2 py-0.5 rounded text-[10px]">Actualizado 2026</span>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
        {/* ── ENCABEZADO PRINCIPAL DE LA LANDING ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>El Ecosistema Comercial para tu Negocio</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Deja de publicar fotos aburridas.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-indigo-400">
              Vende en automático.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Una suite completa donde <strong>nuestros agentes</strong> convierten una sola foto de tu producto en un spot de video cinemático, afiches publicitarios con ofertas reales y tu carta digital interactiva con código QR.
          </p>

          {/* Selector de modo de tríptico */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-2xl flex items-center gap-1 shadow-xl">
              <button
                type="button"
                onClick={() => setViewMode("desplegado")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "desplegado"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Tríptico Completo (3 Paneles)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("hojear")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "hojear"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Hojear por Paneles
              </button>
            </div>

            {viewMode === "hojear" && (
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveFold(1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFold === 1 ? "bg-orange-600 text-white" : "text-slate-400"
                  }`}
                >
                  1. Portada &amp; Dolor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFold(2)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFold === 2 ? "bg-indigo-600 text-white" : "text-slate-400"
                  }`}
                >
                  2. Los 3 Motores
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFold(3)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFold === 3 ? "bg-emerald-600 text-white" : "text-slate-400"
                  }`}
                >
                  3. Acción Inmediata
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── CUERPO DEL TRÍPTICO DE VENTAS ── */}
        <div
          className={`grid gap-6 lg:gap-8 transition-all ${
            viewMode === "desplegado"
              ? "grid-cols-1 lg:grid-cols-3 items-stretch"
              : "grid-cols-1 max-w-4xl mx-auto"
          }`}
        >
          {/* ========================================================================= */}
          {/* PANEL 1: LA PORTADA & EL DIAGNÓSTICO (EL DOLOR DEL DUEÑO DE NEGOCIO)      */}
          {/* ========================================================================= */}
          {(viewMode === "desplegado" || activeFold === 1) && (
            <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 rounded-3xl p-6 sm:p-8 border border-orange-500/30 shadow-2xl relative flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                    Panel 1 · Diagnóstico
                  </span>
                  <span className="text-slate-500 text-xs font-mono">Tríptico Frontal</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white leading-tight">
                    ¿Por qué las publicaciones tradicionales ya no venden?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Tus clientes deciden si comprarte en los primeros 2 segundos de scroll. Si tu contenido es frío y tu carta está desactualizada, pierdes ventas cada día.
                  </p>
                </div>

                {/* Los 3 Dolores Clásicos */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-900/30 space-y-1">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                      <FaTimes className="text-[10px]" />
                      <span>Agencias lentas y costosas</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Cobran $300.000 a $500.000 al mes por plantillas repetitivas de Canva y se demoran días en publicar una simple promoción.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-900/30 space-y-1">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                      <FaTimes className="text-[10px]" />
                      <span>Fotos caseras sin impacto comercial</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Subes fotos con fondo apagado, sin precios, sin titulares atractivos y sin llamados a la acción claros.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-900/30 space-y-1">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                      <FaTimes className="text-[10px]" />
                      <span>Cartas de papel y PDFs incómodos</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Imprimir cartas sale caro y los PDFs pesados obligan al cliente a hacer zoom en el celular, perdiendo el apetito.
                    </p>
                  </div>
                </div>

                {/* La Promesa del Ecosistema */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 text-orange-200 text-xs space-y-1.5">
                  <span className="font-black text-white block">La solución de Santisoft:</span>
                  <p className="text-[11px] text-orange-200/90 leading-relaxed">
                    Con solo tomar fotos con tu teléfono, nuestros agentes montan tus videos cinemáticos, tus afiches publicitarios y tu carta QR con pedidos en tiempo récord.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-bold">Sin contratos forzosos</span>
                <span className="text-orange-400 font-black text-xs">100% Piloto Automático</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PANEL 2: EL INTERIOR DESPLEGADO (LOS 3 MOTORES DE VENTA)                 */}
          {/* ========================================================================= */}
          {(viewMode === "desplegado" || activeFold === 2) && (
            <div className="bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 rounded-3xl p-6 sm:p-8 border border-indigo-500/40 shadow-2xl relative flex flex-col justify-between overflow-hidden ring-2 ring-indigo-500/20">
              <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12"></div>

              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between border-b border-indigo-900/50 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30 flex items-center gap-1.5">
                    <FaBolt className="text-indigo-400" />
                    Panel 2 · El Ecosistema
                  </span>
                  <span className="text-indigo-300 text-xs font-mono font-bold">3 Motores de Venta</span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white leading-tight">
                    3 Soluciones Integradas en una Sola Plataforma
                  </h3>
                  <p className="text-xs text-indigo-200/80 mt-1">
                    Todo lo que necesita tu negocio para atraer, cautivar y cerrar pedidos todos los días.
                  </p>
                </div>

                {/* ── MOTOR 1: VIDEOS CINEMÁTICOS (FLOW & VEO 3.1) ── */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400 text-sm">
                        <FaVideo />
                      </span>
                      <div>
                        <h4 className="font-black text-white text-xs">
                          1. Videos Cinemáticos de Producto
                        </h4>
                        <span className="text-[10px] text-slate-400">Google Flow &amp; Veo 3.1 + Remotion</span>
                      </div>
                    </div>

                    <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setVideoBeforeAfter("foto")}
                        className={`px-2 py-0.5 rounded ${
                          videoBeforeAfter === "foto" ? "bg-slate-800 text-white font-bold" : "text-slate-500"
                        }`}
                      >
                        Foto Base
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoBeforeAfter("video")}
                        className={`px-2 py-0.5 rounded ${
                          videoBeforeAfter === "video" ? "bg-indigo-600 text-white font-bold" : "text-slate-500"
                        }`}
                      >
                        Video
                      </button>
                    </div>
                  </div>

                  {/* Previsualizador Before/After */}
                  <div className="h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative flex items-center justify-center">
                    {videoBeforeAfter === "foto" ? (
                      <div className="w-full h-full relative">
                        <img
                          src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
                          alt="Foto producto simple"
                          className="w-full h-full object-cover filter grayscale-20 brightness-90"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] text-slate-300 font-bold">
                          Foto estática en reposo
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                        <img
                          src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80"
                          alt="Video cinemático animado"
                          className="w-full h-full object-cover scale-105 animate-pulse"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
                        <div className="absolute top-2 right-2 bg-indigo-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                          <FaPlay className="text-[7px]" /> /smoke reveal + Logo HD
                        </div>
                        <div className="absolute bottom-2 left-2 text-[10px] text-white font-bold drop-shadow">
                          Animado con vapor caliente y cámara lenta
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Efectos físicos como humo de parrilla, fuego, salpicaduras de agua y giros en 360°, con tu logo oficial superpuesto con nitidez.
                  </p>
                </div>

                {/* ── MOTOR 2: AFICHES COMERCIALES CON TIPOGRAFÍA ── */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 text-sm">
                        <FaImage />
                      </span>
                      <div>
                        <h4 className="font-black text-white text-xs">
                          2. Afiches Comerciales con Tipografía
                        </h4>
                        <span className="text-[10px] text-slate-400">Jerarquía visual en 2 niveles</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPosterMode(posterMode === "con_texto" ? "sin_texto" : "con_texto")}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline"
                    >
                      {posterMode === "con_texto" ? "Ver sin texto" : "Ver con cartel"}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-800 relative">
                      <img
                        src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80"
                        alt="Comida apetitosa"
                        className="w-full h-full object-cover"
                      />
                      {posterMode === "con_texto" && (
                        <div className="absolute top-0 inset-x-0 bg-amber-500 text-slate-950 text-[7px] font-black text-center py-0.5">
                          OFERTA -25%
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                        {posterMode === "con_texto" ? "Cartel de Venta Directa" : "Fotografía Limpia"}
                      </span>
                      <p className="text-[11px] font-bold text-white truncate">
                        {posterMode === "con_texto"
                          ? "COSTILLAS BBQ + PAPAS RÚSTICAS"
                          : "Costillas asadas a fuego lento"}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {posterMode === "con_texto"
                          ? "Titular en mayúsculas, precio destacado y botón hacia WhatsApp."
                          : "Fotografía estética ideal para el feed de marca."}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    El producto se mantiene 100% visible y apetitoso abajo, mientras la cabecera lleva el precio y la oferta para incentivar la compra inmediata.
                  </p>
                </div>

                {/* ── MOTOR 3: CARTA & MENÚ QR INTERACTIVO ── */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm">
                        <FaQrcode />
                      </span>
                      <div>
                        <h4 className="font-black text-white text-xs">
                          3. Carta &amp; Menú QR Interactivo
                        </h4>
                        <span className="text-[10px] text-slate-400">Punto de venta y pedidos a WhatsApp</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Listo para imprimir
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                            "https://rrss.santisoft.cl/menu/demo"
                          )}`}
                          alt="Código QR"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <input
                          type="text"
                          value={demoStoreName}
                          onChange={(e) => setDemoStoreName(e.target.value)}
                          placeholder="Tu Negocio"
                          className="bg-transparent font-bold text-white text-xs border-b border-slate-700 focus:outline-none focus:border-indigo-500 max-w-[140px]"
                        />
                        <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <FaMobileAlt /> Pedidos directo a WhatsApp
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/menu/demo-burgers"
                      target="_blank"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold flex items-center gap-1"
                    >
                      <FaEye /> Probar
                    </Link>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Pon el código QR en tus mesas, vitrinas o volantes. El cliente escanea, ve fotos reales con precios y te envía su pedido al WhatsApp con un toque.
                  </p>
                </div>
              </div>

              {/* Banda conectora */}
              <div className="pt-6 border-t border-indigo-900/50 mt-6 flex flex-wrap items-center justify-between gap-2 text-[11px] text-indigo-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <FaWhatsapp className="text-emerald-400 text-sm" /> Aprueba publicaciones desde WhatsApp
                </span>
                <span className="font-semibold text-slate-400">Publica en IG, FB, TT, YT y X</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PANEL 3: LA CONTRAPORTADA & LA ACCIÓN (PRUEBA RÁPIDA SIN RIESGO)         */}
          {/* ========================================================================= */}
          {(viewMode === "desplegado" || activeFold === 3) && (
            <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl relative flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Panel 3 · Acción Rápida
                  </span>
                  <span className="text-slate-500 text-xs font-mono">Sin Riesgo</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white leading-tight">
                    Comprueba cómo luce tu marca en 60 segundos
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    No necesitas pagar ni registrar tarjetas para ver la transformación. Nuestros agentes generan una muestra comercial gratuita adaptada a tu rubro.
                  </p>
                </div>

                {/* Lo que recibes en tu muestra */}
                <div className="space-y-2.5 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                  <span className="font-bold text-white text-xs block mb-2">Tu Muestra Gratuita Incluye:</span>

                  <div className="flex items-start gap-2 text-slate-300 text-xs">
                    <FaRegCheckCircle className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>3 propuestas de posts comerciales adaptadas a tu negocio.</span>
                  </div>

                  <div className="flex items-start gap-2 text-slate-300 text-xs">
                    <FaRegCheckCircle className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>Elección entre afiches de venta directa o fotografías limpias.</span>
                  </div>

                  <div className="flex items-start gap-2 text-slate-300 text-xs">
                    <FaRegCheckCircle className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>Demostración de menú QR interactivo con tus productos.</span>
                  </div>

                  <div className="flex items-start gap-2 text-slate-300 text-xs">
                    <FaRegCheckCircle className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>Simulación interactiva del Bot de WhatsApp para aprobar contenido.</span>
                  </div>
                </div>

                {/* Llamados a la acción directos */}
                <div className="space-y-3 pt-2">
                  <Link
                    href="/como-funciona#showroom-form"
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-600 hover:from-orange-600 hover:to-indigo-700 text-white font-black text-sm text-center flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Solicitar Mi Muestra Gratis Ahora</span>
                    <FaArrowRight className="text-xs" />
                  </Link>

                  <a
                    href="https://wa.me/56930825301?text=Hola!%20Vi%20el%20tríptico%20de%20Santisoft%20y%20quiero%20ver%20una%20demostración%20para%20mi%20negocio."
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 font-bold text-xs text-center flex items-center justify-center gap-2 transition-all"
                  >
                    <FaWhatsapp className="text-base text-emerald-400" />
                    <span>Hablar con un Asesor por WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between text-[11px] text-slate-500">
                <span>Activación en menos de 24 horas</span>
                <span className="text-emerald-400 font-bold">Sin tarjeta de crédito</span>
              </div>
            </div>
          )}
        </div>

        {/* ── SECCIÓN PROPUESTA DE VIDEO CON GOOGLE FLOW ── */}
        <section className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-10 border border-indigo-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold">
                <FaFire className="text-orange-400" />
                <span>Propuesta de Video para el Sitio</span>
              </div>
              <h3 className="text-2xl font-black text-white">
                El Spot Cinemático que Deberíamos Subir al Sitio
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Para dejar al visitante sin palabras en el hero, este es el video que puedes generar directamente en Google Flow Labs y Veo 3.1 para exhibirlo como prueba reina.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyPrompt}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shrink-0 transition-all"
            >
              {copiedPrompt ? <FaCheck className="text-emerald-300" /> : <FaCopy />}
              <span>{copiedPrompt ? "¡Copiado al portapapeles!" : "Copiar Comando y Prompt"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Visualización del concepto */}
            <div className="lg:col-span-5 bg-black rounded-2xl overflow-hidden border border-indigo-500/30 shadow-2xl aspect-[9/16] max-h-[380px] mx-auto relative group">
              <img
                src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80"
                alt="Hamburguesa de impacto comercial"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-orange-600 text-white font-mono font-black text-xs shadow">
                    /smoke reveal
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold">
                    Veo 3.1 4K
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <FaStar /> Spot Publicitario Vertical 9:16
                  </div>
                  <p className="text-white font-bold text-xs leading-tight">
                    De foto simple a commercial de alta gastronomía con vapor y slow-motion.
                  </p>
                </div>
              </div>
            </div>

            {/* Ficha técnica y prompt */}
            <div className="lg:col-span-7 space-y-4 text-xs">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">
                    Comando de Google Flow:
                  </span>
                  <span className="bg-indigo-950 px-2 py-0.5 rounded text-indigo-400 font-mono font-bold">
                    {sampleFlowCommand}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Activa la física de disipación de vapor caliente de parrilla, desenfoque cinemático y aproximación lenta de cámara (dolly-in).
                </p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-300 uppercase tracking-wider text-[11px] block">
                  Prompt Físico de 6 Capas para Veo 3.1:
                </span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed select-all">
                  {sampleFlowPrompt}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 text-[11px] flex items-start gap-2.5">
                <FaRegCheckCircle className="text-indigo-400 mt-0.5 shrink-0 text-sm" />
                <p>
                  <strong>Toque final con Remotion:</strong> Una vez renderizado el MP4 en Flow o Veo, nuestro motor superpone tu logo oficial en la esquina superior derecha con sombra suave para que quede como un anuncio de televisión listo para pauta publicitaria.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CUADRO COMPARATIVO: SANTISOFT VS AGENCIA TRADICIONAL ── */}
        <section className="bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              ¿Por qué las empresas eligen a nuestros agentes?
            </h3>
            <p className="text-xs text-slate-400">
              Comparativa transparente frente a los métodos tradicionales del mercado.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-4 font-bold">Característica</th>
                  <th className="py-3 px-4 font-bold text-red-400">Agencia Tradicional / Freelancer</th>
                  <th className="py-3 px-4 font-black text-emerald-400 bg-emerald-950/20 rounded-t-xl">
                    Santisoft con Nuestros Agentes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-white">Costo Mensual</td>
                  <td className="py-3.5 px-4 text-slate-400">$350.000 a $600.000 + IVA</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-300 bg-emerald-950/20">
                    Desde una fracción del costo (sin contratos)
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-white">Tiempo de Publicación</td>
                  <td className="py-3.5 px-4 text-slate-400">3 a 5 días para aprobar un post</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-300 bg-emerald-950/20">
                    Segundos desde tu WhatsApp
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-white">Videos de Producto</td>
                  <td className="py-3.5 px-4 text-slate-400">Cobran extra por cada video ($80.000+)</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-300 bg-emerald-950/20">
                    Animaciones cinemáticas con Veo 3.1 y logo incluidas
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-white">Carta &amp; Menú QR</td>
                  <td className="py-3.5 px-4 text-slate-400">No lo hacen o cobran software aparte</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-300 bg-emerald-950/20">
                    Menú interactivo con pedidos a WhatsApp incluido
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-white">Control Operativo</td>
                  <td className="py-3.5 px-4 text-slate-400">Reuniones largas y correos perdidos</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-300 bg-emerald-950/20">
                    Apruebas o pides ajustes con 1 mensaje de WhatsApp
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── BANNER FINAL DE CONVERSIÓN ── */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-center text-white space-y-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Lleva tu negocio al siguiente nivel visual hoy mismo.
            </h2>
            <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
              Descubre en vivo cómo lucen tus productos convertidos en videos de alto impacto, afiches comerciales y un menú digital listo para vender.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/como-funciona"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black text-xs shadow-xl transition-all"
              >
                Ver Showroom y Muestra Gratuita
              </Link>
              <a
                href="https://wa.me/56930825301?text=Hola!%20Quiero%20activar%20la%20demostración%20comercial%20de%20Santisoft%20para%20mi%20marca."
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-black/40 hover:bg-black/60 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all"
              >
                <FaWhatsapp className="text-emerald-400 text-sm" />
                <span>Hablar por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
