"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import NetworkIcon from "./NetworkIcon";
import { SocialPost, getPostTypeLabel } from "../../types/dashboard";

interface PostCardProps {
  post: SocialPost;
  isSelected: boolean;
  userPlan: string;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onClick: (post: SocialPost) => void;
  onUnconfirm: (post: SocialPost, e: React.MouseEvent) => void;
  onReschedule: (post: SocialPost) => void;
  onDelete: (postId: string, e: React.MouseEvent) => void;
  onGenerateMedia: (postId: string, e: React.MouseEvent) => void;
  onResetGenerating: (postId: string, e: React.MouseEvent) => void;
  activeTab: "upcoming" | "published";
}

/** Configuración visual por status */
const STATUS_STYLES: Record<string, { color: string; text: string }> = {
  pending: { color: "text-amber-600 bg-amber-50 border-amber-200", text: "⏸️ Pausado / Borrador" },
  draft: { color: "text-amber-600 bg-amber-50 border-amber-200", text: "⏸️ Pausado / Borrador" },
  strategy_draft: { color: "text-amber-600 bg-amber-50 border-amber-200", text: "⏸️ Pausado / Borrador" },
  confirmed: { color: "text-indigo-600 bg-indigo-50 border-indigo-200", text: "⏳ Agendado por SocialPilot" },
  publishing: { color: "text-blue-600 bg-blue-50 border-blue-200 shadow-sm animate-pulse", text: "⚡ Publicando..." },
  published: { color: "text-emerald-600 bg-emerald-50 border-emerald-200", text: "✅ Publicado" },
  error: { color: "text-rose-600 bg-rose-50 border-rose-200", text: "❌ Error" },
  quota_exceeded: { color: "text-amber-700 bg-amber-50 border-amber-300", text: "⚠️ Cuota Excedida (Reagendar)" },
};

/**
 * PostCard
 * Tarjeta individual de un post en el grid del dashboard.
 */
export default function PostCard({
  post,
  isSelected,
  userPlan,
  onSelect,
  onClick,
  onUnconfirm,
  onReschedule,
  onDelete,
  onGenerateMedia,
  onResetGenerating,
  activeTab,
}: PostCardProps) {
  const dateObj = post.scheduledFor?.toDate ? post.scheduledFor.toDate() : new Date();
  const formattedTime = format(dateObj, "HH:mm");

  const isBlog = Array.isArray(post.networks) && post.networks.includes("blog");
  const isPending =
    post.status === "pending" || post.status === "draft" || post.status === "strategy_draft";

  const effectiveStatus = isBlog && post.status !== "published" ? "confirmed" : post.status;
  const statusCfg = STATUS_STYLES[effectiveStatus] ?? {
    color: "text-slate-600 bg-slate-50 border-slate-200",
    text: effectiveStatus,
  };

  const safeNetworks = Array.isArray(post.networks)
    ? post.networks
    : Object.entries(post.networks || {})
        .filter(([, v]) => v)
        .map(([k]) => k);

  // Clases del color de status divididas
  const statusBg = statusCfg.color.split(" ").find((c) => c.startsWith("bg-")) ?? "bg-slate-50";
  const statusBorder = statusCfg.color.split(" ").find((c) => c.startsWith("border-")) ?? "border-slate-200";
  const statusText = statusCfg.color.split(" ")[0]; // text-xxx

  const isVideo =
    post.videoUrl ||
    (post.imageUrl &&
      (post.imageUrl.includes(".mp4") ||
        post.imageUrl.includes(".mov") ||
        post.imageUrl.includes("video") ||
        (post.type === "Reel" && post.imageUrl.includes("firebasestorage"))));

  return (
    <div
      onClick={() =>
        isBlog ? (window.location.href = "/automatizacion-rrss/panel/blog") : onClick(post)
      }
      className={`premium-card !p-0 overflow-hidden flex flex-col group hover:-translate-y-1 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 relative ${
        isSelected ? "ring-2 ring-indigo-500 ring-offset-4" : ""
      }`}
    >
      {/* Checkbox overlay */}
      {!isBlog && (
        <div
          onClick={(e) => onSelect(post.id, e)}
          className={`absolute top-4 left-4 z-20 w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${
            isSelected
              ? "bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg"
              : "bg-white/80 backdrop-blur-sm border-slate-200 opacity-0 group-hover:opacity-100 shadow-sm"
          }`}
        >
          {isSelected && <span className="text-sm font-black">✓</span>}
        </div>
      )}

      {/* Status header */}
      <div className={`px-5 py-4 border-b flex flex-col gap-3 ${statusBg} ${statusBorder}`}>
        <div className="flex items-center gap-2 pl-8">
          <span className={`w-2 h-2 rounded-full animate-pulse ${statusText.replace("text-", "bg-")}`} />
          <span className={`text-[10px] uppercase tracking-[0.2em] font-black ${statusText}`}>
            {statusCfg.text}
          </span>
        </div>

        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 bg-white/60 px-2.5 py-1 rounded-md border border-slate-200/50 shadow-sm">
            <span className="text-[9px] font-black tracking-widest uppercase text-slate-500">
              {getPostTypeLabel(post)}
            </span>
          </div>
          <div className="flex gap-1.5">
            {safeNetworks.map((net) => (
              <span key={net} title={net} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                <NetworkIcon network={net} postId={`${post.id}-${net}`} />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex items-start gap-5 mb-6">
          {/* Date block */}
          <div className="bg-slate-50 p-4 rounded-[24px] text-center min-w-[80px] border border-slate-200/50 shadow-inner group-hover:bg-indigo-50 transition-colors">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {format(dateObj, "MMM", { locale: es })}
            </div>
            <div className="text-3xl font-black text-slate-900 leading-none mb-1">
              {format(dateObj, "dd")}
            </div>
            <div className="text-[11px] font-black text-indigo-600">{formattedTime}</div>
          </div>

          {/* Copy preview */}
          <div className="flex-1">
            <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-4 italic group-hover:text-slate-800 transition-colors">
              "{post.postText || post.text || post.copy || post.idea || "Sin texto descriptivo"}"
            </p>
          </div>
        </div>

        {/* Product & Style Badges */}
        {(post.productName || post.visualStyle) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {post.productName && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[10px] font-black tracking-tight shadow-2xs">
                <span>🛍️</span>
                <span className="truncate max-w-[130px]">{post.productName}</span>
                <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-md font-black ${post.baseImageUrl || post.hasProductImage ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"}`}>
                  {post.baseImageUrl || post.hasProductImage ? "Foto Catálogo" : "Foto IA"}
                </span>
              </span>
            )}
            {post.visualStyle && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-900 text-[10px] font-black tracking-tight shadow-2xs">
                <span>🎨</span>
                <span className="truncate max-w-[120px]">{post.visualStyle}</span>
              </span>
            )}
          </div>
        )}

        {/* Media thumbnail */}
        {post.isGeneratingImage ? (
          <div
            onClick={(e) => onResetGenerating(post.id, e)}
            className="mt-2 mb-6 rounded-2xl overflow-hidden border border-slate-200/50 aspect-video bg-indigo-50 flex flex-col items-center justify-center shadow-inner relative animate-pulse cursor-pointer group/stuck"
          >
            <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin mb-3 shadow-md" />
            <p className="text-[10px] font-black text-indigo-500 tracking-widest uppercase bg-white/60 px-3 py-1 rounded-full shadow-sm group-hover/stuck:hidden">
              Generando...
            </p>
            <p className="text-[10px] font-black text-rose-500 tracking-widest uppercase bg-white/80 px-3 py-1 rounded-full shadow-sm hidden group-hover/stuck:block">
              ¿Trabado? Click para Reset
            </p>
          </div>
        ) : post.videoUrl || post.imageUrl || (post.scenes && post.scenes.length > 0) ? (
          <div className="mt-2 mb-6 rounded-2xl overflow-hidden border border-slate-200/50 aspect-square max-h-[340px] bg-slate-950 flex items-center justify-center shadow-inner relative group-hover:border-indigo-200 transition-all cursor-pointer">
            {isVideo ? (
              <div className="w-full h-full relative bg-slate-950 flex items-center justify-center">
                <video
                  src={post.videoUrl || post.imageUrl}
                  className="w-full h-full object-contain opacity-95 group-hover:opacity-100 transition-opacity"
                  muted
                  playsInline
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-white/95 text-indigo-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform pl-0.5">
                    <span className="text-base">▶</span>
                  </div>
                  <span className="bg-slate-900/90 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/20 shadow-md">
                    🎬 Video Listo
                  </span>
                </div>
              </div>
            ) : post.scenes && post.scenes.length > 0 ? (
              <div className="w-full h-full relative bg-indigo-950 flex items-center justify-center">
                {post.scenes[0]?.bgImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.scenes[0].bgImageUrl} alt="Reel Scene" className="w-full h-full object-cover opacity-80" />
                )}
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-white/95 text-indigo-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform pl-0.5">
                    <span className="text-base">▶</span>
                  </div>
                  <span className="bg-slate-900/90 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/20 shadow-md">
                    ✨ Previsualizar Reel
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrl}
                  alt="Ref"
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {post.imageUrls && post.imageUrls.length > 1 && (
                  <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-sm border border-white/10 flex items-center gap-1.5">
                    <span>📑</span> 1/{post.imageUrls.length}
                  </div>
                )}
              </>
            )}
          </div>
        ) : ["business", "agency"].includes(userPlan) ? (
          <div
            className="mt-2 mb-6 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 aspect-video bg-slate-50/50 flex items-center justify-center shadow-inner hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer group/media"
            onClick={(e) => onGenerateMedia(post.id, e)}
          >
            <div className="text-center p-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm text-indigo-500 mx-auto mb-3 group-hover/media:scale-110 group-hover/media:bg-indigo-500 group-hover/media:text-white transition-all">
                ✨
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/media:text-indigo-600 transition-colors">
                Generar Multimedia
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-2 mb-6 rounded-2xl overflow-hidden border border-slate-200/50 aspect-video bg-slate-50 flex items-center justify-center relative shadow-inner">
            <div className="text-center p-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 text-lg mx-auto mb-2 opacity-80 shadow-inner border border-emerald-100/50">
                🤖
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Post en Piloto Automático
              </p>
              <Link
                href="/automatizacion-rrss/panel/planes"
                className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 mt-2 hover:underline uppercase block"
              >
                Mejorar a Business para Vista Previa
              </Link>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-auto pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {post.status === "confirmed" && (
              <button
                onClick={(e) => onUnconfirm(post, e)}
                className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-600 px-3 py-2 hover:bg-amber-50 rounded-xl transition-all"
              >
                Pasar a Borrador
              </button>
            )}
            {activeTab === "upcoming" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReschedule(post);
                }}
                className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 px-3 py-2 hover:bg-indigo-50 rounded-xl transition-all"
              >
                Reagendar
              </button>
            )}
          </div>
          <button
            onClick={(e) => onDelete(post.id, e)}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 px-3 py-2 hover:bg-rose-50 rounded-xl transition-all shrink-0"
          >
            {post.status === "published" ? "Ocultar" : isPending ? "Borrar permanentemente" : "Borrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
