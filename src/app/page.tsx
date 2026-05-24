"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import DotCanvas from '../components/DotCanvas';
import WebChatWidget from '../components/WebChatWidget';
import WhatsAppButton from '../components/WhatsAppButton';
import PromoModal from '../components/PromoModal';
import PageTracker from '../components/PageTracker';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [rubro, setRubro] = useState("");
  const [promo, setPromo] = useState("");
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoOutput, setDemoOutput] = useState("");
  const [showDemoOutput, setShowDemoOutput] = useState(false);
  const [demoButtonText, setDemoButtonText] = useState("→ Generar post con IA");

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
            <span className="logo-dot"></span>SANTISOFT AI
          </Link>
          <Link href="/login" className="nav-btn">
            Empezar Gratis
          </Link>
        </div>
      </nav>

      {/* 3. Hero & DemoCard */}
      <section id="hero">
        <div>
          <div className="hero-eyebrow">Automatización RRSS · Meta · LinkedIn · TikTok</div>
          <h1>
            Tus Redes Sociales<br />en <em>Piloto<br />Automático.</em>
          </h1>
          <p className="hero-body">
            Conectamos IA con tus cuentas de Meta para que generes, agendes y publiques contenido sin mover un dedo.
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
          <span>Meta API</span><span className="accent">·</span>
          <span>TikTok</span><span className="accent">·</span>
          <span>LinkedIn</span><span className="accent">·</span>
          <span>24 / 7</span><span className="accent">·</span>
          <span>IA Generativa</span><span className="accent">·</span>
          <span>Sin código</span><span className="accent">·</span>
          <span>Copy perfecto</span><span className="accent">·</span>
          <span>Automatización</span><span className="accent">·</span>
          <span>Meta API</span><span className="accent">·</span>
          <span>TikTok</span><span className="accent">·</span>
          <span>LinkedIn</span><span className="accent">·</span>
          <span>24 / 7</span><span className="accent">·</span>
          <span>IA Generativa</span><span className="accent">·</span>
          <span>Sin código</span><span className="accent">·</span>
          <span>Copy perfecto</span><span className="accent">·</span>
        </div>
      </div>

      {/* 5. ComoFunciona */}
      <section id="como">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="sec-idx">01 — Cómo funciona</span>
            <h2>Un flujo <em>invisible,</em><br />24/7.</h2>
          </div>
          <div className="steps">
            <div className="step reveal">
              <span className="step-n">01</span>
              <h3>Generación con IA</h3>
              <p>Solo dinos tu idea y nuestra IA redactará el copy perfecto, optimizado para engagement en cada plataforma.</p>
            </div>
            <div className="step reveal" style={{ transitionDelay: '0.1s' }}>
              <span className="step-n">02</span>
              <h3>Agendamiento Inteligente</h3>
              <p>Elige el día y la hora. Guardamos tu post de forma segura y lo preparamos para publicación exacta.</p>
            </div>
            <div className="step reveal" style={{ transitionDelay: '0.2s' }}>
              <span className="step-n">03</span>
              <h3>Publicación Automática</h3>
              <p>Nuestra IA se conecta a Meta, TikTok y LinkedIn API y publica por ti de forma completamente automática.</p>
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
          <div className="pgrid reveal">
            <div className="plan">
              <h3>Gratis</h3>
              <span className="plan-price">$0</span>
              <span className="plan-period">SIEMPRE</span>
              <ul>
                <li>4 Posts automáticos/mes</li>
                <li>Publicación directa</li>
                <li>Marca de agua Santisoft</li>
                <li>Soporte comunitario</li>
              </ul>
              <Link href="/login" className="plan-cta">Comenzar Gratis</Link>
            </div>
            <div className="plan feat">
              <span className="plan-badge">MÁS POPULAR</span>
              <h3>Pro</h3>
              <span className="plan-price">$19.990</span>
              <span className="plan-period">AL MES</span>
              <ul>
                <li>20 Posts automáticos/mes</li>
                <li>Publicación directa</li>
                <li>Sin marca de agua</li>
                <li>Soporte WhatsApp</li>
              </ul>
              <Link href="/login" className="plan-cta">Empezar Pro</Link>
            </div>
            <div className="plan">
              <h3>Elite</h3>
              <span className="plan-price">$49.990</span>
              <span className="plan-period">AL MES</span>
              <ul>
                <li>60 Posts automáticos/mes</li>
                <li>Vista previa y edición</li>
                <li>Sin marca de agua</li>
                <li>Soporte 24/7</li>
              </ul>
              <Link href="/login" className="plan-cta">Contactar Ventas</Link>
            </div>
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
