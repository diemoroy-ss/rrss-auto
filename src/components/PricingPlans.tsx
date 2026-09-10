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

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "56965909543";
const WA_MSG = encodeURIComponent("¡Hola Santisoft! Quiero saber más sobre un plan personalizado para mi agencia o negocio de mayor volumen.");

export default function PricingPlans() {
  const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
  const [loadingPlans, setLoadingPlans] = useState(true);
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
          setPlans(snap.data() as Record<string, PlanConfig>);
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

