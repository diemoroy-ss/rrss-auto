"use client";

import { useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { format } from "date-fns";
import { auth } from "../../../lib/firebase";
import { useProfile } from "../../../contexts/ProfileContext";

// Hooks
import { useQuota } from "../../../hooks/useQuota";
import { useDashboardPosts } from "../../../hooks/useDashboardPosts";
import { usePostActions } from "../../../hooks/usePostActions";

// Componentes de UI
import DashboardHeader from "../../../components/panel/DashboardHeader";
import PostFilters from "../../../components/panel/PostFilters";
import PostGrid from "../../../components/panel/PostGrid";
import BulkActionBar from "../../../components/panel/BulkActionBar";

// Modales
import PostDetailModal from "../../../components/panel/modals/PostDetailModal";
import UpgradeModal from "../../../components/panel/modals/UpgradeModal";
import ConfirmModal from "../../../components/panel/modals/ConfirmModal";
import RescheduleModal from "../../../components/panel/modals/RescheduleModal";
import PublishResultModal from "../../../components/panel/modals/PublishResultModal";
import StoryFormatModal from "../../../components/panel/modals/StoryFormatModal";

// Tipos
import { SocialPost } from "../../../types/dashboard";

// ---------------------------------------------------------------------------
// Tipos de estado de modales
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Componente principal — orquestador liviano
// ---------------------------------------------------------------------------

export default function RrssDashboard() {
  // --- Auth ---
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const { activeProfile } = useProfile();

  // --- Hooks de datos ---
  const quota = useQuota(activeProfile?.id);
  const dashboard = useDashboardPosts(user?.uid, activeProfile?.id);

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
      <div className="animate-pulse space-y-4 max-w-4xl">
        <div className="h-10 bg-slate-200 rounded w-1/3" />
        <div className="h-64 bg-slate-200 rounded" />
      </div>
    );
  }

  const videosUsed = quota.getVideosUsed(dashboard.posts);

  return (
    <div className="w-full max-w-7xl mx-auto">

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

      {/* Header */}
      <DashboardHeader
        activeTab={dashboard.activeTab}
        displayName={user?.displayName}
        quotaUsed={quota.quotaUsed}
        planLimit={quota.planLimit}
        imagesUsed={quota.imagesUsed}
        imageLimit={quota.imageLimit}
        videosUsed={quota.videosUsed}
        videoLimit={quota.videoLimit}
      />

      {/* Filtros + calendario */}
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

      {/* Grid de posts */}
      <PostGrid
        filteredPosts={dashboard.filteredPosts}
        paginatedPosts={dashboard.paginatedPosts}
        totalPages={dashboard.totalPages}
        currentPage={dashboard.currentPage}
        selectedPostIds={selectedPostIds}
        activeTab={dashboard.activeTab}
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

      {/* Bulk action bar */}
      <BulkActionBar
        selectedCount={selectedPostIds.length}
        onConfirm={actions.handleBulkConfirm}
        onUnconfirm={actions.handleBulkUnconfirm}
        onDelete={actions.handleBulkDelete}
        onClear={() => setSelectedPostIds([])}
      />

      {/* Full-screen loading overlay mientras publica */}
      {publishingPostId && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="text-center text-white max-w-sm animate-bounce">
            <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/40 border border-indigo-400">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white animate-spin rounded-full" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">Publicando Contenido...</h3>
            <p className="text-indigo-200/80 font-medium text-sm leading-relaxed">
              Estamos conectándonos con los servidores de Meta y enviando tus imágenes. Esto puede tardar unos segundos. 🚀
            </p>
          </div>
        </div>
      )}

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
