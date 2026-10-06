"use client";

import { useState, useEffect } from "react";
import BrandHeader from "../../components/BrandHeader";
import BrandFooter from "../../components/BrandFooter";
import DotCanvas from "../../components/DotCanvas";
import PageTracker from "../../components/PageTracker";
import WebChatWidget from "../../components/WebChatWidget";

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "56965909543";
const WA_MSG = encodeURIComponent(
  "¡Hola Santisoft! Vi la página de cómo funciona su equipo de agentes para redes y quiero ver una muestra para mi negocio."
);

type ImageOrigin = "real" | "generated";
type StyleKey = "split" | "gourmet" | "recipe";
type ScenarioKey = "aprobar" | "urgente" | "metricas";
type PromptCategory = "all" | "gastronomia" | "cafe" | "fastfood";

interface PromptStyleCard {
  id: string;
  name: string;
  category: "gastronomia" | "cafe" | "fastfood";
  tag: string;
  description: string;
  lightingMood: string;
  recommendedFor: string;
  bgUrl: string;
}

const PROMPT_GALLERY: PromptStyleCard[] = [
  {
    id: "gourmet-moody",
    name: "Gourmet de Autor (Dark & Moody)",
    category: "gastronomia",
    tag: "Alta Cocina",
    description: "Iluminación rasante tenue, contrastes cálidos y fondos oscuros que resaltan la textura y brillo de la comida.",
    lightingMood: "Luz lateral suave con penumbra de fondo",
    recommendedFor: "Restaurantes de autor, carnes premium, pescados y vinos",
    bgUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "street-food-vibrant",
    name: "Street Food & Alto Contraste",
    category: "fastfood",
    tag: "Comida Rápida & Burgers",
    description: "Primeros planos jugosos con queso derretido, colores intensos y fondos con ligero desenfoque urbano.",
    lightingMood: "Luz cenital cálida de alto impacto",
    recommendedFor: "Hamburgueserías, pizzerías, sándwiches y locales nocturnos",
    bgUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "rustico-artesanal",
    name: "Rústico Tradición (Bodegón)",
    category: "gastronomia",
    tag: "Artesanal",
    description: "Maderas nobles, harina espolvoreada, manteles de lino e ingredientes frescos crudos alrededor del plato.",
    lightingMood: "Luz de ventana difusa y natural",
    recommendedFor: "Pastas frescas, panaderías, trattorias y empanadas",
    bgUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cafe-editorial",
    name: "Editorial Brunch & Especialidad",
    category: "cafe",
    tag: "Cafetería & Brunch",
    description: "Fondos claros y neutros, luz matutina natural, sombras suaves y estética limpia estilo revista gastronómica.",
    lightingMood: "Luz natural diurna sobre madera clara",
    recommendedFor: "Cafés de especialidad, pastelerías, desayunos y brunch",
    bgUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "splash-action",
    name: "Splash & Acción de Estudio",
    category: "fastfood",
    tag: "Dinamismo",
    description: "Captura de alta velocidad: salsas cayendo, queso estirándose o ingredientes flotando con máxima nitidez.",
    lightingMood: "Flash estroboscópico de estudio",
    recommendedFor: "Promociones agresivas, cócteles, jugos y lanzamientos",
    bgUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "flat-lay-cenital",
    name: "Cenital Flat-Lay Comercial",
    category: "gastronomia",
    tag: "Mesa Completa",
    description: "Vista perpendicular desde arriba de 90°. Orden simétrico con espacio despejado para tablas de precios y combos.",
    lightingMood: "Iluminación pareja sin sombras duras",
    recommendedFor: "Combos familiares, tablas de picoteo, sushi y menús ejecutivos",
    bgUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  },
];

export default function ComoFuncionaPage() {
  // Origen de la imagen: Real vs Generada por agentes
  const [imageOrigin, setImageOrigin] = useState<ImageOrigin>("real");

  // Estilo visual de la composición en el visor
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>("split");
  const [showOriginal, setShowOriginal] = useState(false);

  // Filtro de la galería de prompts
  const [activePromptCat, setActivePromptCat] = useState<PromptCategory>("all");

  // Simulador de WhatsApp
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>("aprobar");

  // Formulario express de muestra
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
      { threshold: 0.08 }
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
          mensaje: `Solicitud de muestra comercial para ${businessName} (Rubro: ${businessRubro}). WhatsApp: ${contactPhone}`,
        }),
      });

      if (!res.ok) throw new Error("Error enviando solicitud");
      setFormStatus("success");
    } catch {
      setFormStatus("error");
    }
  };

  const filteredPrompts =
    activePromptCat === "all"
      ? PROMPT_GALLERY
      : PROMPT_GALLERY.filter((p) => p.category === activePromptCat);

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

      {/* ── 1. HERO COMERCIAL (100% CONTRASTE NATIVO) ── */}
      <section className="hero pt-14 pb-20 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-4xl mx-auto" data-reveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-wider mb-6">
              <span>🚀</span> Tu equipo de marketing trabajando 24/7
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6"
              style={{ color: "var(--ink)" }}
            >
              Gestionamos las redes de tu negocio, atraemos clientes y publicamos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                todos los días por ti.
              </span>
            </h1>

            <p
              className="text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto mb-10"
              style={{ color: "var(--ink-dim)" }}
            >
              Nuestros agentes especializados investigan qué busca tu cliente, arman tu calendario del mes,
              visten tus fotos con cartelería comercial de alto impacto y publican automáticamente en
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
                className="w-full sm:w-auto px-7 py-4 rounded-xl border font-semibold text-base transition-all text-center flex items-center justify-center gap-2 shadow-sm"
                style={{
                  background: "var(--panel)",
                  borderColor: "var(--line-strong)",
                  color: "var(--ink)",
                }}
              >
                <span>💬</span> Chatear por WhatsApp
              </a>
            </div>

            {/* Badges de confianza */}
            <div
              className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs font-medium"
              style={{ color: "var(--ink-dim)" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span> Sin contratos forzosos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span> Fotos reales o generadas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span> Control 100% desde WhatsApp
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. EL DOLOR REAL DEL CLIENTE (FONDO TRANSPARENTE, SIN BANDAS GRISES) ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              La realidad del día a día
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              Llevar un negocio ya es bastante trabajo como para además ser creador de contenido.
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              Hablamos a diario con dueños de restaurantes, tiendas y profesionales. Casi todos se enfrentan a
              las mismas 3 frustraciones:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-reveal>
            {/* Tarjeta 1 */}
            <div
              className="p-8 rounded-2xl border shadow-sm flex flex-col justify-between transition-all"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center text-2xl mb-6">
                  ⏳
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--ink)" }}>
                  &quot;No me da el tiempo para pensar qué publicar&quot;
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Terminas tu jornada agotado. Quieres subir algo a redes, pero te quedas en blanco frente al celular,
                  lo pospones para mañana y tu cuenta pasa semanas en silencio perdiendo clientes.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs text-red-500 font-medium"
                style={{ borderColor: "var(--line)" }}
              >
                ✕ Resultado: Tus competidores se quedan con la atención de tu zona.
              </div>
            </div>

            {/* Tarjeta 2 */}
            <div
              className="p-8 rounded-2xl border shadow-sm flex flex-col justify-between transition-all"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-2xl mb-6">
                  💸
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--ink)" }}>
                  &quot;Las agencias tradicionales cobran caro y demoran días&quot;
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Te cobran cientos de miles de pesos cada mes por un par de posts genéricos. Pides una promoción urgente
                  para este fin de semana y tardan 5 días en responderte un correo.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs text-amber-500 font-medium"
                style={{ borderColor: "var(--line)" }}
              >
                ✕ Resultado: Pagar caro por un servicio lento y poco flexible.
              </div>
            </div>

            {/* Tarjeta 3 */}
            <div
              className="p-8 rounded-2xl border shadow-sm flex flex-col justify-between transition-all"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center text-2xl mb-6">
                  📸
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--ink)" }}>
                  &quot;Saco fotos pero no se ven como las de marcas grandes&quot;
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Tu producto es delicioso o de excelente calidad, pero una foto suelta en el celular se ve fría,
                  sin precios destacados, sin llamados a la acción y sin el diseño que invita a comprar.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs text-orange-500 font-medium"
                style={{ borderColor: "var(--line)" }}
              >
                ✕ Resultado: Fotos caseras que no transmiten el verdadero valor de tu marca.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CÓMO LO HACEMOS (LOS 4 PASOS) ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-20" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              Cómo trabaja nuestro equipo
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              Un flujo simple y continuo para que tu marca nunca pare de vender.
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              Nuestros agentes especializados se reparten el trabajo tal como lo haría una agencia de primer nivel,
              pero en minutos y a una fracción del costo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" data-reveal>
            {/* Paso 1 */}
            <div
              className="relative p-7 rounded-2xl border shadow-sm flex flex-col justify-between"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="text-xs font-mono font-bold text-orange-500 mb-3 tracking-widest">PASO 01</div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center text-2xl mb-5">
                  📡
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--ink)" }}>
                  Radar de Nicho
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Nuestros agentes escanean las preguntas frecuentes, dudas y platos más buscados en tu rubro y ciudad.
                  No adivinamos: creamos contenido que la gente ya quiere ver.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs flex items-center gap-1.5"
                style={{ borderColor: "var(--line)", color: "var(--ink-dim)" }}
              >
                <span className="text-emerald-500 font-bold">✓</span> Temas con demanda real
              </div>
            </div>

            {/* Paso 2 */}
            <div
              className="relative p-7 rounded-2xl border shadow-sm flex flex-col justify-between"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="text-xs font-mono font-bold text-blue-500 mb-3 tracking-widest">PASO 02</div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center text-2xl mb-5">
                  📅
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--ink)" }}>
                  Estrategia Mensual
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Armamos un calendario balanceado con 4 pilares: combos de venta directa, platos de autor, secretos de
                  cocina para ganar autoridad y videos cortos de gran alcance.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs flex items-center gap-1.5"
                style={{ borderColor: "var(--line)", color: "var(--ink-dim)" }}
              >
                <span className="text-emerald-500 font-bold">✓</span> 30 días planificados
              </div>
            </div>

            {/* Paso 3 */}
            <div
              className="relative p-7 rounded-2xl border shadow-sm flex flex-col justify-between"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="text-xs font-mono font-bold text-purple-500 mb-3 tracking-widest">PASO 03</div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center text-2xl mb-5">
                  🎨
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--ink)" }}>
                  Dirección de Arte
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Nuestros agentes examinan el encuadre y estampan carteles comerciales, precios destacados y botones
                  <strong> directamente sobre la imagen</strong>, sin tapar ni deformar tu comida.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs flex items-center gap-1.5"
                style={{ borderColor: "var(--line)", color: "var(--ink-dim)" }}
              >
                <span className="text-emerald-500 font-bold">✓</span> Tu plato queda impecable
              </div>
            </div>

            {/* Paso 4 */}
            <div
              className="relative p-7 rounded-2xl border shadow-sm flex flex-col justify-between"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="text-xs font-mono font-bold text-emerald-500 mb-3 tracking-widest">PASO 04</div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center text-2xl mb-5">
                  🚀
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--ink)" }}>
                  Publicación Automática
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Tus piezas se publican solas en Instagram, Facebook, TikTok y Google Maps en el mejor horario.
                  Tú recibes un mensaje en WhatsApp y apruebas con 1 toque.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs flex items-center gap-1.5"
                style={{ borderColor: "var(--line)", color: "var(--ink-dim)" }}
              >
                <span className="text-emerald-500 font-bold">✓</span> Cero tiempo perdido
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. RESPETO TOTAL A TU PRODUCTO: FOTOS REALES O CREADAS POR AGENTES (TEXTO DIRECTO S/CARD) ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              El gran diferencial visual
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              El texto directo sobre la imagen. La comida es siempre la protagonista.
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              Nada de cajas oscuras que tapen tu comida. Nuestros agentes estampan tipografía publicitaria nítida
              directamente sobre el espacio libre de la foto, ya sea una foto real tomada con tu teléfono o una imagen
              creada por ellos mismos.
            </p>

            {/* Selector de Origen: Foto Real vs Creada por Agentes */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <button
                onClick={() => {
                  setImageOrigin("real");
                  setShowOriginal(false);
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border"
                style={{
                  background: imageOrigin === "real" ? "var(--signal)" : "var(--panel)",
                  color: imageOrigin === "real" ? "#FFFFFF" : "var(--ink)",
                  borderColor: imageOrigin === "real" ? "var(--signal)" : "var(--line)",
                }}
              >
                <span>📸</span> Fotos Reales de tu Catálogo
              </button>

              <button
                onClick={() => {
                  setImageOrigin("generated");
                  setShowOriginal(false);
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border"
                style={{
                  background: imageOrigin === "generated" ? "var(--signal)" : "var(--panel)",
                  color: imageOrigin === "generated" ? "#FFFFFF" : "var(--ink)",
                  borderColor: imageOrigin === "generated" ? "var(--signal)" : "var(--line)",
                }}
              >
                <span>🎨</span> Imágenes Creadas por Nuestros Agentes
              </button>
            </div>

            {/* Pestañas de Estilos */}
            <div
              className="inline-flex p-1.5 rounded-xl border mt-5 gap-2 shadow-sm"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <button
                onClick={() => setSelectedStyle("split")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  selectedStyle === "split"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "hover:text-orange-500"
                }`}
                style={{ color: selectedStyle === "split" ? "#FFFFFF" : "var(--ink-dim)" }}
              >
                🍔 Split Comercial (Combo)
              </button>
              <button
                onClick={() => setSelectedStyle("gourmet")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  selectedStyle === "gourmet"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "hover:text-orange-500"
                }`}
                style={{ color: selectedStyle === "gourmet" ? "#FFFFFF" : "var(--ink-dim)" }}
              >
                🍷 Encabezado Gourmet
              </button>
              <button
                onClick={() => setSelectedStyle("recipe")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  selectedStyle === "recipe"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "hover:text-orange-500"
                }`}
                style={{ color: selectedStyle === "recipe" ? "#FFFFFF" : "var(--ink-dim)" }}
              >
                🥗 Ficha de Cocina
              </button>
            </div>
          </div>

          {/* Comparador Interactivo */}
          <div
            className="max-w-4xl mx-auto rounded-3xl border p-6 sm:p-10 shadow-xl"
            style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            data-reveal
          >
            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b"
              style={{ borderColor: "var(--line)" }}
            >
              <div>
                <span className="text-xs font-mono font-bold text-orange-500 uppercase tracking-wider">
                  {imageOrigin === "real" ? "Foto Real del Cliente" : "Generación Fotográfica de Nuestros Agentes"}
                  {" · "}
                  {selectedStyle === "split" && "Ideal para combos, promociones y delivery"}
                  {selectedStyle === "gourmet" && "Ideal para destacar la alta cocina y platos estrella"}
                  {selectedStyle === "recipe" && "Ideal para educar, generar interacción y guardados"}
                </span>
                <h3 className="text-xl font-bold mt-1" style={{ color: "var(--ink)" }}>
                  {imageOrigin === "real" ? (
                    selectedStyle === "split"
                      ? "Split Lateral: Plato real a la derecha, texto publicitario a la izquierda"
                      : selectedStyle === "gourmet"
                      ? "Encabezado Superior: Cabecera estampada directamente sobre la foto sin tapar la comida"
                      : "Ficha de Cocina: Tira de ingredientes identificados directamente sobre la mesa"
                  ) : (
                    selectedStyle === "split"
                      ? "Estudio Fotográfico: Imagen creada desde cero con espacio asimétrico para la oferta"
                      : selectedStyle === "gourmet"
                      ? "Bodegón de Autor: Escena generada con iluminación rasante de restaurante"
                      : "Flat-Lay Cenital: Mesa completa con vista cenital limpia para recetas"
                  )}
                </h3>
              </div>

              {/* Botón Switch: Original vs Arte (visible solo si es foto real) */}
              {imageOrigin === "real" && (
                <div
                  className="flex items-center gap-3 px-4 py-2 rounded-xl border"
                  style={{ background: "var(--panel-2)", borderColor: "var(--line)" }}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--ink-dim)" }}>
                    Foto cruda
                  </span>
                  <button
                    onClick={() => setShowOriginal((prev) => !prev)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                      !showOriginal ? "bg-orange-500" : "bg-slate-400"
                    }`}
                    aria-label="Alternar vista original"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        !showOriginal ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-orange-500">Con Arte Directo</span>
                </div>
              )}
            </div>

            {/* Contenedor del Cartel: TEXTO DIRECTO SOBRE LA IMAGEN (SIN CARDS QUE TAPEN EL PLATO) */}
            <div className="relative aspect-square max-w-[500px] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-stone-800 bg-stone-950 flex flex-col justify-between p-7 select-none">
              {/* Imagen de fondo (Foto Real vs Generada por Agentes) */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                style={{
                  backgroundImage:
                    imageOrigin === "real"
                      ? selectedStyle === "split"
                        ? "linear-gradient(to right, rgba(10,15,25,0.92) 0%, rgba(10,15,25,0.7) 45%, rgba(0,0,0,0.15) 80%), url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=80')"
                        : selectedStyle === "gourmet"
                        ? "linear-gradient(to bottom, rgba(10,15,25,0.88) 0%, rgba(10,15,25,0.2) 40%, rgba(10,15,25,0.85) 100%), url('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80')"
                        : "linear-gradient(to bottom, rgba(10,15,25,0.85) 0%, rgba(0,0,0,0.1) 45%, rgba(10,15,25,0.88) 100%), url('https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=80')"
                      : selectedStyle === "split"
                      ? "linear-gradient(to right, rgba(10,15,25,0.94) 0%, rgba(10,15,25,0.65) 48%, rgba(0,0,0,0.1) 85%), url('https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80')"
                      : selectedStyle === "gourmet"
                      ? "linear-gradient(to bottom, rgba(10,15,25,0.9) 0%, rgba(10,15,25,0.15) 45%, rgba(10,15,25,0.8) 100%), url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80')"
                      : "linear-gradient(to bottom, rgba(10,15,25,0.85) 0%, rgba(0,0,0,0.1) 45%, rgba(10,15,25,0.88) 100%), url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80')",
                  filter: showOriginal ? "none" : "contrast(1.05) saturate(1.1)",
                }}
              />

              {/* Modo foto cruda de celular */}
              {showOriginal ? (
                <div className="relative z-10 m-auto bg-black/75 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20 text-center">
                  <span className="text-3xl mb-2 block">📱</span>
                  <p className="text-base font-bold text-white">Foto original tomada con tu celular</p>
                  <p className="text-xs text-slate-300 mt-1">Sin tipografía, sin precios destacados ni llamado a la acción.</p>
                </div>
              ) : (
                <>
                  {/* 1. SPLIT COMERCIAL: TEXTO DIRECTO SOBRE EL LADO IZQUIERDO */}
                  {selectedStyle === "split" && (
                    <div className="relative z-10 w-full h-full flex flex-col justify-between">
                      <div className="w-[52%] space-y-2">
                        <span className="inline-block px-2.5 py-1 rounded bg-orange-600 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-md">
                          🔥 COMBO IMPERDIBLE
                        </span>
                        <p className="text-xs font-serif italic text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                          {imageOrigin === "real" ? "Edición Especial de la Casa" : "Creado por Nuestros Agentes"}
                        </p>
                        <h4 className="text-2xl sm:text-3xl font-black text-white leading-tight uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                          Doble Cheddar &amp; Papas
                        </h4>
                        <p className="text-xs text-slate-200 line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                          Carne angus smash, queso fundido y papas rústicas con salsa especial.
                        </p>
                      </div>

                      <div className="w-[52%] flex items-end justify-between pt-4">
                        <div>
                          <span className="text-[10px] text-slate-300 uppercase block font-bold drop-shadow">Por solo</span>
                          <span className="text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                            $8.990
                          </span>
                        </div>
                        <span className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-black shadow-xl shadow-orange-500/40">
                          Pide Aquí ➔
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2. ENCABEZADO GOURMET: TEXTO DIRECTO ARRIBA (SIN CARD TAPANDO EL PLATO) */}
                  {selectedStyle === "gourmet" && (
                    <div className="relative z-10 w-full h-full flex flex-col justify-between text-center">
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-widest block drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                          ⭐ RECOMENDACIÓN DEL CHEF
                        </span>
                        <h4 className="text-2xl sm:text-3xl font-black text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)]">
                          {imageOrigin === "real" ? "Salmón a las Finas Hierbas" : "Costillar Glaseado al Romero"}
                        </h4>
                        <p className="text-xs text-amber-100 max-w-sm mx-auto drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
                          Sellado en mantequilla clarificada con reducción de cítricos y papas doradas.
                        </p>
                      </div>

                      <div className="pb-1">
                        <span className="inline-block px-5 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-2xl shadow-orange-500/40 transform hover:scale-105 transition-all">
                          Reserva tu mesa por WhatsApp ➔
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 3. FICHA CON INGREDIENTES: TEXTO ARRIBA Y TIRA FLOTANTE DIRECTA */}
                  {selectedStyle === "recipe" && (
                    <div className="relative z-10 w-full h-full flex flex-col justify-between">
                      <div className="pt-2">
                        <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider block drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                          🥗 RECETA DE NUESTRA COCINA
                        </span>
                        <h4 className="text-2xl font-black text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
                          {imageOrigin === "real" ? "Pasta al Pesto Di Basilico" : "Ramen Tradicional de Autor"}
                        </h4>
                      </div>

                      {/* Tira de ingredientes flotando DIRECTAMENTE sobre la foto */}
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        <div className="text-center p-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/20 text-white shadow-lg">
                          <span className="text-base block">🧄</span>
                          <span className="text-[10px] font-bold block mt-0.5">Ajo Chilote</span>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/20 text-white shadow-lg">
                          <span className="text-base block">🫒</span>
                          <span className="text-[10px] font-bold block mt-0.5">Oliva Virgen</span>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/20 text-white shadow-lg">
                          <span className="text-base block">🌿</span>
                          <span className="text-[10px] font-bold block mt-0.5">Albahaca</span>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/20 text-white shadow-lg">
                          <span className="text-base block">🧀</span>
                          <span className="text-[10px] font-bold block mt-0.5">Parmesano</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Explicación de nuestros agentes */}
            <div
              className="mt-6 p-4 rounded-xl border flex items-center gap-3 text-xs sm:text-sm"
              style={{
                background: "var(--signal-soft)",
                borderColor: "var(--signal-line)",
                color: "var(--ink)",
              }}
            >
              <span className="text-xl">✨</span>
              <span>
                <strong>Decisión de Nuestros Agentes:</strong> Los textos se montan directamente sobre el espacio
                despejado de la imagen usando tipografía vectorial publicitaria, sombras suaves y jerarquía comercial.
                El plato nunca queda tapado.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. GALERÍA DE PROMPTS Y ESTILOS VISUALES DISPONIBLES ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              Identidad de marca a tu medida
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              Nuestra Galería de Estilos Visuales &amp; Prompts Listos para Usar.
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              Cada negocio tiene una vibra única. Nuestros agentes cuentan con una amplia biblioteca de estilos
              fotográficos calibrados para que todas tus publicaciones se vean profesionales y consistentes con tu marca.
            </p>

            {/* Filtros de la Galería */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setActivePromptCat("all")}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border"
                style={{
                  background: activePromptCat === "all" ? "var(--signal)" : "var(--panel)",
                  color: activePromptCat === "all" ? "#FFFFFF" : "var(--ink)",
                  borderColor: activePromptCat === "all" ? "var(--signal)" : "var(--line)",
                }}
              >
                Todos los Estilos
              </button>
              <button
                onClick={() => setActivePromptCat("gastronomia")}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border"
                style={{
                  background: activePromptCat === "gastronomia" ? "var(--signal)" : "var(--panel)",
                  color: activePromptCat === "gastronomia" ? "#FFFFFF" : "var(--ink)",
                  borderColor: activePromptCat === "gastronomia" ? "var(--signal)" : "var(--line)",
                }}
              >
                🍽️ Restaurantes &amp; Cocina
              </button>
              <button
                onClick={() => setActivePromptCat("fastfood")}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border"
                style={{
                  background: activePromptCat === "fastfood" ? "var(--signal)" : "var(--panel)",
                  color: activePromptCat === "fastfood" ? "#FFFFFF" : "var(--ink)",
                  borderColor: activePromptCat === "fastfood" ? "var(--signal)" : "var(--line)",
                }}
              >
                🍔 Fast Food &amp; Burgers
              </button>
              <button
                onClick={() => setActivePromptCat("cafe")}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border"
                style={{
                  background: activePromptCat === "cafe" ? "var(--signal)" : "var(--panel)",
                  color: activePromptCat === "cafe" ? "#FFFFFF" : "var(--ink)",
                  borderColor: activePromptCat === "cafe" ? "var(--signal)" : "var(--line)",
                }}
              >
                ☕ Cafetería &amp; Brunch
              </button>
            </div>
          </div>

          {/* Cuadrícula de Tarjetas de Estilos Visuales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-reveal>
            {filteredPrompts.map((style) => (
              <div
                key={style.id}
                className="group relative rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                style={{ background: "var(--panel)", borderColor: "var(--line)" }}
              >
                {/* Cabecera con imagen del estilo */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url('${style.bgUrl}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-orange-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                    {style.tag}
                  </span>
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: "var(--ink)" }}>
                      {style.name}
                    </h3>
                    <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--ink-dim)" }}>
                      {style.description}
                    </p>

                    <div className="space-y-2 pt-3 border-t text-xs" style={{ borderColor: "var(--line)" }}>
                      <div>
                        <span className="font-semibold block text-[11px] uppercase" style={{ color: "var(--ink-faint)" }}>
                          Iluminación:
                        </span>
                        <span style={{ color: "var(--ink)" }}>{style.lightingMood}</span>
                      </div>
                      <div>
                        <span className="font-semibold block text-[11px] uppercase" style={{ color: "var(--ink-faint)" }}>
                          Recomendado para:
                        </span>
                        <span className="font-medium" style={{ color: "var(--ink)" }}>
                          {style.recommendedFor}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: "var(--line)" }}>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <span>✓</span> Listo en 1 clic
                    </span>
                    <a href="#muestra-gratis" className="text-orange-500 font-bold hover:underline">
                      Probar en tu marca ➔
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12" data-reveal>
            <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
              ¿Tienes un estilo o colores corporativos específicos? Nuestros agentes pueden calibrar y fijar la
              <strong> paleta visual exacta</strong> de tu marca.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. REELS Y VIDEOS DINÁMICOS ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" data-reveal>
            <div>
              <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
                Formato vertical de alto alcance
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight" style={{ color: "var(--ink)" }}>
                Reels, TikToks y Shorts que atrapan a tu cliente en los primeros 3 segundos.
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                El video vertical es el formato con mayor crecimiento y alcance orgánico. Nuestros agentes redactan
                guiones con fórmulas probadas de retención, animan el contenido y dejan cada video listo para publicar.
              </p>

              <div className="space-y-4 mt-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-base font-bold" style={{ color: "var(--ink)" }}>
                      El Gancho (Primeros 3 seg)
                    </h4>
                    <p className="text-xs sm:text-sm" style={{ color: "var(--ink-dim)" }}>
                      Una frase contundente que frena el scroll y despierta el apetito o la curiosidad de inmediato.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-base font-bold" style={{ color: "var(--ink)" }}>
                      Desarrollo Dinámico
                    </h4>
                    <p className="text-xs sm:text-sm" style={{ color: "var(--ink-dim)" }}>
                      Muestra tu plato o servicio en acción, con subtítulos llamativos y ritmo visual moderno.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-base font-bold" style={{ color: "var(--ink)" }}>
                      Llamado a la Acción Directo
                    </h4>
                    <p className="text-xs sm:text-sm" style={{ color: "var(--ink-dim)" }}>
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

      {/* ── 7. COMANDO POR WHATSAPP ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-emerald-500 font-bold text-xs uppercase tracking-wider">
              Control total desde tu bolsillo
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              Sin computadoras ni paneles difíciles: manejas tu agencia desde WhatsApp.
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              No tienes que aprender a usar ningún programa complicado. Todo te llega a la app que ya tienes en el
              bolsillo todos los días.
            </p>

            {/* Pestañas de Escenarios */}
            <div
              className="inline-flex p-1.5 rounded-xl border mt-8 gap-2 shadow-sm"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <button
                onClick={() => setActiveScenario("aprobar")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeScenario === "aprobar"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "hover:text-emerald-500"
                }`}
                style={{ color: activeScenario === "aprobar" ? "#FFFFFF" : "var(--ink-dim)" }}
              >
                1. Aprobar Posts Semanales
              </button>
              <button
                onClick={() => setActiveScenario("urgente")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeScenario === "urgente"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "hover:text-emerald-500"
                }`}
                style={{ color: activeScenario === "urgente" ? "#FFFFFF" : "var(--ink-dim)" }}
              >
                2. Crear Promo Urgente al Vuelo
              </button>
              <button
                onClick={() => setActiveScenario("metricas")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeScenario === "metricas"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "hover:text-emerald-500"
                }`}
                style={{ color: activeScenario === "metricas" ? "#FFFFFF" : "var(--ink-dim)" }}
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

      {/* ── 8. MULTICANAL 360° ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              Distribución sincronizada
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              Tu marca activa donde tus clientes están buscando hoy.
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              Con un solo clic, tu contenido se adapta y se publica en todas las plataformas principales sin esfuerzo.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center" data-reveal>
            {[
              { icon: "📸", name: "Instagram", desc: "Feed, Stories y Reels" },
              { icon: "👥", name: "Facebook", desc: "Página y grupos" },
              { icon: "🎵", name: "TikTok", desc: "Videos en tendencia" },
              { icon: "📍", name: "Google Maps", desc: "Ficha de negocio local" },
              { icon: "▶️", name: "YouTube", desc: "Shorts verticales" },
              { icon: "✍️", name: "Blog & SEO", desc: "Artículos para Google" },
            ].map((chan) => (
              <div
                key={chan.name}
                className="p-5 rounded-2xl border shadow-sm"
                style={{ background: "var(--panel)", borderColor: "var(--line)" }}
              >
                <span className="text-3xl block mb-2">{chan.icon}</span>
                <h4 className="font-bold text-sm" style={{ color: "var(--ink)" }}>
                  {chan.name}
                </h4>
                <p className="text-xs mt-1" style={{ color: "var(--ink-dim)" }}>
                  {chan.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. TABLA COMPARATIVA DIRECTA ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              Comparativa directa
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              ¿Por qué somos la opción más inteligente para tu negocio?
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              Mira la diferencia real entre contratar una agencia clásica, agotarte haciéndolo tú mismo o activar a
              nuestros agentes.
            </p>
          </div>

          <div
            className="overflow-x-auto rounded-2xl border p-4 shadow-sm"
            style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            data-reveal
          >
            <table className="w-full text-left border-collapse min-w-[640px] text-sm">
              <thead>
                <tr className="border-b uppercase text-xs" style={{ borderColor: "var(--line)", color: "var(--ink-dim)" }}>
                  <th className="py-4 px-6 font-bold">Criterio</th>
                  <th className="py-4 px-6 font-bold text-red-500">Agencia Tradicional</th>
                  <th className="py-4 px-6 font-bold text-amber-500">Hacerlo Tú Mismo</th>
                  <th className="py-4 px-6 font-bold text-emerald-500 bg-orange-500/10 rounded-t-xl">
                    Con Nuestros Agentes ⭐
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--line)", color: "var(--ink-dim)" }}>
                <tr>
                  <td className="py-4 px-6 font-bold" style={{ color: "var(--ink)" }}>
                    Costo mensual
                  </td>
                  <td className="py-4 px-6 text-red-500">$500 a $1.500 USD</td>
                  <td className="py-4 px-6 text-amber-500">Tu tiempo libre (invaluable)</td>
                  <td className="py-4 px-6 font-bold text-emerald-500 bg-orange-500/10">
                    Desde $24.990 CLP / mes
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold" style={{ color: "var(--ink)" }}>
                    Tiempo de entrega
                  </td>
                  <td className="py-4 px-6">5 a 10 días hábiles</td>
                  <td className="py-4 px-6">Cuando tengas 2 horas libres</td>
                  <td className="py-4 px-6 font-bold text-emerald-500 bg-orange-500/10">Minutos (24/7)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold" style={{ color: "var(--ink)" }}>
                    Tus fotos reales
                  </td>
                  <td className="py-4 px-6">Piden sesiones caras de fotos</td>
                  <td className="py-4 px-6">Fotos sueltas sin diseño ni precio</td>
                  <td className="py-4 px-6 font-bold text-emerald-500 bg-orange-500/10">
                    Vestidas con cartelería profesional directa
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold" style={{ color: "var(--ink)" }}>
                    Aprobación y control
                  </td>
                  <td className="py-4 px-6">Mails interminables y reuniones</td>
                  <td className="py-4 px-6">Sin planificación fija</td>
                  <td className="py-4 px-6 font-bold text-emerald-500 bg-orange-500/10">
                    En 1 toque desde WhatsApp
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold" style={{ color: "var(--ink)" }}>
                    Publicación
                  </td>
                  <td className="py-4 px-6">Solo Instagram y Facebook</td>
                  <td className="py-4 px-6">Una sola red por falta de tiempo</td>
                  <td className="py-4 px-6 font-bold text-emerald-500 bg-orange-500/10">
                    Instagram, TikTok, Google, FB y Blog
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 10. DOBLE LLAMADO A LA ACCIÓN (FORMULARIO EXPRESS + WHATSAPP) ── */}
      <section id="muestra-gratis" className="py-24">
        <div className="wrap">
          <div
            className="max-w-4xl mx-auto rounded-3xl border p-8 sm:p-14 shadow-2xl"
            style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            data-reveal
          >
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
                Pruébalo sin costo
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold mt-2" style={{ color: "var(--ink)" }}>
                Mira cómo se vería tu negocio hoy mismo, sin pagar nada.
              </h2>
              <p className="mt-3 text-base" style={{ color: "var(--ink-dim)" }}>
                Déjanos el nombre de tu negocio y te preparamos una <strong>muestra gratuita y personalizada</strong> con
                publicaciones y estrategia real en menos de lo que imaginas.
              </p>
            </div>

            {formStatus === "success" ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center max-w-lg mx-auto">
                <span className="text-4xl block mb-2">🎉</span>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--ink)" }}>
                  ¡Solicitud recibida con éxito!
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--ink-dim)" }}>
                  Nuestros agentes ya están preparando la muestra comercial para <strong>{businessName}</strong>. Te
                  escribiremos al WhatsApp <strong>{contactPhone}</strong> con tu propuesta lista.
                </p>
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
                    `¡Hola! Acabo de pedir una muestra para ${businessName} (${businessRubro}). Quiero coordinar por aquí.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md"
                >
                  <span>💬</span> Abrir WhatsApp de Inmediato
                </a>
              </div>
            ) : (
              <form onSubmit={handleSampleSubmit} className="max-w-xl mx-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "var(--ink)" }}>
                    Nombre de tu Negocio / Local *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej. Pizzería Donatello / Burger House"
                    className="w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:border-orange-500"
                    style={{
                      background: "var(--panel-2)",
                      borderColor: "var(--line-strong)",
                      color: "var(--ink)",
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "var(--ink)" }}>
                      Rubro Comercial *
                    </label>
                    <select
                      value={businessRubro}
                      onChange={(e) => setBusinessRubro(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:border-orange-500"
                      style={{
                        background: "var(--panel-2)",
                        borderColor: "var(--line-strong)",
                        color: "var(--ink)",
                      }}
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
                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "var(--ink)" }}>
                      Teléfono WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:border-orange-500"
                      style={{
                        background: "var(--panel-2)",
                        borderColor: "var(--line-strong)",
                        color: "var(--ink)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "var(--ink)" }}>
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="tucorreo@negocio.com"
                    className="w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:border-orange-500"
                    style={{
                      background: "var(--panel-2)",
                      borderColor: "var(--line-strong)",
                      color: "var(--ink)",
                    }}
                  />
                </div>

                {formStatus === "error" && (
                  <p className="text-red-500 text-xs">
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
                  <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
                  <span className="text-xs uppercase font-bold" style={{ color: "var(--ink-faint)" }}>
                    O también puedes
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
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

            <div className="mt-8 text-center text-xs" style={{ color: "var(--ink-dim)" }}>
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
