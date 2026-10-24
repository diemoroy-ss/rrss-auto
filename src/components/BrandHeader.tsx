"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { FaWhatsapp, FaArrowRight, FaTimes, FaBars } from "react-icons/fa";

import LogoMark from "./LogoMark";
import SocialPilotLogo from "./SocialPilotLogo";
import ThemeToggle from "./ThemeToggle";

const WA_URL =
  "https://wa.me/56934428848?text=Hola!%20Quiero%20informaci%C3%B3n%20sobre%20el%20servicio%20de%20Santisoft.";

export default function BrandHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close ecosystem switcher on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSwitcherOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Prevenir scroll en el fondo cuando el menú móvil está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="brand-nav sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Lockup (Logo Clean de SocialPilot by Santisoft) */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity"
            title="SocialPilot by Santisoft - Inicio"
          >
            <SocialPilotLogo height={38} width={166} priority />
          </Link>

          {/* Ecosystem Switcher Button (Desktop) */}
          <div className="hidden md:block relative" ref={switcherRef}>
            <button
              onClick={() => setSwitcherOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-850 hover:border-slate-700 text-slate-300 text-xs font-medium transition-all"
              aria-label="Selector de Ecosistema Santisoft"
              aria-expanded={switcherOpen}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-orange-400"
              >
                <rect x="2" y="2" width="5" height="5" rx="1.5" fill="currentColor" />
                <rect x="9" y="2" width="5" height="5" rx="1.5" fill="currentColor" />
                <rect x="2" y="9" width="5" height="5" rx="1.5" fill="currentColor" />
                <rect x="9" y="9" width="5" height="5" rx="1.5" fill="currentColor" />
              </svg>
              <span>Ecosistema</span>
              <svg
                width="8"
                height="5"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-200 ${switcherOpen ? "rotate-180" : ""}`}
              >
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Desktop Ecosystem Popover */}
            {switcherOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700/80 p-3 shadow-2xl z-50 space-y-2">
                <div className="px-2 py-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                    Ecosistema Santisoft
                  </span>
                  <p className="text-xs text-slate-400">Soluciones de software &amp; automatización</p>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="space-y-1">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>SocialPilot</span>
                      <span className="text-[9px] bg-orange-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                        Actual
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Publicación y piezas automáticas</p>
                  </div>

                  <a
                    href="https://agentes.santisoft.cl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2.5 rounded-xl hover:bg-slate-800/80 text-xs text-slate-300 transition-colors"
                    onClick={() => setSwitcherOpen(false)}
                  >
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>Agentes para Empresas</span>
                      <span className="text-cyan-400 text-xs">↗</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Automatización inteligente de operaciones</p>
                  </a>
                </div>

                <div className="h-px bg-slate-800" />

                <a
                  href="https://santisoft.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                  onClick={() => setSwitcherOpen(false)}
                >
                  <span>Explorar Santisoft.cl</span>
                  <span>↗</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/como-funciona"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Cómo Funciona
          </Link>

          <Link
            href="/biblioteca"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Biblioteca
          </Link>

          <Link
            href="/triptico"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Tríptico
          </Link>

          <a
            href="/#planes"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Planes
          </a>

          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Acceso Cliente
          </Link>

          <ThemeToggle />

          <Link
            href="/registro"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs tracking-wide shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5"
          >
            Empezar Gratis
          </Link>
        </div>

        {/* Mobile controls (Limpio y directo: ThemeToggle + Botón Hamburguesa) */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-200 hover:text-white active:scale-95 transition-all"
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileMenuOpen}
          >
            <FaBars className="text-base" />
          </button>
        </div>
      </div>

      {/* Mobile Menu en Pantalla Completa mediante Portal (inmune a cualquier z-index o stacking context) */}
      {mobileMenuOpen && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* Header del menú móvil */}
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950 shrink-0">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 text-white"
            >
              <LogoMark size={24} />
              <span className="font-black text-lg tracking-tight text-white font-sans">
                SANTISOFT
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white active:scale-95 transition-all"
                aria-label="Cerrar menú"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
          </div>

          {/* Contenido scrolleable del menú */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400 block px-2">
                Navegación
              </span>

              <Link
                href="/como-funciona"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-base border border-slate-800 transition-colors"
              >
                <span>Cómo Funciona</span>
                <FaArrowRight className="text-xs text-orange-400" />
              </Link>

              <Link
                href="/biblioteca"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-base border border-slate-800 transition-colors"
              >
                <span>Biblioteca de Estilos</span>
                <FaArrowRight className="text-xs text-orange-400" />
              </Link>

              <Link
                href="/triptico"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-base border border-slate-800 transition-colors"
              >
                <span>Tríptico / Pitch Rápido</span>
                <FaArrowRight className="text-xs text-orange-400" />
              </Link>

              <a
                href="/#planes"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-base border border-slate-800 transition-colors"
              >
                <span>Planes &amp; Precios</span>
                <FaArrowRight className="text-xs text-orange-400" />
              </a>

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-base border border-slate-800 transition-colors"
              >
                <span>Acceso Clientes</span>
                <FaArrowRight className="text-xs text-slate-400" />
              </Link>
            </div>

            {/* Acciones principales */}
            <div className="space-y-3 pt-1">
              <Link
                href="/registro"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-base text-center block shadow-xl shadow-orange-500/25 transition-all"
              >
                Empezar Gratis 🚀
              </Link>

              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <FaWhatsapp className="text-base" /> Hablar por WhatsApp
              </a>
            </div>

            {/* Ecosistema Santisoft */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-400 block px-2">
                Ecosistema Santisoft
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href="https://agentes.santisoft.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs font-semibold text-slate-200 hover:text-white"
                >
                  <span className="block text-cyan-400 font-bold text-sm">Agentes IA ↗</span>
                  <span className="text-[11px] text-slate-400">Automatización</span>
                </a>

                <a
                  href="https://santisoft.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs font-semibold text-slate-200 hover:text-white"
                >
                  <span className="block text-white font-bold text-sm">Santisoft.cl ↗</span>
                  <span className="text-[11px] text-slate-400">Plataforma Matriz</span>
                </a>
              </div>
            </div>

            <div className="pt-4 text-center text-xs text-slate-500">
              SocialPilot by Santisoft © {new Date().getFullYear()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
}
