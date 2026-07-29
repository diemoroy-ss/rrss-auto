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

const HERO_VIDEOS = [
  { src: '/rrss1.mp4', label: 'Intro · Santisoft AI' },
  { src: '/rrss2.mp4', label: 'Generación de Contenido' },
  { src: '/rrss3.mp4', label: 'Estrategia de 14 días' },
  { src: '/rrss4.mp4', label: 'Publicación Automática' },
  { src: '/rrss5.mp4', label: 'Métricas y Reportes' },
  { src: '/rrss6.mp4', label: 'Empieza Gratis Hoy' },
];

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
  const [typedOutput, setTypedOutput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedStep, setAdvancedStep] = useState(0); 
  const [advancedImgUrl, setAdvancedImgUrl] = useState("");

  const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'anual'>('mensual');

  const [contactForm, setContactForm] = useState({ nombre: '', email: '', telefono: '', rubro: '', mensaje: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const [activeHeroVideo, setActiveHeroVideo] = useState(0);
  const [modalVideoIndex, setModalVideoIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Auto-rotate hero videos every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroVideo((prev) => (prev + 1) % HERO_VIDEOS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Keyboard navigation for video modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalVideoIndex === null) return;
      if (e.key === 'ArrowLeft') {
        setModalVideoIndex((prev) => (prev === null ? 0 : (prev === 0 ? HERO_VIDEOS.length - 1 : prev - 1)));
      } else if (e.key === 'ArrowRight') {
        setModalVideoIndex((prev) => (prev === null ? 0 : (prev === HERO_VIDEOS.length - 1 ? 0 : prev + 1)));
      } else if (e.key === 'Escape') {
        setModalVideoIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalVideoIndex]);

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
    setShowAdvancedModal(true);
    setAdvancedStep(1); // Analizando solicitud
    
    // Simular pasos mientras se espera para mejor UX
    const stepTimer1 = setTimeout(() => setAdvancedStep(2), 2000); // Paso 2
    const stepTimer2 = setTimeout(() => setAdvancedStep(3), 12000); // Paso 3 (esperar imagen toma tiempo)

    try {
      const res = await fetch("/api/generate-demo-advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubro, promo, demoType, nombre, email })
      });
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      
      const data = await res.json();
      if (data.error) {
        alert("Ocurrió un error generando el contenido. Intenta nuevamente.");
        setShowAdvancedModal(false);
      } else {
        setDemoOutput(data.text || "");
        setAdvancedImgUrl(data.imgUrl || "");
        setAdvancedStep(4); // Finalizado
        
        // Typewriter en el modal
        setIsTyping(true);
        setTypedOutput("");
        const textToType = data.text || "";
        let i = 0;
        const typeChar = () => {
          if (i < textToType.length) {
            setTypedOutput(textToType.substring(0, i + 1));
            i++;
            setTimeout(typeChar, 15);
          } else {
            setIsTyping(false);
          }
        };
        typeChar();
      }
    } catch (err) {
      console.error(err);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      alert("Ocurrió un error generando el contenido. Intenta nuevamente.");
      setShowAdvancedModal(false);
    } finally {
      setLoadingDemo(false);
      setDemoButtonText("→ Generar con IA");
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('loading');
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm)
      });
      if (!res.ok) throw new Error("Error sending contact");
      setContactStatus('success');
      setContactForm({ nombre: '', email: '', telefono: '', rubro: '', mensaje: '' });
    } catch (err) {
      console.error(err);
      setContactStatus('error');
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

          {/* Desktop links — hidden on mobile via CSS */}
          <div className="nav-links">
            <a href="#planes" className="ghost">Planes</a>
            <Link href="/login" className="ghost">Acceso Cliente</Link>
            <Link href="/login" className="btn btn-primary btn-sm">Empezar Gratis</Link>
          </div>

          {/* Mobile controls — hidden on desktop via CSS */}
          <div className="nav-mobile-controls">
            <Link href="/login" className="btn btn-primary btn-sm nav-mobile-cta">Empezar</Link>
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="nav-hamburger"
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
            >
              <span className={`nav-bar ${mobileMenuOpen ? 'bar-open-1' : ''}`} />
              <span className={`nav-bar ${mobileMenuOpen ? 'bar-open-2' : ''}`} />
              <span className={`nav-bar ${mobileMenuOpen ? 'bar-open-3' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="nav-mobile-menu">
            <a
              href="#planes"
              onClick={() => setMobileMenuOpen(false)}
              className="nav-mobile-item"
            >
              Planes <span>↓</span>
            </a>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="nav-mobile-item"
            >
              Acceso Cliente <span>→</span>
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-primary nav-mobile-cta-full"
            >
              Empezar Gratis 🚀
            </Link>
          </div>
        )}
      </nav>

      {/* 3. Hero & Consola Interactiva */}
      <section className="hero" style={{ borderTop: 'none', paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="radar"></div>
        <div className="wrap flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          <div className="hero-head lg:w-1/2 lg:text-left text-center m-0 max-w-none flex flex-col items-center lg:items-start z-10 relative">
            <span className="eyebrow">Redes 360° <span className="freq">·</span> Blog Automático <span className="freq">·</span> SEO &amp; GEO</span>
            <h1 className="lg:text-left text-center leading-tight mt-5">Que te <em>vean.</em><br />Que te <span className="em-p">citen.</span></h1>
            <p className="sub lg:text-left text-center lg:mx-0 mx-auto mt-6">Tu marca, al aire 24/7: automatizamos tus redes y tu blog con IA, publicamos en Facebook, Instagram y TikTok, y creamos el contenido que te posiciona en Google y en las respuestas de ChatGPT, Perplexity y otros motores de IA — mientras tú trabajas en tu negocio.</p>
            <div className="hero-ctas justify-center lg:justify-start mt-8 w-full">
              <a href="#planes" className="btn btn-primary">Explorar Planes</a>
              <Link href="/login" className="btn btn-ghost">Acceso Cliente</Link>
            </div>
            <div className="badges justify-center lg:justify-start w-full mt-10">
              <span className="badge on"><span className="dot"></span>Meta (FB / IG)</span>
              <span className="badge on"><span className="dot"></span>TikTok</span>
              <span className="badge on"><span className="dot"></span>CMS/Blog</span>
              <span className="badge"><span className="dot"></span>Google Biz — Soon</span>
              <span className="badge"><span className="dot"></span>LinkedIn — Soon</span>
            </div>
          </div>

          <div className="hero-carousel-col lg:w-1/2 w-full flex justify-center lg:justify-end z-10 relative">
            <div 
              onClick={() => setModalVideoIndex(activeHeroVideo)}
              className="hero-carousel-wrap relative aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10 group cursor-pointer w-[160px] sm:w-[220px] md:w-[280px] lg:w-full lg:max-w-[360px]"
            >
              {HERO_VIDEOS.map((v, i) => (
                <div key={i} className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${i === activeHeroVideo ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                  {/* Using object-cover for video to fill 9:16 aspect ratio properly */}
                  <video src={v.src} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                  <div className="absolute top-6 left-0 right-0 flex justify-center px-4">
                     <span className="bg-black/60 backdrop-blur-md text-white/90 px-4 py-1.5 rounded-full text-[10px] font-mono tracking-widest border border-white/10 uppercase shadow-lg text-center leading-tight">
                       {v.label}
                     </span>
                  </div>
                </div>
              ))}

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 z-20 pointer-events-none p-4 text-center">
                <div className="w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl scale-95 group-hover:scale-100 transition-transform">
                  <svg className="w-7 h-7 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <span className="bg-black/80 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full border border-white/20 shadow-lg">
                  🔊 Clic para agrandar y escuchar audio
                </span>
              </div>

              {/* Speaker badge trigger */}
              <div className="absolute top-6 right-4 z-30">
                <span className="bg-black/70 backdrop-blur-md text-white/90 p-2 rounded-full border border-white/20 shadow-md flex items-center justify-center text-xs">
                  🔊
                </span>
              </div>
              
              <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <button 
                    key={idx} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveHeroVideo(idx);
                    }} 
                    className={`h-2 rounded-full transition-all duration-300 ${idx === activeHeroVideo ? 'w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="wrap mt-20 z-10 relative">
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
              <div className={`console-out ${showDemoOutput || demoOutput ? 'filled' : ''}`} id="consoleOut" style={{ whiteSpace: 'pre-wrap' }}>
                {typedOutput || (!demoOutput ? 'Ve la magia en acción — sin registro previo. Completa los campos y presiona "Generar con IA".' : '')}
                {isTyping && <span className="animate-pulse inline-block ml-1">▋</span>}
                
                {showDemoOutput && !isTyping && demoOutput && (
                  <div className="mt-8 flex justify-center animate-fade-in">
                    <Link href="#planes" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem' }}>
                      🚀 Automatizar mis redes ahora
                    </Link>
                  </div>
                )}
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

      {/* 8. Planes */}
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
                    <Link href={`/registro?plan=${id}&billing=${billingCycle}`} className={`btn ${plan.isPopular ? 'btn-primary' : 'btn-ghost'}`}>
                      ¡Lo quiero 🚀!
                    </Link>
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Contacto */}
      <section id="contacto" className="relative">
        <div className="wrap relative z-10 max-w-3xl">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">Contacto</span>
            <h2>¿Tienes dudas? <em>Hablemos.</em></h2>
            <p className="mt-4 text-slate-500 font-sans max-w-lg mx-auto">Déjanos tus datos y te contactaremos a la brevedad para ayudarte a potenciar tu negocio.</p>
          </div>
          
          <div className="panel p-8 md:p-10" data-reveal>
            {contactStatus === 'success' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#2C8A4E]/20 text-[#2C8A4E] rounded-full flex items-center justify-center text-3xl mx-auto mb-6">✓</div>
                <h3 className="text-xl font-bold font-serif mb-2">¡Mensaje enviado con éxito!</h3>
                <p className="text-slate-500 font-sans">Hemos recibido tus datos. Nos pondremos en contacto contigo muy pronto al correo que nos dejaste.</p>
                <button onClick={() => setContactStatus('idle')} className="mt-8 btn btn-ghost">Enviar otro mensaje</button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-5 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Nombre completo *</label>
                    <input required type="text" value={contactForm.nombre} onChange={e => setContactForm({...contactForm, nombre: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] focus:outline-none focus:ring-1 focus:ring-[#DD4B19] transition-all" placeholder="Ej. Juan Pérez" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Correo electrónico *</label>
                    <input required type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] focus:outline-none focus:ring-1 focus:ring-[#DD4B19] transition-all" placeholder="juan@empresa.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Teléfono / WhatsApp</label>
                    <input type="tel" value={contactForm.telefono} onChange={e => setContactForm({...contactForm, telefono: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] focus:outline-none focus:ring-1 focus:ring-[#DD4B19] transition-all" placeholder="+56 9 1234 5678" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Rubro o Empresa</label>
                    <input type="text" value={contactForm.rubro} onChange={e => setContactForm({...contactForm, rubro: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] focus:outline-none focus:ring-1 focus:ring-[#DD4B19] transition-all" placeholder="Ej. Inmobiliaria, Clínica..." />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">¿En qué podemos ayudarte? *</label>
                  <textarea required rows={4} value={contactForm.mensaje} onChange={e => setContactForm({...contactForm, mensaje: e.target.value})} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#DD4B19] focus:outline-none focus:ring-1 focus:ring-[#DD4B19] transition-all resize-none" placeholder="Escribe tu consulta aquí..."></textarea>
                </div>
                
                {contactStatus === 'error' && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">Hubo un problema enviando el mensaje. Por favor intenta de nuevo.</div>
                )}
                
                <button type="submit" disabled={contactStatus === 'loading'} className="btn btn-primary mt-2 justify-center py-3.5 text-sm">
                  {contactStatus === 'loading' ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 9. CTA Final */}
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

      {showAdvancedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl relative">
            <button onClick={() => setShowAdvancedModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-2xl leading-none">&times;</button>
            <div className="p-8">
              {advancedStep < 4 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-8 w-full max-w-sm mx-auto">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2 font-serif text-slate-800">Generando la magia...</h3>
                    <p className="text-slate-500 text-sm">Esto tomará unos 20-30 segundos.</p>
                  </div>
                  
                  <div className="flex flex-col gap-4 w-full text-left">
                    {/* Paso 1 */}
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${advancedStep > 1 ? 'bg-green-500 text-white' : (advancedStep === 1 ? 'border-2 border-[#DD4B19] text-[#DD4B19]' : 'border-2 border-slate-200')}`}>
                        {advancedStep > 1 ? '✓' : (advancedStep === 1 ? <span className="w-2 h-2 bg-[#DD4B19] rounded-full animate-pulse"></span> : '')}
                      </div>
                      <span className={`text-sm ${advancedStep >= 1 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>Analizando solicitud e industria</span>
                    </div>

                    {/* Paso 2 */}
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${advancedStep > 2 ? 'bg-green-500 text-white' : (advancedStep === 2 ? 'border-2 border-[#DD4B19] text-[#DD4B19]' : 'border-2 border-slate-200')}`}>
                        {advancedStep > 2 ? '✓' : (advancedStep === 2 ? <span className="w-2 h-2 bg-[#DD4B19] rounded-full animate-pulse"></span> : '')}
                      </div>
                      <span className={`text-sm ${advancedStep >= 2 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>Creando recursos gráficos con IA</span>
                    </div>

                    {/* Paso 3 */}
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${advancedStep > 3 ? 'bg-green-500 text-white' : (advancedStep === 3 ? 'border-2 border-[#DD4B19] text-[#DD4B19]' : 'border-2 border-slate-200')}`}>
                        {advancedStep > 3 ? '✓' : (advancedStep === 3 ? <span className="w-2 h-2 bg-[#DD4B19] rounded-full animate-pulse"></span> : '')}
                      </div>
                      <span className={`text-sm ${advancedStep >= 3 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>Escribiendo texto y validando calidad</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="text-center border-b border-slate-100 pb-4">
                    <h3 className="text-2xl font-bold text-slate-800 font-serif">¡Tu contenido está listo!</h3>
                    <p className="text-sm text-slate-500 mt-1">También hemos enviado una copia a tu correo electrónico.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Imagen Generada</span>
                      <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-square flex items-center justify-center">
                        {advancedImgUrl ? (
                          <>
                            <img src={advancedImgUrl} alt="Generado por IA" className="w-full h-full object-cover" />
                            {/* Watermark Overlay CSS */}
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-30 select-none overflow-hidden mix-blend-overlay">
                              <div className="transform -rotate-45 text-white font-black text-4xl tracking-widest drop-shadow-lg" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                                SANTISOFT.CL
                              </div>
                              <div className="transform -rotate-45 text-white font-black text-4xl tracking-widest drop-shadow-lg mt-12" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                                SANTISOFT.CL
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                            <span className="text-2xl">🖼️</span>
                            <span>Sin imagen generada</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Texto ({demoType === 'blog' ? 'Blog SEO' : 'Redes Sociales'})</span>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap h-full max-h-[400px] overflow-y-auto">
                        {typedOutput}
                        {isTyping && <span className="animate-pulse inline-block ml-1">▋</span>}
                      </div>
                    </div>
                  </div>
                  
                  {!isTyping && (
                    <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-6 border-t border-slate-100 justify-center">
                      <Link href="#planes" onClick={() => setShowAdvancedModal(false)} className="btn btn-ghost flex-1 justify-center border border-slate-200">Ver planes</Link>
                      <Link href={`/agendar?n=${encodeURIComponent(nombre)}&e=${encodeURIComponent(email)}`} onClick={() => setShowAdvancedModal(false)} className="btn btn-primary flex-1 justify-center">Agendar demostración</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Video Fullscreen Carousel */}
      {modalVideoIndex !== null && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6 animate-fade-in"
          onClick={() => setModalVideoIndex(null)}
        >
          {/* Main Modal Container */}
          <div 
            className="relative max-w-sm sm:max-w-md w-full flex flex-col items-center justify-center bg-slate-900/95 rounded-3xl p-3 sm:p-5 border border-white/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between px-2 pb-3 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-white/90 bg-indigo-600/60 px-3 py-1 rounded-full border border-indigo-400/30">
                  {HERO_VIDEOS[modalVideoIndex].label}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {modalVideoIndex + 1}/{HERO_VIDEOS.length}
                </span>
              </div>
              <button 
                onClick={() => setModalVideoIndex(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors"
                aria-label="Cerrar video"
              >
                ✕
              </button>
            </div>

            {/* Video Container with Side Navigation Arrows */}
            <div className="relative w-full aspect-[9/16] max-h-[55vh] sm:max-h-[70vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-inner group">
              <video 
                key={modalVideoIndex}
                src={HERO_VIDEOS[modalVideoIndex].src} 
                controls 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />

              {/* Prev Button */}
              <button 
                onClick={() => setModalVideoIndex((prev) => (prev === null ? 0 : (prev === 0 ? HERO_VIDEOS.length - 1 : prev - 1)))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center text-lg shadow-xl transition-transform hover:scale-110 active:scale-95 z-30"
                title="Video anterior"
              >
                ❮
              </button>

              {/* Next Button */}
              <button 
                onClick={() => setModalVideoIndex((prev) => (prev === null ? 0 : (prev === HERO_VIDEOS.length - 1 ? 0 : prev + 1)))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center text-lg shadow-xl transition-transform hover:scale-110 active:scale-95 z-30"
                title="Siguiente video"
              >
                ❯
              </button>
            </div>
            
            {/* Modal Bottom Dots Navigation */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {HERO_VIDEOS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setModalVideoIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === modalVideoIndex ? 'w-6 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                  aria-label={`Ver video ${idx + 1}`}
                />
              ))}
            </div>

            <p className="text-[10px] text-slate-400 font-mono mt-2 text-center">
              💡 Usa las flechas ❮ ❯ o el teclado (← →) para cambiar de video
            </p>
          </div>
        </div>
      )}

      <PromoModal />
      <WhatsAppButton />
      <WebChatWidget />
    </div>
  );
}
