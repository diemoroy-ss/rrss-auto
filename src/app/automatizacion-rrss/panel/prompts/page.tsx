"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { auth, storage, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useProfile } from "../../../../contexts/ProfileContext";
import { useRouter } from "next/navigation";
import StatusModal from "../../../../components/StatusModal";

import { 
  type ImageRequirement, 
  type PromptTemplate, 
  promptCategories, 
  HARDCODED_STYLES 
} from "../../../../lib/prompt-templates";

export type { ImageRequirement, PromptTemplate };
export { promptCategories, HARDCODED_STYLES };

export default function PromptsLibraryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userDoc, setUserDoc] = useState<any>(null);
  const { activeProfile } = useProfile();
  
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);

  // Status Modal State (Reemplazo moderno de alerts y confirms)
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "confirm";
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: (() => void) | null;
    onCancel?: (() => void) | null;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    confirmText: "Aceptar",
    cancelText: "Cancelar",
    onConfirm: null,
    onCancel: null,
  });

  const showStatus = (type: "success" | "error" | "info" | "confirm", title: string, message: string, onConfirm?: () => void) => {
    setStatusModal({
      isOpen: true,
      type,
      title,
      message,
      confirmText: "Aceptar",
      cancelText: "Cancelar",
      onConfirm: onConfirm || (() => setStatusModal(prev => ({ ...prev, isOpen: false }))),
      onCancel: () => setStatusModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  // Client Modal
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedPromptText, setEditedPromptText] = useState("");
  
  // Image Preview Lightbox Modal
  const [previewLightbox, setPreviewLightbox] = useState<{ url: string; title: string; category: string; prompt: PromptTemplate } | null>(null);
  
  // Guided Mode State
  const [isFreeEditMode, setIsFreeEditMode] = useState(false);
  const [parsedVariables, setParsedVariables] = useState<{raw: string, name: string, example: string}[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  
  const [baseImageFile, setBaseImageFile] = useState<File | null>(null);
  const [baseImagePreview, setBaseImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin Modal
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [existingPreviewUrl, setExistingPreviewUrl] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({
    title: "",
    description: "",
    category: promptCategories[0],
    prompt: "",
    imageRequirement: "optional" as ImageRequirement,
    isCommercialPoster: false,
  });
  const [adminVariableValues, setAdminVariableValues] = useState<Record<string, string>>({});
  const [adminBaseImageFile, setAdminBaseImageFile] = useState<File | null>(null);
  const [isAdminGenerating, setIsAdminGenerating] = useState(false);
  const [adminError, setAdminError] = useState("");

  const adminParsedVariables = Array.from(new Set(Array.from(adminForm.prompt.matchAll(/\[([^\]]+)\]/g)).map(m => m[1]))).map(raw => {
    const parts = raw.split(':');
    return { raw, name: parts[0], example: parts[1] || `Valor para ${parts[0]}` };
  });

  const [isFormattingPrompt, setIsFormattingPrompt] = useState(false);

  const handleAutoFormatPrompt = async () => {
    if (!adminForm.prompt.trim()) {
      setAdminError("Ingresa un prompt base primero para optimizarlo.");
      return;
    }
    
    setIsFormattingPrompt(true);
    setAdminError("");

    try {
      const res = await fetch("/api/ai/format-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rawPrompt: adminForm.prompt,
          isCommercialPoster: adminForm.isCommercialPoster 
        })
      });

      if (!res.ok) throw new Error("Error al comunicarse con la IA");
      
      const data = await res.json();
      if (data.formattedPrompt) {
        setAdminForm(prev => ({ ...prev, prompt: data.formattedPrompt }));
      } else {
        throw new Error(data.error || "No se pudo formatear el prompt");
      }
    } catch (err: any) {
      console.error(err);
      setAdminError(err.message || "Ocurrió un error al formatear el prompt.");
    } finally {
      setIsFormattingPrompt(false);
    }
  };

  const userEmail = (user?.email || "").toLowerCase();
  const isAdminUser = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com"].includes(userEmail) || userDoc?.role === "admin";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const d = await getDoc(doc(db, "users", u.uid));
          if (d.exists()) setUserDoc(d.data());
        } catch (e) {
          console.error(e);
        }
      }
    });
    fetchPrompts();
    return () => unsub();
  }, []);

  const fetchPrompts = async () => {
    setLoadingPrompts(true);
    try {
      const snapshot = await getDocs(collection(db, "prompt_library"));
      const loaded: PromptTemplate[] = [];
      const dbIds = new Set<string>();
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        dbIds.add(docSnap.id);
        const hasValidTitle = typeof data.title === "string" && data.title.trim().length > 0;
        const hasValidPrompt = typeof data.prompt === "string" && data.prompt.trim().length > 0;
        
        if (!data.isDeleted && hasValidTitle && hasValidPrompt) {
          loaded.push({ id: docSnap.id, ...data } as PromptTemplate);
        } else if (!hasValidTitle || !hasValidPrompt) {
          // Documento corrupto o en blanco: limpiar de Firestore permanentemente
          deleteDoc(doc(db, "prompt_library", docSnap.id)).catch(() => {});
        }
      });
      
      // Añadir plantillas hardcodeadas solo si no fueron modificadas ni eliminadas
      HARDCODED_STYLES.forEach(style => {
        if (!dbIds.has(style.id) && style.title && style.title.trim() && style.prompt && style.prompt.trim()) {
          loaded.push(style);
        }
      });
      
      setPromptTemplates(loaded);
    } catch (e) {
      console.error("Error loading prompts", e);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: promptTemplates.length };
    promptCategories.forEach(cat => {
      counts[cat] = promptTemplates.filter(p => p.category === cat).length;
    });
    return counts;
  }, [promptTemplates]);

  const filteredPrompts = useMemo(() => {
    return promptTemplates.filter(p => {
      const matchesCategory = activeCategory === "all" || p.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [promptTemplates, activeCategory, searchQuery]);

  // ════════════════════════════════════════════════════════
  // CLIENT FLOW
  // ════════════════════════════════════════════════════════
  const openPromptModal = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setEditedPromptText(prompt.prompt);
    
    // Parse variables (anything inside [BRACKETS])
    const matches = Array.from(prompt.prompt.matchAll(/\[([^\]]+)\]/g));
    const varsRaw = Array.from(new Set(matches.map(m => m[1])));
    
    const parsed = varsRaw.map(raw => {
      const parts = raw.split(':');
      return { raw, name: parts[0], example: parts[1] || `Valor para ${parts[0]}` };
    });
    setParsedVariables(parsed);
    
    const initialValues: Record<string, string> = {};
    parsed.forEach(v => {
      // Si tiene ejemplo, lo podemos dejar en blanco y que el placeholder haga el trabajo, o pre-llenarlo.
      // Mejor lo dejamos en blanco para que el usuario deba rellenarlo.
      initialValues[v.raw] = "";
    });
    setVariableValues(initialValues);
    setIsFreeEditMode(parsed.length === 0); // Default to free mode if no vars

    setBaseImageFile(null);
    setBaseImagePreview(null);
    setGeneratedImage(null);
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedPrompt(null);
      setParsedVariables([]);
      setVariableValues({});
    }, 300);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBaseImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBaseImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePrompt = (id: string) => {
    setStatusModal({
      isOpen: true,
      type: "confirm",
      title: "¿Eliminar Plantilla?",
      message: "¿Estás seguro de que deseas eliminar esta plantilla de la biblioteca de prompts? Esta acción no se puede deshacer.",
      confirmText: "Sí, Eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          // Marcar como eliminado en Firestore para que ninguna plantilla hardcodeada reaparezca
          await setDoc(doc(db, "prompt_library", id), { isDeleted: true }, { merge: true });
          setPromptTemplates(prev => prev.filter(p => p.id !== id));
          showStatus("success", "Plantilla Eliminada", "La plantilla ha sido eliminada exitosamente.");
        } catch (e: any) {
          console.error("Error deleting", e);
          showStatus("error", "Error al eliminar", "No se pudo eliminar la plantilla: " + (e.message || "Error desconocido"));
        }
      },
      onCancel: () => setStatusModal(prev => ({ ...prev, isOpen: false })),
    });
  };

  const handleEditPrompt = (prompt: PromptTemplate) => {
    setEditingPromptId(prompt.id);
    setExistingPreviewUrl(prompt.previewUrl);
    setAdminForm({
      title: prompt.title,
      description: prompt.description,
      category: prompt.category,
      prompt: prompt.prompt,
      imageRequirement: prompt.imageRequirement || "none",
      isCommercialPoster: prompt.isCommercialPoster || false
    });
    const matches = Array.from(prompt.prompt.matchAll(/\[([^\]]+)\]/g));
    const varsRaw = Array.from(new Set(matches.map(m => m[1])));
    const initialVals: Record<string, string> = {};
    varsRaw.forEach(v => initialVals[v] = "");
    setAdminVariableValues(initialVals);
    setIsAdminModalOpen(true);
  };

  const handleClientGenerate = async () => {
    if (!selectedPrompt) return;
    
    if (selectedPrompt.imageRequirement === 'required' && !baseImageFile) {
      setError("Este prompt requiere obligatoriamente que subas una imagen base.");
      return;
    }
    if (!editedPromptText.trim()) {
      setError("El texto del prompt no puede estar vacío.");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      let baseImageUrl = "";
      if (baseImageFile && user) {
        const storageRef = ref(storage, `users/${user.uid}/base_images/${Date.now()}_${baseImageFile.name}`);
        await uploadBytes(storageRef, baseImageFile);
        baseImageUrl = await getDownloadURL(storageRef);
      }

      // Translate the edited text to English before sending to the model
      let textToTranslate = editedPromptText;
      try {
        const transRes = await fetch("/api/ai/translate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToTranslate })
        });
        if (transRes.ok) {
          const data = await transRes.json();
          textToTranslate = data.translation || textToTranslate;
        }
      } catch(e) {}

      // Midjourney/IA tools often expect the image URL directly inside the prompt text.
      const finalPromptText = baseImageUrl 
        ? `${baseImageUrl} ${textToTranslate}` 
        : textToTranslate;

      const payload = {
        promptText: finalPromptText,
        baseImageUrl, // still sending it just in case n8n needs to save it in DB
        templateId: selectedPrompt.id,
        email: user?.email,
        profileId: activeProfile?.id || "default",
        businessType: userDoc?.rubro || "",
        isCommercialPoster: selectedPrompt.isCommercialPoster || false
      };

      const res = await fetch("/api/ai/generate-from-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error en la respuesta del servidor al generar la imagen.");
      
      const data = await res.json();
      const returnedImageUrl = data.imageUrl || data.url || data.imgUrl || data[0]?.imageUrl || data[0]?.url || data[0]?.imgUrl;
      
      if (returnedImageUrl) {
        setGeneratedImage(returnedImageUrl);
      } else {
        setError("El prompt ha sido enviado exitosamente al webhook, pero no se retornó una imagen inmediata. Revisa tu biblioteca.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error inesperado al generar la imagen.");
    } finally {
      setIsGenerating(false);
    }
  };

  const useImageInPost = () => {
    if (!generatedImage) return;
    let url = `/automatizacion-rrss/panel/crear?templateUrl=${encodeURIComponent(generatedImage)}`;
    if (selectedPrompt?.isCommercialPoster) {
      url += "&isCommercial=true";
    }
    router.push(url);
  };

  const handleSetAsCover = async () => {
    if (!selectedPrompt || !generatedImage) return;
    try {
      const promptData = {
        title: selectedPrompt.title,
        description: selectedPrompt.description,
        category: selectedPrompt.category,
        prompt: selectedPrompt.prompt,
        imageRequirement: selectedPrompt.imageRequirement,
        isCommercialPoster: selectedPrompt.isCommercialPoster || false,
        previewUrl: generatedImage
      };
      
      await setDoc(doc(db, "prompt_library", selectedPrompt.id), promptData, { merge: true });
      
      setPromptTemplates(prev => prev.map(p => p.id === selectedPrompt.id ? { id: selectedPrompt.id, ...promptData } : p));
      
      showStatus("success", "Portada Actualizada", "¡Imagen establecida como portada de este template exitosamente!");
    } catch (e: any) {
      console.error(e);
      showStatus("error", "Error al actualizar portada", e.message || "Ocurrió un error inesperado.");
    }
  };

  // ════════════════════════════════════════════════════════
  // ADMIN FLOW
  // ════════════════════════════════════════════════════════
  const handleAdminSubmit = async (generateNewImage: boolean = true) => {
    if (!adminForm.title || !adminForm.prompt) {
      setAdminError("Título y Prompt son obligatorios.");
      return;
    }

    setAdminError("");
    setIsAdminGenerating(true);

    try {
      let finalImageUrl = existingPreviewUrl;

      if (generateNewImage || !finalImageUrl) {
        // Subir imagen base de prueba si existe
        let uploadedBaseImageUrl = "";
        if (adminBaseImageFile && user) {
          const storageRef = ref(storage, `users/${user.uid}/admin_prompts/${Date.now()}_${adminBaseImageFile.name}`);
          await uploadBytes(storageRef, adminBaseImageFile);
          uploadedBaseImageUrl = await getDownloadURL(storageRef);
        }

        // Reemplazar las variables con los valores de prueba antes de mandar a generar la imagen
        let previewPromptText = adminForm.prompt;
        adminParsedVariables.forEach(v => {
          const testValue = adminVariableValues[v.raw] || v.example;
          previewPromptText = previewPromptText.replaceAll(`[${v.raw}]`, testValue);
        });

        // TRANSLATE TO ENGLISH AT GENERATION TIME
        try {
          const transRes = await fetch("/api/ai/translate", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: previewPromptText })
          });
          if (transRes.ok) {
            const data = await transRes.json();
            previewPromptText = data.translation || previewPromptText;
          }
        } catch(e) {}

        if (uploadedBaseImageUrl) {
          previewPromptText = `${uploadedBaseImageUrl} ${previewPromptText}`;
        }

        // 1. Generar la imagen de Preview usando el webhook actual de generacion
        const payload = {
          promptText: previewPromptText,
          baseImageUrl: uploadedBaseImageUrl,
          templateId: editingPromptId || "",
          email: user?.email,
          profileId: "admin_seed",
          businessType: userDoc?.rubro || "Generación de Plantillas",
          isCommercialPoster: adminForm.isCommercialPoster || false
        };

        const res = await fetch("/api/ai/generate-from-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Fallo al generar imagen de preview en n8n.");
        
        const data = await res.json();
        const returnedImageUrl = data.imageUrl || data.url || data.imgUrl || data[0]?.imageUrl || data[0]?.url || data[0]?.imgUrl;
        
        if (!returnedImageUrl) {
          throw new Error("n8n no retornó una URL de imagen válida para el preview.");
        }
        finalImageUrl = returnedImageUrl;
      }

      // 2. Guardar en Firestore
      const promptData = {
        title: adminForm.title,
        description: adminForm.description,
        category: adminForm.category,
        prompt: adminForm.prompt,
        imageRequirement: adminForm.imageRequirement,
        isCommercialPoster: adminForm.isCommercialPoster,
        previewUrl: finalImageUrl
      };

      if (editingPromptId) {
        // Usamos setDoc con merge por si estamos editando una plantilla hardcodeada por primera vez
        await setDoc(doc(db, "prompt_library", editingPromptId), promptData, { merge: true });
        setPromptTemplates(prev => prev.map(p => p.id === editingPromptId ? { id: editingPromptId, ...promptData } : p));
        showStatus("success", "Plantilla Actualizada", "¡Plantilla actualizada con éxito en la biblioteca!");
      } else {
        const docRef = await addDoc(collection(db, "prompt_library"), promptData);
        setPromptTemplates([{ id: docRef.id, ...promptData }, ...promptTemplates]);
        showStatus("success", "Plantilla Guardada", "¡Plantilla guardada con éxito en la biblioteca de prompts!");
      }
      
      setIsAdminModalOpen(false);
      setEditingPromptId(null);
      setExistingPreviewUrl(null);
      setAdminBaseImageFile(null);
      setAdminForm({
        title: "",
        description: "",
        category: promptCategories[0],
        prompt: "",
        imageRequirement: "optional",
        isCommercialPoster: false

      });
    } catch (err: any) {
      console.error(err);
      setAdminError(err.message || "Error al crear la plantilla.");
    } finally {
      setIsAdminGenerating(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 flex items-center gap-3">
            <span className="text-4xl">✨</span> Biblioteca de Prompts IA
          </h1>
          <p className="text-slate-600 font-medium max-w-2xl">
            Explora nuestra colección de instrucciones predefinidas optimizadas para IA. Selecciona una, edítala libremente y genera imágenes de altísima calidad en segundos.
          </p>
        </div>
        {isAdminUser && (
          <button 
            onClick={() => setIsAdminModalOpen(true)}
            className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2"
          >
            + Añadir Nuevo Prompt
          </button>
        )}
      </div>

      {/* Search Bar & Category Chips */}
      <div className="space-y-4 mb-8">
        {/* Barra de búsqueda y contador */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, estilo o descripción..."
              className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="text-xs font-bold text-slate-500 self-end sm:self-center">
            {filteredPrompts.length} {filteredPrompts.length === 1 ? 'plantilla encontrada' : 'plantillas encontradas'}
          </div>
        </div>

        {/* Categorías en Chips Multi-línea (flex-wrap 100% visibles) */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeCategory === "all"
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
            }`}
          >
            <span>Todos los Estilos</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeCategory === "all" ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {categoryCounts.all || 0}
            </span>
          </button>

          {promptCategories.map(cat => {
            const count = categoryCounts[cat] || 0;
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-500/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
                }`}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompts Grid */}
      {loadingPrompts ? (
        <div className="text-center py-20 text-slate-400 font-bold">Cargando biblioteca...</div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <span className="text-4xl mb-4 block">👻</span>
          <h3 className="text-lg font-bold text-slate-700">No hay prompts en esta categoría</h3>
          <p className="text-slate-500 text-sm mt-2">Pronto añadiremos más estilos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map(prompt => (
            <div key={prompt.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all hover:border-indigo-200 flex flex-col group">
              {/* Imagen limpia de preview - Abre Lightbox Modal al hacer clic */}
              <div 
                onClick={() => setPreviewLightbox({ url: prompt.previewUrl, title: prompt.title, category: prompt.category, prompt })}
                className="relative h-60 w-full overflow-hidden bg-slate-950 flex items-center justify-center cursor-zoom-in group/img"
                title="Clic para ampliar imagen"
              >
                <img 
                  src={prompt.previewUrl} 
                  alt={prompt.title} 
                  className="max-w-full max-h-full object-contain group-hover/img:scale-105 transition-transform duration-500" 
                />
                <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1">
                  🔍 Ampliar
                </div>
              </div>

              {/* Contenido y badges organizados debajo de la imagen */}
              <div className="p-5 flex-1 flex flex-col">
                {/* Barra de etiquetas y acciones */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                      {prompt.category}
                    </span>
                    {prompt.imageRequirement === 'required' && (
                      <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1" title="Requiere subir imagen base">
                        📷 Requiere Base
                      </span>
                    )}
                    {prompt.imageRequirement === 'optional' && (
                      <span className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1" title="Permite subir imagen base opcional">
                        🖼️ Img2Img
                      </span>
                    )}
                    {prompt.isCommercialPoster && (
                      <span className="bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1" title="Cartel publicitario">
                        🏷️ Cartel
                      </span>
                    )}
                  </div>

                  {isAdminUser && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditPrompt(prompt); }}
                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg transition-all text-xs flex items-center justify-center shadow-sm"
                        title="Editar Plantilla"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePrompt(prompt.id); }}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-lg transition-all text-xs flex items-center justify-center shadow-sm"
                        title="Eliminar Plantilla"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-base font-black text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-1">{prompt.title}</h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 font-medium leading-relaxed">{prompt.description}</p>
                
                <div className="mt-auto pt-2">
                  <button 
                    onClick={() => openPromptModal(prompt)}
                    className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-xs"
                  >
                    <span>✨</span> Usar Plantilla
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================
          CLIENT GENERATION MODAL
          ========================================================= */}
      {isModalOpen && selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="text-2xl">✨</span> {selectedPrompt.title}
              </h2>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">✕</button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {!generatedImage ? (
                <>
                  {parsedVariables.length > 0 && !isFreeEditMode ? (
                    <div className="space-y-4 mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black uppercase tracking-wider text-indigo-700">1. Completa los Datos</h3>
                        <button 
                          onClick={() => setIsFreeEditMode(true)}
                          className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline"
                        >
                          Cambiar a Edición Libre
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {parsedVariables.map(v => (
                          <div key={v.raw}>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">{v.name}</label>
                            <input 
                              type="text"
                              value={variableValues[v.raw] || ""}
                                onChange={(e) => {
                                  const newVals = { ...variableValues, [v.raw]: e.target.value };
                                  setVariableValues(newVals);
                                  
                                  // Recompute the prompt
                                  let newText = selectedPrompt!.prompt;
                                  parsedVariables.forEach(pv => {
                                    // Si el usuario no ingresa valor, intentamos usar el ejemplo o lo dejamos intacto
                                    const valToUse = newVals[pv.raw] || pv.example;
                                    if (valToUse) {
                                      newText = newText.replaceAll(`[${pv.raw}]`, valToUse);
                                    }
                                  });
                                  setEditedPromptText(newText);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm"
                                placeholder={`Ej. ${v.example}`}
                              />
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">Vista Previa del Prompt:</label>
                          <div className="text-xs text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200 font-mono whitespace-pre-wrap">
                            {editedPromptText}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">1. Edita tu Prompt Libremente</h3>
                        {parsedVariables.length > 0 && (
                          <button 
                            onClick={() => {
                              // Reset back to guided
                              setEditedPromptText(selectedPrompt!.prompt);
                              const initialValues: Record<string, string> = {};
                              parsedVariables.forEach(v => initialValues[v.raw] = "");
                              setVariableValues(initialValues);
                              setIsFreeEditMode(false);
                            }}
                            className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline"
                          >
                            Volver a Modo Guiado
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-4 font-medium">Puedes reescribir todo lo que necesites. Este texto solo se usará para tu generación y no afectará la plantilla base.</p>
                      <textarea 
                        rows={6}
                        value={editedPromptText}
                        onChange={(e) => setEditedPromptText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors custom-scrollbar resize-none"
                      />
                    </div>
                  )}

                  {selectedPrompt.imageRequirement !== 'none' && (
                    <div className="pt-4 border-t border-slate-100">
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-2">
                        2. Imagen Base (Image-to-Image)
                        {selectedPrompt.imageRequirement === 'required' ? (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Requerido</span>
                        ) : (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Opcional</span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mb-4">Sube un boceto o foto base para guiar a la IA.</p>
                      
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${baseImagePreview ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                      >
                        {baseImagePreview ? (
                          <div className="flex flex-col items-center">
                            <img src={baseImagePreview} alt="Preview" className="h-32 object-contain rounded-lg shadow-sm mb-3" />
                            <span className="text-xs font-bold text-indigo-600">Cambiar Imagen</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-slate-400">
                            <span className="text-3xl mb-2">📸</span>
                            <span className="text-sm font-bold text-slate-600">Haz clic para subir tu imagen base</span>
                          </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-200">
                      {error}
                    </div>
                  )}

                  <div className="pt-6">
                    <button 
                      onClick={handleClientGenerate}
                      disabled={isGenerating}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-lg active:scale-98"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generando Magia...
                        </>
                      ) : (
                        <>🪄 Generar Imagen con IA</>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">¡Imagen Generada!</h3>
                  <div className="rounded-2xl overflow-hidden shadow-xl mb-8 bg-slate-100 inline-block border border-slate-200">
                    <img src={generatedImage} alt="Generada" className="max-h-80 w-auto object-contain" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button 
                      onClick={useImageInPost}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                    >
                      ✍️ Usar en Nuevo Post
                    </button>
                    {isAdminUser && (
                      <button 
                        onClick={handleSetAsCover}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-slate-800/30 transition-all active:scale-95"
                        title="Actualizar la foto de ejemplo de esta plantilla"
                      >
                        🖼️ Guardar como Portada
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ADMIN CREATION MODAL
          ========================================================= */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => !isAdminGenerating && setIsAdminModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-slate-950 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                {editingPromptId ? "✏️ Editar Prompt" : "👑 Añadir Nuevo Prompt"}
              </h2>
              <button disabled={isAdminGenerating} onClick={() => { setIsAdminModalOpen(false); setEditingPromptId(null); setExistingPreviewUrl(null); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">✕</button>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Título del Prompt</label>
                  <input 
                    type="text" 
                    value={adminForm.title}
                    onChange={(e) => setAdminForm({...adminForm, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
                    placeholder="Ej. Fotorealismo Producto"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Categoría</label>
                  <select 
                    value={adminForm.category}
                    onChange={(e) => setAdminForm({...adminForm, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    {promptCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Descripción Corta</label>
                <input 
                  type="text" 
                  value={adminForm.description}
                  onChange={(e) => setAdminForm({...adminForm, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
                  placeholder="Ej. Ideal para destacar productos de e-commerce..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Requisito de Imagen Base</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                    <input type="radio" checked={adminForm.imageRequirement === 'none'} onChange={() => setAdminForm({...adminForm, imageRequirement: 'none'})} /> Ninguno
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                    <input type="radio" checked={adminForm.imageRequirement === 'optional'} onChange={() => setAdminForm({...adminForm, imageRequirement: 'optional'})} /> Opcional
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                    <input type="radio" checked={adminForm.imageRequirement === 'required'} onChange={() => setAdminForm({...adminForm, imageRequirement: 'required'})} /> Requerido
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700">
                  <input 
                    type="checkbox" 
                    checked={adminForm.isCommercialPoster} 
                    onChange={(e) => setAdminForm({...adminForm, isCommercialPoster: e.target.checked})} 
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  /> 
                  ¿Es un Cartel Comercial?
                </label>
                <p className="text-[10px] text-slate-400 mt-1 pl-6">Si se marca, la imagen generada le indicará al creador de posts que está haciendo un cartel comercial.</p>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 gap-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Texto del Prompt
                    <span className="text-[10px] text-slate-400 font-normal ml-2">Usa [CORCHETES] para variables</span>
                  </label>
                  <button 
                    onClick={handleAutoFormatPrompt}
                    disabled={isFormattingPrompt || !adminForm.prompt.trim()}
                    className="text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors flex items-center justify-center gap-1 w-full sm:w-auto"
                    title="Pega el prompt en inglés y deja que la IA detecte las variables y traduzca textos al español"
                  >
                    {isFormattingPrompt ? (
                      <>
                        <div className="w-3 h-3 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      <>✨ Optimizar con IA</>
                    )}
                  </button>
                </div>
                <textarea 
                  rows={4}
                  value={adminForm.prompt}
                  onChange={(e) => setAdminForm({...adminForm, prompt: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 custom-scrollbar resize-none"
                  placeholder="Commercial photography of a [PRODUCTO]..."
                />
              </div>

              {(adminParsedVariables.length > 0 || adminForm.imageRequirement !== 'none') && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-indigo-700 mb-3">
                    Valores de Prueba (Para generar el Preview)
                  </h4>

                  {adminForm.imageRequirement !== 'none' && (
                    <div className="mb-4">
                      <label className="block text-[10px] font-bold text-indigo-600 mb-1">
                        Imagen Base {adminForm.imageRequirement === 'required' ? '(Requerida)' : '(Opcional)'}
                      </label>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setAdminBaseImageFile(e.target.files[0]);
                          } else {
                            setAdminBaseImageFile(null);
                          }
                        }}
                        className="w-full text-xs text-slate-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                      />
                    </div>
                  )}

                  {adminParsedVariables.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {adminParsedVariables.map(v => (
                        <div key={v.raw}>
                          <label className="block text-[10px] font-bold text-indigo-600 mb-1">{v.name}</label>
                        <input 
                          type="text"
                          value={adminVariableValues[v.raw] || ""}
                          onChange={(e) => setAdminVariableValues({...adminVariableValues, [v.raw]: e.target.value})}
                          className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-400 shadow-sm"
                          placeholder={`Ej. ${v.example}`}
                        />
                      </div>
                    ))}
                  </div>
                  )}
                  
                  {/* REAL-TIME PREVIEW BLOCK */}
                  <div className="mt-4 pt-4 border-t border-indigo-100">
                    <label className="block text-xs font-bold text-indigo-700 mb-1.5">Vista Previa del Prompt Final:</label>
                    <div className="text-xs text-indigo-900 bg-white p-3 rounded-lg border border-indigo-100 font-mono whitespace-pre-wrap">
                      {(() => {
                        let previewText = adminForm.prompt;
                        adminParsedVariables.forEach(v => {
                          const valToUse = adminVariableValues[v.raw] || v.example || `[${v.raw}]`;
                          previewText = previewText.replaceAll(`[${v.raw}]`, valToUse);
                        });
                        return previewText;
                      })()}
                    </div>
                  </div>

                  <p className="text-[10px] text-indigo-500 mt-3 font-medium">Estos valores solo se usarán una vez para crear la imagen de ejemplo de la tarjeta. No se guardarán en la plantilla.</p>
                </div>
              )}

              {adminError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-bold border border-red-200">
                  {adminError}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  onClick={() => {
                    setIsAdminModalOpen(false);
                    setEditingPromptId(null);
                    setExistingPreviewUrl(null);
                  }}
                  disabled={isAdminGenerating}
                  className="px-5 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl order-last sm:order-first"
                >
                  Cancelar
                </button>
                {editingPromptId ? (
                  <>
                    <button 
                      onClick={() => handleAdminSubmit(false)}
                      disabled={isAdminGenerating}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2"
                    >
                      {isAdminGenerating ? "Guardando..." : "💾 Guardar (Conservar Imagen)"}
                    </button>
                    <button 
                      onClick={() => handleAdminSubmit(true)}
                      disabled={isAdminGenerating}
                      className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2"
                    >
                      {isAdminGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>🪄 Regenerar Imagen y Guardar</>
                      )}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleAdminSubmit(true)}
                    disabled={isAdminGenerating}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 justify-center"
                  >
                    {isAdminGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generando y Guardando...
                      </>
                    ) : (
                      <>Generar Preview y Guardar</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PREVISUALIZACIÓN DE IMAGEN (LIGHTBOX) */}
      {previewLightbox && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewLightbox(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-900 rounded-3xl p-4 md:p-6 shadow-2xl border border-slate-700 flex flex-col items-center overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800 px-2">
              <div className="flex items-center gap-3">
                <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                  {previewLightbox.category}
                </span>
                <h3 className="text-sm md:text-base font-bold text-white line-clamp-1">{previewLightbox.title}</h3>
              </div>
              <button 
                onClick={() => setPreviewLightbox(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-sm font-bold"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Imagen Grande */}
            <div className="p-2 flex items-center justify-center max-h-[65vh] w-full overflow-hidden">
              <img 
                src={previewLightbox.url} 
                alt={previewLightbox.title} 
                className="max-h-[60vh] max-w-full object-contain rounded-2xl shadow-xl"
              />
            </div>

            {/* Footer con Acciones */}
            <div className="w-full pt-4 mt-2 border-t border-slate-800 flex items-center justify-between px-2 gap-4">
              <span className="text-xs text-slate-400 hidden sm:inline">Vista previa en alta resolución</span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setPreviewLightbox(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    const p = previewLightbox.prompt;
                    setPreviewLightbox(null);
                    openPromptModal(p);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <span>✨</span> Usar esta Plantilla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS MODAL MODERNO */}
      <StatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        confirmText={statusModal.confirmText}
        cancelText={statusModal.cancelText}
        onConfirm={() => {
          if (statusModal.onConfirm) statusModal.onConfirm();
          if (statusModal.type !== "confirm") {
            setStatusModal(prev => ({ ...prev, isOpen: false }));
          }
        }}
        onCancel={() => {
          if (statusModal.onCancel) statusModal.onCancel();
          setStatusModal(prev => ({ ...prev, isOpen: false }));
        }}
      />

    </div>
  );
}

// Trigger CI build
