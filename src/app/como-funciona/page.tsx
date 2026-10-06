"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BrandHeader from "../../components/BrandHeader";
import BrandFooter from "../../components/BrandFooter";
import DotCanvas from "../../components/DotCanvas";
import PageTracker from "../../components/PageTracker";
import WebChatWidget from "../../components/WebChatWidget";

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "56965909543";
const WA_MSG = encodeURIComponent(
  "¡Hola Santisoft! Vi la página de cómo funciona su equipo de agentes para redes y quiero ver una muestra para mi negocio."
);

type StyleKey = "split" | "gourmet" | "recipe";
type ScenarioKey = "aprobar" | "urgente" | "metricas";

export default function ComoFuncionaPage() {
  // Estado para el visor interactivo de fotos reales con arte comercial
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>("split");
  const [showOriginal, setShowOriginal] = useState(false);

  // Estado para el simulador de WhatsApp
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>("aprobar");

  // Estado para el formulario de muestra express
  const [businessName, setBusinessName] = useState("");
  const [businessRubro, setBusinessRubro] = useState("Hamburguesería / Fast Food");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll("[data-reveal]");
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSampleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactPhone) return;

    setFormStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: businessName,
          rubro: businessRubro,
          telefono: contactPhone,
          email: contactEmail || `${businessName.toLowerCase().replace(/\s+/g, "")}@contacto.temporal`,
          mensaje: `Solicitud de muestra comercial interactiva para ${businessName} (Rubro: ${businessRubro}). Teléfono WhatsApp: ${contactPhone}`,
        }),
      });

      if (!res.ok) throw new Error("Error enviando solicitud");
      setFormStatus("success");
    } catch {
      setFormStatus("error");
    }
  };

  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen">
      <PageTracker page="como-funciona" />
      <DotCanvas />
      <WebChatWidget />

      {/* ── BANNER SUPERIOR ── */}
      <div className="promo">
        <span className="on-air"></span>
        PRUEBA GRATUITA — <strong>10 DÍAS Y 5 PUBLICACIONES DE MUESTRA</strong> · SIN TARJETA DE CRÉDITO
      </div>

      {/* ── NAVEGACIÓN PRINCIPAL ── */}
      <BrandHeader />

      {/* ── 1. HERO COMERCIAL ── */}
      <section className="hero pt-12 pb-20">
        <div className="wrap">
          <div className="text-center max-w-4xl mx-auto" data-reveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-6">
              <span>🚀</span> Tu equipo de marketing trabajando 24/7
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 leading-tight mb-6">
              Gestionamos las redes de tu negocio, atraemos clientes y publicamos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                todos los días por ti.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-10">
              Nuestros agentes especializados investigan qué busca tu cliente, arman tu calendario del mes,
              visten tus fotos reales con cartelería comercial de alto impacto y publican automáticamente en
              Instagram, Facebook, TikTok y Google. <strong>Tú solo apruebas desde WhatsApp en 10 segundos.</strong>
            </p>

            {/* Doble CTA Hero */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
              <a
                href="#muestra-gratis"
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base shadow-xl shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2"
              >
                <span>✨</span> Ver Muestra Gratis de Mi Negocio
              </a>

              <a
                href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-100 font-semibold text-base transition-all text-center flex items-center justify-center gap-2"
              >
                <span>💬</span> Chatear por WhatsApp
              </a>
            </div>

            {/* Badges de confianza */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Sin contratos forzosos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Respeta tus fotos reales
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Control 100% desde WhatsApp
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. EL DOLOR REAL DEL CLIENTE ── */}
      <section className="py-20 border-t border-slate-800/80 bg-slate-900/40">
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-400">La realidad del día a día</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mt-2">
              Llevar un negocio ya es bastante trabajo como para además ser creador de contenido.
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              Hablamos a diario con dueños de restaurantes, tiendas y profesionales. Casi todos se enfrentan a
              las mismas 3 frustraciones:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-reveal>
            {/* Tarjeta 1 */}
            <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-2xl mb-6">
                  ⏳
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-3">
                  &quot;No me da el tiempo para pensar qué publicar&quot;
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Terminas tu jornada agotado. Quieres subir algo a redes, pero te quedas en blanco frente al celular,
                  lo pospones para mañana y tu cuenta pasa semanas en silencio perdiendo clientes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/50 text-xs text-red-400/90 font-medium">
                ✕ Resultado: Tus competidores se quedan con la atención de tu zona.
              </div>
            </div>

            {/* Tarjeta 2 */}
            <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mb-6">
                  💸
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-3">
                  &quot;Las agencias tradicionales cobran caro y demoran días&quot;
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Te cobran cientos de miles de pesos cada mes por un par de posts genéricos. Pides una promoción urgente
                  para este fin de semana y tardan 5 días en responderte un correo.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/50 text-xs text-amber-400/90 font-medium">
                ✕ Resultado: Pagar caro por un servicio lento y poco flexible.
              </div>
            </div>

            {/* Tarjeta 3 */}
            <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-2xl mb-6">
                  📸
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-3">
                  &quot;Saco fotos pero no se ven como las de marcas grandes&quot;
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Tu producto es delicioso o de excelente calidad, pero una foto suelta en el celular se ve fría,
                  sin precios destacados, sin llamados a la acción y sin el diseño que invita a comprar.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/50 text-xs text-orange-400/90 font-medium">
                ✕ Resultado: Fotos caseras que no transmiten el verdadero valor de tu marca.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CÓMO LO HACEMOS (LOS 4 PASOS) ── */}
      <section className="py-24 border-t border-slate-800/80">
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-20" data-reveal>
            <span className="eyebrow text-orange-400">Cómo trabaja nuestro equipo</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mt-2">
              Un flujo simple y continuo para que tu marca nunca pare de vender.
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              Nuestros agentes especializados se reparten el trabajo tal como lo haría una agencia de primer nivel,
              pero en minutos y a una fracción del costo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" data-reveal>
            {/* Paso 1 */}
            <div className="relative p-7 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col">
              <div className="text-xs font-mono font-bold text-orange-400 mb-3 tracking-widest">PASO 01</div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-2xl mb-5">
                📡
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Radar de Nicho</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Nuestros agentes escanean las preguntas frecuentes, dudas y platos más buscados en tu rubro y ciudad.
                No adivinamos: creamos contenido que la gente ya quiere ver.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-700/40 text-xs text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Temas con demanda real
              </div>
            </div>

            {/* Paso 2 */}
            <div className="relative p-7 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col">
              <div className="text-xs font-mono font-bold text-orange-400 mb-3 tracking-widest">PASO 02</div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl mb-5">
                📅
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Estrategia Mensual</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Armamos un calendario balanceado con 4 pilares: combos de venta directa, platos de autor, secretos de
                cocina para ganar autoridad y videos cortos de gran alcance.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-700/40 text-xs text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> 30 días planificados
              </div>
            </div>

            {/* Paso 3 */}
            <div className="relative p-7 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col">
              <div className="text-xs font-mono font-bold text-orange-400 mb-3 tracking-widest">PASO 03</div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-2xl mb-5">
                🎨
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Dirección de Arte</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Nuestros agentes examinan tu foto real y le colocan carteles comerciales, precios destacados, botones
                y listas de ingredientes sin tocar ni tapar tu comida.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-700/40 text-xs text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Tu plato queda impecable
              </div>
            </div>

            {/* Paso 4 */}
            <div className="relative p-7 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col">
              <div className="text-xs font-mono font-bold text-orange-400 mb-3 tracking-widest">PASO 04</div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl mb-5">
                🚀
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Publicación Automática</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Tus piezas se publican solas en Instagram, Facebook, TikTok y Google Maps en el mejor horario.
                Tú recibes un mensaje en WhatsApp y apruebas con 1 toque.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-700/40 text-xs text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Cero tiempo perdido
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. RESPETO TOTAL A TU PRODUCTO REAL (INTERACTIVO) ── */}
      <section className="py-24 border-t border-slate-800/80 bg-slate-900/60">
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-400">El gran diferencial</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mt-2">
              Tus fotos reales, convertidas en carteles comerciales de primer nivel.
            </h2>
            <p className="text-slate-300 mt-4 text-base">
              No inventamos comida artificial ni deformamos tus platos. Nuestros agentes toman la foto que tú
              tomas con tu teléfono y la transforman con tipografía publicitaria nítida.
            </p>

            {/* Pestañas de Estilos */}
            <div className="inline-flex p-1.5 rounded-xl bg-slate-800/90 border border-slate-700 mt-8 gap-2">
              <button
                onClick={() => setSelectedStyle("split")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  selectedStyle === "split"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                🍔 Split Comercial (Combo &amp; Precio)
              </button>
              <button
                onClick={() => setSelectedStyle("gourmet")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  selectedStyle === "gourmet"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                🍷 Encabezado Gourmet (Plato de Autor)
              </button>
              <button
                onClick={() => setSelectedStyle("recipe")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  selectedStyle === "recipe"
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                🥗 Ficha con Ingredientes (Receta)
              </button>
            </div>
          </div>

          {/* Comparador Interactivo */}
          <div className="max-w-4xl mx-auto bg-slate-800/40 rounded-3xl border border-slate-700/80 p-6 sm:p-10 shadow-2xl" data-reveal>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-700/60">
              <div>
                <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                  {selectedStyle === "split" && "Ideal para promociones, combos y lanzamientos"}
                  {selectedStyle === "gourmet" && "Ideal para destacar la alta cocina y platos estrella"}
                  {selectedStyle === "recipe" && "Ideal para educar, generar interacción y guardados"}
                </span>
                <h3 className="text-xl font-bold text-slate-100 mt-1">
                  {selectedStyle === "split" && "Split Lateral: Producto a la derecha, cartel y precio a la izquierda"}
                  {selectedStyle === "gourmet" && "Encabezado Superior: Cabecera limpia sobre mantel rústico"}
                  {selectedStyle === "recipe" && "Ficha de Cocina: Tira con ingredientes clave identificados"}
                </h3>
              </div>

              {/* Botón Switch: Original vs Arte */}
              <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 font-medium">Foto de celular</span>
                <button
                  onClick={() => setShowOriginal((prev) => !prev)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                    !showOriginal ? "bg-orange-500" : "bg-slate-700"
                  }`}
                  aria-label="Alternar vista original"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      !showOriginal ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-xs text-orange-400 font-bold">Con Arte de Agentes</span>
              </div>
            </div>

            {/* Simulación Gráfica de la Pieza */}
            <div className="relative aspect-square max-w-[500px] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-700/70 bg-stone-950 flex flex-col justify-between p-6">
              {/* Fondo simulado de plato real */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                style={{
                  backgroundImage:
                    selectedStyle === "split"
                      ? "radial-gradient(circle at 75% 50%, rgba(255,107,0,0.2) 0%, rgba(15,23,42,0.95) 75%), url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=80')"
                      : selectedStyle === "gourmet"
                      ? "radial-gradient(circle at 50% 60%, rgba(255,107,0,0.15) 0%, rgba(15,23,42,0.9) 75%), url('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80')"
                      : "radial-gradient(circle at 50% 50%, rgba(255,107,0,0.15) 0%, rgba(15,23,42,0.9) 75%), url('https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=80')",
                  filter: showOriginal ? "none" : "contrast(1.05) saturate(1.1)",
                }}
              />

              {/* Si está en modo original, mostramos marca de agua de foto cruda */}
              {showOriginal ? (
                <div className="relative z-10 m-auto bg-black/70 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 text-center">
                  <span className="text-2xl mb-1 block">📱</span>
                  <p className="text-sm font-bold text-white">Foto original tomada con tu celular</p>
                  <p className="text-xs text-slate-300 mt-1">Sin diseño, sin precio visible ni llamada a la acción.</p>
                </div>
              ) : (
                <>
                  {/* ESTILO SPLIT COMERCIAL */}
                  {selectedStyle === "split" && (
                    <div className="relative z-10 w-full h-full flex flex-col justify-between">
                      <div className="w-1/2 pr-3 space-y-2">
                        <span className="inline-block px-2.5 py-1 rounded bg-orange-600 text-white font-extrabold text-[11px] tracking-wider uppercase">
                          🔥 COMBO IMPERDIBLE
                        </span>
                        <p className="text-xs font-serif italic text-amber-200">
                          Edición Especial de la Casa
                        </p>
                        <h4 className="text-2xl font-black text-white leading-tight uppercase drop-shadow-md">
                          Doble Cheddar &amp; Papas
                        </h4>
                        <p className="text-xs text-slate-200 line-clamp-2">
                          Carne angus smash, queso fundido y papas rústicas con salsa especial.
                        </p>
                      </div>

                      <div className="w-1/2 pr-3 flex items-center justify-between pt-4">
                        <div>
                          <span className="text-[10px] text-slate-300 uppercase block font-bold">Por solo</span>
                          <span className="text-2xl font-black text-amber-300 drop-shadow">$8.990</span>
                        </div>
                        <span className="px-3 py-1.5 bg-white text-stone-900 rounded-lg text-xs font-black shadow-lg">
                          Pide Aquí ➔
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ESTILO ENCABEZADO GOURMET */}
                  {selectedStyle === "gourmet" && (
                    <div className="relative z-10 w-full h-full flex flex-col justify-between text-center">
                      <div className="bg-stone-900/85 backdrop-blur-md p-4 rounded-2xl border border-stone-700/80 max-w-sm mx-auto shadow-2xl">
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-1">
                          ⭐ RECOMENDACIÓN DEL CHEF
                        </span>
                        <h4 className="text-xl font-extrabold text-white">
                          Salmón Sellado en Mantequilla
                        </h4>
                        <p className="text-xs text-stone-300 mt-1">
                          Acompañado de papas doradas al romero y reducción de cítricos.
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-3">
                        <span className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg">
                          Reserva tu mesa por WhatsApp
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ESTILO FICHA CON INGREDIENTES */}
                  {selectedStyle === "recipe" && (
                    <div className="relative z-10 w-full h-full flex flex-col justify-between">
                      <div className="bg-stone-900/80 backdrop-blur-md p-3 rounded-xl border border-stone-700 max-w-xs">
                        <span className="text-[10px] font-bold text-amber-300 uppercase">
                          🥗 RECETA DE NUESTRA COCINA
                        </span>
                        <h4 className="text-lg font-bold text-white">Pasta al Pesto Di Basilico</h4>
                      </div>

                      {/* Tira de ingredientes */}
                      <div className="bg-stone-950/90 backdrop-blur-md p-3 rounded-2xl border border-stone-800 flex items-center justify-around gap-2 text-center">
                        <div className="text-[11px] text-slate-200">
                          <span className="text-base block">🧄</span> Ajo Chilote
                        </div>
                        <div className="text-[11px] text-slate-200">
                          <span className="text-base block">🫒</span> Oliva Virgen
                        </div>
                        <div className="text-[11px] text-slate-200">
                          <span className="text-base block">🌿</span> Albahaca
                        </div>
                        <div className="text-[11px] text-slate-200">
                          <span className="text-base block">🧀</span> Parmesano
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Explicación de nuestros agentes */}
            <div className="mt-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3 text-xs sm:text-sm text-slate-200">
              <span className="text-xl">✨</span>
              <span>
                <strong>Decisión de Nuestros Agentes:</strong> Inspeccionan el encuadre de tu foto, identifican el
                espacio libre sin comida y montan el diseño con tipografía vectorial nítida en español.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. REELS Y VIDEOS DINÁMICOS ── */}
      <section className="py-24 border-t border-slate-800/80">
        <div className="wrap">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" data-reveal>
            <div>
              <span className="eyebrow text-orange-400">Formato vertical de alto alcance</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mt-2 leading-tight">
                Reels, TikToks y Shorts que atrapan a tu cliente en los primeros 3 segundos.
              </h2>
              <p className="text-slate-300 mt-4 text-base leading-relaxed">
                El video vertical es el formato con mayor crecimiento y alcance orgánico. Nuestros agentes redactan
                guiones con fórmulas probadas de retención, animan el contenido y dejan cada video listo para publicar.
              </p>

              <div className="space-y-4 mt-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-100">El Gancho (Primeros 3 seg)</h4>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Una frase contundente que frena el scroll y despierta el apetito o la curiosidad de inmediato.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-100">Desarrollo Dinámico</h4>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Muestra tu plato o servicio en acción, con subtítulos llamativos y ritmo visual moderno.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-100">Llamado a la Acción Directo</h4>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Indica con claridad cómo pedir por WhatsApp o visitar tu local hoy mismo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup Reel */}
            <div className="relative mx-auto max-w-[320px] aspect-[9/16] rounded-3xl bg-slate-900 border-4 border-slate-700 shadow-2xl overflow-hidden flex flex-col justify-between p-6">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80')",
                  filter: "brightness(0.85)",
                }}
              />
              <div className="relative z-10 flex items-center justify-between text-white text-xs font-bold">
                <span className="bg-red-600 px-2.5 py-1 rounded-full uppercase text-[10px]">● REEL VIRAL</span>
                <span>0:24</span>
              </div>

              <div className="relative z-10 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2 text-white">
                <span className="text-[11px] font-bold text-amber-300 block">🔥 GANCHO PROBADO:</span>
                <p className="text-xs font-semibold leading-snug">
                  &quot;Si buscas una hamburguesa que realmente chorree queso en Santiago, tienes que ver esto...&quot;
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Guión de nuestros agentes</span>
                  <span className="text-orange-400 font-bold">Listo para IG &amp; TikTok</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. COMANDO POR WHATSAPP ── */}
      <section className="py-24 border-t border-slate-800/80 bg-slate-900/40">
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-emerald-400">Control total desde tu bolsillo</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mt-2">
              Sin computadoras ni paneles difíciles: manejas tu agencia desde WhatsApp.
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              No tienes que aprender a usar ningún programa complicado. Todo te llega a la app que ya tienes en el
              bolsillo todos los días.
            </p>

            {/* Pestañas de Escenarios */}
            <div className="inline-flex p-1.5 rounded-xl bg-slate-800 border border-slate-700 mt-8 gap-2">
              <button
                onClick={() => setActiveScenario("aprobar")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeScenario === "aprobar"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                1. Aprobar Posts Semanales
              </button>
              <button
                onClick={() => setActiveScenario("urgente")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeScenario === "urgente"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                2. Crear Promo Urgente al Vuelo
              </button>
              <button
                onClick={() => setActiveScenario("metricas")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeScenario === "metricas"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                3. Resumen y Rendimiento
              </button>
            </div>
          </div>

          {/* Simulación de Chat de WhatsApp */}
          <div className="max-w-xl mx-auto bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl" data-reveal>
            {/* Header del chat */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                💬
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Santisoft Agentes de Contenido</h4>
                <p className="text-[11px] text-emerald-400">● En línea para tu negocio</p>
              </div>
            </div>

            {/* Conversación según escenario */}
            <div className="space-y-4 text-xs sm:text-sm">
              {activeScenario === "aprobar" && (
                <>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200">
                    <p className="font-semibold text-white mb-1">📅 Tus próximos posts listos:</p>
                    <p className="text-slate-300">
                      • <strong>Miércoles 13:00</strong> — Combo Doble Cheddar ($8.990)
                      <br />• <strong>Viernes 19:30</strong> — Reel &quot;¿Dónde comer la mejor burger este finde?&quot;
                    </p>
                    <p className="text-emerald-400 mt-2 font-bold">
                      Responde &quot;Aprobar&quot; para dejarlos programados de inmediato.
                    </p>
                  </div>
                  <div className="bg-emerald-700 text-white p-3 rounded-2xl rounded-tr-none ml-auto max-w-[70%] font-semibold text-right">
                    Aprobar todo 👍
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200">
                    <p className="text-emerald-400 font-bold">✓ ¡Listo! Publicaciones aprobadas y programadas.</p>
                    <p className="text-slate-300 mt-1">Saldrán solas en Instagram, Facebook y TikTok.</p>
                  </div>
                </>
              )}

              {activeScenario === "urgente" && (
                <>
                  <div className="bg-emerald-700 text-white p-3 rounded-2xl rounded-tr-none ml-auto max-w-[80%] text-right">
                    Tengo mucha masa hoy. Saca una promo express de 2x1 en pizzas familiares a $14.990 solo para hoy.
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200">
                    <p className="font-semibold text-white mb-1">✨ ¡Borrador generado por nuestros agentes!</p>
                    <p className="text-slate-300 italic">
                      &quot;¡Alerta de Jueves de Pizza! 🍕 2x1 en Familiares artesanales por solo $14.990. Válido hasta
                      agotar stock de hoy. Pide al WhatsApp antes que se acaben.&quot;
                    </p>
                    <p className="text-orange-400 mt-2 font-bold">¿Lo publicamos ahora en historias y feed?</p>
                  </div>
                  <div className="bg-emerald-700 text-white p-3 rounded-2xl rounded-tr-none ml-auto max-w-[70%] font-semibold text-right">
                    Publicar ya 🚀
                  </div>
                </>
              )}

              {activeScenario === "metricas" && (
                <>
                  <div className="bg-emerald-700 text-white p-3 rounded-2xl rounded-tr-none ml-auto max-w-[70%] text-right">
                    ¿Cómo nos fue esta semana?
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200">
                    <p className="font-semibold text-white mb-1">📊 Resumen de los últimos 7 días:</p>
                    <p className="text-slate-300">
                      • <strong>+4.250 personas</strong> vieron tus posts en tu comuna.
                      <br />• <strong>38 personas</strong> tocaron el botón directo a tu WhatsApp.
                      <br />• El post más exitoso fue el Reel del Combo Doble Queso.
                    </p>
                    <p className="text-emerald-400 mt-2 font-bold">Nuestros agentes ya preparan la próxima semana.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. MULTICANAL 360° ── */}
      <section className="py-24 border-t border-slate-800/80">
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-400">Distribución sincronizada</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mt-2">
              Tu marca activa donde tus clientes están buscando hoy.
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              Con un solo clic, tu contenido se adapta y se publica en todas las plataformas principales sin esfuerzo.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center" data-reveal>
            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-3xl block mb-2">📸</span>
              <h4 className="font-bold text-slate-100 text-sm">Instagram</h4>
              <p className="text-xs text-slate-400 mt-1">Feed, Stories y Reels</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-3xl block mb-2">👥</span>
              <h4 className="font-bold text-slate-100 text-sm">Facebook</h4>
              <p className="text-xs text-slate-400 mt-1">Página y grupos</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-3xl block mb-2">🎵</span>
              <h4 className="font-bold text-slate-100 text-sm">TikTok</h4>
              <p className="text-xs text-slate-400 mt-1">Videos con audio en tendencia</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-3xl block mb-2">📍</span>
              <h4 className="font-bold text-slate-100 text-sm">Google Maps</h4>
              <p className="text-xs text-slate-400 mt-1">Ficha de negocio local</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-3xl block mb-2">▶️</span>
              <h4 className="font-bold text-slate-100 text-sm">YouTube</h4>
              <p className="text-xs text-slate-400 mt-1">Shorts verticales</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-3xl block mb-2">✍️</span>
              <h4 className="font-bold text-slate-100 text-sm">Blog &amp; SEO</h4>
              <p className="text-xs text-slate-400 mt-1">Artículos para Google</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. TABLA COMPARATIVA ── */}
      <section className="py-24 border-t border-slate-800/80 bg-slate-900/60">
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-400">Comparativa directa</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 mt-2">
              ¿Por qué somos la opción más inteligente para tu negocio?
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              Mira la diferencia real entre contratar una agencia clásica, agotarte haciéndolo tú mismo o activar a
              nuestros agentes.
            </p>
          </div>

          <div className="overflow-x-auto" data-reveal>
            <table className="w-full text-left border-collapse min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs">
                  <th className="py-4 px-6 font-bold">Criterio</th>
                  <th className="py-4 px-6 font-bold text-red-400">Agencia Tradicional</th>
                  <th className="py-4 px-6 font-bold text-amber-400">Hacerlo Tú Mismo</th>
                  <th className="py-4 px-6 font-bold text-emerald-400 bg-orange-500/10 rounded-t-xl">
                    Con Nuestros Agentes ⭐
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Costo mensual</td>
                  <td className="py-4 px-6 text-red-300">$500 a $1.500 USD</td>
                  <td className="py-4 px-6 text-amber-300">Tu tiempo libre (invaluable)</td>
                  <td className="py-4 px-6 font-bold text-emerald-400 bg-orange-500/10">
                    Desde $24.990 CLP / mes
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Tiempo de entrega</td>
                  <td className="py-4 px-6">5 a 10 días hábiles</td>
                  <td className="py-4 px-6">Cuando tengas 2 horas libres</td>
                  <td className="py-4 px-6 font-bold text-emerald-400 bg-orange-500/10">Minutos (24/7)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Tus fotos reales</td>
                  <td className="py-4 px-6">Piden sesiones caras de fotos</td>
                  <td className="py-4 px-6">Fotos sueltas sin diseño ni precio</td>
                  <td className="py-4 px-6 font-bold text-emerald-400 bg-orange-500/10">
                    Vestidas con cartelería profesional
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Aprobación y control</td>
                  <td className="py-4 px-6">Mails interminables y reuniones</td>
                  <td className="py-4 px-6">Sin planificación fija</td>
                  <td className="py-4 px-6 font-bold text-emerald-400 bg-orange-500/10">
                    En 1 toque desde WhatsApp
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-white">Publicación</td>
                  <td className="py-4 px-6">Solo Instagram y Facebook</td>
                  <td className="py-4 px-6">Una sola red por falta de tiempo</td>
                  <td className="py-4 px-6 font-bold text-emerald-400 bg-orange-500/10">
                    Instagram, TikTok, Google, FB y Blog
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 9. DOBLE LLAMADO A LA ACCIÓN (FORMULARIO EXPRESS + WHATSAPP) ── */}
      <section id="muestra-gratis" className="py-24 border-t border-slate-800/80">
        <div className="wrap">
          <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-b from-slate-800/80 to-slate-900 border border-slate-700 p-8 sm:p-14 shadow-2xl" data-reveal>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="eyebrow text-orange-400">Pruébalo sin costo</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 mt-2">
                Mira cómo se vería tu negocio hoy mismo, sin pagar nada.
              </h2>
              <p className="text-slate-300 mt-3 text-base">
                Déjanos el nombre de tu negocio y te preparamos una <strong>muestra gratuita y personalizada</strong> con
                publicaciones y estrategia real en menos de lo que imaginas.
              </p>
            </div>

            {formStatus === "success" ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center max-w-lg mx-auto">
                <span className="text-4xl block mb-2">🎉</span>
                <h3 className="text-xl font-bold text-white mb-2">¡Solicitud recibida con éxito!</h3>
                <p className="text-slate-300 text-sm mb-6">
                  Nuestros agentes ya están preparando la muestra comercial para <strong>{businessName}</strong>. Te
                  escribiremos al WhatsApp <strong>{contactPhone}</strong> con tu propuesta lista.
                </p>
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
                    `¡Hola! Acabo de pedir una muestra para ${businessName} (${businessRubro}). Quiero coordinar por aquí.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
                >
                  <span>💬</span> Abrir WhatsApp de Inmediato
                </a>
              </div>
            ) : (
              <form onSubmit={handleSampleSubmit} className="max-w-xl mx-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Nombre de tu Negocio / Local *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej. Pizzería Donatello / Burger House"
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Rubro Comercial *
                    </label>
                    <select
                      value={businessRubro}
                      onChange={(e) => setBusinessRubro(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-orange-500 text-sm"
                    >
                      <option>Hamburguesería / Fast Food</option>
                      <option>Pizzería / Trattoria</option>
                      <option>Sushi &amp; Nikkei</option>
                      <option>Cafetería &amp; Pastelería</option>
                      <option>Restaurante Gourmet / Autor</option>
                      <option>Tienda / Retail</option>
                      <option>Servicios Profesionales</option>
                      <option>Estética, Salud o Belleza</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Teléfono WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="tucorreo@negocio.com"
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </div>

                {formStatus === "error" && (
                  <p className="text-red-400 text-xs">
                    Hubo un problema enviando tus datos. Puedes escribirnos directo al WhatsApp de abajo.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={formStatus === "loading"}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-base shadow-xl shadow-orange-500/25 transition-all text-center flex items-center justify-center gap-2 mt-2"
                >
                  {formStatus === "loading" ? "Procesando..." : "✨ Generar Muestra Gratuita de Mi Negocio"}
                </button>

                {/* Separador O */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-xs uppercase font-bold text-slate-500">O también puedes</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                {/* Botón directo de WhatsApp Comercial */}
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <span>💬</span> Hablar Directamente con un Asesor por WhatsApp
                </a>
              </form>
            )}

            <div className="mt-8 text-center text-xs text-slate-400">
              🔒 Tus datos son confidenciales y solo los usaremos para enviarte tu propuesta de muestra. Sin spam.
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER INSTITUCIONAL ── */}
      <BrandFooter />
    </div>
  );
}
