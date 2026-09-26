import type { Metadata } from "next";
import Image from "next/image";
import Link from 'next/link';
import DotCanvas from '../../components/DotCanvas';
import LogoMark from '../../components/LogoMark';

export const metadata: Metadata = {
  title: "Santisoft AI | Política de Privacidad",
  description: "Política de privacidad y cumplimiento regulatorio de datos de Santisoft AI. Conforme a la Ley N° 21.719 (modernización de la Ley N° 19.628 en Chile).",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
};

export default function Privacidad() {
  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen pb-20">
      <DotCanvas />
      
      {/* 1. PromoBanner */}
      <div className="promo">
        <span className="on-air"></span>
        CUMPLIMIENTO NORMATIVO · LEY DE PROTECCIÓN DE DATOS PERSONALES CHILE (LEY N° 21.719)
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
            <span className="eyebrow">Transparencia y Seguridad</span>
            <h2>Política de <em>Privacidad.</em></h2>
            <p className="sub" style={{ margin: '12px 0 0 0' }}>
              En Santisoft AI nos tomamos muy en serio tu privacidad. Esta política detalla el tratamiento de tus datos bajo la normativa legal vigente y en adecuación anticipada a los estándares de la <strong>Ley N° 21.719</strong> (que moderniza la Ley N° 19.628 de Chile).
            </p>
          </div>

          <div className="panel" style={{ padding: '40px 30px', background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: '16px' }}>
            <div className="fmono" style={{ fontSize: '12px', color: 'var(--ink-faint)', marginBottom: '30px', display: 'flex', gap: '15px' }}>
              <span>ÚLTIMA ACTUALIZACIÓN: AGOSTO 2026</span>
              <span>VERSIÓN: 2.2 (ADECUACIÓN LEY N° 21.719)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
              
              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  1. El Rol de Santisoft: Responsable y Encargado
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  De acuerdo con la nueva normativa de protección de datos en Chile:
                  <br />
                  • <strong>Responsable del Tratamiento:</strong> Santisoft AI actúa como Responsable respecto a los datos personales que recopilamos directamente de ti para crear tu cuenta de cliente, gestionar cobros y configurar tus preferencias.
                  <br />
                  • <strong>Encargado del Tratamiento:</strong> Actuamos como Encargados respecto a la información y bases de datos que tú conectas o el contenido de tu audiencia que fluye a través de nuestras integraciones de redes sociales, blogs o WhatsApp. Tú sigues siendo el Responsable y dueño exclusivo de esos datos.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  2. Base Legal del Tratamiento
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  Procesamos tus datos basados únicamente en las siguientes condiciones de licitud establecidas por la ley:
                  <br />
                  • <strong>Tu consentimiento explícito</strong> al conectar tus cuentas oficiales.
                  <br />
                  • <strong>Ejecución del contrato:</strong> Necesitamos procesar la información de tus redes sociales oficiales para programar, redactar mediante IA y ejecutar las publicaciones en piloto automático que has contratado.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  3. Datos Recopilados y Uso de APIs de Terceros
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6', marginBottom: '12px' }}>
                  Recopilamos únicamente la información mínima y necesaria para el funcionamiento de nuestras herramientas de automatización:
                </p>
                <ul style={{ listStyleType: 'circle', paddingLeft: '20px', fontSize: '14.5px', color: 'var(--ink-dim)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li><strong>Tokens de Acceso Cifrados:</strong> Credenciales temporales encriptadas (AES-256) para publicar en Meta (Facebook/Instagram), TikTok, Google Business Profile, YouTube Shorts y X (Twitter). Nunca almacenamos tus contraseñas en texto plano.</li>
                  <li>
                    <strong>Uso de YouTube API Services:</strong> Nuestra aplicación utiliza los servicios oficiales de la API de YouTube. Al conectar tu canal de YouTube en Santisoft, aceptas estar sujeto a los <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>Términos de Servicio de YouTube</a> y a la <a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>Política de Privacidad de Google</a>. Puedes revocar el acceso de Santisoft en cualquier momento desde la <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>Página de Configuración de Seguridad de Google</a>.
                  </li>
                  <li>
                    <strong>Cumplimiento de Uso Limitado (Google API):</strong> El uso y la transferencia a cualquier otra aplicación de la información recibida de las APIs de Google por parte de Santisoft AI se adherirá a la <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>Política de Datos de Usuario de los Servicios API de Google</a>, incluidos los requisitos de Uso Limitado (Limited Use).
                  </li>
                  <li>
                    <strong>Uso de Servicios de API de X (Twitter):</strong> Santisoft interactúa con la API v2 de X mediante OAuth 2.0 PKCE para programar y publicar tweets, hilos y contenido audiovisual en tu cuenta autorizada. No recopilamos datos personales de terceros ni mensajes privados de X.
                  </li>
                  <li><strong>Métricas de Rendimiento:</strong> Datos estadísticos sobre tus publicaciones y campañas de Meta Ads para graficar tus reportes en el panel.</li>
                  <li><strong>Datos de Inteligencia Artificial (IA):</strong> El procesamiento de guiones, copies e imágenes se realiza mediante la API privada de Google Gemini. Tus datos NO se utilizan para entrenar modelos públicos externos.</li>
                </ul>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  4. Transferencia Internacional y Seguridad
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  Nuestras bases de datos residen en servidores seguros de Google Cloud en Estados Unidos y Europa. Implementamos cifrado SSL/TLS de grado bancario para todas las comunicaciones y bases de datos. Conforme a la modernización de la Ley N° 19.628, los proveedores contratados cumplen con estándares internacionales de seguridad equivalentes a las exigencias de la Unión Europea (GDPR).
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  5. Derechos de los Titulares (ARCO-P)
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6', marginBottom: '12px' }}>
                  La Ley N° 21.719 te garantiza el pleno ejercicio de tus derechos fundamentales de protección de datos:
                </p>
                <ul style={{ listStyleType: 'square', paddingLeft: '20px', fontSize: '14.5px', color: 'var(--ink-dim)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li><strong>Acceso:</strong> Saber qué datos tuyos tenemos almacenados.</li>
                  <li><strong>Rectificación:</strong> Corregir información inexacta o desactualizada.</li>
                  <li><strong>Cancelación (Eliminación):</strong> Solicitar el borrado definitivo de tus datos de nuestros sistemas.</li>
                  <li><strong>Oposición:</strong> Negarte al tratamiento de tus datos para ciertos fines específicos.</li>
                  <li><strong>Portabilidad:</strong> Solicitar una copia de tus datos estructurados para transferirlos a otra entidad.</li>
                </ul>
                <p style={{ fontSize: '14.5px', color: 'var(--ink-dim)', marginTop: '12px' }}>
                  Puedes ejercer cualquiera de estos derechos directamente en tu configuración de perfil o enviando una solicitud formal a <strong style={{ color: 'var(--signal)' }}>legal@santisoft.cl</strong>. Responderemos a tu solicitud en el plazo legal establecido.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  6. Notificación de Brechas de Seguridad
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  En caso de cualquier incidente o brecha de seguridad que afecte la confidencialidad de tus datos, Santisoft AI notificará de inmediato a los usuarios afectados y a la **Agencia de Protección de Datos Personales** de Chile en un plazo no mayor a 72 horas desde que se detecte el suceso, detallando las medidas de mitigación adoptadas.
                </p>
              </section>

            </div>

            <footer style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid var(--line)' }}>
              <div style={{ background: 'var(--panel-2)', padding: '24px', borderRadius: '12px', border: '1px dashed var(--line-strong)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--ink)' }}>¿Deseas revocar tus consentimientos de inmediato?</p>
                  <p style={{ fontSize: '13px', color: 'var(--ink-dim)', marginTop: '4px' }}>Puedes solicitar la desconexión total y eliminación permanente de tu cuenta.</p>
                </div>
                <Link href="/eliminaciondatos" className="btn btn-primary btn-sm">Eliminar Datos</Link>
              </div>
            </footer>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '60px' }}>
        <div className="wrap">
          <div className="fmono">
            <span className="on-air"></span>
            © 2026 SANTISOFT AI · ADECUACIÓN LEY N° 21.719
          </div>
          <div className="flinks">
            <Link href="/terminos">Términos de Servicio</Link>
            <Link href="/privacidad">Política de Privacidad</Link>
            <span style={{ margin: '0 8px', color: 'var(--line-strong)' }}>|</span>
            <Link href="/en/privacy">🇬🇧 English</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
