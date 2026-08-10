"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
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
    } catch (err: any) {
      console.error("Error al ejecutar radar:", err);
      setErrorMsg(err.message || "Error al conectar con la IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePostFromIdea = (idea: ContentIdea) => {
    const params = new URLSearchParams({
      topic: idea.title,
      format: idea.format,
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
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <span>⚙️ Configurar Nicho de Investigación</span>
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
    </div>
  );
}
