import Link from "next/link";

export default function ExitoPage() {
  return (
    <div className="max-w-3xl mx-auto py-20 text-center">
      <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner border border-emerald-100/50 animate-bounce">✅</div>
      <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">¡Pago Exitoso! Bienvenido al <span className="text-indigo-600">Siguiente Nivel</span>.</h1>
      <p className="text-slate-500 text-lg mb-12 font-medium leading-relaxed">
        Tu suscripción se ha activado correctamente. Ahora tienes acceso a todo el poder de automatización de tu nuevo plan.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/automatizacion-rrss/panel" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-[24px] shadow-xl hover:-translate-y-1 transition-all w-full sm:w-auto">
              Ir a mi Panel
          </Link>
          <Link href="/automatizacion-rrss/panel/crear" className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-4 px-10 rounded-[24px] transition-all w-full sm:w-auto">
              Crear Nuevo Post
          </Link>
      </div>
    </div>
  );
}
