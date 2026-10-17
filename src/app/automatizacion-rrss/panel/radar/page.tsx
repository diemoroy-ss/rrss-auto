"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useProfile } from "../../../../contexts/ProfileContext";
import { useRouter } from "next/navigation";
import StatusModal from "../../../../components/StatusModal";
import UpsellGate from "../../../../components/panel/UpsellGate";
import { hasPlanFeature } from "../../../../lib/plans";

interface TrendItem {
  id: string;
  source?: string;
  topic?: string;
  velocity?: "high" | "medium" | "low" | string;
  description?: string;
  opportunity?: string;
}

interface AudienceQuestion {
  id: string;
  source?: string;
  suggestedAngle?: string;
  question: string;
}

interface HighRetentionHook {
  id: string;
  framework?: string;
  hookText: string;
  explanation?: string;
}

interface ContentIdea {
  id: string;
  title: string;
  description?: string;
  format?: "Reel" | "Carrusel" | "Post Estático" | "Historias" | string;
  suggestedFormat?: string;
  draftHook?: string;
  angle?: string;
  summary?: string;
}

interface RadarAnalysisResult {
  id?: string;
  niche: string;
  updatedAt: string;
  summary?: string;
  ideas?: ContentIdea[];
  contentIdeas?: ContentIdea[];
  trends?: TrendItem[];
  audienceQuestions?: AudienceQuestion[];
  highRetentionHooks?: HighRetentionHook[];
}

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

  // Status Modal State
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

  // Modal State para convertir idea en Post/Reel
  const [postModal, setPostModal] = useState<{isOpen: boolean, idea: ContentIdea | null}>({isOpen: false, idea: null});

  // History State
  const [historicalAnalyses, setHistoricalAnalyses] = useState<any[]>([]);

  const isSantisoftAdmin = user?.email === "santisoftai@gmail.com";

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const autoGoal = urlParams.get('autoGoal');
      if (autoGoal) {
        router.push(`/automatizacion-rrss/panel/estrategia?goal=${encodeURIComponent(autoGoal)}&useRadar=true`);
      }
    }
  }, [router]);

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
  }, [activeProfile, nicheInput, audienceInput]);

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

  const isLocked = !isSantisoftAdmin && !hasPlanFeature(userPlan, 'competitorSpy');

  if (isLocked) {
    return (
      <UpsellGate
        moduleName="Radar de Nicho & Espía de Competencia"
        badge="Exclusivo Plan PyME Crecimiento"
        title="Espía a tu Competencia y Descubre las Tendencias Ganadoras de tu Rubro"
        description="¿Qué dudas tiene tu cliente ideal antes de comprar? ¿Qué temas se están viralizando en tu nicho en los últimos 30 días? Nuestro radar monitorea las discusiones activas para entregarte ideas de contenido y ganchos (hooks) con alta retención comprobada."
        benefits={[
          "Monitoreo en vivo de tendencias y temas calientes en los últimos 30 días.",
          "Generador de ganchos 'Scroll-Stoppers' validados para retener la atención en Reels y posts.",
          "Preguntas reales que hacen los clientes en redes para responder con autoridad.",
          "Ahorra semanas de prueba y error o los $250.000+ CLP que cobraría una consultoría de mercado."
        ]}
        requiredPlanName="Plan PyME Crecimiento"
        upgradePlanId="crecimiento"
      />
    );
  }

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

          {/* CTA: PLANIFICAR CON LOS HALLAZGOS DEL RADAR */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mt-8 border border-indigo-500/20">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <span>🚀</span> Paso Siguiente
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Lleva estas ideas directo a tu calendario
                </h3>
                <p className="text-sm text-indigo-200/80 leading-relaxed font-medium">
                  Nuestros agentes ya tienen cargados los ganchos, ángulos y preguntas de este análisis. Pasa a Planificación para programar las fechas, elegir tus productos y agendar tus publicaciones en segundos.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => router.push("/automatizacion-rrss/panel/estrategia?useRadar=true")}
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/40 transition-all flex items-center justify-center gap-2"
                >
                  <span>🗓️ Crear Planificación con Radar</span>
                </button>
              </div>
            </div>
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
