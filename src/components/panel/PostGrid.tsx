"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { isSameDay } from "date-fns";
import PostCard from "./PostCard";
import { SocialPost } from "../../types/dashboard";

interface PostGridProps {
  filteredPosts: SocialPost[];
  paginatedPosts: SocialPost[];
  totalPages: number;
  currentPage: number;
  selectedPostIds: string[];
  activeTab: "upcoming" | "published";
  selectedDateFilter: Date | null;
  userPlan: string;
  onSelectPost: (id: string, e: React.MouseEvent) => void;
  onToggleSelectAll: (filteredPosts: SocialPost[]) => void;
  onClickPost: (post: SocialPost) => void;
  onUnconfirm: (post: SocialPost, e: React.MouseEvent) => void;
  onReschedule: (post: SocialPost) => void;
  onDelete: (postId: string, e: React.MouseEvent) => void;
  onGenerateMedia: (postId: string, e: React.MouseEvent) => void;
  onResetGenerating: (postId: string, e: React.MouseEvent) => void;
  onClearDateFilter: () => void;
  onPageChange: (page: number) => void;
}

/**
 * PostGrid
 * Orquestador que renderiza el grid de PostCards con paginación,
 * empty state y la barra de selección/total.
 */
export default function PostGrid({
  filteredPosts,
  paginatedPosts,
  totalPages,
  currentPage,
  selectedPostIds,
  activeTab,
  selectedDateFilter,
  userPlan,
  onSelectPost,
  onToggleSelectAll,
  onClickPost,
  onUnconfirm,
  onReschedule,
  onDelete,
  onGenerateMedia,
  onResetGenerating,
  onClearDateFilter,
  onPageChange,
}: PostGridProps) {
  const allSelected =
    selectedPostIds.length === filteredPosts.length && filteredPosts.length > 0;

  return (
    <div className="flex flex-col items-start gap-8 w-full">
      {/* Selected date summary */}
      {selectedDateFilter && (
        <div className="w-full sm:max-w-sm mx-auto lg:mx-0 bg-indigo-50/50 rounded-[24px] p-6 border border-indigo-100 flex flex-col justify-center items-center text-center animate-in fade-in zoom-in duration-300">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-lg font-black tracking-tight text-slate-900">
            Viendo {format(selectedDateFilter, "d 'de' MMMM", { locale: es })}
          </h3>
          <button
            onClick={onClearDateFilter}
            className="mt-4 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-widest shadow-sm transition-all w-full"
          >
            Quitar Filtro
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 w-full min-w-0 lg:order-1">
        {/* Selection bar */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onToggleSelectAll(filteredPosts)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  allSelected
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-slate-200 bg-white"
                }`}
              >
                {allSelected && <span>✓</span>}
              </div>
              {allSelected ? "Deseleccionar Todo" : "Seleccionar Todo"}
            </button>
            {selectedPostIds.length > 0 && (
              <span className="text-[10px] font-black text-indigo-400 animate-pulse">
                {selectedPostIds.length} seleccionados
              </span>
            )}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
            Total: {filteredPosts.length} posts
          </div>
        </div>

        {/* Empty state */}
        {filteredPosts.length === 0 ? (
          <div className="premium-card p-16 text-center w-full">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner border border-indigo-100/50 animate-bounce">
              {activeTab === "upcoming" ? "📅" : "📭"}
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === "upcoming"
                ? "No hay publicaciones agendadas"
                : "Aún no tienes publicaciones publicadas"}
            </h3>
            <p className="text-slate-500 mt-4 leading-relaxed font-medium">
              {activeTab === "upcoming"
                ? "Tu bot está listo para trabajar. Crea una nueva idea y prográmala para que se publique automáticamente en tus redes."
                : "Una vez que una publicación programada se envíe a través del bot o mediante publicación manual, aparecerá en esta pestaña local."}
            </p>
            {activeTab === "upcoming" && (
              <Link
                href="/automatizacion-rrss/panel/crear"
                className="inline-block mt-8 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-xl shadow-slate-900/10"
              >
                Crear Mi Primer Post
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isSelected={selectedPostIds.includes(post.id)}
                  userPlan={userPlan}
                  activeTab={activeTab}
                  onSelect={onSelectPost}
                  onClick={onClickPost}
                  onUnconfirm={onUnconfirm}
                  onReschedule={onReschedule}
                  onDelete={onDelete}
                  onGenerateMedia={onGenerateMedia}
                  onResetGenerating={onResetGenerating}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center font-black hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  &lt;&lt;
                </button>
                <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Página{" "}
                  <span className="text-slate-900">{currentPage}</span> de{" "}
                  <span className="text-slate-900">{totalPages}</span>
                </div>
                <button
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center font-black hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  &gt;&gt;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
