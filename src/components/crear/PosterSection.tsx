"use client";

import React, { useState } from "react";
import type { PosterConfig, VisualStyle, ContactType } from "../../types/poster";

// -------------------------------------------------------
// Tipos y constantes
// -------------------------------------------------------
const VISUAL_STYLES: { id: VisualStyle; emoji: string; desc: string }[] = [
  { id: "Moderno",      emoji: "🔷", desc: "Líneas limpias, tipografía fuerte" },
  { id: "Minimalista",  emoji: "⬜", desc: "Menos es más, mucho espacio" },
  { id: "Llamativo",    emoji: "🎨", desc: "Colores vibrantes, impacto visual" },
  { id: "Elegante",     emoji: "✨", desc: "Lujo, premium, sobrio" },
  { id: "Profesional",  emoji: "💼", desc: "Corporativo, confianza" },
  { id: "Vibrante",     emoji: "🌈", desc: "Energético, dinámico, joven" },
];

const CTA_OPTIONS = [
  "¡Contáctanos ahora!",
  "Reserva tu hora",
  "Ver más información",
  "¡Aprovecha esta oferta!",
  "¡Compra ahora!",
  "Escríbenos por WhatsApp",
  "Visítanos hoy",
  "Personalizado...",
];

interface PosterSectionProps {
  config: PosterConfig;
  setConfig: (config: PosterConfig) => void;
  profileLogoUrl?: string;
  profileName?: string;
  profilePhone?: string;
  profileEmail?: string;
}

// -------------------------------------------------------
// Componente PosterSection — sección inline desplegable
// -------------------------------------------------------
export default function PosterSection({
  config,
  setConfig,
  profileLogoUrl,
  profileName,
  profilePhone,
  profileEmail,
}: PosterSectionProps) {
  const [customCta, setCustomCta] = useState("");
  const [showCustomCta, setShowCustomCta] = useState(false);

  const update = <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) => {
    setConfig({ ...config, [key]: value });
  };

  const handleCtaSelect = (val: string) => {
    if (val === "Personalizado...") {
      setShowCustomCta(true);
      update("ctaText", customCta);
    } else {
      setShowCustomCta(false);
      update("ctaText", val);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-top-4 fade-in">

      {/* TOGGLE HEADER */}
      <button
        type="button"
        onClick={() => update("enabled", !config.enabled)}
        className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 ${
          config.enabled
            ? "border-amber-400 bg-amber-50 shadow-md shadow-amber-100"
            : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-slate-100/70"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div className="text-left">
            <p className={`text-sm font-black tracking-tight ${config.enabled ? "text-amber-800" : "text-slate-700"}`}>
              Generar como Cartel Publicitario
            </p>
            <p className={`text-xs font-medium mt-0.5 ${config.enabled ? "text-amber-600" : "text-slate-400"}`}>
              Incluye logo, precios, contacto y más en el diseño
            </p>
          </div>
        </div>
        {/* Toggle pill */}
        <div className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${config.enabled ? "bg-amber-500" : "bg-slate-200"}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${config.enabled ? "left-7" : "left-1"}`} />
        </div>
      </button>

      {/* SECCIÓN EXPANDIBLE — Solo visible si enabled */}
      {config.enabled && (
        <div className="space-y-6 pl-1">

          {/* ESTILO VISUAL */}
          <div>
            <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">
              Estilo Visual del Cartel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VISUAL_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => update("visualStyle", style.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                    config.visualStyle === style.id
                      ? "border-amber-400 bg-amber-50 shadow-sm"
                      : "border-slate-100 bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <span className="text-lg">{style.emoji}</span>
                  <p className={`text-[11px] font-black mt-1 ${config.visualStyle === style.id ? "text-amber-700" : "text-slate-700"}`}>
                    {style.id}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 leading-tight">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ELEMENTOS DEL CARTEL */}
          <div>
            <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">
              Elementos a incluir en el cartel
            </label>
            <div className="space-y-2">

              {/* Logo */}
              {profileLogoUrl && (
                <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-amber-200 hover:bg-amber-50/30 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={config.includeLogo}
                    onChange={(e) => update("includeLogo", e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <img src={profileLogoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain border border-slate-200 bg-white" />
                  <span className="text-sm font-bold text-slate-700">Logo del negocio</span>
                  <span className="ml-auto text-[10px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-full">Guardado ✓</span>
                </label>
              )}

              {/* Nombre del negocio */}
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-amber-200 hover:bg-amber-50/30 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={config.includeBusinessName}
                  onChange={(e) => {
                    update("includeBusinessName", e.target.checked);
                    if (e.target.checked && profileName) update("businessName", profileName);
                  }}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="text-lg">🏢</span>
                <span className="text-sm font-bold text-slate-700">Nombre del negocio</span>
                {config.includeBusinessName && (
                  <input
                    type="text"
                    value={config.businessName || profileName || ""}
                    onChange={(e) => update("businessName", e.target.value)}
                    placeholder="Nombre del negocio"
                    className="ml-auto w-40 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </label>

              {/* Precio / Promoción */}
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-amber-200 hover:bg-amber-50/30 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={config.includePrice}
                  onChange={(e) => update("includePrice", e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="text-lg">💲</span>
                <span className="text-sm font-bold text-slate-700">Precio / Promoción</span>
                {config.includePrice && (
                  <input
                    type="text"
                    value={config.priceText || ""}
                    onChange={(e) => update("priceText", e.target.value)}
                    placeholder='Ej: "50% OFF · Desde $9.990"'
                    className="ml-auto w-48 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </label>

              {/* Contacto */}
              <label className="flex flex-col gap-2 p-3 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-amber-200 hover:bg-amber-50/30 cursor-pointer transition-all">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.includeContact}
                    onChange={(e) => {
                      update("includeContact", e.target.checked);
                      if (e.target.checked) {
                        if (profilePhone) { update("contactType", "whatsapp"); update("contactValue", profilePhone); }
                        else if (profileEmail) { update("contactType", "email"); update("contactValue", profileEmail); }
                      }
                    }}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span className="text-lg">📱</span>
                  <span className="text-sm font-bold text-slate-700">Datos de contacto</span>
                </div>
                {config.includeContact && (
                  <div className="flex gap-2 pl-7" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={config.contactType || "whatsapp"}
                      onChange={(e) => update("contactType", e.target.value as ContactType)}
                      className="bg-white border border-slate-200 px-2 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-300"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="phone">Teléfono</option>
                      <option value="email">Email</option>
                    </select>
                    <input
                      type="text"
                      value={config.contactValue || ""}
                      onChange={(e) => update("contactValue", e.target.value)}
                      placeholder={config.contactType === "email" ? "correo@negocio.cl" : "+56 9 1234 5678"}
                      className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                )}
              </label>

              {/* Slogan */}
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-amber-200 hover:bg-amber-50/30 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={config.includeSlogan}
                  onChange={(e) => update("includeSlogan", e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="text-lg">💬</span>
                <span className="text-sm font-bold text-slate-700">Slogan / Frase gancho</span>
                {config.includeSlogan && (
                  <input
                    type="text"
                    value={config.sloganText || ""}
                    onChange={(e) => update("sloganText", e.target.value)}
                    placeholder='Ej: "Calidad que se nota"'
                    className="ml-auto w-44 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </label>

              {/* Color principal */}
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-amber-200 hover:bg-amber-50/30 cursor-pointer transition-all">
                <span className="text-lg">🎨</span>
                <span className="text-sm font-bold text-slate-700">Color principal del negocio</span>
                <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="color"
                    value={config.primaryColor || "#6366f1"}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
                    title="Selecciona el color principal"
                  />
                  <span className="text-xs font-bold text-slate-500 uppercase">{config.primaryColor || "#6366f1"}</span>
                </div>
              </label>
            </div>
          </div>

          {/* CTA */}
          <div>
            <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">
              Llamado a la Acción (CTA)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CTA_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleCtaSelect(opt)}
                  className={`text-left p-3 rounded-xl border-2 text-xs font-bold transition-all duration-200 ${
                    (opt === "Personalizado..." ? showCustomCta : config.ctaText === opt)
                      ? "border-amber-400 bg-amber-50 text-amber-700 shadow-sm"
                      : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showCustomCta && (
              <input
                type="text"
                value={customCta}
                onChange={(e) => { setCustomCta(e.target.value); update("ctaText", e.target.value); }}
                placeholder="Escribe tu llamado a la acción..."
                className="mt-2 w-full bg-white border-2 border-amber-300 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-300"
              />
            )}
          </div>

          {/* NOTAS ADICIONALES */}
          <div>
            <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">
              Instrucciones adicionales para el diseñador IA (opcional)
            </label>
            <textarea
              value={config.additionalNotes || ""}
              onChange={(e) => update("additionalNotes", e.target.value)}
              placeholder="Ej: El fondo debe ser oscuro, sin mucho texto, que se vea lujoso..."
              className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-300/20 focus:border-amber-300 resize-none min-h-[80px] transition-all"
            />
          </div>
        </div>
      )}
    </div>
  );
}
