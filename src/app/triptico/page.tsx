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
  FaTimes,
  FaGift,
  FaFilePdf,
  FaStore,
  FaSearch,
  FaEye,
  FaLinkedin,
  FaArrowRight,
  FaUserTie,
  FaExclamationTriangle,
  FaLock,
  FaPhoneAlt,
  FaGlobe,
} from "react-icons/fa";

const WA_NUMBER = "56934428848";

const WA_SETUP_MSG = encodeURIComponent(
  "¡Hola Santisoft! Leí el tríptico comercial y quiero reservar un cupo con el Setup Llave en Mano GRATIS para mi negocio."
);
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

const CONTAINER = "relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8";

export default function TripticoPitchPage() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen selection:bg-orange-500 selection:text-white bg-[#06080F] text-slate-100 print:bg-white print:text-slate-900">
      <PageTracker page="triptico" />
      <div className="print:hidden">
        <DotCanvas />
      </div>

      {/* Estilos dedicados para exportación en PDF / Impresión Editorial de 3 Páginas Nítidas */}
      <style jsx global>{`
        /* Eliminar padding y bordes por defecto que globals.css aplica a 'section' */
        .landing-page-root .triptico-block {
          padding: 0 !important;
          border-top: none !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 14mm 10mm 14mm;
          }

          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }

          body, html, .landing-page-root {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 9.5pt !important;
            line-height: 1.35 !important;
          }

          .print-hidden, .promo, .dot-canvas {
            display: none !important;
          }

          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-page-1,
          .print-page-2 {
            page-break-after: always !important;
            break-after: page !important;
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
          }

          .print-page-3 {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          /* Forzado de fondos limpios para PDF nítido (cero fondos oscuros empastados) */
          .print-clean-surface {
            background: #ffffff !important;
            border: 1.5px solid #cbd5e1 !important;
            border-radius: 12px !important;
            color: #0f172a !important;
            padding: 16px !important;
          }

          .print-title {
            color: #0f172a !important;
          }
          .print-subtitle {
            color: #334155 !important;
          }
          .print-muted {
            color: #64748b !important;
          }

          /* Tarjetas internas impresas */
          .print-box-pain {
            background-color: #fef2f2 !important;
            border: 1px solid #fecaca !important;
            color: #1e293b !important;
          }

          .print-box-engine {
            background-color: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            color: #1e293b !important;
          }

          .print-plan-box {
            background-color: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            color: #1e293b !important;
          }

          .print-plan-featured {
            background-color: #fffbeb !important;
            border: 2px solid #f97316 !important;
            color: #1e293b !important;
          }
        }
      `}</style>

      {/* Top Bar Promocional (Web) */}
      <div className="promo print:hidden">
        <span className="on-air"></span>
        DOSSIER COMERCIAL PYMES CHILE · SETUP LLAVE EN MANO GRATIS (SOLO 15 CUPOS DISPONIBLES)
      </div>

      <div className="print:hidden">
        <BrandHeader />
      </div>

      <main className="pb-20 print:pb-0 pt-3 sm:pt-4">
        {/* Barra de Herramientas Web (Dossier + Botones) */}
        <div className={`${CONTAINER} print:hidden mb-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Dossier Comercial 2026
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                Plataforma Santisoft
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all cursor-pointer hover:text-white"
                title="Descargar o imprimir PDF de alta calidad"
              >
                <FaFilePdf className="text-red-400 text-sm" /> Imprimir / Guardar PDF
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
        </div>

        {/* ══════════════════════════════════════════════════════════════
            CARA 1: EL DIAGNÓSTICO (El Dolor Real de la PyME)
            - En print: PÁGINA 1 COMPLETA Y NÍTIDA
        ══════════════════════════════════════════════════════════════ */}
        <div className={`${CONTAINER} triptico-block mb-8 sm:mb-12 print:mb-0 print-page-1`}>
          {/* Header Institucional Exclusivo para Print (Página 1) */}
          <div className="hidden print:flex items-center justify-between pb-3 mb-3 border-b-2 border-orange-500">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-orange-600 tracking-tight">SANTISOFT</span>
              <span className="text-xs text-slate-600 font-mono border-l border-slate-300 pl-3">
                Dossier Comercial 2026 · Solución Integral RRSS
              </span>
            </div>
            <div className="text-right text-xs text-slate-700 flex items-center gap-4 font-medium">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <FaWhatsapp /> +56 9 3442 8848
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <FaGlobe /> rrss.santisoft.cl
              </span>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-red-500/20 p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-2xl print-clean-surface">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none print:hidden" />

            <div className="max-w-3xl space-y-2.5 print:max-w-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 print:bg-red-50 print:border-red-300 print:text-red-700 text-xs font-black tracking-wider uppercase">
                <FaExclamationTriangle className="text-xs" />
                Cara 1 · Diagnóstico Comercial
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl print:text-2xl font-black text-white print-title leading-tight">
                Tu negocio es excelente en el mundo real... ¿pero tus redes sociales dicen lo mismo?
              </h1>
              <p className="text-sm sm:text-base print:text-xs text-slate-300 print-subtitle leading-relaxed">
                Hoy el boca a boca no basta: <strong>8 de cada 10 clientes buscan tu Instagram o web antes de cotizar</strong>. Si tus redes están pausadas o desordenadas, esas ventas se van directo a tu competencia.
              </p>
            </div>

            {/* Los 3 Bloques de Dolor */}
            <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4 print:gap-3 mt-6 print:mt-4">
              {/* Dolor 1: La Fuga de Clientes */}
              <div className="p-5 print:p-3.5 rounded-2xl bg-red-950/20 border border-red-900/30 print-box-pain flex flex-col justify-between space-y-3 print-avoid-break">
                <div>
                  <div className="w-9 h-9 print:w-7 print:h-7 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 print:bg-red-100 print:text-red-600 flex items-center justify-center font-black mb-2 text-base print:text-xs">
                    <FaStore />
                  </div>
                  <h3 className="text-base sm:text-lg print:text-sm font-black text-white print:text-red-950">
                    1. La Fuga Silenciosa de Clientes
                  </h3>
                  <p className="text-xs sm:text-sm print:text-[11px] text-slate-300 print:text-slate-800 mt-1.5 leading-relaxed">
                    Un perfil con publicaciones de hace 3 semanas o fotos improvisadas genera desconfianza inmediata en compradores de mayor ticket. Asumen que no estás activo y cotizan con el primero que vean al día.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-red-900/30 print:border-red-200 text-xs print:text-[10px] text-red-400 print:text-red-700 font-semibold flex items-center gap-1.5">
                  <FaTimes /> Pérdida de cotizaciones valiosas cada semana
                </div>
              </div>

              {/* Dolor 2: La Trampa de Hacerlo Tú Mismo */}
              <div className="p-5 print:p-3.5 rounded-2xl bg-red-950/20 border border-red-900/30 print-box-pain flex flex-col justify-between space-y-3 print-avoid-break">
                <div>
                  <div className="w-9 h-9 print:w-7 print:h-7 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 print:bg-red-100 print:text-red-600 flex items-center justify-center font-black mb-2 text-base print:text-xs">
                    <FaClock />
                  </div>
                  <h3 className="text-base sm:text-lg print:text-sm font-black text-white print:text-red-950">
                    2. La Trampa de &quot;Hacerlo Tú Mismo&quot;
                  </h3>
                  <p className="text-xs sm:text-sm print:text-[11px] text-slate-300 print:text-slate-800 mt-1.5 leading-relaxed">
                    Terminas agotado de atender ventas y operaciones. Perder tus noches o fines de semana peleando con plantillas de diseño desgasta tu energía y termina abandonándose a los 10 días por falta de tiempo.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-red-900/30 print:border-red-200 text-xs print:text-[10px] text-red-400 print:text-red-700 font-semibold flex items-center gap-1.5">
                  <FaTimes /> Desgaste personal y publicaciones irregulares
                </div>
              </div>

              {/* Dolor 3: Agencias Tradicionales Impagables */}
              <div className="p-5 print:p-3.5 rounded-2xl bg-red-950/20 border border-red-900/30 print-box-pain flex flex-col justify-between space-y-3 print-avoid-break">
                <div>
                  <div className="w-9 h-9 print:w-7 print:h-7 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 print:bg-red-100 print:text-red-600 flex items-center justify-center font-black mb-2 text-base print:text-xs">
                    <FaTimes />
                  </div>
                  <h3 className="text-base sm:text-lg print:text-sm font-black text-white print:text-red-950">
                    3. Agencias Tradicionales Impagables
                  </h3>
                  <p className="text-xs sm:text-sm print:text-[11px] text-slate-300 print:text-slate-800 mt-1.5 leading-relaxed">
                    Cobran entre <strong>$450.000 y $800.000 CLP/mes</strong> más contratos de amarre. Exigen reuniones interminables y entregan textos genéricos que no conocen tu rubro ni conectan con el cliente chileno.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-red-900/30 print:border-red-200 text-xs print:text-[10px] text-red-400 print:text-red-700 font-semibold flex items-center gap-1.5">
                  <FaTimes /> Costos fijos disparados y resultados lentos
                </div>
              </div>
            </div>

            {/* Pie de página exclusivo para impresión (Página 1) */}
            <div className="hidden print:flex items-center justify-between pt-4 mt-4 border-t border-slate-200 text-[10px] text-slate-500">
              <span>Santisoft Dossier Comercial · Página 1 de 3</span>
              <span>Continúa en Cara 2: La Solución en Piloto Automático →</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            CARA 2: LA SOLUCIÓN (4 Sueldos que te Ahorras) + DEMO EN VIVO
            - En print: PÁGINA 2 COMPLETA Y NÍTIDA
        ══════════════════════════════════════════════════════════════ */}
        <div className={`${CONTAINER} triptico-block mb-8 sm:mb-12 print:mb-0 print-page-2`}>
          {/* Header Institucional Exclusivo para Print (Página 2) */}
          <div className="hidden print:flex items-center justify-between pb-3 mb-3 border-b-2 border-orange-500">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-orange-600 tracking-tight">SANTISOFT</span>
              <span className="text-xs text-slate-600 font-mono border-l border-slate-300 pl-3">
                Cara 2 · Solución y Motores Operativos
              </span>
            </div>
            <div className="text-right text-xs text-slate-700 flex items-center gap-4 font-medium">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <FaWhatsapp /> +56 9 3442 8848
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <FaGlobe /> rrss.santisoft.cl
              </span>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900/70 border border-orange-500/30 p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-2xl print-clean-surface">
            <div className="text-center max-w-3xl mx-auto space-y-2 mb-6 print:mb-3 print:text-left print:max-w-none">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 print:bg-orange-50 print:border-orange-300 print:text-orange-700 text-xs font-black tracking-wider uppercase">
                Cara 2 · Tecnología en Piloto Automático
              </span>
              <h2 className="text-2xl sm:text-4xl print:text-2xl font-black text-white print-title leading-tight">
                El poder de un equipo de marketing de $600.000/mes, operando en 15 minutos a la semana
              </h2>
              <p className="text-slate-300 print-subtitle text-xs sm:text-base print:text-xs leading-relaxed">
                Nuestros agentes especializados asumen los 4 roles más caros de una agencia tradicional y dejan todo el mes de tu negocio resuelto con tu supervisión.
              </p>
            </div>

            {/* Los 4 Motores (Roles Reemplazados) */}
            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3">
              {/* Motor 1: Tu Redactor Experto */}
              <div className="p-5 print:p-3 rounded-2xl bg-slate-950/80 border border-slate-800 print-box-engine flex flex-col justify-between print-avoid-break">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-orange-400 print:text-orange-700 tracking-widest uppercase">
                      ROL 01 · TU REDACTOR EXPERTO
                    </span>
                    <span className="p-1.5 rounded-lg bg-orange-500/15 text-orange-400 print:bg-orange-100 print:text-orange-600 text-sm">
                      <FaUserTie />
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg print:text-sm font-bold text-white print-title mb-1">
                    Clonación de Voz de Marca (Cero Textos Robóticos)
                  </h3>
                  <p className="text-xs sm:text-sm print:text-[11px] text-slate-300 print:text-slate-800 leading-relaxed">
                    Nuestros agentes aprenden el vocabulario técnico, modismos y tono profesional de tu empresa en Chile. Redactan copys directos y persuasivos que suenan 100% humanos, orientados a que el cliente pregunte precios y pida cotizaciones.
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-slate-800 print:border-slate-200 text-xs print:text-[10px] text-emerald-400 print:text-emerald-700 font-semibold flex items-center gap-1.5">
                  <FaCheck /> Tu negocio habla con autoridad, cercanía y consistencia
                </div>
              </div>

              {/* Motor 2: Tu Diseñador y Guionista */}
              <div className="p-5 print:p-3 rounded-2xl bg-slate-950/80 border border-slate-800 print-box-engine flex flex-col justify-between print-avoid-break">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-blue-400 print:text-blue-700 tracking-widest uppercase">
                      ROL 02 · TU DISEÑADOR Y GUIONISTA
                    </span>
                    <span className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 print:bg-blue-100 print:text-blue-600 text-sm">
                      <FaVideo />
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg print:text-sm font-bold text-white print-title mb-1">
                    Gráficas con Marca + Guiones de Reels de 30s
                  </h3>
                  <p className="text-xs sm:text-sm print:text-[11px] text-slate-300 print:text-slate-800 leading-relaxed">
                    Cartelería comercial nítida con tus colores y logo corporativo. Además, recibes guiones estructurados con hook magnético de 3 segundos para grabarte con el celular sin titubear + Escudo Policía Anti-Baneos para proteger tu cuenta.
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-slate-800 print:border-slate-200 text-xs print:text-[10px] text-emerald-400 print:text-emerald-700 font-semibold flex items-center gap-1.5">
                  <FaCheck /> Formato vertical de alto impacto y cuenta 100% blindada
                </div>
              </div>

              {/* Motor 3: Tu Analista de Competencia */}
              <div className="p-5 print:p-3 rounded-2xl bg-slate-950/80 border border-slate-800 print-box-engine flex flex-col justify-between print-avoid-break">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 print:text-emerald-700 tracking-widest uppercase">
                      ROL 03 · TU ANALISTA DE COMPETENCIA
                    </span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 print:bg-emerald-100 print:text-emerald-600 text-sm">
                      <FaEye />
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg print:text-sm font-bold text-white print-title mb-1">
                    Radar Espía de Competencia + Anuncios Pagados
                  </h3>
                  <p className="text-xs sm:text-sm print:text-[11px] text-slate-300 print:text-slate-800 leading-relaxed">
                    Nuestros agentes monitorean qué anuncios y ofertas les están funcionando a tus competidores locales en Meta Ads y TikTok Ads. Te entregan copys y ángulos calibrados listos para cargar en campañas pagadas sin quemar presupuesto.
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-slate-800 print:border-slate-200 text-xs print:text-[10px] text-emerald-400 print:text-emerald-700 font-semibold flex items-center gap-1.5">
                  <FaCheck /> Copys de conversión listos para Meta Ads y Google Ads
                </div>
              </div>

              {/* Motor 4: Tu Posicionador Web */}
              <div className="p-5 print:p-3 rounded-2xl bg-slate-950/80 border border-slate-800 print-box-engine flex flex-col justify-between print-avoid-break">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-purple-400 print:text-purple-700 tracking-widest uppercase">
                      ROL 04 · TU POSICIONADOR WEB
                    </span>
                    <span className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 print:bg-purple-100 print:text-purple-600 text-sm flex items-center gap-1">
                      <FaSearch /> <FaLinkedin className="text-xs" />
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg print:text-sm font-bold text-white print-title mb-1">
                    Posicionamiento Web (SEO & Asistentes) + Red B2B
                  </h3>
                  <p className="text-xs sm:text-sm print:text-[11px] text-slate-300 print:text-slate-800 leading-relaxed">
                    Artículos de blog estructurados para que tu empresa aparezca recomendada cuando las personas buscan soluciones en Google o consultan a través de buscadores modernos. Incluye módulo de autoridad en LinkedIn para cerrar acuerdos B2B.
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-slate-800 print:border-slate-200 text-xs print:text-[10px] text-emerald-400 print:text-emerald-700 font-semibold flex items-center gap-1.5">
                  <FaCheck /> Máxima visibilidad orgánica para que los clientes te encuentren primero
                </div>
              </div>
            </div>

            {/* Banner Interactivo Web */}
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-sm font-bold text-white">
                  ¿Quieres ver exactamente cómo opera este flujo paso a paso?
                </p>
                <p className="text-xs text-slate-300">
                  Mira la demostración práctica de 3 pasos: Configuración, Planificación y Publicación asistida.
                </p>
              </div>
              <Link
                href="/como-funciona"
                className="shrink-0 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02]"
              >
                <span>Ver demostración en 3 pasos</span>
                <FaArrowRight className="text-xs" />
              </Link>
            </div>

            {/* Versión para Impresión del Enlace a Cómo Funciona */}
            <div className="hidden print:block mt-3 p-2.5 rounded-xl bg-orange-50 border border-orange-300 text-[11px] text-slate-800">
              <strong>Demostración disponible en línea:</strong> Descubre el flujo en 3 pasos (Configuración de Marca, Grilla Mensual y Publicación asistida) visitando <strong>rrss.santisoft.cl/como-funciona</strong>
            </div>

            {/* Pie de página exclusivo para impresión (Página 2) */}
            <div className="hidden print:flex items-center justify-between pt-3 mt-3 border-t border-slate-200 text-[10px] text-slate-500">
              <span>Santisoft Dossier Comercial · Página 2 de 3</span>
              <span>Continúa en Cara 3: Estructura de Planes y Cierre →</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            CARA 3: PLANES, BONO LLAVE EN MANO Y CIERRE COMERCIAL
            - En print: PÁGINA 3 COMPLETA Y NÍTIDA
        ══════════════════════════════════════════════════════════════ */}
        <div className={`${CONTAINER} triptico-block print-page-3`}>
          {/* Header Institucional Exclusivo para Print (Página 3) */}
          <div className="hidden print:flex items-center justify-between pb-3 mb-3 border-b-2 border-orange-500">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-orange-600 tracking-tight">SANTISOFT</span>
              <span className="text-xs text-slate-600 font-mono border-l border-slate-300 pl-3">
                Cara 3 · Planes de Inversión y Oferta Comercial
              </span>
            </div>
            <div className="text-right text-xs text-slate-700 flex items-center gap-4 font-medium">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <FaWhatsapp /> +56 9 3442 8848
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <FaGlobe /> rrss.santisoft.cl
              </span>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-2xl print-clean-surface">
            {/* Barra de Anclaje de Precios (Santisoft vs Agencia tradicional) */}
            <div className="max-w-3xl mx-auto mb-6 print:mb-3 p-3.5 print:p-2 rounded-2xl bg-slate-950/90 border border-slate-800 print:bg-slate-100 print:border-slate-300 text-center print-avoid-break">
              <p className="text-xs sm:text-sm print:text-xs font-semibold text-slate-300 print:text-slate-800 leading-relaxed">
                <span className="text-red-400 print:text-red-700 font-bold">❌ Agencia tradicional:</span> $500.000+/mes (con amarras a 6 meses){" "}
                <span className="text-slate-500 font-bold mx-2">vs.</span>{" "}
                <span className="text-emerald-400 print:text-emerald-700 font-bold">✅ SocialPilot by Santisoft:</span> Desde $59.990/mes (sin contratos forzados).
              </p>
            </div>

            <div className="text-center max-w-3xl mx-auto space-y-2 mb-6 print:mb-3 print:text-left print:max-w-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 print:bg-emerald-50 print:border-emerald-300 print:text-emerald-800 text-xs font-black tracking-wider uppercase">
                Cara 3 · Estructura Oficial de Planes (CLP + IVA)
              </div>
              <h2 className="text-2xl sm:text-4xl print:text-2xl font-black text-white print-title leading-tight">
                Elige cómo quieres activar tus redes en piloto automático
              </h2>
              <p className="text-slate-300 print-subtitle text-xs sm:text-base print:text-xs leading-relaxed">
                Precios transparentes en pesos chilenos. Sin letras chicas y con garantía de satisfacción.
              </p>
            </div>

            {/* Grid de 3 Planes */}
            <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4 print:gap-2.5 items-stretch">
              {/* Plan 1: Esencial */}
              <div className="p-5 print:p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 print-plan-box flex flex-col justify-between print-avoid-break">
                <div>
                  <span className="text-[11px] font-mono font-bold text-slate-400 print:text-slate-600 uppercase tracking-widest">
                    Presencia Activa
                  </span>
                  <h3 className="text-xl sm:text-2xl print:text-base font-black text-white print-title mt-0.5">
                    PyME Esencial
                  </h3>
                  <p className="text-xs print:text-[10px] text-slate-400 print:text-slate-600 mt-0.5">
                    Para negocios locales que necesitan presencia confiable sin perder tiempo.
                  </p>

                  <div className="my-4 print:my-2 pb-4 print:pb-2 border-b border-slate-800 print:border-slate-200">
                    <div className="text-xs print:text-[10px] text-slate-500 print:text-slate-500 line-through font-semibold mb-0.5">
                      $89.990 / mes
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl print:text-xl font-black text-white print-title">
                        $59.990
                      </span>
                      <span className="text-xs print:text-[10px] text-slate-400 print:text-slate-600 font-medium">
                        + IVA / mes
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2 print:space-y-1 text-xs print:text-[10px] text-slate-300 print:text-slate-800">
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-emerald-400 print:text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>1 Marca</strong> (Instagram + FB)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-emerald-400 print:text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Clonación de Voz:</strong> Tono real</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-emerald-400 print:text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Calendario:</strong> 15 posts mensuales</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-emerald-400 print:text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Gráficas:</strong> Hasta 15 diseños con logo</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-emerald-400 print:text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>8 Guiones Reels + Stories</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-emerald-400 print:text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Escudo Anti-Baneos</strong> Instagram</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-5 print:hidden">
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${WA_ESENCIAL_MSG}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm text-center block transition-all border border-slate-700"
                  >
                    Elegir Plan Esencial
                  </a>
                </div>
              </div>

              {/* Plan 2: Crecimiento (DESTACADO) */}
              <div className="p-6 print:p-2.5 rounded-3xl bg-gradient-to-b from-orange-950/40 via-slate-950 to-slate-950 border-2 border-orange-500 print-plan-featured relative flex flex-col justify-between shadow-2xl scale-[1.02] md:scale-105 print:scale-100 z-10 print-avoid-break">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 print:bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider py-0.5 px-3 rounded-full shadow-md whitespace-nowrap">
                  ★ MÁS ELEGIDO · SOLO 15 CUPOS
                </div>

                <div>
                  <span className="text-[11px] font-mono font-bold text-orange-400 print:text-orange-700 uppercase tracking-widest">
                    Máquina de Ventas
                  </span>
                  <h3 className="text-xl sm:text-2xl print:text-base font-black text-white print-title mt-0.5">
                    PyME Crecimiento
                  </h3>
                  <p className="text-xs print:text-[10px] text-orange-200/80 print:text-slate-700 mt-0.5">
                    Para captar clientes todos los días y ahorrar el gasto de agencia.
                  </p>

                  <div className="my-4 print:my-2 pb-4 print:pb-2 border-b border-orange-500/30 print:border-orange-300">
                    <div className="text-xs print:text-[10px] text-slate-400 print:text-slate-500 line-through font-semibold mb-0.5">
                      $149.990 / mes
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl print:text-xl font-black text-white print-title">
                        $99.990
                      </span>
                      <span className="text-xs print:text-[10px] text-slate-300 print:text-slate-700 font-medium">
                        + IVA / mes
                      </span>
                    </div>
                    {/* BONO DESTACADO */}
                    <div className="mt-2 p-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 print:bg-emerald-100 print:border-emerald-400 text-emerald-300 print:text-emerald-900 text-xs print:text-[9.5px] font-bold flex items-center gap-1.5">
                      <FaGift className="shrink-0 text-xs text-amber-400 print:text-orange-600" />
                      <span>BONO: Setup Llave en Mano GRATIS ($150.000 valor)</span>
                    </div>
                  </div>

                  <ul className="space-y-1.5 print:space-y-1 text-xs print:text-[10px] text-slate-200 print:text-slate-900">
                    <li className="flex items-start gap-1.5 font-semibold text-white print:text-slate-950">
                      <FaCheck className="text-orange-400 print:text-orange-600 mt-0.5 shrink-0" />
                      <span>Todo lo del Plan Esencial</span>
                    </li>
                    <li className="flex items-start gap-1.5 font-semibold text-white print:text-slate-950">
                      <FaCheck className="text-orange-400 print:text-orange-600 mt-0.5 shrink-0" />
                      <span><strong>Multicanal 30 días:</strong> IG, FB, TikTok y LinkedIn</span>
                    </li>
                    <li className="flex items-start gap-1.5 font-semibold text-white print:text-slate-950">
                      <FaCheck className="text-orange-400 print:text-orange-600 mt-0.5 shrink-0" />
                      <span><strong>Módulo LinkedIn B2B</strong> (12 posts/mes)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-orange-400 print:text-orange-600 mt-0.5 shrink-0" />
                      <span><strong>Espía de Competencia Activo</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-orange-400 print:text-orange-600 mt-0.5 shrink-0" />
                      <span><strong>Generador Anuncios Meta & Google</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-orange-400 print:text-orange-600 mt-0.5 shrink-0" />
                      <span><strong>SEO & Blog:</strong> Posición en Google</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-orange-400 print:text-orange-600 mt-0.5 shrink-0" />
                      <span><strong>Lead Magnets y Cierres WhatsApp</strong></span>
                    </li>
                  </ul>
                </div>

                <div className="mt-5 print:hidden">
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${WA_CRECIMIENTO_MSG}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm text-center block transition-all shadow-xl shadow-orange-500/30"
                  >
                    Asegurar Cupo con Setup Gratis
                  </a>
                </div>
              </div>

              {/* Plan 3: Piloto Automático VIP */}
              <div className="p-5 print:p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 print-plan-box flex flex-col justify-between print-avoid-break">
                <div>
                  <span className="text-[11px] font-mono font-bold text-slate-400 print:text-slate-600 uppercase tracking-widest">
                    Done-With-You (VIP)
                  </span>
                  <h3 className="text-xl sm:text-2xl print:text-base font-black text-white print-title mt-0.5">
                    Piloto Automático
                  </h3>
                  <p className="text-xs print:text-[10px] text-slate-400 print:text-slate-600 mt-0.5">
                    Un especialista opera la estrategia junto a ti.
                  </p>

                  <div className="my-4 print:my-2 pb-4 print:pb-2 border-b border-slate-800 print:border-slate-200">
                    <div className="text-xs print:text-[10px] text-slate-500 print:text-slate-500 line-through font-semibold mb-0.5">
                      $349.990 / mes
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl print:text-xl font-black text-white print-title">
                        $249.990
                      </span>
                      <span className="text-xs print:text-[10px] text-slate-400 print:text-slate-600 font-medium">
                        + IVA / mes
                      </span>
                    </div>
                    <div className="mt-2 p-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 print:bg-emerald-100 print:border-emerald-300 text-emerald-300 print:text-emerald-900 text-xs print:text-[9.5px] font-bold flex items-center gap-1.5">
                      <FaGift className="text-amber-400 print:text-emerald-700" /> SETUP INICIAL INCLUIDO
                    </div>
                  </div>

                  <ul className="space-y-1.5 print:space-y-1 text-xs print:text-[10px] text-slate-300 print:text-slate-800">
                    <li className="flex items-start gap-1.5 font-semibold text-white print:text-slate-950">
                      <FaCheck className="text-emerald-400 print:text-emerald-600 mt-0.5 shrink-0" />
                      <span>Todo Plan Crecimiento (hasta 60 posts)</span>
                    </li>
                    <li className="flex items-start gap-1.5 font-semibold text-white print:text-slate-950">
                      <FaCheck className="text-emerald-400 print:text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>2 Sesiones Ejecutivas Zoom/mes</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-emerald-400 print:text-emerald-600 mt-0.5 shrink-0" />
                      <span>Ajuste de campañas de Ads en vivo</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-emerald-400 print:text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Optimización Perfil LinkedIn Dueño</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-emerald-400 print:text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Auditoría Trimestral Web (CRO)</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaCheck className="text-emerald-400 print:text-emerald-600 mt-0.5 shrink-0" />
                      <span><strong>Soporte Prioritario VIP 1 a 1</strong></span>
                    </li>
                  </ul>
                </div>

                <div className="mt-5 print:hidden">
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${WA_PILOTO_MSG}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm text-center block transition-all border border-slate-700"
                  >
                    Postular a Piloto Automático
                  </a>
                </div>
              </div>
            </div>

            {/* Garantía Cero Riesgo */}
            <div className="mt-6 print:mt-2.5 p-4 print:p-2.5 rounded-2xl bg-slate-950 border border-emerald-500/30 print:bg-emerald-50 print:border-emerald-300 max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left print-avoid-break">
              <div className="w-10 h-10 print:w-7 print:h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 print:bg-emerald-100 print:text-emerald-700 flex items-center justify-center text-lg print:text-xs shrink-0">
                <FaShieldAlt />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white print:text-emerald-950 flex items-center justify-center sm:justify-start gap-1.5">
                  <FaLock className="text-emerald-400 print:text-emerald-600 text-xs" />
                  Garantía Cero Riesgo de 7 Días
                </h4>
                <p className="text-xs print:text-[10px] text-slate-300 print:text-slate-800 leading-relaxed">
                  Si durante tus primeros 7 días sientes que el sistema no te ahorra al menos <strong>10 horas de trabajo al mes</strong>, te devolvemos el <strong>100% de tu dinero sin preguntas</strong>. Sin letras chicas ni contratos de amarre.
                </p>
              </div>
            </div>

            {/* SECCIÓN DE CIERRE (WEB) */}
            <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 text-center space-y-4 shadow-2xl print:hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur">
                <FaGift /> Opciones de Cierre Comercial Inmediato
              </div>
              <h3 className="text-xl sm:text-3xl font-black text-white leading-tight">
                Elige tu siguiente paso hoy mismo
              </h3>
              <p className="text-white/95 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                Asegura tu cupo con la configuración guiada gratuita o solicita una prueba personalizada sin compromiso para ver la calidad de tus publicaciones antes de pagar.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${WA_SETUP_MSG}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 border border-white/20"
                >
                  <FaWhatsapp className="text-emerald-400 text-base" />
                  <span>Reservar Cupo con Setup Llave en Mano Gratis</span>
                </a>
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${WA_GIFT_MSG}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <FaGift className="text-amber-200 text-sm" />
                  <span>Pedir 3 posts de prueba gratis por WhatsApp</span>
                </a>
              </div>
            </div>

            {/* SECCIÓN DE CONTACTO EXCLUSIVA PARA IMPRESIÓN / PDF (Página 3) */}
            <div className="hidden print:block mt-3 p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 print-avoid-break">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Contacto Directo para Activar tu Cuenta:</h4>
                  <p className="text-[10px] text-slate-600">
                    Escríbenos por WhatsApp para reservar tu cupo con Setup Llave en Mano Gratis o solicitar 3 posts de prueba sin costo.
                  </p>
                </div>
                <div className="text-right text-[11px] font-bold text-emerald-800">
                  <div className="flex items-center gap-1 justify-end"><FaPhoneAlt /> +56 9 3442 8848</div>
                  <div className="text-slate-600 text-[10px] font-normal">rrss.santisoft.cl</div>
                </div>
              </div>
            </div>

            {/* Pie de página final de impresión */}
            <div className="hidden print:flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-200 text-[9px] text-slate-500">
              <span>Santisoft Dossier Comercial · Página 3 de 3 · Precios en CLP netos (+ IVA)</span>
              <span>Garantía de Satisfacción 7 Días</span>
            </div>
          </div>
        </div>
      </main>

      {/* Barra de acción fija en móvil */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 p-3 flex items-center gap-2 print:hidden">
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${WA_SETUP_MSG}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs text-center flex items-center justify-center gap-2 shadow-md"
        >
          <FaGift /> Reservar Setup Gratis
        </a>
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${WA_GIFT_MSG}`}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp 3 posts gratis"
          className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0 shadow-md"
          title="Pedir 3 posts gratis"
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
