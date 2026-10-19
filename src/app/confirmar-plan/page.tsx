"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../../lib/firebase";
import BrandHeader from "../../components/BrandHeader";
import BrandFooter from "../../components/BrandFooter";
import { FaCheck, FaShieldAlt, FaLock, FaCreditCard, FaArrowLeft, FaArrowRight } from "react-icons/fa";

type PlanDetail = {
  id: string;
  name: string;
  badge?: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  isPopular?: boolean;
  color: string;
  summary: string;
  categories: {
    title: string;
    icon: string;
    items: string[];
  }[];
  guarantees: string[];
};

const PLAN_DETAILS: Record<string, PlanDetail> = {
  esencial: {
    id: "esencial",
    name: "Plan PyME Esencial",
    badge: "PRESENCIA ACTIVA · CERO BLOQUEOS",
    tagline: "Presencia constante y profesional en tus redes sin perder tiempo cada semana",
    priceMonthly: 59990,
    priceAnnual: 647880,
    color: "#F97316",
    summary: "Ideal para negocios locales y profesionales independientes que necesitan mantener sus redes activas con publicaciones estratégicas y sin perder tiempo.",
    categories: [
      {
        title: "Contenido para Redes Sociales",
        icon: "📱",
        items: [
          "1 Marca configurada (Instagram + Facebook)",
          "Clonación de Voz de Marca con nuestros agentes: textos con el tono real de tu negocio (cero robóticos)",
          "Calendario Hiper-Orgánico Mensual: 15 publicaciones estratégicas al mes",
          "Generador de Gráficas y Carruseles: hasta 15 diseños con tu logo y colores",
          "8 Guiones de Reels + Stories listos para leer en 30 segundos",
          "Escudo Policía Anti-Baneos: protección contra shadowbans en Instagram",
        ],
      },
      {
        title: "Gestión & Operación",
        icon: "⚡",
        items: [
          "Control y aprobación móvil directa desde WhatsApp",
          "Publicación programada sin esfuerzo",
          "Soporte directo por WhatsApp de lunes a viernes",
        ],
      },
    ],
    guarantees: [
      "Garantía Cero Riesgo de 7 días: devolución 100% si no te ahorra 10 horas al mes",
      "Sin contratos de amarre: cancelas con 1 clic cuando quieras",
      "Boleta o factura electrónica con IVA incluido",
    ],
  },
  starter: {
    id: "starter",
    name: "Plan PyME Esencial",
    badge: "PRESENCIA ACTIVA · CERO BLOQUEOS",
    tagline: "Presencia constante y profesional en tus redes sin perder tiempo cada semana",
    priceMonthly: 59990,
    priceAnnual: 647880,
    color: "#F97316",
    summary: "Ideal para negocios locales y profesionales independientes que necesitan mantener sus redes activas con publicaciones estratégicas y sin perder tiempo.",
    categories: [
      {
        title: "Contenido para Redes Sociales",
        icon: "📱",
        items: [
          "1 Marca configurada (Instagram + Facebook)",
          "Clonación de Voz de Marca con nuestros agentes: textos con el tono real de tu negocio (cero robóticos)",
          "Calendario Hiper-Orgánico Mensual: 15 publicaciones estratégicas al mes",
          "Generador de Gráficas y Carruseles: hasta 15 diseños con tu logo y colores",
          "8 Guiones de Reels + Stories listos para leer en 30 segundos",
          "Escudo Policía Anti-Baneos: protección contra shadowbans en Instagram",
        ],
      },
      {
        title: "Gestión & Operación",
        icon: "⚡",
        items: [
          "Control y aprobación móvil directa desde WhatsApp",
          "Publicación programada sin esfuerzo",
          "Soporte directo por WhatsApp de lunes a viernes",
        ],
      },
    ],
    guarantees: [
      "Garantía Cero Riesgo de 7 días: devolución 100% si no te ahorra 10 horas al mes",
      "Sin contratos de amarre: cancelas con 1 clic cuando quieras",
      "Boleta o factura electrónica con IVA incluido",
    ],
  },
  crecimiento: {
    id: "crecimiento",
    name: "Plan PyME Crecimiento",
    badge: "🔥 MÁS ELEGIDO · SETUP LLAVE EN MANO GRATIS",
    tagline: "Máquina de ventas multicanal con espía de competencia y pauta pagada",
    priceMonthly: 99990,
    priceAnnual: 1079880,
    isPopular: true,
    color: "#FF6B00",
    summary: "Para PyMEs establecidas que buscan captar clientes todos los días, superar a su competencia y ahorrar los $450.000+ que cobra una agencia.",
    categories: [
      {
        title: "Todo lo del Plan Esencial, más:",
        icon: "🚀",
        items: [
          "Multicanal Ilimitado (30 días): Instagram, Facebook y TikTok",
          "Módulo de Autoridad en LinkedIn para ventas y captación B2B",
          "Espía de Competencia Activo: analiza anuncios y posts ganadores de competidores",
          "Pack Publicidad Lista (Meta & Google Ads): textos y creativos para campañas pagadas",
          "Posicionamiento SEO + GEO: artículos para salir recomendado en Google y buscadores de nueva generación",
          "Generador de Lead Magnets y Secuencias de Cierre por WhatsApp",
        ],
      },
      {
        title: "Bono Exclusivo (Solo 15 cupos)",
        icon: "🎁",
        items: [
          "Setup 'Llave en Mano' GRATIS (Valor real $150.000 CLP)",
          "Sesión de 25 min donde configuramos tu marca y dejamos tu primera quincena lista",
          "Soporte prioritario VIP directo por WhatsApp",
        ],
      },
    ],
    guarantees: [
      "Garantía Cero Riesgo de 7 días: 100% de devolución sin preguntas",
      "Ahorras más de $450.000 CLP al mes respecto a una agencia tradicional",
      "Sin ataduras ni permanencias: cancelas cuando quieras",
      "Boleta o factura electrónica con IVA incluido",
    ],
  },
  pro: {
    id: "pro",
    name: "Plan PyME Crecimiento",
    badge: "🔥 MÁS ELEGIDO · SETUP LLAVE EN MANO GRATIS",
    tagline: "Máquina de ventas multicanal con espía de competencia y pauta pagada",
    priceMonthly: 99990,
    priceAnnual: 1079880,
    isPopular: true,
    color: "#FF6B00",
    summary: "Para PyMEs establecidas que buscan captar clientes todos los días, superar a su competencia y ahorrar los $450.000+ que cobra una agencia.",
    categories: [
      {
        title: "Todo lo del Plan Esencial, más:",
        icon: "🚀",
        items: [
          "Multicanal Ilimitado (30 días): Instagram, Facebook y TikTok",
          "Módulo de Autoridad en LinkedIn para ventas y captación B2B",
          "Espía de Competencia Activo: analiza anuncios y posts ganadores de competidores",
          "Pack Publicidad Lista (Meta & Google Ads): textos y creativos para campañas pagadas",
          "Posicionamiento SEO + GEO: artículos para salir recomendado en Google y buscadores de nueva generación",
          "Generador de Lead Magnets y Secuencias de Cierre por WhatsApp",
        ],
      },
      {
        title: "Bono Exclusivo (Solo 15 cupos)",
        icon: "🎁",
        items: [
          "Setup 'Llave en Mano' GRATIS (Valor real $150.000 CLP)",
          "Sesión de 25 min donde configuramos tu marca y dejamos tu primera quincena lista",
          "Soporte prioritario VIP directo por WhatsApp",
        ],
      },
    ],
    guarantees: [
      "Garantía Cero Riesgo de 7 días: 100% de devolución sin preguntas",
      "Ahorras más de $450.000 CLP al mes respecto a una agencia tradicional",
      "Sin ataduras ni permanencias: cancelas cuando quieras",
      "Boleta o factura electrónica con IVA incluido",
    ],
  },
  growth: {
    id: "growth",
    name: "Plan PyME Crecimiento",
    badge: "🔥 MÁS ELEGIDO · SETUP LLAVE EN MANO GRATIS",
    tagline: "Máquina de ventas multicanal con espía de competencia y pauta pagada",
    priceMonthly: 99990,
    priceAnnual: 1079880,
    isPopular: true,
    color: "#FF6B00",
    summary: "Para PyMEs establecidas que buscan captar clientes todos los días, superar a su competencia y ahorrar los $450.000+ que cobra una agencia.",
    categories: [
      {
        title: "Todo lo del Plan Esencial, más:",
        icon: "🚀",
        items: [
          "Multicanal Ilimitado (30 días): Instagram, Facebook y TikTok",
          "Módulo de Autoridad en LinkedIn para ventas y captación B2B",
          "Espía de Competencia Activo: analiza anuncios y posts ganadores de competidores",
          "Pack Publicidad Lista (Meta & Google Ads): textos y creativos para campañas pagadas",
          "Posicionamiento SEO + GEO: artículos para salir recomendado en Google y buscadores de nueva generación",
          "Generador de Lead Magnets y Secuencias de Cierre por WhatsApp",
        ],
      },
      {
        title: "Bono Exclusivo (Solo 15 cupos)",
        icon: "🎁",
        items: [
          "Setup 'Llave en Mano' GRATIS (Valor real $150.000 CLP)",
          "Sesión de 25 min donde configuramos tu marca y dejamos tu primera quincena lista",
          "Soporte prioritario VIP directo por WhatsApp",
        ],
      },
    ],
    guarantees: [
      "Garantía Cero Riesgo de 7 días: 100% de devolución sin preguntas",
      "Ahorras más de $450.000 CLP al mes respecto a una agencia tradicional",
      "Sin ataduras ni permanencias: cancelas cuando quieras",
      "Boleta o factura electrónica con IVA incluido",
    ],
  },
  "piloto-automatico": {
    id: "piloto-automatico",
    name: "Plan PyME Piloto Automático",
    badge: "⚡ SETUP INICIAL GRATIS",
    tagline: "Nosotros operamos el sistema contigo en sesiones ejecutivas quincenales",
    priceMonthly: 249990,
    priceAnnual: 2699880,
    color: "#F59E0B",
    summary: "Para dueños de empresas y gerentes sin tiempo que quieren todo el poder del sistema pero prefieren que nuestro equipo lo opere junto a ellos.",
    categories: [
      {
        title: "Acompañamiento Estratégico Continuo",
        icon: "🤝",
        items: [
          "Todo el Plan Crecimiento Ilimitado incluido",
          "2 Sesiones Ejecutivas al Mes (20 min por Zoom) para programar todo en vivo",
          "Optimización de Perfil de LinkedIn del Dueño + Casos de Éxito de alto ticket",
          "Auditoría Trimestral de Conversión Web (CRO) para convertir visitas en ventas",
          "Soporte Prioritario VIP directo por WhatsApp con estratega dedicado",
        ],
      },
    ],
    guarantees: [
      "Garantía Cero Riesgo de 7 días: 100% de devolución si no ahorra 10 horas",
      "Setup Inicial 100% GRATIS incluido",
      "Cancela o cambia de plan en cualquier momento",
      "Boleta o factura electrónica con IVA incluido",
    ],
  },
  piloto_automatico: {
    id: "piloto_automatico",
    name: "Plan PyME Piloto Automático",
    badge: "⚡ SETUP INICIAL GRATIS",
    tagline: "Nosotros operamos el sistema contigo en sesiones ejecutivas quincenales",
    priceMonthly: 249990,
    priceAnnual: 2699880,
    color: "#F59E0B",
    summary: "Para dueños de empresas y gerentes sin tiempo que quieren todo el poder del sistema pero prefieren que nuestro equipo lo opere junto a ellos.",
    categories: [
      {
        title: "Acompañamiento Estratégico Continuo",
        icon: "🤝",
        items: [
          "Todo el Plan Crecimiento Ilimitado incluido",
          "2 Sesiones Ejecutivas al Mes (20 min por Zoom) para programar todo en vivo",
          "Optimización de Perfil de LinkedIn del Dueño + Casos de Éxito de alto ticket",
          "Auditoría Trimestral de Conversión Web (CRO) para convertir visitas en ventas",
          "Soporte Prioritario VIP directo por WhatsApp con estratega dedicado",
        ],
      },
    ],
    guarantees: [
      "Garantía Cero Riesgo de 7 días: 100% de devolución si no ahorra 10 horas",
      "Setup Inicial 100% GRATIS incluido",
      "Cancela o cambia de plan en cualquier momento",
      "Boleta o factura electrónica con IVA incluido",
    ],
  },
  business: {
    id: "business",
    name: "Plan PyME Piloto Automático",
    badge: "⚡ SETUP INICIAL GRATIS",
    tagline: "Nosotros operamos el sistema contigo en sesiones ejecutivas quincenales",
    priceMonthly: 249990,
    priceAnnual: 2699880,
    color: "#F59E0B",
    summary: "Para dueños de empresas y gerentes sin tiempo que quieren todo el poder del sistema pero prefieren que nuestro equipo lo opere junto a ellos.",
    categories: [
      {
        title: "Acompañamiento Estratégico Continuo",
        icon: "🤝",
        items: [
          "Todo el Plan Crecimiento Ilimitado incluido",
          "2 Sesiones Ejecutivas al Mes (20 min por Zoom) para programar todo en vivo",
          "Optimización de Perfil de LinkedIn del Dueño + Casos de Éxito de alto ticket",
          "Auditoría Trimestral de Conversión Web (CRO) para convertir visitas en ventas",
          "Soporte Prioritario VIP directo por WhatsApp con estratega dedicado",
        ],
      },
    ],
    guarantees: [
      "Garantía Cero Riesgo de 7 días: 100% de devolución si no ahorra 10 horas",
      "Setup Inicial 100% GRATIS incluido",
      "Cancela o cambia de plan en cualquier momento",
      "Boleta o factura electrónica con IVA incluido",
    ],
  },
};

function ConfirmarPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawPlan = (searchParams.get("plan") || "pro").toLowerCase();
  const initialBilling = (searchParams.get("billing") || "mensual").toLowerCase() === "anual" ? "anual" : "mensual";
  const fromSource = searchParams.get("from") || "landing";

  const [billingCycle, setBillingCycle] = useState<"mensual" | "anual">(initialBilling);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  const planKey = PLAN_DETAILS[rawPlan] ? rawPlan : "esencial";
  const plan = PLAN_DETAILS[planKey];

  const priceMonthly = plan.priceMonthly;
  const priceAnnual = plan.priceAnnual;
  const currentPrice = billingCycle === "anual" ? priceAnnual : priceMonthly;
  const annualSavings = Math.round((priceMonthly * 12) - priceAnnual);

  const backUrl = fromSource === "panel" ? "/automatizacion-rrss/panel/planes" : "/#planes";

  // Google sign in handler
  const handleGoogleAuth = async () => {
    setErrorMsg("");
    setAuthLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const u = res.user;
      const userRef = doc(db, "users", u.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: u.email,
          name: u.displayName || "",
          role: "user",
          plan: "free",
          createdAt: serverTimestamp(),
          registeredApps: ["automatizacion"],
        }, { merge: true });
      }
      setShowAuthForm(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error al iniciar sesión con Google.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Email form auth handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setAuthLoading(true);
    try {
      if (authMode === "register") {
        const creds = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        await setDoc(doc(db, "users", creds.user.uid), {
          email: authEmail,
          name: authName,
          phone: authPhone,
          role: "user",
          plan: "free",
          createdAt: serverTimestamp(),
          registeredApps: ["automatizacion"],
        }, { merge: true });
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
      setShowAuthForm(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error al autenticar. Revisa tus datos.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Payment checkout trigger
  const handleConfirmAndPay = async () => {
    setErrorMsg("");

    if (!currentUser) {
      setShowAuthForm(true);
      return;
    }

    setLoadingPayment(true);

    try {
      const res = await fetch("/api/payments/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          isAnnual: billingCycle === "anual",
          annualBillingType: "single",
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg(data.error || "No se pudo generar el enlace de pago de Mercado Pago.");
        setLoadingPayment(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error de conexión al conectar con la pasarela de pago.");
      setLoadingPayment(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* Resplandores de fondo sutiles con la paleta de Santisoft */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-orange-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] pointer-events-none rounded-full" />

      <BrandHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 sm:py-14 w-full relative z-10">
        {/* Top breadcrumb & back link */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-orange-400 transition-colors"
          >
            <FaArrowLeft className="text-xs" />
            <span>Volver al sitio y ver otros planes</span>
          </Link>

          <span className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-slate-900 text-orange-400 border border-orange-500/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Paso de Confirmación
          </span>
        </div>

        {/* Hero title */}
        <div className="text-center mb-10">
          <span className="inline-block text-[11px] font-mono font-bold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3.5 py-1 rounded-full mb-3 shadow-xs">
            REVISIÓN DE TU PLAN
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Confirma tu <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">{plan.name}</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            {plan.tagline}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-medium flex items-center justify-between gap-4">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-xs underline hover:text-white cursor-pointer">
              Cerrar
            </button>
          </div>
        )}

        {/* Main Card */}
        <div
          className={`rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border transition-all relative backdrop-blur-xl bg-slate-900/90 ${
            plan.isPopular
              ? "border-orange-500/50 ring-2 ring-orange-500/20 shadow-orange-500/10"
              : "border-slate-800"
          }`}
        >
          {/* Header of card: Plan info + Billing toggle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-white">{plan.name}</h2>
                {plan.badge && (
                  <span
                    className={`text-[10px] font-mono font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                      plan.isPopular
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/30"
                        : "bg-slate-800 text-orange-300 border border-orange-500/30"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
                {plan.summary}
              </p>
            </div>

            {/* Price Box with Cycle Selector */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 min-w-[270px] text-right shadow-inner">
              {/* Toggle Mensual / Anual */}
              <div className="flex items-center justify-end gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setBillingCycle("mensual")}
                  className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    billingCycle === "mensual"
                      ? "bg-slate-800 text-white shadow-xs border border-slate-700 font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("anual")}
                  className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    billingCycle === "anual"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>Anual</span>
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-black">-10%</span>
                </button>
              </div>

              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                ${currentPrice.toLocaleString("es-CL")}
                <span className="text-xs sm:text-sm font-normal text-slate-400 ml-1.5">
                  {billingCycle === "anual" ? "CLP / año" : "CLP / mes"}
                </span>
              </div>

              <div className="text-xs text-slate-400 font-mono mt-1">
                {billingCycle === "anual" ? (
                  <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                    ✓ Ahorras ${annualSavings.toLocaleString("es-CL")} al año
                  </span>
                ) : (
                  <span>IVA incluido · Cancela cuando quieras</span>
                )}
              </div>
            </div>
          </div>

          {/* Benefits Categorized */}
          <div className="py-8">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-black mb-6 flex items-center gap-2">
              <span>TODOS LOS BENEFICIOS INCLUIDOS EN TU SUSCRIPCIÓN</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {plan.categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-800/80 bg-slate-950/60 flex flex-col gap-3 hover:border-slate-700 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{cat.icon}</span>
                    <h4 className="font-bold text-base text-white">{cat.title}</h4>
                  </div>
                  <ul className="space-y-2.5 mt-1">
                    {cat.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2.5 leading-relaxed font-medium">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Guarantees Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-400 font-medium">
              {plan.guarantees.map((g, gIdx) => (
                <div key={gIdx} className="flex items-center gap-2">
                  <span className="text-orange-400">🛡️</span>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Auth Info or Form */}
          {authChecked && (
            <div className="mb-8 pt-2">
              {currentUser ? (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
                      ✓
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Cuenta vinculada para suscripción</p>
                      <p className="text-sm font-bold text-white">{currentUser.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    Listo para continuar
                  </span>
                </div>
              ) : (
                showAuthForm ? (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-base text-white">
                        {authMode === "register" ? "Crea tu cuenta para activar el plan" : "Inicia sesión para continuar"}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setAuthMode((m) => (m === "register" ? "login" : "register"))}
                        className="text-xs text-orange-400 hover:text-orange-300 font-semibold underline cursor-pointer"
                      >
                        {authMode === "register" ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={authLoading}
                      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 rounded-xl border border-slate-200 transition-all text-sm mb-4 shadow-sm cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continuar con Google (1 clic)
                    </button>

                    <div className="flex items-center gap-3 my-4">
                      <div className="h-px bg-slate-800 flex-1" />
                      <span className="text-[11px] font-mono text-slate-500 uppercase">O con tu correo</span>
                      <div className="h-px bg-slate-800 flex-1" />
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-3">
                      {authMode === "register" && (
                        <input
                          type="text"
                          required
                          placeholder="Tu nombre completo"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                        />
                      )}
                      <input
                        type="email"
                        required
                        placeholder="tu-correo@empresa.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                      />
                      <input
                        type="password"
                        required
                        placeholder="Contraseña segura"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                      />
                      {authMode === "register" && (
                        <input
                          type="tel"
                          required
                          placeholder="WhatsApp de contacto (+56 9 ...)"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                        />
                      )}

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                      >
                        {authLoading ? "Verificando..." : (authMode === "register" ? "Crear cuenta y confirmar plan" : "Ingresar y confirmar plan")}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="text-xs sm:text-sm text-slate-400">
                      <span>💡 Para vincular tu suscripción, conecta tu cuenta antes de pagar.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAuthForm(true)}
                      className="text-xs font-bold px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-all shrink-0 cursor-pointer"
                    >
                      Identificarme ahora
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {/* Action Buttons: Confirm vs Return */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
            <Link
              href={backUrl}
              className="w-full sm:w-auto text-center px-6 py-4 rounded-full border border-slate-800 bg-slate-950 hover:bg-slate-800 text-sm font-bold text-slate-300 hover:text-white transition-all order-2 sm:order-1"
            >
              ← Volver al sitio
            </Link>

            <button
              type="button"
              onClick={handleConfirmAndPay}
              disabled={loadingPayment}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 active:scale-98 transition-all order-1 sm:order-2 disabled:opacity-50 cursor-pointer"
            >
              {loadingPayment ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Conectando con Mercado Pago...</span>
                </>
              ) : (
                <>
                  <span>Confirmar Plan y Continuar al Pago</span>
                  <FaArrowRight className="text-sm" />
                </>
              )}
            </button>
          </div>

          {/* Trust badges footer */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <FaLock className="text-emerald-400 text-xs" />
              <span>Pago 100% encriptado y seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💳 Webpay · Redcompra · Débito y Crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🛡️ Respaldado por Mercado Pago</span>
            </div>
          </div>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}

export default function ConfirmarPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmarPlanContent />
    </Suspense>
  );
}
