"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

export interface PlanProductItem {
  id: string;
  name: string;
  description?: string;
  type?: "producto" | "servicio" | string;
  category?: string;
  subcategory?: string;
  price?: string | null;
  offerPrice?: string | null;
  imageUrl?: string | null;
  keepOriginalPhoto?: boolean;
  fontStyle?: string;
  hasImage?: boolean;
}

interface PlanProductsSelectorProps {
  items: PlanProductItem[];
  selectedItemIds: string[];
  onChangeSelectedIds: (ids: string[]) => void;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

export default function PlanProductsSelector({
  items,
  selectedItemIds,
  onChangeSelectedIds,
  loading = false,
  title = "Productos y Servicios para esta Planificación",
  subtitle = "Selecciona qué productos o servicios de tu catálogo promocionarán nuestros agentes en este calendario.",
}: PlanProductsSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "producto" | "servicio">("all");

  const productCount = useMemo(() => items.filter((i) => i.type !== "servicio").length, [items]);
  const serviceCount = useMemo(() => items.filter((i) => i.type === "servicio").length, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchType =
        filterType === "all" ||
        (filterType === "servicio" ? item.type === "servicio" : item.type !== "servicio");

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q));

      return matchType && matchSearch;
    });
  }, [items, filterType, searchQuery]);

  const handleToggle = (id: string) => {
    if (selectedItemIds.includes(id)) {
      onChangeSelectedIds(selectedItemIds.filter((itemId) => itemId !== id));
    } else {
      onChangeSelectedIds([...selectedItemIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const newSelected = new Set(selectedItemIds);
    filteredItems.forEach((item) => newSelected.add(item.id));
    onChangeSelectedIds(Array.from(newSelected));
  };

  const handleDeselectAllFiltered = () => {
    const filteredIds = new Set(filteredItems.map((i) => i.id));
    onChangeSelectedIds(selectedItemIds.filter((id) => !filteredIds.has(id)));
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm text-center py-10">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">Cargando productos y servicios del catálogo...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛍️</span>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-xs font-medium text-slate-500">
              Aún no tienes productos o servicios registrados en tu catálogo.
            </p>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-600 font-medium">
            Agrega tus platos, productos con fotos y precios para que nuestros agentes los promocionen.
          </span>
          <Link
            href="/automatizacion-rrss/panel/catalogo"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0 text-center"
          >
            + Ir al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  const selectedCount = selectedItemIds.length;

  return (
    <div className="p-5 md:p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">
            🛍️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight">{title}</h3>
              <span
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                  selectedCount > 0
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {selectedCount} de {items.length} seleccionado{selectedCount === 1 ? "" : "s"}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <Link
          href="/automatizacion-rrss/panel/catalogo"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0 self-end sm:self-center"
        >
          Gestionar Catálogo →
        </Link>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between pt-1">
        {/* Barra de búsqueda */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Buscar plato, producto o servicio..."
            className="w-full bg-slate-50 border border-slate-200 pl-8 pr-7 py-2 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro por Tipo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos ({items.length})
          </button>
          {productCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterType("producto")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === "producto"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              📦 Productos ({productCount})
            </button>
          )}
          {serviceCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterType("servicio")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === "servicio"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              💼 Servicios ({serviceCount})
            </button>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          <button
            type="button"
            onClick={handleSelectAllFiltered}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors border border-indigo-100"
          >
            ✓ Marcar todos
          </button>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={handleDeselectAllFiltered}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors border border-slate-200"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Grid de Productos / Servicios */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-xs font-medium text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          No se encontraron ítems para &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            const isService = item.type === "servicio";
            const hasPhoto = Boolean(item.imageUrl && item.imageUrl.startsWith("http"));

            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/20"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/60"
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white font-bold"
                      : "border border-slate-300 bg-white text-transparent"
                  }`}
                >
                  <span className="text-xs">✓</span>
                </div>

                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                  {hasPhoto ? (
                    <img
                      src={item.imageUrl!}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-lg">{isService ? "💼" : "📦"}</span>
                  )}
                  {hasPhoto && (
                    <span
                      className="absolute bottom-0 right-0 bg-emerald-600 text-white text-[8px] font-black px-1 rounded-tl"
                      title="Tiene foto real"
                    >
                      FOTO
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 justify-between">
                    <h4 className="text-xs font-black text-slate-800 truncate" title={item.name}>
                      {item.name}
                    </h4>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                        isService
                          ? "bg-purple-100 text-purple-700"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isService ? "Servicio" : "Producto"}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.price && (
                      <span className="text-[11px] font-black text-slate-900">
                        {item.price}
                      </span>
                    )}
                    {item.offerPrice && (
                      <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1 rounded">
                        Oferta: {item.offerPrice}
                      </span>
                    )}
                    {item.category && (
                      <span className="text-[9px] font-medium text-slate-400 truncate max-w-[100px]">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warning si 0 seleccionados */}
      {selectedCount === 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>
            No has seleccionado ningún producto o servicio. Si continúas, nuestros agentes elaborarán publicaciones orientadas a valor, consejos y branding general del rubro.
          </span>
        </div>
      )}
    </div>
  );
}
