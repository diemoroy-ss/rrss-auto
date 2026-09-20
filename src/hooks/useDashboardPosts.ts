import { useState, useEffect, useMemo, useCallback, Dispatch, SetStateAction } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  doc,
  updateDoc,
} from "firebase/firestore";
import { subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { db } from "../lib/firebase";
import { SocialPost } from "../types/dashboard";

const POSTS_PER_PAGE = 12;

interface UseNetworkDots {
  color: string;
  title: string;
}

export interface UseDashboardPostsReturn {
  // Data
  posts: SocialPost[];
  blogPosts: SocialPost[];
  loading: boolean;

  // Derived / computed
  filteredPosts: SocialPost[];
  paginatedPosts: SocialPost[];
  totalPages: number;
  getDotsForDate: (date: Date) => UseNetworkDots[];

  // Filters
  activeTab: "upcoming" | "published";
  setActiveTab: Dispatch<SetStateAction<"upcoming" | "published">>;
  networkFilter: string;
  setNetworkFilter: Dispatch<SetStateAction<string>>;
  selectedDateFilter: Date | null;
  setSelectedDateFilter: Dispatch<SetStateAction<Date | null>>;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;

  // Calendar navigation
  currentMonth: Date;
  nextMonth: () => void;
  prevMonth: () => void;
  daysInMonth: Date[];
  startDayIndex: number;

  // Local cache updaters (para que los handlers no esperen al re-render de Firestore)
  updatePostInCache: (postId: string, updates: Partial<SocialPost>, isBlog?: boolean) => void;
  removePostFromCache: (postId: string, isBlog?: boolean) => void;

  // selectedPost management
  selectedPost: SocialPost | null;
  setSelectedPost: Dispatch<SetStateAction<SocialPost | null>>;
}

/**
 * useDashboardPosts
 *
 * Gestiona el estado de posts del dashboard:
 * - Suscripción en tiempo real a `social_posts` y `blog_posts` de Firestore
 * - Filtros de red social, fecha y pestaña upcoming/published
 * - Paginación
 * - Navegación del calendario
 * - Cache local para actualizaciones optimistas
 */
export function useDashboardPosts(
  userId: string | null | undefined,
  profileId: string | undefined
): UseDashboardPostsReturn {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [blogPosts, setBlogPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<"upcoming" | "published">("upcoming");
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedDateFilter, networkFilter]);

  // --- Firestore subscriptions ---
  useEffect(() => {
    if (!userId || !profileId) return;

    setLoading(true);
    const thirtyDaysAgo = subDays(new Date(), 30);

    const q = query(
      collection(db, "social_posts"),
      where("userId", "==", userId),
      where("profileId", "==", profileId),
      where("scheduledFor", ">=", thirtyDaysAgo),
      orderBy("scheduledFor", "desc"),
      limit(24)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SocialPost));
        setPosts(newData);
        setLoading(false);

        // Mantener selectedPost sincronizado si el post cambió
        setSelectedPost((prev) => {
          if (!prev) return null;
          const updated = newData.find((p) => p.id === prev.id);
          if (!updated) return null;
          if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
          return updated;
        });
      },
      (error: any) => {
        console.error("[useDashboardPosts] Error en social_posts:", error);
        setLoading(false);
      }
    );

    const qBlog = query(
      collection(db, "blog_posts"),
      where("userId", "==", userId)
    );

    const unsubscribeBlog = onSnapshot(
      qBlog,
      (snapshot) => {
        const newData = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            idea: data.title || "Artículo de Blog",
            text: data.metaDescription || "Visita nuestro blog para leer más.",
            type: "Blog",
            scheduledFor: data.scheduledFor || data.createdAt,
            networks: ["blog"],
            status: data.status,
            imageUrl: data.imageUrl || null,
          } as SocialPost;
        });
        setBlogPosts(newData);
      },
      (error: any) => {
        console.error("[useDashboardPosts] Error en blog_posts:", error);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeBlog();
    };
  }, [userId, profileId]);

  // --- Calendar helpers ---
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayIndex = getDay(monthStart);

  const nextMonth = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);
  const prevMonth = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);

  const getDotsForDate = useCallback(
    (date: Date): UseNetworkDots[] => {
      return posts
        .filter((p) => {
          const postDate = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : new Date();
          return isSameDay(postDate, date);
        })
        .map((p) => {
          const t = p.type?.toLowerCase() ?? "";
          if (t.includes("reel") || t.includes("video")) return { color: "bg-pink-500", title: "Reel/Video" };
          if (t.includes("stor") || t.includes("historia")) return { color: "bg-amber-500", title: "Story" };
          if (t.includes("carrusel") || t.includes("carousel")) return { color: "bg-purple-500", title: "Carrusel" };
          return { color: "bg-blue-500", title: "Post/Imagen" };
        });
    },
    [posts]
  );

  // --- Sorting + filtering ---
  const combinedPosts = useMemo<SocialPost[]>(() => {
    const all = [...posts, ...blogPosts];
    all.sort((a, b) => {
      const getMillis = (item: any) => {
        const val = item.publishedAt || item.scheduledFor || item.createdAt;
        if (!val) return 0;
        if (val.toMillis) return val.toMillis();
        if (val.toDate) return val.toDate().getTime();
        if (val.seconds) return val.seconds * 1000;
        if (val._seconds) return val._seconds * 1000;
        const d = new Date(val);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      };
      return activeTab === "published"
        ? getMillis(b) - getMillis(a)
        : getMillis(a) - getMillis(b);
    });
    return all;
  }, [posts, blogPosts, activeTab]);

  const filteredPosts = useMemo<SocialPost[]>(() => {
    return combinedPosts.filter((p) => {
      if (activeTab === "upcoming" && p.status === "published") return false;
      if (activeTab === "published" && p.status !== "published") return false;

      if (selectedDateFilter) {
        const postDate = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : null;
        if (!postDate) return false;
        return isSameDay(postDate, selectedDateFilter);
      }

      if (networkFilter !== "all") {
        const nets = Array.isArray(p.networks)
          ? p.networks
          : Object.entries(p.networks || {})
              .filter(([, v]) => v)
              .map(([k]) => k);
        if (!nets.includes(networkFilter)) return false;
      }

      return true;
    });
  }, [combinedPosts, activeTab, selectedDateFilter, networkFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  // --- Cache updaters (actualizaciones optimistas) ---
  const updatePostInCache = useCallback(
    (postId: string, updates: Partial<SocialPost>, isBlog = false) => {
      if (isBlog) {
        setBlogPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
        );
      } else {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
        );
      }
      setSelectedPost((prev) =>
        prev && prev.id === postId ? { ...prev, ...updates } : prev
      );
    },
    []
  );

  const removePostFromCache = useCallback(
    (postId: string, isBlog = false) => {
      if (isBlog) {
        setBlogPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
      setSelectedPost((prev) => (prev?.id === postId ? null : prev));
    },
    []
  );

  return {
    posts,
    blogPosts,
    loading,
    filteredPosts,
    paginatedPosts,
    totalPages,
    getDotsForDate,
    activeTab,
    setActiveTab,
    networkFilter,
    setNetworkFilter,
    selectedDateFilter,
    setSelectedDateFilter,
    currentPage,
    setCurrentPage,
    currentMonth,
    nextMonth,
    prevMonth,
    daysInMonth,
    startDayIndex,
    updatePostInCache,
    removePostFromCache,
    selectedPost,
    setSelectedPost,
  };
}
