"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import DemoForm from '../components/DemoForm';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import WebChatWidget from '../components/WebChatWidget';
import WhatsAppButton from '../components/WhatsAppButton';
import PromoModal from '../components/PromoModal';

function ConstellationCanvas() {
// ... canvas code remains the same
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const POINTS = 20;
    const COLOR = '99, 102, 241'; // Indigo

    const pts = Array.from({ length: POINTS }, () => ({
      x: Math.random() * (canvas?.width || 800),
      y: Math.random() * (canvas?.height || 600),
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: 2 + Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.5,
      pulse: Math.random() * Math.PI * 2,
    }));

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(${COLOR}, ${(1 - dist / 150) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      pts.forEach(p => {
        p.pulse += 0.01;
        const op = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR}, ${op})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (canvas && (p.x < 0 || p.x > canvas.width))  p.vx *= -1;
        if (canvas && (p.y < 0 || p.y > canvas.height)) p.vy *= -1;
      });

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" role="presentation" />;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="hero-section pt-32 pb-16 px-6 relative border-b border-slate-200">
        <ConstellationCanvas />
        <div className="hero-glow" />
        
        <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 max-w-7xl mx-auto w-full">
           <div className="flex items-center gap-2 font-display font-black text-xl text-slate-900">
             <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">🤖</span>
             Santisoft <span className="text-indigo-600">Bot</span>
           </div>
           
           {user ? (
             <Link href="/automatizacion-rrss/panel" className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30">
               Mi Panel 🤖
             </Link>
           ) : (
             <Link href="/login" className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30">
               Empezar Gratis
             </Link>
           )}
        </nav>

        <div className="max-w-4xl mx-auto text-center relative z-10 pt-8">
          <div className="eyebrow mb-4">
            <span className="eyebrow-dot"></span>
            Automatización RRSS Inteligente
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl mb-8 animate-pulse shadow-sm">
             <span className="text-emerald-600 text-lg">🎁</span>
             <span className="text-emerald-800 text-[11px] font-black uppercase tracking-widest">Oferta: 4 imágenes y posteos Gratis al mes</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight text-slate-900">
            Tus Redes Sociales en <br/>
            <span className="text-indigo-600">Piloto Automático.</span>
          </h1>

          <p className="text-lg md:text-xl mb-10 text-slate-500 max-w-2xl mx-auto font-medium">
            Conectamos IA con tus cuentas de Meta para que generes, agendes y publiques contenido sin mover un dedo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="#planes" className="w-full sm:w-auto px-10 py-4 btn-primary font-bold text-lg rounded-xl">
              Explorar Planes
            </Link>
            {user ? (
               <Link href="/automatizacion-rrss/panel" className="w-full sm:w-auto px-10 py-4 btn-secondary font-bold text-lg rounded-xl">
                 Ir a mi Panel
               </Link>
            ) : (
               <Link href="/login" className="w-full sm:w-auto px-10 py-4 btn-secondary font-bold text-lg rounded-xl">
                 Acceso Cliente
               </Link>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-20 relative z-10">
           <DemoForm />
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descubre Más</span>
           <div className="w-px h-8 bg-slate-300"></div>
        </div>
      </section>

      {/* ── WAVE DIVIDER (Hero -> Features) ── */}
      <div className="w-full overflow-hidden leading-none mt-20">
         <svg className="relative block w-full h-[40px] md:h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
             <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-slate-100"></path>
         </svg>
      </div>

      {/* ── FEATURES ── */}
      <section id="como-funciona" className="pt-16 pb-32 px-6 bg-slate-100">
        <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
           <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-900 mb-6">Un flujo invisible, 24/7.</h2>
           <p className="text-slate-500 text-lg max-w-2xl mx-auto">Olvídate de estar pendiente del calendario. Nuestro sistema se encarga del trabajo pesado.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              icon: "✨", 
              title: "Generación con IA", 
              desc: "Solo dinos tu idea y nuestra IA redactará el copy perfecto optimizado para engagement." 
            },
            { 
              icon: "📅", 
              title: "Agendamiento Inteligente", 
              desc: "Elige el día y la hora. Nosotros guardamos tu post en nuestra base de datos segura." 
            },
            { 
              icon: "🚀", 
              title: "Publicación Automática", 
              desc: "Nuestros bots de n8n se conectan a Meta API y publican por ti en Instagram y Facebook." 
            }
          ].map((f, i) => (
            <div key={i} className="service-card group">
              <div className="service-icon group-hover:scale-110 transition-transform">{f.icon}</div>
              <h3 className="font-display text-2xl font-bold mb-4 text-slate-900">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="bg-slate-100 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-200">
              Lo que dicen nuestros clientes
            </div>
            <h2 className="font-display text-4xl font-bold text-slate-900">Resultados reales, negocios reales</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Valentina R.",
                business: "Café & Pastelería",
                avatar: "🧁",
                quote: "Antes perdía 3 horas a la semana armando posts. Ahora Santisoft lo hace solo y mis publicaciones quedaron mucho más profesionales."
              },
              {
                name: "Marcelo T.",
                business: "Consultora de Marketing",
                avatar: "📊",
                quote: "Lo que más me convenció fue probarlo gratis. En 10 minutos vi cómo la IA creaba un post real para mi negocio. ¡Inmediato!"
              },
              {
                name: "Andrea P.",
                business: "Clínica Veterinaria",
                avatar: "🐾",
                quote: "No soy técnica para nada y lo configuré sola en menos de 20 minutos. Ahora publico todos los días sin pensar."
              }
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-200 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-2xl border border-indigo-100">{t.avatar}</div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{t.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">{t.business}</p>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed font-medium italic">"{t.quote}"</p>
                <div className="flex gap-0.5 text-amber-400 text-sm">{'★★★★★'}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WAVE DIVIDER (Social Proof -> Pricing) ── */}
      <div className="w-full overflow-hidden leading-none bg-slate-100">
         <svg className="relative block w-full h-[40px] md:h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
             <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-slate-900"></path>
         </svg>
      </div>

      {/* ── PRICING ── */}
      <section id="planes" className="pt-16 pb-32 px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <div className="inline-block px-4 py-1.5 bg-indigo-500/10 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-500/20">
            Planes y Precios
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">Escoge tu nivel de automatización</h2>
          <p className="text-indigo-200 text-lg max-w-2xl mx-auto">Comienza gratis hoy mismo y escala según tus necesidades de crecimiento.</p>
          <p className="text-slate-500 text-xs mt-3">* Precios en Pesos Chilenos (CLP), IVA incluido.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              id: "free",
              name: "Plan Gratis",
              price: "0",
              period: "/siempre",
              features: ["4 Posts automáticos", "Publicación sin previsualización", "Marca de agua Santisoft", "Soporte comunitario"],
              accent: false,
              button: "Prueba Gratis"
            },
            {
              id: "pro",
              name: "Santisoft Pro",
              price: "19.990",
              period: "/mes",
              features: ["20 Posts automáticos", "Publicación sin previsualización", "Sin marca de agua", "Soporte WhatsApp"],
              accent: true,
              button: "Empezar Pro"
            },
            {
              id: "elite",
              name: "Santisoft Elite",
              price: "49.990",
              period: "/mes",
              features: ["60 Posts automáticos", "Vista previa y edición", "Sin marca de agua", "Soporte 24/7"],
              accent: false,
              button: "Contactar Ventas"
            }
          ].map((plan, i) => (
            <div key={i} className={`relative p-8 rounded-[32px] border ${plan.accent ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 bg-slate-800' : 'border-slate-800 bg-slate-900/50 shadow-lg'} flex flex-col`}>
              {plan.accent && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">Más Popular</span>}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-indigo-200 font-medium text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-indigo-100 font-medium">
                    <span className="text-emerald-400 mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href={user ? "/automatizacion-rrss/panel" : "/login"} className={`w-full py-4 rounded-xl font-bold text-center transition-all ${plan.accent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                {user ? "Ir a mi Panel" : plan.button}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
         <div className="max-w-5xl mx-auto bg-slate-900 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-indigo-900/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[100px] -mr-48 -mt-48 rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[100px] -ml-48 -mb-48 rounded-full"></div>
            
            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-8">¿Listo para recuperar tu tiempo?</h2>
              <p className="text-indigo-200 text-lg md:text-xl mb-12 max-w-2xl mx-auto">Únete a cientos de negocios que ya automatizan su presencia digital con Santisoft.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                   <Link href="/automatizacion-rrss/panel" className="px-12 py-5 bg-white text-slate-900 font-bold text-xl rounded-2xl hover:scale-105 transition-all shadow-xl shadow-white/10">
                     Ir a mi Panel
                   </Link>
                ) : (
                   <Link href="/login" className="px-12 py-5 bg-white text-slate-900 font-bold text-xl rounded-2xl hover:scale-105 transition-all shadow-xl shadow-white/10">
                     Empezar Ahora Gratis
                   </Link>
                )}
                <Link href="#como-funciona" className="px-12 py-5 bg-slate-800 text-white font-bold text-xl rounded-2xl hover:bg-slate-700 transition-all border border-slate-700">
                  Ver Más Detalle
                </Link>
              </div>
            </div>
         </div>
      </section>

      <footer className="py-12 border-t border-slate-200 text-center">
         <div className="flex justify-center gap-6 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
            <Link href="/politica-datos" className="hover:text-indigo-600 transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-indigo-600 transition-colors">Términos</Link>
         </div>
         <p className="text-slate-400 text-sm font-medium">© 2026 Santisoft. Todos los derechos reservados.</p>
      </footer>
      
      <PromoModal />
      <WhatsAppButton />
      <WebChatWidget />
    </div>
  );
}
