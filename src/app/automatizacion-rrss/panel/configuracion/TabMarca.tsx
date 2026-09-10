"use client";
import React from "react";

interface TabMarcaProps {
  logoUrl: string;
  isUploadingLogo: boolean;
  isAnalyzingLogo: boolean;
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
}

export default function TabMarca({
  logoUrl, isUploadingLogo, isAnalyzingLogo, alwaysIncludeLogo,
  brandName, rubro, businessDescription, activeProfileName,
  setAlwaysIncludeLogo, setBrandName, setRubro, setBusinessDescription, handleLogoUpload,
}: TabMarcaProps) {
  return (
    <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
        <span className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl shadow-inner font-black">🏢</span>
        <h3 className="text-xl font-black text-slate-900">Identidad: <span className="text-indigo-600">{activeProfileName || "Principal"}</span></h3>
      </div>

      <div className="mb-8">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Logo Corporativo (Máx 2MB)</label>
        <div className="flex gap-4 items-start">
          <div className="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden shrink-0 relative hover:border-indigo-400 transition-colors">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" /> : <span className="text-3xl opacity-50">🖼️</span>}
            {(isUploadingLogo || isAnalyzingLogo) && (
              <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-1">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                {isAnalyzingLogo && <span className="text-[9px] font-bold text-indigo-500">Analizando…</span>}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 mb-3">Sube tu logo oficial en formato PNG o JPG. Nuestros agentes lo estamparán automáticamente con nitidez original en las imágenes de tus posts cuando lo actives.</p>
            <label className="cursor-pointer bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm inline-block">
              {isUploadingLogo ? "Subiendo..." : logoUrl ? "Cambiar Logo" : "Subir Logo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploadingLogo} />
            </label>
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
