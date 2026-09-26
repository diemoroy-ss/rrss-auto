import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidad | Santisoft AI',
  description: 'Política de Privacidad y uso de datos para Santisoft AI.',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans py-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-indigo-600 font-bold hover:underline mb-8 inline-block">
          &larr; Volver al inicio
        </Link>
        <h1 className="text-4xl font-black mb-4">Política de Privacidad</h1>
        <p className="text-slate-500 mb-12">Última actualización: Agosto de 2026</p>

        <div className="prose prose-slate max-w-none">
          <p>
            En <strong>Santisoft AI</strong> (en adelante, "nosotros", "nuestro" o "la Plataforma"), operada bajo el dominio santisoft.cl, respetamos tu privacidad y estamos comprometidos con la protección de tus datos personales, en cumplimiento con la normativa legal vigente y en adecuación anticipada a los estándares de la <strong>Ley N° 21.719</strong> sobre Protección de Datos Personales de Chile y directrices internacionales de privacidad.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">1. Uso de Servicios de API de Terceros (Google, YouTube, Meta, X, TikTok)</h2>
          <p>
            Santisoft AI utiliza las APIs oficiales de diversas plataformas sociales para permitir la programación y publicación de contenido en tu nombre. 
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li className="mb-2">
              <strong>YouTube y Google APIs:</strong> Nuestra aplicación utiliza los <em>YouTube API Services</em> y <em>Google Business Profile APIs</em>. Al conectar tu cuenta de Google, aceptas quedar vinculado por los <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Términos de Servicio de YouTube</a> y la <a href="http://www.google.com/policies/privacy" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Política de Privacidad de Google</a>.
            </li>
            <li className="mb-2">
              <strong>Limitación de Uso (Google API):</strong> El uso y transferencia a cualquier otra aplicación de la información recibida de las APIs de Google por parte de Santisoft AI se adherirá a la <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Política de Datos de Usuario de los Servicios API de Google</a>, incluidos los requisitos de Uso Limitado.
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">2. ¿Qué datos recopilamos?</h2>
          <p>Recopilamos la siguiente información cuando te registras o conectas tus cuentas:</p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Información de perfil:</strong> Nombre, correo electrónico y foto de perfil proporcionados por tu cuenta de Google u otro proveedor de identidad.</li>
            <li><strong>Tokens de acceso (OAuth):</strong> Al conectar tus redes sociales, almacenamos de forma segura los tokens de acceso temporales para poder publicar contenido en tu nombre. <strong>No guardamos ni tenemos acceso a tus contraseñas de redes sociales.</strong></li>
            <li><strong>Contenido generado:</strong> Los textos, imágenes y piezas de video generadas por nuestros agentes para ser publicados en tus cuentas.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">3. ¿Cómo utilizamos tus datos?</h2>
          <p>Tus datos son utilizados exclusivamente para proveer el servicio de automatización de marketing:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Autenticar tu identidad y mantener tu sesión segura.</li>
            <li>Publicar contenido programado (texto, imágenes o video) en los canales sociales que hayas autorizado explícitamente (ej. subir un video a tu canal de YouTube o publicar en tu página de Facebook).</li>
            <li>Recopilar métricas de rendimiento (alcance, impresiones) de las publicaciones realizadas por la plataforma.</li>
          </ul>
          <p>
            <strong>Bajo ninguna circunstancia vendemos, alquilamos ni compartimos tus datos personales o tokens de acceso con terceros</strong>, salvo requerimiento legal expreso.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">4. Revocación de Acceso y Eliminación de Datos</h2>
          <p>
            Tienes el control total sobre tus datos. Puedes revocar el acceso de Santisoft AI a tus cuentas sociales en cualquier momento:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>
              <strong>Para Google / YouTube:</strong> Puedes revocar el acceso de Santisoft AI a tus datos de Google en cualquier momento visitando la página de configuración de seguridad de Google: <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">https://security.google.com/settings/security/permissions</a>. Al revocar el acceso, eliminaremos automáticamente tus tokens de nuestros servidores.
            </li>
            <li>
              <strong>Eliminación de cuenta:</strong> Puedes solicitar la eliminación completa de tu cuenta de Santisoft AI y todos los datos asociados escribiéndonos a <strong>privacidad@santisoft.cl</strong> o desde el panel de configuración de tu cuenta. Responderemos a tu solicitud en un plazo máximo de 72 horas.
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">5. Seguridad de los Datos</h2>
          <p>
            Toda la comunicación entre tu navegador, nuestros servidores y las APIs de terceros está encriptada mediante SSL/TLS. Los tokens de acceso OAuth se almacenan en una base de datos segura (Google Cloud Firestore) y se transmiten únicamente de forma encriptada a los proveedores correspondientes al momento de ejecutar una publicación.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">6. Contacto</h2>
          <p>
            Si tienes alguna duda o reclamo respecto a cómo tratamos tus datos o sobre esta Política de Privacidad, puedes contactarnos en:
            <br /><br />
            <strong>Privacidad y Datos:</strong> privacidad@santisoft.cl
            <br />
            <strong>Equipo de Soporte:</strong> soporte@santisoft.cl
          </p>
        </div>
      </div>
    </div>
  );
}
