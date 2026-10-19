"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { normalizePlanId } from "../../../../lib/plans";
import { FaCheck, FaWhatsapp, FaShieldAlt, FaRocket, FaGift, FaStar } from "react-icons/fa";

interface PyMEPlanItem {
  id: "free" | "esencial" | "crecimiento" | "piloto_automatico";
  name: string;
  tagline: string;
  badge?: string;
  originalPriceMonthly?: number;
  priceMonthly: number;
  priceAnnualMonthly: number;
  annualSinglePrice: number;
  description: string;
  isFeatured?: boolean;
  bonusText?: string;
  ctaText: string;
  features: string[];
}

const OFFICIAL_PYME_PLANS: PyMEPlanItem[] = [
  {
    id: "free",
    name: "Free",
    tagline: "PRUEBA DE 10 DÍAS",
    priceMonthly: 0,
    priceAnnualMonthly: 0,
    annualSinglePrice: 0,
    description: "Prueba la plataforma durante 10 días y experimenta el poder de nuestros agentes especializados.",
    ctaText: "Prueba Gratuita",
    features: [
      "5 publicaciones automáticas de prueba por 10 días",
      "5 imágenes con nuestros agentes",
      "1 Marca configurada (Instagram + Facebook)",
      "Calendario básico y planificación",
      "Aprobación y control desde la app",
    ],
  },
  {
    id: "esencial",
    name: "Plan PyME Esencial",
    tagline: "PRESENCIA ACTIVA · CERO BLOQUEOS",
    originalPriceMonthly: 89990,
    priceMonthly: 59990,
    priceAnnualMonthly: 53990,
    annualSinglePrice: 647880,
    description: "Ideal para negocios locales y profesionales que necesitan redes activas, confiables y con contenido profesional sin perder tiempo.",
    ctaText: "Elegir Plan Esencial ($59.990)",
    features: [
      "1 Marca configurada (Instagram + Facebook)",
      "Clonación de Voz de Marca con nuestros agentes (textos con el tono real de tu negocio, cero robóticos)",
      "Calendario Hiper-Orgánico Mensual: 15 publicaciones estratégicas al mes (valor, autoridad y venta)",
      "Generador de Gráficas y Carruseles: Hasta 15 diseños mensuales listos con tu logo y colores corporativos",
      "8 Guiones de Reels + Secuencias de Stories listos para leer en 30 segundos frente al celular",
      "Escudo Policía Anti-Baneos: Protección automática contra shadowbans y bloqueos de alcance en Instagram",
      "Aprobación y control móvil directo desde WhatsApp",
      "Soporte directo por WhatsApp de lunes a viernes",
    ],
  },
  {
    id: "crecimiento",
    name: "Plan PyME Crecimiento",
    tagline: "MÁQUINA DE VENTAS · MÁS ELEGIDO",
    badge: "🔥 MÁS ELEGIDO · SOLO 15 CUPOS",
    originalPriceMonthly: 149990,
    priceMonthly: 99990,
    priceAnnualMonthly: 89990,
    annualSinglePrice: 1079880,
    isFeatured: true,
    bonusText: "🎁 BONO EXCLUSIVO (Solo 15 cupos): Setup 'Llave en Mano' GRATIS (Valor real $150.000 CLP) — Nosotros configuramos tu marca, extraemos tu voz desde tu web y dejamos tu primera quincena andando en una videollamada de 25 minutos.",
    description: "Para PyMEs establecidas que buscan captar clientes todos los días, superar a su competencia y ahorrar los $450.000+ que cobra una agencia.",
    ctaText: "Asegurar Cupo Crecimiento con Setup Gratis ($99.990)",
    features: [
      "Todo lo incluido en el Plan Esencial",
      "Multicanal Ilimitado (30 días): Instagram, Facebook, TikTok",
      "Módulo de Autoridad en LinkedIn para ventas y captación B2B",
      "Espía de Competencia Activo: Analiza qué anuncios y publicaciones le dan resultado a tus competidores",
      "Pack Publicidad Lista (Meta & Google Ads): Textos persuasivos y creativos listos para campañas pagadas",
      "Posicionamiento en Google y buscadores de nueva generación (SEO + GEO): Artículos de blog para que tu PyME aparezca recomendada",
      "Generador de Lead Magnets y Secuencias de Cierre por WhatsApp",
      "Atención prioritaria VIP por WhatsApp",
    ],
  },
  {
    id: "piloto_automatico",
    name: "Plan PyME Piloto Automático",
    tagline: "DONE-WITH-YOU · SERVICIO VIP",
    badge: "⚡ SETUP INICIAL GRATIS",
    originalPriceMonthly: 349990,
    priceMonthly: 249990,
    priceAnnualMonthly: 224990,
    annualSinglePrice: 2699880,
    isFeatured: false,
    bonusText: "🛡️ SERVICIO DONE-WITH-YOU: 2 sesiones ejecutivas al mes (20 min por Zoom) para generar las campañas, revisar métricas y dejar todo programado en vivo.",
    description: "Para dueños de empresas y gerentes sin tiempo que quieren todo el poder del sistema pero prefieren que nuestro equipo lo opere junto a ellos.",
    ctaText: "Postular a Piloto Automático ($249.990)",
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

export default function PlanesPage() {
  const router = useRouter();
  const [userRawPlan, setUserRawPlan] = useState("free");
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const d = await getDoc(doc(db, "users", user.uid));
          if (d.exists()) {
            setUserRawPlan(d.data().plan || "free");
          }
        } catch (e) {
          console.error("Error fetching user plan:", e);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const normalizedUserPlan = normalizePlanId(userRawPlan);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return;
    router.push(`/confirmar-plan?plan=${encodeURIComponent(planId)}&billing=${isAnnual ? 'anual' : 'mensual'}&from=panel`);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Encabezado */}
      <div className="text-left mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-black uppercase tracking-wider mb-4">
          <FaStar className="text-orange-500 text-[10px]" />
          <span>Planes Oficiales PyME</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
          Tu Plan de <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">Automatización con Agentes</span>
        </h1>
        <p className="text-slate-600 text-base sm:text-lg max-w-2xl font-medium mb-8">
          Elige el nivel de aceleración que necesita tu marca. Sin contratos de permanencia, cancelas cuando quieras.
        </p>

        {/* Toggle Facturación Mensual / Anual */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                !isAnnual
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Suscripción Mensual
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                isAnnual
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Facturación Anual</span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isAnnual
                    ? "bg-white/20 text-white border border-white/30"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                }`}
              >
                -10% OFF
              </span>
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-8 p-4 rounded-xl font-bold flex items-start gap-3 animate-in fade-in slide-in-from-top-4 w-full break-words overflow-hidden ${
            message.type === 'error'
              ? 'bg-rose-50 text-rose-600 border border-rose-100'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}
        >
          <span className="shrink-0 mt-0.5">{message.type === 'error' ? '⚠️' : '✅'}</span>
          <span className="break-words w-full">{message.text}</span>
        </div>
      )}

      {/* Grid de 4 Planes Oficiales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {OFFICIAL_PYME_PLANS.map((plan) => {
          const isCurrent = normalizedUserPlan === plan.id;
          const currentPrice = isAnnual ? plan.priceAnnualMonthly : plan.priceMonthly;
          const formattedCurrentPrice = currentPrice.toLocaleString('es-CL');
          const formattedOriginalPrice = plan.originalPriceMonthly?.toLocaleString('es-CL');

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 bg-white shadow-md ${
                plan.isFeatured
                  ? "border-2 border-orange-500 shadow-xl shadow-orange-500/10 ring-2 ring-orange-500/10 xl:-translate-y-2"
                  : plan.id === "piloto_automatico"
                  ? "border-2 border-indigo-500 shadow-xl shadow-indigo-500/10"
                  : "border border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Badge Destacado Superior */}
              {plan.badge && (
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg whitespace-nowrap z-10 ${
                    plan.isFeatured
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/30"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-600/30"
                  }`}
                >
                  {plan.badge}
                </div>
              )}

              <div>
                {/* Tagline / Subtítulo */}
                <div className="mb-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
                    {plan.tagline}
                  </span>
                </div>

                {/* Nombre del Plan */}
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                  {plan.name}
                </h3>

                {/* Descripción */}
                <p className="text-xs text-slate-500 leading-relaxed mb-5 min-h-[48px]">
                  {plan.description}
                </p>

                {/* Bloque de Precio */}
                <div className="mb-6 pb-5 border-b border-slate-100">
                  {/* Precio tachado original */}
                  {plan.originalPriceMonthly && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400 line-through">
                        ${formattedOriginalPrice} / mes
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                        PRECIO OFERTA
                      </span>
                    </div>
                  )}

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      ${formattedCurrentPrice}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {plan.id === "free" ? "/siempre" : "CLP + IVA / mes"}
                    </span>
                  </div>

                  <p className="text-[10px] font-medium text-slate-400 mt-1">
                    {plan.id === "free"
                      ? "Sin tarjeta de crédito requerida"
                      : isAnnual
                      ? "Cobro anual con 10% de ahorro incluido"
                      : "Suscripción mes a mes · Cero contratos de permanencia"}
                  </p>
                </div>

                {/* Caja de Bono Destacado (si existe) */}
                {plan.bonusText && (
                  <div
                    className={`p-3.5 rounded-2xl mb-6 text-xs leading-relaxed border ${
                      plan.isFeatured
                        ? "bg-amber-50/80 border-amber-200 text-amber-950 font-medium"
                        : "bg-indigo-50/80 border-indigo-200 text-indigo-950 font-medium"
                    }`}
                  >
                    {plan.bonusText}
                  </div>
                )}

                {/* Lista de Features */}
                <div className="mb-8">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">
                    QUÉ INCLUYE TU PLAN:
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-snug">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] shrink-0 mt-0.5 font-black">
                          ✓
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Botón CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrent || plan.id === "free"}
                  className={`w-full py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                    isCurrent
                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-default shadow-none"
                      : plan.id === "free"
                      ? "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 cursor-default"
                      : plan.isFeatured
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 active:scale-98"
                      : plan.id === "piloto_automatico"
                      ? "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10 active:scale-98"
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10 active:scale-98"
                  }`}
                >
                  {isCurrent ? "✓ Plan Actual" : plan.ctaText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner Gran Agencia / Corporativo */}
      <div className="mt-16 rounded-3xl p-8 sm:p-12 bg-slate-900 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[120px] -mr-32 -mt-32 rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 blur-[90px] -ml-20 -mb-20 rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl mb-6 border border-white/10 backdrop-blur-sm shadow-inner">
            🏢
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight text-white drop-shadow-sm">
            ¿Eres una Gran Agencia o necesitas más de 10 marcas?
          </h2>
          <p className="text-slate-300 mb-8 text-sm sm:text-base font-medium leading-relaxed">
            Diseñamos planes a medida para agencias y franquicias. Múltiples cuentas conectadas, analítica unificada, reportes de marca blanca y volumen escalable con nuestros agentes.
          </p>
          <a
            href="https://wa.me/56934428848?text=%C2%A1Hola!%20Represento%20a%20una%20agencia%20y%20me%20gustar%C3%ADa%20conocer%20los%20planes%20multi-marca%20de%20Santisoft."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-black rounded-2xl transition-all shadow-xl hover:bg-slate-100 hover:scale-[1.02] uppercase tracking-wider text-xs cursor-pointer"
          >
            <FaWhatsapp className="text-emerald-600 text-base" />
            <span>Hablar con un Especialista para Agencias</span>
          </a>
        </div>
      </div>
    </div>
  );
}
