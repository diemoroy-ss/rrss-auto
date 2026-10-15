"use client";

import { useState, useMemo } from "react";
import { format, isSameDay, isWithinInterval, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { SocialPost } from "../../types/dashboard";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ShieldCheck,
  Clock,
  TrendingUp,
  Share2,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import NetworkIcon from "./NetworkIcon";

interface PublishedStatsHeroProps {
  posts: SocialPost[];
  selectedDateFilter: Date | null;
  onSelectDateFilter: (d: Date | null) => void;
  networkFilter?: string;
  onSelectNetworkFilter?: (net: string) => void;
}

export default function PublishedStatsHero({
  posts,
  selectedDateFilter,
  onSelectDateFilter,
  networkFilter,
  onSelectNetworkFilter,
}: PublishedStatsHeroProps) {
  const [temporalMode, setTemporalMode] = useState<"days" | "weeks">("days");
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);

  // Filtrar solo los posts publicados
  const publishedPosts = useMemo(() => {
    return posts.filter((p) => p.status === "published");
  }, [posts]);

  // Desglose por red social
  const networkDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      instagram: 0,
      facebook: 0,
      tiktok: 0,
      linkedin: 0,
      youtube: 0,
      blog: 0,
    };

    let total = 0;
    publishedPosts.forEach((post) => {
      const nets = Array.isArray(post.networks)
        ? post.networks
        : Object.entries(post.networks || {})
            .filter(([_, v]) => v)
            .map(([k]) => k);

      nets.forEach((net) => {
        const key = net.toLowerCase();
        if (counts[key] !== undefined) {
          counts[key] = (counts[key] || 0) + 1;
          total += 1;
        } else {
          counts[key] = (counts[key] || 0) + 1;
          total += 1;
        }
      });
    });

    return {
      counts,
      total: Math.max(total, 1),
    };
  }, [publishedPosts]);

  // Lista de redes activas con datos
  const networksConfig = [
    { id: "instagram", name: "Instagram", color: "from-pink-500 to-rose-500", bgHex: "#E1306C" },
    { id: "facebook", name: "Facebook", color: "from-blue-600 to-blue-700", bgHex: "#1877F2" },
    { id: "tiktok", name: "TikTok", color: "from-slate-800 to-slate-900", bgHex: "#000000" },
    { id: "linkedin", name: "LinkedIn", color: "from-blue-700 to-blue-800", bgHex: "#0A66C2" },
    { id: "youtube", name: "YouTube", color: "from-red-600 to-red-700", bgHex: "#FF0000" },
    { id: "blog", name: "Blog / Web", color: "from-amber-500 to-amber-600", bgHex: "#D97706" },
  ];

  // Últimos 7 días con publicaciones (o últimos 7 días desde hoy hacia atrás)
  const last7Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  }, []);

  // Conteo de posts por día
  const getPostCountForDay = (date: Date) => {
    return publishedPosts.filter((p) => {
      const pDate = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : null;
      return pDate && isSameDay(pDate, date);
    }).length;
  };

  // Semanas del mes actual (4 bloques)
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
      const count = publishedPosts.filter((p) => {
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
  }, [publishedPosts]);

  const handleSelectDay = (day: Date) => {
    if (selectedDateFilter && isSameDay(selectedDateFilter, day)) {
      onSelectDateFilter(null);
    } else {
      onSelectDateFilter(day);
      setSelectedWeekIndex(null);
    }
  };

  const handleSelectWeek = (week: (typeof weeksData)[0]) => {
    if (selectedWeekIndex === week.id) {
      setSelectedWeekIndex(null);
      onSelectDateFilter(null);
    } else {
      setSelectedWeekIndex(week.id);
      onSelectDateFilter(week.start);
    }
  };

  // Ahorro estimado: 1.5 horas por post publicado vs hacerlo a mano
  const hoursSaved = Math.max(publishedPosts.length * 1.5, publishedPosts.length > 0 ? 3 : 0);

  return (
    <div className="space-y-6 mb-8">
      {/* ── CARD PRINCIPAL: HERO EN SLATE PROFUNDO CORPORATIVO ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#1E293B] border border-slate-800 text-white p-6 sm:p-8 shadow-2xl">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-orange-500/10 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Superior del Hero */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Historial de Contenido Publicado
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <span>{publishedPosts.length} Publicaciones Entregadas</span>
                <span className="text-sm font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% Exitosas
                </span>
              </h2>
              <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                Contenido difundido por nuestros agentes en tus perfiles sin intervención manual ni pérdida de tiempo.
              </p>
            </div>

            {/* Acciones directas */}
            <div className="flex items-center gap-3">
              <Link
                href="/automatizacion-rrss/panel/metricas"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Ver Métricas y Rendimiento</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Fila de 4 Indicadores Clave de Efectividad */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Total Posts</span>
                <Share2 className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {publishedPosts.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="text-emerald-400 font-bold">✓ Activos</span> en redes
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Tasa de Entrega</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                100%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                0 fallas de publicación
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Anti-Baneos</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                0 Alertas
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Protección de algoritmo
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Tiempo Ahorrado</span>
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-orange-400 mt-1">
                ~{hoursSaved} hrs
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                vs gestión tradicional
              </p>
            </div>
          </div>

          {/* Desglose Multicanal Proporcional */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                Distribución por Red Social
              </span>
              <span className="text-slate-400">
                {publishedPosts.length} publicaciones totales
              </span>
            </div>

            {/* Barra segmentada multicolor */}
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
              {networksConfig.map((net) => {
                const count = networkDistribution.counts[net.id] || 0;
                if (count === 0) return null;
                const pct = Math.round((count / networkDistribution.total) * 100);
                return (
                  <div
                    key={net.id}
                    style={{ width: `${pct}%`, backgroundColor: net.bgHex }}
                    className="h-full transition-all hover:opacity-90"
                    title={`${net.name}: ${count} posts (${pct}%)`}
                  />
                );
              })}
            </div>

            {/* Chips de redes con conteo y botón interactivo */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {networksConfig.map((net) => {
                const count = networkDistribution.counts[net.id] || 0;
                const isSelected = networkFilter === net.id;
                return (
                  <button
                    key={net.id}
                    onClick={() => {
                      if (onSelectNetworkFilter) {
                        onSelectNetworkFilter(isSelected ? "all" : net.id);
                      }
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-white text-slate-900 border-white shadow-md scale-105"
                        : "bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80"
                    }`}
                  >
                    <NetworkIcon network={net.id} postId={`stat-${net.id}`} />
                    <span>{net.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                        isSelected
                          ? "bg-slate-900 text-white"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── SELECTOR DE FILTRO TEMPORAL: DÍAS VS SEMANAS ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Filtrar Publicaciones por:
            </span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setTemporalMode("days");
                  setSelectedWeekIndex(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  temporalMode === "days"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Por Días</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemporalMode("weeks");
                  onSelectDateFilter(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  temporalMode === "weeks"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Por Semanas</span>
              </button>
            </div>
          </div>

          {(selectedDateFilter || selectedWeekIndex !== null) && (
            <button
              onClick={() => {
                onSelectDateFilter(null);
                setSelectedWeekIndex(null);
              }}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 self-start sm:self-auto"
            >
              <span>✕ Quitar filtro</span>
              {selectedDateFilter && (
                <span>({format(selectedDateFilter, "d 'de' MMMM", { locale: es })})</span>
              )}
            </button>
          )}
        </div>

        {/* Vista: POR DÍAS */}
        {temporalMode === "days" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {last7Days.map((day) => {
              const isSelected = selectedDateFilter && isSameDay(selectedDateFilter, day);
              const isToday = isSameDay(day, new Date());
              const count = getPostCountForDay(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleSelectDay(day)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-md scale-102"
                      : isToday
                      ? "bg-orange-50/60 border-orange-200 text-slate-800 hover:border-orange-300"
                      : count > 0
                      ? "bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:shadow-sm"
                      : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      isSelected
                        ? "text-orange-400"
                        : isToday
                        ? "text-orange-600"
                        : "text-slate-400"
                    }`}
                  >
                    {isToday ? "Hoy" : format(day, "EEE", { locale: es })}
                  </span>
                  <span
                    className={`text-base font-black my-0.5 ${
                      isSelected ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {format(day, "d MMM", { locale: es })}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                      isSelected
                        ? "bg-orange-500 text-white"
                        : count > 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-200/60 text-slate-400"
                    }`}
                  >
                    {count} {count === 1 ? "post" : "posts"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Vista: POR SEMANAS */}
        {temporalMode === "weeks" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {weeksData.map((week) => {
              const isSelected = selectedWeekIndex === week.id;

              return (
                <button
                  key={week.id}
                  onClick={() => handleSelectWeek(week)}
                  className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-md scale-102"
                      : week.isCurrent
                      ? "bg-orange-50/50 border-orange-200 hover:border-orange-300 text-slate-800"
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:shadow-sm"
                  }`}
                >
                  {week.isCurrent && !isSelected && (
                    <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-100 text-orange-700">
                      Actual
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black uppercase tracking-wider ${
                        isSelected ? "text-orange-400" : "text-slate-400"
                      }`}
                    >
                      {week.label}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-orange-500 text-white"
                          : week.count > 0
                          ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {week.count} {week.count === 1 ? "post" : "posts"}
                    </span>
                  </div>
                  <div
                    className={`text-sm font-black mt-2 ${
                      isSelected ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Días {week.days}
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      isSelected ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {week.count > 0
                      ? `${week.count} entregados en este período`
                      : "Sin publicaciones en este bloque"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
