"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useProfile } from "../../../../contexts/ProfileContext";
import { 
  FLOW_COMMANDS, 
  FlowCommandDef, 
  buildVeoPromptFromCommand 
} from "../../../../lib/flow-command-translator";
import { 
  FaCopy, 
  FaCheck, 
  FaPlay, 
  FaImage, 
  FaVideo, 
  FaFilm, 
  FaMagic, 
  FaSlidersH,
  FaArrowRight,
  FaExternalLinkAlt,
  FaLightbulb
} from "react-icons/fa";

export default function VideoPromptsPage() {
  const { activeProfile } = useProfile();
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [viewModes, setViewModes] = useState<Record<string, "image" | "video">>({});

  // Estado del generador interactivo superior
  const [selectedCommandForGen, setSelectedCommandForGen] = useState<string>("/smoke reveal");
  const [customProduct, setCustomProduct] = useState<string>(activeProfile?.name || "");
  const [customNiche, setCustomNiche] = useState<string>(activeProfile?.rubro || "");
  const [customDetails, setCustomDetails] = useState<string>("");
  const [formatRatio, setFormatRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [copiedInteractivePrompt, setCopiedInteractivePrompt] = useState<boolean>(false);

  // Lista de categorías únicas
  const categories = useMemo(() => {
    const cats = Array.from(new Set(FLOW_COMMANDS.map((c) => c.category)));
    return ["Todas", ...cats];
  }, []);

  // Filtrado de comandos
  const filteredCommands = useMemo(() => {
    return FLOW_COMMANDS.filter((cmd) => {
      const matchCat = selectedCategory === "Todas" || cmd.category === selectedCategory;
      const q = searchFilter.toLowerCase().trim();
      const matchSearch =
        !q ||
        cmd.command.toLowerCase().includes(q) ||
        cmd.name.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchFilter]);

  // Prompt generado en la caja interactiva
  const activeGenCmd = useMemo(() => {
    return FLOW_COMMANDS.find((c) => c.command === selectedCommandForGen) || FLOW_COMMANDS[0];
  }, [selectedCommandForGen]);

  const interactivePromptText = useMemo(() => {
    return buildVeoPromptFromCommand(activeGenCmd, {
      productName: customProduct,
      rubro: customNiche,
      aspectRatio: formatRatio,
      additionalDetails: customDetails,
    });
  }, [activeGenCmd, customProduct, customNiche, formatRatio, customDetails]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2500);
  };

  const handleCopyInteractive = () => {
    navigator.clipboard.writeText(interactivePromptText);
    setCopiedInteractivePrompt(true);
    setTimeout(() => setCopiedInteractivePrompt(false), 2500);
  };

  const toggleViewMode = (cmdKey: string, mode: "image" | "video") => {
    setViewModes((prev) => ({ ...prev, [cmdKey]: mode }));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Encabezado Principal */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-2xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4">
            <FaFilm className="text-indigo-400" />
            <span>Google Flow & Veo 3.1 / Omni Video Showcase</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            Prompts de Video & Product Reveals
          </h1>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6 font-normal">
            Descubre exactamente cómo transformar una fotografía fija en un video publicitario de alto impacto. 
            Nuestros agentes estructuran los comandos de Flow en prompts cinemáticos de 6 capas optimizados para Veo 3.1 y Gemini Video.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/automatizacion-rrss/panel/poc-video"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm"
            >
              <FaPlay className="text-xs" />
              <span>Ir al Generador de Video</span>
            </Link>
            <a
              href="#comandos-grid"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-5 py-2.5 rounded-xl transition-all border border-white/15 text-sm"
            >
              <span>Ver Catálogo de Efectos ({FLOW_COMMANDS.length})</span>
              <FaArrowRight className="text-xs text-indigo-300" />
            </a>
          </div>
        </div>
      </div>

      {/* Herramienta Interactiva: Traductor de Comandos Flow a Veo 3.1 */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xl shadow-slate-100/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <FaMagic /> Generador Rápido de Prompt
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Convierte cualquier comando en un prompt maestro
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Selecciona tu efecto preferido y adáptalo a tu producto para cargarlo en Google Flow Labs o Veo 3.1.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Formato:</span>
            {(["9:16", "16:9", "1:1"] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setFormatRatio(ratio)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  formatRatio === ratio
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {ratio} {ratio === "9:16" ? "(Reel)" : ratio === "16:9" ? "(Paisaje)" : "(Post)"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs de configuración */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Comando Flow / Efecto
              </label>
              <select
                value={selectedCommandForGen}
                onChange={(e) => setSelectedCommandForGen(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {FLOW_COMMANDS.map((cmd) => (
                  <option key={cmd.command} value={cmd.command}>
                    {cmd.icon} {cmd.command} — {cmd.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Producto o Sujeto
                </label>
                <input
                  type="text"
                  placeholder="Ej: Hamburguesa Suprema, Botella de Vino, etc."
                  value={customProduct}
                  onChange={(e) => setCustomProduct(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rubro / Estilo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Gastronomía, Barbería, Joyería"
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Instrucciones artísticas adicionales (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: warm golden glow, water drops on the glass surface"
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Metadatos del efecto seleccionado */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-700 w-28 shrink-0">Cámara:</span>
                <span className="text-slate-600">{activeGenCmd.cameraMovement}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-700 w-28 shrink-0">Física del Efecto:</span>
                <span className="text-slate-600">{activeGenCmd.physicsEffect}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-700 w-28 shrink-0">Iluminación:</span>
                <span className="text-slate-600">{activeGenCmd.lightingStyle}</span>
              </div>
            </div>
          </div>

          {/* Resultado del Prompt */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Prompt Maestro Optimizado (Veo 3.1 & Flow)
              </label>
              <button
                onClick={handleCopyInteractive}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                {copiedInteractivePrompt ? (
                  <>
                    <FaCheck className="text-emerald-600" />
                    <span className="text-emerald-700">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <FaCopy />
                    <span>Copiar Prompt</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs md:text-sm leading-relaxed border border-slate-800 relative group overflow-y-auto max-h-72">
              <p className="select-all text-indigo-100 whitespace-pre-wrap">{interactivePromptText}</p>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Optimizado en inglés técnico para máxima fidelidad visual</span>
              </div>
              <span>Aspecto: {formatRatio} • 24fps filmic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Catálogo de Comandos y Muestras */}
      <div id="comandos-grid" className="space-y-6 pt-4">
        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Catálogo de Efectos de Revelación & Movimiento
            </h2>
            <p className="text-slate-500 text-sm">
              Compara la imagen estática inicial con el resultado en video generado y copia el prompt exacto.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar comando (ej. /smoke, /fire)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-900 text-xs rounded-xl pl-3.5 pr-8 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedCategory === cat
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de Tarjetas de Efectos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommands.map((cmd) => {
            const currentMode = viewModes[cmd.command] || "image";
            const isCopied = copiedCommand === cmd.command;

            return (
              <div
                key={cmd.command}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Header de la tarjeta */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{cmd.icon}</span>
                    <div>
                      <h3 className="font-black text-slate-900 text-base leading-tight">
                        {cmd.name}
                      </h3>
                      <span className="text-[11px] font-bold text-indigo-600 tracking-wide">
                        {cmd.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(cmd.command, `cmd-${cmd.command}`)}
                      title="Copiar comando de Flow"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-xs font-bold transition-colors"
                    >
                      {copiedCommand === `cmd-${cmd.command}` ? (
                        <FaCheck className="text-emerald-600" />
                      ) : (
                        cmd.command
                      )}
                    </button>
                  </div>
                </div>

                {/* Previsualizador Visual Antes -> Después */}
                <div className="relative aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
                  {/* Selector Toggle: Imagen Base vs Video Final */}
                  <div className="absolute top-3 left-3 z-20 flex bg-slate-900/80 backdrop-blur-md p-0.5 rounded-lg border border-white/10 text-xs font-bold text-white shadow-lg">
                    <button
                      onClick={() => toggleViewMode(cmd.command, "image")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                        currentMode === "image"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      <FaImage className="text-xs" />
                      <span>Imagen Base</span>
                    </button>
                    <button
                      onClick={() => toggleViewMode(cmd.command, "video")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                        currentMode === "video"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      <FaVideo className="text-xs" />
                      <span>Video Final</span>
                    </button>
                  </div>

                  {/* Renderizado de la vista */}
                  {currentMode === "image" ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
                      {cmd.sampleBaseImage ? (
                        <img
                          src={cmd.sampleBaseImage}
                          alt={`Imagen base para ${cmd.name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-6 text-slate-400">
                          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 text-2xl shadow-inner">
                            {cmd.icon}
                          </div>
                          <p className="text-xs font-bold text-slate-200">Foto Base del Producto</p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                            Fotografía de producto en fondo limpio o neutro
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full relative flex items-center justify-center bg-slate-950 p-4">
                      {cmd.sampleFinalVideo ? (
                        <video
                          src={cmd.sampleFinalVideo}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-6 text-indigo-300">
                          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl shadow-inner animate-pulse">
                            <FaFilm />
                          </div>
                          <p className="text-xs font-bold text-white">Video Cinemático (Veo 3.1)</p>
                          <p className="text-[11px] text-indigo-200/80 mt-1 max-w-[220px] mx-auto">
                            Efecto en movimiento con dinámica {cmd.name.toLowerCase()}
                          </p>
                          <span className="inline-block mt-3 px-2 py-0.5 rounded-full bg-indigo-500/30 text-[10px] font-bold text-indigo-200">
                            Próximamente muestra en video
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Badge de estado en esquina */}
                  <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-slate-300 px-2 py-0.5 rounded-md border border-white/10">
                    {currentMode === "image" ? "Antes: Estático" : "Después: Cinemático"}
                  </div>
                </div>

                {/* Contenido descriptivo */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <p className="text-slate-600 text-xs leading-relaxed mb-3">
                      {cmd.description}
                    </p>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] space-y-1.5 text-slate-600">
                      <div>
                        <strong className="text-slate-900">Cámara:</strong> {cmd.cameraMovement}
                      </div>
                      <div>
                        <strong className="text-slate-900">Iluminación:</strong> {cmd.lightingStyle}
                      </div>
                    </div>
                  </div>

                  {/* Bloque con Prompt Maestro */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Prompt Maestro para Veo / Flow:
                      </span>
                      <button
                        onClick={() => handleCopy(cmd.defaultEnglishPrompt, cmd.command)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        {isCopied ? (
                          <>
                            <FaCheck className="text-emerald-600" />
                            <span className="text-emerald-700">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <FaCopy />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-[11px] font-mono leading-relaxed max-h-24 overflow-y-auto select-all border border-slate-800">
                      {cmd.defaultEnglishPrompt}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedCommandForGen(cmd.command);
                          window.scrollTo({ top: 120, behavior: "smooth" });
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <span>Personalizar con mi producto</span>
                        <FaArrowRight className="text-[10px]" />
                      </button>
                      <span className="text-[10px] text-slate-400 font-medium">Veo 3.1 & Omni ready</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nota / Tips sobre Google Flow y Veo */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-6 md:p-8 flex items-start gap-4 text-indigo-950">
        <div className="p-3 bg-indigo-600 text-white rounded-2xl shrink-0 shadow-md">
          <FaLightbulb className="text-xl" />
        </div>
        <div className="space-y-1.5">
          <h4 className="font-black text-base text-indigo-950">
            ¿Cómo procesa Google Flow los comandos de video?
          </h4>
          <p className="text-xs md:text-sm text-indigo-900/80 leading-relaxed">
            Google Flow Labs utiliza un intérprete semántico que expande cada comando corto (como{" "}
            <code className="bg-indigo-200/60 text-indigo-950 px-1.5 py-0.5 rounded font-mono font-bold">
              /smoke reveal
            </code>
            ) en una descripción física y cinemática en inglés. Para alimentar directamente a Google Veo 3.1 o Gemini Video (Omni), 
            nuestros agentes generan la fórmula completa de 6 capas: acción física, mecánica de cámara, física de partículas, iluminación de estudio, color grading y cadencia temporal.
          </p>
        </div>
      </div>
    </div>
  );
}
