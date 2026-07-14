"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "../../../../lib/firebase";
import { collection, addDoc, getDoc, doc, query, where, getDocs, orderBy, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProfile } from "../../../../contexts/ProfileContext";
import { getQuotaUsage, getPlanLimit, getVideoPlanLimit } from "../../../../lib/quota";
import { fetchSocialRules, getCombinedConstraints, SocialRules, DEFAULT_SOCIAL_RULES } from "../../../../lib/socialRules";
import { type PosterConfig, DEFAULT_POSTER_CONFIG, buildPosterPromptSuffix } from "../../../../types/poster";

import PostConfigForm from "../../../../components/crear/PostConfigForm";
import CarouselWizard, { CarouselSlide } from "../../../../components/crear/CarouselWizard";
import CanvasEditor from "../../../../components/crear/CanvasEditor";
import StatusModal from "../../../../components/StatusModal";
import AIOptionsModal from "../../../../components/crear/AIOptionsModal";



export interface UserTemplate { id: string; url: string; type?: 'image' | 'video'; createdAt: Date; }

export default function RrssCreatePost() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [hasFb, setHasFb] = useState(false);
  const [hasIg, setHasIg] = useState(false);
  const [hasLi, setHasLi] = useState(false);
  const [hasTt, setHasTt] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Manual Template States
  const [manualTemplates, setManualTemplates] = useState<UserTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<UserTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Form states
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');
  const [manualFiles, setManualFiles] = useState<File[]>([]);
  const [manualCaption, setManualCaption] = useState("");
  const [idea, setIdea] = useState("");
  const [imageExpectation, setImageExpectation] = useState("");
  /** Texto/copy explícito que el usuario escribe o genera con IA */
  const [postText, setPostText] = useState("");
  /** Configuración del cartel publicitario (opcional) */
  const [posterConfig, setPosterConfig] = useState<PosterConfig>(DEFAULT_POSTER_CONFIG);
  const [postType, setPostType] = useState("Post");
  const [carouselCount, setCarouselCount] = useState(3);
  const [businessType, setBusinessType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [networks, setNetworks] = useState({ facebook: true, instagram: true, linkedin: true, tiktok: true });

  // Wizard state
  const [previewSlides, setPreviewSlides] = useState<CarouselSlide[]>([]);
  const [userLogo, setUserLogo] = useState("");

  const [previewLoading, setPreviewLoading] = useState(false);
  const [improveLoading, setImproveLoading] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [pendingPrompts, setPendingPrompts] = useState<any>(null);

  const [userPlan, setUserPlan] = useState("free");
  const [postsThisMonth, setPostsThisMonth] = useState(0);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [videoLimit, setVideoLimit] = useState(0);
  const [showScheduler, setShowScheduler] = useState(false);

  const [aiOptions, setAiOptions] = useState<string[]>([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [voiceoverScript, setVoiceoverScript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [reelVideoUploading, setReelVideoUploading] = useState(false);
  const [showReelWorkspace, setShowReelWorkspace] = useState(false);
  
  const [socialRules, setSocialRules] = useState<SocialRules>(DEFAULT_SOCIAL_RULES);
  const [constraints, setConstraints] = useState({ safeCharLimit: 2200, allowedMediaTypes: ["image", "video"], warnings: [] as string[], forcedType: "" });

  const [statusModal, setStatusModal] = useState<{

    isOpen: boolean;
    type: "success" | "error" | "info" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: ""
  });

  const { activeProfile } = useProfile();


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        try {
          // Load social rules once
          const rules = await fetchSocialRules();
          setSocialRules(rules);

          const d = await getDoc(doc(db, "users", u.uid));
          if (d.exists()) {
            const data = d.data();
            const isDefault = activeProfile?.id === 'default';
            const fbOK = !!activeProfile?.facebookToken_enc || (isDefault && !!data.facebookToken_enc);
            const igOK = !!activeProfile?.instagramToken_enc || (isDefault && !!data.instagramToken_enc);
            const liOK = !!activeProfile?.linkedinUserToken_enc || !!activeProfile?.linkedinToken_enc || (isDefault && (!!data.linkedinUserToken_enc || !!data.linkedinToken_enc));
            const ttOK = !!activeProfile?.tiktokToken_enc || (isDefault && !!data.tiktokToken_enc);
            
            setHasFb(fbOK);
            setHasIg(igOK);
            setHasLi(liOK);
            setHasTt(ttOK);
            setBusinessType(activeProfile?.rubro || (isDefault ? data.rubro : "") || "");
            setUserLogo(activeProfile?.logoUrl || (isDefault ? data.logoUrl : "") || "");
            
            setNetworks({ facebook: fbOK, instagram: igOK, linkedin: liOK, tiktok: ttOK });
            
            const plan = data.plan || "free";
            setUserPlan(plan);

            const used = await getQuotaUsage(u.uid, activeProfile?.id || 'default');
            setPostsThisMonth(used);
            
            const planLimit = await getPlanLimit(plan);
            if (used >= planLimit) {
                setQuotaExceeded(true);
            }

            const vLimit = await getVideoPlanLimit(plan);
            setVideoLimit(vLimit);

            const isAdminRole = data.role === 'admin' || u.email === 'diemoroy@gmail.com' || u.email === 'spalezcom@gmail.com' || u.email === 'santisoftai@gmail.com';
            setIsAdmin(isAdminRole);

            // Fetch User Templates
            setLoadingTemplates(true);
            try {
               const templateQ = query(
                   collection(db, "user_templates"),
                   where("userId", "==", u.uid)
               );
               const templSnap = await getDocs(templateQ);
               const templatesData: UserTemplate[] = [];
               templSnap.forEach(doc => {
                   const tData = doc.data();
                   templatesData.push({
                      id: doc.id,
                      url: tData.url,
                      type: tData.type || (tData.url.match(/\.(mp4|mov|webm|quicktime)/i) || tData.url.includes("video") ? 'video' : 'image'),
                      createdAt: tData.createdAt?.toDate() || new Date()
                   });
               });
               // Sort manually as we don't assume a composite index exists
               templatesData.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
               setManualTemplates(templatesData);
            } catch(e) {
               console.error("Error loading templates", e);
            } finally {
               setLoadingTemplates(false);
            }

          }
        } catch (e) {
          console.error(e);
        }
      }
      setLoadingInitial(false);
    });
    return () => unsub();
  }, [activeProfile?.id]);

  useEffect(() => {
    const selectedNets = Object.entries(networks).filter(([_, val]) => val).map(([key]) => key);
    const newConstraints = getCombinedConstraints(selectedNets, socialRules, postType);
    setConstraints(newConstraints);
    
    if (newConstraints.forcedType && postType !== newConstraints.forcedType) {
        setPostType(newConstraints.forcedType);
    }
  }, [networks, postType, socialRules]);

  const handleImproveWithAI = async () => {
    const currentIdea = creationMode === 'ai' ? idea : manualCaption;
    if (!currentIdea) { setError("Por favor ingresa una idea o caption base para mejorarla."); return; }
    
    setImproveLoading(true);
    setError("");
    
    try {
      // Determinamos la plataforma destino según las redes seleccionadas
      let targetPlatform = "LinkedIn";
      if (networks.tiktok) targetPlatform = "TikTok";
      else if (networks.instagram) targetPlatform = "Instagram";
      else if (networks.facebook) targetPlatform = "Facebook";

      const topicStr = `Rubro o negocio: ${businessType || "General"}. Idea/Tema: ${currentIdea}`;

      const response = await fetch('/api/ai/langgraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'generate_full',
            topic: topicStr, 
            platform: targetPlatform
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const e = new Error(errJson.error || "Error interno del servidor en LangGraph.");
        (e as Error & { detail?: string }).detail = errJson.detail;
        throw e;
      }

      const data = await response.json();
      
      if (data.data?.options && data.data.options.length > 1) {
          setAiOptions(data.data.options);
          setShowOptionsModal(true);
      } else {
          const improvedText = data.data?.finalPost || data.improvedIdea || currentIdea;
          // Actualiza el campo de texto de la publicación (postText para modo IA)
          if (creationMode === 'ai') {
              setPostText(improvedText);
              setIdea(improvedText); // Mantiene idea sincronizada para el prompt
          } else {
              setManualCaption(improvedText);
          }
      }
    } catch (err: unknown) {
      const e = err as Error & { detail?: string };
      console.error("Error en LangGraph:", e);
      const detailedError = e.message + (e.detail ? ` (${e.detail})` : "");
      setError(detailedError);
    } finally {
      setImproveLoading(false);
    }
  };

  const handleGeneratePreview = async (regenerate: boolean = false) => {
    if (!imageExpectation) { setError("Por favor describe la imagen que quieres generar."); return; }
    setPromptLoading(true);
    setError("");
    try {
      // Si hay cartel activo, enriquecer imageExpectation con los datos del cartel
      const enrichedExpectation = imageExpectation + buildPosterPromptSuffix(posterConfig);

      const response = await fetch('/api/ai/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: enrichedExpectation,
          imageExpectation: enrichedExpectation,
          businessType,
          type: postType,
          carouselCount: postType === 'Carrusel' ? carouselCount : 1,
          regenerate,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "No se pudo generar la propuesta de diseño de la IA.");
      }

      const resData = await response.json();
      setPendingPrompts(resData.data);
      setShowPromptModal(true);

    } catch (err: unknown) {
      const e = err as Error;
      console.error(e);
      setError(e.message || "No pudimos conectar con el motor de IA. Revisa tu conexión.");
    } finally {
      setPromptLoading(false);
    }
  };

  const handleConfirmPreview = async () => {
    if (!pendingPrompts) return;
    setShowPromptModal(false);
    setPreviewLoading(true);
    setError("");

    try {
      const response = await fetch('/api/ai/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: imageExpectation,
          promptEnglish: pendingPrompts.prompt_english || "",
          promptsEnglish: pendingPrompts.prompts_english || [],
          videoPrompt: pendingPrompts.video_prompt || "",
          voiceoverScript: pendingPrompts.voiceover_script || "",
          userPlan,
          businessType,
          type: postType,
          carouselCount: postType === 'Carrusel' ? carouselCount : 1,
          profileId: activeProfile?.id || 'default',
          email: activeProfile?.email || '',
          phone: activeProfile?.phone || '',
          // Campos nuevos: copy del usuario y config de cartel
          userProvidedCopy: postText.trim() || '',
          posterConfig: posterConfig.enabled ? posterConfig : null,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "No se pudo completar la generación del diseño en n8n.");
      }
      
      const data = await response.json();
      const newSlides: CarouselSlide[] = [];
      
      // Si el usuario ya escribió el copy, usarlo; de lo contrario usar el de Gemini
      const finalCopy = postText.trim() || data.suggestedCopy || imageExpectation;
      
      if (postType === 'Reel') {
          setVideoPrompt(data.videoPrompt || "");
          setVoiceoverScript(data.voiceoverScript || "");
          setAudioUrl(data.audioUrl || "");
          newSlides.push({ url: data.imageUrl || "", copy: finalCopy });
          setShowReelWorkspace(true);
      } else {
          setVideoPrompt("");
          setVoiceoverScript("");
          setAudioUrl("");
          if (data.imageUrls && Array.isArray(data.imageUrls)) {
              data.imageUrls.forEach((url: string) => {
                  newSlides.push({ url, copy: finalCopy });
              });
          } else if (data.imageUrl) {
              newSlides.push({ url: data.imageUrl, copy: finalCopy });
          }
      }

      if (newSlides.length === 0) {
          throw new Error("No se devolvieron imágenes desde n8n.");
      }

      setPreviewSlides(newSlides);
      // Actualizar postText con el copy final si el usuario no había escrito nada
      if (!postText.trim() && data.suggestedCopy) {
        setPostText(data.suggestedCopy);
      }

    } catch (err: unknown) {
      const e = err as Error;
      console.error(e);
      setError(e.message || "Error al generar la previsualización del diseño.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const updateSlideFinalUrl = (slideIndex: number, finalUrl: string) => {
      setPreviewSlides(prev => {
          const copy = [...prev];
          if (copy[slideIndex]) {
              copy[slideIndex].finalUrl = finalUrl;
          }
          return copy;
      });
  };

  const handleSaveEditedTemplate = async (finalUrl: string) => {
      try {
          const newDoc = await addDoc(collection(db, "user_templates"), {
              userId: user.uid,
              url: finalUrl,
              type: 'image',
              createdAt: new Date()
          });
          const newTmpl: UserTemplate = { id: newDoc.id, url: finalUrl, type: 'image', createdAt: new Date() };
          setManualTemplates(prev => [newTmpl, ...prev]);
          setSelectedTemplate(newTmpl);
      } catch (e) {
          console.error("Error saving manual template", e);
      }
  };

  const handleUploadNewTemplate = async (file: File) => {
      setLoadingTemplates(true);
      try {
          const ext = file.name.split('.').pop();
          const filename = `manual_post_${Date.now()}.${ext}`;
          const storageRef = ref(storage, `social_media_uploads/${user.uid}/${filename}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          
          const isVideo = file.type.startsWith('video/');
          const newDoc = await addDoc(collection(db, "user_templates"), {
              userId: user.uid,
              url: url,
              type: isVideo ? 'video' : 'image',
              createdAt: new Date()
          });
          const newTmpl: UserTemplate = { id: newDoc.id, url: url, type: isVideo ? 'video' : 'image', createdAt: new Date() };
          setManualTemplates(prev => [newTmpl, ...prev]);
          setSelectedTemplate(newTmpl);
      } catch (e) {
          console.error(e);
          setError("Error subiendo el archivo manual.");
      } finally {
          setLoadingTemplates(false);
      }
  };

  const handleDeleteTemplate = async (tmpl: UserTemplate) => {
      setLoadingTemplates(true);
      try {
          // 1. Delete from Firestore
          await deleteDoc(doc(db, "user_templates", tmpl.id));

          // 2. Delete from Storage if it's hosted in our Firebase Storage
          if (tmpl.url.includes("firebasestorage.googleapis.com")) {
              try {
                  const decodedUrl = decodeURIComponent(tmpl.url);
                  const pathStart = decodedUrl.indexOf("/o/") + 3;
                  const pathEnd = decodedUrl.indexOf("?");
                  const storagePath = decodedUrl.substring(pathStart, pathEnd > -1 ? pathEnd : undefined);
                  const fileRef = ref(storage, storagePath);
                  await deleteObject(fileRef);
              } catch (storageErr) {
                  console.warn("[Firebase Storage] No se pudo borrar el archivo binario:", storageErr);
              }
          }

          // 3. Update local states
          setManualTemplates(prev => prev.filter(t => t.id !== tmpl.id));
          if (selectedTemplate?.id === tmpl.id) {
              setSelectedTemplate(null);
          }
      } catch (e: any) {
          console.error("Error al borrar el template:", e);
          setError("No se pudo eliminar el archivo de la galería.");
      } finally {
          setLoadingTemplates(false);
      }
  };

  const handleSubmit = async (e?: React.FormEvent, publishNow: boolean = false) => {
    if (e) e.preventDefault();
    if (creationMode === 'ai' && !idea) { setError("Por favor ingresa una idea para tu publicación."); return; }
    if (creationMode === 'manual' && (!selectedTemplate && manualFiles.length === 0)) { setError("Selecciona o sube un archivo (imagen o video) manual primero."); return; }
    if (!publishNow && (!date || !time)) { setError("Selecciona fecha y hora para agendar."); return; }
    
    const nets: string[] = [];
    if (networks.facebook && hasFb) nets.push('facebook');
    if (networks.instagram && hasIg) nets.push('instagram');
    if (networks.linkedin && hasLi) nets.push('linkedin');
    if (networks.tiktok && hasTt) nets.push('tiktok');

    if (nets.length === 0 && (hasFb || hasIg || hasLi || hasTt)) { 
        setError("Selecciona al menos una red social destino."); 
        return; 
    }

    // Business Rules Validation
    const currentText = creationMode === 'ai' ? idea : manualCaption;
    if (currentText.length > constraints.safeCharLimit) {
        setError(`El texto es demasiado largo para las redes seleccionadas (Máx: ${constraints.safeCharLimit} caracteres).`);
        return;
    }

    if (creationMode === 'manual') {
        const isVideo = selectedTemplate?.type === 'video' || (manualFiles[0]?.type.startsWith('video/'));
        if (isVideo && !constraints.allowedMediaTypes.includes('video')) {
            setError("Una de las redes seleccionadas no acepta video en este formato.");
            return;
        }
        if (!isVideo && !constraints.allowedMediaTypes.includes('image')) {
            setError("Una de las redes seleccionadas (ej: TikTok) requiere que el contenido sea un video.");
            return;
        }
    }

    setLoading(true);
    setError("");

    try {
      let scheduledDate = new Date();
      if (!publishNow) {
          scheduledDate = new Date(`${date}T${time}:00`);
          if (scheduledDate < new Date()) {
              setError("La fecha agendada debe ser en el futuro.");
              setLoading(false);
              return;
          }
      } else {
          // Si es para ahora, usamos el tiempo actual
          scheduledDate = new Date();
      }

      let finalUrls: string[] = [];

      if (creationMode === 'manual') {
          if (selectedTemplate) {
              finalUrls.push(selectedTemplate.url);
          } else {
              for (let i = 0; i < manualFiles.length; i++) {
                  const file = manualFiles[i];
                  const ext = file.name.split('.').pop();
                  const filename = `manual_post_${Date.now()}_${i}.${ext}`;
                  const storageRef = ref(storage, `social_media_uploads/${user.uid}/${filename}`);
                  await uploadBytes(storageRef, file);
                  const url = await getDownloadURL(storageRef);
                  finalUrls.push(url);
              }
          }
      } else {
          finalUrls = previewSlides.map(slide => slide.finalUrl || slide.url);
      }

      const postPayload: any = {
        userId: user.uid,
        profileId: activeProfile?.id || 'default',
        idea: creationMode === 'manual' ? 'Subida manual: ' + manualCaption.slice(0, 50) : idea,
        type: postType,
        carouselCount: postType === 'Carrusel' ? carouselCount : 1,
        businessType,
        scheduledFor: scheduledDate,
        networks: nets,
        status: publishNow ? 'publishing' : 'pending',
        createdAt: new Date(),
        copy: creationMode === 'manual' ? manualCaption : (previewSlides[0]?.copy || idea),
        generatedBy: creationMode === 'manual' ? 'manual' : 'ai'
      };

      if (finalUrls.length > 0) {
          postPayload.imageUrl = finalUrls[0];
          if (finalUrls.length > 1) {
              postPayload.imageUrls = finalUrls;
          }
      } else {
          postPayload.imageUrl = "";
      }

      const newPostRef = await addDoc(collection(db, "social_posts"), postPayload);
      
      if (publishNow) {
          // Publicar de inmediato llamando a la API
          try {
              const pubRes = await fetch('/api/publish-now', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ postId: newPostRef.id })
              });
              const pubData = await pubRes.json();
              
              if (!pubRes.ok || pubData.error) {
                  throw new Error(pubData.error || "Error al publicar en las redes sociales.");
              }
              
              // Si todo salió bien, informamos al usuario
              if (pubData.status === 'publishing') {
                  setStatusModal({
                    isOpen: true,
                    type: "success",
                    title: "Publicando...",
                    message: "Tu contenido se está publicando en segundo plano. El bot actualizará el estado en unos segundos.",
                    onConfirm: () => router.push("/automatizacion-rrss/panel")
                  });
              } else {
                  setStatusModal({
                    isOpen: true,
                    type: "success",
                    title: "¡Publicado!",
                    message: `Tu contenido ya está en el aire en: ${pubData.published.join(', ')}.`,
                    onConfirm: () => router.push("/automatizacion-rrss/panel")
                  });
              }
          } catch (pubErr: any) {
              console.error("Error en publicación inmediata:", pubErr);
              setStatusModal({
                isOpen: true,
                type: "error",
                title: "Error al Publicar",
                message: pubErr.message || "No pudimos conectar con las redes sociales ahora mismo."
              });
              setLoading(false);
          }

      } else {
          // Solo agendar (Cloud Tasks)
          try {
              const idToken = await auth.currentUser?.getIdToken();
              await fetch('/api/tasks/schedule', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${idToken}`
                  },
                  body: JSON.stringify({
                      postId: newPostRef.id,
                      scheduledFor: scheduledDate.toISOString()
                  })
              });
          } catch (scheduleErr) {
              console.error("Warning: Could not schedule GCP task", scheduleErr);
          }
          router.push("/automatizacion-rrss/panel");
      }

    } catch (err) {
      console.error(err);
      setError("Error procesando el post. Intenta nuevamente.");
      setLoading(false);
    }
  };


  const hasText = creationMode === 'ai' ? idea.trim().length > 0 : manualCaption.trim().length > 0;
  const isReel = postType === 'Reel';
  const hasReelVideo = isReel 
    ? (creationMode === 'ai' 
        ? (previewSlides[0]?.url?.match(/\.(mp4|mov|webm|quicktime)/i) || previewSlides[0]?.url?.includes('video')) 
        : !!selectedTemplate) 
    : true;
  const hasMedia = (creationMode === 'manual' && !!selectedTemplate) || (creationMode === 'ai' && previewSlides.length > 0 && hasReelVideo);
  const isReady = hasText && hasMedia;

  if (loadingInitial) return <div className="animate-pulse space-y-4 max-w-2xl"><div className="h-10 bg-slate-200 rounded w-1/3"></div><div className="h-64 bg-slate-200 rounded"></div></div>;
  const needsConnection = !hasFb && !hasIg && !hasLi && !hasTt;
  const isPreviewVisible = (creationMode === 'manual' && !!selectedTemplate) || (creationMode === 'ai' && previewSlides.length > 0);

  return (
    <div className="max-w-[1400px] mx-auto lg:mx-0">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Nueva Publicación</h1>
        <p className="text-slate-500 mt-3 font-medium text-lg">Danos una idea y el bot se encarga del diseño (IA) y la publicación.</p>
      </div>

      {quotaExceeded && (
        <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-200 rounded-[28px] animate-in slide-in-from-top-4 shadow-sm flex items-start gap-4">
           <div className="text-3xl">⚠️</div>
           <div>
              <h3 className="text-rose-900 font-black tracking-tight">Límite Mensual Alcanzado ({postsThisMonth} Publicaciones)</h3>
              <p className="text-rose-700/80 font-medium text-sm mt-1">Has consumido todas tus publicaciones automáticas del mes. Podrás guardar esta nueva idea como <b>Borrador</b>, pero el bot no la publicará hasta tu próximo ciclo mensual o hasta que <Link href="/automatizacion-rrss/panel/planes" className="underline font-bold text-rose-600 hover:text-rose-800">mejores tu plan actual</Link>.</p>
           </div>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-8 max-w-2xl w-full">
            <PostConfigForm 
              idea={idea} setIdea={setIdea}
              imageExpectation={imageExpectation} setImageExpectation={setImageExpectation}
              postText={postText} setPostText={setPostText}
              posterConfig={posterConfig} setPosterConfig={setPosterConfig}
              activeProfileLogoUrl={activeProfile?.logoUrl || ''}
              activeProfileName={activeProfile?.name || ''}
              activeProfilePhone={activeProfile?.phone || ''}
              activeProfileEmail={activeProfile?.email || ''}
              postType={postType} setPostType={setPostType}
              hideSubmit={true}
              carouselCount={carouselCount} setCarouselCount={setCarouselCount}
              businessType={businessType} setBusinessType={setBusinessType}
              date={date} setDate={setDate}
              time={time} setTime={setTime}
              networks={networks} setNetworks={setNetworks}
              hasFb={hasFb} hasIg={hasIg} hasLi={hasLi} hasTt={hasTt}
              needsConnection={needsConnection}
              handleImproveWithAI={handleImproveWithAI}
              handleGeneratePreview={handleGeneratePreview}
              handleSubmit={handleSubmit}
              improveLoading={improveLoading}
              previewLoading={previewLoading || promptLoading}
              loading={loading}
              error={error}
              isAdmin={isAdmin}
              allowVideo={videoLimit > 0 || isAdmin}
              creationMode={creationMode}
              setCreationMode={setCreationMode}
              manualFiles={manualFiles}
              setManualFiles={setManualFiles}
              manualCaption={manualCaption}
              setManualCaption={setManualCaption}
              manualTemplates={manualTemplates}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              loadingTemplates={loadingTemplates}
              onUploadNewTemplate={handleUploadNewTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              showScheduler={showScheduler}
              setShowScheduler={setShowScheduler}
              constraints={constraints}
            />
          </div>

          <div className="lg:col-span-5 relative">
            {creationMode === 'manual' ? (
                selectedTemplate ? (
                    <div className="lg:sticky lg:top-24 mt-8 lg:mt-0 space-y-6 animate-in fade-in duration-300">
                        {selectedTemplate.type === 'video' || selectedTemplate.url.match(/\.(mp4|mov|webm|quicktime)/i) || selectedTemplate.url.includes("video") ? (
                            <div className="p-8 bg-slate-50 rounded-[32px] border-2 border-slate-100 animate-in zoom-in duration-500 space-y-6 shadow-xl shadow-slate-200/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <span className="text-xl">🎬</span>
                                       <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Video de Publicación</h4>
                                    </div>
                                </div>
                                <div className="aspect-[9/16] max-h-[60vh] rounded-[24px] overflow-hidden bg-black border-4 border-white shadow-xl relative group mx-auto flex items-center justify-center">
                                    <video src={selectedTemplate.url} autoPlay loop muted playsInline controls className="w-full h-full object-cover animate-in fade-in" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Copy para Redes</label>
                                    <div className="p-6 bg-white rounded-2xl border border-slate-200 text-slate-600 text-sm font-medium leading-relaxed italic shadow-inner">
                                       "{manualCaption || 'Escribe el texto que acompañará tu video a la izquierda...'}"
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <CanvasEditor 
                               baseImageUrl={selectedTemplate.url}
                               suggestedCopy={manualCaption || "Previsualización manual"}
                               initialLogoUrl={userLogo}
                               userId={user?.uid}
                               onSave={handleSaveEditedTemplate}
                            />
                        )}
                        {isReady && !showScheduler ? (
                           <div className="grid grid-cols-2 gap-4">
                              <button type="button" onClick={() => handleSubmit(undefined, true)} disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black text-[14px] py-4 rounded-[20px] transition-all flex items-center justify-center gap-2">
                                 {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '⚡ Publicar Ahora'}
                              </button>
                              <button type="button" onClick={() => setShowScheduler(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[14px] py-4 rounded-[20px] transition-all flex items-center justify-center gap-2">
                                 📅 Aprobar y Agendar
                              </button>
                           </div>
                        ) : (
                           <div className="flex gap-3">
                              <button type="button" onClick={() => setShowScheduler(false)} disabled={loading} className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[14px] py-4 rounded-[20px] transition-all flex items-center justify-center">
                                 Cancelar
                              </button>
                              {isReady && (
                                 <button onClick={(e) => handleSubmit(e, false)} disabled={loading} className="w-2/3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-[15px] py-4 px-6 rounded-[20px] transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 hover:-translate-y-1">
                                    {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : '✅ Confirmar Agendamiento'}
                                 </button>
                              )}
                           </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 border-4 border-dashed border-indigo-100 rounded-[32px] text-center flex flex-col items-center justify-center min-h-[500px] text-indigo-400 bg-indigo-50/20 lg:sticky lg:top-24 mt-8 lg:mt-0 transition-all">
                      <div className="text-6xl mb-4 opacity-80">📱</div>
                      <h4 className="font-black text-lg mb-2 text-indigo-700">Galería Manual Activa</h4>
                      <p className="font-medium text-sm max-w-xs leading-relaxed mb-8">Selecciona uno de tus diseños o videos previos a la izquierda o sube uno nuevo para empezar.</p>
                      
                      <label className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-indigo-300 hover:bg-indigo-50 hover:border-indigo-500 rounded-2xl cursor-pointer group hover:scale-105 transition-all text-indigo-600 px-10 py-6 shadow-xl shadow-indigo-100/50">
                          <input 
                              type="file" 
                              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" 
                              onChange={(e) => {
                                  if (e.target.files && e.target.files[0] && handleUploadNewTemplate) {
                                      const f = e.target.files[0];
                                      const isVideo = f.type.startsWith('video/');
                                      const maxSize = isVideo ? 100 : 10;
                                      if (f.size / (1024*1024) > maxSize) {
                                          setStatusModal({
                                              isOpen: true,
                                              type: "error",
                                              title: "Archivo demasiado grande",
                                              message: isVideo ? `Video demasiado grande. Máx ${maxSize}MB` : `Imagen demasiado grande. Máx ${maxSize}MB`
                                          });
                                          return;
                                      }
                                      handleUploadNewTemplate(f);
                                  }
                              }}
                              className="hidden" 
                          />
                          <span className="text-4xl mb-2 group-hover:rotate-12 transition-transform">📸</span>
                          <span className="text-sm font-black uppercase tracking-widest text-center">Subir Foto o Video</span>
                      </label>
                    </div>
                )
            ) : previewSlides.length > 0 ? (
                postType === 'Reel' ? (
                   <div className="lg:sticky lg:top-24 mt-8 lg:mt-0 space-y-6 animate-in fade-in duration-300">
                     <div className="premium-card p-8 text-center flex flex-col items-center justify-center min-h-[450px] bg-slate-50/50 border-2 border-slate-100 rounded-[32px] shadow-sm">
                       {previewSlides[0]?.url && !previewSlides[0].url.match(/\.(mp4|mov|webm|quicktime)/i) ? (
                         <div className="aspect-[9/16] w-full max-w-[200px] rounded-2xl overflow-hidden bg-slate-100 border-4 border-white shadow-md relative mb-6">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={previewSlides[0].url} alt="Cover Reference" className="w-full h-full object-cover" />
                         </div>
                       ) : (
                         <div className="text-6xl mb-6 opacity-80">🎬</div>
                       )}
                       <h4 className="font-black text-lg mb-2 text-slate-800 uppercase tracking-tight">Reel en Producción</h4>
                       <p className="font-medium text-slate-500 text-sm max-w-xs leading-relaxed mb-6">
                         Ya hemos generado tu portada, prompt de animación y locución de audio.
                       </p>
                       <button
                         type="button"
                         onClick={() => setShowReelWorkspace(true)}
                         className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm py-4 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                       >
                         🎬 Abrir Espacio de Producción
                       </button>
                     </div>
                   </div>
                ) : (
                    <div className="lg:sticky lg:top-24 mt-8 lg:mt-0">
                     <CarouselWizard 
                        slides={previewSlides}
                        onUpdateSlide={updateSlideFinalUrl}
                        userLogo={userLogo}
                        userId={user?.uid}
                     />
                     {isReady && !showScheduler ? (
                        <div className="grid grid-cols-2 gap-4 mt-6">
                           <button type="button" onClick={() => handleSubmit(undefined, true)} disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black text-[14px] py-4 rounded-[20px] transition-all flex items-center justify-center gap-2">
                              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '⚡ Publicar Ahora'}
                           </button>
                           <button type="button" onClick={() => setShowScheduler(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[14px] py-4 rounded-[20px] transition-all flex items-center justify-center gap-2">
                              📅 Aprobar y Agendar
                           </button>
                        </div>
                     ) : (
                        <div className="flex gap-3 mt-6">
                           <button type="button" onClick={() => setShowScheduler(false)} disabled={loading} className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[14px] py-4 rounded-[20px] transition-all flex items-center justify-center">
                              Cancelar
                           </button>
                           <button onClick={(e) => handleSubmit(e, false)} disabled={loading} className="w-2/3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-[15px] py-4 px-6 rounded-[20px] transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 hover:-translate-y-1">
                              {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : '✅ Confirmar Agendamiento'}
                           </button>
                        </div>
                     )}
                   </div>
                )
            ) : previewLoading ? (
                <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[32px] text-center flex flex-col items-center justify-center min-h-[500px] text-indigo-700 lg:sticky lg:top-24 mt-8 lg:mt-0 shadow-lg shadow-indigo-100/50 animate-pulse">
                  <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                  <h4 className="font-black text-lg mb-2 uppercase tracking-widest">Generando Diseño...</h4>
                  <p className="font-medium text-sm max-w-xs leading-relaxed text-indigo-500">Estamos hablando con nuestra IA y renderizando tus imágenes. Esto puede tomar unos segundos.</p>
                </div>
            ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-[32px] text-center flex flex-col items-center justify-center min-h-[500px] text-slate-400 lg:sticky lg:top-24 mt-8 lg:mt-0 transition-all hover:bg-slate-50 hover:border-slate-300">
                  <div className="text-6xl mb-4 opacity-50">🖼️</div>
                  <h4 className="font-black text-lg mb-2 text-slate-600">Área de Visualización</h4>
                  <p className="font-medium text-sm max-w-xs leading-relaxed">Describe tu idea a la izquierda y presiona "Ver Previsualización" para ver cómo quedará tu post.</p>
                </div>
            )}
          </div>
      </div>
      <AIOptionsModal 
        isOpen={showOptionsModal}
        options={aiOptions}
        onSelect={(opt) => {
            if (creationMode === 'ai') setIdea(opt);
            else setManualCaption(opt);
            setShowOptionsModal(false);
        }}
        onRedo={() => {
            setShowOptionsModal(false);
            handleImproveWithAI();
        }}
        onClose={() => setShowOptionsModal(false)}
      />

      {/* MODAL INTERACTIVO DE CONFIRMACIÓN DE PROMPT EN ESPAÑOL */}
      {showPromptModal && pendingPrompts && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-lg p-8 md:p-10 animate-in zoom-in duration-300 space-y-6">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🎨</span>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Propuesta de la IA</h3>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">Revisión de Estilo Visual</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Esto es lo que diseñaremos para ti:</h4>
              <p className="text-slate-700 text-sm font-semibold leading-relaxed italic animate-in fade-in duration-500">
                "{pendingPrompts.prompt_spanish || pendingPrompts.prompts_spanish?.[0] || 'Una imagen creativa alineada a tus indicaciones.'}"
              </p>
              
              {postType === 'Carrusel' && pendingPrompts.prompts_spanish && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Secuencia de imágenes del carrusel:</p>
                  <ul className="list-decimal pl-4 text-xs font-medium text-slate-500 space-y-1">
                    {pendingPrompts.prompts_spanish.map((p: string, idx: number) => (
                      <li key={idx} className="line-clamp-1">{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {postType === 'Reel' && pendingPrompts.voiceover_script && (
                <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                  <p className="text-[10px] font-black uppercase text-rose-500 tracking-wider">🎙️ Guion de voz en off (Reel):</p>
                  <p className="font-semibold text-slate-600">"{pendingPrompts.voiceover_script}"</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                type="button" 
                onClick={() => setShowPromptModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all text-xs"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowPromptModal(false);
                  handleGeneratePreview(true);
                }}
                className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/50 font-bold py-4 rounded-2xl transition-all text-xs flex items-center justify-center gap-1"
              >
                🔄 Volver a Pensar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmPreview}
                className="flex-[1.4] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-3 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 hover:-translate-y-0.5 flex items-center justify-center gap-1.5 text-xs"
              >
                🚀 Confirmar y Diseñar
              </button>
            </div>
          </div>
        </div>
      )}

      <StatusModal 
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onConfirm={() => {
            if (statusModal.onConfirm) {
                statusModal.onConfirm();
            } else {
                setStatusModal(prev => ({ ...prev, isOpen: false }));
            }
        }}
      />

      {showReelWorkspace && (
        <div className="fixed inset-0 bg-white z-[150] overflow-y-auto px-6 py-12 md:p-12 flex flex-col justify-start items-center animate-in fade-in duration-300">
           {/* Header */}
           <div className="w-full max-w-5xl flex justify-between items-center mb-10 pb-6 border-b border-slate-150">
              <div>
                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Asistente de Video IA</span>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">Tu Espacio de Producción de Reel</h2>
              </div>
              <button 
                onClick={() => setShowReelWorkspace(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-black border border-slate-200 transition-colors uppercase tracking-widest"
              >
                Cerrar
              </button>
           </div>

           {/* Content Grid */}
           <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-start mb-10 text-slate-800">
              
              {/* Left column: Reference Cover & final upload */}
              <div className="lg:col-span-6 space-y-6">
                 {/* Reference image */}
                 <div className="bg-slate-50/50 border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🖼️</span>
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">1. Imagen de Portada / Referencia</h4>
                      </div>
                      {previewSlides[0]?.url && !previewSlides[0].url.match(/\.(mp4|mov|webm|quicktime)/i) && (
                        <a 
                          href={previewSlides[0].url} 
                          download="cover_reference.png" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-black uppercase bg-indigo-600 hover:bg-indigo-750 text-white px-4 py-2 rounded-xl border border-indigo-500/20 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
                        >
                          📥 Descargar Portada
                        </a>
                      )}
                    </div>
                    
                    {previewSlides[0]?.url && !previewSlides[0].url.match(/\.(mp4|mov|webm|quicktime)/i) ? (
                      <div className="aspect-[9/16] max-h-[50vh] rounded-2xl overflow-hidden bg-slate-100 border-4 border-white shadow-md relative mx-auto flex items-center justify-center">
                        <img src={previewSlides[0].url} alt="Cover Reference" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[0.5px]"></div>
                        <div className="absolute bottom-4 left-4 right-4 text-center bg-slate-900/90 backdrop-blur-md py-2.5 px-3 rounded-xl border border-white/10 text-white font-black text-[10px] uppercase tracking-wider">
                          Usa esta imagen en tu herramienta de video
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-bold italic">
                        No hay portada disponible.
                      </div>
                    )}
                 </div>

                 {/* final video upload */}
                 <div className="bg-slate-50/50 border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">4. Sube tu Video de Reel Final</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Una vez que hayas creado tu video en Runway/Luma combinando la imagen de arriba con la locución de la derecha, súbelo aquí en formato MP4.
                    </p>
                    
                    <label className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 hover:bg-slate-50 hover:border-indigo-500/50 rounded-2xl cursor-pointer group hover:scale-[1.01] transition-all text-indigo-600 py-10 px-4 shadow-sm relative">
                      {reelVideoUploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                          <span className="text-xs font-black uppercase text-indigo-600">Subiendo video a Firebase Storage...</span>
                        </div>
                      ) : (
                        <>
                          <input 
                            type="file" 
                            accept="video/mp4,video/quicktime,video/webm" 
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const f = e.target.files[0];
                                if (f.size / (1024*1024) > 100) {
                                  setStatusModal({
                                    isOpen: true,
                                    type: "error",
                                    title: "Video demasiado grande",
                                    message: "El video no puede superar los 100MB."
                                  });
                                  return;
                                }
                                setReelVideoUploading(true);
                                try {
                                  const ext = f.name.split('.').pop();
                                  const filename = `manual_post_${Date.now()}.${ext}`;
                                  const storageRef = ref(storage, `social_media_uploads/${user?.uid}/${filename}`);
                                  await uploadBytes(storageRef, f);
                                  const downloadUrl = await getDownloadURL(storageRef);
                                  
                                  // 1. Guardar el video en la base de datos de templates/galería del usuario
                                  const newDoc = await addDoc(collection(db, "user_templates"), {
                                      userId: user.uid,
                                      url: downloadUrl,
                                      type: 'video',
                                      createdAt: new Date()
                                  });
                                  const newTmpl: UserTemplate = { id: newDoc.id, url: downloadUrl, type: 'video', createdAt: new Date() };
                                  setManualTemplates(prev => [newTmpl, ...prev]);

                                  // 2. Pre-seleccionar en Modo Subida Manual
                                  setCreationMode('manual');
                                  setSelectedTemplate(newTmpl);
                                  
                                  // 3. Pre-llenar el caption con la sugerencia optimizada o la idea
                                  const finalCopy = previewSlides[0]?.copy || idea;
                                  setManualCaption(finalCopy);

                                  // 4. Cerrar workspace y avisar
                                  setShowReelWorkspace(false);
                                  setStatusModal({
                                    isOpen: true,
                                    type: "success",
                                    title: "¡Video subido y seleccionado!",
                                    message: "Tu video se ha guardado en la galería. Ahora estás en modo Subida Manual con el video seleccionado y el texto de publicación listo."
                                  });
                                } catch (uploadErr) {
                                  console.error(uploadErr);
                                  setStatusModal({
                                    isOpen: true,
                                    type: "error",
                                    title: "Error de carga",
                                    message: "Hubo un error subiendo el archivo de video."
                                  });
                                } finally {
                                  setReelVideoUploading(false);
                                }
                              }
                            }}
                            className="hidden" 
                          />
                          <span className="text-4xl mb-2 group-hover:rotate-12 transition-transform">🎥</span>
                          <span className="text-xs font-black uppercase tracking-wider text-center text-slate-600">
                            Seleccionar Video Final (.MP4)
                          </span>
                        </>
                      )}
                    </label>
                 </div>
              </div>

              {/* Right column: Prompts & Audio */}
              <div className="lg:col-span-6 space-y-6">
                 {/* Video Animation Prompt */}
                 {videoPrompt && (
                   <div className="bg-slate-50/50 border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
                     <div className="flex items-center justify-between">
                       <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">2. Prompt de Animación (Image-to-Video)</h4>
                       <button
                         type="button"
                         onClick={() => {
                           navigator.clipboard.writeText(videoPrompt);
                           setStatusModal({
                               isOpen: true,
                               type: "success",
                               title: "Copiado",
                               message: "¡Prompt copiado al portapapeles!"
                           });
                         }}
                         className="text-[10px] font-black uppercase bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-200 transition-all"
                       >
                         📋 Copiar Prompt
                       </button>
                     </div>
                     <p className="text-xs text-slate-500 font-medium leading-relaxed">
                       Copia este prompt descriptivo en inglés y pégalo en tu generador de video (junto a la imagen descargada) para generar el movimiento.
                     </p>
                     <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl font-mono text-xs select-all break-words text-slate-700 leading-relaxed">
                       {videoPrompt}
                     </div>
                     
                     <div className="pt-4 border-t border-slate-200">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Herramientas Recomendadas para Generar Video:</p>
                       <div className="grid grid-cols-2 gap-2.5">
                         <a href="https://runwayml.com/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 py-3 px-4 rounded-xl border border-slate-200 transition-colors text-center">Runway Gen-3</a>
                         <a href="https://lumalabs.ai/dream-machine" target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 py-3 px-4 rounded-xl border border-slate-200 transition-colors text-center">Luma Dream Machine</a>
                         <a href="https://klingai.com/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 py-3 px-4 rounded-xl border border-slate-200 transition-colors text-center">Kling AI</a>
                         <a href="https://pika.art/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 py-3 px-4 rounded-xl border border-slate-200 transition-colors text-center">Pika Labs</a>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Voiceover Script & Audio */}
                 {voiceoverScript && (
                   <div className="bg-slate-50/50 border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
                     <div className="flex items-center justify-between">
                       <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">3. Locución de Audio (ElevenLabs)</h4>
                       {audioUrl && (
                         <a 
                           href={audioUrl} 
                           download="voiceover.mp3" 
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-[10px] font-black uppercase bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl border border-indigo-500/20 transition-all flex items-center gap-1.5"
                         >
                           🔊 Descargar Audio (.MP3)
                         </a>
                       )}
                     </div>
                     
                     {audioUrl ? (
                       <div className="bg-slate-100 p-4 border border-slate-200 rounded-2xl flex items-center justify-center">
                         <audio src={audioUrl} controls className="w-full text-slate-800" />
                       </div>
                     ) : (
                       <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-bold italic">
                         Audio no disponible.
                       </div>
                     )}

                     <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guion de Voz en Español:</span>
                       <p className="p-5 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 font-medium italic leading-relaxed">
                         "{voiceoverScript}"
                       </p>
                     </div>
                   </div>
                 )}
              </div>

           </div>
        </div>
      )}
    </div>
  );
}

