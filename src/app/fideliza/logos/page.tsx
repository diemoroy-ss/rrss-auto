"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FaMoon, FaSun, FaCheck, FaDesktop, FaMobileAlt, FaPrint, FaArrowLeft } from "react-icons/fa";

export default function FidelizaLogosMockupPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [selectedLogo, setSelectedLogo] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"banner" | "caja" | "wallet" | "afiche">("banner");

  const logos = [
    {
      id: 1,
      name: "Opción 1: Cubo Recompensa VIP",
      concept: "Geometría isométrica 3D idéntica al Cubo de SocialPilot, transformado en cofre de premios con cinta dorada y estrella en el vértice.",
      highlight: "Máxima coherencia con la marca matriz SocialPilot.",
      svgDark: (
        <svg width="270" height="52" viewBox="0 0 270 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(2, 2)">
            <path d="M24 2L44 13.5L24 25L4 13.5L24 2Z" fill="url(#op1Top)" />
            <path d="M24 25L44 13.5V36.5L24 48V25Z" fill="url(#op1Right)" />
            <path d="M24 25L4 13.5V36.5L24 48V25Z" fill="url(#op1Left)" />
            <path d="M24 25V48" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.35" />
            <path d="M24 25L4 13.5" stroke="#FFFFFF" strokeWidth="1" opacity="0.2" />
            <path d="M24 25L44 13.5" stroke="#FFFFFF" strokeWidth="1" opacity="0.2" />
            {/* Cinta dorada en perspectiva */}
            <path d="M15 8.5L33 19" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" />
            <path d="M33 8.5L15 19" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" />
            <path d="M15 19V38" stroke="#FBBF24" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M33 19V38" stroke="#D97706" strokeWidth="2.8" strokeLinecap="round" />
            {/* Corona / Estrella VIP */}
            <circle cx="24" cy="13.5" r="4.5" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M24 10.5L25.2 13L27.8 13.3L25.9 15.1L26.4 17.7L24 16.4L21.6 17.7L22.1 15.1L20.2 13.3L22.8 13L24 10.5Z" fill="#F59E0B" />
          </g>
          <text x="56" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontSize="28" fontWeight="900" fill="#FFFFFF" letterSpacing="-0.5">
            Fide<tspan fill="#FF6B00">liza</tspan>
          </text>
          <text x="57" y="45" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="800" fill="#94A3B8" letterSpacing="2.6">
            BY SOCIAL<tspan fill="#FF6B00">PILOT</tspan>
          </text>
          <defs>
            <linearGradient id="op1Top" x1="4" y1="2" x2="44" y2="25" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF922B" /><stop offset="1" stopColor="#FFA94D" />
            </linearGradient>
            <linearGradient id="op1Right" x1="24" y1="13.5" x2="44" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D9480F" /><stop offset="1" stopColor="#9A3412" />
            </linearGradient>
            <linearGradient id="op1Left" x1="4" y1="13.5" x2="24" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6B00" /><stop offset="1" stopColor="#EA580C" />
            </linearGradient>
          </defs>
        </svg>
      ),
      svgLight: (
        <svg width="270" height="52" viewBox="0 0 270 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(2, 2)">
            <path d="M24 2L44 13.5L24 25L4 13.5L24 2Z" fill="url(#op1Top_l)" />
            <path d="M24 25L44 13.5V36.5L24 48V25Z" fill="url(#op1Right_l)" />
            <path d="M24 25L4 13.5V36.5L24 48V25Z" fill="url(#op1Left_l)" />
            <path d="M24 25V48" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.4" />
            <path d="M15 8.5L33 19" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" />
            <path d="M33 8.5L15 19" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" />
            <path d="M15 19V38" stroke="#FBBF24" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M33 19V38" stroke="#D97706" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="24" cy="13.5" r="4.5" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M24 10.5L25.2 13L27.8 13.3L25.9 15.1L26.4 17.7L24 16.4L21.6 17.7L22.1 15.1L20.2 13.3L22.8 13L24 10.5Z" fill="#F59E0B" />
          </g>
          <text x="56" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontSize="28" fontWeight="900" fill="#0F172A" letterSpacing="-0.5">
            Fide<tspan fill="#EA580C">liza</tspan>
          </text>
          <text x="57" y="45" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="800" fill="#64748B" letterSpacing="2.6">
            BY SOCIAL<tspan fill="#EA580C">PILOT</tspan>
          </text>
          <defs>
            <linearGradient id="op1Top_l" x1="4" y1="2" x2="44" y2="25" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF922B" /><stop offset="1" stopColor="#FFA94D" />
            </linearGradient>
            <linearGradient id="op1Right_l" x1="24" y1="13.5" x2="44" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D9480F" /><stop offset="1" stopColor="#9A3412" />
            </linearGradient>
            <linearGradient id="op1Left_l" x1="4" y1="13.5" x2="24" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6B00" /><stop offset="1" stopColor="#EA580C" />
            </linearGradient>
          </defs>
        </svg>
      ),
    },
    {
      id: 2,
      name: "Opción 2: Monograma F + Corazón de Lealtad",
      concept: "Trazos modernos redondeados estilo Fintech (Stripe / Nubank). La columna de la F se integra con un medio corazón que representa al cliente fiel.",
      highlight: "Cercano, humano y muy fácil de recordar.",
      svgDark: (
        <svg width="270" height="52" viewBox="0 0 270 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(4, 4)">
            <rect width="44" height="44" rx="14" fill="url(#op2Bg)" />
            <path d="M14 34V13C14 11.3 15.3 10 17 10H27C31.4 10 35 13.6 35 18C35 22.4 31.4 26 27 26H16" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 20H25" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" />
            <circle cx="28.5" cy="18" r="3" fill="#FDE047" />
          </g>
          <text x="58" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontSize="28" fontWeight="900" fill="#FFFFFF" letterSpacing="-0.5">
            Fide<tspan fill="#FF7849">liza</tspan>
          </text>
          <text x="59" y="45" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="800" fill="#94A3B8" letterSpacing="2.6">
            BY SOCIAL<tspan fill="#FF6B00">PILOT</tspan>
          </text>
          <defs>
            <linearGradient id="op2Bg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF5A36" /><stop offset="1" stopColor="#FF922B" />
            </linearGradient>
          </defs>
        </svg>
      ),
      svgLight: (
        <svg width="270" height="52" viewBox="0 0 270 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(4, 4)">
            <rect width="44" height="44" rx="14" fill="url(#op2Bg_l)" />
            <path d="M14 34V13C14 11.3 15.3 10 17 10H27C31.4 10 35 13.6 35 18C35 22.4 31.4 26 27 26H16" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 20H25" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" />
            <circle cx="28.5" cy="18" r="3" fill="#FDE047" />
          </g>
          <text x="58" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontSize="28" fontWeight="900" fill="#0F172A" letterSpacing="-0.5">
            Fide<tspan fill="#EA580C">liza</tspan>
          </text>
          <text x="59" y="45" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="800" fill="#64748B" letterSpacing="2.6">
            BY SOCIAL<tspan fill="#EA580C">PILOT</tspan>
          </text>
          <defs>
            <linearGradient id="op2Bg_l" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EA580C" /><stop offset="1" stopColor="#F97316" />
            </linearGradient>
          </defs>
        </svg>
      ),
    },
    {
      id: 3,
      name: "Opción 3: Tarjeta VIP / Smart Wallet",
      concept: "Dos tarjetas digitales estilizadas que evocan una billetera virtual (Apple Wallet) donde el cliente acumula visitas sin tarjetas físicas ni apps.",
      highlight: "Comunica de inmediato 'Club de Beneficios y Puntos'.",
      svgDark: (
        <svg width="270" height="52" viewBox="0 0 270 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(4, 4)">
            {/* Tarjeta trasera naranja */}
            <rect x="7" y="3" width="35" height="26" rx="6" fill="#EA580C" opacity="0.45" transform="rotate(7 7 3)" />
            {/* Tarjeta frontal negra con filo dorado */}
            <rect x="2" y="9" width="37" height="28" rx="7" fill="url(#op3Card)" stroke="#F59E0B" strokeWidth="1.4" />
            {/* Chip de fidelidad dorado */}
            <rect x="7" y="14" width="8" height="7" rx="2" fill="#FDE047" />
            {/* Letra F moderna */}
            <path d="M21 16H31M21 21H27M21 16V29" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            {/* Ondas NFC lealtad */}
            <path d="M32 23C33.5 24.5 33.5 26.5 32 28" stroke="#FDE047" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          <text x="58" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontSize="28" fontWeight="900" fill="#FFFFFF" letterSpacing="-0.5">
            Fide<tspan fill="#FF922B">liza</tspan>
          </text>
          <text x="59" y="45" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="800" fill="#94A3B8" letterSpacing="2.6">
            BY SOCIAL<tspan fill="#FF6B00">PILOT</tspan>
          </text>
          <defs>
            <linearGradient id="op3Card" x1="2" y1="9" x2="39" y2="37" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E293B" /><stop offset="1" stopColor="#0B1120" />
            </linearGradient>
          </defs>
        </svg>
      ),
      svgLight: (
        <svg width="270" height="52" viewBox="0 0 270 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(4, 4)">
            <rect x="7" y="3" width="35" height="26" rx="6" fill="#F97316" opacity="0.35" transform="rotate(7 7 3)" />
            <rect x="2" y="9" width="37" height="28" rx="7" fill="#FFFFFF" stroke="#EA580C" strokeWidth="1.8" />
            <rect x="7" y="14" width="8" height="7" rx="2" fill="#F59E0B" />
            <path d="M21 16H31M21 21H27M21 16V29" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M32 23C33.5 24.5 33.5 26.5 32 28" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          <text x="58" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontSize="28" fontWeight="900" fill="#0F172A" letterSpacing="-0.5">
            Fide<tspan fill="#EA580C">liza</tspan>
          </text>
          <text x="59" y="45" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="800" fill="#64748B" letterSpacing="2.6">
            BY SOCIAL<tspan fill="#EA580C">PILOT</tspan>
          </text>
        </svg>
      ),
    },
    {
      id: 4,
      name: "Opción 4: Eslabón Infinito Geométrico",
      concept: "Dos bucles limpios entrelazados que forman el símbolo de infinito (retención perpetua del cliente). Sin sellos ni pespuntes, puro trazo SaaS tecnológico.",
      highlight: "Elegante, minimalista y ultra escalable a cualquier tamaño.",
      svgDark: (
        <svg width="270" height="52" viewBox="0 0 270 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(4, 5)">
            <rect width="42" height="42" rx="13" fill="#0F172A" stroke="#334155" strokeWidth="1.2" />
            <path d="M14 26C11.5 26 9.5 23.8 9.5 21C9.5 18.2 11.5 16 14 16C17.5 16 20.5 26 24 26C27.5 26 30.5 16 34 16C36.5 16 38.5 18.2 38.5 21C38.5 23.8 36.5 26 34 26C30.5 26 27.5 16 24 16C20.5 16 17.5 26 14 26Z" stroke="url(#op4Loop)" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="21" r="3.2" fill="#FBBF24" />
          </g>
          <text x="58" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontSize="28" fontWeight="900" fill="#FFFFFF" letterSpacing="-0.5">
            Fide<tspan fill="url(#op4Text)">liza</tspan>
          </text>
          <text x="59" y="45" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="800" fill="#94A3B8" letterSpacing="2.6">
            BY SOCIAL<tspan fill="#FF6B00">PILOT</tspan>
          </text>
          <defs>
            <linearGradient id="op4Loop" x1="9.5" y1="16" x2="38.5" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6B00" /><stop offset="0.5" stopColor="#F59E0B" /><stop offset="1" stopColor="#FBBF24" />
            </linearGradient>
            <linearGradient id="op4Text" x1="110" y1="12" x2="160" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" /><stop offset="1" stopColor="#FF6B00" />
            </linearGradient>
          </defs>
        </svg>
      ),
      svgLight: (
        <svg width="270" height="52" viewBox="0 0 270 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(4, 5)">
            <rect width="42" height="42" rx="13" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
            <path d="M14 26C11.5 26 9.5 23.8 9.5 21C9.5 18.2 11.5 16 14 16C17.5 16 20.5 26 24 26C27.5 26 30.5 16 34 16C36.5 16 38.5 18.2 38.5 21C38.5 23.8 36.5 26 34 26C30.5 26 27.5 16 24 16C20.5 16 17.5 26 14 26Z" stroke="url(#op4Loop_l)" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="21" r="3.2" fill="#D97706" />
          </g>
          <text x="58" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontSize="28" fontWeight="900" fill="#0F172A" letterSpacing="-0.5">
            Fide<tspan fill="#EA580C">liza</tspan>
          </text>
          <text x="59" y="45" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="800" fill="#64748B" letterSpacing="2.6">
            BY SOCIAL<tspan fill="#EA580C">PILOT</tspan>
          </text>
          <defs>
            <linearGradient id="op4Loop_l" x1="9.5" y1="16" x2="38.5" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EA580C" /><stop offset="0.5" stopColor="#D97706" /><stop offset="1" stopColor="#B45309" />
            </linearGradient>
          </defs>
        </svg>
      ),
    },
  ];

  const current = logos.find((l) => l.id === selectedLogo) || logos[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/automatizacion-rrss/panel/fidelizacion"
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
                title="Volver"
              >
                <FaArrowLeft />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Maqueta Web de Logos · <span className="text-orange-500">Fideliza</span>
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Compara las 4 opciones en tiempo real sobre fondo oscuro, fondo claro y simulaciones en vivo de Caja y Afiche.
            </p>
          </div>

          {/* Switch Modo Claro / Oscuro */}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setTheme("dark")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                theme === "dark" ? "bg-slate-800 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              <FaMoon /> Modo Oscuro
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                theme === "light" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              <FaSun /> Modo Claro
            </button>
          </div>
        </div>

        {/* ── PARRILLA DE LAS 4 OPCIONES ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {logos.map((logo) => {
            const isSelected = selectedLogo === logo.id;
            return (
              <div
                key={logo.id}
                onClick={() => setSelectedLogo(logo.id)}
                className={`rounded-3xl p-6 transition-all cursor-pointer border-2 relative ${
                  isSelected
                    ? "border-orange-500 bg-slate-900 shadow-xl shadow-orange-500/10 scale-[1.01]"
                    : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                {/* Badge Seleccionado */}
                {isSelected && (
                  <span className="absolute top-4 right-4 bg-orange-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <FaCheck /> Activo en Maqueta
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-black text-lg text-white">{logo.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{logo.concept}</p>
                  </div>

                  {/* Visualización del Logo en el tema seleccionado */}
                  <div
                    className={`rounded-2xl p-6 flex items-center justify-center transition-colors border ${
                      theme === "dark"
                        ? "bg-[#0b0f19] border-slate-800/80"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {theme === "dark" ? logo.svgDark : logo.svgLight}
                  </div>

                  <p className="text-[11px] font-semibold text-orange-400">
                    💡 {logo.highlight}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── MAQUETAS EN VIVO DE APLICACIÓN REAL ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-400">
                Simulación en Escenarios Reales
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">
                Cómo se ve {current.name} en la App y en el Local
              </h2>
            </div>

            {/* Pestañas de Simulación */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab("caja")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  activeTab === "caja" ? "bg-orange-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                <FaDesktop /> Terminal Caja POS
              </button>
              <button
                onClick={() => setActiveTab("wallet")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  activeTab === "wallet" ? "bg-orange-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                <FaMobileAlt /> Wallet Móvil del Cliente
              </button>
              <button
                onClick={() => setActiveTab("afiche")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  activeTab === "afiche" ? "bg-orange-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                <FaPrint /> Cartel / Afiche Impreso
              </button>
            </div>
          </div>

          {/* ESCENARIO 1: TERMINAL CAJA POS */}
          {activeTab === "caja" && (
            <div className="max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
              <div className="flex justify-center">{current.svgDark}</div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Terminal de Caja · Local Centro
                </span>
                <p className="text-sm font-bold text-white">Escanea el código QR del cliente o ingresa su teléfono</p>
                <div className="h-10 bg-slate-950 rounded-xl border border-slate-700 flex items-center px-3 text-xs text-slate-500">
                  +56 9 8765 4321
                </div>
                <button className="w-full py-2.5 rounded-xl bg-orange-600 font-black text-xs text-white">
                  + Sumar Visita / Estampar Sello
                </button>
              </div>
            </div>
          )}

          {/* ESCENARIO 2: WALLET MÓVIL DEL CLIENTE */}
          {activeTab === "wallet" && (
            <div className="max-w-sm mx-auto bg-[#0a0f1d] border-4 border-slate-800 rounded-[40px] p-6 space-y-6 shadow-2xl text-center">
              <div className="w-16 h-1 bg-slate-800 rounded-full mx-auto" />
              <div className="flex justify-center scale-90">{current.svgDark}</div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-lg space-y-3 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">Tarjeta de Fidelidad</span>
                    <h3 className="text-lg font-black leading-tight">Café del Parque</h3>
                  </div>
                  <span className="text-2xl">☕</span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="aspect-square rounded-xl bg-white text-orange-600 font-black flex items-center justify-center text-sm shadow-xs">
                      ✓
                    </div>
                  ))}
                  <div className="aspect-square rounded-xl bg-white/30 border-2 border-dashed border-white text-white font-black flex items-center justify-center text-sm">
                    4
                  </div>
                </div>
                <p className="text-[11px] font-bold text-amber-100 pt-1">
                  ¡Te falta sólo 1 visita para canjear tu Café Gratis!
                </p>
              </div>
            </div>
          )}

          {/* ESCENARIO 3: AFICHE IMPRESO */}
          {activeTab === "afiche" && (
            <div className="max-w-md mx-auto bg-white text-slate-900 rounded-3xl p-8 border border-slate-200 shadow-2xl text-center space-y-5">
              <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-black uppercase tracking-wider">
                Mostrador / Mesas
              </span>
              <h2 className="text-2xl font-black">¡Únete a nuestro Club VIP!</h2>
              <p className="text-sm text-slate-600 font-medium">Acumula 4 visitas y gana 1 Almuerzo Gratis</p>
              <div className="w-48 h-48 mx-auto bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-xs font-bold text-slate-400">
                [ CÓDIGO QR ]
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-center">
                {current.svgLight}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
