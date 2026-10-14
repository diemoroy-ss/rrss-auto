"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { DemoFormSchema, DemoFormData } from '../lib/schemas';

const HERO_VIDEOS = [
  { src: '/rrss1.mp4', label: 'Intro · Santisoft AI' },
  { src: '/rrss2.mp4', label: 'Generación de Contenido' },
  { src: '/rrss3.mp4', label: 'Estrategia de 14 días' },
  { src: '/rrss4.mp4', label: 'Publicación Automática' },
  { src: '/rrss5.mp4', label: 'Métricas y Reportes' },
  { src: '/rrss6.mp4', label: 'Empieza Gratis Hoy' },
];

export default function HeroSection() {
  const [rubro, setRubro] = useState("");
  const [promo, setPromo] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoOutput, setDemoOutput] = useState("");
  const [demoType, setDemoType] = useState<'rrss' | 'blog'>('rrss');
  const [demoButtonText, setDemoButtonText] = useState("→ Generar muestra en vivo");
  const [typedOutput, setTypedOutput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedStep, setAdvancedStep] = useState(0); 
  const [advancedImgUrl, setAdvancedImgUrl] = useState("");
  const [activeHeroVideo, setActiveHeroVideo] = useState(0);
  const [modalVideoIndex, setModalVideoIndex] = useState<number | null>(null);

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

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with Zod Schema
    const validationResult = DemoFormSchema.safeParse({ nombre, email, rubro, promo });
    if (!validationResult.success) {
      alert("Por favor completa los campos correctamente: " + validationResult.error.errors.map(err => err.message).join(', '));
      return;
    }

    setLoadingDemo(true);
    setDemoButtonText("Generando...");
    setShowAdvancedModal(true);
    setAdvancedStep(1); 
    
    const stepTimer1 = setTimeout(() => setAdvancedStep(2), 2000); 
    const stepTimer2 = setTimeout(() => setAdvancedStep(3), 12000); 

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
        setAdvancedStep(4); 
        
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
      setDemoButtonText("→ Generar muestra en vivo");
    }
  };

  return (
    <>
      <section className="hero" style={{ borderTop: 'none', paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="radar"></div>
        <div className="wrap flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          <div className="hero-head lg:w-1/2 lg:text-left text-center m-0 max-w-none flex flex-col items-center lg:items-start z-10 relative">
            <span className="eyebrow">Exclusivo para PyMEs y Negocios en Chile <span className="freq">·</span> WhatsApp 🟢</span>
            <h1 className="lg:text-left text-center leading-tight mt-5 text-3xl sm:text-4xl lg:text-5xl font-black">
              Tus Redes Sociales publicando y atrayendo clientes 24/7 en piloto automático — <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Por una fracción de lo que te cobra una agencia.</em>
            </h1>
            <p className="sub lg:text-left text-center lg:mx-0 mx-auto mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              Sin redactar desde cero, sin sufrir diseñando y sin sonar como robot. Clonamos la voz exacta de tu negocio y te dejamos el mes completo de contenido listo en minutos.
            </p>
            <div className="hero-ctas flex flex-col sm:flex-row justify-center lg:justify-start gap-3 mt-8 w-full">
              <a
                href="https://wa.me/56965909543?text=%C2%A1Hola%20Santisoft!%20Quiero%20recibir%20los%203%20posts%20de%20prueba%20gratis%20para%20mi%20negocio%20por%20WhatsApp.%20Mi%20rubro%20es%3A%20"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full sm:w-auto justify-center text-center !bg-gradient-to-r !from-emerald-500 !to-teal-500 hover:!from-emerald-600 hover:!to-teal-600 !text-white !font-black !shadow-lg !shadow-emerald-500/30 flex items-center gap-2"
              >
                <span>💬</span> Quiero recibir 3 posts de prueba gratis por WhatsApp
              </a>
              <Link href="/como-funciona" className="btn btn-outline w-full sm:w-auto justify-center text-center">
                Ver cómo funciona ➔
              </Link>
              <a href="#comparativa" className="btn btn-ghost w-full sm:w-auto justify-center text-center">
                Ver precios
              </a>
            </div>
            <div className="badges flex flex-wrap justify-center lg:justify-start gap-2 w-full mt-8">
              <span className="badge on !border-emerald-500/40 text-emerald-400 font-semibold"><span className="dot !bg-emerald-400 !shadow-[0_0_6px_#34d399]"></span>Aprobación por WhatsApp</span>
              <span className="badge on"><span className="dot"></span>Instagram &amp; Facebook</span>
              <span className="badge on"><span className="dot"></span>TikTok &amp; Reels</span>
              <span className="badge on"><span className="dot"></span>YouTube Shorts</span>
              <span className="badge on"><span className="dot"></span>Policía Anti-Baneos</span>
              <span className="badge on"><span className="dot"></span>Setup Llave en Mano</span>
            </div>
          </div>

          <div className="hero-carousel-col lg:w-1/2 w-full flex justify-center lg:justify-end z-10 relative">
            <div 
              onClick={() => setModalVideoIndex(activeHeroVideo)}
              className="hero-carousel-wrap relative aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10 group cursor-pointer w-[160px] sm:w-[220px] md:w-[280px] lg:w-full lg:max-w-[360px]"
            >
              {HERO_VIDEOS.map((v, i) => (
                <div key={i} className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${i === activeHeroVideo ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                  <video src={v.src} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                  <div className="absolute top-6 left-0 right-0 flex justify-center px-4">
                     <span className="bg-black/60 backdrop-blur-md text-white/90 px-4 py-1.5 rounded-full text-[10px] font-mono tracking-widest border border-white/10 uppercase shadow-lg text-center leading-tight">
                       {v.label}
                     </span>
                  </div>
                </div>
              ))}

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
              <span>CONSOLA DE TRANSMISIÓN — SANTISOFT AGENTES</span>
              <div className="freqs"><span>RRSS 360°</span><span>SEO &amp; GEO</span><span>WHATSAPP</span></div>
            </div>
            <div className="gauges three-signals">
              <div className="gauge a">
                <div className="gauge-head">
                  <span className="gauge-name">CANAL 1 — REDES</span>
                  <span className="gauge-status">AL AIRE</span>
                </div>
                <div className="ring-row">
                  <div className="eq-visual"><span></span><span></span><span></span><span></span><span></span></div>
                  <p className="gauge-desc"><b>5 Redes activas</b>: videos 9:16, afiches comerciales y publicaciones automáticas en Instagram, TikTok, Facebook, YouTube y X.</p>
                </div>
              </div>
              <div className="gauge b">
                <div className="gauge-head">
                  <span className="gauge-name">CANAL 2 — SEO &amp; GEO</span>
                  <span className="gauge-status">INDEXANDO</span>
                </div>
                <div className="ring-row">
                  <div className="term-visual">&gt; posicionando...<br />&gt; cite: ok<br />&gt; ranking: activo<span className="cursor"></span></div>
                  <p className="gauge-desc"><b>Blog en tu CMS</b> estructurado para Google y para que los motores generativos te citen.</p>
                </div>
              </div>
              <div className="gauge c">
                <div className="gauge-head">
                  <span className="gauge-name">CANAL 3 — WHATSAPP</span>
                  <span className="gauge-status">EN LÍNEA</span>
                </div>
                <div className="ring-row">
                  <div className="term-visual !border-emerald-500/40 !bg-emerald-950/20 !text-emerald-400">
                    &gt; msg: &quot;6&quot;<br />&gt; posts: OK<br />&gt; listos<span className="cursor !bg-emerald-400"></span>
                  </div>
                  <p className="gauge-desc"><b>Comando móvil</b>: aprueba publicaciones, pide copys y revisa métricas desde tu chat.</p>
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
                  {demoButtonText}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {showAdvancedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl relative">
            <button onClick={() => setShowAdvancedModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-2xl leading-none">&times;</button>
            <div className="p-8">
              {advancedStep < 4 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-8 w-full max-w-sm mx-auto">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2 font-serif text-slate-800">Nuestros agentes están creando tu muestra...</h3>
                    <p className="text-slate-500 text-sm">Esto tomará unos 20-30 segundos.</p>
                  </div>
                  
                  <div className="flex flex-col gap-4 w-full text-left">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${advancedStep > 1 ? 'bg-green-500 text-white' : (advancedStep === 1 ? 'border-2 border-[#DD4B19] text-[#DD4B19]' : 'border-2 border-slate-200')}`}>
                        {advancedStep > 1 ? '✓' : (advancedStep === 1 ? <span className="w-2 h-2 bg-[#DD4B19] rounded-full animate-pulse"></span> : '')}
                      </div>
                      <span className={`text-sm ${advancedStep >= 1 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>Analizando solicitud e industria</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${advancedStep > 2 ? 'bg-green-500 text-white' : (advancedStep === 2 ? 'border-2 border-[#DD4B19] text-[#DD4B19]' : 'border-2 border-slate-200')}`}>
                        {advancedStep > 2 ? '✓' : (advancedStep === 2 ? <span className="w-2 h-2 bg-[#DD4B19] rounded-full animate-pulse"></span> : '')}
                      </div>
                      <span className={`text-sm ${advancedStep >= 2 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>Diseñando recursos visuales adaptados a tu marca</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${advancedStep > 3 ? 'bg-green-500 text-white' : (advancedStep === 3 ? 'border-2 border-[#DD4B19] text-[#DD4B19]' : 'border-2 border-slate-200')}`}>
                        {advancedStep > 3 ? '✓' : (advancedStep === 3 ? <span className="w-2 h-2 bg-[#DD4B19] rounded-full animate-pulse"></span> : '')}
                      </div>
                      <span className={`text-sm ${advancedStep >= 3 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>Redactando copy persuasivo y verificando estilo</span>
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
                            <img src={advancedImgUrl} alt="Contenido generado por nuestros agentes" className="w-full h-full object-cover" />
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

      {modalVideoIndex !== null && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6 animate-fade-in"
          onClick={() => setModalVideoIndex(null)}
        >
          <div 
            className="relative max-w-sm sm:max-w-md w-full flex flex-col items-center justify-center bg-slate-900/95 rounded-3xl p-3 sm:p-5 border border-white/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className="relative w-full aspect-[9/16] max-h-[55vh] sm:max-h-[70vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-inner group">
              <video 
                key={modalVideoIndex}
                src={HERO_VIDEOS[modalVideoIndex].src} 
                controls 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />

              <button 
                onClick={() => setModalVideoIndex((prev) => (prev === null ? 0 : (prev === 0 ? HERO_VIDEOS.length - 1 : prev - 1)))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center text-lg shadow-xl transition-transform hover:scale-110 active:scale-95 z-30"
                aria-label="Video anterior"
              >
                ‹
              </button>
              
              <button 
                onClick={() => setModalVideoIndex((prev) => (prev === null ? 0 : (prev === HERO_VIDEOS.length - 1 ? 0 : prev + 1)))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center text-lg shadow-xl transition-transform hover:scale-110 active:scale-95 z-30"
                aria-label="Video siguiente"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
