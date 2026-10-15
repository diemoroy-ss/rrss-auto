"use client";

import { useState, useMemo } from "react";
import { format, isSameDay, startOfWeek, endOfWeek, isWithinInterval, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { SocialPost } from "../../types/dashboard";
import {
  CalendarDays,
  CalendarRange,
  Clock,
  Sparkles,
  Eye,
  CheckCircle2,
  Video,
  Layers,
  FileText,
  AlertCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import NetworkIcon from "./NetworkIcon";

interface UpcomingTimelineProps {
  posts: SocialPost[];
  selectedDateFilter: Date | null;
  onSelectDateFilter: (d: Date | null) => void;
  onGenerateMedia: (postId: string, e: React.MouseEvent) => void;
  onClickPost: (post: SocialPost) => void;
}

export default function UpcomingTimeline({
  posts,
  selectedDateFilter,
  onSelectDateFilter,
  onGenerateMedia,
  onClickPost,
}: UpcomingTimelineProps) {
  const [temporalMode, setTemporalMode] = useState<"days" | "weeks">("days");
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);

  // Generar próximos 7 días a partir de hoy
  const next7Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, []);

  // Posts ordenados por fecha ascendente
  const upcomingPosts = useMemo(() => {
    return [...posts]
      .filter((p) => p.status !== "published")
      .sort((a, b) => {
        const timeA = a.scheduledFor?.toDate ? a.scheduledFor.toDate().getTime() : 0;
        const timeB = b.scheduledFor?.toDate ? b.scheduledFor.toDate().getTime() : 0;
        return timeA - timeB;
      });
  }, [posts]);

  // Las 3 publicaciones más próximas
  const top3Posts = useMemo(() => {
    return upcomingPosts.slice(0, 3);
  }, [upcomingPosts]);

  // Contar posts por día para los chips
  const getPostCountForDay = (date: Date) => {
    return posts.filter((p) => {
      const pDate = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : null;
      return pDate && isSameDay(pDate, date);
    }).length;
  };

  // Semanas del mes actual (4 bloques aproximados: Días 1-7, 8-14, 15-21, 22-31)
  const weeksData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const ranges = [
      { id: 1, label: "Semana 1", days: "1 al 7", start: new Date(year, month, 1), end: new Date(year, month, 7) },
      { id: 2, label: "Semana 2", days: "8 al 14", start: new Date(year, month, 8), end: new Date(year, month, 14) },
      { id: 3, label: "Semana 3", days: "15 al 21", start: new Date(year, month, 15), end: new Date(year, month, 21) },
      { id: 4, label: "Semana 4", days: "22 al 31", start: new Date(year, month, 22), end: new Date(year, month + 1, 0) },
    ];

    return ranges.map((r) => {
      const count = posts.filter((p) => {
        const pDate = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : null;
        return pDate && isWithinInterval(pDate, { start: r.start, end: r.end });
      }).length;

      const isCurrent = isWithinInterval(now, { start: r.start, end: r.end });

      return {
        ...r,
        count,
        isCurrent,
      };
    });
  }, [posts]);

  // Manejar selección de día
  const handleDayClick = (date: Date) => {
    if (selectedDateFilter && isSameDay(selectedDateFilter, date)) {
      onSelectDateFilter(null); // Deseleccionar
    } else {
      onSelectDateFilter(date);
    }
  };

  // Helper para tipo de formato de post
  const getPostFormatBadge = (post: SocialPost) => {
    const formatType = (post as any).formatType || (post as any).postType || "image";
    if (formatType === "video" || post.type === "video") {
      return {
        label: "Reel 30s",
        icon: <Video className="w-3 h-3 mr-1" />,
        className: "bg-orange-50 text-orange-700 border-orange-200",
      };
    }
    if (formatType === "carousel" || post.type === "carousel") {
      return {
        label: "Carrusel",
        icon: <Layers className="w-3 h-3 mr-1" />,
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    }
    if (post.network === "linkedin" || post.network === "blog") {
      return {
        label: "B2B / Autoridad",
        icon: <FileText className="w-3 h-3 mr-1" />,
        className: "bg-sky-50 text-sky-700 border-sky-200",
      };
    }
    return {
      label: "Post Gráfico",
      icon: <Layers className="w-3 h-3 mr-1" />,
      className: "bg-slate-100 text-slate-700 border-slate-200",
    };
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-6 mb-8">
      {/* ══════════════════════════════════════════════════════════════
          1. HEADER CON EL SWITCH INTERACTIVO: [ DÍAS ] vs [ SEMANAS ]
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Programación de Contenidos</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {temporalMode === "days" ? "Vista por Días" : "Vista por Semanas"}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Explora las publicaciones por día individual o por bloque de semana en tu calendario
          </p>
        </div>

        {/* Switch Interactivo */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <button
            onClick={() => setTemporalMode("days")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              temporalMode === "days"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
            <span>Por Días</span>
          </button>
          <button
            onClick={() => setTemporalMode("weeks")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              temporalMode === "weeks"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
            <span>Por Semanas</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. SELECTOR TEMPORAL: CHIPS DE DÍAS vs CHIPS DE SEMANAS
      ══════════════════════════════════════════════════════════════ */}
      {temporalMode === "days" ? (
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
          {next7Days.map((dayDate, i) => {
            const isToday = isSameDay(dayDate, new Date());
            const isSelected = selectedDateFilter && isSameDay(selectedDateFilter, dayDate);
            const count = getPostCountForDay(dayDate);

            return (
              <button
                key={i}
                onClick={() => handleDayClick(dayDate)}
                className={`shrink-0 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center min-w-[76px] ${
                  isSelected
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/25"
                    : isToday
                    ? "border-orange-300 bg-orange-50/50 text-slate-800 hover:border-orange-400"
                    : "border-slate-200 text-slate-600 hover:border-slate-400 bg-white"
                }`}
              >
                <span
                  className={`text-[9px] uppercase font-bold ${
                    isSelected ? "text-orange-100" : isToday ? "text-orange-600" : "text-slate-400"
                  }`}
                >
                  {isToday ? "Hoy" : format(dayDate, "EEE d", { locale: es })}
                </span>
                <span className="text-xs font-black mt-0.5">
                  {count > 0 ? `${count} ${count === 1 ? "post" : "posts"}` : "Sin posts"}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {weeksData.map((week) => {
            const isSelected = selectedWeekIndex === week.id;
            return (
              <button
                key={week.id}
                onClick={() => setSelectedWeekIndex(isSelected ? null : week.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "bg-orange-50 border-2 border-orange-500 shadow-xs"
                    : week.isCurrent
                    ? "border-orange-300 bg-orange-50/30 hover:border-orange-400"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div
                  className={`text-[10px] font-black uppercase ${
                    week.isCurrent ? "text-orange-600" : "text-slate-400"
                  }`}
                >
                  {week.days} Oct {week.isCurrent && "· ACTUAL"}
                </div>
                <div className="text-xs font-black text-slate-900 mt-0.5">{week.label}</div>
                <div
                  className={`text-[11px] font-bold mt-1 ${
                    week.count > 0 ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {week.count > 0 ? `${week.count} posts listos ✅` : "Sin posts"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          3. LAS 3 CARDS DESTACADAS DE PUBLICACIONES INMEDIATAS
      ══════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">
              Publicaciones Próximas a Salir
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            {upcomingPosts.length} publicaciones activas en cola
          </span>
        </div>

        {top3Posts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto text-lg">
              ✨
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">No hay publicaciones agendadas aún</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Genera tu calendario mensual con nuestros agentes en menos de 2 minutos.
              </p>
            </div>
            <Link
              href="/automatizacion-rrss/panel/crear"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generar Grilla Mensual</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3Posts.map((post, idx) => {
              const badge = getPostFormatBadge(post);
              const postDate = post.scheduledFor?.toDate
                ? post.scheduledFor.toDate()
                : new Date();
              const hasMedia = !!(post.imageUrl || (post as any).videoUrl);

              return (
                <div
                  key={post.id || idx}
                  className={`rounded-2xl border p-4.5 flex flex-col justify-between space-y-3.5 transition-all relative ${
                    idx === 0
                      ? "bg-gradient-to-b from-orange-50/30 via-white to-white border-2 border-orange-500 shadow-md shadow-orange-500/10"
                      : "bg-white border-slate-200 hover:border-orange-300 shadow-xs"
                  }`}
                >
                  {idx === 0 && (
                    <span className="absolute -top-2.5 right-3 bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                      Siguiente a Salir
                    </span>
                  )}

                  <div>
                    {/* Header de la Card */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-2 py-1 rounded-xl font-black text-xs border flex flex-col items-center leading-none ${
                            idx === 0
                              ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
                          <span
                            className={`text-[8px] uppercase font-bold ${
                              idx === 0 ? "text-orange-100" : "text-slate-400"
                            }`}
                          >
                            {format(postDate, "EEE", { locale: es })}
                          </span>
                          <span className="text-sm font-black">{format(postDate, "d")}</span>
                        </div>
                        <div>
                          <div className="text-[11px] font-black text-slate-900 flex items-center gap-1">
                            <span>Agendado</span>
                            <NetworkIcon network={post.network || "instagram"} postId={`top-${post.id}`} />
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {format(postDate, "HH:mm")} hrs
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black border flex items-center ${badge.className}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>

                    {/* Contenido / Copy */}
                    <h5 className="text-xs font-black text-slate-800 line-clamp-1 mb-1">
                      {post.caption?.split("\n")[0]?.replace(/^[#*-\s]+/, "") || "Publicación Programada"}
                    </h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                      {post.caption?.split("\n").slice(1).join(" ") || post.caption || "Sin contenido"}
                    </p>
                  </div>

                  {/* Footer con Estado y Botón de Acción */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-semibold capitalize">
                        {post.network || "Red Social"}
                      </span>
                      {hasMedia ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Gráfica Lista
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Sin Gráfica aún
                        </span>
                      )}
                    </div>

                    {/* Botón Acción Primaria */}
                    {!hasMedia ? (
                      <button
                        onClick={(e) => onGenerateMedia(post.id, e)}
                        className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.01]"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generar Multimedia</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onClickPost(post)}
                        className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.01]"
                      >
                        <Eye className="w-3 h-3 text-orange-400" />
                        <span>Ver y Editar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
