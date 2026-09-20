"use client";

interface PublishResultModalProps {
  isOpen: boolean;
  success: boolean;
  published: string[];
  errors: string | null;
  onClose: () => void;
}

export default function PublishResultModal({
  isOpen,
  success,
  published,
  errors,
  onClose,
}: PublishResultModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1001] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100 relative z-10 animate-in zoom-in-95 duration-300 text-center">
        {success ? (
          <>
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner border border-emerald-100">
              🎉
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
              ¡Publicación Exitosa!
            </h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
              Tu contenido se ha enviado y publicado correctamente en las siguientes redes vinculadas:
            </p>
            <div className="flex justify-center gap-3 mb-8">
              {published.map((net) => (
                <span
                  key={net}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 shadow-sm"
                >
                  {net === "facebook"
                    ? "🔵 Facebook"
                    : net === "instagram"
                    ? "📸 Instagram"
                    : net === "linkedin"
                    ? "💼 LinkedIn"
                    : "🎵 TikTok"}
                </span>
              ))}
            </div>
          </>
        ) : published.length > 0 ? (
          <>
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner border border-amber-100">
              ⚠️
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
              Publicación Parcial
            </h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
              Se logró publicar en algunas redes, pero otras reportaron un error de sincronización:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left mb-6 max-h-40 overflow-y-auto">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Publicado en:
                </span>
                {published.map((net) => (
                  <span
                    key={net}
                    className="text-[10px] font-bold text-slate-700 bg-white border px-2 py-0.5 rounded-md shadow-sm"
                  >
                    {net}
                  </span>
                ))}
              </div>
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                Detalles del Error:
              </p>
              <p className="text-xs text-slate-600 leading-relaxed font-medium font-mono whitespace-pre-wrap">
                {errors}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner border border-rose-100">
              ❌
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
              Error de Publicación
            </h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
              No se pudo procesar la publicación en ninguna de tus redes sociales.
            </p>
            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 text-left mb-8 max-h-40 overflow-y-auto">
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">
                Reporte de Meta/API:
              </p>
              <p className="text-xs text-rose-600 leading-relaxed font-medium font-mono whitespace-pre-wrap">
                {errors}
              </p>
            </div>
          </>
        )}
        <button
          onClick={onClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg font-display"
        >
          Entendido, cerrar
        </button>
      </div>
    </div>
  );
}
