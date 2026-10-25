"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  FaWhatsapp, 
  FaInstagram, 
  FaGlobe, 
  FaMapMarkerAlt, 
  FaSearch, 
  FaShareAlt, 
  FaTag, 
  FaFire,
  FaCheck,
  FaUtensils,
  FaStoreAlt
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

  // Estilos del tema seleccionado
  const theme = MENU_THEMES[themeId] || MENU_THEMES.minimal_clean;
  const t = theme.styles;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-white font-black text-lg">Cargando la carta...</p>
        <p className="text-slate-400 text-sm font-medium mt-1">Preparando la experiencia del local</p>
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
    <div className={`min-h-screen ${t.pageBg} pb-16 transition-colors duration-300`}>
      {/* Top Banner / Cover */}
      <div className={`relative ${t.heroGradient} pt-8 pb-14 px-4 sm:px-6 shadow-xl`}>
        <div className="max-w-2xl mx-auto">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 backdrop-blur-md text-white border border-white/10">
              <FaUtensils className="text-[11px]" /> Carta & Menú Oficial
            </span>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 transition-all active:scale-95"
            >
              {copiedLink ? <FaCheck className="text-emerald-400" /> : <FaShareAlt />}
              <span>{copiedLink ? "¡Copiado!" : "Compartir"}</span>
            </button>
          </div>

          {/* Business Profile Info */}
          <div className="flex items-center gap-4 sm:gap-5">
            {business.logoUrl ? (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-white shadow-xl border-2 border-white/20 shrink-0">
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center text-4xl shadow-xl shrink-0">
                {theme.emoji}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className={`text-xl sm:text-2xl md:text-3xl font-black ${t.heroText} leading-snug break-words`}>
                {business.name}
              </h1>
              <p className={`text-xs sm:text-sm font-semibold mt-0.5 ${t.heroSubtext}`}>
                {business.rubro}
              </p>
              {business.address && (
                <p className="text-white/70 text-xs flex items-center gap-1.5 mt-1 break-words">
                  <FaMapMarkerAlt className="shrink-0 text-rose-400" />
                  <span>{business.address}</span>
                </p>
              )}
            </div>
          </div>

          {/* Business Description */}
          {business.description && (
            <p className={`text-xs sm:text-sm mt-4 leading-relaxed font-normal p-3 rounded-2xl ${t.heroCard}`}>
              {business.description}
            </p>
          )}

          {/* Action Chips: Instagram, Website */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {business.instagramUsername && (
              <a
                href={`https://instagram.com/${business.instagramUsername.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/10 transition-all"
              >
                <FaInstagram className="text-pink-400 text-sm" /> @{business.instagramUsername.replace('@', '')}
              </a>
            )}
            {business.website && (
              <a
                href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/10 transition-all"
              >
                <FaGlobe className="text-cyan-400 text-sm" /> Web
              </a>
            )}
          </div>

          {/* Loyalty Club Banner when enabled */}
          {business.fidelizacionEnabled && (
            <Link
              href={`/fideliza/${menuId}`}
              className="mt-4 flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg hover:brightness-105 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">🎁</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider opacity-80">
                    {business.fidelizacionProgramName || "Club VIP"} · Tarjeta de Sellos
                  </p>
                  <p className="text-xs sm:text-sm font-black truncate">
                    Suma {business.fidelizacionTargetGoal || 5} visitas y gana: {business.fidelizacionRewardTitle}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 text-amber-400 font-black text-xs shrink-0">
                Sumar Sellos →
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6">
        {/* Sticky Search & Category Navigation */}
        <div className="sticky top-3 z-30 space-y-3 mb-6">
          {/* Search Bar */}
          <div className={`relative rounded-2xl overflow-hidden ${t.searchBox}`}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none opacity-60">
              <FaSearch />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en la carta (ej: Hamburguesa, Café, Tarta)..."
              className={`w-full pl-11 pr-4 py-3.5 text-sm font-semibold bg-transparent outline-none ${t.searchInput}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold opacity-60 hover:opacity-100"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Category Tabs Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => {
                setActiveCategory("TODOS");
                setActiveSubcategory("TODAS");
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 shadow-xs ${
                activeCategory === "TODOS" ? t.categoryActive : t.categoryInactive
              }`}
            >
              Todos ({items.length})
            </button>
            {categories.map((cat) => {
              const count = items.filter((i) => (i.category || "Destacados").toLowerCase() === cat.toLowerCase()).length;
              const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
              const isPromo = cat.toLowerCase().includes("promo") || cat.toLowerCase().includes("oferta");
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setActiveSubcategory("TODAS");
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 shadow-xs ${
                    isActive
                      ? isPromo ? t.categoryPromoActive : t.categoryActive
                      : isPromo ? t.categoryPromoInactive : t.categoryInactive
                  }`}
                >
                  {isPromo && <FaFire />}
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-75 ml-0.5 font-bold">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Subcategory Pills Bar (si la categoría activa o la carta tienen subcategorías) */}
          {availableSubcategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-0.5 -mt-1 bg-black/5 dark:bg-white/5 rounded-2xl p-1 backdrop-blur-xs">
              <button
                onClick={() => setActiveSubcategory("TODAS")}
                className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all shrink-0 ${
                  activeSubcategory === "TODAS"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80"
                }`}
              >
                Todas las subcategorías
              </button>
              {availableSubcategories.map((sub) => {
                const isSelected = activeSubcategory.toLowerCase() === sub.toLowerCase();
                const subCount = (activeCategory === "TODOS" ? items : items.filter(i => (i.category || "Destacados").toLowerCase() === activeCategory.toLowerCase())).filter(i => (i.subcategory || '').toLowerCase() === sub.toLowerCase()).length;
                return (
                  <button
                    key={sub}
                    onClick={() => setActiveSubcategory(sub)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80"
                    }`}
                  >
                    <span>{sub}</span>
                    <span className="text-[9px] opacity-75">({subCount})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Promotions Highlight Callout */}
        {business.promotions && activeCategory === "TODOS" && !searchQuery && (
          <div className="mb-6 p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-lg shrink-0 shadow-md">
              🔥
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-500">
                Ofertas & Promociones del Local
              </h3>
              <p className="text-xs font-medium mt-0.5 leading-snug opacity-90">
                {business.promotions}
              </p>
            </div>
          </div>
        )}

        {/* Product Items List */}
        {filteredItems.length === 0 ? (
          <div className={`rounded-3xl border-2 border-dashed p-10 text-center shadow-xs ${t.card}`}>
            <span className="text-5xl block mb-3">🔍</span>
            <h3 className={`text-lg font-black ${t.titleColor}`}>No encontramos coincidencias</h3>
            <p className={`text-xs font-medium mt-1 mb-4 ${t.descColor}`}>
              Prueba con otro término de búsqueda o selecciona otra categoría.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("TODOS");
              }}
              className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl text-xs hover:bg-indigo-700 transition-all shadow-md"
            >
              Ver toda la carta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((item) => {
              const hasOffer = Boolean(item.offerPrice);
              return (
                <div
                  key={item.id}
                  className={`rounded-3xl p-4 transition-all flex flex-col sm:flex-row gap-4 group ${t.card}`}
                >
                  {/* Photo / Thumbnail */}
                  {item.imageUrl ? (
                    <div 
                      onClick={() => setSelectedItemForModal(item)}
                      className="relative w-full sm:w-36 h-48 sm:h-36 rounded-2xl overflow-hidden bg-black/10 shrink-0 cursor-pointer group-hover:opacity-95"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {hasOffer && (
                        <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${t.offerBadge}`}>
                          <FaFire className="text-[10px]" /> Promo
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg">Ver foto</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Item Content */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Top pills */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${t.categoryTag}`}>
                          {item.category}
                        </span>
                        {item.subcategory && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                            ↳ {item.subcategory}
                          </span>
                        )}
                        {item.type === 'servicio' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            Servicio
                          </span>
                        )}
                      </div>

                      <h3 className={`text-base sm:text-lg ${t.titleColor} leading-snug`}>
                        {item.name}
                      </h3>

                      <p className={`text-xs leading-relaxed font-medium mt-1 line-clamp-3 ${t.descColor}`}>
                        {item.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className={`flex items-center justify-between gap-3 mt-4 pt-3 border-t ${t.dividerColor}`}>
                      <div>
                        {hasOffer ? (
                          <div className="flex flex-col">
                            <span className={`text-lg font-black leading-none flex items-center gap-1.5 ${t.offerPriceColor}`}>
                              {item.offerPrice}
                            </span>
                            {item.price && (
                              <span className="opacity-60 text-xs font-medium line-through mt-0.5">
                                Antes {item.price}
                              </span>
                            )}
                          </div>
                        ) : item.price ? (
                          <span className={`text-base sm:text-lg font-black leading-none ${t.priceColor}`}>
                            {item.price}
                          </span>
                        ) : (
                          <span className="opacity-60 text-xs font-semibold">
                            Consultar en mesa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Brand Credit */}
        <div className="mt-12 text-center opacity-70 text-xs space-y-2">
          <p className="font-bold flex items-center justify-center gap-1.5">
            <span>✨</span> Carta digital inteligente de {business.name}
          </p>
          <p className="text-[11px]">
            Desarrollada con la tecnología de{" "}
            <a
              href="https://santisoft.cl"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 font-black hover:underline"
            >
              Santisoft
            </a>
          </p>
        </div>
      </div>

      {/* Image Modal for Fullscreen View */}
      {selectedItemForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setSelectedItemForModal(null)}
        >
          <div
            className={`rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border ${t.card}`}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItemForModal.imageUrl && (
              <div className="relative w-full h-72 sm:h-96 bg-black">
                <img
                  src={selectedItemForModal.imageUrl}
                  alt={selectedItemForModal.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedItemForModal(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 text-white font-bold flex items-center justify-center text-sm hover:bg-black transition-all"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className={`text-xl ${t.titleColor}`}>{selectedItemForModal.name}</h3>
                <div className="text-right">
                  {selectedItemForModal.offerPrice ? (
                    <div>
                      <span className={`text-lg block ${t.offerPriceColor}`}>{selectedItemForModal.offerPrice}</span>
                      {selectedItemForModal.price && (
                        <span className="opacity-60 text-xs line-through">{selectedItemForModal.price}</span>
                      )}
                    </div>
                  ) : selectedItemForModal.price ? (
                    <span className={`text-lg ${t.priceColor}`}>{selectedItemForModal.price}</span>
                  ) : null}
                </div>
              </div>
              <p className={`text-sm font-medium leading-relaxed ${t.descColor}`}>
                {selectedItemForModal.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
