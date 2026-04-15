import Link from 'next/link';

export default function Terminos() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100">
        
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-10 hover:gap-3 transition-all">
           ← Volver al Inicio
        </Link>

        <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 mb-8">Términos y Condiciones</h1>
        
        <div className="prose prose-slate max-w-none text-slate-600 space-y-6 font-medium leading-relaxed">
          <p className="text-lg text-slate-500 italic">Última actualización: Marzo 2026</p>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Aceptación de los Términos</h2>
            <p>
              Al utilizar los servicios de Santisoft, usted acepta cumplir con estos términos y condiciones. Santisoft proporciona herramientas de automatización para redes sociales basadas en Inteligencia Artificial y conexiones oficiales con Meta API.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Uso del Servicio y Campañas Publicitarias</h2>
            <p>
              El usuario es el único responsable del contenido generado, configurado y publicado a través de nuestra plataforma. Santisoft no se hace responsable por el uso inapropiado del servicio que contravenga las políticas de comunidad de Meta (Facebook/Instagram) o las leyes locales vigentes.
            </p>
            <p className="mt-4">
              <strong>Publicidad (Meta Ads):</strong> Al utilizar nuestro Creador de Campañas, usted autoriza a Santisoft a enviar la configuración de presupuestos y creativos a la API de Meta. <strong>Usted (el usuario y titular de la cuenta en Meta) es el único responsable de los cargos financieros, facturación y resultados de dichas campañas.</strong> Santisoft no se responsabiliza por cargos accidentales, sobregastos generados dentro de Facebook, rechazo de anuncios o bloqueos de cuentas publicitarias derivadas del uso de nuestra integración.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Suscripciones y Pagos</h2>
            <p>
              Santisoft ofrece un plan gratuito limitado y planes premium (Pro y Elite) con cargos mensuales. Las suscripciones pueden cancelarse en cualquier momento desde su panel de control. Los cargos realizados no son reembolsables, a menos que el servicio haya presentado fallas técnicas demostrables e irreparables. 
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Disponibilidad y Garantía</h2>
            <p>
              Nos esforzamos por mantener el servicio operativo el 99% del tiempo; sin embargo, Santisoft depende de servicios de terceros (Google Cloud, Meta API, Google Gemini). No garantizamos que el servicio sea ininterrumpido en caso de mantenimientos técnicos o fallas en dichas plataformas externas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Propiedad Intelectual</h2>
            <p>
              El usuario mantiene los derechos de autor sobre las ideas y contenidos base que proporciona. Santisoft mantiene los derechos sobre el software, algoritmos y interfaces que componen el servicio.
            </p>
          </section>

          <div className="pt-10 border-t border-slate-100 mt-10">
            <p className="text-sm">Si tiene preguntas sobre nuestros términos, contáctenos en <span className="text-indigo-600 font-bold">legal@santisoft.com</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
