"use client";

import React, { useState } from "react";
import {
  BrandVisualIdentity,
  SUBJECT_TYPE_OPTIONS,
  HARDCODED_STYLES,
} from "../../../../lib/prompt-templates";

interface TabIdentidadVisualProps {
  visualIdentity: BrandVisualIdentity;
  setVisualIdentity: React.Dispatch<React.SetStateAction<BrandVisualIdentity>>;
  logoUrl?: string;
  rubro?: string;
  brandName?: string;
  businessDescription?: string;
  onSave: () => void;
  saving: boolean;
}

export default function TabIdentidadVisual({
  visualIdentity,
  setVisualIdentity,
  logoUrl,
  rubro,
  brandName,
  businessDescription,
  onSave,
  saving,
}: TabIdentidadVisualProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisSuccess, setAnalysisSuccess] = useState("");
  const [websiteInput, setWebsiteInput] = useState(visualIdentity.websiteUrl || "");
  const [newAdjective, setNewAdjective] = useState("");

  const primaryStyle = visualIdentity.styleMix?.[0]?.styleId || "style-everyday-real";
  const secondaryStyle = visualIdentity.styleMix?.[1]?.styleId || "style-ads-hero-shot";
  const primaryWeight = visualIdentity.styleMix?.[0]?.weight ?? 70;

  // Actualizar el mix de estilos
  const updateStyleMix = (primaryId: string, secondaryId: string, weight: number, lock: boolean) => {
    setVisualIdentity((prev) => ({
      ...prev,
      lockStyle: lock,
      styleMix: lock
        ? [{ styleId: primaryId, weight: 100 }]
        : [
            { styleId: primaryId, weight },
            { styleId: secondaryId, weight: 100 - weight },
          ],
    }));
  };

  // Auto-setup vía API
  const handleAutoExtract = async (source: "web" | "logo" | "all") => {
    setAnalyzing(true);
    setAnalysisError("");
    setAnalysisSuccess("");

    try {
      const res = await fetch("/api/brand/extract-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: source === "logo" ? "" : (websiteInput || ""),
          logoUrl: source === "web" ? "" : (logoUrl || ""),
          rubro: rubro || "",
          businessName: brandName || "",
          businessDescription: businessDescription || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al analizar identidad");

      if (data.identity) {
        setVisualIdentity((prev) => ({
          ...prev,
          ...data.identity,
          websiteUrl: websiteInput || prev.websiteUrl,
        }));
        setAnalysisSuccess(
          data.identity.summaryReason ||
            "¡ADN Visual detectado y aplicado con éxito! Revisa los campos y guarda los cambios."
        );
      }
    } catch (err: any) {
      setAnalysisError(err.message || "Error analizando la identidad visual");
    } finally {
      setAnalyzing(false);
    }
  };


  // Manejo de adjetivos de tono
  const addAdjective = () => {
    const val = newAdjective.trim().toLowerCase();
    if (!val) return;
    const current = visualIdentity.toneAdjectives || [];
    if (current.length >= 5) return;
    if (!current.includes(val)) {
      setVisualIdentity((prev) => ({
        ...prev,
        toneAdjectives: [...current, val],
      }));
    }
    setNewAdjective("");
  };

  const removeAdjective = (adj: string) => {
    setVisualIdentity((prev) => ({
      ...prev,
      toneAdjectives: (prev.toneAdjectives || []).filter((a) => a !== adj),
    }));
  };

  return (
    <div className="space-y-8">
      {/* ─── ENCABEZADO & AUTO-SETUP ───────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎨</span>
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
              Personalización de Prompts
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">
            ADN Visual de tu Marca
          </h2>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            Define la estética única de tu negocio. Nuestros agentes inyectarán automáticamente esta identidad en cada imagen y video generado para que tu contenido sea reconocible y nunca genérico.
          </p>

          {/* Caja de Auto-Setup */}
          <div className="mt-6 p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-wider text-indigo-300 mb-3 flex items-center gap-2">
              <span>⚡</span> Configuración Automática Inteligente
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={websiteInput}
                onChange={(e) => setWebsiteInput(e.target.value)}
                placeholder="https://tutienda.com (opcional)"
                className="flex-1 bg-slate-900/80 border border-white/20 px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400 font-medium"
              />
              <button
                type="button"
                onClick={() => handleAutoExtract(websiteInput ? "all" : "logo")}
                disabled={analyzing || (!websiteInput && !logoUrl && !businessDescription)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {analyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Nuestros agentes están analizando…</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Analizar y Configurar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Nuestros agentes escanearán tu sitio web, logo y descripción para detectar tus colores, estilo visual y elementos distintivos.
            </p>

            {analysisError && (
              <div className="mt-3 p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs rounded-xl font-bold">
                ⚠️ {analysisError}
              </div>
            )}
            {analysisSuccess && (
              <div className="mt-3 p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl font-medium">
                ✅ {analysisSuccess}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── SECCIÓN 1: MIX DE ESTILOS VISUALES ────────────────────────── */}
      <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>🎭</span> Mix de Estilos Visuales
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Elige si quieres que todas las publicaciones tengan el mismo estilo exacto o una mezcla controlada.
            </p>
          </div>
          {/* Toggle Lock Style */}
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <span className={`text-xs font-bold ${visualIdentity.lockStyle ? "text-indigo-600" : "text-slate-400"}`}>
              Estilo Fijo (100%)
            </span>
            <button
              type="button"
              onClick={() => updateStyleMix(primaryStyle, secondaryStyle, primaryWeight, !visualIdentity.lockStyle)}
              className={`w-12 h-6 rounded-full transition-colors relative ${!visualIdentity.lockStyle ? "bg-indigo-600" : "bg-slate-300"}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  !visualIdentity.lockStyle ? "right-1" : "left-1"
                }`}
              />
            </button>
            <span className={`text-xs font-bold ${!visualIdentity.lockStyle ? "text-indigo-600" : "text-slate-400"}`}>
              Mix Variado
            </span>
          </div>
        </div>

        {/* Estilo Primario */}
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Estilo Principal {!visualIdentity.lockStyle && `(${primaryWeight}%)`}
            </label>
            <select
              value={primaryStyle}
              onChange={(e) => updateStyleMix(e.target.value, secondaryStyle, primaryWeight, visualIdentity.lockStyle)}
              className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              {HARDCODED_STYLES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.title} — [{st.category}]
                </option>
              ))}
            </select>
          </div>

          {/* Slider y Estilo Secundario si está en modo Mix */}
          {!visualIdentity.lockStyle && (
            <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>Proporción: Principal ({primaryWeight}%)</span>
                  <span>Secundario ({100 - primaryWeight}%)</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="90"
                  step="5"
                  value={primaryWeight}
                  onChange={(e) =>
                    updateStyleMix(primaryStyle, secondaryStyle, parseInt(e.target.value), false)
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Estilo Secundario ({100 - primaryWeight}%)
                </label>
                <select
                  value={secondaryStyle}
                  onChange={(e) => updateStyleMix(primaryStyle, e.target.value, primaryWeight, false)}
                  className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {HARDCODED_STYLES.filter((s) => s.id !== primaryStyle).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.title} — [{st.category}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── SECCIÓN 2: PALETA DE COLORES ──────────────────────────────── */}
      <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="pb-6 border-b border-slate-100 mb-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>🎨</span> Paleta de Colores de la Marca
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Los colores dominantes que nuestros agentes aplicarán en la iluminación, fondos y detalles de cada composición.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          {/* Primario */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Color Primario
            </label>
            <div className="flex items-center gap-3 p-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl">
              <input
                type="color"
                value={visualIdentity.primaryColor || "#4F46E5"}
                onChange={(e) =>
                  setVisualIdentity((prev) => ({ ...prev, primaryColor: e.target.value }))
                }
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={visualIdentity.primaryColor || "#4F46E5"}
                onChange={(e) =>
                  setVisualIdentity((prev) => ({ ...prev, primaryColor: e.target.value }))
                }
                className="font-mono text-xs font-bold text-slate-700 bg-transparent outline-none w-20 uppercase"
              />
            </div>
          </div>

          {/* Secundario */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Color Secundario
            </label>
            <div className="flex items-center gap-3 p-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl">
              <input
                type="color"
                value={visualIdentity.secondaryColor || "#F8FAFC"}
                onChange={(e) =>
                  setVisualIdentity((prev) => ({ ...prev, secondaryColor: e.target.value }))
                }
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={visualIdentity.secondaryColor || "#F8FAFC"}
                onChange={(e) =>
                  setVisualIdentity((prev) => ({ ...prev, secondaryColor: e.target.value }))
                }
                className="font-mono text-xs font-bold text-slate-700 bg-transparent outline-none w-20 uppercase"
              />
            </div>
          </div>

          {/* Acento */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Color de Acento
            </label>
            <div className="flex items-center gap-3 p-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl">
              <input
                type="color"
                value={visualIdentity.accentColor || "#1E1B4B"}
                onChange={(e) =>
                  setVisualIdentity((prev) => ({ ...prev, accentColor: e.target.value }))
                }
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={visualIdentity.accentColor || "#1E1B4B"}
                onChange={(e) =>
                  setVisualIdentity((prev) => ({ ...prev, accentColor: e.target.value }))
                }
                className="font-mono text-xs font-bold text-slate-700 bg-transparent outline-none w-20 uppercase"
              />
            </div>
          </div>
        </div>

        {/* Descripción de la paleta */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Descripción Textual de la Paleta (en inglés, para el motor de generación)
          </label>
          <input
            type="text"
            value={visualIdentity.colorDescription || ""}
            onChange={(e) =>
              setVisualIdentity((prev) => ({ ...prev, colorDescription: e.target.value }))
            }
            placeholder="Ej: warm terracotta, linen white, deep navy blue"
            className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ─── SECCIÓN 3: TONO Y ELEMENTOS RECURRENTES ───────────────────── */}
      <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="pb-6 border-b border-slate-100 mb-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>✨</span> Tono Visual y Elementos Fijos
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Los adjetivos que definen la atmósfera y los objetos que siempre deberían sentirse presentes.
          </p>
        </div>

        {/* Tipo de Sujeto Preferido */}
        <div className="mb-6">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Sujeto Principal Preferido
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUBJECT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setVisualIdentity((prev) => ({ ...prev, subjectType: opt.value }))
                }
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  visualIdentity.subjectType === opt.value
                    ? "border-indigo-600 bg-indigo-50/50"
                    : "border-slate-100 bg-slate-50 hover:border-slate-200"
                }`}
              >
                <div className="text-2xl mb-1">{opt.emoji}</div>
                <div className="text-xs font-black text-slate-900">{opt.label}</div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Adjetivos de Tono */}
        <div className="mb-6">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Adjetivos de Tono Visual (máx. 5)
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(visualIdentity.toneAdjectives || []).map((adj) => (
              <span
                key={adj}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold"
              >
                {adj}
                <button
                  type="button"
                  onClick={() => removeAdjective(adj)}
                  className="text-indigo-400 hover:text-indigo-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {(visualIdentity.toneAdjectives || []).length < 5 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newAdjective}
                onChange={(e) => setNewAdjective(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAdjective())}
                placeholder="Ej: minimalista, cálido, artesanal, elegante..."
                className="flex-1 bg-slate-50 border-2 border-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addAdjective}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl"
              >
                + Agregar
              </button>
            </div>
          )}
        </div>

        {/* Elementos Recurrentes */}
        <div className="mb-6">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Elementos y Objetos Recurrentes
          </label>
          <input
            type="text"
            value={visualIdentity.recurringElements || ""}
            onChange={(e) =>
              setVisualIdentity((prev) => ({ ...prev, recurringElements: e.target.value }))
            }
            placeholder="Ej: tazas de café, madera clara, manos interactuando, luz de ventana matutina"
            className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:border-indigo-500"
          />
          <p className="text-[11px] text-slate-400 mt-1.5">
            Objetos, texturas o ambientes que refuerzan la coherencia entre publicaciones.
          </p>
        </div>

        {/* Audiencia Visual */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Público Objetivo Visual
          </label>
          <input
            type="text"
            value={visualIdentity.audienceDescription || ""}
            onChange={(e) =>
              setVisualIdentity((prev) => ({ ...prev, audienceDescription: e.target.value }))
            }
            placeholder="Ej: Emprendedores y profesionales jóvenes de 25 a 40 años"
            className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ─── BOTÓN DE GUARDAR ─────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-3 text-sm"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Guardando ADN Visual…</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>Guardar Identidad Visual</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
