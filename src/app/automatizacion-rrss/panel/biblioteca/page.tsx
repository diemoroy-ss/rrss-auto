"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useProfile } from "../../../../contexts/ProfileContext";
import RemotionReelPlayer from "../../../../components/video/RemotionReelPlayer";

interface GeneratedImage {
  id: string;
  url: string;
  createdAt: Date;
  source: "ia" | "editor" | "upload";
  type: string;
  videoEngine?: "remotion" | "ai_direct" | "upload";
  prompt?: string;
  copy?: string;
  scenes?: any[];
  audioScript?: string;
  hasRemotionScenes?: boolean;
}

export default function BibliotecaPage() {
  const [user, setUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState("free");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSource, setFilterSource] = useState<"all" | "ia" | "editor" | "upload">("all");
  const [filterType, setFilterType] = useState<"all" | "Post" | "Historia" | "Carrusel" | "Reel">("all");
  const [error, setError] = useState("");
  const { activeProfile } = useProfile();
  
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const planLimits: Record<string, number> = {
    free: 15,
    pro: 150,
    agency: 500,
    admin: 9999
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userSnap = await getDoc(doc(db, "users", u.uid));
          if (userSnap.exists()) {
            setUserPlan(userSnap.data().plan || "free");
          }
        } catch (e) {
          console.error("Error loading user plan:", e);
        }
        loadImages(u.uid, activeProfile?.id || "default");
      }
    });
    return () => unsub();
  }, [activeProfile?.id]);

  const loadImages = async (uid: string, profileId: string) => {
    setLoading(true);
    setError("");
    try {
      const q = query(
        collection(db, "generated_images"),
        where("userId", "==", uid)
      );
      
      const qUploads = query(
        collection(db, "user_templates"),
        where("userId", "==", uid)
      );

      const qSocialPosts = query(
        collection(db, "social_posts"),
        where("userId", "==", uid)
      );
      
      const [snap, snapUploads, snapSocialPosts] = await Promise.all([
        getDocs(q).catch((e) => { console.error("Error fetching generated_images:", e); return { forEach: () => {} } as any; }),
        getDocs(qUploads).catch((e) => { console.error("Error fetching user_templates:", e); return { forEach: () => {} } as any; }),
        getDocs(qSocialPosts).catch((e) => { console.error("Error fetching social_posts:", e); return { forEach: () => {} } as any; })
      ]);
      
      const list: GeneratedImage[] = [];
      const existingUrls = new Set<string>();
      
      snap.forEach((d) => {
        const data = d.data();
        if (data.url) {
          existingUrls.add(data.url);
          list.push({
            id: d.id,
            url: data.url,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            source: data.source || "ia",
            type: data.type || "Post",
            prompt: data.prompt || "",
            copy: data.copy || data.text || "",
            scenes: data.scenes || [],
            audioScript: data.audioScript || "",
            hasRemotionScenes: Boolean(data.scenes && data.scenes.length > 0)
          });
        }
      });

      snapUploads.forEach((d) => {
        const data = d.data();
        if (data.url) {
          existingUrls.add(data.url);
          list.push({
            id: d.id,
            url: data.url,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            source: "upload",
            type: data.type === "video" ? "Reel" : "Post",
            prompt: "Subida manual",
            copy: "",
            scenes: [],
            audioScript: "",
            hasRemotionScenes: false
          });
        }
      });

      snapSocialPosts.forEach((d) => {
        const data = d.data();
        const imgUrl = data.imageUrl || (data.scenes && data.scenes[0]?.bgImageUrl);
        if (imgUrl && !existingUrls.has(imgUrl)) {
          existingUrls.add(imgUrl);
          const isReel = data.type === 'video_reel' || data.type === 'reel' || data.type === 'Reel' || (data.format && (data.format.toLowerCase().includes('reel') || data.format.toLowerCase().includes('short')));
          
          let dateObj = new Date();
          if (data.createdAt?.toDate) dateObj = data.createdAt.toDate();
          else if (data.scheduledFor?.toDate) dateObj = data.scheduledFor.toDate();
          else if (data.createdAt) dateObj = new Date(data.createdAt);
          else if (data.scheduledFor) dateObj = new Date(data.scheduledFor);

          // Escenas fallback para Reels si el objeto del post no incluía escenas explícitas
          const fallbackScenes = [
            {
              id: "scene_1",
              duration: 4,
              title: "¡CONSEJO CLAVE!",
              subtitle: data.idea || data.text || data.title || "Descubre esta estrategia para tu marca",
              highlightWords: ["CONSEJO", "CLAVE"],
              gradientBg: "from-slate-950 via-purple-950 to-indigo-950",
              textColor: "#FFFFFF",
              accentColor: "#F59E0B",
              bgImageUrl: imgUrl
            },
            {
              id: "scene_2",
              duration: 4,
              title: "ESTRATEGIA INTELIGENTE",
              subtitle: data.copy ? (data.copy.length > 70 ? data.copy.substring(0, 70) + "..." : data.copy) : "Optimiza tu presencia en redes con automatización",
              highlightWords: ["ESTRATEGIA", "INTELIGENTE"],
              gradientBg: "from-indigo-950 via-slate-900 to-slate-950",
              textColor: "#FFFFFF",
              accentColor: "#10B981",
              bgImageUrl: imgUrl
            },
            {
              id: "scene_3",
              duration: 4,
              title: "SÍGUENOS PARA MÁS",
              subtitle: "Guarda este Reel y síguenos para más consejos",
              highlightWords: ["GUARDA", "SÍGUENOS"],
              gradientBg: "from-purple-950 via-indigo-900 to-slate-950",
              textColor: "#FFFFFF",
              accentColor: "#FF6B00",
              bgImageUrl: imgUrl
            }
          ];

          const scenesToUse = data.scenes && data.scenes.length > 0 ? data.scenes : (isReel ? fallbackScenes : []);

          list.push({
            id: d.id,
            url: imgUrl,
            createdAt: dateObj,
            source: "ia",
            type: isReel ? "Reel" : (data.type || "Post"),
            videoEngine: isReel || data.videoEngine === "remotion" ? "remotion" : "ai_direct",
            prompt: data.idea || data.text || data.title || "Post Agendado",
            copy: data.copy || data.text || data.postText || "",
            scenes: scenesToUse,
            audioScript: data.audioScript || data.idea || data.text || "",
            hasRemotionScenes: isReel || Boolean(data.scenes && data.scenes.length > 0)
          });
        }
      });
      
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setImages(list);
    } catch (e: any) {
      console.error("Error loading generated images:", e);
      setError("No pudimos cargar la biblioteca en este momento.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, source: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta imagen de tu biblioteca?")) return;
    try {
      const collectionName = source === "upload" ? "user_templates" : "generated_images";
      await deleteDoc(doc(db, collectionName, id));
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (e) {
      console.error("Error deleting image:", e);
      alert("No se pudo eliminar el elemento.");
    }
  };

  const filteredImages = images.filter((img) => {
    if (filterSource !== "all" && img.source !== filterSource) return false;
    if (filterType !== "all" && img.type !== filterType) return false;
    return true;
  });

  const limit = planLimits[userPlan] || 15;
  const isOverLimit = images.length > limit;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* 1. Header con Resumen de Uso */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>🖼️ Biblioteca de Medios</span>
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold uppercase tracking-wider">
              {images.length} / {limit === 9999 ? "Sin Límite" : limit} Guardados
            </span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Gestiona tus imágenes generadas por IA, portadas de Reels y recursos subidos.
          </p>
        </div>

        <Link
          href="/automatizacion-rrss/panel/crear"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 self-start md:self-auto"
        >
          <span>✨ Generar o Subir Nuevo</span>
        </Link>
      </div>

      {isOverLimit && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-bold flex items-center gap-3">
          <span>⚠️</span>
          <span>
            Has superado el límite de almacenamiento de tu plan ({limit} elementos). Actualiza tu plan para guardar más recursos.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold">
          {error}
        </div>
      )}

      {/* 2. Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-100/70 p-2 rounded-2xl border border-slate-200 overflow-x-auto">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3">Origen:</span>
          {(["all", "ia", "editor", "upload"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSource(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                filterSource === s
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {s === "all" ? "Todos" : s === "ia" ? "🤖 IA" : s === "editor" ? "🎨 Editor" : "📥 Subidos"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3">Formato:</span>
          {(["all", "Post", "Historia", "Carrusel", "Reel"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                filterType === t
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t === "all" ? "Todos" : t}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Grid de Imágenes */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-3 border border-slate-200 space-y-3 animate-pulse">
              <div className="aspect-square bg-slate-200 rounded-2xl" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-8 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-12">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            🖼️
          </div>
          <h3 className="text-lg font-black text-slate-900">No hay elementos en esta categoría</h3>
          <p className="text-slate-500 text-xs font-medium">
            Genera nuevas imágenes con IA desde el creador de publicaciones o sube tus propios recursos.
          </p>
          <Link
            href="/automatizacion-rrss/panel/crear"
            className="inline-block px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-extrabold text-xs uppercase tracking-wider hover:bg-indigo-100 transition-all"
          >
            Ir al Creador
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden group flex flex-col"
            >
              <div className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setSelectedImage(img)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.prompt || "Diseño"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-lg">
                    👁️ Ver Detalle
                  </span>
                </div>

                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm border ${
                    img.source === "ia" ? "bg-indigo-900/80 text-indigo-100 border-indigo-500/30" : img.source === "upload" ? "bg-amber-900/80 text-amber-100 border-amber-500/30" : "bg-emerald-900/80 text-emerald-100 border-emerald-500/30"
                  }`}>
                    {img.source === "ia" ? "🤖 IA" : img.source === "upload" ? "📥 Subido" : "🎨 Editor"}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/60 text-white backdrop-blur-md border border-white/10">
                    {img.type}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-slate-800 line-clamp-2">
                    {img.prompt || "Sin concepto descriptivo"}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>{img.createdAt.toLocaleDateString()}</span>
                    <button 
                      onClick={() => handleDelete(img.id, img.source)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-xs text-rose-550"
                      title="Eliminar de la biblioteca"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100/80">
                  <Link
                    href={`/automatizacion-rrss/panel/crear?templateUrl=${encodeURIComponent(img.url)}&hideAI=true`}
                    className="py-2 px-2 text-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[9px] uppercase tracking-wider transition-all"
                  >
                    🚀 Postear
                  </Link>
                  {img.hasRemotionScenes ? (
                    <Link
                      href={`/automatizacion-rrss/panel/poc-video?idea=${encodeURIComponent(img.prompt || '')}`}
                      className="py-2 px-2 text-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[9px] uppercase tracking-wider transition-all"
                    >
                      ✏️ Editar
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
          <div className="bg-white rounded-[28px] overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
            
            <div className="w-full md:w-3/5 bg-slate-950 flex flex-col items-center justify-center relative p-4 overflow-y-auto max-h-[90vh]">
              {selectedImage.scenes && selectedImage.scenes.length > 0 ? (
                <RemotionReelPlayer composition={{ title: selectedImage.prompt || "Reel", rubro: activeProfile?.rubro || "General", totalDuration: selectedImage.scenes.reduce((acc: number, s: any) => acc + (s.duration || 4), 0), audioScript: selectedImage.audioScript || "", copyText: selectedImage.copy || "", scenes: selectedImage.scenes }} />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={selectedImage.url} alt={selectedImage.prompt || "Diseño"} className="w-full h-auto object-contain max-h-[85vh] rounded-2xl" />
              )}
            </div>

            <div className="w-full md:w-2/5 p-6 flex flex-col max-h-[90vh] overflow-y-auto bg-white">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border shadow-sm ${
                  selectedImage.videoEngine === "remotion" || selectedImage.hasRemotionScenes
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : selectedImage.source === "ia"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : selectedImage.source === "upload"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}>
                  {selectedImage.videoEngine === "remotion" || selectedImage.hasRemotionScenes
                    ? "🎬 Creado con Remotion AI"
                    : selectedImage.source === "ia"
                    ? "🤖 Generado por IA"
                    : selectedImage.source === "upload"
                    ? "📥 Subido por Usuario"
                    : "🎨 Editor"}
                </span>
                <button onClick={() => setSelectedImage(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors w-8 h-8 flex items-center justify-center font-bold">
                  ✕
                </button>
              </div>
              
              <h4 className="font-black text-slate-900 text-base mb-4 flex items-center gap-2">
                {selectedImage.type === 'Post' ? '📱' : selectedImage.type === 'Historia' ? '📱' : '🎬'} Formato: {selectedImage.type}
              </h4>
              
              {selectedImage.prompt && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 mb-4">
                  <p className="font-black text-[10px] uppercase tracking-widest text-indigo-500 mb-2 flex items-center gap-1.5">
                    <span>✨</span> CONCEPTO / PROMPT ORIGINAL:
                  </p>
                  <p className="text-xs font-semibold italic text-slate-700 leading-relaxed">
                    "{selectedImage.prompt}"
                  </p>
                </div>
              )}

              {selectedImage.copy && (
                <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 mb-6">
                  <p className="font-black text-[10px] uppercase tracking-widest text-indigo-600 mb-2 flex items-center gap-1.5">
                    <span>📝</span> COPY / PIE DE FOTO:
                  </p>
                  <p className="text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedImage.copy}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-slate-100">
                <Link
                  href={`/automatizacion-rrss/panel/crear?templateUrl=${encodeURIComponent(selectedImage.url)}&hideAI=true`}
                  className="py-3.5 px-4 text-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-md shadow-indigo-600/20"
                >
                  🚀 POSTEAR
                </Link>
                {selectedImage.hasRemotionScenes ? (
                  <Link
                    href={`/automatizacion-rrss/panel/poc-video?idea=${encodeURIComponent(selectedImage.prompt || '')}`}
                    className="py-3.5 px-4 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider transition-all"
                  >
                    ✏️ EDITAR DISEÑO EN REMOTION
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
