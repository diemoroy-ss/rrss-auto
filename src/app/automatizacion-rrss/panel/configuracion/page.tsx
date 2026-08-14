"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { auth, db, storage } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useProfile } from "../../../../contexts/ProfileContext";
import StatusModal from "../../../../components/StatusModal";

function getExpirationText(timestamp?: number) {
  if (!timestamp) return { text: "Vigencia Desconocida", color: "text-slate-500", bg: "bg-slate-100", isExpired: false, isUnknown: true };
  const now = Date.now();
  const diff = timestamp - now;
  if (diff <= 0) return { text: "Expirado", color: "text-rose-500", bg: "bg-rose-100", isExpired: true };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return { text: `Expira en ${days} día${days !== 1 ? 's' : ''}`, color: days < 7 ? "text-amber-600" : "text-emerald-600", bg: days < 7 ? "bg-amber-100" : "bg-emerald-100", isExpired: false };
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return { text: `Expira en ${hours} h`, color: "text-amber-600", bg: "bg-amber-100", isExpired: false };
  
  return { text: "Expira pronto", color: "text-amber-600", bg: "bg-amber-100", isExpired: false };
}

// Helper components para Modales de Selección
function MetaSelectionModal({ isOpen, onClose, onSelect, profileId }: any) {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPage, setSelectedPage] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError("");
      // Fetch pages
      auth.currentUser?.getIdToken().then(token => {
        fetch(`/api/auth/meta/pages?profileId=${profileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setPages(data.data || []);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
      });
    }
  }, [isOpen, profileId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
        <h3 className="text-2xl font-black text-slate-900 mb-2">Selecciona tu Página</h3>
        <p className="text-slate-500 mb-6 text-sm">Elige qué Página de Facebook y Cuenta de Instagram conectar.</p>
        
        {loading ? (
          <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm">{error}</div>
        ) : pages.length === 0 ? (
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl font-bold text-sm">No se encontraron páginas de Facebook. Asegúrate de tener permisos de administrador.</div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {pages.map(p => (
              <label key={p.id} className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-colors ${selectedPage?.id === p.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}>
                <input type="radio" name="meta_page" checked={selectedPage?.id === p.id} onChange={() => setSelectedPage(p)} className="hidden" />
                {p.picture?.data?.url ? (
                  <img src={p.picture.data.url} alt={p.name} className="w-10 h-10 rounded-full flex-shrink-0 object-cover border border-slate-100" />
                ) : p.instagram_business_account?.profile_picture_url ? (
                  <img src={p.instagram_business_account.profile_picture_url} alt={p.name} className="w-10 h-10 rounded-full flex-shrink-0 object-cover border border-slate-100" />
                ) : (
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-slate-500">{p.name.charAt(0)}</div>
                )}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">Facebook Page</span>
                    <span className="font-extrabold text-slate-900 text-sm leading-tight">{p.name}</span>
                  </div>
                  {p.instagram_business_account ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-pink-600 bg-pink-50 border border-pink-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">Instagram Business</span>
                      <span className="text-xs text-slate-600 font-bold">@{p.instagram_business_account.username}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      ⚠️ Sin Instagram Vinculado
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
          <button onClick={() => onSelect(selectedPage)} disabled={!selectedPage} className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">Guardar Conexión</button>
        </div>
      </div>
    </div>
  );
}

function LinkedInSelectionModal({ isOpen, onClose, onSelect, profileId }: any) {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPage, setSelectedPage] = useState<any>(null); // null means personal profile

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError("");
      auth.currentUser?.getIdToken().then(token => {
        fetch(`/api/auth/linkedin/pages?profileId=${profileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setPages(data.data || []);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
      });
    }
  }, [isOpen, profileId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
        <h3 className="text-2xl font-black text-slate-900 mb-2">Selecciona tu Perfil de LinkedIn</h3>
        <p className="text-slate-500 mb-6 text-sm">Elige dónde deseas publicar tus posts automáticamente.</p>
        
        {loading ? (
          <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-[#0077b5] border-t-transparent rounded-full animate-spin"></div></div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm">{error}</div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            <label className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-colors ${selectedPage === null ? 'border-[#0077b5] bg-sky-50' : 'border-slate-100 hover:border-sky-100 hover:bg-slate-50'}`}>
              <input type="radio" name="li_page" checked={selectedPage === null} onChange={() => setSelectedPage(null)} className="hidden" />
              <div className="w-10 h-10 bg-[#0077b5] text-white rounded-full flex-shrink-0 flex items-center justify-center font-bold">👤</div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">Perfil Personal</p>
                <p className="text-xs text-slate-500 font-medium">Publicar como tú mismo.</p>
              </div>
            </label>

            {pages.map(p => (
              <label key={p.id} className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-colors ${selectedPage?.id === p.id ? 'border-[#0077b5] bg-sky-50' : 'border-slate-100 hover:border-sky-100 hover:bg-slate-50'}`}>
                <input type="radio" name="li_page" checked={selectedPage?.id === p.id} onChange={() => setSelectedPage(p)} className="hidden" />
                <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-slate-500">🏢</div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-xs text-[#0077b5] font-medium">Página de Empresa</p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
          <button onClick={() => onSelect(selectedPage)} className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#0077b5] hover:bg-[#005582] transition-colors">Guardar Conexión</button>
        </div>
      </div>
    </div>
  );
}


function ConfigContent() {
  const { activeProfile, loadProfiles, isBusiness, planConfig } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "confirm";
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const showModal = (type: any, title: string, message: string, onConfirm?: () => void) => {
    setModal({
        isOpen: true,
        type,
        title,
        message,
        onConfirm: onConfirm || (() => setModal(prev => ({ ...prev, isOpen: false })))
    });
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const [fbStatus, setFbStatus] = useState(false);
  const [igStatus, setIgStatus] = useState(false);
  const [liStatus, setLiStatus] = useState(false);
  const [ttStatus, setTtStatus] = useState(false);
  const [gbpStatus, setGbpStatus] = useState(false);

  // Connection Modals State
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);

  // New Business Data States
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");

  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Redundant auth listener removed to avoid extra renders
  useEffect(() => {
    setUser(auth.currentUser);
    setLoadingInitial(false);
  }, []);

  // Use a separate effect for initial data loading from activeProfile to avoid loops
  useEffect(() => {
    if (activeProfile) {
      setFbStatus(!!activeProfile.facebookToken_enc);
      setIgStatus(!!activeProfile.instagramToken_enc);
      setLiStatus(!!activeProfile.linkedinUserToken_enc);
      setTtStatus(!!activeProfile.tiktokToken_enc);
      setGbpStatus(!!activeProfile.googleBusinessToken_enc);

      // Only set these if they are different to avoid unnecessary re-renders
      if (activeProfile.name !== brandName) setBrandName(activeProfile.name || "");
      if (activeProfile.website !== website) setWebsite(activeProfile.website || "");

      if (activeProfile.facebookUrl !== facebookUrl) setFacebookUrl(activeProfile.facebookUrl || "");
      if (activeProfile.instagramUrl !== instagramUrl) setInstagramUrl(activeProfile.instagramUrl || "");
      if (activeProfile.tiktokUrl !== tiktokUrl) setTiktokUrl(activeProfile.tiktokUrl || "");
      if (activeProfile.linkedinUrl !== linkedinUrl) setLinkedinUrl(activeProfile.linkedinUrl || "");
      if (activeProfile.email !== email) setEmail(activeProfile.email || "");
      if (activeProfile.phone !== phone) setPhone(activeProfile.phone || "");
      if (activeProfile.logoUrl !== logoUrl) setLogoUrl(activeProfile.logoUrl || "");
    }
  }, [activeProfile]); // Only depend on activeProfile for data syncing

  // Separate effect for one-time URL parameter handling
  useEffect(() => {
    if (!activeProfile) return;

    const metaParam = searchParams.get('meta');
    const linkedinParam = searchParams.get('linkedin');
    const tiktokParam = searchParams.get('tiktok');
    const gbpParam = searchParams.get('google-business');
    let shouldReplace = false;

    if (metaParam === 'success' && activeProfile.metaUserToken_enc && !activeProfile.facebookToken_enc) {
        setShowMetaModal(true);
        shouldReplace = true;
    }
    
    if (linkedinParam === 'success' && activeProfile.linkedinUserToken_enc) {
        setShowLinkedInModal(true);
        shouldReplace = true;
    }
    
    if (tiktokParam === 'success') {
        setMessage({ type: 'success', text: "¡TikTok conectado correctamente!" });
        shouldReplace = true;
    }

    if (tiktokParam === 'locked') {
        setMessage({ type: 'error', text: "🔒 Tu cuenta ya está vinculada a otro perfil de TikTok. Para gestionar múltiples cuentas, actualiza al Plan Business." });
        shouldReplace = true;
    }

    if (gbpParam === 'success') {
        setMessage({ type: 'success', text: "¡Google Business Profile conectado correctamente!" });
        shouldReplace = true;
    }
    
    if (metaParam === 'error' || linkedinParam === 'error' || tiktokParam === 'error' || gbpParam === 'error') {
        setErrorMsg("Hubo un error al conectar la red social.");
        shouldReplace = true;
    }

    if (shouldReplace) {
        // Clear params from URL to prevent re-processing on next render
        const newUrl = pathname;
        router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, activeProfile, pathname, router]);


  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
        setErrorMsg("El archivo debe ser una imagen.");
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        setErrorMsg("La imagen no debe pesar más de 2MB.");
        return;
    }

    setIsUploadingLogo(true);
    setErrorMsg("");
    try {
        const profileId = activeProfile?.id || 'default';
        const storageRef = ref(storage, `users/${user.uid}/profiles/${profileId}/logo`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setLogoUrl(url);
        
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && activeProfile) {
            const data = userDoc.data();
            const updatedProfiles = (data.profiles || []).map((p: any) => 
               p.id === activeProfile.id ? { ...p, logoUrl: url } : p
            );
            await updateDoc(userDocRef, { profiles: updatedProfiles });
            await loadProfiles();
        }
        
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
        console.error("Error uploading logo:", error);
        setErrorMsg("Error al subir el logo corporativo.");
    } finally {
        setIsUploadingLogo(false);
    }
  };

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeProfile) return;
    setSaving(true);
    setSuccess(false);
    setErrorMsg("");

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
          const data = userDoc.data();
          const updatedProfiles = (data.profiles || []).map((p: any) => 
             p.id === activeProfile.id ? {
                ...p,
                name: brandName,
                website,

                facebookUrl,
                instagramUrl,
                tiktokUrl,
                linkedinUrl,
                email,
                phone
             } : p
          );
          await updateDoc(userDocRef, { profiles: updatedProfiles });
          await loadProfiles();
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);

    } finally {
      setSaving(false);
    }
  };

  const handleConnectMeta = async () => {
    if (!user || !activeProfile) return;
    try {
        const idToken = await user.getIdToken();
        const origin = window.location.origin;
        const res = await fetch(`/api/auth/meta?profileId=${activeProfile.id}&origin=${encodeURIComponent(origin)}`, {
            headers: { "Authorization": `Bearer ${idToken}` }
        });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || "No se pudo generar la URL de Meta");
        }
    } catch (e: any) {
        setErrorMsg(e.message);
    }
  };

  const handleConnectLinkedIn = async () => {
    if (!user || !activeProfile) return;
    try {
        const idToken = await user.getIdToken();
        const origin = window.location.origin;
        const res = await fetch(`/api/linkedin/auth?profileId=${activeProfile.id}&origin=${encodeURIComponent(origin)}`, {
            headers: { "Authorization": `Bearer ${idToken}` }
        });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || "No se pudo generar la URL de LinkedIn");
        }
    } catch (e: any) {
        setErrorMsg(e.message);
    }
  };

  const handleConnectGBP = async () => {
    if (!user || !activeProfile) return;
    try {
        const idToken = await user.getIdToken();
        const origin = window.location.origin;
        const res = await fetch(`/api/auth/google-business?profileId=${activeProfile.id}&origin=${encodeURIComponent(origin)}`, {
            headers: { "Authorization": `Bearer ${idToken}` }
        });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || "No se pudo generar la URL de Google Business Profile");
        }
    } catch (e: any) {
        setErrorMsg(e.message);
    }
  };

  const handleDisconnectGBP = async () => {
    showModal("confirm", "Desconectar Google Business Profile", "¿Seguro que quieres desconectar Google Business Profile?", async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        setSaving(true);
        try {
            const idToken = await user.getIdToken();
            await fetch("/api/social-auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken, uid: user.uid, profileId: activeProfile.id, setAccounts: { googleBusiness: { disconnect: true } } })
            });
            await loadProfiles();
            showModal("success", "Desconectado", "Google Business Profile desconectado.");
        } catch (e) { 
            showModal("error", "Error", "No se pudo desconectar Google Business Profile.");
        }
        setSaving(false);
    });
  };

  const handleConnectTikTok = async () => {
    if (!user || !activeProfile) return;
    try {
        const idToken = await user.getIdToken();
        const origin = window.location.origin;
        const res = await fetch(`/api/auth/tiktok?profileId=${activeProfile.id}&origin=${encodeURIComponent(origin)}`, {
            headers: { "Authorization": `Bearer ${idToken}` }
        });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || "No se pudo generar la URL de TikTok");
        }
    } catch (e: any) {
        setErrorMsg(e.message);
    }
  };

  const handleConnectYouTube = () => {
    if (!user || !activeProfile) return;
    const redirectUrl = `/api/social-auth/youtube/redirect?profileId=${activeProfile.id}&userId=${user.uid}`;
    window.location.href = redirectUrl;
  };

  const handleDisconnectYouTube = async () => {
    showModal("confirm", "Desconectar YouTube", "¿Seguro que quieres desconectar YouTube Shorts?", async () => {
      setModal(prev => ({ ...prev, isOpen: false }));
      setSaving(true);
      try {
        const idToken = await user.getIdToken();
        await fetch("/api/social-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            uid: user.uid,
            profileId: activeProfile.id,
            setAccounts: { youtube: { connected: false, disconnect: true } }
          })
        });
        await loadProfiles();
        showModal("success", "Desconectado", "Canal de YouTube desconectado exitosamente.");
      } catch (e) {
        showModal("error", "Error", "No se pudo desconectar YouTube.");
      }
      setSaving(false);
    });
  };

  const handleConnectX = () => {
    if (!user || !activeProfile) return;
    const redirectUrl = `/api/social-auth/x/redirect?profileId=${activeProfile.id}&userId=${user.uid}`;
    window.location.href = redirectUrl;
  };

  const handleDisconnectX = async () => {
    showModal("confirm", "Desconectar X", "¿Seguro que quieres desconectar X (Twitter)?", async () => {
      setModal(prev => ({ ...prev, isOpen: false }));
      setSaving(true);
      try {
        const idToken = await user.getIdToken();
        await fetch("/api/social-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            uid: user.uid,
            profileId: activeProfile.id,
            setAccounts: { x: { connected: false, disconnect: true } }
          })
        });
        await loadProfiles();
        showModal("success", "Desconectado", "Cuenta de X desconectada exitosamente.");
      } catch (e) {
        showModal("error", "Error", "No se pudo desconectar X.");
      }
      setSaving(false);
    });
  };

  const saveMetaSelection = async (page: any) => {
    if (!user || !activeProfile) return;
    setShowMetaModal(false);
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      const payload = {
        idToken,
        uid: user.uid,
        profileId: activeProfile.id,
        setAccounts: {
          facebook: { 
            token: page.access_token, 
            pageId: page.id,
            name: page.name
          },
          instagram: page.instagram_business_account ? { 
            token: page.access_token, 
            accountId: page.instagram_business_account.id,
            username: page.instagram_business_account.username
          } : null
        }
      };

      const res = await fetch("/api/social-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error guardando cuentas");
      
      await loadProfiles();
      setMessage({ type: 'success', text: "¡Meta conectado correctamente!" });
    } catch (e: any) {
      setErrorMsg("Error guardando conexión de Meta.");
    } finally {
      setSaving(false);
    }
  };

  const saveLinkedInSelection = async (page: any) => {
    if (!user || !activeProfile) return;
    setShowLinkedInModal(false);
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      const payload = {
        idToken,
        uid: user.uid,
        profileId: activeProfile.id,
        setAccounts: {
          linkedin: { companyUrn: page ? page.urn : null }
        }
      };

      const res = await fetch("/api/social-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error guardando cuentas");
      
      await loadProfiles();
      setMessage({ type: 'success', text: "¡LinkedIn configurado correctamente!" });
    } catch (e: any) {
      setErrorMsg("Error guardando conexión de LinkedIn.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectFb = async () => {
    showModal("confirm", "Desconectar Facebook", "¿Estás seguro de que deseas desconectar Meta?", async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        setSaving(true);
        try {
            const idToken = await user.getIdToken();
            await fetch("/api/social-auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken, uid: user.uid, profileId: activeProfile.id, setAccounts: { facebook: { token: "", pageId: "" }, instagram: { token: "", accountId: "" } } })
            });
            await loadProfiles();
            showModal("success", "Desconectado", "Meta ha sido desconectado exitosamente.");
        } catch (e) { 
            showModal("error", "Error", "No se pudo desconectar la cuenta.");
        }
        setSaving(false);
    });
  };

  const handleDisconnectLi = async () => {
    showModal("confirm", "Desconectar LinkedIn", "¿Seguro que quieres desconectar LinkedIn?", async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        setSaving(true);
        try {
            const idToken = await user.getIdToken();
            await fetch("/api/social-auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken, uid: user.uid, profileId: activeProfile.id, setAccounts: { linkedin: { disconnect: true } } })
            });
            await loadProfiles();
            showModal("success", "Desconectado", "LinkedIn desconectado.");
        } catch (e) { 
            showModal("error", "Error", "No se pudo desconectar.");
        }
        setSaving(false);
    });
  };

  const handleDisconnectTt = async () => {
    showModal("confirm", "Desconectar TikTok", "¿Seguro que quieres desconectar TikTok?", async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        setSaving(true);
        try {
            const idToken = await user.getIdToken();
            await fetch("/api/social-auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken, uid: user.uid, profileId: activeProfile.id, setAccounts: { tiktok: { disconnect: true } } })
            });
            await loadProfiles();
            showModal("success", "Desconectado", "TikTok desconectado.");
        } catch (e) { 
            showModal("error", "Error", "No se pudo desconectar TikTok.");
        }
        setSaving(false);
    });
  };

  if (loadingInitial) return <div className="animate-pulse space-y-4 max-w-2xl"><div className="h-10 bg-slate-200 rounded w-1/3"></div><div className="h-64 bg-slate-200 rounded"></div></div>;

  return (
    <div className="max-w-4xl mx-auto lg:mx-0 pb-20">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Configuración de <span className="text-indigo-600">Marca.</span></h1>
        <p className="text-slate-500 mt-4 text-lg font-medium leading-relaxed">Completa la identidad de <strong className="text-indigo-500">{activeProfile?.name}</strong> para alimentar el "Cerebro" de Estrategia AI y administrar sus conexiones.</p>
      </div>

      {errorMsg && <div className="mb-8 p-5 bg-rose-50 text-rose-600 rounded-[24px] font-black text-sm border border-rose-100 animate-in fade-in slide-in-from-top-2">⚠️ {errorMsg}</div>}
      {success && <div className="mb-8 p-5 bg-emerald-50 text-emerald-600 rounded-[24px] font-black text-sm border border-emerald-100 animate-in fade-in slide-in-from-top-2">✅ ¡Configuración guardada exitosamente!</div>}
      
      {message && (
        <div className={`mb-8 p-5 rounded-[24px] font-black text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        }`}>
          <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
          {message.text}
        </div>
      )}

      {/* Account Lock Banner: shown to non-business users who have locked accounts */}
      {!isBusiness && activeProfile?.accountLocks && Object.keys((activeProfile as any).accountLocks).length > 0 && (
        <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-[24px] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-4">
            <span className="text-2xl mt-0.5">🔒</span>
            <div className="flex-1">
              <h4 className="font-black text-amber-800 text-sm mb-1">Cuentas vinculadas a este perfil</h4>
              <p className="text-amber-700 text-xs font-medium leading-relaxed">
                Tu plan actual permite <strong>una sola cuenta por red social</strong>. Las siguientes cuentas quedaron vinculadas porque ya publicaste con ellas:
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {(activeProfile as any).accountLocks?.facebook && (
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full">
                    📘 Facebook: {activeProfile.facebookPageName || (activeProfile as any).accountLocks.facebook}
                  </span>
                )}
                {(activeProfile as any).accountLocks?.instagram && (
                  <span className="bg-pink-100 text-pink-700 text-[10px] font-black px-3 py-1 rounded-full">
                    📸 Instagram: @{activeProfile.instagramUsername || (activeProfile as any).accountLocks.instagram}
                  </span>
                )}
                {(activeProfile as any).accountLocks?.tiktok && (
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full">
                    🎵 TikTok: {(activeProfile as any).accountLocks.tiktok}
                  </span>
                )}
              </div>
              <p className="text-amber-700 text-xs font-medium mt-3">
                ¿Necesitas gestionar <strong>múltiples negocios</strong>? Pasa al <strong className="text-amber-900">Plan Business</strong> y tendrás hasta 5 marcas independientes, cada una con sus propias redes sociales.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveData} className="space-y-10">
        
        {/* BUSINESS DATA */}
        <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
             <span className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-xl shadow-inner font-black">🏢</span>
             <h3 className="text-xl font-black text-slate-900">Datos de la Cuenta: <span className="text-indigo-600">{activeProfile?.name || 'Principal'}</span></h3>
          </div>

          <div className="mb-8">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Logo Corporativo (Máx 2MB)</label>
              <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden shrink-0 relative hover:border-indigo-400 transition-colors">
                      {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                          <span className="text-3xl opacity-50">🖼️</span>
                      )}
                      {isUploadingLogo && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}
                  </div>
                  <div className="flex-1">
                      <p className="text-xs font-medium text-slate-500 mb-3">Sube tu logo oficial. Se usará como marca de agua en los banners si lo habilitas.</p>
                      <label className="cursor-pointer bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors shadow-sm inline-block">
                          {logoUrl ? 'Cambiar Logo' : 'Subir Logo'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                      </label>
                  </div>
              </div>
          </div>

          <div className="mb-8">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🏷️ Nombre de la Marca / Negocio</label>
              <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Ej: Mi Restaurante" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">

              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🌐 Sitio Web</label>
                  <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="mi-negocio.com o enlace" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">📧 Correo Contacto</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hola@marca.cl" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
                  </div>
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">📞 Teléfono (WhatsApp)</label>
                      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+56 9 ..." className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
                  </div>
              </div>
          </div>

          {/* Redes Sociales - Botones Conectar */}
          <div className="pt-6 border-t border-slate-100">
             <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">Conexiones a Redes Sociales</h4>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Meta (FB & IG) */}
                <div className="p-5 border-2 border-slate-100 rounded-2xl bg-slate-50 flex flex-col justify-between">
                   <div>
                       <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-3">
                               <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                                  f
                               </span>
                               <h5 className="font-black text-slate-900">Meta (FB & IG)</h5>
                           </div>
                           <div className="relative group">
                               <button type="button" className="w-5 h-5 bg-slate-200 text-slate-500 hover:bg-amber-100 hover:text-amber-600 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors cursor-help">?</button>
                               <div className="absolute right-0 top-7 w-56 bg-slate-800 text-white p-3 rounded-xl text-[10px] leading-relaxed shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none font-medium">
                                   ⚠️ Por reglas oficiales de Meta, la automatización solo está permitida para Páginas de Empresa (Fanpages) y cuentas de Instagram Creador/Empresa. No funciona con perfiles personales.
                                   <div className="absolute -top-1.5 right-1.5 w-3 h-3 bg-slate-800 rotate-45"></div>
                               </div>
                           </div>
                       </div>
                       <p className="text-xs text-slate-500 font-medium mb-4">Conecta tu cuenta para publicar automáticamente en Facebook e Instagram.</p>
                   </div>
                   
                   {fbStatus ? (
                       <div className="flex flex-col h-full justify-end">
                           <div className="flex items-center justify-between mb-3">
                               <div className="flex items-center gap-2">
                                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                   <span className="text-xs font-bold text-emerald-600">Conectado</span>
                               </div>
                               {(() => {
                                   const expInfo = getExpirationText(activeProfile?.metaTokenExpiresAt);
                                   if (!expInfo) return null;
                                   return (
                                       <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${expInfo.bg} ${expInfo.color}`}>
                                           {expInfo.text}
                                       </span>
                                   );
                               })()}
                           </div>
                           {/* Cuentas conectadas */}
                           {(activeProfile?.facebookPageName || activeProfile?.instagramUsername) && (
                               <div className="mb-3 p-3 bg-white border border-slate-100 rounded-xl space-y-1.5 shadow-sm text-left">
                                   {activeProfile.facebookPageName && (
                                       <div className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                                           <span className="text-blue-500 shrink-0">👤</span>
                                           <span className="text-slate-400 font-medium tracking-wide">Página:</span>
                                           <span className="text-slate-700 font-bold truncate">{activeProfile.facebookPageName}</span>
                                       </div>
                                   )}
                                   {activeProfile.instagramUsername && (
                                       <div className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                                           <span className="text-pink-500 shrink-0">📸</span>
                                           <span className="text-slate-400 font-medium tracking-wide">Insta:</span>
                                           <span className="text-slate-700 font-bold truncate">@{activeProfile.instagramUsername}</span>
                                       </div>
                                   )}
                               </div>
                           )}

                           <div className="flex gap-2">
                               <button type="button" onClick={() => setShowMetaModal(true)} className="flex-1 bg-white border-2 border-slate-200 hover:border-blue-500 text-slate-700 text-[10px] sm:text-xs font-bold py-2 rounded-xl transition-colors truncate">Cambiar</button>
                               <button type="button" onClick={handleConnectMeta} className="flex-1 bg-blue-50 border-2 border-blue-100 hover:border-blue-300 text-blue-600 text-[10px] sm:text-xs font-bold py-2 rounded-xl transition-colors truncate">Actualizar</button>
                               <button type="button" onClick={handleDisconnectFb} className="px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors" title="Desconectar">X</button>
                           </div>
                       </div>
                   ) : (
                       <button type="button" onClick={handleConnectMeta} className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-2.5 rounded-xl shadow-md text-sm transition-colors mt-auto">
                           Conectar con Meta
                       </button>
                   )}
                </div>

                {/* 2. TikTok */}
                <div className="p-5 border-2 border-slate-100 rounded-2xl bg-slate-50 flex flex-col justify-between">
                   <div>
                       <div className="flex items-center gap-3 mb-2">
                           <span className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                 <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.41-.43-.61-.65v5.13c.04 2.11-.6 4.31-2.12 5.85-1.59 1.62-3.95 2.45-6.19 2.14-2.61-.31-4.99-2.22-5.74-4.79-.88-2.85-.02-6.22 2.19-8.15 1.72-1.53 4.12-2.11 6.36-1.57v4.18c-1.34-.37-2.89-.08-3.94.83-1.04.9-1.54 2.37-1.28 3.73.28 1.43 1.57 2.53 3.01 2.62 1.45.09 2.92-.85 3.39-2.22.25-.66.29-1.39.27-2.09V0z"/>
                              </svg>
                           </span>
                           <h5 className="font-black text-slate-900">TikTok</h5>
                       </div>
                       <p className="text-xs text-slate-500 font-medium mb-4">Publica tus Reels y videos automáticamente en tu perfil de TikTok.</p>
                   </div>
                   
                   {ttStatus ? (
                       <div className="flex flex-col h-full justify-end">
                           <div className="flex items-center justify-between mb-3">
                               <div className="flex items-center gap-2">
                                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                   <span className="text-xs font-bold text-emerald-600">Conectado</span>
                               </div>
                               {(() => {
                                   const expInfo = getExpirationText(activeProfile?.tiktokTokenExpiresAt);
                                   if (!expInfo) return null;
                                   return (
                                       <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${expInfo.bg} ${expInfo.color} whitespace-nowrap ml-2`}>
                                           {expInfo.text}
                                       </span>
                                   );
                               })()}
                           </div>
                           
                           {activeProfile?.tiktokUsername && (
                               <div className="mb-3 p-3 bg-white border border-slate-100 rounded-xl space-y-1.5 shadow-sm text-left">
                                   <div className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                                       <span className="text-black shrink-0">🎵</span>
                                       <span className="text-slate-400 font-medium tracking-wide">Perfil:</span>
                                       <span className="text-slate-700 font-bold truncate">{activeProfile.tiktokUsername}</span>
                                   </div>
                                </div>
                           )}

                           <div className="flex gap-2">
                               <button type="button" onClick={handleConnectTikTok} className="flex-1 bg-white border-2 border-slate-200 hover:border-black text-slate-700 text-[10px] sm:text-xs font-bold py-2 rounded-xl transition-colors truncate">Actualizar</button>
                               <button type="button" onClick={handleDisconnectTt} className="px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors" title="Desconectar">X</button>
                           </div>
                       </div>
                   ) : (
                       <button type="button" onClick={handleConnectTikTok} className="w-full bg-black hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-md text-sm transition-colors mt-auto">
                           Conectar con TikTok
                       </button>
                   )}
                </div>

                {/* 3. YouTube Shorts */}
                <div className="p-5 border-2 border-slate-100 rounded-2xl bg-slate-50 flex flex-col justify-between">
                   <div>
                       <div className="flex items-center gap-3 mb-2">
                           <span className="w-8 h-8 bg-rose-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                              ▶
                           </span>
                           <h5 className="font-black text-slate-900">YouTube Shorts</h5>
                       </div>
                       <p className="text-xs text-slate-500 font-medium mb-4">Publica tus Shorts y Reels de video directamente en tu canal de YouTube.</p>
                   </div>
                   
                   {Boolean(activeProfile?.accounts?.youtube?.connected || activeProfile?.youtubeConnected) ? (
                       <div className="flex flex-col h-full justify-end">
                           <div className="flex items-center justify-between mb-3">
                               <div className="flex items-center gap-2">
                                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                   <span className="text-xs font-bold text-emerald-600">Conectado</span>
                               </div>
                           </div>
                           
                           {(activeProfile?.accounts?.youtube?.channelName || activeProfile?.youtubeChannelName) && (
                               <div className="mb-3 p-3 bg-white border border-slate-100 rounded-xl space-y-1.5 shadow-sm text-left">
                                   <div className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                                       <span className="text-rose-600 shrink-0">📺</span>
                                       <span className="text-slate-400 font-medium tracking-wide">Canal:</span>
                                       <span className="text-slate-700 font-bold truncate">{activeProfile?.accounts?.youtube?.channelName || activeProfile?.youtubeChannelName}</span>
                                   </div>
                               </div>
                           )}

                           <div className="flex gap-2">
                               <button type="button" onClick={handleConnectYouTube} className="flex-1 bg-white border-2 border-slate-200 hover:border-rose-500 text-slate-700 text-[10px] sm:text-xs font-bold py-2 rounded-xl transition-colors truncate">Actualizar</button>
                               <button type="button" onClick={handleDisconnectYouTube} className="px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors" title="Desconectar">X</button>
                           </div>
                       </div>
                   ) : (
                       <button type="button" onClick={handleConnectYouTube} className="w-full bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold py-2.5 rounded-xl shadow-md text-sm transition-colors mt-auto">
                           Conectar con YouTube
                       </button>
                   )}
                </div>

                {/* 4. X (Twitter) */}
                <div className="p-5 border-2 border-slate-100 rounded-2xl bg-slate-50 flex flex-col justify-between">
                   <div>
                       <div className="flex items-center gap-3 mb-2">
                           <span className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-xs">
                              𝕏
                           </span>
                           <h5 className="font-black text-slate-900">X (Twitter)</h5>
                       </div>
                       <p className="text-xs text-slate-500 font-medium mb-4">Publica hilos, tweets y videos automáticamente en tu perfil de X.</p>
                   </div>
                   
                   {Boolean(activeProfile?.accounts?.x?.connected || activeProfile?.xConnected) ? (
                       <div className="flex flex-col h-full justify-end">
                           <div className="flex items-center justify-between mb-3">
                               <div className="flex items-center gap-2">
                                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                   <span className="text-xs font-bold text-emerald-600">Conectado</span>
                               </div>
                           </div>
                           
                           {(activeProfile?.accounts?.x?.username || activeProfile?.xUsername) && (
                               <div className="mb-3 p-3 bg-white border border-slate-100 rounded-xl space-y-1.5 shadow-sm text-left">
                                   <div className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                                       <span className="text-black shrink-0">𝕏</span>
                                       <span className="text-slate-400 font-medium tracking-wide">Usuario:</span>
                                       <span className="text-slate-700 font-bold truncate">{activeProfile?.accounts?.x?.username || activeProfile?.xUsername}</span>
                                   </div>
                               </div>
                           )}

                           <div className="flex gap-2">
                               <button type="button" onClick={handleConnectX} className="flex-1 bg-white border-2 border-slate-200 hover:border-black text-slate-700 text-[10px] sm:text-xs font-bold py-2 rounded-xl transition-colors truncate">Actualizar</button>
                               <button type="button" onClick={handleDisconnectX} className="px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors" title="Desconectar">X</button>
                           </div>
                       </div>
                   ) : (
                       <button type="button" onClick={handleConnectX} className="w-full bg-black hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl shadow-md text-sm transition-colors mt-auto">
                           Conectar con X (Twitter)
                       </button>
                   )}
                </div>

                {/* 5. Google Business Profile */}
                <div className="p-5 border-2 border-slate-100 rounded-2xl bg-slate-50 flex flex-col justify-between">
                   <div>
                       <div className="flex items-center gap-3 mb-2">
                           <span className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-bold">
                              G
                           </span>
                           <h5 className="font-black text-slate-900 font-sans">Google Business Profile</h5>
                       </div>
                       <p className="text-xs text-slate-500 font-medium mb-4">Publica actualizaciones y fotos directamente en tu ficha de Google Maps.</p>
                   </div>
                   
                   {gbpStatus ? (
                       <div className="flex flex-col h-full justify-end">
                           <div className="flex items-center justify-between mb-3">
                               <div className="flex items-center gap-2">
                                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                   <span className="text-xs font-bold text-emerald-600">Conectado</span>
                               </div>
                           </div>
                           {activeProfile?.googleBusinessName && (
                               <div className="mb-3 p-3 bg-white border border-slate-100 rounded-xl space-y-1.5 shadow-sm text-left">
                                   <div className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                                       <span className="text-amber-500 shrink-0">📍</span>
                                       <span className="text-slate-400 font-medium tracking-wide">Local:</span>
                                       <span className="text-slate-700 font-bold truncate">{activeProfile.googleBusinessName}</span>
                                   </div>
                                </div>
                           )}
                           <div className="flex gap-2">
                               <button type="button" onClick={handleConnectGBP} className="flex-1 bg-white border-2 border-slate-200 hover:border-amber-500 text-slate-700 text-[10px] sm:text-xs font-bold py-2 rounded-xl transition-colors truncate">Actualizar</button>
                               <button type="button" onClick={handleDisconnectGBP} className="px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors" title="Desconectar">X</button>
                           </div>
                       </div>
                   ) : (
                       <button type="button" onClick={handleConnectGBP} className="w-full bg-[#EA4335] hover:bg-[#d63022] text-white font-bold py-2.5 rounded-xl shadow-md text-sm transition-colors mt-auto">
                           Conectar con Google
                       </button>
                   )}
                </div>

             </div>
          </div>
        </div>

        <div className="sticky bottom-6 z-50 flex justify-end">
           <button disabled={saving} type="submit" className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black text-lg py-5 px-14 rounded-[28px] transition-all shadow-2xl shadow-indigo-900/40 flex items-center justify-center gap-4 hover:-translate-y-1">
             {saving ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <><span>💾</span> Guardar Información</>}
           </button>
        </div>

      </form>
      <StatusModal 
        {...modal} 
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
      <MetaSelectionModal isOpen={showMetaModal} onClose={() => setShowMetaModal(false)} profileId={activeProfile?.id} onSelect={saveMetaSelection} />
      <LinkedInSelectionModal isOpen={showLinkedInModal} onClose={() => setShowLinkedInModal(false)} profileId={activeProfile?.id} onSelect={saveLinkedInSelection} />
    </div>
  );
}

export default function RrssConfig() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 rounded-3xl"></div>}>
      <ConfigContent />
    </Suspense>
  );
}
