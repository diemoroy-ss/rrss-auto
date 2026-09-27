"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { auth, db, storage } from "../../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, updateDoc, getDocs, query, orderBy, limit, serverTimestamp, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { HARDCODED_STYLES, promptCategories, PromptTemplate } from "../../../../../lib/prompt-templates";
import {
  VIDEO_PROMPT_STYLES,
  videoPromptCategories,
  buildImageToVideoPrompt,
  VideoPromptTemplate
} from "../../../../../lib/video-prompt-templates";
import { createButterflyRender, compositeImageClient } from "../../../../../lib/image-compositor";
import { VideoComposition } from "../../../../../lib/video-poc-service";
import {
  FaWhatsapp,
  FaImage,
  FaVideo,
  FaUpload,
  FaCheck,
  FaMagic,
  FaCopy,
  FaEye,
  FaTrash,
  FaShareSquare,
  FaSearch,
  FaPlay,
  FaExternalLinkAlt,
  FaFilm,
  FaSlidersH,
  FaLayerGroup
} from "react-icons/fa";

// Importación dinámica para RemotionReelPlayer (pesado)
const RemotionReelPlayer = dynamic(() => import("../../../../../components/video/RemotionReelPlayer"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[9/16] max-w-[280px] mx-auto bg-slate-900 rounded-2xl flex flex-col items-center justify-center p-4 text-center text-slate-400 border border-slate-800">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p className="text-[11px] font-bold">Cargando reproductor Remotion...</p>
    </div>
  ),
});

interface ProspectDemo {
  id?: string;
  prospectName: string;
  prospectBusiness: string;
  prospectPhone: string;
  rubro: string;
  offerText: string;
  dishOrProductName?: string;
  generatedPostCaption?: string;
  baseImageUrl?: string;
  logoUrl?: string;
  logoPosition?: string;
  logoSize?: number;
  logoTransparent?: boolean;
  selectedStyleId?: string;
  selectedStyleTitle?: string;
  generatedImageUrl?: string;
  canvasImageUrl?: string;
  butterflyUrl?: string;
  remotionComposition?: VideoComposition;
  videoStyleTitle?: string;
  videoPromptEnglish?: string;
  generatedVideoUrl?: string;
  publicDemoUrl?: string;
  whatsappMessage?: string;
  createdAt?: any;
  status?: "borrador" | "generada" | "enviada";
}

const COMMON_NICHES = [
  { label: "Gastronomía & Restaurantes", icon: "🍕" },
  { label: "Salud, Dental & Médica", icon: "🩺" },
  { label: "Belleza, Barbería & Spa", icon: "💇" },
  { label: "Fitness, Gimnasio & Crossfit", icon: "🏋️" },
  { label: "Inmobiliaria & Propiedades", icon: "🏠" },
  { label: "Retail, Moda & Calzado", icon: "🛍️" },
  { label: "Servicios Profesionales & B2B", icon: "💼" },
  { label: "Automotriz & Talleres", icon: "🚗" },
  { label: "Turismo, Hotelería & Cabañas", icon: "✈️" },
  { label: "Educación & Cursos", icon: "🎓" },
];

const COUNTRY_CODES = [
  { code: "+56", label: "🇨🇱 Chile (+56)" },
  { code: "+54", label: "🇦🇷 Argentina (+54)" },
  { code: "+52", label: "🇲🇽 México (+52)" },
  { code: "+57", label: "🇨🇴 Colombia (+57)" },
  { code: "+51", label: "🇵🇪 Perú (+51)" },
  { code: "+34", label: "🇪🇸 España (+34)" },
  { code: "+1",  label: "🇺🇸 EE.UU. (+1)" },
];

const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";

export default function AdminMuestrasPage() {
  const router = useRouter();

  // Auth & Admin Guard
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Tabs de la página
  const [activeTab, setActiveTab] = useState<"crear" | "historial">("crear");

  // Paso 1: Datos del Prospecto
  const [prospectName, setProspectName] = useState("");
  const [prospectBusiness, setProspectBusiness] = useState("");
  const [countryCode, setCountryCode] = useState("+56");
  const [prospectPhone, setProspectPhone] = useState("");
  const [rubro, setRubro] = useState(COMMON_NICHES[0].label);
  const [offerText, setOfferText] = useState("");

  // Paso 2: Assets del Prospecto y Plato/Producto
  const [dishOrProductName, setDishOrProductName] = useState<string>("");
  const [baseImageFile, setBaseImageFile] = useState<File | null>(null);
  const [baseImagePreview, setBaseImagePreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoPosition, setLogoPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center">("top-right");
  const [logoSize, setLogoSize] = useState<number>(80);
  const [logoTransparent, setLogoTransparent] = useState<boolean>(false);
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);

  // Paso 3: Biblioteca de Prompts de Imágenes
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [allTemplates, setAllTemplates] = useState<PromptTemplate[]>(HARDCODED_STYLES);

  // Estado de Generación de Imagen (Fase 2)
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
  const [canvasImageUrl, setCanvasImageUrl] = useState<string>("");
  const [butterflyUrl, setButterflyUrl] = useState<string>("");
  const [activeImageVersion, setActiveImageVersion] = useState<"canvas" | "butterfly">("canvas");
  const [createdDemoId, setCreatedDemoId] = useState<string>("");
  const [customWhatsappCopy, setCustomWhatsappCopy] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Estado de Generación de Copy para Redes con Agentes
  const [generatedPostCaption, setGeneratedPostCaption] = useState<string>("");
  const [isGeneratingPostCaption, setIsGeneratingPostCaption] = useState<boolean>(false);
  const [copiedPostCaption, setCopiedPostCaption] = useState<boolean>(false);

  // Estado de Generación de Video (Fase 3: Remotion vs Biblioteca de Prompts)
  const [videoModality, setVideoModality] = useState<"remotion" | "prompt_library">("remotion");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [remotionComposition, setRemotionComposition] = useState<VideoComposition | null>(null);
  const [selectedVideoCategory, setSelectedVideoCategory] = useState<string>("Comercial");
  const [selectedVideoTemplate, setSelectedVideoTemplate] = useState<VideoPromptTemplate | null>(VIDEO_PROMPT_STYLES[0]);
  const [customVideoPrompt, setCustomVideoPrompt] = useState<string>("");
  const [customVideoSummary, setCustomVideoSummary] = useState<string>("");
  const [cameraNotes, setCameraNotes] = useState<string>("");
  const [externalVideoUrl, setExternalVideoUrl] = useState<string>("");
  const [copiedVideoPrompt, setCopiedVideoPrompt] = useState(false);

  // Estados de generación automática de video vía n8n
  const [n8nVideoRenderMode, setN8nVideoRenderMode] = useState<"raw" | "remotion">("raw");
  const [isGeneratingN8nVideo, setIsGeneratingN8nVideo] = useState(false);
  const [n8nVideoError, setN8nVideoError] = useState<string>("");
  const [n8nVideoProgress, setN8nVideoProgress] = useState<string>("");

  // Historial de Muestras
  const [historyDemos, setHistoryDemos] = useState<ProspectDemo[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Referencias a inputs de archivos
  const baseImageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Verificación estricta de Admin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      setCurrentUser(u);
      const email = (u.email || "").toLowerCase();
      try {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        const role = userDoc.data()?.role;
        const adminAllowed = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com"].includes(email) || role === "admin";
        if (!adminAllowed) {
          router.replace("/automatizacion-rrss/panel");
          return;
        }
        setIsAdmin(true);

        // Cargar estilos desde Firestore (igual que Biblioteca de Prompts)
        try {
          const snap = await getDocs(collection(db, "prompt_library"));
          const loaded: PromptTemplate[] = [];
          const dbIds = new Set<string>();
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            dbIds.add(docSnap.id);
            if (!data.isDeleted && data.title?.trim() && data.prompt?.trim()) {
              loaded.push({
                id: docSnap.id,
                ...data,
                // Firestore guarda previewImageUrl, el tipo usa previewUrl
                previewUrl: data.previewImageUrl || data.previewUrl || "",
              } as PromptTemplate);
            }
          });
          // Añadir HARDCODED_STYLES solo si no fueron modificados ni eliminados en Firestore
          HARDCODED_STYLES.forEach((style) => {
            if (!dbIds.has(style.id)) loaded.push(style);
          });
          setAllTemplates(loaded);
        } catch (err) {
          console.warn("No se pudo cargar prompt_library, usando estilos locales:", err);
        }
      } catch (err) {
        console.error("Error al validar rol admin:", err);
        router.replace("/automatizacion-rrss/panel");
      } finally {
        setLoadingAuth(false);
      }
    });
    return () => unsub();
  }, [router]);

  // Cargar Historial
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const q = query(collection(db, "admin_prospect_demos"), orderBy("createdAt", "desc"), limit(25));
      const snap = await getDocs(q);
      const list: ProspectDemo[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ProspectDemo);
      });
      setHistoryDemos(list);
    } catch (e) {
      console.warn("No se pudo cargar el historial de demos:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === "historial") {
      loadHistory();
    }
  }, [isAdmin, activeTab]);

  // Sincronizar el prompt de video cuando cambia el estilo seleccionado o los datos del negocio
  useEffect(() => {
    if (selectedVideoTemplate) {
      const offerOrDish = dishOrProductName.trim()
        ? `${dishOrProductName.trim()}${offerText.trim() ? ` (${offerText.trim()})` : ""}`
        : offerText.trim();

      const result = buildImageToVideoPrompt(selectedVideoTemplate, {
        businessName: prospectBusiness.trim(),
        rubro,
        offerText: offerOrDish,
      });
      setCustomVideoPrompt(result.promptEnglish);
      setCustomVideoSummary(result.promptSpanishSummary);
      setCameraNotes(result.cameraNotes);
    }
  }, [selectedVideoTemplate, prospectBusiness, rubro, offerText, dishOrProductName]);

  // Actualizar mensaje de WhatsApp con el enlace de la demo
  useEffect(() => {
    const namePart = prospectName.trim() ? `¡Hola ${prospectName.trim()}!` : "¡Hola!";
    const businessPart = prospectBusiness.trim() ? ` para ${prospectBusiness.trim()}` : "";
    const offerOrDish = dishOrProductName.trim()
      ? ` su especialidad "${dishOrProductName.trim()}"${offerText.trim() ? ` y la promo "${offerText.trim()}"` : ""}`
      : (offerText.trim() ? ` destacando "${offerText.trim()}"` : "");
    const offerPart = offerOrDish ? ` destacando${offerOrDish}` : "";

    const demoLink = createdDemoId ? `${PUBLIC_APP_URL}/m/${createdDemoId}` : (generatedImageUrl || "[ENLACE_DE_MUESTRA]");

    const defaultMsg = `${namePart} 👋 Estuve revisando lo que hacen en tu marca y le pedí a nuestro equipo de agentes que diseñara esta propuesta visual y de video exclusiva${businessPart}${offerPart}:

🚀 Puedes ver la muestra interactiva y el copy listo para publicar aquí:
${demoLink}

Diseñamos este contenido con su identidad para que veas la calidad y el impacto que tendrían sus redes semana a semana sin quitarte tiempo.

¿Qué te parece el estilo?`;

    setCustomWhatsappCopy(defaultMsg);
  }, [prospectName, prospectBusiness, offerText, dishOrProductName, generatedImageUrl, createdDemoId]);

  // Filtro de plantillas de imagen (combina Firestore + estilos locales)
  const filteredTemplates = allTemplates.filter((template) => {
    const matchCategory = selectedCategory === "Todas" || template.category === selectedCategory;
    const matchSearch =
      searchTerm.trim() === "" ||
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Manejo de carga de imagen base
  const handleBaseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBaseImageFile(file);
      setBaseImagePreview(URL.createObjectURL(file));
    }
  };

  // Manejo de carga de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // FASE 2: Generación de Imagen con Logo & Retoque (Butterfly Social + Canvas)
  const handleGenerateSample = async () => {
    if (!prospectBusiness.trim()) {
      alert("Por favor indica al menos el nombre del negocio o marca del prospecto.");
      return;
    }

    setIsGenerating(true);
    setIsUploadingAssets(true);

    try {
      let uploadedBaseImageUrl = baseImagePreview;
      let uploadedLogoUrl = logoPreview;

      // 1. Subir imagen base a Storage si fue seleccionada
      if (baseImageFile && currentUser?.uid) {
        const baseRef = ref(storage, `admin_demos/base_${Date.now()}_${baseImageFile.name}`);
        const snap = await uploadBytes(baseRef, baseImageFile);
        uploadedBaseImageUrl = await getDownloadURL(snap.ref);
      }

      // 2. Subir logo a Storage si fue seleccionado
      if (logoFile && currentUser?.uid) {
        const logoRef = ref(storage, `admin_demos/logo_${Date.now()}_${logoFile.name}`);
        const snap = await uploadBytes(logoRef, logoFile);
        uploadedLogoUrl = await getDownloadURL(snap.ref);
      }

      setIsUploadingAssets(false);

      // 3. Determinar imagen base
      let rawBaseUrl = uploadedBaseImageUrl;
      if (!rawBaseUrl) {
        if (selectedTemplate?.previewUrl) {
          rawBaseUrl = selectedTemplate.previewUrl;
        } else {
          const fallbackSeed = Math.floor(Math.random() * 100000);
          const dishPart = dishOrProductName.trim() ? `${dishOrProductName.trim()}, ` : "";
          const promptQuery = encodeURIComponent(`${dishPart}${rubro} commercial photography high quality professional lighting ${offerText}`);
          rawBaseUrl = `https://image.pollinations.ai/prompt/${promptQuery}?width=1080&height=1080&nologo=true&seed=${fallbackSeed}`;
        }
      }

      // 4. Composición Instantánea en Canvas (Cliente) con Marca de Agua Santisoft
      let localCanvasDataUrl = "";
      try {
        localCanvasDataUrl = await compositeImageClient({
          baseImageUrl: rawBaseUrl,
          logoUrl: uploadedLogoUrl || undefined,
          logoPosition,
          logoSize,
          logoTransparent,
          offerText: offerText.trim() || undefined,
          dishOrProductName: dishOrProductName.trim() || undefined,
          businessName: prospectBusiness.trim(),
          includeSantisoftWatermark: true,
        });
        setCanvasImageUrl(localCanvasDataUrl);
      } catch (canvasErr) {
        console.warn("Fallo composicion canvas client:", canvasErr);
        localCanvasDataUrl = rawBaseUrl;
      }

      // 5. Generar Retoque con Butterfly Social (vía preview_renders)
      let bUrl = "";
      try {
        const butterflyResult = await createButterflyRender({
          baseImageUrl: rawBaseUrl,
          logoUrl: uploadedLogoUrl || undefined,
          logoPosition,
          logoSize,
          logoTransparent,
          offerText: offerText.trim() || undefined,
          dishOrProductName: dishOrProductName.trim() || undefined,
          businessName: prospectBusiness.trim(),
          userId: currentUser?.uid || "admin",
          includeSantisoftWatermark: true,
        });
        bUrl = butterflyResult.butterflyUrl;
        setButterflyUrl(bUrl);
      } catch (bErr) {
        console.warn("Fallo Butterfly Social render:", bErr);
      }

      // La imagen principal seleccionada (Canvas por defecto para inmediatez, o Butterfly)
      const finalImage = localCanvasDataUrl || bUrl || rawBaseUrl;
      setGeneratedImageUrl(finalImage);
      setActiveImageVersion("canvas");

      // 6. Generar Copy para Redes con Agentes adaptado al Plato/Producto
      let finalPostCaption = generatedPostCaption;
      try {
        setIsGeneratingPostCaption(true);
        const copyRes = await fetch("/api/ai/prospect-copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: prospectBusiness.trim(),
            rubro,
            dishOrProductName: dishOrProductName.trim(),
            offerText: offerText.trim(),
            phone: `${countryCode}${prospectPhone.trim().replace(/^0+/, "")}`,
          }),
        });
        if (copyRes.ok) {
          const copyData = await copyRes.json();
          if (copyData.copy) {
            finalPostCaption = copyData.copy;
            setGeneratedPostCaption(finalPostCaption);
          }
        }
      } catch (copyErr) {
        console.warn("Fallo generación de copy con agentes:", copyErr);
      } finally {
        setIsGeneratingPostCaption(false);
      }

      // 7. Guardar en Firestore para historial y generar enlace público /m/[id]
      const docRef = await addDoc(collection(db, "admin_prospect_demos"), {
        prospectName: prospectName.trim(),
        prospectBusiness: prospectBusiness.trim(),
        prospectPhone: `${countryCode}${prospectPhone.trim().replace(/^0+/, "")}`,
        rubro,
        offerText: offerText.trim(),
        dishOrProductName: dishOrProductName.trim() || null,
        generatedPostCaption: finalPostCaption || null,
        baseImageUrl: uploadedBaseImageUrl || rawBaseUrl || null,
        logoUrl: uploadedLogoUrl || null,
        logoPosition,
        logoSize,
        logoTransparent,
        selectedStyleId: selectedTemplate?.id || null,
        selectedStyleTitle: selectedTemplate?.title || "Estándar Comercial",
        generatedImageUrl: finalImage,
        canvasImageUrl: localCanvasDataUrl || null,
        butterflyUrl: bUrl || null,
        videoStyleTitle: selectedVideoTemplate?.title || null,
        videoPromptEnglish: customVideoPrompt || null,
        createdAt: serverTimestamp(),
        status: "generada",
      });

      const demoId = docRef.id;
      setCreatedDemoId(demoId);
      await updateDoc(doc(db, "admin_prospect_demos", demoId), {
        publicDemoUrl: `${PUBLIC_APP_URL}/m/${demoId}`,
      });

    } catch (err: any) {
      console.error("Error al preparar la muestra:", err);
      alert("Hubo un detalle al procesar la muestra. Revisa la consola.");
    } finally {
      setIsGenerating(false);
      setIsUploadingAssets(false);
    }
  };

  // Regenerar copy individualmente con nuestros agentes
  const handleRegenerateCopy = async () => {
    if (!prospectBusiness.trim()) {
      alert("Por favor indica al menos el nombre del negocio para generar el copy.");
      return;
    }
    setIsGeneratingPostCaption(true);
    try {
      const copyRes = await fetch("/api/ai/prospect-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: prospectBusiness.trim(),
          rubro,
          dishOrProductName: dishOrProductName.trim(),
          offerText: offerText.trim(),
          phone: `${countryCode}${prospectPhone.trim().replace(/^0+/, "")}`,
        }),
      });
      if (copyRes.ok) {
        const copyData = await copyRes.json();
        if (copyData.copy) {
          setGeneratedPostCaption(copyData.copy);
          if (createdDemoId) {
            await updateDoc(doc(db, "admin_prospect_demos", createdDemoId), {
              generatedPostCaption: copyData.copy,
              dishOrProductName: dishOrProductName.trim() || null,
            });
          }
        }
      }
    } catch (err) {
      console.error("Error al regenerar copy con agentes:", err);
      alert("Hubo un detalle al regenerar el copy. Revisa la consola.");
    } finally {
      setIsGeneratingPostCaption(false);
    }
  };

  const handleCopyPostCaption = () => {
    if (generatedPostCaption && typeof window !== "undefined") {
      navigator.clipboard.writeText(generatedPostCaption);
      setCopiedPostCaption(true);
      setTimeout(() => setCopiedPostCaption(false), 2500);
    }
  };

  // FASE 3 - OPCIÓN A: Generar Reel Interactivo con Remotion
  const handleGenerateRemotionReel = async () => {
    if (!prospectBusiness.trim()) {
      alert("Por favor indica el nombre del negocio para generar el guión del Reel.");
      return;
    }

    setIsGeneratingVideo(true);

    try {
      const activeImg = generatedImageUrl || baseImagePreview || undefined;

      const comp: VideoComposition = {
        title: `Reel para ${prospectBusiness}`,
        rubro: rubro,
        totalDuration: 12,
        audioScript: `¿Buscas la mejor calidad en ${rubro}? En ${prospectBusiness} te ayudamos con ${
          offerText || "soluciones a tu medida"
        }. Escríbenos hoy y descubre todo lo que tenemos para ti.`,
        copyText: `${prospectBusiness} - ${offerText || "Calidad y excelencia garantizada"}. Contáctanos por WhatsApp para más información.`,
        scenes: [
          {
            id: "scene-1",
            duration: 4,
            title: prospectBusiness.toUpperCase(),
            subtitle: `¿Buscas la mejor opción en ${rubro}?`,
            highlightWords: [prospectBusiness.toUpperCase(), "opción"],
            gradientBg: "from-indigo-950 via-slate-900 to-slate-950",
            textColor: "#ffffff",
            accentColor: "#6366f1",
            bgImageUrl: activeImg,
          },
          {
            id: "scene-2",
            duration: 4,
            title: offerText ? offerText.toUpperCase() : "ATENCIÓN PROFESIONAL",
            subtitle: offerText ? `Aprovecha hoy: ${offerText}` : "Resultados reales con atención directa",
            highlightWords: offerText ? [offerText.toUpperCase().split(" ")[0]] : ["ATENCIÓN"],
            gradientBg: "from-purple-950 via-slate-900 to-indigo-950",
            textColor: "#ffffff",
            accentColor: "#a855f7",
            bgImageUrl: activeImg,
          },
          {
            id: "scene-3",
            duration: 4,
            title: "ESCRÍBENOS HOY",
            subtitle: "Atención directa vía WhatsApp",
            highlightWords: ["WHATSAPP", "HOY"],
            gradientBg: "from-emerald-950 via-slate-900 to-teal-950",
            textColor: "#ffffff",
            accentColor: "#10b981",
            bgImageUrl: activeImg,
          },
        ],
      };

      setRemotionComposition(comp);

      // Si ya existe la demo en Firestore, sincronizar la composición de Remotion
      if (createdDemoId) {
        await updateDoc(doc(db, "admin_prospect_demos", createdDemoId), {
          remotionComposition: comp,
        });
      }

    } catch (vErr) {
      console.error("Error al estructurar Reel Remotion:", vErr);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Guardar video externo (ej. generado con Kling o Runway)
  const handleSaveExternalVideo = async () => {
    if (!createdDemoId) {
      alert("Primero genera la propuesta gráfica de muestra.");
      return;
    }
    if (!externalVideoUrl.trim()) {
      alert("Ingresa la URL del video MP4.");
      return;
    }

    try {
      await updateDoc(doc(db, "admin_prospect_demos", createdDemoId), {
        generatedVideoUrl: externalVideoUrl.trim(),
        videoStyleTitle: selectedVideoTemplate?.title || null,
        videoPromptEnglish: customVideoPrompt || null,
      });
      alert("¡Video enlazado con éxito a la propuesta del prospecto!");
    } catch (e) {
      console.error("Error al guardar video:", e);
    }
  };

  // Generar video automático vía n8n (Image-to-Video)
  const handleGenerateN8nVideo = async () => {
    const targetImage = canvasImageUrl || generatedImageUrl || baseImagePreview;
    if (!targetImage) {
      alert("Primero genera la propuesta gráfica o carga una foto base del negocio.");
      return;
    }

    setIsGeneratingN8nVideo(true);
    setN8nVideoError("");
    setN8nVideoProgress("Conectando con el webhook de n8n...");

    try {
      setN8nVideoProgress("Nuestros agentes están animando la imagen en n8n...");
      const res = await fetch("/api/ai/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: targetImage,
          prompt: customVideoPrompt || selectedVideoTemplate?.baseEnglishPrompt,
          motionStyle: selectedVideoTemplate?.id || "cinematic_slow_push_in",
          businessName: prospectBusiness || prospectName,
          rubro,
          renderMode: n8nVideoRenderMode,
          logoUrl: logoPreview || "",
          postId: createdDemoId || `demo_${Date.now()}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fallo al generar video con n8n.");
      }

      if (data.videoUrl) {
        setExternalVideoUrl(data.videoUrl);
        if (createdDemoId) {
          await updateDoc(doc(db, "admin_prospect_demos", createdDemoId), {
            generatedVideoUrl: data.videoUrl,
            videoStyleTitle: selectedVideoTemplate?.title || null,
            videoPromptEnglish: customVideoPrompt || null,
          });
        }
        setN8nVideoProgress("¡Video generado y enlazado con éxito a la propuesta!");
      } else {
        throw new Error("n8n no retornó una URL de video válida.");
      }
    } catch (e: any) {
      console.error("Error en n8n video:", e);
      setN8nVideoError(e.message || "Error al conectar con el webhook de n8n.");
    } finally {
      setIsGeneratingN8nVideo(false);
    }
  };

  // Copiar prompt de video
  const handleCopyVideoPrompt = () => {
    if (customVideoPrompt) {
      navigator.clipboard.writeText(customVideoPrompt);
      setCopiedVideoPrompt(true);
      setTimeout(() => setCopiedVideoPrompt(false), 2000);
    }
  };

  // Construir URL de WhatsApp
  const cleanPhone = `${countryCode}${prospectPhone.trim().replace(/[\s\-\(\)]/g, "").replace(/^0+/, "")}`.replace("+", "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customWhatsappCopy)}`;

  const handleCopyLink = () => {
    const link = createdDemoId ? `${PUBLIC_APP_URL}/m/${createdDemoId}` : generatedImageUrl;
    if (link) {
      navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in font-sans">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Módulo Exclusivo Admin
            </span>
            <span className="text-xs text-slate-400">· Ventas &amp; Cierre por WhatsApp</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight flex items-center gap-2">
            <span>🎨</span> Generador de Muestras para Prospectos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Prepara en 2 minutos una propuesta visual y audiovisual con el logo y estilo del prospecto, y envíasela directamente a su WhatsApp para acelerar la venta.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab("crear")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "crear"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            ✨ Nueva Muestra
          </button>
          <button
            onClick={() => setActiveTab("historial")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "historial"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            📋 Muestras Guardadas
          </button>
        </div>
      </div>

      {activeTab === "crear" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: CONFIGURACIÓN DEL PROSPECTO & ASSETS (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Paso 1: Datos del Prospecto */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-sm border border-indigo-200 dark:border-indigo-800">
                  1
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Datos del Prospecto &amp; Oferta
                  </h3>
                  <p className="text-xs text-slate-500">¿Para quién es la muestra y qué queremos destacar?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de la Marca o Negocio *
                  </label>
                  <input
                    type="text"
                    value={prospectBusiness}
                    onChange={(e) => setProspectBusiness(e.target.value)}
                    placeholder="Ej: Clínica Dental Providencia"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Contacto (Opcional)
                  </label>
                  <input
                    type="text"
                    value={prospectName}
                    onChange={(e) => setProspectName(e.target.value)}
                    placeholder="Ej: Dr. Matías Soto"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono de WhatsApp del Prospecto
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={prospectPhone}
                      onChange={(e) => setProspectPhone(e.target.value)}
                      placeholder="9 1234 5678"
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rubro / Nicho del Negocio
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_NICHES.map((n) => (
                      <button
                        key={n.label}
                        type="button"
                        onClick={() => setRubro(n.label)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                          rubro === n.label
                            ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm"
                            : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span>{n.icon}</span>
                        <span>{n.label.split(" & ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Oferta o Foco Promocional a Destacar
                  </label>
                  <input
                    type="text"
                    value={offerText}
                    onChange={(e) => setOfferText(e.target.value)}
                    placeholder="Ej: Evaluación y Diagnóstico Digital sin costo este mes"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Paso 2: Assets Visuales (Logo & Retoque Butterfly Social) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-sm border border-indigo-200 dark:border-indigo-800">
                  2
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Logo del Cliente &amp; Retoque de Imagen
                  </h3>
                  <p className="text-xs text-slate-500">Sube el logo del prospecto para componerlo con Butterfly Social o Canvas.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Logo Uploader */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>🏷️</span> Logo del Negocio
                    </span>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview("");
                        }}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  {logoPreview ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                      <div className="w-14 h-14 bg-white rounded-xl p-1 flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                        <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="text-xs space-y-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 block truncate max-w-[150px]">
                          {logoFile?.name || "Logo cargado"}
                        </span>
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="text-[10px] text-indigo-600 hover:underline font-bold"
                        >
                          Cambiar logo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40 text-center"
                    >
                      <FaUpload className="text-slate-400 text-lg mb-1.5" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Subir Logo (PNG / JPG)</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Se integrará sobre el diseño comercial</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Configuración del Logo */}
                  {logoPreview && (
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600 dark:text-slate-400">Posición en la imagen:</span>
                        <button
                          type="button"
                          onClick={() => setLogoTransparent(!logoTransparent)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                            logoTransparent
                              ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                              : "bg-slate-100 border-slate-300 text-slate-600"
                          }`}
                        >
                          {logoTransparent ? "✓ Fondo Transparente" : "Tarjeta Blanca"}
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        {[
                          { id: "top-left", label: "↖ Arriba Izq" },
                          { id: "top-center", label: "⬆ Centro" },
                          { id: "top-right", label: "↗ Arriba Der" },
                          { id: "bottom-left", label: "↙ Abajo Izq" },
                          { id: "bottom-right", label: "↘ Abajo Der" },
                        ].map((pos) => (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => setLogoPosition(pos.id as any)}
                            className={`p-1.5 rounded-lg border text-center transition-all ${
                              logoPosition === pos.id
                                ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">Tamaño:</span>
                        <input
                          type="range"
                          min="60"
                          max="160"
                          value={logoSize}
                          onChange={(e) => setLogoSize(Number(e.target.value))}
                          className="flex-1 accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-400 w-8">{logoSize}px</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Foto Base del Negocio (Opcional) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>📸</span> Foto Base del Negocio
                    </span>
                    {baseImagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setBaseImageFile(null);
                          setBaseImagePreview("");
                        }}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  {baseImagePreview ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                      <div className="w-14 h-14 bg-slate-200 rounded-xl overflow-hidden shrink-0">
                        <img src={baseImagePreview} alt="Foto base preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-xs space-y-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 block truncate max-w-[150px]">
                          {baseImageFile?.name || "Foto cargada"}
                        </span>
                        <button
                          type="button"
                          onClick={() => baseImageInputRef.current?.click()}
                          className="text-[10px] text-indigo-600 hover:underline font-bold"
                        >
                          Cambiar foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => baseImageInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40 text-center"
                    >
                      <FaImage className="text-slate-400 text-lg mb-1.5" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Foto Real del Local</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Opcional. Si no hay, se crea con agentes</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={baseImageInputRef}
                    onChange={handleBaseImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Nombre del Plato, Producto o Especialidad a Destacar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>🍽️</span> Nombre del Plato, Producto o Especialidad a Destacar
                  </label>
                  <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold">Leído por nuestros agentes</span>
                </div>
                <input
                  type="text"
                  value={dishOrProductName}
                  onChange={(e) => setDishOrProductName(e.target.value)}
                  placeholder="Ej: Ramen Tonkotsu Especial, Hamburguesa Doble Trufa, Limpieza Facial Ultrasónica..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 leading-tight">
                  Nuestros agentes leerán este producto tanto para orientar la imagen comercial como para redactar un copy persuasivo y listo para publicar en redes sociales.
                </p>
              </div>
            </div>

            {/* Paso 3: Biblioteca de Prompts de Imágenes */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-sm border border-indigo-200 dark:border-indigo-800">
                    3
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      Estilo Visual de Imagen (Biblioteca de Prompts)
                    </h3>
                    <p className="text-xs text-slate-500">Selecciona el acabado fotográfico que representará al negocio.</p>
                  </div>
                </div>

                {selectedTemplate && (
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Restablecer
                  </button>
                )}
              </div>

              {/* Filtro y Búsqueda */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por estilo (ej: neón, estudio, 3D, plano, comercial)..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {["Todas", ...promptCategories].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                        selectedCategory === cat
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid de Plantillas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-2xl">
                {filteredTemplates.map((item) => {
                  const isSelected = selectedTemplate?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedTemplate(item)}
                      className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all p-2 flex flex-col justify-between ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-md ring-2 ring-indigo-500/20"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300"
                      }`}
                    >
                      <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-200 mb-2 relative">
                        <img
                          src={item.previewUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-indigo-600 text-white rounded-full p-1 shadow-md">
                            <FaCheck className="text-[10px]" />
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-md font-mono">
                          {item.category}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1 leading-tight">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTemplate && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base">✨</span>
                    <span className="font-bold text-indigo-950 dark:text-indigo-200 truncate">
                      Estilo activo: {selectedTemplate.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    {selectedTemplate.category}
                  </span>
                </div>
              )}
            </div>

            {/* Botón de Generación Principal (Imagen & Retoque) */}
            <button
              type="button"
              onClick={handleGenerateSample}
              disabled={isGenerating || isUploadingAssets}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-600 text-white font-extrabold text-base shadow-xl shadow-indigo-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Diseñando y retocando con nuestros agentes...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Generar Muestra Gráfica para {prospectBusiness || "el Prospecto"}</span>
                </>
              )}
            </button>

            {/* SECCIÓN FASE 3: GENERADOR DE VIDEO (REMOTION + PROMPTS LLM) */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-600 text-white text-base">
                    <FaFilm />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Generador de Video / Reel para el Prospecto
                    </h3>
                    <p className="text-xs text-indigo-300">
                      Elige entre render interactivo con Remotion o la biblioteca de prompts imagen-a-video para LLMs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de Modalidad de Video */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setVideoModality("remotion")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    videoModality === "remotion"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FaPlay className="text-[10px]" />
                  <span>Opción A: Reel Interactivo con Remotion</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVideoModality("prompt_library")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    videoModality === "prompt_library"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FaMagic className="text-[10px]" />
                  <span>Opción B: Biblioteca de Prompts (Kling / Runway)</span>
                </button>
              </div>

              {/* MODALIDAD A: REMOTION */}
              {videoModality === "remotion" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Crea un Reel vertical 9:16 con efecto Ken Burns sobre la imagen, subtítulos animados estilo Hormozi, locución y el logo del negocio.
                  </p>

                  <button
                    type="button"
                    onClick={handleGenerateRemotionReel}
                    disabled={isGeneratingVideo}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                  >
                    {isGeneratingVideo ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Estructurando escenas con locución...</span>
                      </>
                    ) : (
                      <>
                        <FaPlay />
                        <span>Generar Reel Animado con Remotion</span>
                      </>
                    )}
                  </button>

                  {remotionComposition && (
                    <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                        <span>✓ Reel estructurado con éxito</span>
                        <span className="font-mono text-[10px]">12 segundos · 3 escenas</span>
                      </div>
                      <p className="text-xs text-slate-300 italic font-sans bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        &quot;{remotionComposition.audioScript}&quot;
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Puedes reproducir el video con sonido y subtítulos en la columna derecha.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* MODALIDAD B: BIBLIOTECA DE PROMPTS IMAGEN-A-VIDEO */}
              {videoModality === "prompt_library" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Selecciona un movimiento de cámara cinematográfico para animar la imagen en Kling AI, Runway Gen-3, Luma Dream Machine o Sora:
                  </p>

                  {/* Grid de Estilos de Video */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {VIDEO_PROMPT_STYLES.map((style) => {
                      const isSelected = selectedVideoTemplate?.id === style.id;
                      return (
                        <div
                          key={style.id}
                          onClick={() => setSelectedVideoTemplate(style)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/40"
                              : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{style.icon}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-mono">
                              {style.category}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white leading-tight">{style.title}</h4>
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                            {style.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Visualizador del Prompt Compilado */}
                  {customVideoPrompt && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                          <span>✨</span> Prompt Optimizado para Kling / Runway / Luma
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyVideoPrompt}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          {copiedVideoPrompt ? <FaCheck /> : <FaCopy />}
                          <span>{copiedVideoPrompt ? "¡Copiado!" : "Copiar Prompt"}</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800 leading-relaxed select-all">
                        {customVideoPrompt}
                      </p>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                        <span>{cameraNotes}</span>
                        <span className="text-indigo-400">Pegar en Image-to-Video</span>
                      </div>
                    </div>
                  )}

                  {/* GENERACIÓN AUTOMÁTICA VÍA N8N CON SWITCH */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>🚀</span> Generar Video Automático vía n8n (Image-to-Video)
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Modo B
                      </span>
                    </div>

                    {/* Switch de Renderizado */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setN8nVideoRenderMode("raw")}
                        className={`p-2 rounded-lg text-left transition-all ${
                          n8nVideoRenderMode === "raw"
                            ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow font-black"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="text-[11px] font-extrabold flex items-center gap-1">
                          <span>⚡</span> Video Puro (n8n)
                        </div>
                        <p className={`text-[9px] ${n8nVideoRenderMode === "raw" ? "text-slate-900 font-bold" : "text-slate-500"}`}>
                          Directo del motor cinematográfico.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setN8nVideoRenderMode("remotion")}
                        className={`p-2 rounded-lg text-left transition-all ${
                          n8nVideoRenderMode === "remotion"
                            ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow font-black"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="text-[11px] font-extrabold flex items-center gap-1">
                          <span>✨</span> Remotion Premium
                        </div>
                        <p className={`text-[9px] ${n8nVideoRenderMode === "remotion" ? "text-indigo-100 font-bold" : "text-slate-500"}`}>
                          Subtítulos Hormozi y logo montado.
                        </p>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateN8nVideo}
                      disabled={isGeneratingN8nVideo || (!canvasImageUrl && !generatedImageUrl && !baseImagePreview)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                    >
                      {isGeneratingN8nVideo ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                          <span>{n8nVideoProgress || "Nuestros agentes están procesando el video..."}</span>
                        </>
                      ) : (
                        <>
                          <span>🚀</span>
                          <span>Generar Video de la Propuesta vía n8n</span>
                        </>
                      )}
                    </button>

                    {n8nVideoError && (
                      <p className="text-[11px] text-rose-400 bg-rose-950/60 p-2 rounded-lg border border-rose-900/60">
                        ⚠️ {n8nVideoError}
                      </p>
                    )}

                    {n8nVideoProgress && !n8nVideoError && (
                      <p className="text-[11px] text-emerald-400 bg-emerald-950/60 p-2 rounded-lg border border-emerald-900/60 font-semibold">
                        ✅ {n8nVideoProgress}
                      </p>
                    )}
                  </div>

                  {/* Input alternativo para adjuntar video MP4 generado manualmente */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-400">
                      O pega manualmente el enlace de video MP4 si ya lo tienes:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={externalVideoUrl}
                        onChange={(e) => setExternalVideoUrl(e.target.value)}
                        placeholder="https://.../video.mp4"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleSaveExternalVideo}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Enlazar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* COLUMNA DERECHA: RESULTADO, REPRODUCTOR & WHATSAPP (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Visualizador de la Muestra Gráfica (Fase 2) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🖼️</span> Vista de la Propuesta Gráfica
                </h3>
                {generatedImageUrl && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200">
                    Lista para enviar
                  </span>
                )}
              </div>

              {generatedImageUrl ? (
                <div className="space-y-4">
                  
                  {/* Selector entre Canvas y Butterfly si ambos existen */}
                  {(canvasImageUrl || butterflyUrl) && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[11px] text-slate-500">Versión de retoque:</span>
                      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {canvasImageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveImageVersion("canvas");
                              setGeneratedImageUrl(canvasImageUrl);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              activeImageVersion === "canvas"
                                ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                                : "text-slate-500"
                            }`}
                          >
                            Canvas Instantáneo
                          </button>
                        )}
                        {butterflyUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveImageVersion("butterfly");
                              setGeneratedImageUrl(butterflyUrl);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              activeImageVersion === "butterfly"
                                ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                                : "text-slate-500"
                            }`}
                          >
                            Butterfly Social
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner group">
                    <img
                      src={generatedImageUrl}
                      alt="Muestra comercial"
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a
                        href={generatedImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-lg hover:bg-slate-100 flex items-center gap-1.5"
                      >
                        <FaEye /> Abrir HD
                      </a>
                    </div>
                  </div>

                  {/* Acciones de la imagen */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FaCopy /> {copySuccess ? "¡Enlace Copiado!" : "Copiar Enlace"}
                    </button>
                    <a
                      href={generatedImageUrl}
                      download={`muestra_${prospectBusiness || "cliente"}.jpg`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                    >
                      <span>⬇️</span> Descargar
                    </a>
                  </div>

                  {createdDemoId && (
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-indigo-900 dark:text-indigo-300 block">Página pública de la propuesta:</span>
                        <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-mono">{PUBLIC_APP_URL}/m/{createdDemoId}</span>
                      </div>
                      <Link
                        href={`/m/${createdDemoId}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-500 transition-colors flex items-center gap-1"
                      >
                        <FaExternalLinkAlt className="text-[10px]" /> Ver Landing
                      </Link>
                    </div>
                  )}

                </div>
              ) : (
                <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center text-xl mb-2">
                    🎨
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Aún no se genera la muestra
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                    Completa los datos del prospecto a la izquierda y presiona &quot;Generar Muestra Gráfica&quot;.
                  </p>
                </div>
              )}
            </div>

            {/* Visualizador de Copy para Redes Sociales (Redactado por Agentes) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-sm">
                    ✍️
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      Copy para Redes Sociales
                    </h3>
                    <p className="text-xs text-slate-500">
                      Redactado por nuestros agentes según el plato / producto
                    </p>
                  </div>
                </div>

                {generatedPostCaption && (
                  <button
                    type="button"
                    onClick={handleRegenerateCopy}
                    disabled={isGeneratingPostCaption}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 disabled:opacity-50"
                    title="Pedir otra variante a nuestros agentes"
                  >
                    <FaMagic className={isGeneratingPostCaption ? "animate-spin" : ""} />
                    <span>{isGeneratingPostCaption ? "Generando..." : "Regenerar"}</span>
                  </button>
                )}
              </div>

              {dishOrProductName && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">Producto enfocado:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    {dishOrProductName}
                  </span>
                </div>
              )}

              {generatedPostCaption ? (
                <div className="space-y-3">
                  <textarea
                    rows={8}
                    value={generatedPostCaption}
                    onChange={(e) => setGeneratedPostCaption(e.target.value)}
                    placeholder="El copy redactado por nuestros agentes aparecerá aquí..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed select-all"
                  />

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleCopyPostCaption}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                    >
                      {copiedPostCaption ? <FaCheck /> : <FaCopy />}
                      <span>{copiedPostCaption ? "¡Copy Copiado!" : "Copiar Texto del Post"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRegenerateCopy}
                      disabled={isGeneratingPostCaption}
                      className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title="Generar nueva propuesta"
                    >
                      <FaMagic className={isGeneratingPostCaption ? "animate-spin" : ""} />
                      <span>{isGeneratingPostCaption ? "Redactando..." : "Nueva Versión"}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    💡 Este copy también se incluye automáticamente en la página interactiva del prospecto (/m/[id]) para que lo pueda copiar directamente.
                  </p>
                </div>
              ) : isGeneratingPostCaption ? (
                <div className="p-8 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nuestros agentes están redactando el copy...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Adaptando el gancho, beneficios y llamado a la acción al plato o producto seleccionado
                  </p>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Aún no se ha redactado el copy
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[260px] mx-auto">
                    Al presionar &quot;Preparar Muestra Visual&quot; o el botón inferior, nuestros agentes generarán el copy para redes sociales.
                  </p>
                  <button
                    type="button"
                    onClick={handleRegenerateCopy}
                    disabled={isGeneratingPostCaption || !prospectBusiness.trim()}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors disabled:opacity-50"
                  >
                    Redactar Copy Ahora
                  </button>
                </div>
              )}
            </div>

            {/* Visualizador de Video / Reel (Remotion Player o MP4) */}
            {(remotionComposition || externalVideoUrl) && (
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🎬</span> Reproductor de Reel / Video
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    9:16 Vertical
                  </span>
                </div>

                {remotionComposition ? (
                  <div className="max-w-[280px] mx-auto">
                    <RemotionReelPlayer
                      composition={remotionComposition}
                      companyName={prospectBusiness}
                      companyLogoUrl={logoPreview}
                    />
                  </div>
                ) : externalVideoUrl ? (
                  <div className="max-w-[280px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-slate-800">
                    <video src={externalVideoUrl} controls playsInline className="w-full h-full object-cover" />
                  </div>
                ) : null}
              </div>
            )}

            {/* Módulo de Envío Directo por WhatsApp */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500 text-white text-base">
                  <FaWhatsapp />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Envío Directo a WhatsApp
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400">
                    Mensaje pre-redactado listo para enviar al prospecto
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Texto del Mensaje (Editable)
                </label>
                <textarea
                  rows={6}
                  value={customWhatsappCopy}
                  onChange={(e) => setCustomWhatsappCopy(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
                />
              </div>

              <div className="pt-1">
                {prospectPhone.trim() ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <FaWhatsapp className="text-lg" />
                    <span>Enviar a {cleanPhone} por WhatsApp</span>
                  </a>
                ) : (
                  <div className="text-center py-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                    ⚠️ Ingresa el número de WhatsApp del prospecto para activar el botón.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* HISTORIAL DE MUESTRAS ENVIADAS */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Muestras Comerciales Guardadas
              </h3>
              <p className="text-xs text-slate-500">Historial de propuestas preparadas para prospectos.</p>
            </div>
            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold"
            >
              {loadingHistory ? "Cargando..." : "↻ Refrescar"}
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : historyDemos.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <span className="text-3xl">📭</span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No hay muestras generadas todavía</p>
              <p className="text-xs text-slate-400">Crea la primera propuesta para un cliente potencial desde la pestaña &quot;Nueva Muestra&quot;.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {historyDemos.map((demo) => {
                const publicUrl = demo.publicDemoUrl || `${PUBLIC_APP_URL}/m/${demo.id}`;
                return (
                  <div key={demo.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 p-3 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        {demo.generatedImageUrl ? (
                          <img src={demo.generatedImageUrl} alt={demo.prospectBusiness} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">🖼️</div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{demo.prospectBusiness}</span>
                          {demo.remotionComposition && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">🎬 Reel</span>
                          )}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                          {demo.prospectName && <span>👤 {demo.prospectName}</span>}
                          <span>📞 {demo.prospectPhone}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">{demo.rubro}</span>
                        </div>
                        {demo.dishOrProductName && (
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                            <span>🍽️</span> {demo.dishOrProductName}
                          </div>
                        )}
                        {demo.offerText && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-1 mt-1">
                            &quot;{demo.offerText}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {demo.id && (
                        <Link
                          href={`/m/${demo.id}`}
                          target="_blank"
                          className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold flex items-center gap-1.5"
                          title="Ver landing de la propuesta"
                        >
                          <FaExternalLinkAlt className="text-xs" /> Landing
                        </Link>
                      )}
                      {demo.prospectPhone && (
                        <a
                          href={`https://wa.me/${demo.prospectPhone.replace(/[\s\+\-\(\)]/g, "")}?text=${encodeURIComponent(
                            `¡Hola ${demo.prospectName || ""}! Te comparto nuevamente la propuesta que diseñaron nuestros agentes para ${demo.prospectBusiness}: ${publicUrl}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5"
                          title="Enviar por WhatsApp"
                        >
                          <FaWhatsapp className="text-base" /> WhatsApp
                        </a>
                      )}
                      {demo.generatedImageUrl && (
                        <a
                          href={demo.generatedImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold"
                          title="Ver imagen"
                        >
                          <FaEye />
                        </a>
                      )}
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
