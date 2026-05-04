import Link from 'next/link';

export default function EliminacionDatos() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100">
        
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-10 hover:gap-3 transition-all">
           ← Volver al Inicio
        </Link>

        <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 mb-8">Instrucciones de Eliminación de Datos</h1>
        
        <div className="prose prose-slate max-w-none text-slate-600 space-y-6 font-medium leading-relaxed">
          <p className="text-lg text-slate-500">
            En cumplimiento con las normativas de privacidad y los Términos de la Plataforma de Meta (Facebook e Instagram), Santisoft proporciona a sus usuarios una forma clara y sencilla de eliminar sus datos asociados a nuestra aplicación.
          </p>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">¿Cómo eliminar sus datos desde Santisoft?</h2>
            <p>
              Si desea desconectar sus redes sociales y eliminar los tokens de acceso almacenados en nuestro sistema, siga estos pasos:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Inicie sesión en su cuenta de Santisoft.</li>
              <li>Diríjase al panel de <strong>Configuración de Marca</strong>.</li>
              <li>En la sección de <strong>Conexiones a Redes Sociales</strong>, busque Meta (FB & IG).</li>
              <li>Haga clic en el botón con la <strong>"X" roja</strong> para desconectar.</li>
            </ol>
            <p className="mt-2 text-sm text-slate-500">
              * Al hacer esto, eliminaremos de inmediato sus tokens de acceso de nuestra base de datos, perdiendo la capacidad de publicar en su nombre.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">¿Cómo eliminar la aplicación desde Facebook?</h2>
            <p>
              También puede eliminar Santisoft directamente desde la configuración de seguridad de su cuenta de Facebook. Esto revocará automáticamente todos los permisos:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Vaya a su cuenta de Facebook y haga clic en su foto de perfil en la esquina superior derecha.</li>
              <li>Seleccione <strong>Configuración y privacidad</strong> {'>'} <strong>Configuración</strong>.</li>
              <li>En el menú de la izquierda, busque <strong>Aplicaciones y sitios web</strong>.</li>
              <li>Busque <strong>Santisoft</strong> en la lista de aplicaciones activas.</li>
              <li>Haga clic en <strong>Eliminar</strong> y confirme la acción.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Solicitud de Eliminación Completa (Derecho al Olvido)</h2>
            <p>
              Si no solo desea revocar el acceso a Facebook, sino que desea que eliminemos <strong>todo su historial de publicaciones, cuenta, configuraciones y datos personales</strong> de los servidores de Santisoft, por favor envíenos una solicitud directa:
            </p>
            <div className="bg-indigo-50 p-6 rounded-2xl mt-4 border border-indigo-100">
              <p className="font-bold text-indigo-900 mb-2">Pasos para la solicitud:</p>
              <ul className="list-disc pl-5 space-y-1 text-indigo-800">
                <li>Envíe un correo electrónico a: <strong>soporte@santisoft.com</strong></li>
                <li>Asunto: <strong>Solicitud de Eliminación de Datos</strong></li>
                <li>Incluya el correo electrónico asociado a su cuenta de Santisoft.</li>
              </ul>
              <p className="mt-4 text-sm text-indigo-700">Procesaremos su solicitud y eliminaremos todos sus datos en un plazo máximo de 7 días hábiles, enviándole una confirmación una vez realizado.</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
