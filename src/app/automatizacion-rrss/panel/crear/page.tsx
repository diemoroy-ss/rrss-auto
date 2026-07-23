"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "../../../../lib/firebase";
import { collection, addDoc, getDoc, doc, query, where, getDocs, orderBy, deleteDoc, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
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
import PosterSection from "../../../../components/crear/PosterSection";
import GeneratingModal, { type GeneratingStep } from "../../../../components/crear/GeneratingModal";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaGoogle } from "react-icons/fa";

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
  const [hasGbp, setHasGbp] = useState(false);
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
  const [networks, setNetworks] = useState({ facebook: true, instagram: true, linkedin: false, tiktok: true, googleBusiness: true });

  // Wizard state
  const [previewSlides, setPreviewSlides] = useState<CarouselSlide[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [voiceoverScript, setVoiceoverScript] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const [showReelWorkspace, setShowReelWorkspace] = useState(false);
  const [reelVideoUploading, setReelVideoUploading] = useState(false);

  const [showPromptModal, setShowPromptModal] = useState(false);
  const [pendingPrompts, setPendingPrompts] = useState<any>(null);
  const [editablePromptSpanish, setEditablePromptSpanish] = useState("");
  const [showFinalPostModal, setShowFinalPostModal] = useState(false);

  // ── GeneratingModal state ──────────────────────────────────────
  const [generatingOpen, setGeneratingOpen] = useState(false);
  const [generatingSteps, setGeneratingSteps] = useState<GeneratingStep[]>([]);
  const [generatingCurrentId, setGeneratingCurrentId] = useState<string | null>(null);

  const updateStep = (id: string, status: GeneratingStep["status"], sublabel?: string) => {
    setGeneratingSteps(prev =>
      prev.map(s => s.id === id ? { ...s, status, sublabel: sublabel ?? s.sublabel } : s)
    );
    if (status === "running") setGeneratingCurrentId(id);
  };

  // AI Dialog
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [aiOptions, setAiOptions] = useState<string[]>([]);
  const [improveLoading, setImproveLoading] = useState(false);

  // Status Modals
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  }>({ isOpen: false, type: "success", title: "", message: "", onConfirm: null });

  // Active business profile
  const { activeProfile } = useProfile();
  const [userLogo, setUserLogo] = useState("");

  // Plan limits & rules
  const [socialRules, setSocialRules] = useState<SocialRules>(DEFAULT_SOCIAL_RULES);
  const [postsThisMonth, setPostsThisMonth] = useState(0);
  const [postLimit, setPostLimit] = useState(5);
  const [videoLimit, setVideoLimit] = useState(0);
  const [showScheduler, setShowScheduler] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [userPlan, setUserPlan] = useState("free");

  const [constraints, setConstraints] = useState<any>({
    safeCharLimit: 1000,
    allowedMediaTypes: ["image/*"],
    warnings: [],
    forcedType: ""
  });

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
            const isValidToken = (t: any) => !!t && t !== "null" && t !== "undefined" && t !== "";
            const fbOK = isValidToken(activeProfile?.facebookToken_enc) || (isDefault && isValidToken(data.facebookToken_enc));
            const igOK = isValidToken(activeProfile?.instagramToken_enc) || (isDefault && isValidToken(data.instagramToken_enc));
            const liOK = isValidToken(activeProfile?.linkedinUserToken_enc) || isValidToken(activeProfile?.linkedinToken_enc) || (isDefault && (isValidToken(data.linkedinUserToken_enc) || isValidToken(data.linkedinToken_enc)));
            const ttOK = isValidToken(activeProfile?.tiktokToken_enc) || (isDefault && isValidToken(data.tiktokToken_enc));
            const gbpOK = isValidToken(activeProfile?.googleBusinessToken_enc) || (isDefault && isValidToken(data.googleBusinessToken_enc));
            
            setHasFb(fbOK);
            setHasIg(igOK);
            setHasLi(liOK);
            setHasTt(ttOK);
            setHasGbp(gbpOK);
            setBusinessType(activeProfile?.rubro || (isDefault ? data.rubro : "") || "");
            setUserLogo(activeProfile?.logoUrl || (isDefault ? data.logoUrl : "") || "");
            
            setNetworks({ facebook: fbOK, instagram: igOK, linkedin: false, tiktok: ttOK, googleBusiness: gbpOK });
            
            const plan = data.plan || "free";
            setUserPlan(plan);

            const used = await getQuotaUsage(u.uid, activeProfile?.id || 'default');
            setPostsThisMonth(used);
            
            const planLimit = await getPlanLimit(plan);
            setPostLimit(planLimit);
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

  const searchParams = useSearchParams();
  const templateUrlParam = searchParams.get("templateUrl");
  const hideAIParam = searchParams.get("hideAI") === "true";
  const openEditorParam = searchParams.get("openEditor") === "true";

  useEffect(() => {
    if (templateUrlParam) {
      setCreationMode('manual');
      const decodedUrl = decodeURIComponent(templateUrlParam);
      const tempTmpl: UserTemplate = {
        id: "temp-library",
        url: decodedUrl,
        type: 'image',
        createdAt: new Date()
      };
      setSelectedTemplate(tempTmpl);
      setPreviewSlides([{ url: decodedUrl, copy: "" }]);
    }
  }, [templateUrlParam, hideAIParam, openEditorParam]);

  useEffect(() => {
    // Si venimos de la biblioteca y seleccionamos "Postear" (hideAI=true pero no openEditor)
    if (!loadingInitial && hideAIParam && !openEditorParam && selectedTemplate) {
      setShowFinalPostModal(true);
    }
  }, [loadingInitial, hideAIParam, openEditorParam, selectedTemplate]);

  useEffect(() => {
    if (selectedTemplate && selectedTemplate.url && user?.uid && activeProfile) {
      const findPrompt = async () => {
        try {
          const qImg = query(
            collection(db, "generated_images"), 
            where("userId", "==", user.uid),
            where("profileId", "==", activeProfile.id || "default"),
            where("url", "==", selectedTemplate.url), 
            limit(1)
          );
          const snapImg = await getDocs(qImg);
          if (!snapImg.empty) {
            const data = snapImg.docs[0].data();
            if (data.prompt) {
              setPendingPrompts({
                prompt_english: data.prompt,
                prompt_spanish: "Imagen seleccionada de la biblioteca"
              });
              setEditablePromptSpanish(data.prompt_spanish || "Imagen seleccionada");
            }
          }
        } catch (e) {
          console.warn("Error finding prompt for selected template:", e);
        }
      };
      findPrompt();
    }
  }, [selectedTemplate, user?.uid, activeProfile]);

  useEffect(() => {
    const selectedNets = Object.entries(networks).filter(([_, val]) => val).map(([key]) => key);
    const newConstraints = getCombinedConstraints(selectedNets, socialRules, postType);
    setConstraints(newConstraints);
    
    if (newConstraints.forcedType && postType !== newConstraints.forcedType) {
        setPostType(newConstraints.forcedType);
    }
  }, [networks, postType, socialRules]);

  // AI copywriting generator
  const handleImproveWithAI = async () => {
    const textToImprove = creationMode === 'ai' ? postText : manualCaption;
    const baseIdea = creationMode === 'ai' ? idea : manualCaption;
    setImproveLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ai/copywriter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
           prompt: textToImprove,
           idea: baseIdea,
           businessType,
           postType,
           posterConfig,
           maxWords: postType === 'Historia' ? 30 : 150
        })
      });
      const data = await res.json();
      if (data.options) {
        setAiOptions(data.options);
        setShowOptionsModal(true);
      }
    } catch(err) {
      console.error(err);
      setError("No pudimos generar sugerencias con IA en este momento.");
    } finally {
      setImproveLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // FLUJO PRINCIPAL DE GENERACIÓN CON REVISIÓN INTERNA DE PROMPTS
  // ──────────────────────────────────────────────────────────────
  const handleGeneratePreview = async (forceReplan = false) => {
    const targetIdea = idea.trim() || postText.trim() || imageExpectation.trim();
    const targetExpectation = imageExpectation.trim() || postText.trim() || idea.trim();
    if (!targetIdea) return;

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_PREVIEW_URL || 'https://n8n.santisoft.cl/webhook/img-rrss-auto';
    console.log(`🚀 [PREVISUALIZAR] Iniciando flujo hacia webhook n8n: ${webhookUrl}`);

    // Definir los pasos del modal
    const isCarousel = postType === 'Carrusel';
    const initialSteps: GeneratingStep[] = [
      { id: 'generate',  label: 'Diseñando propuesta visual con IA',   icon: '🎨', status: 'pending' },
      { id: 'review1',   label: 'Revisando calidad del prompt',         icon: '🔍', status: 'pending', sublabel: 'Iteración 1/3' },
      { id: 'review2',   label: 'Optimizando prompt',                   icon: '⚡', status: 'pending', sublabel: 'Iteración 2/3' },
      { id: 'review3',   label: 'Refinamiento final',                   icon: '✨', status: 'pending', sublabel: 'Iteración 3/3' },
    ];
    setGeneratingSteps(initialSteps);
    setGeneratingOpen(true);
    setPromptLoading(true);
    setError("");

    try {
      const idToken = await auth.currentUser?.getIdToken();

      // ── PASO 1: Generar prompt base con el Director de Arte IA ──
      updateStep('generate', 'running');
      const promptRes = await fetch("/api/ai/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({
          idea: targetIdea,
          imageExpectation: targetExpectation,
          businessType,
          type: postType,
          carouselCount,
          regenerate: forceReplan
        })
      });

      if (!promptRes.ok) throw new Error("El Director de Arte IA no pudo generar una propuesta visual.");

      const promptData = await promptRes.json();
      const promptPayload = promptData.data || promptData;
      updateStep('generate', 'done');

      console.log(`📝 [PROMPT BASE GENERADO]`, promptPayload);

      // ── PASOS 2-4: Agente Revisor de Prompts (hasta 3 iteraciones) ──
      const reviewStepIds = ['review1', 'review2', 'review3'];
      let currentPrompt: string =
        promptPayload.prompt_english ||
        promptPayload.prompts_english?.[0] ||
        targetIdea;

      let reviewedPrompts = { ...promptPayload };

      for (let i = 0; i < 3; i++) {
        const stepId = reviewStepIds[i];
        const stepLabels = [
          'Revisando calidad del prompt',
          'Optimizando prompt',
          'Refinamiento final'
        ];
        updateStep(stepId, 'running', `Agente revisor — iteración ${i + 1}/3`);

        try {
          const reviewRes = await fetch("/api/ai/review-prompt", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
            body: JSON.stringify({
              prompt: currentPrompt,
              idea: targetIdea,
              imageExpectation: targetExpectation,
              businessType,
              postType,
              iteration: i + 1
            })
          });

          const reviewData = await reviewRes.json();
          console.log(`🔍 [REVISIÓN ${i + 1}] Score: ${reviewData.score}/10 | Mejora: ${reviewData.needsImprovement}`, reviewData.feedback);

          if (reviewData.needsImprovement && reviewData.improvedPrompt) {
            currentPrompt = reviewData.improvedPrompt;
            // Actualizar el payload con el prompt mejorado
            if (promptPayload.prompts_english?.length > 0) {
              reviewedPrompts = {
                ...reviewedPrompts,
                prompts_english: [reviewData.improvedPrompt, ...(promptPayload.prompts_english?.slice(1) || [])]
              };
            } else {
              reviewedPrompts = { ...reviewedPrompts, prompt_english: reviewData.improvedPrompt };
            }
            updateStep(stepId, 'done', `Mejorado — score ${reviewData.score}/10`);
          } else {
            // El prompt es suficientemente bueno, marcar como OK y saltar restantes
            updateStep(stepId, 'done', `Aprobado — score ${reviewData.score}/10`);
            // Marcar los pasos restantes como done también
            for (let j = i + 1; j < 3; j++) {
              updateStep(reviewStepIds[j], 'done', 'No requirió revisión');
            }
            break;
          }
        } catch (reviewErr) {
          console.warn(`[REVIEW ${i + 1}] Error en revisión, continuando con prompt actual:`, reviewErr);
          updateStep(stepId, 'done', 'Revisión omitida');
          break;
        }
      }

      // Cerrar el modal de generación y mostrar el modal de confirmación
      setGeneratingOpen(false);
      setGeneratingSteps([]);
      setPendingPrompts(reviewedPrompts);
      setEditablePromptSpanish(reviewedPrompts.prompt_spanish || reviewedPrompts.prompts_spanish?.[0] || "");
      setShowPromptModal(true);

    } catch (err: any) {
      setGeneratingOpen(false);
      setError(err.message || "Error al diseñar la propuesta visual con IA.");
    } finally {
      setPromptLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIRMAR: enviar al webhook n8n con modal de progreso de generación
  // ─────────────────────────────────────────────────────────────────────────
  const handleConfirmPreview = async () => {
    if (!pendingPrompts) return;
    setShowPromptModal(false);
    setError("");

    // Pasos del modal de generación de imagen
    const confirmSteps: GeneratingStep[] = [
      { id: 'prep',     label: 'Preparando prompt enriquecido',          icon: '🧪', status: 'pending' },
      { id: 'send',     label: 'Enviando flujo a n8n',                   icon: '📡', status: 'pending' },
      { id: 'generate', label: 'Generando imagen con IA',                icon: '🖼️', status: 'pending', sublabel: 'Gemini Imagen procesando...' },
      { id: 'done',     label: 'Imagen lista',                           icon: '✅', status: 'pending' },
    ];
    setGeneratingSteps(confirmSteps);
    setGeneratingOpen(true);
    setPreviewLoading(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();

      // ── PREP: Enriquecer el prompt del cartel si está habilitado ──
      updateStep('prep', 'running');
      let baseEnglishPrompt = pendingPrompts.prompt_english;

      // Si el usuario editó el prompt en español, lo traducimos antes de enviarlo
      const originalSpanish = pendingPrompts.prompt_spanish || pendingPrompts.prompts_spanish?.[0] || "";
      if (editablePromptSpanish.trim() !== originalSpanish.trim()) {
         try {
           updateStep('prep', 'running', 'Traduciendo modificaciones...');
           const transRes = await fetch("/api/ai/translate-prompt", {
             method: "POST",
             headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
             body: JSON.stringify({ prompt: editablePromptSpanish })
           });
           if (transRes.ok) {
             const transData = await transRes.json();
             baseEnglishPrompt = transData.prompt_english;
           }
         } catch (e) {
           console.warn("Fallo al traducir el prompt modificado", e);
         }
      }

      const posterPromptSuffix = posterConfig.enabled ? buildPosterPromptSuffix(posterConfig) : "";

      const promptEnglish = baseEnglishPrompt
        ? `${baseEnglishPrompt}. ${posterPromptSuffix}`.trim()
        : "";

      const promptsEnglish = pendingPrompts.prompts_english?.map((p: string) =>
        `${p}. ${posterPromptSuffix}`.trim()
      ) || [];

      const webhookUrl = process.env.NEXT_PUBLIC_N8N_PREVIEW_URL || 'https://n8n.santisoft.cl/webhook/img-rrss-auto';
      console.log(`🚀 [GENERAR IMAGEN] Gatillando webhook de n8n en: ${webhookUrl}`);
      console.log(`📝 [PROMPT FINAL ENVIADO A N8N]`, {
        promptEnglish: promptEnglish || promptsEnglish,
        idea: idea.trim(),
        imageExpectation: imageExpectation.trim(),
        postText: postText.trim(),
        businessType,
        postType,
        posterConfig: posterConfig.enabled ? posterConfig : null,
      });
      updateStep('prep', 'done');

      // ── SEND: Llamar al proxy → webhook n8n ──
      updateStep('send', 'running', `Webhook: ${webhookUrl}`);
      const res = await fetch("/api/ai/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({
          idea: idea.trim(),
          imageExpectation: imageExpectation.trim(),
          promptEnglish,
          promptsEnglish,
          videoPrompt: pendingPrompts.video_prompt || "",
          voiceoverScript: pendingPrompts.voiceover_script || "",
          businessType,
          type: postType,
          carouselCount,
          email: activeProfile?.email || "",
          phone: activeProfile?.phone || "",
          profileId: activeProfile?.id || "",
          userProvidedCopy: postText,
          posterConfig,
        })
      });
      updateStep('send', 'done');

      // ── GENERATE: Esperando respuesta de n8n con la imagen ──
      updateStep('generate', 'running', 'Procesando en el servidor de IA...');

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Fallo en la previsualización del diseño.");
      }

      const data = await res.json();
      console.log(`✅ [N8N RESPONSE]`, data);

      // Soportar tanto { imageUrl } como { status: ok, img_url: "..." }
      const resolvedImageUrl: string = data.img_url || data.imageUrl || "";
      const resolvedImageUrls: string[] = data.img_urls || data.imageUrls || (resolvedImageUrl ? [resolvedImageUrl] : []);
      const resolvedCopy: string = data.suggestedCopy || data.copy || "";

      updateStep('generate', 'done');
      updateStep('done', 'done', '¡Diseño listo!');

      // Pequeña pausa para que el usuario vea el estado final
      await new Promise(r => setTimeout(r, 800));
      setGeneratingOpen(false);
      setGeneratingSteps([]);

      // ── PERSISTENCIA: Guardar las imágenes en la Biblioteca de Firestore ──
      try {
        if (postType === 'Carrusel' && resolvedImageUrls.length > 0) {
          for (const url of resolvedImageUrls) {
            await addDoc(collection(db, "generated_images"), {
              userId: user?.uid || "anonymous",
              profileId: activeProfile?.id || "default",
              url,
              createdAt: new Date(),
              source: "ia",
              type: postType,
              prompt: promptEnglish || (promptsEnglish.length > 0 ? promptsEnglish[0] : "")
            });
          }
        } else if (resolvedImageUrl) {
          await addDoc(collection(db, "generated_images"), {
            userId: user?.uid || "anonymous",
            profileId: activeProfile?.id || "default",
            url: resolvedImageUrl,
            createdAt: new Date(),
            source: "ia",
            type: postType,
            prompt: promptEnglish || (promptsEnglish.length > 0 ? promptsEnglish[0] : "")
          });
        }
      } catch (persistErr) {
        console.error("Error al persistir imagen en biblioteca:", persistErr);
      }

      // Adaptar respuesta al estado de slides
      if (postType === 'Carrusel' && resolvedImageUrls.length > 0) {
        const slides: CarouselSlide[] = resolvedImageUrls.map((url: string) => ({
          url,
          copy: resolvedCopy
        }));
        setPreviewSlides(slides);
      } else {
        setPreviewSlides([{ url: resolvedImageUrl, copy: resolvedCopy }]);
      }

      // Mostrar modal de aviso informando que ya está guardado en biblioteca
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "¡Diseño Guardado en Biblioteca!",
        message: "Tu nueva imagen se ha generado exitosamente. Ya la tienes disponible en el menú Biblioteca para editar o postear cuando gustes.",
        onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
      });

      // Si es Reel, guardar assets
      if (postType === 'Reel') {
        setVoiceoverScript(data.voiceoverScript || data.voiceover_script || "");
        setVideoPrompt(data.videoPrompt || data.video_prompt || "");
        setAudioUrl(data.audioUrl || data.audio_url || "");
        setShowReelWorkspace(true);
      } else {
        if (resolvedCopy && !postText.trim()) {
          setPostText(resolvedCopy);
        }
      }

    } catch (err: any) {
      setGeneratingOpen(false);
      setGeneratingSteps([]);
      setError(err.message || "Error al renderizar el diseño final.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRetouchImage = async (index: number | null, instruction: string) => {
    if (!pendingPrompts) {
      setError("No se puede retocar esta imagen porque no proviene de una generación con IA o no se encontró su prompt original.");
      return;
    }
    setPreviewLoading(true);
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      let currentPrompt = "";
      if (index !== null && pendingPrompts.prompts_english && pendingPrompts.prompts_english.length > index) {
         currentPrompt = pendingPrompts.prompts_english[index];
      } else {
         currentPrompt = pendingPrompts.prompt_english || (pendingPrompts.prompts_english?.[0] || "");
      }

      // 1. Obtener prompt corregido
      const retouchRes = await fetch("/api/ai/retouch-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ prompt: currentPrompt, instruction })
      });
      if (!retouchRes.ok) throw new Error("Error al ajustar el prompt con la IA");
      const retouchData = await retouchRes.json();
      const newPrompt = retouchData.prompt_english;

      // 2. Generar nueva imagen en n8n
      const posterPromptSuffix = posterConfig.enabled ? buildPosterPromptSuffix(posterConfig) : "";
      const finalPrompt = `${newPrompt}. ${posterPromptSuffix}`.trim();

      const webhookUrl = process.env.NEXT_PUBLIC_N8N_PREVIEW_URL || 'https://n8n.santisoft.cl/webhook/img-rrss-auto';
      const payload: any = {
        idea: idea.trim(),
        imageExpectation: imageExpectation.trim(),
        postText: postText.trim(),
        businessType,
        postType,
      };

      if (index !== null && postType === 'Carrusel') {
         // Re-generamos solo esa slide pasando los prompts pero modificando el de ese index
         const newPrompts = [...(pendingPrompts.prompts_english || [])];
         newPrompts[index] = newPrompt;
         payload.promptsEnglish = newPrompts.map(p => `${p}. ${posterPromptSuffix}`.trim());
      } else {
         payload.promptEnglish = finalPrompt;
      }

      const res = await fetch("/api/ai/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error en webhook de regeneración");
      const data = await res.json();
      
      const newImageUrl = data.imageUrl || data.image_url || data.output?.imageUrl || data.output?.image_url;
      const newImageUrls = data.imageUrls || data.image_urls || data.output?.imageUrls || data.output?.image_urls || [];

      if (postType === 'Carrusel' && newImageUrls.length > 0) {
         const slides: CarouselSlide[] = newImageUrls.map((url: string, i: number) => ({
           url,
           copy: previewSlides[i]?.copy || ""
         }));
         setPreviewSlides(slides);
      } else if (newImageUrl) {
         if (index !== null && previewSlides.length > index) {
            const newSlides = [...previewSlides];
            newSlides[index].url = newImageUrl;
            setPreviewSlides(newSlides);
         } else {
            setPreviewSlides([{ url: newImageUrl, copy: previewSlides[0]?.copy || "" }]);
            if (creationMode === 'manual' && selectedTemplate) {
               setSelectedTemplate({ ...selectedTemplate, url: newImageUrl });
            }
         }
      }
    } catch (e: any) {
       console.error("Retouch error:", e);
       setError(e.message || "Hubo un error al retocar la imagen.");
    } finally {
       setPreviewLoading(false);
    }
  };


  const updateSlideFinalUrl = async (index: number, finalUrl: string) => {
      setPreviewSlides(prev => prev.map((s, idx) => idx === index ? { ...s, url: finalUrl } : s));

      // Guardar el render editado por el usuario en la biblioteca
      try {
        await addDoc(collection(db, "generated_images"), {
          userId: user?.uid || "anonymous",
          profileId: activeProfile?.id || "default",
          url: finalUrl,
          createdAt: new Date(),
          source: "editor",
          type: postType,
          prompt: "Edición manual de usuario en editor visual"
        });
      } catch (persistErr) {
        console.error("Error al guardar imagen editada en biblioteca:", persistErr);
      }
  };

  // Upload templates manual/gallery
  const handleUploadNewTemplate = async (file: File) => {
     setLoadingTemplates(true);
     try {
         const ext = file.name.split('.').pop();
         const filename = `template_${Date.now()}.${ext}`;
         const storageRef = ref(storage, `social_media_templates/${user?.uid}/${filename}`);
         await uploadBytes(storageRef, file);
         const downloadUrl = await getDownloadURL(storageRef);

         const isVideo = file.type.startsWith('video/');

         const newDoc = await addDoc(collection(db, "user_templates"), {
             userId: user.uid,
             url: downloadUrl,
             type: isVideo ? 'video' : 'image',
             createdAt: new Date()
         });

         const newTmpl: UserTemplate = {
             id: newDoc.id,
             url: downloadUrl,
             type: isVideo ? 'video' : 'image',
             createdAt: new Date()
         };

         setManualTemplates(prev => [newTmpl, ...prev]);
         setSelectedTemplate(newTmpl);
         setCreationMode('manual');
     } catch (err) {
         console.error("Error al subir archivo:", err);
         setError("No pudimos guardar la imagen en tu galería.");
     } finally {
         setLoadingTemplates(false);
     }
  };

  // Save CanvasEditor modifications to Firestore templates
  const handleSaveEditedTemplate = async (editedDataUrl: string) => {
      setLoading(true);
      try {
          const blob = await (await fetch(editedDataUrl)).blob();
          const filename = `edited_canvas_${Date.now()}.png`;
          const storageRef = ref(storage, `social_media_templates/${user?.uid}/${filename}`);
          await uploadBytes(storageRef, blob);
          const downloadUrl = await getDownloadURL(storageRef);

          const newDoc = await addDoc(collection(db, "user_templates"), {
              userId: user.uid,
              url: downloadUrl,
              type: 'image',
              createdAt: new Date()
          });

          const newTmpl: UserTemplate = {
              id: newDoc.id,
              url: downloadUrl,
              type: 'image',
              createdAt: new Date()
          };

          setManualTemplates(prev => [newTmpl, ...prev]);
          setSelectedTemplate(newTmpl);
          
          setStatusModal({
              isOpen: true,
              type: "success",
              title: "¡Diseño Guardado!",
              message: "Tu imagen editada se guardó y pre-seleccionó en la galería.",
              onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
          });
      } catch (err) {
          console.error("Error al guardar canvas:", err);
          setError("No pudimos guardar el diseño editado.");
      } finally {
          setLoading(false);
      }
  };

  // Delete manual template
  const handleDeleteTemplate = async (tmpl: UserTemplate) => {
      try {
          // Delete firestore
          await deleteDoc(doc(db, "user_templates", tmpl.id));
          // Remove from local list
          setManualTemplates(prev => prev.filter(t => t.id !== tmpl.id));
          if (selectedTemplate?.id === tmpl.id) {
              setSelectedTemplate(null);
          }
          // Try storage delete
          try {
              const fileRef = ref(storage, tmpl.url);
              await deleteObject(fileRef);
          } catch(storageErr) {
              console.log("No storage clean needed or file not found in path", storageErr);
          }
      } catch(err) {
          console.error("Error deleting template:", err);
      }
  };

  // Main Submit Handler (Publish Now or Schedule)
  const handleSubmit = async (e?: React.FormEvent, publishNow = false) => {
    if (e) e.preventDefault();
    setError("");

    const hasTextText = creationMode === 'ai' ? postText.trim().length > 0 : manualCaption.trim().length > 0;
    const isReel = postType === 'Reel';
    const hasReelVideo = isReel 
      ? (creationMode === 'ai' 
          ? (previewSlides[0]?.url?.match(/\.(mp4|mov|webm|quicktime)/i) || previewSlides[0]?.url?.includes('video')) 
          : !!selectedTemplate) 
      : true;
    const hasMedia = (creationMode === 'manual' && !!selectedTemplate) || (creationMode === 'ai' && previewSlides.length > 0 && hasReelVideo);

    if (!hasTextText) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Falta contenido",
        message: "Por favor escribe tu texto de la publicación.",
        onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (!hasMedia) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Falta multimedia",
        message: "Previsualiza tu post con IA o selecciona un archivo de la galería antes de agendar.",
        onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const currentLength = creationMode === 'ai' ? postText.length : manualCaption.length;
    const isOverLimit = currentLength > constraints.safeCharLimit;

    // Warnings block
    if (isOverLimit) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Límite excedido",
        message: `Tu publicación supera el límite de caracteres sugerido para las redes seleccionadas.`,
        onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setLoading(true);

    try {
      let finalMediaUrls: string[] = [];
      let finalCaption = "";

      if (creationMode === 'manual' && selectedTemplate) {
          finalMediaUrls = [selectedTemplate.url];
          finalCaption = manualCaption;
      } else {
          finalMediaUrls = previewSlides.map(s => s.url);
          finalCaption = postText;
      }

      const scheduledDate = showScheduler && date && time ? new Date(`${date}T${time}`) : new Date();

      // Guardar el post en Firebase
      const postPayload: any = {
        userId: user.uid,
        profileId: activeProfile?.id || "default",
        businessType: businessType || "General",
        creationMode,
        idea: creationMode === 'ai' ? idea : "",
        imageExpectation: creationMode === 'ai' ? imageExpectation : "",
        postText: finalCaption,
        postType,
        carouselCount: postType === 'Carrusel' ? carouselCount : 1,
        networks: Object.entries(networks).filter(([_, isActive]) => isActive).map(([net]) => net),
        imageUrls: finalMediaUrls,
        imageUrl: finalMediaUrls[0] || "",
        status: publishNow ? "publishing" : "confirmed",
        scheduledFor: scheduledDate,
        createdAt: new Date(),
        // Si hay cartel
        posterConfig: posterConfig.enabled ? posterConfig : null
      };

      const newPostRef = await addDoc(collection(db, "social_posts"), postPayload);

      // Si es publicacion inmediata
      if (publishNow) {
          try {
              const idToken = await auth.currentUser?.getIdToken();
              const publishRes = await fetch("/api/publish-now", {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${idToken}`
                  },
                  body: JSON.stringify({ postId: newPostRef.id })
              });

              if (publishRes.ok) {
                  router.push("/automatizacion-rrss/panel");
              } else {
                  const pubData = await publishRes.json();
                  throw new Error(pubData.error || "Error publicando inmediatamente.");
              }
          } catch (pubErr: any) {
              console.error("Error en publicación inmediata:", pubErr);
              setStatusModal({
                isOpen: true,
                type: "error",
                title: "Error al Publicar",
                message: pubErr.message || "No pudimos conectar con las redes sociales ahora mismo.",
                onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
              });
              setLoading(false);
          }

      } else {
          // Solo agendar (Cloud Tasks)
          try {
              const idToken = await auth.currentUser?.getIdToken();
              const scheduleRes = await fetch('/api/tasks/schedule', {
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
              
              if (!scheduleRes.ok) {
                  const errData = await scheduleRes.json();
                  throw new Error(errData.error || "No se pudo agendar la tarea.");
              }
              
              router.push("/automatizacion-rrss/panel");
          } catch (scheduleErr: any) {
              console.error("Error scheduling GCP task", scheduleErr);
              setStatusModal({
                isOpen: true,
                type: "error",
                title: "Error al Agendar",
                message: scheduleErr.message || "Ocurrió un error configurando la tarea en Google Cloud.",
                onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
              });
              setLoading(false);
          }
      }

    } catch (err) {
      console.error(err);
      setError("Error procesando el post. Intenta nuevamente.");
      setLoading(false);
    }
  };

  const hasText = creationMode === 'ai' ? (idea.trim().length > 0 || postText.trim().length > 0) : manualCaption.trim().length > 0;
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

  return (
    <div className="max-w-[1400px] mx-auto lg:mx-0">
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Nueva Publicación</h1>
          <p className="text-slate-500 mt-3 font-medium text-lg">Danos una idea y el bot se encarga del diseño (IA) y la publicación.</p>
        </div>
        {(previewSlides.length > 0 || selectedTemplate) && (
          <button
            onClick={() => {
              setIdea("");
              setImageExpectation("");
              setPostText("");
              setManualCaption("");
              setPreviewSlides([]);
              setSelectedTemplate(null);
              setPosterConfig(DEFAULT_POSTER_CONFIG);
              setCreationMode('ai');
              // Limpiar params de la url si venía de la biblioteca
              if (templateUrlParam || hideAIParam || openEditorParam) {
                router.replace('/automatizacion-rrss/panel/crear');
              }
            }}
            className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm uppercase tracking-wider"
          >
            <span className="text-lg">🗑️</span> Limpiar
          </button>
        )}
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

      {/* 1. SECCIÓN SUPERIOR: CARTEL PUBLICITARIO (PANTALLA COMPLETA) */}
      <div className="w-full">
        <PosterSection
          config={posterConfig}
          setConfig={setPosterConfig}
          profileLogoUrl={activeProfile?.logoUrl}
          profileName={activeProfile?.name}
          profilePhone={activeProfile?.phone}
          profileEmail={activeProfile?.email}
        />
      </div>

      {/* 2. SECCIÓN MEDIA: GRID DE 2 COLUMNAS (PARÁMETROS A LA IZQ Y CONTENIDO A LA DER) */}
      {!openEditorParam && (
        <div className="grid lg:grid-cols-12 gap-8 items-start mb-10">
          {/* Columna Izquierda: Parámetros del post */}
          <div className="lg:col-span-6 space-y-6 w-full">
            <PostConfigForm 
              idea={idea} setIdea={setIdea}
              imageExpectation={imageExpectation} setImageExpectation={setImageExpectation}
              postText={postText} setPostText={setPostText}
              postType={postType} setPostType={setPostType}
              hideSubmit={true}
              carouselCount={carouselCount} setCarouselCount={setCarouselCount}
              businessType={businessType} setBusinessType={setBusinessType}
              date={date} setDate={setDate}
              time={time} setTime={setTime}
              networks={networks} setNetworks={setNetworks}
              hasFb={hasFb} hasIg={hasIg} hasLi={hasLi} hasTt={hasTt} hasGbp={hasGbp}
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
            renderSection="parameters"
            hideAI={hideAIParam}
          />
        </div>

        {/* Columna Derecha: Texto y contenido */}
        <div className="lg:col-span-6 space-y-6 w-full">
          <PostConfigForm 
            idea={idea} setIdea={setIdea}
            imageExpectation={imageExpectation} setImageExpectation={setImageExpectation}
            postText={postText} setPostText={setPostText}
            postType={postType} setPostType={setPostType}
            hideSubmit={true}
            carouselCount={carouselCount} setCarouselCount={setCarouselCount}
            businessType={businessType} setBusinessType={setBusinessType}
            date={date} setDate={setDate}
            time={time} setTime={setTime}
            networks={networks} setNetworks={setNetworks}
            hasFb={hasFb} hasIg={hasIg} hasLi={hasLi} hasTt={hasTt} hasGbp={hasGbp}
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
            renderSection="content"
            posterConfig={posterConfig}
            hideAI={hideAIParam}
          />
        </div>
      </div>
      )}

      {/* 3. SECCIÓN INFERIOR: ÁREA DE VISUALIZACIÓN A PANTALLA COMPLETA ABAJO */}
      <div className="w-full border-t border-slate-200/80 pt-8 mt-10">
        <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-wider">
          Previsualización y Edición
        </h3>
        
        {creationMode === 'manual' ? (
            selectedTemplate ? (
                <div className="space-y-6 animate-in fade-in duration-300 w-full">
                    {previewLoading ? (
                        <div className="p-8 bg-slate-50 border border-slate-200 rounded-[32px] text-center flex flex-col items-center justify-center min-h-[300px] text-indigo-750 shadow-md animate-pulse w-full">
                           <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4 mx-auto"></div>
                           <h4 className="font-black text-md mb-1 uppercase tracking-widest">Procesando Diseño...</h4>
                           <p className="font-medium text-xs max-w-xs mx-auto leading-relaxed text-indigo-500">Aplicando cambios a tu imagen con IA. Esto puede tomar unos segundos.</p>
                        </div>
                    ) : selectedTemplate.type === 'video' || selectedTemplate.url.match(/\.(mp4|mov|webm|quicktime)/i) || selectedTemplate.url.includes("video") ? (
                        <div className="p-8 bg-slate-50 rounded-[32px] border-2 border-slate-100 animate-in zoom-in duration-500 space-y-6 shadow-xl shadow-slate-200/50 max-w-4xl mx-auto">
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
                                   "{manualCaption || 'Escribe el texto que acompañará tu video...'}"
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full">
                          <CanvasEditor 
                             baseImageUrl={selectedTemplate.url}
                             suggestedCopy={manualCaption || "Previsualización manual"}
                             initialLogoUrl={userLogo}
                             userId={user?.uid}
                             onSave={handleSaveEditedTemplate}
                             forceOpenEditor={openEditorParam}
                             onRetouch={(inst) => handleRetouchImage(null, inst)}
                             isRetouching={previewLoading}
                          />
                        </div>
                    )}
                    <div className="max-w-md mx-auto mt-6">
                       <button 
                         type="button" 
                         onClick={() => setShowFinalPostModal(true)} 
                         disabled={loading || !isReady} 
                         title={!isReady ? "Falta agregar el copy de la publicación" : ""}
                         className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black text-[16px] py-4 rounded-[20px] transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 hover:-translate-y-1"
                       >
                          {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : (!isReady ? '⚠️ POSTEAR (Falta Copy)' : '🚀 POSTEAR')}
                       </button>
                    </div>
                </div>
            ) : (
                <div className="p-8 border-4 border-dashed border-indigo-100 rounded-[32px] text-center flex flex-col items-center justify-center min-h-[300px] text-indigo-400 bg-indigo-50/20 transition-all w-full">
                  <div className="text-6xl mb-4 opacity-80">📸</div>
                  <h4 className="font-black text-lg mb-2 text-indigo-700">Galería Manual Activa</h4>
                  <p className="font-medium text-sm max-w-xs leading-relaxed mb-4">Selecciona uno de tus diseños o videos previos o sube uno nuevo para empezar.</p>
                </div>
            )
        ) : previewSlides.length > 0 ? (
            postType === 'Reel' ? (
               <div className="space-y-6 animate-in fade-in duration-300 w-full">
                 <div className="premium-card p-8 text-center flex flex-col items-center justify-center min-h-[350px] bg-slate-50/50 border-2 border-slate-100 rounded-[32px] shadow-sm max-w-md mx-auto">
                   {previewSlides[0]?.url && !previewSlides[0].url.match(/\.(mp4|mov|webm|quicktime)/i) ? (
                     <div className="aspect-[9/16] w-full max-w-[180px] rounded-2xl overflow-hidden bg-slate-100 border-4 border-white shadow-md relative mb-6">
                       <img src={previewSlides[0].url} alt="Cover Reference" className="w-full h-full object-cover" />
                     </div>
                   ) : (
                     <div className="text-6xl mb-6 opacity-80">🎬</div>
                   )}
                   <h4 className="font-black text-lg mb-2 text-slate-800 uppercase tracking-tight">Reel en Producción</h4>
                   <p className="font-medium text-slate-500 text-sm max-w-xs leading-relaxed mb-6">
                     Hemos generado tu portada, prompt de animación y locución de audio.
                   </p>
                   <button
                     type="button"
                     onClick={() => setShowReelWorkspace(true)}
                     className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm py-4 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                   >
                     🎬 Abrir Espacio de Producción
                   </button>
                 </div>
               </div>
            ) : (
                 <div className="w-full">
                  <CarouselWizard 
                     slides={previewSlides}
                     onUpdateSlide={updateSlideFinalUrl}
                     userLogo={userLogo}
                     userId={user?.uid}
                     forceOpenEditor={openEditorParam}
                  />
                  <div className="max-w-md mx-auto mt-6">
                     <button 
                       type="button" 
                       onClick={() => setShowFinalPostModal(true)} 
                       disabled={loading || !isReady} 
                       title={!isReady ? "Falta agregar el copy de la publicación" : ""}
                       className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black text-[16px] py-4 rounded-[20px] transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 hover:-translate-y-1"
                     >
                        {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : (!isReady ? '⚠️ POSTEAR (Falta Copy)' : '🚀 POSTEAR')}
                     </button>
                  </div>
                </div>
            )
        ) : previewLoading ? (
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-[32px] text-center flex flex-col items-center justify-center min-h-[300px] text-indigo-750 shadow-md animate-pulse w-full">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <h4 className="font-black text-md mb-1 uppercase tracking-widest">Generando Diseño...</h4>
              <p className="font-medium text-xs max-w-xs leading-relaxed text-indigo-500">Renderizando imágenes e integrando copys. Esto puede tomar unos segundos.</p>
            </div>
        ) : (
            <div className="p-8 border-2 border-dashed border-slate-250 rounded-[32px] text-center flex flex-col items-center justify-center min-h-[300px] text-slate-400 transition-all hover:bg-slate-50 w-full">
              <div className="text-5xl mb-3 opacity-50">🖼️</div>
              <h4 className="font-black text-md mb-1 text-slate-600">Área de Visualización Activa</h4>
              <p className="font-medium text-xs max-w-xs leading-relaxed">Genera un post a la derecha y aquí podrás editar la composición final de tu design.</p>
            </div>
        )}
      </div>

      <AIOptionsModal 
        isOpen={showOptionsModal}
        options={aiOptions}
        onSelect={(opt) => {
            if (creationMode === 'ai') setPostText(opt);
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
              <textarea 
                value={editablePromptSpanish}
                onChange={(e) => setEditablePromptSpanish(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-700 text-sm font-semibold leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
                rows={4}
              />
              
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

      {/* MODAL DE PROGRESO DE GENERACIÓN IA */}
      <GeneratingModal
        isOpen={generatingOpen}
        steps={generatingSteps}
        currentStepId={generatingCurrentId}
        onCancel={() => {
          // Solo cerramos el modal visual; el proceso ya no se puede cancelar en el servidor
          setGeneratingOpen(false);
          setPromptLoading(false);
          setPreviewLoading(false);
        }}
      />

      <StatusModal 
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onConfirm={() => {
            if (statusModal.onConfirm) {
                statusModal.onConfirm();
            } else {
                setStatusModal(prev => ({ ...prev, isOpen: false, type: "success", title: "", message: "", onConfirm: null }));
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
                      <div className="aspect-[9/16] max-h-[50vh] rounded-[24px] overflow-hidden bg-slate-100 border-4 border-white shadow-md relative mx-auto flex items-center justify-center">
                        <img src={previewSlides[0].url} alt="Cover Reference" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[0.5px]"></div>
                        <div className="absolute bottom-4 left-4 right-4 text-center bg-slate-900/90 backdrop-blur-md py-2.5 px-3 rounded-xl border border-white/10 text-white font-black text-[10px] uppercase tracking-wider">
                          Usa esta imagen in tu herramienta de video
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
                                    message: "El video no puede superar los 100MB.",
                                    onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
                                  });
                                  return;
                                }
                                setReelVideoUploading(true);
                                try {
                                  const ext = f.name.split('.').pop();
                                  const filename = `manual_post_${Date.now()}.${ext}`;
                                  const storageRef = ref(storage, `user_assets/${user?.uid}/${filename}`);
                                  await uploadBytes(storageRef, f);
                                  const downloadUrl = await getDownloadURL(storageRef);
                                  
                                  const newDoc = await addDoc(collection(db, "user_templates"), {
                                      userId: user.uid,
                                      url: downloadUrl,
                                      type: 'video',
                                      createdAt: new Date()
                                  });
                                  const newTmpl: UserTemplate = { id: newDoc.id, url: downloadUrl, type: 'video', createdAt: new Date() };
                                  setManualTemplates(prev => [newTmpl, ...prev]);

                                  setCreationMode('manual');
                                  setSelectedTemplate(newTmpl);
                                  
                                  const finalCopy = previewSlides[0]?.copy || idea;
                                  setManualCaption(finalCopy);

                                  setShowReelWorkspace(false);
                                  setStatusModal({
                                    isOpen: true,
                                    type: "success",
                                    title: "¡Video subido y seleccionado!",
                                    message: "Tu video se ha guardado en la galería. Ahora estás en modo Subida Manual con el video seleccionado y el texto de publicación listo.",
                                    onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
                                  });
                                } catch (uploadErr) {
                                  console.error(uploadErr);
                                  setStatusModal({
                                    isOpen: true,
                                    type: "error",
                                    title: "Error de carga",
                                    message: "Hubo un error subiendo el archivo de video.",
                                    onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
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
                               message: "¡Prompt copiado al portapapeles!",
                               onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
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

      {/* FINAL POST MODAL */}
      {showFinalPostModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">Previsualización Final</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Así se verá tu post en redes</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFinalPostModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              
              {/* Imagen/Video */}
              <div className="w-full aspect-square bg-slate-100 rounded-2xl overflow-hidden border-4 border-white shadow-md">
                 {(creationMode === 'manual' ? selectedTemplate?.url : previewSlides[0]?.url) ? (
                    (creationMode === 'manual' && (selectedTemplate?.type === 'video' || selectedTemplate?.url.match(/\.(mp4|mov|webm|quicktime)/i))) ? (
                       <video src={selectedTemplate?.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                       // eslint-disable-next-line @next/next/no-img-element
                       <img src={creationMode === 'manual' ? selectedTemplate?.url : previewSlides[0]?.url} alt="Final Post" className="w-full h-full object-cover" />
                    )
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">📸</div>
                 )}
              </div>

              {/* Redes Sociales */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner relative flex flex-col">
                 <div className="absolute -top-3 left-4 bg-white px-2 py-0.5 border border-slate-200 rounded-full text-[9px] font-black uppercase text-indigo-500 tracking-wider">
                    Redes de Destino
                 </div>
                 
                 <div className="mt-2">
                    {needsConnection ? (
                        <div className="p-3 bg-amber-50 border border-amber-250/60 rounded-xl text-xs text-amber-800 font-semibold leading-relaxed">
                        ⚠️ No tienes cuentas vinculadas. Ve a la sección de <Link href="/automatizacion-rrss/panel/cuentas" className="underline font-bold text-amber-900 hover:text-amber-950">Conexiones</Link> para enlazar tus redes.
                        </div>
                    ) : (
                        <div className="flex gap-3 justify-center">
                        {hasFb && (
                            <button
                            type="button"
                            onClick={() => setNetworks({ ...networks, facebook: !networks.facebook })}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                                networks.facebook ? 'bg-[#1877F2] text-white scale-105 shadow-md shadow-blue-500/20' : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-600'
                            }`}
                            >
                            <FaFacebookF />
                            </button>
                        )}
                        {hasIg && (
                            <button
                            type="button"
                            onClick={() => setNetworks({ ...networks, instagram: !networks.instagram })}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                                networks.instagram ? 'text-white scale-105 shadow-md shadow-pink-500/20' : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-600'
                            }`}
                            style={networks.instagram ? { background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' } : {}}
                            >
                            <FaInstagram className="text-xl" />
                            </button>
                        )}
                        {/* LinkedIn - Deshabilitado temporalmente hasta pasar verificación legal
                        {hasLi && (
                            <button
                            type="button"
                            onClick={() => setNetworks({ ...networks, linkedin: !networks.linkedin })}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                                networks.linkedin ? 'bg-[#0077b5] text-white scale-105 shadow-md shadow-[#0077b5]/20' : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-600'
                            }`}
                            >
                            <FaLinkedinIn />
                            </button>
                        )}
                        */}
                        {hasTt && (
                            <button
                            type="button"
                            onClick={() => setNetworks({ ...networks, tiktok: !networks.tiktok })}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                                networks.tiktok ? 'bg-black text-white scale-105 shadow-md shadow-black/20' : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-600'
                            }`}
                            >
                            <FaTiktok />
                            </button>
                        )}
                        {hasGbp && (
                            <button
                            type="button"
                            onClick={() => setNetworks({ ...networks, googleBusiness: !networks.googleBusiness })}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                                networks.googleBusiness ? 'bg-[#EA4335] text-white scale-105 shadow-md shadow-[#EA4335]/20' : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-600'
                            }`}
                            title="Google Business Profile"
                            >
                            <FaGoogle />
                            </button>
                        )}
                        </div>
                    )}
                 </div>
              </div>

              {/* Copy */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner relative flex flex-col">
                 <div className="absolute -top-3 left-4 bg-white px-2 py-0.5 border border-slate-200 rounded-full text-[9px] font-black uppercase text-indigo-500 tracking-wider">
                    Copy del Post
                 </div>
                 
                 <div className="flex justify-end mt-1 mb-2">
                    <button
                        type="button"
                        onClick={handleImproveWithAI}
                        disabled={improveLoading}
                        className="text-[10px] font-black text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider shadow-sm"
                    >
                        {improveLoading ? <div className="w-3 h-3 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /> : '✨ Mejorar con IA'}
                    </button>
                 </div>

                 <textarea
                    value={creationMode === 'manual' ? manualCaption : postText}
                    onChange={(e) => creationMode === 'manual' ? setManualCaption(e.target.value) : setPostText(e.target.value)}
                    className="w-full bg-transparent text-slate-600 text-sm font-medium leading-relaxed resize-none outline-none custom-scrollbar min-h-[120px]"
                    placeholder="Escribe el texto de tu publicación aquí..."
                 />
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-6 bg-white border-t border-slate-100 flex flex-col gap-3">
               {showScheduler ? (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-4 mb-4">
                       <div className="flex-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Día de Publicación</label>
                          <input 
                             type="date" 
                             value={date} 
                             onChange={e => setDate(e.target.value)}
                             min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                             className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl outline-none text-xs font-bold text-slate-700 focus:border-indigo-400"
                          />
                       </div>
                       <div className="flex-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hora Exacta</label>
                          <input 
                             type="time" 
                             value={time} 
                             onChange={e => setTime(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl outline-none text-xs font-bold text-slate-700 focus:border-indigo-400"
                          />
                       </div>
                    </div>
                    <div className="flex gap-3">
                       <button 
                          onClick={() => setShowScheduler(false)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all text-xs"
                       >
                          Volver
                       </button>
                       <button 
                          onClick={async () => {
                             if (!date || !time) {
                                setStatusModal({
                                   isOpen: true,
                                   type: "error",
                                   title: "Datos Incompletos",
                                   message: "Debes seleccionar una fecha y hora para programar el post.",
                                   onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
                                });
                                return;
                             }
                             await handleSubmit(undefined, false); // publishNow = false
                          }}
                          disabled={loading}
                          className="flex-[2] bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 text-xs flex items-center justify-center gap-2"
                       >
                          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✅ Confirmar Agendamiento'}
                       </button>
                    </div>
                 </div>
               ) : (
                 <div className="flex gap-3">
                    <button 
                       onClick={() => setShowScheduler(true)}
                       className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all text-xs flex items-center justify-center gap-2"
                    >
                       📅 Agendar Post
                    </button>
                    <button 
                       onClick={async () => {
                          await handleSubmit(undefined, true);
                       }}
                       disabled={loading}
                       className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 text-xs flex items-center justify-center gap-2"
                    >
                       {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '⚡ Publicar Ahora'}
                    </button>
                 </div>
               )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
