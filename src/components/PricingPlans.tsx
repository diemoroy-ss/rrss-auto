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

const PLAN_ORDER = ["free", "starter", "pro", "business", "agency"];

export default function PricingPlans() {
  const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'anual'>('mensual');
  const plansContainerRef = useRef<HTMLDivElement>(null);

  const scrollPlans = (dir: 'left' | 'right') => {
    if (plansContainerRef.current) {
      const scrollAmount = 360;
      plansContainerRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
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

  return (
    <>
      <div className="toggle-row" data-reveal>
        <span className={`toggle-label ${billingCycle === 'mensual' ? 'active' : ''}`} id="labelM">Mensual</span>
        <div
          className={`toggle-sw ${billingCycle === 'anual' ? 'on' : ''}`}
          id="cycleToggle"
          onClick={() => setBillingCycle(prev => prev === 'mensual' ? 'anual' : 'mensual')}
        ></div>
        <span className={`toggle-label ${billingCycle === 'anual' ? 'active' : ''}`} id="labelA">
          Anual <span className="save-badge">-10%</span>
        </span>
      </div>
      <div className="plans-wrapper" data-reveal>
        <div className="plans">
        {loadingPlans ? (
          <div className="col-span-full flex justify-center py-12 w-full">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="plans-marquee">
            <div className="plans-track">
              {PLAN_ORDER.map((id, index) => {
                const plan = plans[id];
                if (!plan) return null;

                const priceToShow = billingCycle === 'anual'
                  ? (plan.annualPrice > 0 ? plan.annualPrice : (plan.price === 0 ? 0 : Math.round((plan.price * 12) * 0.90)))
                  : plan.price;

                const priceLabel = priceToShow === 0 ? "$0" : `$${priceToShow.toLocaleString('es-CL')}`;

                return (
                  <div key={`${id}-track1`} className={`plan ${plan.isPopular ? 'feat' : ''}`}>
                    <span className="plan-name">{plan.name}</span>
                    <div className="plan-price">
                      {priceLabel}
                      {plan.price > 0 && <span>/mes</span>}
                    </div>
                    <div className="plan-cycle">
                      {plan.price === 0 ? "10 días de prueba" : 
                       (plan.id === 'business' ? "CLP / mes · hasta 2 cuentas" :
                        (plan.id === 'agency' ? "CLP / mes · hasta 10 cuentas" : 
                         (billingCycle === 'anual' ? "FACTURADO AL AÑO" : "CLP · IVA INCLUIDO")))}
                    </div>
                    <ul className="plan-list">
                      {plan.features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                    <Link href={`/registro?plan=${id}&billing=${billingCycle}`} className={`btn ${plan.isPopular ? 'btn-primary' : 'btn-ghost'}`}>
                      {plan.ctaText || "¡Lo quiero 🚀!"}
                    </Link>
                  </div>
                );
              })}
            </div>
            <div className="plans-track">
              {PLAN_ORDER.map((id, index) => {
                const plan = plans[id];
                if (!plan) return null;

                const priceToShow = billingCycle === 'anual'
                  ? (plan.annualPrice > 0 ? plan.annualPrice : (plan.price === 0 ? 0 : Math.round((plan.price * 12) * 0.90)))
                  : plan.price;

                const priceLabel = priceToShow === 0 ? "$0" : `$${priceToShow.toLocaleString('es-CL')}`;

                return (
                  <div key={`${id}-track2`} className={`plan ${plan.isPopular ? 'feat' : ''}`}>
                    <span className="plan-name">{plan.name}</span>
                    <div className="plan-price">
                      {priceLabel}
                      {plan.price > 0 && <span>/mes</span>}
                    </div>
                    <div className="plan-cycle">
                      {plan.price === 0 ? "10 días de prueba" : 
                       (plan.id === 'business' ? "CLP / mes · hasta 2 cuentas" :
                        (plan.id === 'agency' ? "CLP / mes · hasta 10 cuentas" : 
                         (billingCycle === 'anual' ? "FACTURADO AL AÑO" : "CLP · IVA INCLUIDO")))}
                    </div>
                    <ul className="plan-list">
                      {plan.features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                    <Link href={`/registro?plan=${id}&billing=${billingCycle}`} className={`btn ${plan.isPopular ? 'btn-primary' : 'btn-ghost'}`}>
                      {plan.ctaText || "¡Lo quiero 🚀!"}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
