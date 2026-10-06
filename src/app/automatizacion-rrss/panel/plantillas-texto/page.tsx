"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
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

export default function PlantillasTextoPage() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [templates, setTemplates] = useState<TextTemplate[]>(DEFAULT_TEXT_TEMPLATES);
  const [activeCategory, setActiveCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Estados para modal de prueba con foto real
  const [testingTemplate, setTestingTemplate] = useState<TextTemplate | null>(null);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any | null>(null);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>("");
  const [testProductName, setTestProductName] = useState<string>("");
  const [testPrice, setTestPrice] = useState<string>("");
  const [testIngredients, setTestIngredients] = useState<IngredientItem[]>([]);
  const [testSecondaryScript, setTestSecondaryScript] = useState<string>("");
  const [isSuggestingIngredients, setIsSuggestingIngredients] = useState<boolean>(false);
  const [newIngredientName, setNewIngredientName] = useState<string>("");
  const [newIngredientAmount, setNewIngredientAmount] = useState<string>("");
  const [newIngredientIcon, setNewIngredientIcon] = useState<string>("🥗");

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
        await loadCatalog(u.uid);
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

  const loadCatalog = async (userId: string) => {
    try {
      const snap = await getDocs(collection(db, "users", userId, "catalog"));
      const items: any[] = [];
      snap.forEach((d) => {
        const item = d.data();
        if (item.name) items.push({ id: d.id, ...item });
      });
      setCatalogItems(items);
      if (items.length > 0) {
        setSelectedCatalogItem(items[0]);
        setTestProductName(items[0].name || "");
        setTestPrice(items[0].price || "");
        if (items[0].imageUrl) setCustomPhotoUrl(items[0].imageUrl);
      }
    } catch (err) {
      console.warn("Error cargando catálogo para pruebas de plantilla:", err);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory =
        activeCategory === "Todas" || t.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.headlinePattern.toLowerCase().includes(q) ||
        t.badgeText.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [templates, activeCategory, searchQuery]);

  // Abrir modal de prueba con foto
  const handleOpenTestModal = (template: TextTemplate) => {
    setTestingTemplate(template);
    setTestIngredients(template.ingredients ? [...template.ingredients] : []);
    setTestSecondaryScript(template.secondaryScriptPattern || "");
    if (catalogItems.length > 0) {
      const firstWithPhoto = catalogItems.find((it) => it.imageUrl?.startsWith("http")) || catalogItems[0];
      setSelectedCatalogItem(firstWithPhoto);
      setTestProductName(firstWithPhoto.name || "Hamburguesa Doble Queso");
      setTestPrice(firstWithPhoto.price || "$24.900");
      setCustomPhotoUrl(firstWithPhoto.imageUrl || template.previewSampleImage || "");
    } else {
      setTestProductName("Hamburguesa Doble Queso");
      setTestPrice("$24.900");
      setCustomPhotoUrl(template.previewSampleImage || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80");
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
      setTestPrice(item.price || "");
      if (item.imageUrl) setCustomPhotoUrl(item.imageUrl);
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
            🏷️ Butterfly Social & Carteles Reales
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Plantillas de Texto para Imágenes Reales
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-1 max-w-3xl">
            Selecciona y personaliza las capas tipográficas que se sobreponen a las fotos reales de tus productos:
            titulares, precios destacados, badges y llamadas a la acción en alta fidelidad.
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

      {/* Controles de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {TEXT_TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[260px]">
          <input
            type="text"
            placeholder="Buscar por nombre, texto o badge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
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
              setActiveCategory("Todas");
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
                        {template.category}
                      </span>
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
                  Mira cómo lucirá la plantilla estampada con Butterfly Social sobre tus fotos.
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
                  💡 Butterfly Social renderiza estos textos con ortografía exacta y tipografía nítida sobre la foto.
                </p>
              </div>

              {/* Columna Derecha: Configurar Valores de Prueba */}
              <div className="space-y-4">
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

                {/* URL de Foto Personalizada */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    URL de Foto de Fondo:
                  </label>
                  <input
                    type="url"
                    value={customPhotoUrl}
                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>

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
    </div>
  );
}
