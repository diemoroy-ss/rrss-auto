"use client";

import { useState, useEffect, useRef } from "react";
import { auth, storage, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useProfile } from "../../../../contexts/ProfileContext";
import { useRouter } from "next/navigation";

export type ImageRequirement = 'none' | 'optional' | 'required';

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  previewUrl: string;
  imageRequirement: ImageRequirement;
  isCommercialPoster?: boolean;
}

export const promptCategories = [
  "Fotorealismo",
  "Ilustración 3D",
  "Minimalista",
  "Arte Conceptual",
  "Cyberpunk",
  "Producto (E-commerce)",
  "Estilos Técnicos",
  "Diseño y 3D",
  "Artísticos y Creativos",
  "Publicidad y Ads",
  "Editorial y Revista",
];

export const HARDCODED_STYLES: PromptTemplate[] = [
  {
    id: "style-exploded",
    title: "Exploded View (Vista despiezada)",
    description: "Muestra un objeto desarmado con todas sus piezas flotando en orden para ver cómo se conectan por dentro.",
    category: "Estilos Técnicos",
    prompt: "A highly detailed exploded view of [Objeto a despiezar:ej. un motor de automóvil], showing all individual components floating in perfect order, technical illustration style, precise spacing, 8k resolution, clean background.",
    previewUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-blueprint",
    title: "Blueprint (Plano técnico)",
    description: "Dibuja esquemas con líneas blancas o celestes sobre un fondo azul oscuro, estilo arquitectura o ingeniería.",
    category: "Estilos Técnicos",
    prompt: "A classic architectural blueprint of [Estructura u objeto:ej. un cohete espacial], white and light blue technical lines on a dark navy blue background, precise measurements, drafting aesthetic, engineering schematic.",
    previewUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-anatomy",
    title: "Cross-section (Corte transversal)",
    description: "Corta un objeto a la mitad para mostrar sus capas y su interior con precisión.",
    category: "Estilos Técnicos",
    prompt: "A detailed cross-section anatomy of [Objeto o sujeto:ej. un volcán en erupción], cut in half revealing the intricate inner layers and internal structures, educational textbook illustration, hyper-detailed.",
    previewUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-isometric",
    title: "Isometric 3D",
    description: "Presenta escenarios en un ángulo de 3/4, aspecto limpio tipo maqueta o videojuego de estrategia.",
    category: "Diseño y 3D",
    prompt: "An isometric 3D render of [Escenario:ej. una pequeña cafetería acogedora], clean miniature diorama style, smooth lighting, tilt-shift effect, strategy game aesthetic, colorful, highly detailed.",
    previewUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-wireframe",
    title: "Wireframe (Malla de alambre)",
    description: "Forma figuras usando solo líneas y puntos geométricos. Muestra la estructura digital básica.",
    category: "Diseño y 3D",
    prompt: "A glowing 3D digital wireframe of [Objeto:ej. un automóvil deportivo], made of geometric neon lines and points on a dark background, cyberpunk structure, cyber grid, tech aesthetic.",
    previewUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-lowpoly",
    title: "Low Poly",
    description: "Construye la imagen con pocos triángulos y figuras geométricas simples. Aspecto retro o minimalista.",
    category: "Diseño y 3D",
    prompt: "A beautiful low poly 3D rendering of [Escenario o sujeto:ej. un paisaje de montañas al atardecer], constructed with simple geometric triangles and facets, minimalist flat shading, retro computer graphics style, pastel colors.",
    previewUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-papercraft",
    title: "Papercraft (Arte en papel)",
    description: "Hace que todo parezca hecho a mano con recortes de papel de colores doblados y superpuestos.",
    category: "Artísticos y Creativos",
    prompt: "A beautiful papercraft illustration of [Escenario o sujeto:ej. un bosque mágico con hadas], made entirely of layered and folded colorful paper cutouts, drop shadows, tactile texture, handmade origami aesthetic.",
    previewUrl: "https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-doubleexp",
    title: "Double Exposure",
    description: "Mezcla dos fotos en una sola figura, por ejemplo, una silueta que por dentro muestra un paisaje.",
    category: "Artísticos y Creativos",
    prompt: "A cinematic double exposure photography combining the silhouette of [Sujeto principal:ej. un oso pardo] and a beautiful [Escena interior:ej. bosque nevado], seamlessly blended, surreal, artistic poster, dramatic lighting.",
    previewUrl: "https://images.unsplash.com/photo-1552337651-70ef24194098?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-claymation",
    title: "Claymation (Arcilla)",
    description: "Personajes y objetos modelados con plastilina o arcilla, estilo stop-motion.",
    category: "Artísticos y Creativos",
    prompt: "A cute claymation 3D render of [Sujeto:ej. un pingüino bebiendo café], made of modeled plasticine, visible fingerprints on the clay, stop-motion animation style, tactile realistic texture, studio lighting.",
    previewUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    imageRequirement: "optional",
  },

  // ─── PUBLICIDAD Y ADS ────────────────────────────────────────────────────
  {
    id: "style-meta-ads",
    title: "Meta Ads / Creative Ad",
    description: "Convierte tu producto o imagen en un creativo publicitario listo para Facebook o Instagram Ads. Fondo limpio, composición centrada y alta retención visual.",
    category: "Publicidad y Ads",
    prompt: "A professional high-conversion social media advertisement creative featuring [Producto o servicio:ej. una crema facial hidratante] as the hero product, clean white or pastel gradient background, bold compositional framing, studio product lighting, premium feel, Facebook and Instagram ad format, photorealistic render, no text.",
    previewUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  },
  {
    id: "style-ads-lifestyle",
    title: "Ads Lifestyle (Producto en uso)",
    description: "Muestra tu producto siendo usado en un contexto real y aspiracional, perfecto para anuncios de lifestyle en redes sociales.",
    category: "Publicidad y Ads",
    prompt: "A cinematic lifestyle advertising photo of [Producto:ej. unas zapatillas deportivas], being used by a person in a natural aspirational setting, golden hour lighting, shallow depth of field, editorial fashion photography, magazine quality, vibrant colors, authentic and candid mood.",
    previewUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  },
  {
    id: "style-ads-hero-shot",
    title: "Hero Shot de Producto",
    description: "Toma tu imagen de producto y la transforma en una foto tipo campaña de marca: fondo dramático, iluminación premium y composición de alta atención.",
    category: "Publicidad y Ads",
    prompt: "A dramatic high-end hero product shot of [Producto:ej. una botella de perfume de lujo], cinematic studio lighting with colored gels, dark moody background, fine mist or smoke effect, luxury brand campaign aesthetics, ultra-sharp focus, 8k commercial photography.",
    previewUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  },
  {
    id: "style-product-explosion",
    title: "Product Explosion (Despiezado de Producto)",
    description: "Desensambla visualmente tu producto mostrando todos sus componentes flotando ordenados alrededor. Perfecto para resaltar calidad de ingredientes o materiales.",
    category: "Publicidad y Ads",
    prompt: "A stunning exploded product view of [Producto:ej. una cápsula de suplemento vitamínico], all individual ingredients and components floating symmetrically around the hero product on a clean white background, premium cosmetic or supplement brand aesthetic, macro photography style, commercial ad quality, no text.",
    previewUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  },

  // ─── EDITORIAL Y REVISTA ──────────────────────────────────────────────────
  {
    id: "style-magazine-cover",
    title: "Magazine Cover (Portada de Revista)",
    description: "Transforma tu foto en una portada de revista de alta gama. Composición editorial, iluminación de estudio y espacio reservado para título y subtítulos.",
    category: "Editorial y Revista",
    prompt: "A stunning [Tipo de revista:ej. Vogue] magazine cover featuring [Sujeto o producto:ej. una modelo en vestido rojo], professional editorial studio photography, dramatic high-contrast lighting, cover composition with negative space at the top for a masthead, premium fashion magazine aesthetic, glossy finish look, ultra-detailed.",
    previewUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  },
  {
    id: "style-magazine-spread",
    title: "Editorial Spread (Doble Página)",
    description: "Crea una composición editorial de doble página tipo revista de moda o lifestyle, con espacio para texto y un visual impactante como protagonista.",
    category: "Editorial y Revista",
    prompt: "A full bleed editorial magazine double-page spread featuring [Tema o sujeto:ej. colección de ropa de invierno], cinematic wide composition, moody or vibrant color grading depending on the subject, high fashion editorial photography, luxury lifestyle aesthetic, professional retouching, space reserved on one side for copy text.",
    previewUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  },
  {
    id: "style-brand-campaign",
    title: "Brand Campaign (Campaña de Marca)",
    description: "Genera un visual de campaña de marca completo: concepto, sujeto, mensaje visual y estética coherente de marca en una sola imagen.",
    category: "Publicidad y Ads",
    prompt: "A powerful [Marca o industria:ej. marca de ropa deportiva] brand campaign hero image featuring [Sujeto:ej. atleta corriendo en ciudad al amanecer], bold cinematic composition, brand color palette tones, inspirational mood, commercial campaign photography quality, wide-format billboard composition, dynamic motion blur, aspirational lifestyle.",
    previewUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  },
  {
    id: "style-everyday-real",
    title: "Toma Real y Cotidiana (UGC)",
    description: "Coloca tu producto en un entorno real, natural y casual, como si fuera una foto tomada por un cliente con su teléfono.",
    category: "Fotorealismo",
    prompt: "A highly realistic casual lifestyle photo of [Producto:ej. una lata de bebida], placed on a [Superficie:ej. mesa de madera rústica] in a [Entorno:ej. terraza soleada], next to [Acompañamiento:ej. un tazón con mangos frescos], natural daylight, candid everyday shot, authentic UGC style, shot on iPhone 14 Pro, photorealistic.",
    previewUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  },
  {
    id: "style-pro-studio-splash",
    title: "Sesión Profesional de Estudio",
    description: "Transforma una foto simple en una fotografía comercial de alta gama con iluminación dramática, condensación y elementos de fondo.",
    category: "Fotorealismo",
    prompt: "A high-end professional commercial studio photography of [Producto:ej. una lata de bebida], covered in fresh condensation water drops, resting on a wet dark surface, dramatic rim lighting, vibrant [Color de luz de fondo:ej. azul oscuro y dorado] background, premium advertising aesthetics, 8k resolution, macro lens.",
    previewUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  },
  {
    id: "style-newspaper-frontpage",
    title: "Portada de Periódico",
    description: "Integra tu producto como la noticia principal en la portada de un periódico impreso.",
    category: "Editorial y Revista",
    prompt: "A photorealistic mockup of a folded daily newspaper lying on a table, the main front page article features a large prominent photo of [Producto:ej. una lata de bebida energética], traditional newspaper layout with columns of text and headlines, morning news aesthetic, natural soft window lighting, highly detailed.",
    previewUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  },
  {
    id: "style-dynamic-ad-splash",
    title: "Arte Dinámico (Redes Sociales)",
    description: "Un diseño explosivo e impactante con salpicaduras y elementos volando, ideal para anuncios llamativos. Sin texto para agregarlo después.",
    category: "Publicidad y Ads",
    prompt: "An explosive and dynamic commercial product shot of [Producto:ej. una lata de bebida energética], surrounded by flying [Elementos voladores:ej. trozos de mango y hojas de menta], spectacular liquid splashes, vibrant high-contrast colors, dramatic studio lighting, extreme action freeze-frame, hyper-detailed 3D render style, clean background for typography, no text.",
    previewUrl: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  },
  {
    id: "style-3d-billboard",
    title: "Valla Publicitaria 3D (Times Square)",
    description: "Simula una espectacular valla publicitaria anamórfica 3D en una calle muy transitada estilo Times Square o Tokio.",
    category: "Publicidad y Ads",
    prompt: "An ultra-realistic nighttime photography of a giant anamorphic 3D digital billboard on a modern skyscraper building in a busy city like Times Square, the billboard displays a stunning glowing 3D render of [Producto:ej. una lata de bebida], the product appears to be popping out of the screen, neon lights, rainy street reflections, crowds of people walking below, cinematic cyberpunk city vibe, highly detailed.",
    previewUrl: "https://images.unsplash.com/photo-1555921015-5532091f6026?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  }
];

export default function PromptsLibraryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userDoc, setUserDoc] = useState<any>(null);
  const { activeProfile } = useProfile();
  
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);

  // Client Modal
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedPromptText, setEditedPromptText] = useState("");
  
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
      
      snapshot.forEach(doc => {
        loaded.push({ id: doc.id, ...doc.data() } as PromptTemplate);
        dbIds.add(doc.id);
      });
      
      // Añadir plantillas hardcodeadas solo si no fueron modificadas y guardadas en DB
      HARDCODED_STYLES.forEach(style => {
        if (!dbIds.has(style.id)) {
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

  const filteredPrompts = activeCategory === "all" 
    ? promptTemplates 
    : promptTemplates.filter(p => p.category === activeCategory);

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

  const handleDeletePrompt = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta plantilla?")) return;
    try {
      await deleteDoc(doc(db, "prompt_library", id));
      setPromptTemplates(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error("Error deleting", e);
    }
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
      
      alert("¡Imagen establecida como portada de este template exitosamente!");
    } catch (e: any) {
      console.error(e);
      alert("Error al actualizar portada: " + e.message);
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
        if (adminBaseImageFile) {
          const storageRef = ref(storage, `admin_prompts/${Date.now()}_${adminBaseImageFile.name}`);
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
          email: user?.email,
          profileId: "admin_seed",
          businessType: "Generación de Plantillas",
          isCommercialPoster: adminForm.isCommercialPoster
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
        alert("¡Plantilla actualizada con éxito!");
      } else {
        const docRef = await addDoc(collection(db, "prompt_library"), promptData);
        setPromptTemplates([{ id: docRef.id, ...promptData }, ...promptTemplates]);
        alert("¡Plantilla guardada con éxito!");
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
              <div className="relative h-64 w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                <img src={prompt.previewUrl} alt={prompt.title} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
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
                  {isAdminUser && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditPrompt(prompt); }}
                        className="bg-indigo-500/90 hover:bg-indigo-600 text-white backdrop-blur p-1.5 rounded-lg shadow-sm transition-colors text-xs flex items-center justify-center"
                        title="Editar Plantilla"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePrompt(prompt.id); }}
                        className="bg-red-500/90 hover:bg-red-600 text-white backdrop-blur p-1.5 rounded-lg shadow-sm transition-colors text-xs flex items-center justify-center"
                        title="Eliminar Plantilla"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-black text-slate-900 mb-2">{prompt.title}</h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 font-medium">{prompt.description}</p>
                
                <div className="mt-auto">
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

    </div>
  );
}

// Trigger CI build
