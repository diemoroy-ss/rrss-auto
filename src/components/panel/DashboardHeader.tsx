"use client";

import Link from "next/link";
import { getPlanConfig } from "../../lib/plans";
import { Sparkles, CalendarCheck, BarChart3, Plus, Zap, CheckCircle2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface DashboardHeaderProps {
  activeTab: "upcoming" | "published";
  displayName: string | null;
  quotaUsed: number;
  planLimit: number;
  imagesUsed?: number;
  imageLimit?: number;
  videosUsed: number;
  videoLimit: number;
  userPlan?: string;
  onOpenUpgradeModal?: () => void;
}

/**
 * DashboardHeader
 * Renderiza el título del panel con la identidad corporativa de Santisoft,
 * el Hero de Cobertura Mensual y el Widget "Agendado por Santisoft".
 */
export default function DashboardHeader({
  activeTab,
  displayName,
  quotaUsed,
  planLimit,
  imagesUsed = 0,
  imageLimit = 15,
  videosUsed,
  videoLimit,
  userPlan = "esencial",
  onOpenUpgradeModal,
}: DashboardHeaderProps) {
  const planConfig = getPlanConfig(userPlan);
  const isUnlimited = planLimit >= 99999;
  const effectiveMaxPosts = isUnlimited ? 99999 : planLimit || planConfig.maxPostsPerMonth;
  const postProgressPct = isUnlimited
    ? 20
    : Math.min(100, Math.round((quotaUsed / Math.max(1, effectiveMaxPosts)) * 100));

  const isAtLimit = !isUnlimited && quotaUsed >= effectiveMaxPosts;

  const handleNewPostClick = (e: React.MouseEvent) => {
    if (isAtLimit && onOpenUpgradeModal) {
      e.preventDefault();
      onOpenUpgradeModal();
    }
  };

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* ══════════════════════════════════════════════════════════════
          1. FILA DE TÍTULO, CUENTA Y ACCIONES PRINCIPALES
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1
              id="tour-dashboard-title"
              className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
            >
              {activeTab === "upcoming" ? "Próximas Publicaciones" : "Posts Publicados"}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              En Piloto Automático
            </span>
          </div>
          <p className="text-slate-500 mt-1.5 text-xs sm:text-sm">
            {activeTab === "upcoming"
              ? `Posts planificados este mes: ${quotaUsed} de ${
                  isUnlimited ? "Ilimitados" : effectiveMaxPosts
                } (${planConfig.name})`
              : "Historial de publicaciones enviadas exitosamente a tus redes sociales."}
          </p>
        </div>

        {/* Acciones y Cuenta */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Badge Cuenta Activa */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 font-semibold">Cuenta:</span>
            <span className="font-bold text-slate-900">{displayName || "Usuario"}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-700 border border-orange-200">
              {planConfig.name}
            </span>
          </div>

          {/* Botón WhatsApp Bot */}
          <a
            href="https://wa.me/56965909543?text=Hola%20Santisoft!%20Quiero%20gestionar%20mi%20cuenta"
            target="_blank"
            rel="noopener noreferrer"
            title="Abre el asistente de WhatsApp para gestionar tus posts"
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold py-2.5 px-3.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs"
          >
            <FaWhatsapp className="text-emerald-600 text-sm" />
            <span className="hidden sm:inline">WhatsApp Bot</span>
          </a>

          {/* Botón Crear / Agendar Post */}
          <Link
            id="tour-btn-new-post"
            href={isAtLimit ? "#" : "/automatizacion-rrss/panel/crear"}
            onClick={handleNewPostClick}
            className={`font-black py-2.5 px-4 sm:px-5 rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs text-white ${
              isAtLimit
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/25 hover:scale-[1.01]"
            }`}
          >
            {isAtLimit ? <Zap className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
            <span>{isAtLimit ? "Ampliar Plan" : "Agendar Publicación"}</span>
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. FILA HERO: LOS 2 WIDGETS ESTILO FLOW CON IDENTIDAD SANTISOFT
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Widget 1: Hero Cobertura Mensual (Slate Corporativo + Naranja) */}
        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-7 text-white shadow-xl shadow-slate-950/20 relative overflow-hidden flex flex-col justify-between border border-slate-800">
          {/* Marca de agua decorativa */}
          <div className="absolute -right-8 -bottom-8 w-60 h-60 rounded-full bg-orange-500/10 pointer-events-none blur-3xl"></div>
          <div className="absolute right-6 top-6 opacity-5 text-orange-400 pointer-events-none">
            <CalendarCheck className="w-32 h-32" />
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-[11px] font-black uppercase tracking-wider text-orange-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Ritmo Óptimo de Publicación
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {postProgressPct}% Cobertura Activa
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              Posts planificados este mes: {quotaUsed} / {isUnlimited ? "Ilimitados" : effectiveMaxPosts}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Tus redes sociales tienen presencia constante garantizada por nuestros agentes, manteniendo a tu negocio activo y generando consultas comerciales sin perder tiempo.
            </p>
          </div>

          {/* Barra de progreso gruesa con gradiente Santisoft */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>
                {isAtLimit
                  ? "Has alcanzado el límite mensual de tu plan"
                  : `Quedan ${
                      isUnlimited ? "infinitos" : Math.max(0, effectiveMaxPosts - quotaUsed)
                    } cupos de posts este mes`}
              </span>
              {isAtLimit && !isUnlimited && onOpenUpgradeModal && (
                <button
                  onClick={onOpenUpgradeModal}
                  className="text-[11px] font-black text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Subir de Plan →</span>
                </button>
              )}
            </div>

            <div className="w-full bg-slate-800/90 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700/80">
              <div
                className={`h-full rounded-full transition-all duration-700 shadow-sm ${
                  isAtLimit
                    ? "bg-rose-500"
                    : postProgressPct > 80
                    ? "bg-gradient-to-r from-orange-500 to-amber-400"
                    : "bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400"
                }`}
                style={{ width: `${Math.max(5, postProgressPct)}%` }}
              />
            </div>

            {/* Sub-indicadores de recursos */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Imágenes: <strong>{imagesUsed}</strong> / {imageLimit >= 99999 ? "∞" : imageLimit}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-pink-400" />
                Reels: <strong>{videosUsed}</strong> / {videoLimit >= 99999 ? "∞" : videoLimit}
              </span>
              <span className="text-orange-400 font-bold">
                Plan {planConfig.name}
              </span>
            </div>
          </div>
        </div>

        {/* Widget 2: "Agendado por Santisoft" (Gráfico de barras corporativo) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-orange-500" />
                Agendado por Santisoft
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Volumen mensual de contenidos</p>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg">
              +100% Piloto
            </span>
          </div>

          {/* Gráfico de Barras con la Identidad Santisoft (Slate + Naranja) */}
          <div className="h-32 flex items-end justify-between gap-3 pt-4 pb-2 border-b border-slate-100">
            {/* Barra 1 */}
            <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end group cursor-pointer">
              <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                12
              </span>
              <div
                className="w-full bg-slate-200 rounded-t-lg group-hover:bg-slate-300 transition-all"
                style={{ height: "35%" }}
              />
              <span className="text-[10px] font-semibold text-slate-500">Jul</span>
            </div>
            {/* Barra 2 */}
            <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end group cursor-pointer">
              <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                18
              </span>
              <div
                className="w-full bg-slate-300 rounded-t-lg group-hover:bg-slate-400 transition-all"
                style={{ height: "50%" }}
              />
              <span className="text-[10px] font-semibold text-slate-500">Ago</span>
            </div>
            {/* Barra 3 */}
            <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end group cursor-pointer">
              <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                24
              </span>
              <div
                className="w-full bg-slate-400 rounded-t-lg group-hover:bg-slate-500 transition-all"
                style={{ height: "68%" }}
              />
              <span className="text-[10px] font-semibold text-slate-500">Sep</span>
            </div>
            {/* Barra 4 (Mes Actual Activo en Naranja Santisoft) */}
            <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end group cursor-pointer">
              <span className="text-[9px] font-black text-orange-600">
                {Math.max(quotaUsed, 15)}
              </span>
              <div
                className="w-full bg-gradient-to-t from-orange-500 to-amber-500 rounded-t-lg shadow-md shadow-orange-500/20"
                style={{ height: "92%" }}
              />
              <span className="text-[10px] font-black text-orange-600">Activo</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-2.5 text-slate-600 font-medium">
            <span>Ahorro estimado: <strong className="text-slate-900">~18 hrs/mes</strong></span>
            <Link
              href="/automatizacion-rrss/panel/metricas"
              className="text-orange-600 font-bold hover:underline"
            >
              Ver métricas →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
