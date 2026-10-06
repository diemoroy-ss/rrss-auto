"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

import LogoMark from "./LogoMark";
import ThemeToggle from "./ThemeToggle";

export default function BrandHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

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

  return (
    <nav className="brand-nav">
      <div className="wrap brand-nav-wrap">
        {/* Brand Lockup & Ecosystem Switcher */}
        <div className="brand-logo-container">
          <div className="brand-lockup">
            <a
              href="https://santisoft.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="brand-parent-link"
              title="Ir a Santisoft.cl"
            >
              <LogoMark size={22} />
              <span className="brand-parent-name">SANTISOFT</span>
            </a>

            <span className="brand-slash hidden sm:inline">/</span>

            <div className="brand-vertical-badge rrss-badge hidden sm:flex">
              <span className="rrss-dot"></span>
              <span className="vertical-name">REDES &amp; CONTENIDO</span>
            </div>
          </div>

          {/* Ecosystem Switcher Button */}
          <div className="ecosystem-switcher-wrapper" ref={switcherRef}>
            <button
              onClick={() => setSwitcherOpen((prev) => !prev)}
              className={`ecosystem-switcher-trigger ${switcherOpen ? "active" : ""}`}
              aria-label="Selector de Ecosistema Santisoft"
              aria-expanded={switcherOpen}
              title="Descubrir Ecosistema Santisoft"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="switcher-grid-icon"
              >
                <rect x="2" y="2" width="5" height="5" rx="1.5" fill="currentColor" />
                <rect x="9" y="2" width="5" height="5" rx="1.5" fill="currentColor" />
                <rect x="2" y="9" width="5" height="5" rx="1.5" fill="currentColor" />
                <rect x="9" y="9" width="5" height="5" rx="1.5" fill="currentColor" />
              </svg>
              <span className="switcher-label">Ecosistema</span>
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`switcher-chevron ${switcherOpen ? "rotate-180" : ""}`}
              >
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Ecosystem Popover */}
            {switcherOpen && (
              <div className="ecosystem-popover">
                <div className="popover-header">
                  <span className="popover-eyebrow">ECOSISTEMA SANTISOFT</span>
                  <span className="popover-sub">Soluciones Tecnológicas</span>
                </div>

                <div className="popover-divider" />

                <div className="popover-products">
                  {/* Current Active Product: Redes & Contenido */}
                  <div className="popover-product-item current rrss-current">
                    <div className="product-status-indicator active-rrss"></div>
                    <div className="product-info">
                      <div className="product-title-row">
                        <span className="product-name">Redes &amp; Contenido</span>
                        <span className="badge-active-rrss">Actual</span>
                      </div>
                      <span className="product-desc">Generación &amp; distribución de contenido inteligente</span>
                    </div>
                  </div>

                  {/* Sibling Product: Agentes IA */}
                  <a
                    href="https://agentes.santisoft.cl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="popover-product-item sibling-product-link"
                    onClick={() => setSwitcherOpen(false)}
                  >
                    <div className="product-status-indicator sibling-cyan"></div>
                    <div className="product-info">
                      <div className="product-title-row">
                        <span className="product-name">Agentes IA</span>
                        <span className="badge-sibling">Ver Vertical ↗</span>
                      </div>
                      <span className="product-desc">Automatización inteligente &amp; agentes para empresas</span>
                    </div>
                  </a>
                </div>

                <div className="popover-divider" />

                <a
                  href="https://santisoft.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="popover-footer-link"
                  onClick={() => setSwitcherOpen(false)}
                >
                  <span>Explorar Santisoft.cl</span>
                  <span className="external-arrow">↗</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="nav-links">
          <Link href="/como-funciona" className="ghost">
            Cómo Funciona
          </Link>

          <a href="#planes" className="ghost">
            Planes
          </a>
          
          <a
            href="https://santisoft.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="ghost santisoft-ecosystem-link"
            title="Ir al portal principal de Santisoft"
          >
            <span>SANTISOFT</span>
            <span className="nav-arrow">↗</span>
          </a>

          <Link href="/login" className="ghost">
            Acceso Cliente
          </Link>

          <ThemeToggle />

          <Link href="/registro" className="btn btn-primary btn-sm">
            Empezar Gratis
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="nav-mobile-controls">
          <ThemeToggle />

          <Link href="/registro" className="btn btn-primary btn-sm nav-mobile-cta">
            Empezar
          </Link>

          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="nav-hamburger"
            aria-label="Abrir menú"
            aria-expanded={mobileMenuOpen}
          >
            <span className={`nav-bar ${mobileMenuOpen ? "bar-open-1" : ""}`} />
            <span className={`nav-bar ${mobileMenuOpen ? "bar-open-2" : ""}`} />
            <span className={`nav-bar ${mobileMenuOpen ? "bar-open-3" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="nav-mobile-menu">
          <div className="mobile-brand-tag">
            <span className="mobile-ecosystem-label">PARTE DEL ECOSISTEMA SANTISOFT</span>
          </div>

          <Link
            href="/como-funciona"
            onClick={() => setMobileMenuOpen(false)}
            className="nav-mobile-item"
          >
            Cómo Funciona <span>→</span>
          </Link>

          <a
            href="#planes"
            onClick={() => setMobileMenuOpen(false)}
            className="nav-mobile-item"
          >
            Planes <span>↓</span>
          </a>

          <a
            href="https://agentes.santisoft.cl"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="nav-mobile-item"
          >
            <span>Agentes IA</span>
            <span className="nav-arrow">↗</span>
          </a>

          <a
            href="https://santisoft.cl"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="nav-mobile-item highlighted-santisoft"
          >
            <span>Explorar Santisoft</span>
            <span className="nav-arrow">↗</span>
          </a>

          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="nav-mobile-item"
          >
            Acceso Cliente <span>→</span>
          </Link>

          <Link
            href="/registro"
            onClick={() => setMobileMenuOpen(false)}
            className="btn btn-primary nav-mobile-cta-full"
          >
            Empezar Gratis 🚀
          </Link>

          {/* Social Links Mobile */}
          <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-700/30 mt-2">
            <a
              href="https://www.instagram.com/santisoftai/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:text-white flex items-center justify-center transition-all"
              title="Instagram @santisoftai"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://www.facebook.com/santisoft"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:text-white flex items-center justify-center transition-all"
              title="Facebook Santisoft"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.593 0 9 1.582 9 4.615V8z"/>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@Santisoftai"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:text-white flex items-center justify-center transition-all"
              title="YouTube @Santisoftai"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
