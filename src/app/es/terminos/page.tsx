import Link from 'next/link';

export const metadata = {
  title: 'Términos de Servicio | SocialPilot by Santisoft',
  description: 'Términos y condiciones de uso de la plataforma SocialPilot by Santisoft.',
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans py-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-indigo-600 font-bold hover:underline mb-8 inline-block">
          &larr; Volver al inicio
        </Link>
        <h1 className="text-4xl font-black mb-4">Condiciones del Servicio</h1>
        <p className="text-slate-500 mb-12">Última actualización: Agosto de 2026</p>

        <div className="prose prose-slate max-w-none">
          <p>
            Bienvenido a <strong>SocialPilot by Santisoft</strong> (en adelante, la "Plataforma"), accesible a través del dominio santisoft.cl y sus subdominios. Al acceder, registrarte o utilizar nuestros servicios de automatización de marketing y redes sociales, aceptas estar legalmente vinculado a las presentes Condiciones del Servicio (en adelante, los "Términos"). Si no estás de acuerdo con estos Términos, no debes utilizar nuestra Plataforma.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">1. Descripción del Servicio</h2>
          <p>
            SocialPilot by Santisoft es una herramienta de software como servicio (SaaS) que permite a los usuarios conectar sus cuentas de redes sociales (Facebook, Instagram, X, TikTok, YouTube, Google Business, entre otras) para generar, programar y publicar contenido de forma automatizada mediante nuestros agentes especializados.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">2. Uso Aceptable e Integración con Terceros</h2>
          <p>
            Para brindar nuestro servicio, la Plataforma se conecta con APIs de terceros. Como usuario, te comprometes a:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>Cumplir con los términos, políticas y lineamientos de cada red social que conectes (ej. Meta, Google, X).</li>
            <li>No utilizar la plataforma para generar o distribuir contenido ilegal, ofensivo, que incite al odio, spam, desinformación o que viole derechos de propiedad intelectual de terceros.</li>
            <li>Entender que Santisoft AI no es responsable si una red social de terceros restringe, suspende o cancela tu cuenta debido a infracciones a sus políticas.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">3. Cuentas, Suscripciones y Pagos</h2>
          <p>
            El uso de la Plataforma requiere la creación de una cuenta y la selección de un plan de suscripción (Free, Starter, Pro, Business).
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li><strong>Prueba Gratuita:</strong> El plan Free tiene una vigencia limitada (ej. 10 días). Al finalizar, deberás contratar un plan pago para continuar publicando.</li>
            <li><strong>Renovación:</strong> Los planes se facturan por adelantado en ciclos mensuales o anuales y se renuevan automáticamente, salvo que canceles antes de la fecha de corte.</li>
            <li><strong>Cancelación:</strong> No exigimos contratos de permanencia. Puedes cancelar tu suscripción en cualquier momento desde tu panel. La cancelación detendrá la facturación del siguiente ciclo, pero no otorga reembolsos por el tiempo no utilizado del ciclo actual.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">4. Disponibilidad del Servicio</h2>
          <p>
            Nos esforzamos por mantener la Plataforma operativa 24/7. Sin embargo, no garantizamos que el servicio estará libre de interrupciones o errores. La publicación en redes sociales depende de la disponibilidad de las APIs de los proveedores externos (ej. si Meta o YouTube experimentan caídas, la publicación programada podría fallar).
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">5. Propiedad Intelectual</h2>
          <p>
            Tú mantienes todos los derechos sobre el contenido original que subas a la Plataforma. Santisoft AI no reclama la propiedad de los textos, imágenes o videos generados a través de tu cuenta para tus redes sociales. El código, diseño, logotipo y estructura de la Plataforma son propiedad exclusiva de Santisoft AI.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">6. Limitación de Responsabilidad</h2>
          <p>
            En la máxima medida permitida por la ley aplicable en Chile, Santisoft AI y sus representantes no serán responsables por daños indirectos, pérdida de ingresos, pérdida de datos, suspensión de cuentas sociales o perjuicios derivados del uso o la incapacidad de usar la plataforma.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">7. Modificaciones a los Términos</h2>
          <p>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Notificaremos a los usuarios sobre cambios sustanciales a través del correo electrónico registrado o mediante un aviso destacado en la Plataforma. El uso continuo del servicio tras dichos cambios constituye la aceptación de los nuevos Términos.
          </p>
          
          <h2 className="text-2xl font-bold mt-10 mb-4">8. Contacto</h2>
          <p>
            Para consultas relacionadas con estos términos, contáctanos en: <strong>legal@santisoft.cl</strong> o <strong>contacto@santisoft.cl</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
