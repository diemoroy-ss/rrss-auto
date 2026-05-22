import type { Metadata } from "next";
import Image from "next/image";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Santisoft AI | Política de Privacidad",
  description: "Política de privacidad y uso de datos de Santisoft AI. Conoce cómo recopilamos, usamos y protegemos tus datos.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: "/favicon.png",
  },
};

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
          
          {/* App icon + App name header — required by TikTok reviewer */}
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <Image
              src="/favicon.png"
              alt="Santisoft AI logo"
              width={56}
              height={56}
              className="rounded-2xl shadow-md shadow-indigo-100"
              priority
            />
            <span className="text-2xl font-black text-slate-900">
              Santisoft <span className="text-indigo-600">AI</span>
            </span>
          </div>

          <header className="relative z-10 mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
              Santisoft AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Política de Privacidad</span>
            </h1>
            <div className="flex items-center gap-3 text-slate-400 font-medium">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Última actualización: 22 de Mayo, 2026
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
                  Esta Política de Privacidad describe cómo <strong>Santisoft AI</strong> (en adelante, 'la Aplicación'), operada por Santisoft, recopila, utiliza y protege su información cuando utiliza nuestra plataforma de automatización de redes sociales y nuestras integraciones oficiales con Meta API (Facebook e Instagram), TikTok Content Posting API y LinkedIn API.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">02</span>
                  Datos que Recopilamos
                </h2>
                <p>
                  Para proporcionar nuestros servicios de automatización, recopilamos:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-500">
                  <li>Información de perfil y tokens de acceso autorizados para publicar en Facebook, Instagram, TikTok y LinkedIn.</li>
                  <li>Información recopilada a través de nuestros servicios de automatización de WhatsApp, incluyendo números de teléfono y el contenido de los mensajes interactuados.</li>
                  <li>Métricas de rendimiento de anuncios (impresiones, clics, gasto) para mostrar en su panel de control.</li>
                  <li>Contenido multimedia y textos que usted decida programar o publicar en sus perfiles autorizados.</li>
                </ul>
              </section>

              <section className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">03</span>
                  Uso de los Datos y APIs Externas
                </h2>
                <p>
                  Santisoft utiliza las APIs oficiales de Meta, TikTok y LinkedIn para permitirle gestionar su presencia digital. Los datos se utilizan exclusivamente para:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-500 mb-6">
                  <li>Publicar y programar contenido en sus cuentas autorizadas según su explícito consentimiento.</li>
                  <li>Analizar el rendimiento de sus campañas publicitarias y perfiles.</li>
                  <li>Personalizar sugerencias de contenido mediante Inteligencia Artificial.</li>
                </ul>

                <h3 className="text-xl font-bold text-slate-950 mb-2">Uso de Inteligencia Artificial (IA)</h3>
                <p className="mb-6">
                  Nuestro sistema utiliza la API de Google Gemini para procesar mensajes y generar respuestas automáticas. Los datos enviados a la IA se utilizan exclusivamente para generar respuestas inmediatas a sus consultas y no son utilizados para el entrenamiento público de modelos de lenguaje externos.
                </p>

                <h3 className="text-xl font-bold text-slate-950 mb-2">Gestión de Anuncios (Meta Ads)</h3>
                <p className="mb-4">
                  Al utilizar la función de Creador de Campañas, solicitamos permisos avanzados de gestión (`ads_management` y `ads_read`). Con su autorización, Santisoft lee su ID de cuenta publicitaria y métricas básicas (gasto, impresiones, clics) para mostrarlas en su panel, y utiliza el token para automatizar la creación de campañas publicitarias en su nombre.
                </p>
                <p className="font-semibold text-indigo-600">
                  Importante: Santisoft NUNCA almacena, procesa, ni tiene acceso a su información de tarjetas de crédito o métodos de pago, la cual reside exclusivamente en los servidores de Meta. No vendemos sus datos a terceros, ni transferimos información de tokens a entidades no autorizadas.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">04</span>
                  Seguridad y Almacenamiento
                </h2>
                <p>
                  Toda la información personal, tokens cifrados e historial de chats se almacena de forma segura en bases de datos de Google Cloud (Firestore). Implementamos protocolos de cifrado SSL y medidas de seguridad técnicas para proteger sus datos contra acceso no autorizado, pérdida o alteración.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">05</span>
                  Tus Derechos y Eliminación de Datos
                </h2>
                <p>
                  Conforme a la normativa vigente, usted tiene derecho a acceder, rectificar y eliminar sus datos personales. Puede revocar el acceso de Santisoft en cualquier momento desde la configuración de su cuenta de Facebook o solicitando la eliminación total de sus datos en nuestra página de <Link href="/eliminaciondatos" className="text-indigo-600 hover:underline">Eliminación de Datos</Link>.
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
