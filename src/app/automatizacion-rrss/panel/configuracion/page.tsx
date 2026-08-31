"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { auth, db, storage } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useProfile } from "../../../../contexts/ProfileContext";
import StatusModal from "../../../../components/StatusModal";
import TabMarca from "./TabMarca";
import TabContacto from "./TabContacto";
import TabConexiones from "./TabConexiones";
import TikTokPostSettings, { TikTokSettingsState, DEFAULT_TIKTOK_SETTINGS } from "../../../../components/crear/TikTokPostSettings";

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

  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError("");
      setDebugInfo(null);
      // Fetch pages
      auth.currentUser?.getIdToken().then(token => {
        fetch(`/api/auth/meta/pages?profileId=${profileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          if (data._debug) setDebugInfo(data._debug);
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
          <div className="space-y-3">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-xl font-bold text-sm">No se encontraron páginas de Facebook. Asegúrate de tener permisos de administrador.</div>
            {debugInfo && (
              <details className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">
                <summary className="font-bold text-slate-500 cursor-pointer">🔍 Debug Info (compartir con soporte)</summary>
                <pre className="mt-2 text-slate-600 overflow-auto max-h-48 whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
              </details>
            )}
          </div>
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

function TikTokDefaultSettingsModal({ isOpen, onClose, initialSettings, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: TikTokSettingsState;
  onSave: (settings: TikTokSettingsState) => Promise<void>;
}) {
  const [settings, setSettings] = useState<TikTokSettingsState>(initialSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings);
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎵</span>
            <div>
              <h3 className="text-lg font-black text-white">Preferencias de TikTok Direct Post</h3>
              <p className="text-xs text-slate-400 font-medium">Configura los valores predeterminados para todas tus publicaciones en TikTok.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        <TikTokPostSettings
          settings={settings}
          onChange={setSettings}
          isDefaultConfig={true}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-colors text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(settings);
                onClose();
              } finally {
                setSaving(false);
              }
            }}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-all text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            {saving ? <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : "💾 Guardar Preferencias"}
          </button>
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
  const [activeTab, setActiveTab] = useState<'marca' | 'contacto' | 'conexiones'>('marca');
  const [user, setUser] = useState<any>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [showTikTokModal, setShowTikTokModal] = useState(false);

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
  
  const [rubro, setRubro] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [includeWebsiteInCopy, setIncludeWebsiteInCopy] = useState(true);
  const [includeEmailInCopy, setIncludeEmailInCopy] = useState(true);
  const [includePhoneInCopy, setIncludePhoneInCopy] = useState(true);
  
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPrompt, setLogoPrompt] = useState("");
  const [alwaysIncludeLogo, setAlwaysIncludeLogo] = useState(false);
  const [promotions, setPromotions] = useState("");
  const [bannerStyle, setBannerStyle] = useState<'banner' | 'clean'>("banner");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isAnalyzingLogo, setIsAnalyzingLogo] = useState(false);

  useEffect(() => {
    setUser(auth.currentUser);
    setLoadingInitial(false);
  }, []);

  const isAdmin = user?.email === "admin@santisoft.cl" || user?.email === "diemoroy@gmail.com" || user?.email === "spalezcom@gmail.com" || user?.email === "santisoftai@gmail.com";

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

      if (activeProfile.rubro !== rubro) setRubro(activeProfile.rubro || "");
      if (activeProfile.businessDescription !== businessDescription) setBusinessDescription(activeProfile.businessDescription || "");
      if (activeProfile.promotions !== promotions) setPromotions(activeProfile.promotions || "");
      if (activeProfile.bannerStyle && activeProfile.bannerStyle !== bannerStyle) setBannerStyle(activeProfile.bannerStyle);
      
      if (activeProfile.includeWebsiteInCopy !== undefined && activeProfile.includeWebsiteInCopy !== includeWebsiteInCopy) setIncludeWebsiteInCopy(activeProfile.includeWebsiteInCopy);
      if (activeProfile.includeEmailInCopy !== undefined && activeProfile.includeEmailInCopy !== includeEmailInCopy) setIncludeEmailInCopy(activeProfile.includeEmailInCopy);
      if (activeProfile.includePhoneInCopy !== undefined && activeProfile.includePhoneInCopy !== includePhoneInCopy) setIncludePhoneInCopy(activeProfile.includePhoneInCopy);

      if (activeProfile.facebookUrl !== facebookUrl) setFacebookUrl(activeProfile.facebookUrl || "");
      if (activeProfile.instagramUrl !== instagramUrl) setInstagramUrl(activeProfile.instagramUrl || "");
      if (activeProfile.tiktokUrl !== tiktokUrl) setTiktokUrl(activeProfile.tiktokUrl || "");
      if (activeProfile.linkedinUrl !== linkedinUrl) setLinkedinUrl(activeProfile.linkedinUrl || "");
      if (activeProfile.email !== email) setEmail(activeProfile.email || "");
      if (activeProfile.phone !== phone) setPhone(activeProfile.phone || "");
      if (activeProfile.logoUrl !== logoUrl) setLogoUrl(activeProfile.logoUrl || "");
      if (activeProfile.logoPrompt !== logoPrompt) setLogoPrompt(activeProfile.logoPrompt || "");
      if (activeProfile.alwaysIncludeLogo !== undefined && activeProfile.alwaysIncludeLogo !== alwaysIncludeLogo) setAlwaysIncludeLogo(activeProfile.alwaysIncludeLogo);
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

        // Analizar logo con Gemini Vision para generar prompt de recreación
        setIsAnalyzingLogo(true);
        let analyzedPrompt = '';
        try {
          const analyzeRes = await fetch('/api/analyze-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              logoUrl: url,
              rubro: rubro,
              businessDescription: businessDescription,
            }),
          });
          if (analyzeRes.ok) {
            const analyzeData = await analyzeRes.json();
            analyzedPrompt = analyzeData.logoPrompt || '';
            setLogoPrompt(analyzedPrompt);
          }
        } catch (analyzeErr) {
          console.warn('[Logo] Error analizando logo con IA:', analyzeErr);
        } finally {
          setIsAnalyzingLogo(false);
        }
        
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && activeProfile) {
            const data = userDoc.data();
            const updatedProfiles = (data.profiles || []).map((p: any) => 
               p.id === activeProfile.id ? { ...p, logoUrl: url, logoPrompt: analyzedPrompt } : p
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
    
    if (!rubro.trim() || !businessDescription.trim()) {
      setErrorMsg("El Rubro y la Descripción del Negocio son obligatorios.");
      return;
    }

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
                rubro,
                businessDescription,
                includeWebsiteInCopy,
                includeEmailInCopy,
                includePhoneInCopy,
                facebookUrl,
                instagramUrl,
                tiktokUrl,
                linkedinUrl,
                email,
                phone,
                alwaysIncludeLogo,
                promotions,
                bannerStyle

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

  const tabs = [
    { id: 'marca' as const, label: 'Marca', icon: '🏢' },
    { id: 'contacto' as const, label: 'Datos & Contacto', icon: '📋' },
    { id: 'conexiones' as const, label: 'Conexiones', icon: '🔗' },
  ];

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

      {!isBusiness && activeProfile?.accountLocks && Object.keys((activeProfile as any).accountLocks).length > 0 && (
        <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-[24px] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-4">
            <span className="text-2xl mt-0.5">🔒</span>
            <div className="flex-1">
              <h4 className="font-black text-amber-800 text-sm mb-1">Cuentas vinculadas a este perfil</h4>
              <p className="text-amber-700 text-xs font-medium leading-relaxed">Tu plan actual permite <strong>una sola cuenta por red social</strong>. Las siguientes cuentas quedaron vinculadas porque ya publicaste con ellas:</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {(activeProfile as any).accountLocks?.facebook && <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full">📘 Facebook: {activeProfile.facebookPageName || (activeProfile as any).accountLocks.facebook}</span>}
                {(activeProfile as any).accountLocks?.instagram && <span className="bg-pink-100 text-pink-700 text-[10px] font-black px-3 py-1 rounded-full">📸 Instagram: @{activeProfile.instagramUsername || (activeProfile as any).accountLocks.instagram}</span>}
                {(activeProfile as any).accountLocks?.tiktok && <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full">🎵 TikTok: {(activeProfile as any).accountLocks.tiktok}</span>}
              </div>
              <p className="text-amber-700 text-xs font-medium mt-3">¿Necesitas gestionar <strong>múltiples negocios</strong>? Pasa al <strong className="text-amber-900">Plan Business</strong> y tendrás hasta 5 marcas independientes, cada una con sus propias redes sociales.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB BAR */}
      <div className="flex gap-2 mb-8 p-1.5 bg-slate-100 rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-md shadow-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab !== 'conexiones' ? (
        <form onSubmit={handleSaveData} className="space-y-6">
          {activeTab === 'marca' && (
            <TabMarca
              logoUrl={logoUrl}
              isUploadingLogo={isUploadingLogo}
              isAnalyzingLogo={isAnalyzingLogo}
              alwaysIncludeLogo={alwaysIncludeLogo}
              brandName={brandName}
              rubro={rubro}
              businessDescription={businessDescription}
              activeProfileName={activeProfile?.name}
              setAlwaysIncludeLogo={setAlwaysIncludeLogo}
              setBrandName={setBrandName}
              setRubro={setRubro}
              setBusinessDescription={setBusinessDescription}
              handleLogoUpload={handleLogoUpload}
            />
          )}
          {activeTab === 'contacto' && (
            <TabContacto
              website={website}
              includeWebsiteInCopy={includeWebsiteInCopy}
              email={email}
              includeEmailInCopy={includeEmailInCopy}
              phone={phone}
              includePhoneInCopy={includePhoneInCopy}
              promotions={promotions}
              bannerStyle={bannerStyle}
              setWebsite={setWebsite}
              setIncludeWebsiteInCopy={setIncludeWebsiteInCopy}
              setEmail={setEmail}
              setIncludeEmailInCopy={setIncludeEmailInCopy}
              setPhone={setPhone}
              setIncludePhoneInCopy={setIncludePhoneInCopy}
              setPromotions={setPromotions}
              setBannerStyle={setBannerStyle}
            />
          )}
          <div className="sticky bottom-6 z-50 flex justify-end">
            <button disabled={saving} type="submit" className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black text-lg py-5 px-14 rounded-[28px] transition-all shadow-2xl shadow-indigo-900/40 flex items-center justify-center gap-4 hover:-translate-y-1">
              {saving ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <><span>💾</span> Guardar Información</>}
            </button>
          </div>
        </form>
      ) : (
        <TabConexiones
          activeProfile={activeProfile}
          fbStatus={fbStatus}
          ttStatus={ttStatus}
          gbpStatus={gbpStatus}
          isAdmin={isAdmin}
          isBusiness={isBusiness}
          handleConnectMeta={handleConnectMeta}
          handleDisconnectFb={handleDisconnectFb}
          handleConnectTikTok={handleConnectTikTok}
          handleDisconnectTt={handleDisconnectTt}
          handleConnectYouTube={handleConnectYouTube}
          handleDisconnectYouTube={handleDisconnectYouTube}
          handleConnectX={handleConnectX}
          handleDisconnectX={handleDisconnectX}
          handleConnectGBP={handleConnectGBP}
          handleDisconnectGBP={handleDisconnectGBP}
          setShowMetaModal={setShowMetaModal}
          setShowTikTokModal={setShowTikTokModal}
        />
      )}

      <StatusModal
        {...modal}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
      <MetaSelectionModal isOpen={showMetaModal} onClose={() => setShowMetaModal(false)} profileId={activeProfile?.id} onSelect={saveMetaSelection} />
      <LinkedInSelectionModal isOpen={showLinkedInModal} onClose={() => setShowLinkedInModal(false)} profileId={activeProfile?.id} onSelect={saveLinkedInSelection} />
      <TikTokDefaultSettingsModal 
        isOpen={showTikTokModal} 
        onClose={() => setShowTikTokModal(false)} 
        initialSettings={activeProfile?.tiktokDefaults || DEFAULT_TIKTOK_SETTINGS} 
        onSave={saveTikTokDefaults} 
      />
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
