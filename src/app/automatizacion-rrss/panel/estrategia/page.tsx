"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { doc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "../../../../contexts/ProfileContext";
import { isUserAdmin, getPlanLimit, getVideoPlanLimit, getAiPlanLimit, getAiGenerationUsage, getVideoQuotaUsage, getQuotaUsage, fetchUserQuotas } from "../../../../lib/quota";
import StatusModal from "../../../../components/StatusModal";
import VoiceMic from "../../../../components/VoiceMic";
import PromptStyleSelector from "../../../../components/strategy/PromptStyleSelector";
import PlanProductsSelector from "../../../../components/strategy/PlanProductsSelector";
import { PromptTemplate } from "../../../../lib/prompt-templates";
import { appendContactInfo } from "../../../../lib/contact-helper";
import { getScheduleContinuityFromList, ScheduleContinuityResult } from "../../../../lib/schedule-continuity";
import { getPlanConfig } from "../../../../lib/plans";

interface StrategyGoal {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface StrategyPost {
  weekNumber: number;
  dayOffset: number;
  suggestedTime: string;
  format: string;
  hook: string;
  content: string;
  cta: string;
  visualStyle?: string;
  promptTemplateId?: string;
  previewUrl?: string;
  imageDirection?: string;
  productId?: string;
  productName?: string;
  productDescription?: string;
  productPrice?: string;
  productOfferPrice?: string;
  baseImageUrl?: string;
  hasProductImage?: boolean;
  isPromotion?: boolean;
  promoImageMode?: 'with_text' | 'without_text';
  isCommercialPoster?: boolean;
  layoutPosition?: 'split_left' | 'split_right' | 'top_banner' | 'recipe_ingredients';
  fontStyle?: 'bold_modern' | 'elegant_serif' | 'script_handwritten' | 'clean_minimal' | 'serif_script_mix';
  textFormatLabel?: string;
  artDirectionReasoning?: string;
  videoCommand?: string;
  videoTemplateName?: string;
  videoCategory?: string;
  videoMotionStyle?: string;
  videoPrompt?: string;
  needsBaseImageFirst?: boolean;
}

export default function EstrategiaPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState("free");
  const [businessType, setBusinessType] = useState("");
  const [goals, setGoals] = useState<StrategyGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [generating, setGenerating] = useState(false);
  const [strategyResult, setStrategyResult] = useState<StrategyPost[] | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [expectations, setExpectations] = useState("");
  const [promoMode, setPromoMode] = useState<'profile' | 'custom'>('profile');
  const [strategyDuration, setStrategyDuration] = useState<'7' | '14' | 'month'>('14');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const d = params.get('duration');
      if (d === '7' || d === '14' || d === 'month') {
        setStrategyDuration(d as any);
      }
      const g = params.get('goal');
      if (g) {
        setSelectedGoal(g);
      }
      const r = params.get('useRadar');
      if (r === 'true') {
        setUseRadarContext(true);
      }
    }
  }, []);
  const [customPromotions, setCustomPromotions] = useState("");
  const [radarAnalysis, setRadarAnalysis] = useState<any>(null);
  const [useRadarContext, setUseRadarContext] = useState<boolean>(true);
  const [usePromptStyles, setUsePromptStyles] = useState<boolean>(false);
  const [selectedPromptStyles, setSelectedPromptStyles] = useState<PromptTemplate[]>([]);
  const [businessData, setBusinessData] = useState<any>({});
  const [postsThisMonth, setPostsThisMonth] = useState(0);
  const [planLimit, setPlanLimit] = useState(20);
  const [videoLimit, setVideoLimit] = useState(2);
  const [videosThisMonth, setVideosThisMonth] = useState(0);
  const [imageLimit, setImageLimit] = useState(20);
  const [imagesThisMonth, setImagesThisMonth] = useState(0);
  const [quotaInfo, setQuotaInfo] = useState<any>(null);
  const [hasNetworks, setHasNetworks] = useState(false);
  const [catalogoItems, setCatalogoItems] = useState<any[]>([]);
  const [selectedCatalogItemIds, setSelectedCatalogItemIds] = useState<string[]>([]);
  const [includePromotionsInStrategy, setIncludePromotionsInStrategy] = useState<boolean>(true);
  const [selectedPromotionIds, setSelectedPromotionIds] = useState<string[]>([]);
  const [promoImageMode, setPromoImageMode] = useState<'agent_auto' | 'with_text' | 'without_text' | 'mixed'>('agent_auto');
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);
  const [catalogUsage, setCatalogUsage] = useState<'mixed' | 'all' | 'none'>('mixed');
  const [isCommercialPosterOnly, setIsCommercialPosterOnly] = useState<boolean>(false);

  const regularCatalogItems = catalogoItems.filter((i: any) => i.type !== 'promocion');
  const catalogPromotions = catalogoItems.filter((i: any) => i.type === 'promocion');
  
  // Fecha y hora de inicio de la planificación
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    if (d.getHours() >= 18) d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [startTime, setStartTime] = useState<string>("10:00");
  const [scheduleContinuityInfo, setScheduleContinuityInfo] = useState<ScheduleContinuityResult | null>(null);

  const computePostDate = (startD: string, startT: string, dayOffset: number, suggestedTime?: string) => {
    const [y, m, d] = (startD || new Date().toISOString().split('T')[0]).split('-').map(Number);
    let baseDate = new Date(y, m - 1, d);

    // Si existen posts futuros agendados y la fecha seleccionada cae antes o igual a la última agendada,
    // garantizar que la estrategia continúe a partir del día siguiente al último agendado.
    if (scheduleContinuityInfo?.hasFuturePosts && scheduleContinuityInfo.lastScheduledDate) {
      if (baseDate.getTime() <= scheduleContinuityInfo.lastScheduledDate.getTime()) {
        const nextDay = new Date(scheduleContinuityInfo.lastScheduledDate);
        nextDay.setDate(nextDay.getDate() + 1);
        baseDate = nextDay;
      }
    }

    const targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + (dayOffset || 0));

    let timeStr = (dayOffset === 0 && startT) ? startT : (suggestedTime || startT || "10:00");
    if (timeStr && timeStr.includes(':')) {
      const [h, min] = timeStr.split(':').map(Number);
      targetDate.setHours(h || 10, min || 0, 0, 0);
    } else {
      targetDate.setHours(10, 0, 0, 0);
    }

    const now = new Date();
    if (targetDate.getTime() <= now.getTime()) {
      targetDate.setTime(now.getTime() + 30 * 60 * 1000);
    }
    return targetDate;
  };

  const { activeProfile } = useProfile();

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
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
              const data = userDoc.data();
              setUserPlan(data.plan || "free");
              
              // Phase 6: Aislamiento estricto de configuración de negocio
              const isDefault = activeProfile?.id === 'default';
              setBusinessType(activeProfile?.rubro || (isDefault ? data.rubro : "") || "");
              
              const prof = activeProfile as any;
              setBusinessData({
                  businessName: prof?.name || prof?.businessName || (isDefault ? data.businessName || data.name : "") || "",
                  website: prof?.website || (isDefault ? data.website : "") || "",
                  phone: prof?.phone || (isDefault ? data.phone : "") || "",
                  whatsapp: prof?.whatsapp || prof?.phone || (isDefault ? data.whatsapp || data.phone : "") || "",
                  email: prof?.email || (isDefault ? data.email : "") || "",
                  address: prof?.address || (isDefault ? data.address : "") || "",
                  facebookUrl: prof?.facebookUrl || (isDefault ? data.facebookUrl : "") || "",
                  instagramUrl: prof?.instagramUrl || (isDefault ? data.instagramUrl : "") || "",
                  tiktokUrl: prof?.tiktokUrl || (isDefault ? data.tiktokUrl : "") || "",
                  twitterUrl: prof?.twitterUrl || (isDefault ? data.twitterUrl : "") || "",
                  linkedinUrl: prof?.linkedinUrl || (isDefault ? data.linkedinUrl : "") || "",
              });
              
              const fbOK = !!activeProfile?.facebookToken_enc || (isDefault && !!data.facebookToken_enc);
              const igOK = !!activeProfile?.instagramToken_enc || (isDefault && !!data.instagramToken_enc);
              const ttOK = !!activeProfile?.tiktokToken_enc || (isDefault && !!data.tiktokToken_enc);
              const liOK = !!activeProfile?.linkedinUserToken_enc || !!activeProfile?.linkedinToken_enc || (isDefault && (!!data.linkedinUserToken_enc || !!data.linkedinToken_enc));
              
              setHasNetworks(fbOK || igOK || ttOK || liOK);
              
              // Cargar cuotas y límites reales del plan y consumo
              const plan = data.plan || "free";
              const serverQuotas = await fetchUserQuotas(activeProfile?.id || 'default');
              
              if (serverQuotas) {
                  setPlanLimit(serverQuotas.postsLimit);
                  setVideoLimit(serverQuotas.videoLimit);
                  setImageLimit(serverQuotas.imageLimit);
                  setPostsThisMonth(serverQuotas.postsUsed);
                  setVideosThisMonth(serverQuotas.videosUsed);
                  setImagesThisMonth(serverQuotas.imagesUsed);
              } else {
                  const [pLimit, vLimit, iLimit, pUsed, vUsed, iUsed] = await Promise.all([
                      getPlanLimit(plan, u.email),
                      getVideoPlanLimit(plan, u.email),
                      getAiPlanLimit(plan, 'image', u.email),
                      getQuotaUsage(u.uid, activeProfile?.id || 'default'),
                      getVideoQuotaUsage(u.uid),
                      getAiGenerationUsage(u.uid, 'image')
                  ]);

                  setPlanLimit(pLimit);
                  setVideoLimit(vLimit);
                  setImageLimit(iLimit);
                  setPostsThisMonth(pUsed);
                  setVideosThisMonth(vUsed);
                  setImagesThisMonth(iUsed);
              }

              const qPosts = query(
                  collection(db, "social_posts"),
                  where("userId", "==", u.uid)
              );
              const querySnapshot = await getDocs(qPosts);
              const allPosts = querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

              const cont = getScheduleContinuityFromList(allPosts, activeProfile?.id, 10);
              setScheduleContinuityInfo(cont);
              if (cont.hasFuturePosts) {
                  setStartDate(cont.nextDateString);
              }
          }
          
          // Fetch goals from secure API instead of client-side Firestore
          const token = await u.getIdToken();
          const res = await fetch("/api/strategies", {
              headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
              const data = await res.json();
              if (data.goals && Array.isArray(data.goals)) {
                  setGoals(data.goals);
              }
          } else {
              // Fallback default goals if API fails
              setGoals([
                  { id: 'ventas', title: 'Ventas & Conversión', description: 'Maximizar pedidos y ventas directas mediante contenido persuasivo.', icon: '💰' },
                  { id: 'autoridad', title: 'Autoridad & Marca', description: 'Posicionarte como el experto número 1 y referente de tu sector.', icon: '🎙️' },
                  { id: 'viralidad', title: 'Viralidad & Alcance', description: 'Contenido diseñado para ser compartido masivamente y llegar a miles.', icon: '🚀' },
                  { id: 'lealtad', title: 'Comunidad & Lealtad', description: 'Crear fans reales y embajadores que interactúen con cada publicación.', icon: '❤️' },
                  { id: 'prospectos', title: 'Captación de Prospectos', description: 'Atraer mensajes directos y registros de clientes altamente interesados.', icon: '📥' }
              ]);
          }

          // Phase 9: Connect Analytics with Strategy via localStorage
          const savedAnalytics = localStorage.getItem('metrics_ai_context');
          if (savedAnalytics) {
              // Strip HTML tags for the textarea
              const cleanText = savedAnalytics.replace(/<[^>]*>?/gm, '');
              setExpectations(cleanText);
              localStorage.removeItem('metrics_ai_context');
          }

          // Cargar último análisis del Radar de Nicho para este perfil
          const currentRubro = activeProfile?.rubro || (activeProfile as any)?.businessType || (userDoc.exists() ? userDoc.data()?.rubro : "") || businessType || "";
          if (currentRubro) {
              try {
                  const radarRes = await fetch("/api/nicho/radar", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                      body: JSON.stringify({
                          checkCacheOnly: true,
                          userId: u.uid,
                          businessId: activeProfile?.id || 'default',
                          niche: currentRubro
                      })
                  });
                  if (radarRes.ok) {
                      const rData = await radarRes.json();
                      if (rData.success && rData.analysis) {
                          setRadarAnalysis(rData.analysis);
                      }
                  }
              } catch (rErr) {
                  console.warn("No se pudo cargar análisis previo del radar:", rErr);
              }
          }

          // Load catalog items for context
          setLoadingCatalog(true);
          try {
              const token = await u.getIdToken();
              const catRes = await fetch(`/api/catalogo?profileId=${activeProfile?.id || 'default'}`, {
                  headers: { Authorization: `Bearer ${token}` },
              });
              const catData = await catRes.json();
              const items = catData.items || [];
              setCatalogoItems(items);
              const regItems = items.filter((i: any) => i.type !== 'promocion');
              const promItems = items.filter((i: any) => i.type === 'promocion');
              setSelectedCatalogItemIds(regItems.map((i: any) => i.id));
              setSelectedPromotionIds(promItems.map((i: any) => i.id));
          } catch (cErr) {
              console.warn("No se pudo cargar el catálogo:", cErr);
          } finally {
              setLoadingCatalog(false);
          }

        } catch (e) {
          console.error("Error fetching data:", e);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [activeProfile]);

  const handleGenerate = async () => {
      if (userPlan === 'free' && !isUserAdmin(user?.email)) return;
      if (!selectedGoal) {
          setError("Selecciona un objetivo para la estrategia.");
          return;
      }
      setGenerating(true);
      setError("");
      setStrategyResult(null);
      try {
         const activePromotions = includePromotionsInStrategy
             ? (promoMode === 'profile'
                 ? (activeProfile?.promotions || "")
                 : (customPromotions || activeProfile?.promotions || ""))
             : "";

         const itemsToUse = catalogUsage === 'none'
             ? []
             : regularCatalogItems.filter((item: any) => selectedCatalogItemIds.includes(item.id));

         const promosToUse = includePromotionsInStrategy
             ? catalogPromotions
                 .filter((p: any) => selectedPromotionIds.includes(p.id))
                 .map((promo: any) => {
                     const linkedProds = regularCatalogItems.filter((rp: any) =>
                         (promo.linkedProductIds || []).includes(rp.id)
                     );
                     const resolvedImg =
                         promo.imageUrl ||
                         linkedProds.find((rp: any) => rp.imageUrl)?.imageUrl ||
                         null;
                     return {
                         id: promo.id,
                         name: promo.name,
                         description: promo.description,
                         type: 'promocion',
                         price: promo.price || null,
                         offerPrice: promo.offerPrice || null,
                         imageUrl: resolvedImg,
                         hasImage: Boolean(resolvedImg && typeof resolvedImg === 'string' && (resolvedImg.startsWith('http') || resolvedImg.startsWith('/'))),
                         promoImageMode: promo.promoImageMode || 'both',
                         linkedProducts: linkedProds.map((lp: any) => ({
                             id: lp.id,
                             name: lp.name,
                             description: lp.description,
                             price: lp.price || null,
                             imageUrl: lp.imageUrl || null,
                         })),
                     };
                 })
             : [];

         const res = await fetch("/api/ai/generate-strategy", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ 
                 goal: selectedGoal, 
                 goalName: goals.find(g => g.id === selectedGoal)?.title, 
                 businessType, 
                 expectations,
                 promotions: activePromotions,
                 includePromotions: includePromotionsInStrategy,
                 promoImageMode,
                 selectedPromotions: promosToUse,
                 nicheContext: useRadarContext && radarAnalysis ? (radarAnalysis.summary || JSON.stringify(radarAnalysis.trends || [])) : "",
                 businessData,
                 userId: user?.uid,
                 profileId: activeProfile?.id || 'default',
                 postsPerWeek: strategyDuration === '7' ? 4 : strategyDuration === '14' ? 8 : (planLimit || 15),
                 duration: strategyDuration === '7' ? 7 : strategyDuration === '14' ? 14 : 30,
                 catalogUsage,
                 catalogoItems: itemsToUse.map((item: any) => ({
                     id: item.id,
                     name: item.name,
                     description: item.description,
                     type: item.type,
                     category: item.category || null,
                     price: item.price || null,
                     offerPrice: item.offerPrice || null,
                     imageUrl: item.imageUrl || null,
                     hasImage: Boolean(item.imageUrl && typeof item.imageUrl === 'string' && (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/')))
                  })),
                 usePromptStyles,
                 selectedPromptStyles: usePromptStyles ? selectedPromptStyles : [],
                 isCommercialPoster: isCommercialPosterOnly,
                 connectedPlatforms: {
                     facebook: !!activeProfile?.facebookToken_enc,
                     instagram: !!activeProfile?.instagramToken_enc,
                     tiktok: !!activeProfile?.tiktokToken_enc,
                     linkedin: !!activeProfile?.linkedinUserToken_enc || !!activeProfile?.linkedinToken_enc
                 }
             })
         });
         if (!res.ok) {
             const errData = await res.json();
             throw new Error(errData.error || "Error al generar la estrategia");
         }
         const data = await res.json();
         setStrategyResult(data.strategy);
         if (data.quotaInfo) {
             setQuotaInfo(data.quotaInfo);
         }

         // Auto save entire JSON to history
         if (user) {
             const goalName = goals.find(g => g.id === selectedGoal)?.title || selectedGoal;
             await addDoc(collection(db, "user_strategies"), {
                 userId: user.uid,
                 profileId: activeProfile?.id || 'default',
                 goal: goalName,
                 businessType,
                 strategyJson: data.strategy,
                 createdAt: new Date()
             }).catch(e => console.error("Error saving strategy history:", e));
         }
      } catch (err: any) {
          setError(err.message || "Error al generar la estrategia.");
      } finally {
          setGenerating(false);
      }
  };

  const handleAcceptPlan = async () => {
    if (!strategyResult || !user) return;
    
    const strategyVideos = (strategyResult || []).filter(p => {
        const fmt = (p.format || '').toLowerCase();
        return fmt.includes('reel') || fmt.includes('video');
    }).length;

    if (!isUserAdmin(user?.email)) {
       if (postsThisMonth + strategyResult.length > planLimit) {
          setError(`¡Límite de publicaciones alcanzado! Tu plan ${userPlan.toUpperCase()} permite ${planLimit} posts al mes. Ya tienes ${postsThisMonth} agendados o publicados y esta estrategia suma ${strategyResult.length}.`);
          return;
       }
       if (videoLimit > 0 && (videosThisMonth + strategyVideos > videoLimit)) {
          setError(`¡Límite de videos alcanzado! Tu plan ${userPlan.toUpperCase()} permite ${videoLimit} videos al mes. Ya tienes ${videosThisMonth} usados o agendados y esta estrategia suma ${strategyVideos} video(s).`);
          return;
       }
    }

    const activeId = activeProfile?.id || 'default';
    
    // Phase 9: Check for previous strategy posts pending
    const qPendingAI = query(
        collection(db, "social_posts"),
        where("userId", "==", user.uid),
        where("profileId", "==", activeId),
        where("status", "==", "pending"),
        where("generatedBy", "==", "ai_strategy")
    );
    
    const pendingAISnapshot = await getDocs(qPendingAI);
    
    if (pendingAISnapshot.size > 0) {
        showModal("confirm", "Sustituir Estrategia", `Tienes ${pendingAISnapshot.size} posts sugeridos de tu estrategia anterior. Al aceptar esta nueva planificación, los anteriores serán descartados para evitar conflictos. ¿Deseas continuar?`, () => {
            setModal(prev => ({ ...prev, isOpen: false }));
            executeAcceptPlan(pendingAISnapshot);
        });
        return;
    }

    executeAcceptPlan(pendingAISnapshot);
  };

  const executeAcceptPlan = async (pendingAISnapshot: any) => {
    setAccepting(true);
    try {
        // Delete old AI strategy posts
        for (const docSnap of pendingAISnapshot.docs) {
           await deleteDoc(doc(db, "social_posts", docSnap.id));
        }

        const postsRef = collection(db, "social_posts");
        for (const post of (strategyResult || [])) {
            const scheduledDate = computePostDate(startDate, startTime, post.dayOffset, post.suggestedTime);

            // Determine format for database mapping
            const fmt = post.format?.toLowerCase() || "";
            const postType = fmt.includes('reel') || fmt.includes('video') ? 'Reel' : (fmt.includes('historia') || fmt.includes('story') ? 'Story' : 'Post');

            const postBaseText = `${post.content}\n\n${post.cta}`;
            const finalTextWithContact = appendContactInfo(postBaseText, activeProfile);

            const matchedItem = catalogoItems.find((it: any) => it.id === post.productId);
            const resolvedPrice = post.productPrice || matchedItem?.price || null;
            const resolvedOfferPrice = post.productOfferPrice || matchedItem?.offerPrice || null;
            const resolvedBaseImage = post.baseImageUrl || (matchedItem?.imageUrl && typeof matchedItem.imageUrl === 'string' && (matchedItem.imageUrl.startsWith('http') || matchedItem.imageUrl.startsWith('/')) ? matchedItem.imageUrl : null);
            const effectivePromoImgMode = post.promoImageMode || (post.isCommercialPoster ? 'with_text' : undefined);
            const effectiveIsCommercialPoster = effectivePromoImgMode
                ? effectivePromoImgMode === 'with_text'
                : Boolean(post.isCommercialPoster ?? isCommercialPosterOnly);

            const newPostRef = await addDoc(postsRef, {
                userId: user.uid,
                profileId: activeProfile?.id || 'default',
                text: finalTextWithContact,
                idea: post.hook,
                type: postType,
                status: 'confirmed', // DIRECTAMENTE AGENDADO Y CONFIRMADO
                scheduledFor: scheduledDate,
                createdAt: new Date(),
                networks: ['instagram', 'facebook'], // Default
                generatedBy: 'ai_strategy',
                visualStyle: post.visualStyle || null,
                promptTemplateId: post.promptTemplateId || null,
                previewUrl: post.previewUrl || null,
                imageDirection: post.imageDirection || null,
                productId: post.productId || null,
                productName: post.productName || matchedItem?.name || null,
                productDescription: post.productDescription || matchedItem?.description || null,
                productPrice: resolvedPrice,
                productOfferPrice: resolvedOfferPrice,
                baseImageUrl: resolvedBaseImage || null,
                hasProductImage: Boolean(resolvedBaseImage),
                imageUrl: resolvedBaseImage || null,
                imageUrls: resolvedBaseImage ? [resolvedBaseImage] : [],
                isPromotion: Boolean(post.isPromotion || matchedItem?.type === 'promocion'),
                promoImageMode: effectivePromoImgMode || null,
                isCommercialPoster: effectiveIsCommercialPoster,
                layoutPosition: post.layoutPosition || null,
                fontStyle: post.fontStyle || null,
                textFormatLabel: post.textFormatLabel || null,
                artDirectionReasoning: post.artDirectionReasoning || null,
                videoCommand: post.videoCommand || null,
                videoTemplateName: post.videoTemplateName || null,
                videoCategory: post.videoCategory || null,
                videoMotionStyle: post.videoMotionStyle || null,
                videoPrompt: post.videoPrompt || null,
                videoDuration: postType === 'Reel' ? 10 : null,
                needsBaseImageFirst: Boolean(postType === 'Reel' && (post.needsBaseImageFirst || !resolvedBaseImage))
            });

            try {
                const idToken = await auth.currentUser?.getIdToken();
                await fetch('/api/tasks/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ postId: newPostRef.id, scheduledFor: scheduledDate.toISOString() })
                });
            } catch (scheduleErr) {
                console.error("Warning: Could not schedule GCP task", scheduleErr);
            }
        }
        showModal("success", "¡Planificación Agendada!", "Tus publicaciones han quedado inmediatamente agendadas y confirmadas en tu calendario de redes sociales.", () => {
            router.push("/automatizacion-rrss/panel");
        });
    } catch(err) {
        console.error("Error accepting plan:", err);
        setError("Error al guardar la planificación en tu calendario.");
        setAccepting(false);
    }
  };

  if (loading) return <div className="p-8 font-bold text-slate-400">Cargando Estrategia...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <span className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-600/30 text-white">🚀</span>
          Estrategia de Contenidos con Agentes
        </h1>
        <p className="text-slate-500 font-medium mt-2 max-w-2xl leading-relaxed">
          Selecciona tu objetivo principal y nuestro equipo de agentes especializados diseñará un plan táctico de publicaciones a medida para tu negocio.
        </p>
      </div>

      {/* Barra de Cuotas Disponibles del Plan */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-900/50 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-lg">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-black tracking-wider text-indigo-300">
                {getPlanConfig(userPlan).name}
              </span>
              {isUserAdmin(user?.email) && <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">ADMIN</span>}
            </div>
            <p className="text-xs text-slate-300 font-medium">Cuotas disponibles este mes (nuestros agentes adaptarán la estrategia a tu saldo):</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-3.5 py-2 rounded-xl flex items-center gap-2.5">
            <span className="text-base">📝</span>
            <div className="text-left">
              <div className="text-[10px] font-bold text-slate-300 uppercase">Posts Disponibles</div>
              <div className="text-xs font-black text-white">{isUserAdmin(user?.email) ? 'Ilimitados' : `${Math.max(0, planLimit - postsThisMonth)} / ${planLimit}`}</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-3.5 py-2 rounded-xl flex items-center gap-2.5">
            <span className="text-base">🎬</span>
            <div className="text-left">
              <div className="text-[10px] font-bold text-slate-300 uppercase">Videos Disponibles</div>
              <div className="text-xs font-black text-white">{isUserAdmin(user?.email) ? 'Ilimitados' : `${Math.max(0, videoLimit - videosThisMonth)} / ${videoLimit}`}</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-3.5 py-2 rounded-xl flex items-center gap-2.5">
            <span className="text-base">🖼️</span>
            <div className="text-left">
              <div className="text-[10px] font-bold text-slate-300 uppercase">Imágenes Disponibles</div>
              <div className="text-xs font-black text-white">{isUserAdmin(user?.email) ? 'Ilimitadas' : `${Math.max(0, imageLimit - imagesThisMonth)} / ${imageLimit}`}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de Empresa de Prueba Activa (Admin) */}
      {(activeProfile?.isTestProfile || (activeProfile?.id && activeProfile.id.startsWith('prof_test_'))) && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-300 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-amber-100/80 rounded-xl">{activeProfile?.icon || '🧪'}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                  🧪 Modo Prueba
                </span>
                <h4 className="text-sm font-black text-slate-900">
                  Estrategia Piloto para &quot;{activeProfile?.name}&quot;
                </h4>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Rubro: <strong>{activeProfile?.rubro || 'General'}</strong> • Nuestros agentes redactarán los posts basándose en los {catalogoItems.length} productos y servicios de su catálogo.
              </p>
            </div>
          </div>
          <Link
            href="/automatizacion-rrss/panel/catalogo"
            className="px-4 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <span>📦 Ver / Editar Productos ({catalogoItems.length})</span>
            <span>→</span>
          </Link>
        </div>
      )}

      <div className="bg-white p-6 md:p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          {userPlan === 'free' && !isUserAdmin(user?.email) && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center rounded-[32px]">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-6 shadow-2xl border-4 border-slate-700">🔒</div>
                  <h3 className="text-3xl font-black text-white mb-3">Planifica el Mes con Agentes</h3>
                  <p className="text-slate-200 font-medium max-w-md mb-8 leading-relaxed">
                    El generador de calendario estratégico está disponible desde el <strong className="text-white">Plan PyME Esencial ($59.990)</strong> y <strong className="text-white">Plan PyME Crecimiento ($99.990)</strong>. Actívalo para tener tu mes completo de contenido listo en minutos.
                  </p>
                  <Link href="/confirmar-plan?plan=crecimiento" className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/50 hover:-translate-y-1">
                      Activar Plan PyME Crecimiento ($99.990)
                  </Link>
              </div>
          )}

          <div className={`space-y-6 ${userPlan === 'free' && !isUserAdmin(user?.email) ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
             {/* BANNER DEMOSTRACIÓN PLAN 14 DÍAS + RADAR DE NICHO */}
             <div className="p-4 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 rounded-2xl border-2 border-rose-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
               <div className="flex items-center gap-3">
                 <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-orange-500 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
                   🍻
                 </span>
                 <div>
                   <div className="flex items-center gap-2">
                     <span className="text-[9px] font-black uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                       Ejemplo Real de 14 Días
                     </span>
                     <span className="text-xs font-black text-slate-900">Muestra Manía Restobar</span>
                   </div>
                   <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                     Mira cómo nuestros agentes planificaron 14 días con Radar de Nicho, posteo diario + historias y balance con/sin texto.
                   </p>
                 </div>
               </div>
               <Link
                 href="/demo-plan-mania"
                 className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all shrink-0 shadow-sm flex items-center gap-1.5"
               >
                 <span>Ver Plan 14 Días</span>
                 <span>→</span>
               </Link>
             </div>

             {/* SELECTOR DE DURACIÓN DE ESTRATEGIA (Semanal vs 14 días vs Mes) */}
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                 <div>
                   <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                     <span>⏱️</span> Horizonte de Planificación
                   </h4>
                   <p className="text-[11px] text-slate-500 font-medium">
                     Selecciona cuántos días deseas planificar con nuestros agentes
                   </p>
                 </div>
                 <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-xs self-start sm:self-auto">
                   <button
                     type="button"
                     onClick={() => setStrategyDuration('7')}
                     className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                       strategyDuration === '7'
                         ? 'bg-slate-900 text-white shadow-xs'
                         : 'text-slate-600 hover:text-slate-900'
                     }`}
                   >
                     <span>📅 Semanal (7 días)</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => setStrategyDuration('14')}
                     className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                       strategyDuration === '14'
                         ? 'bg-slate-900 text-white shadow-xs'
                         : 'text-slate-600 hover:text-slate-900'
                     }`}
                   >
                     <span>🚀 14 Días (Quincenal)</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => setStrategyDuration('month')}
                     className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                       strategyDuration === 'month'
                         ? 'bg-slate-900 text-white shadow-xs'
                         : 'text-slate-600 hover:text-slate-900'
                     }`}
                   >
                     <span>📆 Mes Completo</span>
                   </button>
                 </div>
               </div>

               <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between pt-2 border-t border-slate-200/60">
                 <span>
                   {strategyDuration === '7' && 'Nuestros agentes diseñarán entre 3 y 4 publicaciones estratégicas para la próxima semana.'}
                   {strategyDuration === '14' && 'Nuestros agentes diseñarán entre 7 y 8 publicaciones estratégicas para cubrir dos semanas completas.'}
                   {strategyDuration === 'month' && 'Nuestros agentes diseñarán la grilla mensual completa de contenidos según tu plan activo.'}
                 </span>
                 <span className="text-[10px] font-black uppercase text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200">
                   {strategyDuration === '7' ? '3-4 Posts' : strategyDuration === '14' ? '7-8 Posts' : 'Grilla Completa'}
                 </span>
               </div>
             </div>

             <div className="flex items-center justify-between">
               <h3 className="text-base font-black text-slate-900 tracking-tight">1. ¿Qué deseas lograr?</h3>
               {selectedGoal && (
                 <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-widest">
                   ✓ {goals.find(g => g.id === selectedGoal)?.title}
                 </span>
               )}
             </div>
             {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold text-sm">{error}</div>}
             
             {/* Horizontal scrollable carousel */}
             <div className="relative">
               <div className="flex flex-col sm:flex-row gap-3 sm:overflow-x-auto sm:pb-2 sm:hide-scrollbar sm:snap-x sm:snap-mandatory">
                 {goals.map(g => (
                   <button
                     key={g.id}
                     onClick={() => setSelectedGoal(g.id)}
                     className={`sm:snap-start shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left w-full sm:w-[200px] ${
                       selectedGoal === g.id
                       ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100 -translate-y-0.5'
                       : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white hover:-translate-y-0.5'
                     }`}
                   >
                     <span className={`text-xl shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${selectedGoal === g.id ? 'bg-white shadow-sm' : 'bg-white/80'}`}>
                       {g.icon || '🎯'}
                     </span>
                     <div className="min-w-0">
                       <div className={`font-black text-xs leading-tight ${selectedGoal === g.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                         {g.title}
                       </div>
                       <div className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug line-clamp-2">
                         {g.description}
                       </div>
                     </div>
                   </button>
                 ))}
               </div>
               {goals.length > 4 && (
                 <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
               )}
             </div>

              {/* NIVEL 2: PROMOCIONES EN LA ESTRATEGIA */}
              <div className="p-6 bg-gradient-to-br from-rose-500/5 via-amber-500/5 to-orange-500/5 rounded-3xl border-2 border-rose-300/60 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                     <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 text-white flex items-center justify-center text-xl shadow-sm shrink-0">🔥</span>
                        <div>
                           <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight">2. Promociones para esta Estrategia</h3>
                           <p className="text-xs font-medium text-slate-500">Elige si deseas incluir promociones en este calendario y cómo se diseñarán sus imágenes.</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3 self-start sm:self-center">
                        <Link
                          href="/automatizacion-rrss/panel/catalogo"
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline shrink-0"
                        >
                          + Crear / Editar Promociones →
                        </Link>
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3.5 py-2 rounded-xl border-2 border-rose-200 shadow-xs">
                          <input
                            type="checkbox"
                            checked={includePromotionsInStrategy}
                            onChange={(e) => setIncludePromotionsInStrategy(e.target.checked)}
                            className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                          />
                          <span className="text-xs font-black text-slate-800">
                            {includePromotionsInStrategy ? '🔥 Incluir Promociones' : 'No incluir promociones'}
                          </span>
                        </label>
                     </div>
                  </div>

                  {includePromotionsInStrategy && (
                    <div className="space-y-5 pt-2 border-t border-rose-200/50 animate-in fade-in duration-300">
                      {/* A. Selector de Estilo de Imagen para las Promociones (CON TEXTO vs SIN TEXTO vs AMBOS) */}
                      <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs space-y-3">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span>🎨</span> ¿Cómo deseas las imágenes de tus Promociones?
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Define si las publicaciones promocionales llevarán texto publicitario superpuesto o fotografía limpia.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPromoImageMode('agent_auto')}
                            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              promoImageMode === 'agent_auto'
                                ? 'border-rose-600 bg-rose-50/50 shadow-xs'
                                : 'border-slate-100 bg-slate-50 hover:border-rose-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-slate-900">🤖 Automático por Agentes</span>
                              <input type="radio" checked={promoImageMode === 'agent_auto'} onChange={() => setPromoImageMode('agent_auto')} className="accent-rose-600" />
                            </div>
                            <p className="text-[10px] text-slate-500 leading-snug">
                              Nuestros agentes analizan cada imagen y deciden el mejor formato de texto (o foto limpia).
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPromoImageMode('with_text')}
                            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              promoImageMode === 'with_text'
                                ? 'border-rose-600 bg-rose-50/50 shadow-xs'
                                : 'border-slate-100 bg-slate-50 hover:border-rose-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-slate-900">🏷️ Imágenes CON Texto</span>
                              <input type="radio" checked={promoImageMode === 'with_text'} onChange={() => setPromoImageMode('with_text')} className="accent-rose-600" />
                            </div>
                            <p className="text-[10px] text-slate-500 leading-snug">
                              Diseño tipo cartel comercial con titular, oferta y precio integrados en la imagen.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPromoImageMode('without_text')}
                            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              promoImageMode === 'without_text'
                                ? 'border-rose-600 bg-rose-50/50 shadow-xs'
                                : 'border-slate-100 bg-slate-50 hover:border-rose-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-slate-900">📸 Imágenes SIN Texto</span>
                              <input type="radio" checked={promoImageMode === 'without_text'} onChange={() => setPromoImageMode('without_text')} className="accent-rose-600" />
                            </div>
                            <p className="text-[10px] text-slate-500 leading-snug">
                              Fotografía pura y limpia del plato o producto; toda la promoción y precio van en el copy.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPromoImageMode('mixed')}
                            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              promoImageMode === 'mixed'
                                ? 'border-rose-600 bg-rose-50/50 shadow-xs'
                                : 'border-slate-100 bg-slate-50 hover:border-rose-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-slate-900">🔄 Ambos (50/50)</span>
                              <input type="radio" checked={promoImageMode === 'mixed'} onChange={() => setPromoImageMode('mixed')} className="accent-rose-600" />
                            </div>
                            <p className="text-[10px] text-slate-500 leading-snug">
                              Nuestros agentes alternan carteles con texto y fotografías limpias para dar dinamismo al feed.
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* B. Promociones creadas en la viñeta Promociones de Productos & Servicios */}
                      {catalogPromotions.length > 0 ? (
                        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                🔥 Tus Promociones del Catálogo ({selectedPromotionIds.length} de {catalogPromotions.length} seleccionadas)
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Marca las promociones que quieres que nuestros agentes programen en este plan:
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedPromotionIds(catalogPromotions.map((p: any) => p.id))}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                              >
                                ✓ Todas
                              </button>
                              {selectedPromotionIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPromotionIds([])}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                                >
                                  Limpiar
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                            {catalogPromotions.map((promo: any) => {
                              const isSelected = selectedPromotionIds.includes(promo.id);
                              const linkedProds = regularCatalogItems.filter((rp: any) =>
                                (promo.linkedProductIds || []).includes(rp.id)
                              );
                              const displayImg =
                                promo.imageUrl ||
                                linkedProds.find((rp: any) => rp.imageUrl)?.imageUrl ||
                                null;

                              return (
                                <div
                                  key={promo.id}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedPromotionIds(selectedPromotionIds.filter((id) => id !== promo.id));
                                    } else {
                                      setSelectedPromotionIds([...selectedPromotionIds, promo.id]);
                                    }
                                  }}
                                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
                                    isSelected
                                      ? 'border-rose-500 bg-rose-50/40 shadow-xs'
                                      : 'border-slate-100 bg-slate-50/60 hover:border-slate-200'
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                                      isSelected
                                        ? 'bg-rose-600 text-white'
                                        : 'border border-slate-300 bg-white text-transparent'
                                    }`}
                                  >
                                    ✓
                                  </div>
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                    {displayImg ? (
                                      <img src={displayImg} alt={promo.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-lg">🔥</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <h5 className="text-xs font-black text-slate-900 truncate">{promo.name}</h5>
                                      {(promo.offerPrice || promo.price) && (
                                        <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full shrink-0">
                                          {promo.offerPrice || promo.price}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{promo.description}</p>
                                    {linkedProds.length > 0 && (
                                      <div className="flex items-center gap-1 flex-wrap mt-1">
                                        <span className="text-[9px] font-bold text-slate-400">Incluye:</span>
                                        {linkedProds.map((lp: any) => (
                                          <span
                                            key={lp.id}
                                            className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100 truncate max-w-[110px]"
                                          >
                                            {lp.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-white rounded-2xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs text-slate-600 font-medium">
                            💡 Puedes crear promociones con productos vinculados en la viñeta <strong>🔥 Promociones</strong> de Productos & Servicios.
                          </div>
                          <Link
                            href="/automatizacion-rrss/panel/catalogo"
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition-all shrink-0 text-center"
                          >
                            + Ir a Crear Promociones
                          </Link>
                        </div>
                      )}

                      {/* C. Texto adicional de promociones del perfil o rápidas */}
                      <div className="space-y-2">
                        {activeProfile?.promotions && (
                          <label 
                            onClick={() => setPromoMode('profile')}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${promoMode === 'profile' ? 'bg-white border-amber-500 shadow-sm' : 'bg-white/60 border-slate-100 hover:bg-white'}`}
                          >
                            <input type="radio" name="promoMode" checked={promoMode === 'profile'} onChange={() => setPromoMode('profile')} className="accent-amber-600" />
                            <div className="text-left">
                              <span className="text-xs font-bold text-slate-800 block">Incluir también las promociones generales de mi perfil</span>
                              <span className="text-[11px] text-slate-500 line-clamp-1">{activeProfile.promotions}</span>
                            </div>
                          </label>
                        )}

                        <label 
                          onClick={() => setPromoMode('custom')}
                          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${promoMode === 'custom' || !activeProfile?.promotions ? 'bg-white border-amber-500 shadow-sm' : 'bg-white/60 border-slate-100 hover:bg-white'}`}
                        >
                          <input type="radio" name="promoMode" checked={promoMode === 'custom' || !activeProfile?.promotions} onChange={() => setPromoMode('custom')} className="mt-0.5 accent-amber-600" />
                          <div className="flex-1">
                            <span className="text-xs font-bold text-slate-800">
                              Escribir una nota u oferta adicional rápida para este plan (Opcional)
                            </span>
                            {(promoMode === 'custom' || !activeProfile?.promotions) && (
                              <textarea
                                value={customPromotions}
                                onChange={e => setCustomPromotions(e.target.value)}
                                placeholder="Ej: Este fin de semana 3x2 en postres, o 20% OFF adicional..."
                                rows={2}
                                className="w-full mt-2 bg-slate-50 border border-amber-200/60 p-3 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-amber-400 resize-none"
                              />
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
              </div>

              {/* RADAR DE NICHO VINCULADO */}
              {radarAnalysis ? (
                <div className="p-5 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl border-2 border-sky-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
                    <div className="flex items-center gap-3">
                       <span className="text-3xl">📡</span>
                       <div>
                          <div className="flex items-center gap-2">
                             <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Radar de Nicho Activo: {radarAnalysis.niche || activeProfile?.rubro}</h4>
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                            Se detectaron {radarAnalysis.trends?.length || 0} temas candentes y {radarAnalysis.ideas?.length || 0} ideas que alimentarán esta estrategia.
                          </p>
                       </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-sky-200 shadow-sm shrink-0">
                       <input 
                         type="checkbox" 
                         checked={useRadarContext} 
                         onChange={e => setUseRadarContext(e.target.checked)} 
                         className="w-4 h-4 accent-sky-600 rounded" 
                       />
                       <span className="text-xs font-bold text-sky-800">Conectar Radar</span>
                    </label>
                </div>
              ) : (!activeProfile?.rubro && !businessType) ? (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">⚠️</span>
                    <p className="text-xs text-amber-800 font-medium">
                      Para que nuestros agentes analicen tendencias con el <strong>Radar de Nicho</strong>, necesitas configurar el <strong>rubro</strong> de tu negocio.
                    </p>
                  </div>
                  <Link 
                    href="/automatizacion-rrss/panel/configuracion" 
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shrink-0"
                  >
                    Configurar Rubro
                  </Link>
                </div>
              ) : null}

              {/* INTEGRACIÓN DEL CATÁLOGO DE PRODUCTOS/SERVICIOS */}
              {regularCatalogItems.length > 0 && (
                <div className="p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🛍️</span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">3. Catálogo de Productos y Servicios</h3>
                        <p className="text-xs font-medium text-slate-500">
                          Tienes {regularCatalogItems.length} {regularCatalogItems.length === 1 ? 'producto/servicio' : 'productos/servicios'} en tu catálogo. ¿Cómo quieres integrarlos en este plan?
                        </p>
                      </div>
                    </div>
                    <Link href="/automatizacion-rrss/panel/catalogo" className="text-xs font-bold text-indigo-600 hover:underline">
                      Ver Catálogo
                    </Link>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <label 
                      onClick={() => setCatalogUsage('all')}
                      className={`flex-1 flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${catalogUsage === 'all' ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input type="radio" checked={catalogUsage === 'all'} onChange={() => setCatalogUsage('all')} className="accent-indigo-600" />
                        <span className="text-xs font-black text-slate-800">100% Catálogo</span>
                      </div>
                      <span className="text-[10px] text-slate-500 pl-5">Toda la estrategia se basará en tus productos, servicios y promociones.</span>
                    </label>

                    <label 
                      onClick={() => setCatalogUsage('mixed')}
                      className={`flex-1 flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${catalogUsage === 'mixed' ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input type="radio" checked={catalogUsage === 'mixed'} onChange={() => setCatalogUsage('mixed')} className="accent-indigo-600" />
                        <span className="text-xs font-black text-slate-800">A medias (Recomendado)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 pl-5">Mezcla tus productos/servicios y promociones con contenido general y de valor.</span>
                    </label>

                    <label 
                      onClick={() => setCatalogUsage('none')}
                      className={`flex-1 flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${catalogUsage === 'none' ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input type="radio" checked={catalogUsage === 'none'} onChange={() => setCatalogUsage('none')} className="accent-indigo-600" />
                        <span className="text-xs font-black text-slate-800">No usar productos individuales</span>
                      </div>
                      <span className="text-[10px] text-slate-500 pl-5">Solo usar las promociones marcadas arriba o contenido general.</span>
                    </label>
                  </div>

                  {/* SELECCIÓN DE PRODUCTOS Y SERVICIOS ESPECÍFICOS PARA ESTA PLANIFICACIÓN */}
                  {catalogUsage !== 'none' && (
                    <div className="pt-2 border-t border-slate-100">
                      <PlanProductsSelector
                        items={regularCatalogItems}
                        selectedItemIds={selectedCatalogItemIds}
                        onChangeSelectedIds={setSelectedCatalogItemIds}
                        loading={loadingCatalog}
                        title="Selecciona qué Productos o Servicios incluir en este Plan"
                        subtitle="Nuestros agentes generarán publicaciones destacando específicamente los ítems seleccionados."
                      />
                    </div>
                  )}
                </div>
              )}

              {/* INTEGRACIÓN DE ESTILOS VISUALES DE PROMPTS IA */}
              <PromptStyleSelector
                enabled={usePromptStyles}
                onToggleEnabled={setUsePromptStyles}
                selectedStyles={selectedPromptStyles}
                onChangeSelectedStyles={setSelectedPromptStyles}
                isCommercialPosterOnly={isCommercialPosterOnly}
                onToggleCommercialPosterOnly={setIsCommercialPosterOnly}
              />

              {/* FECHA Y HORA DE INICIO DE LA PLANIFICACIÓN */}
              <div className="p-6 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-white rounded-3xl border-2 border-indigo-100/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                      <span className="text-2xl">📅</span>
                      <div>
                          <h3 className="text-sm font-black text-slate-900 tracking-tight">Fecha y Hora de Inicio del Plan</h3>
                          <p className="text-xs font-medium text-slate-500">Define a partir de qué día y hora comenzará a publicarse esta estrategia.</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                            Fecha de Inicio (Primer Post)
                          </label>
                          <input 
                            type="date"
                            value={startDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 px-4 py-3 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all text-sm shadow-xs"
                          />
                      </div>

                      <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                            Hora Preferida
                          </label>
                          <input 
                            type="time"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 px-4 py-3 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all text-sm shadow-xs"
                          />
                      </div>
                  </div>

                  {scheduleContinuityInfo?.hasFuturePosts && (
                    <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-start gap-3">
                      <span className="text-xl shrink-0">🗓️</span>
                      <div className="text-xs text-emerald-900 leading-relaxed font-medium">
                        <strong className="font-black text-emerald-950 block mb-0.5">Continuación Inteligente de Calendario</strong>
                        Tienes publicaciones agendadas hasta el <strong>{scheduleContinuityInfo.lastScheduledDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>. Nuestros agentes han configurado el inicio de esta nueva estrategia para continuar el <strong>{new Date(startDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong> evitando cualquier solapamiento.
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-900 font-semibold">
                      <span>💡</span>
                      <span>
                        El primer contenido se programará para el <strong className="text-indigo-950 font-black">{new Date(startDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong> a las <strong className="text-indigo-950 font-black">{startTime} hrs</strong>, distribuyendo las siguientes publicaciones de forma progresiva.
                      </span>
                  </div>
              </div>

              <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight mb-3">Expectativas u Objetivos Especiales <span className="text-slate-400 font-medium">(Opcional)</span></h3>
                  <div className="relative">
                      <textarea 
                         value={expectations}
                         onChange={e => setExpectations(e.target.value)}
                         placeholder="Ej: Quiero enfocarme en vender zapatos rojos de verano... o lanzamos una nueva sucursal en Madrid..."
                         className="w-full bg-slate-50 border-2 border-slate-100 pl-4 pr-12 py-4 rounded-[20px] font-medium text-slate-700 outline-none focus:border-indigo-500 transition-colors resize-none mb-2 text-sm"
                         rows={3}
                      />
                      <VoiceMic 
                         onResult={(text) => setExpectations(prev => prev + (prev ? " " : "") + text)} 
                         className="absolute right-4 top-4 z-20"
                      />
                  </div>
                  <p className="text-xs text-slate-400 font-bold px-2">Combinado con tus <Link href="/automatizacion-rrss/panel/configuracion" className="text-indigo-500 underline">Datos de Negocio</Link>, nuestros agentes serán mucho más precisos.</p>
              </div>

             <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <p className="text-slate-400 font-bold text-xs">Negocio: <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{businessType || 'General'}</span></p>
                 
                 {!hasNetworks ? (
                    <Link href="/automatizacion-rrss/panel/configuracion" className="w-full sm:w-auto bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-700 font-black py-3 px-8 rounded-[24px] transition-all flex items-center justify-center gap-2 shadow-sm hover:-translate-y-1 text-sm">
                       ⚠️ Vincula una Red Social para Planificar
                    </Link>
                 ) : (
                     <button
                        onClick={handleGenerate}
                        disabled={generating || !selectedGoal}
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black py-3 px-8 rounded-[24px] transition-all shadow-xl shadow-slate-900/20 hover:-translate-y-1 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3 text-sm"
                     >
                         {generating ? <><div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> Diseñando Plan con Agentes...</> : 'Generar Estrategia con Agentes 🚀'}
                     </button>
                 )}
             </div>
          </div>
      </div>

      {strategyResult && strategyResult.length > 0 && (
          <div className="bg-white border-2 border-slate-100 p-8 md:p-12 rounded-[32px] shadow-xl shadow-slate-200/50 animate-in slide-in-from-bottom-8 duration-700 space-y-12 relative overflow-hidden mt-8">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl pointer-events-none font-black text-indigo-500">
                  {goals.find(g => g.id === selectedGoal)?.icon || '✨'}
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 border-b border-slate-100 pb-8">
                 <div className="flex items-center gap-5">
                     <span className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl flex items-center justify-center text-3xl shadow-sm border border-indigo-100">🎯</span>
                     <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-1">Plan Táctico de Contenidos</h2>
                        <div className="flex items-center gap-3 flex-wrap">
                           <p className="text-indigo-600 font-bold tracking-widest text-xs uppercase flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Generado para {goals.find(g => g.id === selectedGoal)?.title}
                           </p>
                           <span className="bg-indigo-50 text-indigo-700 text-xs font-black px-3 py-1 rounded-full border border-indigo-200">
                              Plan {userPlan.toUpperCase()}: {strategyResult.length} publicaciones ({strategyResult.filter(p => (p.format || '').toLowerCase().includes('reel') || (p.format || '').toLowerCase().includes('video')).length} videos, {strategyResult.filter(p => !(p.format || '').toLowerCase().includes('reel') && !(p.format || '').toLowerCase().includes('video')).length} con imagen)
                           </span>
                        </div>
                     </div>
                 </div>
                 <button
                    onClick={handleAcceptPlan}
                    disabled={accepting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-3 hover:-translate-y-1 group disabled:opacity-50 disabled:pointer-events-none"
                 >
                     {accepting ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando y Agendando...</> : <><span>✅</span> Aceptar y Agendar Planificación</>}
                 </button>
              </div>

              <div className="space-y-12 relative z-10">
                  {/* Group posts by weekNumber */}
                  {[...Array.from(new Set(strategyResult.map(p => p.weekNumber)))].sort().map(week => (
                      <div key={week} className="space-y-6">
                          <h3 className="text-slate-900 font-black text-2xl flex items-center gap-3">
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-1.5 rounded-full text-sm tracking-widest uppercase">Semana {week}</span>
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {strategyResult.filter(p => p.weekNumber === week).map((post, index) => {
                                  const postDate = computePostDate(startDate, startTime, post.dayOffset, post.suggestedTime);
                                  const dateStr = postDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
                                  const timeStr = postDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' hrs';
                                  const formatColor = post.format.toLowerCase().includes('reel') ? 'bg-pink-50 text-pink-600 border border-pink-100' : post.format.toLowerCase().includes('historia') ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100';

                                  return (
                                     <div key={index} className="bg-slate-50 border-2 border-slate-100/60 rounded-3xl p-6 hover:bg-white hover:border-indigo-100 transition-all group relative overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md">
                                         <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-50/50 transition-colors"></div>
                                         <div className="flex items-center justify-between mb-4 relative z-10">
                                            <div className="flex flex-col">
                                                <span className="text-slate-800 font-black capitalize text-lg tracking-tight">{dateStr}</span>
                                                <span className="text-slate-500 font-bold tracking-widest uppercase text-[10px] flex items-center gap-2">
                                                    <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {timeStr}
                                                </span>
                                            </div>
                                            <span className={`${formatColor} font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-xl`}>{post.format}</span>
                                         </div>

                                         {/* Product or Promotion badge if assigned */}
                                         {(post.productName || post.isPromotion) && (
                                            <div className={`flex flex-col gap-2 p-3 rounded-2xl border mb-3 relative z-10 shadow-xs ${post.isPromotion ? 'bg-rose-50/90 border-rose-200' : 'bg-amber-50/90 border-amber-200/90'}`}>
                                              <div className="flex items-center gap-2.5">
                                                {post.baseImageUrl ? (
                                                  <img 
                                                    src={post.baseImageUrl} 
                                                    alt={post.productName || 'Promo'} 
                                                    className={`w-10 h-10 rounded-xl object-cover border shadow-2xs shrink-0 ${post.isPromotion ? 'border-rose-300' : 'border-amber-300'}`} 
                                                  />
                                                ) : (
                                                  <span className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 ${post.isPromotion ? 'bg-rose-100 border-rose-200' : 'bg-amber-100 border-amber-200'}`}>
                                                    {post.isPromotion ? '🔥' : '🛍️'}
                                                  </span>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`text-[9px] font-black uppercase tracking-wider ${post.isPromotion ? 'text-rose-700' : 'text-amber-800'}`}>
                                                      {post.isPromotion ? '🔥 Promoción' : '🛍️ Producto'}
                                                    </span>
                                                    {(post.productOfferPrice || post.productPrice) && (
                                                      <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
                                                        {post.productOfferPrice || post.productPrice}
                                                      </span>
                                                    )}
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${post.baseImageUrl ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'}`}>
                                                      {post.baseImageUrl ? '✓ Foto Lista' : '🎨 Foto a Generar'}
                                                    </span>
                                                  </div>
                                                  <div className={`text-xs font-black truncate mt-0.5 ${post.isPromotion ? 'text-rose-950' : 'text-amber-950'}`}>
                                                    {post.productName || 'Oferta Especial'}
                                                  </div>
                                                  {post.productDescription && (
                                                    <div className={`text-[10px] font-medium line-clamp-1 mt-0.5 ${post.isPromotion ? 'text-rose-800/80' : 'text-amber-800/80'}`}>
                                                      {post.productDescription}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Selector rápido por post: Imagen CON texto vs SIN texto + Formato Tipográfico de Agentes */}
                                              {!post.format.toLowerCase().includes('reel') && !post.format.toLowerCase().includes('video') && (
                                                <div className="space-y-2 pt-2 border-t border-black/5">
                                                  <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-bold text-slate-600">Formato de imagen:</span>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const currentWithText = post.promoImageMode ? post.promoImageMode === 'with_text' : Boolean(post.isCommercialPoster);
                                                        const nextMode = currentWithText ? 'without_text' : 'with_text';
                                                        setStrategyResult((prev) =>
                                                          (prev || []).map((item) =>
                                                            item === post
                                                              ? {
                                                                  ...item,
                                                                  promoImageMode: nextMode,
                                                                  isCommercialPoster: nextMode === 'with_text',
                                                                }
                                                              : item
                                                          )
                                                        );
                                                      }}
                                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                                                        (post.promoImageMode ? post.promoImageMode === 'with_text' : Boolean(post.isCommercialPoster))
                                                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                                      }`}
                                                      title="Haz clic para cambiar entre Imagen CON Texto y SIN Texto"
                                                    >
                                                      {(post.promoImageMode ? post.promoImageMode === 'with_text' : Boolean(post.isCommercialPoster))
                                                        ? '🏷️ Imagen CON Texto'
                                                        : '📸 Imagen SIN Texto'}
                                                    </button>
                                                  </div>

                                                  {(post.promoImageMode ? post.promoImageMode === 'with_text' : Boolean(post.isCommercialPoster)) && (
                                                    <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200/80 space-y-2">
                                                      <div className="flex items-start justify-between gap-1.5">
                                                        <div>
                                                          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">
                                                            🎯 Formato sugerido por nuestros agentes
                                                          </span>
                                                          <span className="text-[11px] font-black text-slate-900">
                                                            {post.textFormatLabel || 'Cabecera Superior · Bold Impacto'}
                                                          </span>
                                                        </div>
                                                      </div>
                                                      {post.artDirectionReasoning && (
                                                        <p className="text-[10px] text-slate-600 leading-snug italic">
                                                          "{post.artDirectionReasoning}"
                                                        </p>
                                                      )}
                                                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                                                        <div>
                                                          <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5">
                                                            Posición del Texto
                                                          </label>
                                                          <select
                                                            value={post.layoutPosition || 'top_banner'}
                                                            onChange={(e) => {
                                                              const newLayout = e.target.value as any;
                                                              const layoutLabels: Record<string, string> = {
                                                                split_left: 'Split Lateral Izquierdo',
                                                                split_right: 'Split Lateral Derecho',
                                                                top_banner: 'Cabecera Superior',
                                                                recipe_ingredients: 'Ficha Editorial / Atributos',
                                                              };
                                                              const fontLabels: Record<string, string> = {
                                                                bold_modern: 'Bold Impacto',
                                                                elegant_serif: 'Serif Elegante',
                                                                script_handwritten: 'Script Artesanal',
                                                                clean_minimal: 'Minimalista Limpio',
                                                                serif_script_mix: 'Mix Editorial',
                                                              };
                                                              const curFont = post.fontStyle || 'bold_modern';
                                                              setStrategyResult((prev) =>
                                                                (prev || []).map((item) =>
                                                                  item === post
                                                                    ? {
                                                                        ...item,
                                                                        layoutPosition: newLayout,
                                                                        textFormatLabel: `${layoutLabels[newLayout] || 'Cabecera Superior'} · ${fontLabels[curFont] || 'Bold Impacto'}`,
                                                                      }
                                                                    : item
                                                                )
                                                              );
                                                            }}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500"
                                                          >
                                                            <option value="split_left">◧ Split Izquierdo</option>
                                                            <option value="split_right">◨ Split Derecho</option>
                                                            <option value="top_banner">⬆️ Cabecera Superior</option>
                                                            <option value="recipe_ingredients">📋 Ficha Editorial</option>
                                                          </select>
                                                        </div>
                                                        <div>
                                                          <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5">
                                                            Tipografía
                                                          </label>
                                                          <select
                                                            value={post.fontStyle || 'bold_modern'}
                                                            onChange={(e) => {
                                                              const newFont = e.target.value as any;
                                                              const layoutLabels: Record<string, string> = {
                                                                split_left: 'Split Lateral Izquierdo',
                                                                split_right: 'Split Lateral Derecho',
                                                                top_banner: 'Cabecera Superior',
                                                                recipe_ingredients: 'Ficha Editorial / Atributos',
                                                              };
                                                              const fontLabels: Record<string, string> = {
                                                                bold_modern: 'Bold Impacto',
                                                                elegant_serif: 'Serif Elegante',
                                                                script_handwritten: 'Script Artesanal',
                                                                clean_minimal: 'Minimalista Limpio',
                                                                serif_script_mix: 'Mix Editorial',
                                                              };
                                                              const curLayout = post.layoutPosition || 'top_banner';
                                                              setStrategyResult((prev) =>
                                                                (prev || []).map((item) =>
                                                                  item === post
                                                                    ? {
                                                                        ...item,
                                                                        fontStyle: newFont,
                                                                        textFormatLabel: `${layoutLabels[curLayout] || 'Cabecera Superior'} · ${fontLabels[newFont] || 'Bold Impacto'}`,
                                                                      }
                                                                    : item
                                                                )
                                                              );
                                                            }}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500"
                                                          >
                                                            <option value="bold_modern">🔥 Bold Impacto</option>
                                                            <option value="elegant_serif">✨ Serif Elegante</option>
                                                            <option value="script_handwritten">✍️ Script Artesanal</option>
                                                            <option value="clean_minimal">💎 Minimalista</option>
                                                            <option value="serif_script_mix">📰 Mix Editorial</option>
                                                          </select>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                         )}

                                         {/* Formato de imagen y texto para posts generales (sin producto/promo específica) */}
                                         {!(post.productName || post.isPromotion) && !post.format.toLowerCase().includes('reel') && !post.format.toLowerCase().includes('video') && (
                                            <div className="p-3 rounded-2xl bg-slate-100/70 border border-slate-200/80 mb-3 relative z-10 space-y-2">
                                              <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] font-bold text-slate-600">Formato de imagen:</span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const currentWithText = post.promoImageMode ? post.promoImageMode === 'with_text' : Boolean(post.isCommercialPoster);
                                                    const nextMode = currentWithText ? 'without_text' : 'with_text';
                                                    setStrategyResult((prev) =>
                                                      (prev || []).map((item) =>
                                                        item === post
                                                          ? {
                                                              ...item,
                                                              promoImageMode: nextMode,
                                                              isCommercialPoster: nextMode === 'with_text',
                                                            }
                                                          : item
                                                      )
                                                    );
                                                  }}
                                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                                                    (post.promoImageMode ? post.promoImageMode === 'with_text' : Boolean(post.isCommercialPoster))
                                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                                  }`}
                                                >
                                                  {(post.promoImageMode ? post.promoImageMode === 'with_text' : Boolean(post.isCommercialPoster))
                                                    ? '🏷️ Imagen CON Texto'
                                                    : '📸 Imagen SIN Texto'}
                                                </button>
                                              </div>
                                              {(post.promoImageMode ? post.promoImageMode === 'with_text' : Boolean(post.isCommercialPoster)) && (
                                                <div className="p-2 rounded-xl bg-white border border-slate-200/80 space-y-1">
                                                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">
                                                    🎯 Formato sugerido: {post.textFormatLabel || 'Cabecera Superior · Mix Editorial'}
                                                  </span>
                                                  {post.artDirectionReasoning && (
                                                    <p className="text-[10px] text-slate-500 leading-snug italic">
                                                      "{post.artDirectionReasoning}"
                                                    </p>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                         )}

                                         {/* Video Template badge if assigned */}
                                          {(post.videoTemplateName || post.videoCommand) && (
                                             <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-purple-50/80 border border-purple-100/90 mb-4 relative z-10">
                                               <span className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-base shrink-0">🎬</span>
                                               <div className="min-w-0 flex-1">
                                                 <div className="flex items-center gap-1.5 flex-wrap">
                                                   <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Plantilla Oficial de Video</span>
                                                   <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                                     Máx 10s
                                                   </span>
                                                   {post.needsBaseImageFirst && (
                                                     <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                       📸 Foto previa por agentes
                                                     </span>
                                                   )}
                                                 </div>
                                                 <div className="text-xs font-black text-purple-950 truncate mt-0.5">{post.videoTemplateName || post.videoCommand}</div>
                                                 {post.videoMotionStyle && (
                                                   <div className="text-[10px] text-purple-700/80 font-medium line-clamp-1 mt-0.5">🎥 {post.videoMotionStyle}</div>
                                                 )}
                                               </div>
                                             </div>
                                          )}

                                          {/* Style badge if assigned */}
                                         {post.visualStyle && (
                                            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-indigo-50/80 border border-indigo-100/90 mb-4 relative z-10">
                                              {post.previewUrl ? (
                                                <img 
                                                  src={post.previewUrl} 
                                                  alt={post.visualStyle} 
                                                  className="w-10 h-10 rounded-xl object-cover border border-indigo-200/80 shadow-xs shrink-0" 
                                                />
                                              ) : (
                                                <span className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-base shrink-0">🎨</span>
                                              )}
                                              <div className="min-w-0 flex-1">
                                                <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Estilo Visual de Agentes</div>
                                                <div className="text-xs font-black text-indigo-950 truncate">{post.visualStyle}</div>
                                                {post.imageDirection && (
                                                  <div className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">{post.imageDirection}</div>
                                                )}
                                              </div>
                                            </div>
                                         )}
                                         
                                         <div className="flex-1 space-y-4 relative z-10">
                                            <div>
                                                <h4 className="text-indigo-900 font-black text-xl leading-tight mb-2">"{post.hook}"</h4>
                                                <p className="text-slate-600 text-sm font-medium leading-relaxed">{post.content}</p>
                                            </div>
                                         </div>

                                         <div className="mt-6 pt-4 border-t border-slate-200 relative z-10">
                                            <span className="absolute -top-3 left-4 bg-slate-50 group-hover:bg-white transition-colors text-slate-400 text-[9px] font-black uppercase tracking-widest px-2">Llamado a la acción</span>
                                            <p className="text-indigo-600 font-bold text-sm italic">🔸 {post.cta}</p>
                                         </div>
                                     </div>
                                  );
                              })}
                          </div>
                      </div>
                  ))}
              </div>
              
              <div className="flex justify-end pt-8 border-t border-slate-100 relative z-10">
                 <p className="text-slate-500 font-medium text-sm text-right max-w-md">Al Aceptar la Planificación, estos contenidos se enviarán a tu calendario de <strong className="text-slate-900">Próximos Posts</strong> como borradores. Podrás editarlos individualmente antes de publicar.</p>
              </div>
          </div>
      )}
      <StatusModal 
        {...modal} 
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
