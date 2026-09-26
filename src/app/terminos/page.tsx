import type { Metadata } from "next";
import Image from "next/image";
import Link from 'next/link';
import DotCanvas from '../../components/DotCanvas';
import LogoMark from '../../components/LogoMark';

export const metadata: Metadata = {
  title: "Santisoft AI | Términos de Servicio",
  description: "Términos de servicio y condiciones legales de uso de la plataforma Santisoft AI.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
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
            <LogoMark size={24} />
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
                  1. Aceptación de los Términos e Integración de Redes Sociales
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6', marginBottom: '10px' }}>
                  Al crear una cuenta en <strong>Santisoft AI</strong> (la Aplicación), autorizas la gestión y publicación automática en tus redes sociales conectadas (Meta Facebook/Instagram, TikTok, Google Business Profile, YouTube Shorts y X/Twitter) y blogs oficiales. Las publicaciones se ejecutan bajo tu explícito control mediante la infraestructura técnica de automatización que conecta las APIs oficiales de cada plataforma.
                </p>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  • <strong>Términos de YouTube:</strong> Al utilizar las funciones de publicación en YouTube Shorts, el usuario acepta de manera expresa estar vinculado a los <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>Términos de Servicio de YouTube</a> y a las normativas comunitarias de Google.
                  <br />
                  • <strong>Términos de X (Twitter):</strong> Las publicaciones en X se rigen bajo los Acuerdos y Políticas para Desarrolladores de X. El usuario se compromete a no utilizar la plataforma para la emisión de spam o contenido automatizado engañoso.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  2. Protección de Datos y Ley N° 21.719 de Chile
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  El tratamiento de datos personales en Santisoft AI se rige estrictamente por los principios de licitud, proporcionalidad, finalidad y seguridad establecidos en la normativa legal vigente y en adecuación anticipada a los estándares de la <strong>Ley N° 21.719 de Chile</strong>. Los usuarios conservan el control absoluto sobre sus datos y pueden solicitar el acceso, rectificación, supresión o portabilidad de su información en cualquier momento escribiendo a legal@santisoft.cl.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  3. Responsabilidad de Contenidos y Publicidad
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6', marginBottom: '10px' }}>
                  • <strong>Publicaciones Orgánicas:</strong> El cliente es el único creador y responsable del material (imágenes, textos, guiones, videos) generado e instruido a publicar en sus perfiles. Santisoft AI no supervisa la veracidad, derechos de autor o legalidad del contenido publicado.
                </p>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  • <strong>Publicidad de Pago (Meta Ads):</strong> Al utilizar el creador de campañas en Meta Ads integrado, autorizas el consumo de tu presupuesto directamente desde tu cuenta publicitaria de Meta. <strong>El usuario asume el 100% de la responsabilidad financiera y de facturación</strong>. Santisoft AI no procesa cobros de publicidad ni se responsabiliza por el rendimiento, rechazos de anuncios o bloqueos derivados de las políticas de publicidad de Meta.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  4. Planes de Suscripción y Reembolsos
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  Ofrecemos planes mensuales y anuales facturados por adelantado de forma automática a tu tarjeta de crédito o método de pago autorizado. Puedes cancelar tu suscripción en cualquier momento desde el panel de control. Al cancelar, mantendrás acceso hasta el final de tu ciclo de facturación en curso. Los montos ya cobrados no son reembolsables salvo en casos de fallos técnicos prolongados e irreparables imputables directamente a nuestra plataforma.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  5. Alcance de Contenidos, Video y Generación de Agentes
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  Nuestros agentes especializados asisten en la investigación, redacción persuasiva, diseño de imágenes y composición de videos para redes. En el ámbito audiovisual, cada entrega de video incluye guion estructurado, locución profesional con voces de alta fidelidad y composición de escenas/plantillas adaptadas para Reels, TikTok y Shorts según la cuota mensual del plan contratado. El cliente es responsable de validar que el contenido publicado cumpla con las normativas comerciales de su rubro antes de su difusión.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  6. Disponibilidad y Suspensiones de Servicio
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
            <span style={{ margin: '0 8px', color: 'var(--line-strong)' }}>|</span>
            <Link href="/en/terms">🇬🇧 English</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
