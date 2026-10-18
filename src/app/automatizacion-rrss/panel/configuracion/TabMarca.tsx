"use client";
import React from "react";

interface TabMarcaProps {
  logoUrl: string;
  isUploadingLogo: boolean;
  isAnalyzingLogo: boolean;
  isRemovingLogoBg?: boolean;
  isSavingLogoNoBg?: boolean;
  processedLogoPreview?: string | null;
  alwaysIncludeLogo: boolean;
  brandName: string;
  rubro: string;
  businessDescription: string;
  activeProfileName?: string;
  setAlwaysIncludeLogo: (v: boolean) => void;
  setBrandName: (v: string) => void;
  setRubro: (v: string) => void;
  setBusinessDescription: (v: string) => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveLogoBg?: () => void;
  handleSaveProcessedLogo?: () => void;
  handleCancelProcessedLogo?: () => void;
}

export default function TabMarca({
  logoUrl, isUploadingLogo, isAnalyzingLogo,
  isRemovingLogoBg = false, isSavingLogoNoBg = false, processedLogoPreview = null,
  alwaysIncludeLogo, brandName, rubro, businessDescription, activeProfileName,
  setAlwaysIncludeLogo, setBrandName, setRubro, setBusinessDescription, handleLogoUpload,
  handleRemoveLogoBg, handleSaveProcessedLogo, handleCancelProcessedLogo,
}: TabMarcaProps) {
  const currentLogoToDisplay = processedLogoPreview || logoUrl;
  const isDisplayingProcessed = Boolean(processedLogoPreview);

  return (
    <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
        <span className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl shadow-inner font-black">🏢</span>
        <h3 className="text-xl font-black text-slate-900">Identidad: <span className="text-indigo-600">{activeProfileName || "Principal"}</span></h3>
      </div>

      <div className="mb-8">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Logo Corporativo (Máx 2MB)</label>
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Logo Box with transparent checkerboard pattern when showing transparent preview */}
          <div className={`w-28 h-28 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 relative transition-all shadow-sm ${
            isDisplayingProcessed
              ? "border-emerald-400 bg-[linear-gradient(45deg,#cbd5e1_25%,transparent_25%),linear-gradient(-45deg,#cbd5e1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)] bg-[size:14px_14px] bg-[position:0_0,0_7px,7px_-7px,-7px_0] bg-slate-100"
              : "border-indigo-200 bg-slate-50 hover:border-indigo-400"
          }`}>
            {currentLogoToDisplay ? (
              <img src={currentLogoToDisplay} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-3xl opacity-50">🖼️</span>
            )}
            
            {(isUploadingLogo || isAnalyzingLogo || isRemovingLogoBg || isSavingLogoNoBg) && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black text-indigo-600 leading-tight">
                  {isRemovingLogoBg ? "Removiendo fondo..." : isSavingLogoNoBg ? "Guardando logo..." : isAnalyzingLogo ? "Analizando..." : "Subiendo..."}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              Sube tu logo oficial en formato PNG o JPG. Nuestros agentes lo estamparán automáticamente con nitidez original en las imágenes de tus posts cuando lo actives.
            </p>

            {/* Acciones para Logo Normal */}
            {!isDisplayingProcessed ? (
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <label className="cursor-pointer bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm hover:bg-slate-50 transition-colors shadow-xs inline-flex items-center gap-1.5">
                  <span>📁</span>
                  <span>{isUploadingLogo ? "Subiendo..." : logoUrl ? "Cambiar Logo" : "Subir Logo"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploadingLogo || isRemovingLogoBg} />
                </label>

                {logoUrl && handleRemoveLogoBg && (
                  <button
                    type="button"
                    onClick={handleRemoveLogoBg}
                    disabled={isRemovingLogoBg || isUploadingLogo}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>✨</span>
                    <span>{isRemovingLogoBg ? "Procesando..." : "Quitar fondo (Hacer transparente)"}</span>
                  </button>
                )}
              </div>
            ) : (
              /* Previsualización del Logo Procesado sin Fondo */
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Vista previa sin fondo
                  </span>
                  <p className="text-xs font-bold text-emerald-900">
                    ¿Te gusta cómo quedó el resultado transparente?
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveProcessedLogo}
                    disabled={isSavingLogoNoBg}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>💾</span>
                    <span>{isSavingLogoNoBg ? "Guardando..." : "Guardar logo sin fondo"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelProcessedLogo}
                    disabled={isSavingLogoNoBg}
                    className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-colors shadow-xs inline-flex items-center gap-1"
                  >
                    <span>✕</span>
                    <span>Descartar / Conservar original</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {logoUrl && (
          <div className="mt-5 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${alwaysIncludeLogo ? "bg-indigo-500 border-indigo-500" : "bg-white border-slate-300 group-hover:border-indigo-400"}`}>
                {alwaysIncludeLogo && <span className="w-2 h-2 bg-white rounded-sm" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Incluir siempre logo en posts creados</p>
                <p className="text-[10px] text-slate-500">Estampará automáticamente tu logo original en las imágenes generadas por nuestros agentes.</p>
              </div>
              <input type="checkbox" className="hidden" checked={alwaysIncludeLogo} onChange={(e) => setAlwaysIncludeLogo(e.target.checked)} />
            </label>
          </div>
        )}
      </div>

      <div className="mb-8">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🏷️ Nombre de la Marca / Negocio</label>
        <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Ej: Mi Restaurante" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
      </div>

      <div className="mb-8">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🏭 Rubro / Industria <span className="text-rose-500">*</span></label>
        <input type="text" value={rubro} onChange={(e) => setRubro(e.target.value)} placeholder="Ej: Clínica Dental, Restaurante Vegano, Inmobiliaria..." required className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">📝 Descripción del Negocio <span className="text-rose-500">*</span></label>
        <textarea value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} placeholder="Describe qué hace tu negocio, qué problemas resuelve, cuál es tu público objetivo y el tono de tu marca. Esto ayudará a nuestros agentes a redactar copys e imágenes perfectas para ti." required rows={5} className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700 resize-none" />
      </div>
    </div>
  );
}
