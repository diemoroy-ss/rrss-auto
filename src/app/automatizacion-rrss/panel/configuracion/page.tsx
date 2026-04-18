"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useProfile } from "../../../../contexts/ProfileContext";
import StatusModal from "../../../../components/StatusModal";

export default function RrssConfig() {
  const { activeProfile, loadProfiles } = useProfile();
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
  const [fbPageId, setFbPageId] = useState("");
  const [fbToken, setFbToken] = useState("");
  const [metaAdAccountId, setMetaAdAccountId] = useState("");

  const [igStatus, setIgStatus] = useState(false);
  const [igAccountId, setIgAccountId] = useState("");
  const [igToken, setIgToken] = useState("");

  const [showFbConfig, setShowFbConfig] = useState(false);
  const [showIgConfig, setShowIgConfig] = useState(false);
  const [showLiConfig, setShowLiConfig] = useState(false);

  const [liStatus, setLiStatus] = useState(false);
  const [liClientId, setLiClientId] = useState("");
  const [liClientSecret, setLiClientSecret] = useState("");
  const [isLinkingLi, setIsLinkingLi] = useState(false);

  // New Business Data States
  const [website, setWebsite] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoadingInitial(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeProfile) {
      setFbStatus(!!activeProfile.facebookToken_enc);
      setFbPageId(activeProfile.facebookPageId || "");
      setMetaAdAccountId(activeProfile.metaAdAccountId || "");
      
      setIgStatus(!!activeProfile.instagramToken_enc);
      setIgAccountId(activeProfile.instagramAccountId || "");

      // Check linkedin status if we have the client ID encrypted and maybe token
      setLiStatus(!!activeProfile.linkedinClientId_enc);
      setLiClientId(""); // Never display secrets
      setLiClientSecret("");

      // Load Business Data
      setWebsite(activeProfile.website || "");
      setFacebookUrl(activeProfile.facebookUrl || "");
      setInstagramUrl(activeProfile.instagramUrl || "");
      setTiktokUrl(activeProfile.tiktokUrl || "");
      setTwitterUrl(activeProfile.twitterUrl || "");
      setLinkedinUrl(activeProfile.linkedinUrl || "");
      setLogoUrl(activeProfile.logoUrl || "");
    } else {
      // Clear states if no active profile
      setLogoUrl("");
      setWebsite("");
      setFacebookUrl("");
      setInstagramUrl("");
      setTiktokUrl("");
      setTwitterUrl("");
      setLinkedinUrl("");
    }
  }, [activeProfile]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setErrorMsg("");

    try {
      const idToken = await user.getIdToken();
      
      const payload = {
        idToken,
        uid: user.uid,
        profileId: activeProfile?.id,
        setAccounts: {
          facebook: fbToken || fbPageId || metaAdAccountId ? { token: fbToken, pageId: fbPageId, adAccountId: metaAdAccountId } : null,
          instagram: igToken || igAccountId ? { token: igToken, accountId: igAccountId } : null,
          linkedin: liClientId || liClientSecret ? { clientId: liClientId, clientSecret: liClientSecret } : null
        }
      };

      if (!fbToken && fbStatus) payload.setAccounts.facebook = null; 
      if (!igToken && igStatus) payload.setAccounts.instagram = null;
      if (!liClientId && liStatus) payload.setAccounts.linkedin = null;

      const res = await fetch("/api/social-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error guardando configuración de Meta");

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && activeProfile) {
          const data = userDoc.data();
          const updatedProfiles = (data.profiles || []).map((p: any) => 
             p.id === activeProfile.id ? {
                ...p,
                website,
                facebookUrl,
                instagramUrl,
                tiktokUrl,
                twitterUrl,
                linkedinUrl
             } : p
          );
          await updateDoc(userDocRef, { profiles: updatedProfiles });
          await loadProfiles();
      }

      setSuccess(true);
      if (fbToken) setFbStatus(true);
      if (igToken) setIgStatus(true);
      if (liClientId) setLiStatus(true);
      
      setFbToken("");
      setIgToken("");
      setLiClientId("");
      setLiClientSecret("");
      
      setTimeout(() => setSuccess(false), 5000);

    } finally {
      setSaving(false);
    }
  };

  const handleRepairMigration = async () => {
    if (!user || !activeProfile) return;
    setSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const profiles = data.profiles || [];
        const index = profiles.findIndex((p: any) => p.id === activeProfile.id);
        
        if (index !== -1) {
          const profile = { ...profiles[index] };
          // Merge root data into this profile if profile lacks it
          if (data.facebookToken_enc) profile.facebookToken_enc = data.facebookToken_enc;
          if (data.iv_fb) profile.iv_fb = data.iv_fb;
          if (data.tag_fb) profile.tag_fb = data.tag_fb;
          if (data.facebookPageId) profile.facebookPageId = data.facebookPageId;
          if (data.metaAdAccountId) profile.metaAdAccountId = data.metaAdAccountId;
          
          if (data.instagramToken_enc) profile.instagramToken_enc = data.instagramToken_enc;
          if (data.iv_ig) profile.iv_ig = data.iv_ig;
          if (data.tag_ig) profile.tag_ig = data.tag_ig;
          if (data.instagramAccountId) profile.instagramAccountId = data.instagramAccountId;
          
          if (data.website && !profile.website) profile.website = data.website;
          if (data.facebookUrl && !profile.facebookUrl) profile.facebookUrl = data.facebookUrl;
          if (data.instagramUrl && !profile.instagramUrl) profile.instagramUrl = data.instagramUrl;
          
          profiles[index] = profile;
          await updateDoc(userDocRef, { profiles });
          await loadProfiles();
          setMessage({ type: 'success', text: "¡Datos antiguos sincronizados correctamente!" });
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Error al intentar reparar la conexión.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectFb = async () => {
    showModal("confirm", "Desconectar Facebook", "¿Estás seguro de que deseas desconectar tu cuenta de Facebook? Se eliminarán los datos de acceso guardados.", async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        setSaving(true);
        try {
            const idToken = await user.getIdToken();
            await fetch("/api/social-auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken, uid: user.uid, setAccounts: { facebook: { token: "", pageId: "", adAccountId: "" } } })
            });
            setFbStatus(false);
            setFbPageId("");
            setMetaAdAccountId("");
            setFbToken("");
            showModal("success", "Desconectado", "Facebook ha sido desconectado exitosamente.");
        } catch (e) { 
            console.error(e);
            showModal("error", "Error", "No se pudo desconectar la cuenta. Intenta de nuevo.");
        }
        setSaving(false);
    });
  };

  const handleDisconnectIg = async () => {
    showModal("confirm", "Desconectar Instagram", "¿Seguro que quieres desconectar Instagram? Perderás la capacidad de autopublicación inmediata.", async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        setSaving(true);
        try {
            const idToken = await user.getIdToken();
            await fetch("/api/social-auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken, uid: user.uid, setAccounts: { instagram: { token: "", accountId: "" } } })
            });
            setIgStatus(false);
            setIgAccountId("");
            setIgToken("");
            showModal("success", "Desconectado", "Instagram ha sido desconectado exitosamente.");
        } catch (e) { 
            console.error(e);
            showModal("error", "Error", "No se pudo desconectar la cuenta.");
        }
        setSaving(false);
    });
  };

  const handleDisconnectLi = async () => {
    showModal("confirm", "Borrar API LinkedIn", "¿Borrar credenciales API de LinkedIn? Perderás el acceso si ya habías autorizado el inicio de sesión.", async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        setSaving(true);
        try {
            const idToken = await user.getIdToken();
            await fetch("/api/social-auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken, uid: user.uid, setAccounts: { linkedin: { clientId: "", clientSecret: "" } } })
            });
            setLiStatus(false);
            setLiClientId("");
            setLiClientSecret("");
            showModal("success", "Limpieza Exitosa", "Credenciales de LinkedIn eliminadas.");
        } catch (e) { 
            console.error(e);
            showModal("error", "Error", "No se pudo borrar la configuración.");
        }
        setSaving(false);
    });
  };

  const handleLinkLi = async () => {
    if (!user || !activeProfile) return;
    setIsLinkingLi(true);
    try {
        const idToken = await user.getIdToken();
        const origin = window.location.origin; // Dynamically grab http://localhost:3002 or production URL
        const res = await fetch(`/api/linkedin/auth?profileId=${activeProfile.id}&origin=${encodeURIComponent(origin)}`, {
            headers: {
                "Authorization": `Bearer ${idToken}`
            }
        });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || "No URL returned");
        }
    } catch (e: any) {
        console.error("Error Linking LinkedIn", e);
        setErrorMsg(e.message);
        setIsLinkingLi(false);
    }
  };

  if (loadingInitial) return <div className="animate-pulse space-y-4 max-w-2xl"><div className="h-10 bg-slate-200 rounded w-1/3"></div><div className="h-64 bg-slate-200 rounded"></div></div>;

  return (
    <div className="max-w-4xl mx-auto lg:mx-0 pb-20">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Configuración de <span className="text-indigo-600">Marca.</span></h1>
        <p className="text-slate-500 mt-4 text-lg font-medium leading-relaxed">Completa la identidad de <strong className="text-indigo-500">{activeProfile?.name}</strong> para alimentar el "Cerebro" de Estrategia AI y administrar sus conexiones a Meta.</p>
        <button 
          onClick={handleRepairMigration}
          className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-2"
        >
          <span>🔧</span> ¿Faltan datos antiguos o conexiones? Reparar Aquí
        </button>
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

      <form onSubmit={handleSave} className="space-y-10">
        
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

          <div className="grid md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🌐 Sitio Web</label>
                  <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="mi-negocio.com o enlace" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
              </div>
              <div>
                  <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </span>
                        Facebook Cuenta
                      </label>
                      <button type="button" onClick={() => setShowFbConfig(!showFbConfig)} className={`p-1.5 rounded-lg transition-colors ${showFbConfig ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-400'} group`} title="Configurar Autopublicación en Facebook">
                          <svg className={`w-4 h-4 transition-transform ${showFbConfig ? 'rotate-90' : 'group-hover:rotate-45'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                  </div>
                  <input type="text" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="@minegocio o enlace" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700 mb-2" />
                  
                  {/* FACEBOOK META ACCOUNTS (COLLAPSIBLE) */}
                  {showFbConfig && (
                      <div className="bg-blue-50/30 border border-blue-100 p-5 rounded-[20px] mt-2 animate-in slide-in-from-top-2 fade-in relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 blur-[40px] -mr-16 -mt-16 rounded-full"></div>
                          <div className="flex items-center justify-between mb-4 relative z-10">
                              <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest bg-blue-100 px-3 py-1 rounded-full inline-block">App Token (Técnico)</h4>
                              {fbStatus && (
                                <div className="flex items-center gap-2">
                                    <span className="bg-emerald-50 text-emerald-600 text-[9px] uppercase tracking-[0.2em] font-black px-2 py-1 rounded-full border border-emerald-100 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>ON</span>
                                    <button type="button" onClick={handleDisconnectFb} className="text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 px-2 py-1 rounded-lg transition-all">Borrar</button>
                                </div>
                              )}
                              {!fbStatus && <span className="bg-slate-100 text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black px-2 py-1 rounded-full border border-slate-200">OFF</span>}
                          </div>
                          <div className="space-y-4 relative z-10">
                              <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">ID de la Página (Page ID)</label>
                                <input type="text" value={fbPageId} onChange={e => setFbPageId(e.target.value)} placeholder="Ej. 10234567890" className="w-full bg-white border border-blue-100 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none text-xs font-bold transition-all text-slate-700" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">ID de Cuenta Publicitaria (Ad Account ID)</label>
                                <input type="text" value={metaAdAccountId} onChange={e => setMetaAdAccountId(e.target.value)} placeholder="Ej. act_1234567890" className="w-full bg-white border border-blue-100 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none text-xs font-bold transition-all text-slate-700" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Access Token (Meta API)</label>
                                <div className="relative">
                                  <input type="password" value={fbToken} onChange={e => setFbToken(e.target.value)} placeholder={fbStatus ? "••••••••••••••••" : "Pegar token aquí (EAA...)"} className="w-full bg-white border border-blue-100 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none text-xs font-bold transition-all text-slate-700 font-mono" />
                                  {fbStatus && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-1.5 py-0.5 rounded">OK</span>}
                                </div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
              <div>
                  <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-5 h-5 bg-pink-100 text-pink-600 rounded flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                        </span>
                        Instagram Cuenta
                      </label>
                      <button type="button" onClick={() => setShowIgConfig(!showIgConfig)} className={`p-1.5 rounded-lg transition-colors ${showIgConfig ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-400'} group`} title="Configurar Autopublicación en Instagram">
                          <svg className={`w-4 h-4 transition-transform ${showIgConfig ? 'rotate-90' : 'group-hover:rotate-45'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                  </div>
                  <input type="text" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="@minegocio o enlace" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700 mb-2" />
                  
                  {/* INSTAGRAM META ACCOUNTS (COLLAPSIBLE) */}
                  {showIgConfig && (
                      <div className="bg-pink-50/30 border border-pink-100 p-5 rounded-[20px] mt-2 animate-in slide-in-from-top-2 fade-in relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/50 blur-[40px] -mr-16 -mt-16 rounded-full"></div>
                          <div className="flex items-center justify-between mb-4 relative z-10">
                              <h4 className="text-[11px] font-black text-pink-900 uppercase tracking-widest bg-pink-100 px-3 py-1 rounded-full inline-block">Account Token (Técnico)</h4>
                              {igStatus && (
                                <div className="flex items-center gap-2">
                                    <span className="bg-emerald-50 text-emerald-600 text-[9px] uppercase tracking-[0.2em] font-black px-2 py-1 rounded-full border border-emerald-100 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>ON</span>
                                    <button type="button" onClick={handleDisconnectIg} className="text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 px-2 py-1 rounded-lg transition-all">Borrar</button>
                                </div>
                              )}
                              {!igStatus && <span className="bg-slate-100 text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black px-2 py-1 rounded-full border border-slate-200">OFF</span>}
                          </div>
                          <div className="space-y-4 relative z-10">
                              <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Instagram Business Account ID</label>
                                <input type="text" value={igAccountId} onChange={e => setIgAccountId(e.target.value)} placeholder="Ej. 17841400000000000" className="w-full bg-white border border-pink-100 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 outline-none text-xs font-bold transition-all text-slate-700" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">User Access Token</label>
                                <div className="relative">
                                  <input type="password" value={igToken} onChange={e => setIgToken(e.target.value)} placeholder={igStatus ? "••••••••••••••••" : "Pegar token aquí (EAA...)"} className="w-full bg-white border border-pink-100 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 outline-none text-xs font-bold transition-all text-slate-700 font-mono" />
                                  {igStatus && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-1.5 py-0.5 rounded">OK</span>}
                                </div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🎵 TikTok Cuenta</label>
                  <input type="text" value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)} placeholder="@minegocio o enlace" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
              </div>
              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🐦 Twitter (X) Cuenta</label>
                  <input type="text" value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} placeholder="@minegocio o enlace" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700" />
              </div>
              <div>
                  <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-5 h-5 bg-sky-100 text-sky-600 rounded flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </span>
                        LinkedIn Cuenta
                      </label>
                      <button type="button" onClick={() => setShowLiConfig(!showLiConfig)} className={`p-1.5 rounded-lg transition-colors ${showLiConfig ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-400'} group`} title="Configurar Autopublicación en LinkedIn">
                          <svg className={`w-4 h-4 transition-transform ${showLiConfig ? 'rotate-90' : 'group-hover:rotate-45'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                  </div>
                  <input type="text" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="minegocio o enlace" className="w-full bg-slate-50 border-2 border-slate-100 px-5 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none text-sm font-bold transition-all text-slate-700 mb-2" />
                  
                  {/* LINKEDIN DEVELOPER ACCOUNTS (COLLAPSIBLE) */}
                  {showLiConfig && (
                      <div className="bg-sky-50/30 border border-sky-100 p-5 rounded-[20px] mt-2 animate-in slide-in-from-top-2 fade-in relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100/50 blur-[40px] -mr-16 -mt-16 rounded-full"></div>
                          <div className="flex items-center justify-between mb-4 relative z-10">
                              <h4 className="text-[11px] font-black text-sky-900 uppercase tracking-widest bg-sky-100 px-3 py-1 rounded-full inline-block">App Developer (OAuth)</h4>
                              {liStatus && (
                                <div className="flex items-center gap-2">
                                    <span className="bg-emerald-50 text-emerald-600 text-[9px] uppercase tracking-[0.2em] font-black px-2 py-1 rounded-full border border-emerald-100 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>ON</span>
                                    <button type="button" onClick={handleDisconnectLi} className="text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 px-2 py-1 rounded-lg transition-all">Borrar</button>
                                </div>
                              )}
                              {!liStatus && <span className="bg-slate-100 text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black px-2 py-1 rounded-full border border-slate-200">OFF</span>}
                          </div>

                          <div className="space-y-4 relative z-10">
                              <p className="text-[10px] text-sky-800 font-medium leading-relaxed bg-sky-50 p-2 rounded-lg border border-sky-100">Crea una app en <a href="https://www.linkedin.com/developers/" target="_blank" className="font-bold underline text-indigo-600 hover:text-indigo-800">LinkedIn Developers</a>, pide el permiso "Share on LinkedIn" y conéctala aquí para publicar posts.</p>
                              <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Client ID</label>
                                <input type="text" value={liClientId} onChange={e => setLiClientId(e.target.value)} placeholder={liStatus ? "Configurado (oculto por seguridad)" : "Ej. 77xpto..."} className="w-full bg-white border border-sky-100 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none text-xs font-bold transition-all text-slate-700" />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Primary Client Secret</label>
                                <div className="relative">
                                  <input type="password" value={liClientSecret} onChange={e => setLiClientSecret(e.target.value)} placeholder={liStatus ? "••••••••••••••••" : "Pegar Client Secret secreto"} className="w-full bg-white border border-sky-100 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none text-xs font-bold transition-all text-slate-700 font-mono" />
                                </div>
                              </div>
                              <div className="pt-2 border-t border-sky-100/50">
                                {liStatus ? (
                                    <button disabled={isLinkingLi} type="button" onClick={handleLinkLi} className="w-full bg-[#0077b5] hover:bg-[#005582] text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-md shadow-sky-500/20 flex items-center gap-2 justify-center disabled:opacity-50">
                                       {isLinkingLi ? 'Generando Enlace...' : (
                                       <>
                                         <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                         Vincular Accesos (Log In)
                                       </>
                                       )}
                                    </button>
                                ) : (
                                    <p className="text-[9px] text-center text-slate-500 font-bold">Guarda los IDs para habilitar el Link de Autorización.</p>
                                )}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
        </div>


        <div className="sticky bottom-6 z-50 flex justify-end">
           <button disabled={saving} type="submit" className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black text-lg py-5 px-14 rounded-[28px] transition-all shadow-2xl shadow-indigo-900/40 flex items-center justify-center gap-4 hover:-translate-y-1">
             {saving ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <><span>💾</span> Guardar Configuración</>}
           </button>
        </div>

      </form>
      <StatusModal 
        {...modal} 
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
