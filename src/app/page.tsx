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
        PRUEBA GRATIS — <strong>10 DÍAS Y 3 POSTEOS GRATIS</strong> · SIN TARJETA DE CRÉDITO
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
                <li><span className="mark">›</span><span>Generación de <strong>contenido persuasivo</strong> con nuestros agentes, adaptado a tu marca.</span></li>
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
                <li><span className="mark">›</span><span>Generación de <strong>artículos completos</strong> y estructurados con nuestros agentes especializados.</span></li>
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
            <h2>No basta con salir en Google.<br />Hay que salir en los <em>motores generativos.</em></h2>
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
          <p className="geo-closing" data-reveal>&quot;Tu blog, redactado y publicado por nuestros agentes, trabajando para que los motores generativos te encuentren a ti.&quot;</p>
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

      {/* 7. Comparativa de Costos */}
      <section id="comparativa">
        <div className="wrap">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">El argumento real</span>
            <h2>No compites con <em>herramientas.</em><br />Compites con contratar <span className="em-p">personas.</span></h2>
          </div>
          <p className="cost-comparison-sub" data-reveal>
            ¿Cuánto te cuesta tener a alguien que escriba, diseñe, edite videos y gestione tus redes todos los días en Chile?
          </p>
          <div className="cost-comparison-grid" data-reveal>
            <div className="cost-card traditional">
              <div className="cost-card-header">
                <span className="cost-card-label">EQUIPO TRADICIONAL EN CHILE</span>
                <span className="cost-card-badge bad">❌ Opción costosa</span>
              </div>
              <ul className="cost-breakdown-list">
                <li><span className="cost-role">Community Manager</span><span className="cost-amount">~$450.000</span></li>
                <li><span className="cost-role">Diseñador Gráfico</span><span className="cost-amount">~$400.000</span></li>
                <li><span className="cost-role">Redactor de Contenidos &amp; SEO</span><span className="cost-amount">~$350.000</span></li>
                <li><span className="cost-role">Editor de Video</span><span className="cost-amount">~$300.000</span></li>
              </ul>
              <div className="cost-total-row">
                <span>Total mensual estimado</span>
                <span className="cost-total-amount bad">$1.200.000 – $1.500.000</span>
              </div>
              <p className="cost-card-note">Sin contar vacaciones, finiquitos, herramientas de diseño ni licencias de software adicionales.</p>
            </div>

            <div className="cost-card santisoft">
              <div className="cost-card-header">
                <span className="cost-card-label">SANTISOFT — PLAN PRO</span>
                <span className="cost-card-badge good">✓ Opción inteligente</span>
              </div>
              <ul className="cost-breakdown-list">
                <li><span className="cost-role">80 publicaciones en redes al mes</span><span className="cost-check">✓</span></li>
                <li><span className="cost-role">12 videos con locución y guión</span><span className="cost-check">✓</span></li>
                <li><span className="cost-role">80 imágenes generadas a tu estilo</span><span className="cost-check">✓</span></li>
                <li><span className="cost-role">8 artículos de Blog SEO/GEO al mes</span><span className="cost-check">✓</span></li>
                <li><span className="cost-role">Radar de Nicho + Meta Ads integrado</span><span className="cost-check">✓</span></li>
                <li><span className="cost-role">Publicación automática en Meta, TikTok, YouTube</span><span className="cost-check">✓</span></li>
              </ul>
              <div className="cost-total-row highlight">
                <span>Total mensual</span>
                <span className="cost-total-amount good">$84.990</span>
              </div>
              <p className="cost-card-note highlight-note">Más del 90% de ahorro. Sin contratar, sin reuniones, sin esperar.</p>
            </div>
          </div>

          <p className="cost-cta-note" data-reveal>
            Tu contenido del mes completo, listo en 15 minutos. Nuestros agentes investigan tu nicho, crean las piezas y publican solos.
          </p>
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
            <p className="mt-4 font-sans max-w-lg mx-auto" style={{ color: 'var(--ink-dim)', fontSize: '15px', lineHeight: '1.6' }}>Déjanos tus datos y te contactaremos a la brevedad para ayudarte a potenciar tu negocio.</p>
          </div>
          
          <div className="panel p-8 md:p-10" data-reveal>
            <ContactForm />
          </div>

          {/* Social Links Banner */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl shadow-sm" style={{ background: 'var(--panel-2)', border: '1px solid var(--line-strong)' }} data-reveal>
            <div className="text-center sm:text-left">
              <h4 className="text-sm font-bold font-sans" style={{ color: 'var(--ink)' }}>Síguenos en nuestras redes sociales</h4>
              <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--ink-dim)' }}>Conoce nuestras últimas novedades, consejos y casos de éxito</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
              <a
                href="https://www.instagram.com/santisoftai/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-white transition-all text-xs font-semibold shadow-sm group"
                title="Instagram @santisoftai"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram</span>
              </a>

              <a
                href="https://www.facebook.com/santisoft"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:text-white transition-all text-xs font-semibold shadow-sm group"
                title="Facebook Santisoft"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.593 0 9 1.582 9 4.615V8z"/>
                </svg>
                <span>Facebook</span>
              </a>

              <a
                href="https://www.youtube.com/@Santisoftai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-white transition-all text-xs font-semibold shadow-sm group"
                title="YouTube @Santisoftai"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span>YouTube</span>
              </a>
            </div>
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
