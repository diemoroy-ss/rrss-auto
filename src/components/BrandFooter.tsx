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
                <Link href="/privacidad" className="footer-link">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="footer-link">
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
