"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useProfile } from "../../../../contexts/ProfileContext";
import Link from "next/link";
import RemotionReelPlayer from "../../../../components/video/RemotionReelPlayer";
import { VideoComposition } from "../../../../lib/video-poc-service";
import TikTokPostSettings, { TikTokSettingsState, DEFAULT_TIKTOK_SETTINGS } from "../../../../components/crear/TikTokPostSettings";
import {
  VIDEO_PROMPT_STYLES,
  videoPromptCategories,
  VideoPromptTemplate
} from "../../../../lib/video-prompt-templates";
import {
  FLOW_COMMANDS,
  FlowCommandDef,
  buildVeoPromptFromCommand
} from "../../../../lib/flow-command-translator";
import { FaCopy, FaCheck, FaMagic, FaFilm, FaCamera, FaPlay, FaLightbulb, FaWhatsapp, FaDownload, FaSpinner, FaUpload, FaTrash, FaCheckCircle } from "react-icons/fa";


function VideoPoCContent() {
  const { activeProfile, updateProfileById, updateActiveProfile } = useProfile();
  const prof = activeProfile as any;
  const searchParams = useSearchParams();
  const ideaParam = searchParams?.get("idea");

  const [userDoc, setUserDoc] = useState<any>(null);

  const [topic, setTopic] = useState<string>(ideaParam || "3 Consejos Clave para Triunfar en Gastronomía");
  const [rubro, setRubro] = useState<string>(prof?.rubro || prof?.niche || "Gastronomía & Restaurantes");
  const [visualDirection, setVisualDirection] = useState<string>("");
  const [style, setStyle] = useState<"vibrante" | "minimalista" | "cyberpunk" | "corporativo">("vibrante");
  const [motionEffect, setMotionEffect] = useState<string>("zoom_in");

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Composición del Reel (inicialmente null para no generar automáticamente)
  const [composition, setComposition] = useState<VideoComposition | null>(null);

  // Imágenes personalizadas para escenas de Reel (hasta 3)
  const [uploadedReelImages, setUploadedReelImages] = useState<string[]>([]);
  const [isUploadingReelImage, setIsUploadingReelImage] = useState<boolean>(false);

  // Estado del Checklist de carga de imágenes de fondo por escena
  const [imageStatus, setImageStatus] = useState<Record<number, "loading" | "ready" | "error">>({});
  const [networkCopies, setNetworkCopies] = useState<Record<string, string>>({});
  const [activeNetworkTab, setActiveNetworkTab] = useState<string>("tiktok");

  // Tab Principal: Remotion vs Biblioteca de Prompts
  const [activeMainTab, setActiveMainTab] = useState<"remotion" | "prompts">("remotion");
  
  // Biblioteca de Prompts con Flow Commands y Videos de Referencia
  const [flowTemplates, setFlowTemplates] = useState<FlowCommandDef[]>(FLOW_COMMANDS);
  const [selectedFlowCommand, setSelectedFlowCommand] = useState<FlowCommandDef>(FLOW_COMMANDS[0]);
  const [selectedFlowCategory, setSelectedFlowCategory] = useState<string>("Todas");
  const [selectedPromptCatalogoId, setSelectedPromptCatalogoId] = useState<string>("");

  const [promptBusiness, setPromptBusiness] = useState<string>(prof?.nombre || prof?.name || "");
  const [promptRubro, setPromptRubro] = useState<string>(prof?.rubro || prof?.niche || "General");
  const [promptConcept, setPromptConcept] = useState<string>("");
  const [promptCustomDir, setPromptCustomDir] = useState<string>("");
  const [copiedPromptText, setCopiedPromptText] = useState<boolean>(false);

  // Cargar plantillas dinámicas desde Firestore (con muestras de admin)
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/video-prompts/templates", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.templates && Array.isArray(data.templates) && data.templates.length > 0) {
            setFlowTemplates(data.templates);
            setSelectedFlowCommand((prev) => {
              const found = data.templates.find((t: FlowCommandDef) => t.command === prev?.command);
              return found || data.templates[0];
            });
          }
        }
      } catch (e) {
        console.warn("[PoC Video] Error cargando plantillas de video:", e);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (prof?.nombre || prof?.name) {
      setPromptBusiness(prof?.nombre || prof?.name);
    }
    if (prof?.rubro || prof?.niche) {
      setPromptRubro(prof?.rubro || prof?.niche);
    }
  }, [prof?.nombre, prof?.name, prof?.rubro, prof?.niche]);

  const compiledFlowPrompt = selectedFlowCommand
    ? buildVeoPromptFromCommand(selectedFlowCommand, {
        productName: promptConcept || promptBusiness || "el producto",
        rubro: promptRubro,
        additionalDetails: promptCustomDir,
      })
    : "";

  const handleCopyPrompt = () => {
    if (compiledFlowPrompt) {
      navigator.clipboard.writeText(compiledFlowPrompt);
      setCopiedPromptText(true);
      setTimeout(() => setCopiedPromptText(false), 2500);
    }
  };

  const flowCategories = [
    "Todas",
    ...Array.from(new Set(flowTemplates.map((t) => t.category).filter(Boolean))),
  ];

  const filteredFlowTemplates =
    selectedFlowCategory === "Todas"
      ? flowTemplates
      : flowTemplates.filter((s) => s.category === selectedFlowCategory);

  // Configuración del Video (Image-to-Video)
  const [imageSourceType, setImageSourceType] = useState<"logo" | "product">("logo");
  const [baseVideoImageUrl, setBaseVideoImageUrl] = useState<string>(prof?.logoUrl || prof?.logo || "");
  const [videoRenderMode, setVideoRenderMode] = useState<"raw" | "remotion">("raw");
  const [isGeneratingN8nVideo, setIsGeneratingN8nVideo] = useState<boolean>(false);
  const [n8nGeneratedVideoUrl, setN8nGeneratedVideoUrl] = useState<string>("");
  const [n8nGenerationError, setN8nGenerationError] = useState<string>("");
  const [n8nProgressText, setN8nProgressText] = useState<string>("");

  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState<boolean>(false);
  const [logoUpdateSuccess, setLogoUpdateSuccess] = useState<boolean>(false);

  // Helper para subir archivos a Firebase Storage vía API
  const handleUploadImageFile = async (file: File): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Debes iniciar sesión para subir imágenes.");
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
    if (!res.ok || !data.url) throw new Error(data.error || "Error al subir la imagen.");
    return data.url;
  };

  // Cambiar el logo del negocio (actualiza perfil de la cuenta y video)
  const handleLogoChange = async (file: File) => {
    try {
      setIsUploadingLogo(true);
      setLogoUpdateSuccess(false);
      const url = await handleUploadImageFile(file);
      if (activeProfile?.id) {
        if (updateProfileById) {
          await updateProfileById(activeProfile.id, { logoUrl: url });
        } else if (updateActiveProfile) {
          await updateActiveProfile({ logoUrl: url });
        }
      }
      setBaseVideoImageUrl(url);
      setLogoUpdateSuccess(true);
      setTimeout(() => setLogoUpdateSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error al actualizar logo:", err);
      alert(err.message || "Error al actualizar logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Agregar imagen para Reel (hasta 3)
  const handleAddReelImage = async (file: File) => {
    if (uploadedReelImages.length >= 3) return;
    try {
      setIsUploadingReelImage(true);
      const url = await handleUploadImageFile(file);
      setUploadedReelImages((prev) => [...prev, url]);
    } catch (err: any) {
      console.error("Error al subir foto para Reel:", err);
      alert(err.message || "Error al subir la imagen");
    } finally {
      setIsUploadingReelImage(false);
    }
  };

  const handleRemoveReelImage = (idxToRemove: number) => {
    setUploadedReelImages((prev) => prev.filter((_, i) => i !== idxToRemove));
  };

  const handleGenerateN8nVideo = async () => {
    if (!baseVideoImageUrl || !baseVideoImageUrl.startsWith("http")) {
      setN8nGenerationError("Por favor selecciona o sube una imagen válida (logo o foto de producto) para animar.");
      return;
    }

    setIsGeneratingN8nVideo(true);
    setN8nGenerationError("");
    setN8nGeneratedVideoUrl("");
    setN8nProgressText("Nuestros agentes están procesando el video...");

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";
      const res = await fetch("/api/ai/image-to-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          imageUrl: baseVideoImageUrl,
          prompt: compiledFlowPrompt,
          motionStyle: selectedFlowCommand?.command || "/360 product orbit",
          businessName: promptBusiness,
          rubro: promptRubro,
          renderMode: videoRenderMode,
          logoUrl: activeProfile?.logoUrl || activeProfile?.logo || "",
          postId: `poc_${Date.now()}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fallo en la generación de video.");
      }

      if (data.videoUrl) {
        setN8nGeneratedVideoUrl(data.videoUrl);
        setN8nProgressText("¡Video generado con éxito!");
      } else {
        throw new Error("No se retornó una URL de video válida.");
      }
    } catch (err: any) {
      console.error("Error al generar video:", err);
      setN8nGenerationError(err.message || "Error al procesar el video con nuestros agentes.");
    } finally {
      setIsGeneratingN8nVideo(false);
    }
  };

  const handleRegenerateSceneImage = async (idx: number, scene: any) => {
    setImageStatus((prev) => ({ ...prev, [idx]: "loading" }));
    try {
      const res = await fetch("/api/poc/video/regenerate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: scene.imagePrompt || `${rubro} ${scene.title} cinematic background`,
          rubro: rubro
        })
      });
      const data = await res.json();
      if (data.bgImageUrl) {
        setComposition((prev) => {
          if (!prev) return null;
          const newScenes = [...prev.scenes];
          newScenes[idx] = { ...newScenes[idx], bgImageUrl: data.bgImageUrl };
          return { ...prev, scenes: newScenes };
        });
        setImageStatus((prev) => ({ ...prev, [idx]: "ready" }));
        return;
      }
    } catch (e) {
      console.warn("Error regenerando imagen vía agente, aplicando fallback:", e);
    }
    // Fallback directo
    const newSeed = Math.floor(Math.random() * 1000000);
    const promptText = encodeURIComponent(scene.imagePrompt || `${rubro} ${scene.title} cinematic background`);
    const newBgUrl = `https://image.pollinations.ai/prompt/${promptText}?width=1080&height=1920&nologo=true&seed=${newSeed}`;
    setComposition((prev) => {
      if (!prev) return null;
      const newScenes = [...prev.scenes];
      newScenes[idx] = { ...newScenes[idx], bgImageUrl: newBgUrl };
      return { ...prev, scenes: newScenes };
    });
    setImageStatus((prev) => ({ ...prev, [idx]: "ready" }));
  };


  // Estado del Modal de Programación
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return tmr.toISOString().split("T")[0];
  });
  const [scheduledTime, setScheduledTime] = useState<string>("15:00");
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);
  const [isPublishingNow, setIsPublishingNow] = useState<boolean>(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<string>("");
  const [tiktokSettings, setTiktokSettings] = useState<TikTokSettingsState>(DEFAULT_TIKTOK_SETTINGS);

  const [isGeneratingCopy, setIsGeneratingCopy] = useState<boolean>(false);

  useEffect(() => {
    const u = auth.currentUser;
    if (u) {
      getDoc(doc(db, "users", u.uid))
        .then((snap) => {
          if (snap.exists()) setUserDoc(snap.data());
        })
        .catch(console.error);
    }
  }, []);

  const [catalogoItems, setCatalogoItems] = useState<any[]>([]);
  const [selectedCatalogoItem, setSelectedCatalogoItem] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (activeProfile?.id) {
      const fetchCatalogo = async () => {
        try {
          const u = auth.currentUser;
          if (!u) return;
          const token = await u.getIdToken();
          const res = await fetch(`/api/catalogo?profileId=${activeProfile.id}`, {
            headers: {
              "Cache-Control": "no-cache",
              "Authorization": `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            const items = data.items || [];
            setCatalogoItems(items);
          }
        } catch (e) {
          console.warn("[PoC Video] Error loading catalogo items:", e);
        }
      };
      fetchCatalogo();
    }
  }, [activeProfile?.id]);

  const isValidToken = (t: any) => !!t && t !== "null" && t !== "undefined" && t !== "";
  const isDefault = activeProfile?.id === "default";

  const hasIg = isValidToken(activeProfile?.instagramToken_enc) || (isDefault && isValidToken(userDoc?.instagramToken_enc));
  const hasTt = isValidToken(activeProfile?.tiktokToken_enc) || (isDefault && isValidToken(userDoc?.tiktokToken_enc));
  const hasYt = isValidToken(activeProfile?.youtubeToken_enc || activeProfile?.accounts?.youtube?.token || activeProfile?.youtubeConnected) || (isDefault && isValidToken(userDoc?.youtubeToken_enc));

  useEffect(() => {
    const connected: string[] = [];
    if (hasIg) connected.push("instagram");
    if (hasTt) connected.push("tiktok");
    if (hasYt) connected.push("youtube");
    setSelectedNetworks(connected);

    if (activeProfile?.tiktokDefaults) {
      setTiktokSettings(activeProfile.tiktokDefaults);
    } else if (userDoc?.tiktokDefaults && isDefault) {
      setTiktokSettings(userDoc.tiktokDefaults);
    }
  }, [hasIg, hasTt, hasYt, activeProfile?.tiktokDefaults, userDoc?.tiktokDefaults, isDefault]);

  // Precargar imágenes de las escenas cuando la composición cambia
  useEffect(() => {
    if (!composition?.scenes) return;

    const newStatus: Record<number, "loading" | "ready" | "error"> = {};
    composition.scenes.forEach((_, idx) => {
      newStatus[idx] = "loading";
    });
    setImageStatus(newStatus);

    const fallbackImages = [
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1080&h=1920&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1080&h=1920&q=80",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1080&h=1920&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1080&h=1920&q=80",
    ];

    composition.scenes.forEach((scene, idx) => {
      if (scene.bgImageUrl) {
        const img = new Image();
        img.src = scene.bgImageUrl;
        img.onload = () => {
          setImageStatus((prev) => ({ ...prev, [idx]: "ready" }));
        };
        img.onerror = () => {
          const fallback = fallbackImages[idx % fallbackImages.length];
          setComposition((prev) => {
            if (!prev) return null;
            const newScenes = [...prev.scenes];
            newScenes[idx] = { ...newScenes[idx], bgImageUrl: fallback };
            return { ...prev, scenes: newScenes };
          });
          setImageStatus((prev) => ({ ...prev, [idx]: "ready" }));
        };
      } else {
        setImageStatus((prev) => ({ ...prev, [idx]: "ready" }));
      }
    });
  }, [composition?.scenes?.map((s) => s.bgImageUrl).join(",")]);

  const handleGenerateVideo = async () => {
    if (!topic.trim()) {
      setErrorMsg("Por favor, ingresa un tema para generar el Reel.");
      return;
    }

    setErrorMsg("");
    setScheduleSuccess("");
    setLoading(true);

    try {
      const selectedData = selectedCatalogoItem 
        ? catalogoItems.find(i => i.id === selectedCatalogoItem.id) 
        : null;

      const res = await fetch("/api/poc/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          rubro: rubro.trim() || "General",
          style,
          motionEffect,
          uploadedImages: uploadedReelImages.length > 0 ? uploadedReelImages : undefined,
          catalogoItem: selectedData ? {
            name: selectedData.name,
            description: selectedData.description,
            imageUrl: selectedData.imageUrl
          } : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al generar la composición del video.");
      }

      setComposition(data.composition);
      if (data.composition?.copiesByNetwork) {
        setNetworkCopies(data.composition.copiesByNetwork);
      } else if (data.composition?.copyText) {
        setNetworkCopies({
          tiktok: data.composition.copyText.slice(0, 140),
          instagram: data.composition.copyText,
          youtube: data.composition.copyText.slice(0, 100) + ' #Shorts',
          facebook: data.composition.copyText,
        });
      }
    } catch (err: any) {
      console.error("Error al generar Reel:", err);
      setErrorMsg(err.message || "Error al conectar con la IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCopy = async () => {
    if (!topic.trim()) return;
    setIsGeneratingCopy(true);
    try {
      const selectedData = selectedCatalogoItem 
        ? catalogoItems.find(i => i.id === selectedCatalogoItem.id) 
        : null;

      const res = await fetch("/api/poc/video/generate-copies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: topic,
          rubro: rubro,
          businessName: activeProfile?.name || "",
          targetProfile: activeProfile,
          networks: selectedNetworks.length > 0 ? selectedNetworks : ["tiktok", "instagram", "youtube"],
          visualDirection: visualDirection || "",
          catalogoItem: selectedData ? {
            name: selectedData.name,
            description: selectedData.description,
            imageUrl: selectedData.imageUrl
          } : null,
        }),
      });
      const data = await res.json();
      if (data.copies) {
        setNetworkCopies(data.copies);
        if (data.copies.defaultCopy) {
          setComposition((prev) => (prev ? { ...prev, copyText: data.copies.defaultCopy } : null));
        }
      }
    } catch (err) {
      console.error("Error al generar copys multi-red:", err);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleImproveCopy = async () => {
    handleGenerateCopy();
  };

  const handleUpdateSceneText = (sceneIndex: number, field: "title" | "subtitle", value: string) => {
    if (!composition) return;
    setComposition((prev) => {
      if (!prev) return null;
      const newScenes = [...prev.scenes];
      newScenes[sceneIndex] = {
        ...newScenes[sceneIndex],
        [field]: value,
      };
      return {
        ...prev,
        scenes: newScenes,
      };
    });
  };

    const handleConfirmSchedule = async () => {
    if (!composition || selectedNetworks.length === 0) return;
    setIsScheduling(true);
    setErrorMsg("");

    try {
      const user = auth.currentUser;
      if (!user || !activeProfile?.id) throw new Error("Debes iniciar sesión para agendar.");
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);

      // 1. Renderizar el video con Remotion y subirlo a Firebase Storage
      console.log("[PoC Video] Renderizando Reel con Remotion antes de agendar...");
      const renderRes = await fetch("/api/poc/video/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          composition,
          userId: user.uid,
          showWatermark: false
        })
      });

      const renderData = await renderRes.json();
      if (!renderRes.ok || !renderData.videoUrl) {
        throw new Error(renderData.error || "No se pudo renderizar el video con Remotion.");
      }

      const finalVideoUrl = renderData.videoUrl;
      console.log("[PoC Video] Video renderizado exitosamente:", finalVideoUrl);

      // 2. Guardar en Firestore con la URL del video MP4 final
      await addDoc(collection(db, "social_posts"), {
        userId: user.uid,
        profileId: activeProfile.id,
        businessId: activeProfile.id,
        idea: composition.title,
        text: composition.copyText || composition.title,
        copy: composition.copyText || composition.title,
        audioScript: composition.audioScript,
        type: "Reel",
        format: "Reel 9:16",
        status: "confirmed", // Agendado
        scheduledFor: scheduledDateTime,
        networks: selectedNetworks,
        scenes: composition.scenes,
        showWatermark: false,
        copiesByNetwork: networkCopies,
        videoUrl: finalVideoUrl,
        mediaUrl: finalVideoUrl,
        imageUrl: composition.scenes[0]?.bgImageUrl || "",
        // TikTok Direct Post settings
        tiktokPrivacyLevel: tiktokSettings.privacyLevel,
        tiktokAllowComment: tiktokSettings.allowComment,
        tiktokAllowDuet: tiktokSettings.allowDuet,
        tiktokAllowStitch: tiktokSettings.allowStitch,
        tiktokContentDisclosure: tiktokSettings.contentDisclosure,
        tiktokYourBrand: tiktokSettings.yourBrand,
        tiktokBrandedContent: tiktokSettings.brandedContent,
        tiktokIsAigc: tiktokSettings.isAigc,
        createdAt: serverTimestamp(),
      });

      // Registrar portada/miniatura en la Biblioteca (generated_images)
      if (composition.scenes[0]?.bgImageUrl) {
        await addDoc(collection(db, "generated_images"), {
          userId: user.uid,
          profileId: activeProfile.id,
          url: composition.scenes[0].bgImageUrl,
          source: "ia",
          type: "Reel",
          prompt: composition.title,
          createdAt: serverTimestamp(),
        }).catch(console.warn);
      }

      setScheduleSuccess(`¡Reel renderizado y agendado con éxito para el ${scheduledDate} a las ${scheduledTime} hrs!`);
      setShowScheduleModal(false);
    } catch (err: any) {
      console.error("Error al agendar Reel:", err);
      setErrorMsg("No se pudo programar el Reel: " + (err.message || ""));
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePublishNow = async () => {
    if (!composition || selectedNetworks.length === 0) return;
    setIsPublishingNow(true);
    setErrorMsg("");

    try {
      const user = auth.currentUser;
      if (!user || !activeProfile?.id) throw new Error("Debes iniciar sesión para publicar.");

      // 1. Renderizar el video con Remotion y subirlo a Firebase Storage
      console.log("[PoC Video] Renderizando Reel con Remotion antes de publicar...");
      const renderRes = await fetch("/api/poc/video/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          composition,
          userId: user.uid,
          showWatermark: false
        })
      });

      const renderData = await renderRes.json();
      if (!renderRes.ok || !renderData.videoUrl) {
        throw new Error(renderData.error || "No se pudo renderizar el video con Remotion.");
      }

      const finalVideoUrl = renderData.videoUrl;
      console.log("[PoC Video] Video renderizado exitosamente:", finalVideoUrl);

      // 2. Guardar en Firestore con la URL del video MP4 final
      const postRef = await addDoc(collection(db, "social_posts"), {
        userId: user.uid,
        profileId: activeProfile.id,
        businessId: activeProfile.id,
        idea: composition.title,
        text: composition.copyText || composition.title,
        copy: composition.copyText || composition.title,
        audioScript: composition.audioScript,
        type: "Reel",
        format: "Reel 9:16",
        status: "pending",
        scheduledFor: new Date(),
        networks: selectedNetworks,
        scenes: composition.scenes,
        showWatermark: false,
        copiesByNetwork: networkCopies,
        videoUrl: finalVideoUrl,
        mediaUrl: finalVideoUrl,
        imageUrl: composition.scenes[0]?.bgImageUrl || "",
        // TikTok Direct Post settings
        tiktokPrivacyLevel: tiktokSettings.privacyLevel,
        tiktokAllowComment: tiktokSettings.allowComment,
        tiktokAllowDuet: tiktokSettings.allowDuet,
        tiktokAllowStitch: tiktokSettings.allowStitch,
        tiktokContentDisclosure: tiktokSettings.contentDisclosure,
        tiktokYourBrand: tiktokSettings.yourBrand,
        tiktokBrandedContent: tiktokSettings.brandedContent,
        tiktokIsAigc: tiktokSettings.isAigc,
        createdAt: serverTimestamp(),
      });

      // Registrar portada en generated_images
      if (composition.scenes[0]?.bgImageUrl) {
        await addDoc(collection(db, "generated_images"), {
          userId: user.uid,
          profileId: activeProfile.id,
          url: composition.scenes[0].bgImageUrl,
          source: "ia",
          type: "Reel",
          prompt: composition.title,
          createdAt: serverTimestamp(),
        }).catch(console.warn);
      }

      // 3. Disparar publicación inmediata usando el MP4 guardado en Storage
      const idToken = await user.getIdToken();
      const publishRes = await fetch("/api/publish-now", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ postId: postRef.id })
      });

      if (!publishRes.ok) {
        const errData = await publishRes.json();
        throw new Error(errData.error || "Fallo en la publicación de video.");
      }

      setScheduleSuccess("⚡ ¡Reel renderizado con Remotion y publicado con éxito!");
      setShowScheduleModal(false);
    } catch (err: any) {
      console.error("Error al publicar Reel ahora:", err);
      setErrorMsg("Error al publicar inmediatamente: " + (err.message || ""));
    } finally {
      setIsPublishingNow(false);
    }
  };

  const toggleNetwork = (net: string) => {
    setSelectedNetworks((prev) =>
      prev.includes(net) ? prev.filter((n) => n !== net) : [...prev, net]
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <span>🎬 Generación de Video</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] text-amber-300 font-extrabold">Reels 9:16</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
            Generador de Reels & Video Clips
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed">
            Estructura y previsualiza Reels verticales a 60fps con subtítulos dinámicos estilo Hormozi, o utiliza nuestra biblioteca de prompts de video para animar imágenes en Kling, Runway y Luma con movimientos de cámara cinemáticos.
          </p>

          {/* TABS DE SELECCIÓN DE MODO */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-indigo-900/60 mt-4">
            <button
              type="button"
              onClick={() => setActiveMainTab("remotion")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all ${
                activeMainTab === "remotion"
                  ? "bg-white text-indigo-950 shadow-lg font-black"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <span>🎬</span>
              <span>Reels con Remotion &amp; Locución</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab("prompts")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all ${
                activeMainTab === "prompts"
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg font-black"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <span>✨</span>
              <span>Biblioteca de Prompts de Video (Kling / Runway / Luma)</span>
            </button>
          </div>
        </div>
      </div>

      {scheduleSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm font-extrabold rounded-2xl flex items-center justify-between">
          <span>✅ {scheduleSuccess}</span>
          <button onClick={() => setScheduleSuccess("")} className="text-emerald-600 hover:text-emerald-900">✕</button>
        </div>
      )}

      {activeMainTab === "remotion" ? (
        /* GRID PRINCIPAL: CONTROLES A LA IZQUIERDA, PLAYER A LA DERECHA */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* PANEL IZQUIERDO: FORMULARIO Y EDICIÓN (7 COLUMNAS) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* TARJETA DE CONFIGURACIÓN */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>⚙️ Configurar Parámetros del Reel</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tema o Idea Principal del Video <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej: 3 Estrategias para aumentar ventas en e-commerce"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              {catalogoItems.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Vincular con Producto/Servicio del Catálogo <span className="text-slate-400 font-normal">(Opcional)</span></span>
                  </label>
                  <select
                    value={selectedCatalogoItem?.id || ""}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setSelectedCatalogoItem(null);
                        return;
                      }
                      const found = catalogoItems.find((i: any) => i.id === e.target.value);
                      if (found) {
                        setSelectedCatalogoItem({ id: found.id, name: found.name });
                        if (!topic) setTopic(found.name);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                  >
                    <option value="">-- No vincular a un producto específico --</option>
                    {catalogoItems.map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>¿Qué te gustaría ver en el video? <span className="text-slate-400 font-normal">(Dirección visual de escenas e imágenes)</span></span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold border border-indigo-100">✨ Guía Visual para Agentes</span>
                </label>
                <textarea
                  rows={2}
                  value={visualDirection}
                  onChange={(e) => setVisualDirection(e.target.value)}
                  placeholder="Ej: Un barista preparando café latte art con vapor suave, granos de café tostados de cerca, ambiente acogedor de cafetería moderna..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rubro / Industria
                  </label>
                  <input
                    type="text"
                    value={rubro}
                    onChange={(e) => setRubro(e.target.value)}
                    placeholder="Ej: Gastronomía, Software B2B"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estilo Visual
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                  >
                    <option value="vibrante">Vibrante (Púrpura / Naranja)</option>
                    <option value="minimalista">Minimalista (Oscuro / Verde)</option>
                    <option value="cyberpunk">Cyberpunk (Neón / Azul)</option>
                    <option value="corporativo">Corporativo (Azul / Gris)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Efecto de Movimiento
                  </label>
                  <select
                    value={motionEffect}
                    onChange={(e) => setMotionEffect(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                  >
                    <option value="fade">✨ Fade In / Out (Desvanecimiento)</option>
                    <option value="zoom_in">🔍 Zoom In (Ken Burns)</option>
                    <option value="slide_left">↔️ Desplazamiento Lateral (Slide)</option>
                    <option value="bounce">🏀 Rebote Suave (Bounce)</option>
                    <option value="flip_3d">🔄 Giro 3D (Flip)</option>
                    <option value="glitch_pulse">⚡ Pulso & Glitch (Dinámico)</option>
                  </select>
                </div>
              </div>

              {/* SUBIDA DE HASTA 3 IMÁGENES PARA EL REEL */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>📸 Fotos Propias para las Escenas</span>
                    <span className="text-slate-400 font-normal">(Opcional, hasta 3 fotos)</span>
                  </label>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {uploadedReelImages.length}/3 Seleccionadas
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sube hasta 3 fotos de tus productos o negocio para que protagonicen las escenas del video. Si no subes fotos, nuestros agentes generarán fondos visuales cinemáticos automáticos.
                </p>

                <div className="flex flex-wrap gap-2 pt-1 items-center">
                  {uploadedReelImages.map((imgUrl, i) => (
                    <div key={i} className="relative w-16 h-20 rounded-xl overflow-hidden border border-slate-300 shadow-sm group bg-slate-900">
                      <img src={imgUrl} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveReelImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-rose-700 transition-colors"
                        title="Eliminar foto"
                      >
                        ✕
                      </button>
                      <span className="absolute bottom-1 left-1 px-1 rounded bg-black/70 text-white text-[9px] font-bold">
                        #{i + 1}
                      </span>
                    </div>
                  ))}

                  {uploadedReelImages.length < 3 && (
                    <label className="w-16 h-20 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center cursor-pointer text-indigo-600">
                      {isUploadingReelImage ? (
                        <FaSpinner className="animate-spin text-sm" />
                      ) : (
                        <>
                          <span className="text-lg font-bold">+</span>
                          <span className="text-[9px] font-bold">Subir</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingReelImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAddReelImage(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* RECORDATORIO DE DURACIÓN MÁX 10S */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs font-bold text-indigo-900">
                <span className="flex items-center gap-1.5">
                  <span>⏱️</span> Duración calibrada para máxima retención:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold">
                  Máximo 10 Segundos
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
                  ⚠️ {errorMsg}
                </div>
              )}

              <button
                onClick={handleGenerateVideo}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generando Guion y Escenas con nuestros agentes...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Generar Reel con nuestros agentes (Máx. 10s)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CHECKLIST DE ESTADO DE IMÁGENES & ASSETS */}
          {composition && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>🖼️ Checklist de Imágenes de Fondo</span>
                </h3>
                <span className="text-[10px] font-extrabold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                  {Object.values(imageStatus).filter((s) => s === "ready").length} / {composition.scenes.length} Listas
                </span>
              </div>

              <div className="space-y-2">
                {composition.scenes.map((scene, idx) => {
                  const status = imageStatus[idx] || "loading";
                  return (
                    <div
                      key={scene.id || idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {status === "ready" ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-extrabold text-[10px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> ✅ Lista
                          </span>
                        ) : status === "error" ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-extrabold text-[10px]">
                            ⚠️ Error al cargar
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-extrabold text-[10px] flex items-center gap-1">
                            <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /> ⏳ Generando / Cargando...
                          </span>
                        )}
                        <span className="font-bold text-slate-800">
                          Escena #{idx + 1}: <span className="text-slate-500 font-medium">{scene.title}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Botón Regenerar con Agente */}
                        <button
                            onClick={() => handleRegenerateSceneImage(idx, scene)}
                            disabled={imageStatus[idx] === 'loading'}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-lg border border-indigo-200 transition-all flex items-center gap-1 disabled:opacity-50"
                            title="Regenerar esta imagen con Agente"
                          >
                            {imageStatus[idx] === 'loading' ? '⏳ Generando...' : '🖼️ Regenerar con Agente'}
                          </button>

                        {/* Botón Subir Imagen Local */}
                        <label className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-extrabold rounded-lg border border-emerald-200 transition-all cursor-pointer flex items-center gap-1">
                          📁 Subir Imagen
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target?.result as string;
                                if (dataUrl) {
                                  setImageStatus((prev) => ({ ...prev, [idx]: "loading" }));
                                  setComposition((prev) => {
                                    if (!prev) return null;
                                    const newScenes = [...prev.scenes];
                                    newScenes[idx] = { ...newScenes[idx], bgImageUrl: dataUrl };
                                    return { ...prev, scenes: newScenes };
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>

                        {scene.bgImageUrl && (
                          <a
                            href={scene.bgImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-indigo-600 hover:underline ml-1"
                          >
                            Ver ↗
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EDITOR DE ESCENAS EN VIVO (Si la composición existe) */}
          {composition && (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span>✍️ Editar Escenas en Tiempo Real</span>
                </h2>

                <div className="space-y-4">
                  {composition.scenes.map((scene, idx) => (
                    <div key={scene.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-700 uppercase">
                          Escena #{idx + 1} ({scene.duration}s)
                        </span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-500">
                          Color Acento: <span style={{ color: scene.accentColor }}>{scene.accentColor}</span>
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Título Escena:</label>
                        <input
                          type="text"
                          value={scene.title}
                          onChange={(e) => handleUpdateSceneText(idx, "title", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Subtítulo (Gancho):</label>
                        <input
                          type="text"
                          value={scene.subtitle}
                          onChange={(e) => handleUpdateSceneText(idx, "subtitle", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {scene.bgImageUrl && (
                            <img
                              src={scene.bgImageUrl}
                              alt={`Escena ${idx + 1}`}
                              className="w-8 h-12 object-cover rounded border border-slate-300 shadow-sm"
                            />
                          )}
                          <span className="text-[10px] font-bold text-slate-500">
                            Imagen de fondo
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                              type="button"
                              onClick={() => handleRegenerateSceneImage(idx, scene)}
                              disabled={imageStatus[idx] === 'loading'}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-lg border border-indigo-200 transition-all flex items-center gap-1 disabled:opacity-50"
                            >
                              {imageStatus[idx] === 'loading' ? '⏳ Generando...' : '🖼️ Regenerar con Agente'}
                            </button>

                          <label className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-extrabold rounded-lg border border-emerald-200 transition-all cursor-pointer flex items-center gap-1">
                            📁 Subir Foto
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const dataUrl = event.target?.result as string;
                                  if (dataUrl) {
                                    setImageStatus((prev) => ({ ...prev, [idx]: "loading" }));
                                    setComposition((prev) => {
                                      if (!prev) return null;
                                      const newScenes = [...prev.scenes];
                                      newScenes[idx] = { ...newScenes[idx], bgImageUrl: dataUrl };
                                      return { ...prev, scenes: newScenes };
                                    });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COPY Y SCRIPT SUGERIDO */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                  📜 Guion de Locución (Voice-over Script)
                </h3>
                <p className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  "{composition.audioScript}"
                </p>
              </div>

              {/* EDICIÓN Y GENERACIÓN DE COPIES POR CADA RED SOCIAL */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <span>📝 Copys Adaptados por Red Social</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-100">
                        ✨ Calibrado por Algoritmo
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Cada plataforma tiene su propia longitud ideal para que el texto nunca se corte en pantalla.
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateCopy}
                    disabled={isGeneratingCopy}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
                  >
                    {isGeneratingCopy ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Adaptando Copys...</span>
                      </>
                    ) : (
                      <>
                        <span>✨ Regenerar Copys Multi-Red</span>
                      </>
                    )}
                  </button>
                </div>

                {/* SELECTOR DE PESTAÑAS DE REDES */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { id: "tiktok", name: "TikTok", icon: "🎵", max: 140, tip: "Máx 140 chars. Gancho en 1ª línea para no cortarse en feed." },
                    { id: "instagram", name: "Instagram", icon: "📸", max: 2200, tip: "Estructurado con emojis, valor, CTA a guardar y hashtags." },
                    { id: "youtube", name: "YouTube Shorts", icon: "▶️", max: 100, tip: "Título SEO descriptivo + #Shorts para posicionar en búsquedas." },
                    { id: "facebook", name: "Facebook", icon: "👥", max: 500, tip: "Tono conversacional y llamado a WhatsApp/mensaje." },
                  ].map((net) => {
                    const currentText = networkCopies[net.id] || (net.id === 'tiktok' ? (composition?.copyText || '').slice(0, 140) : composition?.copyText || '');
                    const isSelected = selectedNetworks.includes(net.id);
                    const isActive = activeNetworkTab === net.id;
                    const charCount = currentText.length;

                    return (
                      <button
                        key={net.id}
                        type="button"
                        onClick={() => setActiveNetworkTab(net.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                          isActive
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{net.icon}</span>
                        <span>{net.name}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Red conectada y seleccionada" />
                        )}
                        <span className={`text-[10px] ml-1 px-1.5 py-0.2 rounded ${
                          charCount > net.max && net.id === 'tiktok'
                            ? "bg-rose-500 text-white font-black"
                            : isActive
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-200 text-slate-600"
                        }`}>
                          {charCount}/{net.max}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* ÁREA DE EDICIÓN DE LA RED ACTIVA */}
                {(() => {
                  const netConfig: Record<string, { name: string; icon: string; max: number; tip: string; color: string }> = {
                    tiktok: { name: "TikTok", icon: "🎵", max: 140, tip: "🎯 Optimizado para TikTok: Los primeros 80 caracteres son visibles de inmediato en el feed móvil sin que el usuario tenga que presionar 'más'.", color: "text-rose-600 bg-rose-50 border-rose-100" },
                    instagram: { name: "Instagram Reels", icon: "📸", max: 2200, tip: "🎯 Optimizado para Instagram: Estructura clara con gancho inicial, emojis, llamada a la acción y hashtags de nicho.", color: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100" },
                    youtube: { name: "YouTube Shorts", icon: "▶️", max: 100, tip: "🎯 Optimizado para Shorts: Título directo para el algoritmo de YouTube con etiqueta #Shorts obligatoria.", color: "text-red-600 bg-red-50 border-red-100" },
                    facebook: { name: "Facebook", icon: "👥", max: 500, tip: "🎯 Optimizado para Facebook: Tono amigable y cercano con botón o llamado directo a WhatsApp.", color: "text-blue-600 bg-blue-50 border-blue-100" },
                  };

                  const currentCfg = netConfig[activeNetworkTab] || netConfig.tiktok;
                  const currentVal = networkCopies[activeNetworkTab] ?? (activeNetworkTab === 'tiktok' ? (composition?.copyText || '').slice(0, 140) : composition?.copyText || '');

                  return (
                    <div className="space-y-2">
                      <div className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between gap-2 ${currentCfg.color}`}>
                        <span>{currentCfg.tip}</span>
                        <span className="font-mono font-extrabold text-[10px] shrink-0">
                          {currentVal.length} / {currentCfg.max} caracteres
                        </span>
                      </div>

                      <textarea
                        value={currentVal}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNetworkCopies((prev) => ({
                            ...prev,
                            [activeNetworkTab]: val
                          }));
                          // Si es la red principal, sincronizar con copyText
                          if (activeNetworkTab === 'instagram' || activeNetworkTab === 'tiktok') {
                            setComposition((prev) => (prev ? { ...prev, copyText: val } : null));
                          }
                        }}
                        rows={activeNetworkTab === 'tiktok' ? 3 : 5}
                        placeholder={`Escribe o edita el copy específico para ${currentCfg.name}...`}
                        className="w-full p-3.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all leading-relaxed"
                      />
                    </div>
                  );
                })()}
              </div>

              {/* BOTÓN PROGRAMAR PUBLICACIÓN */}
              <button
                onClick={() => setShowScheduleModal(true)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <span>📅 Programar Publicación de este Reel</span>
              </button>
            </>
          )}
        </div>

        {/* PANEL DERECHO: PLAYER REEL 9:16 (5 COLUMNAS) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center sticky top-24">
          {composition ? (
            <div className="space-y-3 text-center">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Previsualizador de Reel 9:16
              </h2>
              <RemotionReelPlayer 
                composition={composition} 
                companyName={activeProfile?.name || activeProfile?.businessName} 
                companyLogoUrl={activeProfile?.logoUrl || activeProfile?.logo}
              />
            </div>
          ) : (
            <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4 my-auto">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-indigo-100 shadow-sm">
                🎬
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  Genera tu primer Reel animado
                </h3>
                <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto leading-relaxed">
                  Ingresa tu tema a la izquierda y presiona <strong>"✨ Generar Reel con Agentes"</strong> para que nuestros agentes creen las imágenes de fondo, subtítulos animados y el guion en tiempo real.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* BANNER INFORMATIVO */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white border border-indigo-800/40 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">
                  Image-to-Video Prompt Engine
                </span>
                <h2 className="text-xl md:text-2xl font-black text-white">
                  Biblioteca de Prompts de Video Cinematográfico
                </h2>
                <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Genera instrucciones precisas en inglés calibradas para motores como Kling AI, Runway Gen-3 Alpha, Luma Dream Machine y Sora. Diseñados por nuestros agentes para transformar cualquier foto o imagen de marca en un video publicitario de alto impacto.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <Link
                  href="/automatizacion-rrss/panel/admin/muestras"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-2 transition-all border border-indigo-400/30"
                >
                  <span>👑 Ir a Muestras de Prospectos</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Pasos rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">1</span>
                <span className="text-slate-200">Elige el estilo de cámara y personaliza los datos de tu marca.</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">2</span>
                <span className="text-slate-200">Copia el prompt optimizado en inglés con 1 solo clic.</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">3</span>
                <span className="text-slate-200">Pégalo en Kling o Runway junto a la imagen base para animarla.</span>
              </div>
            </div>
          </div>

          {/* CONTENEDOR PRINCIPAL: FORMULARIO DE PERSONALIZACIÓN Y ESTILOS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMNA IZQUIERDA: CONFIGURACIÓN Y ESTILOS (7 COLUMNAS) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* TARJETA DE PERSONALIZACIÓN DEL NEGOCIO / PRODUCTO */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Personalizar Contexto del Video</span>
                </h3>

                {/* SELECTOR DE PRODUCTO O SERVICIO GUARDADO EN EL CATÁLOGO */}
                {catalogoItems.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Vincular Producto o Servicio Guardado</span>
                      <span className="text-slate-400 font-normal text-[11px]">(Opcional para auto-completar)</span>
                    </label>
                    <select
                      value={selectedPromptCatalogoId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedPromptCatalogoId(val);
                        if (!val) return;
                        const found = catalogoItems.find((i: any) => i.id === val);
                        if (found) {
                          setPromptConcept(found.name + (found.description ? ` - ${found.description}` : ""));
                          if (found.imageUrl) {
                            setBaseVideoImageUrl(found.imageUrl);
                            setImageSourceType("product");
                          }
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">-- Escribir manualmente o sin producto del catálogo --</option>
                      {catalogoItems.map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.name} {item.price ? `($${Number(item.price).toLocaleString("es-CL")})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre de la Marca o Negocio
                    </label>
                    <input
                      type="text"
                      value={promptBusiness}
                      onChange={(e) => setPromptBusiness(e.target.value)}
                      placeholder="Ej: Café Valparaíso, Clínica Dental..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rubro o Nicho Comercial
                    </label>
                    <input
                      type="text"
                      value={promptRubro}
                      onChange={(e) => setPromptRubro(e.target.value)}
                      placeholder="Ej: Gastronomía, Bienes Raíces, Moda..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Concepto Visual o Producto a Destacar <span className="text-slate-400 font-normal">(Opcional o editable)</span>
                    </label>
                    <input
                      type="text"
                      value={promptConcept}
                      onChange={(e) => setPromptConcept(e.target.value)}
                      placeholder="Ej: Taza de cappuccino humeante servida sobre barra de mármol..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Instrucción Adicional de Cámara o Iluminación <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={promptCustomDir}
                      onChange={(e) => setPromptCustomDir(e.target.value)}
                      placeholder="Ej: Luz cálida de atardecer, vapor realista, reflejos sutiles..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* BIBLIOTECA DE PROMPTS CON VIDEOS PRECARGADOS Y CATEGORÍAS */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>🎬</span>
                      <span>Biblioteca de Prompts de Video con Referencias</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Selecciona una categoría y estilo con video de muestra para calibrar tu animación.
                    </p>
                  </div>
                </div>

                {/* Filtro por Categorías */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {flowCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedFlowCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        selectedFlowCategory === cat
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid de Comandos / Prompts con Videos Precargados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredFlowTemplates.map((item) => {
                    const isSelected = selectedFlowCommand?.command === item.command;
                    return (
                      <div
                        key={item.command}
                        onClick={() => setSelectedFlowCommand(item)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="space-y-2.5">
                          {/* Header del prompt */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{item.icon}</span>
                              <h4 className="text-xs font-black text-slate-900 leading-tight">
                                {item.name}
                              </h4>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-indigo-700 border border-slate-200">
                              {item.category}
                            </span>
                          </div>

                          {/* Video precargado de referencia o muestra */}
                          {item.sampleFinalVideo ? (
                            <div className="rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-56 relative group shadow-inner">
                              <video
                                src={item.sampleFinalVideo}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-white flex items-center gap-1">
                                <span>▶</span> Video Muestra
                              </div>
                            </div>
                          ) : item.sampleBaseImage ? (
                            <div className="rounded-xl overflow-hidden bg-slate-900 aspect-[9/16] max-h-56 relative shadow-inner">
                              <img
                                src={item.sampleBaseImage}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                                🖼️ Muestra Base
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl bg-gradient-to-br from-indigo-950/5 to-slate-900/5 p-4 border border-dashed border-indigo-200 flex flex-col justify-center items-center text-center">
                              <span className="text-2xl mb-1">{item.icon}</span>
                              <span className="text-[11px] font-bold text-slate-700">{item.command}</span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">Veo 2 / Kling / Runway</span>
                            </div>
                          )}

                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <div className="text-[10px] font-mono text-slate-500 truncate" title={item.cameraMovement}>
                            📹 {item.cameraMovement}
                          </div>
                          {item.lightingStyle && (
                            <div className="text-[10px] font-mono text-slate-500 truncate" title={item.lightingStyle}>
                              💡 {item.lightingStyle}
                            </div>
                          )}
                          {isSelected && (
                            <div className="pt-1 text-[11px] font-black text-indigo-700 flex items-center gap-1">
                              <span>✓ Seleccionado</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: GENERADOR N8N, PROMPT COMPILADO Y ACCIONES (5 COLUMNAS) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
              
              {/* TARJETA DE CONFIGURACIÓN DEL VIDEO */}
              <div className="bg-gradient-to-b from-slate-900 to-indigo-950 rounded-3xl p-6 text-white border border-indigo-700/50 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎬</span>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                        Configuración del Video
                      </h4>
                      <div className="text-xs font-black text-white">
                        Personaliza la imagen base y renderizado
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. Selector de Imagen Base (Logo vs Producto) */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-200">
                    1. Imagen Base para Animar:
                  </label>
                  
                  {/* Selector de modo: Logo vs Producto */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1 rounded-xl border border-indigo-900/40 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setImageSourceType("logo");
                        setBaseVideoImageUrl(activeProfile?.logoUrl || activeProfile?.logo || "");
                      }}
                      className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                        imageSourceType === "logo"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>🏷️</span> Usar Logo de Marca
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageSourceType("product");
                      }}
                      className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                        imageSourceType === "product"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>📦</span> Foto de Producto
                    </button>
                  </div>

                  {imageSourceType === "logo" ? (
                    <div className="p-3 bg-slate-950/80 rounded-2xl border border-indigo-900/50 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {(activeProfile?.logoUrl || activeProfile?.logo || baseVideoImageUrl) ? (
                            <div className="w-14 h-14 rounded-xl bg-white p-1 border border-slate-700 overflow-hidden shrink-0 shadow-md">
                              <img
                                src={baseVideoImageUrl || activeProfile?.logoUrl || activeProfile?.logo}
                                alt="Logo de la marca"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                              🏷️
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-white">
                              {activeProfile?.name || promptBusiness || "Logo de tu Marca"}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                              <span>✓</span> Logo activo de la cuenta
                            </div>
                          </div>
                        </div>

                        {/* Botón para cambiar el logo de la cuenta */}
                        <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-700 flex items-center gap-1.5 shrink-0">
                          {isUploadingLogo ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Guardando...</span>
                            </>
                          ) : (
                            <>
                              <span>📁</span>
                              <span>Cambiar Logo</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingLogo}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLogoChange(file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>

                      {logoUpdateSuccess && (
                        <div className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 p-2 rounded-xl border border-emerald-800">
                          ✅ Logo actualizado para este video y guardado en tu cuenta.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-950/80 rounded-2xl border border-indigo-900/50 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {baseVideoImageUrl ? (
                            <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 shadow-md">
                              <img
                                src={baseVideoImageUrl}
                                alt="Foto de producto"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                              📸
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-white">
                              {promptConcept || "Foto para la animación"}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {baseVideoImageUrl ? "Imagen lista para animar" : "Selecciona o sube una foto"}
                            </div>
                          </div>
                        </div>

                        <label className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-indigo-400/40 flex items-center gap-1.5 shrink-0">
                          {isUploadingProductImage ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Subiendo...</span>
                            </>
                          ) : (
                            <>
                              <span>📁</span>
                              <span>Subir Foto</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingProductImage}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  setIsUploadingProductImage(true);
                                  const url = await handleUploadImageFile(file);
                                  setBaseVideoImageUrl(url);
                                } catch (err: any) {
                                  alert(err.message || "Error al subir foto");
                                } finally {
                                  setIsUploadingProductImage(false);
                                }
                              }
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. SWITCH DE RENDERIZADO (Sin mencionar n8n ni remotion) */}
                <div className="space-y-2 pt-2 border-t border-indigo-900/60">
                  <label className="block text-xs font-bold text-slate-200">
                    2. Modalidad de Renderizado:
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-indigo-900/50">
                    <button
                      type="button"
                      onClick={() => setVideoRenderMode("raw")}
                      className={`p-2.5 rounded-xl text-left transition-all ${
                        videoRenderMode === "raw"
                          ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md font-black"
                          : "text-slate-300 hover:bg-slate-900"
                      }`}
                    >
                      <div className="text-xs font-extrabold flex items-center gap-1.5">
                        <span>⚡</span>
                        <span>Video Cinemático Directo</span>
                      </div>
                      <p className={`text-[10px] mt-0.5 leading-tight ${videoRenderMode === "raw" ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                        Clip con movimiento y físicas cinematográficas puras.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVideoRenderMode("remotion")}
                      className={`p-2.5 rounded-xl text-left transition-all ${
                        videoRenderMode === "remotion"
                          ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md font-black"
                          : "text-slate-300 hover:bg-slate-900"
                      }`}
                    >
                      <div className="text-xs font-extrabold flex items-center gap-1.5">
                        <span>✨</span>
                        <span>Con Marca &amp; Subtítulos</span>
                      </div>
                      <p className={`text-[10px] mt-0.5 leading-tight ${videoRenderMode === "remotion" ? "text-indigo-100 font-semibold" : "text-slate-400"}`}>
                        Subtítulos dinámicos, locución y logo de tu marca.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 3. Botón de Generación de Video (Sin mencionar n8n) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateN8nVideo}
                    disabled={isGeneratingN8nVideo || !baseVideoImageUrl}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isGeneratingN8nVideo ? (
                      <>
                        <FaSpinner className="animate-spin text-sm" />
                        <span>{n8nProgressText || "Nuestros agentes están procesando el video..."}</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Generar Video Animado</span>
                      </>
                    )}
                  </button>

                  {n8nGenerationError && (
                    <div className="mt-3 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-semibold">
                      ⚠️ {n8nGenerationError}
                    </div>
                  )}
                </div>

                {/* 4. Previsualización del Video Generado */}
                {n8nGeneratedVideoUrl && (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/50 space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                      <span>✅ ¡Video Animado Listo!</span>
                      <span className="text-[10px] font-mono uppercase bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                        {videoRenderMode === "remotion" ? "Con Marca & Subtítulos" : "Video Cinemático Directo"}
                      </span>
                    </div>

                    <div className="rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[380px] flex items-center justify-center">
                      <video
                        src={n8nGeneratedVideoUrl}
                        controls
                        autoPlay
                        loop
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={n8nGeneratedVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FaDownload className="text-xs" />
                        <span>Descargar MP4</span>
                      </a>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`¡Mira el video que preparamos para tu negocio!: ${n8nGeneratedVideoUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/30"
                      >
                        <FaWhatsapp className="text-sm" />
                        <span>Por WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* TARJETA DEL PROMPT COMPILADO */}
              <div className="bg-slate-950 rounded-3xl p-6 text-white border border-slate-800 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedFlowCommand?.icon || "✨"}</span>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                        Prompt Compilado
                      </h4>
                      <div className="text-xs font-black text-white">
                        {selectedFlowCommand?.name} ({selectedFlowCommand?.command})
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-bold border border-indigo-800">
                    Inglés Técnico
                  </span>
                </div>

                {/* Prompt Text Block */}
                <div className="space-y-2">
                  <div className="relative">
                    <p className="text-xs text-slate-200 font-mono bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80 leading-relaxed select-all max-h-64 overflow-y-auto">
                      {compiledFlowPrompt}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg ${
                      copiedPromptText
                        ? "bg-emerald-600 text-white shadow-emerald-600/30"
                        : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20"
                    }`}
                  >
                    {copiedPromptText ? (
                      <>
                        <FaCheck className="text-sm" />
                        <span>¡Prompt Copiado al Portapapeles!</span>
                      </>
                    ) : (
                      <>
                        <FaCopy className="text-sm" />
                        <span>Copiar Prompt para Veo 2 / Kling / Runway</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Parámetros de Cámara & Resumen */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">
                      Detalle de Cinematografía
                    </span>
                    <p className="text-slate-300 leading-snug">
                      📹 {selectedFlowCommand?.cameraMovement}
                    </p>
                    {selectedFlowCommand?.lightingStyle && (
                      <p className="text-slate-400 text-[10px] leading-snug pt-1">
                        💡 {selectedFlowCommand.lightingStyle}
                      </p>
                    )}
                    {selectedFlowCommand?.physicsEffect && (
                      <p className="text-slate-400 text-[10px] leading-snug pt-0.5">
                        ✨ {selectedFlowCommand.physicsEffect}
                      </p>
                    )}
                  </div>

                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    ℹ️ {selectedFlowCommand?.description}
                  </p>
                </div>

                {/* Plataformas Compatibles */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-mono">
                    Plataformas Recomendadas (Image-to-Video)
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <a
                      href="https://klingai.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-slate-200 transition-colors"
                    >
                      <span>Kling AI 1.5</span>
                      <span className="text-indigo-400 text-[10px]">↗</span>
                    </a>

                    <a
                      href="https://app.runwayml.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-slate-200 transition-colors"
                    >
                      <span>Runway Gen-3</span>
                      <span className="text-indigo-400 text-[10px]">↗</span>
                    </a>

                    <a
                      href="https://lumalabs.ai/dream-machine"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-slate-200 transition-colors"
                    >
                      <span>Luma Dream</span>
                      <span className="text-indigo-400 text-[10px]">↗</span>
                    </a>

                    <a
                      href="https://haiper.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-slate-200 transition-colors"
                    >
                      <span>Haiper Video</span>
                      <span className="text-indigo-400 text-[10px]">↗</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* CALLOUT: ¿QUIERES ENVIAR MUESTRA COMPLETA POR WHATSAPP? */}
              <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <h4 className="text-xs font-black text-indigo-950">
                    ¿Quieres enviar una muestra completa a un cliente?
                  </h4>
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  Si eres admin o estás en prospección comercial, usa el módulo <strong>Muestras Prospectos</strong> para montar el logo del cliente, generar la imagen y enviar la demo pública directamente a su WhatsApp.
                </p>
                <Link
                  href="/automatizacion-rrss/panel/admin/muestras"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-800 hover:underline pt-1"
                >
                  <span>Abrir Generador de Muestras para Prospectos</span>
                  <span>→</span>
                </Link>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL DE PROGRAMACIÓN DE PUBLICACIÓN */}
      {showScheduleModal && composition && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <h3 className="font-extrabold text-base text-slate-900">Programar Publicación de Reel</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Título del Video</label>
                <input
                  type="text"
                  value={composition.title}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Fecha de Publicación</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Hora de Publicación</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">Redes Sociales Destino</label>
                {!hasIg && !hasTt && !hasYt ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <span>⚠️</span> No tienes redes de video conectadas a esta marca.
                    </p>
                    <p className="text-[11px] text-amber-700 font-medium">
                      Conecta tu cuenta de Instagram, TikTok o YouTube en la sección de configuración para agendar y publicar tus Reels automáticamente.
                    </p>
                    <Link
                      href="/automatizacion-rrss/panel/configuracion"
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-700 hover:underline"
                    >
                      ⚙️ Ir a Configuración de Marca ↗
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {hasIg && (
                      <button
                        type="button"
                        onClick={() => toggleNetwork("instagram")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 ${
                          selectedNetworks.includes("instagram")
                            ? "bg-pink-50 border-pink-300 text-pink-700"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <span>📸 Instagram Reels</span>
                      </button>
                    )}

                    {hasTt && (
                      <button
                        type="button"
                        onClick={() => toggleNetwork("tiktok")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 ${
                          selectedNetworks.includes("tiktok")
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <span>🎵 TikTok</span>
                      </button>
                    )}

                    {hasYt && (
                      <button
                        type="button"
                        onClick={() => toggleNetwork("youtube")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 ${
                          selectedNetworks.includes("youtube")
                            ? "bg-rose-50 border-rose-300 text-rose-700"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <span>▶️ YouTube Shorts</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* TikTok Direct Post settings (if TikTok selected) */}
              {selectedNetworks.includes("tiktok") && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <TikTokPostSettings
                    settings={tiktokSettings}
                    onChange={setTiktokSettings}
                    isDefaultConfig={false}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePublishNow}
                  disabled={isPublishingNow || isScheduling || selectedNetworks.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {isPublishingNow ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡ Publicar Ahora</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSchedule}
                  disabled={isScheduling || isPublishingNow || selectedNetworks.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {isScheduling ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Confirmar y Programar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideoPoCPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
      <VideoPoCContent />
    </Suspense>
  );
}
