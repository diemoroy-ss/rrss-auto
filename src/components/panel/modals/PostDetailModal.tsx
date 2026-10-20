"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import NetworkIcon from "../NetworkIcon";
import DashboardCarouselViewer from "../DashboardCarouselViewer";
import { SocialPost } from "../../../types/dashboard";
// Importación dinámica para RemotionReelPlayer (heavy component)
import dynamic from "next/dynamic";
const RemotionReelPlayer = dynamic(
  () => import("../../video/RemotionReelPlayer"),
  { ssr: false, loading: () => <div className="w-full aspect-[9/16] bg-slate-100 rounded-2xl animate-pulse" /> }
);

interface PostDetailModalProps {
  post: SocialPost | null;
  userPlan: string;
  activeProfile: any;
  isUpdatingStatus: boolean;
  publishingPostId: string | null;
  isPublishingStory: boolean;
  isGeneratingStyledImage: boolean;
  isUploadingBaseImage: boolean;
  onClose: () => void;
  onToggleNetwork: (post: SocialPost, network: string, e: React.MouseEvent) => void;
  onChangeType: (post: SocialPost, type: string, e: React.MouseEvent) => void;
  onChangeCarouselCount: (post: SocialPost, count: number) => void;
  onUploadBaseImage: (postId: string, file: File) => void;
  onRemoveBaseImage: (postId: string) => void;
  onGenerateStyledImage: (postId: string) => void;
  onGenerateMedia: (postId: string, e?: React.MouseEvent) => void;
  onResetGeneratingState: (postId: string, e?: React.MouseEvent) => void;
  onPublishNow: (postId: string) => void;
  onPublishStory: (postId: string) => void;
  onUpdateStatus: (postId: string, newStatus: "pending" | "confirmed") => void;
}

export default function PostDetailModal({
  post,
  userPlan,
  activeProfile,
  isUpdatingStatus,
  publishingPostId,
  isPublishingStory,
  isGeneratingStyledImage,
  isUploadingBaseImage,
  onClose,
  onToggleNetwork,
  onChangeType,
  onChangeCarouselCount,
  onUploadBaseImage,
  onRemoveBaseImage,
  onGenerateStyledImage,
  onGenerateMedia,
  onResetGeneratingState,
  onPublishNow,
  onPublishStory,
  onUpdateStatus,
}: PostDetailModalProps) {
  if (!post) return null;

  const dateObj = post.scheduledFor?.toDate ? post.scheduledFor.toDate() : new Date();

  const safeNetworks = Array.isArray(post.networks)
    ? post.networks
    : Object.entries(post.networks || {}).filter(([, v]) => v).map(([k]) => k);

  const isVideo =
    post.videoUrl ||
    (post.imageUrl &&
      (post.imageUrl.includes(".mp4") ||
        post.imageUrl.includes("video") ||
        (post.type === "Reel" && post.imageUrl.includes("firebasestorage"))));

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 pointer-events-auto">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl w-full max-w-2xl relative z-10 animate-in slide-in-from-bottom md:zoom-in duration-300 h-[90vh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header Sticky */}
        <div className="p-6 sm:p-10 pb-4 border-b border-slate-100 shrink-0 relative">
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 md:hidden" />
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 text-2xl font-black transition-colors"
          >
            &times;
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pr-10 md:pr-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl md:text-3xl shadow-sm border border-indigo-100/50">
                📱
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 mb-0.5 md:mb-1">Detalle</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  {format(dateObj, "d MMM, yyyy - HH:mm", { locale: es })}
                </p>
              </div>
            </div>

            {/* Network toggles */}
            <div className="flex flex-col items-start sm:items-end gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Publicar en:</span>
              <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                {["facebook", "instagram", "googleBusiness", "linkedin", "tiktok", "youtube", "x"]
                  .filter((net) => {
                    if (net === "linkedin") return !!activeProfile?.linkedinUserToken_enc || !!activeProfile?.linkedinToken_enc || safeNetworks.includes("linkedin");
                    if (net === "tiktok") return !!activeProfile?.tiktokToken_enc || safeNetworks.includes("tiktok");
                    if (net === "googleBusiness") return !!activeProfile?.googleBusinessToken_enc || safeNetworks.includes("googleBusiness");
                    if (net === "youtube") return !!activeProfile?.youtubeConnected || !!activeProfile?.accounts?.youtube?.connected || safeNetworks.includes("youtube");
                    if (net === "x") return !!activeProfile?.xConnected || !!activeProfile?.accounts?.x?.connected || safeNetworks.includes("x");
                    return true;
                  })
                  .map((net) => {
                    const isActive = safeNetworks.includes(net);
                    return (
                      <button
                        key={net}
                        onClick={(e) => onToggleNetwork(post, net, e)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                          isActive
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600 scale-105 shadow-sm shadow-indigo-500/10"
                            : "bg-slate-50 border-slate-100 text-slate-400 opacity-60"
                        }`}
                      >
                        <span className={`${!isActive ? "grayscale opacity-60" : ""} w-4 h-4 flex items-center justify-center`}>
                          <NetworkIcon network={net} postId={post.id} />
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {net === "googleBusiness" ? "Google" : net === "youtube" ? "YouTube" : net === "x" ? "X" : net}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 pt-4 pb-52 hide-scrollbar">
          <div className="space-y-6">

            {/* Error de publicación */}
            {post.publishError && (
              <div className="bg-rose-50 border-2 border-rose-200 rounded-[24px] p-6 text-rose-800 animate-in slide-in-from-top-2 fade-in">
                <div className="flex gap-3 items-start">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="font-black text-sm tracking-tight text-rose-900 uppercase">Error de Publicación</h4>
                    <p className="text-xs font-semibold text-rose-700/90 mt-1 leading-relaxed">{post.publishError}</p>
                    <p className="text-[10px] font-bold text-rose-500 mt-3 uppercase tracking-wider">
                      Por favor, revisa la conexión de tus cuentas de redes sociales en el panel de configuración o el estado de tus tokens de Meta/LinkedIn.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Formato / Tipo */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-slate-100 text-slate-500 rounded-xl border border-slate-200">Formato</span>
              <div className="flex gap-2">
                {["Post", "Historia", "Carrusel", "Reel"].map((type) => {
                  const effectiveType = (post.imageUrls && post.imageUrls.length > 1 && post.type !== 'Reel')
                    ? 'Carrusel'
                    : (post.type || (post as any).postType || 'Post');
                  const isActive = effectiveType === type;
                  return (
                    <button
                      key={type}
                      onClick={(e) => onChangeType(post, type, e)}
                      className={`text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-xl border transition-all ${
                        isActive
                          ? type === "Historia" ? "bg-amber-50 text-amber-600 border-amber-200 shadow-sm scale-105"
                          : type === "Carrusel" ? "bg-purple-50 text-purple-600 border-purple-200 shadow-sm scale-105"
                          : type === "Reel" ? "bg-rose-50 text-rose-600 border-rose-200 shadow-sm scale-105"
                          : "bg-blue-50 text-blue-600 border-blue-200 shadow-sm scale-105"
                          : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
              <span className={`text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-xl border ${
                post.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-200"
                : post.status === "confirmed" ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                : post.status === "publishing" ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm animate-pulse"
                : post.status === "published" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-slate-50 text-slate-600 border-slate-200"
              }`}>
                Estado: {post.status === "pending" ? "Borrador" : post.status === "confirmed" ? "Confirmado" : post.status === "publishing" ? "Publicando..." : post.status === "published" ? "Publicado" : post.status}
              </span>
              {post.visualStyle && (
                <span className="text-[10px] uppercase font-black tracking-widest px-3.5 py-2 rounded-xl border bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1.5 shadow-sm">
                  <span>🎨</span> Estilo: {post.visualStyle}
                </span>
              )}
              {(post.isTestMode || post.testMode) && (
                <span className="text-[10px] uppercase font-black tracking-widest px-3.5 py-2 rounded-xl border bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1.5 shadow-sm">
                  <span>🧪</span> Modo Prueba (santisoftai@gmail.com)
                </span>
              )}
            </div>

            {/* Carrusel count */}
            {(post.type === "Carrusel" || (post as any).postType === "Carrusel" || (post.imageUrls && post.imageUrls.length > 1 && post.type !== "Reel")) && (
              <div className="bg-purple-50/50 p-4 rounded-[20px] border border-purple-100 shadow-inner mt-4 animate-in slide-in-from-top-2 fade-in">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 mb-3 flex items-center gap-2">
                  <span>🖼️</span> ¿Cuántas imágenes tendrá el Carrusel?
                </h3>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="2"
                    max={Math.max(10, post.carouselCount || 5, post.imageUrls?.length || 5)}
                    value={post.imageUrls?.length || post.carouselCount || 3}
                    onChange={(e) => onChangeCarouselCount(post, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-sm shrink-0">
                    <span className="text-sm font-black text-purple-600">{post.imageUrls?.length || post.carouselCount || 3}</span>
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">imgs</span>
                  </div>
                </div>
                <p className="mt-3 text-[10px] leading-tight text-purple-600/80 bg-purple-50 p-2 rounded-lg border border-purple-100/50">
                  👉 <span className="font-semibold">Nota:</span> Para que se publiquen todas las imágenes del carrusel, debes presionar "Generar Multimedia" antes de la hora agendada.
                </p>
              </div>
            )}

            {/* Idea */}
            <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100 shadow-inner">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-3 flex items-center gap-2">
                <span>💡</span> Idea Principal / Enganche
              </h3>
              <p className="text-xl font-black text-slate-900 leading-tight">"{post.idea}"</p>
            </div>

            {/* Texto descriptivo */}
            {post.text && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-2">Texto Descriptivo / Instrucción Visual</h3>
                <div className="bg-white p-6 rounded-[28px] border-2 border-slate-100 text-slate-600 font-medium whitespace-pre-wrap text-[15px] leading-relaxed">
                  {post.text}
                </div>
              </div>
            )}

            {/* Copy */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-3 ml-2">Copy / Pie de Foto para Redes</h3>
              <div className="bg-indigo-50/30 p-6 rounded-[28px] border-2 border-indigo-100 text-slate-800 font-medium whitespace-pre-wrap text-[15px] leading-relaxed relative shadow-inner">
                {post.postText || post.copy
                  ? post.postText || post.copy
                  : <span className="text-slate-400 italic">El copy se generará automáticamente con la imagen.</span>}
              </div>
            </div>

            {/* Estilo visual e imagen base */}
            <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-white p-6 rounded-[28px] border-2 border-indigo-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🎨</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Estilo Visual e Imagen Base</h4>
                    <p className="text-[11px] font-medium text-slate-500">Personaliza la imagen del post usando una imagen base o el catálogo de tu negocio.</p>
                  </div>
                </div>
                {post.visualStyle && (
                  <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-xl border bg-white text-indigo-700 border-indigo-200 flex items-center gap-1.5 shadow-2xs w-fit">
                    <span>✨</span> {post.visualStyle}
                  </span>
                )}
              </div>

              {/* Producto asignado del catálogo */}
              {post.productName && (
                <div className="bg-white rounded-2xl p-4 border border-amber-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <span>🛍️</span> Producto del Catálogo Asociado
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${post.baseImageUrl || post.hasProductImage ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-indigo-100 text-indigo-800 border border-indigo-200"}`}>
                      {post.baseImageUrl || post.hasProductImage ? "✓ Con Foto de Catálogo" : "🎨 Fotografía a Generar"}
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900">{post.productName}</div>
                  {post.productDescription && (
                    <p className="text-xs text-slate-600 font-medium">{post.productDescription}</p>
                  )}
                  {post.imageDirection && (
                    <div className="text-[11px] text-slate-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 mt-1">
                      <span className="font-bold text-amber-950">Dirección de Arte de nuestros agentes: </span>
                      {post.imageDirection}
                    </div>
                  )}
                </div>
              )}

              {/* Zona de imagen base */}
              <div className="bg-white rounded-2xl p-4 border border-indigo-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5"><span>📷</span> Imagen Base de Referencia</span>
                  {post.baseImageUrl ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md">✓ Imagen Base Activa</span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Sin imagen base subida</span>
                  )}
                </div>

                {post.baseImageUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.baseImageUrl} alt="Imagen base" className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-2xs shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-black text-slate-800 truncate">Imagen base para estilo visual</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">Nuestros agentes preservarán este producto y aplicarán el estilo visual elegido.</p>
                      <div className="flex items-center gap-2 pt-1">
                        <label className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg cursor-pointer transition-all shadow-2xs">
                          Cambiar foto
                          <input type="file" accept="image/*" className="hidden" disabled={isUploadingBaseImage} onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadBaseImage(post.id, f); }} />
                        </label>
                        <button onClick={() => onRemoveBaseImage(post.id)} className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg transition-all">Quitar</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <div className="text-xs text-slate-600 font-medium">
                        <span className="font-bold text-slate-800">Sube una foto real de tu producto</span> para aplicar el estilo sobre ella.
                      </div>
                      <label className={`text-xs font-black px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl cursor-pointer transition-all shrink-0 shadow-2xs flex items-center gap-1.5 ${isUploadingBaseImage ? "opacity-50 pointer-events-none" : ""}`}>
                        <span>{isUploadingBaseImage ? "Subiendo..." : "📤 Subir Foto Base"}</span>
                        <input type="file" accept="image/*" className="hidden" disabled={isUploadingBaseImage} onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadBaseImage(post.id, f); }} />
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/60">
                      💡 <strong>Jerarquía Inteligente:</strong> Si no subes una imagen base, nuestros agentes buscarán la foto de este producto en tu catálogo. Si tu producto no tiene foto cargada, generarán la fotografía publicitaria desde cero con el estilo visual seleccionado.
                    </p>
                  </div>
                )}
              </div>

              {/* Botón generar con estilo */}
              <button
                onClick={() => onGenerateStyledImage(post.id)}
                disabled={isGeneratingStyledImage || isUploadingBaseImage}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isGeneratingStyledImage ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /><span>Creando imagen con estilo visual...</span></>
                ) : (
                  <span>🎨 Generar Imagen con Estilo Visual</span>
                )}
              </button>
            </div>

            {/* Preview de media */}
            {post.isGeneratingImage ? (
              <div className="rounded-[28px] p-8 bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center animate-pulse">
                <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4 shadow-md" />
                <p className="text-xs font-black text-indigo-600 tracking-widest uppercase mb-4">Pintando con n8n...</p>
                <button onClick={(e) => onResetGeneratingState(post.id, e)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 bg-white px-4 py-2 rounded-xl border border-slate-100 transition-all">
                  Resetear Estado (Si está trabado)
                </button>
              </div>
            ) : (post.videoUrl || post.imageUrl || (post.scenes && post.scenes.length > 0)) ? (
              <div>
                <div className="flex items-center justify-between mb-3 ml-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {isVideo ? "🎬 Video Generado / Publicado" : "Referencia Visual"}
                  </h3>
                  {isVideo ? (
                    <a href={post.videoUrl || post.imageUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-all flex items-center gap-1.5 shadow-sm">
                      <span>🔗</span> Abrir / Descargar MP4 ↗
                    </a>
                  ) : ["business", "agency"].includes(userPlan) ? (
                    <button onClick={(e) => onGenerateMedia(post.id, e)} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all flex items-center gap-1.5 shadow-sm">
                      <span>✨</span> Volver a Generar
                    </button>
                  ) : null}
                </div>
                <div className="rounded-[28px] p-4 bg-slate-950 border-2 border-slate-900 flex flex-col items-center justify-center">
                  {isVideo ? (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800">
                        <video src={post.videoUrl || post.imageUrl} controls autoPlay loop playsInline className="w-full h-full object-cover" />
                      </div>
                      <div className="w-full bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-300 truncate">
                          <span className="text-emerald-400 font-bold">● MP4 HD</span>
                          <span className="text-[11px] text-slate-400 truncate max-w-[180px] font-mono">{post.videoUrl || post.imageUrl}</span>
                        </div>
                        <a href={post.videoUrl || post.imageUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase rounded-lg shrink-0 transition-all">
                          Ver Pantalla Completa ↗
                        </a>
                      </div>
                    </div>
                  ) : post.scenes && post.scenes.length > 0 ? (
                    <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-2xl w-full">
                      {(() => {
                        const rawTotal = post.scenes.reduce((acc: number, s: any) => acc + (s.duration || 3.3), 0);
                        const scale = rawTotal > 10 ? 10 / rawTotal : 1;
                        const scaledScenes = post.scenes.map((s: any) => ({
                          ...s,
                          duration: Math.max(1, Math.round((s.duration || 3.3) * scale * 10) / 10),
                        }));
                        return (
                          <RemotionReelPlayer
                            composition={{
                              title: post.idea || post.title || "Reel Animado",
                              rubro: activeProfile?.rubro || "General",
                              totalDuration: Math.min(10, Math.max(3, Math.round(rawTotal * scale * 10) / 10)),
                              audioScript: post.audioScript || "",
                              copyText: post.copy || post.text || "",
                              scenes: scaledScenes,
                            }}
                          />
                        );
                      })()}
                    </div>
                  ) : (
                    <DashboardCarouselViewer
                      urls={post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : [post.imageUrl]}
                      isStory={post.type === "Historia" || post.type === "Story"}
                    />
                  )}
                </div>
              </div>
            ) : ["business", "agency"].includes(userPlan) ? (
              <div onClick={(e) => onGenerateMedia(post.id, e as any)} className="rounded-[28px] p-8 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all group/modalmedia">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm text-indigo-500 mx-auto mb-4 group-hover/modalmedia:scale-110 group-hover/modalmedia:bg-indigo-500 group-hover/modalmedia:text-white transition-all">✨</div>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest group-hover/modalmedia:text-indigo-600">Generar Vista Previa Ahora</p>
              </div>
            ) : (
              <div className="rounded-[28px] p-8 bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-3xl shadow-sm mx-auto mb-4">🤖</div>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Confía en Piloto Automático</p>
                <p className="text-xs text-slate-400 mt-2 text-center max-w-sm">Mejora a Business o Agency para pre-visualizar y editar las imágenes generadas antes de que sean publicadas.</p>
              </div>
            )}

          </div>
        </div>

        {/* Sticky Actions Bar */}
        <div className="shrink-0 p-6 sm:p-10 border-t border-slate-100 bg-white/80 backdrop-blur-xl absolute bottom-0 inset-x-0 z-20">
          <div className="w-full flex flex-col sm:flex-row gap-4">
            {post.status === "published" ? (
              <>
                <button
                  onClick={() => onPublishNow(post.id)}
                  disabled={publishingPostId === post.id}
                  className="flex-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-2xl md:rounded-[28px] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  {publishingPostId === post.id ? <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 animate-spin rounded-full" /> : <span>✨</span>}
                  <span>{publishingPostId === post.id ? "Republicando..." : "Publicación Lista (Click para Republicar)"}</span>
                </button>

                {(safeNetworks.includes("instagram")) ? (
                  <button
                    onClick={() => onPublishStory(post.id)}
                    disabled={isPublishingStory}
                    className="flex-1 bg-gradient-to-br from-pink-500 to-rose-600 text-white px-8 py-4 md:py-5 rounded-2xl md:rounded-[28px] font-black text-[13px] uppercase tracking-[0.1em] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group/story shadow-2xl shadow-rose-500/30 overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/story:opacity-100 transition-opacity" />
                    {isPublishingStory ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <span className="text-2xl group-hover/story:scale-125 transition-transform duration-300">📱</span>}
                    <span className="relative z-10">{isPublishingStory ? "Compartiendo Historia..." : "Compartir como Historia"}</span>
                  </button>
                ) : (
                  <div className="flex-1 bg-slate-50 border border-slate-200 text-slate-400 px-6 py-4 rounded-2xl md:rounded-[28px] font-bold text-xs flex items-center justify-center gap-2">
                    <span>ℹ️</span> No disponible para historias (Sin Instagram)
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => onPublishNow(post.id)}
                  disabled={publishingPostId === post.id || !post.imageUrl || post.status === "publishing"}
                  className="flex-1 bg-gradient-to-br from-slate-800 to-black text-white px-8 py-4 md:py-5 rounded-2xl md:rounded-[28px] font-black text-[13px] uppercase tracking-[0.1em] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed group/publish shadow-2xl shadow-slate-900/30 overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-transparent opacity-0 group-hover/publish:opacity-100 transition-opacity" />
                  {(publishingPostId === post.id || post.status === "publishing") ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  ) : (
                    <span className="text-2xl group-hover/publish:scale-125 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">🔥</span>
                  )}
                  <span className="relative z-10">{post.status === "publishing" ? "Publicando..." : "Publicar Ahora!!!"}</span>
                </button>

                <button
                  onClick={() => onUpdateStatus(post.id, post.status === "confirmed" ? "pending" : "confirmed")}
                  disabled={isUpdatingStatus || post.status === "publishing"}
                  className="flex-1 bg-gradient-to-br from-indigo-600 to-violet-700 text-white px-8 py-4 md:py-5 rounded-2xl md:rounded-[28px] font-black text-[13px] uppercase tracking-[0.1em] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed group/bot shadow-2xl shadow-indigo-600/30 overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/bot:opacity-100 transition-opacity" />
                  {isUpdatingStatus ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  ) : (
                    <span className="text-2xl group-hover/bot:rotate-12 transition-transform duration-300">
                      {post.status === "confirmed" ? "⏳" : "✅"}
                    </span>
                  )}
                  <span className="relative z-10">{post.status === "confirmed" ? "Desmarcar Bot" : "Confirmar Bot"}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
