"use client";

import Link from "next/link";
import BrandHeader from "../../components/BrandHeader";
import BrandFooter from "../../components/BrandFooter";
import DotCanvas from "../../components/DotCanvas";
import PageTracker from "../../components/PageTracker";
import {
  FaWhatsapp,
  FaCheck,
  FaClock,
  FaShieldAlt,
  FaVideo,
  FaImage,
  FaTimes,
  FaGift,
  FaFilePdf,
  FaStore,
  FaSearch,
  FaEye,
  FaLinkedin,
} from "react-icons/fa";

const WA_NUMBER = "56965909543";

const WA_GIFT_MSG = encodeURIComponent(
  "¡Hola Santisoft! Leí el tríptico comercial y quiero recibir los 3 posts de prueba gratis creados para mi negocio por WhatsApp."
);
const WA_ESENCIAL_MSG = encodeURIComponent(
  "¡Hola Santisoft! Quiero activar el Plan PyME Esencial ($59.990 CLP + IVA/mes) para mi negocio."
);
const WA_CRECIMIENTO_MSG = encodeURIComponent(
  "¡Hola Santisoft! Quiero asegurar uno de los 15 cupos del Plan PyME Crecimiento ($99.990 CLP + IVA) con Setup Llave en Mano GRATIS."
);
const WA_PILOTO_MSG = encodeURIComponent(
  "¡Hola Santisoft! Me interesa el Plan PyME Piloto Automático VIP ($249.990 CLP + IVA) con acompañamiento Done-With-You."
);

const SECTION = "relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8";

export default function TripticoPitchPage() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen selection:bg-orange-500 selection:text-white bg-[#06080F] text-slate-100">
      <PageTracker page="triptico" />
      <DotCanvas />

      {/* Top Bar Promocional */}
      <div className="promo print:hidden">
        <span className="on-air"></span>
        TRÍPTICO COMERCIAL PARA PYMES EN CHILE · SETUP LLAVE EN MANO GRATIS (SOLO 15 CUPOS)
      </div>

      <div className="print:hidden">
        <BrandHeader />
      </div>

      <main className="pb-24 print:pb-0 pt-6 sm:pt-10">
        {/* Encabezado y botón de imprimir/guardar PDF */}
        <section className={SECTION}>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Dossier Ejecutivo 2026
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                Solución RRSS-Auto by Santisoft
              </span>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all cursor-pointer"
                title="Imprimir o guardar en PDF"
              >
                <FaFilePdf className="text-red-400" /> Imprimir / PDF
              </button>
              <a
                href={`https://wa.me/${WA_NUMBER}?text=${WA_GIFT_MSG}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
              >
                <FaWhatsapp className="text-sm" /> Hablar por WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CARA 1: EL DOLOR CRÓNICO DE LA PYME EN REDES
        ══════════════════════════════════════════════════════════════ */}
        <section className={`${SECTION} py-12 sm:py-16`}>
          <div className="rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-red-500/20 p-6 sm:p-10 md:p-14 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black tracking-wider uppercase">
                Bloque 01 · El Diagnóstico Comercial
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
                ¿Cuántos clientes pierde tu PyME cada semana por tener las redes sociales abandonadas?
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                El <strong>78% de los chilenos</strong> entra al Instagram de un negocio antes de cotizar o comprar. Si encuentran publicaciones de hace dos meses o fotos sueltas sin precios ni llamados claros, asumen que el negocio cerró o no es confiable y se van con tu competencia.
              </p>
            </div>

            {/* Los 3 Dolores Crónicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {/* Dolor 1 */}
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/30 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center font-black mb-3">
                    <FaClock />
                  </div>
                  <h3 className="text-lg font-black text-white">1. Falta de Tiempo Crónica</h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    Terminas agotado de atender clientes, proveedores y operaciones. Pierdes <strong>+15 horas al mes</strong> pensando qué publicar y lo último que quieres hacer un domingo a las 10 PM es pelear con Canva.
                  </p>
                </div>
                <div className="pt-3 border-t border-red-900/30 text-xs text-red-400 font-semibold flex items-center gap-1.5">
                  <FaTimes /> Redes abandonadas a la segunda semana
                </div>
              </div>

              {/* Dolor 2 */}
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/30 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center font-black mb-3">
                    <FaTimes />
                  </div>
                  <h3 className="text-lg font-black text-white">2. Agencias Impagables</h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    Una agencia tradicional te cobra entre <strong>$450.000 y $800.000 CLP/mes</strong> por reuniones lentas y 8 posts genéricos redactados por personas que no entienden tu rubro ni tu calle, con contratos largos amarrados.
                  </p>
                </div>
                <div className="pt-3 border-t border-red-900/30 text-xs text-red-400 font-semibold flex items-center gap-1.5">
                  <FaTimes /> Alto costo mensual y cero flexibilidad
                </div>
              </div>

              {/* Dolor 3 */}
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/30 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center font-black mb-3">
                    <FaStore />
                  </div>
                  <h3 className="text-lg font-black text-white">3. Publicar a Ciegas Sin Vender</h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    Subir fotos sueltas de vez en cuando sin estrategia de precios ni llamadas a la acción directas genera cero mensajes en tu WhatsApp. Mucho esfuerzo para ningún retorno.
                  </p>
                </div>
                <div className="pt-3 border-t border-red-900/30 text-xs text-red-400 font-semibold flex items-center gap-1.5">
                  <FaTimes /> Cero consultas comerciales efectivas
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CARA 2: LA SOLUCIÓN TODO-EN-UNO (LOS 4 MOTORES DE RRSS-AUTO)
        ══════════════════════════════════════════════════════════════ */}
        <section className={`${SECTION} py-8 sm:py-12`}>
          <div className="rounded-3xl bg-slate-900/70 border border-orange-500/30 p-6 sm:p-10 md:p-14 relative overflow-hidden shadow-2xl">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black tracking-wider uppercase">
                Bloque 02 · La Solución Integral
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                4 Motores que Reemplazan a una Agencia Completa
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Nuestros agentes se encargan de toda la cadena: desde el espía de competencia y la clonación de tu voz, hasta el diseño publicitario, guiones de Reels y posicionamiento SEO.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Motor 1 */}
              <div className="p-7 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-orange-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-orange-400 tracking-widest uppercase">
                      MOTOR 01
                    </span>
                    <span className="p-2 rounded-xl bg-orange-500/15 text-orange-400 text-lg">
                      <FaImage />
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Gráficas y Carruseles con tu Marca
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Cartelería comercial nítida estampada directamente sobre tus fotos reales o imágenes de catálogo. Con tus colores corporativos, logo, badges de oferta y precios visibles sin tapar lo que vendes. Cero plantillas genéricas.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FaCheck /> Tu producto o servicio queda impecable
                </div>
              </div>

              {/* Motor 2 */}
              <div className="p-7 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-blue-400 tracking-widest uppercase">
                      MOTOR 02
                    </span>
                    <span className="p-2 rounded-xl bg-blue-500/15 text-blue-400 text-lg">
                      <FaVideo />
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Guiones de Reels e Historias (30 seg)
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Estructura probada para video vertical: Hook magnético de 3 segundos, desarrollo dinámico y llamada a la acción hacia WhatsApp. Te entregamos el texto listo para leer frente a la cámara en 30 segundos, sin trabarte ni improvisar.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FaCheck /> Alto alcance orgánico en Instagram y TikTok
                </div>
              </div>

              {/* Motor 3 */}
              <div className="p-7 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest uppercase">
                      MOTOR 03
                    </span>
                    <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-lg flex items-center gap-1">
                      <FaShieldAlt /> <FaEye className="text-xs text-amber-400" />
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Calendario Hiper-Orgánico + Espía + Policía Anti-Baneos
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Estrategia mensual con horarios óptimos en Chile. Analiza qué anuncios le dan resultados a tus competidores y audita automáticamente tus hashtags y textos para evitar shadowbans y castigos algorítmicos en Instagram.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FaCheck /> Cuenta protegida y ventaja competitiva
                </div>
              </div>

              {/* Motor 4 */}
              <div className="p-7 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-purple-400 tracking-widest uppercase">
                      MOTOR 04
                    </span>
                    <span className="p-2 rounded-xl bg-purple-500/15 text-purple-400 text-lg flex items-center gap-1">
                      <FaSearch /> <FaLinkedin className="text-xs text-blue-400" />
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Posicionamiento SEO & GEO y Venta Directa
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Textos persuasivos con redacción humana &quot;tú a tú&quot; y llamados claros hacia tu WhatsApp. Artículos de blog optimizados para salir recomendado en Google y ChatGPT, más módulo de autoridad en LinkedIn para cerrar negocios B2B.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FaCheck /> De seguidor a cliente cotizando por WhatsApp
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CARA 3: LA OFERTA DE LANZAMIENTO Y ACCIÓN INMEDIATA
        ══════════════════════════════════════════════════════════════ */}
        <section className={`${SECTION} py-8 sm:py-16`}>
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 p-6 sm:p-10 md:p-14 relative overflow-hidden shadow-2xl">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wider uppercase">
                Bloque 03 · Nueva Estructura Oficial de Planes (CLP + IVA)
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                Elige cómo quieres poner tus redes en piloto automático
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Precios claros, sin contratos forzados ni letras chicas. Cancela con 1 clic cuando quieras.
              </p>
            </div>

            {/* Grid de 3 Planes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Plan 1: Esencial */}
              <div className="p-7 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Presencia Activa
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">PyME Esencial</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Para negocios locales y profesionales que necesitan redes activas y confiables sin perder tiempo.
                  </p>

                  <div className="my-6 pb-6 border-b border-slate-800">
                    <div className="text-xs text-slate-500 line-through font-semibold mb-1">
                      $89.990 / mes
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-white">$59.990</span>
                      <span className="text-xs text-slate-400 font-medium">+ IVA / mes</span>
                    </div>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>1 Marca configurada</strong> (Instagram + Facebook)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>Clonación de Voz + Humanizador IA</strong>: cero textos robóticos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>15 publicaciones estratégicas al mes</strong> (valor, autoridad y venta)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>Hasta 15 gráficas y carruseles</strong> con tu logo y colores</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>8 Guiones de Reels + Stories</strong> listos para leer en 30 seg</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>Escudo Policía Anti-Baneos</strong> de Instagram</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${WA_ESENCIAL_MSG}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm text-center block transition-all border border-slate-700"
                  >
                    Elegir Plan Esencial
                  </a>
                </div>
              </div>

              {/* Plan 2: Crecimiento (DESTACADO) */}
              <div className="p-8 rounded-3xl bg-gradient-to-b from-orange-950/40 via-slate-950 to-slate-950 border-2 border-orange-500 relative flex flex-col justify-between shadow-2xl scale-[1.02] md:scale-105 z-10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-black uppercase tracking-wider py-1 px-4 rounded-full shadow-md">
                  ★ MÁS ELEGIDO · SOLO 15 CUPOS
                </div>

                <div>
                  <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-widest">
                    Máquina de Ventas
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">PyME Crecimiento</h3>
                  <p className="text-xs text-orange-200/80 mt-1">
                    Para PyMEs que buscan captar clientes todos los días y ahorrar los $450.000+ de una agencia.
                  </p>

                  <div className="my-6 pb-6 border-b border-orange-500/30">
                    <div className="text-xs text-slate-400 line-through font-semibold mb-1">
                      $149.990 / mes
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-white">$99.990</span>
                      <span className="text-xs text-slate-300 font-medium">+ IVA / mes</span>
                    </div>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      <FaGift /> SETUP LLAVE EN MANO GRATIS ($150.000 valor)
                    </div>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                    <li className="flex items-start gap-2 font-semibold text-white">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span>Todo lo incluido en el Plan Esencial</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span><strong>Multicanal Ilimitado (30 días)</strong>: Instagram, FB y TikTok</span>
                    </li>
                    <li className="flex items-start gap-2 font-semibold text-white">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span><strong>Módulo Autoridad en LinkedIn</strong> para ventas B2B</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span><strong>Espía de Competencia Activo</strong>: qué le funciona a tu rubro</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span><strong>Pack Publicidad Lista</strong> (Meta & Google Ads)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span><strong>SEO + GEO</strong>: recomendado en Google y ChatGPT</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span><strong>Lead Magnets y secuencias de cierre</strong> por WhatsApp</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${WA_CRECIMIENTO_MSG}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm text-center block transition-all shadow-xl shadow-orange-500/30"
                  >
                    Asegurar Cupo con Setup Gratis
                  </a>
                </div>
              </div>

              {/* Plan 3: Piloto Automático VIP */}
              <div className="p-7 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Done-With-You (VIP)
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">Piloto Automático</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Para dueños y gerentes sin tiempo que prefieren que nuestro equipo opere el sistema junto a ellos.
                  </p>

                  <div className="my-6 pb-6 border-b border-slate-800">
                    <div className="text-xs text-slate-500 line-through font-semibold mb-1">
                      $349.990 / mes
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-white">$249.990</span>
                      <span className="text-xs text-slate-400 font-medium">+ IVA / mes</span>
                    </div>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                      <FaGift /> SETUP INICIAL GRATIS
                    </div>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-start gap-2 font-semibold text-white">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span>Todo el Plan Crecimiento Ilimitado incluido</span>
                    </li>
                    <li className="flex items-start gap-2 font-semibold text-white">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>2 Sesiones Ejecutivas al Mes (Zoom 20 min)</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span>Ejecutamos espía, campañas y programamos en vivo contigo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>Optimización Perfil LinkedIn del Dueño</strong> + Casos de Éxito</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>Auditoría Trimestral de Conversión Web (CRO)</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>Soporte Prioritario VIP</strong> directo por WhatsApp</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8">
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${WA_PILOTO_MSG}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm text-center block transition-all border border-slate-700"
                  >
                    Postular a Piloto Automático
                  </a>
                </div>
              </div>
            </div>

            {/* Garantía Cero Riesgo */}
            <div className="mt-12 p-6 rounded-2xl bg-slate-950 border border-emerald-500/30 max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl shrink-0">
                <FaShieldAlt />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  Garantía Cero Riesgo de 7 Días
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Si en tu primera semana sientes que el sistema no te ahorra al menos <strong>10 horas de trabajo al mes</strong>, te devolvemos el <strong>100% de tu dinero sin preguntas</strong>. Sin contratos de amarre.
                </p>
              </div>
            </div>

            {/* Gran Llamado a la Acción - Caballo de Troya (3 posts gratis) */}
            <div className="mt-12 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 text-center space-y-6 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur">
                <FaGift /> Prueba sin pagar nada
              </div>
              <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                ¿Prefieres ver el resultado antes de decidir?
              </h3>
              <p className="text-white/95 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Escríbenos el nombre de tu negocio y te enviaremos <strong>3 publicaciones reales personalizadas</strong> con la voz y colores de tu marca directo a tu WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${WA_GIFT_MSG}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-base shadow-2xl shadow-emerald-950/40 transition-all flex items-center justify-center gap-3 hover:-translate-y-0.5"
                >
                  <FaWhatsapp className="text-xl" />
                  <span>Quiero recibir 3 posts de prueba gratis creados para mi negocio</span>
                </a>
                <Link
                  href="/como-funciona"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-black/40 hover:bg-black/60 text-white font-bold text-sm border border-white/30 transition-all text-center"
                >
                  Ver Cómo Funciona
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Barra de acción fija en móvil */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 p-3 flex items-center gap-2 print:hidden">
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${WA_GIFT_MSG}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs text-center flex items-center justify-center gap-2 shadow-md"
        >
          <FaGift /> Pedir 3 posts gratis
        </a>
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${WA_CRECIMIENTO_MSG}`}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0 shadow-md"
        >
          <FaWhatsapp />
        </a>
      </div>

      <div className="print:hidden">
        <BrandFooter />
      </div>
    </div>
  );
}
