"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { auth } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useProfile } from "../../../../contexts/ProfileContext";
import { useQuota } from "../../../../hooks/useQuota";
import { 
  FLOW_COMMANDS, 
  FlowCommandDef, 
  buildVeoPromptFromCommand 
} from "../../../../lib/flow-command-translator";
import { 
  FaCopy, 
  FaCheck, 
  FaPlay, 
  FaImage, 
  FaVideo, 
  FaFilm, 
  FaMagic, 
  FaArrowRight,
  FaLightbulb,
  FaPlus,
  FaEdit,
  FaUpload,
  FaTimes,
  FaSpinner,
  FaDownload,
  FaBoxOpen,
  FaShieldAlt,
  FaLock,
  FaSearch,
  FaTrash
} from "react-icons/fa";

export default function VideoPromptsPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const { activeProfile } = useProfile();
  const { videosUsed, videoLimit, refreshQuota } = useQuota(activeProfile?.id);

  // Lista dinámica de plantillas (combinación base + Firestore)
  const [templates, setTemplates] = useState<FlowCommandDef[]>(FLOW_COMMANDS);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [viewModes, setViewModes] = useState<Record<string, "image" | "video">>({});

  // Generador interactivo superior
  const [selectedCommandForGen, setSelectedCommandForGen] = useState<string>("/smoke reveal");
  const [customProduct, setCustomProduct] = useState<string>(activeProfile?.name || "");
  const [customNiche, setCustomNiche] = useState<string>(activeProfile?.rubro || "");
  const [customDetails, setCustomDetails] = useState<string>("");
  const [formatRatio, setFormatRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [copiedInteractivePrompt, setCopiedInteractivePrompt] = useState<boolean>(false);

  // Modal de Admin para Cargar / Editar Muestra
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminSaving, setAdminSaving] = useState<boolean>(false);
  const [adminDeleting, setAdminDeleting] = useState<boolean>(false);
  const [adminUploadingImage, setAdminUploadingImage] = useState<boolean>(false);
  const [adminUploadingVideo, setAdminUploadingVideo] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string>("");
  const [adminSuccess, setAdminSuccess] = useState<string>("");
  const [editingTemplate, setEditingTemplate] = useState<FlowCommandDef>({
    command: "/smoke reveal",
    name: "Smoke Reveal",
    category: "Product Reveals",
    description: "",
    icon: "💨",
    cameraMovement: "Slow cinematic push-in dolly forward toward the center",
    physicsEffect: "Dense volumetric smoke billowing outward and dissipating smoothly",
    lightingStyle: "Moody backlighting with sharp rim glow",
    defaultEnglishPrompt: "",
    sampleBaseImage: "",
    sampleFinalVideo: "",
  });

  // Modal de Usuario para Usar Efecto y Generar Video
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [activeUserEffect, setActiveUserEffect] = useState<FlowCommandDef | null>(null);
  const [userProductName, setUserProductName] = useState<string>("");
  const [userProductDescription, setUserProductDescription] = useState<string>("");
  const [imageSourceMode, setImageSourceMode] = useState<"catalog" | "upload">("catalog");
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState<string>("");
  const [userImageUrl, setUserImageUrl] = useState<string>("");
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [userUploadingImage, setUserUploadingImage] = useState<boolean>(false);
  const [includeLogo, setIncludeLogo] = useState<boolean>(!!activeProfile?.logoUrl);
  const [userLogoUrl, setUserLogoUrl] = useState<string>(activeProfile?.logoUrl || "");
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);
  const [generatingVideo, setGeneratingVideo] = useState<boolean>(false);
  const [videoGenProgress, setVideoGenProgress] = useState<string>("");
  const [generatedVideoResult, setGeneratedVideoResult] = useState<string | null>(null);
  const [userModalError, setUserModalError] = useState<string>("");

  const userFileInputRef = useRef<HTMLInputElement>(null);
  const adminImageInputRef = useRef<HTMLInputElement>(null);
  const adminVideoInputRef = useRef<HTMLInputElement>(null);

  // Autenticación y rol admin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const email = (u.email || "").toLowerCase();
        const admins = ["diemoroy@gmail.com", "admin@santisoft.cl", "spalezcom@gmail.com", "santisoftai@gmail.com"];
        setIsAdminUser(admins.includes(email));
      }
    });
    return () => unsub();
  }, []);

  // Cargar plantillas desde la API (Firestore + Base)
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/video-prompts/templates");
      if (res.ok) {
        const data = await res.json();
        if (data.templates && Array.isArray(data.templates)) {
          setTemplates(data.templates);
        }
      }
    } catch (e) {
      console.warn("Notice loading video templates:", e);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Cargar catálogo de productos del usuario
  useEffect(() => {
    if (user && activeProfile?.id) {
      loadCatalog();
    }
  }, [user, activeProfile?.id]);

  const loadCatalog = async () => {
    if (!user || !activeProfile?.id) return;
    setLoadingCatalog(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/catalogo?profileId=${activeProfile.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCatalogItems(data.items || []);
      }
    } catch {
      // Silencioso
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Categorías únicas
  const categories = useMemo(() => {
    const cats = Array.from(new Set(templates.map((c) => c.category)));
    return ["Todas", ...cats];
  }, [templates]);

  // Filtrado de comandos
  const filteredCommands = useMemo(() => {
    return templates.filter((cmd) => {
      const matchCat = selectedCategory === "Todas" || cmd.category === selectedCategory;
      const q = searchFilter.toLowerCase().trim();
      const matchSearch =
        !q ||
        cmd.command.toLowerCase().includes(q) ||
        cmd.name.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [templates, selectedCategory, searchFilter]);

  // Prompt interactivo superior
  const activeGenCmd = useMemo(() => {
    return templates.find((c) => c.command === selectedCommandForGen) || templates[0];
  }, [templates, selectedCommandForGen]);

  const interactivePromptText = useMemo(() => {
    return buildVeoPromptFromCommand(activeGenCmd, {
      productName: customProduct,
      rubro: customNiche,
      aspectRatio: formatRatio,
      additionalDetails: customDetails,
    });
  }, [activeGenCmd, customProduct, customNiche, formatRatio, customDetails]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2500);
  };

  const handleCopyInteractive = () => {
    navigator.clipboard.writeText(interactivePromptText);
    setCopiedInteractivePrompt(true);
    setTimeout(() => setCopiedInteractivePrompt(false), 2500);
  };

  const toggleViewMode = (cmdKey: string, mode: "image" | "video") => {
    setViewModes((prev) => ({ ...prev, [cmdKey]: mode }));
  };

  // ── GESTIÓN DE ADMIN: ABRIR EDICIÓN ──────────────────────────────────────────
  const openAdminEdit = (cmdDef?: FlowCommandDef) => {
    if (cmdDef) {
      setEditingTemplate({ ...cmdDef });
    } else {
      setEditingTemplate({
        command: "",
        name: "",
        category: "Product Reveals",
        description: "",
        icon: "🎬",
        cameraMovement: "Slow cinematic push-in dolly forward toward the center",
        physicsEffect: "",
        lightingStyle: "Commercial studio key light with volumetric rim glow",
        defaultEnglishPrompt: "",
        sampleBaseImage: "",
        sampleFinalVideo: "",
      });
    }
    setAdminError("");
    setAdminSuccess("");
    setShowAdminModal(true);
  };

  // Subir archivo en modal de Admin
  const handleAdminFileUpload = async (file: File, type: "image" | "video") => {
    if (!user) return;
    if (type === "image") setAdminUploadingImage(true);
    if (type === "video") setAdminUploadingVideo(true);
    setAdminError("");

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("command", editingTemplate.command || "sample");

      const res = await fetch("/api/video-prompts/upload-sample", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir archivo");

      if (type === "image") {
        setEditingTemplate((prev) => ({ ...prev, sampleBaseImage: data.url }));
      } else {
        setEditingTemplate((prev) => ({ ...prev, sampleFinalVideo: data.url }));
      }
    } catch (err: any) {
      setAdminError(err.message || "Error al subir archivo.");
    } finally {
      if (type === "image") setAdminUploadingImage(false);
      if (type === "video") setAdminUploadingVideo(false);
    }
  };

  // Guardar plantilla de Admin
  const handleAdminSave = async () => {
    if (!user) return;
    if (!editingTemplate.command || !editingTemplate.command.startsWith("/")) {
      setAdminError("El comando debe comenzar con / (ej: /smoke reveal)");
      return;
    }

    setAdminSaving(true);
    setAdminError("");
    setAdminSuccess("");

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/video-prompts/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingTemplate),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar plantilla");

      setAdminSuccess("¡Muestra guardada exitosamente en la galería!");
      await loadTemplates();
      setTimeout(() => {
        setShowAdminModal(false);
      }, 1500);
    } catch (err: any) {
      setAdminError(err.message || "Error al guardar.");
    } finally {
      setAdminSaving(false);
    }
  };

  // Eliminar plantilla de Admin
  const handleAdminDelete = async (command: string) => {
    if (!user) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el efecto "${command}" de la galería?`)) {
      return;
    }

    setAdminDeleting(true);
    setAdminError("");

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/video-prompts/templates?command=${encodeURIComponent(command)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar plantilla");

      await loadTemplates();
      if (showAdminModal && editingTemplate.command === command) {
        setShowAdminModal(false);
      }
    } catch (err: any) {
      alert(err.message || "Error al eliminar plantilla.");
    } finally {
      setAdminDeleting(false);
    }
  };

  // Autogenerar prompt en inglés basado en el comando y atributos ingresados
  const handleAutoGeneratePrompt = () => {
    const prompt = buildVeoPromptFromCommand(editingTemplate, {
      productName: "the product",
      rubro: "commercial",
      aspectRatio: "9:16",
    });
    setEditingTemplate((prev) => ({
      ...prev,
      defaultEnglishPrompt: prompt,
    }));
  };

  // ── GESTIÓN DE USUARIO: ABRIR MODAL CREACIÓN ─────────────────────────────────
  const openUserCreateModal = (effect: FlowCommandDef) => {
    setActiveUserEffect(effect);
    setCatalogSearch("");
    setUserModalError("");
    setGeneratedVideoResult(null);
    setIncludeLogo(!!activeProfile?.logoUrl);
    setUserLogoUrl(activeProfile?.logoUrl || "");

    if (catalogItems.length > 0) {
      setImageSourceMode("catalog");
      const firstWithImage = catalogItems.find((it) => !!it.imageUrl) || catalogItems[0];
      setSelectedCatalogItemId(firstWithImage.id);
      setUserProductName(firstWithImage.name || "");
      setUserProductDescription(firstWithImage.description || "");
      setUserImageUrl(firstWithImage.imageUrl || "");
    } else {
      setImageSourceMode("upload");
      setSelectedCatalogItemId(null);
      setUserProductName(activeProfile?.name || "");
      setUserProductDescription("");
      setUserImageUrl(effect.sampleBaseImage || "");
    }

    setShowUserModal(true);
  };

  const handleSelectCatalogItem = (item: any) => {
    setSelectedCatalogItemId(item.id);
    setUserProductName(item.name || "");
    setUserProductDescription(item.description || "");
    setUserImageUrl(item.imageUrl || "");
  };

  // Filtrado de items del catálogo según búsqueda del usuario
  const filteredCatalogItems = useMemo(() => {
    if (!catalogSearch.trim()) return catalogItems;
    const q = catalogSearch.toLowerCase().trim();
    return catalogItems.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }, [catalogItems, catalogSearch]);

  // Subir imagen del usuario desde su equipo
  const handleUserImageUpload = async (file: File) => {
    if (!user) return;
    setUserUploadingImage(true);
    setUserModalError("");

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profileId", activeProfile?.id || "default");

      const res = await fetch("/api/catalogo/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error subiendo imagen");

      setUserImageUrl(data.url);
      setUserImageFile(null);
    } catch (err: any) {
      setUserModalError(err.message || "Error al subir imagen.");
    } finally {
      setUserUploadingImage(false);
    }
  };

  // Prompt específico para el usuario en el modal enriquecido con descripción de producto
  const userFinalPrompt = useMemo(() => {
    if (!activeUserEffect) return "";
    return buildVeoPromptFromCommand(activeUserEffect, {
      productName: userProductName || activeProfile?.name || "el producto",
      rubro: activeProfile?.rubro || "comercial",
      aspectRatio: "9:16",
      additionalDetails: userProductDescription
        ? `Product visual features: ${userProductDescription}`
        : undefined,
    });
  }, [activeUserEffect, userProductName, userProductDescription, activeProfile]);

  // Verificar si la cuota permite video
  const hasVideoQuota = useMemo(() => {
    if (isAdminUser) return true;
    return videoLimit > 0 && videosUsed < videoLimit;
  }, [isAdminUser, videoLimit, videosUsed]);

  // Ejecutar generación de video con agentes
  const handleGenerateUserVideo = async () => {
    if (!user || !activeUserEffect) return;

    if (!userImageUrl) {
      setUserModalError("Por favor sube una imagen de producto o selecciona una de tu catálogo.");
      return;
    }

    if (!hasVideoQuota) {
      setUserModalError("Has alcanzado el límite mensual de videos de tu plan.");
      return;
    }

    setGeneratingVideo(true);
    setUserModalError("");
    setGeneratedVideoResult(null);
    setVideoGenProgress("Conectando con nuestros agentes y preparando escena...");

    try {
      const token = await user.getIdToken();

      setTimeout(() => {
        setVideoGenProgress("Estructurando dinámica de cámara y física en Google Flow & Veo 3.1...");
      }, 3000);

      setTimeout(() => {
        if (includeLogo) {
          setVideoGenProgress("Componiendo capa de marca con logo en alta definición (Remotion)...");
        } else {
          setVideoGenProgress("Finalizando renderizado cinemático en alta resolución...");
        }
      }, 7000);

      const res = await fetch("/api/ai/image-to-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrl: userImageUrl,
          prompt: userFinalPrompt,
          motionStyle: activeUserEffect.command,
          businessName: userProductName || activeProfile?.name || "",
          rubro: activeProfile?.rubro || "General",
          renderMode: includeLogo ? "remotion" : "raw",
          logoUrl: includeLogo ? userLogoUrl : "",
          profileId: activeProfile?.id || "default",
          userId: user.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo generar el video en este momento.");
      }

      setGeneratedVideoResult(data.videoUrl);
      refreshQuota();
    } catch (err: any) {
      setUserModalError(err.message || "Error al generar video.");
    } finally {
      setGeneratingVideo(false);
      setVideoGenProgress("");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ── HEADER PRINCIPAL ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-2xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <FaFilm className="text-indigo-400" />
              <span>Google Flow & Veo 3.1 / Omni Video Showcase</span>
            </div>

            {/* Chip de cuota de video */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              hasVideoQuota 
                ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                : "bg-amber-500/15 border-amber-400/30 text-amber-300"
            }`}>
              <FaVideo className="text-[10px]" />
              <span>
                Cuota Videos: {isAdminUser ? "Ilimitados (Admin)" : `${videosUsed} / ${videoLimit} este mes`}
              </span>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            Prompts de Video & Product Reveals
          </h1>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6 font-normal">
            Descubre exactamente cómo transformar una fotografía fija en un video publicitario de alto impacto. 
            Nuestros agentes traducen los comandos de Flow a prompts de 6 capas y generan tu video con opción de logo en Remotion.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/automatizacion-rrss/panel/poc-video"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm"
            >
              <FaPlay className="text-xs" />
              <span>Generador Libre de Video</span>
            </Link>

            {isAdminUser && (
              <button
                onClick={() => openAdminEdit()}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 text-sm"
              >
                <FaPlus className="text-xs" />
                <span>Subir Nueva Muestra (Admin)</span>
              </button>
            )}

            <a
              href="#comandos-grid"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-5 py-2.5 rounded-xl transition-all border border-white/15 text-sm"
            >
              <span>Ver Catálogo ({templates.length})</span>
              <FaArrowRight className="text-xs text-indigo-300" />
            </a>
          </div>
        </div>
      </div>

      {/* ── GENERADOR Y TRADUCTOR RÁPIDO ── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xl shadow-slate-100/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <FaMagic /> Generador & Traductor de Comandos
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Convierte cualquier comando en un prompt maestro
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Personaliza el comando con tu producto y obtén el prompt listo para usar en Flow Labs o generar con nuestros agentes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Formato:</span>
            {(["9:16", "16:9", "1:1"] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setFormatRatio(ratio)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  formatRatio === ratio
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {ratio} {ratio === "9:16" ? "(Reel)" : ratio === "16:9" ? "(Paisaje)" : "(Post)"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Comando Flow / Efecto
              </label>
              <select
                value={selectedCommandForGen}
                onChange={(e) => setSelectedCommandForGen(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {templates.map((cmd) => (
                  <option key={cmd.command} value={cmd.command}>
                    {cmd.icon} {cmd.command} — {cmd.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Producto o Sujeto
                </label>
                <input
                  type="text"
                  placeholder="Ej: Hamburguesa Doble, Perfume, etc."
                  value={customProduct}
                  onChange={(e) => setCustomProduct(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rubro / Estilo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Gastronomía, Barbería, Joyería"
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Detalles artísticos adicionales (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: warm golden glow, water drops on the glass surface"
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-700 w-28 shrink-0">Cámara:</span>
                <span className="text-slate-600">{activeGenCmd.cameraMovement}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-700 w-28 shrink-0">Física del Efecto:</span>
                <span className="text-slate-600">{activeGenCmd.physicsEffect}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-700 w-28 shrink-0">Iluminación:</span>
                <span className="text-slate-600">{activeGenCmd.lightingStyle}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Prompt Maestro Optimizado (Veo 3.1 & Flow)
              </label>
              <button
                onClick={handleCopyInteractive}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                {copiedInteractivePrompt ? (
                  <>
                    <FaCheck className="text-emerald-600" />
                    <span className="text-emerald-700">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <FaCopy />
                    <span>Copiar Prompt</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs md:text-sm leading-relaxed border border-slate-800 relative group overflow-y-auto max-h-72">
              <p className="select-all text-indigo-100 whitespace-pre-wrap">{interactivePromptText}</p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Fórmula de 6 capas cinemáticas calibrada para Google Veo 3.1
              </span>
              <button
                onClick={() => openUserCreateModal(activeGenCmd)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md"
              >
                <FaPlay className="text-[10px]" />
                <span>Usar este efecto en mi foto</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CATÁLOGO DE EFECTOS (SHOWCASE ANTES -> DESPUÉS) ── */}
      <div id="comandos-grid" className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Catálogo de Efectos de Revelación & Movimiento
            </h2>
            <p className="text-slate-500 text-sm">
              Compara la imagen estática inicial con el video final generado. Selecciona un efecto para aplicarlo a tu producto.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar comando (ej. /smoke, /fire)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-900 text-xs rounded-xl pl-3.5 pr-8 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedCategory === cat
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommands.map((cmd) => {
            const currentMode = viewModes[cmd.command] || (cmd.sampleFinalVideo ? "video" : "image");
            const isCopied = copiedCommand === cmd.command;

            return (
              <div
                key={cmd.command}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Header de la tarjeta */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{cmd.icon}</span>
                    <div>
                      <h3 className="font-black text-slate-900 text-base leading-tight">
                        {cmd.name}
                      </h3>
                      <span className="text-[11px] font-bold text-indigo-600 tracking-wide">
                        {cmd.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isAdminUser && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openAdminEdit(cmd)}
                          title="Editar Efecto y Muestras de Video"
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleAdminDelete(cmd.command)}
                          title="Eliminar Efecto de la Galería"
                          disabled={adminDeleting}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => handleCopy(cmd.command, `cmd-${cmd.command}`)}
                      title="Copiar comando de Flow"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-xs font-bold transition-colors"
                    >
                      {copiedCommand === `cmd-${cmd.command}` ? (
                        <FaCheck className="text-emerald-600" />
                      ) : (
                        cmd.command
                      )}
                    </button>
                  </div>
                </div>

                {/* Previsualizador Visual Antes -> Después */}
                <div className="relative aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
                  <div className="absolute top-3 left-3 z-20 flex bg-slate-900/80 backdrop-blur-md p-0.5 rounded-lg border border-white/10 text-xs font-bold text-white shadow-lg">
                    <button
                      onClick={() => toggleViewMode(cmd.command, "image")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                        currentMode === "image"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      <FaImage className="text-xs" />
                      <span>Imagen Base</span>
                    </button>
                    <button
                      onClick={() => toggleViewMode(cmd.command, "video")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                        currentMode === "video"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      <FaVideo className="text-xs" />
                      <span>Video Final</span>
                    </button>
                  </div>

                  {currentMode === "image" ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
                      {cmd.sampleBaseImage ? (
                        <img
                          src={cmd.sampleBaseImage}
                          alt={`Imagen base para ${cmd.name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-6 text-slate-400">
                          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 text-2xl shadow-inner">
                            {cmd.icon}
                          </div>
                          <p className="text-xs font-bold text-slate-200">Foto Base del Producto</p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                            {isAdminUser ? "Haz clic en 'Editar' para cargar la foto de muestra" : "Fotografía estática de referencia"}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full relative flex items-center justify-center bg-slate-950 p-4">
                      {cmd.sampleFinalVideo ? (
                        <video
                          src={cmd.sampleFinalVideo}
                          autoPlay
                          loop
                          muted
                          playsInline
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-6 text-indigo-300">
                          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl shadow-inner animate-pulse">
                            <FaFilm />
                          </div>
                          <p className="text-xs font-bold text-white">Video Cinemático (Veo 3.1)</p>
                          <p className="text-[11px] text-indigo-200/80 mt-1 max-w-[220px] mx-auto">
                            {isAdminUser ? "Haz clic en 'Editar' para subir el video final" : "Muestra en video en proceso de render"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-slate-300 px-2 py-0.5 rounded-md border border-white/10">
                    {currentMode === "image" ? "Antes: Estático" : "Después: Cinemático"}
                  </div>
                </div>

                {/* Contenido descriptivo */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <p className="text-slate-600 text-xs leading-relaxed mb-3">
                      {cmd.description}
                    </p>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] space-y-1.5 text-slate-600">
                      <div>
                        <strong className="text-slate-900">Cámara:</strong> {cmd.cameraMovement}
                      </div>
                      <div>
                        <strong className="text-slate-900">Iluminación:</strong> {cmd.lightingStyle}
                      </div>
                    </div>
                  </div>

                  {/* Acciones principales */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <button
                      onClick={() => openUserCreateModal(cmd)}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md flex items-center justify-center gap-2 group-hover:bg-indigo-700"
                    >
                      <FaPlay className="text-[10px]" />
                      <span>Usar este Efecto con mi Imagen</span>
                    </button>

                    <div className="flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => handleCopy(cmd.defaultEnglishPrompt, cmd.command)}
                        className="text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-1"
                      >
                        {isCopied ? <FaCheck className="text-emerald-600" /> : <FaCopy />}
                        <span>{isCopied ? "¡Prompt copiado!" : "Copiar prompt base"}</span>
                      </button>
                      <span className="text-slate-400">Veo 3.1 & Flow</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODAL DE ADMIN: SUBIR/EDITAR MUESTRA DE VIDEO ── */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-5 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full"
            >
              <FaTimes />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl text-xl">
                <FaShieldAlt />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Panel de Administrador: Muestra de Video
                </h3>
                <p className="text-xs text-slate-500">
                  Sube la imagen base y el video final generado para que los usuarios vean el resultado real.
                </p>
              </div>
            </div>

            {adminError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
                {adminError}
              </div>
            )}
            {adminSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl">
                {adminSuccess}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="font-bold text-slate-700 block mb-1">Comando Flow (*):</label>
                  <input
                    type="text"
                    placeholder="Ej: /smoke reveal"
                    value={editingTemplate.command}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, command: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="font-bold text-slate-700 block mb-1">Nombre del Efecto:</label>
                  <input
                    type="text"
                    placeholder="Ej: Smoke Reveal"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="font-bold text-slate-700 block mb-1">Categoría:</label>
                  <input
                    type="text"
                    placeholder="Ej: Product Reveals"
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descripción para el usuario:</label>
                <textarea
                  rows={2}
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  placeholder="Explica qué movimiento y efecto visual produce este comando..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              {/* Sección Subir Imagen Base */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">1. Imagen Base (Foto estática inicial):</span>
                  {adminUploadingImage && (
                    <span className="text-indigo-600 flex items-center gap-1 font-bold">
                      <FaSpinner className="animate-spin" /> Subiendo imagen...
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  {editingTemplate.sampleBaseImage ? (
                    <div className="h-24 w-28 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 shrink-0 relative group">
                      <img src={editingTemplate.sampleBaseImage} alt="Base preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingTemplate({ ...editingTemplate, sampleBaseImage: "" })}
                        title="Quitar foto"
                        className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-md text-[10px]"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-28 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-white shrink-0">
                      <FaImage className="text-2xl" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <input
                      ref={adminImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleAdminFileUpload(e.target.files[0], "image");
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => adminImageInputRef.current?.click()}
                        disabled={adminUploadingImage}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <FaUpload /> <span>Subir desde mi equipo</span>
                      </button>
                      {editingTemplate.sampleBaseImage && (
                        <button
                          type="button"
                          onClick={() => setEditingTemplate({ ...editingTemplate, sampleBaseImage: "" })}
                          className="px-3 py-2 text-slate-500 hover:text-red-600 font-bold text-xs"
                        >
                          Quitar foto
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="O pega la URL directa de la foto..."
                      value={editingTemplate.sampleBaseImage || ""}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, sampleBaseImage: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Sección Subir Video Final */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">2. Video Final de Referencia (Generado por Flow / Veo):</span>
                  {adminUploadingVideo && (
                    <span className="text-indigo-600 flex items-center gap-1 font-bold">
                      <FaSpinner className="animate-spin" /> Subiendo video...
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  {editingTemplate.sampleFinalVideo ? (
                    <div className="h-32 w-32 rounded-xl overflow-hidden border border-slate-300 bg-black shrink-0 relative group">
                      <video src={editingTemplate.sampleFinalVideo} autoPlay loop muted controls className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingTemplate({ ...editingTemplate, sampleFinalVideo: "" })}
                        title="Quitar video"
                        className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-md text-[10px]"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-white shrink-0">
                      <FaVideo className="text-2xl" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <input
                      ref={adminVideoInputRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleAdminFileUpload(e.target.files[0], "video");
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => adminVideoInputRef.current?.click()}
                        disabled={adminUploadingVideo}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <FaUpload /> <span>Subir Video (MP4 / WebM)</span>
                      </button>
                      {editingTemplate.sampleFinalVideo && (
                        <button
                          type="button"
                          onClick={() => setEditingTemplate({ ...editingTemplate, sampleFinalVideo: "" })}
                          className="px-3 py-2 text-slate-500 hover:text-red-600 font-bold text-xs"
                        >
                          Quitar video
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="O pega la URL directa del video MP4..."
                      value={editingTemplate.sampleFinalVideo || ""}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, sampleFinalVideo: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Prompt Maestro */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Prompt Maestro en Inglés (6 capas):</label>
                  <button
                    type="button"
                    onClick={handleAutoGeneratePrompt}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <FaMagic /> <span>Generar fórmula automática</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={editingTemplate.defaultEnglishPrompt}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultEnglishPrompt: e.target.value })}
                  placeholder="Prompt de 6 componentes para Veo 3.1..."
                  className="w-full bg-slate-900 text-slate-100 font-mono text-xs rounded-xl p-3 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              {templates.some((t) => t.command === editingTemplate.command) ? (
                <button
                  type="button"
                  onClick={() => handleAdminDelete(editingTemplate.command)}
                  disabled={adminDeleting || adminSaving}
                  className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center"
                >
                  <FaTrash />
                  <span>Eliminar Efecto</span>
                </button>
              ) : (
                <div className="hidden sm:block"></div>
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAdminSave}
                  disabled={adminSaving || adminUploadingImage || adminUploadingVideo}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {adminSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  <span>Guardar Muestra en la Galería</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE USUARIO: CREAR VIDEO CON EFECTO ── */}
      {showUserModal && activeUserEffect && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full"
            >
              <FaTimes />
            </button>

            {/* Encabezado del modal */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activeUserEffect.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">
                    Crear Video con {activeUserEffect.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-xs font-bold">
                    {activeUserEffect.command}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sube la foto de tu producto para animarla con este efecto cinemático.
                </p>
              </div>
            </div>

            {userModalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
                {userModalError}
              </div>
            )}

            {/* Resultado si el video ya se generó */}
            {generatedVideoResult ? (
              <div className="bg-slate-900 rounded-2xl p-6 text-center text-white space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  <FaCheck /> ¡Video generado exitosamente!
                </div>
                <div className="max-w-xs mx-auto aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10">
                  <video src={generatedVideoResult} controls autoPlay loop className="w-full h-full object-cover" />
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <a
                    href={generatedVideoResult}
                    download="video-santisoft.mp4"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg"
                  >
                    <FaDownload /> Descargar Video MP4
                  </a>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                {/* Paso 1: Selección de Producto / Imagen */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">
                      1. Selecciona el producto o imagen a animar:
                    </span>
                    {userUploadingImage && (
                      <span className="text-indigo-600 flex items-center gap-1 font-bold">
                        <FaSpinner className="animate-spin" /> Subiendo imagen...
                      </span>
                    )}
                  </div>

                  {/* Pestañas de modo */}
                  <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setImageSourceMode("catalog");
                        if (!selectedCatalogItemId && catalogItems.length > 0) {
                          handleSelectCatalogItem(catalogItems[0]);
                        }
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        imageSourceMode === "catalog"
                          ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <FaBoxOpen className="text-sm" />
                      <span>Mi Biblioteca de Productos</span>
                      {catalogItems.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          imageSourceMode === "catalog"
                            ? "bg-indigo-100 text-indigo-700 font-black"
                            : "bg-slate-200 text-slate-700 font-semibold"
                        }`}>
                          {catalogItems.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setImageSourceMode("upload")}
                      className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        imageSourceMode === "upload"
                          ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <FaUpload className="text-sm" />
                      <span>Subir Nueva Foto</span>
                    </button>
                  </div>
                </div>

                {/* CONTENIDO MODO 1: BIBLIOTECA DE PRODUCTOS */}
                {imageSourceMode === "catalog" && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    {loadingCatalog ? (
                      <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin text-indigo-600 text-lg" />
                        <span>Cargando productos de tu biblioteca...</span>
                      </div>
                    ) : catalogItems.length === 0 ? (
                      <div className="py-6 px-4 text-center space-y-2 bg-white rounded-xl border border-dashed border-slate-300">
                        <FaBoxOpen className="text-3xl text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700">Aún no tienes productos registrados en tu biblioteca</p>
                        <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                          Puedes subir una foto directamente en la pestaña "Subir Nueva Foto" o agregar tus productos desde la sección Catálogo.
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setImageSourceMode("upload")}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5"
                          >
                            <FaUpload /> <span>Cambiar a Subir Foto</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Barra de búsqueda de productos */}
                        {catalogItems.length > 2 && (
                          <div className="relative">
                            <FaSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                            <input
                              type="text"
                              value={catalogSearch}
                              onChange={(e) => setCatalogSearch(e.target.value)}
                              placeholder="Buscar en tu biblioteca por nombre o descripción..."
                              className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                            />
                            {catalogSearch && (
                              <button
                                type="button"
                                onClick={() => setCatalogSearch("")}
                                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs p-1"
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Grid de productos seleccionables */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                          {filteredCatalogItems.map((item) => {
                            const isSelected = selectedCatalogItemId === item.id;
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleSelectCatalogItem(item)}
                                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 text-left relative ${
                                  isSelected
                                    ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20"
                                    : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50"
                                }`}
                              >
                                <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <FaImage className="text-slate-400 text-base" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="font-bold text-slate-900 text-[11px] truncate">{item.name}</h4>
                                    {isSelected && (
                                      <span className="text-indigo-600 text-xs shrink-0">
                                        <FaCheck />
                                      </span>
                                    )}
                                  </div>
                                  {item.category && (
                                    <span className="text-[10px] text-indigo-600 font-semibold block truncate">
                                      {item.category}
                                    </span>
                                  )}
                                  {item.description && (
                                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {filteredCatalogItems.length === 0 && (
                          <p className="text-center py-4 text-slate-500 text-xs">
                            No se encontraron productos que coincidan con "{catalogSearch}".
                          </p>
                        )}

                        {/* Tarjeta de resumen de producto seleccionado */}
                        {userImageUrl && (
                          <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                              <img src={userImageUrl} alt={userProductName} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                                Producto seleccionado para el video:
                              </div>
                              <div className="font-bold text-slate-900 text-xs truncate">
                                {userProductName || "Sin nombre"}
                              </div>
                              {userProductDescription && (
                                <div className="text-[10px] text-slate-500 truncate">
                                  {userProductDescription}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* CONTENIDO MODO 2: SUBIR NUEVA FOTO O URL */}
                {imageSourceMode === "upload" && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      {/* Vista previa de la imagen */}
                      <div className="w-28 h-28 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                        {userImageUrl ? (
                          <img src={userImageUrl} alt="Producto" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-2 text-slate-400">
                            <FaImage className="text-2xl mx-auto mb-1" />
                            <span className="text-[10px]">Sin imagen</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2.5 w-full">
                        <input
                          ref={userFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUserImageUpload(e.target.files[0]);
                          }}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => userFileInputRef.current?.click()}
                            disabled={userUploadingImage || generatingVideo}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                          >
                            <FaUpload /> <span>Elegir archivo de imagen</span>
                          </button>
                          {userImageUrl && (
                            <button
                              type="button"
                              onClick={() => setUserImageUrl("")}
                              className="text-slate-500 hover:text-slate-700 font-bold px-3 py-2 text-xs"
                            >
                              Limpiar
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            O pega un enlace público de la imagen:
                          </label>
                          <input
                            type="text"
                            placeholder="https://ejemplo.com/foto-producto.jpg"
                            value={userImageUrl}
                            onChange={(e) => setUserImageUrl(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paso 2: Datos y detalles descriptivos del producto para Veo 3.1 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-900 text-sm block">
                    2. Datos y descripción de tu producto:
                  </span>

                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                        Nombre del producto u oferta:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Zapatillas Urban Ultra 2026, Café Espresso Orgánico..."
                        value={userProductName}
                        onChange={(e) => setUserProductName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-[11px] flex items-center justify-between">
                        <span>Descripción física / visual para el modelo de video:</span>
                        <span className="text-[10px] text-slate-400 font-normal">Opcional pero recomendado</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ej: Botella de vidrio ámbar con etiqueta mate dorada, textura suave, condensación fría en la superficie..."
                        value={userProductDescription}
                        onChange={(e) => setUserProductDescription(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Nuestros agentes incorporan estos detalles en la capa de texturas físicas y reflejos cinemáticos de Google Flow y Veo 3.1.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Paso 3: Opción de Logo con Remotion */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLogo}
                        onChange={(e) => setIncludeLogo(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="font-bold text-slate-900">
                        Superponer mi logo oficial en el video (vía Remotion)
                      </span>
                    </label>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Recomendado
                    </span>
                  </div>

                  {includeLogo && (
                    <div className="flex items-center gap-3 pt-1">
                      {userLogoUrl ? (
                        <div className="h-9 px-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
                          <img src={userLogoUrl} alt="Logo" className="h-6 max-w-[80px] object-contain" />
                          <span className="text-[10px] text-slate-500">Logo de marca detectado</span>
                        </div>
                      ) : (
                        <div className="text-amber-700 text-[11px] bg-amber-50 p-2 rounded-lg border border-amber-200 flex-1">
                          No tienes un logo configurado en tu perfil. Puedes subirlo en Configuración de Marca.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Paso 4: Prompt Resultante */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Prompt maestro que se enviará al modelo:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(userFinalPrompt, "user-modal-prompt")}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                    >
                      {copiedCommand === "user-modal-prompt" ? <FaCheck className="text-emerald-600" /> : <FaCopy />}
                      <span>Copiar</span>
                    </button>
                  </label>
                  <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-[11px] max-h-24 overflow-y-auto select-all">
                    {userFinalPrompt}
                  </div>
                </div>

                {/* Alerta de Cuota si está al límite */}
                {!hasVideoQuota && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <FaLock />
                      <span>Límite de videos alcanzado este mes ({videosUsed}/{videoLimit})</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Tu plan actual ha completado su cuota de generación de videos con agentes. 
                      Aun así, puedes copiar el prompt maestro generado arriba y usarlo directamente en Google Flow Labs o Veo 3.1 con tu foto.
                    </p>
                  </div>
                )}

                {/* Estado de generación */}
                {generatingVideo && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center space-y-2 text-indigo-950">
                    <FaSpinner className="text-2xl text-indigo-600 animate-spin mx-auto" />
                    <p className="font-bold text-xs">{videoGenProgress}</p>
                    <p className="text-[11px] text-indigo-700/80">
                      Este proceso puede tomar entre 30 y 90 segundos mientras nuestros agentes renderizan la escena.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción del modal */}
            {!generatedVideoResult && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  disabled={generatingVideo}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 w-full sm:w-auto"
                >
                  Cancelar
                </button>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                  {/* Botón siempre disponible: Copiar Prompt */}
                  <button
                    type="button"
                    onClick={() => handleCopy(userFinalPrompt, "copy-user-prompt-btn")}
                    className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {copiedCommand === "copy-user-prompt-btn" ? <FaCheck className="text-emerald-600" /> : <FaCopy />}
                    <span>Copiar Prompt con mi Imagen</span>
                  </button>

                  {/* Botón de Generar Video (si tiene cuota) */}
                  {hasVideoQuota ? (
                    <button
                      type="button"
                      onClick={handleGenerateUserVideo}
                      disabled={generatingVideo || userUploadingImage || !userImageUrl}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md disabled:opacity-50 transition-all"
                    >
                      {generatingVideo ? <FaSpinner className="animate-spin" /> : <FaPlay className="text-[10px]" />}
                      <span>Generar Video con nuestros agentes</span>
                    </button>
                  ) : (
                    <Link
                      href="/automatizacion-rrss/panel/planes"
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <span>Aumentar Cuota de Video</span>
                      <FaArrowRight className="text-[10px]" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NOTA EXPLICATIVA SOBRE GOOGLE FLOW Y VEO ── */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-6 md:p-8 flex items-start gap-4 text-indigo-950">
        <div className="p-3 bg-indigo-600 text-white rounded-2xl shrink-0 shadow-md">
          <FaLightbulb className="text-xl" />
        </div>
        <div className="space-y-1.5">
          <h4 className="font-black text-base text-indigo-950">
            ¿Cómo procesa Google Flow los comandos de video?
          </h4>
          <p className="text-xs md:text-sm text-indigo-900/80 leading-relaxed">
            Google Flow Labs utiliza un intérprete semántico que expande cada comando corto (como{" "}
            <code className="bg-indigo-200/60 text-indigo-950 px-1.5 py-0.5 rounded font-mono font-bold">
              /smoke reveal
            </code>
            ) en una descripción física y cinemática en inglés. Para alimentar directamente a Google Veo 3.1 o Gemini Video (Omni), 
            nuestros agentes generan la fórmula completa de 6 capas: acción física, mecánica de cámara, física de partículas, iluminación de estudio, color grading y cadencia temporal. Además, Remotion sobrepone tu logo de marca con perfecta nitidez visual.
          </p>
        </div>
      </div>
    </div>
  );
}
