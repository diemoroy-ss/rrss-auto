"use client";

import { useState } from "react";
import { FaExpand, FaCheck, FaTimes } from "react-icons/fa";
import { Plan14DayItem } from "../../types/demo-plan";

interface Plan14DayViewerProps {
  plan14Days: Plan14DayItem[];
  businessName: string;
  rubro?: string;
  demoId?: string;
  showWatermark?: boolean;
  onDayRendered?: (dayItem: Plan14DayItem) => void;
  isPublicClientView?: boolean;
}

function WatermarkBadge({ text = "SOCIALPILOT · PLAN DEMO" }: { text?: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-between p-3">
      <div className="flex justify-end">
        <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white font-mono text-[9px] tracking-wider uppercase shadow-md flex items-center gap-1 opacity-90">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          MUESTRA DEMO
        </span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center -rotate-[24deg] opacity-25">
        <p className="font-black uppercase tracking-[0.2em] text-white text-sm sm:text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
          {text}
        </p>
      </div>
    </div>
  );
}

export default function Plan14DayViewer({
  plan14Days,
  businessName,
  rubro = "Comercio Local",
  demoId,
  showWatermark = true,
  onDayRendered,
  isPublicClientView = false,
}: Plan14DayViewerProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [filterType, setFilterType] = useState<"all" | "promo" | "with_text" | "without_text">("all");
  const [activeTab, setActiveTab] = useState<"feed" | "story" | "art_direction" | "niche">("feed");
  const [renderingDayNumber, setRenderingDayNumber] = useState<number | null>(null);
  const [fullscreenImageModal, setFullscreenImageModal] = useState<string | null>(null);
  const [copiedCopy, setCopiedCopy] = useState<boolean>(false);

  const days = plan14Days || [];
  const filteredDays = days.filter((item) => {
    if (filterType === "promo") return item.post?.isPromo;
    if (filterType === "with_text") return item.post?.hasText;
    if (filterType === "without_text") return !item.post?.hasText;
    return true;
  });

  const activeItem = days.find((d) => d.day === selectedDay) || days[0];

  const handleRenderDayNow = async (dayNumber: number) => {
    if (!demoId || renderingDayNumber !== null) return;
    setRenderingDayNumber(dayNumber);
    try {
      const res = await fetch(`/api/public/muestras/${encodeURIComponent(demoId)}/render-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo renderizar la imagen.");
      }
      if (onDayRendered && data.dayItem) {
        onDayRendered(data.dayItem);
      }
    } catch (err: any) {
      console.error("Error renderizando día:", err);
      alert(err?.message || "Ocurrió un error al renderizar la imagen.");
    } finally {
      setRenderingDayNumber(null);
    }
  };

  if (!activeItem) return null;

  return (
    <div className="space-y-6">
      {/* BANNER DE INTELIGENCIA DE NICHO */}
      <section className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-50 via-orange-50/60 to-amber-50/50 border border-rose-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">📡</span>
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
                Radar de Nicho Activo: {rubro}
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-xs text-slate-700 font-medium max-w-3xl leading-relaxed">
              Nuestros agentes estructuraron este ciclo de 14 días con alternancia estratégica entre <strong>publicaciones de cartel comercial hacia WhatsApp</strong> y <strong>fotografías de apetito visual</strong>, combinadas con historias interactivas diarias en horas de alto tráfico.
            </p>
          </div>

          {/* MÉTRICAS DEL PLAN */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-white border border-rose-100 p-2.5 rounded-2xl text-center shadow-xs">
              <div className="text-base font-black text-rose-600">{days.length}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Posts de Feed</div>
            </div>
            <div className="bg-white border border-rose-100 p-2.5 rounded-2xl text-center shadow-xs">
              <div className="text-base font-black text-amber-600">{days.length}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Historias 9:16</div>
            </div>
            <div className="bg-white border border-rose-100 p-2.5 rounded-2xl text-center shadow-xs">
              <div className="text-base font-black text-indigo-600">
                {days.filter(d => d.post?.isPromo).length}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Promociones</div>
            </div>
            <div className="bg-white border border-rose-100 p-2.5 rounded-2xl text-center shadow-xs">
              <div className="text-base font-black text-emerald-600">100%</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tono Humano</div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTROS Y SELECTOR DE DÍAS (1 al 14) */}
      <section className="space-y-4">
        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold scrollbar-none">
            <span className="text-[11px] text-slate-500 mr-2 shrink-0">Filtrar por:</span>
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                filterType === "all" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Todos los 14 Días
            </button>
            <button
              type="button"
              onClick={() => setFilterType("promo")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                filterType === "promo" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              🔥 Solo Promociones ({days.filter((i) => i.post?.isPromo).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("with_text")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                filterType === "with_text" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              🏷️ Con Cartel ({days.filter((i) => i.post?.hasText).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("without_text")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                filterType === "without_text" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              📸 Fotografía Limpia ({days.filter((i) => !i.post?.hasText).length})
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Selecciona un día para ver su post de feed e historia
          </div>
        </div>

        {/* Cinta de días 1 al 14 */}
        <div className="grid grid-cols-2 sm:grid-cols-7 lg:grid-cols-14 gap-2">
          {filteredDays.map((item) => {
            const isSelected = item.day === selectedDay;
            return (
              <button
                key={item.day}
                type="button"
                onClick={() => setSelectedDay(item.day)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between select-none ${
                  isSelected
                    ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/30 scale-102"
                    : "bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 text-slate-800 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase ${isSelected ? "text-rose-100" : "text-slate-400"}`}>
                    Día {item.day}
                  </span>
                  <span className="text-xs">{item.post?.isPromo ? "🔥" : "✨"}</span>
                </div>
                <div className="mt-1">
                  <div className={`text-xs font-black truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {item.weekday}
                  </div>
                  <div className={`text-[9px] font-bold truncate mt-0.5 ${isSelected ? "text-rose-100" : "text-slate-500"}`}>
                    {item.post?.isRendered ? "✓ Listo" : "🏷️ Pauta"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* DETALLE DEL DÍA SELECCIONADO */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
        {/* Header del Día */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white tracking-wide uppercase shadow-xs">
                Día {activeItem.day} · {activeItem.weekday}
              </span>
              {activeItem.post?.isPromo && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 uppercase">
                  🔥 Promoción Comercial
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {activeItem.post?.hasText ? "🏷️ Imagen CON Cartel Publicitario" : "📸 Fotografía Limpia Sin Texto"}
              </span>
              {activeItem.post?.isRendered ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ Imagen HD Lista
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  ✨ Lista para renderizar
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              {activeItem.post?.headline || activeItem.post?.productName}
            </h2>
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
              <span className="font-bold">🎯 Oportunidad detectada por nuestros agentes:</span>
              <span className="italic text-slate-700">{activeItem.nicheTrend}</span>
            </p>
          </div>

          {/* Selector de pestañas internas del día */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold self-start lg:self-center">
            <button
              type="button"
              onClick={() => setActiveTab("feed")}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "feed" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📸 Post de Feed
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("story")}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "story" ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📱 Historia (Story)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("art_direction")}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "art_direction" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🎨 Dirección de Arte
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("niche")}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "niche" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📡 Radar de Nicho
            </button>
          </div>
        </div>

        {/* PESTAÑA: POST DE FEED */}
        {activeTab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Mockup del Feed (Columna Izquierda 5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-orange-400 flex items-center justify-center font-bold text-xs text-white uppercase">
                      {businessName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 truncate max-w-[180px]">
                        {businessName.toLowerCase().replace(/\s+/g, "")}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                        {businessName} · {rubro}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">•••</span>
                </div>

                {/* Imagen de la publicación */}
                {activeItem.post?.isRendered && activeItem.post?.imageUrl ? (
                  <div
                    className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group cursor-pointer"
                    onClick={() => setFullscreenImageModal(activeItem.post.imageUrl || null)}
                  >
                    <img
                      src={activeItem.post.imageUrl}
                      alt={activeItem.post.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {showWatermark && <WatermarkBadge />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 pointer-events-none">
                      <FaExpand /> <span>Ver en alta resolución</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/40 p-5 flex flex-col justify-between text-center relative overflow-hidden">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-white border border-rose-200 px-2 py-0.5 rounded-full inline-block">
                        Pauta de Dirección de Arte
                      </span>
                      <h4 className="text-sm font-black text-slate-900 line-clamp-2 mt-1">
                        {activeItem.post?.headline || activeItem.post?.productName}
                      </h4>
                      {activeItem.post?.price && (
                        <div className="text-xs font-bold text-rose-600">
                          Precio de oferta: {activeItem.post.price}
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 italic bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-rose-100 leading-relaxed text-left line-clamp-4">
                      &quot;{activeItem.post?.compositionDirective || "Composición publicitaria gastronómica de alta fidelidad."}&quot;
                    </p>

                    {demoId ? (
                      <button
                        type="button"
                        disabled={renderingDayNumber === activeItem.day}
                        onClick={() => handleRenderDayNow(activeItem.day)}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-black shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {renderingDayNumber === activeItem.day ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                            <span>Renderizando imagen comercial...</span>
                          </>
                        ) : (
                          <>
                            <span>✨</span>
                            <span>Renderizar imagen de este día ahora</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="text-[10px] text-slate-400 font-medium">
                        Imagen lista para renderizar en demo guardada
                      </div>
                    )}
                  </div>
                )}

                {/* Barra de Interacciones */}
                <div className="flex items-center justify-between text-slate-600 pt-1 px-1">
                  <div className="flex items-center gap-3 text-lg">
                    <span>❤️</span>
                    <span>💬</span>
                    <span>↗️</span>
                  </div>
                  <span>🔖</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 text-center font-medium">
                💡 Haz clic sobre la foto para verla en pantalla completa de alta fidelidad.
              </div>
            </div>

            {/* Copywriting Persuasivo y Justificación (Columna Derecha 7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Hook de primer segundo */}
              <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 block">
                  🎣 Hook de Primer Segundo
                </span>
                <p className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                  &quot;{activeItem.post?.hook}&quot;
                </p>
              </div>

              {/* Copywriting Humanizado */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    📝 Copywriting Persuasivo (Tú a tú · Sin relleno corporativo)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${activeItem.post?.hook}\n\n${activeItem.post?.copy}\n\n${activeItem.post?.cta}`
                      );
                      setCopiedCopy(true);
                      setTimeout(() => setCopiedCopy(false), 2500);
                    }}
                    className="text-[10px] font-bold text-rose-700 hover:text-rose-800 bg-white border border-rose-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
                  >
                    {copiedCopy ? "¡Copiado!" : "Copiar Copy"}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                  {activeItem.post?.copy}
                </p>
                <div className="pt-3 border-t border-slate-200 text-xs sm:text-sm font-bold text-amber-800 flex items-center gap-2">
                  <span>👉</span>
                  <span>{activeItem.post?.cta}</span>
                </div>
              </div>

              {/* Justificación del Agente Director de Arte */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">
                    🎯 Justificación del Agente Director de Arte
                  </span>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100/90 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {activeItem.post?.artDirection?.layoutLabel} · {activeItem.post?.artDirection?.fontLabel}
                  </span>
                </div>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed italic">
                  &quot;{activeItem.post?.artDirection?.reasoning}&quot;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: HISTORIA DIARIA (STORY 9:16) */}
        {activeTab === "story" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Mockup de Historia 9:16 */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[280px] aspect-[9/16] rounded-3xl bg-slate-900 border-4 border-slate-800 p-4 shadow-2xl flex flex-col justify-between text-white relative overflow-hidden">
                {/* Barra de progreso de Stories */}
                <div className="space-y-3 z-10">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="h-0.5 rounded-full bg-white"></div>
                    <div className="h-0.5 rounded-full bg-white/40"></div>
                    <div className="h-0.5 rounded-full bg-white/40"></div>
                  </div>

                  {/* Header usuario */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-[10px] font-black text-white uppercase">
                      {businessName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold leading-none">{businessName}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{activeItem.story?.time}</div>
                    </div>
                  </div>
                </div>

                {/* Contenido central de la Story */}
                <div className="space-y-4 my-auto z-10 text-center px-2">
                  <div className="text-xs font-black text-amber-300 uppercase tracking-widest">
                    {activeItem.story?.objective}
                  </div>
                  <p className="text-sm sm:text-base font-black leading-snug drop-shadow-md">
                    &quot;{activeItem.story?.hook}&quot;
                  </p>

                  {/* Sticker Interactivo Simulado */}
                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 block">
                      🏷️ Sticker: {activeItem.story?.interactiveType}
                    </span>
                    <div className="text-xs font-bold text-white">
                      {activeItem.story?.interactiveLabel}
                    </div>
                  </div>
                </div>

                {/* Footer de Historia */}
                <div className="z-10 pt-2 flex items-center justify-between text-xs text-white/70 border-t border-white/10">
                  <span>Enviar mensaje...</span>
                  <span>❤️</span>
                </div>
              </div>
            </div>

            {/* Detalles de la Historia */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 block">
                  ⏰ Horario Estratégico y Objetivo
                </span>
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Publicación recomendada a las {activeItem.story?.time}
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Objetivo: {activeItem.story?.objective}
                </p>
              </div>

              {/* Secuencia de Diapositivas */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                  📋 Secuencia de Textos para las Diapositivas
                </span>
                <ol className="space-y-2 text-xs sm:text-sm text-slate-800">
                  {(activeItem.story?.slideTexts || []).map((slide, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-slate-200">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{slide}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Recomendación Visual */}
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 block">
                  🎬 Recomendación Visual del Agente
                </span>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed italic">
                  &quot;{activeItem.story?.visualRecommendation}&quot;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: DIRECCIÓN DE ARTE */}
        {activeTab === "art_direction" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Disposición Visual (Layout)
                </span>
                <div className="text-sm font-black text-slate-900">
                  {activeItem.post?.artDirection?.layoutLabel}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Estilo Tipográfico
                </span>
                <div className="text-sm font-black text-slate-900">
                  {activeItem.post?.artDirection?.fontLabel}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 block">
                🎨 Justificación Estratégica del Diseño
              </span>
              <p className="text-xs sm:text-sm text-indigo-950 font-medium leading-relaxed">
                {activeItem.post?.artDirection?.reasoning}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                📐 Directiva Fotográfica / Compositiva
              </span>
              <p className="text-xs font-mono text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                {activeItem.post?.compositionDirective}
              </p>
            </div>
          </div>
        )}

        {/* PESTAÑA: RADAR DE NICHO */}
        {activeTab === "niche" && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                📡 Tendencia de Nicho Detectada para el {activeItem.weekday}
              </span>
              <div className="text-base font-black text-emerald-950">
                {activeItem.nicheTrend}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                🧠 Comportamiento Psicológico del Consumidor
              </span>
              <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                {activeItem.nicheInsight}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* MODAL FULLSCREEN */}
      {fullscreenImageModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-6 animate-fadeIn"
          onClick={() => setFullscreenImageModal(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[95vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFullscreenImageModal(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-2 text-xl cursor-pointer"
            >
              <FaTimes />
            </button>
            <img
              src={fullscreenImageModal}
              alt="Vista Detallada"
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl select-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
