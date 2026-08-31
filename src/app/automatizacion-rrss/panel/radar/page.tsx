"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { useProfile } from "../../../../contexts/ProfileContext";
import { useRouter } from "next/navigation";
import PromptStyleSelector from "../../../../components/strategy/PromptStyleSelector";
import { PromptTemplate } from "../../../../lib/prompt-templates";
import { appendContactInfo } from "../../../../lib/contact-helper";
import StatusModal from "../../../../components/StatusModal";

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

  // Modal State
  const [postModal, setPostModal] = useState<{isOpen: boolean, idea: ContentIdea | null}>({isOpen: false, idea: null});

  // History State
  const [historicalAnalyses, setHistoricalAnalyses] = useState<any[]>([]);
  const [includeLogoInStrategy, setIncludeLogoInStrategy] = useState<boolean>(true);

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

    return strategy.map((post, idx) => {
      let targetDate = new Date(y, m - 1, d);
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

      // Evitar colisión con posts existentes o previos (mínimo 2 horas de diferencia)
      let attempts = 0;
      while (allocated.some(ts => Math.abs(ts - targetDate.getTime()) < 2 * 60 * 60 * 1000) && attempts < 25) {
        attempts++;
        targetDate.setHours(targetDate.getHours() + 3);
        if (targetDate.getHours() >= 22 || targetDate.getHours() < 9) {
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
             setUserPlan(userDoc.data().plan || "free");
             
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
      setErrorMsg(err.message || "Error al conectar con la IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStrategy = async () => {
    if (!strategyGoal) {
      setErrorMsg("Selecciona una meta para tu estrategia.");
      return;
    }
    setGeneratingStrategy(true);
    setStrategyResult(null);

    let postsPerWeek = 1;
    if (userPlan === 'starter') postsPerWeek = 3;
    if (userPlan === 'pro') postsPerWeek = 5;
    if (userPlan === 'business') postsPerWeek = 20;
    if (userPlan === 'agency') postsPerWeek = 50;

    try {
      const token = await user.getIdToken();
      const prof = activeProfile as any;
      const res = await fetch("/api/ai/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          goal: strategyGoal,
          goalName: goals.find(g => g.id === strategyGoal)?.title,
          businessType: prof?.rubro || "General",
          userId: user.uid,
          expectations: strategyExpectations,
          businessData: {
              businessName: prof?.name || prof?.businessName || "Mi Negocio",
              website: prof?.website || "",
              phone: prof?.phone || "",
              whatsapp: prof?.whatsapp || prof?.phone || "",
              email: prof?.email || "",
              address: prof?.address || ""
          },
          connectedPlatforms: {
              facebook: !!prof?.facebookToken_enc,
              instagram: !!prof?.instagramToken_enc,
              tiktok: !!prof?.tiktokToken_enc,
              linkedin: !!prof?.linkedinUserToken_enc
          },
          nicheContext: analysis?.summary || "",
          postsPerWeek,
          usePromptStyles,
          selectedPromptStyles: usePromptStyles ? selectedPromptStyles : []
        })
      });

      if (!res.ok) throw new Error("Error al generar estrategia");
      const data = await res.json();

      let upcomingTimestamps: number[] = [];
      try {
        const qPosts = query(
          collection(db, "social_posts"),
          where("userId", "==", user.uid),
          where("status", "in", ["pending", "confirmed"])
        );
        const snapPosts = await getDocs(qPosts);
        snapPosts.forEach(d => {
          const s = d.data()?.scheduledFor;
          if (s?.toDate) upcomingTimestamps.push(s.toDate().getTime());
          else if (s?._seconds) upcomingTimestamps.push(s._seconds * 1000);
          else if (s?.seconds) upcomingTimestamps.push(s.seconds * 1000);
          else if (s) upcomingTimestamps.push(new Date(s).getTime());
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
      for (const post of strategyResult) {
          const scheduledDate = post.computedScheduledDate ? new Date(post.computedScheduledDate) : new Date();

          const fmt = post.format?.toLowerCase() || "";
          const postType = fmt.includes('reel') || fmt.includes('video') ? 'Reel' : (fmt.includes('historia') || fmt.includes('story') ? 'Story' : 'Post');

          const postBaseText = `${post.content}\n\n${post.cta}`;
          const finalTextWithContact = appendContactInfo(postBaseText, activeProfile);

          const newPostRef = await addDoc(postsRef, {
              userId: user.uid,
              profileId: activeProfile?.id || 'default',
              text: finalTextWithContact,
              idea: post.hook,
              type: postType,
              status: 'confirmed', // DIRECTAMENTE CONFIRMADO Y AGENDADO
              scheduledFor: scheduledDate,
              createdAt: new Date(),
              networks: ['instagram', 'facebook'],
              generatedBy: 'ai_strategy_radar',
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
                <span>Analizando Mercado con IA...</span>
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
              Haz clic en el botón a continuación para que la IA investigue las conversaciones, preguntas frecuentes y patrones virales de tu nicho en los últimos 30 días.
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
