"use client";

import { useState } from "react";
import { FaExpand, FaArrowRight, FaTimes } from "react-icons/fa";
import { FeedAuditDiagnosis } from "../../types/demo-plan";

interface FeedDiagnosisCardProps {
  feedAudit: FeedAuditDiagnosis;
  feedScreenshotUrl?: string;
  businessName: string;
  onProceedToPlan?: () => void;
  proceedButtonText?: string;
  onSyncRadar?: () => void;
  isSyncingRadar?: boolean;
  onReScan?: () => void;
}

export default function FeedDiagnosisCard({
  feedAudit,
  feedScreenshotUrl,
  businessName,
  onProceedToPlan,
  proceedButtonText,
  onSyncRadar,
  isSyncingRadar = false,
  onReScan,
}: FeedDiagnosisCardProps) {
  const [fullscreenScreenshot, setFullscreenScreenshot] = useState<string | null>(null);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Cabecera del Diagnóstico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
            Auditoría de Feed con Agentes
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Estado Actual del Feed de {businessName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
            {feedAudit.brandAestheticSummary || "Evaluación diagnóstica basada en contraste visual, apetito visual y conversión."}
          </p>
        </div>

        <div className="text-center bg-gradient-to-tr from-rose-50 to-orange-50 border border-rose-200 p-4 rounded-3xl shrink-0">
          <div className="text-3xl sm:text-4xl font-black text-rose-600">
            {feedAudit.overallScore || 68}
            <span className="text-lg text-rose-400 font-bold">/100</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-rose-700 mt-1">
            Índice de Conversión
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Captura de Instagram */}
        {feedScreenshotUrl ? (
          <div className="lg:col-span-5 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Captura Analizada del Perfil
            </span>
            <div
              onClick={() => setFullscreenScreenshot(feedScreenshotUrl)}
              className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer group relative shadow-xs"
            >
              <img
                src={feedScreenshotUrl}
                alt="Feed Instagram"
                className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                <FaExpand /> <span>Ver captura completa</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Fugas y Fortalezas */}
        <div className={`${feedScreenshotUrl ? "lg:col-span-7" : "lg:col-span-12"} space-y-4`}>
          {/* Fugas de Conversión */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
              <span>⚠️</span>
              <span>Fugas de Conversión Detectadas en tu Instagram Actual:</span>
            </div>
            <ul className="text-xs sm:text-sm text-slate-700 space-y-2 font-medium">
              {(feedAudit.detectedFlaws || [
                "Falta de precios claros y llamados directos a WhatsApp en publicaciones clave.",
                "Poca alternancia entre fotos de apetito visual y carteles de ofertas semanales.",
                "Historias con baja interacción interactiva (encuestas, cajas de preguntas o sliders)."
              ]).map((flaw, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold shrink-0">•</span>
                  <span>{flaw}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Fortalezas actuales */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
              <span>✅</span>
              <span>Fortalezas y Aciertos Detectados:</span>
            </div>
            <ul className="text-xs sm:text-sm text-slate-700 space-y-2 font-medium">
              {(feedAudit.detectedStrengths || [
                "Identidad de marca reconocida en su localidad.",
                "Platos y productos con alto potencial de apetito visual.",
                "Comunidad fiel que responde ante promociones bien planteadas."
              ]).map((strength, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pilares Estratégicos */}
          {feedAudit.suggestedPillars && feedAudit.suggestedPillars.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                🎯 Pilares de Contenido Recomendados por Nuestros Agentes:
              </span>
              <div className="flex flex-wrap gap-2">
                {feedAudit.suggestedPillars.map((pillar, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Acciones del Diagnóstico (Pasar al Plan / Sincronizar Radar / Re-escanear) */}
      {(onProceedToPlan || onSyncRadar || onReScan) && (
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500 font-medium">
            {onProceedToPlan
              ? "Diseñamos la solución exacta para corregir estas fugas en tu plan:"
              : "Alinea tu estrategia y radar de nicho con estas oportunidades:"}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {onReScan && (
              <button
                type="button"
                onClick={onReScan}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                🔄 Escanear otra captura
              </button>
            )}

            {onSyncRadar && (
              <button
                type="button"
                disabled={isSyncingRadar}
                onClick={onSyncRadar}
                className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSyncingRadar ? (
                  <>
                    <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                    <span>Sincronizando con Radar...</span>
                  </>
                ) : (
                  <>
                    <span>📡</span>
                    <span>Sincronizar con Radar de Nicho</span>
                  </>
                )}
              </button>
            )}

            {onProceedToPlan && (
              <button
                type="button"
                onClick={onProceedToPlan}
                className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{proceedButtonText || "Ver Planificación de 14 Días con Nuestros Agentes"}</span>
                <FaArrowRight />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Zoom Captura */}
      {fullscreenScreenshot && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-6 animate-fadeIn"
          onClick={() => setFullscreenScreenshot(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[95vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFullscreenScreenshot(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-2 text-xl cursor-pointer"
            >
              <FaTimes />
            </button>
            <img
              src={fullscreenScreenshot}
              alt="Captura Feed"
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl select-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
