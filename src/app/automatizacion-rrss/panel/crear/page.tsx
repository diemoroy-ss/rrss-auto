"use client";

import { useState, useEffect, useMemo } from "react";
import { auth, db, storage } from "../../../../lib/firebase";
import { collection, addDoc, getDoc, doc, query, where, getDocs, orderBy, deleteDoc, limit } from "firebase/firestore";
import { sanitizeFirestorePayload } from "../../../../lib/firestore-sanitize";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProfile } from "../../../../contexts/ProfileContext";
import { getQuotaUsage, getPlanLimit, getVideoPlanLimit, getAiGenerationUsage, getAiPlanLimit, fetchUserQuotas, checkUserTrialStatus } from "../../../../lib/quota";
import { fetchSocialRules, getCombinedConstraints, SocialRules, DEFAULT_SOCIAL_RULES } from "../../../../lib/socialRules";
import { type PosterConfig, DEFAULT_POSTER_CONFIG, DEFAULT_POSTER_SLIDES, buildPosterPromptSuffix } from "../../../../types/poster";

import PostConfigForm from "../../../../components/crear/PostConfigForm";
import CarouselWizard, { CarouselSlide } from "../../../../components/crear/CarouselWizard";
import CanvasEditor from "../../../../components/crear/CanvasEditor";
import StatusModal from "../../../../components/StatusModal";
import AIOptionsModal from "../../../../components/crear/AIOptionsModal";
import PosterFormView, { CAROUSEL_DEFAULT_SLIDES } from "../../../../components/crear/PosterFormView";
import GeneratingModal, { type GeneratingStep } from "../../../../components/crear/GeneratingModal";
import CreationFlowGuideModal, { FlowType } from "../../../../components/crear/CreationFlowGuideModal";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaGoogle, FaYoutube, FaTwitter } from "react-icons/fa";
import TikTokPostSettings, { TikTokSettingsState, DEFAULT_TIKTOK_SETTINGS } from "../../../../components/crear/TikTokPostSettings";
import { PromptTemplate, HARDCODED_STYLES } from "../../../../lib/prompt-templates";
import { isPlatformAllowed } from "../../../../lib/plans";

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
  const [hasYt, setHasYt] = useState(false);
  const [hasX, setHasX] = useState(false);
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
  const [imageStyle, setImageStyle] = useState("");
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<PromptTemplate | null>(null);
  /** Texto/copy explícito que el usuario escribe o genera con IA */
  const [postText, setPostText] = useState("");
  /** Imagen base opcional para anclar producto a estilos visuales */
  const [baseImageUrl, setBaseImageUrl] = useState<string>("");
  const [uploadingBaseImage, setUploadingBaseImage] = useState<boolean>(false);
  /** Flujo de creación activo: 'estandar' (post sin texto en imagen), 'afiche' (cartel publicitario con tipografías y datos) o 'laboratorio' (entorno avanzado Mixboard con fusión multi-imagen y blueprints) */
  const [activeCreationFlow, setActiveCreationFlow] = useState<'estandar' | 'afiche' | 'laboratorio'>('estandar');
  /** Estado del modal interactivo de "¿Cómo funciona?" */
  const [guideModalFlow, setGuideModalFlow] = useState<FlowType | null>(null);
  /** Configuración del cartel publicitario (opcional) */
  const [posterConfig, setPosterConfig] = useState<PosterConfig>(DEFAULT_POSTER_CONFIG);
  /** Incluir logo recreado con IA en la imagen generada */
  const [includeLogo, setIncludeLogo] = useState(false);
  const [postType, setPostType] = useState("Post");
  const [carouselCount, setCarouselCount] = useState(5);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [businessType, setBusinessType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [networks, setNetworks] = useState({ facebook: true, instagram: true, linkedin: false, tiktok: true, googleBusiness: true, youtube: true, x: true });
  const [tiktokSettings, setTiktokSettings] = useState<TikTokSettingsState>(DEFAULT_TIKTOK_SETTINGS);

  // Modo asistente paso a paso
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [isExpertMode, setIsExpertMode] = useState(false);

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
  const [finalPreviewIndex, setFinalPreviewIndex] = useState(0);

  // Configuración de video: subtítulos y locución con nuestros agentes
  const [enhanceVideoWithAi, setEnhanceVideoWithAi] = useState(false);
  const [includeVideoSubtitles, setIncludeVideoSubtitles] = useState(false);
  const [includeVideoVoiceover, setIncludeVideoVoiceover] = useState(false);

  // URLs consolidadas para la previsualización final y publicación (soporta carrusel de 5 láminas)
  const finalModalUrls: string[] = useMemo(() => {
    if (creationMode === 'manual' && selectedTemplate?.url) {
      return [selectedTemplate.url];
    }
    // Si el formato NO es Carrusel (ej: Historia, Post individual o Reel), tomar estrictamente 1 sola imagen
    if (postType !== 'Carrusel') {
      if (posterConfig.imageUrl) return [posterConfig.imageUrl];
      const p1 = previewSlides[0]?.url;
      if (p1) return [p1];
      return [];
    }
    const posterUrls = (posterConfig.enabled && posterConfig.slides)
      ? (posterConfig.slides.map(s => s.imageUrl).filter(Boolean) as string[])
      : [];
    if (posterUrls.length > 0) return posterUrls;
    const pUrls = previewSlides.map(s => s.url).filter(Boolean);
    if (pUrls.length > 0) return pUrls;
    if (posterConfig.imageUrl) return [posterConfig.imageUrl];
    return [];
  }, [creationMode, selectedTemplate, posterConfig, previewSlides, postType]);

  const isVideoMedia = useMemo(() => {
    if (postType === 'Reel') return true;
    if (selectedTemplate && (selectedTemplate.type === 'video' || selectedTemplate.url?.match(/\.(mp4|mov|webm|quicktime)/i) || selectedTemplate.url?.includes('video'))) return true;
    if (previewSlides[0]?.url && (previewSlides[0].url.match(/\.(mp4|mov|webm|quicktime)/i) || previewSlides[0].url.includes('video'))) return true;
    return false;
  }, [postType, selectedTemplate, previewSlides]);

  const openFinalPostModal = () => {
    // NUNCA sobreescribir el tipo si el usuario seleccionó Historia o Reel
    if (postType === 'Historia' || postType === 'Reel') {
      // Conservar el formato exacto del usuario
    } else if (postType === 'Carrusel' || finalModalUrls.length > 1) {
      setPostType('Carrusel');
    }
    setFinalPreviewIndex(0);
    setShowFinalPostModal(true);
  };

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
  const [singleSlideTargetIdx, setSingleSlideTargetIdx] = useState<number | null>(null);
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

  const handleSelectFlowFromGuide = (flow: FlowType) => {
    setActiveCreationFlow(flow);
    if (flow === 'estandar') {
      setPosterConfig((prev) => ({ ...prev, enabled: false, isLabMode: false }));
    } else if (flow === 'afiche') {
      setPosterConfig((prev) => ({
        ...prev,
        enabled: true,
        isLabMode: false,
        includeBusinessName: prev.includeBusinessName || true,
        businessName: prev.businessName || activeProfile?.name || "",
        includeMainText: prev.includeMainText || true,
        mainText: prev.mainText || idea || "",
      }));
    } else if (flow === 'laboratorio') {
      setPosterConfig((prev) => ({
        ...prev,
        enabled: true,
        isLabMode: true,
        includeBusinessName: prev.includeBusinessName || true,
        businessName: prev.businessName || activeProfile?.name || "",
        includeMainText: prev.includeMainText || true,
        mainText: prev.mainText || idea || "",
      }));
    }
    setGuideModalFlow(null);
  };

  // Plan limits & rules
  const [socialRules, setSocialRules] = useState<SocialRules>(DEFAULT_SOCIAL_RULES);
  const [postsThisMonth, setPostsThisMonth] = useState(0);
  const [postLimit, setPostLimit] = useState(5);
  const [videoLimit, setVideoLimit] = useState(0);
  const [imagesUsed, setImagesUsed] = useState(0);
  const [imageLimit, setImageLimit] = useState(8);
  const [videosUsed, setVideosUsed] = useState(0);
  const [showScheduler, setShowScheduler] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState("free");

  const [constraints, setConstraints] = useState<any>({
    safeCharLimit: 1000,
    allowedMediaTypes: ["image/*"],
    warnings: [],
    forcedType: ""
  });

  // ── Catálogo de productos/servicios ─────────────────────────────────────────
  const [catalogoItems, setCatalogoItems] = useState<any[]>([]);
  const [selectedCatalogoItem, setSelectedCatalogoItem] = useState<any | null>(null);

  // Website Link Attachment
  const [attachWebsiteLink, setAttachWebsiteLink] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState("");

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
            
            const ytOK = isValidToken(activeProfile?.youtubeToken_enc || activeProfile?.accounts?.youtube?.token) || (isDefault && isValidToken(data.youtubeToken_enc));
            const xOK = isValidToken(activeProfile?.xToken_enc || activeProfile?.accounts?.x?.token) || (isDefault && isValidToken(data.xToken_enc));
            
            setHasFb(fbOK);
            setHasIg(igOK);
            setHasLi(liOK);
            setHasTt(ttOK);
            setHasGbp(gbpOK);
            setHasYt(ytOK);
            setHasX(xOK);
            setBusinessType(activeProfile?.rubro || (isDefault ? data.rubro : "") || "");
            setUserLogo(activeProfile?.logoUrl || (isDefault ? data.logoUrl : "") || "");
            setIncludeLogo(activeProfile?.alwaysIncludeLogo === true);

            const defaultWeb = activeProfile?.website || (isDefault ? data.website : "") || "";
            setWebsiteUrl(defaultWeb);
            setAttachWebsiteLink(activeProfile?.includeWebsiteInCopy !== false && Boolean(defaultWeb));
            
            if (activeProfile?.tiktokDefaults) {
              setTiktokSettings(activeProfile.tiktokDefaults);
            } else if (data.tiktokDefaults && isDefault) {
              setTiktokSettings(data.tiktokDefaults);
            }
            
            setNetworks({ facebook: fbOK, instagram: igOK, linkedin: false, tiktok: ttOK, googleBusiness: gbpOK, youtube: ytOK, x: xOK });
            
            const plan = data.plan || "free";
            setUserPlan(plan);

            // Verificación del período de prueba de 7 días
            const trialStatus = checkUserTrialStatus(data, u.email);
            if (trialStatus.isTrial) {
              if (trialStatus.isExpired) {
                setIsTrialExpired(true);
                setQuotaExceeded(true);
                setPostLimit(0);
              } else {
                setTrialDaysLeft(trialStatus.daysRemaining);
              }
            }

            const serverQuotas = await fetchUserQuotas(activeProfile?.id || 'default');
            if (serverQuotas) {
              if (serverQuotas.isTrialExpired) {
                setIsTrialExpired(true);
                setQuotaExceeded(true);
                setPostLimit(0);
              }
              setPostsThisMonth(serverQuotas.postsUsed);
              if (!serverQuotas.isTrialExpired) {
                setPostLimit(serverQuotas.postsLimit);
              }
              if (serverQuotas.postsUsed >= serverQuotas.postsLimit || serverQuotas.isTrialExpired) {
                setQuotaExceeded(true);
              }
              setVideoLimit(serverQuotas.videoLimit);
              setImagesUsed(serverQuotas.imagesUsed);
              setImageLimit(serverQuotas.imageLimit);
              setVideosUsed(serverQuotas.videosUsed);
            } else {
              const [used, planLimit, vLimit, imgUsed, imgLimit, vidUsed] = await Promise.all([
                getQuotaUsage(u.uid, activeProfile?.id || 'default'),
                getPlanLimit(plan, u.email, data),
                getVideoPlanLimit(plan, u.email, data),
                getAiGenerationUsage(u.uid, "image"),
                getAiPlanLimit(plan, "image", u.email),
                getAiGenerationUsage(u.uid, "video")
              ]);

              setPostsThisMonth(used);
              setPostLimit(trialStatus.isExpired ? 0 : planLimit);
              if (used >= planLimit || trialStatus.isExpired) {
                  setQuotaExceeded(true);
              }
              setVideoLimit(vLimit);
              setImagesUsed(imgUsed);
              setImageLimit(imgLimit);
              setVideosUsed(vidUsed);
            }

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
  const carouselUrlsParam = searchParams.get("carouselUrls");
  const postTypeParam = searchParams.get("postType");
  const catalogoIdParam = searchParams.get("catalogoId");
  const catalogoNameParam = searchParams.get("catalogoName");
  const promptIdParam = searchParams.get("promptId") || searchParams.get("templatePromptId") || searchParams.get("styleId");
  const textTemplateIdParam = searchParams.get("textTemplateId");
  const baseImageUrlParam = searchParams.get("baseImageUrl");
  const badgeTextParam = searchParams.get("badgeText");
  const productNameParam = searchParams.get("productName");
  const priceParam = searchParams.get("price");
  const textTemplateNameParam = searchParams.get("textTemplateName");
  const layoutPositionParam = searchParams.get("layoutPosition");

  useEffect(() => {
    if (promptIdParam) {
      const foundHardcoded = HARDCODED_STYLES.find(s => s.id === promptIdParam);
      if (foundHardcoded) {
        setSelectedPromptTemplate(foundHardcoded);
      } else {
        getDoc(doc(db, "prompt_library", promptIdParam)).then(snap => {
          if (snap.exists()) {
            setSelectedPromptTemplate({ id: snap.id, ...snap.data() } as PromptTemplate);
          }
        }).catch(err => console.warn("Error loading style template by ID:", err));
      }
    }
  }, [promptIdParam]);

  // Load catalog items for the active profile
  useEffect(() => {
    if (!user || !activeProfile?.id) return;
    const load = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/catalogo?profileId=${activeProfile.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const items = data.items || [];
        setCatalogoItems(items);
        // Auto-select if coming from catálogo page
        if (catalogoIdParam) {
          const found = items.find((i: any) => i.id === catalogoIdParam);
          if (found) {
            setSelectedCatalogoItem(found);
            if (found.name && !idea) setIdea(found.name);
          } else if (catalogoNameParam) {
            // Item not in list yet (race) — create a minimal placeholder
            setSelectedCatalogoItem({ id: catalogoIdParam, name: decodeURIComponent(catalogoNameParam) });
            if (!idea) setIdea(decodeURIComponent(catalogoNameParam));
          }
        }
      } catch (e) {
        console.warn("[Crear] Error loading catalogo items:", e);
      }
    };
    load();
  }, [user, activeProfile?.id]);

  useEffect(() => {
    if (carouselUrlsParam) {
      try {
        let urls: string[] = [];
        try {
          urls = JSON.parse(decodeURIComponent(carouselUrlsParam));
        } catch {
          urls = decodeURIComponent(carouselUrlsParam).split(",").map((u) => u.trim()).filter(Boolean);
        }
        if (Array.isArray(urls) && urls.length > 0) {
          setPostType("Carrusel");
          setCarouselCount(urls.length);
          setPreviewSlides(urls.map((url) => ({ url, copy: "" })));
          setPosterConfig((prev) => ({
            ...prev,
            enabled: true,
            slides: urls.map((u, i) => ({
              slideNumber: i + 1,
              imageUrl: u,
              baseImageUrl: u,
              mainText: prev.slides?.[i]?.mainText || "",
              priceText: prev.slides?.[i]?.priceText || "",
              sloganText: prev.slides?.[i]?.sloganText || "",
              ctaText: prev.slides?.[i]?.ctaText || "",
              role: CAROUSEL_DEFAULT_SLIDES[i]?.role || `Slide ${i + 1}`,
            })),
          }));
        }
      } catch (err) {
        console.warn("Error parsing carouselUrls param:", err);
      }
    } else if (postTypeParam) {
      setPostType(postTypeParam);
      if (postTypeParam === "Post" || postTypeParam === "Carrusel") {
        setPosterConfig((prev) => ({ ...prev, orientation: "square", aspectRatio: "1:1" }));
      } else if (postTypeParam === "Historia" || postTypeParam === "Reel") {
        setPosterConfig((prev) => ({ ...prev, orientation: "vertical", aspectRatio: "9:16" }));
      }
    }
  }, [carouselUrlsParam, postTypeParam]);

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
    if (baseImageUrlParam) {
      setCreationMode('manual');
      const decodedUrl = decodeURIComponent(baseImageUrlParam);
      const tempTmpl: UserTemplate = {
        id: "temp-text-template",
        url: decodedUrl,
        type: 'image',
        createdAt: new Date()
      };
      setSelectedTemplate(tempTmpl);
      setPreviewSlides([{ url: decodedUrl, copy: "" }]);
    }
    if (productNameParam) {
      const decodedName = decodeURIComponent(productNameParam);
      setIdea((prev) => prev || decodedName);
    }
    if (textTemplateIdParam || badgeTextParam || priceParam || layoutPositionParam) {
      setPosterConfig((prev) => ({
        ...prev,
        enabled: true,
        layout: (layoutPositionParam as any) || prev.layout || "auto",
        includeMainText: !!productNameParam,
        mainText: productNameParam ? decodeURIComponent(productNameParam) : prev.mainText,
        includePrice: !!priceParam,
        priceText: priceParam ? decodeURIComponent(priceParam) : prev.priceText,
        sloganText: badgeTextParam ? decodeURIComponent(badgeTextParam) : prev.sloganText,
        includeSlogan: !!badgeTextParam,
      }));
    }
  }, [baseImageUrlParam, productNameParam, textTemplateIdParam, badgeTextParam, priceParam, layoutPositionParam]);

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

  const appendContactInfo = (baseText: string, customProfile?: any): string => {
    if (!baseText) return "";
    let extra = "";
    const targetProf = customProfile || activeProfile;
    
    const showWeb = targetProf?.includeWebsiteInCopy !== false && targetProf?.website;
    const showPhone = targetProf?.includePhoneInCopy !== false && (targetProf?.whatsapp || targetProf?.phone);
    const showEmail = targetProf?.includeEmailInCopy !== false && targetProf?.email;

    const parts: string[] = [];
    if (showWeb) parts.push(`🌐 Web: ${targetProf.website}`);
    if (showPhone) parts.push(`📞 Teléfono: ${targetProf.whatsapp || targetProf.phone}`);
    if (showEmail) parts.push(`✉️ Email: ${targetProf.email}`);

    const socialParts: string[] = [];
    if (activeProfile?.instagramUsername) {
      socialParts.push(`📸 Instagram: @${activeProfile.instagramUsername}`);
    }
    if (activeProfile?.facebookPageName) {
      socialParts.push(`👥 Facebook: ${activeProfile.facebookPageName}`);
    }
    if (activeProfile?.tiktokUsername) {
      socialParts.push(`🎵 TikTok: @${activeProfile.tiktokUsername}`);
    }
    if (activeProfile?.xUsername) {
      socialParts.push(`🐦 X: @${activeProfile.xUsername}`);
    }

    if (parts.length > 0 || socialParts.length > 0) {
      extra += "\n\n";
      if (parts.length > 0) {
        extra += parts.join("\n") + "\n";
      }
      if (socialParts.length > 0) {
        extra += socialParts.join("\n") + "\n";
      }
    }

    const lowerText = baseText.toLowerCase();
    if (showWeb && activeProfile?.website && lowerText.includes(activeProfile.website.toLowerCase().trim())) {
      return baseText;
    }

    return baseText.trim() + extra;
  };

  // AI copywriting generator
  const handleImproveWithAI = async () => {
    if (!isAdmin && isTrialExpired) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Período de prueba finalizado",
        message: "Tu prueba gratuita de 7 días ha concluido. Tus redes sociales conectadas y datos se mantienen guardados. Para generar textos con nuestros agentes, activa uno de nuestros planes.",
        onConfirm: () => {
          setStatusModal(prev => ({ ...prev, isOpen: false }));
          router.push("/automatizacion-rrss/panel/planes");
        }
      });
      return;
    }

    const textToImprove = creationMode === 'ai' ? postText : manualCaption;
    let baseIdea = creationMode === 'ai' ? idea : manualCaption;

    // Si es un carrusel o afiche con slides, consolidar la narrativa de todas las láminas
    if (posterConfig.enabled && posterConfig.slides && posterConfig.slides.length > 0) {
      const slidesSummaries = posterConfig.slides
        .map((s, idx) => {
          const parts: string[] = [];
          if (s.mainText?.trim()) parts.push(`Titular: "${s.mainText.trim()}"`);
          if (s.sloganText?.trim()) parts.push(`Slogan: "${s.sloganText.trim()}"`);
          if (s.priceText?.trim()) parts.push(`Precio: "${s.priceText.trim()}"`);
          if (s.ctaText?.trim()) parts.push(`CTA: "${s.ctaText.trim()}"`);
          if (s.imageExpectation?.trim()) parts.push(`Visual: ${s.imageExpectation.trim()}`);
          return parts.length > 0 ? `Slide ${s.slideNumber || idx + 1} (${s.role || "Lámina"}): ${parts.join(" - ")}` : "";
        })
        .filter(Boolean);

      if (slidesSummaries.length > 0) {
        baseIdea = baseIdea
          ? `${baseIdea}. Narrativa completa del carrusel: ${slidesSummaries.join(" | ")}`
          : `Carrusel completo: ${slidesSummaries.join(" | ")}`;
      }
    }

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
           businessData: {
             phone: activeProfile?.phone,
             whatsapp: activeProfile?.whatsapp || activeProfile?.phone,
             email: activeProfile?.email,
             website: activeProfile?.website,
             address: activeProfile?.address,
             businessName: activeProfile?.name || activeProfile?.businessName
           },
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
  const handleGeneratePreview = async (
    forceReplan = false,
    options?: { singleSlideOnly?: boolean; slideIndex?: number }
  ) => {
    const isSingleSlide = Boolean(options?.singleSlideOnly);
    const targetSlideIdx = options?.slideIndex ?? activeSlideIndex ?? 0;
    setSingleSlideTargetIdx(isSingleSlide ? targetSlideIdx : null);

    // Si el slide está configurado para reutilizar la imagen del Slide 1, simplemente asignamos la imagen del Slide 1 sin generar
    if (isSingleSlide && targetSlideIdx > 0 && posterConfig.slides?.[targetSlideIdx]?.useSlide1Image) {
      const slide1Url = posterConfig.slides?.[0]?.imageUrl || previewSlides?.[0]?.url || "";
      if (slide1Url) {
        setPosterConfig((prev) => {
          const nextSlides = prev.slides ? [...prev.slides] : [...DEFAULT_POSTER_SLIDES];
          if (nextSlides[targetSlideIdx]) {
            nextSlides[targetSlideIdx] = {
              ...nextSlides[targetSlideIdx],
              imageUrl: slide1Url,
            };
          }
          return { ...prev, slides: nextSlides };
        });
        setPreviewSlides((prev) => {
          const next = [...prev];
          while (next.length <= targetSlideIdx) next.push({ url: "", copy: "" });
          next[targetSlideIdx] = { url: slide1Url, copy: next[targetSlideIdx]?.copy || "" };
          return next;
        });
        setStatusModal({
          isOpen: true,
          type: "info",
          title: `Slide ${targetSlideIdx + 1} listo`,
          message: `Este slide está utilizando la imagen del Slide 1. No fue necesario generar una nueva imagen.`,
          onConfirm: () => setStatusModal((prev) => ({ ...prev, isOpen: false })),
        });
        return;
      }
    }

    const activeSlide = posterConfig.slides?.[targetSlideIdx];
    const targetIdea = isSingleSlide
      ? (activeSlide?.mainText?.trim() || activeSlide?.imageExpectation?.trim() || idea.trim() || `Diapositiva ${targetSlideIdx + 1}`)
      : (idea.trim() || posterConfig.mainText?.trim() || postText.trim() || imageExpectation.trim());

    let targetExpectation = isSingleSlide
      ? (activeSlide?.imageExpectation?.trim() || imageExpectation.trim() || targetIdea)
      : imageExpectation.trim();

    if (posterConfig.enabled && posterConfig.mainText && !isSingleSlide) {
      targetExpectation = targetExpectation ? `${targetExpectation}. Poster headline: ${posterConfig.mainText}` : `Commercial poster layout for ${posterConfig.mainText}`;
    }
    if (imageStyle) {
      targetExpectation = targetExpectation ? `${targetExpectation}, ${imageStyle}` : imageStyle;
    }
    targetExpectation = targetExpectation || postText.trim() || idea.trim();
    if (!targetIdea) return;

    // Validación de prueba de 7 días y cuota mensual antes de generar
    if (!isAdmin && isTrialExpired) {
      setError("Tu período de prueba de 7 días ha finalizado. Actualiza a un plan para generar nuevas imágenes o videos.");
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Período de prueba finalizado",
        message: "Tu prueba de 7 días ha finalizado. Tus datos y redes sociales conectadas siguen guardados. Activa un plan para generar más imágenes o videos.",
        onConfirm: () => {
          setStatusModal(prev => ({ ...prev, isOpen: false }));
          router.push("/automatizacion-rrss/panel/planes");
        }
      });
      return;
    }

    const isVideoType = postType === 'Reel' || postType === 'Video';
    if (isVideoType && videoLimit > 0 && videosUsed >= videoLimit && !isAdmin) {
      setError(`Has alcanzado el límite de generación de videos (${videosUsed}/${videoLimit}) de tu plan este mes. Mejora tu plan para continuar.`);
      return;
    }
    const reqImages = isSingleSlide ? 1 : (postType === 'Carrusel' ? carouselCount : 1);
    if (!isVideoType && (imagesUsed + reqImages > imageLimit) && !isAdmin) {
      setError(`Has alcanzado el límite de generación de imágenes de tu plan (${imagesUsed}/${imageLimit}). No puedes generar ${reqImages} imagen(es) más.`);
      return;
    }

    const effectivePostType = isSingleSlide ? 'Post' : postType;
    const effectiveCarouselCount = isSingleSlide ? 1 : carouselCount;

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_PREVIEW_URL || 'https://n8n.santisoft.cl/webhook/img-rrss-auto';
    
    // Definir los pasos del modal
    const isCarousel = postType === 'Carrusel';
    const initialSteps: GeneratingStep[] = [
      { id: 'generate',  label: 'Nuestros agentes diseñan la propuesta visual',   icon: '🎨', status: 'pending' },
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

      // ── PASO 1: Generar prompt base con el Director de Arte ──
      updateStep('generate', 'running');
      const promptRes = await fetch("/api/ai/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({
          idea: targetIdea,
          imageExpectation: targetExpectation,
          businessType,
          type: effectivePostType,
          aspectRatio: (effectivePostType === "Historia" || effectivePostType === "Reel") ? "9:16" : "1:1",
          carouselCount: effectiveCarouselCount,
          regenerate: forceReplan,
          selectedPromptTemplate: selectedPromptTemplate ? {
            id: selectedPromptTemplate.id,
            title: selectedPromptTemplate.title,
            prompt: selectedPromptTemplate.prompt,
            category: selectedPromptTemplate.category,
            isCommercialPoster: selectedPromptTemplate.isCommercialPoster || false,
          } : null,
          catalogoItem: selectedCatalogoItem ? {
            name: selectedCatalogoItem.name,
            description: selectedCatalogoItem.description || "",
            imageUrl: selectedCatalogoItem.imageUrl || null,
            category: selectedCatalogoItem.category || null,
            price: selectedCatalogoItem.price || null,
            offerPrice: selectedCatalogoItem.offerPrice || null,
            includePriceInCopy: selectedCatalogoItem.includePriceInCopy !== false,
          } : null,
        })
      });

      if (!promptRes.ok) throw new Error("Nuestros agentes no pudieron generar una propuesta visual.");

      const promptData = await promptRes.json();
      const promptPayload = promptData.data || promptData;
      updateStep('generate', 'done');

      
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
      setError(err.message || "Error al diseñar la propuesta visual.");
    } finally {
      setPromptLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIRMAR: enviar al webhook n8n con modal de progreso de generación
  // ─────────────────────────────────────────────────────────────────────────
  const handleConfirmPreview = async () => {
    if (!pendingPrompts) return;
    const isSingleSlideGen = singleSlideTargetIdx !== null;
    setShowPromptModal(false);
    setError("");

    // Pasos del modal de generación de imagen
    const confirmSteps: GeneratingStep[] = [
      { id: 'prep',     label: 'Preparando prompt enriquecido',          icon: '🧪', status: 'pending' },
      { id: 'send',     label: 'Enviando flujo a n8n',                   icon: '📡', status: 'pending' },
      { id: 'generate', label: 'Nuestros agentes generan la imagen comercial', icon: '🖼️', status: 'pending', sublabel: 'Renderizando escena en alta resolución...' },
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

      // Validar cuotas antes de llamar a la generación
      const isVideoType = postType === 'Reel' || postType === 'Video';
      if (isVideoType && videoLimit > 0 && videosUsed >= videoLimit && !isAdmin) {
        setGeneratingOpen(false);
        setGeneratingSteps([]);
        setError(`Has alcanzado el límite de generación de videos (${videosUsed}/${videoLimit}) de tu plan este mes. Mejora tu plan para continuar.`);
        return;
      }
      const reqImages = (postType === 'Carrusel' && !isSingleSlideGen) ? (promptsEnglish.length || carouselCount || 1) : 1;
      if (!isVideoType && (imagesUsed + reqImages > imageLimit) && !isAdmin) {
        setGeneratingOpen(false);
        setGeneratingSteps([]);
        setError(`Has alcanzado el límite de generación de imágenes de tu plan (${imagesUsed}/${imageLimit}). No puedes generar ${reqImages} imagen(es) más.`);
        return;
      }

      const webhookUrl = process.env.NEXT_PUBLIC_N8N_PREVIEW_URL || 'https://n8n.santisoft.cl/webhook/img-rrss-auto';
                  updateStep('prep', 'done');

      // ── SEND: Llamar al proxy → webhook n8n ──
      updateStep('send', 'running', `Webhook: ${webhookUrl}`);
      const res = await fetch("/api/ai/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({
          userId: user?.uid,
          idea: isSingleSlideGen
            ? (posterConfig.slides?.[singleSlideTargetIdx]?.mainText || posterConfig.slides?.[singleSlideTargetIdx]?.imageExpectation || idea.trim())
            : idea.trim(),
          imageExpectation: isSingleSlideGen
            ? (posterConfig.slides?.[singleSlideTargetIdx]?.imageExpectation || "")
            : imageExpectation.trim(),
          promptEnglish: isSingleSlideGen
            ? (promptEnglish || pendingPrompts.prompt_english || pendingPrompts.prompts_english?.[singleSlideTargetIdx] || "")
            : promptEnglish,
          promptsEnglish: isSingleSlideGen ? undefined : promptsEnglish,
          videoPrompt: pendingPrompts.video_prompt || "",
          voiceoverScript: pendingPrompts.voiceover_script || "",
          businessType,
          type: isSingleSlideGen ? (postType === 'Historia' || postType === 'Reel' ? 'Historia' : 'Post') : postType,
          carouselCount: isSingleSlideGen ? 1 : carouselCount,
          email: activeProfile?.email || "",
          phone: activeProfile?.phone || "",
          profileId: activeProfile?.id || "",
          userProvidedCopy: postText,
          posterConfig: {
            ...posterConfig,
            aspectRatio: (postType === 'Historia' || postType === 'Reel') ? '9:16' : '1:1',
            orientation: (postType === 'Historia' || postType === 'Reel') ? 'vertical' : 'square',
          },
          baseImageUrl: isSingleSlideGen
            ? (singleSlideTargetIdx === 0
                ? (posterConfig.slides?.[0]?.baseImageUrl || baseImageUrl || selectedCatalogoItem?.imageUrl || null)
                : (posterConfig.slides?.[singleSlideTargetIdx]?.baseImageUrl || null))
            : (baseImageUrl || selectedCatalogoItem?.imageUrl || null),
          allowImageRetouch: isSingleSlideGen
            ? (posterConfig.slides?.[singleSlideTargetIdx]?.allowImageRetouch ?? posterConfig.allowImageRetouch ?? true)
            : (posterConfig.allowImageRetouch ?? true),
          catalogoItem: selectedCatalogoItem ? {
            name: selectedCatalogoItem.name,
            description: selectedCatalogoItem.description || "",
            imageUrl: selectedCatalogoItem.imageUrl || null,
            category: selectedCatalogoItem.category || null,
            price: selectedCatalogoItem.price || null,
            offerPrice: selectedCatalogoItem.offerPrice || null,
            includePriceInCopy: selectedCatalogoItem.includePriceInCopy !== false,
          } : null,
        })
      });
      updateStep('send', 'done');

      // ── GENERATE: Esperando respuesta de n8n con la imagen ──
      updateStep('generate', 'running', 'Nuestros agentes componen la escena publicitaria...');

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Fallo en la previsualización del diseño.");
      }

      const data = await res.json();
      
      // Soportar respuestas en array, objetos directos o anidados
      const dataItem = Array.isArray(data) ? (data[0] || {}) : data;
      const resolvedImageUrl: string =
        dataItem?.img_url ||
        dataItem?.imageUrl ||
        dataItem?.url ||
        dataItem?.image ||
        dataItem?.outputUrl ||
        dataItem?.output ||
        dataItem?.data?.imageUrl ||
        dataItem?.data?.url ||
        (typeof data === "string" && data.startsWith("http") ? data : "") ||
        "";

      const rawUrls: string[] =
        dataItem?.img_urls ||
        dataItem?.imageUrls ||
        dataItem?.images ||
        (Array.isArray(data)
          ? data.map((d: any) => d?.imageUrl || d?.url || d?.img_url || d?.outputUrl || (typeof d === "string" ? d : null)).filter(Boolean)
          : []);

      const resolvedImageUrls: string[] =
        rawUrls.length > 0 ? rawUrls : (resolvedImageUrl ? [resolvedImageUrl] : []);
      const resolvedCopyRaw: string = dataItem?.suggestedCopy || dataItem?.copy || dataItem?.text || "";
      const resolvedCopy = appendContactInfo(resolvedCopyRaw);

      updateStep('generate', 'done');
      updateStep('done', 'done', '¡Diseño listo!');

      // Pequeña pausa para que el usuario vea el estado final
      await new Promise(r => setTimeout(r, 800));
      setGeneratingOpen(false);
      setGeneratingSteps([]);
      setWizardStep(3);

      // Refrescar contador de uso de imágenes y videos
      if (user?.uid) {
        fetchUserQuotas(activeProfile?.id || 'default').then(serverQuotas => {
          if (serverQuotas) {
            setImagesUsed(serverQuotas.imagesUsed);
            setVideosUsed(serverQuotas.videosUsed);
            setPostsThisMonth(serverQuotas.postsUsed);
          }
        }).catch(err => console.warn("No se pudo refrescar uso de cuotas:", err));
      }

      // ── PERSISTENCIA: Guardar las imágenes en la Biblioteca de Firestore ──
      let savedToLibrary = false;
      try {
        if (user?.uid && user.uid !== "anonymous") {
          if (postType === 'Carrusel' && resolvedImageUrls.length > 0) {
            await addDoc(collection(db, "generated_images"), sanitizeFirestorePayload({
              userId: user.uid,
              profileId: activeProfile?.id || "default",
              url: resolvedImageUrls[0],
              carouselImages: resolvedImageUrls,
              carouselCount: resolvedImageUrls.length,
              plannedCount: isSingleSlideGen ? (carouselCount || 5) : resolvedImageUrls.length,
              carouselPrompts: pendingPrompts?.prompts_spanish || promptsEnglish || [],
              createdAt: new Date(),
              source: "ia",
              type: "Carrusel",
              prompt: promptEnglish || pendingPrompts?.prompt_spanish || (resolvedImageUrls.length > 1
                ? `Carrusel comercial (${resolvedImageUrls.length} diapositivas)`
                : `Carrusel comercial (1 de ${carouselCount || 5} láminas)`),
              copy: resolvedCopy || postText,
              posterConfig: posterConfig.enabled
                ? {
                    ...posterConfig,
                    priceText: posterConfig.priceText || "",
                    sloganText: posterConfig.sloganText || "",
                    mainText: posterConfig.mainText || "",
                    ctaText: posterConfig.ctaText || "",
                    businessName: posterConfig.businessName || "",
                  }
                : null,
            }));
            savedToLibrary = true;
          } else if (resolvedImageUrl) {
            await addDoc(collection(db, "generated_images"), {
              userId: user.uid,
              profileId: activeProfile?.id || "default",
              url: resolvedImageUrl,
              createdAt: new Date(),
              source: "ia",
              type: postType,
              prompt: promptEnglish || (promptsEnglish.length > 0 ? promptsEnglish[0] : "")
            });
            savedToLibrary = true;
          }
        }
      } catch (persistErr) {
        console.error("Error al persistir imagen en biblioteca:", persistErr);
      }

      // Adaptar respuesta al estado de slides y sincronizar con posterConfig
      if (isSingleSlideGen && singleSlideTargetIdx !== null) {
        setPreviewSlides((prev) => {
          const next = prev.length > 0 ? [...prev] : Array.from({ length: carouselCount || 5 }, () => ({ url: "", copy: "" }));
          while (next.length <= singleSlideTargetIdx) {
            next.push({ url: "", copy: resolvedCopy });
          }
          next[singleSlideTargetIdx] = { url: resolvedImageUrl, copy: resolvedCopy || next[singleSlideTargetIdx]?.copy || "" };
          return next;
        });

        setPosterConfig((prev) => {
          const existingSlides = prev.slides && prev.slides.length > 0 ? [...prev.slides] : [...DEFAULT_POSTER_SLIDES];
          while (existingSlides.length <= singleSlideTargetIdx) {
            existingSlides.push({
              slideNumber: existingSlides.length + 1,
              role: CAROUSEL_DEFAULT_SLIDES[existingSlides.length]?.role || `Slide ${existingSlides.length + 1}`,
              mainText: "",
              priceText: "",
              sloganText: "",
              ctaText: "",
            });
          }
          existingSlides[singleSlideTargetIdx] = {
            ...existingSlides[singleSlideTargetIdx],
            imageUrl: resolvedImageUrl,
          };
          return {
            ...prev,
            imageUrl: singleSlideTargetIdx === (prev.activeSlideIndex ?? 0) ? resolvedImageUrl : (prev.imageUrl || resolvedImageUrl),
            slides: existingSlides,
          };
        });
      } else if (postType === 'Carrusel' && resolvedImageUrls.length > 0) {
        const slides: CarouselSlide[] = resolvedImageUrls.map((url: string) => ({
          url,
          copy: resolvedCopy
        }));
        setPreviewSlides(slides);

        setPosterConfig((prev) => {
          const existingSlides = prev.slides && prev.slides.length > 0 ? [...prev.slides] : [...DEFAULT_POSTER_SLIDES];
          resolvedImageUrls.forEach((url, i) => {
            while (existingSlides.length <= i) {
              existingSlides.push({
                slideNumber: existingSlides.length + 1,
                role: CAROUSEL_DEFAULT_SLIDES[existingSlides.length]?.role || `Slide ${existingSlides.length + 1}`,
                mainText: "",
                priceText: "",
                sloganText: "",
                ctaText: "",
              });
            }
            existingSlides[i] = {
              ...existingSlides[i],
              imageUrl: url,
            };
          });
          return {
            ...prev,
            imageUrl: resolvedImageUrls[0],
            slides: existingSlides,
          };
        });
      } else {
        setPreviewSlides([{ url: resolvedImageUrl, copy: resolvedCopy }]);
        setPosterConfig((prev) => ({
          ...prev,
          imageUrl: resolvedImageUrl,
        }));
      }

      // Mostrar modal informando estado real de persistencia (PF-10)
      if (savedToLibrary) {
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "¡Diseño Guardado en Biblioteca!",
          message: "Tu nueva imagen se ha generado y guardado exitosamente en tu Biblioteca para editar o programar cuando gustes.",
          onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
        });
      } else {
        setStatusModal({
          isOpen: true,
          type: "info",
          title: "¡Contenido Generado!",
          message: "Tu contenido visual está listo para revisión y edición. Puedes programar tu publicación directamente.",
          onConfirm: () => setStatusModal(prev => ({ ...prev, isOpen: false }))
        });
      }

      // Si es Reel, guardar assets
      if (postType === 'Reel') {
        setVoiceoverScript(data.voiceoverScript || data.voiceover_script || "");
        setVideoPrompt(data.videoPrompt || data.video_prompt || "");
        setAudioUrl(data.audioUrl || data.audio_url || "");
        setShowReelWorkspace(true);
      } else {
        // En carrusel o afiche NO sobreescribimos postText con el copy de una sola lámina;
        // el copy abarca todo el conjunto y se genera al final con el equipo de agentes
        if (postType !== 'Carrusel' && !posterConfig.enabled) {
          if (resolvedCopy && !postText.trim()) {
            setPostText(resolvedCopy);
          }
        }
        // Avanzar automáticamente al paso 3 para revisar el diseño generado
        setWizardStep(3);
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
    setPreviewLoading(true);
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      let currentPrompt = "";
      if (index !== null && posterConfig.slides?.[index]?.imageExpectation) {
        currentPrompt = posterConfig.slides[index].imageExpectation!;
      } else if (index !== null && pendingPrompts?.prompts_english && pendingPrompts.prompts_english.length > index) {
        currentPrompt = pendingPrompts.prompts_english[index];
      } else {
        currentPrompt = imageExpectation || pendingPrompts?.prompt_english || (pendingPrompts?.prompts_english?.[0] || idea || "");
      }

      if (!currentPrompt) {
        currentPrompt = `A commercial advertising poster for ${activeProfile?.businessType || businessType || "business"}: ${idea}`;
      }

      // 1. Obtener prompt corregido
      const retouchRes = await fetch("/api/ai/retouch-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ prompt: currentPrompt, instruction })
      });
      if (!retouchRes.ok) throw new Error("Error al ajustar el prompt con nuestros agentes.");
      const retouchData = await retouchRes.json();
      const newPrompt = retouchData.prompt_english;

      // 2. Generar nueva imagen en n8n
      const posterPromptSuffix = posterConfig.enabled ? buildPosterPromptSuffix(posterConfig) : "";
      const finalPrompt = `${newPrompt}. ${posterPromptSuffix}`.trim();

      const targetSlideImage = index !== null ? (posterConfig.slides?.[index]?.imageUrl || previewSlides?.[index]?.url) : (posterConfig.imageUrl || previewSlides?.[0]?.url);
      const slideStyleRef = index !== null ? posterConfig.slides?.[index]?.styleReferenceUrl : posterConfig.styleReferenceUrl;

      const payload: any = {
        idea: idea.trim(),
        imageExpectation: imageExpectation.trim(),
        userProvidedCopy: postText.trim(),
        businessType,
        type: postType,
        carouselCount,
        email: activeProfile?.email || "",
        phone: activeProfile?.phone || "",
        profileId: activeProfile?.id || "",
        posterConfig,
        styleReferenceUrl: slideStyleRef || "",
        retouchTargetImageUrl: targetSlideImage || "",
        retouchInstruction: instruction,
        isMixboardLab: activeCreationFlow === 'laboratorio',
        catalogoItem: selectedCatalogoItem ? {
            name: selectedCatalogoItem.name,
            description: selectedCatalogoItem.description || "",
            imageUrl: selectedCatalogoItem.imageUrl || null,
            category: selectedCatalogoItem.category || null,
            price: selectedCatalogoItem.price || null,
            offerPrice: selectedCatalogoItem.offerPrice || null,
            includePriceInCopy: selectedCatalogoItem.includePriceInCopy !== false,
        } : null,
      };

      if (index !== null && postType === 'Carrusel') {
         // Re-generamos solo esa slide pasando los prompts pero modificando el de ese index
         const newPrompts = [...(pendingPrompts?.prompts_english || [])];
         while (newPrompts.length <= index) newPrompts.push(finalPrompt);
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

  // Upload base image for Visual Styles (Product Vision anchoring)
  const handleUploadBaseImage = async (file: File) => {
    if (!user?.uid) return;
    setUploadingBaseImage(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `base_product_${Date.now()}.${ext}`;
      const storageRef = ref(storage, `social_media_uploads/${user.uid}/${filename}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setBaseImageUrl(downloadUrl);
      if (postType === 'Carrusel') {
        setPosterConfig((prev) => {
          const slides = [...(prev.slides || DEFAULT_POSTER_SLIDES)];
          if (slides[activeSlideIndex]) {
            slides[activeSlideIndex] = {
              ...slides[activeSlideIndex],
              baseImageUrl: downloadUrl,
              useSlide1Image: false,
            };
          }
          return { ...prev, slides };
        });
      }
    } catch (err) {
      console.error("Error al subir imagen base:", err);
      setError("No pudimos subir la foto del producto.");
    } finally {
      setUploadingBaseImage(false);
    }
  };

  // Upload style reference for Mixboard Lab
  const handleUploadStyleReference = async (file: File): Promise<string | void> => {
    if (!user?.uid) return;
    setUploadingBaseImage(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `style_ref_${Date.now()}.${ext}`;
      const storageRef = ref(storage, `social_media_uploads/${user.uid}/${filename}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      if (postType === 'Carrusel') {
        setPosterConfig((prev) => {
          const slides = [...(prev.slides || DEFAULT_POSTER_SLIDES)];
          if (slides[activeSlideIndex]) {
            slides[activeSlideIndex] = {
              ...slides[activeSlideIndex],
              styleReferenceUrl: downloadUrl,
            };
          }
          return { ...prev, slides };
        });
      } else {
        setPosterConfig((prev) => ({ ...prev, styleReferenceUrl: downloadUrl }));
      }
      return downloadUrl;
    } catch (err) {
      console.error("Error al subir referencia de estilo:", err);
      setError("No pudimos subir la imagen de referencia.");
    } finally {
      setUploadingBaseImage(false);
    }
  };

  // Upload templates manual/gallery
  const handleUploadNewTemplate = async (file: File) => {
     setLoadingTemplates(true);
     try {
         const ext = file.name.split('.').pop();
         const filename = `template_${Date.now()}.${ext}`;
         const storageRef = ref(storage, `social_media_uploads/${user?.uid}/${filename}`);
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
          const storageRef = ref(storage, `social_media_uploads/${user?.uid}/${filename}`);
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
                        }
      } catch(err) {
          console.error("Error deleting template:", err);
      }
  };

  // Main Submit Handler (Publish Now or Schedule)
  const handleSubmit = async (e?: React.FormEvent, publishNow = false) => {
    if (e) e.preventDefault();
    setError("");

    // Validación de prueba de 7 días
    if (!isAdmin && isTrialExpired) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Período de prueba de 7 días finalizado",
        message: "Tu prueba gratuita de 7 días ha concluido. Tus redes sociales conectadas y perfiles se mantienen intactos. Para publicar nuevo contenido, activa un plan.",
        onConfirm: () => {
          setStatusModal(prev => ({ ...prev, isOpen: false }));
          router.push("/automatizacion-rrss/panel/planes");
        }
      });
      return;
    }

    // Validación de cuota mensual según el plan activo
    if (!isAdmin && postsThisMonth >= postLimit) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Límite de publicaciones alcanzado",
        message: `Has completado tus ${postsThisMonth} de ${postLimit} publicaciones de este mes. Pasa al Plan PyME Crecimiento ($99.990) para obtener 30 publicaciones mensuales, TikTok, LinkedIn y soporte continuo.`,
        onConfirm: () => {
          setStatusModal(prev => ({ ...prev, isOpen: false }));
          window.open(
            `https://wa.me/56934428848?text=${encodeURIComponent(
              "Hola Santisoft! Completé los 15 posts de mi Plan Esencial y quiero subir al Plan Crecimiento para seguir publicando."
            )}`,
            "_blank"
          );
        }
      });
      return;
    }

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
    // Si es Historia, el texto es un sticker/pie opcional o contexto visual en la imagen, por lo que no debe bloquearse por límite corto de feed
    const isOverLimit = postType !== 'Historia' && currentLength > constraints.safeCharLimit;

    // Warnings block
    if (isOverLimit) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Límite excedido",
        message: `Tu publicación tiene ${currentLength} caracteres y supera el límite de ${constraints.safeCharLimit} caracteres sugerido para las redes seleccionadas.`,
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
          const isCarouselFormat = postType === 'Carrusel';
          const posterSlideUrls = (posterConfig.enabled && posterConfig.slides && isCarouselFormat)
            ? (posterConfig.slides.map(s => s.imageUrl).filter(Boolean) as string[])
            : [];
          const previewUrls = previewSlides.map(s => s.url).filter(Boolean);

          if (isCarouselFormat && posterSlideUrls.length > 1) {
            finalMediaUrls = posterSlideUrls;
          } else if (isCarouselFormat && previewUrls.length > 1) {
            finalMediaUrls = previewUrls;
          } else if (posterConfig.imageUrl) {
            finalMediaUrls = [posterConfig.imageUrl];
          } else if (previewUrls.length > 0) {
            finalMediaUrls = [previewUrls[0]];
          }
          finalCaption = postText;
      }

      const isMultiSlide = postType === 'Carrusel' && finalMediaUrls.length > 1;
      const effectivePostType = (postType === 'Historia' || postType === 'Reel')
        ? postType
        : (isMultiSlide ? 'Carrusel' : postType);
      const effectiveCarouselCount = effectivePostType === 'Carrusel' ? (finalMediaUrls.length || carouselCount || 5) : 1;

      const scheduledDate = showScheduler && date && time ? new Date(`${date}T${time}`) : new Date();

      // Guardar el post en Firebase
      const postPayload: any = {
        userId: user.uid,
        profileId: activeProfile?.id || "default",
        businessType: businessType || "General",
        creationMode,
        idea: creationMode === 'ai' ? idea : "",
        imageExpectation: creationMode === 'ai' ? imageExpectation : "",
        postText: appendContactInfo(finalCaption, { ...activeProfile, website: websiteUrl, includeWebsiteInCopy: attachWebsiteLink }),
        isCopyFinalized: true, // Prevents publish-now from overwriting with generic AI copy
        attachWebsiteLink,
        websiteUrl: attachWebsiteLink ? (websiteUrl.trim() || activeProfile?.website || "") : "",
        postType: effectivePostType,
        type: effectivePostType,
        carouselCount: effectiveCarouselCount,
        networks: Object.entries(networks).filter(([_, isActive]) => isActive).map(([net]) => net),
        imageUrls: finalMediaUrls,
        imageUrl: finalMediaUrls[0] || "",
        videoUrl: isVideoMedia ? (finalMediaUrls[0] || "") : null,
        // Configuración de video y subtítulos
        enhanceWithVoiceAndSubtitles: isVideoMedia ? enhanceVideoWithAi : false,
        includeSubtitles: isVideoMedia ? (enhanceVideoWithAi && includeVideoSubtitles) : false,
        includeVoiceover: isVideoMedia ? (enhanceVideoWithAi && includeVideoVoiceover) : false,
        status: publishNow ? "publishing" : "confirmed",
        scheduledFor: scheduledDate,
        createdAt: new Date(),
        // Si hay cartel
        posterConfig: posterConfig.enabled
          ? {
              ...posterConfig,
              priceText: posterConfig.priceText || "",
              sloganText: posterConfig.sloganText || "",
              mainText: posterConfig.mainText || "",
              ctaText: posterConfig.ctaText || "",
              businessName: posterConfig.businessName || "",
              slides: (posterConfig.slides || []).map((s) => ({
                ...s,
                priceText: s?.priceText || "",
                sloganText: s?.sloganText || "",
                mainText: s?.mainText || "",
                ctaText: s?.ctaText || "",
                imageUrl: s?.imageUrl || "",
                baseImageUrl: s?.baseImageUrl || "",
                role: s?.role || "",
              })),
            }
          : null,
        includeLogo: includeLogo,
        // Estilo Maestro de Prompts IA
        visualStyle: selectedPromptTemplate?.title || null,
        promptTemplateId: selectedPromptTemplate?.id || null,
        previewUrl: selectedPromptTemplate?.previewUrl || null,
        // Foto y contexto de producto del catálogo si fue seleccionado
        baseImageUrl: selectedCatalogoItem?.imageUrl || null,
        catalogoId: selectedCatalogoItem?.id || null,
        catalogoName: selectedCatalogoItem?.name || null,
        keepOriginalPhoto: selectedCatalogoItem ? (selectedCatalogoItem.keepOriginalPhoto !== false) : false,
        fontStyle: selectedCatalogoItem?.fontStyle || "script_handwritten",
        productPrice: selectedCatalogoItem?.offerPrice || selectedCatalogoItem?.price || null,
        productOfferPrice: selectedCatalogoItem?.offerPrice || null,
        productOriginalPrice: selectedCatalogoItem?.price || null,
        // TikTok Direct Post settings
        tiktokPrivacyLevel: tiktokSettings.privacyLevel,
        tiktokAllowComment: tiktokSettings.allowComment,
        tiktokAllowDuet: tiktokSettings.allowDuet,
        tiktokAllowStitch: tiktokSettings.allowStitch,
        tiktokContentDisclosure: tiktokSettings.contentDisclosure,
        tiktokYourBrand: tiktokSettings.yourBrand,
        tiktokBrandedContent: tiktokSettings.brandedContent,
        tiktokIsAigc: tiktokSettings.isAigc,
      };

      const cleanPayload = sanitizeFirestorePayload(postPayload);
      const newPostRef = await addDoc(collection(db, "social_posts"), cleanPayload);

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

  const renderVideoAudioSettings = () => {
    if (!isVideoMedia) return null;
    return (
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-3 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🎙️</span>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Audio y subtítulos del video
            </span>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
            enhanceVideoWithAi 
              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}>
            {enhanceVideoWithAi ? 'Personalizado' : 'Audio original intacto'}
          </span>
        </div>

        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 cursor-pointer transition-all">
          <input
            type="checkbox"
            checked={enhanceVideoWithAi}
            onChange={(e) => {
              const checked = e.target.checked;
              setEnhanceVideoWithAi(checked);
              if (checked) {
                setIncludeVideoSubtitles(true);
                setIncludeVideoVoiceover(true);
              } else {
                setIncludeVideoSubtitles(false);
                setIncludeVideoVoiceover(false);
              }
            }}
            className="mt-0.5 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
          />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-900 leading-snug">
              Superponer subtítulos y voz con nuestros agentes
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">
              {enhanceVideoWithAi 
                ? "Nuestros agentes superpondrán subtítulos y/o locución al publicar el video."
                : "Desmarcado: Tu video se publicará con su audio y subtítulos originales intactos, sin recortarlo ni alterarlo."}
            </p>
          </div>
        </label>

        {enhanceVideoWithAi && (
          <div className="pl-6 pt-2 space-y-2 border-t border-slate-200/80 animate-in fade-in duration-200">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeVideoSubtitles}
                onChange={(e) => setIncludeVideoSubtitles(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">
                Subtítulos animados en pantalla (estilo Alex Hormozi)
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeVideoVoiceover}
                onChange={(e) => setIncludeVideoVoiceover(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">
                Locución y voz en off con nuestros agentes
              </span>
            </label>
          </div>
        )}
      </div>
    );
  };

  if (loadingInitial) return <div className="animate-pulse space-y-4 max-w-2xl"><div className="h-10 bg-slate-200 rounded w-1/3"></div><div className="h-64 bg-slate-200 rounded"></div></div>;
  const needsConnection = !hasFb && !hasIg && !hasLi && !hasTt && !hasGbp && !hasYt && !hasX;

  return (
    <div className="max-w-[1400px] mx-auto lg:mx-0">
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Nueva Publicación</h1>
          <p className="text-slate-500 mt-2 font-medium text-base md:text-lg">Danos una idea y nuestros agentes se encargarán del diseño visual y la estrategia de publicación.</p>
        </div>
        {(previewSlides.length > 0 || selectedTemplate) && (
          <button
            onClick={() => {
              setIdea("");
              setImageExpectation("");
              setPostText("");
              setManualCaption("");
              setBaseImageUrl("");
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

      {isTrialExpired ? (
        <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-300 rounded-[28px] animate-in slide-in-from-top-4 shadow-sm flex items-start gap-4">
           <div className="text-3xl">🔒</div>
           <div className="flex-1">
              <h3 className="text-orange-950 font-black tracking-tight text-base">Prueba de 7 días finalizada</h3>
              <p className="text-orange-900/80 font-medium text-sm mt-1">
                Tu período de prueba gratuita de 7 días ha concluido. Tus redes sociales conectadas y configuraciones siguen guardadas intactas, pero necesitas activar un plan para generar o publicar nuevo contenido.
              </p>
              <div className="mt-3">
                <Link href="/automatizacion-rrss/panel/planes" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl font-bold text-xs shadow hover:opacity-95 transition">
                  Ver Planes Disponibles →
                </Link>
              </div>
           </div>
        </div>
      ) : quotaExceeded ? (
        <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-200 rounded-[28px] animate-in slide-in-from-top-4 shadow-sm flex items-start gap-4">
           <div className="text-3xl">⚠️</div>
           <div>
              <h3 className="text-rose-900 font-black tracking-tight">Límite Mensual Alcanzado ({postsThisMonth} Publicaciones)</h3>
              <p className="text-rose-700/80 font-medium text-sm mt-1">Has consumido todas tus publicaciones automáticas del mes. Podrás guardar esta nueva idea como <b>Borrador</b>, pero el bot no la publicará hasta tu próximo ciclo mensual o hasta que <Link href="/automatizacion-rrss/panel/planes" className="underline font-bold text-rose-600 hover:text-rose-800">mejores tu plan actual</Link>.</p>
           </div>
        </div>
      ) : null}

      {/* Selector de Modo / Stepper Asistente en 3 Pasos */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto flex-1 max-w-xl">
          <button
            type="button"
            onClick={() => setWizardStep(1)}
            className={`flex-1 py-2 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              wizardStep === 1
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${wizardStep === 1 ? "bg-white text-orange-600" : "bg-slate-100 text-slate-700"}`}>1</span>
            <span>Idea y Canales</span>
          </button>

          <span className="text-slate-300 font-bold">›</span>

          <button
            type="button"
            onClick={() => setWizardStep(2)}
            className={`flex-1 py-2 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              wizardStep === 2
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${wizardStep === 2 ? "bg-white text-orange-600" : "bg-slate-100 text-slate-700"}`}>2</span>
            <span>Diseño y Copy</span>
          </button>

          <span className="text-slate-300 font-bold">›</span>

          <button
            type="button"
            onClick={() => setWizardStep(3)}
            className={`flex-1 py-2 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              wizardStep === 3
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${wizardStep === 3 ? "bg-white text-orange-600" : "bg-slate-100 text-slate-700"}`}>3</span>
            <span>Revisar y Programar</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsExpertMode(!isExpertMode)}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-100 border border-slate-200"
        >
          {isExpertMode ? "⚡ Modo Paso a Paso" : "⚙️ Vista Completa"}
        </button>
      </div>

      {/* 1. SECCIÓN SUPERIOR: SELECTOR DE FLUJO VISUAL (VIÑETAS UNIFICADAS - PASO 2) */}
      {(isExpertMode || wizardStep === 2) && (
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
            ¿Qué tipo de publicación deseas crear hoy?
          </label>
          <button
            type="button"
            onClick={() => setGuideModalFlow(activeCreationFlow)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 px-3 py-1 rounded-full shadow-2xs"
          >
            <span>💡</span>
            <span>¿Cómo funciona cada modo?</span>
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Viñeta 1: Publicación Estándar */}
          <button
            type="button"
            onClick={() => {
              setActiveCreationFlow('estandar');
              setPosterConfig((prev) => ({ ...prev, enabled: false, isLabMode: false }));
            }}
            className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
              activeCreationFlow === 'estandar'
                ? "border-orange-500 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/30 shadow-md ring-2 ring-orange-500/20"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">Publicación Estándar</h3>
                    <p className={`text-[11px] font-bold ${activeCreationFlow === 'estandar' ? "text-orange-700" : "text-slate-500"}`}>
                      Imagen limpia, Carrusel, Historia o Reel
                    </p>
                  </div>
                </div>
                {activeCreationFlow === 'estandar' ? (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-orange-600 text-white px-2.5 py-1 rounded-full shadow-xs shrink-0">
                    Flujo Activo
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                    Seleccionar
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Diseños fotográficos, conceptuales o animados sin textos montados sobre la imagen. El mensaje persuasivo y hashtags van redactados directamente en el copy de tu publicación.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">Paso a paso y ejemplos</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setGuideModalFlow('estandar');
                }}
                className="inline-flex items-center gap-1 text-[11px] font-black text-orange-700 bg-white hover:bg-orange-50 border border-indigo-200 px-3 py-1.5 rounded-xl shadow-2xs transition-all hover:scale-102 cursor-pointer"
              >
                <span>💡</span>
                <span>¿Cómo funciona?</span>
              </span>
            </div>
          </button>

          {/* Viñeta 2: Afiche / Diseño con Textos */}
          <button
            type="button"
            onClick={() => {
              setActiveCreationFlow('afiche');
              setPosterConfig((prev) => ({
                ...prev,
                enabled: true,
                isLabMode: false,
                includeBusinessName: prev.includeBusinessName || true,
                businessName: prev.businessName || activeProfile?.name || "",
                includeMainText: prev.includeMainText || true,
                mainText: prev.mainText || idea || "",
              }));
            }}
            className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
              activeCreationFlow === 'afiche'
                ? "border-amber-500 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30 shadow-md ring-2 ring-amber-500/20"
                : "border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">Afiche / Diseño con Textos</h3>
                    <p className={`text-[11px] font-bold ${activeCreationFlow === 'afiche' ? "text-amber-800" : "text-slate-500"}`}>
                      Flyer comercial con capas de texto y precios
                    </p>
                  </div>
                </div>
                {activeCreationFlow === 'afiche' ? (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-600 text-white px-2.5 py-1 rounded-full shadow-xs shrink-0">
                    Flujo Activo
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                    Cartel Comercial
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Diseños publicitarios con textos tipográficos sobre la imagen, titulares de oferta, precios y llamadas a la acción directamente sobre el diseño visual.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-100/70 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">Paso a paso y ejemplos</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setGuideModalFlow('afiche');
                }}
                className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-white hover:bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shadow-2xs transition-all hover:scale-102 cursor-pointer"
              >
                <span>💡</span>
                <span>¿Cómo funciona?</span>
              </span>
            </div>
          </button>

          {/* Viñeta 3: Laboratorio (Mixboard) */}
          <button
            type="button"
            onClick={() => {
              setActiveCreationFlow('laboratorio');
              setPosterConfig((prev) => ({
                ...prev,
                enabled: true,
                isLabMode: true,
                includeBusinessName: prev.includeBusinessName || true,
                businessName: prev.businessName || activeProfile?.name || "",
                includeMainText: prev.includeMainText || true,
                mainText: prev.mainText || idea || "",
              }));
            }}
            className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
              activeCreationFlow === 'laboratorio'
                ? "border-purple-500 bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/30 shadow-md ring-2 ring-purple-500/20"
                : "border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🧪</span>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">Laboratorio (Mixboard)</h3>
                    <p className={`text-[11px] font-bold ${activeCreationFlow === 'laboratorio' ? "text-purple-800" : "text-slate-500"}`}>
                      Fusión multi-imagen, blueprints y retoque
                    </p>
                  </div>
                </div>
                {activeCreationFlow === 'laboratorio' ? (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-purple-600 text-white px-2.5 py-1 rounded-full shadow-xs shrink-0">
                    Flujo Activo
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">
                    Mixboard Lab
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Diseño comercial avanzado con arquitectura Mixboard: blueprints con grillas y tipografía exacta, fusión de producto real con referencias de estilo y retoque en vivo.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-100/70 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">Paso a paso y ejemplos</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setGuideModalFlow('laboratorio');
                }}
                className="inline-flex items-center gap-1 text-[11px] font-black text-purple-800 bg-white hover:bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl shadow-2xs transition-all hover:scale-102 cursor-pointer"
              >
                <span>💡</span>
                <span>¿Cómo funciona?</span>
              </span>
            </div>
          </button>
        </div>
      </div>
      )}

      {/* 2. CARD UNIFICADA: REDES SOCIALES Y TIPO DE PUBLICACIÓN (PASO 1) */}
      {(isExpertMode || wizardStep === 1) && (
      <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs mb-8 space-y-6">
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Lado Izquierdo: Redes Sociales a Publicar */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span>🌐</span> Redes de Destino
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {Object.values(networks).filter(Boolean).length} activas
              </span>
            </div>

            {needsConnection ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-semibold leading-relaxed">
                ⚠️ No tienes cuentas vinculadas. Ve a la sección de{" "}
                <Link href="/automatizacion-rrss/panel/configuracion" className="underline font-bold text-amber-900">
                  Conexiones
                </Link>{" "}
                para enlazar tus redes.
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Facebook */}
                {hasFb && (
                  <button
                    type="button"
                    onClick={() => setNetworks((prev: any) => ({ ...prev, facebook: !prev.facebook }))}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      networks.facebook
                        ? "bg-[#1877F2] text-white scale-105 shadow-md shadow-blue-500/20"
                        : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100 border border-slate-200"
                    }`}
                    title="Facebook"
                  >
                    <FaFacebookF />
                  </button>
                )}

                {/* Instagram */}
                {hasIg && (
                  <button
                    type="button"
                    onClick={() => setNetworks((prev: any) => ({ ...prev, instagram: !prev.instagram }))}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      networks.instagram
                        ? "text-white scale-105 shadow-md shadow-pink-500/20"
                        : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100 border border-slate-200"
                    }`}
                    style={
                      networks.instagram
                        ? {
                            background:
                              "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                          }
                        : {}
                    }
                    title="Instagram"
                  >
                    <FaInstagram className="text-xl" />
                  </button>
                )}

                {/* LinkedIn */}
                {hasLi && (
                  (() => {
                    const allowed = isAdmin || isPlatformAllowed(userPlan, "linkedin");
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (!allowed) {
                            window.open(
                              `https://wa.me/56934428848?text=${encodeURIComponent(
                                "Hola Santisoft! Quiero activar LinkedIn en mis publicaciones. ¿Cómo puedo subir al Plan Crecimiento?"
                              )}`,
                              "_blank"
                            );
                            return;
                          }
                          setNetworks((prev: any) => ({ ...prev, linkedin: !prev.linkedin }));
                        }}
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition-all relative cursor-pointer ${
                          !allowed
                            ? "bg-slate-100 text-slate-400 border border-dashed border-slate-300 opacity-60"
                            : networks.linkedin
                            ? "bg-[#0077b5] text-white scale-105 shadow-md shadow-[#0077b5]/20"
                            : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100 border border-slate-200"
                        }`}
                        title={!allowed ? "LinkedIn: Disponible en Plan PyME Crecimiento (Click para activar)" : "LinkedIn"}
                      >
                        <FaLinkedinIn />
                        {!allowed && (
                          <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 text-[8px] font-black px-1 rounded-full shadow-xs">
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
                    const allowed = isAdmin || isPlatformAllowed(userPlan, "tiktok");
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (!allowed) {
                            window.open(
                              `https://wa.me/56934428848?text=${encodeURIComponent(
                                "Hola Santisoft! Quiero activar TikTok en mis publicaciones. ¿Cómo puedo subir al Plan Crecimiento?"
                              )}`,
                              "_blank"
                            );
                            return;
                          }
                          setNetworks((prev: any) => ({ ...prev, tiktok: !prev.tiktok }));
                        }}
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition-all relative cursor-pointer ${
                          !allowed
                            ? "bg-slate-100 text-slate-400 border border-dashed border-slate-300 opacity-60"
                            : networks.tiktok
                            ? "bg-black text-white scale-105 shadow-md shadow-black/20"
                            : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100 border border-slate-200"
                        }`}
                        title={!allowed ? "TikTok: Disponible en Plan PyME Crecimiento (Click para activar)" : "TikTok"}
                      >
                        <FaTiktok />
                        {!allowed && (
                          <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 text-[8px] font-black px-1 rounded-full shadow-xs">
                            🔒
                          </span>
                        )}
                      </button>
                    );
                  })()
                )}

                {/* Google Business */}
                {hasGbp && (
                  <button
                    type="button"
                    onClick={() => setNetworks((prev: any) => ({ ...prev, googleBusiness: !prev.googleBusiness }))}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      networks.googleBusiness
                        ? "bg-[#EA4335] text-white scale-105 shadow-md shadow-[#EA4335]/20"
                        : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100 border border-slate-200"
                    }`}
                    title="Google Business Profile"
                  >
                    <FaGoogle />
                  </button>
                )}

                {/* YouTube */}
                {hasYt && (
                  <button
                    type="button"
                    onClick={() => setNetworks((prev: any) => ({ ...prev, youtube: !prev.youtube }))}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      networks.youtube
                        ? "bg-[#FF0000] text-white scale-105 shadow-md shadow-red-500/20"
                        : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100 border border-slate-200"
                    }`}
                    title="YouTube Shorts"
                  >
                    <FaYoutube />
                  </button>
                )}

                {/* X / Twitter */}
                {hasX && (
                  <button
                    type="button"
                    onClick={() => setNetworks((prev: any) => ({ ...prev, x: !prev.x }))}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      networks.x
                        ? "bg-black text-white scale-105 shadow-md shadow-black/20"
                        : "bg-slate-100 text-slate-400 opacity-60 hover:opacity-100 border border-slate-200"
                    }`}
                    title="X (Twitter)"
                  >
                    <FaTwitter />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Lado Derecho: Tipo y Formato de Publicación */}
          <div className="lg:col-span-6 space-y-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:border-slate-100 lg:pl-6">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span>📐</span> Formato de Publicación
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-orange-700 border border-indigo-200">
                {postType}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(["Post", "Historia", "Carrusel", "Reel"] as const).map((type) => {
                const isReelDisabledByPlan = type === "Reel" && !(videoLimit > 0 || isAdmin);
                const disabled = (networks.tiktok && type !== "Reel") || isReelDisabledByPlan;
                const isSelected = postType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setPostType(type);
                      if (type === "Carrusel") {
                        if (carouselCount < 2) setCarouselCount(5);
                        setPosterConfig((prev) => ({ ...prev, orientation: "square", aspectRatio: "1:1" }));
                      } else if (type === "Historia") {
                        setPosterConfig((prev) => ({ ...prev, orientation: "vertical", aspectRatio: "9:16" }));
                      } else if (type === "Post") {
                        setPosterConfig((prev) => ({ ...prev, orientation: "square", aspectRatio: "1:1" }));
                      } else if (type === "Reel") {
                        setPosterConfig((prev) => ({ ...prev, orientation: "vertical", aspectRatio: "9:16" }));
                      }
                    }}
                    className={`py-2.5 px-1.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      disabled
                        ? "opacity-40 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : isSelected
                        ? "border-orange-600 bg-indigo-50/90 text-indigo-950 shadow-sm ring-2 ring-orange-500/20"
                        : "border-slate-200 bg-slate-50/70 text-slate-600 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <span className="text-xl">
                      {type === "Post" ? "🖼️" : type === "Historia" ? "📱" : type === "Carrusel" ? "📑" : "🎬"}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      {type}
                      {isReelDisabledByPlan && <span className="text-[9px]">🔒</span>}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 leading-none">
                      {type === "Post" ? "1:1 cuadrado" : type === "Historia" ? "9:16 vertical" : type === "Carrusel" ? "1:1 cuadrado" : "9:16 vertical"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Control de Audio y Subtítulos cuando es Video / Reel */}
            {isVideoMedia && (
              <div className="pt-2 animate-in fade-in duration-300">
                {renderVideoAudioSettings()}
              </div>
            )}
          </div>
        </div>

        {/* ── SECCIÓN EXPANDIDA: PLANIFICADOR DE CARRUSEL (1 A 5 SLIDES VISIBLES 1 POR 1) ── */}
        {postType === "Carrusel" && (
          <div className="border-t border-slate-100 pt-5 space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>📑</span> Planificador de Carrusel ({carouselCount} Diapositivas)
                </h4>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Estructura secuencial para capturar la atención, conectar con el cliente y cerrar con una oferta clara.
                </p>
              </div>

              {/* Selector de cantidad de slides con botones 2 a 5 */}
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1.5">
                  Slides:
                </span>
                {[2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      setCarouselCount(cnt);
                      if (activeSlideIndex >= cnt) {
                        setActiveSlideIndex(cnt - 1);
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      carouselCount === cnt
                        ? "bg-orange-600 text-white shadow-sm scale-102"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {cnt} {cnt === 5 ? "★" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de 5 Diapositivas 1 por 1 Visible */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
              {Array.from({ length: carouselCount }).map((_, idx) => {
                const roleInfo = CAROUSEL_DEFAULT_SLIDES[idx] || {
                  emoji: "📑",
                  role: `Diapositiva ${idx + 1}`,
                  desc: "Contenido del slide",
                  placeholder: "Detalles del slide..."
                };
                const isSelected = activeSlideIndex === idx;
                const slideData = posterConfig.slides?.[idx];
                const previewText = slideData?.mainText || (idx === 0 ? idea : "");

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setActiveSlideIndex(idx);
                      const targetSlide = posterConfig.slides?.[idx];
                      if (targetSlide) {
                        setPosterConfig((prev) => ({
                          ...prev,
                          activeSlideIndex: idx,
                          mainText: targetSlide?.mainText ?? "",
                          priceText: targetSlide?.priceText ?? "",
                          sloganText: targetSlide?.sloganText ?? "",
                          ctaText: targetSlide?.ctaText || prev.ctaText,
                        }));
                        setImageExpectation(targetSlide?.imageExpectation ?? "");
                        if (targetSlide?.baseImageUrl !== undefined) {
                          setBaseImageUrl(targetSlide.baseImageUrl);
                        }
                      } else {
                        setImageExpectation("");
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative overflow-hidden group ${
                      isSelected
                        ? "border-orange-600 bg-indigo-50/70 shadow-md ring-2 ring-orange-500/20"
                        : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-orange-200 hover:shadow-xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs flex items-center gap-1">
                          <span>{roleInfo.emoji}</span> Slide {idx + 1}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-orange-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs font-black text-slate-900 leading-tight mb-1">
                        {roleInfo.role}
                      </h5>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        {roleInfo.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                      <div className="text-[10px] text-slate-400 font-bold truncate">
                        {previewText ? (
                          <span className="text-slate-800 font-semibold italic">"{previewText}"</span>
                        ) : (
                          <span className="text-slate-400 font-medium">Click para redactar...</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-[10px] font-bold ${isSelected ? "text-orange-600 underline" : "text-slate-500 group-hover:text-orange-600"}`}>
                          {isSelected ? "Editando ✍️" : "Seleccionar →"}
                        </span>
                        {slideData?.priceText && (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            🏷️ Precio
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Botón de avance al Paso 2 si estamos en el Paso 1 */}
      {!isExpertMode && wizardStep === 1 && (
        <div className="mb-10 flex justify-end">
          <button
            type="button"
            onClick={() => setWizardStep(2)}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
          >
            <span>Continuar a Paso 2: Diseño y Estilo</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* 3. SECCIÓN MEDIA: SEGÚN FLUJO ACTIVO (SOLO PASO 2 O MODO EXPERTO, Y PASO 3 DISEÑO FINAL) */}
      {!openEditorParam && !isExpertMode && wizardStep === 3 && !hasMedia && !previewLoading && (
        <div className="mb-10 bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center max-w-xl mx-auto space-y-4 shadow-xs">
          <div className="text-5xl">🎨</div>
          <h3 className="text-lg font-black text-slate-900">Aún no tienes un diseño listo para publicar</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            En este paso verás el diseño final de tu publicación listo para agendar o publicar. Primero genera tu imagen con nuestros agentes o elige un archivo en el Paso 2.
          </p>
          <button
            type="button"
            onClick={() => setWizardStep(2)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>← Ir al Paso 2: Diseño y Copy</span>
          </button>
        </div>
      )}

      {!openEditorParam && (isExpertMode || wizardStep === 2 || (wizardStep === 3 && (hasMedia || previewLoading))) && (
        (activeCreationFlow === 'afiche' || activeCreationFlow === 'laboratorio') && (isExpertMode || wizardStep === 2) ? (
          <div className="mb-10">
            <PosterFormView
              userPlan={userPlan}
              posterConfig={posterConfig}
              setPosterConfig={setPosterConfig}
              idea={idea}
              setIdea={setIdea}
              imageExpectation={imageExpectation}
              setImageExpectation={setImageExpectation}
              postText={postText}
              setPostText={setPostText}
              baseImageUrl={baseImageUrl}
              setBaseImageUrl={setBaseImageUrl}
              onUploadBaseImage={handleUploadBaseImage}
              uploadingBaseImage={uploadingBaseImage}
              networks={networks}
              setNetworks={setNetworks}
              hasFb={hasFb}
              hasIg={hasIg}
              hasLi={hasLi}
              hasTt={hasTt}
              hasGbp={hasGbp}
              hasYt={hasYt}
              hasX={hasX}
              needsConnection={needsConnection}
              activeProfile={activeProfile}
              userLogo={userLogo}
              previewLoading={previewLoading || promptLoading}
              improveLoading={improveLoading}
              handleGeneratePreview={handleGeneratePreview}
              handleImproveWithAI={handleImproveWithAI}
              isAdmin={isAdmin}
              catalogoItems={catalogoItems}
              selectedCatalogoItem={selectedCatalogoItem}
              setSelectedCatalogoItem={setSelectedCatalogoItem}
              postType={postType}
              carouselCount={carouselCount}
              activeSlideIndex={activeSlideIndex}
              setActiveSlideIndex={setActiveSlideIndex}
              previewSlides={previewSlides}
              onOpenPostModal={openFinalPostModal}
              isReadyToPost={Boolean(isReady)}
              isLabMode={activeCreationFlow === 'laboratorio'}
              onApplyLiveRetouch={(sIdx, inst) => handleRetouchImage(sIdx, inst)}
              onUploadStyleReference={handleUploadStyleReference}
            />
          </div>
        ) : (
                <div className="grid lg:grid-cols-12 gap-8 items-start mb-10">
          {/* Columna Izquierda: Formulario creativo (SOLO visible en Paso 2 o Modo Experto) */}
          {(isExpertMode || wizardStep === 2) && (
          <div className="lg:col-span-7 space-y-6 w-full">

            {/* ── Selector de Producto/Servicio del Catálogo ── */}
            {catalogoItems.length > 0 && (
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-xs">
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-3">
                  🛍️ Sobre un producto / servicio (opcional)
                </label>
                <select
                  value={selectedCatalogoItem?.id || ""}
                  onChange={(e) => {
                    const found = catalogoItems.find((i: any) => i.id === e.target.value);
                    setSelectedCatalogoItem(found || null);
                    if (found && !idea) setIdea(found.name);
                    if (found?.imageUrl) setBaseImageUrl(found.imageUrl);
                  }}
                  className="w-full border-2 border-slate-200 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none bg-white"
                >
                  <option value="">— Ninguno (post general) —</option>
                  {catalogoItems.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.type === "producto" ? "📦" : "⚙️"} {item.name}{item.offerPrice ? ` · PROMO ${item.offerPrice}` : item.price ? ` · ${item.price}` : ""}
                    </option>
                  ))}
                </select>
                {selectedCatalogoItem && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    {selectedCatalogoItem.imageUrl && (
                      <img src={selectedCatalogoItem.imageUrl} alt={selectedCatalogoItem.name} className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-black text-slate-800">{selectedCatalogoItem.name}</p>
                        {selectedCatalogoItem.offerPrice ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                            PROMO {selectedCatalogoItem.offerPrice}
                          </span>
                        ) : selectedCatalogoItem.price ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                            {selectedCatalogoItem.price}
                          </span>
                        ) : null}
                        {selectedCatalogoItem.keepOriginalPhoto !== false && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span>📸</span> Foto Real Intacta
                          </span>
                        )}
                        {selectedCatalogoItem.includePriceInCopy !== false && (selectedCatalogoItem.price || selectedCatalogoItem.offerPrice) && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200">
                            🏷️ Precio en Copy
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium line-clamp-2 mt-0.5">{selectedCatalogoItem.description}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Formulario de Contenido / Prompt / Estilos / Copy / Botón Previsualizar */}
            <PostConfigForm 
              userPlan={userPlan}
              idea={idea} setIdea={setIdea}
              imageExpectation={imageExpectation} setImageExpectation={setImageExpectation}
              imageStyle={imageStyle} setImageStyle={setImageStyle}
              selectedPromptTemplate={selectedPromptTemplate}
              setSelectedPromptTemplate={setSelectedPromptTemplate}
              postText={postText} setPostText={setPostText}
              postType={postType} setPostType={setPostType}
              hideSubmit={true}
              carouselCount={carouselCount} setCarouselCount={setCarouselCount}
              businessType={businessType} setBusinessType={setBusinessType}
              date={date} setDate={setDate}
              time={time} setTime={setTime}
              networks={networks} setNetworks={setNetworks}
              tiktokSettings={tiktokSettings} setTiktokSettings={setTiktokSettings}
              attachWebsiteLink={attachWebsiteLink} setAttachWebsiteLink={setAttachWebsiteLink}
              websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl}
              baseImageUrl={baseImageUrl} setBaseImageUrl={setBaseImageUrl}
              onUploadBaseImage={handleUploadBaseImage}
              uploadingBaseImage={uploadingBaseImage}
              hasFb={hasFb} hasIg={hasIg} hasLi={hasLi} hasTt={hasTt} hasGbp={hasGbp} hasYt={hasYt} hasX={hasX}
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
              hideNetworksAndType={true}
            />

            {/* Parámetros Adicionales: Enlace Web y Rubro del Negocio */}
            <PostConfigForm 
              userPlan={userPlan}
              idea={idea} setIdea={setIdea}
              imageExpectation={imageExpectation} setImageExpectation={setImageExpectation}
              imageStyle={imageStyle} setImageStyle={setImageStyle}
              selectedPromptTemplate={selectedPromptTemplate}
              setSelectedPromptTemplate={setSelectedPromptTemplate}
              postText={postText} setPostText={setPostText}
              postType={postType} setPostType={setPostType}
              hideSubmit={true}
              carouselCount={carouselCount} setCarouselCount={setCarouselCount}
              businessType={businessType} setBusinessType={setBusinessType}
              date={date} setDate={setDate}
              time={time} setTime={setTime}
              networks={networks} setNetworks={setNetworks}
              tiktokSettings={tiktokSettings} setTiktokSettings={setTiktokSettings}
              attachWebsiteLink={attachWebsiteLink} setAttachWebsiteLink={setAttachWebsiteLink}
              websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl}
              baseImageUrl={baseImageUrl} setBaseImageUrl={setBaseImageUrl}
              onUploadBaseImage={handleUploadBaseImage}
              uploadingBaseImage={uploadingBaseImage}
              hasFb={hasFb} hasIg={hasIg} hasLi={hasLi} hasTt={hasTt} hasGbp={hasGbp} hasYt={hasYt} hasX={hasX}
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
              posterConfig={posterConfig}
              setPosterConfig={setPosterConfig}
              renderSection="parameters"
              hideAI={hideAIParam}
              hideNetworksAndType={true}
              hideCreationMode={true}
            />

            {/* Controles de avance al Paso 3 en Modo Asistente */}
            {!isExpertMode && wizardStep === 2 && (
              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 py-2.5 px-3 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  ← Volver al Paso 1
                </button>
                {hasMedia && (
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Paso 3: Revisar y Programar</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            )}
          </div>
          )}

          {/* Columna Derecha: En Paso 2 ocupa 5 cols; en Paso 3 ocupa el centro completo con el Diseño Final y Copy */}
          <div className={`${!isExpertMode && wizardStep === 3 ? "lg:col-span-8 lg:col-start-3" : "lg:col-span-5"} space-y-5 w-full sticky top-6`}>
            {!isExpertMode && wizardStep === 3 && (
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-xl hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  ← Volver al Paso 2 (Modificar Diseño o Copy)
                </button>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  ✅ Paso 3: Diseño Final Listo
                </span>
              </div>
            )}
            {/* Card Modo de Creación (SOLO en Paso 2 o Modo Experto) */}
            {(isExpertMode || wizardStep === 2) && (
            <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-4 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🛠️</span> Modo de Creación
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {creationMode === 'ai' ? 'Diseño automatizado por agentes' : 'Sube o elige tu propio diseño'}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCreationMode('ai')}
                    className={`py-1.5 px-3 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      creationMode === 'ai'
                        ? 'bg-white text-orange-700 shadow-xs border border-slate-200/70'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>🤖</span> Agentes
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('manual')}
                    className={`py-1.5 px-3 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      creationMode === 'manual'
                        ? 'bg-white text-orange-700 shadow-xs border border-slate-200/70'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>📥</span> Manual
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* PREVISUALIZACIÓN DE LA IMAGEN EN VIVO DIRECTAMENTE AL COSTADO DERECHO */}
            <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👁️</span>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Previsualización en Vivo
                  </h4>
                </div>
                {previewSlides.length > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {previewSlides.length > 1 ? `${previewSlides.length} Láminas` : 'Diseño Listo'}
                  </span>
                )}
              </div>

              {creationMode === 'manual' ? (
                selectedTemplate ? (
                  <div className="space-y-4 animate-in fade-in duration-300 w-full">
                    {previewLoading ? (
                      <div className="p-8 bg-slate-50 border border-slate-200 rounded-[28px] text-center flex flex-col items-center justify-center min-h-[260px] text-indigo-750 shadow-xs animate-pulse w-full">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3 mx-auto"></div>
                        <h4 className="font-black text-sm mb-1 uppercase tracking-widest">Procesando Diseño...</h4>
                        <p className="font-medium text-xs max-w-xs mx-auto leading-relaxed text-indigo-500">Nuestros agentes aplican cambios a tu imagen.</p>
                      </div>
                    ) : selectedTemplate.type === 'video' || selectedTemplate.url.match(/\.(mp4|mov|webm|quicktime)/i) || selectedTemplate.url.includes("video") ? (
                      <div className="p-4 bg-slate-50 rounded-[24px] border-2 border-slate-100 space-y-4 shadow-sm w-full">
                        <div className="aspect-[9/16] max-h-[48vh] rounded-[20px] overflow-hidden bg-black border-2 border-white shadow-md relative group mx-auto flex items-center justify-center">
                          <video src={selectedTemplate.url} autoPlay loop muted playsInline controls className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Copy para Redes</label>
                          <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 text-xs font-medium leading-relaxed italic">
                            "{manualCaption || 'Escribe el texto que acompañará tu video...'}"
                          </div>
                        </div>
                        {renderVideoAudioSettings()}
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
                          aspectRatio={postType === 'Historia' || postType === 'Reel' ? '9:16' : '1:1'}
                        />
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={openFinalPostModal}
                      disabled={loading || !isReady} 
                      title={!isReady ? "Falta agregar el copy de la publicación" : ""}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black text-sm py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 cursor-pointer"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (!isReady ? '⚠️ POSTEAR (Falta Copy)' : '🚀 POSTEAR')}
                    </button>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-indigo-200 rounded-[28px] text-center flex flex-col items-center justify-center min-h-[260px] text-indigo-400 bg-indigo-50/20 transition-all w-full">
                    <div className="text-4xl mb-2 opacity-80">📸</div>
                    <h4 className="font-black text-sm mb-1 text-orange-700">Galería Manual Activa</h4>
                    <p className="font-medium text-xs max-w-xs leading-relaxed text-slate-500">
                      Selecciona un diseño de la galería manual a la izquierda o sube uno nuevo para previsualizarlo aquí.
                    </p>
                  </div>
                )
              ) : previewSlides.length > 0 ? (
                postType === 'Reel' ? (
                  <div className="space-y-4 animate-in fade-in duration-300 w-full">
                    <div className="p-6 text-center flex flex-col items-center justify-center min-h-[280px] bg-slate-50/60 border border-slate-200 rounded-[28px] shadow-xs w-full">
                      {previewSlides[0]?.url && !previewSlides[0].url.match(/\.(mp4|mov|webm|quicktime)/i) ? (
                        <div className="aspect-[9/16] w-full max-w-[150px] rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-md relative mb-4">
                          <img src={previewSlides[0].url} alt="Cover Reference" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="text-5xl mb-4 opacity-80">🎬</div>
                      )}
                      <h4 className="font-black text-base mb-1 text-slate-800 tracking-tight">Reel en Producción</h4>
                      <p className="font-medium text-slate-500 text-xs max-w-xs leading-relaxed mb-4">
                        Hemos generado tu portada, prompt de animación y locución de audio.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowReelWorkspace(true)}
                        className="w-full max-w-xs bg-orange-600 hover:bg-orange-700 text-white font-black text-xs py-3 px-5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        🎬 Abrir Espacio de Producción
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    <CarouselWizard 
                      slides={previewSlides}
                      onUpdateSlide={updateSlideFinalUrl}
                      userLogo={userLogo}
                      userId={user?.uid}
                      forceOpenEditor={openEditorParam}
                      aspectRatio={postType === 'Historia' || postType === 'Reel' ? '9:16' : '1:1'}
                    />
                    {!isExpertMode && wizardStep === 3 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                            ✍️ Texto Final de la Publicación (Copy)
                          </label>
                          <button
                            type="button"
                            onClick={handleImproveWithAI}
                            disabled={improveLoading}
                            className="text-[10px] font-black text-orange-600 hover:underline cursor-pointer"
                          >
                            {improveLoading ? "Mejorando..." : "✨ Mejorar texto con nuestros agentes"}
                          </button>
                        </div>
                        <textarea
                          value={postText}
                          onChange={(e) => setPostText(e.target.value)}
                          rows={4}
                          placeholder="Escribe o edita el texto final que acompañará tu publicación..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:border-orange-500"
                        />
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={openFinalPostModal}
                      disabled={loading || !isReady} 
                      title={!isReady ? "Falta agregar el copy de la publicación" : ""}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black text-sm py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 cursor-pointer"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (!isReady ? '⚠️ POSTEAR (Falta Copy)' : '🚀 POSTEAR')}
                    </button>
                  </div>
                )
              ) : previewLoading ? (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-[28px] text-center flex flex-col items-center justify-center min-h-[260px] text-indigo-750 shadow-xs animate-pulse w-full">
                  <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                  <h4 className="font-black text-sm mb-1 uppercase tracking-widest">Generando Diseño...</h4>
                  <p className="font-medium text-xs max-w-xs leading-relaxed text-indigo-500">Nuestros agentes componen tus imágenes y copys en alta resolución.</p>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-[28px] text-center flex flex-col items-center justify-center min-h-[280px] text-slate-400 bg-slate-50/40 w-full">
                  <div className="text-4xl mb-3 opacity-60">🖼️</div>
                  <h4 className="font-black text-sm mb-1 text-slate-700">Previsualización del Diseño</h4>
                  <p className="font-medium text-xs max-w-xs leading-relaxed text-slate-500">
                    Describe tu idea a la izquierda y pulsa <b>Previsualizar</b> para ver tu diseño aquí al costado en tiempo real.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        )
      )}

      {/* 3. SECCIÓN INFERIOR: ÁREA DE VISUALIZACIÓN (Solo si no es afiche/laboratorio, donde ya se ve en la card de Composición) */}
      {!openEditorParam && (activeCreationFlow === 'afiche' || activeCreationFlow === 'laboratorio' || activeCreationFlow === 'estandar') ? null : (
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
                           <p className="font-medium text-xs max-w-xs mx-auto leading-relaxed text-indigo-500">Nuestros agentes aplican cambios a tu imagen. Esto puede tomar unos segundos.</p>
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
                            {renderVideoAudioSettings()}
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
                         onClick={openFinalPostModal}
                         disabled={loading || !isReady} 
                         title={!isReady ? "Falta agregar el copy de la publicación" : ""}
                         className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black text-[16px] py-4 rounded-[20px] transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 hover:-translate-y-1"
                       >
                          {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : (!isReady ? '⚠️ POSTEAR (Falta Copy)' : '🚀 POSTEAR')}
                       </button>
                    </div>
                </div>
            ) : (
                <div className="p-8 border-4 border-dashed border-indigo-100 rounded-[32px] text-center flex flex-col items-center justify-center min-h-[300px] text-indigo-400 bg-indigo-50/20 transition-all w-full">
                  <div className="text-6xl mb-4 opacity-80">📸</div>
                  <h4 className="font-black text-lg mb-2 text-orange-700">Galería Manual Activa</h4>
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
                     className="w-full max-w-xs bg-orange-600 hover:bg-orange-700 text-white font-black text-sm py-4 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                   >
                     🎬 Abrir Espacio de Producción
                   </button>
                 </div>
               </div>
            ) : (
                 <div className="w-full max-w-xl mx-auto space-y-6">
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
                       onClick={openFinalPostModal}
                       disabled={loading || !isReady} 
                       title={!isReady ? "Falta agregar el copy de la publicación" : ""}
                       className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black text-[16px] py-4 rounded-[20px] transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 hover:-translate-y-1"
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
      )}

      <AIOptionsModal 
        isOpen={showOptionsModal}
        options={aiOptions}
        onSelect={(opt) => {
            const optWithContact = appendContactInfo(opt);
            if (creationMode === 'ai') setPostText(optWithContact);
            else setManualCaption(optWithContact);
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
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Propuesta de nuestros agentes</h3>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">Revisión de Estilo Visual</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Esto es lo que diseñaremos para ti:</h4>
              <textarea 
                value={editablePromptSpanish}
                onChange={(e) => setEditablePromptSpanish(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-700 text-sm font-semibold leading-relaxed focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none shadow-sm"
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
                className="flex-[1.4] bg-orange-600 hover:bg-orange-700 text-white font-black py-4 px-3 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 hover:-translate-y-0.5 flex items-center justify-center gap-1.5 text-xs"
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

      {/* GUÍA INTERACTIVA DE CÓMO FUNCIONA CADA MODO */}
      <CreationFlowGuideModal
        isOpen={Boolean(guideModalFlow)}
        initialFlow={guideModalFlow}
        onClose={() => setGuideModalFlow(null)}
        onSelectFlow={handleSelectFlowFromGuide}
      />

      {showReelWorkspace && (
        <div className="fixed inset-0 bg-white z-[150] overflow-y-auto px-6 py-12 md:p-12 flex flex-col justify-start items-center animate-in fade-in duration-300">
           {/* Header */}
           <div className="w-full max-w-5xl flex justify-between items-center mb-10 pb-6 border-b border-slate-150">
              <div>
                 <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Asistente de Video IA</span>
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
                          className="text-[10px] font-black uppercase bg-orange-600 hover:bg-indigo-750 text-white px-4 py-2 rounded-xl border border-orange-500/20 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
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
                    <h4 className="text-xs font-black uppercase tracking-widest text-orange-600">4. Finaliza tu Reel</h4>
                    
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs font-medium text-indigo-800 space-y-2">
                       <p><strong className="font-black">Opción A (Recomendada): Generación 100% Automática.</strong></p>
                       <p>Si simplemente cierras este espacio y guardas el post, nuestro servidor conectará con la IA de video (vía webhook), generará la animación y estampará los subtítulos de Alex Hormozi automáticamente.</p>
                    </div>

                    <div className="relative pt-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-slate-50/50 px-3 text-[10px] font-black uppercase text-slate-400">O bien</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      <strong className="text-slate-700">Opción B (Manual):</strong> Si prefieres generar el video en Luma/Runway por tu cuenta combinando la imagen y la locución, súbelo aquí en formato MP4 y nosotros le sumaremos los subtítulos al publicarlo.
                    </p>
                    
                    <label className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 hover:bg-slate-50 hover:border-orange-500/50 rounded-2xl cursor-pointer group hover:scale-[1.01] transition-all text-orange-600 py-10 px-4 shadow-sm relative">
                      {reelVideoUploading ? (
                        <div className="flex flex-col items-center gap-3">
                           <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                           <span className="text-xs font-black uppercase text-orange-600">Subiendo video a Firebase Storage...</span>
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
                       <h4 className="text-xs font-black uppercase tracking-widest text-orange-600">2. Prompt de Animación (Image-to-Video)</h4>
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
                         className="text-[10px] font-black uppercase bg-indigo-50 hover:bg-indigo-100 text-orange-700 px-4 py-2 rounded-xl border border-indigo-200 transition-all"
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
                           className="text-[10px] font-black uppercase bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl border border-orange-500/20 transition-all flex items-center gap-1.5"
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
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none flex items-center gap-2">
                    <span>Previsualización Final</span>
                    {finalModalUrls.length > 1 && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-purple-200">
                        📑 Carrusel ({finalModalUrls.length})
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {finalModalUrls.length > 1 
                      ? `Revisa las ${finalModalUrls.length} láminas de tu carrusel` 
                      : 'Así se verá tu post en redes'}
                  </p>
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
              
              {/* Imagen/Video / Carrusel */}
              <div className="space-y-3">
                <div className="w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden border-4 border-white shadow-md relative group flex items-center justify-center">
                   {finalModalUrls.length > 0 ? (
                      (creationMode === 'manual' && (selectedTemplate?.type === 'video' || selectedTemplate?.url.match(/\.(mp4|mov|webm|quicktime)/i))) ? (
                         <video src={selectedTemplate?.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : (
                         <>
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img 
                             src={finalModalUrls[finalPreviewIndex] || finalModalUrls[0]} 
                             alt={`Final Post Slide ${finalPreviewIndex + 1}`} 
                             className="w-full h-full object-cover transition-all duration-200" 
                           />

                           {/* Badge Lámina X de N */}
                           {finalModalUrls.length > 1 && (
                             <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg border border-white/20 flex items-center gap-1.5 z-10">
                               <span>📑</span> Lámina {finalPreviewIndex + 1} de {finalModalUrls.length}
                             </div>
                           )}

                           {/* Flechas de navegación prev/next */}
                           {finalModalUrls.length > 1 && (
                             <>
                               <button
                                 type="button"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setFinalPreviewIndex((prev) => Math.max(0, prev - 1));
                                 }}
                                 disabled={finalPreviewIndex === 0}
                                 className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-slate-800 disabled:opacity-20 disabled:pointer-events-none hover:bg-white shadow-xl flex items-center justify-center font-black text-xl transition-all hover:scale-110 z-10 cursor-pointer"
                                 aria-label="Lámina anterior"
                               >
                                 ‹
                               </button>
                               <button
                                 type="button"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setFinalPreviewIndex((prev) => Math.min(finalModalUrls.length - 1, prev + 1));
                                 }}
                                 disabled={finalPreviewIndex === finalModalUrls.length - 1}
                                 className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-slate-800 disabled:opacity-20 disabled:pointer-events-none hover:bg-white shadow-xl flex items-center justify-center font-black text-xl transition-all hover:scale-110 z-10 cursor-pointer"
                                 aria-label="Lámina siguiente"
                               >
                                 ›
                               </button>
                             </>
                           )}
                         </>
                      )
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">📸</div>
                   )}
                </div>

                {/* Miniaturas de todas las láminas si es carrusel */}
                {finalModalUrls.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 custom-scrollbar">
                    {finalModalUrls.map((url, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setFinalPreviewIndex(sIdx)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all shrink-0 w-16 h-16 cursor-pointer ${
                          finalPreviewIndex === sIdx
                            ? 'border-orange-600 ring-2 ring-orange-500/30 scale-105 shadow-md'
                            : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Miniatura ${sIdx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/85 text-[9px] font-black text-white text-center py-0.5 tracking-wider">
                          {sIdx + 1}/{finalModalUrls.length}
                        </span>
                      </button>
                    ))}
                  </div>
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
                        {hasYt && (
                            <button
                            type="button"
                            onClick={() => setNetworks({ ...networks, youtube: !networks.youtube })}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                                networks.youtube ? 'bg-[#FF0000] text-white scale-105 shadow-md shadow-red-500/20' : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-600'
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
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                                networks.x ? 'bg-black text-white scale-105 shadow-md shadow-black/20' : 'bg-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-600'
                            }`}
                            title="X (Twitter)"
                            >
                            <FaTwitter />
                            </button>
                        )}
                        </div>
                    )}
                 </div>
              </div>

              {/* TikTok Settings (if TikTok is selected) */}
              {networks.tiktok && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <TikTokPostSettings
                    settings={tiktokSettings}
                    onChange={setTiktokSettings}
                    isDefaultConfig={false}
                  />
                </div>
              )}

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
                        {improveLoading ? <div className="w-3 h-3 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /> : '✨ Redactar con Agentes'}
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

               {/* Control de Audio y Subtítulos cuando es Video / Reel */}
               {renderVideoAudioSettings()}

               {/* Toggle: Incluir Logo */}
               {activeProfile?.logoUrl && (
                 <button
                   type="button"
                   onClick={() => setIncludeLogo(prev => !prev)}
                   className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-sm font-bold ${
                     includeLogo
                       ? 'border-indigo-400 bg-indigo-50 text-orange-700'
                       : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                   }`}
                 >
                   <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                     includeLogo ? 'border-orange-500 bg-indigo-500' : 'border-slate-300 bg-white'
                   }`}>
                     {includeLogo && <span className="w-2 h-2 rounded-full bg-white block" />}
                   </span>
                   <span className="flex items-center gap-2">
                     <span>🏷️</span>
                     <span>Incluir logo de la marca en la imagen</span>
                   </span>
                   {includeLogo && <span className="ml-auto text-[10px] font-black text-indigo-500 uppercase tracking-widest">Activado</span>}
                 </button>
               )}

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
                          className="flex-[2] bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-orange-500/25 text-xs flex items-center justify-center gap-2"
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
                       className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/25 text-xs flex items-center justify-center gap-2"
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
