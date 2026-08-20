"use client";

import { useState, useEffect, useMemo } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc, getDoc, onSnapshot, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { useProfile } from "../../../../contexts/ProfileContext";
import { getQuotaUsage, getPlanLimit, getVideoPlanLimit } from "../../../../lib/quota";

// Unique-ID SVG icons to avoid duplicate gradient IDs across multiple rendered cards
function NetworkIcon({ network, postId }: { network: string; postId: string }) {
  if (network === 'facebook') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2" aria-label="Facebook">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    );
  }
  if (network === 'linkedin') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#0077b5" aria-label="LinkedIn">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    );
  }
  if (network === 'tiktok') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-black" aria-label="TikTok">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.41-.43-.61-.65v5.13c.04 2.11-.6 4.31-2.12 5.85-1.59 1.62-3.95 2.45-6.19 2.14-2.61-.31-4.99-2.22-5.74-4.79-.88-2.85-.02-6.22 2.19-8.15 1.72-1.53 4.12-2.11 6.36-1.57v4.18c-1.34-.37-2.89-.08-3.94.83-1.04.9-1.54 2.37-1.28 3.73.28 1.43 1.57 2.53 3.01 2.62 1.45.09 2.92-.85 3.39-2.22.25-.66.29-1.39.27-2.09V0z"/>
      </svg>
    );
  }
  if (network === 'googleBusiness') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" aria-label="Google Business">
        <path fill="#4285F4" d="M23.745 12.27c0-.82-.07-1.61-.21-2.37H12.24v4.49h6.45c-.28 1.45-1.07 2.68-2.28 3.49v2.9h3.69c2.16-1.99 3.4-4.92 3.4-8.51z"/>
        <path fill="#34A853" d="M12.24 24c3.24 0 5.96-1.08 7.95-2.92l-3.69-2.9c-1.08.72-2.46 1.15-4.26 1.15-3.27 0-6.04-2.21-7.03-5.18H1.38v3C3.37 21.21 7.45 24 12.24 24z"/>
        <path fill="#FBBC05" d="M5.21 14.15c-.25-.75-.4-1.55-.4-2.39s.15-1.64.4-2.39v-3H1.38C.5 7.82 0 9.74 0 11.76s.5 3.94 1.38 5.4l3.83-3.01z"/>
        <path fill="#EA4335" d="M12.24 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C18.19 1.15 15.47 0 12.24 0 7.45 0 3.37 2.79 1.38 6.76l3.83 3c.99-2.97 3.76-5.01 7.03-5.01z"/>
      </svg>
    );
  }
  if (network === 'instagram') {
    const gradId = `ig-grad-${postId}`;
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" aria-label="Instagram">
        <defs>
          <linearGradient id={gradId} x1="0" x2="1" y1="1" y2="0">
            <stop offset="0%" stopColor="#f09433"/>
            <stop offset="25%" stopColor="#e6683c"/>
            <stop offset="50%" stopColor="#dc2743"/>
            <stop offset="75%" stopColor="#cc2366"/>
            <stop offset="100%" stopColor="#bc1888"/>
          </linearGradient>
        </defs>
        <path fill={`url(#${gradId})`} d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    );
  }
  if (network === 'youtube') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000" aria-label="YouTube">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    );
  }
  if (network === 'x' || network === 'twitter') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#000000" aria-label="X (Twitter)">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    );
  }
  if (network === 'blog') {
    return <span className="text-[14px]">📝</span>;
  }
  
  return <span className="text-[10px]">🌐</span>;
}

interface SocialPost {
  id: string;
  idea: string;
  text?: string;
  copy?: string;
  type?: string;
  scheduledFor: any; // Firestore timestamp
  networks: string[]; // ['facebook', 'instagram']
  status: 'pending' | 'confirmed' | 'published' | 'error';
  imageUrl?: string;
  imageUrls?: string[];
  carouselCount?: number;
  isGeneratingImage?: boolean; // UI State para regeneración
  publishError?: string;
  publishInfo?: string;
}

function DashboardCarouselViewer({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0);
  
  if (!urls || urls.length === 0) return null;

  const currentUrl = urls[index];
  const isVideo = currentUrl?.toLowerCase().includes('.mp4') || 
                  currentUrl?.toLowerCase().includes('.mov') || 
                  currentUrl?.toLowerCase().includes('.webm') || 
                  currentUrl?.toLowerCase().includes('video') || 
                  currentUrl?.toLowerCase().includes('quicktime');

  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm relative group bg-black flex-shrink-0 border border-slate-200 flex items-center justify-center ${isVideo ? 'aspect-[9/16] max-h-[60vh] max-w-[320px] mx-auto' : 'aspect-video bg-white'}`}>
      {isVideo ? (
        <video src={currentUrl} autoPlay loop muted playsInline controls className="w-full h-full object-cover" />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={currentUrl} alt={`Ref ${index+1}`} className="w-full h-full object-cover transition-transform group-hover:scale-[1.02] duration-500" />
      )}
      
      {urls.length > 1 && (
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-white/10 shrink-0">
           {index + 1} / {urls.length}
        </div>
      )}
      
      {urls.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); setIndex(prev => Math.max(0, prev - 1)); }}
            disabled={index === 0}
            aria-label="Imagen anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-800 disabled:opacity-30 hover:bg-white transition-all hover:scale-110 font-black text-xl z-20"
          >
            ←
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIndex(prev => Math.min(urls.length - 1, prev + 1)); }}
            disabled={index === urls.length - 1}
            aria-label="Imagen siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-800 disabled:opacity-30 hover:bg-white transition-all hover:scale-110 font-black text-xl z-20"
          >
            →
          </button>
        </>
      )}
    </div>
  );
}

export default function RrssDashboard() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [blogPosts, setBlogPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(null);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [planLimit, setPlanLimit] = useState(4);
  const [videoLimit, setVideoLimit] = useState(0);
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [isCancellingAll, setIsCancellingAll] = useState(false);
  const [hasNetworks, setHasNetworks] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [publishResult, setPublishResult] = useState<{ isOpen: boolean; success: boolean; published: string[]; errors: string | null } | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'published'>('published');
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rescheduleData, setRescheduleData] = useState<{ id: string, date: string } | null>(null);
  const [isPublishingStory, setIsPublishingStory] = useState(false);
  const { activeProfile } = useProfile();

  // Modals state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; title: string; desc: string; confirmText: string; cancelText: string; isDanger: boolean; onConfirm: () => void; } | null>(null);
  const [storyFormatWarning, setStoryFormatWarning] = useState<{ isOpen: boolean; post: SocialPost; imageUrl: string; } | null>(null);
  const [isRegeneratingStoryMedia, setIsRegeneratingStoryMedia] = useState(false);

  const requestConfirmation = (title: string, desc: string, onConfirm: () => void, isDanger: boolean = false) => {
    setConfirmModalState({
      isOpen: true,
      title,
      desc,
      confirmText: isDanger ? 'Sí, eliminar' : 'Sí, continuar',
      cancelText: 'Cancelar',
      isDanger,
      onConfirm
    });
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedDateFilter, networkFilter]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
          const d = await getDoc(doc(db, "users", u.uid));
          const plan = d.data()?.plan || "free";
          setUserPlan(plan);
          
          const [used, pLimit, vLimit] = await Promise.all([
             getQuotaUsage(u.uid, activeProfile?.id || 'default'),
             getPlanLimit(plan, u.email),
             getVideoPlanLimit(plan, u.email)
          ]);

          setQuotaUsed(used);
          setPlanLimit(pLimit);
          setVideoLimit(vLimit);
      }
    });
    return () => unsub();
  }, [activeProfile?.id]);

  useEffect(() => {
    if (!user || !activeProfile) return;

    setLoading(true);
    const thirtyDaysAgo = subDays(new Date(), 30);
    const q = query(
        collection(db, "social_posts"), 
        where("userId", "==", user.uid),
        where("profileId", "==", activeProfile.id),
        where("scheduledFor", ">=", thirtyDaysAgo),
        orderBy("scheduledFor", "desc"),
        limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const newData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SocialPost));
        newData.sort((a, b) => {
          const timeA = a.scheduledFor?.toMillis ? a.scheduledFor.toMillis() : 0;
          const timeB = b.scheduledFor?.toMillis ? b.scheduledFor.toMillis() : 0;
          return timeA - timeB;
        });

        // Check for deep equality to avoid redundant re-renders
        setPosts(prev => {
           if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
           return newData;
        });
        
        setLoading(false);
        
        setSelectedPost(prev => {
            if (!prev) return null;
            const updated = newData.find(p => p.id === prev.id);
            if (!updated) return null;
            // Only update selectedPost if it actually changed
            if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
            return updated;
        });
    }, (error: any) => {

        console.error("Error listening to posts:", error);
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            setMessage({ type: 'error', text: "⚠️ Falta índice compuesto en Firestore. Abre la consola de desarrollo (F12) para ver el link exacto de creación." });
        }
        setLoading(false);
    });

    const qBlog = query(
        collection(db, "blog_posts"), 
        where("userId", "==", user.uid)
    );
    
    const unsubscribeBlog = onSnapshot(qBlog, (snapshot) => {
        const newData = snapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                idea: data.title || 'Artículo de Blog',
                text: data.metaDescription || 'Visita nuestro blog para leer más.',
                type: 'Blog',
                scheduledFor: data.scheduledFor || data.createdAt,
                networks: ['blog'],
                status: data.status,
                imageUrl: data.imageUrl || null
            } as SocialPost;
        });
        setBlogPosts(newData);
    }, (error: any) => {
        console.error("Error listening to blog posts:", error);
    });

    return () => {
        unsubscribe();
        unsubscribeBlog();
    };
  }, [user, activeProfile?.id]);

  const handleResetGeneratingState = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, "social_posts", postId), { isGeneratingImage: false });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isGeneratingImage: false } : p));
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({ ...selectedPost, isGeneratingImage: false });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateMedia = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isGeneratingImage: true } : p));
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({ ...selectedPost, isGeneratingImage: true });
      }
      const res = await fetch('/api/n8n/request-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
      if (!res.ok) {
         setPosts(prev => prev.map(p => p.id === postId ? { ...p, isGeneratingImage: false } : p));
         setMessage({ type: 'error', text: "Hubo un error contactando al motor de IA." });
      }
    } catch (e) {
      console.error(e);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isGeneratingImage: false } : p));
    }
  };

  const handleDelete = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const postToDelete = posts.find(p => p.id === postId);
    
    const isPublished = postToDelete?.status === 'published';
    const title = isPublished ? "¿Ocultar historial?" : "¿Cancelar agendamiento?";
    const desc = isPublished 
       ? "Esto ocultará el post de esta pantalla local, pero no lo borrará de tus redes sociales activas." 
       : "Esta acción borrará el post definitivamente y el bot no lo publicará.";

    requestConfirmation(title, desc, async () => {
        try {
          await deleteDoc(doc(db, "social_posts", postId));
          setPosts(prev => prev.filter(p => p.id !== postId));
          if (selectedPost && selectedPost.id === postId) setSelectedPost(null);
          setConfirmModalState(null);
        } catch (e) {
          setMessage({ type: 'error', text: "Error al borrar." });
          setConfirmModalState(null);
        }
    }, true);
  };

  const handleConfirm = async (post: SocialPost) => {
    if (quotaUsed + (post.networks?.length || 1) > planLimit) {
        setUpgradeModalOpen(true);
        return;
    }
    
    try {
      setIsUpdatingStatus(true);
      await updateDoc(doc(db, "social_posts", post.id), { status: 'confirmed' });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'confirmed' } : p));
      setQuotaUsed(prev => prev + (post.networks?.length || 1));
      
      const idToken = await auth.currentUser?.getIdToken();
      if (post.scheduledFor && idToken) {
          const dateObj = typeof post.scheduledFor.toDate === 'function' ? post.scheduledFor.toDate() : new Date(post.scheduledFor);
          await fetch('/api/tasks/schedule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
              body: JSON.stringify({ postId: post.id, scheduledFor: dateObj.toISOString() })
          });
      }
      
      setSelectedPost(null);
    } catch (e) {
      setMessage({ type: 'error', text: "Error al confirmar el agendamiento." });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUnconfirm = async (post: SocialPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setIsUpdatingStatus(true);
      await updateDoc(doc(db, "social_posts", post.id), { status: 'pending' });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'pending' } : p));
      const networksCount = post.networks?.length || 1;
      setQuotaUsed(prev => Math.max(0, prev - networksCount));
      setSelectedPost(null);
    } catch (e) {
      setMessage({ type: 'error', text: "Error al desconfirmar el post." });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const toggleNetwork = async (post: SocialPost, network: 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'googleBusiness' | 'youtube' | 'x' | string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let newNetworks = [...post.networks];
      if (newNetworks.includes(network)) {
        if (newNetworks.length <= 1) {
          setMessage({ type: 'error', text: "Debes seleccionar al menos una red social." });
          return;
        }
        newNetworks = newNetworks.filter(n => n !== network);
      } else {
        newNetworks.push(network);
      }
      
      await updateDoc(doc(db, "social_posts", post.id), { networks: newNetworks });
      
      // Update local state
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, networks: newNetworks } : p));
      
      // Also update selectedPost if open
      if (selectedPost && selectedPost.id === post.id) {
        setSelectedPost({ ...selectedPost, networks: newNetworks });
      }
      
      // Update quota if post was confirmed
      if (post.status === 'confirmed') {
        const diff = newNetworks.length - post.networks.length;
        setQuotaUsed(prev => prev + diff);
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: "Error al cambiar las redes sociales." });
    }
  };

  const handleChangeType = async (post: SocialPost, newType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, "social_posts", post.id), { type: newType });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, type: newType } : p));
      if (selectedPost && selectedPost.id === post.id) {
        setSelectedPost({ ...selectedPost, type: newType });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: "Error al cambiar el formato." });
    }
  };

  const handleChangeCarouselCount = async (post: SocialPost, newCount: number) => {
    try {
      await updateDoc(doc(db, "social_posts", post.id), { carouselCount: newCount });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, carouselCount: newCount } : p));
      if (selectedPost && selectedPost.id === post.id) {
        setSelectedPost({ ...selectedPost, carouselCount: newCount });
      }
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: "Error al cambiar cantidad del carrusel." });
    }
  };

  const handleConfirmAll = async () => {
      const pendingPosts = posts.filter(p => p.status === 'pending');
      if (pendingPosts.length === 0) return;
      
      const totalPendingNetworks = pendingPosts.reduce((acc, p) => acc + (p.networks?.length || 1), 0);
      
      if (quotaUsed + totalPendingNetworks > planLimit) {
          setUpgradeModalOpen(true);
          return;
      }

      requestConfirmation("¿Confirmar todos?", `¿Deseas que Santisoft agende y publique tus ${pendingPosts.length} posts en piloto automático?`, async () => {
          setIsConfirmingAll(true);
          setConfirmModalState(null);
          try {
              const promises = pendingPosts.map(p => updateDoc(doc(db, "social_posts", p.id), { status: 'confirmed' }));
              await Promise.all(promises);
              
              const idToken = await auth.currentUser?.getIdToken();
              if (idToken) {
                  const schedulePromises = pendingPosts.map(async p => {
                      if (!p.scheduledFor) return;
                      const dateObj = typeof p.scheduledFor.toDate === 'function' ? p.scheduledFor.toDate() : new Date(p.scheduledFor);
                      return fetch('/api/tasks/schedule', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                          body: JSON.stringify({ postId: p.id, scheduledFor: dateObj.toISOString() })
                      });
                  });
                  await Promise.allSettled(schedulePromises);
              }
              
              setPosts(prev => prev.map(p => p.status === 'pending' ? { ...p, status: 'confirmed' } : p));
              setQuotaUsed(prev => prev + totalPendingNetworks);
              setMessage({ type: 'success', text: `¡${pendingPosts.length} publicaciones agendadas!` });
          } catch (e) {
              setMessage({ type: 'error', text: "Error al confirmar masivamente." });
          } finally {
              setIsConfirmingAll(false);
          }
      });
  };

  const handleBulkConfirm = async () => {
      const selectedPosts = posts.filter(p => selectedPostIds.includes(p.id) && p.status === 'pending');
      if (selectedPosts.length === 0) return;

      const totalNetworks = selectedPosts.reduce((acc, p) => acc + (p.networks?.length || 1), 0);

      if (quotaUsed + totalNetworks > planLimit) {
          setUpgradeModalOpen(true);
          return;
      }

      setIsConfirmingAll(true);
      try {
          const promises = selectedPosts.map(p => updateDoc(doc(db, "social_posts", p.id), { status: 'confirmed' }));
          await Promise.all(promises);
          
          const idToken = await auth.currentUser?.getIdToken();
          if (idToken) {
              const schedulePromises = selectedPosts.map(async p => {
                  if (!p.scheduledFor) return;
                  const dateObj = typeof p.scheduledFor.toDate === 'function' ? p.scheduledFor.toDate() : new Date(p.scheduledFor);
                  return fetch('/api/tasks/schedule', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                      body: JSON.stringify({ postId: p.id, scheduledFor: dateObj.toISOString() })
                  });
              });
              await Promise.allSettled(schedulePromises);
          }
          
          setPosts(prev => prev.map(p => selectedPostIds.includes(p.id) && p.status === 'pending' ? { ...p, status: 'confirmed' } : p));
          setQuotaUsed(prev => prev + totalNetworks);
          setSelectedPostIds([]);
          setMessage({ type: 'success', text: `${selectedPosts.length} publicaciones confirmadas.` });
      } catch (e) {
          setMessage({ type: 'error', text: "Error en confirmación masiva." });
      } finally {
          setIsConfirmingAll(false);
      }
  };

  const handleCancelAll = async () => {
      const confirmedPosts = posts.filter(p => p.status === 'confirmed');
      if (confirmedPosts.length === 0) return;
      
      requestConfirmation("¿Pausar todas las publicaciones?", `Tus ${confirmedPosts.length} publicaciones volverán a ser borradores locales y no se publicarán automáticamente.`, async () => {
          setIsCancellingAll(true);
          setConfirmModalState(null);
          try {
              const promises = confirmedPosts.map(p => updateDoc(doc(db, "social_posts", p.id), { status: 'pending' }));
              await Promise.all(promises);
              
              const totalNetworks = confirmedPosts.reduce((acc, p) => acc + (p.networks?.length || 1), 0);
              setPosts(prev => prev.map(p => p.status === 'confirmed' ? { ...p, status: 'pending' } : p));
              setQuotaUsed(prev => Math.max(0, prev - totalNetworks));
              setSelectedPostIds([]);
          } catch (e) {
              setMessage({ type: 'error', text: "Error al desconfirmar masivamente." });
          } finally {
              setIsCancellingAll(false);
          }
      });
  };

  const handleBulkUnconfirm = async () => {
      const selectedPosts = posts.filter(p => selectedPostIds.includes(p.id) && p.status === 'confirmed');
      if (selectedPosts.length === 0) return;

      setIsCancellingAll(true);
      try {
          const promises = selectedPosts.map(p => updateDoc(doc(db, "social_posts", p.id), { status: 'pending' }));
          await Promise.all(promises);
          
          const totalNetworks = selectedPosts.reduce((acc, p) => acc + (p.networks?.length || 1), 0);
          setPosts(prev => prev.map(p => selectedPostIds.includes(p.id) && p.status === 'confirmed' ? { ...p, status: 'pending' } : p));
          setQuotaUsed(prev => Math.max(0, prev - totalNetworks));
          setSelectedPostIds([]);
      } catch (e) {
          setMessage({ type: 'error', text: "Error en pausa masiva." });
      } finally {
          setIsCancellingAll(false);
      }
  };

  const handleBulkDelete = async () => {
      if (selectedPostIds.length === 0) return;

      requestConfirmation("¿Borrar seleccionados?", `Vas a perder ${selectedPostIds.length} publicaciones para siempre.`, async () => {
          setIsCancellingAll(true);
          setConfirmModalState(null);
          try {
              const promises = selectedPostIds.map(id => deleteDoc(doc(db, "social_posts", id)));
              await Promise.all(promises);
              
              setPosts(prev => prev.filter(p => !selectedPostIds.includes(p.id)));
              setSelectedPostIds([]);
              setMessage({ type: 'success', text: "Posts eliminados correctamente." });
          } catch (e) {
              setMessage({ type: 'error', text: "Error al borrar seleccionados." });
          } finally {
              setIsCancellingAll(false);
          }
      }, true);
  };

  const toggleSelectAll = () => {
      if (selectedPostIds.length === filteredPosts.length) {
          setSelectedPostIds([]);
      } else {
          setSelectedPostIds(filteredPosts.map(p => p.id));
      }
  };

  const toggleSelectPost = (postId: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setSelectedPostIds(prev => 
          prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
      );
  };

  const handlePublishNow = async (postId: string) => {
    requestConfirmation("¿Publicar Ahora?", "Esta publicación se enviará de inmediato a tus redes sociales configuradas. ¿Deseas continuar?", async () => {
      setPublishingPostId(postId);
      setConfirmModalState(null);
      try {
        const res = await fetch('/api/publish-now', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId })
        });
        
        const data = await res.json();
        
        if (res.status === 500 || data.error) {
          const errMsg = data.error || "Error desconocido al publicar";
          setPublishResult({
            isOpen: true,
            success: false,
            published: [],
            errors: errMsg
          });
          setMessage({ type: 'error', text: errMsg });
        } else if (data.status === 'publishing') {
          setMessage({ type: 'success', text: '¡Publicación iniciada! El bot está enviando tu contenido en segundo plano. Podrás ver el estado en tu panel.' });
        } else {
          const hasErrors = !!data.errors;
          setPublishResult({
            isOpen: true,
            success: !hasErrors,
            published: data.published || [],
            errors: data.errors || null
          });
          
          if (hasErrors) {
            setMessage({ type: 'error', text: `Publicación parcial. Errores: ${data.errors}` });
          } else {
            const infoNote = data.info ? ` (Nota: ${data.info})` : '';
            setMessage({ type: 'success', text: `¡Publicado con éxito en: ${data.published.join(', ')}!${infoNote}` });
          }
        }
      } catch (err: any) {
        console.error(err);
        setPublishResult({
          isOpen: true,
          success: false,
          published: [],
          errors: err.message || "Error de red al intentar publicar"
        });
        setMessage({ type: 'error', text: err.message || "Error al publicar ahora" });
      } finally {
        setPublishingPostId(null);
      }
    });
  };

  const checkImageAspectIsVertical = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        resolve(ratio < 0.8); // Vertical/tall if width/height < 0.8
      };
      img.onerror = () => {
        resolve(true); // Default to true on error to not block flow
      };
    });
  };

  const handleRegenerateStoryImage = async (post: SocialPost) => {
    setIsRegeneratingStoryMedia(true);
    try {
      setMessage({ type: 'info', text: 'Generando nueva imagen vertical 9:16...' });
      const response = await fetch('/api/ai/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: post.idea || post.copy || '',
          userPlan: userPlan,
          businessType: activeProfile?.rubro || '',
          type: 'Historia',
          carouselCount: 1,
          profileId: activeProfile?.id || 'default',
          email: activeProfile?.email || '',
          phone: activeProfile?.phone || ''
        })
      });

      if (!response.ok) {
        throw new Error('No se pudo regenerar el diseño.');
      }

      const data = await response.json();
      const newImageUrl = data.imageUrl;

      if (!newImageUrl) {
        throw new Error('La IA no devolvió una imagen válida.');
      }

      // Actualizar el documento en Firestore
      await updateDoc(doc(db, "social_posts", post.id), {
        imageUrl: newImageUrl
      });

      setMessage({ type: 'success', text: '¡Imagen adaptada a formato vertical 9:16 con éxito!' });
      
      // Actualizar localmente el selectedPost para reflejar la nueva imagen
      setSelectedPost(prev => prev ? { ...prev, imageUrl: newImageUrl } : null);

      setStoryFormatWarning(null);

      // Proceder con la publicación de la historia ahora que tiene el formato correcto
      handlePublishStory(post.id, true);

    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Error adaptando la imagen' });
    } finally {
      setIsRegeneratingStoryMedia(false);
    }
  };

  const handlePublishStory = async (postId: string, forceAsIs: boolean = false) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const imageUrl = post.imageUrl || (post.imageUrls && post.imageUrls[0]);

    if (!forceAsIs && imageUrl) {
      // Verificar formato vertical
      const isVertical = await checkImageAspectIsVertical(imageUrl);
      if (!isVertical) {
        setStoryFormatWarning({ isOpen: true, post, imageUrl });
        return;
      }
    }

    requestConfirmation(
      "¿Compartir como Historia?",
      "La imagen de esta publicación se compartirá de inmediato como Historia en tu Instagram Business y Facebook Page. ¿Deseas continuar?",
      async () => {
        setIsPublishingStory(true);
        setConfirmModalState(null);
        try {
          const res = await fetch('/api/publish-story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId })
          });
          
          const data = await res.json();
          
          if (!res.ok) {
            throw new Error(data.error || "No se pudo compartir la historia.");
          }
          
          setMessage({ 
            type: 'success', 
            text: `¡Historia publicada con éxito en: ${data.published.join(', ')}!` 
          });
          
          // Incrementar el conteo de cuota mensual usado
          const netsCount = data.published?.length || 1;
          setQuotaUsed(prev => prev + netsCount);
          
          setSelectedPost(null);
        } catch (err: any) {
          console.error(err);
          setMessage({ type: 'error', text: err.message || "Error al compartir como historia." });
        } finally {
          setIsPublishingStory(false);
        }
      }
    );
  };

  const handleDeletePost = async (postId: string) => {
    const postToDelete = [...posts, ...blogPosts].find(p => p.id === postId);
    const isBlog = postToDelete?.networks?.includes('blog');
    const collectionName = isBlog ? "blog_posts" : "social_posts";

    requestConfirmation("¿Eliminar Publicación?", "¿Estás seguro de que deseas eliminar permanentemente esta publicación programada?", async () => {
      setConfirmModalState(null);
      try {
        await deleteDoc(doc(db, collectionName, postId));
        if (isBlog) {
          setBlogPosts(prev => prev.filter(p => p.id !== postId));
        } else {
          setPosts(prev => prev.filter(p => p.id !== postId));
        }
        setSelectedPost(null); 
        setMessage({ type: 'success', text: "Publicación eliminada correctamente." });
      } catch (e) {
        setMessage({ type: 'error', text: "Error al eliminar la publicación." });
      }
    }, true);
  };

  const handleUpdateStatus = async (postId: string, newStatus: 'pending' | 'confirmed') => {
    setIsUpdatingStatus(true);
    try {
      const postToUpdate = [...posts, ...blogPosts].find(p => p.id === postId);
      const isBlog = postToUpdate?.networks?.includes('blog');
      const collectionName = isBlog ? "blog_posts" : "social_posts";

      await updateDoc(doc(db, collectionName, postId), { status: newStatus, publishError: null });
      if (isBlog) {
        setBlogPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus, publishError: undefined } : p));
      } else {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus, publishError: undefined } : p));
      }
      
      // Update quota only for social posts
      if (!isBlog && postToUpdate) {
        const networksCount = postToUpdate.networks?.length || 1;
        if (newStatus === 'confirmed' && postToUpdate.status === 'pending') {
          setQuotaUsed(prev => prev + networksCount);
        } else if (newStatus === 'pending' && postToUpdate.status === 'confirmed') {
          setQuotaUsed(prev => Math.max(0, prev - networksCount));
        }
      }
      
      setSelectedPost(prev => (prev && prev.id === postId) ? { ...prev, status: newStatus, publishError: undefined } : null);
      setMessage({ type: 'success', text: `Estado de publicación actualizado a '${newStatus}'.` });
    } catch (e) {
      setMessage({ type: 'error', text: "Error al actualizar el estado." });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveReschedule = async () => {
    if (!rescheduleData) return;
    try {
        const newDate = new Date(rescheduleData.date);
        setIsUpdatingStatus(true);
        
        const postToUpdate = [...posts, ...blogPosts].find(p => p.id === rescheduleData.id);
        const isBlog = postToUpdate?.networks?.includes('blog');
        const collectionName = isBlog ? "blog_posts" : "social_posts";
        let newStatus = isBlog ? 'strategy_draft' : 'confirmed'; 

        await updateDoc(doc(db, collectionName, rescheduleData.id), { 
            scheduledFor: newDate,
            status: newStatus,
            publishError: null
        });
        
        if (!isBlog && postToUpdate && postToUpdate.status !== 'confirmed') {
            const networksCount = postToUpdate.networks?.length || 1;
            setQuotaUsed(prev => prev + networksCount);
        }
        
        if (isBlog) {
            setBlogPosts(prev => prev.map(p => p.id === rescheduleData.id ? { ...p, scheduledFor: { toDate: () => newDate, toMillis: () => newDate.getTime() } as any, status: newStatus, publishError: undefined } : p));
        } else {
            setPosts(prev => prev.map(p => p.id === rescheduleData.id ? { ...p, scheduledFor: { toDate: () => newDate, toMillis: () => newDate.getTime() } as any, status: newStatus, publishError: undefined } : p));
        }
        setSelectedPost(prev => (prev && prev.id === rescheduleData.id) ? { ...prev, scheduledFor: { toDate: () => newDate, toMillis: () => newDate.getTime() } as any, status: newStatus, publishError: undefined } : prev);

        if (!isBlog) {
            // Push the new time to GCP tasks for social posts
            const idToken = await auth.currentUser?.getIdToken();
            await fetch('/api/tasks/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ postId: rescheduleData.id, scheduledFor: newDate.toISOString() })
            });
        }
        
        setMessage({ type: 'success', text: "Post reagendado exitosamente." });
        setRescheduleData(null);
    } catch(err) {
        setMessage({ type: 'error', text: "Error al reagendar el post." });
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  // --- Calendar Logic ---
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayIndex = getDay(monthStart);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getDotsForDate = useMemo(() => {
    return (date: Date) => {
      const postsOnDay = posts.filter(p => {
         const postDate = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : new Date();
         return isSameDay(postDate, date);
      });
      return postsOnDay.map(p => {
         const t = p.type?.toLowerCase() || '';
         if (t.includes('reel') || t.includes('video')) return { color: 'bg-pink-500', title: 'Reel/Video' };
         if (t.includes('stor') || t.includes('historia')) return { color: 'bg-amber-500', title: 'Story' };
         if (t.includes('carrusel') || t.includes('carousel')) return { color: 'bg-purple-500', title: 'Carrusel' };
         return { color: 'bg-blue-500', title: 'Post/Imagen' };
      });
    };
  }, [posts]);

  const combinedPosts = useMemo(() => {
    const all = [...posts, ...blogPosts];
    all.sort((a, b) => {
      const timeA = a.scheduledFor?.toMillis ? a.scheduledFor.toMillis() : 0;
      const timeB = b.scheduledFor?.toMillis ? b.scheduledFor.toMillis() : 0;
      return timeA - timeB;
    });
    return all;
  }, [posts, blogPosts]);

  const filteredPosts = useMemo(() => {
    return combinedPosts.filter(p => {
      if (activeTab === 'upcoming') {
        if (p.status === 'published') return false;
      } else {
        if (p.status !== 'published') return false;
      }
      if (selectedDateFilter) {
        const postDate = p.scheduledFor?.toDate ? p.scheduledFor.toDate() : null;
        if (!postDate) return false;
        return isSameDay(postDate, selectedDateFilter);
      }
      if (networkFilter !== 'all') {
         const nets = Array.isArray(p.networks) ? p.networks : Object.entries(p.networks || {}).filter(([_, v]) => v).map(([k]) => k);
         if (!nets.includes(networkFilter)) return false;
      }
      return true;
    });
  }, [combinedPosts, activeTab, selectedDateFilter, networkFilter]);

  const POSTS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const videosUsed = useMemo(() => {
    return posts.filter(p => {
      const t = p.type?.toLowerCase() || '';
      return t.includes('reel') || t.includes('video');
    }).length;
  }, [posts]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-4xl">
        <div className="h-10 bg-slate-200 rounded w-1/3"></div>
        <div className="h-64 bg-slate-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* 1. Reestructuración de la Cabecera */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
        <div>
          <h1 id="tour-dashboard-title" className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
             {activeTab === 'upcoming' ? 'Próximas Publicaciones' : 'Posts Publicados'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
             {activeTab === 'upcoming' 
               ? 'Monitorea los posts que el bot publicará en piloto automático.' 
               : 'Historial de publicaciones locales enviadas exitosamente a tus redes sociales.'}
          </p>
        </div>
        
        <div className="flex flex-col items-start lg:items-end gap-3">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Cuenta Activa: <span className="text-slate-900">{user?.displayName || 'Usuario'}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cuota Imágenes</span>
               <span className={`font-black text-sm ${quotaUsed >= planLimit ? 'text-rose-600' : 'text-indigo-600'}`}>{quotaUsed} / {planLimit}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm">
               <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">Cuotas Reel</span>
               <span className={`font-black text-sm ${videosUsed >= videoLimit ? 'text-rose-600' : 'text-pink-600'}`}>{videosUsed} / {videoLimit}</span>
            </div>
            <Link id="tour-btn-new-post" href="/automatizacion-rrss/panel/crear" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
              <span>✍️</span> Agendar Nuevo
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Filtros y Calendario */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 bg-white p-5 rounded-[24px] border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Seleccionar RRSS filtro</div>
            <div className="flex flex-wrap items-center gap-2">
               {['all', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'x', 'googleBusiness', 'blog'].map(net => (
                  <button
                     key={net}
                     onClick={() => setNetworkFilter(net)}
                     className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border shadow-sm ${networkFilter === net ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                  >
                     {net === 'all' ? <span>🌐 Todos</span> : <NetworkIcon network={net} postId={`filter-${net}`} />}
                  </button>
               ))}
            </div>
          </div>
          
          <div className="hidden">
             {/* Pestañas removidas para la vista dividida */}
          </div>
        </div>

        <div className="relative w-full lg:w-auto">
          <button 
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="flex items-center justify-between gap-3 bg-white border border-slate-200 px-5 py-3 rounded-xl font-bold text-sm text-slate-700 shadow-sm hover:bg-slate-50 transition-all w-full lg:w-48"
          >
            <span>{selectedDateFilter ? format(selectedDateFilter, "d 'de' MMMM", { locale: es }) : 'CALENDARIO'}</span>
            <span className="text-slate-400">📅</span>
          </button>
          
          {/* Dropdown del Calendario */}
          {isCalendarOpen && (
            <div className="absolute right-0 top-full mt-2 w-full lg:w-[320px] bg-white rounded-[24px] p-5 shadow-2xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-sm font-black text-slate-900 capitalize tracking-tight flex items-center gap-2">
                   <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-[10px] shadow-sm">🗓️</span>
                   {format(currentMonth, "MMM yyyy", { locale: es })}
                </h3>
                <div className="flex gap-1">
                  <button onClick={prevMonth} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 font-bold transition-all text-sm">&lt;</button>
                  <button onClick={nextMonth} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 font-bold transition-all text-sm">&gt;</button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => (
                  <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{d}</div>
                ))}
                {Array.from({ length: startDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} aria-hidden="true" className="h-8"></div>
                ))}
                {daysInMonth.map((day, i) => {
                   const dots = getDotsForDate(day);
                   const isToday = isSameDay(day, new Date());
                   const hasPosts = dots.length > 0;
                   const isSelected = selectedDateFilter && isSameDay(day, selectedDateFilter);
                   
                   return (
                     <div 
                       key={i} 
                       onClick={() => {
                         setSelectedDateFilter(isSelected ? null : day);
                         setIsCalendarOpen(false);
                       }}
                       className={`h-9 rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all cursor-pointer ${isSelected ? 'bg-indigo-600 border-indigo-600 shadow-md transform scale-105' : isToday ? 'bg-indigo-50 border-indigo-200 shadow-inner hover:bg-indigo-100 text-indigo-600' : hasPosts ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm' : 'bg-slate-50/50 border-transparent hover:bg-slate-100'}`}
                     >
                       <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : isToday ? 'text-indigo-600' : hasPosts ? 'text-slate-900' : 'text-slate-400'}`}>{format(day, 'd')}</span>
                       <div className="flex flex-wrap justify-center gap-[2px] mt-0.5 w-full">
                          {dots.slice(0, 3).map((dot, idx) => (
                            <div key={idx} aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dot.color} shadow-sm`} title={dot.title}></div>
                          ))}
                          {dots.length > 3 && <span aria-hidden="true" className={`text-[6px] font-black leading-none ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>+</span>}
                       </div>
                     </div>
                   )
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 pt-3">
                 <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500"><div aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-pink-500"></div> Reel</div>
                 <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500"><div aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Carrusel</div>
                 <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500"><div aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Post</div>
                 <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500"><div aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Story</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Modern Toast */}
      {message && (
        <div className="fixed top-6 right-6 z-[9999] max-w-md w-full p-4 animate-in slide-in-from-right-10 fade-in duration-300 pointer-events-auto">
          <div className={`rounded-3xl p-4 shadow-2xl border flex items-center gap-3 bg-white/95 backdrop-blur-md ${
            message.type === 'error' ? 'border-rose-100 text-rose-800 shadow-rose-100/30' : 'border-emerald-100 text-emerald-800 shadow-emerald-100/30'
          }`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm ${
              message.type === 'error' ? 'bg-rose-50' : 'bg-emerald-50'
            }`}>
              {message.type === 'error' ? '⚠️' : '✅'}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black tracking-tight uppercase text-slate-400">
                {message.type === 'error' ? 'Error del Sistema' : 'Operación Exitosa'}
              </p>
              <p className="text-xs font-bold text-slate-700 mt-0.5 leading-tight">{message.text}</p>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 text-lg font-black px-2">&times;</button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-start gap-8 w-full">
        {/* Selected Date Summary */}
      {selectedDateFilter && (
        <div className="w-full sm:max-w-sm mx-auto lg:mx-0 bg-indigo-50/50 rounded-[24px] p-6 border border-indigo-100 flex flex-col justify-center items-center text-center animate-in fade-in zoom-in duration-300">
           <div className="text-4xl mb-3">🎯</div>
           <h3 className="text-lg font-black tracking-tight text-slate-900">Viendo {format(selectedDateFilter, "d 'de' MMMM", { locale: es })}</h3>
           <button onClick={() => setSelectedDateFilter(null)} className="mt-4 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-widest shadow-sm transition-all w-full">Quitar Filtro</button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full min-w-0 lg:order-1">
        <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-4">
                <button 
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedPostIds.length === filteredPosts.length && filteredPosts.length > 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white'}`}>
                     {selectedPostIds.length === filteredPosts.length && filteredPosts.length > 0 && <span>✓</span>}
                  </div>
                  {selectedPostIds.length === filteredPosts.length && filteredPosts.length > 0 ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                </button>
                {selectedPostIds.length > 0 && (
                   <span className="text-[10px] font-black text-indigo-400 animate-pulse">{selectedPostIds.length} seleccionados</span>
                )}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
               Total: {filteredPosts.length} posts
            </div>
        </div>

        {filteredPosts.length === 0 ? (
        <div className="premium-card p-16 text-center w-full">
           <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner border border-indigo-100/50 animate-bounce">
              {activeTab === 'upcoming' ? '📅' : '📭'}
           </div>
           <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === 'upcoming' ? 'No hay publicaciones agendadas' : 'Aún no tienes publicaciones publicadas'}
           </h3>
           <p className="text-slate-500 mt-4 leading-relaxed font-medium">
              {activeTab === 'upcoming' 
                 ? 'Tu bot está listo para trabajar. Crea una nueva idea y prográmala para que se publique automáticamente en tus redes.'
                 : 'Una vez que una publicación programada se envíe a través del bot o mediante publicación manual, aparecerá en esta pestaña local.'}
           </p>
           {activeTab === 'upcoming' && (
               <Link href="/automatizacion-rrss/panel/crear" className="inline-block mt-8 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-xl shadow-slate-900/10">
                  Crear Mi Primer Post
               </Link>
           )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedPosts.map(post => {
              const dateObj = post.scheduledFor?.toDate ? post.scheduledFor.toDate() : new Date();
              const formattedDate = format(dateObj, "d 'de' MMMM, yyyy", { locale: es });
              const formattedTime = format(dateObj, "HH:mm");
              
              const isSelected = selectedPostIds.includes(post.id);
              const isBlog = Array.isArray(post.networks) && post.networks.includes('blog');

              const isPending = post.status === 'pending' || post.status === 'draft' || post.status === 'strategy_draft';
              const isError = post.status === 'error';

              const effectiveStatus = (isBlog && post.status !== 'published') ? 'confirmed' : post.status;
              const statusConfig = {
                pending: { color: 'text-amber-600 bg-amber-50 border-amber-200', text: '⏸️ Pausado / Borrador' },
                confirmed: { color: 'text-indigo-600 bg-indigo-50 border-indigo-200', text: '⏳ Agendado por Santisoft' },
                publishing: { color: 'text-blue-600 bg-blue-50 border-blue-200 shadow-sm animate-pulse', text: '⚡ Publicando...' },
                published: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', text: '✅ Publicado' },
                error: { color: 'text-rose-600 bg-rose-50 border-rose-200', text: '❌ Error' }
              }[effectiveStatus] || { color: 'text-slate-600 bg-slate-50 border-slate-200', text: effectiveStatus };
              
              return (
                <div key={post.id} onClick={() => isBlog ? (window.location.href = '/automatizacion-rrss/panel/blog') : setSelectedPost(post)} className={`premium-card !p-0 overflow-hidden flex flex-col group hover:-translate-y-1 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 relative ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-4' : ''}`}>
                  {/* Checkbox Overlay */}
                  {!isBlog && (
                      <div 
                        onClick={(e) => toggleSelectPost(post.id, e)}
                        className={`absolute top-4 left-4 z-20 w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg' : 'bg-white/80 backdrop-blur-sm border-slate-200 opacity-0 group-hover:opacity-100 shadow-sm'}`}
                      >
                        {isSelected && <span className="text-sm font-black">✓</span>}
                      </div>
                  )}

                  <div className={`px-5 py-4 border-b flex flex-col gap-3 ${statusConfig.color.split(' ').find(c => c.startsWith('bg-'))} ${statusConfig.color.split(' ').find(c => c.startsWith('border-'))}`}>
                    <div className="flex items-center gap-2 pl-8">
                      <span className={`w-2 h-2 rounded-full animate-pulse ${statusConfig.color.split(' ')[0].replace('text-', 'bg-')}`}></span>
                      <span className={`text-[10px] uppercase tracking-[0.2em] font-black ${statusConfig.color.split(' ')[0]}`}>
                        {statusConfig.text}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      {/* FORMAT BADGE */}
                      <div className="flex items-center gap-1 bg-white/60 px-2.5 py-1 rounded-md border border-slate-200/50 shadow-sm">
                        <span className="text-[9px] font-black tracking-widest uppercase text-slate-500">
                          {post.type === 'video_reel' || post.type === 'reel' || post.type === 'Reel' || (post.format && (post.format.toLowerCase().includes('reel') || post.format.toLowerCase().includes('short')))
                            ? '🎬 Reel / Short'
                            : post.type === 'Carrusel'
                            ? '📑 Carrusel'
                            : post.type === 'Historia'
                            ? '📱 Historia'
                            : post.type === 'Blog'
                            ? '📝 Blog'
                            : '🖼️ Post'}
                        </span>
                      </div>

                      {/* NETWORKS */}
                      <div className="flex gap-1.5">
                        {(Array.isArray(post.networks) ? post.networks : Object.entries(post.networks || {}).filter(([_, v]) => v).map(([k]) => k)).map(net => (
                          <span key={net} title={net} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                            <NetworkIcon network={net} postId={`${post.id}-${net}`} />
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-start gap-5 mb-6">
                      <div className="bg-slate-50 p-4 rounded-[24px] text-center min-w-[80px] border border-slate-200/50 shadow-inner group-hover:bg-indigo-50 transition-colors">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{format(dateObj, "MMM", { locale: es })}</div>
                        <div className="text-3xl font-black text-slate-900 leading-none mb-1">{format(dateObj, "dd")}</div>
                        <div className="text-[11px] font-black text-indigo-600">{formattedTime}</div>
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-4 italic group-hover:text-slate-800 transition-colors">
                          "{post.postText || post.text || post.copy || post.idea || 'Sin texto descriptivo'}"
                        </p>
                      </div>
                    </div>
                    
                    {post.isGeneratingImage ? (
                      <div 
                        onClick={(e) => handleResetGeneratingState(post.id, e)}
                        className="mt-2 mb-6 rounded-2xl overflow-hidden border border-slate-200/50 aspect-video bg-indigo-50 flex flex-col items-center justify-center shadow-inner relative animate-pulse cursor-pointer group/stuck"
                      >
                        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin mb-3 shadow-md"></div>
                        <p className="text-[10px] font-black text-indigo-500 tracking-widest uppercase bg-white/60 px-3 py-1 rounded-full shadow-sm group-hover/stuck:hidden">Generando ia...</p>
                        <p className="text-[10px] font-black text-rose-500 tracking-widest uppercase bg-white/80 px-3 py-1 rounded-full shadow-sm hidden group-hover/stuck:block">¿Trabado? Click para Reset</p>
                      </div>
                    ) : post.imageUrl || post.scenes ? (
                      <div className="mt-2 mb-6 rounded-2xl overflow-hidden border border-slate-200/50 aspect-video bg-slate-50 flex items-center justify-center shadow-inner relative group-hover:border-indigo-200 transition-all">
                        {post.type === 'video_reel' || 
                         post.type === 'reel' || 
                         post.type === 'Reel' || 
                         post.scenes || 
                         (post.format && (post.format.toLowerCase().includes('reel') || post.format.toLowerCase().includes('short'))) ||
                         post.imageUrl?.toLowerCase().includes('.mp4') || 
                         post.imageUrl?.toLowerCase().includes('.mov') || 
                         post.imageUrl?.toLowerCase().includes('.webm') || 
                         post.imageUrl?.toLowerCase().includes('video') || 
                         post.imageUrl?.toLowerCase().includes('quicktime') ? (
                          <>
                            {post.imageUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={post.imageUrl} alt="Thumbnail Reel" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : null}
                            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 group-hover:bg-slate-950/20 transition-all">
                              <div className="w-12 h-12 rounded-full bg-white/90 text-indigo-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform pl-0.5">
                                <span className="text-xl">▶</span>
                              </div>
                              <span className="bg-slate-900/80 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 shadow-md">
                                Previsualizar Reel
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.imageUrl} alt="Ref" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {post.imageUrls && post.imageUrls.length > 1 && (
                              <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-sm border border-white/10 flex items-center gap-1.5">
                                 <span>📑</span> 1/{post.imageUrls.length}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                    ) : ['business', 'agency'].includes(userPlan) ? (
                      <div 
                        className="mt-2 mb-6 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 aspect-video bg-slate-50/50 flex items-center justify-center shadow-inner hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer group/media" 
                        onClick={(e) => handleGenerateMedia(post.id, e)}
                      >
                        <div className="text-center p-4">
                          <div className="text-center p-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm text-indigo-500 mx-auto mb-3 group-hover/media:scale-110 group-hover/media:bg-indigo-500 group-hover/media:text-white transition-all">✨</div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/media:text-indigo-600 transition-colors">Generar Multimedia</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 mb-6 rounded-2xl overflow-hidden border border-slate-200/50 aspect-video bg-slate-50 flex items-center justify-center relative shadow-inner">
                          <div className="text-center p-4">
                              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 text-lg mx-auto mb-2 opacity-80 shadow-inner border border-emerald-100/50">🤖</div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Post en Piloto Automático</p>
                              <Link href="/automatizacion-rrss/panel/planes" className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 mt-2 hover:underline uppercase block">Mejorar a Business para Vista Previa</Link>
                          </div>
                      </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                          {post.status === 'confirmed' ? (
                          <button 
                              onClick={(e) => handleUnconfirm(post, e)} 
                              className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-600 px-3 py-2 hover:bg-amber-50 rounded-xl transition-all"
                          >
                              Pasar a Borrador
                          </button>
                          ) : null}

                          {activeTab === 'upcoming' && (
                          <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setRescheduleData({
                                      id: post.id,
                                      date: format(dateObj, "yyyy-MM-dd'T'HH:mm")
                                  });
                              }} 
                              className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 px-3 py-2 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                              Reagendar
                          </button>
                          )}
                      </div>
                      
                      <button 
                        onClick={(e) => handleDelete(post.id, e)} 
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 px-3 py-2 hover:bg-rose-50 rounded-xl transition-all shrink-0"
                      >
                        {post.status === 'published' ? 'Ocultar' : isPending ? 'Borrar permanentemente' : 'Borrar'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-200">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center font-black hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                &lt;&lt;
              </button>
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                Página <span className="text-slate-900">{currentPage}</span> de <span className="text-slate-900">{totalPages}</span>
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
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

      {/* Floating Action Bar for Selection */}
      {selectedPostIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 border border-white/10 pointer-events-auto">
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Acciones Masivas</span>
                <span className="text-sm font-bold">{selectedPostIds.length} seleccionados</span>
             </div>
             <div className="h-8 w-[1px] bg-white/10"></div>
             <div className="flex items-center gap-3">
                <button 
                  onClick={handleBulkConfirm}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  <span>✅</span> Confirmar
                </button>
                <button 
                  onClick={handleBulkUnconfirm}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5"
                >
                  <span>↩️</span> Desconfirmar
                </button>
                <button 
                   onClick={handleBulkDelete}
                   className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-rose-500/20"
                >
                   <span>🗑️</span> Eliminar
                </button>
             </div>
             <div className="h-8 w-[1px] bg-white/10"></div>
             <button 
               onClick={() => setSelectedPostIds([])}
               className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/5 text-slate-400 hover:text-white"
             >
               &times;
             </button>
          </div>
        </div>
      )}

    {/* Modal de Detalles */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 pointer-events-auto">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)}></div>
          <div className="bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl w-full max-w-2xl relative z-10 animate-in slide-in-from-bottom md:zoom-in duration-300 h-[90vh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Header Sticky en Mobile */}
            <div className="p-6 sm:p-10 pb-4 border-b border-slate-100 shrink-0 relative">
                {/* Drag Handle Mobile */}
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 md:hidden"></div>
                
                <button onClick={() => setSelectedPost(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 text-2xl font-black transition-colors">&times;</button>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pr-10 md:pr-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl md:text-3xl shadow-sm border border-indigo-100/50">📱</div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 mb-0.5 md:mb-1">Detalle</h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                {format(selectedPost.scheduledFor?.toDate ? selectedPost.scheduledFor.toDate() : new Date(), "d MMM, yyyy - HH:mm", { locale: es })}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Publicar en:</span>
                        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                            {['facebook', 'instagram', 'googleBusiness', 'linkedin', 'tiktok', 'youtube', 'x'].filter(net => {
                                const safeNets = Array.isArray(selectedPost.networks) ? selectedPost.networks : Object.entries(selectedPost.networks || {}).filter(([_, v]) => v).map(([k]) => k);
                                if (net === 'linkedin') return !!activeProfile?.linkedinUserToken_enc || !!activeProfile?.linkedinToken_enc || safeNets.includes('linkedin');
                                if (net === 'tiktok') return !!activeProfile?.tiktokToken_enc || safeNets.includes('tiktok');
                                if (net === 'googleBusiness') return !!activeProfile?.googleBusinessToken_enc || safeNets.includes('googleBusiness');
                                if (net === 'youtube') return !!activeProfile?.youtubeConnected || !!activeProfile?.accounts?.youtube?.connected || safeNets.includes('youtube');
                                if (net === 'x') return !!activeProfile?.xConnected || !!activeProfile?.accounts?.x?.connected || safeNets.includes('x');
                                return true;
                            }).map(net => {
                                const safeNets = Array.isArray(selectedPost.networks) ? selectedPost.networks : Object.entries(selectedPost.networks || {}).filter(([_, v]) => v).map(([k]) => k);
                                const isActive = safeNets.includes(net);
                                return (
                                    <button 
                                        key={net} 
                                        onClick={(e) => toggleNetwork(selectedPost, net as any, e)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                                            isActive 
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 scale-105 shadow-sm shadow-indigo-500/10' 
                                            : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
                                        }`}
                                    >
                                        <span className={`${!isActive ? 'grayscale opacity-60' : ''} w-4 h-4 flex items-center justify-center`}>
                                            <NetworkIcon network={net} postId={selectedPost.id} />
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{net === 'googleBusiness' ? 'Google' : net === 'youtube' ? 'YouTube' : net === 'x' ? 'X' : net}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 pt-4 pb-32 hide-scrollbar">
                <div className="space-y-6">
                   {selectedPost.publishError && (
                     <div className="bg-rose-50 border-2 border-rose-200 rounded-[24px] p-6 text-rose-800 animate-in slide-in-from-top-2 fade-in">
                       <div className="flex gap-3 items-start">
                         <span className="text-2xl">⚠️</span>
                         <div>
                           <h4 className="font-black text-sm tracking-tight text-rose-900 uppercase">Error de Publicación</h4>
                           <p className="text-xs font-semibold text-rose-700/90 mt-1 leading-relaxed">
                             {selectedPost.publishError}
                           </p>
                           <p className="text-[10px] font-bold text-rose-500 mt-3 uppercase tracking-wider">
                             Por favor, revisa la conexión de tus cuentas de redes sociales en el panel de configuración o el estado de tus tokens de Meta/LinkedIn.
                           </p>
                         </div>
                       </div>
                     </div>
                   )}

                   {selectedPost.publishInfo && (
                     <div className="bg-sky-50 border-2 border-sky-200 rounded-[24px] p-6 text-sky-800 animate-in slide-in-from-top-2 fade-in shadow-sm">
                       <div className="flex gap-3 items-start">
                         <span className="text-2xl">ℹ️</span>
                         <div>
                           <h4 className="font-black text-sm tracking-tight text-sky-900 uppercase">Aviso de Publicación (Sandbox)</h4>
                           <p className="text-xs font-bold text-sky-700/90 mt-1 leading-relaxed">
                             {selectedPost.publishInfo}
                           </p>
                         </div>
                       </div>
                     </div>
                   )}
                   <div className="flex flex-wrap items-center gap-3">
                     <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-slate-100 text-slate-500 rounded-xl border border-slate-200">Formato</span>
                     <div className="flex gap-2">
                        {['Post', 'Historia', 'Carrusel', 'Reel'].map(type => {
                          const isActive = selectedPost.type === type || (!selectedPost.type && type === 'Post');
                          return (
                            <button
                              key={type}
                              onClick={(e) => handleChangeType(selectedPost, type, e)}
                              className={`text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-xl border transition-all ${
                                 isActive 
                                   ? type === 'Historia' ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm scale-105'
                                   : type === 'Carrusel' ? 'bg-purple-50 text-purple-600 border-purple-200 shadow-sm scale-105'
                                   : type === 'Reel' ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm scale-105'
                                   : 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm scale-105'
                                 : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                     </div>
                     <span className={`text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-xl border ${selectedPost.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : selectedPost.status === 'confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : selectedPost.status === 'publishing' ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm animate-pulse' : selectedPost.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        Estado: {selectedPost.status === 'pending' ? 'Borrador' : selectedPost.status === 'confirmed' ? 'Confirmado' : selectedPost.status === 'publishing' ? 'Publicando...' : selectedPost.status === 'published' ? 'Publicado' : selectedPost.status}
                     </span>
                   </div>

                   {selectedPost.type === 'Carrusel' && (
                     <div className="bg-purple-50/50 p-4 rounded-[20px] border border-purple-100 shadow-inner mt-4 animate-in slide-in-from-top-2 fade-in">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 mb-3 flex items-center gap-2"><span>🖼️</span> ¿Cuántas imágenes tendrá el Carrusel?</h3>
                        <div className="flex items-center gap-4">
                            <input 
                                type="range" 
                                min="2" 
                                max="3" 
                                value={selectedPost.carouselCount || 3} 
                                onChange={(e) => handleChangeCarouselCount(selectedPost, parseInt(e.target.value))}
                                className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-sm shrink-0">
                                <span className="text-sm font-black text-purple-600">{selectedPost.carouselCount || 3}</span>
                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">imgs</span>
                            </div>
                        </div>
                        <p className="mt-3 text-[10px] leading-tight text-purple-600/80 bg-purple-50 p-2 rounded-lg border border-purple-100/50">
                            👉 <span className="font-semibold">Nota:</span> Para que se publiquen todas las imágenes del carrusel, debes presionar "Generar Multimedia" antes de la hora agendada. Si llega la hora y no las has generado, el bot publicará solo una (1) imagen de emergencia.
                        </p>
                     </div>
                   )}

                   <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100 shadow-inner">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-3 flex items-center gap-2"><span>💡</span> Idea Principal / Enganche</h3>
                     <p className="text-xl font-black text-slate-900 leading-tight">"{selectedPost.idea}"</p>
                   </div>

                   {selectedPost.text && (
                     <div>
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-2">Texto Descriptivo / Instrucción Visual</h3>
                       <div className="bg-white p-6 rounded-[28px] border-2 border-slate-100 text-slate-600 font-medium whitespace-pre-wrap text-[15px] leading-relaxed relative">
                         {selectedPost.text}
                       </div>
                     </div>
                   )}

                   <div>
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-3 ml-2">Copy / Pie de Foto para Redes</h3>
                     <div className="bg-indigo-50/30 p-6 rounded-[28px] border-2 border-indigo-100 text-slate-800 font-medium whitespace-pre-wrap text-[15px] leading-relaxed relative shadow-inner">
                       {selectedPost.postText || selectedPost.copy ? (selectedPost.postText || selectedPost.copy) : <span className="text-slate-400 italic">El copy se generará automáticamente con la imagen.</span>}
                     </div>
                   </div>

                   {selectedPost.isGeneratingImage ? (
                      <div className="rounded-[28px] p-8 bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center animate-pulse">
                         <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4 shadow-md"></div>
                         <p className="text-xs font-black text-indigo-600 tracking-widest uppercase mb-4">Pintando con n8n...</p>
                         <button 
                           onClick={(e) => handleResetGeneratingState(selectedPost.id, e)}
                           className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 bg-white px-4 py-2 rounded-xl border border-slate-100 transition-all"
                         >
                            Resetear Estado (Si está trabado)
                         </button>
                      </div>
                    ) : selectedPost.imageUrl ? (
                     <div>
                       <div className="flex items-center justify-between mb-3 ml-2">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Referencia Visual de IA</h3>
                           {['business', 'agency'].includes(userPlan) && (
                               <button 
                                 onClick={(e) => handleGenerateMedia(selectedPost.id, e)}
                                 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all flex items-center gap-1.5 shadow-sm"
                               >
                                  <span>✨</span> Volver a Generar
                               </button>
                           )}
                       </div>
                       <div className="rounded-[28px] p-2 bg-slate-50 border-2 border-slate-100">
                         <DashboardCarouselViewer urls={selectedPost.imageUrls && selectedPost.imageUrls.length > 0 ? selectedPost.imageUrls : [selectedPost.imageUrl!]} />
                       </div>
                     </div>
                   ) : ['business', 'agency'].includes(userPlan) ? (
                     <div 
                       onClick={(e) => handleGenerateMedia(selectedPost.id, e)}
                       className="rounded-[28px] p-8 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all group/modalmedia"
                     >
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

            {/* Sticky Actions Bar Mobile / Footer Desktop */}
            <div className="shrink-0 p-6 sm:p-10 border-t border-slate-100 bg-white/80 backdrop-blur-xl absolute bottom-0 inset-x-0 z-20">
                <div className="w-full flex flex-col sm:flex-row gap-4">
                  {selectedPost.status === 'published' ? (
                    <>
                      <button
                        onClick={() => handlePublishNow(selectedPost.id)}
                        disabled={publishingPostId === selectedPost.id}
                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-2xl md:rounded-[28px] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                      >
                        {publishingPostId === selectedPost.id ? (
                           <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 animate-spin rounded-full" />
                        ) : (
                           <span>✨</span>
                        )}
                        <span>{publishingPostId === selectedPost.id ? 'Republicando...' : 'Publicación Lista (Click para Republicar)'}</span>
                      </button>
                      
                      {((selectedPost.publishedIn && selectedPost.publishedIn.includes('instagram')) || (!selectedPost.publishedIn && (Array.isArray(selectedPost.networks) ? selectedPost.networks : Object.entries(selectedPost.networks || {}).filter(([_, v]) => v).map(([k]) => k)).includes('instagram'))) ? (
                        <button
                          onClick={() => handlePublishStory(selectedPost.id)}
                          disabled={isPublishingStory}
                          className="flex-1 bg-gradient-to-br from-pink-500 to-rose-600 text-white px-8 py-4 md:py-5 rounded-2xl md:rounded-[28px] font-black text-[13px] uppercase tracking-[0.1em] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group/story shadow-2xl shadow-rose-500/30 overflow-hidden relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/story:opacity-100 transition-opacity"></div>
                          {isPublishingStory ? (
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                          ) : (
                             <span className="text-2xl group-hover/story:scale-125 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                               📱
                             </span>
                          )}
                          <span className="relative z-10">{isPublishingStory ? 'Compartiendo Historia...' : 'Compartir como Historia'}</span>
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
                        onClick={() => handlePublishNow(selectedPost.id)}
                        disabled={publishingPostId === selectedPost.id || !selectedPost.imageUrl || selectedPost.status === 'publishing'}
                        className="flex-1 bg-gradient-to-br from-slate-800 to-black text-white px-8 py-4 md:py-5 rounded-2xl md:rounded-[28px] font-black text-[13px] uppercase tracking-[0.1em] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed group/publish shadow-2xl shadow-slate-900/30 overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-transparent opacity-0 group-hover/publish:opacity-100 transition-opacity"></div>
                        {(publishingPostId === selectedPost.id || selectedPost.status === 'publishing') ? (
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                        ) : (
                           <span className="text-2xl group-hover/publish:scale-125 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">
                             🔥
                           </span>
                        )}
                        <span className="relative z-10">{selectedPost.status === 'publishing' ? 'Publicando...' : 'Publicar Ahora!!!'}</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(selectedPost.id, selectedPost.status === 'confirmed' ? 'pending' : 'confirmed')}
                        disabled={isUpdatingStatus || selectedPost.status === 'publishing'}
                        className="flex-1 bg-gradient-to-br from-indigo-600 to-violet-700 text-white px-8 py-4 md:py-5 rounded-2xl md:rounded-[28px] font-black text-[13px] uppercase tracking-[0.1em] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed group/bot shadow-2xl shadow-indigo-600/30 overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/bot:opacity-100 transition-opacity"></div>
                        {isUpdatingStatus ? (
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                        ) : (
                           <span className="text-2xl group-hover/bot:rotate-12 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                             {selectedPost.status === 'confirmed' ? '⏳' : '✅'}
                           </span>
                        )}
                        <span className="relative z-10">{selectedPost.status === 'confirmed' ? 'Desmarcar IA' : 'Confirmar IA'}</span>
                      </button>
                    </>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade CTA Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setUpgradeModalOpen(false)}></div>
          <div className="bg-white rounded-[32px] shadow-2xl relative z-10 w-full max-w-md overflow-hidden animate-in zoom-in fade-in transition-all">
             <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-8 text-center text-white">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-2xl font-black font-display leading-tight">Han alcanzado<br/>tu límite mensual</h3>
             </div>
             <div className="p-8 text-center">
                <p className="text-slate-500 font-medium mb-8">
                  Ya has sobrepasado la cuota de publicaciones permitidas por tu plan actual. Para seguir publicando en automático necesitas mejorar tu plan.
                </p>
                <div className="flex flex-col gap-3">
                   <Link href="/automatizacion-rrss/panel/planes" className="bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">
                     ⭐️ Mejorar Mi Plan Ahora
                   </Link>
                   <button onClick={() => setUpgradeModalOpen(false)} className="py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors">
                     Cerrar por ahora
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Generic Confirmation Modal */}
      {confirmModalState?.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmModalState(null)}></div>
          <div className="bg-white rounded-[24px] shadow-2xl relative z-10 w-full max-w-sm p-8 text-center animate-in zoom-in-95 fade-in duration-200">
             <div className="w-16 h-16 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-2xl mb-4 border border-slate-100">
                {confirmModalState.isDanger ? '⚠️' : '🤔'}
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">{confirmModalState.title}</h3>
             <p className="text-slate-500 text-sm font-medium mb-8">{confirmModalState.desc}</p>
             
             <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmModalState.onConfirm} 
                  className={`py-3.5 rounded-xl font-bold shadow-sm transition-colors ${confirmModalState.isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'}`}
                >
                  {confirmModalState.confirmText}
                </button>
                <button onClick={() => setConfirmModalState(null)} className="py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">
                  {confirmModalState.cancelText}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleData && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative z-10">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                    🗓️
                </div>
                <h3 className="text-xl font-black text-center text-slate-900 tracking-tight mb-2">Reagendar Post</h3>
                <p className="text-sm text-slate-500 text-center font-medium mb-6">Modifica la fecha y hora de publicación. El motor se recalibrará al instante.</p>
                
                <input 
                    type="datetime-local" 
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:border-indigo-400 font-bold text-slate-700"
                />

                <div className="flex gap-3">
                    <button 
                        onClick={() => setRescheduleData(null)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSaveReschedule}
                        disabled={isUpdatingStatus}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isUpdatingStatus ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Modern Publish Result Modal */}
      {publishResult?.isOpen && (
        <div className="fixed inset-0 z-[1001] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100 relative z-10 animate-in zoom-in-95 duration-300 text-center">
                
                {publishResult.success ? (
                   <>
                     <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner border border-emerald-100">
                        🎉
                     </div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">¡Publicación Exitosa!</h3>
                     <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                        Tu contenido se ha enviado y publicado correctamente en las siguientes redes vinculadas:
                     </p>
                     <div className="flex justify-center gap-3 mb-8">
                        {publishResult.published.map(net => (
                           <span key={net} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 shadow-sm">
                              {net === 'facebook' ? '🔵 Facebook' : net === 'instagram' ? '📸 Instagram' : net === 'linkedin' ? '💼 LinkedIn' : '🎵 TikTok'}
                           </span>
                        ))}
                     </div>
                   </>
                ) : publishResult.published.length > 0 ? (
                   <>
                     <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner border border-amber-100">
                        ⚠️
                     </div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Publicación Parcial</h3>
                     <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                        Se logró publicar en algunas redes, pero otras reportaron un error de sincronización:
                     </p>
                     <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left mb-6 max-h-40 overflow-y-auto">
                        <div className="flex flex-wrap gap-2 mb-3">
                           <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Publicado en:</span>
                           {publishResult.published.map(net => (
                              <span key={net} className="text-[10px] font-bold text-slate-700 bg-white border px-2 py-0.5 rounded-md shadow-sm">{net}</span>
                           ))}
                        </div>
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Detalles del Error:</p>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium font-mono whitespace-pre-wrap">{publishResult.errors}</p>
                     </div>
                   </>
                ) : (
                   <>
                     <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner border border-rose-100">
                        ❌
                     </div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Error de Publicación</h3>
                     <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                        No se pudo procesar la publicación en ninguna de tus redes sociales.
                     </p>
                     <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 text-left mb-8 max-h-40 overflow-y-auto">
                        <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Reporte de Meta/API:</p>
                        <p className="text-xs text-rose-600 leading-relaxed font-medium font-mono whitespace-pre-wrap">{publishResult.errors}</p>
                     </div>
                   </>
                )}

                <button 
                  onClick={() => {
                    setPublishResult(null);
                    setSelectedPost(null);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg font-display"
                >
                  Entendido, cerrar
                </button>
            </div>
        </div>
      )}

      {/* Story format aspect-ratio warning modal */}
      {storyFormatWarning?.isOpen && (
        <div className="fixed inset-0 z-[1002] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !isRegeneratingStoryMedia && setStoryFormatWarning(null)}></div>
          <div className="bg-white rounded-[32px] shadow-2xl relative z-10 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-center text-white">
                <div className="text-5xl mb-4">⚠️</div>
                <h3 className="text-2xl font-black leading-tight">Formato de Imagen<br/>No Óptimo</h3>
             </div>
             <div className="p-8 text-center">
               {isRegeneratingStoryMedia ? (
                 <div className="flex flex-col items-center justify-center py-6 animate-pulse">
                   <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                   <h4 className="font-black text-sm text-slate-700 uppercase tracking-widest">Adaptando Imagen a 9:16...</h4>
                   <p className="text-xs text-slate-400 mt-2">La IA está rediseñando tu imagen a formato vertical. Esto puede tomar unos segundos.</p>
                 </div>
               ) : (
                 <>
                   <p className="text-slate-500 font-medium mb-4 leading-relaxed">
                     Detectamos que la imagen actual de tu post es <b>horizontal o cuadrada</b>.
                   </p>
                   <p className="text-slate-500 font-medium mb-8 leading-relaxed text-xs">
                     Las historias de Instagram y Facebook requieren formato vertical <b>9:16 (1080x1920)</b>. Publicarla horizontal puede recortarla, añadir franjas o dar error en la app de Instagram.
                   </p>
                   <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => handleRegenerateStoryImage(storyFormatWarning.post)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all"
                      >
                        ✨ Adaptar a 9:16 con IA (Regenerar)
                      </button>
                      <button 
                        onClick={() => {
                          const postId = storyFormatWarning.post.id;
                          setStoryFormatWarning(null);
                          handlePublishStory(postId, true);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-all"
                      >
                        Publicar Horizontal de todos modos
                      </button>
                      <button 
                        onClick={() => setStoryFormatWarning(null)} 
                        className="py-3 text-slate-400 font-bold hover:text-slate-600 transition-all"
                      >
                        Cancelar
                      </button>
                   </div>
                 </>
               )}
             </div>
          </div>
        </div>
      )}

      {/* Modern Full-Screen Publishing Loading Overlay */}
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
    </div>
  )
}
