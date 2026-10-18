"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { auth, storage } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useProfile } from "../../contexts/ProfileContext";
import { useQuota } from "../../hooks/useQuota";
import { 
  FLOW_COMMANDS, 
  FlowCommandDef, 
  buildVeoPromptFromCommand 
} from "../../lib/flow-command-translator";
import { 
  FaCopy, 
  FaCheck, 
  FaPlay, 
  FaImage, 
  FaVideo, 
  FaFilm, 
  FaMagic, 
  FaArrowRight,
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

export function VideoPromptsView() {
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const { activeProfile } = useProfile();
  const { videosUsed, videoLimit, refreshQuota } = useQuota(activeProfile?.id);

  // Lista dinámica de plantillas (combinación base + Firestore)
  const [templates, setTemplates] = useState<FlowCommandDef[]>(FLOW_COMMANDS);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);

  // Filtros interactivos
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryFilterModalOpen, setIsCategoryFilterModalOpen] = useState<boolean>(false);
  const [showTranslatorModal, setShowTranslatorModal] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [viewModes, setViewModes] = useState<Record<string, "image" | "video">>({});

  // Generador interactivo de comandos
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
  const [imageSourceMode, setImageSourceMode] = useState<"catalog" | "upload" | "agent_generate">("catalog");
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState<string>("");
  const [userImageUrl, setUserImageUrl] = useState<string>("");
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [userUploadingImage, setUserUploadingImage] = useState<boolean>(false);
  const [agentGeneratingImage, setAgentGeneratingImage] = useState<boolean>(false);
  const [agentImageSuccess, setAgentImageSuccess] = useState<string>("");
  const [agentImageAspectRatio, setAgentImageAspectRatio] = useState<"9:16" | "1:1">("9:16");
  const [userVideoFormat, setUserVideoFormat] = useState<"9:16" | "1:1" | "16:9">("9:16");
  const [userNiche, setUserNiche] = useState<string>("");
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

  // Categorías disponibles y conteos
  const availableCategories = useMemo(() => {
    const priority = [
      "E-Commerce & Productos",
      "Servicios & Marcas",
      "Lanzamientos & Revelación",
      "Creativos & Tendencias",
    ];
    const presentCats = Array.from(new Set(templates.map((c) => c.category))).filter(Boolean);
    const sorted = [
      ...priority.filter((p) => presentCats.includes(p)),
      ...presentCats.filter((c) => !priority.includes(c)),
    ];
    return sorted;
  }, [templates]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach((t) => {
      if (t.category) {
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
    });
    return counts;
  }, [templates]);

  // Filtrado interactivo de comandos de video
  const filteredCommands = useMemo(() => {
    return templates.filter((cmd) => {
      const matchCat =
        selectedCategories.length === 0 || selectedCategories.includes(cmd.category);
      const q = searchFilter.toLowerCase().trim();
      const matchSearch =
        !q ||
        cmd.command.toLowerCase().includes(q) ||
        cmd.name.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        (cmd.category && cmd.category.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [templates, selectedCategories, searchFilter]);

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
      const commandSlug = (editingTemplate.command || "sample").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
      const ext = file.name.split(".").pop() || (type === "video" ? "mp4" : "jpg");
      const fileName = `${commandSlug}_${type}_${Date.now()}.${ext}`;

      let downloadUrl = "";

      // 1. Intentar subida directa al bucket con SDK de Firebase (cliente), evitando límites de proxy HTTP (Nginx 413)
      try {
        const storageRef = ref(storage, `users/${user.uid}/flow_showcase/${fileName}`);
        const snap = await uploadBytes(storageRef, file, {
          contentType: file.type || (type === "video" ? "video/mp4" : "image/jpeg"),
        });
        downloadUrl = await getDownloadURL(snap.ref);
      } catch (clientErr: any) {
        console.warn("Subida directa por cliente no disponible, usando ruta de servidor...", clientErr);
        // Fallback a API route
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

        if (!res.ok) {
          let errText = "Error al subir archivo";
          try {
            const errJson = await res.json();
            errText = errJson.error || errText;
          } catch {
            const raw = await res.text();
            if (res.status === 413) {
              errText = "El archivo excede el tamaño máximo permitido por el servidor web.";
            } else {
              errText = `Error (${res.status}): ${raw.slice(0, 120)}`;
            }
          }
          throw new Error(errText);
        }

        const data = await res.json();
        downloadUrl = data.url;
      }

      if (!downloadUrl) throw new Error("No se pudo obtener la URL del archivo subido.");

      if (type === "image") {
        setEditingTemplate((prev) => ({ ...prev, sampleBaseImage: downloadUrl }));
      } else {
        setEditingTemplate((prev) => ({ ...prev, sampleFinalVideo: downloadUrl }));
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
    setUserVideoFormat("9:16");
    setAgentImageAspectRatio("9:16");
    setCatalogSearch("");
    setUserModalError("");
    setAgentImageSuccess("");
    setGeneratedVideoResult(null);
    setIncludeLogo(!!activeProfile?.logoUrl);
    setUserLogoUrl(activeProfile?.logoUrl || "");
    setUserNiche(activeProfile?.rubro || "");

    if (catalogItems.length > 0) {
      setImageSourceMode("catalog");
      const firstWithImage = catalogItems.find((it) => !!it.imageUrl) || catalogItems[0];
      setSelectedCatalogItemId(firstWithImage.id);
      setUserProductName(firstWithImage.name || "");
      setUserProductDescription(firstWithImage.description || "");
      setUserImageUrl(firstWithImage.imageUrl || "");
    } else {
      // Si no tiene catálogo, ofrecer directamente el modo de crear foto con nuestros agentes
      setImageSourceMode("agent_generate");
      setSelectedCatalogItemId(null);
      setUserProductName(activeProfile?.name || "");
      setUserProductDescription("");
      setUserImageUrl("");
    }

    setShowUserModal(true);
  };

  const handleSelectCatalogItem = (item: any) => {
    setSelectedCatalogItemId(item.id);
    setUserProductName(item.name || "");
    setUserProductDescription(item.description || "");
    setUserImageUrl(item.imageUrl || "");
    setAgentImageSuccess("");
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
    setAgentImageSuccess("");

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

  // Generar fotografía base con nuestros agentes cuando no tiene foto previa
  const handleGenerateBaseImageWithAgent = async (): Promise<string | null> => {
    if (!user) return null;
    if (!userProductName.trim()) {
      setUserModalError("Por favor ingresa el nombre de tu producto o servicio para que nuestros agentes lo generen.");
      return null;
    }

    setAgentGeneratingImage(true);
    setUserModalError("");
    setAgentImageSuccess("");

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/video-prompts/generate-base-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName: userProductName.trim(),
          rubro: userNiche || activeProfile?.rubro || "Comercial",
          description: userProductDescription.trim(),
          aspectRatio: agentImageAspectRatio,
          commandCategory: activeUserEffect?.category,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo generar la imagen base con nuestros agentes.");
      }

      setUserImageUrl(data.imageUrl);
      setAgentImageSuccess("¡Fotografía comercial base generada con éxito por nuestros agentes! Ya puedes proceder a crear el video.");
      refreshQuota();
      return data.imageUrl;
    } catch (err: any) {
      setUserModalError(err.message || "Error al generar la imagen del producto.");
      return null;
    } finally {
      setAgentGeneratingImage(false);
    }
  };

  // Prompt específico para el usuario en el modal enriquecido con descripción de producto y formato
  const userFinalPrompt = useMemo(() => {
    if (!activeUserEffect) return "";
    return buildVeoPromptFromCommand(activeUserEffect, {
      productName: userProductName || activeProfile?.name || "el producto",
      rubro: userNiche || activeProfile?.rubro || "comercial",
      aspectRatio: userVideoFormat,
      additionalDetails: userProductDescription
        ? `Product visual features: ${userProductDescription}`
        : undefined,
    });
  }, [activeUserEffect, userProductName, userNiche, activeProfile, userVideoFormat, userProductDescription]);

  // Verificar si la cuota permite video
  const hasVideoQuota = useMemo(() => {
    if (isAdminUser) return true;
    return videoLimit > 0 && videosUsed < videoLimit;
  }, [isAdminUser, videoLimit, videosUsed]);

  // Ejecutar generación de video con agentes (Pipeline en 2 pasos si no tiene foto)
  const handleGenerateUserVideo = async () => {
    if (!user || !activeUserEffect) return;

    if (!hasVideoQuota) {
      setUserModalError("Has alcanzado el límite mensual de videos de tu plan.");
      return;
    }

    let effectiveImageUrl = userImageUrl;

    // Si no tiene imagen previa pero tiene un nombre de producto definido, generar la fotografía con nuestros agentes (Paso 1)
    if (!effectiveImageUrl) {
      if (userProductName.trim()) {
        setVideoGenProgress("Paso 1 de 2: Nuestros agentes están generando la fotografía publicitaria de producto...");
        setGeneratingVideo(true);
        const generatedImg = await handleGenerateBaseImageWithAgent();
        if (!generatedImg) {
          setGeneratingVideo(false);
          setVideoGenProgress("");
          return;
        }
        effectiveImageUrl = generatedImg;
      } else {
        setUserModalError("Por favor selecciona un producto de tu catálogo, sube una foto o escribe el nombre de tu producto para que nuestros agentes lo generen.");
        return;
      }
    }

    setGeneratingVideo(true);
    setUserModalError("");
    setGeneratedVideoResult(null);
    setVideoGenProgress("Paso 2 de 2: Conectando con Google Flow y estructurando física de Veo 3.1...");

    try {
      const token = await user.getIdToken();

      setTimeout(() => {
        setVideoGenProgress("Renderizando dinámica de cámara, partículas y destellos cinemáticos...");
      }, 4000);

      setTimeout(() => {
        if (includeLogo) {
          setVideoGenProgress("Componiendo capa de marca con logo en alta definición (Remotion)...");
        } else {
          setVideoGenProgress("Finalizando renderizado cinemático en alta resolución...");
        }
      }, 9000);

      const res = await fetch("/api/ai/image-to-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrl: effectiveImageUrl,
          prompt: userFinalPrompt,
          motionStyle: activeUserEffect.command,
          businessName: userProductName || activeProfile?.name || "",
          rubro: userNiche || activeProfile?.rubro || "General",
          renderMode: includeLogo ? "remotion" : "raw",
          logoUrl: includeLogo ? userLogoUrl : "",
          profileId: activeProfile?.id || "default",
          userId: user.uid,
          aspectRatio: userVideoFormat,
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
      {/* ── HEADER LIMPIO & BARRA DE ACCIONES ── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <FaFilm className="text-indigo-600" />
                <span>Estilos de Video & Product Reveals</span>
              </div>

              {/* Chip de cuota de video */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  hasVideoQuota
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                <FaVideo className="text-[10px]" />
                <span>
                  Cuota Videos: {isAdminUser ? "Ilimitados (Admin)" : `${videosUsed} / ${videoLimit} este mes`}
                </span>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Efectos de Movimiento & Animación de Producto
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-3xl">
              Transforma la fotografía fija de tu producto en un video publicitario de alto impacto. Selecciona un efecto para animarlo con nuestros agentes.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowTranslatorModal(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm text-xs"
              title="Abre el generador y traductor de comandos interactivo"
            >
              <FaMagic className="text-xs" />
              <span>⚡ Convertir comando en prompt</span>
            </button>

            {isAdminUser && (
              <button
                type="button"
                onClick={() => openAdminEdit()}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm text-xs"
                title="Añadir nueva muestra de video al catálogo"
              >
                <FaPlus className="text-xs" />
                <span>+ Crear Nuevo Prompt (Admin)</span>
              </button>
            )}

            <Link
              href="/automatizacion-rrss/panel/poc-video"
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-all text-xs"
            >
              <FaPlay className="text-[10px]" />
              <span>Generador Libre</span>
            </Link>
          </div>
        </div>

        {/* Barra de Filtro Interactivo (Buscador + Selector de Categorías) */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar por comando, nombre o descripción (ej: /smoke, macro, fuego)..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] flex items-center justify-center font-bold transition-colors"
                title="Limpiar búsqueda"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Botón Disparador del Modal de Categorías */}
          <button
            type="button"
            onClick={() => setIsCategoryFilterModalOpen(true)}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 shadow-xs ${
              selectedCategories.length === 0
                ? "bg-slate-900 hover:bg-slate-800 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-500/20"
            }`}
            title="Abrir selector de categorías de video"
          >
            <span>{selectedCategories.length === 0 ? "⚡" : "🎨"}</span>
            <span className="font-bold">
              {selectedCategories.length === 0
                ? "Filtrar Categorías"
                : selectedCategories.length === 1
                ? selectedCategories[0]
                : `${selectedCategories.length} Categorías`}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                selectedCategories.length === 0
                  ? "bg-slate-800 text-slate-300 border border-slate-700"
                  : "bg-indigo-700 text-white"
              }`}
            >
              {selectedCategories.length === 0
                ? availableCategories.length
                : selectedCategories.length === 1
                ? categoryCounts[selectedCategories[0]] || 0
                : selectedCategories.length}
            </span>
          </button>
        </div>

        {/* Barra de Filtro Activo si hay categorías seleccionadas */}
        {selectedCategories.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Filtrando por:</span>
              {selectedCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                >
                  <span>{cat}</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full font-black">
                    {categoryCounts[cat] || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== cat))}
                    className="text-indigo-400 hover:text-indigo-800 font-bold ml-0.5 transition-colors"
                    title={`Remover filtro "${cat}"`}
                  >
                    ✕
                  </button>
                </span>
              ))}
              {selectedCategories.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategories([])}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline ml-2 transition-colors"
                  title="Quitar todos los filtros"
                >
                  Limpiar todos
                </button>
              )}
            </div>
            <div className="text-xs font-bold text-slate-400 ml-auto">
              {filteredCommands.length} {filteredCommands.length === 1 ? "efecto encontrado" : "efectos encontrados"}
            </div>
          </div>
        )}
      </div>

      {/* ── CATÁLOGO DE EFECTOS (SHOWCASE ANTES -> DESPUÉS) ── */}
      <div id="comandos-grid" className="space-y-6 pt-2">

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
                    list="flow-categories-datalist"
                    placeholder="Ej: E-Commerce & Productos"
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                  <datalist id="flow-categories-datalist">
                    <option value="E-Commerce & Productos" />
                    <option value="Servicios & Marcas" />
                    <option value="Lanzamientos & Revelación" />
                    <option value="Creativos & Tendencias" />
                  </datalist>
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
                {/* Selector de Formato de Video */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-bold text-slate-900 text-sm">
                      Formato y Orientación del Video:
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      {userVideoFormat === "9:16" ? "9:16 Vertical" : userVideoFormat === "1:1" ? "1:1 Cuadrado" : "16:9 Horizontal"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "9:16", label: "Reel / TikTok", desc: "9:16 Vertical", icon: "📱" },
                      { id: "1:1", label: "Post / Feed", desc: "1:1 Cuadrado", icon: "⏹️" },
                      { id: "16:9", label: "Paisaje / YouTube", desc: "16:9 Horizontal", icon: "🖥️" },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => {
                          setUserVideoFormat(fmt.id as any);
                          setAgentImageAspectRatio(fmt.id === "16:9" ? "1:1" : (fmt.id as any));
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          userVideoFormat === fmt.id
                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-base block mb-0.5">{fmt.icon}</span>
                        <span className="font-bold text-xs block truncate">{fmt.label}</span>
                        <span className={`text-[10px] block ${userVideoFormat === fmt.id ? "text-slate-300" : "text-slate-400"}`}>
                          {fmt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

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
                  <div className="grid grid-cols-1 sm:grid-cols-3 bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setImageSourceMode("catalog");
                        if (!selectedCatalogItemId && catalogItems.length > 0) {
                          handleSelectCatalogItem(catalogItems[0]);
                        }
                      }}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        imageSourceMode === "catalog"
                          ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <FaBoxOpen className="text-sm shrink-0" />
                      <span>Mi Biblioteca</span>
                      {catalogItems.length > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
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
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        imageSourceMode === "upload"
                          ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <FaUpload className="text-sm shrink-0" />
                      <span>Subir Mi Foto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setImageSourceMode("agent_generate");
                        if (!userProductName) setUserProductName(activeProfile?.name || "");
                      }}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        imageSourceMode === "agent_generate"
                          ? "bg-indigo-600 text-white shadow-sm font-black"
                          : "text-indigo-700 hover:bg-indigo-50 font-bold"
                      }`}
                    >
                      <FaMagic className="text-sm shrink-0" />
                      <span>✨ Crear Foto con Agentes</span>
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

                {/* CONTENIDO MODO 3: CREAR FOTO CON NUESTROS AGENTES */}
                {imageSourceMode === "agent_generate" && (
                  <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/70 p-4 sm:p-5 rounded-2xl border border-indigo-200 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] uppercase tracking-wider mb-1">
                          <FaMagic /> Pipeline en 2 Pasos (Foto Comercial → Video Flow)
                        </div>
                        <h4 className="font-black text-slate-900 text-sm">
                          Nuestros agentes crean la fotografía base de tu producto o servicio
                        </h4>
                        <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                          Si no tienes fotos reales, nuestros agentes diseñan una fotografía de estudio publicitaria en alta definición con encuadre limpio para que el video mantenga perfecta coherencia visual.
                        </p>
                      </div>

                      {/* Selector de Proporción */}
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0 self-start">
                        <button
                          type="button"
                          onClick={() => setAgentImageAspectRatio("9:16")}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                            agentImageAspectRatio === "9:16"
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          9:16 (Reel)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAgentImageAspectRatio("1:1")}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                            agentImageAspectRatio === "1:1"
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          1:1 (Post)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                          Nombre del producto o servicio: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Hamburguesa Angus Triple, Perfume Noir, Software Dental..."
                          value={userProductName}
                          onChange={(e) => setUserProductName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                          Rubro o Nicho:
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Gastronomía, Barbería, Cosmética, Tecnología..."
                          value={userNiche}
                          onChange={(e) => setUserNiche(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                        Detalles visuales clave de la fotografía:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Pan brioche brillante, queso derretido, fondo oscuro elegante, iluminación cálida de estudio..."
                        value={userProductDescription}
                        onChange={(e) => setUserProductDescription(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Previsualización si ya fue generada */}
                    {userImageUrl ? (
                      <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center gap-3.5">
                        <div className="w-20 h-28 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-sm">
                          <img src={userImageUrl} alt="Foto Base Generada" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                          <div className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <FaCheck /> Imagen base lista para video
                          </div>
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {userProductName}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            La imagen base ya está anclada. Al presionar "Generar Video", nuestros agentes animarán este objeto con el efecto {activeUserEffect.name}.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerateBaseImageWithAgent}
                          disabled={agentGeneratingImage}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shrink-0"
                        >
                          {agentGeneratingImage ? <FaSpinner className="animate-spin" /> : "Regenerar otra foto"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <p className="text-[11px] text-slate-500">
                          Haz clic abajo para generar la foto base ahora, o presiona directo "Generar Video" y nuestros agentes harán la secuencia completa automáticamente.
                        </p>
                        <button
                          type="button"
                          onClick={handleGenerateBaseImageWithAgent}
                          disabled={agentGeneratingImage || !userProductName.trim()}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                        >
                          {agentGeneratingImage ? <FaSpinner className="animate-spin" /> : <FaMagic />}
                          <span>{agentGeneratingImage ? "Creando fotografía base..." : "Generar Foto Base con Agentes"}</span>
                        </button>
                      </div>
                    )}

                    {agentImageSuccess && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2.5 rounded-xl flex items-center gap-2 font-medium">
                        <FaCheck className="text-emerald-600 shrink-0" />
                        <span>{agentImageSuccess}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Paso 2: Datos y detalles descriptivos del producto para Veo 3.1 (solo visible si no es modo agent_generate para no duplicar campos) */}
                {imageSourceMode !== "agent_generate" && (
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
                )}

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

                {/* Paso 4: Configuración técnica del efecto */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700 text-xs">
                      Efecto cinemático de cámara & iluminación:
                    </span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                      {activeUserEffect.command}
                    </span>
                  </div>
                  <div className="bg-slate-900 text-slate-300 rounded-xl p-3 font-mono text-[11px] max-h-20 overflow-y-auto select-all border border-slate-800">
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
                      Tu plan actual ha completado su cuota mensual de videos. Puedes aumentar tu plan para desbloquear más generaciones con nuestros agentes.
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
                  {/* Botón de Generar Video (habilitado si tiene cuota) */}
                  {hasVideoQuota ? (
                    <button
                      type="button"
                      onClick={handleGenerateUserVideo}
                      disabled={generatingVideo || userUploadingImage || agentGeneratingImage}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all w-full sm:w-auto"
                    >
                      {generatingVideo || agentGeneratingImage ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaPlay className="text-[10px]" />
                      )}
                      <span>
                        {imageSourceMode === "agent_generate" && !userImageUrl
                          ? "Generar Foto + Video (2 Pasos)"
                          : "Generar Video con nuestros agentes"}
                      </span>
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

      {/* ── MODAL DE FILTRO DE CATEGORÍAS ── */}
      {isCategoryFilterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎨</span>
                <h3 className="font-black text-slate-900 text-lg">Filtrar por Categoría</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryFilterModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full"
              >
                <FaTimes />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Selecciona una o más categorías para filtrar los efectos de video en el catálogo:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategories([]);
                  setIsCategoryFilterModalOpen(false);
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all ${
                  selectedCategories.length === 0
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>✨</span>
                  <span>Todas las Categorías</span>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-black">
                  {templates.length}
                </span>
              </button>

              {availableCategories.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategories((prev) => prev.filter((c) => c !== cat));
                      } else {
                        setSelectedCategories((prev) => [...prev, cat]);
                      }
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-xs ring-1 ring-indigo-400"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                          isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <FaCheck />}
                      </span>
                      <span>{cat}</span>
                    </div>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-black">
                      {categoryCounts[cat] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCategories([])}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Limpiar selección
              </button>
              <button
                type="button"
                onClick={() => setIsCategoryFilterModalOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONVERTIR COMANDO EN PROMPT MAESTRO ── */}
      {showTranslatorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 animate-in zoom-in-95 duration-200 relative">
            <button
              type="button"
              onClick={() => setShowTranslatorModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full"
            >
              <FaTimes />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 pr-10">
              <div>
                <div className="inline-flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                  <FaMagic /> Generador & Traductor de Comandos
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  Convierte cualquier comando en un prompt maestro
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Personaliza el comando con tu producto y obtén el prompt calibrado para Google Flow y Veo 3.1.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-center">
                {(["9:16", "16:9", "1:1"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setFormatRatio(ratio)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      formatRatio === ratio
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
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
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
                      placeholder="Ej: Hamburguesa Doble, Perfume..."
                      value={customProduct}
                      onChange={(e) => setCustomProduct(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Rubro / Estilo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Gastronomía, Barbería..."
                      value={customNiche}
                      onChange={(e) => setCustomNiche(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 w-24 shrink-0">Cámara:</span>
                    <span className="text-slate-600 line-clamp-2">{activeGenCmd.cameraMovement}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 w-24 shrink-0">Física:</span>
                    <span className="text-slate-600 line-clamp-2">{activeGenCmd.physicsEffect}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 w-24 shrink-0">Iluminación:</span>
                    <span className="text-slate-600 line-clamp-2">{activeGenCmd.lightingStyle}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    Prompt Maestro Optimizado (Veo 3.1 & Flow)
                  </label>
                  <button
                    type="button"
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

                <div className="flex-1 bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs leading-relaxed border border-slate-800 relative group overflow-y-auto max-h-64">
                  <p className="select-all text-indigo-100 whitespace-pre-wrap">{interactivePromptText}</p>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Fórmula calibrada para Google Veo 3.1
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTranslatorModal(false);
                      openUserCreateModal(activeGenCmd);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
                  >
                    <FaPlay className="text-[10px]" />
                    <span>Usar este efecto en mi foto</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function VideoPromptsPage() {
  return <VideoPromptsView />;
}
