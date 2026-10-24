"use client";

import { useState, useEffect, useMemo } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useProfile } from "../../../../contexts/ProfileContext";
import RemotionReelPlayer from "../../../../components/video/RemotionReelPlayer";
import {
  Search,
  X,
  Check,
  Camera,
  Box,
  Palette,
  Megaphone,
  ShoppingBag,
  Layers,
  Newspaper,
  UtensilsCrossed,
  Tag,
  Sparkles,
  Trash2,
  Loader2,
} from "lucide-react";

type DateFilterType = "all" | "today" | "7days" | "30days" | "this_month" | "custom";

const STYLE_CATEGORIES = [
  "Publicidad y Ads",
  "Gastronomía & Carteles",
  "Editorial y Revista",
  "Fotorealismo",
  "Diseño y 3D",
  "Estilos Técnicos",
  "Artísticos y Creativos",
  "Producto (E-commerce)",
  "Minimalista",
];

function getCategoryIconComponent(category: string) {
  const normalized = category.toLowerCase().trim();
  if (normalized.includes("foto") || normalized.includes("realism")) {
    return <Camera className="w-3.5 h-3.5 shrink-0" />;
  }
  if (normalized.includes("3d") || normalized.includes("diseño") || normalized.includes("diseno")) {
    return <Box className="w-3.5 h-3.5 shrink-0" />;
  }
  if (normalized.includes("artístic") || normalized.includes("artistic") || normalized.includes("concept") || normalized.includes("creat")) {
    return <Palette className="w-3.5 h-3.5 shrink-0" />;
  }
  if (normalized.includes("publicidad") || normalized.includes("ads") || normalized.includes("cartel")) {
    return <Megaphone className="w-3.5 h-3.5 shrink-0" />;
  }
  if (normalized.includes("producto") || normalized.includes("e-commerce") || normalized.includes("tienda")) {
    return <ShoppingBag className="w-3.5 h-3.5 shrink-0" />;
  }
  if (normalized.includes("técnic") || normalized.includes("tecnic") || normalized.includes("exploded")) {
    return <Layers className="w-3.5 h-3.5 shrink-0" />;
  }
  if (normalized.includes("editorial") || normalized.includes("revista")) {
    return <Newspaper className="w-3.5 h-3.5 shrink-0" />;
  }
  if (normalized.includes("gastro") || normalized.includes("comida") || normalized.includes("restauran")) {
    return <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />;
  }
  return <Tag className="w-3.5 h-3.5 shrink-0" />;
}

function getCategorySubtitle(category: string): string {
  const normalized = category.toLowerCase().trim();
  if (normalized.includes("publicidad") || normalized.includes("ads") || normalized.includes("cartel")) {
    return "Vallas, anuncios y fotos lifestyle";
  }
  if (normalized.includes("gastro") || normalized.includes("comida") || normalized.includes("restauran")) {
    return "Menús, platos gourmet y promociones";
  }
  if (normalized.includes("editorial") || normalized.includes("revista")) {
    return "Portadas, modas y layouts limpios";
  }
  if (normalized.includes("producto") || normalized.includes("e-commerce") || normalized.includes("tienda")) {
    return "Fondo blanco, 360° y estudio";
  }
  if (normalized.includes("técnic") || normalized.includes("tecnic") || normalized.includes("exploded")) {
    return "Exploded view, esquemas y planos";
  }
  if (normalized.includes("3d") || normalized.includes("diseño") || normalized.includes("diseno")) {
    return "Renders hiperrealistas y texturas 3D";
  }
  if (normalized.includes("artístic") || normalized.includes("artistic") || normalized.includes("concept") || normalized.includes("creat")) {
    return "Ilustraciones y arte conceptual";
  }
  if (normalized.includes("foto") || normalized.includes("realism")) {
    return "Capturas fotográficas profesionales";
  }
  if (normalized.includes("minimal")) {
    return "Composiciones limpias y elegantes";
  }
  return "Estilos visuales variados";
}

function getImageCategories(img: GeneratedImage): string[] {
  const cats: string[] = [];
  const text = `${img.prompt || ""} ${img.copy || ""} ${img.type || ""}`.toLowerCase();

  if (
    img.commercialDesignId ||
    text.includes("cartel") ||
    text.includes("saas") ||
    text.includes("pyme") ||
    text.includes("diagnóstico") ||
    text.includes("anuncio") ||
    text.includes("ads") ||
    text.includes("publicidad")
  ) {
    cats.push("Publicidad y Ads");
  }
  if (
    text.includes("gastro") ||
    text.includes("comida") ||
    text.includes("plato") ||
    text.includes("burger") ||
    text.includes("pizza") ||
    text.includes("sushi") ||
    text.includes("restauran") ||
    text.includes("café")
  ) {
    cats.push("Gastronomía & Carteles");
  }
  if (text.includes("editorial") || text.includes("revista") || text.includes("magazine") || text.includes("fashion") || text.includes("moda")) {
    cats.push("Editorial y Revista");
  }
  if (text.includes("foto") || text.includes("photo") || text.includes("portrait") || text.includes("cinematic") || text.includes("photograph")) {
    cats.push("Fotorealismo");
  }
  if (text.includes("3d") || text.includes("octane") || text.includes("render") || text.includes("isometric") || text.includes("balance scale")) {
    cats.push("Diseño y 3D");
  }
  if (text.includes("tech") || text.includes("blueprint") || text.includes("exploded") || text.includes("esquema") || text.includes("código") || text.includes("microchip")) {
    cats.push("Estilos Técnicos");
  }
  if (text.includes("arte") || text.includes("art") || text.includes("ilustration") || text.includes("ilustración") || text.includes("creative")) {
    cats.push("Artísticos y Creativos");
  }
  if (text.includes("producto") || text.includes("pack") || text.includes("botella") || text.includes("ecommerce") || text.includes("e-commerce")) {
    cats.push("Producto (E-commerce)");
  }
  if (text.includes("minimal") || text.includes("limpio") || text.includes("simple")) {
    cats.push("Minimalista");
  }

  if (cats.length === 0) {
    cats.push(img.source === "editor" ? "Publicidad y Ads" : "Fotorealismo");
  }
  return cats;
}

interface GeneratedImage {
  id: string;
  url: string;
  baseImageUrl?: string;
  createdAt: Date;
  source: "ia" | "editor" | "upload";
  type: string;
  videoEngine?: "remotion" | "ai_direct" | "upload";
  prompt?: string;
  copy?: string;
  scenes?: any[];
  audioScript?: string;
  hasRemotionScenes?: boolean;
  commercialDesignId?: string;
  carouselImages?: string[];
  carouselPrompts?: string[];
  carouselIds?: string[];
  commercialDesignData?: any;
}


function consolidateCarouselItems(rawList: GeneratedImage[]): GeneratedImage[] {
  const consolidated: GeneratedImage[] = [];
  const processedIds = new Set<string>();

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (processedIds.has(item.id)) continue;

    // Si ya tiene carouselImages explícito con más de 1 lámina, agregarlo directamente
    if (item.type === 'Carrusel' && item.carouselImages && item.carouselImages.length > 1) {
      processedIds.add(item.id);
      consolidated.push(item);
      continue;
    }

    // Si es tipo Carrusel y vino en lote suelto, agrupar con sus diapositivas hermanas
    if (item.type === 'Carrusel') {
      const relatedSlides: GeneratedImage[] = [item];
      processedIds.add(item.id);

      const itemTime = item.createdAt.getTime();

      for (let j = 0; j < rawList.length; j++) {
        if (i === j) continue;
        const other = rawList[j];
        if (processedIds.has(other.id)) continue;

        if (other.type === 'Carrusel') {
          const timeDiff = Math.abs(other.createdAt.getTime() - itemTime);
          // Si fueron creadas en la misma sesión/lote (dentro de 5 minutos o mismo diseño comercial)
          const isSameBatch =
            (item.commercialDesignId && item.commercialDesignId === other.commercialDesignId) ||
            timeDiff <= 5 * 60 * 1000;

          if (isSameBatch && relatedSlides.length < 10) {
            relatedSlides.push(other);
            processedIds.add(other.id);
          }
        }
      }

      if (relatedSlides.length > 1) {
        // Orden cronológico de las diapositivas
        relatedSlides.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        const allUrls = relatedSlides.map((s) => s.url).filter(Boolean);
        const allPrompts = relatedSlides.map((s) => s.prompt || "");
        const allIds = relatedSlides.map((s) => s.id);
        const coverItem = relatedSlides[0];

        consolidated.push({
          ...coverItem,
          carouselImages: allUrls,
          carouselPrompts: allPrompts,
          carouselIds: allIds,
          prompt: coverItem.prompt || `Carrusel comercial (${allUrls.length} diapositivas)`,
          copy: relatedSlides.find((s) => s.copy)?.copy || coverItem.copy || "",
        });
      } else {
        consolidated.push(item);
      }
    } else {
      processedIds.add(item.id);
      consolidated.push(item);
    }
  }

  return consolidated;
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isStyleFilterModalOpen, setIsStyleFilterModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [carouselPreviewIndex, setCarouselPreviewIndex] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBatch, setIsDeletingBatch] = useState<boolean>(false);
  const ITEMS_PER_PAGE = 12;
  const [error, setError] = useState("");
  const { activeProfile } = useProfile();

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
        let displayUrl = data.url;
        // Si data.url es una URL de Butterfly fallida o no existe, usar baseImageUrl
        if ((!displayUrl || displayUrl.includes("butterfly.santisoft.cl")) && data.baseImageUrl) {
          displayUrl = data.baseImageUrl;
        }
        if (displayUrl) {
          existingUrls.add(displayUrl);
          list.push({
            id: d.id,
            url: displayUrl,
            baseImageUrl: data.baseImageUrl || data.url,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            source: data.source === "imagen_comercial" ? "editor" : (data.source || "ia"),
            type: data.type || "Post",
            prompt: data.prompt || "",
            copy: data.copy || data.text || "",
            scenes: data.scenes || [],
            audioScript: data.audioScript || "",
            hasRemotionScenes: Boolean(data.scenes && data.scenes.length > 0),
            commercialDesignId: data.commercialDesignId || (data.source === "imagen_comercial" ? d.id : undefined),
            carouselImages: Array.isArray(data.carouselImages) && data.carouselImages.length > 0
              ? data.carouselImages
              : data.commercialDesignData?.slides
              ? data.commercialDesignData.slides.map((s: any) => s.finalRenderUrl || s.baseImageUrl).filter(Boolean)
              : [],
            commercialDesignData: data.commercialDesignData || null,
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
      
      const consolidatedList = consolidateCarouselItems(list);
      setImages(consolidatedList);
    } catch (e: any) {
      console.error("Error loading generated images:", e);
      setError("No pudimos cargar la biblioteca en este momento.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, source: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este elemento de tu biblioteca?")) return;
    try {
      const targetImg = images.find(i => i.id === id);
      const collectionName = source === "upload" ? "user_templates" : "generated_images";
      const idsToDelete = (targetImg?.carouselIds && targetImg.carouselIds.length > 0)
        ? targetImg.carouselIds
        : [id];

      for (const docId of idsToDelete) {
        await deleteDoc(doc(db, collectionName, docId)).catch(() => {});
        await deleteDoc(doc(db, "social_posts", docId)).catch(() => {});
      }

      setImages((prev) => prev.filter((img) => img.id !== id && !idsToDelete.includes(img.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        idsToDelete.forEach(dId => next.delete(dId));
        return next;
      });
      if (selectedImage?.id === id) {
        setSelectedImage(null);
      }
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: images.length };
    STYLE_CATEGORIES.forEach((c) => (counts[c] = 0));
    images.forEach((img) => {
      const cats = getImageCategories(img);
      cats.forEach((c) => {
        counts[c] = (counts[c] || 0) + 1;
      });
    });
    return counts;
  }, [images]);

  const activeCategoriesSorted = useMemo(() => {
    return STYLE_CATEGORIES.filter((c) => (categoryCounts[c] || 0) > 0).sort(
      (a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0)
    );
  }, [categoryCounts]);

  const toggleCategory = (cat: string) => {
    if (cat === "all") {
      setSelectedCategories([]);
      return;
    }
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      if (filterSource !== "all" && img.source !== filterSource) return false;
      if (filterType !== "all" && img.type !== filterType) return false;
      if (!isDateInRange(img.createdAt)) return false;

      // Filtro por estilos visuales seleccionados
      if (selectedCategories.length > 0) {
        const itemCats = getImageCategories(img);
        const hasMatch = selectedCategories.some((sc) => itemCats.includes(sc));
        if (!hasMatch) return false;
      }

      // Búsqueda por texto (prompt, copy, tipo)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchable = `${img.prompt || ""} ${img.copy || ""} ${img.type || ""}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });
  }, [
    images,
    filterSource,
    filterType,
    filterDate,
    customStartDate,
    customEndDate,
    selectedCategories,
    searchQuery,
  ]);

  // Resetear a página 1 al cambiar cualquier filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSource, filterType, filterDate, customStartDate, customEndDate, selectedCategories, searchQuery]);

  const totalItems = filteredImages.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  const paginatedImages = useMemo(() => {
    return filteredImages.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredImages, startIndex]);

  const limit = planLimits[userPlan] || 15;
  const isOverLimit = images.length > limit;

  const toggleSelectImage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllInPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allPageSelected = paginatedImages.length > 0 && paginatedImages.every((img) => next.has(img.id));
      if (allPageSelected) {
        paginatedImages.forEach((img) => next.delete(img.id));
      } else {
        paginatedImages.forEach((img) => next.add(img.id));
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const allFilteredSelected = filteredImages.length > 0 && filteredImages.every((img) => prev.has(img.id));
      if (allFilteredSelected) {
        return new Set();
      } else {
        return new Set(filteredImages.map((img) => img.id));
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const ok = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente ${count === 1 ? "este elemento" : `los ${count} elementos`} seleccionados de tu biblioteca? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    setIsDeletingBatch(true);
    try {
      const toDelete = images.filter((img) => selectedIds.has(img.id));

      await Promise.allSettled(
        toDelete.map(async (img) => {
          const collectionName = img.source === "upload" ? "user_templates" : "generated_images";
          await deleteDoc(doc(db, collectionName, img.id)).catch(() => {});
          await deleteDoc(doc(db, "social_posts", img.id)).catch(() => {});
        })
      );

      setImages((prev) => prev.filter((img) => !selectedIds.has(img.id)));
      setSelectedIds(new Set());
    } catch (e) {
      console.error("Error en eliminación masiva:", e);
      alert("Ocurrió un error al intentar eliminar algunos elementos.");
    } finally {
      setIsDeletingBatch(false);
    }
  };

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

      {/* 2. Barra de Búsqueda y Filtros con Estilos Visuales (Idéntico a Catálogo de Estilos) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        {/* Fila Principal: Buscador y Botón de Estilos Visuales */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en biblioteca por concepto, prompt o texto..."
              className="w-full text-xs font-medium pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] flex items-center justify-center font-bold transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Botón Disparador del Modal/Drawer de Estilos */}
          <button
            type="button"
            onClick={() => setIsStyleFilterModalOpen(true)}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 shadow-2xs ${
              selectedCategories.length === 0
                ? "bg-slate-900 hover:bg-slate-800 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-500/20 shadow-indigo-200"
            }`}
            title="Abrir selector de estilos visuales"
          >
            <span>{selectedCategories.length === 0 ? "⚡" : "🎨"}</span>
            <span className="font-black">
              {selectedCategories.length === 0
                ? "Filtrar Estilos"
                : selectedCategories.length === 1
                ? selectedCategories[0]
                : `${selectedCategories.length} Estilos`}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                selectedCategories.length === 0
                  ? "bg-slate-800 text-slate-300 border border-slate-700"
                  : "bg-indigo-700 text-white"
              }`}
            >
              {selectedCategories.length === 0
                ? activeCategoriesSorted.length
                : selectedCategories.length === 1
                ? categoryCounts[selectedCategories[0]] || 0
                : selectedCategories.length}
            </span>
          </button>
        </div>

        {/* Barra de Filtro Activo si hay categorías seleccionadas */}
        {selectedCategories.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Filtrando por:</span>
              {selectedCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                >
                  <span>{getCategoryIconComponent(cat)}</span>
                  <span>{cat}</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full font-black">
                    {categoryCounts[cat] || 0}
                  </span>
                  <button
                    onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== cat))}
                    className="text-indigo-400 hover:text-indigo-800 font-bold ml-0.5 transition-colors"
                    title={`Remover filtro "${cat}"`}
                  >
                    ✕
                  </button>
                </span>
              ))}
              {selectedCategories.length > 1 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline ml-2 transition-colors"
                  title="Quitar todos los filtros"
                >
                  Limpiar todos
                </button>
              )}
            </div>
            <div className="text-xs font-bold text-slate-400 ml-auto">
              {filteredImages.length} {filteredImages.length === 1 ? "elemento encontrado" : "elementos encontrados"}
            </div>
          </div>
        )}

        {/* Fila Secundaria: Origen y Formato */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
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

      {/* Barra de Acciones Masivas y Selección Rápida */}
      {!loading && filteredImages.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllInPage}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                paginatedImages.length > 0 && paginatedImages.every((img) => selectedIds.has(img.id))
                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <span className="text-xs">
                {paginatedImages.length > 0 && paginatedImages.every((img) => selectedIds.has(img.id)) ? "☑️" : "⬜"}
              </span>
              <span>
                {paginatedImages.length > 0 && paginatedImages.every((img) => selectedIds.has(img.id))
                  ? "Deseleccionar página"
                  : `Seleccionar página (${paginatedImages.length})`}
              </span>
            </button>

            {filteredImages.length > paginatedImages.length && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedIds.size === filteredImages.length
                    ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {selectedIds.size === filteredImages.length
                  ? "Deseleccionar todos"
                  : `Seleccionar los ${filteredImages.length} resultados`}
              </button>
            )}

            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 underline cursor-pointer"
              >
                Limpiar selección
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {selectedIds.size > 0 ? (
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-600">
                  <span className="font-black text-rose-600">{selectedIds.size}</span> seleccionado{selectedIds.size === 1 ? "" : "s"}
                </span>

                <button
                  type="button"
                  onClick={handleBatchDelete}
                  disabled={isDeletingBatch}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-2 shadow-sm shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isDeletingBatch ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar seleccionados ({selectedIds.size})</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <span className="text-[11px] font-bold text-slate-400">
                💡 Haz clic en la casilla de cada imagen para seleccionar y eliminar masivamente
              </span>
            )}
          </div>
        </div>
      )}

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
            Genera nuevas imágenes con nuestros agentes desde el creador de publicaciones o sube tus propios recursos.
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
          {paginatedImages.map((img) => {
            const isSelected = selectedIds.has(img.id);
            return (
              <div
                key={img.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden group flex flex-col relative ${
                  isSelected
                    ? "border-rose-400 ring-2 ring-rose-400/40 shadow-md bg-rose-50/10"
                    : "border-slate-200/80 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setSelectedImage(img)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.prompt || "Diseño"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      if (img.baseImageUrl && e.currentTarget.src !== img.baseImageUrl) {
                        e.currentTarget.src = img.baseImageUrl;
                      }
                    }}
                  />

                  {/* Checkbox de Selección Masiva */}
                  <button
                    type="button"
                    onClick={(e) => toggleSelectImage(img.id, e)}
                    className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-md cursor-pointer ${
                      isSelected
                        ? "bg-rose-600 text-white ring-2 ring-white scale-105"
                        : "bg-black/50 hover:bg-black/75 text-white/80 hover:text-white backdrop-blur-xs border border-white/20 opacity-80 group-hover:opacity-100"
                    }`}
                    title={isSelected ? "Deseleccionar" : "Seleccionar para eliminar"}
                    aria-label={isSelected ? "Deseleccionar imagen" : "Seleccionar imagen"}
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-xs border-2 border-white/80" />
                    )}
                  </button>

                  <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-lg">
                      👁️ Ver Detalle
                    </span>
                  </div>

                  <div className="absolute top-3 left-3 flex gap-1.5 pointer-events-none">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm border ${
                      img.source === "ia" ? "bg-indigo-900/80 text-indigo-100 border-indigo-500/30" : img.source === "upload" ? "bg-amber-900/80 text-amber-100 border-amber-500/30" : "bg-emerald-900/80 text-emerald-100 border-emerald-500/30"
                    }`}>
                      {img.source === "ia" ? "✨ Agentes" : img.source === "upload" ? "📥 Subido" : "🎨 Editor"}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/60 text-white backdrop-blur-md border border-white/10 flex items-center gap-1">
                      {img.type === "Carrusel" ? `📚 Carrusel (${img.carouselImages?.length || 5} diapositivas)` : img.type}
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

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100/80">
                  {img.type === 'Carrusel' && img.carouselImages && img.carouselImages.length > 1 ? (
                    <Link
                      href={`/automatizacion-rrss/panel/crear?postType=Carrusel&carouselUrls=${encodeURIComponent(JSON.stringify(img.carouselImages))}&hideAI=true`}
                      className="py-2 px-2 text-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                    >
                      <span>🚀</span> Postear
                    </Link>
                  ) : (
                    <Link
                      href={`/automatizacion-rrss/panel/crear?templateUrl=${encodeURIComponent(img.url)}&hideAI=true`}
                      className="py-2 px-2 text-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                    >
                      <span>🚀</span> Postear
                    </Link>
                  )}

                  <Link
                    href={`/automatizacion-rrss/panel/crear?templateUrl=${encodeURIComponent(img.url)}&openEditor=true`}
                    className="py-2 px-2 text-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                  >
                    <span>🎨</span> Editar
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
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
              ) : selectedImage.carouselImages && selectedImage.carouselImages.length > 1 ? (
                <div className="relative w-full flex flex-col items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage.carouselImages[carouselPreviewIndex] || selectedImage.url}
                    alt={`${selectedImage.prompt || "Diseño"} - Slide ${carouselPreviewIndex + 1}`}
                    className="w-full h-auto object-contain max-h-[75vh] rounded-2xl shadow-lg transition-all duration-300"
                    onError={(e) => {
                      if (selectedImage.baseImageUrl && e.currentTarget.src !== selectedImage.baseImageUrl) {
                        e.currentTarget.src = selectedImage.baseImageUrl;
                      }
                    }}
                  />

                  {/* Flechas de navegación para el lote de carrusel */}
                  {carouselPreviewIndex > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCarouselPreviewIndex((prev) => Math.max(0, prev - 1));
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xl backdrop-blur-xs transition-transform hover:scale-110"
                      title="Diapositiva anterior"
                    >
                      ←
                    </button>
                  )}

                  {carouselPreviewIndex < selectedImage.carouselImages.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCarouselPreviewIndex((prev) => Math.min(selectedImage.carouselImages!.length - 1, prev + 1));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xl backdrop-blur-xs transition-transform hover:scale-110"
                      title="Siguiente diapositiva"
                    >
                      →
                    </button>
                  )}

                  {/* Selector / Indicador de diapositivas del carrusel */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4 bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl max-w-full overflow-x-auto">
                    {selectedImage.carouselImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCarouselPreviewIndex(idx);
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded-xl transition-all border cursor-pointer ${
                          carouselPreviewIndex === idx
                            ? "bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/40 scale-105"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/15 hover:border-white/20"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Slide ${idx + 1}`}
                          className="w-7 h-7 rounded-lg object-cover shrink-0"
                        />
                        <span className="text-[10px] font-black pr-1">
                          Slide {idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt || "Diseño"}
                  className="w-full h-auto object-contain max-h-[85vh] rounded-2xl"
                  onError={(e) => {
                    if (selectedImage.baseImageUrl && e.currentTarget.src !== selectedImage.baseImageUrl) {
                      e.currentTarget.src = selectedImage.baseImageUrl;
                    }
                  }}
                />
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
                    ? "🎬 Creado con Remotion"
                    : selectedImage.source === "ia"
                    ? "✨ Creado por Agentes"
                    : selectedImage.source === "upload"
                    ? "📥 Subido por Usuario"
                    : "🎨 Editor"}
                </span>
                <button onClick={() => setSelectedImage(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors w-8 h-8 flex items-center justify-center font-bold">
                  ✕
                </button>
              </div>
              
              <h4 className="font-black text-slate-900 text-base mb-4 flex items-center gap-2">
                {selectedImage.type === 'Carrusel' ? `📚 Formato: Carrusel (${selectedImage.carouselImages?.length || 5} diapositivas)`
                  : selectedImage.type === 'Post'
                  ? '📱 Formato: Post'
                  : selectedImage.type === 'Historia'
                  ? '⏱️ Formato: Historia'
                  : '🎬 Formato: Video/Reel'}
              </h4>
              
              {(() => {
                const currentSlidePrompt = (selectedImage.carouselPrompts && selectedImage.carouselPrompts[carouselPreviewIndex]) || selectedImage.prompt;
                if (!currentSlidePrompt && !selectedImage.prompt) return null;
                const isMultiCarousel = Boolean(selectedImage.carouselImages && selectedImage.carouselImages.length > 1);

                return (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 mb-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-black text-[10px] uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
                        <span>✨</span> {isMultiCarousel
                          ? `CONCEPTO DE DIAPOSITIVA ${carouselPreviewIndex + 1} DE ${selectedImage.carouselImages!.length}:`
                          : "CONCEPTO / PROMPT ORIGINAL:"}
                      </p>
                      {isMultiCarousel && (
                        <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black">
                          Slide {carouselPreviewIndex + 1}/{selectedImage.carouselImages!.length}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold italic text-slate-700 leading-relaxed">
                      "{currentSlidePrompt || selectedImage.prompt}"
                    </p>
                  </div>
                );
              })()}

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
              
              <div className="flex flex-col gap-2.5 mt-auto pt-4 border-t border-slate-100">
                {selectedImage.type === 'Carrusel' && selectedImage.carouselImages && selectedImage.carouselImages.length > 1 ? (
                  <Link
                    href={`/automatizacion-rrss/panel/crear?postType=Carrusel&carouselUrls=${encodeURIComponent(JSON.stringify(selectedImage.carouselImages))}&hideAI=true`}
                    className="py-3.5 px-4 text-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <span>🚀</span> POSTEAR CARRUSEL COMPLETO ({selectedImage.carouselImages.length} LÁMINAS)
                  </Link>
                ) : (
                  <Link
                    href={`/automatizacion-rrss/panel/crear?templateUrl=${encodeURIComponent(selectedImage.url)}&hideAI=true`}
                    className="py-3.5 px-4 text-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <span>🚀</span> POSTEAR
                  </Link>
                )}

                {/* Botón Editar Lámina / Imagen */}
                <Link
                  href={`/automatizacion-rrss/panel/crear?templateUrl=${encodeURIComponent(
                    (selectedImage.carouselImages && selectedImage.carouselImages[carouselPreviewIndex]) || selectedImage.url
                  )}&openEditor=true`}
                  className="py-3 px-4 text-center rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <span>🎨</span> {selectedImage.carouselImages && selectedImage.carouselImages.length > 1
                    ? `EDITAR ESTA LÁMINA (SLIDE ${carouselPreviewIndex + 1})`
                    : "EDITAR EN EDITOR VISUAL"}
                </Link>

                {selectedImage.hasRemotionScenes ? (
                  <Link
                    href={`/automatizacion-rrss/panel/poc-video?idea=${encodeURIComponent(selectedImage.prompt || '')}`}
                    className="py-3 px-4 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <span>🎬</span> EDITAR DISEÑO EN REMOTION
                  </Link>
                ) : selectedImage.commercialDesignId ? (
                  <Link
                    href={`/automatizacion-rrss/panel/imagen-comercial?editId=${encodeURIComponent(selectedImage.commercialDesignId)}`}
                    className="py-3 px-4 text-center rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <span>📐</span> EDITAR CARTEL EN IMAGEN COMERCIAL
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL / DRAWER DE ESTILOS VISUALES
          ========================================================= */}
      {isStyleFilterModalOpen && (
        <div 
          className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsStyleFilterModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-xl rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 flex flex-col"
          >
            {/* Cabecera del Drawer/Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🎨</span> Seleccionar Estilos Visuales
                </h3>
                <p className="text-slate-500 text-xs mt-0.5 font-medium">
                  Puedes seleccionar uno o varios estilos para filtrar simultáneamente
                </p>
              </div>
              <button 
                onClick={() => setIsStyleFilterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition-colors"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Grid táctil de estilos con selección múltiple */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1 flex-1">
              {/* Opción 'Todos los Estilos' */}
              <button
                type="button"
                onClick={() => toggleCategory("all")}
                className={`p-3.5 rounded-2xl text-left transition-all flex items-center justify-between group border ${
                  selectedCategories.length === 0
                    ? "border-indigo-500 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-500/30"
                    : "border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-xs ${
                    selectedCategories.length === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}>
                    ✨
                  </span>
                  <div>
                    <div className={`text-xs font-black ${
                      selectedCategories.length === 0 ? "text-indigo-950" : "text-slate-900 group-hover:text-indigo-600"
                    }`}>
                      Todos los Estilos
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Ver biblioteca completa
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    selectedCategories.length === 0 ? "bg-indigo-200 text-indigo-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {categoryCounts.all || 0}
                  </span>
                  {selectedCategories.length === 0 && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
              </button>

              {/* Categorías con elementos activos (> 0) */}
              {activeCategoriesSorted.map(cat => {
                const count = categoryCounts[cat] || 0;
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`p-3.5 rounded-2xl text-left transition-all flex items-center justify-between group border ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-500/30"
                        : "border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-xs ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        {getCategoryIconComponent(cat)}
                      </span>
                      <div className="truncate">
                        <div className={`text-xs font-bold truncate ${
                          isSelected ? "text-indigo-950 font-black" : "text-slate-900 group-hover:text-indigo-600"
                        }`}>
                          {cat}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium truncate">
                          {getCategorySubtitle(cat)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? "bg-indigo-200 text-indigo-800 font-black" : "bg-slate-100 text-slate-600"
                      }`}>
                        {count}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer sticky con botón de aplicar y limpiar */}
            <div className="pt-4 mt-3 border-t border-slate-100 sticky bottom-0 bg-white/95 backdrop-blur-xs flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-medium">
                {selectedCategories.length === 0 ? (
                  <span className="text-slate-400">Mostrando todos los estilos</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedCategories([])}
                    className="text-indigo-600 hover:text-indigo-800 font-bold underline transition-colors"
                  >
                    Limpiar selección ({selectedCategories.length})
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsStyleFilterModalOpen(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
              >
                <span>Ver {filteredImages.length} {filteredImages.length === 1 ? "elemento" : "elementos"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Barra Flotante Sticky de Acciones Masivas */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-200 max-w-xl w-[92%] sm:w-auto">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-xs font-black">
              {selectedIds.size}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-100">
              {selectedIds.size === 1 ? "1 elemento seleccionado" : `${selectedIds.size} elementos seleccionados`}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-xs text-slate-300 hover:text-white underline font-semibold cursor-pointer"
            >
              {selectedIds.size === filteredImages.length
                ? "Deseleccionar todos"
                : `Seleccionar todos (${filteredImages.length})`}
            </button>

            <button
              type="button"
              onClick={handleBatchDelete}
              disabled={isDeletingBatch}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isDeletingBatch ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar ({selectedIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
