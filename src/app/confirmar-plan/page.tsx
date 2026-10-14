"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../../lib/firebase";
import BrandHeader from "../../components/BrandHeader";
import BrandFooter from "../../components/BrandFooter";

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
    priceAnnual: 539910,
    color: "#38BDF8",
    summary: "Ideal para negocios locales y profesionales independientes que necesitan mantener sus redes activas con publicaciones estratégicas y sin perder tiempo.",
    categories: [
      {
        title: "Contenido para Redes Sociales",
        icon: "📱",
        items: [
          "1 Marca configurada (Instagram + Facebook)",
          "Clonación de Voz de Marca + Humanizador IA: textos con el tono real de tu negocio",
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
    priceAnnual: 539910,
    color: "#38BDF8",
    summary: "Ideal para negocios locales y profesionales independientes que necesitan mantener sus redes activas con publicaciones estratégicas y sin perder tiempo.",
    categories: [
      {
        title: "Contenido para Redes Sociales",
        icon: "📱",
        items: [
          "1 Marca configurada (Instagram + Facebook)",
          "Clonación de Voz de Marca + Humanizador IA: textos con el tono real de tu negocio",
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
    badge: "★ MÁS ELEGIDO · SETUP LLAVE EN MANO GRATIS",
    tagline: "Máquina de ventas multicanal con espía de competencia y pauta pagada",
    priceMonthly: 99990,
    priceAnnual: 899910,
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
          "Posicionamiento SEO + GEO: artículos para salir recomendado en Google y ChatGPT",
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
    badge: "★ MÁS ELEGIDO · SETUP LLAVE EN MANO GRATIS",
    tagline: "Máquina de ventas multicanal con espía de competencia y pauta pagada",
    priceMonthly: 99990,
    priceAnnual: 899910,
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
          "Posicionamiento SEO + GEO: artículos para salir recomendado en Google y ChatGPT",
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
    badge: "★ MÁS ELEGIDO · SETUP LLAVE EN MANO GRATIS",
    tagline: "Máquina de ventas multicanal con espía de competencia y pauta pagada",
    priceMonthly: 99990,
    priceAnnual: 899910,
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
          "Posicionamiento SEO + GEO: artículos para salir recomendado en Google y ChatGPT",
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
    badge: "DONE-WITH-YOU · SERVICIO VIP",
    tagline: "Nosotros operamos el sistema contigo en sesiones ejecutivas quincenales",
    priceMonthly: 249990,
    priceAnnual: 2249910,
    color: "#A855F7",
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
    badge: "DONE-WITH-YOU · SERVICIO VIP",
    tagline: "Nosotros operamos el sistema contigo en sesiones ejecutivas quincenales",
    priceMonthly: 249990,
    priceAnnual: 2249910,
    color: "#A855F7",
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

  const planKey = PLAN_DETAILS[rawPlan] ? rawPlan : "pro";
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
    <div className="landing-page-root min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      <BrandHeader />

      <main className="flex-1 wrap max-w-4xl mx-auto px-4 py-12 md:py-16 w-full">
        {/* Top breadcrumb & back link */}
        <div className="flex items-center justify-between gap-4 mb-8 pt-6">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-dim)] hover:text-[var(--signal)] transition-colors"
          >
            <span>←</span> Volver al sitio y ver otros planes
          </Link>

          <span className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Paso de Confirmación
          </span>
        </div>

        {/* Hero title */}
        <div className="text-center mb-10">
          <span className="eyebrow mx-auto justify-center mb-3">Revisión de tu Plan</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Confirma tu <span style={{ color: plan.color }}>{plan.name}</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[var(--ink-dim)] max-w-2xl mx-auto">
            {plan.tagline}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium flex items-center justify-between gap-4">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-xs underline hover:text-white">Cerrar</button>
          </div>
        )}

        {/* Main Card */}
        <div
          className="rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border transition-all"
          style={{
            background: "var(--panel)",
            borderColor: plan.isPopular ? "var(--signal)" : "var(--line-strong)",
            boxShadow: plan.isPopular ? "0 20px 60px rgba(255, 107, 0, 0.15)" : "0 20px 50px rgba(0,0,0,0.2)",
          }}
        >
          {/* Header of card: Plan info + Billing toggle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[var(--line)]">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl sm:text-3xl font-bold">{plan.name}</h2>
                {plan.badge && (
                  <span
                    className="text-[11px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider text-white"
                    style={{ background: plan.color }}
                  >
                    {plan.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--ink-dim)] max-w-md">
                {plan.summary}
              </p>
            </div>

            {/* Price Box with Cycle Selector */}
            <div className="p-4 rounded-2xl bg-[var(--panel-2)] border border-[var(--line-strong)] min-w-[260px] text-right md:text-right">
              {/* Toggle Mensual / Anual */}
              <div className="flex items-center justify-end gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setBillingCycle("mensual")}
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-lg transition-all ${
                    billingCycle === "mensual"
                      ? "bg-[var(--panel)] text-[var(--ink)] shadow-sm border border-[var(--line-strong)]"
                      : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                  }`}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("anual")}
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    billingCycle === "anual"
                      ? "bg-[var(--signal)] text-white shadow-sm"
                      : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                  }`}
                >
                  Anual <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded">-10%</span>
                </button>
              </div>

              <div className="text-3xl sm:text-4xl font-extrabold text-[var(--ink)] tracking-tight">
                ${currentPrice.toLocaleString("es-CL")}
                <span className="text-xs sm:text-sm font-normal text-[var(--ink-dim)] ml-1.5">
                  {billingCycle === "anual" ? "CLP / año" : "CLP / mes"}
                </span>
              </div>

              <div className="text-xs text-[var(--ink-dim)] font-mono mt-1">
                {billingCycle === "anual" ? (
                  <span className="text-emerald-400 font-bold">
                    ✓ Ahorras ${annualSavings.toLocaleString("es-CL")} al año
                  </span>
                ) : (
                  <span>IVA incluido · Sin contratos forzosos</span>
                )}
              </div>
            </div>
          </div>

          {/* Benefits Categorized */}
          <div className="py-8">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--ink-dim)] font-bold mb-6">
              Todos los beneficios incluidos en tu suscripción:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plan.categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-[var(--line-strong)] bg-[var(--bg-soft)]/50 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{cat.icon}</span>
                    <h4 className="font-bold text-base text-[var(--ink)]">{cat.title}</h4>
                  </div>
                  <ul className="space-y-2.5 mt-1">
                    {cat.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-xs sm:text-sm text-[var(--ink)] flex items-start gap-2.5 leading-relaxed">
                        <span className="text-emerald-400 font-bold text-base shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Guarantees Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--panel-2)]/60 border border-[var(--line)] mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[var(--ink-dim)] font-medium">
              {plan.guarantees.map((g, gIdx) => (
                <div key={gIdx} className="flex items-center gap-2">
                  <span className="text-[var(--signal)]">🛡️</span>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Auth Info or Form */}
          {authChecked && (
            <div className="mb-8 pt-2">
              {currentUser ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs text-emerald-300 font-mono uppercase">Cuenta vinculada para suscripción</p>
                      <p className="text-sm font-bold text-white">{currentUser.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--ink-dim)] font-mono">Listo para continuar</span>
                </div>
              ) : (
                showAuthForm ? (
                  <div className="p-6 rounded-2xl bg-[var(--panel-2)] border border-[var(--line-strong)]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-base text-[var(--ink)]">
                        {authMode === "register" ? "Crea tu cuenta para activar el plan" : "Inicia sesión para continuar"}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setAuthMode(m => m === "register" ? "login" : "register")}
                        className="text-xs text-[var(--signal)] font-semibold underline"
                      >
                        {authMode === "register" ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={authLoading}
                      className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-semibold py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-sm mb-4 shadow-sm"
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
                      <div className="h-px bg-[var(--line)] flex-1" />
                      <span className="text-[11px] font-mono text-[var(--ink-dim)]">O CON TU CORREO</span>
                      <div className="h-px bg-[var(--line)] flex-1" />
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-3">
                      {authMode === "register" && (
                        <input
                          type="text"
                          required
                          placeholder="Tu nombre completo"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line-strong)] text-sm text-[var(--ink)] focus:border-[var(--signal)] outline-none"
                        />
                      )}
                      <input
                        type="email"
                        required
                        placeholder="tu-correo@empresa.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line-strong)] text-sm text-[var(--ink)] focus:border-[var(--signal)] outline-none"
                      />
                      <input
                        type="password"
                        required
                        placeholder="Contraseña segura"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line-strong)] text-sm text-[var(--ink)] focus:border-[var(--signal)] outline-none"
                      />
                      {authMode === "register" && (
                        <input
                          type="tel"
                          required
                          placeholder="WhatsApp de contacto (+56 9 ...)"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line-strong)] text-sm text-[var(--ink)] focus:border-[var(--signal)] outline-none"
                        />
                      )}

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-3 rounded-xl bg-[var(--signal)] text-white font-bold text-sm shadow-md hover:opacity-95 transition-all"
                      >
                        {authLoading ? "Verificando..." : (authMode === "register" ? "Crear cuenta y confirmar plan" : "Ingresar y confirmar plan")}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[var(--panel-2)]/60 border border-[var(--line)] flex items-center justify-between gap-4">
                    <div className="text-xs sm:text-sm text-[var(--ink-dim)]">
                      <span>💡 Para vincular tu suscripción, conecta tu cuenta antes de pagar.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAuthForm(true)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--signal)]/10 text-[var(--signal)] hover:bg-[var(--signal)]/20 transition-all shrink-0"
                    >
                      Identificarme ahora
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {/* Action Buttons: Confirm vs Return */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--line)]">
            <Link
              href={backUrl}
              className="w-full sm:w-auto text-center px-6 py-3.5 rounded-full border border-[var(--line-strong)] text-sm font-semibold text-[var(--ink)] hover:bg-[var(--line-strong)] transition-all order-2 sm:order-1"
            >
              ← Volver al sitio
            </Link>

            <button
              type="button"
              onClick={handleConfirmAndPay}
              disabled={loadingPayment}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[var(--signal)] hover:opacity-95 text-white font-bold text-base shadow-xl hover:shadow-[0_8px_30px_rgba(255,107,0,0.35)] transition-all order-1 sm:order-2 disabled:opacity-50"
            >
              {loadingPayment ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Conectando con Mercado Pago...</span>
                </>
              ) : (
                <>
                  <span>Confirmar Plan y Continuar al Pago</span>
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
          </div>

          {/* Trust badges footer */}
          <div className="mt-8 pt-6 border-t border-[var(--line)] flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--ink-dim)]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
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
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--ink)]">
          <div className="w-8 h-8 border-4 border-[var(--signal)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmarPlanContent />
    </Suspense>
  );
}
