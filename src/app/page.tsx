"use client";
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
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
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoOutput, setDemoOutput] = useState("");
  const [showDemoOutput, setShowDemoOutput] = useState(false);
  const [demoType, setDemoType] = useState<'rrss' | 'blog'>('rrss');
  const [demoButtonText, setDemoButtonText] = useState("→ Generar con IA");

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
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const elements = document.querySelectorAll('[data-reveal]');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [loadingPlans]); // Re-observe when plans load since new DOM elements are added

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubro.trim() || !promo.trim() || !nombre.trim() || !email.trim()) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }
    setLoadingDemo(true);
    setDemoButtonText("Generando...");
    setShowDemoOutput(false);
    setDemoOutput("Escribiendo con IA...");
    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubro, promo, demoType, nombre, email })
      });
      const data = await res.json();
      if (data.error) {
        setDemoOutput("Ocurrió un error generando el contenido. Intenta nuevamente.");
      } else {
        setDemoOutput(data.text || "");
        setShowDemoOutput(true);
      }
    } catch (err) {
      console.error(err);
      setDemoOutput("Ocurrió un error generando el contenido. Intenta nuevamente.");
    } finally {
      setLoadingDemo(false);
      setDemoButtonText("→ Generar con IA");
    }
  };

  return (
    <div className="landing-page-root relative overflow-x-hidden">
      <PageTracker page="landing" />
      <DotCanvas />

      {/* 1. PromoBanner */}
      <div className="promo">
        <span className="on-air"></span>
        OFERTA — <strong>4 IMÁGENES Y POSTEOS GRATIS</strong> CADA MES · SIN TARJETA DE CRÉDITO
      </div>

      {/* 2. Nav */}
      <nav>
        <div className="wrap">
          <Link href="/" className="logo">
            <img src="/favicon.png" alt="Logo" style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '6px' }} />
            SANTISOFT AI
          </Link>
          <div className="nav-links">
            <a href="#planes" className="ghost">Planes</a>
            <Link href="/login" className="ghost">Acceso Cliente</Link>
            <Link href="/login" className="btn btn-primary btn-sm">Empezar Gratis</Link>
          </div>
        </div>
      </nav>

      {/* 3. Hero & Consola Interactiva */}
      <section className="hero" style={{ borderTop: 'none', paddingTop: '80px' }}>
        <div className="radar"></div>
        <div className="wrap">
          <div className="hero-head">
            <span className="eyebrow">Redes 360° <span className="freq">·</span> Blog Automático <span className="freq">·</span> SEO &amp; GEO</span>
            <h1>Que te <em>vean.</em><br />Que te <span className="em-p">citen.</span></h1>
            <p className="sub">Tu marca, al aire 24/7: automatizamos tus redes y tu blog con IA, publicamos en Facebook, Instagram y TikTok, y creamos el contenido que te posiciona en Google y en las respuestas de ChatGPT, Perplexity y otros motores de IA — mientras tú trabajas en tu negocio.</p>
            <div className="hero-ctas">
              <a href="#planes" className="btn btn-primary">Explorar Planes</a>
              <Link href="/login" className="btn btn-ghost">Acceso Cliente</Link>
            </div>
            <div className="badges">
              <span className="badge on"><span className="dot"></span>Meta (FB / IG)</span>
              <span className="badge on"><span class="dot"></span>TikTok</span>
              <span className="badge on"><span class="dot"></span>WordPress / Shopify / Webflow</span>
              <span className="badge"><span class="dot"></span>Google Business — Soon</span>
              <span className="badge"><span class="dot"></span>LinkedIn — Soon</span>
            </div>
          </div>

          <div className="panel dark-screen" data-reveal>
            <div className="panel-topbar">
              <span>CONSOLA DE TRANSMISIÓN — SANTISOFT AI</span>
              <div className="freqs"><span>98.6 FM</span><span>404 TERM</span></div>
            </div>
            <div className="gauges">
              <div className="gauge a">
                <div className="gauge-head">
                  <span className="gauge-name">SEÑAL A — REDES</span>
                  <span className="gauge-status">AL AIRE</span>
                </div>
                <div className="ring-row">
                  <div className="eq-visual"><span></span><span></span><span></span><span></span><span></span></div>
                  <p className="gauge-desc"><b>Meta + TikTok</b>, siempre al aire, con el calendario armado para todo el mes.</p>
                </div>
              </div>
              <div className="gauge b">
                <div className="gauge-head">
                  <span className="gauge-name">SEÑAL B — SEO &amp; GEO</span>
                  <span className="gauge-status">INDEXANDO</span>
                </div>
                <div className="ring-row">
                  <div className="term-visual">&gt; crawling...<br />&gt; cite: true<br />&gt; rank: up<span className="cursor"></span></div>
                  <p className="gauge-desc"><b>Blog en tu CMS</b> optimizado para Google y para que la IA te cite.</p>
                </div>
              </div>
            </div>

            <div className="console">
              <div className="tabs">
                <button
                  className={`tab ${demoType === 'rrss' ? 'active' : ''}`}
                  onClick={() => setDemoType('rrss')}
                  type="button"
                >
                  Genera un post
                </button>
                <button
                  className={`tab ${demoType === 'blog' ? 'active' : ''}`}
                  onClick={() => setDemoType('blog')}
                  type="button"
                >
                  Genera una idea de blog SEO
                </button>
              </div>
              <form onSubmit={handleDemoSubmit} className="console-form">
                <input
                  id="rubro"
                  type="text"
                  placeholder="Rubro del negocio (ej: cafetería, clínica dental)"
                  value={rubro}
                  onChange={(e) => setRubro(e.target.value)}
                  required
                />
                <input
                  id="promo"
                  type="text"
                  placeholder={demoType === 'rrss' ? "¿Qué quieres promocionar?" : "¿Sobre qué tema quieres posicionarte?"}
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  required
                />
                <input
                  id="nombre"
                  type="text"
                  placeholder="Tu Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
                <input
                  id="email"
                  type="email"
                  placeholder="Tu Correo Electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className="gen-btn" id="genBtn" type="submit" disabled={loadingDemo}>
                  <span>{demoButtonText}</span>
                </button>
              </form>
              <div className={`console-out ${showDemoOutput || demoOutput ? 'filled' : ''}`} id="consoleOut">
                {demoOutput || 'Ve la magia en acción — sin registro previo. Completa los campos y presiona "Generar con IA".'}
              </div>
              <div className="console-foot">SIN TARJETA DE CRÉDITO · COMPLETAMENTE GRATIS</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Sección Ecosistema */}
      <section id="ecosistema">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <span className="eyebrow">Ecosistema integral</span>
            <h2>Un flujo invisible, para <em>Redes</em> y <span className="em-p">SEO.</span></h2>
          </div>
          <div className="pillars" data-reveal>
            <div className="pillar a">
              <span className="pillar-tag">SEÑAL A · 98.6 FM</span>
              <h3>Redes Sociales 360°</h3>
              <ul className="pillar-list">
                <li><span className="mark">›</span><span>Generación de <strong>contenido persuasivo</strong> con IA, adaptado a tu marca.</span></li>
                <li><span className="mark">›</span><span><strong>Calendario estratégico</strong> que automatiza todo un mes en minutos.</span></li>
                <li><span className="mark">›</span><span>Publicación automática directa en <strong>Meta (Facebook, Instagram)</strong> y <strong>TikTok</strong>.</span></li>
              </ul>
              <span className="pillar-note">Próximamente: Google Business &amp; LinkedIn</span>
            </div>
            <div className="pillar b">
              <span className="pillar-tag">SEÑAL B · 404 TERM</span>
              <h3>SEO &amp; GEO con Blog</h3>
              <ul className="pillar-list">
                <li><span className="mark">›</span><span><strong>Generative Engine Optimization (GEO):</strong> apareces citado en respuestas de ChatGPT y Perplexity, no solo en Google.</span></li>
                <li><span className="mark">›</span><span>Generación de <strong>artículos completos</strong> y estructurados con IA experta.</span></li>
                <li><span className="mark">›</span><span>Publicación automática y sin código en tu <strong>CMS</strong> (WordPress, Shopify, Webflow).</span></li>
              </ul>
              <span className="pillar-note">Promesa: tráfico orgánico + visibilidad en motores IA</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sección ¿Qué es GEO? */}
      <section id="geo">
        <div className="wrap">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">El futuro del posicionamiento</span>
            <h2>No basta con salir en Google.<br />Hay que salir en la <em>IA.</em></h2>
          </div>
          <p style={{ maxWidth: '620px', margin: '-28px auto 40px', textAlign: 'center', color: 'var(--ink-dim)', fontSize: '15px', lineHeight: '1.65' }} data-reveal>
            Cada vez más personas piden recomendaciones directo a ChatGPT, Perplexity o Google AI Overviews, en vez de hacer una búsqueda tradicional. Si tu negocio no está optimizado para esos motores, simplemente no existe para esa búsqueda.
          </p>
          <div className="geo-compare" data-reveal>
            <div className="geo-card old">
              <span className="k">CANAL ANÁLOGO</span>
              <h4>SEO Tradicional</h4>
              <p>Optimizamos tu blog para que aparezcas en los resultados de búsqueda de Google, con keywords, estructura y contenido de calidad.</p>
            </div>
            <div className="geo-card new dark-screen">
              <span className="k">CANAL DIGITAL</span>
              <h4>GEO — Generative Engine Optimization</h4>
              <p>Estructuramos y publicamos tu contenido para que los motores de IA generativa te citen y recomienden como fuente confiable en sus respuestas.</p>
            </div>
          </div>
          <p className="geo-closing" data-reveal>"Tu blog, escrito y publicado por IA, trabajando para que la IA te encuentre a ti."</p>
        </div>
      </section>

      {/* 6. Testimonios */}
      <section id="clientes">
        <div className="wrap">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">Clientes</span>
            <h2>Resultados <em>reales,</em> negocios reales.</h2>
          </div>
          <div className="t-grid" data-reveal>
            <div className="t-card">
              <p className="t-quote">"Antes perdía 3 horas a la semana armando posts. Ahora Santisoft lo hace solo y mis publicaciones quedaron mucho más profesionales."</p>
              <div className="t-who">
                <div className="t-avatar">VR</div>
                <div><div className="t-name">Valentina R.</div><div className="t-biz">CAFÉ &amp; PASTELERÍA</div></div>
              </div>
            </div>
            <div className="t-card">
              <p className="t-quote">"El módulo de Blog Automático es una locura. En dos meses mi página empezó a recibir tráfico orgánico y a aparecer en búsquedas sin pagar anuncios."</p>
              <div className="t-who">
                <div className="t-avatar">MT</div>
                <div><div className="t-name">Marcelo T.</div><div className="t-biz">CONSULTORA DE MARKETING</div></div>
              </div>
            </div>
            <div className="t-card">
              <p className="t-quote">"No soy técnica para nada y lo configuré sola en menos de 20 minutos. Ahora publico todos los días sin pensar en ello."</p>
              <div className="t-who">
                <div className="t-avatar">AP</div>
                <div><div className="t-name">Andrea P.</div><div className="t-biz">CLÍNICA VETERINARIA</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Planes */}
      <section id="planes">
        <div className="wrap">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">Planes</span>
            <h2>Escoge tu nivel de <em>automatización.</em></h2>
          </div>
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
          <div className="plans-wrapper group" data-reveal>
            {/* Arrows for Desktop */}
            <button 
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg z-10 hidden md:flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:scale-105 transition-all opacity-0 group-hover:opacity-100" 
              onClick={() => scrollPlans('left')}
            >
              ❮
            </button>
            <button 
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg z-10 hidden md:flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:scale-105 transition-all opacity-0 group-hover:opacity-100" 
              onClick={() => scrollPlans('right')}
            >
              ❯
            </button>
            <div className="plans" ref={plansContainerRef}>
            {loadingPlans ? (
              <div className="col-span-full flex justify-center py-12 w-full">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              PLAN_ORDER.map(id => {
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
                    <div className="plan-cycle">
                      {plan.price === 0 ? "PARA SIEMPRE" : (billingCycle === 'anual' ? "FACTURADO AL AÑO" : "CLP · IVA INCLUIDO")}
                    </div>
                    <ul className="plan-list">
                      {plan.features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                    <Link href="/login" className={`btn ${plan.isPopular ? 'btn-primary' : 'btn-ghost'}`}>
                      {plan.ctaText}
                    </Link>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA Final */}
      <div className="final-cta">
        <div className="radar"></div>
        <div className="wrap">
          <h2>¿Listo para recuperar <em>tu tiempo?</em></h2>
          <Link href="/login" className="btn btn-primary">Empezar Ahora Gratis</Link>
        </div>
      </div>

      {/* 9. Footer */}
      <footer>
        <div className="wrap">
          <span className="fmono"><span className="on-air"></span>© 2026 SANTISOFT. TODOS LOS DERECHOS RESERVADOS.</span>
          <div className="flinks">
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
