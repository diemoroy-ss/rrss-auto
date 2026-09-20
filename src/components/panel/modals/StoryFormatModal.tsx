"use client";

import { SocialPost } from "../../../types/dashboard";

interface StoryFormatModalProps {
  isOpen: boolean;
  isRegenerating: boolean;
  onAdapt: () => void;
  onPublishAsIs: () => void;
  onClose: () => void;
}

export default function StoryFormatModal({
  isOpen,
  isRegenerating,
  onAdapt,
  onPublishAsIs,
  onClose,
}: StoryFormatModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1002] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0"
        onClick={() => !isRegenerating && onClose()}
      ></div>
      <div className="bg-white rounded-[32px] shadow-2xl relative z-10 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-center text-white">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="text-2xl font-black leading-tight">
            Formato de Imagen
            <br />
            No Óptimo
          </h3>
        </div>
        <div className="p-8 text-center">
          {isRegenerating ? (
            <div className="flex flex-col items-center justify-center py-6 animate-pulse">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <h4 className="font-black text-sm text-slate-700 uppercase tracking-widest">
                Adaptando Imagen a 9:16...
              </h4>
              <p className="text-xs text-slate-400 mt-2">
                La IA está rediseñando tu imagen a formato vertical. Esto puede tomar unos segundos.
              </p>
            </div>
          ) : (
            <>
              <p className="text-slate-500 font-medium mb-4 leading-relaxed">
                Detectamos que la imagen actual de tu post es <b>horizontal o cuadrada</b>.
              </p>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed text-xs">
                Las historias de Instagram y Facebook requieren formato vertical{" "}
                <b>9:16 (1080x1920)</b>. Publicarla horizontal puede recortarla, añadir franjas o dar
                error en la app de Instagram.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={onAdapt}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all"
                >
                  ✨ Adaptar a 9:16 con IA (Regenerar)
                </button>
                <button
                  onClick={onPublishAsIs}
                  className="bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-all"
                >
                  Publicar Horizontal de todos modos
                </button>
                <button
                  onClick={onClose}
                  className="py-3 text-slate-400 font-bold hover:text-slate-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
