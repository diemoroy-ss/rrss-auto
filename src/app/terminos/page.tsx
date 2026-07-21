import type { Metadata } from "next";
import Image from "next/image";
import Link from 'next/link';
import DotCanvas from '../../components/DotCanvas';

export const metadata: Metadata = {
  title: "Santisoft AI | Términos de Servicio",
  description: "Términos de servicio y condiciones legales de uso de la plataforma Santisoft AI.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: "/favicon.png",
  },
};

export default function Terminos() {
  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen pb-20">
      <DotCanvas />
      
      {/* 1. PromoBanner */}
      <div className="promo">
        <span className="on-air"></span>
        CONDICIONES GENERALES · CONTRATACIÓN Y USO DE LA PLATAFORMA
      </div>

      {/* 2. Nav */}
      <nav>
        <div className="wrap">
          <Link href="/" className="logo">
            <img src="/favicon.png" alt="Logo" style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '6px' }} />
            SANTISOFT AI
          </Link>
          <div className="nav-links">
            <Link href="/" className="btn btn-ghost btn-sm">← Volver al Inicio</Link>
          </div>
        </div>
      </nav>

      {/* 3. Main Content Section */}
      <section style={{ borderTop: 'none', paddingTop: '60px' }}>
        <div className="wrap">
          <div className="section-head" style={{ maxWidth: '800px', marginBottom: '40px' }}>
            <span className="eyebrow">Marco Regulatorio</span>
            <h2>Términos de <em>Servicio.</em></h2>
            <p className="sub" style={{ margin: '12px 0 0 0' }}>
              Al registrarte y utilizar las herramientas de automatización de Santisoft AI, aceptas regirte por el siguiente conjunto de condiciones de servicio, responsabilidades y cargos financieros.
            </p>
          </div>

          <div className="panel" style={{ padding: '40px 30px', background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: '16px' }}>
            <div className="fmono" style={{ fontSize: '12px', color: 'var(--ink-faint)', marginBottom: '30px', display: 'flex', gap: '15px' }}>
              <span>ÚLTIMA ACTUALIZACIÓN: JULIO 2026</span>
              <span>VERSIÓN: 2.0 (ACTUALIZADO)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
              
              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  1. Aceptación de los Términos
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  Al crear una cuenta en <strong>Santisoft AI</strong> (la Aplicación), autorizas la gestión y publicación automática en tus redes sociales conectadas (Meta, TikTok y LinkedIn) y blogs oficiales. Las publicaciones se ejecutan bajo tu explícito control, y el servicio proporciona la infraestructura técnica de automatización conectando las APIs oficiales de cada plataforma.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  2. Responsabilidad de Contenidos y Publicidad
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6', marginBottom: '10px' }}>
                  • <strong>Publicaciones Orgánicas:</strong> El cliente es el único creador y responsable del material (imágenes, textos, ideas) generado e instruido a publicar en sus perfiles. Santisoft AI no supervisa la veracidad, derechos de autor o legalidad del contenido publicado.
                </p>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  • <strong>Publicidad de Pago (Meta Ads):</strong> Al utilizar el creador de campañas en Meta Ads integrado, autorizas el consumo de tu presupuesto directamente desde tu cuenta publicitaria de Meta. <strong>El usuario asume el 100% de la responsabilidad financiera y de facturación</strong>. Santisoft AI no procesa cobros de publicidad ni se responsabiliza por el rendimiento, rechazos de anuncios o bloqueos derivados de las políticas de publicidad de Meta.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  3. Planes de Suscripción y Reembolsos
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  Ofrecemos planes mensuales y anuales facturados por adelantado de forma automática a tu tarjeta de crédito o método de pago autorizado. Puedes cancelar tu suscripción en cualquier momento desde el panel de control. Al cancelar, mantendrás acceso hasta el final de tu ciclo de facturación en curso. Los montos ya cobrados no son reembolsables salvo en casos de fallos técnicos prolongados e irreparables imputables directamente a nuestra plataforma.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  4. Uso Exclusivo y Límites de la IA
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  El servicio de Inteligencia Artificial que potencia Santisoft AI genera sugerencias basadas en modelos de lenguaje avanzados. Aunque optimizamos las respuestas para maximizar conversiones y SEO, el cliente debe validar que el contenido cumple con la normativa de su negocio antes de publicarlo en piloto automático. No garantizamos resultados específicos de tráfico, clics o ventas comerciales derivadas directa o indirectamente del contenido generado.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  5. Disponibilidad y Suspensiones de Servicio
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  Santisoft AI se apoya en proveedores externos (como Google Cloud, APIs de Meta, TikTok, LinkedIn y Google Gemini). No nos responsabilizamos por interrupciones ocasionadas por caídas globales de estas APIs o mantenimientos imprevistos. Nos reservamos el derecho de suspender de forma inmediata cuentas de usuarios que utilicen nuestra plataforma para spam masivo, contenido de odio, o actividades ilegales que violen las políticas de comunidad de las redes sociales.
                </p>
              </section>

            </div>

            <footer style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-dim)' }}>
                ¿Tienes dudas o necesitas asistencia sobre los contratos? Escríbenos directamente a <strong style={{ color: 'var(--signal)' }}>legal@santisoft.cl</strong>
              </p>
            </footer>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '60px' }}>
        <div className="wrap">
          <div className="fmono">
            <span className="on-air"></span>
            © 2026 SANTISOFT AI · TÉRMINOS LEGALES DE OPERACIÓN
          </div>
          <div className="flinks">
            <Link href="/terminos">Términos de Servicio</Link>
            <Link href="/privacidad">Política de Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
