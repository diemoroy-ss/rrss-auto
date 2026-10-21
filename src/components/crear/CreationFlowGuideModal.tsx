"use client";

import React, { useState } from "react";

export type FlowType = "estandar" | "afiche" | "laboratorio";

interface CreationFlowGuideModalProps {
  initialFlow?: FlowType | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectFlow: (flow: FlowType) => void;
}

interface FlowGuideDetail {
  id: FlowType;
  title: string;
  badge: string;
  tagline: string;
  emoji: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  btnGradient: string;
  whatIsIt: string;
  whenToUse: string[];
  steps: {
    num: string;
    title: string;
    desc: string;
    emoji: string;
  }[];
  proTip: string;
}

const FLOW_DETAILS: Record<FlowType, FlowGuideDetail> = {
  estandar: {
    id: "estandar",
    title: "Publicación Estándar",
    badge: "Fotografía & Video Limpio",
    tagline: "Fotografía comercial, historias o Reels sin texto gráfico montado en la imagen",
    emoji: "✨",
    accentBg: "bg-indigo-50",
    accentBorder: "border-indigo-200",
    accentText: "text-indigo-700",
    btnGradient: "from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700",
    whatIsIt:
      "Es el formato clásico para redes sociales: fotografías publicitarias de alta calidad, imágenes estilo estudio o Reels cinematográficos. La imagen no lleva letras ni números impresos; todo el mensaje persuasivo, precios y hashtags van redactados directamente en el copy del pie de foto.",
    whenToUse: [
      "Fotos de producto con estética editorial o estudio fotográfico profesional.",
      "Imágenes conceptuales y lifestyle de personas usando tu servicio.",
      "Reels de Instagram y TikTok con portada generada y locución de audio.",
      "Cuando quieres que la imagen hable por sí sola y el cliente lea la descripción.",
    ],
    steps: [
      {
        num: "1",
        emoji: "📐",
        title: "Elige el formato de publicación",
        desc: "Selecciona Post (cuadrado 1:1 o vertical 4:5), Historia (9:16 vertical) o Reel de video.",
      },
      {
        num: "2",
        emoji: "📸",
        title: "Describe la escena o sube tu foto",
        desc: "Indica a nuestros agentes qué deseas mostrar (o selecciona un producto de tu catálogo) para generar la imagen de referencia.",
      },
      {
        num: "3",
        emoji: "✍️",
        title: "Redacta el copy con nuestros agentes y publica",
        desc: "Nuestros agentes preparan el texto persuasive adaptado a cada red social y agendan o publican tu post.",
      },
    ],
    proTip:
      "Ideal para publicaciones diarias de interacción, branding y contenido estético donde buscas un look limpio y profesional sin saturar la foto con promociones gráficas.",
  },
  afiche: {
    id: "afiche",
    title: "Afiche / Diseño con Textos",
    badge: "Flyer Comercial con Tipografía",
    tagline: "Flyers publicitarios con titulares, precios y llamados a la acción integrados en la imagen",
    emoji: "🎯",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    accentText: "text-amber-800",
    btnGradient: "from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700",
    whatIsIt:
      "Diseña carteles publicitarios y flyers comerciales completos. Nuestros agentes imprimen titulares llamativos, badges de oferta, precios destacados y botones de llamada a la acción directamente sobre el diseño visual con tipografía comercial nítida.",
    whenToUse: [
      "Promociones de venta directa, ofertas de temporada (Cyber, 50% OFF, 2x1).",
      "Lanzamiento de nuevos productos o servicios con precio a la vista.",
      "Flyers para historias de WhatsApp e Instagram que deben capturar la atención en 1 segundo.",
      "Carruseles comerciales de 2 a 5 láminas con textos y precios independientes por lámina.",
    ],
    steps: [
      {
        num: "1",
        emoji: "🔤",
        title: "Configura los textos del cartel",
        desc: "Escribe tu titular principal, precio/oferta, badge superior y botón de acción (CTA).",
      },
      {
        num: "2",
        emoji: "📦",
        title: "Sube tu producto o describe la escena",
        desc: "Sube la foto real de tu producto (con opción de retocarla o mantenerla original) o deja que nuestros agentes compongan la escena.",
      },
      {
        num: "3",
        emoji: "👁️",
        title: "Revisa la previsualización en vivo",
        desc: "Mira la maqueta tipográfica y la imagen final generada directamente en la card de Composición antes de publicar.",
      },
    ],
    proTip:
      "Si creas un carrusel de 5 láminas, puedes generar lámina por lámina o generar las 5 de golpe. Al final, nuestros agentes redactarán un copy global que conecta toda la historia.",
  },
  laboratorio: {
    id: "laboratorio",
    title: "Laboratorio (Mixboard)",
    badge: "Fusión Visual & Blueprints",
    tagline: "Diseño publicitario avanzado con arquitectura Google Mixboard, grillas y retoque en vivo",
    emoji: "🧪",
    accentBg: "bg-purple-50",
    accentBorder: "border-purple-200",
    accentText: "text-purple-800",
    btnGradient: "from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
    whatIsIt:
      "Inspirado en la tecnología de Google Mixboard sobre Gemini. Este modo combina múltiples insumos visuales: estructura prompts maestros con grilla y coordenadas tipográficas ('TYPOGRAPHY & LAYOUT'), fusiona tu producto real con una imagen de inspiración estética, ancla la línea gráfica del Slide 1 en carruseles y permite retocar el cartel en vivo sobre el lienzo.",
    whenToUse: [
      "Carteles publicitarios de nivel agencia con diseño gráfico y composición milimétrica.",
      "Cuando tienes una foto de tu producto y quieres fusionarla dentro de un estilo visual específico.",
      "Carruseles de 5 láminas donde necesitas que cada lámina tenga una imagen nueva pero con idéntica paleta y tipografía.",
      "Cuando quieres afinar o retocar un diseño ya generado sin tener que partir desde cero.",
    ],
    steps: [
      {
        num: "1",
        emoji: "🧬",
        title: "Estructura el Blueprint con Agentes",
        desc: "Elige un preset (Dark SaaS, Retail, Editorial...) y nuestros agentes generan el layout técnico rellenando los textos del cartel automáticamente.",
      },
      {
        num: "2",
        emoji: "🎨",
        title: "Fusión Multi-Imagen (Producto + Estilo)",
        desc: "Sube tu producto real y opcionalmente un afiche de inspiración estética que nuestros agentes imitarán en colores y luz.",
      },
      {
        num: "3",
        emoji: "🔗",
        title: "Anclaje de Estilo en Carruseles",
        desc: "En Slides 2 al 5, activa el anclaje de línea gráfica para mantener idéntica paleta y tipografía del Slide 1 en todas las láminas.",
      },
      {
        num: "4",
        emoji: "⚡",
        title: "Retoque en Vivo sobre el Lienzo",
        desc: "Ajusta detalles puntuales ('oscurece el fondo', 'más contraste') en la barra inferior del preview sin rehacer el diseño.",
      },
    ],
    proTip:
      "Usa el botón 'Estructurar Blueprint con Agentes' en el Slide 1: obtendrás un diseño de altísimo impacto visual en segundos que servirá de ancla perfecta para el resto de tus diapositivas.",
  },
};

export default function CreationFlowGuideModal({
  initialFlow = "estandar",
  isOpen,
  onClose,
  onSelectFlow,
}: CreationFlowGuideModalProps) {
  const [activeTab, setActiveTab] = useState<FlowType>(initialFlow || "estandar");

  if (!isOpen) return null;

  const currentDetail = FLOW_DETAILS[activeTab] || FLOW_DETAILS.estandar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-600/20">
              💡
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight leading-none">
                Guía de Creación: ¿Cómo funciona cada modo?
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Conoce las diferencias y elige el flujo ideal para tu publicación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            aria-label="Cerrar guía"
          >
            ✕
          </button>
        </div>

        {/* Selector de Pestañas entre los 3 Modos */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200/80 flex gap-2 overflow-x-auto custom-scrollbar">
          {(["estandar", "afiche", "laboratorio"] as FlowType[]).map((tab) => {
            const detail = FLOW_DETAILS[tab];
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 scale-102"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                }`}
              >
                <span>{detail.emoji}</span>
                <span className="truncate">{detail.title}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido Dinámico con Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Banner de Presentación del Modo */}
          <div className={`${currentDetail.accentBg} border-2 ${currentDetail.accentBorder} rounded-2xl p-5 space-y-2`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white ${currentDetail.accentText} border ${currentDetail.accentBorder} shadow-2xs`}>
                {currentDetail.badge}
              </span>
              <span className="text-xl">{currentDetail.emoji}</span>
            </div>
            <h4 className="text-base font-black text-slate-900">
              {currentDetail.title}
            </h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {currentDetail.whatIsIt}
            </p>
          </div>

          {/* Cuándo Usarlo */}
          <div>
            <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
              <span>🎯</span> ¿Cuándo conviene usar este modo?
            </h5>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {currentDetail.whenToUse.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium leading-relaxed flex items-start gap-2"
                >
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flujo Paso a Paso */}
          <div>
            <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
              <span>🪜</span> Flujo de trabajo paso a paso
            </h5>
            <div className="space-y-2.5">
              {currentDetail.steps.map((st) => (
                <div
                  key={st.num}
                  className="p-3.5 bg-white border border-slate-200/90 rounded-2xl flex items-start gap-3 shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                    {st.num}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>{st.emoji}</span>
                      <span>{st.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                      {st.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consejo de Nuestros Agentes */}
          <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-1 shadow-md">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-wider">
              <span>💡</span> Consejo de Nuestros Agentes
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {currentDetail.proTip}
            </p>
          </div>
        </div>

        {/* Footer con Botón de Acción */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cerrar Guía
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectFlow(activeTab);
              onClose();
            }}
            className={`bg-gradient-to-r ${currentDetail.btnGradient} text-white font-black text-xs uppercase tracking-wider py-3 px-6 rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-102`}
          >
            <span>🚀</span>
            <span>Comenzar en {currentDetail.title}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
