"use client";
import Link from 'next/link';
import { useEffect } from 'react';
import DotCanvas from '../components/DotCanvas';
import WebChatWidget from '../components/WebChatWidget';
import PageTracker from '../components/PageTracker';
import HeroSection from '../components/HeroSection';
import PricingPlans from '../components/PricingPlans';
import ContactForm from '../components/ContactForm';
import BrandHeader from '../components/BrandHeader';
import BrandFooter from '../components/BrandFooter';

export default function Home() {

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
  }, []);

  return (
    <div className="landing-page-root relative overflow-x-hidden">
      <PageTracker page="landing" />
      <DotCanvas />

      {/* 1. PromoBanner */}
      <div className="promo">
        <span className="on-air"></span>
        OFERTA — <strong>4 IMÁGENES Y POSTEOS GRATIS</strong> CADA MES · SIN TARJETA DE CRÉDITO
      </div>

      {/* 2. Brand Nav */}
      <BrandHeader />

      {/* 3. Hero & Consola Interactiva */}
      <HeroSection />

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
                <li><span className="mark">›</span><span><strong>Radar de Nicho 📡:</strong> Inteligencia de mercado para descubrir tendencias, dudas y temas virales en tu industria.</span></li>
                <li><span className="mark">›</span><span><strong>Calendario estratégico</strong> que automatiza todo un mes en minutos.</span></li>
                <li><span className="mark">›</span><span>Publicación automática directa en <strong>Meta (Facebook, Instagram)</strong>, <strong>TikTok</strong>, <strong>YouTube Shorts</strong> y <strong>X (Twitter)</strong>.</span></li>
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
          <PricingPlans />
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
            <ContactForm />
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

      {/* 9. Brand Footer */}
      <BrandFooter />

      <WebChatWidget />
    </div>
  );
}
