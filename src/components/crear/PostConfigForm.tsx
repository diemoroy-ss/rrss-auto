"use client";

import React, { useRef, useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { useProfile } from "../../contexts/ProfileContext";
import VoiceMic from "../VoiceMic";
import Link from "next/link";
import { type PosterConfig } from "../../types/poster";
import { UserTemplate } from "../../app/automatizacion-rrss/panel/crear/page";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaGoogle, FaYoutube, FaTwitter } from "react-icons/fa";
import TikTokPostSettings, { TikTokSettingsState } from "./TikTokPostSettings";
import { PromptTemplate, HARDCODED_STYLES } from "../../lib/prompt-templates";
import PromptStylePickerModal from "./PromptStylePickerModal";
import PreferredStylesModal, { StyleOption } from "./PreferredStylesModal";
import { isPlatformAllowed } from "../../lib/plans";

interface PostConfigFormProps {
  userPlan?: string;
  // AI states
  idea: string;
  setIdea: (val: string) => void;
  imageExpectation: string;
  setImageExpectation: (val: string) => void;
  imageStyle?: string;
  setImageStyle?: (val: string) => void;
  selectedPromptTemplate?: PromptTemplate | null;
  setSelectedPromptTemplate?: (val: PromptTemplate | null) => void;
  postText: string;
  setPostText: (val: string) => void;

  // Manual states
  creationMode: 'ai' | 'manual';
  setCreationMode: (val: 'ai' | 'manual') => void;
  manualFiles: File[];
  setManualFiles: React.Dispatch<React.SetStateAction<File[]>>;
  manualCaption: string;
  setManualCaption: (val: string) => void;
  manualTemplates: UserTemplate[];
  selectedTemplate: UserTemplate | null;
  setSelectedTemplate: (val: UserTemplate | null) => void;
  loadingTemplates: boolean;
  onUploadNewTemplate?: (file: File) => void;
  onDeleteTemplate?: (tmpl: UserTemplate) => void;

  // General config
  postType: string;
  setPostType: (val: string) => void;
  carouselCount: number;
  setCarouselCount: (val: number) => void;
  businessType: string;
  setBusinessType: (val: string) => void;
  date: string;
  setDate: (val: string) => void;
  time: string;
  setTime: (val: string) => void;
  networks: {
    facebook: boolean;
    instagram: boolean;
    linkedin: boolean;
    tiktok: boolean;
    googleBusiness: boolean;
    youtube: boolean;
    x: boolean;
  };
  setNetworks: (val: any) => void;
  tiktokSettings?: TikTokSettingsState;
  setTiktokSettings?: (val: TikTokSettingsState) => void;

  // Website Link Attachment
  attachWebsiteLink?: boolean;
  setAttachWebsiteLink?: (val: boolean) => void;
  websiteUrl?: string;
  setWebsiteUrl?: (val: string) => void;

  // Poster configuration (For references/logo defaults)
  posterConfig?: PosterConfig;
  setPosterConfig?: React.Dispatch<React.SetStateAction<PosterConfig>>;
  activeProfileLogoUrl?: string;
  activeProfileName?: string;
  activeProfilePhone?: string;
  activeProfileEmail?: string;

  // Handlers & loaders
  hasFb: boolean;
  hasIg: boolean;
  hasLi: boolean;
  hasTt: boolean;
  hasGbp?: boolean;
  hasYt?: boolean;
  hasX?: boolean;
  needsConnection: boolean;
  handleImproveWithAI: () => void;
  handleGeneratePreview: () => void;
  handleSubmit: (e?: React.FormEvent, publishNow?: boolean) => void;
  improveLoading: boolean;
  previewLoading: boolean;
  loading: boolean;
  error: string;
  isAdmin: boolean;
  allowVideo?: boolean;

  // Scheduler control
  showScheduler: boolean;
  setShowScheduler: (val: boolean) => void;

  // Constraints from current selection
  constraints: {
    safeCharLimit: number;
    allowedMediaTypes: string[];
    warnings: string[];
    forcedType: string;
  };

  hideSubmit?: boolean;
  renderSection?: 'parameters' | 'content';
  hideAI?: boolean;
}

const DEFAULT_PREFERRED_STYLE_IDS = [
  "style-exploded",
  "style-blueprint",
  "style-anatomy",
  "style-isometric",
  "style-wireframe",
  "style-lowpoly",
  "style-papercraft",
  "style-claymation",
  "style-meta-ads",
];

export default function PostConfigForm({
  userPlan = "esencial",
  idea, setIdea,
  imageExpectation, setImageExpectation,
  imageStyle, setImageStyle,
  selectedPromptTemplate, setSelectedPromptTemplate,
  postText, setPostText,
  creationMode, setCreationMode,
  manualFiles, setManualFiles,
  manualCaption, setManualCaption,
  manualTemplates,
  selectedTemplate, setSelectedTemplate,
  loadingTemplates,
  onUploadNewTemplate,
  onDeleteTemplate,
  postType, setPostType,
  carouselCount, setCarouselCount,
  businessType, setBusinessType,
  date, setDate,
  time, setTime,
  networks, setNetworks,
  tiktokSettings,
  setTiktokSettings,
  attachWebsiteLink = false,
  setAttachWebsiteLink,
  websiteUrl = "",
  setWebsiteUrl,
  hasFb, hasIg, hasLi, hasTt, hasGbp, hasYt, hasX,
  posterConfig,
  needsConnection,
  handleImproveWithAI,
  handleGeneratePreview,
  handleSubmit,
  improveLoading,
  previewLoading,
  loading,
  error,
  isAdmin,
  allowVideo = false,
  showScheduler,
  setShowScheduler,
  constraints,
  hideSubmit = false,
  renderSection,
  hideAI = false
}: PostConfigFormProps) {

  const maxChars = constraints.safeCharLimit;
  const isOverLimit = creationMode === 'ai' ? postText.length > maxChars : manualCaption.length > maxChars;

  const { activeProfile } = useProfile();
  const [availableTemplates, setAvailableTemplates] = useState<PromptTemplate[]>(HARDCODED_STYLES);
  const [preferredStyleIds, setPreferredStyleIds] = useState<string[]>(DEFAULT_PREFERRED_STYLE_IDS);
  const [showPreferredModal, setShowPreferredModal] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [showPromptPicker, setShowPromptPicker] = useState(false);

  // Cargar todas las plantillas directamente desde Firestore (prompt_library)
  useEffect(() => {
    let isMounted = true;
    async function loadTemplates() {
      try {
        const snap = await getDocs(collection(db, "prompt_library"));
        const loaded: PromptTemplate[] = [];
        const dbIds = new Set<string>();

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          dbIds.add(docSnap.id);
          const hasValidTitle = typeof data.title === "string" && data.title.trim().length > 0;
          const hasValidPrompt = typeof data.prompt === "string" && data.prompt.trim().length > 0;
          if (!data.isDeleted && hasValidTitle && hasValidPrompt) {
            loaded.push({ id: docSnap.id, ...data } as PromptTemplate);
          }
        });

        HARDCODED_STYLES.forEach((style) => {
          if (!dbIds.has(style.id) && style.title && style.title.trim() && style.prompt && style.prompt.trim()) {
            loaded.push(style);
          }
        });

        if (isMounted) {
          setAvailableTemplates(loaded);
        }
      } catch (err) {
        console.warn("Error cargando plantillas de prompt_library:", err);
      }
    }

    loadTemplates();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cargar IDs de estilos favoritos del usuario / perfil
  useEffect(() => {
    if (renderSection !== 'content') return;
    const uid = auth.currentUser?.uid;
    const profileId = activeProfile?.id || "default";

    // 1. LocalStorage
    try {
      const cached = localStorage.getItem(`preferred_style_ids_${profileId}`);
      if (cached) {
        setPreferredStyleIds(JSON.parse(cached));
      }
    } catch (_) {}

    // 2. Firestore
    if (uid) {
      getDoc(doc(db, "users", uid, "preferences", `styles_${profileId}`)).then((snap) => {
        if (snap.exists() && Array.isArray(snap.data().styleIds)) {
          setPreferredStyleIds(snap.data().styleIds);
          try {
            localStorage.setItem(`preferred_style_ids_${profileId}`, JSON.stringify(snap.data().styleIds));
          } catch (_) {}
        }
      }).catch(err => console.warn("Error loading preferred styles:", err));
    }
  }, [renderSection, activeProfile?.id]);

  const handleTogglePreferredStyle = (styleId: string) => {
    const nextIds = preferredStyleIds.includes(styleId)
      ? preferredStyleIds.filter(id => id !== styleId)
      : [...preferredStyleIds, styleId];
    savePreferredStyles(nextIds);
  };

  const handleSelectAllStyles = () => {
    const allIds = availableTemplates.map(t => t.id);
    savePreferredStyles(allIds);
  };

  const handleDeselectAllStyles = () => {
    savePreferredStyles([]);
  };

  const savePreferredStyles = async (newIds: string[]) => {
    setPreferredStyleIds(newIds);
    const uid = auth.currentUser?.uid;
    const profileId = activeProfile?.id || "default";
    try {
      localStorage.setItem(`preferred_style_ids_${profileId}`, JSON.stringify(newIds));
    } catch (_) {}

    if (uid) {
      setSavingPreferences(true);
      try {
        await setDoc(doc(db, "users", uid, "preferences", `styles_${profileId}`), {
          styleIds: newIds,
          updatedAt: new Date(),
        }, { merge: true });
      } catch (err) {
        console.error("Error saving preferred styles:", err);
      } finally {
        setSavingPreferences(false);
      }
    }
  };

  const activeDisplayTemplates = availableTemplates.filter(t => preferredStyleIds.includes(t.id));

  // RENDER SECCIÓN 1: PARÁMETROS (COLUMNA IZQUIERDA)
  if (renderSection === 'parameters') {
    return (
      <div className="premium-card space-y-6">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Modo de Creación</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button
                type="button"
                onClick={() => setCreationMode('ai')}
                className={`py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  creationMode === 'ai'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-550 hover:text-slate-800'
                }`}
              >
                🤖 Generar con IA
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('manual')}
                className={`py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  creationMode === 'manual'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-550 hover:text-slate-800'
                }`}
              >
                📥 Subida Manual
              </button>
            </div>
          </div>

        {/* REDES DE DESTINO */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Redes de Destino</label>
          {needsConnection ? (
            <div className="p-4 bg-amber-50 border border-amber-250/60 rounded-2xl text-xs text-amber-800 font-semibold leading-relaxed">
              ⚠️ No tienes cuentas vinculadas. Ve a la sección de <Link href="/automatizacion-rrss/panel/configuracion" className="underline font-bold text-amber-900 hover:text-amber-950">Conexiones</Link> para enlazar tus redes.
            </div>
          ) : (
            <div className="flex gap-3">
              {hasFb && (
                <button
                  type="button"
                  onClick={() => setNetworks({ ...networks, facebook: !networks.facebook })}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${
                    networks.facebook ? 'bg-[#1877F2] text-white scale-105 shadow-md shadow-blue-500/20' : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-650'
                  }`}
                >
                  <FaFacebookF />
                </button>
              )}
              {hasIg && (
                <button
                  type="button"
                  onClick={() => setNetworks({ ...networks, instagram: !networks.instagram })}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${
                    networks.instagram ? 'text-white scale-105 shadow-md shadow-pink-500/20' : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-650'
                  }`}
                  style={networks.instagram ? { background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' } : {}}
                >
                  <FaInstagram className="text-2xl" />
                </button>
              )}
              {/* LinkedIn */}
              {hasLi && (
                (() => {
                  const allowed = isAdmin || isPlatformAllowed(userPlan, 'linkedin');
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (!allowed) {
                          window.open(
                            `https://wa.me/56965909543?text=${encodeURIComponent(
                              "Hola Santisoft! Quiero activar LinkedIn en mis publicaciones. ¿Cómo puedo subir al Plan Crecimiento?"
                            )}`,
                            "_blank"
                          );
                          return;
                        }
                        setNetworks({ ...networks, linkedin: !networks.linkedin });
                      }}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all relative ${
                        !allowed
                          ? 'bg-slate-100 text-slate-400 border border-dashed border-slate-300 opacity-60 cursor-pointer'
                          : networks.linkedin
                          ? 'bg-[#0077b5] text-white scale-105 shadow-md shadow-[#0077b5]/20'
                          : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-650'
                      }`}
                      title={!allowed ? "LinkedIn: Disponible en Plan PyME Crecimiento (Click para activar)" : "LinkedIn"}
                    >
                      <FaLinkedinIn />
                      {!allowed && (
                        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-900 text-[8px] font-black px-1 rounded-full shadow-sm">
                          🔒
                        </span>
                      )}
                    </button>
                  );
                })()
              )}

              {/* TikTok */}
              {hasTt && (
                (() => {
                  const allowed = isAdmin || isPlatformAllowed(userPlan, 'tiktok');
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (!allowed) {
                          window.open(
                            `https://wa.me/56965909543?text=${encodeURIComponent(
                              "Hola Santisoft! Quiero activar TikTok en mis publicaciones. ¿Cómo puedo subir al Plan Crecimiento?"
                            )}`,
                            "_blank"
                          );
                          return;
                        }
                        setNetworks({ ...networks, tiktok: !networks.tiktok });
                      }}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all relative ${
                        !allowed
                          ? 'bg-slate-100 text-slate-400 border border-dashed border-slate-300 opacity-60 cursor-pointer'
                          : networks.tiktok
                          ? 'bg-black text-white scale-105 shadow-md shadow-black/20'
                          : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-650'
                      }`}
                      title={!allowed ? "TikTok: Disponible en Plan PyME Crecimiento (Click para activar)" : "TikTok"}
                    >
                      <FaTiktok />
                      {!allowed && (
                        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-900 text-[8px] font-black px-1 rounded-full shadow-sm">
                          🔒
                        </span>
                      )}
                    </button>
                  );
                })()
              )}
              {hasGbp && (
                <button
                  type="button"
                  onClick={() => setNetworks({ ...networks, googleBusiness: !networks.googleBusiness })}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${
                    networks.googleBusiness ? 'bg-[#EA4335] text-white scale-105 shadow-md shadow-[#EA4335]/20' : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-650'
                  }`}
                  title="Google Business Profile"
                >
                  <FaGoogle />
                </button>
              )}
              {hasYt && (
                <button
                  type="button"
                  onClick={() => setNetworks({ ...networks, youtube: !networks.youtube })}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${
                    networks.youtube ? 'bg-[#FF0000] text-white scale-105 shadow-md shadow-red-500/20' : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-650'
                  }`}
                  title="YouTube Shorts"
                >
                  <FaYoutube />
                </button>
              )}
              {hasX && (
                <button
                  type="button"
                  onClick={() => setNetworks({ ...networks, x: !networks.x })}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${
                    networks.x ? 'bg-black text-white scale-105 shadow-md shadow-black/20' : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-650'
                  }`}
                  title="X (Twitter)"
                >
                  <FaTwitter />
                </button>
              )}
            </div>
          )}
        </div>

        {/* TU RUBRO O TIPO DE NEGOCIO */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tu Rubro o Tipo de Negocio</label>
          <div className="relative">
            <input 
              type="text" 
              value={businessType} 
              onChange={e => setBusinessType(e.target.value)}
              placeholder="Ej: Gastrobar, Tienda de Mascotas..."
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none text-xs font-bold text-slate-700 focus:border-indigo-400"
            />
            <div className="absolute right-2.5 bottom-2.5">
              <VoiceMic 
                onResult={(text) => setBusinessType(businessType + (businessType ? " " : "") + text)} 
                className="scale-90"
              />
            </div>
          </div>
        </div>

        {/* TIPO DE PUBLICACIÓN */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Tipo de Publicación</label>
          <div className="grid grid-cols-4 gap-2">
            {['Post', 'Historia', 'Carrusel', 'Reel'].map(type => {
              const isReelDisabledByPlan = type === 'Reel' && !allowVideo;
              const disabled = (networks.tiktok && type !== 'Reel') || isReelDisabledByPlan;
              return (
                <button 
                  key={type}
                  type="button"
                  disabled={disabled}
                  title={isReelDisabledByPlan ? "Tu plan actual no incluye cuota de Reels/Video. Mejora tu plan para desbloquearlo." : ""}
                  onClick={() => setPostType(type)}
                  className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all relative ${
                    disabled ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' :
                    postType === type 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{type === 'Post' ? '🖼️' : type === 'Historia' ? '📱' : type === 'Carrusel' ? '📑' : '🎬'}</span>
                  <span className="text-[9px] font-bold uppercase flex items-center gap-1">
                    {type}
                    {isReelDisabledByPlan && <span className="text-[10px]">🔒</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CAROUSEL COUNT */}
        {postType === 'Carrusel' && (
          <div className="animate-in slide-in-from-top-3 pt-2">
             <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">📑 Cantidad de imágenes</label>
             <div className="flex items-center gap-3 bg-indigo-50/50 p-3 border border-indigo-150 rounded-xl w-fit">
                <input 
                   type="range" 
                   min="2" max="5" 
                   value={carouselCount} 
                   onChange={(e) => setCarouselCount(parseInt(e.target.value))}
                   className="w-24 accent-indigo-600"
                />
                <span className="text-xs font-black text-indigo-700">{carouselCount}</span>
             </div>
          </div>
        )}

        {/* ENLACE A LA WEB */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                <span>🌐</span> Enlace Web de la Publicación
              </label>
              <p className="text-[10px] text-slate-400 font-medium">
                {attachWebsiteLink ? "Adjuntando enlace directo a tu web" : "Sin enlace web adjunto"}
              </p>
            </div>
            {setAttachWebsiteLink && (
              <button
                type="button"
                onClick={() => setAttachWebsiteLink(!attachWebsiteLink)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                  attachWebsiteLink ? "bg-indigo-600" : "bg-slate-300"
                }`}
                title={attachWebsiteLink ? "Desactivar enlace" : "Activar enlace"}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    attachWebsiteLink ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            )}
          </div>

          {attachWebsiteLink && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <input
                type="text"
                value={websiteUrl || ""}
                onChange={(e) => setWebsiteUrl?.(e.target.value)}
                placeholder="https://tu-sitio-web.com"
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl outline-none text-xs font-bold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              />
              <div className="flex flex-col gap-1 text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span><strong>Facebook:</strong> Enlace cliqueable directo en el post</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  <span><strong>Instagram:</strong> Llamada a la acción al enlace de tu perfil (Bio)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TIKTOK DIRECT POST SETTINGS */}
        {networks.tiktok && tiktokSettings && setTiktokSettings && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
            <TikTokPostSettings
              settings={tiktokSettings}
              onChange={setTiktokSettings}
              isDefaultConfig={false}
            />
          </div>
        )}
      </div>
    );
  }

  // RENDER SECCIÓN 2: CONTENIDO (COLUMNA DERECHA)
  if (renderSection === 'content') {
    return (
      <div className="premium-card space-y-6">
        {creationMode === 'ai' ? (
          <div className="space-y-5">
            {/* CAMPO 1: ¿QUÉ IMAGEN QUIERES GENERAR? */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  💡 ¿Qué imagen quieres generar?
                </label>
                <VoiceMic
                  onResult={(text) => setImageExpectation(imageExpectation + (imageExpectation ? " " : "") + text)}
                  className="scale-90"
                />
              </div>
              <textarea
                value={imageExpectation}
                onChange={e => setImageExpectation(e.target.value)}
                placeholder="Describe el estilo y elementos de la imagen que necesitas..."
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none text-xs font-semibold text-slate-700 resize-none min-h-[90px] focus:border-indigo-400"
              />

              {/* IMAGE STYLES SELECTOR */}
              <div className="mt-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <span>🎨</span> Mis Estilos Frecuentes ({activeDisplayTemplates.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPreferredModal(true)}
                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 border border-indigo-200/50"
                  >
                    ⚙️ Personalizar mis estilos
                  </button>
                </div>

                {activeDisplayTemplates.length === 0 ? (
                  <div className="py-3 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                    <p className="text-[10px] text-slate-500 font-medium">No has marcado ningún estilo frecuente.</p>
                    <button
                      type="button"
                      onClick={() => setShowPreferredModal(true)}
                      className="text-[10px] text-indigo-600 font-bold hover:underline mt-0.5 inline-block"
                    >
                      Haz clic aquí para seleccionar los estilos que más usas →
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {activeDisplayTemplates.map((template) => {
                      const isSelectedForPost = selectedPromptTemplate?.id === template.id || imageStyle === template.prompt;
                      return (
                        <div key={template.id} className="relative group/stylepill">
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelectedForPost) {
                                setSelectedPromptTemplate?.(null);
                                if (setImageStyle) setImageStyle("");
                              } else {
                                setSelectedPromptTemplate?.(template);
                                if (setImageStyle) setImageStyle(template.prompt);
                              }
                            }}
                            className={`text-[9px] font-bold px-2.5 py-1 rounded-full transition-colors border flex items-center gap-1 ${
                              isSelectedForPost
                                ? "bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-600/20"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                            }`}
                          >
                            {template.title}
                          </button>

                          {/* Hover Preview Thumbnail (Tamaño pequeño - Imagen EXACTA de Prompts IA) */}
                          {template.previewUrl && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/stylepill:flex flex-col items-center pointer-events-none z-40 animate-in fade-in zoom-in-95 duration-150">
                              <div className="bg-slate-900/95 text-white p-1.5 rounded-xl shadow-xl border border-slate-700/60 backdrop-blur-md flex flex-col items-center w-28">
                                <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-800 relative">
                                  <img
                                    src={template.previewUrl}
                                    alt={template.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                                <span className="text-[9px] font-bold text-slate-200 mt-1 text-center truncate w-full px-1">
                                  {template.title}
                                </span>
                              </div>
                              {/* Arrow indicator */}
                              <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700/60"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SELECTOR DE ESTILO MAESTRO DE PROMPTS IA */}
              <div className="mt-3 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-pink-50/40 p-3.5 rounded-2xl border border-indigo-150 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">✨</span>
                    <label className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">
                      Estilo Maestro de Prompts IA
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPromptPicker(true)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-850 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition-all shadow-xs flex items-center gap-1"
                  >
                    {selectedPromptTemplate ? "Cambiar estilo" : "Explorar biblioteca →"}
                  </button>
                </div>

                {selectedPromptTemplate ? (
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-indigo-200 shadow-xs">
                    <img
                      src={selectedPromptTemplate.previewUrl}
                      alt={selectedPromptTemplate.title}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">
                          {selectedPromptTemplate.category}
                        </span>
                        {selectedPromptTemplate.isCommercialPoster && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                            Cartel Comercial
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-black text-slate-800 truncate mt-0.5">
                        {selectedPromptTemplate.title}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">
                        {selectedPromptTemplate.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPromptTemplate?.(null)}
                      className="text-slate-400 hover:text-red-500 p-1.5 transition-colors font-bold text-xs"
                      title="Quitar estilo"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Aplica una dirección artística probada (Explosión, 3D, Minimalista, Food Poster, etc.) a tu {postType === 'Reel' ? 'portada y animación de video' : postType === 'Carrusel' ? 'carrusel de imágenes' : 'imagen'}.
                  </p>
                )}

                {postType === 'Reel' && selectedPromptTemplate && (
                  <p className="mt-2 text-[10px] font-semibold text-purple-700 bg-purple-100/70 p-2 rounded-lg border border-purple-200">
                    🎬 <b>Modo Video:</b> Este estilo se aplicará tanto a la foto de portada como a las directrices de animación e iluminación del video.
                  </p>
                )}
              </div>

              {posterConfig?.enabled && (
                <p className="mt-2 text-[10px] font-semibold text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  ⚠️ <b>Nota:</b> Como activaste el modo Cartel Publicitario, usa este campo solo para describir la <b>escena o el fondo de la imagen</b> (colores, objetos, estilo). El texto exacto que llevará la imagen lo defines en la configuración del cartel (arriba).
                </p>
              )}
            </div>

            {/* CAMPO 2: TEXTO DE LA PUBLICACIÓN (BOTÓN MEJORAR CON IA AL LADO DEL TEXTO) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  ✍️ Texto de la publicación
                </label>
                <button
                  type="button"
                  onClick={handleImproveWithAI}
                  disabled={improveLoading}
                  className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider disabled:bg-slate-100 disabled:text-slate-400 transition-all hover:bg-indigo-100/50 shadow-sm"
                >
                  {improveLoading ? 'Creando...' : '✨ Mejorar con IA'}
                </button>
              </div>

              <div className={`border rounded-xl bg-slate-50/50 overflow-hidden flex flex-col focus-within:border-indigo-400 ${
                isOverLimit ? 'border-rose-300' : 'border-slate-200'
              }`}>
                <textarea
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  placeholder="El copy que acompañará tu post..."
                  className={`w-full bg-transparent px-4 py-3 text-sm outline-none resize-none min-h-[110px] font-semibold leading-normal ${
                    isOverLimit ? 'text-rose-600' : 'text-slate-700'
                  }`}
                  maxLength={maxChars + 500}
                />
                <div className="px-4 py-2 bg-white/50 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <VoiceMic
                    onResult={(text) => setPostText(postText + (postText ? " " : "") + text)}
                    className="scale-75"
                  />
                  <span className={isOverLimit ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                    {postText.length} / {maxChars}
                  </span>
                </div>
              </div>

              {/* BOTONES DE GENERACIÓN */}
              <div className="flex gap-2.5 justify-end pt-1">
                {creationMode === 'ai' && (postType === 'Reel' || networks.tiktok) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const url = new URL(window.location.origin + '/automatizacion-rrss/panel/poc-video');
                        if (idea) url.searchParams.set('idea', idea);
                        window.location.href = url.toString();
                      }}
                      disabled={previewLoading || (!imageExpectation.trim() && !idea.trim() && !postText.trim())}
                      className="bg-sky-500 text-white text-[11px] font-black px-5 py-2.5 rounded-xl uppercase tracking-wider disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all flex items-center gap-2 justify-center min-w-[140px] min-h-[36px]"
                    >
                      ⚡ Video Básico
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGeneratePreview()}
                      disabled={previewLoading || (!imageExpectation.trim() && !idea.trim() && !postText.trim())}
                      className="bg-indigo-600 text-white text-[11px] font-black px-5 py-2.5 rounded-xl uppercase tracking-wider disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 justify-center min-w-[140px] min-h-[36px]"
                    >
                      {previewLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Procesando...</span>
                        </>
                      ) : (
                        '🎬 Video Premium'
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleGeneratePreview()}
                    disabled={previewLoading || (!imageExpectation.trim() && !idea.trim() && !postText.trim())}
                    className="bg-indigo-600 text-white text-[11px] font-black px-5 py-2.5 rounded-xl uppercase tracking-wider disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 justify-center min-w-[130px] min-h-[36px]"
                  >
                    {previewLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      '🖼️ Previsualizar'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* MANUAL MODE */}
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                ✍️ Texto de la publicación (Caption)
              </label>
              <button
                type="button"
                onClick={handleImproveWithAI}
                disabled={improveLoading || !manualCaption}
                className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-wider disabled:bg-slate-100 disabled:text-slate-400 transition-all hover:bg-indigo-100/50 shadow-sm"
              >
                {improveLoading ? 'Mejorando...' : '✨ Mejorar con IA'}
              </button>
            </div>
            <textarea
              value={manualCaption}
              onChange={e => setManualCaption(e.target.value)}
              placeholder="Escribe el texto que acompañará tu post..."
              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none text-xs font-semibold text-slate-700 resize-none min-h-[110px] focus:border-indigo-400"
            />
            {/* GALERÍA MANUAL */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Galería</label>
              <div className="grid grid-cols-5 gap-2">
                <label className="flex flex-col items-center justify-center bg-white border border-dashed border-indigo-200 hover:bg-indigo-50 rounded-xl cursor-pointer aspect-square text-indigo-500 shadow-inner transition-colors">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0] && onUploadNewTemplate) {
                        onUploadNewTemplate(e.target.files[0]);
                      }
                    }}
                    className="hidden" 
                  />
                  <span className="text-xl">➕</span>
                  <span className="text-[9px] font-bold mt-1 text-center leading-tight">SUBIR</span>
                </label>

                <Link
                  href="/automatizacion-rrss/panel/biblioteca"
                  className="flex flex-col items-center justify-center bg-white border border-dashed border-indigo-200 hover:bg-indigo-50 rounded-xl aspect-square text-indigo-500 shadow-inner transition-colors"
                >
                  <span className="text-xl">🖼️</span>
                  <span className="text-[9px] font-bold mt-1 text-center leading-tight">DESDE<br/>BIBLIOTECA</span>
                </Link>

                {loadingTemplates ? (
                   <div className="col-span-3 flex items-center justify-center text-xs text-slate-400 font-bold">Cargando galería...</div>
                ) : (
                   manualTemplates.slice(0, 3).map((tmpl) => {
                      const isSelected = selectedTemplate?.id === tmpl.id;
                      const isVid = tmpl.type === 'video';
                      return (
                         <div key={tmpl.id} className="relative group aspect-square rounded-xl overflow-hidden border">
                            <button
                              type="button"
                              onClick={() => setSelectedTemplate(tmpl)}
                              className="w-full h-full text-left"
                            >
                               {isVid ? (
                                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-xs relative">
                                     <span>🎬 Video</span>
                                     {isSelected && <div className="absolute inset-0 bg-indigo-500/20 border-2 border-indigo-500 rounded-xl"></div>}
                                  </div>
                               ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img 
                                    src={tmpl.url} 
                                    alt="User template" 
                                    className={`w-full h-full object-cover transition-all ${isSelected ? 'border-2 border-indigo-500 scale-95' : 'hover:scale-105'}`} 
                                  />
                               )}
                            </button>
                            {onDeleteTemplate && (
                              <button
                                type="button"
                                onClick={() => onDeleteTemplate(tmpl)}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ✕
                              </button>
                            )}
                         </div>
                      );
                   })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Selector de Estilos de Prompts IA */}
        <PromptStylePickerModal
          isOpen={showPromptPicker}
          onClose={() => setShowPromptPicker(false)}
          selectedTemplate={selectedPromptTemplate || null}
          onSelectTemplate={(template) => {
            setSelectedPromptTemplate?.(template);
          }}
        />

        {/* Modal para Personalizar Estilos Frecuentes con Checkboxes */}
        <PreferredStylesModal
          isOpen={showPreferredModal}
          onClose={() => setShowPreferredModal(false)}
          availableStyles={availableTemplates}
          selectedStyles={preferredStyleIds}
          onToggleStyle={handleTogglePreferredStyle}
          onSelectAll={handleSelectAllStyles}
          onDeselectAll={handleDeselectAllStyles}
          saving={savingPreferences}
        />
      </div>
    );
  }

  // RENDER FALLBACK: COMPLETO (Si no se especifica renderSection)
  return null;
}
