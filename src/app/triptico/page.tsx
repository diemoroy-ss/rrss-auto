"use client";

import Link from "next/link";
import BrandHeader from "../../components/BrandHeader";
import BrandFooter from "../../components/BrandFooter";
import DotCanvas from "../../components/DotCanvas";
import PageTracker from "../../components/PageTracker";
import {
  FaPlay,
  FaQrcode,
  FaVideo,
  FaImage,
  FaWhatsapp,
  FaCheck,
  FaArrowRight,
  FaMobileAlt,
  FaClock,
  FaBolt,
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaYoutube,
  FaTwitter,
  FaTimes,
  FaStore,
} from "react-icons/fa";

const WA_URL =
  "https://wa.me/56930825301?text=Hola!%20Vi%20el%20pitch%20de%20Santisoft%20y%20quiero%20saber%20m%C3%A1s%20para%20mis%20productos%20y%20servicios.";

// Video real en loop vertical 9:16 desde Firebase Storage
const HERO_VIDEO =
  "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_fresh_food_reveal_video_1791908993033.mp4?alt=media&token=4ea5d4e0-4c00-4d38-b2e8-009570c14128";
const HERO_POSTER =
  "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_fresh_food_reveal_image_1791908932525.jpg?alt=media&token=2f817f96-ef93-4740-998c-c2826d3adb13";

const SECTION = "relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8";

export default function TripticoPitchPage() {
  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen selection:bg-orange-500 selection:text-white">
      <PageTracker page="triptico" />
      <DotCanvas />

      <div className="promo">
        <span className="on-air"></span>
        PUBLICAMOS EN TUS REDES <strong>TODOS LOS DÍAS, SOLOS</strong> · TÚ SOLO APRUEBAS DESDE WHATSAPP
      </div>

      <BrandHeader />

      <main className="pb-24 md:pb-0">
        {/* ───────────── 1. GANCHO (HERO) ───────────── */}
        <section className={`${SECTION} pt-10 md:pt-16`}>
          <div className="relative rounded-[2rem] overflow-hidden border border-orange-500/30 shadow-2xl min-h-[520px] md:min-h-[600px] flex items-end">
            <video
              src={HERO_VIDEO}
              poster={HERO_POSTER}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/25" />

            <div className="relative z-10 w-full p-6 sm:p-10 md:p-14 space-y-6 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-400/40 text-orange-300 text-xs font-bold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Tus redes en piloto automático
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-medium">
                  <FaStore className="text-amber-400 text-[11px]" /> Productos, servicios y comercios
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.05]">
                Una foto.
                <br />
                Tres formas de vender.
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-amber-200">
                  Publicadas solas.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
                Nuestros agentes transforman cualquier foto de tus productos o servicios en videos dinámicos,
                afiches comerciales y un catálogo digital interactivo con QR. Y lo publican todo en tus 5 redes
                mientras tú solo das el visto bueno por WhatsApp.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/como-funciona"
                  className="px-7 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm flex items-center gap-2 shadow-xl shadow-orange-500/25 transition-all hover:-translate-y-0.5"
                >
                  Ver cómo funciona <FaArrowRight className="text-xs" />
                </Link>
                <div className="flex items-center gap-3 text-slate-300 text-lg pl-1" aria-label="Redes donde publicamos">
                  <FaInstagram /> <FaFacebook /> <FaTiktok /> <FaYoutube /> <FaTwitter />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── 2. EL PROBLEMA ───────────── */}
        <section className={`${SECTION} py-16 md:py-24`}>
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">El problema real</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Tener un gran producto o servicio no basta.
              <br />
              <span className="text-slate-400">Estar presente todos los días en redes agota.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {[
              {
                t: "Agencias lentas y costosas",
                d: "Semanas de ida y vuelta para coordinar publicaciones que podrías resolver en segundos.",
              },
              {
                t: "Fotos comunes sin gancho",
                d: "Tomas caseras que se pierden en el feed sin precio visible, sin oferta clara ni llamado a comprar.",
              },
              {
                t: "Catálogos pesados en PDF",
                d: "Archivos lentos donde el cliente debe hacer zoom en su teléfono y termina yéndose sin preguntar.",
              },
            ].map((p) => (
              <div
                key={p.t}
                className="p-6 rounded-3xl bg-red-950/20 border border-red-900/30 flex items-start gap-4"
              >
                <span className="mt-1 p-2 rounded-xl bg-red-500/15 text-red-400 text-xs shrink-0">
                  <FaTimes />
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">{p.t}</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── 3. LA SOLUCIÓN: 3 MOTORES ───────────── */}
        <section className={`${SECTION} pb-16 md:pb-24`}>
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">La solución integral</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Tres motores comerciales.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-orange-300">
                Una sola plataforma sin fricción.
              </span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Cada foto que tomas activa tres canales simultáneos para vender más y mantener tus redes siempre activas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {/* Motor 1: Video */}
            <article className="rounded-3xl bg-slate-900/80 border border-orange-500/30 overflow-hidden flex flex-col">
              <div className="relative aspect-[9/12] bg-black">
                <video
                  src={HERO_VIDEO}
                  poster={HERO_POSTER}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-white">
                  <FaPlay className="text-[8px] text-orange-400" /> Video vertical 9:16
                </span>
              </div>
              <div className="p-6 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-orange-400 text-sm font-black">
                  <FaVideo /> Videos para Reels y TikTok
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Tus productos o servicios cobran movimiento cinematográfico, efectos de iluminación y dinamismo que frena el scroll en segundos.
                </p>
                <span className="inline-block text-[11px] text-slate-500 pt-1">Disponible en planes con módulo de video</span>
              </div>
            </article>

            {/* Motor 2: Afiche */}
            <article className="rounded-3xl bg-slate-900/80 border border-amber-500/30 overflow-hidden flex flex-col">
              <div className="relative aspect-[9/12] bg-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
                  alt="Afiche comercial de producto o servicio"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/85 via-black/40 to-transparent p-4 pb-12 space-y-1">
                  <span className="inline-block bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
                    OFERTA SEMANAL
                  </span>
                  <p className="text-white font-black text-lg leading-tight uppercase">PACK PROMO O SERVICIO DESTACADO</p>
                  <p className="text-amber-300 font-black text-2xl">$19.990</p>
                </div>
                <span className="absolute bottom-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <FaWhatsapp /> Comprar / Consultar
                </span>
              </div>
              <div className="p-6 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-black">
                  <FaImage /> Afiches que convierten
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Precios, promociones y mensajes comerciales sobre tu imagen real. El cliente ve lo que ofreces, entiende el beneficio y sabe cómo pedir.
                </p>
              </div>
            </article>

            {/* Motor 3: Catálogo QR */}
            <article className="rounded-3xl bg-slate-900/80 border border-emerald-500/30 overflow-hidden flex flex-col">
              <div className="relative aspect-[9/12] bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center">
                <div className="w-44 rounded-[1.6rem] border-4 border-slate-600 bg-slate-950 p-3 space-y-3 shadow-2xl">
                  <div className="w-full aspect-square rounded-xl bg-white p-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                        "https://rrss.santisoft.cl/menu/demo-burgers"
                      )}`}
                      alt="Código QR de ejemplo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[11px] font-black text-white">Escanea tu catálogo</p>
                    <p className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                      <FaMobileAlt /> Pedido directo a WhatsApp
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-black">
                  <FaQrcode /> Catálogo o Carta QR digital
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Tu vitrina interactiva siempre al día en el celular de tus clientes. Con fotos, precios y botón para consultar o comprar de inmediato.
                </p>
                <Link
                  href="/menu/demo-burgers"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200 pt-1"
                >
                  Ver demo interactiva en vivo <FaArrowRight className="text-[9px]" />
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* ───────────── 4. PUBLICACIÓN AUTOMÁTICA + TIEMPO RECUPERADO ───────────── */}
        <section className={`${SECTION} pb-16 md:pb-24`}>
          <div className="rounded-[2rem] bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 sm:p-10 md:p-14 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                Publicación automática
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                Tú tomas la foto con tu celular.
                <br />
                <span className="text-slate-400">Nuestros agentes hacen todo el resto.</span>
              </h2>
            </div>

            {/* 4 pasos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  n: "1",
                  t: "Sacas una foto",
                  d: "De tu producto, servicio, local o trabajo del día, sin equipos caros.",
                },
                {
                  n: "2",
                  t: "Nuestros agentes preparan el pack",
                  d: "Generan el video, diseñan el afiche, redactan el texto y arman la propuesta.",
                },
                {
                  n: "3",
                  t: "Apruebas en 10 segundos",
                  d: "Te llega a WhatsApp. Revisas la muestra y das el visto bueno con un tap.",
                },
                {
                  n: "4",
                  t: "Se publica automáticamente",
                  d: "Sale solo en Instagram, Facebook, TikTok, YouTube y X al mismo tiempo.",
                },
              ].map((s) => (
                <div key={s.n} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-sm flex items-center justify-center">
                    {s.n}
                  </span>
                  <h3 className="text-base font-black text-white leading-snug">{s.t}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>

            {/* Tiempo recuperado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <div className="p-6 sm:p-8 rounded-3xl bg-red-950/20 border border-red-900/30 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <FaClock /> Gestionar tus redes a mano
                </span>
                <p className="text-4xl sm:text-5xl font-black text-white">6 a 10 h</p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  por semana pensando qué publicar, peleando con aplicaciones de diseño, redactando textos y subiendo contenido red por red.
                </p>
              </div>
              <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <FaBolt /> Con nuestro equipo de agentes
                </span>
                <p className="text-4xl sm:text-5xl font-black text-emerald-300">Minutos</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  a la semana solo para dar el visto bueno en tu WhatsApp. Recuperas hasta <strong className="text-white">30 horas libres al mes</strong> para
                  atender clientes, mejorar tu negocio o descansar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── 5. CIERRE Y COMPARATIVA ───────────── */}
        <section className={`${SECTION} pb-16 md:pb-24`}>
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Mismo negocio.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-300">
                Mucho más tiempo para ti.
              </span>
            </h2>
          </div>

          <div className="mt-10 rounded-3xl border border-slate-800 overflow-hidden">
            <div className="grid grid-cols-3 text-xs sm:text-sm font-black bg-slate-900/80">
              <div className="p-4 text-slate-500">Aspecto</div>
              <div className="p-4 text-red-400">Hacerlo a mano o con agencia</div>
              <div className="p-4 text-emerald-300 bg-emerald-950/30">Santisoft</div>
            </div>
            {[
              ["Tu dedicación", "Horas creando, editando y subiendo", "Segundos aprobando por WhatsApp"],
              ["Frecuencia", "Solo cuando te queda tiempo libre", "Presencia constante y programada"],
              ["Canales", "Sueles publicar en una sola red", "Tus 5 redes cubiertas en simultáneo"],
              ["Coordinación", "Días de correos y ajustes", "Flujo directo en tu chat personal"],
            ].map(([k, a, b]) => (
              <div key={k} className="grid grid-cols-3 text-xs sm:text-sm border-t border-slate-800">
                <div className="p-4 font-bold text-white">{k}</div>
                <div className="p-4 text-slate-400">{a}</div>
                <div className="p-4 font-bold text-emerald-300 bg-emerald-950/20 flex items-start gap-1.5">
                  <FaCheck className="mt-0.5 shrink-0 text-[10px]" /> {b}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-[2rem] bg-gradient-to-r from-orange-600 via-amber-600 to-indigo-700 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              ¿Listo para poner tus redes en marcha y recuperar tu tiempo?
            </h2>
            <p className="text-white/90 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Conoce el paso a paso detallado de cómo trabajan nuestros agentes por dentro o revisa el plan que mejor se adapta a tu negocio.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/como-funciona"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black text-sm shadow-xl transition-all"
              >
                Ver cómo funciona
              </Link>
              <Link
                href="/#planes"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-black/40 hover:bg-black/60 text-white font-black text-sm border border-white/30 transition-all"
              >
                Ver planes
              </Link>
              <a
                href={WA_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <FaWhatsapp className="text-base" /> Hablar por WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Barra fija en móvil */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur border-t border-slate-800 p-3 flex items-center gap-2">
        <Link
          href="/como-funciona"
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs text-center"
        >
          Cómo funciona
        </Link>
        <Link
          href="/#planes"
          className="flex-1 py-3 rounded-xl border border-slate-600 text-white font-bold text-xs text-center"
        >
          Planes
        </Link>
        <a
          href={WA_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0"
        >
          <FaWhatsapp />
        </a>
      </div>

      <BrandFooter />
    </div>
  );
}
