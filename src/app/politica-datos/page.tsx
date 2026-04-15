import Link from 'next/link';

export default function PoliticaDatos() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100">
        
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-10 hover:gap-3 transition-all">
           ← Volver al Inicio
        </Link>

        <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 mb-8">Política de Uso de Datos</h1>
        
        <div className="prose prose-slate max-w-none text-slate-600 space-y-6 font-medium leading-relaxed">
          <p className="text-lg text-slate-500 italic">Última actualización: Marzo 2026</p>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Recopilación de Información</h2>
            <p>
              Santisoft recopila información necesaria para la prestación de sus servicios de automatización, incluyendo nombres de usuario, números de teléfono y el contenido de los mensajes interactuados a través de WhatsApp y servicios de Meta (Facebook e Instagram).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Uso de Inteligencia Artificial</h2>
            <p>
              Nuestro sistema utiliza la API de Google Gemini para procesar mensajes y generar respuestas automáticas. Los datos enviados a la IA se utilizan exclusivamente para generar respuestas inmediatas a sus consultas y no son utilizados para el entrenamiento público de modelos de lenguaje externos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Almacenamiento y Seguridad</h2>
            <p>
              Toda la información personal e historial de chats se almacena de forma segura en bases de datos de Google Cloud (Firestore). Implementamos medidas de seguridad técnicas para proteger sus datos contra acceso no autorizado, pérdida o alteración. 
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Integración con Meta (Facebook, Instagram y Ads)</h2>
            <p>
              Santisoft actúa como un puente entre su cuenta y la API oficial de Meta. No almacenamos sus credenciales de acceso directo. Todas las publicaciones se ejecutan mediante tokens de acceso autorizados por el usuario conforme a las políticas de Meta.
            </p>
            <p className="mt-4">
              <strong>Gestión de Anuncios (Meta Ads):</strong> Al utilizar la función de Creador de Campañas, solicitamos permisos avanzados de gestión (`ads_management` y `ads_read`). Con su autorización, Santisoft lee su ID de cuenta publicitaria y métricas básicas (gasto, impresiones, clics) para mostrarlas en su panel, y utiliza el token para automatizar la creación de campañas publicitarias en su nombre. Santisoft NUNCA almacena, procesa, ni tiene acceso a su información de tarjetas de crédito o métodos de pago, la cual reside exclusivamente en los servidores de Meta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Sus Derechos</h2>
            <p>
              Usted tiene derecho a solicitar la eliminación de su historial de chat y datos personales de nuestros servidores en cualquier momento escribiendo a nuestro equipo de soporte.
            </p>
          </section>

          <div className="pt-10 border-t border-slate-100 mt-10">
            <p className="text-sm">Si tiene preguntas sobre nuestra política, contáctenos en <span className="text-indigo-600 font-bold">soporte@santisoft.com</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
