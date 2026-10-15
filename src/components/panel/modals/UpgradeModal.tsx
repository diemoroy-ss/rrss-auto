"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, MessageCircle, X, CheckCircle2 } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  const whatsappUrl = `https://wa.me/56965909543?text=${encodeURIComponent(
    "Hola Santisoft! Llegué al límite de publicaciones de mi plan y quiero pasar al Plan PyME Crecimiento ($99.990) para seguir publicando."
  )}`;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="bg-white rounded-[32px] shadow-2xl relative z-10 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-150">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Desbloquea Todo el Potencial de tus Redes</span>
          </div>

          <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            Completaste tus posts del mes
          </h3>
          <p className="text-slate-300 text-xs md:text-sm mt-2 leading-relaxed font-medium">
            Tus redes están activas y funcionando. Pasa al <strong>Plan PyME Crecimiento</strong> para mantener el ritmo y captar clientes todos los días.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
                Plan PyME Crecimiento
              </span>
              <span className="text-xs font-black text-indigo-600 bg-white px-3 py-1 rounded-full shadow-xs border border-indigo-100">
                $99.990 + IVA/mes
              </span>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>30 publicaciones mensuales:</strong> Grilla completa de 30 días.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Multicanal completo:</strong> Instagram, Facebook, TikTok y LinkedIn.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Módulos exclusivos:</strong> Blog SEO, Meta Ads y Radar de Competidores.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Hasta 30 Reels / Videos mensuales:</strong> Guiones listos para vender.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/confirmar-plan?plan=crecimiento"
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black py-4 rounded-xl text-center text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Subir a Plan Crecimiento ($99.990)</span>
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-xl text-center text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Coordinar Upgrade por WhatsApp</span>
            </a>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors text-center"
            >
              Cerrar por ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
