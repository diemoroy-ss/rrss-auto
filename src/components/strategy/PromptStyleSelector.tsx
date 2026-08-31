"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { PromptTemplate, HARDCODED_STYLES, promptCategories } from "../../lib/prompt-templates";

interface PromptStyleSelectorProps {
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  selectedStyles: PromptTemplate[];
  onChangeSelectedStyles: (styles: PromptTemplate[]) => void;
}

export default function PromptStyleSelector({
  enabled,
  onToggleEnabled,
  selectedStyles,
  onChangeSelectedStyles
}: PromptStyleSelectorProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>(HARDCODED_STYLES);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    async function loadDbTemplates() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "prompt_library"));
        const loaded: PromptTemplate[] = [];
        const dbIds = new Set<string>();

        snap.forEach((doc) => {
          const data = doc.data();
          dbIds.add(doc.id);
          const hasValidTitle = typeof data.title === "string" && data.title.trim().length > 0;
          const hasValidPrompt = typeof data.prompt === "string" && data.prompt.trim().length > 0;
          if (!data.isDeleted && hasValidTitle && hasValidPrompt) {
            loaded.push({ id: doc.id, ...data } as PromptTemplate);
          }
        });

        HARDCODED_STYLES.forEach((style) => {
          if (!dbIds.has(style.id) && style.title && style.title.trim() && style.prompt && style.prompt.trim()) {
            loaded.push(style);
          }
        });

        if (isMounted) {
          setTemplates(loaded);
        }
      } catch (err) {
        console.warn("No se pudo cargar prompt_library de Firestore, usando plantillas por defecto:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDbTemplates();
    return () => {
      isMounted = false;
    };
  }, []);

  const isSelected = (id: string) => selectedStyles.some((s) => s.id === id);

  const toggleStyle = (style: PromptTemplate) => {
    if (isSelected(style.id)) {
      onChangeSelectedStyles(selectedStyles.filter((s) => s.id !== style.id));
    } else {
      onChangeSelectedStyles([...selectedStyles, style]);
    }
  };

  const handleSelectAll = (filteredList: PromptTemplate[]) => {
    const newSelected = [...selectedStyles];
    filteredList.forEach((item) => {
      if (!newSelected.some((s) => s.id === item.id)) {
        newSelected.push(item);
      }
    });
    onChangeSelectedStyles(newSelected);
  };

  const handleDeselectFiltered = (filteredList: PromptTemplate[]) => {
    const filteredIds = new Set(filteredList.map((f) => f.id));
    onChangeSelectedStyles(selectedStyles.filter((s) => !filteredIds.has(s.id)));
  };

  const handleClearAll = () => {
    onChangeSelectedStyles([]);
  };

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    const matchesCategory = selectedCategory === "all" || tpl.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-5 md:p-6 space-y-4 transition-all">
      {/* Header & Toggle Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-2xl shadow-sm">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight">
                Estilos Visuales de Prompts IA
              </h3>
              {enabled && selectedStyles.length > 0 && (
                <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200/70 px-2.5 py-0.5 rounded-full">
                  {selectedStyles.length} {selectedStyles.length === 1 ? "estilo seleccionado" : "estilos seleccionados"}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Indica qué plantillas o imágenes de Prompts IA servirán de inspiración visual para las publicaciones generadas.
            </p>
          </div>
        </div>

        {/* Switch Control */}
        <label className="relative inline-flex items-center cursor-pointer select-none self-end sm:self-center">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              const checked = e.target.checked;
              onToggleEnabled(checked);
              // If activating and none selected, auto-select the top 3 commercial/ad styles as default recommendation
              if (checked && selectedStyles.length === 0 && templates.length > 0) {
                const defaults = templates.filter((t) => t.isCommercialPoster || t.category === "Publicidad y Ads").slice(0, 3);
                if (defaults.length > 0) onChangeSelectedStyles(defaults);
                else onChangeSelectedStyles(templates.slice(0, 3));
              }
            }}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          <span className="ml-3 text-xs font-bold text-slate-700">
            {enabled ? "Activado" : "Desactivado"}
          </span>
        </label>
      </div>

      {/* Expanded Grid & Filters when enabled */}
      {enabled && (
        <div className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-300">
          {/* Controls Bar: Search & Category Filter */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar estilo (ej. Meta Ads, Hero shot, 3D, Fotorealismo...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSelectAll(filteredTemplates)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors border border-indigo-100"
              >
                ✓ Seleccionar mostrados ({filteredTemplates.length})
              </button>
              {selectedStyles.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors border border-slate-200"
                >
                  Limpiar todo
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos ({templates.length})
            </button>
            {promptCategories.map((cat) => {
              const count = templates.filter((t) => t.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Selection Helper Warning if none selected */}
          {selectedStyles.length === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>
                Selecciona al menos 1 estilo visual con el checkbox para que nuestros agentes lo incorporen a las publicaciones.
              </span>
            </div>
          )}

          {/* Grid of Style Cards */}
          {loading ? (
            <div className="py-8 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
              Cargando biblioteca de estilos...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-slate-400">
              No se encontraron estilos para "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1 p-1">
              {filteredTemplates.map((style) => {
                const selected = isSelected(style.id);
                return (
                  <div
                    key={style.id}
                    onClick={() => toggleStyle(style)}
                    className={`group relative rounded-2xl border-2 cursor-pointer transition-all overflow-hidden flex flex-col ${
                      selected
                        ? "border-indigo-600 bg-indigo-50/40 shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20"
                        : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                      {style.previewUrl ? (
                        <img
                          src={style.previewUrl}
                          alt={style.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl font-black">
                          🎨
                        </div>
                      )}

                      {/* Checkbox overlay */}
                      <div className="absolute top-2 right-2 z-10">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            selected
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40 scale-105"
                              : "bg-black/40 backdrop-blur-sm text-transparent hover:bg-black/60 border border-white/40"
                          }`}
                        >
                          <span className="text-xs font-black">✓</span>
                        </div>
                      </div>

                      {/* Category Pill on Image */}
                      <div className="absolute bottom-2 left-2">
                        <span className="bg-slate-900/75 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                          {style.category}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4
                          className={`text-xs font-black line-clamp-1 ${
                            selected ? "text-indigo-950" : "text-slate-800"
                          }`}
                          title={style.title}
                        >
                          {style.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 font-medium leading-tight">
                          {style.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
