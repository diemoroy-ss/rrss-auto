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
  const [demoButtonText, setDemoButtonText] = useState("→ Generar post con IA");

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
        body: JSON.stringify({ rubro, promo })
      });
      const data = await res.json();
      if (data.error) {
        setDemoOutput("Error al conectar con la IA. Intenta nuevamente.");
      } else {
        setDemoOutput(data.text || "");
      }
      setShowDemoOutput(true);
      setDemoButtonText("→ Generar otro post");
    } catch (err) {
      console.error(err);
      setDemoOutput("Error al conectar con la IA. Intenta nuevamente.");
      setShowDemoOutput(true);
      setDemoButtonText("→ Generar otro post");
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
          <div className="hero-eyebrow">Redes Sociales · Blogs · Posicionamiento SEO & GEO</div>
          <h1>
            Tu Presencia Digital<br />en <em>Piloto<br />Automático.</em>
          </h1>
          <p className="hero-body">
            Conectamos IA con tus redes y tu sitio web para generar, optimizar y publicar contenido SEO sin mover un dedo. Listo para la era de la IA.
          </p>
          <div className="hero-acts">
            <a href="#planes" className="btn-solid">Explorar Planes</a>
            <Link href="/login" className="btn-link">Acceso Cliente</Link>
          </div>
        </div>

        <div className="demo-card reveal">
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
          <div className="steps">
            <div className="step reveal">
              <span className="step-n">01</span>
              <h3>Generación con IA (RRSS & Blog)</h3>
              <p>Solo dinos tu idea. Nuestra IA redacta el copy perfecto para tus redes sociales o un artículo SEO completo para tu blog.</p>
            </div>
            <div className="step reveal" style={{ transitionDelay: '0.1s' }}>
              <span className="step-n">02</span>
              <h3>Calendario Estratégico</h3>
              <p>Visualiza y organiza todo tu contenido. Automatiza la publicación de todo un mes en cuestión de minutos.</p>
            </div>
            <div className="step reveal" style={{ transitionDelay: '0.2s' }}>
              <span className="step-n">03</span>
              <h3>Publicación Automática 360°</h3>
              <p>Nos conectamos a Meta, TikTok, LinkedIn y también a tu CMS (WordPress, Shopify, Webflow) para publicar por ti 24/7.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonios */}
      <section id="testimonios">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="sec-idx">02 — Clientes</span>
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
              <p className="ttext">Lo que más me convenció fue probarlo gratis. En 10 minutos vi cómo la IA creaba un post real para mi negocio. Inmediato.</p>
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
