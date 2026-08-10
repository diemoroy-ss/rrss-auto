"use client";

import { useState } from "react";
import Link from "next/link";
import LogoMark from "../../components/LogoMark";

export default function BrochurePage() {
  const [businessExpanded, setBusinessExpanded] = useState(false);
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --brand: #FF6B00;
          --brand-dark: #cc5200;
          --brand-light: #fff3eb;
          --ink: #0f0f0f;
          --ink-dim: #3a3a3a;
          --ink-faint: #7a7a7a;
          --surface: #ffffff;
          --surface-2: #f9f7f5;
          --surface-3: #f2ede8;
          --border: #e5e0da;
          --border-strong: #ccc5bc;
          --green: #0d9e5c;
          --red: #e53e3e;
        }

        body {
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--surface-2);
          color: var(--ink);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* ── PRINT BUTTON ── */
        .print-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          padding: 12px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .print-bar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 0.06em;
          color: var(--ink);
          text-decoration: none;
        }
        .print-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--brand);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
        }
        .print-btn:hover { background: var(--brand-dark); }
        .back-link {
          font-size: 13px;
          color: var(--ink-faint);
          text-decoration: none;
          font-weight: 500;
        }
        .back-link:hover { color: var(--brand); }

        /* ── BROCHURE SHELL ── */
        .brochure {
          max-width: 960px;
          margin: 80px auto 60px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 40px rgba(0,0,0,0.08);
        }

        /* ── HERO ── */
        .hero {
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1410 60%, #2a1800 100%);
          padding: 72px 64px 60px;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(255,107,0,0.18) 0%, transparent 70%);
          border-radius: 50%;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,107,0,0.15);
          border: 1px solid rgba(255,107,0,0.3);
          color: #FF6B00;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          padding: 5px 12px;
          border-radius: 100px;
          margin-bottom: 28px;
        }
        .hero-badge::before {
          content: '';
          width: 6px; height: 6px;
          background: #FF6B00;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .hero h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(36px, 5vw, 58px);
          font-weight: 900;
          color: #ffffff;
          line-height: 1.08;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
        }
        .hero h1 em {
          font-style: italic;
          color: #FF6B00;
        }
        .hero-sub {
          font-size: 17px;
          color: rgba(255,255,255,0.6);
          line-height: 1.6;
          max-width: 560px;
          font-weight: 400;
          margin-bottom: 40px;
        }
        .hero-networks {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .network-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.85);
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 100px;
        }
        .network-pill span { font-size: 15px; }

        /* ── SECTION ── */
        .section {
          padding: 56px 64px;
          border-bottom: 1px solid var(--border);
        }
        .section:last-child { border-bottom: none; }
        .section-alt { background: var(--surface-2); }

        .section-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: var(--brand);
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(26px, 3vw, 36px);
          font-weight: 700;
          color: var(--ink);
          line-height: 1.2;
          letter-spacing: -0.01em;
          margin-bottom: 8px;
        }
        .section-title em { font-style: italic; color: var(--brand); }
        .section-desc {
          font-size: 15px;
          color: var(--ink-faint);
          line-height: 1.65;
          max-width: 600px;
          margin-bottom: 36px;
        }

        /* ── PAIN POINTS ── */
        .pains {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }
        .pain {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 12px;
          padding: 16px 18px;
          font-size: 13.5px;
          font-weight: 500;
          color: #c53030;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          line-height: 1.45;
        }
        .pain::before { content: '✗'; font-weight: 900; flex-shrink: 0; margin-top: 1px; }

        /* ── MODULES GRID ── */
        .modules {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 18px;
        }
        .module {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 22px 20px;
          transition: border-color 0.15s;
        }
        .module-icon {
          font-size: 26px;
          margin-bottom: 10px;
          display: block;
        }
        .module h4 {
          font-size: 14px;
          font-weight: 800;
          color: var(--ink);
          margin-bottom: 6px;
        }
        .module p {
          font-size: 12.5px;
          color: var(--ink-faint);
          line-height: 1.55;
        }
        .module-new {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.1em;
          background: var(--brand);
          color: #fff;
          border-radius: 4px;
          padding: 2px 6px;
          margin-left: 6px;
          vertical-align: middle;
        }

        /* ── COMPARISON TABLE ── */
        .compare-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        .compare-table th {
          background: var(--ink);
          color: #fff;
          padding: 14px 18px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        .compare-table th:first-child { border-radius: 10px 0 0 0; }
        .compare-table th:last-child { border-radius: 0 10px 0 0; background: var(--brand); }
        .compare-table td {
          padding: 13px 18px;
          border-bottom: 1px solid var(--border);
          color: var(--ink-dim);
          vertical-align: middle;
        }
        .compare-table tr:last-child td { border-bottom: none; }
        .compare-table tr:nth-child(even) td { background: var(--surface-2); }
        .compare-table td:last-child {
          font-weight: 700;
          color: var(--brand);
        }
        .compare-table td.bad { color: var(--red); }
        .compare-table td.good { color: var(--green); font-weight: 700; }

        /* ── PLANS ── */
        .plans {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .plan {
          border: 1.5px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .plan-featured {
          border-color: var(--brand);
          box-shadow: 0 0 0 3px rgba(255,107,0,0.1);
        }
        .plan-header {
          padding: 20px 18px 16px;
          background: var(--surface);
        }
        .plan-featured .plan-header {
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
        }
        .plan-badge {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 6px;
        }
        .plan-featured .plan-badge { color: rgba(255,255,255,0.75); }
        .plan-name {
          font-size: 20px;
          font-weight: 900;
          color: var(--ink);
          margin-bottom: 14px;
        }
        .plan-featured .plan-name { color: #fff; }
        .plan-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 4px;
        }
        .plan-price-amount {
          font-size: 28px;
          font-weight: 900;
          color: var(--ink);
          line-height: 1;
        }
        .plan-featured .plan-price-amount { color: #fff; }
        .plan-price-currency {
          font-size: 13px;
          font-weight: 700;
          color: var(--ink-faint);
        }
        .plan-featured .plan-price-currency { color: rgba(255,255,255,0.75); }
        .plan-price-period {
          font-size: 11px;
          color: var(--ink-faint);
          margin-bottom: 2px;
        }
        .plan-featured .plan-price-period { color: rgba(255,255,255,0.7); }
        .plan-annual {
          font-size: 10px;
          color: var(--green);
          font-weight: 700;
        }
        .plan-featured .plan-annual { color: rgba(255,255,255,0.85); }
        .plan-body {
          padding: 16px 18px 20px;
          flex: 1;
          background: var(--surface);
        }
        .plan-divider {
          height: 1px;
          background: var(--border);
          margin: 0 0 14px;
        }
        .plan-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .plan-features li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          color: var(--ink-dim);
          line-height: 1.4;
        }
        .plan-features li::before {
          content: '✓';
          font-weight: 900;
          color: var(--green);
          flex-shrink: 0;
          font-size: 11px;
          margin-top: 1px;
        }
        .plan-features li.no::before {
          content: '—';
          color: var(--ink-faint);
          font-weight: 400;
        }
        .plan-features li.no { color: var(--ink-faint); }
        .plan-key-stat {
          background: var(--brand-light);
          border: 1px solid rgba(255,107,0,0.2);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 12px;
          text-align: center;
        }
        .plan-key-stat strong {
          display: block;
          font-size: 15px;
          font-weight: 900;
          color: var(--brand);
        }
        .plan-key-stat span {
          font-size: 10px;
          color: var(--ink-faint);
          font-weight: 600;
        }

        /* ── VIDEO COMPARISON ── */
        .video-compare {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .video-box {
          border: 1.5px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
        }
        .video-box-header {
          padding: 14px 18px;
          background: var(--surface-3);
          border-bottom: 1px solid var(--border);
          font-size: 13px;
          font-weight: 800;
          color: var(--ink-dim);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .video-box-header.premium {
          background: linear-gradient(135deg, var(--brand) 0%, #d45a00 100%);
          color: #fff;
        }
        .video-box-body {
          padding: 16px 18px;
        }
        .video-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          padding: 7px 0;
          border-bottom: 1px solid var(--border);
          color: var(--ink-dim);
        }
        .video-feature:last-child { border-bottom: none; }
        .vf-check { color: var(--green); font-weight: 900; font-size: 14px; flex-shrink: 0; }
        .vf-no { color: var(--ink-faint); font-size: 14px; flex-shrink: 0; }

        /* ── NETWORKS ── */
        .networks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }
        .network-card {
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 18px 14px;
          text-align: center;
          background: var(--surface);
        }
        .network-card-icon { font-size: 28px; margin-bottom: 8px; display: block; }
        .network-card-name { font-size: 13px; font-weight: 800; color: var(--ink); margin-bottom: 4px; }
        .network-card-desc { font-size: 11px; color: var(--ink-faint); line-height: 1.4; }
        .network-badge-all {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #e6f4ea;
          border: 1px solid #a8d5b5;
          color: var(--green);
          font-size: 12px;
          font-weight: 700;
          padding: 7px 16px;
          border-radius: 100px;
          margin-bottom: 28px;
        }

        /* ── TESTIMONIALS ── */
        .testimonials {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        .testimonial {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 22px 20px;
        }
        .testimonial-text {
          font-size: 13.5px;
          color: var(--ink-dim);
          line-height: 1.6;
          font-style: italic;
          margin-bottom: 14px;
        }
        .testimonial-text::before { content: '"'; color: var(--brand); font-size: 22px; font-style: normal; line-height: 0; vertical-align: -6px; margin-right: 2px; }
        .testimonial-author { font-size: 12px; font-weight: 700; color: var(--ink-faint); }

        /* ── CTA ── */
        .cta-section {
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1410 60%, #2a1800 100%);
          padding: 60px 64px;
          text-align: center;
        }
        .cta-section h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 38px;
          font-weight: 900;
          color: #fff;
          margin-bottom: 14px;
        }
        .cta-section h2 em { font-style: italic; color: var(--brand); }
        .cta-section p { font-size: 16px; color: rgba(255,255,255,0.55); margin-bottom: 36px; }
        .cta-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        .cta-step {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px 20px;
          min-width: 160px;
        }
        .cta-step-num {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: var(--brand);
          color: #fff;
          font-size: 13px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cta-step-text { font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.8); text-align: left; line-height: 1.3; }
        .cta-arrow { color: rgba(255,107,0,0.5); font-size: 20px; margin: 0 8px; }
        .cta-contacts {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          flex-wrap: wrap;
        }
        .cta-contact {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
        }
        .cta-contact a { color: var(--brand); text-decoration: none; }

        /* ── FOOTER ── */
        .brochure-footer {
          padding: 24px 64px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          background: var(--surface);
        }
        .footer-left { display: flex; align-items: center; gap: 10px; }
        .footer-left span { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; color: var(--ink-dim); }
        .footer-right { font-size: 11px; color: var(--ink-faint); line-height: 1.6; text-align: right; }

        /* ── PRINT STYLES ── */
        @media print {
          .print-bar { display: none !important; }
          body { background: white; }
          .brochure {
            margin: 0;
            border: none;
            border-radius: 0;
            box-shadow: none;
            max-width: 100%;
          }
          .hero { padding: 48px 48px 40px; }
          .section { padding: 36px 48px; }
          .cta-section { padding: 40px 48px; }
          .brochure-footer { padding: 16px 48px; }
          .plans { grid-template-columns: repeat(4, 1fr); }
          .modules { grid-template-columns: repeat(3, 1fr); }
          .pains { grid-template-columns: repeat(3, 1fr); }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>

      {/* ── PRINT BAR ── */}
      <div className="print-bar">
        <Link href="/" className="print-bar-logo">
          <LogoMark size={22} />
          SANTISOFT AI
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/automatizacion-rrss/panel" className="back-link">← Volver al Panel</Link>
          <button className="print-btn" onClick={handlePrint}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Exportar PDF
          </button>
        </div>
      </div>

      {/* ── BROCHURE ── */}
      <div className="brochure">

        {/* HERO */}
        <div className="hero">
          <div className="hero-badge">SANTISOFT AI · BROCHURE 2026</div>
          <h1>
            Tu Marketing Digital<br />
            en <em>Piloto Automático.</em>
          </h1>
          <p className="hero-sub">
            Publica todos los días en todas tus redes sociales con Inteligencia Artificial —
            sin contratar un community manager, sin perder horas de trabajo.
          </p>
          <div className="hero-networks">
            <div className="network-pill"><span>📘</span> Facebook</div>
            <div className="network-pill"><span>📸</span> Instagram</div>
            <div className="network-pill"><span>🎵</span> TikTok</div>
            <div className="network-pill"><span>▶</span> YouTube Shorts</div>
            <div className="network-pill"><span>𝕏</span> X (Twitter)</div>
            <div className="network-pill"><span>📍</span> Google Business</div>
          </div>
        </div>

        {/* PAIN POINTS */}
        <div className="section">
          <div className="section-label">El problema</div>
          <div className="section-title">¿Por qué tu negocio<br /><em>no está creciendo</em> en redes?</div>
          <div className="section-desc">La falta de consistencia es el principal motivo por el que los negocios no crecen en redes sociales. Santisoft AI lo resuelve.</div>
          <div className="pains">
            <div className="pain">No tienes tiempo de publicar todos los días</div>
            <div className="pain">Contratar un CM es costoso e impredecible</div>
            <div className="pain">No sabes qué publicar ni cuándo hacerlo</div>
            <div className="pain">Tus fotos no se ven profesionales</div>
            <div className="pain">No mides si tus posts están funcionando</div>
            <div className="pain">Tu competencia aparece primero en Google y en ChatGPT</div>
          </div>
        </div>

        {/* MÓDULOS */}
        <div className="section section-alt">
          <div className="section-label">La plataforma</div>
          <div className="section-title">Todo lo que necesitas<br />en un <em>solo panel.</em></div>
          <div className="section-desc">Desde la generación de ideas hasta la publicación automática, pasando por videos, análisis de mercado y publicidad pagada.</div>
          <div className="modules">
            <div className="module">
              <span className="module-icon">📅</span>
              <h4>Calendario de Posts</h4>
              <p>Dile a la IA de qué quieres hablar. Ella escribe, diseña y publica sola en el horario exacto.</p>
            </div>
            <div className="module">
              <span className="module-icon">🎬</span>
              <h4>Videos Reels con IA <span className="module-new">NUEVO</span></h4>
              <p>Videos verticales 9:16 con imágenes IA, subtítulos animados, voz en off y tu logo.</p>
            </div>
            <div className="module">
              <span className="module-icon">📡</span>
              <h4>Radar de Nicho <span className="module-new">NUEVO</span></h4>
              <p>Descubre tendencias, dolores y preguntas de tu audiencia. Inteligencia de mercado con IA.</p>
            </div>
            <div className="module">
              <span className="module-icon">🚀</span>
              <h4>Estrategia Mensual IA</h4>
              <p>Genera un plan completo de publicaciones para todo el mes con objetivos de negocio definidos.</p>
            </div>
            <div className="module">
              <span className="module-icon">📊</span>
              <h4>Estadísticas de Rendimiento</h4>
              <p>Mide el alcance, impresiones y engagement. Toma decisiones basadas en datos reales.</p>
            </div>
            <div className="module">
              <span className="module-icon">🎯</span>
              <h4>Meta Ads Integrado</h4>
              <p>Crea y gestiona campañas de publicidad en Facebook e Instagram directamente desde el panel.</p>
            </div>
            <div className="module">
              <span className="module-icon">🌐</span>
              <h4>Blog SEO/GEO Automático</h4>
              <p>Aparece en Google y en las respuestas de ChatGPT y Perplexity. Artículos publicados solos.</p>
            </div>
            <div className="module">
              <span className="module-icon">🖼️</span>
              <h4>Biblioteca de Medios</h4>
              <p>Todas tus imágenes y videos generados por IA, disponibles para reutilizar en cualquier momento.</p>
            </div>
            <div className="module">
              <span className="module-icon">✨</span>
              <h4>Prompts de Marca</h4>
              <p>Define el tono de voz, estilo y valores de tu negocio. La IA siempre escribirá como tu marca.</p>
            </div>
          </div>
        </div>

        {/* COMPARATIVA */}
        <div className="section">
          <div className="section-label">Comparativa</div>
          <div className="section-title">vs. <em>Community Manager</em> Tradicional</div>
          <div className="section-desc">Mismos resultados. Fracción del costo. Disponible 24/7 los 365 días del año.</div>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Característica</th>
                <th>CM Tradicional</th>
                <th>Santisoft AI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Costo mensual</strong></td>
                <td className="bad">$400.000 – $1.000.000 CLP</td>
                <td>Desde $34.990 CLP</td>
              </tr>
              <tr>
                <td><strong>Disponibilidad</strong></td>
                <td className="bad">Lunes a viernes, horario laboral</td>
                <td className="good">24/7, los 365 días</td>
              </tr>
              <tr>
                <td><strong>Redes que maneja</strong></td>
                <td className="bad">2–3 redes</td>
                <td className="good">6 redes simultáneas</td>
              </tr>
              <tr>
                <td><strong>Generación de video</strong></td>
                <td className="bad">Requiere equipo y presupuesto extra</td>
                <td className="good">Incluido en planes Pro y Business</td>
              </tr>
              <tr>
                <td><strong>Análisis de mercado</strong></td>
                <td className="bad">Manual y limitado</td>
                <td className="good">Automático con Radar de Nicho IA</td>
              </tr>
              <tr>
                <td><strong>Reportes</strong></td>
                <td className="bad">Semanal o mensual</td>
                <td className="good">En tiempo real desde el panel</td>
              </tr>
              <tr>
                <td><strong>Posicionamiento en IA (ChatGPT)</strong></td>
                <td className="bad">No disponible</td>
                <td className="good">Incluido en planes Pro y Business</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* VIDEO BÁSICO vs PREMIUM */}
        <div className="section section-alt">
          <div className="section-label">Generación de Video</div>
          <div className="section-title">Video Básico vs. <em>Video Premium</em></div>
          <div className="section-desc">Todos los planes tienen acceso a generación de video. La diferencia está en las capacidades.</div>
          <div className="video-compare">
            <div className="video-box">
              <div className="video-box-header">🎬 Video Básico — Free & Starter</div>
              <div className="video-box-body">
                <div className="video-feature"><span className="vf-check">✓</span> Imágenes IA animadas (Pollinations)</div>
                <div className="video-feature"><span className="vf-check">✓</span> Efecto cinemático Ken Burns</div>
                <div className="video-feature"><span className="vf-check">✓</span> Subtítulos animados</div>
                <div className="video-feature"><span className="vf-check">✓</span> Logo/Watermark corporativo</div>
                <div className="video-feature"><span className="vf-no">—</span> Guión inteligente con IA</div>
                <div className="video-feature"><span className="vf-no">—</span> Voz en off automática</div>
                <div className="video-feature"><span className="vf-no">—</span> Publicación programada automática</div>
              </div>
            </div>
            <div className="video-box">
              <div className="video-box-header premium">🎬 Video Premium — Pro & Business</div>
              <div className="video-box-body">
                <div className="video-feature"><span className="vf-check">✓</span> Imágenes IA animadas (Pollinations + Vertex AI)</div>
                <div className="video-feature"><span className="vf-check">✓</span> Efecto cinemático Ken Burns</div>
                <div className="video-feature"><span className="vf-check">✓</span> Subtítulos animados estilo Hormozi</div>
                <div className="video-feature"><span className="vf-check">✓</span> Logo/Watermark corporativo</div>
                <div className="video-feature"><span className="vf-check">✓</span> Guión inteligente con LangGraph IA</div>
                <div className="video-feature"><span className="vf-check">✓</span> Voz en off automática (ElevenLabs)</div>
                <div className="video-feature"><span className="vf-check">✓</span> Publicación programada automática</div>
              </div>
            </div>
          </div>
        </div>

        {/* PLANES */}
        <div className="section" id="planes">
          <div className="section-label">Precios</div>
          <div className="section-title">Planes para <em>cada etapa</em><br />de tu negocio.</div>
          <div className="network-badge-all">
            ✓ Todos los planes incluyen conexión a las 6 redes sociales disponibles
          </div>
          <div className="plans">

            {/* FREE — Prueba Gratuita */}
            <div className="plan">
              <div className="plan-header">
                <div className="plan-badge">PRUEBA GRATUITA</div>
                <div className="plan-name">Free</div>
                <div className="plan-price">
                  <span className="plan-price-amount">$0</span>
                </div>
                <div className="plan-price-period">por 10 días</div>
              </div>
              <div className="plan-body">
                <div className="plan-key-stat">
                  <strong>3 posts</strong>
                  <span>válidos por 10 días desde el registro</span>
                </div>
                <ul className="plan-features">
                  <li>Conecta todas las redes sociales</li>
                  <li>Video básico (imágenes IA)</li>
                  <li>Generación de textos IA</li>
                  <li>1 perfil de marca</li>
                  <li className="no">Video Premium</li>
                  <li className="no">Blog SEO/GEO</li>
                  <li className="no">Radar de Nicho</li>
                </ul>
                <p style={{fontSize:'11px',color:'var(--ink-faint)',marginTop:'12px',lineHeight:'1.5',borderTop:'1px solid var(--border)',paddingTop:'10px'}}>
                  Al vencer el período de prueba, pasa a un plan pago para continuar publicando.
                </p>
              </div>
            </div>

            {/* STARTER */}
            <div className="plan">
              <div className="plan-header">
                <div className="plan-badge">PEQUEÑO NEGOCIO</div>
                <div className="plan-name">Starter</div>
                <div className="plan-price">
                  <span className="plan-price-currency">$</span>
                  <span className="plan-price-amount">34.990</span>
                </div>
                <div className="plan-price-period">CLP / mes</div>
                <div className="plan-annual">Anual: $349.900 · Ahorras ~$70.000</div>
              </div>
              <div className="plan-body">
                <div className="plan-key-stat">
                  <strong>3 posts/semana</strong>
                  <span>~12 posts al mes</span>
                </div>
                <ul className="plan-features">
                  <li>Conecta todas las redes sociales</li>
                  <li>Video básico (imágenes IA)</li>
                  <li>Calendario de programación</li>
                  <li>Radar de Nicho</li>
                  <li>Estrategia IA mensual</li>
                  <li>1 perfil de marca</li>
                  <li className="no">Video Premium</li>
                  <li className="no">Blog SEO/GEO</li>
                </ul>
              </div>
            </div>

            {/* PRO — RECOMENDADO */}
            <div className="plan plan-featured">
              <div className="plan-header">
                <div className="plan-badge">⭐ MÁS ELEGIDO</div>
                <div className="plan-name">Pro</div>
                <div className="plan-price">
                  <span className="plan-price-currency" style={{color:'rgba(255,255,255,0.7)'}}>$</span>
                  <span className="plan-price-amount">69.990</span>
                </div>
                <div className="plan-price-period">CLP / mes</div>
                <div className="plan-annual">Anual: $699.900 · Ahorras ~$140.000</div>
              </div>
              <div className="plan-body">
                <div className="plan-key-stat">
                  <strong>5 posts/semana</strong>
                  <span>~20 posts al mes</span>
                </div>
                <ul className="plan-features">
                  <li>Conecta todas las redes sociales</li>
                  <li><strong>🎬 Video Premium</strong> · guión IA + voz en off</li>
                  <li>Blog SEO/GEO (Google + ChatGPT)</li>
                  <li>Meta Ads integrado</li>
                  <li>Radar de Nicho</li>
                  <li>Estrategia IA mensual</li>
                  <li>1 perfil de marca</li>
                </ul>
              </div>
            </div>

            {/* BUSINESS */}
            <div className="plan">
              <div className="plan-header">
                <div className="plan-badge">AGENCIAS &amp; EMPRESAS</div>
                <div className="plan-name">Business</div>
                <div className="plan-price">
                  <span style={{fontSize:'12px',fontWeight:700,color:'var(--ink-faint)'}}>desde&nbsp;</span>
                  <span className="plan-price-currency">$</span>
                  <span className="plan-price-amount">129.990</span>
                </div>
                <div className="plan-price-period">CLP / mes · 2 cuentas</div>
                <div className="plan-annual" style={{color:'var(--brand)',fontSize:'10.5px'}}>El precio baja mientras más cuentas agregues.</div>
              </div>
              <div className="plan-body">
                <div className="plan-key-stat">
                  <strong>Todo lo de Pro</strong>
                  <span>en múltiples perfiles independientes</span>
                </div>
                <ul className="plan-features">
                  <li>Conecta todas las redes por cuenta</li>
                  <li><strong>🎬 Video Premium</strong> por cuenta</li>
                  <li>Blog SEO/GEO por cuenta</li>
                  <li>Meta Ads por cuenta</li>
                  <li>Radar de Nicho</li>
                  <li><strong>⭐ Multi-cuenta independiente</strong></li>
                  <li>Soporte dedicado prioritario</li>
                </ul>

                {/* Tabla de precios expandible */}
                <button
                  onClick={() => setBusinessExpanded((v: boolean) => !v)}
                  style={{width:'100%',marginTop:'14px',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 12px',fontSize:'11.5px',fontWeight:700,color:'var(--ink-faint)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',fontFamily:'inherit'}}
                >
                  <span>Ver precios por cantidad de cuentas</span>
                  <span>{businessExpanded ? '▲' : '▼'}</span>
                </button>

                {businessExpanded && (
                  <table style={{width:'100%',borderCollapse:'collapse',marginTop:'10px',fontSize:'11.5px'}}>
                    <thead>
                      <tr style={{background:'var(--surface-3)'}}>
                        <th style={{padding:'7px 10px',textAlign:'left',fontWeight:700,color:'var(--ink-dim)',borderBottom:'1px solid var(--border)'}}>Cuentas</th>
                        <th style={{padding:'7px 10px',textAlign:'right',fontWeight:700,color:'var(--ink-dim)',borderBottom:'1px solid var(--border)'}}>Total/mes</th>
                        <th style={{padding:'7px 10px',textAlign:'right',fontWeight:700,color:'var(--ink-dim)',borderBottom:'1px solid var(--border)'}}>Por cuenta</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{padding:'6px 10px',borderBottom:'1px solid var(--border)',color:'var(--ink-dim)'}}>2 cuentas</td><td style={{padding:'6px 10px',borderBottom:'1px solid var(--border)',textAlign:'right',fontWeight:700}}>$129.990</td><td style={{padding:'6px 10px',borderBottom:'1px solid var(--border)',textAlign:'right',color:'var(--green)',fontWeight:700}}>~$64.995</td></tr>
                      <tr><td style={{padding:'6px 10px',borderBottom:'1px solid var(--border)',color:'var(--ink-dim)'}}>3 cuentas</td><td style={{padding:'6px 10px',borderBottom:'1px solid var(--border)',textAlign:'right',fontWeight:700}}>$179.990</td><td style={{padding:'6px 10px',borderBottom:'1px solid var(--border)',textAlign:'right',color:'var(--green)',fontWeight:700}}>~$59.997</td></tr>
                      <tr><td style={{padding:'6px 10px',borderBottom:'1px solid var(--border)',color:'var(--ink-dim)'}}>4 cuentas</td><td style={{padding:'6px 10px',borderBottom:'1px solid var(--border)',textAlign:'right',fontWeight:700}}>$219.990</td><td style={{padding:'6px 10px',borderBottom:'1px solid var(--border)',textAlign:'right',color:'var(--green)',fontWeight:700}}>~$54.998</td></tr>
                      <tr><td style={{padding:'6px 10px',color:'var(--ink-dim)'}}>5+ cuentas</td><td style={{padding:'6px 10px',textAlign:'right',fontWeight:700,color:'var(--brand)'}}>Cotización</td><td style={{padding:'6px 10px',textAlign:'right',fontWeight:700,color:'var(--brand)'}}>Hablemos</td></tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* TESTIMONIALS */}
        <div className="section section-alt">
          <div className="section-label">Clientes</div>
          <div className="section-title">Lo que dicen<br />nuestros <em>clientes.</em></div>
          <div className="testimonials">
            <div className="testimonial">
              <div className="testimonial-text">Antes me tomaba 3 horas crear el contenido de la semana. Ahora con Santisoft lo hago en 10 minutos y la calidad es mucho mejor.</div>
              <div className="testimonial-author">— Restaurante, Santiago</div>
            </div>
            <div className="testimonial">
              <div className="testimonial-text">Conecté mi cuenta y en la primera semana ya tenía posts todos los días sin hacer nada. Mis seguidores aumentaron un 40%.</div>
              <div className="testimonial-author">— Clínica Dental, Valparaíso</div>
            </div>
            <div className="testimonial">
              <div className="testimonial-text">El Radar de Nicho me ayudó a descubrir que mis clientes preguntaban cosas que yo nunca hubiera pensado publicar.</div>
              <div className="testimonial-author">— Consultoría RRHH, Chile</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section">
          <h2>¿Listo para poner tu<br />marketing en <em>piloto automático?</em></h2>
          <p>3 pasos. Sin tarjeta de crédito. En 5 minutos estás publicando.</p>
          <div className="cta-steps">
            <div className="cta-step">
              <div className="cta-step-num">1</div>
              <div className="cta-step-text">Crea tu cuenta<br />gratis</div>
            </div>
            <div className="cta-arrow">→</div>
            <div className="cta-step">
              <div className="cta-step-num">2</div>
              <div className="cta-step-text">Conecta tus<br />redes sociales</div>
            </div>
            <div className="cta-arrow">→</div>
            <div className="cta-step">
              <div className="cta-step-num">3</div>
              <div className="cta-step-text">La IA trabaja<br />por ti</div>
            </div>
          </div>
          <div className="cta-contacts">
            <div className="cta-contact">🌐 <a href="https://rrss.santisoft.cl">rrss.santisoft.cl</a></div>
            <div className="cta-contact">📧 <a href="mailto:contacto@santisoft.cl">contacto@santisoft.cl</a></div>
            <div className="cta-contact">📱 <a href="https://wa.me/56983656443">+56 9 8365 6443</a></div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="brochure-footer">
          <div className="footer-left">
            <LogoMark size={20} />
            <span>SANTISOFT AI · CHILE 2026</span>
          </div>
          <div className="footer-right">
            Cumplimiento Ley N° 21.719 · YouTube API Services · X API v2 · Meta Graph API<br />
            Precios en CLP. IVA incluido. Sujeto a cambios sin previo aviso.
          </div>
        </div>

      </div>
    </>
  );
}
