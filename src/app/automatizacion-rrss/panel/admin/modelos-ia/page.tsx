"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StatusModal from "../../../../../components/StatusModal";

interface GoogleModel {
  name: string;
  id: string;
  displayName: string;
  description: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods: string[];
}

interface TaskDef {
  key: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  recommendedType: "speed" | "quality" | "balanced";
  defaultModel: string;
}

export default function AdminAiModelsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [models, setModels] = useState<GoogleModel[]>([]);
  const [tasks, setTasks] = useState<TaskDef[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Sandbox State
  const [testModel, setTestModel] = useState<string>("gemini-2.5-flash");
  const [testPrompt, setTestPrompt] = useState<string>("Escribe un hook persuasivo para un reel de Instagram sobre automatización con IA.");
  const [testSystemInstruction, setTestSystemInstruction] = useState<string>("Eres un copywriter experto.");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ text: string; latencyMs: number; finishReason?: string } | null>(null);

  // Modal State
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
    onConfirm: () => {},
  });

  const showModal = (
    type: "success" | "error" | "info" | "confirm",
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: onConfirm || (() => setModal((prev) => ({ ...prev, isOpen: false }))),
    });
  };

  const fetchModelData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await fetch("/api/admin/ai-models", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("No se pudo cargar la información de modelos");
      }

      const data = await res.json();
      setModels(data.models || []);
      setTasks(data.tasks || []);
      setConfig(data.config || {});
      setHasChanges(false);

      if (data.models?.length > 0 && !testModel) {
        setTestModel(data.models[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching AI models data:", err);
      showModal("error", "Error", err.message || "Error al cargar modelos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      await fetchModelData();
    });
    return () => unsub();
  }, [router]);

  const handleModelChange = (taskKey: string, modelId: string) => {
    setConfig((prev) => ({
      ...prev,
      [taskKey]: modelId,
    }));
    setHasChanges(true);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Sesión no iniciada");

      const token = await user.getIdToken();
      const res = await fetch("/api/admin/ai-models", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasks: config }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      setHasChanges(false);
      showModal("success", "¡Guardado con Éxito!", "La asignación de modelos de IA ha sido actualizada en caliente.");
    } catch (err: any) {
      console.error("Error saving model config:", err);
      showModal("error", "Error", err.message || "No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    showModal(
      "confirm",
      "Restablecer Valores Recomendados",
      "¿Deseas restablecer todos los modelos asignados a los valores predeterminados sugeridos por Santisoft?",
      () => {
        const defaults: Record<string, string> = {};
        tasks.forEach((t) => {
          defaults[t.key] = t.defaultModel;
        });
        setConfig(defaults);
        setHasChanges(true);
        setModal((prev) => ({ ...prev, isOpen: false }));
      }
    );
  };

  const handleRunTest = async () => {
    if (!testPrompt.trim()) return;
    setTesting(true);
    setTestResult(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Sesión no iniciada");

      const token = await user.getIdToken();
      const res = await fetch("/api/admin/ai-models/test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelName: testModel,
          prompt: testPrompt,
          systemInstruction: testSystemInstruction,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al ejecutar prueba");

      setTestResult({
        text: data.text,
        latencyMs: data.latencyMs,
        finishReason: data.finishReason,
      });
    } catch (err: any) {
      console.error("Error running test prompt:", err);
      showModal("error", "Error en Sandbox", err.message || "Fallo en la llamada a Gemini");
    } finally {
      setTesting(false);
    }
  };

  const categories = Array.from(new Set(tasks.map((t) => t.category)));

  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
    const matchesSearch =
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (config[task.key] || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500">Conectando con Google Gemini API &amp; Firestore...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🧠</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
              Motor de Inteligencia Artificial
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestión y Asignación de Modelos IA
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Controla qué versión del modelo de Gemini ejecuta cada tarea de la plataforma. Los cambios aplican de forma inmediata sin necesidad de tocar código.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchModelData();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
          >
            <span className={refreshing ? "animate-spin" : ""}>🔄</span>
            <span>{refreshing ? "Sincronizando..." : "Sincronizar Google API"}</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-all shadow-sm"
          >
            <span>⚙️</span> Restablecer
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
              hasChanges
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 scale-[1.02]"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none"
            }`}
          >
            <span>💾</span>
            <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Estado API Google</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Conectado &amp; Listo
            </p>
          </div>
          <span className="text-3xl opacity-80">🟢</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Modelos Disponibles</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {models.length} <span className="text-xs font-normal text-slate-400">versiones Gemini</span>
            </p>
          </div>
          <span className="text-3xl opacity-80">🤖</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Tareas Configuradas</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {tasks.length} <span className="text-xs font-normal text-slate-400">módulos activos</span>
            </p>
          </div>
          <span className="text-3xl opacity-80">⚡</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Cambios Pendientes</p>
            <p className={`text-lg font-black mt-1 ${hasChanges ? "text-amber-500" : "text-slate-400"}`}>
              {hasChanges ? "⚠️ Sin Guardar" : "✓ Al Día"}
            </p>
          </div>
          <span className="text-3xl opacity-80">{hasChanges ? "✏️" : "🛡️"}</span>
        </div>
      </div>

      {/* Main Grid: Tasks Matrix & Live Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Tasks Assignment Matrix (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  categoryFilter === "all"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Todas ({tasks.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    categoryFilter === cat
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-48">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tarea..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const currentModelId = config[task.key] || task.defaultModel;
              const selectedModelInfo = models.find((m) => m.id === currentModelId);

              return (
                <div
                  key={task.key}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 max-w-md">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-xl flex-shrink-0">
                      {task.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{task.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {task.category}
                        </span>
                        {task.recommendedType === "speed" && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            ⚡ Rapidez
                          </span>
                        )}
                        {task.recommendedType === "quality" && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                            💎 Razonamiento
                          </span>
                        )}
                        {task.recommendedType === "balanced" && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            ⚖️ Balanceado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  {/* Model Selector */}
                  <div className="flex flex-col gap-1 md:w-64 flex-shrink-0">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Modelo Asignado
                    </label>
                    <select
                      value={currentModelId}
                      onChange={(e) => handleModelChange(task.key, e.target.value)}
                      className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all"
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.displayName} {m.id === task.defaultModel ? "★ (Recomendado)" : ""}
                        </option>
                      ))}
                    </select>
                    {selectedModelInfo && (
                      <span className="text-[10px] text-slate-400 truncate mt-0.5">
                        Límite: {selectedModelInfo.inputTokenLimit ? `${(selectedModelInfo.inputTokenLimit / 1000).toFixed(0)}k tokens` : "Estándar"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Testing Sandbox (4/5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          <div className="sticky top-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧪</span>
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Sandbox de Prueba en Vivo
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800">
                Gemini Test
              </span>
            </div>

            {/* Model Selector for Sandbox */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Modelo a Probar
              </label>
              <select
                value={testModel}
                onChange={(e) => setTestModel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Plantillas Rápidas
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTestPrompt("Genera 3 ganchos irresistibles para un post de Instagram sobre marketing automatizado.")}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  📱 Copy Redes
                </button>
                <button
                  type="button"
                  onClick={() => setTestPrompt("Escribe un esquema H1, H2, H3 para un artículo SEO sobre optimización GEO en ChatGPT.")}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  🌐 Artículo SEO
                </button>
                <button
                  type="button"
                  onClick={() => setTestPrompt("Crea un guion de 15 segundos con gancho, desarrollo y llamada a la acción para TikTok.")}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  🎬 Video Reel
                </button>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Prompt de Prueba
              </label>
              <textarea
                rows={3}
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Escribe el prompt a evaluar..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none font-mono"
              ></textarea>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunTest}
              disabled={testing || !testPrompt.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {testing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Generando con {testModel}...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Ejecutar Prueba en Vivo</span>
                </>
              )}
            </button>

            {/* Results Output */}
            {testResult && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span>⏱️</span> {testResult.latencyMs} ms
                  </span>
                  <span className="text-slate-400">Modelo: {testModel}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-sans whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed shadow-inner">
                  {testResult.text}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <StatusModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
