"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function PlanesPage() {
  const router = useRouter();
  const [userPlan, setUserPlan] = useState("free");
  const [planes, setPlanes] = useState<any[]>([]);
  const [isAnnual, setIsAnnual] = useState(false);
  const [annualBillingType, setAnnualBillingType] = useState<'single' | 'monthly_discount'>('monthly_discount');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      // 1. Fetch User Plan
      if (user) {
        const d = await getDoc(doc(db, "users", user.uid));
        if (d.exists()) {
          setUserPlan(d.data().plan || "free");
        }
      }

      // 2. Fetch Plans Config
      try {
        const plansDoc = await getDoc(doc(db, "system_config", "plans"));
        if (plansDoc.exists()) {
          const data = plansDoc.data();
          const PLAN_ORDER = ['free', 'starter', 'growth', 'pro', 'business', 'agency'];
          const allPlanKeys = Array.from(new Set([...PLAN_ORDER, ...Object.keys(data)]));
          
          const formattedPlanes = allPlanKeys.map(id => {
            const plan = data[id];
            if (!plan) return null;

            const fullAnnualPrice = plan.annualPrice || Math.round((plan.price * 12) * 0.84);
            const monthlyDiscountedPrice = Math.round(fullAnnualPrice / 12);

            return {
              ...plan,
              id,
              priceFormatted: (plan.price || 0).toLocaleString('es-CL'),
              annualSingleFormatted: fullAnnualPrice.toLocaleString('es-CL'),
              annualMonthlyFormatted: monthlyDiscountedPrice.toLocaleString('es-CL'),
              period: id === 'free' ? '/siempre' : '/mes',
              periodAnnualSingle: id === 'free' ? '/siempre' : '/año',
              periodAnnualMonthly: id === 'free' ? '/siempre' : '/mes (compromiso anual)',
              button: plan.ctaText || (id === 'free' ? 'Seleccionar Gratis' : (id === 'pro' ? 'Suscribirme Pro' : 'Elegir Plan')),
              accent: plan.isPopular || id === 'pro'
            };
          }).filter(Boolean);
          setPlanes(formattedPlanes);
        }
      } catch (e) {
        console.error("Error fetching plans:", e);
      }
      
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return;
    router.push(`/confirmar-plan?plan=${encodeURIComponent(planId)}&billing=${isAnnual ? 'anual' : 'mensual'}&from=panel`);
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="text-left mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">Tu Plan de <br/><span className="text-indigo-600">Automatización.</span></h1>
        <p className="text-slate-500 text-lg max-w-2xl font-medium mb-8">Elige el nivel de potencia que tu marca necesita. Escala en cualquier momento.</p>
        
        {/* Toggle Billing Period */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
              <button 
                  onClick={() => setIsAnnual(false)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${!isAnnual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Mensual
              </button>
              <button 
                  onClick={() => setIsAnnual(true)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${isAnnual ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Anual <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${isAnnual ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>-16%</span>
              </button>
          </div>

          {/* Sub-toggle para modalidad anual */}
          {isAnnual && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setAnnualBillingType('monthly_discount')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${annualBillingType === 'monthly_discount' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 hover:bg-indigo-100'}`}
              >
                💳 Cobro Mensual Descontado
              </button>
              <button
                onClick={() => setAnnualBillingType('single')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${annualBillingType === 'single' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 hover:bg-indigo-100'}`}
              >
                🗓️ Pago Único Anual
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl font-bold flex items-start gap-3 animate-in fade-in slide-in-from-top-4 w-full break-words overflow-hidden ${
          message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        }`}>
          <span className="shrink-0 mt-0.5">{message.type === 'error' ? '⚠️' : '✅'}</span>
          <span className="break-words w-full">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {planes.map((plan) => (
          <div 
            key={plan.id} 
            className={`premium-card relative flex flex-col group ${
              plan.accent 
              ? 'border-indigo-200 ring-4 ring-indigo-500/5' 
              : ''
            }`}
          >
            {plan.accent && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-xl shadow-indigo-600/30 z-10 animate-bounce">
                Más Elegido
              </span>
            )}

            <div className="mb-10">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{plan.name}</h3>
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">
                  ${!isAnnual || plan.id === 'free' 
                    ? plan.priceFormatted 
                    : (annualBillingType === 'monthly_discount' ? plan.annualMonthlyFormatted : plan.annualSingleFormatted)}
                </span>
                <span className="text-slate-400 font-bold text-xs max-w-full">
                  {!isAnnual || plan.id === 'free' 
                    ? plan.period 
                    : (annualBillingType === 'monthly_discount' ? plan.periodAnnualMonthly : plan.periodAnnualSingle)}
                </span>
              </div>
            </div>

            <ul className="space-y-5 mb-12 flex-1">
              {plan.features?.map((f: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-semibold group-hover:text-slate-900 transition-colors">
                  <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={userPlan === plan.id}
              className={`w-full py-5 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all ${
                userPlan === plan.id
                ? 'bg-slate-100 text-slate-400 cursor-default border border-slate-200'
                : plan.accent
                  ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-1'
                  : 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-1 shadow-xl shadow-slate-900/10'
              }`}
            >
              {userPlan === plan.id ? 'Plan Actual' : plan.button}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-24 rounded-[32px] p-12 md:p-16 bg-slate-900 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40 border border-slate-800">
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 blur-[120px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 blur-[90px] -ml-20 -mb-20 rounded-full pointer-events-none"></div>
         
         <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-white/10 backdrop-blur-sm shadow-inner">🏢</div>
            <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight text-white drop-shadow-sm">¿Eres una Gran Agencia o necesitas más de <br/>10 marcas?</h2>
            <p className="text-slate-300 mb-10 max-w-2xl mx-auto text-lg font-medium leading-relaxed drop-shadow-xs">Gestionamos planes Ultra Business. Analítica unificada, reportes de marca blanca y volumen infinito.</p>
            <Link href="mailto:contacto@santisoft.cl?subject=Consulta%20Plan%20Ultra%20Business%20-%20Santisoft" className="inline-block px-12 py-5 bg-white text-slate-900 font-black rounded-2xl transition-all shadow-xl hover:bg-slate-100 hover:scale-[1.05] uppercase tracking-widest text-sm">
                Contactar a Ventas
            </Link>
         </div>
      </div>
    </div>
  );
}
