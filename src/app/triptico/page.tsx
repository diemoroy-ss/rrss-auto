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
} from "react-icons/fa";

const WA_URL =
  "https://wa.me/56930825301?text=Hola!%20Vi%20el%20pitch%20de%20Santisoft%20y%20quiero%20saber%20m%C3%A1s%20para%20mi%20negocio.";

// Video y foto reales cargados en la biblioteca de prompts de video
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
        {/* ───────────── 1. GANCHO ───────────── */}
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
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />

            <div className="relative z-10 w-full p-6 sm:p-10 md:p-14 space-y-6 max-w-3xl">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-400/40 text-orange-300 text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Tus redes en piloto automático
              </span>

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
                Nuestros agentes convierten la foto de tu producto en video, afiche y carta QR, y lo publican
                en Instagram, Facebook, TikTok, YouTube y X. Tú apruebas desde WhatsApp.
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
            <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">El problema</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Vender no es el problema.
              <br />
              <span className="text-slate-400">Encontrar tiempo para publicar, sí.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {[
              { t: "Agencias lentas", d: "Días para aprobar un solo post." },
              { t: "Fotos sin impacto", d: "Sin precio, sin oferta, sin llamado a comprar." },
              { t: "Cartas en PDF", d: "El cliente hace zoom y se va." },
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
                  <p className="text-sm text-slate-400 mt-1">{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── 3. LA SOLUCIÓN: 3 MOTORES ───────────── */}
        <section className={`${SECTION} pb-16 md:pb-24`}>
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">La solución</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Tres motores.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-orange-300">
                Una sola plataforma.
              </span>
            </h2>
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
                  <FaPlay className="text-[8px] text-orange-400" /> Video 9:16
                </span>
              </div>
              <div className="p-6 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-orange-400 text-sm font-black">
                  <FaVideo /> Videos de producto
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Tu foto cobra movimiento: humo, fuego, agua, giros en 360°. Listo para Reels y TikTok.
                </p>
                <span className="inline-block text-[11px] text-slate-500 pt-1">Incluido en planes con módulo de video</span>
              </div>
            </article>

            {/* Motor 2: Afiche */}
            <article className="rounded-3xl bg-slate-900/80 border border-amber-500/30 overflow-hidden flex flex-col">
              <div className="relative aspect-[9/12] bg-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
                  alt="Afiche comercial de ejemplo"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/85 to-transparent p-4 pb-10 space-y-1">
                  <span className="inline-block bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
                    OFERTA -25%
                  </span>
                  <p className="text-white font-black text-lg leading-tight">COSTILLAS BBQ + PAPAS</p>
                  <p className="text-amber-300 font-black text-2xl">$9.990</p>
                </div>
                <span className="absolute bottom-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <FaWhatsapp /> Pedir
                </span>
              </div>
              <div className="p-6 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-black">
                  <FaImage /> Afiches que venden
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Precio, oferta y botón de compra sobre tu foto real. Sin diseñador y sin esperar.
                </p>
              </div>
            </article>

            {/* Motor 3: Menú QR */}
            <article className="rounded-3xl bg-slate-900/80 border border-emerald-500/30 overflow-hidden flex flex-col">
              <div className="relative aspect-[9/12] bg-gradient-to-b from-slate-800 to-slate-950 flex items-center justify-center">
                <div className="w-44 rounded-[1.6rem] border-4 border-slate-600 bg-slate-950 p-3 space-y-3 shadow-2xl">
                  <div className="w-full aspect-square rounded-xl bg-white p-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                        "https://rrss.santisoft.cl/menu/demo"
                      )}`}
                      alt="Código QR de ejemplo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[11px] font-black text-white">Escanea y pide</p>
                    <p className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                      <FaMobileAlt /> Directo a WhatsApp
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-black">
                  <FaQrcode /> Carta QR interactiva
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Fotos reales con precios. El cliente escanea y te manda el pedido por WhatsApp.
                </p>
                <Link
                  href="/menu/demo-burgers"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200 pt-1"
                >
                  Ver carta de ejemplo <FaArrowRight className="text-[9px]" />
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
                Tú sacas la foto.
                <br />
                <span className="text-slate-400">Nosotros hacemos el resto.</span>
              </h2>
            </div>

            {/* 4 pasos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { n: "1", t: "Subes la foto", d: "Con tu celular, sin preparar nada." },
                { n: "2", t: "Nuestros agentes la preparan", d: "Video, afiche, texto y calendario." },
                { n: "3", t: "Apruebas en 10 segundos", d: "Un mensaje de WhatsApp y listo." },
                { n: "4", t: "Se publica sola", d: "Instagram, Facebook, TikTok, YouTube y X." },
              ].map((s) => (
                <div key={s.n} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-sm flex items-center justify-center">
                    {s.n}
                  </span>
                  <h3 className="text-base font-black text-white leading-snug">{s.t}</h3>
                  <p className="text-xs text-slate-400">{s.d}</p>
                </div>
              ))}
            </div>

            {/* Tiempo recuperado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <div className="p-6 sm:p-8 rounded-3xl bg-red-950/20 border border-red-900/30 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <FaClock /> Hacerlo a mano
                </span>
                <p className="text-4xl sm:text-5xl font-black text-white">6 a 10 h</p>
                <p className="text-sm text-slate-400">por semana pensando, fotografiando, diseñando y subiendo cada post.</p>
              </div>
              <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <FaBolt /> Con nuestros agentes
                </span>
                <p className="text-4xl sm:text-5xl font-black text-emerald-300">Minutos</p>
                <p className="text-sm text-slate-300">
                  solo para aprobar. Recuperas hasta <strong className="text-white">30 horas al mes</strong> para
                  atender, vender y descansar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────── 5. CIERRE ───────────── */}
        <section className={`${SECTION} pb-16 md:pb-24`}>
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Mismo negocio.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-300">
                Mucho más tiempo.
              </span>
            </h2>
          </div>

          <div className="mt-10 rounded-3xl border border-slate-800 overflow-hidden">
            <div className="grid grid-cols-3 text-xs sm:text-sm font-black bg-slate-900/80">
              <div className="p-4 text-slate-500"></div>
              <div className="p-4 text-red-400">Agencia o a mano</div>
              <div className="p-4 text-emerald-300 bg-emerald-950/30">Santisoft</div>
            </div>
            {[
              ["Tu tiempo", "Horas diseñando y subiendo", "Minutos aprobando"],
              ["Publicación", "Cuando alcanza el tiempo", "Automática, todos los días"],
              ["Respuesta", "Días de ida y vuelta", "Segundos por WhatsApp"],
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
              ¿Listo para recuperar tu tiempo?
            </h2>
            <p className="text-white/90 text-sm sm:text-base max-w-xl mx-auto">
              Mira cómo trabaja el equipo de agentes por dentro y elige el plan que calza con tu negocio.
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
