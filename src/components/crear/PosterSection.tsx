"use client";

import React, { useState } from "react";
import type { PosterConfig, VisualStyle, ContactType } from "../../types/poster";

const VISUAL_STYLES: { id: VisualStyle; emoji: string; desc: string }[] = [
  { id: "Moderno",      emoji: "🔷", desc: "Líneas limpias, tipografía fuerte" },
  { id: "Minimalista",  emoji: "⬜", desc: "Menos es más, mucho espacio" },
  { id: "Llamativo",    emoji: "🎨", desc: "Colores vibrantes, impacto" },
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
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleToggle = () => {
    const nextState = !config.enabled;
    update("enabled", nextState);
    if (nextState) {
      setIsModalOpen(true);
    }
  };

  // Determinar qué valores se han configurado para mostrarlos en el resumen
  const hasConfiguredOptions = config.enabled && (
    config.includeLogo || 
    config.includeBusinessName || 
    config.includePrice || 
    config.includeContact || 
    config.includeSlogan || 
    config.ctaText || 
    config.visualStyle || 
    config.additionalNotes
  );

  return (
    <div className="w-full bg-white border border-slate-200/85 rounded-[28px] p-6 shadow-sm mb-8 animate-in slide-in-from-top-4 fade-in">
      {/* TOGGLE HEADER CON ACTIVACIÓN Y APERTURA DE MODAL */}
      <div
        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
          config.enabled
            ? "border-amber-400 bg-amber-50/70"
            : "border-slate-100 bg-slate-50 hover:border-slate-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div className="text-left">
            <p className="text-sm font-black tracking-tight text-slate-800">
              ¿Será un cartel publicitario?
            </p>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Si se activa, el bot diseñará un flyer/cartel optimizado con tus datos del perfil
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {config.enabled && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-800 text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              ⚙️ Configurar Cartel
            </button>
          )}
          <button
            type="button"
            onClick={handleToggle}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${config.enabled ? "bg-amber-500" : "bg-slate-200"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${config.enabled ? "left-7" : "left-1"}`} />
          </button>
        </div>
      </div>

      {/* RESUMEN DE OPCIONES CONFIGURADAS */}
      {config.enabled && hasConfiguredOptions && (
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 animate-in fade-in duration-300">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">📋 Configuración activa del cartel:</p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1 shadow-sm">
              📐 Disposición:{" "}
              <strong className="text-indigo-600 font-bold">
                {!config.layout || config.layout === "auto"
                  ? "🧠 Auto (Nuestros Agentes)"
                  : config.layout === "split_left"
                  ? "Split Lateral"
                  : config.layout === "recipe_ingredients"
                  ? "Ficha con Ingredientes"
                  : "Cabecera Superior"}
              </strong>
            </span>
            {config.visualStyle && (
              <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1 shadow-sm">
                🎨 Estilo: <strong className="text-slate-800">{config.visualStyle}</strong>
              </span>
            )}
            {config.includeLogo && profileLogoUrl && (
              <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1 shadow-sm">
                🖼️ Logo Incluido
              </span>
            )}
            {config.includeBusinessName && config.businessName && (
              <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1 shadow-sm">
                🏢 Negocio: <strong className="text-slate-800">{config.businessName}</strong>
              </span>
            )}
            {config.includeMainText && config.mainText && (
              <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1 shadow-sm">
                📝 Texto Principal: <strong className="text-slate-800">{config.mainText}</strong>
              </span>
            )}
            {config.includePrice && config.priceText && (
              <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1 shadow-sm">
                💲 Promoción: <strong className="text-slate-800">{config.priceText}</strong>
              </span>
            )}
            {config.includeContact && config.contactValue && (
              <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1 shadow-sm">
                📱 Contacto: <strong className="text-slate-800">{config.contactValue} ({config.contactType})</strong>
              </span>
            )}
            {config.includeSlogan && config.sloganText && (
              <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1 shadow-sm">
                💬 Slogan: <strong className="text-slate-800">"{config.sloganText}"</strong>
              </span>
            )}
            {config.ctaText && (
              <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl flex items-center gap-1 shadow-sm">
                📣 CTA: <strong className="text-slate-800">"{config.ctaText}"</strong>
              </span>
            )}
            {config.additionalNotes && (
              <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl w-full flex flex-col gap-0.5 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Notas extras:</span>
                <strong className="text-slate-700 font-medium italic">"{config.additionalNotes}"</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* MODAL EXPANDIDO A PANTALLA COMPLETA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 md:p-10 animate-in zoom-in duration-300 space-y-6 flex flex-col justify-between">
            
            {/* Header del Modal */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎨</span>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Configuración del Cartel Publicitario</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Define los elementos visuales que tendrá el flyer</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 transition-colors"
              >
                Listo
              </button>
            </div>

            {/* Grid de Configuración */}
            <div className="grid md:grid-cols-12 gap-8 py-2 overflow-y-auto">
              {/* Col 1: Datos y Elementos */}
              <div className="md:col-span-6 space-y-4">
                <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest">
                  Elementos a incluir en el diseño
                </label>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer transition-all hover:bg-slate-100/50">
                    <input
                      type="checkbox"
                      checked={config.includeBusinessName}
                      onChange={(e) => {
                        update("includeBusinessName", e.target.checked);
                        if (e.target.checked && profileName) update("businessName", profileName);
                      }}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span className="text-sm">🏢</span>
                    <span className="text-xs font-bold text-slate-700">Nombre del negocio</span>
                    {config.includeBusinessName && (
                      <input
                        type="text"
                        value={config.businessName || profileName || ""}
                        onChange={(e) => update("businessName", e.target.value)}
                        className="ml-auto w-36 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-slate-700 outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer transition-all hover:bg-slate-100/50">
                    <input
                      type="checkbox"
                      checked={config.includeMainText}
                      onChange={(e) => update("includeMainText", e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span className="text-sm">📝</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">Texto Principal del Cartel</span>
                      <span className="text-[9px] text-slate-400 font-medium leading-tight max-w-[180px]">Este texto será impreso en el diseño. La IA no inventará frases.</span>
                    </div>
                    {config.includeMainText && (
                      <input
                        type="text"
                        value={config.mainText || ""}
                        onChange={(e) => update("mainText", e.target.value)}
                        placeholder='Ej: "Gran Apertura"'
                        className="ml-auto w-36 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-slate-700 outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer transition-all hover:bg-slate-100/50">
                    <input
                      type="checkbox"
                      checked={config.includePrice}
                      onChange={(e) => update("includePrice", e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span className="text-sm">💲</span>
                    <span className="text-xs font-bold text-slate-700">Precio / Promoción</span>
                    {config.includePrice && (
                      <input
                        type="text"
                        value={config.priceText || ""}
                        onChange={(e) => update("priceText", e.target.value)}
                        placeholder='Ej: "50% OFF"'
                        className="ml-auto w-36 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-slate-700 outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </label>

                  <label className="flex flex-col gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer transition-all hover:bg-slate-100/50">
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
                      <span className="text-sm">📱</span>
                      <span className="text-xs font-bold text-slate-700">Datos de contacto</span>
                    </div>
                    {config.includeContact && (
                      <div className="flex gap-2 pl-7" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={config.contactType || "whatsapp"}
                          onChange={(e) => update("contactType", e.target.value as ContactType)}
                          className="bg-white border border-slate-200 px-1 py-1 rounded-lg text-xs font-bold text-slate-700"
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="phone">Teléfono</option>
                          <option value="email">Email</option>
                        </select>
                        <input
                          type="text"
                          value={config.contactValue || ""}
                          onChange={(e) => update("contactValue", e.target.value)}
                          className="flex-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-slate-700"
                        />
                      </div>
                    )}
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer transition-all hover:bg-slate-100/50">
                    <input
                      type="checkbox"
                      checked={config.includeSlogan}
                      onChange={(e) => update("includeSlogan", e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span className="text-sm">💬</span>
                    <span className="text-xs font-bold text-slate-700">Slogan / Frase gancho</span>
                    {config.includeSlogan && (
                      <input
                        type="text"
                        value={config.sloganText || ""}
                        onChange={(e) => update("sloganText", e.target.value)}
                        className="ml-auto w-36 bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-slate-700 outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 cursor-pointer transition-all hover:bg-slate-100/50">
                    <span className="text-sm">🎨</span>
                    <span className="text-xs font-bold text-slate-700">Color principal</span>
                    <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="color"
                        value={config.primaryColor || "#6366f1"}
                        onChange={(e) => update("primaryColor", e.target.value)}
                        className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-500">{config.primaryColor || "#6366f1"}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Col 2: Estilos, CTA y Notas */}
              <div className="md:col-span-6 space-y-5">
                {/* 🎯 Dirección de Arte / Disposición Visual */}
                <div>
                  <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center justify-between">
                    <span>🎯 Disposición del Cartel (Dirección de Arte)</span>
                    <span className="text-[9px] text-indigo-600 font-bold">Nuestros Agentes</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => update("layout", "auto")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        (!config.layout || config.layout === "auto")
                          ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm"
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">🧠</span>
                        <span className="text-xs font-black">Automático (Agentes)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">
                        Nuestros agentes eligen el mejor encuadre según tu producto.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => update("layout", "split_left")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        config.layout === "split_left"
                          ? "border-amber-500 bg-amber-50 text-amber-900 shadow-sm"
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">📐</span>
                        <span className="text-xs font-black">Split Lateral</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">
                        Texto a la izquierda, plato despejado a la derecha.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => update("layout", "top_banner")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        config.layout === "top_banner"
                          ? "border-amber-500 bg-amber-50 text-amber-900 shadow-sm"
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">📌</span>
                        <span className="text-xs font-black">Cabecera Superior</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">
                        Titular arriba, plato centrado limpio.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => update("layout", "recipe_ingredients")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        config.layout === "recipe_ingredients"
                          ? "border-amber-500 bg-amber-50 text-amber-900 shadow-sm"
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">🥗</span>
                        <span className="text-xs font-black">Ficha con Ingredientes</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">
                        Tira de ingredientes con iconos y cantidades.
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">
                    Estilo visual del cartel
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {VISUAL_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => update("visualStyle", style.id)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          config.visualStyle === style.id
                            ? "border-amber-400 bg-amber-50 text-amber-800"
                            : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                        }`}
                      >
                        <span className="text-md block">{style.emoji}</span>
                        <span className="text-[10px] font-black">{style.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">
                    Llamado a la Acción (CTA)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CTA_OPTIONS.slice(0, 6).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleCtaSelect(opt)}
                        className={`p-2 rounded-lg border text-[11px] font-bold text-left transition-all ${
                          (!showCustomCta && config.ctaText === opt)
                            ? "border-amber-400 bg-amber-50 text-amber-800"
                            : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleCtaSelect("Personalizado...")}
                      className={`p-2 rounded-lg border text-[11px] font-bold text-left transition-all ${
                        showCustomCta
                          ? "border-amber-400 bg-amber-50 text-amber-800"
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      Otro / Personalizado
                    </button>
                  </div>
                  {showCustomCta && (
                    <input
                      type="text"
                      value={customCta}
                      onChange={(e) => { setCustomCta(e.target.value); update("ctaText", e.target.value); }}
                      placeholder="Escribe tu llamado a la acción..."
                      className="mt-2 w-full bg-white border border-amber-300 px-3 py-2 rounded-xl text-xs font-bold outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">
                    Indicaciones de diseño extras
                  </label>
                  <textarea
                    value={config.additionalNotes || ""}
                    onChange={(e) => update("additionalNotes", e.target.value)}
                    placeholder="Instrucciones para la composición del diseño..."
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-amber-300 resize-none min-h-[60px]"
                  />
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex gap-4 pt-4 border-t border-slate-100 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-black px-8 py-3 rounded-2xl transition-all shadow-lg shadow-amber-600/20 text-xs"
              >
                Aceptar y Guardar Configuración
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
