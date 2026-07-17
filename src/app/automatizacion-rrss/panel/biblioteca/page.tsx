"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useProfile } from "../../../../contexts/ProfileContext";

interface GeneratedImage {
  id: string;
  url: string;
  createdAt: Date;
  source: "ia" | "editor" | "upload";
  type: string;
  prompt?: string;
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

  // Límites según el plan
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
        // Cargar plan de usuario
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
        where("userId", "==", uid),
        where("profileId", "==", profileId),
        orderBy("createdAt", "desc")
      );
      
      const qUploads = query(
        collection(db, "user_templates"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );
      
      const [snap, snapUploads] = await Promise.all([getDocs(q), getDocs(qUploads)]);
      
      const list: GeneratedImage[] = [];
      
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          url: data.url,
          createdAt: data.createdAt?.toDate() || new Date(),
          source: data.source || "ia",
          type: data.type || "Post",
          prompt: data.prompt || ""
        });
      });

      snapUploads.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          url: data.url,
          createdAt: data.createdAt?.toDate() || new Date(),
          source: "upload",
          type: data.type === "video" ? "Reel" : "Post",
          prompt: "Subida manual"
        });
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
      alert("No se pudo eliminar la imagen.");
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // Fallback
      window.open(url, "_blank");
    }
  };

  // Filtrado de imágenes en memoria
  const filteredImages = images.filter((img) => {
    const matchesSource = filterSource === "all" || img.source === filterSource;
    const matchesType = filterType === "all" || img.type === filterType;
    return matchesSource && matchesType;
  });

  const limit = planLimits[userPlan] || 15;
  const currentCount = images.length;
  const percentage = Math.min(100, Math.round((currentCount / limit) * 100));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>🖼️</span> Biblioteca de Diseños
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Historial de imágenes y propuestas generadas con IA o editadas en tu marca.
          </p>
        </div>

        {/* Tarjeta de Consumo de Cuota de Imágenes */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-lg shadow-slate-100 max-w-sm w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cupo de Imágenes</span>
            <span className="text-xs font-black text-slate-700">{currentCount} / {limit === 9999 ? "∞" : limit}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                percentage > 85 ? "bg-rose-500" : percentage > 50 ? "bg-amber-500" : "bg-indigo-600"
              }`}
              style={{ width: `${limit === 9999 ? 0 : percentage}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-2.5">
            {limit === 9999 
              ? "Plan de administración ilimitado." 
              : `Consumido un ${percentage}% de tu plan actual (${userPlan.toUpperCase()}).`}
          </p>
        </div>
      </div>

      {/* Controles de Filtros */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {/* Filtro Origen */}
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/40">
            <button
              onClick={() => setFilterSource("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterSource === "all" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterSource("ia")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterSource === "ia" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Generados por IA
            </button>
            <button
              onClick={() => setFilterSource("editor")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterSource === "editor" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Editados
            </button>
            <button
              onClick={() => setFilterSource("upload")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterSource === "upload" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Subidos
            </button>
          </div>

          {/* Filtro Formatos */}
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/40">
            {["all", "Post", "Historia", "Carrusel", "Reel"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === type ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {type === "all" ? "Cualquier Formato" : type}
              </button>
            ))}
          </div>
        </div>

        <Link
          href="/automatizacion-rrss/panel/crear"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          ✍️ Crear Nuevo Post
        </Link>
      </div>

      {/* Grid de Imágenes */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-slate-100 rounded-[24px] border border-slate-200/50"></div>
          ))}
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-250 p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <span className="text-5xl mb-4 opacity-60">🖼️</span>
          <h3 className="text-slate-700 font-black text-lg mb-1">No hay imágenes en esta sección</h3>
          <p className="text-slate-400 text-xs font-semibold max-w-sm leading-relaxed mb-6">
            Las imágenes que generes con IA o edites en el creador de publicaciones se guardarán automáticamente aquí para que no las pierdas.
          </p>
          <Link
            href="/automatizacion-rrss/panel/crear"
            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-black text-xs py-3 px-6 rounded-xl transition-all"
          >
            Generar Mi Primer Diseño
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in zoom-in-95 duration-500">
          {filteredImages.map((img) => (
            <div 
              key={img.id} 
              className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
            >
              {/* Contenedor imagen */}
              <div className="aspect-square w-full relative bg-slate-100 overflow-hidden">
                <img 
                  src={img.url} 
                  alt={img.prompt || "Diseño generado"} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                
                {/* Badge de tipo de origen */}
                <span className={`absolute top-3 left-3 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border shadow-sm z-10 ${
                  img.source === "ia" 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                    : img.source === "upload"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}>
                  {img.source === "ia" ? "🤖 IA" : img.source === "upload" ? "📥 Subido" : "🎨 Editado"}
                </span>

                {/* Badge de formato */}
                <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm border border-slate-800 text-white z-10 shadow-sm">
                  {img.type}
                </span>

                {/* Capa Hover con prompt */}
                {img.prompt && (
                  <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-xs text-white z-20">
                    <p className="font-bold text-[9px] uppercase tracking-widest text-indigo-400 mb-1">Concepto / Prompt:</p>
                    <p className="line-clamp-4 font-semibold italic text-slate-200 leading-snug">
                      "{img.prompt}"
                    </p>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="p-3.5 bg-white border-t border-slate-100 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">
                    {img.createdAt.toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => downloadImage(img.url, `diseño_santisoft_${img.id}.png`)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-xs"
                      title="Descargar imagen"
                    >
                      📥
                    </button>
                    <button 
                      onClick={() => handleDelete(img.id, img.source)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-xs text-rose-550"
                      title="Eliminar de la biblioteca"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100/50">
                  <Link
                    href={`/automatizacion-rrss/panel/crear?templateUrl=${encodeURIComponent(img.url)}&hideAI=true`}
                    className="py-2 px-2 text-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[9px] uppercase tracking-wider transition-all"
                  >
                    🚀 Postear
                  </Link>
                  <Link
                    href={`/automatizacion-rrss/panel/crear?templateUrl=${encodeURIComponent(img.url)}&openEditor=true`}
                    className="py-2 px-2 text-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[9px] uppercase tracking-wider transition-all"
                  >
                    ✏️ Editar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
