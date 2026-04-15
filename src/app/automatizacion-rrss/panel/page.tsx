"use client";

import { useState, useEffect, useMemo } from "react";
import { auth, db } from "../../../lib/firebase";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc, getDoc, onSnapshot, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { useProfile } from "../../../contexts/ProfileContext";
import { getQuotaUsage, getPlanLimit, getVideoPlanLimit } from "../../../lib/quota";

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
  // Instagram with a unique gradient ID per post
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
}

function DashboardCarouselViewer({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0);
  
  if (!urls || urls.length === 0) return null;

  const currentUrl = urls[index];
  const isVideo = currentUrl?.toLowerCase().endsWith('.mp4');

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
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-800 disabled:opacity-30 hover:bg-white transition-all hover:scale-110 font-black text-sm"
          >
            ←
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIndex(prev => Math.min(urls.length - 1, prev + 1)); }}
            disabled={index === urls.length - 1}
            aria-label="Imagen siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-800 disabled:opacity-30 hover:bg-white transition-all hover:scale-110 font-black text-sm"
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
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(null);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [isCancellingAll, setIsCancellingAll] = useState(false);
  const [hasNetworks, setHasNetworks] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'published'>('upcoming');
  const { activeProfile } = useProfile();

  // Modals state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; title: string; desc: string; confirmText: string; cancelText: string; isDanger: boolean; onConfirm: () => void; } | null>(null);

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
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
          const d = await getDoc(doc(db, "users", u.uid));
          if (d.exists()) setUserPlan(d.data().plan || "free");
          
          const used = await getQuotaUsage(u.uid, activeProfile?.id || 'default');
          setQuotaUsed(used);
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
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SocialPost));
        data.sort((a, b) => {
          const timeA = a.scheduledFor?.toMillis ? a.scheduledFor.toMillis() : 0;
          const timeB = b.scheduledFor?.toMillis ? b.scheduledFor.toMillis() : 0;
          return timeA - timeB; // Ascending order in UI
        });
        setPosts(data);
        setLoading(false);
        
        setSelectedPost(prev => {
            if (!prev) return null;
            const updated = data.find(p => p.id === prev.id);
            return updated || null;
        });
    }, (error: any) => {
        console.error("Error listening to posts:", error);
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            setMessage({ type: 'error', text: "⚠️ Falta índice compuesto en Firestore. Abre la consola de desarrollo (F12) para ver el link exacto de creación." });
        }
        setLoading(false);
    });

    return () => unsubscribe();
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
    const limit = getPlanLimit(userPlan);
    if (quotaUsed + (post.networks?.length || 1) > limit) {
        setUpgradeModalOpen(true);
        return;
    }
    
    try {
      setIsUpdatingStatus(true);
      await updateDoc(doc(db, "social_posts", post.id), { status: 'confirmed' });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'confirmed' } : p));
      setQuotaUsed(prev => prev + (post.networks?.length || 1));
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

  const toggleNetwork = async (post: SocialPost, network: 'facebook' | 'instagram' | 'linkedin', e: React.MouseEvent) => {
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
      
      const limit = getPlanLimit(userPlan);
      const totalPendingNetworks = pendingPosts.reduce((acc, p) => acc + (p.networks?.length || 1), 0);
      
      if (quotaUsed + totalPendingNetworks > limit) {
          setUpgradeModalOpen(true);
          return;
      }

      requestConfirmation("¿Confirmar todos?", `¿Deseas que Santisoft agende y publique tus ${pendingPosts.length} posts en piloto automático?`, async () => {
          setIsConfirmingAll(true);
          setConfirmModalState(null);
          try {
              const promises = pendingPosts.map(p => updateDoc(doc(db, "social_posts", p.id), { status: 'confirmed' }));
              await Promise.all(promises);
              
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

      const limit = getPlanLimit(userPlan);
      const totalNetworks = selectedPosts.reduce((acc, p) => acc + (p.networks?.length || 1), 0);

      if (quotaUsed + totalNetworks > limit) {
          setUpgradeModalOpen(true);
          return;
      }

      setIsConfirmingAll(true);
      try {
          const promises = selectedPosts.map(p => updateDoc(doc(db, "social_posts", p.id), { status: 'confirmed' }));
          await Promise.all(promises);
          
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
        if (data.error) throw new Error(data.error);

        setMessage({ type: 'success', text: `¡Publicado con éxito en: ${data.published.join(', ')}!` });
        setSelectedPost(null); 
      } catch (err: any) {
        console.error(err);
        setMessage({ type: 'error', text: err.message || "Error al publicar ahora" });
      } finally {
        setPublishingPostId(null);
      }
    });
  };

  const handleDeletePost = async (postId: string) => {
    requestConfirmation("¿Eliminar Publicación?", "¿Estás seguro de que deseas eliminar permanentemente esta publicación programada?", async () => {
      setConfirmModalState(null);
      try {
        await deleteDoc(doc(db, "social_posts", postId));
        setPosts(prev => prev.filter(p => p.id !== postId));
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
      await updateDoc(doc(db, "social_posts", postId), { status: newStatus });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus } : p));
      
      // Update quota
      const post = posts.find(p => p.id === postId);
      if (post) {
        const networksCount = post.networks?.length || 1;
        if (newStatus === 'confirmed' && post.status === 'pending') {
          setQuotaUsed(prev => prev + networksCount);
        } else if (newStatus === 'pending' && post.status === 'confirmed') {
          setQuotaUsed(prev => Math.max(0, prev - networksCount));
        }
      }
      
      setSelectedPost(prev => prev ? { ...prev, status: newStatus } : null);
      setMessage({ type: 'success', text: `Estado de publicación actualizado a '${newStatus}'.` });
    } catch (e) {
      setMessage({ type: 'error', text: "Error al actualizar el estado." });
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

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
        // 1. Date filter
        if (selectedDateFilter && !isSameDay(p.scheduledFor?.toDate ? p.scheduledFor.toDate() : new Date(), selectedDateFilter)) return false;
        // 2. Tab filter
        if (activeTab === 'upcoming') {
            return p.status !== 'published';
        } else {
            return p.status === 'published';
        }
    });
  }, [posts, selectedDateFilter, activeTab]);

  if (loading) return <div className="animate-pulse space-y-4 max-w-4xl"><div className="h-10 bg-slate-200 rounded w-1/3"></div><div className="h-64 bg-slate-200 rounded"></div></div>;

  const videosUsed = posts.filter(p => {
    const t = p.type?.toLowerCase() || '';
    return t.includes('reel') || t.includes('video');
  }).length;
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
        <div>
          <h1 id="tour-dashboard-title" className="text-3xl font-black text-slate-900 tracking-tight">
             {activeTab === 'upcoming' ? 'Próximas Publicaciones' : 'Posts Publicados'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
             {activeTab === 'upcoming' 
               ? 'Monitorea los posts que el bot publicará en piloto automático.' 
               : 'Historial de publicaciones locales enviadas exitosamente a tus redes sociales.'}
          </p>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mt-6 shadow-inner border border-slate-200">
             <button 
               onClick={() => setActiveTab('upcoming')} 
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'upcoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <span>⏳</span> Próximos
             </button>
             <button 
               onClick={() => setActiveTab('published')} 
               className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'published' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <span>✅</span> Publicados
             </button>
          </div>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-xl font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
            message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
            {message.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between gap-4 shadow-sm w-full sm:w-auto">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cuota Mensual</span>
             <span className={`font-black text-sm ${quotaUsed >= getPlanLimit(userPlan) ? 'text-rose-600' : 'text-indigo-600'}`}>{quotaUsed} / {getPlanLimit(userPlan)}</span>
          </div>
          
          <div className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between gap-4 shadow-sm w-full sm:w-auto">
             <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">Reels IA</span>
             <span className={`font-black text-sm ${videosUsed >= getVideoPlanLimit(userPlan) ? 'text-rose-600' : 'text-pink-600'}`}>{videosUsed} / {getVideoPlanLimit(userPlan)}</span>
          </div>
          
          <Link id="tour-btn-new-post" href="/automatizacion-rrss/panel/crear" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 w-full sm:w-auto">
            <span>✍️</span> Agendar Nuevo
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-8 w-full">
        {/* Sidebar Left: Posts List (lg:order-1) */}
        
        {/* Sidebar Right: Calendar Filter (lg:order-2) */}
        <div className="w-full sm:max-w-sm lg:w-[280px] xl:w-[300px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-24 lg:order-2 mx-auto lg:mx-0">
          {/* Mini Calendar Filter */}
          <div id="tour-calendar-widget" className="bg-white rounded-[24px] p-5 shadow-xl shadow-slate-200/50 border border-slate-100 w-full">
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
                   onClick={() => setSelectedDateFilter(isSelected ? null : day)}
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

        {/* Selected Date Summary */}
        {selectedDateFilter && (
          <div className="w-full sm:max-w-sm mx-auto lg:mx-0 bg-indigo-50/50 rounded-[24px] p-6 border border-indigo-100 flex flex-col justify-center items-center text-center animate-in fade-in zoom-in duration-300">
             <div className="text-4xl mb-3">🎯</div>
             <h3 className="text-lg font-black tracking-tight text-slate-900">Viendo {format(selectedDateFilter, "d 'de' MMMM", { locale: es })}</h3>
             <button onClick={() => setSelectedDateFilter(null)} className="mt-4 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-widest shadow-sm transition-all w-full">Quitar Filtro</button>
          </div>
        )}
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => {
            const dateObj = post.scheduledFor?.toDate ? post.scheduledFor.toDate() : new Date();
            const formattedDate = format(dateObj, "d 'de' MMMM, yyyy", { locale: es });
            const formattedTime = format(dateObj, "HH:mm");
            
            const isPending = post.status === 'pending';
            const isError = post.status === 'error';
            const statusConfig = {
              pending: { color: 'text-amber-600 bg-amber-50 border-amber-200', text: '⏸️ Pausado / Borrador' },
              confirmed: { color: 'text-indigo-600 bg-indigo-50 border-indigo-200', text: '⏳ Agendado por Santisoft' },
              published: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', text: '✅ Publicado' },
              error: { color: 'text-rose-600 bg-rose-50 border-rose-200', text: '❌ Error' }
            }[post.status] || { color: 'text-slate-600 bg-slate-50 border-slate-200', text: post.status };

            const isSelected = selectedPostIds.includes(post.id);
            
            return (
              <div key={post.id} onClick={() => setSelectedPost(post)} className={`premium-card !p-0 overflow-hidden flex flex-col group hover:-translate-y-1 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 relative ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-4' : ''}`}>
                {/* Checkbox Overlay */}
                <div 
                  onClick={(e) => toggleSelectPost(post.id, e)}
                  className={`absolute top-4 left-4 z-20 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg' : 'bg-white/80 backdrop-blur-sm border-slate-200 opacity-0 group-hover:opacity-100 shadow-sm'}`}
                >
                  {isSelected && <span className="text-xs font-black">✓</span>}
                </div>

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
                        {post.type === 'Reel' ? '🎬 Reel' : post.type === 'Carrusel' ? '📑 Carrusel' : post.type === 'Historia' ? '📱 Historia' : '🖼️ Post'}
                      </span>
                    </div>

                    {/* NETWORKS */}
                    <div className="flex gap-1.5">
                      {post.networks.map(net => (
                        <span key={net} title={net} className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
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
                        "{post.idea}"
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
                  ) : post.imageUrl ? (
                    <div className="mt-2 mb-6 rounded-2xl overflow-hidden border border-slate-200/50 aspect-video bg-slate-50 flex items-center justify-center shadow-inner relative group-hover:border-indigo-200 transition-all">
                      {post.type === 'Reel' || post.imageUrl?.endsWith('.mp4') ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-rose-900 to-slate-900 flex flex-col items-center justify-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center backdrop-blur-sm shadow-xl">
                              <span className="text-white text-2xl pl-1">▶</span>
                            </div>
                            <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">Reel Generado</span>
                          </div>
                          {post.imageUrls && post.imageUrls.length > 1 && (
                            <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-sm border border-white/10 flex items-center gap-1.5">
                               <span>🎬</span> {post.imageUrls.length}
                            </div>
                          )}
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

                  ) : ['elite', 'business'].includes(userPlan) ? (
                    <div 
                      className="mt-2 mb-6 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 aspect-video bg-slate-50/50 flex items-center justify-center shadow-inner hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer group/media" 
                      onClick={(e) => handleGenerateMedia(post.id, e)}
                    >
                      <div className="text-center p-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm text-indigo-500 mx-auto mb-3 group-hover/media:scale-110 group-hover/media:bg-indigo-500 group-hover/media:text-white transition-all">✨</div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/media:text-indigo-600 transition-colors">Generar Multimedia</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 mb-6 rounded-2xl overflow-hidden border border-slate-200/50 aspect-video bg-slate-50 flex items-center justify-center relative shadow-inner">
                        <div className="text-center p-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 text-lg mx-auto mb-2 opacity-80 shadow-inner border border-emerald-100/50">🤖</div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Post en Piloto Automático</p>
                            <Link href="/automatizacion-rrss/panel/planes" className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 mt-2 hover:underline uppercase block">Mejorar a Elite para Vista Previa</Link>
                        </div>
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-y-3">
                    {post.status === 'confirmed' ? (
                      <button 
                        onClick={(e) => handleUnconfirm(post, e)} 
                        className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-600 px-4 py-2 hover:bg-amber-50 rounded-xl transition-all"
                      >
                        Pasar a Borrador
                      </button>
                    ) : (
                      <div className="flex-1"></div>
                    )}
                    <button 
                      onClick={(e) => handleDelete(post.id, e)} 
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 px-4 py-2 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      {post.status === 'published' ? 'Ocultar Historial' : isPending ? 'Eliminar permanentemente' : 'Eliminar Post'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
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
    </div>

    {/* Modal de Detalles */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)}></div>
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl relative z-10 p-8 sm:p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto mt-16 md:mt-0 hide-scrollbar">
            <button onClick={() => setSelectedPost(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 text-2xl font-black transition-colors">&times;</button>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-500 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-indigo-100/50">📱</div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Detalle de Publicación</h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      {format(selectedPost.scheduledFor?.toDate ? selectedPost.scheduledFor.toDate() : new Date(), "d MMM, yyyy - HH:mm", { locale: es })}
                    </p>
                  </div>
               </div>
               <div className="flex flex-col items-start sm:items-end gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Publicar en:</span>
                   <div className="flex gap-2">
                    {['facebook', 'instagram', 'linkedin'].filter(net => 
                      // Only show linkedin if activeProfile has linkedinToken_enc OR if the post already has it
                      net !== 'linkedin' || activeProfile?.linkedinToken_enc || selectedPost.networks.includes('linkedin')
                    ).map(net => {
                      const isActive = selectedPost.networks.includes(net);
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
                          <span className={`${!isActive && 'grayscale'}`}>{net === 'facebook' ? '🔵' : net === 'instagram' ? '🟣' : '💼'}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{net}</span>
                        </button>
                      );
                    })}
                  </div>
               </div>
            </div>

            <div className="space-y-6">
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
                 <span className={`text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-xl border ${selectedPost.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : selectedPost.status === 'confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : selectedPost.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    Estado: {selectedPost.status === 'pending' ? 'Borrador' : selectedPost.status === 'confirmed' ? 'Confirmado' : selectedPost.status === 'published' ? 'Publicado' : selectedPost.status}
                 </span>
               </div>

               {selectedPost.type === 'Carrusel' && (
                 <div className="bg-purple-50/50 p-4 rounded-[20px] border border-purple-100 shadow-inner mt-4 animate-in slide-in-from-top-2 fade-in">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 mb-3 flex items-center gap-2"><span>🖼️</span> ¿Cuántas imágenes tendrá el Carrusel?</h3>
                    <div className="flex items-center gap-4">
                        <input 
                            type="range" 
                            min="2" 
                            max="4" 
                            value={selectedPost.carouselCount || 3} 
                            onChange={(e) => handleChangeCarouselCount(selectedPost, parseInt(e.target.value))}
                            className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-sm shrink-0">
                            <span className="text-sm font-black text-purple-600">{selectedPost.carouselCount || 3}</span>
                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">imgs</span>
                        </div>
                    </div>
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
                   {selectedPost.copy ? selectedPost.copy : <span className="text-slate-400 italic">El copy se generará automáticamente con la imagen.</span>}
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
                       {['elite', 'business'].includes(userPlan) && (
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
               ) : ['elite', 'business'].includes(userPlan) ? (
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
                    <p className="text-xs text-slate-400 mt-2 text-center max-w-sm">Mejora a Elite o Business para pre-visualizar y editar las imágenes generadas antes de que sean publicadas.</p>
                 </div>
               )}
            </div>

            <div className="mt-12 pt-8 border-t-2 border-slate-100 flex flex-col items-center gap-6">
               <div className="w-full flex flex-col sm:flex-row gap-4">
                 <button
                   onClick={() => handlePublishNow(selectedPost.id)}
                   disabled={publishingPostId === selectedPost.id || selectedPost.status === 'published' || !selectedPost.imageUrl}
                   className="flex-1 bg-gradient-to-br from-slate-800 to-black text-white px-8 py-5 rounded-[28px] font-black text-[13px] uppercase tracking-[0.1em] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed group/publish shadow-2xl shadow-slate-900/30 overflow-hidden relative"
                 >
                   <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-transparent opacity-0 group-hover/publish:opacity-100 transition-opacity"></div>
                   {publishingPostId === selectedPost.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                   ) : (
                      <span className="text-2xl group-hover/publish:scale-125 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">
                        {selectedPost.status === 'published' ? '✨' : '🔥'}
                      </span>
                   )}
                   <span className="relative z-10">{selectedPost.status === 'published' ? 'Publicación Lista' : 'Publicar Ahora!!!'}</span>
                 </button>

                 <button
                   onClick={() => handleUpdateStatus(selectedPost.id, selectedPost.status === 'confirmed' ? 'pending' : 'confirmed')}
                   disabled={isUpdatingStatus || selectedPost.status === 'published'}
                   className="flex-1 bg-gradient-to-br from-indigo-600 to-violet-700 text-white px-8 py-5 rounded-[28px] font-black text-[13px] uppercase tracking-[0.1em] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed group/bot shadow-2xl shadow-indigo-600/30 overflow-hidden relative"
                 >
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/bot:opacity-100 transition-opacity"></div>
                   {isUpdatingStatus ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                   ) : (
                      <span className="text-2xl group-hover/bot:rotate-12 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                        {selectedPost.status === 'confirmed' ? '⏳' : '✅'}
                      </span>
                   )}
                   <span className="relative z-10">{selectedPost.status === 'confirmed' ? 'Desmarcar Bot' : 'Confirmar Bot'}</span>
                 </button>
               </div>

               <button 
                 onClick={() => setSelectedPost(null)} 
                 className="px-12 py-3 font-bold text-slate-400 hover:text-slate-600 text-sm uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
               >
                 Cerrar / Cancelar
               </button>
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
    </div>
  )
}
