"use client";

import { useState } from "react";
import { FaInstagram, FaUpload, FaSyncAlt, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { FeedAuditDiagnosis } from "../../types/demo-plan";
import FeedDiagnosisCard from "../demo-plan/FeedDiagnosisCard";

interface InstagramFeedScannerProps {
  businessName: string;
  rubro?: string;
  feedAudit: FeedAuditDiagnosis | null;
  feedScreenshotUrl?: string;
  useFeedAuditInStrategy?: boolean;
  onToggleUseFeedAudit?: (use: boolean) => void;
  onAuditComplete: (diagnosis: FeedAuditDiagnosis, screenshotBase64OrUrl: string) => void;
  onSyncRadar?: () => void;
  isSyncingRadar?: boolean;
  className?: string;
}

export default function InstagramFeedScanner({
  businessName,
  rubro = "Comercio Local",
  feedAudit,
  feedScreenshotUrl,
  useFeedAuditInStrategy = true,
  onToggleUseFeedAudit,
  onAuditComplete,
  onSyncRadar,
  isSyncingRadar = false,
  className = "",
}: InstagramFeedScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setErrorMsg("");
    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreview(base64);
    };
    reader.readAsDataURL(selected);
  };

  const handleScanFeed = async () => {
    if (!preview && !feedScreenshotUrl) {
      setErrorMsg("Por favor selecciona una captura de pantalla de tu Instagram.");
      return;
    }
    setAnalyzing(true);
    setErrorMsg("");

    try {
      const imgPayload = preview || feedScreenshotUrl;
      const res = await fetch("/api/vendedores/analyze-feed-screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imgPayload,
          businessName: businessName || "Mi Negocio",
          rubro: rubro || "Comercio",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo completar el análisis del feed.");
      }

      setIsEditing(false);
      onAuditComplete(data.diagnosis, imgPayload || "");
    } catch (err: any) {
      console.error("Error al escanear feed:", err);
      setErrorMsg(err.message || "Ocurrió un error al analizar la captura con nuestros agentes.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Si ya tenemos un diagnóstico y el usuario no está subiendo una nueva foto
  if (feedAudit && !isEditing) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Toggle de activación en la estrategia */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-black shadow-xs shrink-0">
              ✓
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Diagnóstico Activo
                </span>
                <span className="text-xs font-black text-slate-900">
                  Score de Conversión: {feedAudit.overallScore || 68}/100
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                Nuestros agentes detectaron {feedAudit.detectedFlaws?.length || 3} fugas de conversión y orientarán las publicaciones a resolverlas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            {onToggleUseFeedAudit && (
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={useFeedAuditInStrategy}
                  onChange={(e) => onToggleUseFeedAudit(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                />
                <span>Vincular a Estrategia</span>
              </label>
            )}

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-all shadow-2xs cursor-pointer"
            >
              🔄 Re-escanear
            </button>
          </div>
        </div>

        {/* Tarjeta Visual de Diagnóstico */}
        <FeedDiagnosisCard
          feedAudit={feedAudit}
          feedScreenshotUrl={feedScreenshotUrl}
          businessName={businessName}
          onSyncRadar={onSyncRadar}
          isSyncingRadar={isSyncingRadar}
          onReScan={() => setIsEditing(true)}
        />
      </div>
    );
  }

  // Estado Inicial: Subir captura y escanear
  return (
    <div className={`p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 text-white flex items-center justify-center text-sm font-black shadow-xs">
              <FaInstagram />
            </span>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              1. Escaneo y Diagnóstico de tu Feed de Instagram
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
              Recomendado
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
            Sube una captura de tu perfil de Instagram. Nuestros agentes auditarán la cuadrícula, el contraste visual y las fugas de conversión para que la estrategia ataque exactamente lo que hoy te impide vender más.
          </p>
        </div>

        {feedAudit && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 underline self-start sm:self-auto cursor-pointer"
          >
            Volver al análisis anterior
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2">
          <FaExclamationTriangle className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* Zona de Drop / Carga */}
        <div className="sm:col-span-7">
          <label className="block border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50 hover:bg-rose-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={analyzing}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-600 group-hover:text-rose-600 group-hover:border-rose-200 flex items-center justify-center text-xl transition-all shadow-xs">
                <FaUpload />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-black text-slate-800">
                  {file ? file.name : "Haz clic para subir o arrastra la captura de tu feed"}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Captura de pantalla donde se vean tus publicaciones y perfil (JPG, PNG o WebP)
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Previsualización y Botón de Escaneo */}
        <div className="sm:col-span-5 space-y-3">
          {preview ? (
            <div className="space-y-3">
              <div className="aspect-[4/3] rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 max-h-44 flex items-center justify-center">
                <img
                  src={preview}
                  alt="Vista previa feed"
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                type="button"
                disabled={analyzing}
                onClick={handleScanFeed}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:opacity-95 text-white font-black text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    <span>Nuestros agentes están analizando tu feed...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Escanear y Diagnosticar Feed con Nuestros Agentes</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <span>💡</span>
                <span>¿Cómo obtener los mejores resultados?</span>
              </div>
              <p>
                Abre Instagram en tu teléfono o navegador, toma una captura a la cuadrícula de publicaciones y súbela aquí.
              </p>
              <p>
                Nuestros agentes extraerán tus platos o servicios, detectarán la claridad de precios y diseñarán publicaciones para resolver las fugas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
