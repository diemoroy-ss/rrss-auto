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

          <Link href="/login" className="btn btn-primary btn-sm">
            Empezar Gratis
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="nav-mobile-controls">
          <ThemeToggle />

          <Link href="/login" className="btn btn-primary btn-sm nav-mobile-cta">
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
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="btn btn-primary nav-mobile-cta-full"
          >
            Empezar Gratis 🚀
          </Link>
        </div>
      )}
    </nav>
  );
}
