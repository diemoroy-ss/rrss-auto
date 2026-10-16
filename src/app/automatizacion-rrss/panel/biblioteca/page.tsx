"use client";

import { useState, useEffect, useMemo } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useProfile } from "../../../../contexts/ProfileContext";
import RemotionReelPlayer from "../../../../components/video/RemotionReelPlayer";

export type DateFilterType = "all" | "today" | "7days" | "30days" | "this_month" | "custom";

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
  const [filterDate, setFilterDate] = useState<DateFilterType>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 12;
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

  const isDateInRange = (date: Date) => {
    if (filterDate === "all") return true;

    const now = new Date();
    const itemTime = date.getTime();

    if (filterDate === "today") {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return itemTime >= startOfToday;
    }

    if (filterDate === "7days") {
      const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      return itemTime >= sevenDaysAgo;
    }

    if (filterDate === "30days") {
      const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      return itemTime >= thirtyDaysAgo;
    }

    if (filterDate === "this_month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return itemTime >= startOfMonth;
    }

    if (filterDate === "custom") {
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate + "T00:00:00").getTime();
        const end = new Date(customEndDate + "T23:59:59").getTime();
        return itemTime >= start && itemTime <= end;
      } else if (customStartDate) {
        const start = new Date(customStartDate + "T00:00:00").getTime();
        return itemTime >= start;
      } else if (customEndDate) {
        const end = new Date(customEndDate + "T23:59:59").getTime();
        return itemTime <= end;
      }
      return true;
    }

    return true;
  };

  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      if (filterSource !== "all" && img.source !== filterSource) return false;
      if (filterType !== "all" && img.type !== filterType) return false;
      if (!isDateInRange(img.createdAt)) return false;
      return true;
    });
  }, [images, filterSource, filterType, filterDate, customStartDate, customEndDate]);

  // Resetear a página 1 al cambiar cualquier filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSource, filterType, filterDate, customStartDate, customEndDate]);

  const totalItems = filteredImages.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  const paginatedImages = useMemo(() => {
    return filteredImages.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredImages, startIndex]);

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
              {filteredImages.length} {filteredImages.length === 1 ? "Elemento" : "Elementos"}{filteredImages.length !== images.length ? ` de ${images.length}` : " Guardados"}
            </span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Gestiona tus imágenes, portadas de Reels y recursos multimedia.
          </p>
        </div>

        <Link
          href="/automatizacion-rrss/panel/crear"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 self-start md:self-auto"
        >
          <span>✨ Generar o Subir Nuevo</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold">
          {error}
        </div>
      )}

      {/* 2. Barra de Filtros con Origen, Formato y Fecha */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Origen */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 pr-1">Origen:</span>
            {(["all", "ia", "editor", "upload"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSource(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  filterSource === s
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200/70 text-slate-600"
                }`}
              >
                {s === "all" ? "Todos" : s === "ia" ? "✨ Agentes" : s === "editor" ? "🎨 Editor" : "📥 Subidos"}
              </button>
            ))}
          </div>

          {/* Formato */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 pr-1">Formato:</span>
            {(["all", "Post", "Historia", "Carrusel", "Reel"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  filterType === t
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200/70 text-slate-600"
                }`}
              >
                {t === "all" ? "Todos" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Fila Filtro de Fecha */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 pr-1">Fecha:</span>
            {[
              { id: "all", label: "Todas" },
              { id: "today", label: "Hoy" },
              { id: "7days", label: "Últimos 7 días" },
              { id: "30days", label: "Últimos 30 días" },
              { id: "this_month", label: "Este mes" },
              { id: "custom", label: "📅 Rango..." },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setFilterDate(d.id as DateFilterType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  filterDate === d.id
                    ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400"
                    : "bg-slate-100 hover:bg-slate-200/70 text-slate-600"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Rango de fechas personalizado */}
          {filterDate === "custom" && (
            <div className="flex items-center gap-2 bg-indigo-50/60 border border-indigo-100 p-1.5 rounded-xl">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                title="Fecha desde"
              />
              <span className="text-xs text-slate-400 font-bold">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                title="Fecha hasta"
              />
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate("");
                    setCustomEndDate("");
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 px-1"
                  title="Limpiar rango"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Total de resultados */}
          <div className="text-[11px] font-bold text-slate-400 sm:ml-auto">
            {filteredImages.length} resultado{filteredImages.length === 1 ? "" : "s"}
          </div>
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
          {paginatedImages.map((img) => (
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
                    {img.source === "ia" ? "✨ Agentes" : img.source === "upload" ? "📥 Subido" : "🎨 Editor"}
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

      {/* 4. Controles de Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-bold text-slate-500">
            Mostrando <span className="text-slate-900 font-black">{totalItems > 0 ? startIndex + 1 : 0} - {endIndex}</span> de{" "}
            <span className="text-slate-900 font-black">{totalItems}</span> elementos
            {filteredImages.length < images.length && (
              <span className="text-indigo-600 font-semibold ml-1">({images.length} en total)</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botón Anterior */}
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={currentPage === 1}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed text-slate-700 flex items-center gap-1 shadow-2xs"
            >
              <span>←</span>
              <span className="hidden sm:inline">Anterior</span>
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (p === 1 || p === totalPages) return true;
                  return Math.abs(p - currentPage) <= 1;
                })
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push("...");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) => {
                  if (typeof item === "string") {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1.5 text-xs font-bold text-slate-400">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = item === currentPage;
                  return (
                    <button
                      key={item}
                      onClick={() => {
                        setCurrentPage(item);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                        isCurrent
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
            </div>

            {/* Botón Siguiente */}
            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={currentPage === totalPages}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed text-slate-700 flex items-center gap-1 shadow-2xs"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
          <div className="bg-white rounded-[28px] overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
            
            <div className="w-full md:w-3/5 bg-slate-950 flex flex-col items-center justify-center relative p-4 overflow-y-auto max-h-[90vh]">
              {selectedImage.scenes && selectedImage.scenes.length > 0 ? (
                (() => {
                  const rawTotal = selectedImage.scenes.reduce((acc: number, s: any) => acc + (s.duration || 3.3), 0);
                  const scale = rawTotal > 10 ? 10 / rawTotal : 1;
                  const scaledScenes = selectedImage.scenes.map((s: any) => ({
                    ...s,
                    duration: Math.max(1, Math.round((s.duration || 3.3) * scale * 10) / 10),
                  }));
                  return (
                    <RemotionReelPlayer
                      composition={{
                        title: selectedImage.prompt || "Reel",
                        rubro: activeProfile?.rubro || "General",
                        totalDuration: Math.min(10, Math.max(3, Math.round(rawTotal * scale * 10) / 10)),
                        audioScript: selectedImage.audioScript || "",
                        copyText: selectedImage.copy || "",
                        scenes: scaledScenes,
                      }}
                    />
                  );
                })()
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
