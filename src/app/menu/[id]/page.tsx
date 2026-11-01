"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  FaWhatsapp, 
  FaInstagram, 
  FaGlobe, 
  FaMapMarkerAlt, 
  FaSearch, 
  FaShareAlt, 
  FaFire,
  FaCheck,
  FaUtensils,
  FaChevronRight,
  FaChevronLeft
} from "react-icons/fa";
import { MENU_THEMES, DEFAULT_MENU_THEME, MenuThemeId } from "../../../lib/menu-themes";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  subcategory?: string | null;
  price: string | null;
  offerPrice: string | null;
  imageUrl: string | null;
  keepOriginalPhoto?: boolean;
}

interface BusinessInfo {
  name: string;
  rubro: string;
  description: string;
  logoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagramUsername: string | null;
  website: string | null;
  address: string | null;
  promotions: string | null;
  fidelizacionEnabled?: boolean;
  fidelizacionProgramName?: string;
  fidelizacionRewardTitle?: string;
  fidelizacionTargetGoal?: number;
}

function formatPrice(val: string | number | null | undefined): string {
  if (!val) return "";
  const str = String(val).trim();
  if (str.startsWith("$")) return str;
  const num = parseInt(str.replace(/\D/g, ""), 10);
  if (!isNaN(num) && num > 0) {
    return `$${num.toLocaleString("es-CL")}`;
  }
  return str;
}

export default function PublicMenuPage() {
  const params = useParams();
  const menuId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuEnabled, setMenuEnabled] = useState(true);
  const [disabledMessage, setDisabledMessage] = useState("");
  const [themeId, setThemeId] = useState<MenuThemeId>(DEFAULT_MENU_THEME);

  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("TODOS");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("TODAS");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuId) return;
    loadMenu();
  }, [menuId]);

  const loadMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/menu/${menuId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo cargar la carta");
      }

      setBusiness(data.business);

      if (data.enabled === false) {
        setMenuEnabled(false);
        setDisabledMessage(data.message || "La carta digital de este comercio se encuentra inactiva.");
        return;
      }

      setMenuEnabled(true);
      if (data.theme && MENU_THEMES[data.theme as MenuThemeId]) {
        setThemeId(data.theme as MenuThemeId);
      }
      setItems(data.items || []);
      setCategories(data.categories || []);
    } catch (err: any) {
      setError(err.message || "Error al conectar con la carta digital.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleScrollRight = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: 180, behavior: "smooth" });
    }
  };

  const handleScrollLeft = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: -180, behavior: "smooth" });
    }
  };

  const cleanPhone = useMemo(() => {
    if (!business?.phone && !business?.whatsapp) return null;
    const raw = (business.whatsapp || business.phone || "").replace(/\D/g, "");
    return raw;
  }, [business]);

  const getGeneralWhatsAppUrl = () => {
    if (!cleanPhone) return null;
    const text = encodeURIComponent(
      `¡Hola! Estoy viendo su carta digital y quisiera hacer una consulta.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const getItemWhatsAppUrl = (item: MenuItem) => {
    if (!cleanPhone) return null;
    const priceText = item.offerPrice ? formatPrice(item.offerPrice) : formatPrice(item.price);
    const text = encodeURIComponent(
      `¡Hola! Quisiera pedir "${item.name}" (${priceText}) de su carta digital.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const availableSubcategories = useMemo(() => {
    const relevantItems = activeCategory === "TODOS"
      ? items
      : items.filter((i) => (i.category || "Destacados").toLowerCase() === activeCategory.toLowerCase());
    const subs = Array.from(
      new Set(relevantItems.map((i) => i.subcategory).filter(Boolean) as string[])
    );
    return subs.sort((a, b) => a.localeCompare(b));
  }, [items, activeCategory]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "TODOS" || (item.category || "Destacados").toLowerCase() === activeCategory.toLowerCase();
      const matchesSubcategory =
        activeSubcategory === "TODAS" ||
        (item.subcategory && item.subcategory.toLowerCase() === activeSubcategory.toLowerCase());
      const matchesQuery =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSubcategory && matchesQuery;
    });
  }, [items, activeCategory, activeSubcategory, searchQuery]);

  // Agrupación de productos por categoría para la vista por secciones
  const groupedItems = useMemo(() => {
    if (activeCategory !== "TODOS") {
      return [{ category: activeCategory, items: filteredItems }];
    }

    const groups: { category: string; items: MenuItem[] }[] = [];
    const categoryOrder = categories.length > 0 ? categories : Array.from(new Set(items.map(i => i.category || "Destacados")));

    categoryOrder.forEach((cat) => {
      const catItems = filteredItems.filter(
        (i) => (i.category || "Destacados").toLowerCase() === cat.toLowerCase()
      );
      if (catItems.length > 0) {
        groups.push({ category: cat, items: catItems });
      }
    });

    // Productos que no coinciden con las categorías configuradas
    const coveredIds = new Set(groups.flatMap((g) => g.items.map((i) => i.id)));
    const remaining = filteredItems.filter((i) => !coveredIds.has(i.id));
    if (remaining.length > 0) {
      groups.push({ category: "Otros Platos", items: remaining });
    }

    return groups;
  }, [filteredItems, activeCategory, categories, items]);

  // Cover image: primer producto con foto o logo
  const coverImage = useMemo(() => {
    const itemWithImg = items.find((i) => i.imageUrl);
    return itemWithImg?.imageUrl || business?.logoUrl || null;
  }, [items, business]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 border-4 border-[#E15338] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white font-black text-lg">Cargando la carta...</p>
        <p className="text-slate-400 text-sm font-medium mt-1">Preparando la experiencia gastronómica</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-3xl flex items-center justify-center text-3xl mb-4 shadow-xl">
          🍽️
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Carta no disponible</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-6">{error || "El comercio no existe o el enlace no es válido."}</p>
        <Link
          href="/"
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-sm transition-all"
        >
          Ir al Inicio
        </Link>
      </div>
    );
  }

  // Si la carta está deshabilitada por el negocio
  if (!menuEnabled) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-3xl flex items-center justify-center text-3xl mb-4 shadow-xl">
          🍽️
        </div>
        <h1 className="text-2xl font-black text-white mb-1.5">{business.name}</h1>
        <p className="text-amber-400 text-xs font-black uppercase tracking-wider mb-4">{business.rubro}</p>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl max-w-sm mb-6">
          <p className="text-slate-300 text-xs font-medium leading-relaxed">
            {disabledMessage || "La carta digital de este comercio se encuentra inactiva o en preparación."}
          </p>
        </div>
        {cleanPhone && (
          <a
            href={getGeneralWhatsAppUrl() || "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg active:scale-95"
          >
            <FaWhatsapp className="text-lg" />
            <span>Consultar directamente por WhatsApp</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-20 font-sans antialiased">
      {/* 1. Header / Cover Visual de Comida */}
      <div className="relative w-full h-36 sm:h-48 overflow-hidden bg-slate-900">
        {coverImage ? (
          <img
            src={coverImage}
            alt={business.name}
            className="w-full h-full object-cover opacity-85 brightness-95"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/30" />

        {/* Top Floating Controls */}
        <div className="absolute top-3 left-0 right-0 px-4 sm:px-6 flex items-center justify-between z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-black/50 backdrop-blur-md text-white border border-white/20">
            <FaUtensils className="text-[10px] text-[#E15338]" /> Menú &amp; Carta Digital
          </span>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 transition-all active:scale-95"
          >
            {copiedLink ? <FaCheck className="text-emerald-400" /> : <FaShareAlt />}
            <span>{copiedLink ? "¡Copiado!" : "Compartir"}</span>
          </button>
        </div>

        {/* Business Title in Cover */}
        <div className="absolute bottom-3 left-0 right-0 px-4 sm:px-6 z-10 flex items-end justify-between gap-3">
          <div className="text-white drop-shadow-md min-w-0">
            <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight truncate leading-tight">
              {business.name}
            </h1>
            <p className="text-xs text-white/90 font-medium truncate">
              {business.rubro} {business.address ? `· ${business.address}` : ""}
            </p>
          </div>
          {cleanPhone && (
            <a
              href={getGeneralWhatsAppUrl() || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shrink-0 shadow-lg active:scale-95 transition-all"
            >
              <FaWhatsapp className="text-sm" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. Main Content Container */}
      <div className="max-w-2xl mx-auto px-3.5 sm:px-6 pt-4">
        {/* Loyalty Club Banner when enabled */}
        {business.fidelizacionEnabled && (
          <Link
            href={`/fideliza/${menuId}`}
            className="mb-4 flex items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm hover:brightness-105 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">🎁</span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-85">
                  {business.fidelizacionProgramName || "Club VIP"} · Tarjeta de Sellos
                </p>
                <p className="text-xs font-black truncate">
                  Suma {business.fidelizacionTargetGoal || 5} visitas y gana: {business.fidelizacionRewardTitle}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-slate-950 text-amber-400 font-black text-xs shrink-0">
              Sumar →
            </span>
          </Link>
        )}

        {/* Sticky Search Input Bar ("Buscar por productos") */}
        <div className="sticky top-2 z-30 mb-3 space-y-2.5">
          <div className="relative rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <FaSearch className="text-sm" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por productos..."
              className="w-full pl-11 pr-10 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 bg-transparent outline-none rounded-2xl focus:border-[#E15338] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Carrusel Horizontal de Categorías (Icono Cubiertos + Nombre Mayúsculas) */}
          <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-sm py-2 px-1">
            {categories.length > 3 && (
              <button
                onClick={handleScrollLeft}
                aria-label="Ver categorías anteriores"
                className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-800 z-10"
              >
                <FaChevronLeft className="text-[10px]" />
              </button>
            )}

            <div
              ref={categoryScrollRef}
              className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth px-3 py-1"
            >
              {/* Opción Todos */}
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("TODOS");
                  setActiveSubcategory("TODAS");
                }}
                className={`flex flex-col items-center justify-center min-w-[68px] sm:min-w-[76px] py-1 px-1 rounded-xl transition-all cursor-pointer group ${
                  activeCategory === "TODOS"
                    ? "text-[#E15338] font-black"
                    : "text-slate-600 hover:text-slate-900 font-bold"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg mb-1 transition-transform group-hover:scale-110 ${
                    activeCategory === "TODOS"
                      ? "bg-orange-50 text-[#E15338] shadow-xs"
                      : "text-[#E15338]/80 group-hover:text-[#E15338]"
                  }`}
                >
                  <FaUtensils />
                </div>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-tight text-center leading-tight whitespace-nowrap">
                  TODOS
                </span>
                {activeCategory === "TODOS" && (
                  <span className="w-5 h-0.5 bg-[#E15338] rounded-full mt-1" />
                )}
              </button>

              {/* Categorías del local */}
              {categories.map((cat) => {
                const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat);
                      setActiveSubcategory("TODAS");
                    }}
                    className={`flex flex-col items-center justify-center min-w-[68px] sm:min-w-[76px] py-1 px-1 rounded-xl transition-all cursor-pointer group ${
                      isActive
                        ? "text-[#E15338] font-black"
                        : "text-slate-600 hover:text-slate-900 font-bold"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-lg mb-1 transition-transform group-hover:scale-110 ${
                        isActive
                          ? "bg-orange-50 text-[#E15338] shadow-xs"
                          : "text-[#E15338]/80 group-hover:text-[#E15338]"
                      }`}
                    >
                      <FaUtensils />
                    </div>
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-tight text-center leading-tight whitespace-nowrap">
                      {cat}
                    </span>
                    {isActive && (
                      <span className="w-5 h-0.5 bg-[#E15338] rounded-full mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {categories.length > 3 && (
              <button
                onClick={handleScrollRight}
                aria-label="Ver más categorías"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-800 z-10"
              >
                <FaChevronRight className="text-[10px]" />
              </button>
            )}
          </div>

          {/* Subcategorías si existen */}
          {availableSubcategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setActiveSubcategory("TODAS")}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                  activeSubcategory === "TODAS"
                    ? "bg-[#E15338] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Todas
              </button>
              {availableSubcategories.map((sub) => {
                const isSelected = activeSubcategory.toLowerCase() === sub.toLowerCase();
                return (
                  <button
                    key={sub}
                    onClick={() => setActiveSubcategory(sub)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                      isSelected
                        ? "bg-[#E15338] text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Feed de Productos Agrupados por Categoría */}
        {groupedItems.length === 0 || filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center shadow-xs mt-4">
            <span className="text-4xl block mb-2">🔍</span>
            <h3 className="text-base font-black text-slate-900">No encontramos productos coincidentes</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Prueba con otro término de búsqueda o selecciona otra categoría.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("TODOS");
                setActiveSubcategory("TODAS");
              }}
              className="px-5 py-2.5 bg-[#E15338] text-white font-bold rounded-xl text-xs hover:bg-orange-700 transition-all shadow-md"
            >
              Ver toda la carta
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedItems.map((group) => (
              <section key={group.category} className="space-y-3">
                {/* Título de la Categoría (ej: PIQUEOS, ENTRADAS, FONDOS) */}
                <h2 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-tight pt-1">
                  {group.category}
                </h2>

                {/* Lista de Tarjetas Horizontales de Producto */}
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const hasOffer = Boolean(item.offerPrice);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItemForModal(item)}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-row items-stretch overflow-hidden cursor-pointer group"
                      >
                        {/* Columna Izquierda: Nombre, Descripción y Precio */}
                        <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between min-w-0 pr-2">
                          <div>
                            <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight leading-snug uppercase group-hover:text-[#E15338] transition-colors">
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="text-xs text-slate-500 font-normal line-clamp-2 mt-1 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Precio en Coral Destacado */}
                          <div className="mt-2.5 flex items-baseline gap-2">
                            {hasOffer ? (
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm sm:text-base font-black text-[#E15338]">
                                  {formatPrice(item.offerPrice)}
                                </span>
                                {item.price && (
                                  <span className="text-xs text-slate-400 font-semibold line-through">
                                    {formatPrice(item.price)}
                                  </span>
                                )}
                              </div>
                            ) : item.price ? (
                              <span className="text-sm sm:text-base font-black text-[#E15338]">
                                {formatPrice(item.price)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-semibold italic">
                                Consultar en mesa
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Columna Derecha: Foto del Producto */}
                        {item.imageUrl ? (
                          <div className="w-28 sm:w-36 min-h-[105px] sm:min-h-[115px] shrink-0 bg-slate-100 overflow-hidden relative">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                            {hasOffer && (
                              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#E15338] text-white text-[9px] font-black uppercase tracking-wider shadow">
                                Promo
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-24 sm:w-28 min-h-[105px] sm:min-h-[115px] shrink-0 bg-slate-50 border-l border-slate-100 flex flex-col items-center justify-center text-slate-300 p-2">
                            <FaUtensils className="text-2xl opacity-40 mb-1 text-[#E15338]" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Sin foto</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Footer Brand Credit */}
        <div className="mt-12 text-center opacity-70 text-xs space-y-1.5 pb-6">
          <p className="font-bold flex items-center justify-center gap-1.5 text-slate-700">
            <span>🍽️</span> Carta digital inteligente de {business.name}
          </p>
          <p className="text-[11px] text-slate-500">
            Desarrollada con la tecnología de{" "}
            <a
              href="https://santisoft.cl"
              target="_blank"
              rel="noreferrer"
              className="text-[#E15338] font-black hover:underline"
            >
              Santisoft
            </a>
          </p>
        </div>
      </div>

      {/* 4. Modal Detallado de Producto con Pedido por WhatsApp */}
      {selectedItemForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedItemForModal(null)}
        >
          <div
            className="rounded-3xl max-w-sm sm:max-w-md w-full overflow-hidden shadow-2xl bg-white text-slate-900 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItemForModal.imageUrl && (
              <div className="relative w-full h-56 sm:h-72 bg-slate-100">
                <img
                  src={selectedItemForModal.imageUrl}
                  alt={selectedItemForModal.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedItemForModal(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white font-bold flex items-center justify-center text-sm hover:bg-black transition-all shadow"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    {selectedItemForModal.category} {selectedItemForModal.subcategory ? `· ${selectedItemForModal.subcategory}` : ""}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 uppercase leading-snug">
                    {selectedItemForModal.name}
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  {selectedItemForModal.offerPrice ? (
                    <div>
                      <span className="text-lg font-black text-[#E15338] block">
                        {formatPrice(selectedItemForModal.offerPrice)}
                      </span>
                      {selectedItemForModal.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatPrice(selectedItemForModal.price)}
                        </span>
                      )}
                    </div>
                  ) : selectedItemForModal.price ? (
                    <span className="text-lg font-black text-[#E15338]">
                      {formatPrice(selectedItemForModal.price)}
                    </span>
                  ) : null}
                </div>
              </div>

              {selectedItemForModal.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mt-2">
                  {selectedItemForModal.description}
                </p>
              )}

              {cleanPhone && (
                <a
                  href={getItemWhatsAppUrl(selectedItemForModal) || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <FaWhatsapp className="text-base" />
                  <span>Pedir este plato por WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
