"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { PromptTemplate, HARDCODED_STYLES, promptCategories } from "../../lib/prompt-templates";

interface PromptStylePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate: PromptTemplate | null;
  onSelectTemplate: (template: PromptTemplate | null) => void;
}

export default function PromptStylePickerModal({
  isOpen,
  onClose,
  selectedTemplate,
  onSelectTemplate,
}: PromptStylePickerModalProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>(HARDCODED_STYLES);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    async function loadTemplates() {
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
        console.warn("Error cargando prompt_library, usando estilos predefinidos:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (isOpen) {
      loadTemplates();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTemplates = templates.filter((tmpl) => {
    const matchesCategory =
      selectedCategory === "all" ||
      tmpl.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();

    const matchesSearch =
      searchQuery.trim() === "" ||
      tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Biblioteca de Prompts IA & Estilos Visuales
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecciona un estilo visual maestro para que la IA componga tu imagen, carrusel o video.
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

        {/* Filters & Search */}
        <div className="p-5 border-b border-slate-100 space-y-3 bg-white">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Buscar estilo por nombre, categoría o temática..."
              className="w-full bg-slate-50 border border-slate-200 pl-4 pr-10 py-2.5 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedCategory === "all"
                  ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
            >
              Todos ({templates.length})
            </button>
            {promptCategories.map((cat) => {
              const count = templates.filter(
                (t) => t.category.toLowerCase().trim() === cat.toLowerCase().trim()
              ).length;
              if (count === 0) return null;
              const isSelected = selectedCategory.toLowerCase().trim() === cat.toLowerCase().trim();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-bold">Cargando biblioteca de estilos...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-3xl mb-2">🎨</p>
              <p className="text-xs font-bold text-slate-600">No se encontraron estilos en esta categoría</p>
              <p className="text-[11px] mt-1">Prueba con otra búsqueda o categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map((tmpl) => {
                const isSelected = selectedTemplate?.id === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    className={`group relative rounded-2xl overflow-hidden border transition-all flex flex-col bg-white ${
                      isSelected
                        ? "border-indigo-600 ring-2 ring-indigo-500 shadow-lg shadow-indigo-600/10"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                      <img
                        src={tmpl.previewUrl}
                        alt={tmpl.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      {/* Badge Category */}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider">
                        {tmpl.category}
                      </span>
                      {tmpl.isCommercialPoster && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-amber-500 text-[9px] font-bold text-white uppercase tracking-wider shadow-sm">
                          Cartel
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 line-clamp-1">{tmpl.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {tmpl.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            onSelectTemplate(null);
                          } else {
                            onSelectTemplate(tmpl);
                            onClose();
                          }
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        }`}
                      >
                        {isSelected ? "✓ Estilo Seleccionado (Quitar)" : "✨ Usar este Estilo"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <div className="text-xs font-semibold text-slate-500">
            {selectedTemplate ? (
              <span className="text-indigo-600 font-bold">
                Estilo activo: {selectedTemplate.title}
              </span>
            ) : (
              "Ningún estilo seleccionado (usará el generador estándar de IA)"
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedTemplate && (
              <button
                type="button"
                onClick={() => onSelectTemplate(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                Limpiar Estilo
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
