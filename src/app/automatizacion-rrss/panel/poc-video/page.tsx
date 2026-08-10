"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useProfile } from "../../../../contexts/ProfileContext";
import RemotionReelPlayer from "../../../../components/video/RemotionReelPlayer";
import { VideoComposition } from "../../../../lib/video-poc-service";

export default function VideoPoCPage() {
  const { activeProfile } = useProfile();
  const prof = activeProfile as any;

  const [topic, setTopic] = useState<string>("3 Consejos Clave para Triunfar en Gastronomía");
  const [rubro, setRubro] = useState<string>(prof?.rubro || prof?.niche || "Gastronomía & Restaurantes");
  const [style, setStyle] = useState<"vibrante" | "minimalista" | "cyberpunk" | "corporativo">("vibrante");

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Composición del Reel (inicialmente null para no generar automáticamente)
  const [composition, setComposition] = useState<VideoComposition | null>(null);

  // Estado del Checklist de carga de imágenes de fondo por escena
  const [imageStatus, setImageStatus] = useState<Record<number, "loading" | "ready" | "error">>({});

  // Estado del Modal de Programación
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return tmr.toISOString().split("T")[0];
  });
  const [scheduledTime, setScheduledTime] = useState<string>("15:00");
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(["instagram", "tiktok"]);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<string>("");

  // Precargar imágenes de las escenas cuando la composición cambia
  useEffect(() => {
    if (!composition?.scenes) return;

    const newStatus: Record<number, "loading" | "ready" | "error"> = {};
    composition.scenes.forEach((_, idx) => {
      newStatus[idx] = "loading";
    });
    setImageStatus(newStatus);

    composition.scenes.forEach((scene, idx) => {
      if (scene.bgImageUrl) {
        const img = new Image();
        img.src = scene.bgImageUrl;
        img.onload = () => {
          setImageStatus((prev) => ({ ...prev, [idx]: "ready" }));
        };
        img.onerror = () => {
          setImageStatus((prev) => ({ ...prev, [idx]: "error" }));
        };
      } else {
        setImageStatus((prev) => ({ ...prev, [idx]: "ready" }));
      }
    });
  }, [composition]);

  const handleGenerateVideo = async () => {
    if (!topic.trim()) {
      setErrorMsg("Por favor, ingresa un tema para generar el Reel.");
      return;
    }

    setErrorMsg("");
    setScheduleSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/poc/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          rubro: rubro.trim() || "General",
          style,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al generar la composición del video.");
      }

      setComposition(data.composition);
    } catch (err: any) {
      console.error("Error al generar Reel:", err);
      setErrorMsg(err.message || "Error al conectar con la IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSceneText = (sceneIndex: number, field: "title" | "subtitle", value: string) => {
    if (!composition) return;
    setComposition((prev) => {
      if (!prev) return null;
      const newScenes = [...prev.scenes];
      newScenes[sceneIndex] = {
        ...newScenes[sceneIndex],
        [field]: value,
      };
      return {
        ...prev,
        scenes: newScenes,
      };
    });
  };

  const handleConfirmSchedule = async () => {
    if (!composition || selectedNetworks.length === 0) return;
    setIsScheduling(true);
    setErrorMsg("");

    try {
      const user = auth.currentUser;
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);

      if (user && activeProfile?.id) {
        await addDoc(collection(db, "posts"), {
          userId: user.uid,
          businessId: activeProfile.id,
          title: composition.title,
          postText: composition.copyText,
          audioScript: composition.audioScript,
          type: "video_reel",
          format: "Reel 9:16",
          status: "confirmed", // Agendado
          scheduledAt: scheduledDateTime,
          networks: selectedNetworks,
          scenes: composition.scenes,
          createdAt: serverTimestamp(),
        });
      }

      setScheduleSuccess(`¡Reel agendado con éxito para el ${scheduledDate} a las ${scheduledTime} hrs!`);
      setShowScheduleModal(false);
    } catch (err: any) {
      console.error("Error al agendar Reel:", err);
      setErrorMsg("No se pudo programar el Reel en la base de datos.");
    } finally {
      setIsScheduling(false);
    }
  };

  const toggleNetwork = (net: string) => {
    setSelectedNetworks((prev) =>
      prev.includes(net) ? prev.filter((n) => n !== net) : [...prev, net]
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <span>🎬 PoC Generación de Video</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] text-amber-300 font-extrabold">Reels 9:16</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
            Generador de Reels Animados con IA & Remotion
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed">
            Prueba de concepto para estructurar, animar y previsualizar Reels verticales a 60fps con subtítulos dinámicos estilo Alex Hormozi y marca de agua.
          </p>
        </div>
      </div>

      {scheduleSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm font-extrabold rounded-2xl flex items-center justify-between">
          <span>✅ {scheduleSuccess}</span>
          <button onClick={() => setScheduleSuccess("")} className="text-emerald-600 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* GRID PRINCIPAL: CONTROLES A LA IZQUIERDA, PLAYER A LA DERECHA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* PANEL IZQUIERDO: FORMULARIO Y EDICIÓN (7 COLUMNAS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* TARJETA DE CONFIGURACIÓN */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>⚙️ Configurar Parámetros del Reel</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tema o Idea Principal del Video <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej: 3 Estrategias para aumentar ventas en e-commerce"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rubro / Industria
                  </label>
                  <input
                    type="text"
                    value={rubro}
                    onChange={(e) => setRubro(e.target.value)}
                    placeholder="Ej: Gastronomía, Software B2B"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estilo Visual
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                  >
                    <option value="vibrante">Vibrante (Púrpura / Naranja)</option>
                    <option value="minimalista">Minimalista (Oscuro / Verde)</option>
                    <option value="cyberpunk">Cyberpunk (Neón / Azul)</option>
                    <option value="corporativo">Corporativo (Azul / Gris)</option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
                  ⚠️ {errorMsg}
                </div>
              )}

              <button
                onClick={handleGenerateVideo}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generando Guion e Imágenes con IA...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Generar Reel con IA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CHECKLIST DE ESTADO DE IMÁGENES & ASSETS */}
          {composition && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>🖼️ Checklist de Imágenes de Fondo</span>
                </h3>
                <span className="text-[10px] font-extrabold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                  {Object.values(imageStatus).filter((s) => s === "ready").length} / {composition.scenes.length} Listas
                </span>
              </div>

              <div className="space-y-2">
                {composition.scenes.map((scene, idx) => {
                  const status = imageStatus[idx] || "loading";
                  return (
                    <div
                      key={scene.id || idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {status === "ready" ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-extrabold text-[10px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> ✅ Lista
                          </span>
                        ) : status === "error" ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-extrabold text-[10px]">
                            ⚠️ Error al cargar
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-extrabold text-[10px] flex items-center gap-1">
                            <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /> ⏳ Generando / Cargando...
                          </span>
                        )}
                        <span className="font-bold text-slate-800">
                          Escena #{idx + 1}: <span className="text-slate-500 font-medium">{scene.title}</span>
                        </span>
                      </div>

                      {scene.bgImageUrl && (
                        <a
                          href={scene.bgImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                        >
                          Ver Imagen ↗
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EDITOR DE ESCENAS EN VIVO (Si la composición existe) */}
          {composition && (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span>✍️ Editar Escenas en Tiempo Real</span>
                </h2>

                <div className="space-y-4">
                  {composition.scenes.map((scene, idx) => (
                    <div key={scene.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-700 uppercase">
                          Escena #{idx + 1} ({scene.duration}s)
                        </span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-500">
                          Color Acento: <span style={{ color: scene.accentColor }}>{scene.accentColor}</span>
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Título Escena:</label>
                        <input
                          type="text"
                          value={scene.title}
                          onChange={(e) => handleUpdateSceneText(idx, "title", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Subtítulo (Gancho):</label>
                        <input
                          type="text"
                          value={scene.subtitle}
                          onChange={(e) => handleUpdateSceneText(idx, "subtitle", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COPY Y SCRIPT SUGERIDO */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                  📜 Guion de Locución (Voice-over Script)
                </h3>
                <p className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  "{composition.audioScript}"
                </p>
              </div>

              {/* BOTÓN PROGRAMAR PUBLICACIÓN */}
              <button
                onClick={() => setShowScheduleModal(true)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <span>📅 Programar Publicación de este Reel</span>
              </button>
            </>
          )}
        </div>

        {/* PANEL DERECHO: PLAYER REEL 9:16 (5 COLUMNAS) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center sticky top-24">
          {composition ? (
            <div className="space-y-3 text-center">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Previsualizador de Reel 9:16
              </h2>
              <RemotionReelPlayer composition={composition} />
            </div>
          ) : (
            <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4 my-auto">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-indigo-100 shadow-sm">
                🎬
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  Genera tu primer Reel animado
                </h3>
                <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto leading-relaxed">
                  Ingresa tu tema a la izquierda y presiona <strong>"✨ Generar Reel con IA"</strong> para que la IA cree las imágenes de fondo, subtítulos animados y el guion en tiempo real.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE PROGRAMACIÓN DE PUBLICACIÓN */}
      {showScheduleModal && composition && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <h3 className="font-extrabold text-base text-slate-900">Programar Publicación de Reel</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Título del Video</label>
                <input
                  type="text"
                  value={composition.title}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Fecha de Publicación</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Hora de Publicación</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Redes Sociales Destino</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleNetwork("instagram")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 ${
                      selectedNetworks.includes("instagram")
                        ? "bg-pink-50 border-pink-300 text-pink-700"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <span>📸 Instagram Reels</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleNetwork("tiktok")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 ${
                      selectedNetworks.includes("tiktok")
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <span>🎵 TikTok</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleNetwork("youtube")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 ${
                      selectedNetworks.includes("youtube")
                        ? "bg-rose-50 border-rose-300 text-rose-700"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <span>▶️ YouTube Shorts</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmSchedule}
                disabled={isScheduling || selectedNetworks.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                {isScheduling ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Confirmar y Programar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
