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
  FaArrowRight,
  FaUserTie,
  FaExclamationTriangle,
  FaLock,
} from "react-icons/fa";

const WA_NUMBER = "56965909543";

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
        DOSSIER COMERCIAL PYMES CHILE · SETUP LLAVE EN MANO GRATIS (SOLO 15 CUPOS DISPONIBLES)
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
                Dossier Comercial 2026
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
            CARA 1: EL DIAGNÓSTICO (El Dolor Real de la PyME)
        ══════════════════════════════════════════════════════════════ */}
        <section className={`${SECTION} py-12 sm:py-16`}>
          <div className="rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-red-500/20 p-6 sm:p-10 md:p-14 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black tracking-wider uppercase">
                <FaExclamationTriangle className="text-xs" />
                Cara 1 · Diagnóstico Comercial
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
                Tu negocio es excelente en el mundo real... ¿pero tus redes sociales dicen lo mismo?
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Hoy el boca a boca no basta: <strong>8 de cada 10 clientes buscan tu Instagram o web antes de cotizar</strong>. Si tus redes están pausadas o desordenadas, esas ventas se van directo a tu competencia.
              </p>
            </div>

            {/* Los 3 Bloques de Dolor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {/* Dolor 1: La Fuga de Clientes */}
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/30 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center font-black mb-3 text-lg">
                    <FaStore />
                  </div>
                  <h3 className="text-lg font-black text-white">1. La Fuga Silenciosa de Clientes</h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    Un perfil con publicaciones de hace 3 semanas o fotos improvisadas genera desconfianza inmediata en compradores de mayor ticket. Asumen que no estás activo y cotizan con el primero que vean al día.
                  </p>
                </div>
                <div className="pt-3 border-t border-red-900/30 text-xs text-red-400 font-semibold flex items-center gap-1.5">
                  <FaTimes /> Pérdida de cotizaciones valiosas cada semana
                </div>
              </div>

              {/* Dolor 2: La Trampa de Hacerlo Tú Mismo */}
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/30 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center font-black mb-3 text-lg">
                    <FaClock />
                  </div>
                  <h3 className="text-lg font-black text-white">2. La Trampa de &quot;Hacerlo Tú Mismo&quot;</h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    Terminas agotado de atender ventas y operaciones. Perder tus noches o fines de semana peleando con plantillas de diseño desgasta tu energía y termina abandonándose a los 10 días por falta de tiempo.
                  </p>
                </div>
                <div className="pt-3 border-t border-red-900/30 text-xs text-red-400 font-semibold flex items-center gap-1.5">
                  <FaTimes /> Desgaste personal y publicaciones irregulares
                </div>
              </div>

              {/* Dolor 3: Agencias Tradicionales Impagables */}
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/30 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center font-black mb-3 text-lg">
                    <FaTimes />
                  </div>
                  <h3 className="text-lg font-black text-white">3. Agencias Tradicionales Impagables</h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    Cobran entre <strong>$450.000 y $800.000 CLP/mes</strong> más contratos de amarre. Exigen reuniones interminables y entregan textos genéricos que no conocen tu rubro ni conectan con el cliente chileno.
                  </p>
                </div>
                <div className="pt-3 border-t border-red-900/30 text-xs text-red-400 font-semibold flex items-center gap-1.5">
                  <FaTimes /> Costos fijos disparados y resultados lentos
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CARA 2: LA SOLUCIÓN (4 Sueldos que te Ahorras) + DEMO EN VIVO
        ══════════════════════════════════════════════════════════════ */}
        <section className={`${SECTION} py-8 sm:py-12`}>
          <div className="rounded-3xl bg-slate-900/70 border border-orange-500/30 p-6 sm:p-10 md:p-14 relative overflow-hidden shadow-2xl">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black tracking-wider uppercase">
                Cara 2 · Tecnología en Piloto Automático
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                El poder de un equipo de marketing de $600.000/mes, operando en 15 minutos a la semana
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Nuestros agentes especializados asumen los 4 roles más caros de una agencia tradicional y dejan todo el mes de tu negocio resuelto con tu supervisión.
              </p>
            </div>

            {/* Los 4 Motores (Roles Reemplazados) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Motor 1: Tu Redactor Experto (Clonación de Voz) */}
              <div className="p-7 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-orange-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-orange-400 tracking-widest uppercase">
                      ROL 01 · TU REDACTOR EXPERTO
                    </span>
                    <span className="p-2 rounded-xl bg-orange-500/15 text-orange-400 text-lg">
                      <FaUserTie />
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Clonación de Voz de Marca (Cero Textos Robóticos)
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Nuestros agentes aprenden el vocabulario técnico, modismos y tono profesional de tu empresa en Chile. Redactan copys directos y persuasivos que suenan 100% humanos, orientados a que el cliente pregunte precios y pida cotizaciones.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FaCheck /> Tu negocio habla con autoridad, cercanía y consistencia
                </div>
              </div>

              {/* Motor 2: Tu Diseñador y Guionista */}
              <div className="p-7 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-blue-400 tracking-widest uppercase">
                      ROL 02 · TU DISEÑADOR Y GUIONISTA
                    </span>
                    <span className="p-2 rounded-xl bg-blue-500/15 text-blue-400 text-lg">
                      <FaVideo />
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Gráficas con Marca + Guiones de Reels de 30 Segundos
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Cartelería comercial nítida con tus colores y logo corporativo. Además, recibes guiones estructurados con hook magnético de 3 segundos para que te grabes con el celular sin titubear + Escudo Policía Anti-Baneos para proteger el alcance de tu Instagram.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FaCheck /> Formato vertical de alto impacto y cuenta 100% blindada
                </div>
              </div>

              {/* Motor 3: Tu Analista de Competencia */}
              <div className="p-7 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest uppercase">
                      ROL 03 · TU ANALISTA DE COMPETENCIA
                    </span>
                    <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-lg flex items-center gap-1">
                      <FaEye />
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Radar Espía de Competencia + Anuncios Pagados
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Nuestros agentes monitorean qué anuncios y ofertas les están funcionando a tus competidores locales en Meta Ads y TikTok Ads. Te entregan copys y ángulos calibrados listos para cargar en campañas pagadas sin quemar presupuesto.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FaCheck /> Copys de conversión listos para Meta Ads y Google Ads
                </div>
              </div>

              {/* Motor 4: Tu Posicionador Web */}
              <div className="p-7 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-purple-400 tracking-widest uppercase">
                      ROL 04 · TU POSICIONADOR WEB
                    </span>
                    <span className="p-2 rounded-xl bg-purple-500/15 text-purple-400 text-lg flex items-center gap-1">
                      <FaSearch /> <FaLinkedin className="text-xs text-blue-400" />
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Posicionamiento Web (SEO & Asistentes) + Red B2B
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Artículos de blog estructurados para que tu empresa aparezca recomendada cuando las personas buscan soluciones en Google o consultan a través de buscadores modernos. Incluye módulo de autoridad en LinkedIn para cerrar acuerdos B2B.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <FaCheck /> Máxima visibilidad orgánica para que los clientes te encuentren primero
                </div>
              </div>
            </div>

            {/* BOTÓN DESTACADO DE NAVEGACIÓN A CÓMO FUNCIONA (CRÍTICO) */}
            <div className="mt-10 p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
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
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CARA 3: PLANES, BONO LLAVE EN MANO Y CIERRE COMERCIAL
        ══════════════════════════════════════════════════════════════ */}
        <section className={`${SECTION} py-8 sm:py-16`}>
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 p-6 sm:p-10 md:p-14 relative overflow-hidden shadow-2xl">
            {/* Barra de Anclaje de Precios */}
            <div className="max-w-3xl mx-auto mb-10 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-center">
              <p className="text-xs sm:text-sm font-semibold text-slate-300 leading-relaxed">
                <span className="text-red-400 font-bold">❌ Agencia tradicional:</span> $500.000+/mes (con amarras a 6 meses) <span className="text-slate-500 font-bold mx-2">vs.</span> <span className="text-emerald-400 font-bold">✅ RRSS-Auto:</span> Desde $59.990/mes (sin contratos forzados).
              </p>
            </div>

            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wider uppercase">
                Cara 3 · Estructura Oficial de Planes (CLP + IVA)
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                Elige cómo quieres activar tus redes en piloto automático
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Precios transparentes en pesos chilenos. Sin letras chicas y con garantía de satisfacción.
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
                    Para negocios locales y profesionales que necesitan redes activas, confiables y sin bloqueos sin perder tiempo.
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
                      <span><strong>Clonación de Voz de Marca:</strong> Textos con el tono real de tu negocio, cero robóticos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>Calendario Hiper-Orgánico:</strong> 15 publicaciones estratégicas al mes (valor, autoridad y venta)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>Generador de Gráficas:</strong> Hasta 15 diseños mensuales listos con tu logo y colores</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>8 Guiones de Reels + Stories:</strong> Listos para leer en 30 segundos frente al celular</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>Escudo Policía Anti-Baneos:</strong> Protección automática contra shadowbans en Instagram</span>
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
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-black uppercase tracking-wider py-1 px-4 rounded-full shadow-md whitespace-nowrap">
                  ★ MÁS ELEGIDO · SOLO 15 CUPOS
                </div>

                <div>
                  <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-widest">
                    Máquina de Ventas
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">PyME Crecimiento</h3>
                  <p className="text-xs text-orange-200/80 mt-1">
                    Para PyMEs que buscan captar clientes todos los días y ahorrar el gasto de una agencia tradicional.
                  </p>

                  <div className="my-6 pb-6 border-b border-orange-500/30">
                    <div className="text-xs text-slate-400 line-through font-semibold mb-1">
                      $149.990 / mes
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-white">$99.990</span>
                      <span className="text-xs text-slate-300 font-medium">+ IVA / mes</span>
                    </div>
                    {/* BONO DESTACADO */}
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <FaGift className="shrink-0 text-sm text-amber-400" />
                      <span>BONO: Setup Llave en Mano GRATIS ($150.000 valor) en videollamada de 25 min</span>
                    </div>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                    <li className="flex items-start gap-2 font-semibold text-white">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span>Todo lo incluido en el Plan Esencial</span>
                    </li>
                    <li className="flex items-start gap-2 font-semibold text-white">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span><strong>Multicanal Completo (30 días):</strong> Instagram, Facebook, TikTok y LinkedIn</span>
                    </li>
                    <li className="flex items-start gap-2 font-semibold text-white">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span><strong>Módulo Autoridad LinkedIn:</strong> 12 posts para cerrar ventas B2B</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span><strong>Espía de Competencia:</strong> Qué anuncios y copies le funcionan a tu rubro</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span><strong>Generador de Anuncios:</strong> Textos calibrados para Meta y Google Ads</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-orange-400 mt-1 shrink-0" />
                      <span><strong>SEO & Artículos de Blog:</strong> Para salir en Google y buscadores</span>
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
                    Para dueños y gerentes sin tiempo que prefieren que un especialista opere la estrategia junto a ellos.
                  </p>

                  <div className="my-6 pb-6 border-b border-slate-800">
                    <div className="text-xs text-slate-500 line-through font-semibold mb-1">
                      $349.990 / mes
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-white">$249.990</span>
                      <span className="text-xs text-slate-400 font-medium">+ IVA / mes</span>
                    </div>
                    <div className="mt-3 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                      <FaGift className="text-amber-400" /> SETUP INICIAL LLAVE EN MANO GRATIS
                    </div>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-start gap-2 font-semibold text-white">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span>Todo lo del Plan Crecimiento (hasta 60 posts y 60 guiones)</span>
                    </li>
                    <li className="flex items-start gap-2 font-semibold text-white">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>2 Sesiones Ejecutivas al Mes (Zoom 20 min)</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span>Configuración y ajuste de campañas de publicidad en vivo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>Optimización Perfil LinkedIn del Dueño</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>Auditoría Trimestral de Conversión Web (CRO)</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="text-emerald-400 mt-1 shrink-0" />
                      <span><strong>Soporte Prioritario VIP 1 a 1</strong> por WhatsApp</span>
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
                <h4 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                  <FaLock className="text-emerald-400 text-xs" />
                  Garantía Cero Riesgo de 7 Días
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Si durante tus primeros 7 días sientes que el sistema no te ahorra al menos <strong>10 horas de trabajo al mes</strong>, te devolvemos el <strong>100% de tu dinero sin preguntas</strong>. Sin letras chicas ni contratos de amarre.
                </p>
              </div>
            </div>

            {/* SECCIÓN DE CIERRE CON LOS 2 CTAS PRINCIPALES DE WHATSAPP */}
            <div className="mt-12 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-700 text-center space-y-6 shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur">
                <FaGift /> Opciones de Cierre Comercial Inmediato
              </div>
              <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                Elige tu siguiente paso hoy mismo
              </h3>
              <p className="text-white/95 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Asegura tu cupo con la configuración guiada gratuita o solicita una prueba personalizada sin compromiso para ver la calidad de tus publicaciones antes de pagar.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                {/* Botón 1: Principal - Setup Llave en Mano Gratis */}
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${WA_SETUP_MSG}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm shadow-2xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 border border-white/20"
                >
                  <FaWhatsapp className="text-emerald-400 text-lg" />
                  <span>Reservar Cupo con Setup Llave en Mano Gratis</span>
                </a>

                {/* Botón 2: Secundario - 3 Posts de Prueba Gratis */}
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${WA_GIFT_MSG}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm shadow-2xl shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <FaGift className="text-amber-200 text-base" />
                  <span>Pedir 3 posts de prueba gratis por WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </section>
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
