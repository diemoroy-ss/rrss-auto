"use client";

import { useState, useEffect, useMemo } from "react";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { useProfile } from "../../../../contexts/ProfileContext";
import { useRouter } from "next/navigation";
import PromptStyleSelector from "../../../../components/strategy/PromptStyleSelector";
import { PromptTemplate } from "../../../../lib/prompt-templates";
import { appendContactInfo } from "../../../../lib/contact-helper";
import StatusModal from "../../../../components/StatusModal";
import { getScheduleContinuityFromList, parseScheduledDate, ScheduleContinuityResult } from "../../../../lib/schedule-continuity";

export default function NicheRadarPage() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const [user, setUser] = useState<any>(null);

  const [nicheInput, setNicheInput] = useState<string>("");
  const [audienceInput, setAudienceInput] = useState<string>("");
  const [customKeywords, setCustomKeywords] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [initialChecking, setInitialChecking] = useState<boolean>(true);
  const [analysis, setAnalysis] = useState<RadarAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"ideas" | "trends" | "questions" | "hooks">("ideas");
  const [copiedHookId, setCopiedHookId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Status Modal State (Reemplazo moderno de alerts)
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "confirm";
    title: string;
    message: string;
    onConfirm?: (() => void) | null;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  // Plan and Limits
  const [userPlan, setUserPlan] = useState<string>("free");
  const [systemPlans, setSystemPlans] = useState<any>({});
  const [postsThisMonth, setPostsThisMonth] = useState<number>(0);
  const [videosThisMonth, setVideosThisMonth] = useState<number>(0);

  // Strategy State
  const [strategyGoal, setStrategyGoal] = useState<string>("");
  const [strategyExpectations, setStrategyExpectations] = useState<string>("");
  const [usePromptStyles, setUsePromptStyles] = useState<boolean>(false);
  const [selectedPromptStyles, setSelectedPromptStyles] = useState<PromptTemplate[]>([]);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    if (d.getHours() >= 18) d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [startTime, setStartTime] = useState<string>("10:00");
  const [generatingStrategy, setGeneratingStrategy] = useState<boolean>(false);
  const [strategyResult, setStrategyResult] = useState<any[] | null>(null);
  const [acceptingStrategy, setAcceptingStrategy] = useState<boolean>(false);
  const [scheduleContinuityInfo, setScheduleContinuityInfo] = useState<ScheduleContinuityResult | null>(null);

  // Modal State
  const [postModal, setPostModal] = useState<{isOpen: boolean, idea: ContentIdea | null}>({isOpen: false, idea: null});

  // History State
  const [historicalAnalyses, setHistoricalAnalyses] = useState<any[]>([]);
  const [includeLogoInStrategy, setIncludeLogoInStrategy] = useState<boolean>(true);

  // Test Mode State (Exclusivo santisoftai@gmail.com)
  const isSantisoftAdmin = user?.email === "santisoftai@gmail.com";
  const [userData, setUserData] = useState<any>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [testRubro, setTestRubro] = useState<string>("");
  const [testBusinessDescription, setTestBusinessDescription] = useState<string>("");
  const [testGoalDescription, setTestGoalDescription] = useState<string>("");
  const [testSelectedNetworks, setTestSelectedNetworks] = useState<string[]>([
    "instagram",
    "facebook",
    "tiktok",
    "googleBusiness"
  ]);
  const [testProducts, setTestProducts] = useState<Array<{
    id: string;
    name: string;
    type: "producto" | "servicio";
    description: string;
    price?: string;
  }>>([]);
  const [newProductName, setNewProductName] = useState<string>("");
  const [newProductType, setNewProductType] = useState<"producto" | "servicio">("producto");
  const [newProductDesc, setNewProductDesc] = useState<string>("");
  const [newProductPrice, setNewProductPrice] = useState<string>("");
  const [previewPostModal, setPreviewPostModal] = useState<any | null>(null);

  // Resolver perfil de santisoftai@gmail.com que contiene los tokens sociales conectados
  const santisoftProfile = useMemo(() => {
    if (!isSantisoftAdmin || !userData) return null;
    const profiles = Array.isArray(userData.profiles) ? userData.profiles : [];
    return (
      profiles.find(
        (p: any) =>
          p.instagramToken_enc ||
          p.facebookToken_enc ||
          p.tiktokToken_enc ||
          p.googleBusinessToken_enc
      ) ||
      profiles.find((p: any) => p.id === "default") ||
      profiles[0] ||
      null
    );
  }, [isSantisoftAdmin, userData]);

  // Cuentas sociales disponibles configuradas en santisoftai@gmail.com
  const availableSantisoftAccounts = useMemo(() => {
    const p = santisoftProfile || {};
    const u = userData || {};
    return {
      instagram: !!(p.instagramToken_enc || u.instagramToken_enc),
      facebook: !!(p.facebookToken_enc || u.facebookToken_enc),
      tiktok: !!(p.tiktokToken_enc || u.tiktokToken_enc),
      googleBusiness: !!(p.googleBusinessToken_enc || u.googleBusinessToken_enc),
      linkedin: !!(p.linkedinUserToken_enc || p.linkedinToken_enc || u.linkedinUserToken_enc),
      youtube: !!(p.youtubeToken_enc || p.accounts?.youtube),
      x: !!(p.xToken_enc || p.accounts?.x)
    };
  }, [santisoftProfile, userData]);

  // Sincronizar selección inicial de redes con las realmente vinculadas
  useEffect(() => {
    if (isSantisoftAdmin && userData) {
      const activeKeys = Object.entries(availableSantisoftAccounts)
        .filter(([_, hasToken]) => hasToken)
        .map(([key]) => key);
      if (activeKeys.length > 0) {
        setTestSelectedNetworks(activeKeys);
      }
    }
  }, [isSantisoftAdmin, userData, availableSantisoftAccounts]);

  const formatRadarDate = (createdAt: any) => {
    if (!createdAt) return "";
    let d: Date;
    if (createdAt?.toDate && typeof createdAt.toDate === 'function') {
      d = createdAt.toDate();
    } else if (createdAt?._seconds) {
      d = new Date(createdAt._seconds * 1000);
    } else if (createdAt?.seconds) {
      d = new Date(createdAt.seconds * 1000);
    } else {
      d = new Date(createdAt);
    }
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
  };

  const resolveStrategyDates = (strategy: any[], existingDates: number[], startD: string, startT: string) => {
    const allocated: number[] = [...existingDates];
    const now = Date.now();

    const [y, m, d] = (startD || new Date().toISOString().split('T')[0]).split('-').map(Number);
    let baseDate = new Date(y, m - 1, d);

    // Si existen posts futuros agendados y la fecha de inicio es anterior o igual al último post agendado,
    // ajustamos la fecha base para que continúe al día siguiente del último agendado.
    const futureExisting = existingDates.filter(ts => ts > now);
    if (futureExisting.length > 0) {
      const maxExistingTs = Math.max(...futureExisting);
      const maxExistingDate = new Date(maxExistingTs);
      if (baseDate.getTime() <= maxExistingDate.getTime()) {
        const nextDay = new Date(maxExistingTs);
        nextDay.setDate(nextDay.getDate() + 1);
        baseDate = nextDay;
      }
    }

    return strategy.map((post, idx) => {
      let targetDate = new Date(baseDate);
      const dayOffset = typeof post.dayOffset === 'number' ? post.dayOffset : idx;
      targetDate.setDate(targetDate.getDate() + dayOffset);

      let timeStr = (dayOffset === 0 && startT) ? startT : (post.suggestedTime || startT || "10:00");
      let hour = 10;
      let minute = 0;
      if (timeStr && timeStr.includes(':')) {
        const [h, min] = timeStr.split(':');
        hour = parseInt(h, 10) || 10;
        minute = parseInt(min, 10) || 0;
      }
      targetDate.setHours(hour, minute, 0, 0);

      // Si la fecha calculada ya pasó o está muy cerca de este momento (menos de 30 mins)
      if (targetDate.getTime() < now + 30 * 60 * 1000) {
        targetDate.setTime(now + 45 * 60 * 1000);
      }

      // Evitar colisión con posts existentes o previos (mínimo 3 horas de diferencia)
      let attempts = 0;
      while (allocated.some(ts => Math.abs(ts - targetDate.getTime()) < 3 * 60 * 60 * 1000) && attempts < 30) {
        attempts++;
        targetDate.setHours(targetDate.getHours() + 3);
        if (targetDate.getHours() >= 21 || targetDate.getHours() < 9) {
          targetDate.setDate(targetDate.getDate() + 1);
          targetDate.setHours(11, 0, 0, 0);
        }
      }

      allocated.push(targetDate.getTime());
      return {
        ...post,
        computedScheduledDate: targetDate
      };
    });
  };

  const goals = [
    { id: 'ventas', title: 'Ventas & Conversión', description: 'Maximizar pedidos y ventas', icon: '💰' },
    { id: 'autoridad', title: 'Autoridad & Marca', description: 'Posicionarte como experto', icon: '🎙️' },
    { id: 'viralidad', title: 'Viralidad & Alcance', description: 'Llegar a miles de cuentas', icon: '🚀' },
    { id: 'lealtad', title: 'Comunidad & Lealtad', description: 'Crear fans y embajadores', icon: '❤️' },
    { id: 'prospectos', title: 'Captación de Prospectos', description: 'Atraer registros y DMs', icon: '📥' }
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const autoGoal = urlParams.get('autoGoal');
      if (autoGoal) {
        const mapping: any = {
           crecimiento: 'viralidad',
           ventas: 'ventas',
           autoridad: 'autoridad',
           interaccion: 'lealtad'
        };
        const targetId = mapping[autoGoal.toLowerCase()] || autoGoal.toLowerCase();
        if (goals.find(g => g.id === targetId)) {
           setStrategyGoal(targetId);
           setTimeout(() => {
               document.getElementById('generador-estrategia')?.scrollIntoView({ behavior: 'smooth' });
           }, 800);
        }
      }
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // Fetch plans config
          const sysSnap = await getDoc(doc(db, "system_config", "plans"));
          if (sysSnap.exists()) {
            setSystemPlans(sysSnap.data());
          }

          // Fetch user plan and stats
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
             const uData = userDoc.data();
             setUserData(uData);
             setUserPlan(uData.plan || "free");
             
             const firstDayOfMonth = new Date();
             firstDayOfMonth.setDate(1);
             firstDayOfMonth.setHours(0, 0, 0, 0);

             const q = query(collection(db, "social_posts"), where("userId", "==", u.uid));
             const snap = await getDocs(q);
             let pCount = 0;
             let vCount = 0;
             snap.docs.forEach(d => {
                 const data = d.data();
                 if (data.createdAt && data.createdAt.toDate() >= firstDayOfMonth) {
                    pCount++;
                    if (data.type === 'Reel' || data.type === 'Video') {
                        vCount++;
                    }
                 }
             });
             setPostsThisMonth(pCount);
             setVideosThisMonth(vCount);
          }
        } catch (e) {
          console.error("Error fetching user stats", e);
        }
      }
    });
    return () => unsub();
  }, []);

  // Cargar continuidad de publicaciones agendadas para la marca activa
  useEffect(() => {
    async function checkScheduleContinuity() {
      if (!user) return;
      try {
        const qPosts = query(collection(db, "social_posts"), where("userId", "==", user.uid));
        const snapPosts = await getDocs(qPosts);
        const postsList = snapPosts.docs.map(d => ({ id: d.id, ...d.data() }));
        const cont = getScheduleContinuityFromList(postsList, activeProfile?.id, 10);
        setScheduleContinuityInfo(cont);
        if (cont.hasFuturePosts) {
          setStartDate(cont.nextDateString);
        }
      } catch (e) {
        console.warn("No se pudo cargar la continuidad de programación:", e);
      }
    }
    checkScheduleContinuity();
  }, [user, activeProfile?.id]);

  // Set default niche input when activeProfile changes
  useEffect(() => {
    if (activeProfile) {
      const prof = activeProfile as any;
      const defaultNiche = prof.rubro || prof.niche || prof.category || "";
      if (defaultNiche && !nicheInput) {
        setNicheInput(defaultNiche);
      }
      if (prof.targetAudience && !audienceInput) {
        setAudienceInput(prof.targetAudience);
      }
    }
  }, [activeProfile]);

  // Cargar análisis previo si existe
  useEffect(() => {
    async function loadInitialData() {
      if (!user || !activeProfile?.id) {
        setInitialChecking(false);
        return;
      }
      setInitialChecking(true);
      try {
        let history: any[] = [];
        try {
          const radarCol = collection(db, "users", user.uid, "businesses", activeProfile.id, "radar");
          const q = query(radarCol, orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          snap.forEach(d => {
            history.push({ id: d.id, ...d.data() });
          });
        } catch (directErr) {
          console.warn("Consulta directa a Firestore falló o no tiene permiso, usando API fallback:", directErr);
        }

        if (history.length > 0) {
          setHistoricalAnalyses(history);
          setAnalysis(history[0]);
          if (history[0].niche && !nicheInput) setNicheInput(history[0].niche);
          if (history[0].targetAudience && !audienceInput) setAudienceInput(history[0].targetAudience);
        } else {
          const prof = activeProfile as any;
          const token = await user.getIdToken();
          const res = await fetch("/api/nicho/radar", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              niche: nicheInput || prof.rubro || "General",
              businessName: prof.name || prof.businessName || "Mi Negocio",
              targetAudience: audienceInput,
              userId: user.uid,
              businessId: activeProfile.id,
              checkCacheOnly: true,
              forceRefresh: false,
            }),
          });

          const data = await res.json();
          if (data.success && data.analysis) {
            setAnalysis(data.analysis);
            setHistoricalAnalyses([data.analysis]);
            if (data.analysis.niche && !nicheInput) setNicheInput(data.analysis.niche);
            if (data.analysis.targetAudience && !audienceInput) setAudienceInput(data.analysis.targetAudience);
          }
        }
      } catch (err) {
        console.warn("No se pudo cargar el análisis inicial del radar:", err);
      } finally {
        setInitialChecking(false);
      }
    }

    if (user && activeProfile?.id) {
      loadInitialData();
    } else {
      setInitialChecking(false);
    }
  }, [user, activeProfile?.id]);

  const handleRunRadar = async (forceRefresh = true) => {
    const prof = activeProfile as any;
    const targetNiche = nicheInput.trim() || prof?.rubro || prof?.niche || "General";
    if (!targetNiche) {
      setErrorMsg("Por favor, especifica un nicho o rubro para analizar.");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetch("/api/nicho/radar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          niche: targetNiche,
          businessName: prof?.name || prof?.businessName || "Mi Negocio",
          targetAudience: audienceInput,
          customKeywords,
          userId: user?.uid,
          businessId: activeProfile?.id,
          forceRefresh,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ocurrió un error al analizar el nicho.");
      }

      setAnalysis(data.analysis);
      
      // Añadir al historial localmente para que se refleje de inmediato
      setHistoricalAnalyses(prev => {
          // avoid duplicates if same id
          if (prev.find(p => p.id === data.analysis.id)) return prev;
          return [data.analysis, ...prev];
      });
    } catch (err: any) {
      console.error("Error al ejecutar radar:", err);
      setErrorMsg(err.message || "Error al conectar con nuestros agentes.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestProduct = () => {
    if (!newProductName.trim()) return;
    const item = {
      id: `test-${Date.now()}`,
      name: newProductName.trim(),
      type: newProductType,
      description: newProductDesc.trim(),
      price: newProductPrice.trim() || undefined
    };
    setTestProducts(prev => [...prev, item]);
    setNewProductName("");
    setNewProductDesc("");
    setNewProductPrice("");
  };

  const handleRemoveTestProduct = (id: string) => {
    setTestProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleLoadExampleTestProducts = () => {
    setTestRubro("Cafetería de Especialidad & Pastelería");
    setTestBusinessDescription("Cafetería boutique que tuesta sus propios granos de origen y ofrece pastelería artesanal horneada cada mañana, con ambiente pet friendly y opciones veganas.");
    setTestGoalDescription("Aumentar visitas los fines de semana y vender packs de café en grano para regalo");
    setStrategyGoal("ventas");
    setTestProducts([
      {
        id: "ex-1",
        name: "Café de Especialidad Etiopía Yirgacheffe 250g",
        type: "producto",
        description: "Granos 100% arábica con notas florales y cítricas, tostado medio artesanal.",
        price: "$12.990 CLP"
      },
      {
        id: "ex-2",
        name: "Brunch para Dos Fines de Semana",
        type: "servicio",
        description: "2 cafés de especialidad a elección, tostadas con palta y huevo pochado, y 2 croissants artesanales.",
        price: "$19.990 CLP"
      },
      {
        id: "ex-3",
        name: "Cinnamon Roll Glaseado Artesanal",
        type: "producto",
        description: "Roll de canela recién horneado con glaseado cremoso de queso crema y nueces pecanas.",
        price: "$3.500 CLP"
      }
    ]);
  };

  const handleGenerateStrategy = async () => {
    if (!strategyGoal) {
      setErrorMsg("Selecciona una meta para tu estrategia.");
      return;
    }

    if (isSantisoftAdmin && isTestMode && !testRubro.trim()) {
      setErrorMsg("Por favor, ingresa el rubro de prueba para continuar.");
      return;
    }

    setGeneratingStrategy(true);
    setStrategyResult(null);

    let postsPerWeek = 1;
    if (userPlan === 'starter') postsPerWeek = 3;
    if (userPlan === 'pro') postsPerWeek = 5;
    if (userPlan === 'business') postsPerWeek = 20;
    if (userPlan === 'agency') postsPerWeek = 50;

    const isRunningTestMode = isSantisoftAdmin && isTestMode;
    const prof = activeProfile as any;
    const effectiveBusinessType = isRunningTestMode ? testRubro.trim() : (prof?.rubro || "General");
    const effectiveExpectations = isRunningTestMode 
      ? [testGoalDescription ? `Lo que se busca: ${testGoalDescription}` : "", strategyExpectations].filter(Boolean).join(". ")
      : strategyExpectations;
    const effectiveBusinessData = isRunningTestMode 
      ? {
          businessName: "Negocio de Prueba",
          businessDescription: testBusinessDescription.trim() || `Negocio del rubro ${testRubro}`,
          website: "https://ejemplo.com",
          phone: "+56912345678",
          whatsapp: "+56912345678",
          email: "contacto@ejemplo.com",
          address: "Santiago, Chile"
        }
      : {
          businessName: prof?.name || prof?.businessName || "Mi Negocio",
          businessDescription: prof?.businessDescription || "",
          website: prof?.website || "",
          phone: prof?.phone || "",
          whatsapp: prof?.whatsapp || prof?.phone || "",
          email: prof?.email || "",
          address: prof?.address || ""
        };

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/ai/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          goal: strategyGoal,
          goalName: goals.find(g => g.id === strategyGoal)?.title,
          businessType: effectiveBusinessType,
          userId: user.uid,
          expectations: effectiveExpectations,
          businessData: effectiveBusinessData,
          connectedPlatforms: {
              facebook: isRunningTestMode ? testSelectedNetworks.includes('facebook') : !!prof?.facebookToken_enc,
              instagram: isRunningTestMode ? testSelectedNetworks.includes('instagram') : !!prof?.instagramToken_enc,
              tiktok: isRunningTestMode ? testSelectedNetworks.includes('tiktok') : !!prof?.tiktokToken_enc,
              linkedin: isRunningTestMode ? testSelectedNetworks.includes('linkedin') : !!prof?.linkedinUserToken_enc
          },
          nicheContext: isRunningTestMode
            ? `${analysis?.summary ? analysis.summary + " " : ""}Contexto de prueba: ${testBusinessDescription}`
            : (analysis?.summary || ""),
          postsPerWeek: isRunningTestMode ? 5 : postsPerWeek,
          usePromptStyles,
          selectedPromptStyles: usePromptStyles ? selectedPromptStyles : [],
          catalogoItems: isRunningTestMode ? testProducts : undefined,
          catalogUsage: isRunningTestMode && testProducts.length > 0 ? "all" : undefined
        })
      });

      if (!res.ok) throw new Error("Error al generar estrategia");
      const data = await res.json();

      let upcomingTimestamps: number[] = [];
      try {
        const qPosts = query(
          collection(db, "social_posts"),
          where("userId", "==", user.uid)
        );
        const snapPosts = await getDocs(qPosts);
        snapPosts.docs.forEach(d => {
          const p = d.data();
          if (activeProfile?.id && p.profileId && p.profileId !== activeProfile.id) return;
          const status = p.status || '';
          if (status !== 'confirmed' && status !== 'pending') return;
          const dateObj = parseScheduledDate(p.scheduledFor);
          if (dateObj) upcomingTimestamps.push(dateObj.getTime());
        });
      } catch (qErr) {
        console.warn("No se pudieron consultar posts previos para evitar solapamientos:", qErr);
      }

      const resolved = resolveStrategyDates(data.strategy || [], upcomingTimestamps, startDate, startTime);
      setStrategyResult(resolved);
    } catch (err: any) {
      setErrorMsg("Error al generar la estrategia.");
    } finally {
      setGeneratingStrategy(false);
    }
  };

  const handleAcceptStrategy = async () => {
    if (!strategyResult || !user) return;
    setAcceptingStrategy(true);
    try {
      const postsRef = collection(db, "social_posts");
      const isRunningTestMode = isSantisoftAdmin && isTestMode;
      const targetProfileId = isRunningTestMode
        ? (santisoftProfile?.id || 'default')
        : (activeProfile?.id || 'default');
      const targetNetworks = isRunningTestMode
        ? (testSelectedNetworks.length > 0 ? testSelectedNetworks : ['instagram', 'facebook'])
        : ['instagram', 'facebook'];

      for (const post of strategyResult) {
          const scheduledDate = post.computedScheduledDate ? new Date(post.computedScheduledDate) : new Date();

          const fmt = post.format?.toLowerCase() || "";
          const postType = fmt.includes('reel') || fmt.includes('video') ? 'Reel' : (fmt.includes('historia') || fmt.includes('story') ? 'Story' : 'Post');

          const postBaseText = `${post.content}\n\n${post.cta}`;
          const finalTextWithContact = appendContactInfo(postBaseText, isRunningTestMode ? null : activeProfile);

          const newPostRef = await addDoc(postsRef, {
              userId: user.uid,
              profileId: targetProfileId,
              text: finalTextWithContact,
              idea: post.hook,
              type: postType,
              status: 'confirmed', // DIRECTAMENTE CONFIRMADO Y AGENDADO
              scheduledFor: scheduledDate,
              createdAt: new Date(),
              networks: targetNetworks,
              generatedBy: isRunningTestMode ? 'ai_strategy_radar_test' : 'ai_strategy_radar',
              isTestMode: isRunningTestMode,
              testMode: isRunningTestMode,
              testAccountUser: isRunningTestMode ? 'santisoftai@gmail.com' : null,
              includeLogo: includeLogoInStrategy,
              visualStyle: post.visualStyle || null,
              promptTemplateId: post.promptTemplateId || null,
              previewUrl: post.previewUrl || null,
              imageDirection: post.imageDirection || null
          });

          try {
              const idToken = await auth.currentUser?.getIdToken();
              await fetch('/api/tasks/schedule', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                  body: JSON.stringify({ postId: newPostRef.id, scheduledFor: scheduledDate.toISOString() })
              });
          } catch (scheduleErr) {
              console.error("Warning: Could not schedule GCP task from radar", scheduleErr);
          }
      }
      setStatusModal({
          isOpen: true,
          type: "success",
          title: "¡Planificación Agendada!",
          message: "Tus publicaciones han quedado inmediatamente agendadas y confirmadas en tu calendario de redes sociales.",
          onConfirm: () => router.push("/automatizacion-rrss/panel")
      });
    } catch (e) {
      setErrorMsg("Error al guardar planificación.");
      setAcceptingStrategy(false);
    }
  };

  const handleCreatePostFromIdea = (idea: ContentIdea) => {
    setPostModal({isOpen: true, idea});
  };

  const handleModalPostCreate = (type: 'Post' | 'Reel') => {
    if (!postModal.idea) return;
    const idea = postModal.idea;
    const params = new URLSearchParams({
      topic: idea.title,
      format: type,
      hook: idea.draftHook || "",
      angle: idea.angle || "",
    });
    router.push(`/automatizacion-rrss/panel/crear?${params.toString()}`);
  };

  const handleCopyHook = (hookText: string, id: string) => {
    navigator.clipboard.writeText(hookText);
    setCopiedHookId(id);
    setTimeout(() => setCopiedHookId(null), 2000);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-black tracking-wider uppercase">
                  Radar de Nicho & Tendencias
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                  Últimos 30 días
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black mt-2 tracking-tight">
                Espía de Tendencias e Insights
              </h1>
              <p className="text-slate-300 text-xs md:text-sm max-w-2xl mt-1 font-medium leading-relaxed">
                Descubre qué preguntas se hace tu cliente ideal, qué temas están en tendencia y obtén ganchos de alta retención para dominar tu sector.
              </p>
            </div>

            {historicalAnalyses.length > 0 && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-xs font-bold">
                <span>📚 Historial:</span>
                <select
                  onChange={(e) => {
                    const selected = historicalAnalyses.find(h => h.id === e.target.value);
                    if (selected) setAnalysis(selected);
                  }}
                  value={analysis?.id || ""}
                  className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
                >
                  {historicalAnalyses.map(h => (
                    <option key={h.id} value={h.id} className="bg-slate-900 text-white">
                      {h.niche} ({new Date(h.updatedAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FORMULARIO DE BÚSQUEDA / CONFIGURACIÓN */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
          <span>🎯</span> Configuración del Radar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nicho / Rubro Principal <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nicheInput}
              onChange={(e) => setNicheInput(e.target.value)}
              placeholder="Ej: Gastronomía, Marketing B2B, Moda Femenina"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Audiencia Objetivo (Opcional)
            </label>
            <input
              type="text"
              value={audienceInput}
              onChange={(e) => setAudienceInput(e.target.value)}
              placeholder="Ej: Emprendedores, Jóvenes 18-30 años"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Palabras Clave Adicionales (Opcional)
            </label>
            <input
              type="text"
              value={customKeywords}
              onChange={(e) => setCustomKeywords(e.target.value)}
              placeholder="Ej: Recetas saludables, Delivery, Descuentos"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {analysis && (
            <button
              onClick={() => handleRunRadar(true)}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-300 flex items-center gap-2 disabled:opacity-50"
            >
              <span>🔄</span> Actualizar Análisis
            </button>
          )}

          <button
            onClick={() => handleRunRadar(true)}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analizando Mercado con nuestros agentes...</span>
              </>
            ) : (
              <>
                <span>🚀 Lanzar Radar de Nicho</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* DASHBOARD DE RESULTADOS */}
      {initialChecking ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-500">Cargando datos del radar...</p>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* RESUMEN EJECUTIVO BANNER */}
          <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-5 md:p-6 text-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">💡</span>
                <h3 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wider">
                  Resumen del Mercado ({analysis.niche})
                </h3>
              </div>
              <p className="text-xs md:text-sm font-medium text-slate-700 leading-relaxed">
                {analysis.summary}
              </p>
            </div>
            <div className="text-[11px] font-bold text-slate-400 whitespace-nowrap self-end md:self-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              Actualizado: {new Date(analysis.updatedAt).toLocaleDateString()}
            </div>
          </div>

          {/* NAVEGACIÓN PESTAÑAS */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab("ideas")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "ideas"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>💡</span>
              <span>Ideas de Contenido ({analysis.ideas?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("trends")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "trends"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>📈</span>
              <span>Tendencias Reales ({analysis.trends?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("questions")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "questions"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>❓</span>
              <span>Preguntas Frecuentes ({analysis.audienceQuestions?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("hooks")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "hooks"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>🪝</span>
              <span>Ganchos Virales ({analysis.highRetentionHooks?.length || 0})</span>
            </button>
          </div>

          {/* TAB 1: IDEAS DE CONTENIDO */}
          {activeTab === "ideas" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
              {analysis.ideas?.map((idea) => (
                <div
                  key={idea.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {idea.angle}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                        {idea.suggestedFormat}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {idea.title}
                    </h3>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {idea.description}
                    </p>

                    {idea.draftHook && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">
                          Gancho Sugerido:
                        </span>
                        <p className="text-xs font-bold text-slate-800 italic">
                          "{idea.draftHook}"
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleCreatePostFromIdea(idea)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all border border-indigo-200/60 flex items-center justify-center gap-2"
                  >
                    <span>⚡ Desarrollar este Post</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: TENDENCIAS */}
          {activeTab === "trends" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
              {analysis.trends?.map((trend) => (
                <div
                  key={trend.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Fuente: {trend.source}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900">{trend.topic}</h3>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        trend.velocity === "high"
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : trend.velocity === "medium"
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {trend.velocity === "high" ? "🔥 Muy Alta" : trend.velocity === "medium" ? "⚡ Media" : "Emergente"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {trend.description}
                  </p>

                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/80 space-y-1">
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">
                      💡 Oportunidad para tu Negocio:
                    </span>
                    <p className="text-xs font-semibold text-indigo-950">
                      {trend.opportunity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PREGUNTAS FRECUENTES */}
          {activeTab === "questions" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
              {analysis.audienceQuestions?.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {q.source}
                      </span>
                      <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {q.suggestedAngle}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                      "{q.question}"
                    </h3>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-600">
                    💡 <strong className="text-slate-800">Idea de Respuesta:</strong> Conviértelo en un Reel o Carrusel respondiendo este dolor con una solución directa.
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: GANCHOS VIRALES */}
          {activeTab === "hooks" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
              {analysis.highRetentionHooks?.map((hook) => (
                <div
                  key={hook.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        Fórmula: {hook.framework}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-800 italic bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                      "{hook.hookText}"
                    </p>

                    <p className="text-xs text-slate-500 font-medium">{hook.explanation}</p>
                  </div>

                  <button
                    onClick={() => handleCopyHook(hook.hookText, hook.id)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-300 flex items-center justify-center gap-2"
                  >
                    {copiedHookId === hook.id ? (
                      <>
                        <span className="text-emerald-600">✓ ¡Gancho Copiado!</span>
                      </>
                    ) : (
                      <>
                        <span>📋 Copiar Gancho</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ESTRATEGIA GENERATOR */}
          <div id="generador-estrategia" className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm mt-8 space-y-6">
              
              {/* MODO PRUEBA / SIMULADOR - EXCLUSIVO santisoftai@gmail.com */}
              {isSantisoftAdmin && (
                <div className="p-6 bg-gradient-to-br from-amber-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl border-2 border-amber-300/80 shadow-md space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🧪</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white px-2.5 py-0.5 rounded-md">
                            Exclusivo Admin
                          </span>
                          <h3 className="text-base font-black text-slate-900">
                            Modo Prueba & Simulador de Estrategia
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          Prueba rubros, descripciones de negocio y productos/servicios para simular cómo van quedando los posts antes de publicar.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsTestMode(!isTestMode)}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm ${
                        isTestMode
                          ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-300/50'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                      }`}
                    >
                      <span>{isTestMode ? '✓ Modo Prueba ACTIVADO' : '⚪ Activar Modo Prueba'}</span>
                    </button>
                  </div>

                  {isTestMode && (
                    <div className="pt-4 border-t border-amber-200/60 space-y-5 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <span>⚙️</span> Parámetros del Negocio de Prueba:
                        </span>
                        <button
                          type="button"
                          onClick={handleLoadExampleTestProducts}
                          className="text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>⚡</span> Cargar Datos de Ejemplo (Cafetería & Pastelería)
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-slate-800 mb-1.5">
                            Rubro / Industria de Prueba <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={testRubro}
                            onChange={(e) => setTestRubro(e.target.value)}
                            placeholder="Ej: Clínica Dental, Pastelería Artesanal, Gimnasio Boutique"
                            className="w-full bg-white border border-amber-300/80 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-800 mb-1.5">
                            Lo que se busca (Objetivo de la Estrategia) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={testGoalDescription}
                            onChange={(e) => setTestGoalDescription(e.target.value)}
                            placeholder="Ej: Aumentar visitas los fines de semana y vender packs de café"
                            className="w-full bg-white border border-amber-300/80 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all shadow-inner"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-800 mb-1.5">
                          Descripción del Negocio de Prueba <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          value={testBusinessDescription}
                          onChange={(e) => setTestBusinessDescription(e.target.value)}
                          placeholder="Describe qué hace el negocio, su propuesta única de valor, su cliente ideal y qué lo diferencia..."
                          rows={3}
                          className="w-full bg-white border border-amber-300/80 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 transition-all shadow-inner resize-none"
                        />
                      </div>

                      {/* CUENTAS DE PUBLICACIÓN VINCULADAS A santisoftai@gmail.com */}
                      <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 md:p-5 border border-amber-200/80 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📢</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                  Cuentas de publicación (santisoftai@gmail.com)
                                </h4>
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                                  ✓ Cuentas Activas
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Los posts de prueba se publicarán utilizando las cuentas configuradas con tu usuario.
                              </p>
                            </div>
                          </div>

                          {santisoftProfile && (
                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-xl w-fit">
                              Perfil: {santisoftProfile.name || santisoftProfile.businessName || "Santisoft AI"}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                          {/* Instagram */}
                          <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                            testSelectedNetworks.includes('instagram')
                              ? 'bg-gradient-to-r from-pink-50 to-purple-50 border-purple-300 text-purple-950 font-bold shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                          }`}>
                            <input
                              type="checkbox"
                              checked={testSelectedNetworks.includes('instagram')}
                              onChange={(e) => {
                                if (e.target.checked) setTestSelectedNetworks(prev => [...prev, 'instagram']);
                                else setTestSelectedNetworks(prev => prev.filter(n => n !== 'instagram'));
                              }}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex items-center gap-1.5 text-xs">
                              <span>📸</span>
                              <span>Instagram</span>
                              {availableSantisoftAccounts.instagram && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">OK</span>
                              )}
                            </div>
                          </label>

                          {/* Facebook */}
                          <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                            testSelectedNetworks.includes('facebook')
                              ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                          }`}>
                            <input
                              type="checkbox"
                              checked={testSelectedNetworks.includes('facebook')}
                              onChange={(e) => {
                                if (e.target.checked) setTestSelectedNetworks(prev => [...prev, 'facebook']);
                                else setTestSelectedNetworks(prev => prev.filter(n => n !== 'facebook'));
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-1.5 text-xs">
                              <span>📘</span>
                              <span>Facebook</span>
                              {availableSantisoftAccounts.facebook && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">OK</span>
                              )}
                            </div>
                          </label>

                          {/* TikTok */}
                          <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                            testSelectedNetworks.includes('tiktok')
                              ? 'bg-slate-900 text-white border-slate-800 font-bold shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                          }`}>
                            <input
                              type="checkbox"
                              checked={testSelectedNetworks.includes('tiktok')}
                              onChange={(e) => {
                                if (e.target.checked) setTestSelectedNetworks(prev => [...prev, 'tiktok']);
                                else setTestSelectedNetworks(prev => prev.filter(n => n !== 'tiktok'));
                              }}
                              className="rounded text-slate-900 focus:ring-slate-900"
                            />
                            <div className="flex items-center gap-1.5 text-xs">
                              <span>🎵</span>
                              <span>TikTok</span>
                              {availableSantisoftAccounts.tiktok && (
                                <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded font-black">OK</span>
                              )}
                            </div>
                          </label>

                          {/* Google Business */}
                          <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                            testSelectedNetworks.includes('googleBusiness')
                              ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                          }`}>
                            <input
                              type="checkbox"
                              checked={testSelectedNetworks.includes('googleBusiness')}
                              onChange={(e) => {
                                if (e.target.checked) setTestSelectedNetworks(prev => [...prev, 'googleBusiness']);
                                else setTestSelectedNetworks(prev => prev.filter(n => n !== 'googleBusiness'));
                              }}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <div className="flex items-center gap-1.5 text-xs">
                              <span>📍</span>
                              <span>Google Business</span>
                              {availableSantisoftAccounts.googleBusiness && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">OK</span>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* PRODUCTOS Y SERVICIOS DE PRUEBA */}
                      <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 md:p-5 border border-amber-200/80 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📦</span>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                              Productos y Servicios de Prueba ({testProducts.length})
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                            Nuestros agentes los incluirán en los posts
                          </span>
                        </div>

                        {/* Formulario para agregar nuevo producto/servicio */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                          <div>
                            <input
                              type="text"
                              value={newProductName}
                              onChange={(e) => setNewProductName(e.target.value)}
                              placeholder="Nombre del ítem..."
                              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all"
                            />
                          </div>
                          <div>
                            <select
                              value={newProductType}
                              onChange={(e) => setNewProductType(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all"
                            >
                              <option value="producto">Producto</option>
                              <option value="servicio">Servicio</option>
                            </select>
                          </div>
                          <div>
                            <input
                              type="text"
                              value={newProductDesc}
                              onChange={(e) => setNewProductDesc(e.target.value)}
                              placeholder="Descripción o detalle..."
                              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 transition-all"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newProductPrice}
                              onChange={(e) => setNewProductPrice(e.target.value)}
                              placeholder="Precio (ej: $15.000)"
                              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={handleAddTestProduct}
                              disabled={!newProductName.trim()}
                              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-black px-3.5 py-2 rounded-xl transition-all shrink-0"
                            >
                              + Añadir
                            </button>
                          </div>
                        </div>

                        {/* Listado de items de prueba agregados */}
                        {testProducts.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                            {testProducts.map((p) => (
                              <div
                                key={p.id}
                                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-2 shadow-2xs"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs">
                                      {p.type === "producto" ? "📦" : "🛠️"}
                                    </span>
                                    <span className="text-xs font-black text-slate-900 truncate">
                                      {p.name}
                                    </span>
                                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      {p.type}
                                    </span>
                                  </div>
                                  {p.description && (
                                    <p className="text-[11px] text-slate-600 font-medium line-clamp-2">
                                      {p.description}
                                    </p>
                                  )}
                                  {p.price && (
                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-block">
                                      {p.price}
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTestProduct(p.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors shrink-0"
                                  title="Eliminar ítem"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50/60 rounded-xl border border-dashed border-amber-200 text-center text-xs text-amber-800 font-medium">
                            No has agregado productos o servicios de prueba aún. Puedes agregar uno arriba o pulsar "Cargar Datos de Ejemplo".
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>🤖</span> Planificación Estratégica Automática
              </h2>
              <p className="text-sm text-slate-500">¿Qué deseas lograr? Selecciona tu meta para crear un calendario de posts usando los insights del Radar.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                 {goals.map(g => (
                   <button
                     key={g.id}
                     onClick={() => setStrategyGoal(g.id)}
                     className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                       strategyGoal === g.id
                       ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                       : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white'
                     }`}
                   >
                     <span className="text-xl">{g.icon}</span>
                     <div>
                       <div className={`font-black text-xs ${strategyGoal === g.id ? 'text-indigo-900' : 'text-slate-800'}`}>{g.title}</div>
                     </div>
                   </button>
                 ))}
              </div>

              <div>
                  <textarea 
                     value={strategyExpectations}
                     onChange={e => setStrategyExpectations(e.target.value)}
                     placeholder="¿Alguna expectativa u oferta especial para estos días? (Opcional)"
                     className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-[20px] font-medium text-slate-700 outline-none focus:border-indigo-500 transition-colors resize-none text-sm"
                     rows={2}
                  />
              </div>

              {/* INTEGRACIÓN DE ESTILOS VISUALES DE PROMPTS IA */}
              <PromptStyleSelector
                enabled={usePromptStyles}
                onToggleEnabled={setUsePromptStyles}
                selectedStyles={selectedPromptStyles}
                onChangeSelectedStyles={setSelectedPromptStyles}
              />

              {/* FECHA Y HORA DE INICIO DE LA PLANIFICACIÓN */}
              <div className="p-5 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-white rounded-2xl border border-indigo-100 space-y-3">
                  <div className="flex items-center gap-2.5">
                      <span className="text-xl">📅</span>
                      <div>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Fecha y Hora de Inicio</h4>
                          <p className="text-[11px] font-medium text-slate-500">¿A partir de qué fecha y hora deseas que comience a publicarse este calendario?</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Fecha de Inicio (Primer Post)
                          </label>
                          <input 
                            type="date"
                            value={startDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all text-xs"
                          />
                      </div>

                      <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Hora Preferida
                          </label>
                          <input 
                            type="time"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all text-xs"
                          />
                      </div>
                  </div>

                  {scheduleContinuityInfo?.hasFuturePosts && (
                    <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                      <span className="text-base shrink-0">🗓️</span>
                      <div className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                        <strong className="font-bold text-emerald-950 block">Continuación Inteligente de Calendario</strong>
                        Tienes publicaciones agendadas hasta el <strong>{scheduleContinuityInfo.lastScheduledDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>. Nuestros agentes han configurado el inicio de esta nueva estrategia para continuar inmediatamente el <strong>{new Date(startDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> para evitar solapamientos.
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 font-semibold flex items-center gap-2">
                      <span>💡</span>
                      <span>
                        Primer post programado para el <strong className="text-indigo-950 font-black">{new Date(startDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> a las <strong className="text-indigo-950 font-black">{startTime} hrs</strong>.
                      </span>
                  </div>
              </div>

              {/* CONTROL DE LOGO DE MARCA */}
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏷️</span>
                    <div>
                      <p className="text-xs font-black text-slate-800">Incluir Logo en las Imágenes</p>
                      <p className="text-[11px] font-medium text-slate-500">
                        {activeProfile?.logoUrl 
                          ? `Se estampará tu logo oficial en la esquina inferior de las imágenes generadas.` 
                          : `Sube tu logo en la pestaña Configuración para que nuestros agentes lo estampen en tus posts.`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeLogoInStrategy(!includeLogoInStrategy)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      includeLogoInStrategy 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span>{includeLogoInStrategy ? '✓ Logo Activado' : 'Sin Logo'}</span>
                  </button>
               </div>

              <div className="flex justify-end pt-2">
                  <button
                     onClick={handleGenerateStrategy}
                     disabled={generatingStrategy || !strategyGoal}
                     className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-extrabold py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                     {generatingStrategy ? 'Generando...' : 'Crear Calendario Semanal 📅'}
                  </button>
              </div>

              {strategyResult && strategyResult.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                           <h3 className="text-lg font-black text-slate-900">Tu Plan Estratégico Generado</h3>
                           <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                             <span>🗓️</span> Fechas sincronizadas sin solapamientos
                           </span>
                       </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {strategyResult.map((post, idx) => {
                             const dt = post.computedScheduledDate ? new Date(post.computedScheduledDate) : null;
                             const dateDisplay = dt 
                               ? dt.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }) + ' - ' + dt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) + ' hrs' 
                               : `Día ${post.dayOffset} a las ${post.suggestedTime}`;

                             return (
                               <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm hover:border-indigo-200 transition-colors">
                                   <div className="flex justify-between items-center text-xs">
                                       <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100/80 flex items-center gap-1">
                                         <span>📅</span> {dateDisplay}
                                       </span>
                                       <span className="bg-white border border-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">{post.format}</span>
                                   </div>

                                   {/* Style badge if assigned */}
                                   {post.visualStyle && (
                                      <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/90 border border-indigo-100">
                                        {post.previewUrl ? (
                                          <img 
                                            src={post.previewUrl} 
                                            alt={post.visualStyle} 
                                            className="w-9 h-9 rounded-lg object-cover border border-indigo-200 shadow-xs shrink-0" 
                                          />
                                        ) : (
                                          <span className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-sm shrink-0">🎨</span>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Estilo Prompt IA</div>
                                          <div className="text-xs font-black text-indigo-950 truncate">{post.visualStyle}</div>
                                          {post.imageDirection && (
                                            <div className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">{post.imageDirection}</div>
                                          )}
                                        </div>
                                      </div>
                                   )}

                                    <p className="font-black text-sm text-slate-800">"{post.hook}"</p>
                                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{post.content}</p>

                                    <button
                                      type="button"
                                      onClick={() => setPreviewPostModal(post)}
                                      className="w-full py-2 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl transition-all border border-indigo-200/80 flex items-center justify-center gap-1.5 shadow-2xs"
                                    >
                                      <span>👁️</span> Previsualizar Post Completo
                                    </button>
                                </div>
                             );
                          })}
                      </div>
                      <div className="flex justify-end mt-4">
                          <button
                             onClick={handleAcceptStrategy}
                             disabled={acceptingStrategy}
                             className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2"
                          >
                             {acceptingStrategy ? 'Agendando...' : 'Aceptar y Agendar Posts ✅'}
                          </button>
                      </div>
                  </div>
              )}
          </div>
        </div>
      ) : (
        /* ESTADO INICIAL VACÍO */
        <div className="bg-white rounded-3xl p-8 md:p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-5">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-indigo-100 shadow-sm">
            📡
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">
              Inicia tu primer análisis de tendencias
            </h3>
            <p className="text-slate-500 text-xs md:text-sm max-w-md mx-auto font-medium leading-relaxed">
              Haz clic en el botón a continuación para que nuestros agentes investiguen las conversaciones, preguntas frecuentes y patrones virales de tu nicho en los últimos 30 días.
            </p>
          </div>

          <button
            onClick={() => handleRunRadar(true)}
            disabled={loading}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition-all inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analizando Nicho...</span>
              </>
            ) : (
              <>
                <span>🚀 Generar Análisis de Nicho Ahora</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* MODAL DE FORMATO DE POST */}
      {postModal.isOpen && postModal.idea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
           <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-md w-full shadow-2xl relative">
              <button 
                onClick={() => setPostModal({isOpen: false, idea: null})}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
              
              <h2 className="text-xl font-black text-slate-900 mb-2">Crear Post Individual</h2>
              <p className="text-sm text-slate-500 mb-6 font-medium">¿En qué formato deseas desarrollar la idea <strong className="text-slate-800">"{postModal.idea.title}"</strong>?</p>
              
              <div className="space-y-4">
                  {/* OPción Post/Carrusel */}
                  <button 
                    onClick={() => handleModalPostCreate('Post')}
                    className="w-full flex items-center gap-4 p-4 border-2 border-slate-100 hover:border-indigo-300 rounded-2xl bg-slate-50 hover:bg-indigo-50 transition-all text-left"
                  >
                     <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl">🖼️</div>
                     <div>
                        <div className="font-black text-slate-900">Imagen o Carrusel</div>
                        <div className="text-xs text-slate-500 font-medium">Post tradicional para el Feed.</div>
                     </div>
                  </button>

                  {/* Opcion Video/Reel */}
                  {(() => {
                      const limit = systemPlans[userPlan]?.videosLimit ?? 0;
                      const hasVideosLeft = userPlan === 'business' || userPlan === 'agency' || limit > videosThisMonth;
                      
                      if (hasVideosLeft) {
                          return (
                              <button 
                                onClick={() => handleModalPostCreate('Reel')}
                                className="w-full flex items-center gap-4 p-4 border-2 border-slate-100 hover:border-pink-300 rounded-2xl bg-slate-50 hover:bg-pink-50 transition-all text-left"
                              >
                                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 text-2xl">🎬</div>
                                <div>
                                    <div className="font-black text-slate-900">Reel o Video Corto</div>
                                    <div className="text-xs text-slate-500 font-medium">Formato vertical para mayor viralidad.</div>
                                </div>
                              </button>
                          );
                      } else {
                          return (
                              <div className="w-full flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl bg-slate-100 opacity-60 relative text-left">
                                <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 text-2xl">🎬</div>
                                <div className="flex-1">
                                    <div className="font-black text-slate-700 flex items-center gap-2">
                                        Reel o Video Corto 
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md uppercase">Límite Mensual</span>
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">Agotaste tu saldo de videos de tu plan actual.</div>
                                </div>
                                <a href="/automatizacion-rrss/panel/planes" className="absolute inset-0 z-10" title="Mejorar Plan"></a>
                              </div>
                          );
                      }
                  })()}
              </div>
           </div>
        </div>
      )}
      {/* MODAL DE PREVISUALIZACIÓN DE POST DE LA ESTRATEGIA */}
      {previewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-6 md:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <button 
              onClick={() => setPreviewPostModal(null)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors font-black text-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-2">
              <span className="text-2xl">📱</span>
              <div>
                <h3 className="text-base font-black text-slate-900">Previsualización del Post</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Generado por nuestros agentes especializados
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-black text-xs px-3 py-1 rounded-xl flex items-center gap-1.5">
                <span>📅</span>
                {previewPostModal.computedScheduledDate
                  ? new Date(previewPostModal.computedScheduledDate).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }) + ' - ' + new Date(previewPostModal.computedScheduledDate).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) + ' hrs'
                  : `Día ${previewPostModal.dayOffset} a las ${previewPostModal.suggestedTime}`}
              </span>
              <span className="bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs px-3 py-1 rounded-xl">
                Formato: {previewPostModal.format}
              </span>
            </div>

            {/* Visual Style Info */}
            {previewPostModal.visualStyle && (
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                {previewPostModal.previewUrl ? (
                  <img
                    src={previewPostModal.previewUrl}
                    alt={previewPostModal.visualStyle}
                    className="w-12 h-12 rounded-xl object-cover border border-indigo-200 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-xl shrink-0">🎨</div>
                )}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">Estilo Visual Asignado</span>
                  <p className="text-xs font-black text-indigo-950">{previewPostModal.visualStyle}</p>
                  {previewPostModal.imageDirection && (
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">{previewPostModal.imageDirection}</p>
                  )}
                </div>
              </div>
            )}

            {/* Hook */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 block">Gancho (Hook)</span>
              <p className="text-sm font-black text-slate-900 leading-snug">"{previewPostModal.hook}"</p>
            </div>

            {/* Contenido / Copy */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Cuerpo del Contenido / Copy</span>
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                {previewPostModal.content}
              </div>
            </div>

            {/* CTA */}
            {previewPostModal.cta && (
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Llamado a la Acción (CTA)</span>
                <p className="text-xs font-bold text-emerald-950">{previewPostModal.cta}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewPostModal(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm"
              >
                Cerrar Previsualización
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS MODAL MODERNO */}
      <StatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onConfirm={() => {
          if (statusModal.onConfirm) statusModal.onConfirm();
          setStatusModal(prev => ({ ...prev, isOpen: false }));
        }}
      />

    </div>
  );
}
