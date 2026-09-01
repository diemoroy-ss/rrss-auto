"use client";

import React, { useState } from "react";
import { PromptTemplate } from "../../lib/prompt-templates";

interface PreferredStylesModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableStyles: PromptTemplate[];
  selectedStyles: string[]; // List of template IDs
  onToggleStyle: (styleId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  saving?: boolean;
}

export default function PreferredStylesModal({
  isOpen,
  onClose,
  availableStyles,
  selectedStyles,
  onToggleStyle,
  onSelectAll,
  onDeselectAll,
  saving = false,
}: PreferredStylesModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (!isOpen) return null;

  const categories = ["all", ...Array.from(new Set(availableStyles.map(s => s.category).filter(Boolean)))];

  const filteredStyles = availableStyles.filter((style) => {
    const matchesCategory = selectedCategory === "all" || style.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      style.title.toLowerCase().includes(term) ||
      (style.category && style.category.toLowerCase().includes(term)) ||
      (style.description && style.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Personalizar Mis Estilos Visuales Favoritos
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Marca con un check los estilos de la biblioteca de Prompts IA que deseas tener a mano al crear posts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Action bar / Search, Category Filter & Select All */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar estilo..."
                className="w-full bg-slate-50 border border-slate-200 pl-3.5 pr-8 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "Todas las categorías" : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onSelectAll}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
            >
              Seleccionar todos ({availableStyles.length})
            </button>
            <button
              type="button"
              onClick={onDeselectAll}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
            >
              Deseleccionar todos
            </button>
          </div>
        </div>

        {/* Styles Checklist Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {filteredStyles.map((style) => {
              const isChecked = selectedStyles.includes(style.id);
              return (
                <label
                  key={style.id}
                  className={`group relative flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none bg-white ${
                    isChecked
                      ? "border-indigo-500 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-400"
                      : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                  }`}
                >
                  {/* Checkbox input */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleStyle(style.id)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
                  />

                  {/* Thumbnail Image (Exact image from prompt library) */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative border border-slate-200/80">
                    <img
                      src={style.previewUrl}
                      alt={style.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-slate-800 truncate block">
                        {style.title}
                      </span>
                    </div>
                    {style.category && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5 truncate">
                        {style.category}
                      </span>
                    )}
                    {style.description && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {style.description}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <span className="text-xs font-bold text-slate-600">
            {selectedStyles.length} estilo{selectedStyles.length === 1 ? "" : "s"} seleccionado{selectedStyles.length === 1 ? "" : "s"} para tu panel de creación
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
          >
            {saving ? "Guardando..." : "Guardar Preferencias ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
