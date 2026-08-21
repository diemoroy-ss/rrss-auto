"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { useProfile } from "../../../../contexts/ProfileContext";
import { useRouter } from "next/navigation";
import { RadarAnalysisResult, TrendItem, AudienceQuestion, HookItem, ContentIdea } from "../../../../lib/niche-radar";

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

  // Plan and Limits
  const [userPlan, setUserPlan] = useState<string>("free");
  const [systemPlans, setSystemPlans] = useState<any>({});
  const [postsThisMonth, setPostsThisMonth] = useState<number>(0);
  const [videosThisMonth, setVideosThisMonth] = useState<number>(0);

  // Strategy State
  const [strategyGoal, setStrategyGoal] = useState<string>("");
  const [strategyExpectations, setStrategyExpectations] = useState<string>("");
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

  const resolveStrategyDates = (strategy: any[], existingDates: number[]) => {
    const allocated: number[] = [...existingDates];
    const now = Date.now();

    return strategy.map((post, idx) => {
      let targetDate = new Date();
      const dayOffset = typeof post.dayOffset === 'number' ? post.dayOffset : (idx + 1);
      targetDate.setDate(targetDate.getDate() + dayOffset);

      let hour = 12;
      let minute = 0;
      if (post.suggestedTime && post.suggestedTime.includes(':')) {
        const [h, m] = post.suggestedTime.split(':');
        hour = parseInt(h, 10) || 12;
        minute = parseInt(m, 10) || 0;
      }
      targetDate.setHours(hour, minute, 0, 0);

      // Si la fecha calculada ya pasó o está muy cerca de este momento (menos de 45 mins)
      if (targetDate.getTime() < now + 45 * 60 * 1000) {
        targetDate.setTime(now + 2 * 60 * 60 * 1000);
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
          businessData: { website: prof?.website },
          connectedPlatforms: {
              facebook: !!prof?.facebookToken_enc,
              instagram: !!prof?.instagramToken_enc,
              tiktok: !!prof?.tiktokToken_enc,
              linkedin: !!prof?.linkedinUserToken_enc
          },
          nicheContext: analysis?.summary || "",
          postsPerWeek
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

      const resolved = resolveStrategyDates(data.strategy || [], upcomingTimestamps);
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

          await addDoc(postsRef, {
              userId: user.uid,
              profileId: activeProfile?.id || 'default',
              text: `${post.content}\n\n${post.cta}`,
              idea: post.hook,
              type: postType,
              status: 'pending',
              scheduledFor: scheduledDate,
              createdAt: new Date(),
              networks: ['instagram', 'facebook'],
              generatedBy: 'ai_strategy_radar',
              includeLogo: includeLogoInStrategy
          });
      }
      router.push("/automatizacion-rrss/panel");
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <span>📡 Radar de Nicho</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-300 font-extrabold">Últimos 30 Días</span>
            </div>
            {activeProfile && (
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 text-xs font-semibold flex items-center gap-2">
                <span>🏪</span>
                <span className="text-slate-200">{activeProfile.name || (activeProfile as any).businessName || "Mi Negocio"}</span>
                {activeProfile.rubro && (
                  <span className="bg-indigo-600/60 text-white px-2 py-0.5 rounded-md text-[10px] uppercase font-bold">
                    {activeProfile.rubro}
                  </span>
                )}
              </div>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
            Inteligencia de Mercado & Tendencias
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed">
            Descubre los temas de conversación, dudas frecuentes y ganchos magnéticos que están funcionando en tu industria durante los últimos 30 días para crear contenido viral y relevante.
          </p>
        </div>
      </div>

      {/* FORM DE BÚSQUEDA Y PARÁMETROS */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>⚙️ Configurar Nicho de Investigación</span>
            </h2>
            
            {historicalAnalyses.length > 0 && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Cargar Anterior:</span>
                    <select 
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                        onChange={(e) => {
                            const selected = historicalAnalyses.find(h => h.id === e.target.value);
                            if (selected) {
                                setAnalysis(selected);
                                setNicheInput(selected.niche || "");
                                setAudienceInput(selected.targetAudience || "");
                            }
                        }}
                        value={analysis?.id || ""}
                    >
                        {historicalAnalyses.map((h: any) => (
                            <option key={h.id} value={h.id}>
                                {h.niche || "Análisis"} {formatRadarDate(h.createdAt) ? `- ${formatRadarDate(h.createdAt)}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>

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
          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("ideas")}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === "ideas"
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span>💡 Ideas de Contenido</span>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] rounded-full font-black">
                {analysis.contentIdeas?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("trends")}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === "trends"
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span>📈 Tendencias Candentes</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-black">
                {analysis.trends?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("questions")}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === "questions"
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span>❓ Preguntas de la Audiencia</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-black">
                {analysis.audienceQuestions?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("hooks")}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === "hooks"
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <span>🎣 Ganchos Magnéticos</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded-full font-black">
                {analysis.hooks?.length || 0}
              </span>
            </button>
          </div>

          {/* TAB 1: IDEAS DE CONTENIDO */}
          {activeTab === "ideas" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {analysis.contentIdeas?.map((idea) => (
                <div
                  key={idea.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[10px] font-black uppercase rounded-lg">
                        {idea.format}
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        🎯 {idea.targetGoal}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {idea.title}
                    </h3>

                    {idea.draftHook && (
                      <div className="bg-slate-50 border-l-2 border-indigo-500 p-2.5 rounded-r-xl">
                        <p className="text-[11px] font-extrabold text-indigo-900 mb-0.5">Gancho Inicial:</p>
                        <p className="text-xs italic text-slate-700 font-medium font-mono">
                          "{idea.draftHook}"
                        </p>
                      </div>
                    )}

                    {idea.outline && idea.outline.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estructura del Post:</p>
                        <ul className="space-y-1">
                          {idea.outline.map((step, idx) => (
                            <li key={idx} className="text-xs text-slate-600 font-medium flex items-start gap-1.5">
                              <span className="text-indigo-500 font-bold">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleCreatePostFromIdea(idea)}
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-extrabold rounded-xl transition-all border border-indigo-200 hover:border-indigo-600 flex items-center justify-center gap-2 group-hover:shadow-md"
                  >
                    <span>✍️ Crear Post con este Tema</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: TENDENCIAS CANDENTES */}
          {activeTab === "trends" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {analysis.trends?.map((trend) => (
                <div
                  key={trend.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${
                        trend.popularity === "Alta"
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : trend.popularity === "En Crecimiento"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-amber-50 border-amber-200 text-amber-700"
                      }`}
                    >
                      Popularidad {trend.popularity}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      🎬 {trend.suggestedFormat}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900">{trend.title}</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {trend.description}
                  </p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 mb-0.5">¿Por qué funciona?</p>
                    <p className="text-xs text-slate-700 font-medium">{trend.whyItWorks}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PREGUNTAS DE LA AUDIENCIA */}
          {activeTab === "questions" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {analysis.audienceQuestions?.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center gap-2 text-indigo-600">
                    <span className="text-lg">❓</span>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{q.question}</h3>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contexto de la duda:</p>
                      <p className="text-xs text-slate-700 font-medium">{q.context}</p>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-200/80 p-3 rounded-xl">
                      <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Oportunidad de Contenido:</p>
                      <p className="text-xs text-emerald-900 font-semibold">{q.contentOpportunity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: GANCHOS MAGNÉTICOS */}
          {activeTab === "hooks" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {analysis.hooks?.map((hook) => (
                <div
                  key={hook.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-black uppercase rounded-md">
                      {hook.category}
                    </span>

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

              {/* CONTROL DE LOGO DE MARCA */}
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏷️</span>
                    <div>
                      <p className="text-xs font-black text-slate-800">Incluir Logo en las Imágenes</p>
                      <p className="text-[11px] font-medium text-slate-500">
                        {activeProfile?.logoPrompt 
                          ? `Se inyectará el prompt visual de tu logo (${activeProfile.logoPrompt.slice(0, 45)}...) en las imágenes.` 
                          : `Sube o analiza tu logo en la pestaña Configuración para que la IA dibuje tu marca.`}
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

    </div>
  );
}
