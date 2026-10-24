"use client";

import Link from "next/link";
import { useState } from "react";
import { FaCheck, FaWhatsapp, FaShieldAlt, FaRocket, FaGift } from "react-icons/fa";

const WA_NUMBER = "56934428848";

interface PyMEPlan {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  originalPriceMonthly: number;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  isFeatured?: boolean;
  ctaText: string;
  ctaHref: string;
  features: string[];
  bonusText?: string;
}

const PYME_PLANS: PyMEPlan[] = [
  {
    id: "pyme-esencial",
    name: "Plan PyME Esencial",
    tagline: "PRESENCIA ACTIVA · CERO BLOQUEOS",
    originalPriceMonthly: 89990,
    priceMonthly: 59990,
    priceAnnual: 53990,
    description: "Ideal para negocios locales y profesionales que necesitan redes activas, confiables y con contenido profesional sin perder tiempo.",
    isFeatured: false,
    ctaText: "Elegir Plan Esencial ($59.990)",
    ctaHref: `https://wa.me/${WA_NUMBER}?text=%C2%A1Hola!%20Quiero%20activar%20el%20Plan%20PyME%20Esencial%20de%20SocialPilot%20by%20Santisoft%20(%2459.990%20CLP%20%2B%20IVA%2Fmes)%20para%20mi%20negocio.%20Mi%20empresa%20es%3A%20`,
    features: [
      "1 Marca configurada (Instagram + Facebook)",
      "Clonación de Voz de Marca + Humanizador: Textos con el tono real de tu negocio, cero robóticos",
      "Calendario Hiper-Orgánico Mensual: 15 publicaciones estratégicas al mes (valor, autoridad y venta)",
      "Generador de Gráficas y Carruseles: Hasta 15 diseños mensuales listos con tu logo y colores corporativos",
      "8 Guiones de Reels + Secuencias de Stories listos para leer en 30 segundos frente al celular",
      "Escudo Policía Anti-Baneos: Protección automática contra shadowbans y bloqueos de alcance en Instagram",
      "Aprobación y control móvil directo desde WhatsApp",
      "Soporte directo por WhatsApp de lunes a viernes",
    ],
  },
  {
    id: "pyme-crecimiento",
    name: "Plan PyME Crecimiento",
    tagline: "MÁQUINA DE VENTAS · MÁS ELEGIDO",
    badge: "🔥 MÁS ELEGIDO · SOLO 15 CUPOS",
    originalPriceMonthly: 149990,
    priceMonthly: 99990,
    priceAnnual: 89990,
    description: "Para PyMEs establecidas que buscan captar clientes todos los días, superar a su competencia y ahorrar los $450.000+ que cobra una agencia.",
    isFeatured: true,
    bonusText: "🎁 BONO EXCLUSIVO (Solo 15 cupos): Setup 'Llave en Mano' GRATIS (Valor real $150.000 CLP) — Nosotros configuramos tu marca, extraemos tu voz desde tu web y dejamos tu primera quincena andando en una videollamada de 25 minutos.",
    ctaText: "Asegurar Cupo Crecimiento con Setup Gratis ($99.990)",
    ctaHref: `https://wa.me/${WA_NUMBER}?text=%C2%A1Hola!%20Quiero%20asegurar%20uno%20de%20los%2015%20cupos%20del%20Plan%20PyME%20Crecimiento%20de%20SocialPilot%20by%20Santisoft%20(%2499.990%20CLP%20%2B%20IVA)%20con%20Setup%20Llave%20en%20Mano%20Gratis.%20Mi%20negocio%20es%3A%20`,
    features: [
      "Todo lo incluido en el Plan Esencial",
      "Multicanal Ilimitado (30 días): Instagram, Facebook, TikTok",
      "Módulo de Autoridad en LinkedIn para ventas y captación B2B",
      "Espía de Competencia Activo: Analiza qué anuncios y publicaciones le dan resultado a tus competidores",
      "Pack Publicidad Lista (Meta & Google Ads): Textos persuasivos y creativos listos para campañas pagadas",
      "Posicionamiento en Google e IAs (SEO + GEO): Artículos de blog para que tu PyME aparezca recomendada en Google y ChatGPT",
      "Generador de Lead Magnets y Secuencias de Cierre por WhatsApp",
      "Atención prioritaria VIP por WhatsApp",
    ],
  },
  {
    id: "pyme-piloto-automatico",
    name: "Plan PyME Piloto Automático",
    tagline: "DONE-WITH-YOU · SERVICIO VIP",
    badge: "⚡ SETUP INICIAL GRATIS",
    originalPriceMonthly: 349990,
    priceMonthly: 249990,
    priceAnnual: 224990,
    description: "Para dueños de empresas y gerentes sin tiempo que quieren todo el poder del sistema pero prefieren que nuestro equipo lo opere junto a ellos.",
    isFeatured: false,
    bonusText: "🤝 SERVICIO DONE-WITH-YOU: 2 sesiones ejecutivas al mes (20 min por Zoom) para generar las campañas, revisar métricas y dejar todo programado en vivo.",
    ctaText: "Postular a Piloto Automático ($249.990)",
    ctaHref: `https://wa.me/${WA_NUMBER}?text=%C2%A1Hola!%20Me%20interesa%20el%20Plan%20PyME%20Piloto%20Autom%C3%A1tico%20VIP%20de%20SocialPilot%20by%20Santisoft%20(%24249.990%20CLP%20%2B%20IVA)%20con%20acompa%C3%B1amiento%20Done-With-You.%20Mi%20empresa%20es%3A%20`,
    features: [
      "Todo el Plan Crecimiento Ilimitado incluido",
      "2 Sesiones Ejecutivas al Mes (20 min por Zoom): Ejecutamos el espía de competencia, generamos campañas y programamos todo el mes en vivo",
      "Optimización de Perfil de LinkedIn del Dueño + Casos de Éxito para cerrar negocios de mayor ticket",
      "Auditoría Trimestral de Conversión Web (CRO): Optimizamos tu web para que las visitas de redes compren",
      "Soporte Prioritario Directo por WhatsApp con tu estratega dedicado",
      "Monitoreo continuo de reputación y optimización de anuncios",
    ],
  },
];

export default function PricingPlans() {
  const [billingCycle, setBillingCycle] = useState<"mensual" | "anual">("mensual");

  return (
    <div className="space-y-12">
      {/* Toggle Facturación Mensual / Anual */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3" data-reveal>
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
          <button
            onClick={() => setBillingCycle("mensual")}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              billingCycle === "mensual"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Suscripción Mensual
          </button>
          <button
            onClick={() => setBillingCycle("anual")}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              billingCycle === "anual"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Facturación Anual <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">-10% OFF</span>
          </button>
        </div>
      </div>

      {/* Grid de 3 Planes para PyMEs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto" data-reveal>
        {PYME_PLANS.map((plan) => {
          const currentPrice = billingCycle === "anual" ? plan.priceAnnual : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 shadow-2xl ${
                plan.isFeatured
                  ? "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-orange-500 shadow-orange-500/20 lg:-translate-y-2"
                  : "bg-slate-900/80 border border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Badge Destacado */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-orange-400">
                    {plan.tagline}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">{plan.name}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>
                </div>

                {/* Precio */}
                <div className="py-4 border-y border-slate-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 line-through font-semibold">
                      ${plan.originalPriceMonthly.toLocaleString("es-CL")} / mes
                    </span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Precio Oferta
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      ${currentPrice.toLocaleString("es-CL")}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">CLP + IVA / mes</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-medium">
                    {billingCycle === "anual"
                      ? "Facturado anualmente con 10% de descuento incluido"
                      : "Suscripción mes a mes · Cero contratos de permanencia"}
                  </div>
                </div>

                {/* Bono destacado */}
                {plan.bonusText && (
                  <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-200 font-semibold leading-relaxed">
                    {plan.bonusText}
                  </div>
                )}

                {/* Lista de Features */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Qué incluye tu plan:
                  </span>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="text-emerald-400 font-bold mt-0.5 shrink-0">
                          <FaCheck className="text-[10px]" />
                        </span>
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Botón CTA del Plan */}
              <div className="pt-8 mt-6 border-t border-slate-800/80">
                {plan.ctaHref.startsWith("http") ? (
                  <a
                    href={plan.ctaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl text-center ${
                      plan.isFeatured
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/30 hover:-translate-y-0.5"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    }`}
                  >
                    <FaWhatsapp className="text-base" /> {plan.ctaText}
                  </a>
                ) : (
                  <Link
                    href={plan.ctaHref}
                    className={`w-full py-4 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl text-center ${
                      plan.isFeatured
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/30 hover:-translate-y-0.5"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    }`}
                  >
                    <FaRocket className="text-xs" /> {plan.ctaText}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🛡️ Garantía Cero Riesgo de 7 Días */}
      <div
        className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-xl shadow-emerald-500/10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left"
        data-reveal
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl shrink-0">
          <FaShieldAlt />
        </div>
        <div className="space-y-1.5 flex-1">
          <h4 className="text-base sm:text-lg font-black text-white">
            Garantía Cero Riesgo de 7 Días
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Si en tu primera semana sientes que el sistema no te ahorra al menos <strong>10 horas de trabajo al mes</strong> o
            no quedas 100% satisfecho, te devolvemos el <strong>100% de tu dinero sin preguntas</strong>. Sin contratos de amarre.
          </p>
        </div>
        <a
          href={`https://wa.me/${WA_NUMBER}?text=%C2%A1Hola!%20Quiero%20hacer%20una%20consulta%20antes%20de%20contratar%20un%20plan%20de%20SocialPilot%20by%20Santisoft.`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition-all shadow"
        >
          Consultar por WhatsApp
        </a>
      </div>

      {/* Banner Corporativo / Planes a la Medida */}
      <div
        className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left"
        data-reveal
      >
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
            ¿Manejas más marcas o eres una agencia?
          </span>
          <h4 className="text-base sm:text-lg font-black text-white">
            Planes a la medida para agencias y franquicias con múltiples sucursales
          </h4>
          <p className="text-xs text-slate-400">
            Habilitamos cuentas multi-marca con límites ampliados y tarifas especiales por volumen.
          </p>
        </div>
        <a
          href={`https://wa.me/${WA_NUMBER}?text=%C2%A1Hola!%20Represento%20a%20una%20agencia%2Ffranquicia%20y%20necesito%20un%20plan%20a%20la%20medida%20de%20SocialPilot%20by%20Santisoft.`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 shrink-0 transition-all"
        >
          Cotizar Plan Agencia ➔
        </a>
      </div>
    </div>
  );
}
