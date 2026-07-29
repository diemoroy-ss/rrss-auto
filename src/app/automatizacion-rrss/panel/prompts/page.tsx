"use client";

import { useState, useEffect, useRef } from "react";
import { auth, storage, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { promptTemplates, promptCategories, PromptTemplate } from "../../../../data/promptLibrary";
import { useProfile } from "../../../../contexts/ProfileContext";
import { useRouter } from "next/navigation";

export default function PromptsLibraryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userDoc, setUserDoc] = useState<any>(null);
  const { activeProfile } = useProfile();
  
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [baseImageFile, setBaseImageFile] = useState<File | null>(null);
  const [baseImagePreview, setBaseImagePreview] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    return () => unsub();
  }, []);

  const filteredPrompts = activeCategory === "all" 
    ? promptTemplates 
    : promptTemplates.filter(p => p.category === activeCategory);

  const openPromptModal = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setVariableValues({});
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

  const handleGenerate = async () => {
    if (!selectedPrompt) return;
    
    // Check required variables
    for (const variable of selectedPrompt.variables) {
      if (!variableValues[variable] || variableValues[variable].trim() === "") {
        setError(`Por favor completa el campo: ${variable}`);
        return;
      }
    }

    if (selectedPrompt.imageRequirement === 'required' && !baseImageFile) {
      setError("Este prompt requiere obligatoriamente que subas una imagen base.");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      // 1. Reemplazar variables en el prompt
      let finalPromptText = selectedPrompt.prompt;
      for (const variable of selectedPrompt.variables) {
        const regex = new RegExp(`\\[${variable}\\]`, 'g');
        finalPromptText = finalPromptText.replace(regex, variableValues[variable]);
      }

      // 2. Subir imagen base si existe
      let baseImageUrl = "";
      if (baseImageFile && user) {
        const storageRef = ref(storage, `users/${user.uid}/base_images/${Date.now()}_${baseImageFile.name}`);
        await uploadBytes(storageRef, baseImageFile);
        baseImageUrl = await getDownloadURL(storageRef);
      }

      // 3. Enviar al endpoint proxy
      const payload = {
        promptText: finalPromptText,
        baseImageUrl,
        templateId: selectedPrompt.id,
        email: user?.email,
        profileId: activeProfile?.id || "default",
        businessType: userDoc?.rubro || ""
      };

      const res = await fetch("/api/ai/generate-from-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Error en la respuesta del servidor al generar la imagen.");
      
      const data = await res.json();
      
      // Asumimos que n8n retorna la URL de la imagen en data.imageUrl o data.url (ajustar según webhook real)
      const returnedImageUrl = data.imageUrl || data.url || data[0]?.imageUrl || data[0]?.url;
      
      if (returnedImageUrl) {
        setGeneratedImage(returnedImageUrl);
      } else {
        // Fallback or show success message if webhook operates async without returning image URL
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
    router.push(`/automatizacion-rrss/panel/crear?templateUrl=${encodeURIComponent(generatedImage)}`);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-3 flex items-center gap-3">
          <span className="text-4xl">✨</span> Biblioteca de Prompts IA
        </h1>
        <p className="text-slate-600 font-medium max-w-2xl">
          Explora nuestra colección de instrucciones predefinidas optimizadas para IA. Rellena los espacios en blanco, opcionalmente usa una de tus fotos como base (Image-to-Image) y genera imágenes de altísima calidad en segundos.
        </p>
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto hide-scrollbar space-x-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl max-w-full">
        <button
          onClick={() => setActiveCategory("all")}
          className={`shrink-0 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeCategory === "all" ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Todos los Estilos
        </button>
        {promptCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeCategory === cat ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrompts.map(prompt => (
          <div key={prompt.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all hover:border-indigo-200 flex flex-col group">
            <div className="relative h-48 w-full overflow-hidden bg-slate-100">
              <img src={prompt.previewUrl} alt={prompt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-white/90 backdrop-blur text-indigo-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm">
                  {prompt.category}
                </span>
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                {prompt.imageRequirement === 'required' && (
                  <span className="bg-amber-100/90 backdrop-blur text-amber-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm border border-amber-200" title="Requiere subir imagen base">
                    📷 Requiere Base
                  </span>
                )}
                {prompt.imageRequirement === 'optional' && (
                  <span className="bg-blue-100/90 backdrop-blur text-blue-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm border border-blue-200" title="Permite subir imagen base opcional">
                    🖼️ Soporta Img2Img
                  </span>
                )}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-lg font-black text-slate-900 mb-2">{prompt.title}</h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2 font-medium">{prompt.description}</p>
              
              <div className="mt-auto">
                <div className="text-[10px] font-bold text-slate-400 mb-3 flex flex-wrap gap-1">
                  Variables: {prompt.variables.map(v => (
                    <span key={v} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">[{v}]</span>
                  ))}
                </div>
                <button 
                  onClick={() => openPromptModal(prompt)}
                  className="w-full bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold py-2.5 rounded-xl transition-colors"
                >
                  Usar Plantilla
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Generation Modal */}
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
                  {/* Variables Form */}
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4">1. Completa las Variables</h3>
                    <div className="space-y-4">
                      {selectedPrompt.variables.map(variable => (
                        <div key={variable}>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">{variable.replace(/_/g, ' ')}</label>
                          <input 
                            type="text" 
                            placeholder={`Ej: ${variable === 'PRODUCTO' ? 'Zapatillas deportivas' : 'Ciudad futurista'}`}
                            value={variableValues[variable] || ""}
                            onChange={(e) => setVariableValues(prev => ({ ...prev, [variable]: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Base Image Upload (If required or optional) */}
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
                      <p className="text-xs text-slate-500 mb-4">Sube un boceto, un render preliminar o una foto para que la IA la tome como guía y respete su estructura.</p>
                      
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
                            <span className="text-xs mt-1">PNG, JPG hasta 5MB</span>
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
                      onClick={handleGenerate}
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
                    <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">Esta acción enviará la petición al webhook de IA y consumirá créditos.</p>
                  </div>
                </>
              ) : (
                /* Success View */
                <div className="text-center animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                    ✓
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">¡Imagen Generada!</h3>
                  <p className="text-slate-500 text-sm mb-6">Tu nueva imagen está lista para brillar en tus redes sociales.</p>
                  
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
                    <a 
                      href={generatedImage}
                      download="generada_ia.jpg"
                      target="_blank"
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-xl shadow-sm transition-all active:scale-95 text-center"
                    >
                      ⬇️ Descargar Imagen
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
