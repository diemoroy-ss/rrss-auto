"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
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
  FaArrowLeft,
  FaCheck,
  FaUtensils
} from "react-icons/fa";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
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
}

export default function PublicMenuPage() {
  const params = useParams();
  const menuId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("TODOS");
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

  const getWhatsAppItemUrl = (item: MenuItem) => {
    if (!cleanPhone) return null;
    const priceText = item.offerPrice ? `en oferta a ${item.offerPrice}` : item.price ? `(${item.price})` : "";
    const text = encodeURIComponent(
      `¡Hola! Estuve viendo su carta digital y me gustaría pedir o consultar por: *${item.name}* ${priceText}. ¿Tienen disponibilidad?`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const getGeneralWhatsAppUrl = () => {
    if (!cleanPhone) return null;
    const text = encodeURIComponent(
      `¡Hola! Estoy viendo su carta digital y quisiera hacer un pedido o consulta.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "TODOS" || item.category.toLowerCase() === activeCategory.toLowerCase();
      const matchesQuery =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [items, activeCategory, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-700 font-black text-lg">Cargando la carta...</p>
        <p className="text-slate-400 text-sm font-medium mt-1">Preparando los mejores productos para ti</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center text-3xl mb-4 shadow-sm">
          🍽️
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Carta no disponible</h1>
        <p className="text-slate-500 text-sm max-w-sm mb-6">{error || "El comercio no existe o no tiene una carta activa en este momento."}</p>
        <Link
          href="/"
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition-all"
        >
          Ir al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-28 selection:bg-indigo-500 selection:text-white">
      {/* Top Banner / Cover */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white pt-8 pb-14 px-4 sm:px-6 shadow-xl">
        <div className="max-w-2xl mx-auto">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 backdrop-blur-md text-slate-200 border border-white/10">
              <FaUtensils className="text-emerald-400 text-[11px]" /> Carta & Menú Oficial
            </span>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 transition-all active:scale-95"
            >
              {copiedLink ? <FaCheck className="text-emerald-400" /> : <FaShareAlt />}
              <span>{copiedLink ? "¡Enlace copiado!" : "Compartir"}</span>
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
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-indigo-600/50 backdrop-blur-md border-2 border-white/20 flex items-center justify-center text-4xl shadow-xl shrink-0">
                🍽️
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight truncate">
                {business.name}
              </h1>
              <p className="text-indigo-200 text-xs sm:text-sm font-semibold mt-0.5">
                {business.rubro}
              </p>
              {business.address && (
                <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1 truncate">
                  <FaMapMarkerAlt className="text-rose-400 shrink-0" />
                  <span>{business.address}</span>
                </p>
              )}
            </div>
          </div>

          {/* Business Description */}
          {business.description && (
            <p className="text-slate-300 text-xs sm:text-sm mt-4 leading-relaxed font-normal bg-black/20 p-3 rounded-2xl border border-white/5">
              {business.description}
            </p>
          )}

          {/* Action Chips: Instagram, Website, WhatsApp */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {cleanPhone && (
              <a
                href={getGeneralWhatsAppUrl() || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
              >
                <FaWhatsapp className="text-sm" /> WhatsApp Directo
              </a>
            )}
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
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6">
        {/* Sticky Search & Category Navigation */}
        <div className="sticky top-3 z-30 space-y-3 mb-6">
          {/* Search Bar */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <FaSearch />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en la carta (ej: Hamburguesa, Café, Tarta)..."
              className="w-full pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-800 placeholder-slate-400 bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Category Tabs Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveCategory("TODOS")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 shadow-xs ${
                activeCategory === "TODOS"
                  ? "bg-indigo-600 text-white shadow-indigo-500/25"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/60"
              }`}
            >
              Todos ({items.length})
            </button>
            {categories.map((cat) => {
              const count = items.filter((i) => i.category === cat).length;
              const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
              const isPromo = cat.toLowerCase().includes("promo") || cat.toLowerCase().includes("oferta");
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 shadow-xs ${
                    isActive
                      ? isPromo
                        ? "bg-rose-600 text-white shadow-rose-500/25"
                        : "bg-indigo-600 text-white shadow-indigo-500/25"
                      : isPromo
                      ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/60"
                  }`}
                >
                  {isPromo && <FaFire className="text-amber-300" />}
                  <span>{cat}</span>
                  <span className={`text-[10px] opacity-75 ml-0.5 font-bold`}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Promotions Highlight Callout (if active and set) */}
        {business.promotions && activeCategory === "TODOS" && !searchQuery && (
          <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border-2 border-amber-200/60 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-lg shrink-0 shadow-md shadow-amber-500/20">
              🔥
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
                Ofertas & Promociones del Local
              </h3>
              <p className="text-xs text-amber-950 font-medium mt-0.5 leading-snug">
                {business.promotions}
              </p>
            </div>
          </div>
        )}

        {/* Product Items List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center shadow-xs">
            <span className="text-5xl block mb-3">🔍</span>
            <h3 className="text-lg font-black text-slate-800">No encontramos coincidencias</h3>
            <p className="text-slate-400 text-xs font-medium mt-1 mb-4">
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
                  className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 group"
                >
                  {/* Photo / Thumbnail */}
                  {item.imageUrl ? (
                    <div 
                      onClick={() => setSelectedItemForModal(item)}
                      className="relative w-full sm:w-36 h-48 sm:h-36 rounded-2xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer group-hover:opacity-95"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {hasOffer && (
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md flex items-center gap-1">
                          <FaFire className="text-[10px]" /> Promo
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg">Ver foto</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Item Content */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Top pills */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                        {item.type === 'servicio' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                            Servicio
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        {item.name}
                      </h3>

                      <p className="text-slate-500 text-xs leading-relaxed font-medium mt-1 line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
                      {/* Price Section */}
                      <div>
                        {hasOffer ? (
                          <div className="flex flex-col">
                            <span className="text-rose-600 font-black text-lg leading-none flex items-center gap-1.5">
                              {item.offerPrice}
                            </span>
                            {item.price && (
                              <span className="text-slate-400 text-xs font-semibold line-through mt-0.5">
                                Antes {item.price}
                              </span>
                            )}
                          </div>
                        ) : item.price ? (
                          <span className="text-slate-900 font-black text-base sm:text-lg leading-none">
                            {item.price}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-semibold">
                            Consultar precio
                          </span>
                        )}
                      </div>

                      {/* WhatsApp Order Button */}
                      {cleanPhone && (
                        <a
                          href={getWhatsAppItemUrl(item) || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shadow-sm active:scale-95 ${
                            hasOffer
                              ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                          }`}
                        >
                          <FaWhatsapp className="text-sm" />
                          <span>Pedir</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Brand Credit */}
        <div className="mt-12 text-center text-slate-400 text-xs space-y-2">
          <p className="font-bold flex items-center justify-center gap-1.5 text-slate-500">
            <span>✨</span> Carta digital inteligente de {business.name}
          </p>
          <p className="text-[11px] text-slate-400">
            Desarrollada con la tecnología de{" "}
            <a
              href="https://santisoft.cl"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 font-black hover:underline"
            >
              Santisoft
            </a>
          </p>
        </div>
      </div>

      {/* Floating Bottom Bar for Mobile Contact */}
      {cleanPhone && (
        <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40">
          <a
            href={getGeneralWhatsAppUrl() || "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-600/30 font-black text-sm transition-all transform active:scale-95"
          >
            <div className="flex items-center gap-2.5">
              <FaWhatsapp className="text-xl" />
              <span>¿Quieres ordenar o consultar algo?</span>
            </div>
            <span className="bg-white/20 text-white px-2.5 py-1 rounded-xl text-xs font-black">
              Escríbenos
            </span>
          </a>
        </div>
      )}

      {/* Image Modal for Fullscreen View */}
      {selectedItemForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedItemForModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItemForModal.imageUrl && (
              <div className="relative w-full h-72 sm:h-96 bg-slate-900">
                <img
                  src={selectedItemForModal.imageUrl}
                  alt={selectedItemForModal.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedItemForModal(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white font-bold flex items-center justify-center text-sm hover:bg-black transition-all"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-xl font-black text-slate-900">{selectedItemForModal.name}</h3>
                <div className="text-right">
                  {selectedItemForModal.offerPrice ? (
                    <div>
                      <span className="text-rose-600 font-black text-lg block">{selectedItemForModal.offerPrice}</span>
                      {selectedItemForModal.price && (
                        <span className="text-slate-400 text-xs line-through">{selectedItemForModal.price}</span>
                      )}
                    </div>
                  ) : selectedItemForModal.price ? (
                    <span className="text-slate-900 font-black text-lg">{selectedItemForModal.price}</span>
                  ) : null}
                </div>
              </div>
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                {selectedItemForModal.description}
              </p>
              {cleanPhone && (
                <a
                  href={getWhatsAppItemUrl(selectedItemForModal) || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <FaWhatsapp className="text-lg" />
                  <span>Pedir este producto por WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
