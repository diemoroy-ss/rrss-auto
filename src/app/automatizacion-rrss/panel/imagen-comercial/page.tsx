"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useProfile } from "../../../../contexts/ProfileContext";
import {
  Sparkles,
  Layers,
  Type,
  Image as ImageIcon,
  Move,
  Plus,
  Trash2,
  Download,
  Share2,
  Calendar,
  Upload,
  Link as LinkIcon,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Loader2,
  Sliders,
} from "lucide-react";
import Link from "next/link";

interface TextLayer {
  id: string;
  text: string;
  x: number; // 0 a 100%
  y: number; // 0 a 100%
  fontFamily: string;
  size: number;
  color: string;
  backgroundColor: string;
  isPill: boolean;
  shadowLevel: "none" | "soft" | "hard";
  isBold: boolean;
  isItalic: boolean;
  letterSpacing: "normal" | "wide" | "widest";
  maxWidth?: number;
  boxWidth?: number; // 0 = auto / max-content, 40 a 100 (%)
  textAlign?: "left" | "center" | "right";
}

interface CustomFont {
  name: string;
  url: string;
  isCssUrl?: boolean;
}

interface SlideData {
  id: string;
  prompt: string;
  baseImageUrl: string;
  aspectRatio: "4:5" | "1:1" | "9:16";
  textLayers: TextLayer[];
  useLogo: boolean;
  logoUrl: string;
  logoTransparent: boolean;
  logoBlendMode?: "screen" | "normal" | "multiply";
  logoBgMode?: "transparent" | "white";
  logoX: number;
  logoY: number;
  logoWidth: number;
  finalRenderUrl?: string;
}

const DEFAULT_FONTS = [
  { name: "Montserrat", label: "Montserrat (Limpia y Moderna)", family: "'Montserrat', sans-serif" },
  { name: "Bebas Neue", label: "Bebas Neue (Titular de Alto Impacto)", family: "'Bebas Neue', sans-serif" },
  { name: "Anton", label: "Anton (Cartel Publicitario Bold)", family: "'Anton', sans-serif" },
  { name: "Playfair Display", label: "Playfair Display (Elegante & Premium)", family: "'Playfair Display', serif" },
  { name: "Dancing Script", label: "Dancing Script (Cursiva Artesanal / Chef)", family: "'Dancing Script', cursive" },
  { name: "Outfit", label: "Outfit (Geométrica Tecnológica)", family: "'Outfit', sans-serif" },
  { name: "Caveat", label: "Caveat (Manuscrita Casual)", family: "'Caveat', cursive" },
  { name: "Roboto", label: "Roboto (Neutral & Directa)", family: "'Roboto', sans-serif" },
];

const PROMPT_PRESETS = [
  {
    title: "SaaS / B2B Tech",
    prompt:
      "Vertical commercial SaaS poster background, dark navy tech background (#0B1120) with glowing orange (#FF5500) and indigo (#4F46E5) perspective grid lines at the bottom. In the lower half, a floating 3D glassmorphism balance scale comparing paper invoices vs sleek glowing microchip. Studio 3D render, high contrast.",
  },
  {
    title: "Gastronomía / Restaurante",
    prompt:
      "Commercial culinary poster background, deep dark textured slate surface, dramatic warm studio rim lighting, cinematic soft smoke. Clean empty upper half for headline typography, gourmet dish perfectly placed in lower half. Commercial food photography, 8k.",
  },
  {
    title: "Comercio / Producto Físico",
    prompt:
      "Minimalist commercial product showcase poster, neutral dark charcoal aesthetic, elegant studio pedestal in the center with dramatic directional spotlight, clean open space on top for commercial bold text. Sleek luxury look.",
  },
  {
    title: "Servicios Profesionales",
    prompt:
      "Modern corporate agency poster background, dark glassmorphism geometric abstract shapes floating softly on the sides, deep navy background with glowing orange accents, wide negative space in upper center for high contrast typography.",
  },
];

function removeBlackBackground(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(imageUrl);
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Brillo perceptual
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          if (brightness < 28) {
            data[i + 3] = 0; // 100% transparente
          } else if (brightness < 60) {
            // Suavizado anti-alias
            const factor = (brightness - 28) / 32;
            data[i + 3] = Math.round(data[i + 3] * factor);
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

function createInitialSlide(id: string): SlideData {
  return {
    id,
    prompt:
      "Vertical 4:5 commercial SaaS poster background, dark navy tech background (#0B1120) with glowing orange (#FF5500) and indigo (#4F46E5) perspective grid lines at the bottom. In the lower half, a floating 3D glassmorphism balance scale. Clean negative space in the upper 40% for typography. No text, no letters.",
    baseImageUrl: "",
    aspectRatio: "4:5",
    textLayers: [
      {
        id: "layer-1",
        text: "DIAGNÓSTICO PARA PYMES EN CHILE",
        x: 50,
        y: 8.5,
        fontFamily: "'Montserrat', sans-serif",
        size: 21,
        color: "#FFFFFF",
        backgroundColor: "#FF5500",
        isPill: true,
        shadowLevel: "hard",
        isBold: true,
        isItalic: false,
        letterSpacing: "wide",
        boxWidth: 0,
        textAlign: "center",
      },
      {
        id: "layer-2",
        text: "¿PAGAR $550.000/MES A UNA AGENCIA O AUTOMATIZAR CON EL ADN DE TU NEGOCIO?",
        x: 50,
        y: 22,
        fontFamily: "'Montserrat', sans-serif",
        size: 46,
        color: "#FFFFFF",
        backgroundColor: "transparent",
        shadowLevel: "hard",
        isBold: true,
        isItalic: false,
        letterSpacing: "normal",
        maxWidth: 960,
        boxWidth: 88,
        textAlign: "center",
      },
      {
        id: "layer-3",
        text: "Desliza y ahorra un 85% 👉",
        x: 74,
        y: 93,
        fontFamily: "'Montserrat', sans-serif",
        size: 22,
        color: "#0B1120",
        backgroundColor: "#FFFFFF",
        isPill: true,
        shadowLevel: "hard",
        isBold: true,
        isItalic: false,
        letterSpacing: "normal",
        boxWidth: 0,
        textAlign: "center",
      },
    ],
    useLogo: false,
    logoUrl: "",
    logoTransparent: true,
    logoBlendMode: "screen",
    logoBgMode: "transparent",
    logoX: 86,
    logoY: 14,
    logoWidth: 110,
  };
}

export default function ImagenComercialPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const { activeProfile } = useProfile();

  const [user, setUser] = useState<any>(null);
  const [slides, setSlides] = useState<SlideData[]>([createInitialSlide("slide-1")]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("layer-2");
  const [isDraggingLogo, setIsDraggingLogo] = useState<boolean>(false);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  // Estados de generación y carga
  const [isGeneratingBase, setIsGeneratingBase] = useState<boolean>(false);
  const [isRenderingFinal, setIsRenderingFinal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Modales
  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);
  const [customFontName, setCustomFontName] = useState<string>("");
  const [customFontUrl, setCustomFontUrl] = useState<string>("");
  const [customFontFile, setCustomFontFile] = useState<File | null>(null);
  const [isUploadingFont, setIsUploadingFont] = useState<boolean>(false);

  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [publishAction, setPublishAction] = useState<"now" | "schedule">("now");
  const [scheduleDateTime, setScheduleDateTime] = useState<string>("");
  const [postCaption, setPostCaption] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<string>("");

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const activeSlide = slides[activeSlideIndex] || slides[0];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && activeProfile?.logoUrl && !activeSlide.logoUrl) {
        setSlides((prev) =>
          prev.map((s, idx) => (idx === 0 ? { ...s, logoUrl: activeProfile.logoUrl, useLogo: true } : s))
        );
      }
      if (u && editId) {
        loadDesignForEditing(editId);
      }
    });
    return () => unsub();
  }, [editId, activeProfile?.logoUrl]);

  // Carga de diseño existente si viene de la Biblioteca
  const loadDesignForEditing = async (id: string) => {
    try {
      setStatusMessage("Cargando diseño de la biblioteca...");
      let data: any = null;
      const genSnap = await getDoc(doc(db, "generated_images", id));
      if (genSnap.exists()) {
        const genData = genSnap.data();
        data = genData.commercialDesignData;
      }
      if (!data) {
        const renderSnap = await getDoc(doc(db, "preview_renders", id));
        if (renderSnap.exists()) {
          data = renderSnap.data();
        }
      }

      if (data) {
        const loadedSlide: SlideData = {
          id: "slide-1",
          prompt: data.prompt || "Diseño cargado",
          baseImageUrl: data.baseImageUrl || "",
          aspectRatio: data.aspectRatio || "4:5",
          textLayers: Array.isArray(data.textLayers) && data.textLayers.length > 0 ? data.textLayers : createInitialSlide("slide-1").textLayers,
          useLogo: Boolean(data.useLogo),
          logoUrl: data.logoUrl || "",
          logoTransparent: data.logoTransparent !== undefined ? data.logoTransparent : true,
          logoBlendMode: data.logoBlendMode || (data.logoTransparent ? "screen" : "normal"),
          logoBgMode: data.logoBgMode || (data.logoBg === "white" ? "white" : "transparent"),
          logoX: data.logoX || 86,
          logoY: data.logoY || 14,
          logoWidth: data.logoWidth || 110,
        };
        setSlides([loadedSlide]);
        if (Array.isArray(data.customFonts)) {
          setCustomFonts(data.customFonts);
        }
        setStatusMessage("✅ Diseño cargado con éxito para edición.");
        setTimeout(() => setStatusMessage(""), 3000);
      }
    } catch (err: any) {
      console.warn("Error cargando diseño:", err);
      setErrorMessage("No se pudo cargar el diseño solicitado.");
    }
  };

  // Helper para actualizar la diapositiva activa
  const updateActiveSlide = (updater: (prev: SlideData) => SlideData) => {
    setSlides((prev) => {
      const copy = [...prev];
      copy[activeSlideIndex] = updater(copy[activeSlideIndex]);
      return copy;
    });
  };

  // Generar imagen base mediante el endpoint
  const handleGenerateBaseImage = async () => {
    if (!activeSlide.prompt.trim()) {
      setErrorMessage("Por favor ingresa una descripción para la escena visual.");
      return;
    }
    setErrorMessage("");
    setIsGeneratingBase(true);
    setStatusMessage("Nuestros agentes están construyendo la escena visual limpia...");

    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetch("/api/imagen-comercial/generate-base", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          prompt: activeSlide.prompt,
          aspectRatio: activeSlide.aspectRatio,
          rubro: activeProfile?.rubro || "Comercial",
          productName: activeProfile?.businessName || "",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.baseImageUrl) {
        throw new Error(data.error || "No se pudo generar la imagen base.");
      }

      updateActiveSlide((s) => ({
        ...s,
        baseImageUrl: data.baseImageUrl,
        finalRenderUrl: undefined,
      }));
      setStatusMessage("✅ Imagen base generada. Ya puedes posicionar los textos y logo en el lienzo.");
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Error generando imagen base.");
    } finally {
      setIsGeneratingBase(false);
    }
  };

  // Subir imagen base manual si el usuario ya tiene su foto
  const handleUploadBaseImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateActiveSlide((s) => ({
          ...s,
          baseImageUrl: reader.result as string,
          finalRenderUrl: undefined,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Subir logo manual
  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateActiveSlide((s) => ({
          ...s,
          logoUrl: reader.result as string,
          useLogo: true,
          logoTransparent: true,
          logoBlendMode: "screen",
          logoBgMode: "transparent",
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Convertir archivo de logo a PNG transparente real quitando píxeles negros
  const handleRemoveBlackFromLogo = async () => {
    if (!activeSlide.logoUrl) return;
    setStatusMessage("Limpiando fondo negro del logo...");
    try {
      const transparentUrl = await removeBlackBackground(activeSlide.logoUrl);
      updateActiveSlide((s) => ({
        ...s,
        logoUrl: transparentUrl,
        logoTransparent: true,
        logoBlendMode: "normal",
        logoBgMode: "transparent",
      }));
      setStatusMessage("✅ Fondo negro eliminado del archivo con éxito.");
      setTimeout(() => setStatusMessage(""), 3500);
    } catch (err: any) {
      console.warn("Error recortando fondo:", err);
      setErrorMessage("No se pudo procesar el fondo del logo.");
    }
  };

  // Lógica Drag & Drop sobre el lienzo
  const handlePointerDownLayer = (layerId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelectedLayerId(layerId);
    setIsDraggingLogo(false);

    const container = canvasContainerRef.current;
    if (!container) return;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const xPercent = Math.max(5, Math.min(95, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const yPercent = Math.max(5, Math.min(95, ((moveEvent.clientY - rect.top) / rect.height) * 100));

      updateActiveSlide((slide) => ({
        ...slide,
        textLayers: slide.textLayers.map((l) =>
          l.id === layerId ? { ...l, x: Math.round(xPercent * 10) / 10, y: Math.round(yPercent * 10) / 10 } : l
        ),
      }));
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handlePointerDownLogo = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingLogo(true);
    setSelectedLayerId(null);

    const container = canvasContainerRef.current;
    if (!container) return;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const xPercent = Math.max(5, Math.min(95, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const yPercent = Math.max(5, Math.min(95, ((moveEvent.clientY - rect.top) / rect.height) * 100));

      updateActiveSlide((slide) => ({
        ...slide,
        logoX: Math.round(xPercent * 10) / 10,
        logoY: Math.round(yPercent * 10) / 10,
      }));
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Agregar nueva capa de texto
  const handleAddTextLayer = () => {
    const newId = `layer-${Date.now()}`;
    const newLayer: TextLayer = {
      id: newId,
      text: "NUEVO TEXTO COMERCIAL",
      x: 50,
      y: 50,
      fontFamily: "'Montserrat', sans-serif",
      size: 32,
      color: "#FFFFFF",
      backgroundColor: "transparent",
      isPill: false,
      shadowLevel: "hard",
      isBold: true,
      isItalic: false,
      letterSpacing: "normal",
      boxWidth: 80,
      textAlign: "center",
    };
    updateActiveSlide((s) => ({
      ...s,
      textLayers: [...s.textLayers, newLayer],
    }));
    setSelectedLayerId(newId);
  };

  // Eliminar capa de texto
  const handleDeleteTextLayer = (id: string) => {
    updateActiveSlide((s) => ({
      ...s,
      textLayers: s.textLayers.filter((l) => l.id !== id),
    }));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  // Modificar capa activa
  const updateSelectedLayer = (updates: Partial<TextLayer>) => {
    if (!selectedLayerId) return;
    updateActiveSlide((s) => ({
      ...s,
      textLayers: s.textLayers.map((l) => (l.id === selectedLayerId ? { ...l, ...updates } : l)),
    }));
  };

  const selectedLayer = activeSlide.textLayers.find((l) => l.id === selectedLayerId);

  // Manejo de fuentes personalizadas (.TTF o URL)
  const handleAddCustomFont = async () => {
    if (!customFontName.trim()) {
      alert("Por favor indica un nombre para la fuente.");
      return;
    }
    setIsUploadingFont(true);
    try {
      let fontUrl = customFontUrl.trim();
      let isCssUrl = fontUrl.includes("fonts.googleapis.com") || fontUrl.endsWith(".css");

      if (customFontFile) {
        const formData = new FormData();
        formData.append("file", customFontFile);
        formData.append("fontName", customFontName.trim());
        const token = user ? await user.getIdToken() : "";

        const uploadRes = await fetch("/api/imagen-comercial/upload-font", {
          method: "POST",
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.fontUrl) {
          throw new Error(uploadData.error || "No se pudo subir el archivo de fuente.");
        }
        fontUrl = uploadData.fontUrl;
        isCssUrl = false;
      }

      if (!fontUrl) {
        alert("Por favor proporciona un archivo .ttf o una URL de fuente.");
        return;
      }

      // Inyectar en vivo en el navegador con FontFace o link
      if (isCssUrl) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = fontUrl;
        document.head.appendChild(link);
      } else {
        const fontFace = new FontFace(customFontName.trim(), `url(${fontUrl})`);
        await fontFace.load();
        document.fonts.add(fontFace);
      }

      const newCustomFont: CustomFont = {
        name: customFontName.trim(),
        url: fontUrl,
        isCssUrl,
      };

      setCustomFonts((prev) => [...prev.filter((f) => f.name !== newCustomFont.name), newCustomFont]);

      // Aplicar automáticamente a la capa seleccionada
      if (selectedLayerId) {
        updateSelectedLayer({ fontFamily: `'${customFontName.trim()}', sans-serif` });
      }

      setIsFontModalOpen(false);
      setCustomFontName("");
      setCustomFontUrl("");
      setCustomFontFile(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error registrando la fuente.");
    } finally {
      setIsUploadingFont(false);
    }
  };

  // Renderizar versión final en alta resolución con Butterfly Social
  const handleRenderFinal = async () => {
    if (!activeSlide.baseImageUrl) {
      setErrorMessage("Primero debes generar o subir la imagen base.");
      return;
    }
    setErrorMessage("");
    setIsRenderingFinal(true);
    setStatusMessage("Procesando renderizado de alta fidelidad con Butterfly Social...");

    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetch("/api/imagen-comercial/render-final", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          baseImageUrl: activeSlide.baseImageUrl,
          textLayers: activeSlide.textLayers,
          useLogo: activeSlide.useLogo,
          logoUrl: activeSlide.logoUrl,
          logoX: activeSlide.logoX,
          logoY: activeSlide.logoY,
          logoWidth: activeSlide.logoWidth,
          logoTransparent: activeSlide.logoTransparent,
          logoBlendMode: activeSlide.logoBlendMode || (activeSlide.logoTransparent ? "screen" : "normal"),
          logoBgMode: activeSlide.logoBgMode || (activeSlide.logoTransparent ? "transparent" : "white"),
          aspectRatio: activeSlide.aspectRatio,
          customFonts,
          saveToLibrary: true,
          prompt: activeSlide.prompt,
          isCarousel: slides.length > 1,
          slideIndex: activeSlideIndex,
          commercialDesignData: {
            slides,
            activeSlideIndex,
            customFonts,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.finalImageUrl) {
        throw new Error(data.error || "No se pudo renderizar la imagen final.");
      }

      updateActiveSlide((s) => ({
        ...s,
        finalRenderUrl: data.finalImageUrl,
      }));
      setStatusMessage("✅ ¡Cartel renderizado y guardado en tu Biblioteca con éxito!");
      setTimeout(() => setStatusMessage(""), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Error renderizando cartel.");
    } finally {
      setIsRenderingFinal(false);
    }
  };

  // Descargar imagen actual
  const handleDownload = () => {
    const url = activeSlide.finalRenderUrl || activeSlide.baseImageUrl;
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = `cartel-comercial-${activeSlide.aspectRatio.replace(":", "x")}-${Date.now()}.jpg`;
    link.click();
  };

  // Gestión de slides para carrusel (1 a 5)
  const handleAddSlide = () => {
    if (slides.length >= 5) {
      alert("El límite para carruseles en la plataforma es de 5 diapositivas.");
      return;
    }
    const newSlideId = `slide-${slides.length + 1}`;
    const newSlide = createInitialSlide(newSlideId);
    newSlide.aspectRatio = activeSlide.aspectRatio;
    newSlide.useLogo = activeSlide.useLogo;
    newSlide.logoUrl = activeSlide.logoUrl;
    newSlide.logoTransparent = activeSlide.logoTransparent;
    newSlide.logoBlendMode = activeSlide.logoBlendMode;
    newSlide.logoBgMode = activeSlide.logoBgMode;
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const handleRemoveSlide = (idx: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setActiveSlideIndex((cur) => Math.max(0, cur >= idx ? cur - 1 : cur));
  };

  // Publicar o Agendar
  const handleExecutePublishOrSchedule = async () => {
    setIsPublishing(true);
    setPublishSuccess("");
    try {
      const targetUrl = activeSlide.finalRenderUrl || activeSlide.baseImageUrl;
      if (!targetUrl) {
        throw new Error("No hay imagen generada para publicar.");
      }

      const token = user ? await user.getIdToken() : "";
      const isSchedule = publishAction === "schedule";

      const payload = {
        userId: user?.uid,
        profileId: activeProfile?.id || "default",
        type: slides.length > 1 ? "carrusel" : "post",
        imageUrl: targetUrl,
        carouselImages: slides.map((s) => s.finalRenderUrl || s.baseImageUrl).filter(Boolean),
        copy: postCaption || activeSlide.textLayers.map((l) => l.text).join("\n"),
        idea: activeSlide.prompt,
        aspectRatio: activeSlide.aspectRatio,
        scheduledFor: isSchedule ? new Date(scheduleDateTime).toISOString() : new Date().toISOString(),
        status: isSchedule ? "scheduled" : "ready_to_publish",
      };

      if (!isSchedule) {
        // Publicar ahora
        const pubRes = await fetch("/api/publish-now", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(payload),
        });
        const pubData = await pubRes.json();
        if (!pubRes.ok) throw new Error(pubData.error || "Error al publicar.");
        setPublishSuccess("🎉 ¡Publicado con éxito en tus redes sociales!");
      } else {
        // Agendar en Firestore
        await addDoc(collection(db, "social_posts"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setPublishSuccess("📅 ¡Programado con éxito en tu calendario de publicaciones!");
      }

      setTimeout(() => {
        setIsPublishModalOpen(false);
        setPublishSuccess("");
      }, 2500);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al procesar la publicación.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Dimensiones del contenedor visual del lienzo según el aspecto
  const canvasAspectRatioClass = useMemo(() => {
    if (activeSlide.aspectRatio === "4:5") return "aspect-[4/5] max-w-[460px]";
    if (activeSlide.aspectRatio === "9:16") return "aspect-[9/16] max-w-[380px]";
    return "aspect-square max-w-[480px]";
  }, [activeSlide.aspectRatio]);

  return (
    <div className="space-y-8 pb-20">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
              Estudio de Diseño Comercial
            </span>
            {slides.length > 1 && (
              <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                Carrusel ({slides.length}/5 slides)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Imagen Comercial
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Genera imágenes base de alta resolución con nuestros agentes y estampa tipografías comerciales y logos con{" "}
            <strong>Butterfly Social</strong>. Arrastra las capas libremente en el lienzo.
          </p>
        </div>

        {/* Acciones principales superiores */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/automatizacion-rrss/panel/biblioteca"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <span>📚</span>
            <span>Biblioteca</span>
          </Link>
          <button
            onClick={handleRenderFinal}
            disabled={isRenderingFinal || !activeSlide.baseImageUrl}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isRenderingFinal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Renderizar HD</span>
          </button>
        </div>
      </div>

      {/* Alertas de Estado / Error */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <X className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selector de Slides del Carrusel */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1">Diapositivas:</span>
          {slides.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-1">
              <button
                onClick={() => {
                  setActiveSlideIndex(idx);
                  setSelectedLayerId(s.textLayers[0]?.id || null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeSlideIndex === idx
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <span>Slide {idx + 1}</span>
                {s.baseImageUrl && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
              </button>
              {slides.length > 1 && (
                <button
                  onClick={() => handleRemoveSlide(idx)}
                  className="p-1 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                  title="Eliminar slide"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {slides.length < 5 && (
          <button
            onClick={handleAddSlide}
            className="px-3.5 py-1.5 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 hover:bg-orange-50 text-orange-700 font-bold text-xs flex items-center gap-1 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Slide ({slides.length}/5)</span>
          </button>
        )}
      </div>

      {/* Grid Principal: Panel de Configuración (Izq) + Lienzo Drag & Drop (Der) */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA IZQUIERDA: 3 Pasos de Configuración */}
        <div className="lg:col-span-5 space-y-6">
          {/* PASO 1: Escena Visual & Prompt */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm">Escena Visual & Formato</h3>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(["4:5", "1:1", "9:16"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => updateActiveSlide((s) => ({ ...s, aspectRatio: ratio }))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                      activeSlide.aspectRatio === ratio
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Descripción de la imagen (Prompt del fondo)
              </label>
              <textarea
                value={activeSlide.prompt}
                onChange={(e) => updateActiveSlide((s) => ({ ...s, prompt: e.target.value }))}
                rows={3}
                placeholder="Describe la composición visual, elementos 3D o escenario para el fondo limpio..."
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-orange-500 focus:outline-none transition-all leading-relaxed"
              />
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plantillas de prompt:</span>
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_PRESETS.map((p) => (
                  <button
                    key={p.title}
                    onClick={() => updateActiveSlide((s) => ({ ...s, prompt: p.prompt }))}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 transition-colors"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleGenerateBaseImage}
                disabled={isGeneratingBase}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isGeneratingBase ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-orange-400" />}
                <span>Generar Fondo con Agentes</span>
              </button>

              <label className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Subir Foto</span>
                <input type="file" accept="image/*" onChange={handleUploadBaseImage} className="hidden" />
              </label>
            </div>
          </div>

          {/* PASO 2: Capas de Texto Comerciales */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm">Capas de Texto</h3>
              </div>
              <button
                onClick={handleAddTextLayer}
                className="px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-[11px] flex items-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Añadir Capa</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {activeSlide.textLayers.map((layer, idx) => {
                const isSelected = layer.id === selectedLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => {
                      setSelectedLayerId(layer.id);
                      setIsDraggingLogo(false);
                    }}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? "border-orange-500 bg-orange-50/30 shadow-2xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Capa {idx + 1} {layer.isPill ? "· [Píldora]" : ""}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTextLayer(layer.id);
                          }}
                          className="p-1 text-slate-300 hover:text-rose-500 rounded-md"
                          title="Eliminar capa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={layer.text}
                      placeholder="Escribe el texto de la capa (usa Enter para saltos de línea)..."
                      onChange={(e) =>
                        updateActiveSlide((s) => ({
                          ...s,
                          textLayers: s.textLayers.map((l) =>
                            l.id === layer.id ? { ...l, text: e.target.value } : l
                          ),
                        }))
                      }
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none resize-y leading-tight"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* PASO 3: Logo de Marca */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm">Logo de Marca</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={activeSlide.useLogo}
                  onChange={(e) => updateActiveSlide((s) => ({ ...s, useLogo: e.target.checked }))}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span>Mostrar Logo</span>
              </label>
            </div>

            {activeSlide.useLogo && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-16 h-16 rounded-2xl border flex items-center justify-center p-2 overflow-hidden shrink-0 transition-colors ${
                      activeSlide.logoBgMode === "white"
                        ? "bg-white border-slate-300"
                        : "bg-slate-900 border-slate-800"
                    }`}
                  >
                    {activeSlide.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeSlide.logoUrl}
                        alt="Logo"
                        style={{
                          mixBlendMode: activeSlide.logoBlendMode || (activeSlide.logoTransparent ? "screen" : "normal"),
                        }}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">Sin logo</span>
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="inline-block py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all">
                        <span>📁 Subir Logo</span>
                        <input type="file" accept="image/png,image/svg+xml,image/jpeg" onChange={handleUploadLogo} className="hidden" />
                      </label>
                      {activeSlide.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveBlackFromLogo}
                          className="py-2 px-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-[11px] transition-all flex items-center gap-1 shadow-2xs"
                          title="Recorta matemáticamente los píxeles negros en un archivo PNG transparente real"
                        >
                          <Sparkles className="w-3 h-3 text-orange-600" />
                          <span>Recortar fondo negro</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modos de Fondo de Logo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                    Modo de Transparencia del Logo:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveSlide((s) => ({
                          ...s,
                          logoTransparent: true,
                          logoBlendMode: "screen",
                          logoBgMode: "transparent",
                        }))
                      }
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                        activeSlide.logoBlendMode === "screen" && activeSlide.logoBgMode !== "white"
                          ? "bg-orange-50 border-orange-400 text-orange-700 ring-1 ring-orange-300"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>🖤 Quitar fondo negro</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateActiveSlide((s) => ({
                          ...s,
                          logoTransparent: true,
                          logoBlendMode: "normal",
                          logoBgMode: "transparent",
                        }))
                      }
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                        activeSlide.logoBlendMode === "normal" && activeSlide.logoBgMode !== "white"
                          ? "bg-orange-50 border-orange-400 text-orange-700 ring-1 ring-orange-300"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>💎 PNG Transparente</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateActiveSlide((s) => ({
                          ...s,
                          logoTransparent: true,
                          logoBlendMode: "multiply",
                          logoBgMode: "transparent",
                        }))
                      }
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                        activeSlide.logoBlendMode === "multiply" && activeSlide.logoBgMode !== "white"
                          ? "bg-orange-50 border-orange-400 text-orange-700 ring-1 ring-orange-300"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>⚪ Quitar fondo blanco</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateActiveSlide((s) => ({
                          ...s,
                          logoTransparent: false,
                          logoBlendMode: "normal",
                          logoBgMode: "white",
                        }))
                      }
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                        activeSlide.logoBgMode === "white"
                          ? "bg-orange-50 border-orange-400 text-orange-700 ring-1 ring-orange-300"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>🔲 Placa blanca</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Tamaño del Logo</span>
                    <span>{activeSlide.logoWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={220}
                    value={activeSlide.logoWidth}
                    onChange={(e) => updateActiveSlide((s) => ({ ...s, logoWidth: Number(e.target.value) }))}
                    className="w-full accent-orange-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Lienzo Drag & Drop Interactivo */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Lienzo Drag & Drop ({activeSlide.aspectRatio})
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold">
                Arrastra los textos o el logo para moverlos libremente
              </span>
            </div>

            {/* CONTENEDOR DEL LIENZO */}
            <div
              ref={canvasContainerRef}
              className={`relative w-full overflow-hidden rounded-2xl select-none shadow-2xl border border-white/10 ${canvasAspectRatioClass}`}
              style={{
                backgroundColor: "#0B1120",
                backgroundImage: activeSlide.baseImageUrl ? `url(${activeSlide.baseImageUrl})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Si no hay imagen base, mensaje instructivo */}
              {!activeSlide.baseImageUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                    🎨
                  </div>
                  <div className="text-xs font-bold text-slate-200">Lienzo Listo</div>
                  <p className="text-[11px] max-w-xs text-slate-400">
                    Escribe la descripción a la izquierda y presiona <strong>&quot;Generar Fondo con Agentes&quot;</strong> para proyectar la imagen aquí.
                  </p>
                </div>
              )}

              {/* Scrims sutiles para legibilidad */}
              <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none z-0" />
              <div className="absolute bottom-0 left-0 w-full h-[35%] bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none z-0" />

              {/* CAPAS DE TEXTO ARRASTRABLES */}
              {activeSlide.textLayers.map((layer) => {
                const isSelected = layer.id === selectedLayerId;
                const isPill = Boolean(layer.isPill);
                const layerWidth = layer.boxWidth !== undefined && layer.boxWidth !== null
                  ? (layer.boxWidth === 0 ? "max-content" : `${layer.boxWidth}%`)
                  : isPill
                  ? "max-content"
                  : layer.maxWidth
                  ? `${Math.round((layer.maxWidth / 1080) * 100)}%`
                  : "88%";

                const whiteSpace = layerWidth === "max-content" ? "nowrap" : "pre-line";

                return (
                  <div
                    key={layer.id}
                    onPointerDown={(e) => handlePointerDownLayer(layer.id, e)}
                    style={{
                      left: `${layer.x}%`,
                      top: `${layer.y}%`,
                      transform: "translate(-50%, -50%)",
                      width: layerWidth,
                      maxWidth: "96%",
                      whiteSpace,
                      textAlign: layer.textAlign || "center",
                      wordBreak: "break-word",
                      color: layer.color,
                      fontFamily: layer.fontFamily,
                      fontSize: `${Math.round(layer.size * 0.45)}px`, // Escala para preview
                      fontWeight: layer.isBold ? 800 : 400,
                      fontStyle: layer.isItalic ? "italic" : "normal",
                      letterSpacing: layer.letterSpacing === "widest" ? "0.1em" : layer.letterSpacing === "wide" ? "0.05em" : "normal",
                      backgroundColor: layer.backgroundColor !== "transparent" ? layer.backgroundColor : "transparent",
                      borderRadius: layer.isPill ? "9999px" : "4px",
                      padding: layer.backgroundColor !== "transparent" ? (layer.isPill ? "3px 12px" : "2px 6px") : "0",
                      textShadow:
                        layer.shadowLevel === "none"
                          ? "none"
                          : layer.shadowLevel === "soft"
                          ? "1px 1px 4px rgba(0,0,0,0.6)"
                          : "2px 2px 8px rgba(0,0,0,0.9)",
                    }}
                    className={`absolute z-10 cursor-move transition-shadow leading-tight ${
                      isSelected
                        ? "ring-2 ring-orange-400 ring-offset-2 ring-offset-black/50 shadow-lg"
                        : "hover:ring-1 hover:ring-white/40"
                    }`}
                  >
                    {layer.text}
                  </div>
                );
              })}

              {/* LOGO ARRASTRABLE */}
              {activeSlide.useLogo && activeSlide.logoUrl && (
                <div
                  onPointerDown={handlePointerDownLogo}
                  style={{
                    left: `${activeSlide.logoX}%`,
                    top: `${activeSlide.logoY}%`,
                    transform: "translate(-50%, -50%)",
                    width: `${Math.round(activeSlide.logoWidth * 0.55)}px`,
                    height: `${Math.round(activeSlide.logoWidth * 0.55)}px`,
                    backgroundColor: activeSlide.logoBgMode === "white" ? "#FFFFFF" : "transparent",
                    borderRadius: activeSlide.logoBgMode === "white" ? "12px" : "0px",
                    padding: activeSlide.logoBgMode === "white" ? "6px" : "0px",
                    boxShadow: activeSlide.logoBgMode === "white" ? "0 4px 14px rgba(0,0,0,0.25)" : "none",
                  }}
                  className={`absolute z-20 cursor-move flex items-center justify-center ${
                    isDraggingLogo ? "ring-2 ring-orange-400 ring-offset-2 ring-offset-black" : "hover:ring-1 hover:ring-white/40"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeSlide.logoUrl}
                    alt="Logo"
                    style={{
                      mixBlendMode: activeSlide.logoBlendMode || (activeSlide.logoTransparent ? "screen" : "normal"),
                      filter: activeSlide.logoBgMode === "white" ? "none" : "drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
                    }}
                    className="max-w-full max-h-full object-contain pointer-events-none"
                  />
                </div>
              )}
            </div>

            {/* BOTONES DE ACCIÓN POST-DISEÑO */}
            <div className="w-full flex items-center justify-between gap-3 pt-6 border-t border-white/10 mt-6 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!activeSlide.baseImageUrl}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PNG</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPublishAction("now");
                    setIsPublishModalOpen(true);
                  }}
                  disabled={!activeSlide.baseImageUrl}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-40"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Publicar Ahora</span>
                </button>

                <button
                  onClick={() => {
                    setPublishAction("schedule");
                    setIsPublishModalOpen(true);
                  }}
                  disabled={!activeSlide.baseImageUrl}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-40"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar</span>
                </button>
              </div>
            </div>
          </div>

          {/* BARRA DE HERRAMIENTAS: EDICIÓN DE LA CAPA SELECCIONADA */}
          {selectedLayer && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-orange-600" />
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Estilo de Capa Seleccionada
                  </h4>
                </div>
                <button
                  onClick={() => setIsFontModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Fuente Propia (.TTF / URL)</span>
                </button>
              </div>

              {/* Selector de Fuentes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipografía</label>
                <select
                  value={selectedLayer.fontFamily}
                  onChange={(e) => updateSelectedLayer({ fontFamily: e.target.value })}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  <optgroup label="Fuentes Predeterminadas de la Plataforma">
                    {DEFAULT_FONTS.map((f) => (
                      <option key={f.name} value={f.family}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                  {customFonts.length > 0 && (
                    <optgroup label="Fuentes Personalizadas Cargadas">
                      {customFonts.map((cf) => (
                        <option key={cf.name} value={`'${cf.name}', sans-serif`}>
                          ✨ {cf.name} (Custom)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Controles de Estilo: Tamaño, Color, Fondo Píldora */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Tamaño ({selectedLayer.size}px)
                  </label>
                  <input
                    type="range"
                    min={14}
                    max={72}
                    value={selectedLayer.size}
                    onChange={(e) => updateSelectedLayer({ size: Number(e.target.value) })}
                    className="w-full accent-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Color de Texto</label>
                  <input
                    type="color"
                    value={selectedLayer.color.startsWith("#") ? selectedLayer.color : "#FFFFFF"}
                    onChange={(e) => updateSelectedLayer({ color: e.target.value })}
                    className="w-full h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Color Fondo</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedLayer.backgroundColor.startsWith("#") ? selectedLayer.backgroundColor : "#FF5500"}
                      onChange={(e) => updateSelectedLayer({ backgroundColor: e.target.value })}
                      className="w-10 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <button
                      onClick={() =>
                        updateSelectedLayer({
                          backgroundColor: selectedLayer.backgroundColor === "transparent" ? "#FF5500" : "transparent",
                        })
                      }
                      className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {selectedLayer.backgroundColor === "transparent" ? "Sin fondo" : "Quitar"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Estilo Píldora</label>
                  <button
                    onClick={() => updateSelectedLayer({ isPill: !selectedLayer.isPill })}
                    className={`w-full py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      selectedLayer.isPill
                        ? "bg-orange-50 border-orange-300 text-orange-700 font-black"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {selectedLayer.isPill ? "Píldora Activa" : "Rectangular"}
                  </button>
                </div>
              </div>

              {/* Controles de Ancho Fijo y Alineación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {/* Ancho del Bloque (boxWidth) */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>
                      Ancho del Bloque:{" "}
                      <strong className="text-slate-800">
                        {selectedLayer.boxWidth === 0 || selectedLayer.isPill
                          ? "Automático"
                          : `${selectedLayer.boxWidth || 88}%`}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedLayer({
                          boxWidth: selectedLayer.boxWidth === 0 ? 88 : 0,
                        })
                      }
                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md"
                    >
                      {selectedLayer.boxWidth === 0 ? "Fijar Ancho" : "Ajuste Auto"}
                    </button>
                  </div>
                  <input
                    type="range"
                    min={35}
                    max={100}
                    disabled={selectedLayer.boxWidth === 0}
                    value={selectedLayer.boxWidth || 88}
                    onChange={(e) => updateSelectedLayer({ boxWidth: Number(e.target.value) })}
                    className="w-full accent-orange-500 disabled:opacity-40"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Mantiene el ancho fijo al mover el texto a la derecha o izquierda sin apretarse.
                  </p>
                </div>

                {/* Alineación de Texto */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Alineación del Texto
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => updateSelectedLayer({ textAlign: "left" })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                        selectedLayer.textAlign === "left"
                          ? "bg-orange-50 border-orange-300 text-orange-700 font-black"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      ⬅ Izq
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedLayer({ textAlign: "center" })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                        !selectedLayer.textAlign || selectedLayer.textAlign === "center"
                          ? "bg-orange-50 border-orange-300 text-orange-700 font-black"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      ↔ Centro
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedLayer({ textAlign: "right" })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                        selectedLayer.textAlign === "right"
                          ? "bg-orange-50 border-orange-300 text-orange-700 font-black"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      ➡ Der
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: SUBIR FUENTE PERSONALIZADA (.TTF / URL) */}
      {isFontModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-5 h-5 text-orange-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Añadir Fuente Personalizada</h3>
              </div>
              <button
                onClick={() => setIsFontModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Si tu marca usa una tipografía específica, puedes subir directamente el archivo <strong>.TTF / .WOFF2</strong> o pegar un enlace de Google Fonts.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Fuente</label>
                <input
                  type="text"
                  value={customFontName}
                  onChange={(e) => setCustomFontName(e.target.value)}
                  placeholder="Ej: Gotham, Cinzel, Circular..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Opción A: Subir Archivo (.TTF / .WOFF2)</label>
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setCustomFontFile(file);
                    if (file && !customFontName) {
                      setCustomFontName(file.name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Opción B: URL de Google Fonts o CSS CDN</label>
                <input
                  type="text"
                  value={customFontUrl}
                  onChange={(e) => setCustomFontUrl(e.target.value)}
                  placeholder="https://fonts.googleapis.com/css2?family=..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsFontModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCustomFont}
                disabled={isUploadingFont}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isUploadingFont ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Guardar y Aplicar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PUBLICAR AHORA / AGENDAR */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  {publishAction === "now" ? "Publicar en Redes Sociales" : "Agendar en Calendario"}
                </h3>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {publishSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs text-center space-y-1">
                <div>{publishSuccess}</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Texto del Copy para la publicación
                  </label>
                  <textarea
                    rows={4}
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    placeholder="Escribe el texto persuasivo que acompañará la imagen o carrusel..."
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                {publishAction === "schedule" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fecha y Hora de Publicación
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-700">Formato a publicar:</div>
                  <div>
                    {slides.length > 1
                      ? `Carrusel con ${slides.length} diapositivas en formato ${activeSlide.aspectRatio}`
                      : `Post individual en formato ${activeSlide.aspectRatio}`}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsPublishModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleExecutePublishOrSchedule}
                    disabled={isPublishing || (publishAction === "schedule" && !scheduleDateTime)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{publishAction === "now" ? "Confirmar Publicación" : "Guardar en Agenda"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
