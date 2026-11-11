"use client";

import { useState } from "react";
import Link from "next/link";
import ProductEcosystemBar from "../../components/landings/ProductEcosystemBar";
import ProductEcosystemFooter from "../../components/landings/ProductEcosystemFooter";

type MenuThemeKey = "bistro" | "nocturno" | "cafeteria";

const DEMO_MENU_URL = "/menu/AGdJLwdz0QNhBPcRp1FdWWMooAb2___default";

const MENU_THEMES: Record<
  MenuThemeKey,
  {
    name: string;
    bg: string;
    cardBg: string;
    text: string;
    muted: string;
    accent: string;
    badgeBg: string;
  }
> = {
  bistro: {
    name: "Bistró Cálido",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white border-stone-200",
    text: "text-stone-900",
    muted: "text-stone-500",
    accent: "bg-[#C2410C] text-white",
    badgeBg: "bg-amber-100 text-amber-900",
  },
  nocturno: {
    name: "Pizarra Restobar",
    bg: "bg-[#181512]",
    cardBg: "bg-[#24201C] border-stone-800",
    text: "text-stone-100",
    muted: "text-stone-400",
    accent: "bg-amber-500 text-stone-950",
    badgeBg: "bg-amber-500/20 text-amber-300",
  },
  cafeteria: {
    name: "Cafetería Botánica",
    bg: "bg-[#F4F7F4]",
    cardBg: "bg-white border-emerald-900/15",
    text: "text-stone-900",
    muted: "text-stone-500",
    accent: "bg-emerald-800 text-white",
    badgeBg: "bg-emerald-100 text-emerald-900",
  },
};

const FAQS_QR = [
  {
    q: "¿Puedo contratar solo la Carta QR sin contratar Marketing ni Fideliza?",
    a: "Sí, 100%. SocialPilot Carta QR es un producto independiente. Por $14.990 al mes tienes acceso completo a tu panel de administración para crear tu negocio, organizar categorías, subir productos con fotografía, cambiar precios, activar promociones y descargar tu código QR.",
  },
  {
    q: "Si cambio un precio o agrego un plato nuevo, ¿tengo que volver a imprimir los códigos QR de las mesas?",
    a: "Nunca. Tu código QR es dinámico y apunta siempre a tu carta actualizada. Cualquier cambio de precio, foto o promoción que hagas desde tu celular o computador se refleja en menos de un segundo en todos los códigos QR que ya tienes impresos.",
  },
  {
    q: "¿Qué pasa si más adelante quiero usar mis platos para publicar en Instagram o crear premios en Fideliza?",
    a: "Como tu Carta QR guarda tus platos en el Catálogo Central de SocialPilot, no tendrás que volver a subir fotos ni precios. Si algún día activas Marketing o Fideliza, todos tus productos ya estarán listos para usarse.",
  },
  {
    q: "¿Mis clientes tienen que descargar alguna aplicación para ver el menú?",
    a: "No. Apuntan con la cámara de su celular al código QR de la mesa y la carta se abre al instante en el navegador, optimizada para cargar rápido incluso con señal móvil débil.",
  },
  {
    q: "¿Puedo ocultar un plato cuando se acaba en la cocina a mitad del turno?",
    a: "Sí. Desde tu panel puedes cambiar el estado de cualquier producto en segundos para que no te pidan en mesa algo que ya se agotó, y volver a activarlo al día siguiente.",
  },
];

export default function CartaQrLandingPage() {
  // Interactive Kitchen-to-Table simulator state
  const [burgerPrice, setBurgerPrice] = useState<"$8.990" | "$7.990">("$8.990");
  const [happyHourActive, setHappyHourActive] = useState<boolean>(true);
  const [dessertAvailable, setDessertAvailable] = useState<boolean>(true);
  const [selectedTheme, setSelectedTheme] = useState<MenuThemeKey>("bistro");
  const [activeCategory, setActiveCategory] = useState<"todos" | "fuertes" | "postres">("todos");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const currentTheme = MENU_THEMES[selectedTheme];

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1C1917] selection:bg-[#C2410C]/15 selection:text-[#C2410C]">
      {/* 1. Institutional & Product Navigation */}
      <ProductEcosystemBar
        vertical="menu"
        productBadge="Carta QR"
        accentColorClass="text-[#9A3412]"
        accentBgClass="bg-[#C2410C]/10"
        accentBorderClass="border-[#C2410C]/30"
        ctaLabel="Crear mi Carta QR"
        ctaHref="/registro?plan=carta_qr"
        secondaryAction={{
          label: "Abrir carta demo real ↗",
          href: DEMO_MENU_URL,
        }}
        navItems={[
          { label: "Simulador en Vivo", href: "#simulador" },
          { label: "Por qué no usar PDF", href: "#por-que-no-pdf" },
          { label: "Independencia", href: "#independencia" },
          { label: "Rubros", href: "#rubros" },
          { label: "Planes", href: "#planes" },
          { label: "Preguntas", href: "#faq" },
        ]}
      />

      <main>
        {/* 2. HERO SECTION: Warm Hospitality + Live Kitchen-to-Table Controller */}
        <section id="simulador" className="relative border-b border-stone-200/90 pt-10 pb-20 lg:pt-14 lg:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Top Editorial Header */}
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-900/20 bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-950">
                <span className="h-2 w-2 rounded-full bg-[#15803D]" />
                <span>SocialPilot Carta QR · Para restaurantes, cafeterías y bares</span>
              </div>

              <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl lg:text-[56px] lg:leading-[1.05]">
                Tu carta digital siempre al día.{" "}
                <span className="italic text-[#C2410C]">
                  Sin volver a reimprimir un solo código QR.
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-stone-600">
                Reemplaza los PDFs lentos que nadie puede leer en el celular por una carta gastronómica interactiva. Cambia precios en 10 segundos, destaca tus promociones del día y administra tus platos con total autonomía.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Link
                  href="/registro?plan=carta_qr"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C2410C] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#C2410C]/20 hover:bg-[#9A3412] transition-all"
                >
                  <span>Crear mi Carta QR · $14.990/mes</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href={DEMO_MENU_URL}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-6 py-4 text-sm font-semibold text-stone-900 hover:bg-stone-100 transition-all"
                >
                  <span>Ver carta real en funcionamiento ↗</span>
                </Link>
              </div>
            </div>

            {/* Interactive Split Demo: Kitchen Control vs Diner Phone */}
            <div className="mt-12 rounded-[32px] border border-stone-300 bg-[#F3EDE2] p-5 sm:p-8 shadow-[0_24px_60px_-18px_rgba(28,25,23,0.12)]">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
                {/* Left: Restaurant Owner Quick Controls */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    <span>⚡ Prueba cómo controlas tu carta en vivo</span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-950">
                    Toca un ajuste aquí y mira cómo cambia al instante en la mesa de tu cliente.
                  </h2>

                  <p className="text-sm text-stone-600 leading-relaxed">
                    Cuando sube un insumo o se agota un postre un viernes a las 9 de la noche, no tienes que llamar a un diseñador. Lo ajustas tú mismo desde tu panel:
                  </p>

                  {/* Control 1: Price Toggle */}
                  <div className="rounded-2xl border border-stone-300/90 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="block font-mono text-[10px] font-bold uppercase text-stone-500">
                        Control 1 · Precio en vivo
                      </span>
                      <p className="text-sm font-bold text-stone-900">
                        Hamburguesa Bistró Trufada
                      </p>
                    </div>
                    <div className="inline-flex rounded-xl border border-stone-200 bg-stone-100 p-1">
                      {(["$8.990", "$7.990"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setBurgerPrice(p)}
                          className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-all cursor-pointer ${
                            burgerPrice === p
                              ? "bg-[#C2410C] text-white shadow-2xs"
                              : "text-stone-700 hover:text-stone-950"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Control 2: Promo Banner Toggle */}
                  <div className="rounded-2xl border border-stone-300/90 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="block font-mono text-[10px] font-bold uppercase text-stone-500">
                        Control 2 · Promoción destacada
                      </span>
                      <p className="text-sm font-bold text-stone-900">
                        Promo 2x $14.990 en mesa
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHappyHourActive((prev) => !prev)}
                      className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer ${
                        happyHourActive
                          ? "bg-emerald-700 text-white"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {happyHourActive ? "● PROMO ACTIVA" : "○ PROMO APAGADA"}
                    </button>
                  </div>

                  {/* Control 3: Kitchen Stock Toggle */}
                  <div className="rounded-2xl border border-stone-300/90 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="block font-mono text-[10px] font-bold uppercase text-stone-500">
                        Control 3 · Disponibilidad en cocina
                      </span>
                      <p className="text-sm font-bold text-stone-900">
                        Tiramisú de la Casa
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDessertAvailable((prev) => !prev)}
                      className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer ${
                        dessertAvailable
                          ? "bg-emerald-700 text-white"
                          : "bg-rose-700 text-white"
                      }`}
                    >
                      {dessertAvailable ? "✓ DISPONIBLE HOY" : "✕ AGOTADO EN COCINA"}
                    </button>
                  </div>

                  {/* Control 4: Visual Theme Selector */}
                  <div className="rounded-2xl border border-stone-300/90 bg-white p-4">
                    <span className="block font-mono text-[10px] font-bold uppercase text-stone-500 mb-2">
                      Control 4 · Estilo visual de tu carta
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(MENU_THEMES) as MenuThemeKey[]).map((tKey) => (
                        <button
                          key={tKey}
                          type="button"
                          onClick={() => setSelectedTheme(tKey)}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                            selectedTheme === tKey
                              ? "border-stone-950 bg-stone-950 text-white"
                              : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          {MENU_THEMES[tKey].name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Live Mobile Diner Preview */}
                <div className="lg:col-span-6 flex justify-center">
                  <div className="w-full max-w-[380px] rounded-[36px] border-[8px] border-stone-900 bg-stone-900 shadow-2xl overflow-hidden">
                    {/* Phone Top Bar */}
                    <div className="bg-stone-900 px-5 py-2 flex items-center justify-between text-[10px] font-mono text-stone-300">
                      <span>Mesa 04 · QR Escaneado</span>
                      <span className="text-emerald-400">● En vivo</span>
                    </div>

                    {/* Menu Content Area */}
                    <div className={`${currentTheme.bg} ${currentTheme.text} p-4 min-h-[460px] flex flex-col justify-between transition-colors duration-200`}>
                      <div>
                        {/* Restaurant Header */}
                        <div className="flex items-center justify-between border-b border-current/10 pb-3">
                          <div>
                            <p className="font-serif text-lg font-bold leading-tight">
                              Restaurante Manía
                            </p>
                            <p className={`text-[11px] ${currentTheme.muted}`}>
                              Cocina de autor & terraza · Abierto ahora
                            </p>
                          </div>
                          <span className={`rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold ${currentTheme.badgeBg}`}>
                            Carta Digital
                          </span>
                        </div>

                        {/* Promo Banner if Active */}
                        {happyHourActive && (
                          <div className="mt-3 rounded-2xl bg-gradient-to-r from-[#C2410C] to-amber-600 p-3 text-white shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                                🔥 Promoción del Día
                              </span>
                              <span className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                                2x $14.990
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-bold">
                              2 Hamburguesas Bistró Trufadas por $14.990
                            </p>
                          </div>
                        )}

                        {/* Category Pills */}
                        <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                          {(
                            [
                              { id: "todos", label: "Todo el menú" },
                              { id: "fuertes", label: "Platos fuertes" },
                              { id: "postres", label: "Postres" },
                            ] as const
                          ).map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setActiveCategory(cat.id)}
                              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                                activeCategory === cat.id
                                  ? currentTheme.accent
                                  : "bg-stone-500/10 opacity-75"
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>

                        {/* Dish Cards */}
                        <div className="mt-3 space-y-2.5">
                          {(activeCategory === "todos" || activeCategory === "fuertes") && (
                            <>
                              <div className={`rounded-2xl border p-3 ${currentTheme.cardBg}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs font-bold">
                                        Hamburguesa Bistró Trufada
                                      </p>
                                      {burgerPrice === "$7.990" && (
                                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-600">
                                          PRECIO HOY
                                        </span>
                                      )}
                                    </div>
                                    <p className={`mt-1 text-[11px] leading-snug ${currentTheme.muted}`}>
                                      Doble medallón 120g, queso gruyère fundido, mayo de trufa negra y papas rústicas.
                                    </p>
                                  </div>
                                  <span className="shrink-0 rounded-xl bg-stone-500/10 px-2.5 py-1 font-mono text-xs font-black">
                                    {burgerPrice}
                                  </span>
                                </div>
                              </div>

                              <div className={`rounded-2xl border p-3 ${currentTheme.cardBg}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-bold">
                                      Risotto de Setas Silvestres
                                    </p>
                                    <p className={`mt-1 text-[11px] leading-snug ${currentTheme.muted}`}>
                                      Arroz carnaroli cremoso al parmesano reggiano con mix de hongos salteados.
                                    </p>
                                  </div>
                                  <span className="shrink-0 rounded-xl bg-stone-500/10 px-2.5 py-1 font-mono text-xs font-black">
                                    $11.490
                                  </span>
                                </div>
                              </div>
                            </>
                          )}

                          {(activeCategory === "todos" || activeCategory === "postres") && (
                            <div
                              className={`rounded-2xl border p-3 transition-opacity ${currentTheme.cardBg} ${
                                !dessertAvailable ? "opacity-55" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold">Tiramisú de la Casa</p>
                                    {!dessertAvailable && (
                                      <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-rose-500">
                                        AGOTADO HOY
                                      </span>
                                    )}
                                  </div>
                                  <p className={`mt-1 text-[11px] leading-snug ${currentTheme.muted}`}>
                                    Mascarpone italiano, espresso doble y cacao amargo recién tamizado.
                                  </p>
                                </div>
                                <span className="shrink-0 rounded-xl bg-stone-500/10 px-2.5 py-1 font-mono text-xs font-black">
                                  $5.490
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Bar inside phone */}
                      <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between text-[11px]">
                        <span className={currentTheme.muted}>Actualizado al instante</span>
                        <Link
                          href={DEMO_MENU_URL}
                          className="font-bold underline"
                        >
                          Ver carta real completa ↗
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. EL PROBLEMA DEL PDF VS CARTA INTERACTIVA */}
        <section id="por-que-no-pdf" className="border-b border-stone-200 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C2410C]">
                Experiencia en mesa y rotación
              </span>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                Un PDF en Google Drive no es una carta digital. Es un freno para tus ventas.
              </h2>
              <p className="mt-4 text-base text-stone-600 leading-relaxed">
                Cuando tu cliente escanea un QR en la mesa y tiene que esperar que descargue un archivo pesado de 15 MB para después hacer zoom con dos dedos buscando el precio de una bebida, pide menos y tarda más.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-3xl border border-stone-200 bg-[#FBF9F4] p-7">
                <span className="font-mono text-xs font-bold uppercase text-rose-700">
                  El problema del PDF estático
                </span>
                <h3 className="mt-3 font-serif text-xl font-semibold text-stone-950">
                  Letra diminuta y precios desactualizados
                </h3>
                <p className="mt-2.5 text-sm text-stone-600 leading-relaxed">
                  Cada vez que ajustas precios tienes que pedirle al diseñador que exporte otro PDF, subirlo de nuevo y rezar para que el link del código QR no haya cambiado.
                </p>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#FBF9F4] p-7">
                <span className="font-mono text-xs font-bold uppercase text-[#C2410C]">
                  Lectura móvil nativa
                </span>
                <h3 className="mt-3 font-serif text-xl font-semibold text-stone-950">
                  Diseñada para el pulgar y el apetito
                </h3>
                <p className="mt-2.5 text-sm text-stone-600 leading-relaxed">
                  Fotografías nítidas por plato, pestañas por categoría (Entradas, Fondos, Coctelería, Postres), buscador instantáneo y precios claros sin pellizcar la pantalla.
                </p>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-[#FBF9F4] p-7">
                <span className="font-mono text-xs font-bold uppercase text-[#15803D]">
                  Ticket promedio más alto
                </span>
                <h3 className="mt-3 font-serif text-xl font-semibold text-stone-950">
                  Promociones visibles apenas abren el menú
                </h3>
                <p className="mt-2.5 text-sm text-stone-600 leading-relaxed">
                  Destaca el menú ejecutivo al mediodía o el 2x1 en coctelería a las 19:00 hrs en la parte superior de tu carta para orientar el pedido desde el primer segundo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. REQUISITO FUNDAMENTAL: INDEPENDENCIA + CATÁLOGO CENTRAL */}
        <section id="independencia" className="border-b border-stone-200 bg-[#F3EDE2] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-6 space-y-5">
                <span className="inline-block rounded-full bg-stone-900 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Arquitectura Modular SocialPilot
                </span>
                <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                  Contrata solo Carta QR. Y si mañana creces, tus platos ya están listos para tus redes.
                </h2>
                <p className="text-base text-stone-700 leading-relaxed">
                  No te obligamos a pagar por herramientas de marketing si hoy solo necesitas resolver la carta de tu local. Con el <strong>Plan Carta Digital ($14.990/mes)</strong> tienes tu propio panel completo para administrar tu restaurante.
                </p>
                <ul className="space-y-3 text-sm text-stone-800">
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-[#15803D]">✓</span>
                    <span>
                      <strong>Panel autónomo:</strong> Creas tus categorías gastronómicas, subes fotos, precios y promociones sin depender de otros módulos.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-[#15803D]">✓</span>
                    <span>
                      <strong>Generador de QR listo para mesa:</strong> Descargas tu código QR en alta resolución desde el primer día.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono font-bold text-[#15803D]">✓</span>
                    <span>
                      <strong>Cero doble trabajo a futuro:</strong> Si después decides activar SocialPilot Marketing o Fideliza, usarán los mismos platos y fotos que ya registraste.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-3xl border border-stone-300 bg-white p-6 sm:p-8 shadow-lg space-y-5">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                    <span className="font-mono text-xs font-bold uppercase text-stone-500">
                      Un solo registro · Tres usos posibles
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-0.5 font-mono text-[11px] font-bold text-amber-900">
                      Catálogo Central
                    </span>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-[#FBF9F4] p-4">
                    <p className="font-mono text-[10px] font-bold uppercase text-stone-500">
                      Plato registrado una sola vez en tu panel:
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <p className="text-base font-bold text-stone-950">
                        Tabla Parrillera para 2 · Promo $19.990
                      </p>
                      <span className="font-mono text-xs font-bold text-[#15803D]">Activo</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-2xl border-2 border-[#C2410C] bg-[#C2410C]/5 p-3.5">
                      <span className="font-mono text-[10px] font-bold uppercase text-[#C2410C]">
                        1. En tu Carta QR
                      </span>
                      <p className="mt-1 font-bold text-stone-900">Visible hoy en tus mesas</p>
                      <p className="mt-1 text-stone-600">Con foto, descripción, categoría y precio en vivo.</p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5">
                      <span className="font-mono text-[10px] font-bold uppercase text-stone-500">
                        2. En Marketing (Opcional)
                      </span>
                      <p className="mt-1 font-bold text-stone-900">Listo para publicar</p>
                      <p className="mt-1 text-stone-600">Se convierte en post o historia de Instagram en 1 clic.</p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5">
                      <span className="font-mono text-[10px] font-bold uppercase text-stone-500">
                        3. En Fideliza (Opcional)
                      </span>
                      <p className="mt-1 font-bold text-stone-900">Listo como premio</p>
                      <p className="mt-1 text-stone-600">Úsalo como recompensa para tus clientes frecuentes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. RUBROS GASTRONÓMICOS */}
        <section id="rubros" className="border-b border-stone-200 bg-[#FBF9F4] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C2410C]">
                Adaptado a tu formato de atención
              </span>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950 sm:text-4xl">
                Pensada para el ritmo real de la gastronomía.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-3xl border border-stone-200 bg-white p-7">
                <span className="font-mono text-xs font-bold uppercase text-[#C2410C]">
                  Restaurantes y Restobares
                </span>
                <h3 className="mt-2 font-serif text-xl font-semibold text-stone-950">
                  Rotación ágil en salón y terraza
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  Tus comensales revisan entradas, platos de fondo y carta de tragos apenas se sientan, sin esperar a que quede libre una carta física impresa.
                </p>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-7">
                <span className="font-mono text-xs font-bold uppercase text-amber-700">
                  Cafeterías, Pastelerías y Heladerías
                </span>
                <h3 className="mt-2 font-serif text-xl font-semibold text-stone-950">
                  Vitrina del día siempre fresca
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  Activa las tortas o sándwiches que salieron hoy del horno y oculta en un toque lo que se agotó en la tarde.
                </p>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-7">
                <span className="font-mono text-xs font-bold uppercase text-[#15803D]">
                  Locales con Retiro y Delivery
                </span>
                <h3 className="mt-2 font-serif text-xl font-semibold text-stone-950">
                  Link directo en tu bio y empaques
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  Comparte el enlace de tu carta por WhatsApp o Instagram para que tus clientes vean los precios actualizados antes de hacer su pedido.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. PLANES Y PRECIOS DE CARTA QR */}
        <section id="planes" className="border-b border-stone-200 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C2410C]">
                Precios claros sin comisiones por pedido
              </span>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950 sm:text-4xl">
                Elige solo tu Carta QR o suma el ecosistema completo.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 items-stretch">
              {/* Plan Carta Digital Independiente */}
              <div className="rounded-3xl border-2 border-[#C2410C] bg-[#FBF9F4] p-8 flex flex-col justify-between shadow-xl shadow-[#C2410C]/10 relative">
                <div className="absolute -top-3.5 left-6 rounded-full bg-[#C2410C] px-3.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                  Módulo Independiente · Más elegido en Gastronomía
                </div>
                <div>
                  <span className="font-mono text-xs font-bold uppercase text-[#C2410C]">
                    SocialPilot Carta QR
                  </span>
                  <h3 className="mt-2 font-serif text-2xl font-bold text-stone-950">
                    Plan Carta Digital
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-bold text-stone-950">$14.990</span>
                    <span className="text-xs text-stone-500">CLP / mes</span>
                  </div>
                  <p className="mt-3 text-xs text-stone-600 leading-relaxed">
                    Todo lo que necesitas para administrar y publicar la carta digital de tu restaurante, cafetería o bar sin contratar otros módulos.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs text-stone-800 font-medium">
                    <li>✓ <strong>Carta digital pública ilimitada en visitas</strong></li>
                    <li>✓ Panel de catálogo: categorías, platos, fotos y precios</li>
                    <li>✓ Promociones destacadas y cambios en tiempo real</li>
                    <li>✓ Generador y descarga de código QR de alta calidad</li>
                    <li>✓ 5 temas visuales adaptados para celulares</li>
                    <li>✓ Enlace directo a WhatsApp y redes de tu local</li>
                  </ul>
                </div>
                <div className="mt-8 space-y-2.5">
                  <Link
                    href="/registro?plan=carta_qr"
                    className="block w-full rounded-xl bg-[#C2410C] py-3.5 text-center text-xs font-bold text-white hover:bg-[#9A3412] transition-colors shadow-md"
                  >
                    Contratar solo Carta QR →
                  </Link>
                  <Link
                    href={DEMO_MENU_URL}
                    className="block w-full text-center text-xs font-semibold text-stone-600 hover:text-stone-950 py-1"
                  >
                    Ver carta de ejemplo en vivo ↗
                  </Link>
                </div>
              </div>

              {/* Plan Crecimiento (Restaurante Full) */}
              <div className="rounded-3xl border border-stone-300 bg-stone-950 text-white p-8 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs font-bold uppercase text-amber-400">
                    Carta QR + Marketing + Fideliza
                  </span>
                  <h3 className="mt-2 font-serif text-2xl font-bold text-white">
                    Plan Crecimiento Gastronómico
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-bold text-white">$49.990</span>
                    <span className="text-xs text-stone-400">CLP / mes</span>
                  </div>
                  <p className="mt-3 text-xs text-stone-300 leading-relaxed">
                    Usa los mismos platos de tu Carta QR para generar las publicaciones de tus redes sociales y premiar las visitas repetidas de tus comensales.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs text-stone-200">
                    <li>✓ <strong>Todo lo incluido en SocialPilot Carta QR</strong></li>
                    <li>✓ <strong>SocialPilot Marketing activo:</strong> posts y promociones desde tu menú</li>
                    <li>✓ <strong>SocialPilot Fideliza activo:</strong> tarjeta de sellos digitales para tus clientes</li>
                    <li>✓ Un solo catálogo conectado sin cargar platos dos veces</li>
                    <li>✓ Soporte prioritario en puesta en marcha</li>
                  </ul>
                </div>
                <Link
                  href="/registro?plan=crecimiento"
                  className="mt-8 block w-full rounded-xl bg-white py-3.5 text-center text-xs font-bold text-stone-950 hover:bg-stone-200 transition-colors"
                >
                  Activar los 3 módulos conectados →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 7. PREGUNTAS FRECUENTES */}
        <section id="faq" className="bg-[#FBF9F4] py-20 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
                Dudas frecuentes de locales gastronómicos
              </span>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">
                Todo claro antes de publicar tu carta
              </h2>
            </div>

            <div className="mt-10 space-y-3">
              {FAQS_QR.map((item, idx) => {
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
                      <span className="font-mono text-lg text-[#C2410C]">
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

            {/* Final CTA */}
            <div className="mt-16 rounded-3xl bg-[#1C1917] p-8 sm:p-12 text-center text-white">
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold">
                Publica hoy la carta digital de tu local y olvídate de los PDFs desactualizados.
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm text-stone-300">
                Crea tu cuenta, registra tus platos y descarga tu código QR listo para tus mesas en minutos.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/registro?plan=carta_qr"
                  className="w-full sm:w-auto rounded-xl bg-[#C2410C] px-7 py-3.5 text-xs font-bold text-white hover:bg-[#9A3412] transition-colors"
                >
                  Crear mi Carta QR ahora →
                </Link>
                <Link
                  href={DEMO_MENU_URL}
                  className="w-full sm:w-auto rounded-xl border border-stone-700 bg-stone-900 px-7 py-3.5 text-xs font-semibold text-stone-200 hover:bg-stone-800 transition-colors"
                >
                  Ver carta demo en vivo ↗
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ProductEcosystemFooter
        currentVertical="menu"
        tagline="SocialPilot Carta QR entrega autonomía total a restaurantes, cafeterías y bares para gestionar sus platos, precios y promociones en tiempo real."
      />
    </div>
  );
}
