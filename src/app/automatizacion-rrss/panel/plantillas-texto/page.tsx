"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  TextTemplate,
  TEXT_TEMPLATE_CATEGORIES,
  DEFAULT_TEXT_TEMPLATES,
  formatTemplateText,
  TypographyStyle,
  LayoutPosition,
  IngredientItem,
} from "../../../../lib/text-templates";
import { useProfile } from "../../../../contexts/ProfileContext";
import { 
  Search, 
  X, 
  Check, 
  Layers, 
  Utensils, 
  Tag, 
  Rocket, 
  Zap, 
  ShoppingBag, 
  Sparkles, 
  ChefHat, 
  LayoutTemplate 
} from "lucide-react";

export interface LibraryPhotoItem {
  id: string;
  url: string;
  title: string;
  price?: string;
  source: "catalogo" | "biblioteca" | "subida";
}

export default function PlantillasTextoPage() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [templates, setTemplates] = useState<TextTemplate[]>(DEFAULT_TEXT_TEMPLATES);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isStyleFilterModalOpen, setIsStyleFilterModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Estados para modal de prueba con foto real
  const [testingTemplate, setTestingTemplate] = useState<TextTemplate | null>(null);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any | null>(null);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>("");
  const [libraryPhotos, setLibraryPhotos] = useState<LibraryPhotoItem[]>([]);
  const [photoSourceTab, setPhotoSourceTab] = useState<"catalog" | "upload" | "url">("catalog");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [testProductName, setTestProductName] = useState<string>("");
  const [testPrice, setTestPrice] = useState<string>("");
  const [testIngredients, setTestIngredients] = useState<IngredientItem[]>([]);
  const [testSecondaryScript, setTestSecondaryScript] = useState<string>("");
  const [isSuggestingIngredients, setIsSuggestingIngredients] = useState<boolean>(false);
  const [newIngredientName, setNewIngredientName] = useState<string>("");
  const [newIngredientAmount, setNewIngredientAmount] = useState<string>("");
  const [newIngredientIcon, setNewIngredientIcon] = useState<string>("🥗");
  const [isDecidingArtDirection, setIsDecidingArtDirection] = useState<boolean>(false);
  const [artDirectionReasoning, setArtDirectionReasoning] = useState<string | null>(null);

  // Estados para modal de crear / editar plantilla
  const [editingTemplate, setEditingTemplate] = useState<TextTemplate | null>(null);
  const [isNewTemplate, setIsNewTemplate] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>("");
  const [formCategory, setFormCategory] = useState<any>("Promociones & Combos");
  const [formLayoutPosition, setFormLayoutPosition] = useState<LayoutPosition>("top_banner");
  const [formSecondaryScript, setFormSecondaryScript] = useState<string>("");
  const [formIngredients, setFormIngredients] = useState<IngredientItem[]>([]);
  const [formDescription, setFormDescription] = useState<string>("");
  const [formBadgeText, setFormBadgeText] = useState<string>("");
  const [formBadgeBgColor, setFormBadgeBgColor] = useState<string>("#fbbf24");
  const [formBadgeTextColor, setFormBadgeTextColor] = useState<string>("#0f172a");
  const [formHeadlinePattern, setFormHeadlinePattern] = useState<string>("{PRODUCTO}");
  const [formHeadlineFont, setFormHeadlineFont] = useState<TypographyStyle>("bold_modern");
  const [formHeadlineColor, setFormHeadlineColor] = useState<string>("#ffffff");
  const [formSubheadlinePattern, setFormSubheadlinePattern] = useState<string>("");
  const [formPriceBadgePattern, setFormPriceBadgePattern] = useState<string>("{PRECIO}");
  const [formPriceBgColor, setFormPriceBgColor] = useState<string>("#fbbf24");
  const [formPriceTextColor, setFormPriceTextColor] = useState<string>("#0f172a");
  const [formCtaText, setFormCtaText] = useState<string>("¡ORDENA AHORA!");
  const [formCtaBgColor, setFormCtaBgColor] = useState<string>("#fbbf24");
  const [formCtaTextColor, setFormCtaTextColor] = useState<string>("#0f172a");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u);
      if (u) {
        await loadTemplates(u.uid);
        await loadCatalogAndLibrary(u.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const loadTemplates = async (userId: string) => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "text_templates"));
      const userTemplates: TextTemplate[] = [];
      snap.forEach((d) => {
        const data = d.data() as TextTemplate;
        userTemplates.push({ ...data, id: d.id });
      });

      // Si hay plantillas en BD, combinar con las predeterminadas
      if (userTemplates.length > 0) {
        const merged = [...userTemplates];
        DEFAULT_TEXT_TEMPLATES.forEach((def) => {
          if (!merged.some((m) => m.id === def.id)) {
            merged.push(def);
          }
        });
        setTemplates(merged);
      } else {
        setTemplates(DEFAULT_TEXT_TEMPLATES);
      }
    } catch (err) {
      console.warn("No se pudo cargar text_templates de Firestore, usando defaults:", err);
      setTemplates(DEFAULT_TEXT_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogAndLibrary = async (userId: string) => {
    try {
      // 1. Cargar productos/servicios desde 'catalogo' (con fallback a 'catalog')
      let snapCatalogo = await getDocs(collection(db, "users", userId, "catalogo"));
      if (snapCatalogo.empty) {
        snapCatalogo = await getDocs(collection(db, "users", userId, "catalog"));
      }

      const items: any[] = [];
      const photos: LibraryPhotoItem[] = [];
      const seenUrls = new Set<string>();

      snapCatalogo.forEach((d) => {
        const item = d.data();
        if (item.name) {
          const itemObj = { id: d.id, ...item };
          items.push(itemObj);
          if (
            item.imageUrl &&
            typeof item.imageUrl === "string" &&
            item.imageUrl.startsWith("http") &&
            !seenUrls.has(item.imageUrl)
          ) {
            seenUrls.add(item.imageUrl);
            photos.push({
              id: `cat-${d.id}`,
              url: item.imageUrl,
              title: item.name,
              price: item.price || item.offerPrice || "",
              source: "catalogo",
            });
          }
        }
      });
      setCatalogItems(items);

      // 2. Cargar fotos previas de la biblioteca y plantillas del usuario
      try {
        const [genSnap, tplSnap] = await Promise.all([
          getDocs(query(collection(db, "generated_images"), where("userId", "==", userId))),
          getDocs(query(collection(db, "user_templates"), where("userId", "==", userId))),
        ]);

        genSnap.forEach((d) => {
          const data = d.data();
          if (
            data.url &&
            typeof data.url === "string" &&
            data.url.startsWith("http") &&
            !seenUrls.has(data.url)
          ) {
            seenUrls.add(data.url);
            photos.push({
              id: `gen-${d.id}`,
              url: data.url,
              title: data.prompt || data.text || "Foto Generada",
              price: "",
              source: "biblioteca",
            });
          }
        });

        tplSnap.forEach((d) => {
          const data = d.data();
          if (
            data.url &&
            typeof data.url === "string" &&
            data.url.startsWith("http") &&
            !seenUrls.has(data.url)
          ) {
            seenUrls.add(data.url);
            photos.push({
              id: `tpl-${d.id}`,
              url: data.url,
              title: data.name || "Foto Guardada",
              price: "",
              source: "biblioteca",
            });
          }
        });
      } catch (bibErr) {
        console.warn("Aviso: no se pudieron cargar todas las fotos de biblioteca:", bibErr);
      }

      setLibraryPhotos(photos);

      if (items.length > 0) {
        const firstWithPhoto = items.find((it) => it.imageUrl?.startsWith("http")) || items[0];
        setSelectedCatalogItem(firstWithPhoto);
        setTestProductName(firstWithPhoto.name || "");
        setTestPrice(firstWithPhoto.price || firstWithPhoto.offerPrice || "");
        if (firstWithPhoto.imageUrl) setCustomPhotoUrl(firstWithPhoto.imageUrl);
      } else if (photos.length > 0) {
        setCustomPhotoUrl(photos[0].url);
        if (photos[0].title) setTestProductName(photos[0].title);
        if (photos[0].price) setTestPrice(photos[0].price);
      }
    } catch (err) {
      console.warn("Error cargando catálogo y biblioteca para pruebas de plantilla:", err);
    }
  };

  // Conteos dinámicos por categoría
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    templates.forEach((t) => {
      if (t.category) {
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
    });
    return counts;
  }, [templates]);

  // Lista de categorías únicas (excluyendo "Todas") ordenadas por cantidad de plantillas desc
  const activeCategoriesSorted = useMemo(() => {
    const rawCategories = TEXT_TEMPLATE_CATEGORIES.filter((c) => c !== "Todas");
    return rawCategories
      .filter((c) => (categoryCounts[c] || 0) > 0)
      .sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0));
  }, [categoryCounts]);

  const toggleCategory = (cat: string) => {
    if (cat === "all") {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const getCategoryIconComponent = (cat: string) => {
    switch (cat) {
      case "Split Lateral":
        return <Layers className="w-4 h-4 text-indigo-500" />;
      case "Recetas & Ingredientes":
        return <Utensils className="w-4 h-4 text-emerald-500" />;
      case "Promociones & Combos":
        return <Tag className="w-4 h-4 text-amber-500" />;
      case "Lanzamientos":
        return <Rocket className="w-4 h-4 text-purple-500" />;
      case "Ofertas Flash":
        return <Zap className="w-4 h-4 text-rose-500" />;
      case "Delivery":
        return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case "Lifestyle & Marca":
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case "Gourmet & Menú":
        return <ChefHat className="w-4 h-4 text-orange-500" />;
      default:
        return <LayoutTemplate className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategorySubtitle = (cat: string) => {
    switch (cat) {
      case "Split Lateral":
        return "Texto lateral y producto libre";
      case "Recetas & Ingredientes":
        return "Ingredientes y cantidades";
      case "Promociones & Combos":
        return "Precios y combos de impacto";
      case "Lanzamientos":
        return "Nuevos platos y productos";
      case "Ofertas Flash":
        return "Descuentos por tiempo limitado";
      case "Delivery":
        return "A domicilio y packaging";
      case "Lifestyle & Marca":
        return "Branding y fotos editoriales";
      case "Gourmet & Menú":
        return "Carta editorial y alta cocina";
      default:
        return "Diseño comercial para venta";
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(t.category);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.headlinePattern.toLowerCase().includes(q) ||
        t.badgeText.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategories, searchQuery]);

  // Abrir modal de prueba con foto
  const handleOpenTestModal = (template: TextTemplate) => {
    setTestingTemplate(template);
    setArtDirectionReasoning(null);
    setTestIngredients(template.ingredients ? [...template.ingredients] : []);
    setTestSecondaryScript(template.secondaryScriptPattern || "");
    setUploadError(null);
    if (catalogItems.length > 0) {
      const firstWithPhoto = catalogItems.find((it) => it.imageUrl?.startsWith("http")) || catalogItems[0];
      setSelectedCatalogItem(firstWithPhoto);
      setTestProductName(firstWithPhoto.name || "Hamburguesa Doble Queso");
      setTestPrice(firstWithPhoto.price || "$24.900");
      setCustomPhotoUrl(firstWithPhoto.imageUrl || template.previewSampleImage || "");
    } else if (libraryPhotos.length > 0) {
      const first = libraryPhotos[0];
      setCustomPhotoUrl(first.url);
      setTestProductName(first.title || "Hamburguesa Doble Queso");
      setTestPrice(first.price || "$24.900");
    } else {
      setTestProductName("Hamburguesa Doble Queso");
      setTestPrice("$24.900");
      setCustomPhotoUrl(template.previewSampleImage || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80");
    }
  };

  // Decisión inteligente y dirección de arte automática por nuestros agentes
  const handleAutoArtDirection = async () => {
    setIsDecidingArtDirection(true);
    try {
      const res = await fetch("/api/laboratorio/analizar-direccion-arte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: customPhotoUrl || testingTemplate?.previewSampleImage,
          productName: testProductName.trim() || "Plato Principal",
          price: testPrice.trim(),
          rubro: activeProfile?.businessType || "Gastronomía",
        }),
      });
      const data = await res.json();
      if (data.success && data.decision) {
        const { decision } = data;
        setArtDirectionReasoning(decision.reasoning);
        if (decision.kickerText) {
          setTestSecondaryScript(decision.kickerText);
        }
        if (Array.isArray(decision.ingredients) && decision.ingredients.length > 0) {
          setTestIngredients(decision.ingredients);
        }
        const rec = templates.find((t) => t.id === decision.templateId) || decision.template;
        if (rec) {
          setTestingTemplate(rec);
        }
      }
    } catch (err) {
      console.error("Error en dirección de arte automática:", err);
    } finally {
      setIsDecidingArtDirection(false);
    }
  };

  // Sugerir ingredientes con nuestros agentes especializados
  const handleSuggestIngredients = async () => {
    if (!testProductName.trim()) return;
    setIsSuggestingIngredients(true);
    try {
      const res = await fetch("/api/laboratorio/sugerir-ingredientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: testProductName.trim(),
          rubro: activeProfile?.businessType || "Gastronomía",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.ingredients) && data.ingredients.length > 0) {
          setTestIngredients(data.ingredients);
        }
      }
    } catch (err) {
      console.error("Error sugiriendo ingredientes con nuestros agentes:", err);
    } finally {
      setIsSuggestingIngredients(false);
    }
  };

  const handleAddIngredient = () => {
    if (!newIngredientName.trim()) return;
    setTestIngredients((prev) => [
      ...prev,
      {
        icon: newIngredientIcon || "🥗",
        name: newIngredientName.trim(),
        amount: newIngredientAmount.trim() || undefined,
      },
    ]);
    setNewIngredientName("");
    setNewIngredientAmount("");
  };

  const handleRemoveIngredient = (idx: number) => {
    setTestIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSelectCatalogItem = (itemId: string) => {
    const item = catalogItems.find((c) => c.id === itemId);
    if (item) {
      setSelectedCatalogItem(item);
      setTestProductName(item.name || "");
      setTestPrice(item.price || item.offerPrice || "");
      if (item.imageUrl) setCustomPhotoUrl(item.imageUrl);
    }
  };

  const handleSelectPhoto = (photo: LibraryPhotoItem) => {
    setCustomPhotoUrl(photo.url);
    if (photo.title && photo.source === "catalogo") {
      setTestProductName(photo.title);
      if (photo.price) setTestPrice(photo.price);
      const matched = catalogItems.find(
        (it) => it.name === photo.title || it.imageUrl === photo.url
      );
      if (matched) setSelectedCatalogItem(matched);
    }
  };

  const handleUploadNewPhoto = async (file: File) => {
    if (!file) return;
    if (!currentUser?.uid) {
      setUploadError("Debes iniciar sesión para subir fotos.");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setUploadError("Formato no compatible. Por favor sube una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("La imagen supera el límite de 10 MB.");
      return;
    }

    setIsUploadingPhoto(true);
    setUploadError(null);

    try {
      let downloadUrl = "";
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storageRef = ref(
          storage,
          `users/${currentUser.uid}/plantillas_bg/${Date.now()}_${safeName}`
        );
        await uploadBytes(storageRef, file, { contentType: file.type });
        downloadUrl = await getDownloadURL(storageRef);
      } catch (clientStorageErr: any) {
        console.warn("Storage client fallback a upload-image API:", clientStorageErr);
        const token = await currentUser.getIdToken();
        const fd = new FormData();
        fd.append("file", file);
        fd.append("profileId", activeProfile?.id || "default");
        const res = await fetch("/api/catalogo/upload-image", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || "Error al subir la imagen");
        downloadUrl = data.url;
      }

      if (downloadUrl) {
        setCustomPhotoUrl(downloadUrl);
        const newPhotoItem: LibraryPhotoItem = {
          id: `upload-${Date.now()}`,
          url: downloadUrl,
          title: file.name.replace(/\.[^/.]+$/, ""),
          price: "",
          source: "subida",
        };
        setLibraryPhotos((prev) => [newPhotoItem, ...prev]);
      }
    } catch (err: any) {
      console.error("Error subiendo foto:", err);
      setUploadError(err.message || "Error al subir la foto.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Redirigir a crear post con esta plantilla
  const handleUseInPost = (template: TextTemplate, withPhotoUrl?: string, productName?: string, price?: string) => {
    const query = new URLSearchParams({
      textTemplateId: template.id,
      textTemplateName: template.name,
      fontStyle: template.headlineFont,
      badgeText: template.badgeText,
      ...(template.layoutPosition ? { layoutPosition: template.layoutPosition } : {}),
      ...(withPhotoUrl ? { baseImageUrl: withPhotoUrl } : {}),
      ...(productName ? { productName } : {}),
      ...(price ? { price } : {}),
    });
    router.push(`/automatizacion-rrss/panel/crear?${query.toString()}`);
  };

  // Abrir modal de edición / creación
  const handleOpenEdit = (template?: TextTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setIsNewTemplate(false);
      setFormName(template.name);
      setFormCategory(template.category);
      setFormLayoutPosition(template.layoutPosition || "top_banner");
      setFormSecondaryScript(template.secondaryScriptPattern || "");
      setFormIngredients(template.ingredients ? [...template.ingredients] : []);
      setFormDescription(template.description);
      setFormBadgeText(template.badgeText);
      setFormBadgeBgColor(template.badgeBgColor);
      setFormBadgeTextColor(template.badgeTextColor);
      setFormHeadlinePattern(template.headlinePattern);
      setFormHeadlineFont(template.headlineFont);
      setFormHeadlineColor(template.headlineColor);
      setFormSubheadlinePattern(template.subheadlinePattern);
      setFormPriceBadgePattern(template.priceBadgePattern || "{PRECIO}");
      setFormPriceBgColor(template.priceBgColor || "#fbbf24");
      setFormPriceTextColor(template.priceTextColor || "#0f172a");
      setFormCtaText(template.ctaText);
      setFormCtaBgColor(template.ctaBgColor);
      setFormCtaTextColor(template.ctaTextColor);
    } else {
      setEditingTemplate(null);
      setIsNewTemplate(true);
      setFormName("Nueva Plantilla Publicitaria");
      setFormCategory("Promociones & Combos");
      setFormLayoutPosition("top_banner");
      setFormSecondaryScript("");
      setFormIngredients([]);
      setFormDescription("Plantilla personalizada con textos y badges a medida");
      setFormBadgeText("⭐ DESTACADO DE LA SEMANA");
      setFormBadgeBgColor("#fbbf24");
      setFormBadgeTextColor("#0f172a");
      setFormHeadlinePattern("{PRODUCTO}");
      setFormHeadlineFont("bold_modern");
      setFormHeadlineColor("#ffffff");
      setFormSubheadlinePattern("Calidad garantizada y preparación en el momento");
      setFormPriceBadgePattern("{PRECIO}");
      setFormPriceBgColor("#fbbf24");
      setFormPriceTextColor("#0f172a");
      setFormCtaText("¡ORDENA AHORA!");
      setFormCtaBgColor("#fbbf24");
      setFormCtaTextColor("#0f172a");
    }
  };

  const handleSaveTemplate = async () => {
    if (!formName.trim()) {
      alert("Por favor ingresa un nombre para la plantilla.");
      return;
    }
    setIsSaving(true);
    try {
      const templateId = isNewTemplate
        ? `tpl-custom-${Date.now()}`
        : editingTemplate?.id || `tpl-${Date.now()}`;

      const updatedData: TextTemplate = {
        id: templateId,
        name: formName.trim(),
        description: formDescription.trim(),
        category: formCategory,
        layoutPosition: formLayoutPosition,
        secondaryScriptPattern: formSecondaryScript.trim(),
        ingredients: formIngredients,
        badgeText: formBadgeText.trim(),
        badgeBgColor: formBadgeBgColor,
        badgeTextColor: formBadgeTextColor,
        headlinePattern: formHeadlinePattern.trim(),
        headlineFont: formHeadlineFont,
        headlineColor: formHeadlineColor,
        subheadlinePattern: formSubheadlinePattern.trim(),
        priceBadgePattern: formPriceBadgePattern.trim(),
        priceBgColor: formPriceBgColor,
        priceTextColor: formPriceTextColor,
        ctaText: formCtaText.trim(),
        ctaBgColor: formCtaBgColor,
        ctaTextColor: formCtaTextColor,
        previewSampleImage: editingTemplate?.previewSampleImage || DEFAULT_TEXT_TEMPLATES[0].previewSampleImage,
        isDefault: false,
      };

      await setDoc(doc(db, "text_templates", templateId), updatedData, { merge: true });

      setTemplates((prev) => {
        const filtered = prev.filter((t) => t.id !== templateId);
        return [updatedData, ...filtered];
      });

      setEditingTemplate(null);
      setIsNewTemplate(false);
    } catch (err: any) {
      console.error("Error guardando plantilla:", err);
      alert("Error al guardar la plantilla: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomTemplate = async (templateId: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta plantilla personalizada?")) return;
    try {
      await deleteDoc(doc(db, "text_templates", templateId));
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (err: any) {
      console.error("Error eliminando plantilla:", err);
      alert("Error al eliminar: " + err.message);
    }
  };

  // Renderizador unificado para carteles (Split Lateral, Receta con Ingredientes, Cabecera Superior)
  const renderCanvasPoster = ({
    template,
    title,
    sub,
    price,
    secondaryScript,
    ingredients,
    photoUrl,
    isModal = false,
  }: {
    template: TextTemplate;
    title: string;
    sub: string;
    price?: string;
    secondaryScript?: string;
    ingredients?: IngredientItem[];
    photoUrl: string;
    isModal?: boolean;
  }) => {
    const layout = template.layoutPosition || "top_banner";
    const effectiveIngredients = ingredients || template.ingredients || [];
    const scriptText = secondaryScript || template.secondaryScriptPattern;

    return (
      <div
        className={`relative aspect-square w-full overflow-hidden bg-slate-950 flex items-center justify-center select-none ${
          isModal ? "rounded-2xl shadow-2xl border border-slate-800" : ""
        }`}
      >
        {/* Imagen de Fondo */}
        <img
          src={photoUrl || template.previewSampleImage || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80"}
          alt={template.name}
          className={`absolute inset-0 w-full h-full object-cover ${
            !isModal ? "group-hover:scale-105 transition-transform duration-500" : ""
          } opacity-90`}
        />

        {/* ═══ 1. SPLIT LATERAL (Texto al costado izquierdo, plato a la derecha) ═══ */}
        {layout === "split_left" && (
          <>
            <div className="absolute inset-y-0 left-0 w-[65%] bg-gradient-to-r from-black/95 via-black/80 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-[25%] bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />

            {template.badgeText && (
              <div className={`absolute ${isModal ? "top-4 right-4" : "top-3 right-3"} z-20`}>
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg border border-white/20"
                  style={{
                    backgroundColor: template.badgeBgColor,
                    color: template.badgeTextColor,
                  }}
                >
                  {template.badgeText}
                </span>
              </div>
            )}

            <div
              className={`absolute inset-y-0 left-0 w-[55%] ${
                isModal ? "p-5" : "p-3.5"
              } flex flex-col justify-center text-left z-20 pointer-events-none space-y-1.5`}
            >
              {scriptText && (
                <span className={`font-serif italic text-amber-300 ${isModal ? "text-sm" : "text-xs"} drop-shadow leading-tight`}>
                  {scriptText}
                </span>
              )}

              <h3
                className={`font-black leading-tight drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] ${
                  template.headlineFont === "script_handwritten"
                    ? isModal ? "font-serif italic text-2xl" : "font-serif italic text-xl"
                    : template.headlineFont === "elegant_serif"
                    ? isModal ? "font-serif text-xl" : "font-serif text-lg tracking-wide"
                    : template.headlineFont === "serif_script_mix"
                    ? isModal ? "font-serif text-2xl uppercase tracking-tight" : "font-serif text-lg uppercase tracking-tight"
                    : template.headlineFont === "bold_textured"
                    ? isModal ? "font-black uppercase text-2xl tracking-tighter" : "font-black uppercase text-lg tracking-tighter"
                    : isModal ? "font-sans uppercase text-2xl tracking-tight" : "font-sans uppercase text-lg tracking-tight"
                }`}
                style={{ color: template.headlineColor }}
              >
                {title}
              </h3>

              {sub && (
                <p className={`text-white/85 ${isModal ? "text-xs" : "text-[10px]"} font-medium leading-snug drop-shadow line-clamp-2`}>
                  {sub}
                </p>
              )}

              {price && (
                <div className="pt-1">
                  <span
                    className="px-2.5 py-0.5 rounded-md text-xs font-black tracking-wide shadow"
                    style={{
                      backgroundColor: template.priceBgColor || "#fbbf24",
                      color: template.priceTextColor || "#0f172a",
                    }}
                  >
                    {price}
                  </span>
                </div>
              )}

              <div className="pt-2">
                <div
                  className="inline-block px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase shadow-md truncate max-w-[140px] text-center"
                  style={{
                    backgroundColor: template.ctaBgColor,
                    color: template.ctaTextColor,
                  }}
                >
                  {template.ctaText}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ 2. RECETA CON INGREDIENTES (Cabecera + Plato al centro + Tira de ingredientes con iconos) ═══ */}
        {layout === "recipe_ingredients" && (
          <>
            <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-black/90 via-black/60 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/95 via-black/85 to-transparent pointer-events-none z-10" />

            <div className={`absolute inset-x-0 top-0 ${isModal ? "p-4" : "p-3"} text-center z-20 pointer-events-none space-y-1`}>
              <div className="flex justify-center mb-0.5">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md border border-white/10"
                  style={{
                    backgroundColor: template.badgeBgColor,
                    color: template.badgeTextColor,
                  }}
                >
                  {template.badgeText}
                </span>
              </div>

              <h3
                className={`font-black leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-center px-1 ${
                  template.headlineFont === "elegant_serif"
                    ? isModal ? "font-serif text-xl tracking-wide" : "font-serif text-lg tracking-wide"
                    : isModal ? "font-sans uppercase text-xl" : "font-sans uppercase text-lg"
                }`}
                style={{ color: template.headlineColor }}
              >
                {title}
              </h3>

              {sub && (
                <p className={`font-serif italic text-amber-200/90 ${isModal ? "text-xs" : "text-[10px]"} leading-tight drop-shadow`}>
                  {sub}
                </p>
              )}
            </div>

            <div className={`absolute inset-x-0 bottom-0 ${isModal ? "p-3.5" : "p-2.5"} text-center z-20 pointer-events-none space-y-1.5`}>
              {effectiveIngredients.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 px-1 py-1 overflow-x-auto no-scrollbar">
                  {effectiveIngredients.slice(0, 5).map((ing, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[50px] shadow-sm text-center"
                    >
                      <span className="text-sm leading-none mb-0.5">{ing.icon || "🥗"}</span>
                      <span className="text-[9px] font-bold text-white truncate max-w-[54px] leading-tight">
                        {ing.name}
                      </span>
                      <span className="text-[8px] text-amber-300 font-medium truncate max-w-[54px] leading-tight">
                        {ing.amount || ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {scriptText ? (
                <p className={`font-serif italic text-white/90 ${isModal ? "text-xs" : "text-[11px]"} drop-shadow leading-tight`}>
                  {scriptText}
                </p>
              ) : (
                <div className="flex justify-center pt-0.5">
                  <div
                    className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase text-center shadow-lg truncate max-w-[200px]"
                    style={{
                      backgroundColor: template.ctaBgColor,
                      color: template.ctaTextColor,
                    }}
                  >
                    {template.ctaText}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ 3. TOP BANNER (Cabecera superior tradicional y plato libre) ═══ */}
        {layout !== "split_left" && layout !== "recipe_ingredients" && (
          <>
            <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-black/90 via-black/60 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-[25%] bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none z-10" />

            {price && (
              <div className={`absolute ${isModal ? "top-4 right-4" : "top-3 right-3"} z-20`}>
                <span
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide shadow-lg border border-black/20"
                  style={{
                    backgroundColor: template.priceBgColor || "#fbbf24",
                    color: template.priceTextColor || "#0f172a",
                  }}
                >
                  {price}
                </span>
              </div>
            )}

            <div className={`absolute inset-0 ${isModal ? "p-4" : "p-3.5"} flex flex-col justify-between z-10 text-center pointer-events-none`}>
              <div className="space-y-1 pt-1 px-1">
                <div className="flex justify-center mb-1">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md border border-white/10"
                    style={{
                      backgroundColor: template.badgeBgColor,
                      color: template.badgeTextColor,
                    }}
                  >
                    {template.badgeText}
                  </span>
                </div>

                <h3
                  className={`font-black leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-center px-1 ${
                    template.headlineFont === "script_handwritten"
                      ? isModal ? "font-serif italic text-2xl" : "font-serif italic text-xl"
                      : template.headlineFont === "elegant_serif"
                      ? isModal ? "font-serif text-xl tracking-wide" : "font-serif text-lg tracking-wide"
                      : isModal ? "font-sans uppercase text-xl tracking-tight" : "font-sans uppercase text-lg tracking-tight"
                  }`}
                  style={{ color: template.headlineColor }}
                >
                  {title}
                </h3>

                {sub && (
                  <p className={`text-white/95 ${isModal ? "text-xs" : "text-[10px]"} font-semibold tracking-wide leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] line-clamp-1 px-2`}>
                    {sub}
                  </p>
                )}
              </div>

              <div className="flex-1" />

              <div className="pb-1 px-2 flex justify-center">
                <div
                  className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase text-center shadow-lg truncate max-w-[200px] border border-black/10"
                  style={{
                    backgroundColor: template.ctaBgColor,
                    color: template.ctaTextColor,
                  }}
                >
                  {template.ctaText}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            🏷️ DISEÑO COMERCIAL & CAPAS DE VENTA
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Plantillas de Texto y Diseño Comercial
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-1 max-w-3xl">
            Convierte cualquier imagen —generada en nuestra plataforma o subida desde tu galería— en una pieza lista para vender. Personaliza titulares, precios destacados, etiquetas y llamados a la acción en segundos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenEdit()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <span>✨</span> Nueva Plantilla
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BARRA UNIFICADA: BUSCADOR + BOTÓN DRAWER FILTRAR ESTILOS
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-2xs mb-8">
        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Buscador Integrado */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, texto o categoría..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] flex items-center justify-center font-bold transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Botón Disparador del Modal de Estilos */}
          <button
            type="button"
            onClick={() => setIsStyleFilterModalOpen(true)}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 shadow-2xs ${
              selectedCategories.length === 0
                ? "bg-slate-900 hover:bg-slate-800 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-500/20 shadow-indigo-200"
            }`}
            title="Abrir selector de estilos y categorías"
          >
            <span>{selectedCategories.length === 0 ? "⚡" : "🎨"}</span>
            <span className="hidden sm:inline font-black">
              {selectedCategories.length === 0
                ? "Filtrar Estilos"
                : selectedCategories.length === 1
                ? selectedCategories[0]
                : `${selectedCategories.length} Estilos`}
            </span>
            <span className="sm:hidden font-black">
              {selectedCategories.length === 0
                ? "Estilos"
                : selectedCategories.length === 1
                ? selectedCategories[0]
                : `${selectedCategories.length} Estilos`}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              selectedCategories.length === 0 
                ? "bg-slate-800 text-slate-300 border border-slate-700" 
                : "bg-indigo-700 text-white"
            }`}>
              {selectedCategories.length === 0
                ? activeCategoriesSorted.length
                : selectedCategories.length === 1
                ? (categoryCounts[selectedCategories[0]] || 0)
                : selectedCategories.length}
            </span>
          </button>
        </div>

        {/* Barra de Filtro Activo si hay categorías seleccionadas */}
        {selectedCategories.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Filtrando por:</span>
              {selectedCategories.map(cat => (
                <span 
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  <span>{getCategoryIconComponent(cat)}</span>
                  <span>{cat}</span>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.2 rounded-full font-black">
                    {categoryCounts[cat] || 0}
                  </span>
                  <button 
                    onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))}
                    className="text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-100 font-bold ml-0.5 transition-colors"
                    title={`Remover filtro "${cat}"`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <button
              onClick={() => setSelectedCategories([])}
              className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors ml-auto"
            >
              Limpiar todos
            </button>
          </div>
        )}
      </div>

      {/* Grid de Plantillas */}
      {loading ? (
        <div className="py-20 text-center font-bold text-slate-400">
          Cargando plantillas de textos...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="text-slate-600 dark:text-slate-400 font-bold">
            No se encontraron plantillas en esta categoría o búsqueda.
          </p>
          <button
            onClick={() => {
              setSelectedCategories([]);
              setSearchQuery("");
            }}
            className="mt-4 text-indigo-600 hover:underline text-sm font-semibold"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => {
            const sampleDish = "Hamburguesa Artesanal";
            const samplePrice = "$24.900";
            const renderedTitle = formatTemplateText(template.headlinePattern, {
              productName: sampleDish,
            });
            const renderedSub = formatTemplateText(template.subheadlinePattern, {
              productName: sampleDish,
              price: samplePrice,
            });
            const renderedPrice = template.priceBadgePattern
              ? formatTemplateText(template.priceBadgePattern, { price: samplePrice })
              : "";

            return (
              <div
                key={template.id}
                className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Canvas Mockup de Previsualización */}
                {renderCanvasPoster({
                  template,
                  title: renderedTitle,
                  sub: renderedSub,
                  price: renderedPrice,
                  secondaryScript: template.secondaryScriptPattern,
                  ingredients: template.ingredients,
                  photoUrl: template.previewSampleImage,
                  isModal: false,
                })}

                {/* Info Card */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedCategories([template.category])}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 text-slate-500 uppercase tracking-wider transition-colors cursor-pointer"
                        title={`Filtrar solo "${template.category}"`}
                      >
                        {template.category}
                      </button>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {template.layoutPosition === "split_left"
                          ? "📐 Split Lateral"
                          : template.layoutPosition === "recipe_ingredients"
                          ? "🥗 Con Ingredientes"
                          : "📌 Cabecera Superior"}
                      </span>
                      {!template.isDefault && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                          Personalizada
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {template.name}
                    </h2>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => handleOpenTestModal(template)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>📸</span> Probar con mi foto
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUseInPost(template)}
                        className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-all text-center"
                      >
                        Usar en Post
                      </button>

                      <button
                        onClick={() => handleOpenEdit(template)}
                        title="Editar o duplicar"
                        className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-all"
                      >
                        ✏️
                      </button>

                      {!template.isDefault && (
                        <button
                          onClick={() => handleDeleteCustomTemplate(template.id)}
                          title="Eliminar plantilla"
                          className="px-2.5 py-1.5 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-xs font-bold text-red-600 transition-all"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODAL: PROBAR CON FOTO REAL DEL CATÁLOGO              */}
      {/* ════════════════════════════════════════════════════════ */}
      {testingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>✨</span> Previsualizar en Foto Real: {testingTemplate.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mira cómo lucirá la plantilla estampada con nuestro editor sobre tus fotos.
                </p>
              </div>
              <button
                onClick={() => setTestingTemplate(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
              {/* Columna Izquierda: Vista Previa en Vivo */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-[340px]">
                  {renderCanvasPoster({
                    template: testingTemplate,
                    title: formatTemplateText(testingTemplate.headlinePattern, {
                      productName: testProductName || "Nombre del Plato",
                    }),
                    sub: testingTemplate.subheadlinePattern
                      ? formatTemplateText(testingTemplate.subheadlinePattern, {
                          productName: testProductName,
                          price: testPrice,
                        })
                      : "",
                    price: testPrice,
                    secondaryScript: testSecondaryScript,
                    ingredients: testIngredients,
                    photoUrl: customPhotoUrl || testingTemplate.previewSampleImage,
                    isModal: true,
                  })}
                </div>

                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  💡 Nuestro editor renderiza estos textos con ortografía exacta y tipografía nítida sobre la foto.
                </p>
              </div>

              {/* Columna Derecha: Configurar Valores de Prueba */}
              <div className="space-y-4">
                {/* 🎯 Dirección de Arte Inteligente por Nuestros Agentes */}
                <div className="p-3.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-500/20 rounded-2xl flex flex-col gap-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎯</span>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                          Dirección de Arte de Nuestros Agentes
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Evalúa la foto y contenido para elegir la mejor disposición
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoArtDirection}
                      disabled={isDecidingArtDirection}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      <span>✨</span> {isDecidingArtDirection ? "Analizando..." : "Decidir Layout"}
                    </button>
                  </div>

                  {artDirectionReasoning && (
                    <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2 animate-fadeIn shadow-xs">
                      <span className="text-amber-500 font-bold mt-0.5">💡</span>
                      <p className="leading-snug">
                        <strong className="text-slate-900 dark:text-white font-semibold">Criterio del Agente: </strong>
                        {artDirectionReasoning}
                      </p>
                    </div>
                  )}
                </div>

                {/* 📸 Foto de Fondo para la Plantilla (Biblioteca, Subir o URL) */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>📸</span> Foto de Fondo para la Plantilla:
                    </label>
                    {customPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setCustomPhotoUrl(testingTemplate.previewSampleImage || "")}
                        className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                      >
                        Restaurar muestra
                      </button>
                    )}
                  </div>

                  {/* Pestañas de Selección */}
                  <div className="grid grid-cols-3 gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPhotoSourceTab("catalog")}
                      className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
                        photoSourceTab === "catalog"
                          ? "bg-indigo-600 text-white shadow-xs font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>🖼️</span> Mi Biblioteca ({libraryPhotos.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoSourceTab("upload")}
                      className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
                        photoSourceTab === "upload"
                          ? "bg-indigo-600 text-white shadow-xs font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>📤</span> Subir Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoSourceTab("url")}
                      className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
                        photoSourceTab === "url"
                          ? "bg-indigo-600 text-white shadow-xs font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <span>🔗</span> Pegar URL
                    </button>
                  </div>

                  {/* Tab 1: Mi Biblioteca y Catálogo */}
                  {photoSourceTab === "catalog" && (
                    <div className="space-y-2.5 animate-fadeIn">
                      {libraryPhotos.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Toca una foto para aplicarla de fondo:</span>
                            <span>{libraryPhotos.length} fotos</span>
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 p-1 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                            {libraryPhotos.map((photo) => {
                              const isSelected = customPhotoUrl === photo.url;
                              return (
                                <button
                                  key={photo.id}
                                  type="button"
                                  onClick={() => handleSelectPhoto(photo)}
                                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left ${
                                    isSelected
                                      ? "border-indigo-600 ring-2 ring-indigo-500/40 shadow-md scale-[0.98]"
                                      : "border-transparent hover:border-slate-300 dark:hover:border-slate-600 opacity-90 hover:opacity-100"
                                  }`}
                                  title={`${photo.title} ${photo.price ? `(${photo.price})` : ""}`}
                                >
                                  <img
                                    src={photo.url}
                                    alt={photo.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div
                                    className={`absolute bottom-0 inset-x-0 text-[9px] font-bold px-1 py-0.5 truncate text-white ${
                                      photo.source === "catalogo"
                                        ? "bg-slate-950/85"
                                        : photo.source === "subida"
                                        ? "bg-emerald-950/85"
                                        : "bg-indigo-950/85"
                                    }`}
                                  >
                                    {photo.title || "Foto"}
                                  </div>
                                  {isSelected && (
                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-md">
                                      ✓
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center space-y-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Aún no tienes fotos guardadas en tu catálogo o biblioteca.
                          </p>
                          <button
                            type="button"
                            onClick={() => setPhotoSourceTab("upload")}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>📤</span> Subir una foto ahora
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Subir Nueva Foto */}
                  {photoSourceTab === "upload" && (
                    <div className="space-y-2 animate-fadeIn">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadNewPhoto(file);
                        }}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                      />

                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingPhoto(true);
                        }}
                        onDragLeave={() => setIsDraggingPhoto(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingPhoto(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleUploadNewPhoto(file);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 ${
                          isDraggingPhoto
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
                            : "border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-white dark:bg-slate-900"
                        }`}
                      >
                        {isUploadingPhoto ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              Subiendo y procesando foto...
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Quedará lista para el poster y guardada en tu biblioteca
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shadow-xs">
                              📤
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Haz clic para elegir foto o arrástrala aquí
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Formatos: JPG, PNG, WebP (máx. 10 MB)
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {uploadError && (
                        <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                          ⚠️ {uploadError}
                        </div>
                      )}

                      {customPhotoUrl && (
                        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300">
                          <img
                            src={customPhotoUrl}
                            alt="Preview subida"
                            className="w-8 h-8 rounded-lg object-cover border border-emerald-300 shrink-0"
                          />
                          <div className="flex-1 truncate">
                            <span className="font-bold block leading-tight">Foto activa en el poster</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate block">
                              Lista para crear tu publicación
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Pegar URL */}
                  {photoSourceTab === "url" && (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={customPhotoUrl}
                          onChange={(e) => setCustomPhotoUrl(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="https://ejemplo.com/tu-foto.jpg"
                        />
                        {customPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setCustomPhotoUrl("")}
                            className="px-2.5 py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800"
                            title="Limpiar URL"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Pega un enlace directo de internet a la imagen de tu plato o producto.
                      </p>
                    </div>
                  )}
                </div>

                {/* Seleccionar del Catálogo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    1. Elegir Producto de tu Catálogo:
                  </label>
                  {catalogItems.length > 0 ? (
                    <select
                      value={selectedCatalogItem?.id || ""}
                      onChange={(e) => handleSelectCatalogItem(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {catalogItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} {item.price ? `(${item.price})` : ""} {item.imageUrl ? "📸 [Con Foto]" : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl">
                      Aún no tienes productos en tu catálogo. Puedes escribir el nombre y precio manualmente abajo.
                    </p>
                  )}
                </div>

                {/* Nombre y Precio */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre del Plato / Producto:
                    </label>
                    <input
                      type="text"
                      value={testProductName}
                      onChange={(e) => setTestProductName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      placeholder="ej. Hamburguesa Suprema"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Precio:
                    </label>
                    <input
                      type="text"
                      value={testPrice}
                      onChange={(e) => setTestPrice(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      placeholder="ej. $24.900"
                    />
                  </div>
                </div>

                {/* Kicker / Cursiva Superior si es Split Lateral */}
                {testingTemplate.layoutPosition === "split_left" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kicker / Cursiva Superior:
                    </label>
                    <input
                      type="text"
                      value={testSecondaryScript}
                      onChange={(e) => setTestSecondaryScript(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      placeholder="ej. Hyderabadi / Fresh & Cheesy / Presentamos"
                    />
                  </div>
                )}

                {/* Gestor de Ingredientes si es Ficha de Receta */}
                {testingTemplate.layoutPosition === "recipe_ingredients" && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>🥗</span> Tira de Ingredientes (Ficha)
                      </span>
                      <button
                        onClick={handleSuggestIngredients}
                        disabled={isSuggestingIngredients}
                        className="text-[11px] font-bold px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-sm transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        <span>✨</span> {isSuggestingIngredients ? "Sugerir..." : "Sugerir con agentes"}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {testIngredients.map((ing, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 shadow-sm"
                        >
                          <span className="text-sm">{ing.icon}</span>
                          <span className="font-semibold">{ing.name}</span>
                          {ing.amount && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                              ({ing.amount})
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setTestIngredients((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-500 text-xs ml-1"
                            title="Eliminar ingrediente"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      {testIngredients.length === 0 && (
                        <p className="text-[11px] text-slate-400 italic">
                          No hay ingredientes configurados. Pulsa en "Sugerir con agentes" para generar automáticamente.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Botón de Acción */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() =>
                      handleUseInPost(
                        testingTemplate,
                        customPhotoUrl,
                        testProductName,
                        testPrice
                      )
                    }
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>🚀</span> Crear Post con esta Foto y Plantilla
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODAL: CREAR / EDITAR PLANTILLA                       */}
      {/* ════════════════════════════════════════════════════════ */}
      {(editingTemplate || isNewTemplate) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {isNewTemplate ? "✨ Crear Nueva Plantilla de Texto" : `✏️ Editar Plantilla: ${editingTemplate?.name}`}
              </h3>
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setIsNewTemplate(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre y Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de la Plantilla:
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {TEXT_TEMPLATE_CATEGORIES.filter((c) => c !== "Todas").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Disposición / Layout y Kicker Secundario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Disposición / Layout Visual:
                  </label>
                  <select
                    value={formLayoutPosition}
                    onChange={(e) => setFormLayoutPosition(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="top_banner">📌 Cabecera Superior (Clásico)</option>
                    <option value="split_left">📐 Split Lateral (Texto al Costado & Plato a la Derecha)</option>
                    <option value="recipe_ingredients">🥗 Ficha de Receta con Tira de Ingredientes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kicker / Cursiva Superior (Secundario):
                  </label>
                  <input
                    type="text"
                    value={formSecondaryScript}
                    onChange={(e) => setFormSecondaryScript(e.target.value)}
                    placeholder="ej. Hyderabadi / Fresh & Cheesy / Una receta, mil momentos"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción:
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Badge Superior */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Insignia Superior (Badge):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={formBadgeText}
                      onChange={(e) => setFormBadgeText(e.target.value)}
                      placeholder="ej. ⭐ DESTACADO DE LA SEMANA"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">Color:</label>
                    <input
                      type="color"
                      value={formBadgeBgColor}
                      onChange={(e) => setFormBadgeBgColor(e.target.value)}
                      className="w-8 h-8 rounded border-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Titular Principal */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Titular Principal:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={formHeadlinePattern}
                      onChange={(e) => setFormHeadlinePattern(e.target.value)}
                      placeholder="ej. COMBO {PRODUCTO}"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <span className="text-[11px] text-slate-400">Usa {"{PRODUCTO}"} para inyectar el plato automáticamente.</span>
                  </div>
                  <div>
                    <select
                      value={formHeadlineFont}
                      onChange={(e) => setFormHeadlineFont(e.target.value as TypographyStyle)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="bold_modern">Bebas Neue (Moderno)</option>
                      <option value="script_handwritten">Dancing Script (Cursiva)</option>
                      <option value="elegant_serif">Playfair Display (Elegante)</option>
                      <option value="serif_script_mix">Playfair + Script (Mix Editorial)</option>
                      <option value="bold_textured">Impact Condensado (Texturizado)</option>
                      <option value="clean_minimal">Montserrat (Limpio)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Subtítulo y CTA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subtítulo / Beneficio:
                  </label>
                  <input
                    type="text"
                    value={formSubheadlinePattern}
                    onChange={(e) => setFormSubheadlinePattern(e.target.value)}
                    placeholder="ej. El plan perfecto para compartir"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Texto del Botón CTA:
                  </label>
                  <input
                    type="text"
                    value={formCtaText}
                    onChange={(e) => setFormCtaText(e.target.value)}
                    placeholder="ej. ¡ORDENA AHORA!"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setIsNewTemplate(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Guardar Plantilla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL / DRAWER DE ESTILOS Y DISEÑOS (100% RESPONSIVE)
          ========================================================= */}
      {isStyleFilterModalOpen && (
        <div 
          className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsStyleFilterModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full sm:max-w-xl rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 flex flex-col"
          >
            {/* Cabecera del Drawer/Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🎨</span> Seleccionar Estilos Visuales
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-medium">
                  Puedes seleccionar uno o varios estilos para filtrar simultáneamente
                </p>
              </div>
              <button 
                onClick={() => setIsStyleFilterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
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
                    ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500/30"
                    : "border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-xs ${
                    selectedCategories.length === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}>
                    ✨
                  </span>
                  <div>
                    <div className={`text-xs font-black ${
                      selectedCategories.length === 0 ? "text-indigo-950 dark:text-indigo-200" : "text-slate-900 dark:text-white group-hover:text-indigo-600"
                    }`}>
                      Todos los Estilos
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      Ver colección completa
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    selectedCategories.length === 0 ? "bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}>
                    {categoryCounts.all || 0}
                  </span>
                  {selectedCategories.length === 0 && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
              </button>

              {/* Categorías con plantillas activas (> 0) */}
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
                        ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500/30"
                        : "border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-xs ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}>
                        {getCategoryIconComponent(cat)}
                      </span>
                      <div className="truncate">
                        <div className={`text-xs font-bold truncate ${
                          isSelected ? "text-indigo-950 dark:text-indigo-200 font-black" : "text-slate-900 dark:text-white group-hover:text-indigo-600"
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
                        isSelected ? "bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 font-black" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        {count}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer sticky con botón de aplicar y limpiar */}
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {selectedCategories.length === 0 ? (
                  <span className="text-slate-400">Mostrando todos los estilos</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedCategories([])}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold underline transition-colors"
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
                <span>Ver {filteredTemplates.length} plantilla{filteredTemplates.length === 1 ? "" : "s"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
