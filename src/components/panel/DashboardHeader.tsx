"use client";

import Link from "next/link";

interface DashboardHeaderProps {
  activeTab: "upcoming" | "published";
  displayName: string | null;
  quotaUsed: number;
  planLimit: number;
  videosUsed: number;
  videoLimit: number;
}

/**
 * DashboardHeader
 * Renderiza el título del panel, las cuotas de uso y el botón de crear post.
 */
export default function DashboardHeader({
  activeTab,
  displayName,
  quotaUsed,
  planLimit,
  videosUsed,
  videoLimit,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
      <div>
        <h1
          id="tour-dashboard-title"
          className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight"
        >
          {activeTab === "upcoming" ? "Próximas Publicaciones" : "Posts Publicados"}
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">
          {activeTab === "upcoming"
            ? "Monitorea los posts que el bot publicará en piloto automático."
            : "Historial de publicaciones locales enviadas exitosamente a tus redes sociales."}
        </p>
      </div>

      <div className="flex flex-col items-start lg:items-end gap-3">
        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Cuenta Activa: <span className="text-slate-900">{displayName || "Usuario"}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Cuota imágenes */}
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Cuota Imágenes
            </span>
            <span
              className={`font-black text-sm ${
                quotaUsed >= planLimit && planLimit < 99999
                  ? "text-rose-600"
                  : "text-indigo-600"
              }`}
            >
              {quotaUsed} / {planLimit >= 99999 ? "∞" : planLimit}
            </span>
          </div>

          {/* Cuota reels */}
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">
              Cuotas Reel
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

          {/* Botón crear */}
          <Link
            id="tour-btn-new-post"
            href="/automatizacion-rrss/panel/crear"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>✍️</span> Agendar Nuevo
          </Link>
        </div>
      </div>
    </div>
  );
}
