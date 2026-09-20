"use client";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-[32px] shadow-2xl relative z-10 w-full max-w-md overflow-hidden animate-in zoom-in fade-in transition-all">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-8 text-center text-white">
          <div className="text-5xl mb-4">🚀</div>
          <h3 className="text-2xl font-black font-display leading-tight">Han alcanzado<br/>tu límite mensual</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-slate-500 font-medium mb-8">
            Ya has sobrepasado la cuota de publicaciones permitidas por tu plan actual. Para seguir publicando en automático necesitas mejorar tu plan.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/automatizacion-rrss/panel/planes" className="bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">
              ⭐️ Mejorar Mi Plan Ahora
            </Link>
            <button onClick={onClose} className="py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors">
              Cerrar por ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
