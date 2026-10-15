"use client";

import Link from "next/link";
import { getPlanConfig } from "../../lib/plans";
import { Sparkles } from "lucide-react";

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
 * Renderiza el título del panel, barra de progreso del plan y botón de crear post.
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
    ? 10
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
      {/* Fila Principal */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h1
            id="tour-dashboard-title"
            className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight"
          >
            {activeTab === "upcoming" ? "Próximas Publicaciones" : "Posts Publicados"}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            {activeTab === "upcoming"
              ? "Monitorea los posts que nuestros agentes publicarán en piloto automático."
              : "Historial de publicaciones locales enviadas exitosamente a tus redes sociales."}
          </p>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-3">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span>Cuenta Activa:</span>
            <span className="text-slate-900 font-black">{displayName || "Usuario"}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
              {planConfig.name}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Publicaciones del Mes */}
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Publicaciones
              </span>
              <span
                className={`font-black text-sm ${
                  isAtLimit ? "text-rose-600" : "text-indigo-600"
                }`}
              >
                {quotaUsed} / {isUnlimited ? "∞" : effectiveMaxPosts}
              </span>
            </div>

            {/* Imágenes Generadas */}
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Imágenes
              </span>
              <span
                className={`font-black text-sm ${
                  imagesUsed >= imageLimit && imageLimit < 99999
                    ? "text-rose-600"
                    : "text-indigo-600"
                }`}
              >
                {imagesUsed} / {imageLimit >= 99999 ? "∞" : imageLimit}
              </span>
            </div>

            {/* Cuota reels */}
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">
                Reels / Videos
              </span>
              <span
                className={`font-black text-sm ${
                  videosUsed >= videoLimit && videoLimit < 99999
                    ? "text-rose-600"
                    : "text-pink-600"
                }`}
              >
                {videosUsed} / {videoLimit >= 99999 ? "∞" : videoLimit}
              </span>
            </div>

            {/* Botón WhatsApp Bot */}
            <a
              href="https://wa.me/56965909543?text=Hola%20Santisoft!%20Quiero%20gestionar%20mi%20cuenta"
              target="_blank"
              rel="noopener noreferrer"
              title="Abre el asistente de WhatsApp para gestionar tus posts"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-200 hover:border-emerald-300 font-black py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>WhatsApp Bot</span>
            </a>

            {/* Botón crear */}
            <Link
              id="tour-btn-new-post"
              href={isAtLimit ? "#" : "/automatizacion-rrss/panel/crear"}
              onClick={handleNewPostClick}
              className={`font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-white ${
                isAtLimit
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
              }`}
            >
              <span>{isAtLimit ? "⚡" : "✍️"}</span>
              <span>{isAtLimit ? "Ampliar Plan" : "Agendar Nuevo"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Barra de Progreso Mensual Limpia */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 text-xs">
          <div className="font-bold text-slate-700 flex items-center gap-2">
            <span>Posts planificados este mes:</span>
            <span className="font-black text-indigo-600">
              {quotaUsed} / {isUnlimited ? "Ilimitados" : effectiveMaxPosts}
            </span>
            <span className="text-slate-400 font-medium">
              ({planConfig.name})
            </span>
          </div>

          {!isUnlimited && isAtLimit && (
            <button
              onClick={onOpenUpgradeModal}
              className="text-[11px] font-black text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Desbloquear 30 posts con Plan Crecimiento →</span>
            </button>
          )}
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAtLimit
                ? "bg-rose-500"
                : postProgressPct > 80
                ? "bg-amber-500"
                : "bg-gradient-to-r from-indigo-500 to-indigo-600"
            }`}
            style={{ width: `${postProgressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
