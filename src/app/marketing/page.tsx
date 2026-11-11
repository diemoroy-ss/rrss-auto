"use client";

import { useState } from "react";
import Link from "next/link";
import ProductEcosystemBar from "../../components/landings/ProductEcosystemBar";
import ProductEcosystemFooter from "../../components/landings/ProductEcosystemFooter";

type BusinessPresetKey = "gastronomia" | "comercio" | "servicios";
type FormatPresetKey = "post" | "story" | "reel";

interface BusinessPreset {
  label: string;
  businessName: string;
  category: string;
  brandColor: string;
  brandBg: string;
  catalogItem: {
    name: string;
    price: string;
    promo: string;
    tag: string;
  };
  formats: Record<
    FormatPresetKey,
    {
      headline: string;
      badge: string;
      caption: string;
      scheduleSlot: string;
      channels: string[];
      ctaPreview: string;
    }
  >;
}

const STUDIO_PRESETS: Record<BusinessPresetKey, BusinessPreset> = {
  gastronomia: {
    label: "Restaurante / Burger",
    businessName: "La Maestranza Burger",
    category: "Gastronomía",
    brandColor: "#E04F16",
    brandBg: "from-[#23140D] via-[#3A1E12] to-[#1A110C]",
    catalogItem: {
      name: "Doble Smash Cheddar & Tocino",
      price: "$8.990",
      promo: "2 por $14.990 (Jueves y Viernes)",
      tag: "Sincronizado con Carta QR",
    },
    formats: {
      post: {
        headline: "Jueves de Doble Smash recién salida de la plancha",
        badge: "PROMO 2x $14.990",
        caption:
          "Pan brioche tostado en mantequilla, doble carne smash con costra crocante y cheddar fundido. Hoy jueves y mañana viernes te llevas 2 por $14.990 en salón o pidiendo directo por el link de nuestra carta. ¿Con quién vienes hoy?",
        scheduleSlot: "Jueves · 18:30 hrs",
        channels: ["Instagram Feed", "Facebook"],
        ctaPreview: "Ver en Carta QR →",
      },
      story: {
        headline: "¿Hambre a esta hora? Mira cómo sale de la plancha",
        badge: "HOY 2x $14.990",
        caption:
          "Secuencia de 3 historias lista: 1) Primer plano del queso fundido + sticker de encuesta, 2) Detalle de la promo 2x $14.990, 3) Link directo a tu Carta QR o WhatsApp.",
        scheduleSlot: "Viernes · 13:15 hrs",
        channels: ["Instagram Stories"],
        ctaPreview: "Pedir por WhatsApp",
      },
      reel: {
        headline: "Guion 25s: El sonido de la costra perfecta en la plancha",
        badge: "GUION REEL 9:16",
        caption:
          "[0-3s Hook visual]: Espátula aplastando la burger en plancha caliente. Texto: 'El error por el que las hamburguesas caseras quedan secas'. [4-18s]: Mostramos el sellado en 90 segundos y el doble cheddar. [19-25s CTA]: 'Hoy 2x $14.990 en La Maestranza. Link en el perfil'.",
        scheduleSlot: "Sábado · 19:00 hrs",
        channels: ["Instagram Reels", "TikTok"],
        ctaPreview: "Guardar guion en calendario",
      },
    },
  },
  comercio: {
    label: "Tienda / Retail",
    businessName: "Atelier Sur Calzado",
    category: "Comercio y Tiendas",
    brandColor: "#1D4ED8",
    brandBg: "from-[#0F172A] via-[#1E293B] to-[#0F172A]",
    catalogItem: {
      name: "Botín Chelsea Cuero Nobuck Impermeable",
      price: "$54.990",
      promo: "Envío gratis + 3 cuotas sin interés",
      tag: "Producto de Catálogo Central",
    },
    formats: {
      post: {
        headline: "Cuero chileno resistente al agua. Hecho para caminar todo el invierno.",
        badge: "ENVÍO GRATIS HOY",
        caption:
          "No necesitas cambiar de botines cada temporada. Nuestro modelo Chelsea en cuero nobuck tiene planta cosida antideslizante y forro térmico suave. Pídelo hoy a $54.990 con envío sin costo a todo Chile.",
        scheduleSlot: "Martes · 20:00 hrs",
        channels: ["Instagram Feed", "Facebook"],
        ctaPreview: "Reservar mi talla →",
      },
      story: {
        headline: "Últimos pares por talla: revisa si queda el tuyo",
        badge: "STOCK EN VIVO",
        caption:
          "Historia vertical lista para subir: muestra el detalle de la costura, tallas disponibles del 36 al 44 y botón directo a WhatsApp para asegurar despacho en 24 horas.",
        scheduleSlot: "Miércoles · 12:30 hrs",
        channels: ["Instagram Stories"],
        ctaPreview: "Consultar talla en WhatsApp",
      },
      reel: {
        headline: "Guion 30s: Prueba real de agua sobre cuero nobuck",
        badge: "GUION DEMOSTRACIÓN",
        caption:
          "[0-3s Hook]: Vaso de agua cayendo directo sobre el botín y escurriendo sin manchar. [4-20s]: Explicamos el tratamiento hidrofugado y mostramos cómo queda puesto con jeans. [21-30s CTA]: 'Despacho en 24h y cambios de talla sin costo. Escríbenos'.",
        scheduleSlot: "Domingo · 20:30 hrs",
        channels: ["Instagram Reels", "TikTok"],
        ctaPreview: "Programar publicación",
      },
    },
  },
  servicios: {
    label: "Clínica / Servicios",
    businessName: "Clínica Dental Aurora",
    category: "Salud y Servicios",
    brandColor: "#0F766E",
    brandBg: "from-[#062C28] via-[#0F4C45] to-[#082220]",
    catalogItem: {
      name: "Limpieza Ultrasónica + Evaluación con Radiografía",
      price: "$29.990",
      promo: "Precio preferencial reservando esta semana",
      tag: "Servicio de Catálogo Central",
    },
    formats: {
      post: {
        headline: "Tu limpieza dental completa en 40 minutos y sin dolor",
        badge: "PACK PREVENTIVO $29.990",
        caption:
          "Postergar el control anual siempre sale más caro después. Esta semana incluimos evaluación completa, radiografía bitewing y limpieza con ultrasonido por $29.990. Agenda tu hora directo por WhatsApp en menos de un minuto.",
        scheduleSlot: "Lunes · 19:00 hrs",
        channels: ["Instagram Feed", "LinkedIn"],
        ctaPreview: "Agendar hora →",
      },
      story: {
        headline: "3 cupos disponibles para mañana en la tarde",
        badge: "AGENDA ABIERTA",
        caption:
          "Historia enfocada en llenar horas libres de la semana: presenta al especialista, detalla qué incluye el pack de $29.990 y abre conversación directa para reservar.",
        scheduleSlot: "Miércoles · 10:00 hrs",
        channels: ["Instagram Stories"],
        ctaPreview: "Reservar cupo por WhatsApp",
      },
      reel: {
        headline: "Guion 25s: 3 señales de que necesitas limpieza aunque no te duela nada",
        badge: "GUION EDUCATIVO",
        caption:
          "[0-3s Hook]: 'Si al cepillarte ves sangrado leve, no es normal'. [4-18s]: Explicación cercana de cómo el sarro acumulado inflama la encía y cómo el ultrasonido lo retira sin dañar el esmalte. [19-25s CTA]: 'Pack preventivo a $29.990 esta semana'.",
        scheduleSlot: "Jueves · 20:00 hrs",
        channels: ["Instagram Reels", "TikTok"],
        ctaPreview: "Guardar en mi calendario",
      },
    },
  },
};

const FAQS = [
  {
    q: "¿Necesito contratar Carta QR o Fideliza para usar SocialPilot Marketing?",
    a: "No. SocialPilot Marketing funciona como un producto 100% independiente. Puedes contratar solo este módulo, cargar tus productos o servicios en tu catálogo y automatizar tus redes. Si más adelante decides sumar Carta QR o Fideliza, usarán los mismos productos que ya registraste.",
  },
  {
    q: "¿Las publicaciones parecen hechas por una plantilla repetida?",
    a: "Para nada. Al iniciar configuras la identidad visual de tu negocio: tu logo, tus colores, el tono en que hablas con tus clientes y las fotografías reales de tus productos o servicios. Nuestros agentes arman cada pieza respetando tu marca y redactan textos directos, sin frases robóticas.",
  },
  {
    q: "¿Cuánto tiempo me toma dejar lista la semana?",
    a: "La mayoría de nuestros clientes dedica unos 15 minutos los lunes. Eliges qué productos o promociones quieres destacar, revisas las piezas propuestas por nuestros agentes, ajustas cualquier detalle si quieres y dejas todo programado en el calendario.",
  },
  {
    q: "¿Puedo publicar rápido desde mi celular si saco una foto en el local?",
    a: "Sí. Puedes enviar una foto o instrucción al bot de WhatsApp de tu cuenta indicando qué quieres promocionar. Nuestros agentes preparan la imagen mejorada y el texto comercial para que lo apruebes desde tu mismo teléfono.",
  },
  {
    q: "¿Hay contratos de permanencia o cobros ocultos?",
    a: "Ninguno. Partes con 7 días de prueba gratis (incluye 5 publicaciones sin tarjeta de crédito). Luego eliges tu plan mensual o anual y puedes cambiar o cancelar cuando quieras desde tu panel.",
  },
];

export default function MarketingProductLandingPage() {
  const [selectedBiz, setSelectedBiz] = useState<BusinessPresetKey>("gastronomia");
  const [selectedFormat, setSelectedFormat] = useState<FormatPresetKey>("post");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const activePreset = STUDIO_PRESETS[selectedBiz];
  const activeFormat = activePreset.formats[selectedFormat];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#141413] selection:bg-[#E04F16]/15 selection:text-[#E04F16]">
      {/* 1. Institutional & Product Navigation */}
      <ProductEcosystemBar
        vertical="marketing"
        productBadge="Marketing"
        accentColorClass="text-[#C93B08]"
        accentBgClass="bg-[#E04F16]/10"
        accentBorderClass="border-[#E04F16]/30"
        ctaLabel="Probar 7 días gratis"
        ctaHref="/registro?plan=presencia"
        secondaryAction={{
          label: "Ver demo en vivo",
          href: "/demo-plan-mania",
        }}
        navItems={[
          { label: "El Problema", href: "#problema" },
          { label: "Estudio en Vivo", href: "#estudio" },
          { label: "Cómo Funciona", href: "#como-funciona" },
          { label: "Herramientas", href: "#herramientas" },
          { label: "Planes", href: "#planes" },
          { label: "Preguntas", href: "#faq" },
        ]}
      />

      <main>
        {/* 2. HERO SECTION: Editorial Split + Interactive Content Studio */}
        <section id="estudio" className="relative overflow-hidden border-b border-stone-200/90 pt-10 pb-20 lg:pt-16 lg:pb-28">
          {/* Subtle architectural grid lines */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e7e2da_1px,transparent_1px),linear-gradient(to_bottom,#e7e2da_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35"
          />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-10">
              {/* Left Column: Editorial Value Proposition */}
              <div className="lg:col-span-6 lg:pt-2 space-y-7">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-[#E04F16]" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-700">
                    Módulo Independiente · SocialPilot Marketing
                  </span>
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-stone-950 sm:text-5xl lg:text-[54px] lg:leading-[1.06]">
                  Tu negocio necesita crecer.{" "}
                  <span className="font-serif italic font-normal text-[#E04F16]">
                    No perder tardes enteras
                  </span>{" "}
                  creando publicaciones.
                </h1>

                <p className="max-w-xl text-base sm:text-lg leading-relaxed text-stone-600">
                  Transforma los productos y promociones de tu catálogo en imágenes comerciales, textos que venden y un calendario programado para todo el mes con el apoyo de nuestros agentes. Sin depender de agencias externas ni aprender programas de diseño.
                </p>

                {/* Primary & Secondary CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                  <Link
                    href="/registro?plan=presencia"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E04F16] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#E04F16]/25 hover:bg-[#C93B08] transition-all"
                  >
                    <span>Crear mis primeras 5 publicaciones gratis</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                  <Link
                    href="/demo-plan-mania"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-6 py-4 text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-all"
                  >
                    <span>Probar generador interactivo</span>
                  </Link>
                </div>

                {/* Concrete Operational Metrics */}
                <div className="grid grid-cols-3 gap-4 border-t border-stone-200/90 pt-6">
                  <div>
                    <p className="font-mono text-2xl font-bold text-stone-950">15 min</p>
                    <p className="mt-0.5 text-xs text-stone-600">Para dejar programada tu semana completa</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-stone-950">4 redes</p>
                    <p className="mt-0.5 text-xs text-stone-600">Instagram, Facebook, TikTok y LinkedIn</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-[#E04F16]">$29.990</p>
                    <p className="mt-0.5 text-xs text-stone-600">Plan mensual autónomo sin contratos</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Production Desk Mockup */}
              <div className="lg:col-span-6">
                <div className="rounded-3xl border border-stone-300/90 bg-white p-4 sm:p-6 shadow-[0_24px_60px_-15px_rgba(20,20,19,0.12)]">
                  {/* Studio Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#E04F16]" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-800">
                        Mesa de Producción en Vivo
                      </span>
                    </div>
                    <span className="rounded-md bg-stone-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-stone-600">
                      Haz clic para simular tu rubro
                    </span>
                  </div>

                  {/* Step 1 Selector: Choose Business Type */}
                  <div className="mt-4">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                      1. Elige un giro comercial:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(STUDIO_PRESETS) as BusinessPresetKey[]).map((key) => {
                        const item = STUDIO_PRESETS[key];
                        const active = selectedBiz === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedBiz(key)}
                            className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-all cursor-pointer ${
                              active
                                ? "border-stone-950 bg-stone-950 text-white shadow-xs"
                                : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Source Product Card (Pulled from Central Catalog) */}
                  <div className="mt-4 rounded-2xl border border-stone-200 bg-[#FAF8F5] p-3.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono font-bold uppercase tracking-wider text-stone-500">
                        2. Producto tomado de tu Catálogo Central:
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                        {activePreset.catalogItem.tag}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-stone-900">
                          {activePreset.catalogItem.name}
                        </p>
                        <p className="text-xs text-stone-600">
                          Promoción activa: <strong className="text-stone-800">{activePreset.catalogItem.promo}</strong>
                        </p>
                      </div>
                      <div className="shrink-0 rounded-xl bg-white border border-stone-200 px-3 py-1.5 font-mono text-sm font-bold text-stone-950">
                        {activePreset.catalogItem.price}
                      </div>
                    </div>
                  </div>

                  {/* Format Switcher */}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      3. Pieza generada por nuestros agentes:
                    </span>
                    <div className="inline-flex rounded-xl border border-stone-200 bg-stone-100 p-1">
                      {(
                        [
                          { id: "post", label: "Post Feed" },
                          { id: "story", label: "Stories 9:16" },
                          { id: "reel", label: "Guion Reel" },
                        ] as Array<{ id: FormatPresetKey; label: string }>
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSelectedFormat(tab.id)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                            selectedFormat === tab.id
                              ? "bg-white text-stone-950 shadow-2xs"
                              : "text-stone-600 hover:text-stone-900"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generated Visual & Copy Preview */}
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-12">
                    {/* Visual Mock Card */}
                    <div
                      className={`sm:col-span-5 rounded-2xl bg-gradient-to-br ${activePreset.brandBg} p-4 text-white flex flex-col justify-between min-h-[210px] border border-stone-900/10`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-white/75">
                          {activePreset.businessName}
                        </span>
                        <span className="rounded-full bg-white/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase">
                          {activeFormat.badge}
                        </span>
                      </div>

                      <div className="my-3 space-y-2">
                        <p className="text-base font-bold leading-snug text-white">
                          {activeFormat.headline}
                        </p>
                        <div className="inline-block rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-black text-stone-950">
                          {activePreset.catalogItem.price}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/15 pt-2.5 text-[11px] text-white/80">
                        <span>Identidad aplicada</span>
                        <span className="font-semibold text-white">{activeFormat.ctaPreview}</span>
                      </div>
                    </div>

                    {/* Copy & Calendar Slot */}
                    <div className="sm:col-span-7 flex flex-col justify-between rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1D4ED8]">
                            Texto comercial listo para publicar
                          </span>
                          <span className="font-mono text-[10px] text-stone-500">
                            Tono humano
                          </span>
                        </div>
                        <p className="text-xs sm:text-[13px] leading-relaxed text-stone-700">
                          “{activeFormat.caption}”
                        </p>
                      </div>

                      <div className="mt-4 border-t border-stone-200/80 pt-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="block font-mono text-[10px] uppercase text-stone-500">
                            Programación sugerida:
                          </span>
                          <span className="font-mono text-xs font-bold text-stone-900">
                            📅 {activeFormat.scheduleSlot}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {activeFormat.channels.map((ch) => (
                            <span
                              key={ch}
                              className="rounded-md bg-[#1D4ED8]/10 border border-[#1D4ED8]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#1D4ED8]"
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PROBLEMA Y CONTRASTE (Antes vs Después) */}
        <section id="problema" className="border-b border-stone-200 bg-[#F3EFEA] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#E04F16]">
                El verdadero cuello de botella
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
                Sabes que si no publicas, tu negocio desaparece. Pero hacerlo a mano te quita el día.
              </h2>
              <p className="mt-4 text-base text-stone-600 leading-relaxed">
                Entre atender clientes, controlar inventario y cerrar caja, sentarte a las 9 de la noche a pensar qué subir a Instagram es agotador. Y pagarle $350.000 mensuales a una agencia tradicional para que te pida las ideas a ti tampoco resuelve el problema.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Antes */}
              <div className="rounded-3xl border border-stone-300 bg-white/80 p-7 sm:p-8">
                <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
                    Sin SocialPilot Marketing
                  </span>
                  <span className="rounded-full bg-rose-100 px-3 py-1 font-mono text-xs font-bold text-rose-800">
                    6 a 8 horas perdidas por semana
                  </span>
                </div>
                <ul className="mt-6 space-y-4 text-sm text-stone-700">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-rose-600 font-bold">✕</span>
                    <span>
                      <strong>Improvisación diaria:</strong> Publicas solo cuando te queda un rato libre, dejando tu perfil inactivo durante semanas.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-rose-600 font-bold">✕</span>
                    <span>
                      <strong>Doble y triple digitación:</strong> Vuelves a escribir precios, descripciones y ofertas que ya tenías en tu catálogo o carta.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-rose-600 font-bold">✕</span>
                    <span>
                      <strong>Diseños sin identidad:</strong> Plantillas genéricas donde cada post tiene una tipografía y un color distinto.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-rose-600 font-bold">✕</span>
                    <span>
                      <strong>Agencias caras y lentas:</strong> Pagas entre $250.000 y $450.000 al mes con rondas eternas de corrección por cada cambio de precio.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Después */}
              <div className="rounded-3xl border-2 border-[#E04F16] bg-white p-7 sm:p-8 shadow-xl shadow-[#E04F16]/8">
                <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#E04F16]">
                    Con SocialPilot Marketing
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-mono text-xs font-bold text-emerald-800">
                    15 minutos cada lunes
                  </span>
                </div>
                <ul className="mt-6 space-y-4 text-sm text-stone-800">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-emerald-600 font-bold">✓</span>
                    <span>
                      <strong>Conectado a tu Catálogo Central:</strong> Seleccionas un producto o promoción ya registrada y nuestros agentes crean la gráfica y el texto al instante.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-emerald-600 font-bold">✓</span>
                    <span>
                      <strong>Tu identidad visual siempre firme:</strong> Tus colores, logo y estilo fotográfico se aplican de forma coherente en cada publicación.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-emerald-600 font-bold">✓</span>
                    <span>
                      <strong>Calendario mensual bajo tu control:</strong> Ves toda tu parrilla de Instagram, Facebook, TikTok y LinkedIn en una sola pantalla.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-emerald-600 font-bold">✓</span>
                    <span>
                      <strong>Autonomía total por $29.990/mes:</strong> Cambias una oferta en 10 segundos cuando tú quieras, sin pedirle permiso a nadie.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4. CÓMO FUNCIONA (Flujo en 3 etapas conectadas) */}
        <section id="como-funciona" className="border-b border-stone-200 bg-[#FAF8F5] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                  Flujo de trabajo simplificado
                </span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
                  De tu catálogo a las redes de tus clientes en tres pasos.
                </h2>
              </div>
              <Link
                href="/registro?plan=presencia"
                className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#E04F16] hover:underline"
              >
                <span>Configurar mi negocio ahora</span>
                <span>→</span>
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-3xl border border-stone-200 bg-white p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-stone-950 font-mono text-sm font-bold text-white">
                      01
                    </span>
                    <span className="font-mono text-xs text-stone-500">Una sola vez</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-stone-950">
                    Defines tu identidad y tu catálogo comercial
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-stone-600">
                    Subes tu logo, eliges tu paleta de colores y registras tus productos, servicios, precios y promociones. Si ya usas Carta QR o Fideliza, tus productos ya están cargados.
                  </p>
                </div>
                <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-3.5 font-mono text-xs text-stone-700">
                  ✓ Logo + Colores + Tono de marca<br />
                  ✓ Catálogo de productos y precios
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-3xl border border-stone-200 bg-white p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#E04F16] font-mono text-sm font-bold text-white">
                      02
                    </span>
                    <span className="font-mono text-xs text-[#E04F16] font-semibold">Producción asistida</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-stone-950">
                    Nuestros agentes crean las piezas y los textos
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-stone-600">
                    Con un clic (o enviando una foto por WhatsApp), nuestros agentes generan la imagen promocional, el copy persuasivo pensado para vender y los guiones para tus Reels o Stories.
                  </p>
                </div>
                <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-3.5 font-mono text-xs text-stone-700">
                  ✓ Diseño comercial con tus fotos<br />
                  ✓ Copy directo sin muletillas
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-3xl border border-stone-200 bg-white p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D4ED8] font-mono text-sm font-bold text-white">
                      03
                    </span>
                    <span className="font-mono text-xs text-[#1D4ED8] font-semibold">Piloto automático</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-stone-950">
                    Apruebas en el calendario y se publica a tiempo
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-stone-600">
                    Organizas tu semana o tu mes completo en el calendario visual. SocialPilot publica en los días y horarios de mayor impacto mientras tú estás atendiendo tu negocio.
                  </p>
                </div>
                <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-3.5 font-mono text-xs text-stone-700">
                  ✓ Publicación directa en Meta y redes<br />
                  ✓ Historial y control de cupos
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. HERRAMIENTAS DEL MÓDULO (Bento de Capacidades) */}
        <section id="herramientas" className="border-b border-stone-200 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
                Capacidades operativas incluidas
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
                Todo lo que necesitas para vender en redes desde un solo panel.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-3xl border border-stone-200 bg-[#FAF8F5] p-6">
                <span className="font-mono text-xs font-bold uppercase text-[#E04F16]">01 · Imagen Comercial</span>
                <h3 className="mt-2 text-lg font-bold text-stone-950">
                  Estudio gráfico para productos y ofertas
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  Toma una foto simple de tu plato o producto y transfórmala en un afiche publicitario limpio, con tu logo, precio y llamado a la acción listos para el feed o historias.
                </p>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#FAF8F5] p-6">
                <span className="font-mono text-xs font-bold uppercase text-[#1D4ED8]">02 · Calendario y Programación</span>
                <h3 className="mt-2 text-lg font-bold text-stone-950">
                  Planificación visual de todo tu mes
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  Visualiza qué saldrá cada día de la semana, alterna entre publicaciones de venta, contenido educativo y promociones, y deja programada la publicación automática.
                </p>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#FAF8F5] p-6">
                <span className="font-mono text-xs font-bold uppercase text-emerald-700">03 · Asistente en WhatsApp</span>
                <h3 className="mt-2 text-lg font-bold text-stone-950">
                  Publica desde el mostrador con un mensaje
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  ¿Llegó mercadería nueva o salió un plato especial del día? Manda la foto al bot de WhatsApp de SocialPilot y recibe la propuesta lista para aprobar en segundos.
                </p>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#FAF8F5] p-6">
                <span className="font-mono text-xs font-bold uppercase text-amber-700">04 · Guiones de Reels y Stories</span>
                <h3 className="mt-2 text-lg font-bold text-stone-950">
                  Estructura probada para video vertical
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  Si quieres grabar un Reel rápido y no sabes qué decir en los primeros 3 segundos, nuestros agentes te entregan el guion segundo a segundo con gancho, desarrollo y cierre comercial.
                </p>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#FAF8F5] p-6">
                <span className="font-mono text-xs font-bold uppercase text-purple-700">05 · Radar de Nicho Semanal</span>
                <h3 className="mt-2 text-lg font-bold text-stone-950">
                  Ideas frescas basadas en tu rubro
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  Detecta qué preguntas hacen los clientes de tu sector esta semana y conviértelas en publicaciones que posicionan a tu negocio como referente local.
                </p>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#FAF8F5] p-6">
                <span className="font-mono text-xs font-bold uppercase text-stone-800">06 · Catálogo Compartido</span>
                <h3 className="mt-2 text-lg font-bold text-stone-950">
                  Cero duplicación con Carta QR y Fideliza
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  Tus productos, precios y promociones viven en un solo lugar. Si cambias el valor de una promoción hoy, tus próximas piezas de Marketing toman el precio actualizado al instante.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. PLANES Y PRECIOS */}
        <section id="planes" className="border-b border-stone-200 bg-[#F3EFEA] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#E04F16]">
                Inversión clara y sin ataduras
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
                Contrata solo Marketing hoy, o activa el ecosistema completo.
              </h2>
              <p className="mt-3 text-base text-stone-600">
                Menos de lo que cuesta un almuerzo a la semana por tener tus redes trabajando todos los días.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
              {/* Plan Prueba */}
              <div className="rounded-3xl border border-stone-300 bg-white p-7 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs font-bold uppercase text-stone-500">
                    Para probar sin riesgo
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-stone-950">Prueba 7 Días</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-bold text-stone-950">$0</span>
                    <span className="text-xs text-stone-500">/ por 7 días</span>
                  </div>
                  <p className="mt-3 text-xs text-stone-600">
                    Configura tu marca, carga tus primeros productos y genera tus primeras 5 publicaciones reales sin ingresar tarjeta.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-xs text-stone-700">
                    <li>✓ 5 publicaciones completas con imagen y copy</li>
                    <li>✓ Configuración de identidad visual de tu negocio</li>
                    <li>✓ Acceso al Catálogo Central de productos</li>
                    <li>✓ Vista previa de Carta QR y Fideliza</li>
                  </ul>
                </div>
                <Link
                  href="/registro?plan=free"
                  className="mt-8 block w-full rounded-xl border border-stone-300 bg-stone-100 py-3.5 text-center text-xs font-bold text-stone-900 hover:bg-stone-200 transition-colors"
                >
                  Comenzar prueba gratis
                </Link>
              </div>

              {/* Plan Presencia (Marketing Standalone) */}
              <div className="rounded-3xl border-2 border-[#E04F16] bg-white p-7 flex flex-col justify-between shadow-xl shadow-[#E04F16]/10 relative">
                <div className="absolute -top-3.5 right-6 rounded-full bg-[#E04F16] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                  Recomendado · Solo Marketing
                </div>
                <div>
                  <span className="font-mono text-xs font-bold uppercase text-[#E04F16]">
                    SocialPilot Marketing Independiente
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-stone-950">Plan Presencia</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-bold text-stone-950">$29.990</span>
                    <span className="text-xs text-stone-500">CLP / mes</span>
                  </div>
                  <p className="mt-3 text-xs text-stone-600">
                    Ideal para negocios que quieren mantener sus redes activas, profesionales y vendedoras todo el mes sin contratar los demás módulos.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-xs text-stone-800 font-medium">
                    <li>✓ <strong>Módulo SocialPilot Marketing activo</strong></li>
                    <li>✓ Generación de imágenes comerciales y textos de venta</li>
                    <li>✓ Calendario editorial y programación automática</li>
                    <li>✓ Catálogo Central de productos y promociones</li>
                    <li>✓ Guiones para Reels y secuencias de Stories</li>
                    <li>✓ Publicación rápida asistida por WhatsApp</li>
                  </ul>
                </div>
                <Link
                  href="/registro?plan=presencia"
                  className="mt-8 block w-full rounded-xl bg-[#E04F16] py-3.5 text-center text-xs font-bold text-white hover:bg-[#C93B08] transition-colors shadow-md"
                >
                  Activar Plan Presencia →
                </Link>
              </div>

              {/* Plan Crecimiento (Ecosistema Completo) */}
              <div className="rounded-3xl border border-stone-300 bg-stone-950 text-white p-7 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs font-bold uppercase text-amber-400">
                    Los 3 Productos Conectados
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-white">Plan Crecimiento</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-bold text-white">$49.990</span>
                    <span className="text-xs text-stone-400">CLP / mes</span>
                  </div>
                  <p className="mt-3 text-xs text-stone-300">
                    Para comercios y restaurantes que quieren Marketing + Carta QR + Fideliza trabajando sobre el mismo catálogo.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-xs text-stone-200">
                    <li>✓ <strong>SocialPilot Marketing completo</strong> (mayor cupo mensual)</li>
                    <li>✓ <strong>SocialPilot Carta QR incluida</strong> para salón y delivery</li>
                    <li>✓ <strong>SocialPilot Fideliza incluido</strong> (puntos, sellos y caja)</li>
                    <li>✓ Radar de Nicho semanal y copias para anuncios</li>
                    <li>✓ Soporte prioritario por WhatsApp</li>
                  </ul>
                </div>
                <Link
                  href="/registro?plan=crecimiento"
                  className="mt-8 block w-full rounded-xl bg-white py-3.5 text-center text-xs font-bold text-stone-950 hover:bg-stone-200 transition-colors"
                >
                  Elegir Ecosistema Completo →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 7. PREGUNTAS FRECUENTES */}
        <section id="faq" className="bg-[#FAF8F5] py-20 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
                Respuestas claras
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">
                Preguntas frecuentes sobre SocialPilot Marketing
              </h2>
            </div>

            <div className="mt-10 space-y-3">
              {FAQS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={item.q}
                    className="rounded-2xl border border-stone-200 bg-white overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-bold text-stone-900 hover:bg-stone-50 cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <span className="font-mono text-lg text-[#E04F16]">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-stone-100 px-6 py-4 text-sm leading-relaxed text-stone-600">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Final CTA Card */}
            <div className="mt-16 rounded-3xl bg-stone-950 p-8 sm:p-12 text-center text-white">
              <h3 className="text-2xl sm:text-3xl font-bold">
                Recupera tus tardes y mantén tus redes vendiendo toda la semana.
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm text-stone-300">
                Crea tu cuenta en 2 minutos, carga tus primeros productos y prueba SocialPilot Marketing gratis por 7 días.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/registro?plan=presencia"
                  className="w-full sm:w-auto rounded-xl bg-[#E04F16] px-7 py-3.5 text-xs font-bold text-white hover:bg-[#C93B08] transition-colors"
                >
                  Empezar mis 7 días gratis →
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto rounded-xl border border-stone-700 bg-stone-900 px-7 py-3.5 text-xs font-semibold text-stone-200 hover:bg-stone-800 transition-colors"
                >
                  Ya tengo cuenta · Ir al panel
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ProductEcosystemFooter
        currentVertical="marketing"
        tagline="SocialPilot Marketing te devuelve el control de tus redes sociales: creas piezas desde tu catálogo y dejas el mes programado en minutos."
      />
    </div>
  );
}
