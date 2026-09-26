"use client";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type PlanConfig = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  annualPrice: number;
  postsLimit: number;
  videosLimit: number;
  aiImagesLimit: number;
  aiVideosLimit: number;
  seoBlogsLimit: number;
  multiAccount: boolean;
  maxAccounts: number;
  isPopular: boolean;
  ctaText: string;
  features: string[];
};

const PLAN_ORDER = ["free", "starter", "growth", "pro", "business"];

const DEFAULT_PLANS_RECORD: Record<string, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "POR 10 DÍAS",
    price: 0,
    annualPrice: 0,
    postsLimit: 5,
    videosLimit: 0,
    aiImagesLimit: 8,
    aiVideosLimit: 0,
    seoBlogsLimit: 0,
    multiAccount: false,
    maxAccounts: 1,
    isPopular: false,
    ctaText: "Prueba Gratuita",
    features: [
      "5 publicaciones automáticas por 10 días",
      "8 imágenes con nuestros agentes",
      "Todas las redes sociales (IG, FB, TT, YT, X)",
      "1 perfil de marca",
      "Sin tarjeta de crédito"
    ]
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "EMPIEZA A AUTOMATIZAR",
    price: 24990,
    annualPrice: 249900,
    postsLimit: 20,
    videosLimit: 2,
    aiImagesLimit: 20,
    aiVideosLimit: 2,
    seoBlogsLimit: 0,
    multiAccount: false,
    maxAccounts: 1,
    isPopular: false,
    ctaText: "Comenzar Starter",
    features: [
      "20 publicaciones en redes al mes",
      "2 videos para Reels / TikTok / Shorts al mes",
      "20 imágenes con nuestros agentes al mes",
      "Todas las redes sociales",
      "1 perfil de marca",
      "Ahorra 10% en plan anual"
    ]
  },
  growth: {
    id: "growth",
    name: "Growth",
    tagline: "ACELERA TU PRESENCIA",
    price: 44990,
    annualPrice: 449900,
    postsLimit: 40,
    videosLimit: 6,
    aiImagesLimit: 40,
    aiVideosLimit: 6,
    seoBlogsLimit: 2,
    multiAccount: false,
    maxAccounts: 1,
    isPopular: false,
    ctaText: "Elegir Growth",
    features: [
      "40 publicaciones en redes al mes",
      "6 videos con locución y guión al mes",
      "40 imágenes con nuestros agentes al mes",
      "2 artículos de Blog SEO/GEO al mes",
      "WhatsApp Bot: revisión y aprobación de posts",
      "Todas las redes sociales",
      "1 perfil de marca"
    ]
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "EL MÁS ELEGIDO",
    price: 89990,
    annualPrice: 899900,
    postsLimit: 80,
    videosLimit: 12,
    aiImagesLimit: 80,
    aiVideosLimit: 12,
    seoBlogsLimit: 8,
    multiAccount: false,
    maxAccounts: 1,
    isPopular: true,
    ctaText: "Elegir Pro",
    features: [
      "80 publicaciones en redes al mes",
      "12 videos con locución y guión al mes",
      "80 imágenes con nuestros agentes al mes",
      "8 artículos de Blog SEO/GEO al mes",
      "WhatsApp Bot completo: aprueba, crea copys y ejecuta Radar",
      "Meta Ads integrado + Radar de Nicho",
      "1 perfil de marca"
    ]
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "HASTA 3 CUENTAS",
    price: 169990,
    annualPrice: 1699900,
    postsLimit: 200,
    videosLimit: 30,
    aiImagesLimit: 200,
    aiVideosLimit: 30,
    seoBlogsLimit: 20,
    multiAccount: true,
    maxAccounts: 3,
    isPopular: false,
    ctaText: "Elegir Business",
    features: [
      "200 publicaciones en redes al mes",
      "30 videos con locución y guión al mes",
      "200 imágenes con nuestros agentes al mes",
      "20 artículos de Blog SEO/GEO al mes",
      "WhatsApp Bot multi-marca (alterna cuentas desde el chat)",
      "Hasta 3 marcas o cuentas independientes",
      "Soporte prioritario por WhatsApp"
    ]
  }
};

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "56965909543";
const WA_MSG = encodeURIComponent("¡Hola Santisoft! Quiero saber más sobre un plan personalizado para mi agencia o negocio de mayor volumen.");

export default function PricingPlans() {
  const [plans, setPlans] = useState<Record<string, PlanConfig>>(DEFAULT_PLANS_RECORD);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'anual'>('mensual');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollPlans = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const card = scrollRef.current.querySelector('.plan') as HTMLElement | null;
      const gap = 20;
      const amount = card ? card.offsetWidth + gap : 360;
      scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const snap = await getDoc(doc(db, "system_config", "plans"));
        if (snap.exists()) {
          setPlans(prev => ({ ...prev, ...(snap.data() as Record<string, PlanConfig>) }));
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const getCycleLabel = (plan: PlanConfig) => {
    if (plan.price === 0) return "10 días de prueba · sin tarjeta";
    if (plan.id === 'business') return "CLP / mes · hasta 3 cuentas";
    return billingCycle === 'anual' ? "FACTURADO AL AÑO · IVA INCLUIDO" : "CLP / mes · IVA INCLUIDO";
  };

  return (
    <>
      {/* Toggle mensual / anual */}
      <div className="toggle-row" data-reveal>
        <span className={`toggle-label ${billingCycle === 'mensual' ? 'active' : ''}`}>Mensual</span>
        <div
          className={`toggle-sw ${billingCycle === 'anual' ? 'on' : ''}`}
          onClick={() => setBillingCycle(prev => prev === 'mensual' ? 'anual' : 'mensual')}
        />
        <span className={`toggle-label ${billingCycle === 'anual' ? 'active' : ''}`}>
          Anual <span className="save-badge">-10%</span>
        </span>
      </div>

      {/* Slider de planes */}
      <div className="plans-slider-outer" data-reveal>
        <button
          className="plans-nav-btn left"
          onClick={() => scrollPlans('left')}
          aria-label="Ver planes anteriores"
        >
          ←
        </button>

        {loadingPlans ? (
          <div className="plans-loading">
            <div className="plans-spinner" />
          </div>
        ) : (
          <div className="plans-scroll" ref={scrollRef}>
            {PLAN_ORDER.map((id) => {
              const plan = plans[id];
              if (!plan) return null;

              const priceToShow = billingCycle === 'anual'
                ? (plan.annualPrice > 0 ? plan.annualPrice : (plan.price === 0 ? 0 : Math.round((plan.price * 12) * 0.90)))
                : plan.price;

              const priceLabel = priceToShow === 0 ? "$0" : `$${priceToShow.toLocaleString('es-CL')}`;

              return (
                <div key={id} className={`plan ${plan.isPopular ? 'feat' : ''}`}>
                  <span className="plan-name">{plan.name}</span>
                  <div className="plan-price">
                    {priceLabel}
                    {plan.price > 0 && <span>/mes</span>}
                  </div>
                  <div className="plan-cycle">{getCycleLabel(plan)}</div>
                  <ul className="plan-list">
                    {plan.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                  <Link
                    href={id === "free" ? `/registro?plan=free` : `/confirmar-plan?plan=${id}&billing=${billingCycle}`}
                    className={`btn ${plan.isPopular ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {plan.ctaText || "¡Lo quiero 🚀!"}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <button
          className="plans-nav-btn right"
          onClick={() => scrollPlans('right')}
          aria-label="Ver más planes"
        >
          →
        </button>
      </div>

      {/* Bloque Plan a la Medida / Agencias */}
      <div className="custom-plan-banner" data-reveal>
        <div className="custom-plan-content">
          <span className="custom-plan-icon">🏢</span>
          <div className="custom-plan-text">
            <strong>¿Manejas más de 3 marcas, tienes una agencia o necesitas volumen a tu medida?</strong>
            <p>Armamos un plan personalizado para ti. Sin complicaciones, directo al grano.</p>
          </div>
        </div>
        <div className="custom-plan-actions">
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Hablemos por WhatsApp
          </a>
          <a href="#contacto" className="btn btn-outline">
            Formulario de contacto
          </a>
        </div>
      </div>
    </>
  );
}

