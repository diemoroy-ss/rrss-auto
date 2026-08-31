"use client";

import Link from "next/link";
import LogoMark from "./LogoMark";

export default function BrandFooter() {
  return (
    <footer className="brand-footer">
      <div className="wrap brand-footer-wrap">
        {/* Brand Info */}
        <div className="footer-brand-col">
          <div className="footer-logo-lockup">
            <a
              href="https://santisoft.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-parent-logo"
            >
              <LogoMark size={22} />
              <span>SANTISOFT</span>
            </a>
            <span className="footer-slash">/</span>
            <span className="footer-vertical-name rrss-text">REDES &amp; CONTENIDO</span>
          </div>

          <p className="footer-tagline">
            Automatización y generación de contenido para una presencia digital constante.
          </p>

          <div className="footer-ecosystem-badge rrss-badge-footer">
            <span className="rrss-dot-pulse"></span>
            <span>PARTE DEL ECOSISTEMA SANTISOFT</span>
          </div>

          {/* Iconos de Redes Sociales */}
          <div className="flex items-center gap-3 mt-4">
            <a
              href="https://www.instagram.com/santisoftai/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-gradient-to-tr hover:from-amber-500 hover:to-rose-500 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm group"
              title="Instagram @santisoftai"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            <a
              href="https://www.facebook.com/santisoft"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm group"
              title="Facebook Santisoft"
              aria-label="Facebook"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.593 0 9 1.582 9 4.615V8z"/>
              </svg>
            </a>

            <a
              href="https://www.youtube.com/@Santisoftai"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm group"
              title="YouTube @Santisoftai"
              aria-label="YouTube"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Links Grid */}
        <div className="footer-links-grid">
          <div className="footer-col">
            <h4 className="footer-col-title">PRODUCTOS</h4>
            <ul className="footer-link-list">
              <li>
                <a
                  href="https://agentes.santisoft.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-external-link"
                >
                  <span>Agentes IA</span>
                  <span className="footer-arrow">↗</span>
                </a>
              </li>
              <li>
                <a href="#hero" className="footer-link active-vertical">
                  Redes &amp; Contenido
                </a>
              </li>
              <li>
                <a
                  href="https://santisoft.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-external-link"
                >
                  <span>Santisoft</span>
                  <span className="footer-arrow">↗</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">SÍGUENOS</h4>
            <ul className="footer-link-list">
              <li>
                <a
                  href="https://www.instagram.com/santisoftai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-external-link"
                >
                  <span>Instagram</span>
                  <span className="footer-arrow">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/santisoft"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-external-link"
                >
                  <span>Facebook</span>
                  <span className="footer-arrow">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@Santisoftai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-external-link"
                >
                  <span>YouTube</span>
                  <span className="footer-arrow">↗</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">EXPLORAR</h4>
            <ul className="footer-link-list">
              <li>
                <a
                  href="https://santisoft.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-external-link"
                >
                  <span>Santisoft</span>
                  <span className="footer-arrow">↗</span>
                </a>
              </li>
              <li>
                <a href="#contacto" className="footer-link">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">LEGALES</h4>
            <ul className="footer-link-list">
              <li>
                <Link href="/es/privacidad" className="footer-link">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/es/terminos" className="footer-link">
                  Términos
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="wrap footer-bottom-wrap">
          <span className="footer-copy">
            <span className="status-live-dot-rrss"></span>
            © {new Date().getFullYear()} SANTISOFT. TODOS LOS DERECHOS RESERVADOS.
          </span>
          <span className="footer-architecture-tag">
            VERTICAL REDES &amp; CONTENIDO · SANTISOFT.CL
          </span>
        </div>
      </div>
    </footer>
  );
}
