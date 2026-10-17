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
import TestimonialsSection from '../components/TestimonialsSection';
import WhatsAppBotSection from '../components/WhatsAppBotSection';

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
        PRUEBA GRATIS — <strong>10 DÍAS Y 5 PUBLICACIONES GRATIS</strong> · SIN TARJETA DE CRÉDITO
      </div>

      {/* 2. Brand Nav */}
      <BrandHeader />

      {/* 3. Hero & Consola Interactiva */}
      <HeroSection />

      {/* 4. Sección Ecosistema */}
      <section id="ecosistema">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <span className="eyebrow">Ecosistema integral · 3 Canales</span>
            <h2>Un flujo continuo para <em>Redes</em>, <span className="em-p">SEO</span> y <span className="em-w">WhatsApp.</span></h2>
          </div>
          <div className="pillars three-col" data-reveal>
            <div className="pillar a">
              <span className="pillar-tag">CANAL 1 · REDES SOCIALES 360°</span>
              <h3>Redes Sociales 360°</h3>
              <ul className="pillar-list">
                <li><span className="mark">›</span><span><strong>Videos 9:16 &amp; Afiches Comerciales:</strong> 20 comandos cinematográficos para Reels y TikTok, más afiches con precios, ofertas y llamados a WhatsApp.</span></li>
                <li><span className="mark">›</span><span><strong>Radar de Nicho 📡:</strong> Detección de tendencias, dudas y temas con alta tracción en tu rubro.</span></li>
                <li><span className="mark">›</span><span><strong>Calendario estratégico</strong> que deja todo un mes programado en minutos.</span></li>
                <li><span className="mark">›</span><span>Publicación automática directa en <strong>Instagram, Facebook, TikTok, YouTube Shorts</strong> y <strong>X</strong>.</span></li>
              </ul>
              <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between text-xs">
                <span className="pillar-note !m-0">Autopublicación directa y sincronizada</span>
                <Link href="/biblioteca" className="text-orange-400 font-bold hover:underline">Ver biblioteca ➔</Link>
              </div>
            </div>
            <div className="pillar b">
              <span className="pillar-tag">CANAL 2 · SEO &amp; GEO CON BLOG</span>
              <h3>SEO &amp; GEO con Blog</h3>
              <ul className="pillar-list">
                <li><span className="mark">›</span><span><strong>Generative Engine Optimization (GEO):</strong> Tu marca recomendada en respuestas de motores generativos (ChatGPT, Perplexity, Gemini).</span></li>
                <li><span className="mark">›</span><span>Generación de <strong>artículos completos</strong> y estructurados por nuestros redactores especializados.</span></li>
                <li><span className="mark">›</span><span>Publicación automática y directa en tu <strong>CMS</strong> (WordPress, Shopify, Webflow).</span></li>
              </ul>
              <span className="pillar-note">Tráfico orgánico + Posicionamiento futuro</span>
            </div>
            <div className="pillar c">
              <span className="pillar-tag">CANAL 3 · WHATSAPP BOT</span>
              <h3>WhatsApp Command</h3>
              <ul className="pillar-list">
                <li><span className="mark">›</span><span><strong>Gestión sin paneles:</strong> Revisa posts programados, borradores y cuotas enviando solo un número.</span></li>
                <li><span className="mark">›</span><span><strong>Aprobación con 1 mensaje:</strong> Autoriza el calendario de la semana respondiendo al bot.</span></li>
                <li><span className="mark">›</span><span><strong>Generación al vuelo:</strong> Manda una idea urgente y nuestros agentes preparan el copy de inmediato.</span></li>
                <li><span className="mark">›</span><span><strong>Selector multi-marca:</strong> Administra varias marcas desde el mismo número sin cambiar de cuenta.</span></li>
              </ul>
              <span className="pillar-note">Control total desde tu bolsillo</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sección WhatsApp Bot Diferenciador */}
      <WhatsAppBotSection />

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
              <span className="k">BÚSQUEDA TRADICIONAL</span>
              <h4>SEO Tradicional</h4>
              <p>Optimizamos tu blog para que aparezcas en los resultados de búsqueda de Google, con keywords, estructura y contenido de calidad.</p>
            </div>
            <div className="geo-card new dark-screen">
              <span className="k">BÚSQUEDA CONVERSACIONAL</span>
              <h4>GEO — Generative Engine Optimization</h4>
              <p>Estructuramos y publicamos tu contenido para que los motores conversacionales te reconozcan y te recomienden como fuente confiable en sus respuestas.</p>
            </div>
          </div>
          <p className="geo-closing" data-reveal>&quot;Tu blog, redactado y publicado por nuestros agentes, trabajando para que los motores generativos te encuentren a ti.&quot;</p>
        </div>
      </section>

      {/* 6. Testimonios */}
      <TestimonialsSection />

      {/* 7. Nueva Sección "Anclaje de Precio" (Tabla Comparativa de 3 Columnas) */}
      <section id="comparativa" className="py-20 border-t border-slate-800/80">
        <div className="wrap">
          <div className="section-head center" data-reveal>
            <span className="eyebrow">Comparativa Directa · Números Reales</span>
            <h2>Tres caminos para tus redes.<br />Uno solo te da <em>ventas y tiempo libre.</em></h2>
          </div>
          <p className="text-center max-w-2xl mx-auto -mt-6 mb-12 text-slate-300 text-sm sm:text-base leading-relaxed" data-reveal>
            Hagamos números claros para el dueño de negocio en Chile. ¿Cuánto te cuesta realmente mantener tus redes activas todos los días?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch" data-reveal>
            {/* Columna 1: Hacerlo tú mismo */}
            <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Opción 1</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">Hacerlo a mano</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Hacerlo tú mismo</h3>
                  <div className="mt-2 text-3xl font-black text-slate-200">$0 <span className="text-sm font-normal text-slate-400">CLP / mes</span></div>
                  <p className="text-xs text-red-400 font-semibold mt-1">"Gratis" en dinero, carísimo en tiempo y estrés</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>Pierdes <strong>+15 horas al mes</strong> pensando qué publicar y buscando fotos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span><strong>Estrés el domingo en la noche</strong> improvisando diseños caseros en Canva.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span><strong>Redes abandonadas</strong> a la segunda semana por falta de tiempo para operar tu negocio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>Cero alcance: fotos sin llamadas a la acción que nadie comparte ni compra.</span>
                  </li>
                </ul>
              </div>
              <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-900/30 text-center text-xs text-red-300 font-medium">
                Resultado: Negocio invisible y dueño agotado.
              </div>
            </div>

            {/* Columna 2: Agencia Tradicional */}
            <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Opción 2</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-900/40 text-red-300">Costoso y lento</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Agencia Tradicional / CM</h3>
                  <div className="mt-2 text-2xl sm:text-3xl font-black text-white">$450.000 – $800.000 <span className="text-xs sm:text-sm font-normal text-slate-400">CLP / mes</span></div>
                  <p className="text-xs text-red-400 font-semibold mt-1">Presupuesto inalcanzable para la mayoría de PyMEs</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span><strong>Reuniones lentas</strong> e interminables hilos de correos para coordinar 8 posts al mes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span><strong>Textos genéricos y fríos</strong> redactados por personas que no conocen la realidad de tu rubro.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>Tardan <strong>días en responder</strong> cuando necesitas publicar una promo urgente para el fin de semana.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">✕</span>
                    <span><strong>Contratos largos</strong> amarrados por 6 a 12 meses sin garantía de resultados.</span>
                  </li>
                </ul>
              </div>
              <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-900/30 text-center text-xs text-red-300 font-medium">
                Resultado: Pagar una fortuna por un servicio rígido.
              </div>
            </div>

            {/* Columna 3: RRSS-Auto by Santisoft (DESTACADA) */}
            <div className="relative p-7 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-orange-500 shadow-2xl shadow-orange-500/20 flex flex-col justify-between space-y-6">
              <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg">
                🔥 Recomendado para PyMEs
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-400">Opción 3</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Llave en Mano</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">RRSS-Auto by Santisoft</h3>
                  <div className="mt-2 text-3xl font-black text-white">Desde $59.990 <span className="text-sm font-normal text-slate-400">CLP / mes</span></div>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">90% más barato que una agencia y 100% bajo tu control</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-200 pt-2 border-t border-slate-800">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>IA con tu voz real</strong>: textos persuasivos con la personalidad auténtica de tu negocio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Espía de competencia activo</strong>: detecta qué le está funcionando a tu competencia en Chile.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Guiones de Reels e Historias</strong> listos para leer en 30 segundos con fórmulas de retención.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Policía Anti-Baneos</strong> de Instagram para proteger el alcance y la salud de tu cuenta.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong>Setup Llave en Mano GRATIS</strong>: dejamos tu marca configurada y tu contenido andando.</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <a
                  href="https://wa.me/56934428848?text=%C2%A1Hola!%20Quiero%20asegurar%20uno%20de%20los%20cupos%20del%20Plan%20PyME%20Crecimiento%20de%20Santisoft%20con%20Setup%20Gratis."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs text-center flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
                >
                  <span>🚀</span> Asegurar mi cupo con Setup Gratis
                </a>
                <p className="text-[10px] text-center text-slate-400">Garantía Cero Riesgo de 7 días · Cancela cuando quieras</p>
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
        <div className="wrap text-center">
          <h2>¿Listo para que tu marketing <em>trabaje solo?</em></h2>
          <p className="max-w-xl mx-auto mt-3 mb-6 text-slate-300 text-sm sm:text-base leading-relaxed">
            Redes al día, artículos de blog indexando y control total desde WhatsApp. Empieza hoy con nuestra prueba gratuita.
          </p>
          <div className="flex justify-center">
            <Link href="/login" className="btn btn-primary">Empezar Ahora Gratis</Link>
          </div>
        </div>
      </div>

      {/* 9. Brand Footer */}
      <BrandFooter />

      <WebChatWidget />
    </div>
  );
}
