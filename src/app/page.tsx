"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import DotCanvas from '../components/DotCanvas';
import WebChatWidget from '../components/WebChatWidget';
import WhatsAppButton from '../components/WhatsAppButton';
import PromoModal from '../components/PromoModal';
import PageTracker from '../components/PageTracker';

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

const PLAN_ORDER = ["free", "pro", "elite", "business"];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [rubro, setRubro] = useState("");
  const [promo, setPromo] = useState("");
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoOutput, setDemoOutput] = useState("");
  const [showDemoOutput, setShowDemoOutput] = useState(false);
  const [demoType, setDemoType] = useState<'rrss' | 'blog'>('rrss');
  const [demoButtonText, setDemoButtonText] = useState("→ Generar con IA");

  const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'anual'>('mensual');

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // IntersectionObserver for Scroll Reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('on');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubro.trim() || !promo.trim()) {
      alert("Por favor completa los dos campos.");
      return;
    }
    setLoadingDemo(true);
    setDemoButtonText("⏳ Generando...");
    setShowDemoOutput(false);
    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubro, promo, demoType })
      });
      const data = await res.json();
      if (data.error) {
        setDemoOutput("Error al conectar con la IA. Intenta nuevamente.");
      } else {
        setDemoOutput(data.text || "");
      }
      setShowDemoOutput(true);
      setDemoButtonText("→ Generar de nuevo");
    } catch (err) {
      console.error(err);
      setDemoOutput("Error al conectar con la IA. Intenta nuevamente.");
      setShowDemoOutput(true);
      setDemoButtonText("→ Generar de nuevo");
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="landing-page-root relative overflow-x-hidden">
      <PageTracker page="landing" />
      <DotCanvas />

      {/* 1. PromoBanner */}
      <div className="promo-bar">
        OFERTA — <strong style={{ color: 'var(--accent)' }}>4 IMÁGENES Y POSTEOS GRATIS</strong> CADA MES · SIN TARJETA DE CRÉDITO
      </div>

      {/* 2. Nav */}
      <nav>
        <div className="nav-in">
          <Link href="/" className="logo">
            <img src="/favicon.png" alt="Logo" style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '6px' }} />
            SANTISOFT AI
          </Link>
          <Link href="/login" className="nav-btn">
            Empezar Gratis
          </Link>
        </div>
      </nav>

      {/* 3. Hero & DemoCard */}
      <section id="hero">
        <div>
          <div className="hero-eyebrow">Redes Sociales 360° · Blog Automático · SEO & GEO</div>
          <h1>
            Publica solo.<br />Posiciónate <em>solo.</em>
          </h1>
          <p className="hero-body">
            Automatizamos tus redes sociales y tu blog con IA: publicamos en Facebook, Instagram y TikTok, y generamos contenido que te posiciona en Google y en las respuestas de ChatGPT, Perplexity y otros motores de IA. Todo en piloto automático.
          </p>
          <div className="hero-acts">
            <a href="#planes" className="btn-solid">Explorar Planes</a>
            <Link href="/login" className="btn-link">Acceso Cliente</Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-slate-500">
             <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-700">Meta (FB/IG)</span>
             <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-700">TikTok</span>
             <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-700">WordPress / Shopify / Webflow</span>
             <span className="px-3 py-1.5 bg-slate-100/50 border border-slate-200 border-dashed rounded-lg text-slate-400">Google Business (Soon)</span>
             <span className="px-3 py-1.5 bg-slate-100/50 border border-slate-200 border-dashed rounded-lg text-slate-400">LinkedIn (Soon)</span>
          </div>
        </div>

        <div className="demo-card reveal">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold w-max mx-auto">
             <button type="button" onClick={() => setDemoType('rrss')} className={`px-4 py-1.5 rounded-lg transition-all ${demoType === 'rrss' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Genera un post</button>
             <button type="button" onClick={() => setDemoType('blog')} className={`px-4 py-1.5 rounded-lg transition-all ${demoType === 'blog' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Genera una idea de blog SEO</button>
          </div>
          <span className="demo-lbl">Ve la magia en acción — sin registro previo</span>
          <form onSubmit={handleDemoSubmit}>
            <div className="demo-row">
              <label className="demo-flbl" htmlFor="d-rubro">Tu rubro o tipo de negocio</label>
              <input
                className="demo-inp"
                id="d-rubro"
                type="text"
                placeholder="Ej: café especialidad, veterinaria..."
                value={rubro}
                onChange={e => setRubro(e.target.value)}
                required
              />
            </div>
            <div className="demo-row">
              <label className="demo-flbl" htmlFor="d-promo">¿Qué quieres promocionar?</label>
              <input
                className="demo-inp"
                id="d-promo"
                type="text"
                placeholder="Ej: lanzamiento de nuevo menú..."
                value={promo}
                onChange={e => setPromo(e.target.value)}
                required
              />
            </div>
            <button className="demo-btn" id="demo-btn" type="submit" disabled={loadingDemo}>
              {demoButtonText}
            </button>
          </form>
          <div className={`demo-out ${showDemoOutput ? 'on' : ''}`} id="demo-out">
            {demoOutput}
          </div>
          <span className="demo-note">Sin tarjeta de crédito · Completamente gratis</span>
        </div>
      </section>

      {/* 4. Ticker */}
      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker-track" id="ticker">
          <span>Automatización</span><span className="accent">·</span>
          <span>Posicionamiento SEO</span><span className="accent">·</span>
          <span>Optimización GEO</span><span className="accent">·</span>
          <span>Meta API</span><span className="accent">·</span>
          <span>Blogs</span><span className="accent">·</span>
          <span>IA Generativa</span><span className="accent">·</span>
          <span>Sin código</span><span className="accent">·</span>
          <span>Piloto Automático</span><span className="accent">·</span>
          <span>Automatización</span><span className="accent">·</span>
          <span>Posicionamiento SEO</span><span className="accent">·</span>
          <span>Optimización GEO</span><span className="accent">·</span>
          <span>Meta API</span><span className="accent">·</span>
          <span>Blogs</span><span className="accent">·</span>
          <span>IA Generativa</span><span className="accent">·</span>
          <span>Sin código</span><span className="accent">·</span>
          <span>Piloto Automático</span><span className="accent">·</span>
        </div>
      </div>

      {/* 5. ComoFunciona */}
      <section id="como">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="sec-idx">01 — Ecosistema Integral</span>
            <h2>Un flujo <em>invisible,</em><br />para Redes y SEO.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 reveal">
              <h3 className="text-2xl font-black text-slate-900 mb-6">Pilar A — Redes Sociales 360°</h3>
              <ul className="space-y-4 text-slate-600">
                 <li className="flex gap-3"><span className="text-indigo-600 font-bold">✓</span> <p>Generación de contenido persuasivo con IA para redes.</p></li>
                 <li className="flex gap-3"><span className="text-indigo-600 font-bold">✓</span> <p>Calendario estratégico para automatizar todo un mes en minutos.</p></li>
                 <li className="flex gap-3"><span className="text-indigo-600 font-bold">✓</span> <p>Publicación automática directa en Meta (Facebook, Instagram) y TikTok.</p></li>
              </ul>
              <div className="mt-8 flex items-center gap-2 flex-wrap">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">Próximamente: Google Business & LinkedIn</span>
              </div>
            </div>
            
            <div className="bg-slate-900 border-2 border-indigo-500 rounded-3xl p-8 reveal shadow-2xl shadow-indigo-500/20" style={{ transitionDelay: '0.1s' }}>
              <h3 className="text-2xl font-black text-white mb-6">Pilar B — SEO & GEO con Blog</h3>
              <ul className="space-y-4 text-slate-300">
                 <li className="flex gap-3"><span className="text-indigo-400 font-bold">✓</span> <div><p className="font-bold text-white mb-1">Generative Engine Optimization (GEO)</p><p className="text-sm">Optimiza tu negocio para aparecer citado en respuestas de IA (ChatGPT, Perplexity), no solo en Google.</p></div></li>
                 <li className="flex gap-3"><span className="text-indigo-400 font-bold">✓</span> <p>Generación de artículos completos y estructurados con IA experta.</p></li>
                 <li className="flex gap-3"><span className="text-indigo-400 font-bold">✓</span> <p>Publicación automática sin código en tu CMS (WordPress, Shopify, Webflow).</p></li>
              </ul>
              <div className="mt-8">
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 bg-indigo-900/50 px-3 py-1 rounded-full border border-indigo-500/50">Promesa: Tráfico orgánico + Visibilidad en Motores IA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5.5 Que es GEO */}
      <section id="geo-explainer" className="bg-slate-50 py-20 border-y border-slate-200">
        <div className="wrap">
          <div className="sec-head reveal text-center mx-auto mb-12">
            <span className="sec-idx justify-center">02 — El Futuro del Posicionamiento</span>
            <h2>No basta con salir en Google.<br />Hay que salir en la <em>IA.</em></h2>
            <p className="text-slate-600 max-w-2xl mx-auto mt-4">
              Cada vez más personas buscan recomendaciones directamente en ChatGPT, Perplexity o el nuevo Google AI Overviews, en vez de hacer una búsqueda tradicional. Si tu negocio no está optimizado para esos motores, simplemente no existe para esa búsqueda.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 reveal">
              <h3 className="text-2xl font-black text-slate-900 mb-4">SEO Tradicional</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Optimizamos tu blog para que aparezcas en los resultados de búsqueda de Google, con keywords, estructura y contenido de calidad.
              </p>
            </div>
            
            <div className="bg-slate-900 border-2 border-indigo-500 rounded-3xl p-8 reveal shadow-2xl shadow-indigo-500/20" style={{ transitionDelay: '0.1s' }}>
              <h3 className="text-2xl font-black text-white mb-4">GEO — Generative Engine Optimization</h3>
              <p className="text-indigo-200 text-sm leading-relaxed">
                Estructuramos y publicamos tu contenido para que los motores de IA generativa te citen y recomienden como fuente confiable en sus respuestas.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12 reveal">
            <p className="text-lg font-bold text-indigo-600">
              Tu blog, escrito y publicado por IA, trabajando para que la IA te encuentre a ti.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Testimonios */}
      <section id="testimonios">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="sec-idx">03 — Clientes</span>
            <h2>Resultados <em>reales,</em><br />negocios reales.</h2>
          </div>
          <div className="tgrid">
            <div className="tcard reveal">
              <div className="tquote">"</div>
              <p className="ttext">Antes perdía 3 horas a la semana armando posts. Ahora Santisoft lo hace solo y mis publicaciones quedaron mucho más profesionales.</p>
              <span className="tname">VALENTINA R.</span>
              <span className="trole">Café & Pastelería</span>
              <span className="tstars">★★★★★</span>
            </div>
            <div className="tcard reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="tquote">"</div>
              <p className="ttext">El módulo de Blog Automático es una locura. En dos meses mi página empezó a recibir tráfico orgánico y a aparecer en búsquedas sin pagar anuncios.</p>
              <span className="tname">MARCELO T.</span>
              <span className="trole">Consultora de Marketing</span>
              <span className="tstars">★★★★★</span>
            </div>
            <div className="tcard reveal" style={{ transitionDelay: '0.2s' }}>
              <div className="tquote">"</div>
              <p className="ttext">No soy técnica para nada y lo configuré sola en menos de 20 minutos. Ahora publico todos los días sin pensar en ello.</p>
              <span className="tname">ANDREA P.</span>
              <span className="trole">Clínica Veterinaria</span>
              <span className="tstars">★★★★★</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Planes */}
      <section id="planes">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="sec-idx">03 — Planes</span>
            <h2>Escoge tu nivel<br />de <em>automatización.</em></h2>
          </div>
          <span className="pnote">PRECIOS EN PESOS CHILENOS (CLP) — IVA INCLUIDO</span>
          <div className="flex justify-center mt-6 mb-10">
            <div className="bg-slate-100 p-1.5 rounded-full inline-flex">
                <button onClick={() => setBillingCycle('mensual')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === 'mensual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Mensual</button>
                <button onClick={() => setBillingCycle('anual')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'anual' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                    Anual <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">-10%</span>
                </button>
            </div>
          </div>
          <div className="pgrid reveal">
            {loadingPlans ? (
                <div className="col-span-full flex justify-center py-12 w-full"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div></div>
            ) : (
                PLAN_ORDER.map(id => {
                    const plan = plans[id];
                    if (!plan) return null;
                    
                    const priceToShow = billingCycle === 'anual'
                        ? (plan.annualPrice > 0 ? plan.annualPrice : (plan.price === 0 ? 0 : Math.round((plan.price * 12) * 0.90)))
                        : plan.price;

                    return (
                        <div key={id} className={`plan ${plan.isPopular ? 'feat' : ''}`}>
                          {plan.isPopular && <span className="plan-badge">MÁS POPULAR</span>}
                          <h3>{plan.name}</h3>
                          <span className="plan-price">${priceToShow === 0 ? '0' : priceToShow.toLocaleString('es-CL')}</span>
                          <span className="plan-period">{billingCycle === 'anual' ? (plan.price === 0 ? 'SIEMPRE' : 'AL AÑO') : (plan.price === 0 ? 'SIEMPRE' : 'AL MES')}</span>
                          <ul>
                            {plan.features.map((f, i) => <li key={i}>{f}</li>)}
                          </ul>
                          <Link href="/login" className="plan-cta">{plan.ctaText}</Link>
                        </div>
                    );
                })
            )}
          </div>
        </div>
      </section>

      {/* 8. CtaFinal */}
      <section id="cta-final">
        <div className="wrap">
          <div className="cta-in reveal">
            <h2 className="cta-hl">¿Listo para<br />recuperar <em>tu tiempo?</em></h2>
            <Link href="/login" className="btn-white">Empezar Ahora Gratis</Link>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer>
        <div className="foot-in">
          <span className="foot-copy">© 2026 SANTISOFT. TODOS LOS DERECHOS RESERVADOS.</span>
          <div className="foot-links">
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/terminos">Términos</Link>
          </div>
        </div>
      </footer>

      <PromoModal />
      <WhatsAppButton />
      <WebChatWidget />
    </div>
  );
}
