import Link from 'next/link';

export default function Privacidad() {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-20 px-6 font-sans">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50" />
      
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-indigo-600 font-semibold mb-12 hover:translate-x-[-4px] transition-all duration-300 group"
        >
          <span className="bg-indigo-50 p-2 rounded-full group-hover:bg-indigo-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </span>
          Volver al Inicio
        </Link>

        <main className="bg-white p-8 md:p-20 rounded-[48px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-32 -mt-32" />
          
          <header className="relative z-10 mb-16">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Política de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Privacidad</span>
            </h1>
            <div className="flex items-center gap-3 text-slate-400 font-medium">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Última actualización: 4 de Mayo, 2026
            </div>
          </header>
          
          <div className="prose prose-slate max-w-none relative z-10">
            <div className="space-y-12 text-slate-600 text-lg leading-relaxed font-medium">
              
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">01</span>
                  Introducción
                </h2>
                <p>
                  En <strong>Santisoft</strong>, la privacidad de sus datos es nuestra prioridad. Esta política describe cómo recopilamos, utilizamos y protegemos su información cuando utiliza nuestra plataforma de automatización de redes sociales y nuestras integraciones con Meta API.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">02</span>
                  Datos que Recopilamos
                </h2>
                <p>
                  Para proporcionar nuestros servicios, recopilamos:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-500">
                  <li>Información de perfil público proporcionada a través de Facebook Login.</li>
                  <li>Tokens de acceso autorizados para gestionar páginas de Facebook e Instagram.</li>
                  <li>Métricas de rendimiento de anuncios (impresiones, clics, gasto) para mostrar en su panel de control.</li>
                  <li>Contenido multimedia y textos que usted decida programar o publicar.</li>
                </ul>
              </section>

              <section className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">03</span>
                  Uso de los Datos y Meta API
                </h2>
                <p>
                  Santisoft utiliza las APIs oficiales de Meta para permitirle gestionar su presencia digital. Los datos se utilizan exclusivamente para:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-500">
                  <li>Publicar contenido en sus cuentas autorizadas.</li>
                  <li>Analizar el rendimiento de sus campañas publicitarias.</li>
                  <li>Personalizar sugerencias de contenido mediante Inteligencia Artificial.</li>
                </ul>
                <p className="mt-4 font-semibold text-indigo-600">
                  Importante: No vendemos sus datos a terceros ni los utilizamos para fines ajenos a la funcionalidad de la plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">04</span>
                  Seguridad de la Información
                </h2>
                <p>
                  Implementamos protocolos de cifrado SSL y almacenamiento seguro en infraestructura de clase mundial (Google Cloud) para garantizar que sus tokens de acceso y datos personales estén protegidos contra accesos no autorizados.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">05</span>
                  Eliminación de Datos
                </h2>
                <p>
                  Usted puede revocar el acceso de Santisoft en cualquier momento desde la configuración de su cuenta de Facebook o solicitando la eliminación total de sus datos en nuestra página de <Link href="/eliminaciondatos" className="text-indigo-600 hover:underline">Eliminación de Datos</Link>.
                </p>
              </section>

            </div>

            <footer className="mt-20 pt-10 border-t border-slate-100">
              <div className="bg-indigo-600 p-8 rounded-[32px] text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <p className="font-bold text-xl mb-1">¿Tiene dudas legales?</p>
                  <p className="opacity-80">Nuestro equipo está listo para ayudarle.</p>
                </div>
                <a 
                  href="mailto:legal@santisoft.com" 
                  className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all"
                >
                  Contactar Soporte
                </a>
              </div>
            </footer>
          </div>
        </main>
        
        <p className="text-center text-slate-400 mt-12 text-sm font-medium">
          © 2026 Santisoft Automatización. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
