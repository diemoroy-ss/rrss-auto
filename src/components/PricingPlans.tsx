"use client";

import Link from "next/link";
import { useState } from "react";
import { FaCheck, FaWhatsapp, FaShieldAlt, FaStar, FaBolt, FaRocket } from "react-icons/fa";

const WA_NUMBER = "56965909543";

interface PyMEPlan {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
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
    id: "pyme-pro",
    name: "Plan PyME Pro",
    tagline: "AUTOGESTIONADO · 100% CONTROL",
    priceMonthly: 39990,
    priceAnnual: 35990,
    description: "Ideal para emprendedores y dueños que quieren tener su mes de contenido listo en minutos con el software.",
    isFeatured: false,
    ctaText: "Elegir PyME Pro ($39.990)",
    ctaHref: `/confirmar-plan?plan=pro&billing=mensual`,
    features: [
      "Calendario mensual hiper-orgánico en 5 minutos",
      "Generador de gráficas y carruseles con tu marca y logo",
      "Guiones de Reels e Historias palabra por palabra (30 seg)",
      "Hasta 3 perfiles de redes (Instagram, Facebook, TikTok, etc.)",
      "Publicación automática programada sin esfuerzo",
      "Aprobación y control móvil directo desde WhatsApp",
      "Soporte por WhatsApp de lunes a viernes",
    ],
  },
  {
    id: "pyme-fundador",
    name: "Plan PyME Fundador",
    tagline: "LLAVE EN MANO · SOLO 15 CUPOS",
    badge: "🔥 SETUP GRATIS (Ahorro $150.000)",
    priceMonthly: 49990,
    priceAnnual: 44990,
    description: "El más elegido. Para el dueño que quiere partir vendiendo de inmediato: nosotros dejamos todo configurado por ti.",
    isFeatured: true,
    bonusText: "🎁 BONO EXCLUSIVO: Sesión 1 a 1 de 20 min donde clonamos la voz de tu marca y te dejamos el primer mes andando.",
    ctaText: "Asegurar Cupo Fundador ($49.990)",
    ctaHref: `https://wa.me/${WA_NUMBER}?text=%C2%A1Hola%20Santisoft!%20Quiero%20asegurar%20uno%20de%20los%2015%20cupos%20del%20Plan%20PyME%20Fundador%20(%2449.990%20CLP)%20con%20Setup%20Inicial%20Gratis.%20Mi%20negocio%20es%3A%20`,
    features: [
      "Todo lo incluido en el Plan PyME Pro",
      "Setup Inicial 100% GRATIS (Valor normal $150.000 CLP)",
      "Sesión 1 a 1 de 20 min de Onboarding personalizado",
      "Dejamos tu primer mes de 30 posts listo y programado",
      "Módulo de videos 9:16 cinematográficos para Reels y TikTok",
      "Policía Anti-Baneos: auditoría de hashtags y copys en Instagram",
      "Radar de Nicho: detección de ofertas y tendencias locales en Chile",
      "Atención prioritaria VIP por WhatsApp",
    ],
  },
  {
    id: "pyme-dwu",
    name: "Plan Lo Hacemos Contigo",
    tagline: "DONE-WITH-YOU · MÁXIMO RESULTADO",
    priceMonthly: 149990,
    priceAnnual: 134990,
    description: "Para el dueño que no quiere tocar nada y busca acompañamiento continuo mes a mes con nuestro equipo.",
    isFeatured: false,
    ctaText: "Postular a Done-With-You",
    ctaHref: `https://wa.me/${WA_NUMBER}?text=%C2%A1Hola%20Santisoft!%20Me%20interesa%20el%20Plan%20%22Lo%20Hacemos%20Contigo%22%20(%24149.990%20CLP)%20con%20acompa%C3%B1amiento%20mensual.%20Mi%20empresa%20es%3A%20`,
    features: [
      "Todo el software completo con publicaciones y videos ilimitados",
      "2 sesiones mensuales de 20 min donde armamos todo tu mes contigo",
      "Diseño y revisión de ofertas comerciales, combos y precios",
      "Artículos de blog SEO/GEO para que te recomienden en Google y ChatGPT",
      "Módulo de anuncios Meta Ads (Facebook e Instagram) calibrado",
      "Reporte mensual de métricas, ventas y crecimiento de comunidad",
      "Línea directa con tu consultor asignado por WhatsApp",
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
              {/* Badge Destacado en Cupo Fundador */}
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

                {/* Bono destacado para Fundador */}
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
            Garantía Cero Riesgo de 7 días
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Si durante tu primera semana el sistema no te ahorra al menos <strong>10 horas de trabajo</strong> o
            no quedas 100% satisfecho con los contenidos generados, te devolvemos el <strong>100% de tu dinero</strong> sin preguntas ni letras chicas.
          </p>
        </div>
        <a
          href={`https://wa.me/${WA_NUMBER}?text=%C2%A1Hola!%20Quiero%20hacer%20una%20consulta%20antes%20de%20contratar%20un%20plan%20de%20Santisoft.`}
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
            Podemos habilitar cuentas multi-marca con límites ampliados y tarifas especiales por volumen.
          </p>
        </div>
        <a
          href={`https://wa.me/${WA_NUMBER}?text=%C2%A1Hola!%20Represento%20a%20una%20agencia%2Ffranquicia%20y%20necesito%20un%20plan%20a%20la%20medida%20de%20Santisoft.`}
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
