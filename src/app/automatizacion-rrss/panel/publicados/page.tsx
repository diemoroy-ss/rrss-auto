"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { format } from "date-fns";
import { auth } from "../../../../lib/firebase";
import { useProfile } from "../../../../contexts/ProfileContext";

// Hooks
import { useQuota } from "../../../../hooks/useQuota";
import { useDashboardPosts } from "../../../../hooks/useDashboardPosts";
import { usePostActions } from "../../../../hooks/usePostActions";

// Componentes de UI
import PublishedStatsHero from "../../../../components/panel/PublishedStatsHero";
import PostFilters from "../../../../components/panel/PostFilters";
import PostGrid from "../../../../components/panel/PostGrid";
import BulkActionBar from "../../../../components/panel/BulkActionBar";

// Modales
import PostDetailModal from "../../../../components/panel/modals/PostDetailModal";
import UpgradeModal from "../../../../components/panel/modals/UpgradeModal";
import ConfirmModal from "../../../../components/panel/modals/ConfirmModal";
import RescheduleModal from "../../../../components/panel/modals/RescheduleModal";
import PublishResultModal from "../../../../components/panel/modals/PublishResultModal";
import StoryFormatModal from "../../../../components/panel/modals/StoryFormatModal";

// Tipos
import { SocialPost } from "../../../../types/dashboard";

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  desc: string;
  confirmText: string;
  cancelText: string;
  isDanger: boolean;
  onConfirm: () => void;
  secondaryAction?: { text: string; onClick: () => void };
}

interface PublishResult {
  isOpen: boolean;
  success: boolean;
  published: string[];
  errors: string | null;
}

interface StoryFormatWarning {
  isOpen: boolean;
  post: SocialPost;
  imageUrl: string;
}

export default function PublicadosPage() {
  // --- Auth ---
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const { activeProfile } = useProfile();

  // --- Hooks de datos (fijado en published) ---
  const quota = useQuota(activeProfile?.id);
  const dashboard = useDashboardPosts(user?.uid, activeProfile?.id, "published");

  // Forzar tab published
  useEffect(() => {
    if (dashboard.activeTab !== "published") {
      dashboard.setActiveTab("published");
    }
  }, [dashboard.activeTab, dashboard.setActiveTab]);

  // --- Estado de UI / modales ---
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Modales
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState | null>(null);
  const [rescheduleData, setRescheduleData] = useState<{ id: string; date: string } | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [storyFormatWarning, setStoryFormatWarning] = useState<StoryFormatWarning | null>(null);

  // Loading states de acciones
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [isCancellingAll, setIsCancellingAll] = useState(false);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);
  const [isPublishingStory, setIsPublishingStory] = useState(false);
  const [isRegeneratingStoryMedia, setIsRegeneratingStoryMedia] = useState(false);
  const [isUploadingBaseImage, setIsUploadingBaseImage] = useState(false);
  const [isGeneratingStyledImage, setIsGeneratingStyledImage] = useState(false);

  // --- Hook de acciones ---
  const actions = usePostActions({
    posts: dashboard.posts,
    blogPosts: dashboard.blogPosts,
    selectedPost: dashboard.selectedPost,
    userPlan: quota.userPlan,
    quotaUsed: quota.quotaUsed,
    planLimit: quota.planLimit,
    activeProfile,
    filteredPosts: dashboard.filteredPosts,
    selectedPostIds,
    rescheduleData,
    storyFormatWarning,
    updatePostInCache: dashboard.updatePostInCache,
    removePostFromCache: dashboard.removePostFromCache,
    setQuotaUsed: quota.setQuotaUsed,
    setSelectedPost: dashboard.setSelectedPost,
    setMessage,
    setUpgradeModalOpen,
    setConfirmModalState,
    setRescheduleData,
    setPublishResult,
    setStoryFormatWarning,
    setSelectedPostIds,
    setIsUpdatingStatus,
    setIsConfirmingAll,
    setIsCancellingAll,
    setPublishingPostId,
    setIsPublishingStory,
    setIsRegeneratingStoryMedia,
    setIsUploadingBaseImage,
    setIsGeneratingStyledImage,
  });

  // Auto-dismiss message after 5s
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(t);
  }, [message]);

  // --- Loading ---
  if (dashboard.loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-7xl mx-auto p-4 sm:p-6">
        <div className="h-12 bg-slate-200 rounded-2xl w-1/3" />
        <div className="h-48 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-64 bg-slate-200 rounded-3xl" />
          <div className="h-64 bg-slate-200 rounded-3xl" />
          <div className="h-64 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-6">

      {/* Toast */}
      {message && (
        <div className="fixed top-6 right-6 z-[9999] max-w-md w-full p-4 animate-in slide-in-from-right-10 fade-in duration-300 pointer-events-auto">
          <div
            className={`rounded-3xl p-4 shadow-2xl border flex items-center gap-3 bg-white/95 backdrop-blur-md ${
              message.type === "error"
                ? "border-rose-100 text-rose-800 shadow-rose-100/30"
                : "border-emerald-100 text-emerald-800 shadow-emerald-100/30"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm ${
                message.type === "error" ? "bg-rose-50" : "bg-emerald-50"
              }`}
            >
              {message.type === "error" ? "⚠️" : "✅"}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black tracking-tight uppercase text-slate-400">
                {message.type === "error" ? "Error del Sistema" : "Operación Exitosa"}
              </p>
              <p className="text-xs font-bold text-slate-700 mt-0.5 leading-tight">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-600 text-lg font-black px-2"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Hero de Estadísticas y Métricas de Posts Publicados */}
      <PublishedStatsHero
        posts={dashboard.posts}
        selectedDateFilter={dashboard.selectedDateFilter}
        onSelectDateFilter={dashboard.setSelectedDateFilter}
        networkFilter={dashboard.networkFilter}
        onSelectNetworkFilter={dashboard.setNetworkFilter}
      />

      {/* Selector de Rango de Historial (Por defecto: Últimos 30 días) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-base">🕰️</span>
          <div>
            <p className="text-xs font-black text-slate-800">Rango de Publicaciones</p>
            <p className="text-[11px] text-slate-500 font-medium">Por defecto se muestran los últimos 30 días de actividad</p>
          </div>
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/70 text-xs font-bold">
          <button
            type="button"
            onClick={() => dashboard.setHistoryRange("30days")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dashboard.historyRange === "30days"
                ? "bg-white text-indigo-700 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Últimos 30 días
          </button>
          <button
            type="button"
            onClick={() => dashboard.setHistoryRange("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dashboard.historyRange === "all"
                ? "bg-white text-indigo-700 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Todo el historial ({dashboard.posts.filter(p => p.status === 'published').length})
          </button>
        </div>
      </div>

      {/* Filtros + selector de fecha */}
      <PostFilters
        networkFilter={dashboard.networkFilter}
        setNetworkFilter={dashboard.setNetworkFilter}
        selectedDateFilter={dashboard.selectedDateFilter}
        setSelectedDateFilter={dashboard.setSelectedDateFilter}
        isCalendarOpen={isCalendarOpen}
        setIsCalendarOpen={setIsCalendarOpen}
        currentMonth={dashboard.currentMonth}
        nextMonth={dashboard.nextMonth}
        prevMonth={dashboard.prevMonth}
        daysInMonth={dashboard.daysInMonth}
        startDayIndex={dashboard.startDayIndex}
        getDotsForDate={dashboard.getDotsForDate}
      />

      {/* Grilla de Publicaciones */}
      <PostGrid
        filteredPosts={dashboard.filteredPosts}
        paginatedPosts={dashboard.paginatedPosts}
        totalPages={dashboard.totalPages}
        currentPage={dashboard.currentPage}
        selectedPostIds={selectedPostIds}
        activeTab="published"
        selectedDateFilter={dashboard.selectedDateFilter}
        userPlan={quota.userPlan}
        onSelectPost={actions.toggleSelectPost}
        onToggleSelectAll={actions.toggleSelectAll}
        onClickPost={dashboard.setSelectedPost}
        onUnconfirm={actions.handleUnconfirm}
        onReschedule={(post) => {
          const dateObj = post.scheduledFor?.toDate ? post.scheduledFor.toDate() : new Date();
          setRescheduleData({ id: post.id, date: format(dateObj, "yyyy-MM-dd'T'HH:mm") });
        }}
        onDelete={actions.handleDelete}
        onGenerateMedia={actions.handleGenerateMedia}
        onResetGenerating={actions.handleResetGeneratingState}
        onClearDateFilter={() => dashboard.setSelectedDateFilter(null)}
        onPageChange={dashboard.setCurrentPage}
      />

      {/* Bulk action bar si hay seleccionados */}
      <BulkActionBar
        selectedCount={selectedPostIds.length}
        onConfirm={actions.handleBulkConfirm}
        onUnconfirm={actions.handleBulkUnconfirm}
        onDelete={actions.handleBulkDelete}
        onClear={() => setSelectedPostIds([])}
      />

      {/* ── Modales ── */}
      <PostDetailModal
        post={dashboard.selectedPost}
        userPlan={quota.userPlan}
        activeProfile={activeProfile}
        isUpdatingStatus={isUpdatingStatus}
        publishingPostId={publishingPostId}
        isPublishingStory={isPublishingStory}
        isGeneratingStyledImage={isGeneratingStyledImage}
        isUploadingBaseImage={isUploadingBaseImage}
        onClose={() => dashboard.setSelectedPost(null)}
        onToggleNetwork={actions.toggleNetwork}
        onChangeType={actions.handleChangeType}
        onChangeCarouselCount={actions.handleChangeCarouselCount}
        onUploadBaseImage={actions.handleUploadBaseImage}
        onRemoveBaseImage={actions.handleRemoveBaseImage}
        onGenerateStyledImage={actions.handleGenerateStyledImage}
        onGenerateMedia={actions.handleGenerateMedia}
        onResetGeneratingState={actions.handleResetGeneratingState}
        onPublishNow={actions.handlePublishNow}
        onPublishStory={actions.handlePublishStory}
        onUpdateStatus={actions.handleUpdateStatus}
      />

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />

      <ConfirmModal
        isOpen={!!confirmModalState?.isOpen}
        title={confirmModalState?.title ?? ""}
        desc={confirmModalState?.desc ?? ""}
        confirmText={confirmModalState?.confirmText ?? "Confirmar"}
        cancelText={confirmModalState?.cancelText ?? "Cancelar"}
        isDanger={confirmModalState?.isDanger ?? false}
        onConfirm={confirmModalState?.onConfirm ?? (() => {})}
        onCancel={() => setConfirmModalState(null)}
        secondaryAction={confirmModalState?.secondaryAction}
      />

      <RescheduleModal
        isOpen={!!rescheduleData}
        date={rescheduleData?.date ?? ""}
        isSaving={isUpdatingStatus}
        onDateChange={(date) => rescheduleData && setRescheduleData({ ...rescheduleData, date })}
        onSave={() => rescheduleData && actions.handleSaveReschedule(rescheduleData)}
        onClose={() => setRescheduleData(null)}
      />

      <PublishResultModal
        isOpen={!!publishResult?.isOpen}
        success={publishResult?.success ?? false}
        published={publishResult?.published ?? []}
        errors={publishResult?.errors ?? null}
        onClose={() => {
          setPublishResult(null);
          dashboard.setSelectedPost(null);
        }}
      />

      <StoryFormatModal
        isOpen={!!storyFormatWarning?.isOpen}
        isRegenerating={isRegeneratingStoryMedia}
        onAdapt={() => storyFormatWarning && actions.handleRegenerateStoryImage(storyFormatWarning.post)}
        onPublishAsIs={() => {
          if (storyFormatWarning) {
            const postId = storyFormatWarning.post.id;
            setStoryFormatWarning(null);
            actions.handlePublishStory(postId, true);
          }
        }}
        onClose={() => setStoryFormatWarning(null)}
      />

    </div>
  );
}
