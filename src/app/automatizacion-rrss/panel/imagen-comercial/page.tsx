"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useProfile } from "../../../../contexts/ProfileContext";
import { removeLogoBackground } from "../../../../lib/logo-bg-remover";
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
  Wand2,
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

function createInitialSlide(id: string, aspectRatio: "4:5" | "1:1" | "9:16" = "4:5", logoUrl = ""): SlideData {
  return {
    id,
    prompt: "",
    baseImageUrl: "",
    aspectRatio,
    textLayers: [],
    useLogo: Boolean(logoUrl),
    logoUrl: logoUrl || "",
    logoTransparent: true,
    logoBlendMode: "screen",
    logoBgMode: "transparent",
    logoX: 86,
    logoY: 14,
    logoWidth: 110,
  };
}

// Extraer capas de texto comerciales desde la sintaxis de un prompt
function extractTypographyLayersFromPrompt(
  promptText: string,
  aspectRatio: "4:5" | "1:1" | "9:16" = "4:5"
): TextLayer[] {
  if (!promptText || !promptText.trim()) return [];

  const lines = promptText.split("\n");
  const extracted: { prefix: string; text: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Buscar comillas dobles o tipográficas en la línea
    const match = trimmed.match(/^(.*?)[":“]([^"”]+)["”](.*?)$/);
    if (match) {
      const prefix = match[1].trim().toLowerCase();
      const text = match[2].trim();
      // Filtrar códigos de color o cosas irrelevantes
      if (text.length >= 2 && !text.startsWith("#") && !text.match(/^[0-9a-fA-F]{3,8}$/)) {
        extracted.push({ prefix, text });
      }
    }
  }

  // Fallback si venía en un solo párrafo o sin saltos estándar
  if (extracted.length === 0) {
    const typoIdx = promptText.search(/TYPOGRAPHY/i);
    const searchArea = typoIdx !== -1 ? promptText.slice(typoIdx) : promptText;
    const allQuotes = Array.from(searchArea.matchAll(/["“]([^"”]{3,180})["”]/g));
    for (const q of allQuotes) {
      const text = q[1].trim();
      if (!text.startsWith("#") && !text.match(/^[0-9a-fA-F]{3,8}$/)) {
        extracted.push({ prefix: "", text });
      }
    }
  }

  if (extracted.length === 0) return [];

  const total = extracted.length;
  const is45 = aspectRatio === "4:5";
  const is916 = aspectRatio === "9:16";

  return extracted.map((item, idx) => {
    const p = item.prefix;
    let size = 26;
    let color = "#FFFFFF";
    let isBold = true;
    let isItalic = false;
    let isPill = false;
    let backgroundColor = "transparent";
    let shadowLevel: "none" | "soft" | "hard" = "hard";
    let textAlign: "left" | "center" | "right" = "center";
    let x = 50;
    let y = is45 ? 18 : 15;
    let boxWidth = is45 ? 80 : 88;

    // Detectar colores en el prefijo
    if (p.includes("red") || p.includes("orange") || p.includes("rojo") || p.includes("naranja")) {
      color = "#FF5500";
    } else if (p.includes("yellow") || p.includes("amarillo")) {
      color = "#F59E0B";
    } else if (p.includes("green") || p.includes("emerald") || p.includes("verde")) {
      color = "#10B981";
    } else if (p.includes("white") || p.includes("blanco")) {
      color = "#FFFFFF";
    }

    // Detectar si es Pill o Badge
    if (p.includes("pill") || p.includes("badge") || p.includes("sub-badge")) {
      isPill = true;
      size = 18;
      boxWidth = item.text.length > 26 ? (is45 ? 80 : 86) : 0;
      if (color === "#FFFFFF") {
        backgroundColor = "#FFFFFF";
        color = "#0B1120";
      } else {
        backgroundColor = color;
      }
    }

    // Jerarquía según etiqueta o índice calibrada para zona segura de perfil (1:1)
    if (p.includes("top") || p.includes("header") || p.includes("headline") || idx === 0) {
      size = total > 4 ? 26 : (is45 ? 34 : 42);
      isBold = true;
      textAlign = "center";
      x = 50;
      y = is45 ? (isPill ? 16 : 18) : is916 ? (isPill ? 16 : 20) : (isPill ? 10 : 14);
    } else if (p.includes("body") || p.includes("desc") || p.includes("cuerpo")) {
      size = total > 4 ? 15 : 18;
      isBold = false;
      color = color === "#FFFFFF" ? "#E2E8F0" : color;
      textAlign = "left";
      x = 50;
      boxWidth = is45 ? 80 : 86;
      y = is45 ? Math.min(76, Math.round(24 + idx * (48 / total))) : Math.min(88, Math.round(18 + idx * (70 / total)));
    } else if (p.includes("title") || p.includes("titular") || p.includes("card") || p.includes("item")) {
      size = total > 4 ? 20 : 24;
      isBold = true;
      textAlign = "left";
      x = 50;
      boxWidth = is45 ? 80 : 86;
      y = is45 ? Math.min(74, Math.round(20 + idx * (48 / total))) : Math.min(85, Math.round(14 + idx * (70 / total)));
    } else if (p.includes("bottom") || idx === total - 1) {
      size = 18;
      isPill = true;
      boxWidth = item.text.length > 26 ? (is45 ? 80 : 86) : 0;
      y = is45 ? 82 : is916 ? 86 : 90;
      x = 50;
    } else {
      // Distribución uniforme dentro de zona segura
      y = is45 ? Math.min(76, Math.round(20 + idx * (54 / Math.max(1, total - 1)))) : Math.min(88, Math.round(15 + idx * (70 / Math.max(1, total - 1))));
    }

    return {
      id: `layer-extracted-${idx + 1}-${Date.now()}`,
      text: item.text,
      fontFamily: "'Montserrat', sans-serif",
      size,
      color,
      backgroundColor,
      isPill,
      shadowLevel,
      isBold,
      isItalic,
      letterSpacing: isPill ? "wide" : "normal",
      boxWidth,
      textAlign,
      x,
      y,
    };
  });
}

// Construir capas de texto limpias cuando el usuario ingresa texto libre manual por slide
function buildLayersFromManualText(
  rawText: string,
  aspectRatio: "4:5" | "1:1" | "9:16" = "4:5"
): TextLayer[] {
  if (!rawText || !rawText.trim()) return [];
  const extracted = extractTypographyLayersFromPrompt(rawText, aspectRatio);
  if (extracted && extracted.length > 0) return extracted;

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];
  const is45 = aspectRatio === "4:5";

  if (lines.length === 1) {
    return [
      {
        id: `layer-manual-1-${Date.now()}`,
        text: lines[0],
        fontFamily: "'Montserrat', sans-serif",
        size: is45 ? 32 : 38,
        color: "#FFFFFF",
        backgroundColor: "transparent",
        isPill: false,
        shadowLevel: "hard",
        isBold: true,
        isItalic: false,
        letterSpacing: "normal",
        boxWidth: is45 ? 80 : 86,
        textAlign: "center",
        x: 50,
        y: is45 ? 24 : 18,
      },
    ];
  }

  if (lines.length === 2) {
    return [
      {
        id: `layer-manual-1-${Date.now()}`,
        text: lines[0],
        fontFamily: "'Montserrat', sans-serif",
        size: is45 ? 32 : 38,
        color: "#FFFFFF",
        backgroundColor: "transparent",
        isPill: false,
        shadowLevel: "hard",
        isBold: true,
        isItalic: false,
        letterSpacing: "normal",
        boxWidth: is45 ? 80 : 86,
        textAlign: "center",
        x: 50,
        y: is45 ? 22 : 16,
      },
      {
        id: `layer-manual-2-${Date.now()}`,
        text: lines[1],
        fontFamily: "'Montserrat', sans-serif",
        size: 19,
        color: "#E2E8F0",
        backgroundColor: "transparent",
        isPill: false,
        shadowLevel: "soft",
        isBold: false,
        isItalic: false,
        letterSpacing: "normal",
        boxWidth: is45 ? 80 : 84,
        textAlign: "center",
        x: 50,
        y: is45 ? 38 : 32,
      },
    ];
  }

  return lines.map((line, idx) => {
    const isFirst = idx === 0;
    const isSecond = idx === 1;
    const isLast = idx === lines.length - 1 && lines.length >= 3;
    const isPill = isFirst || isLast;
    return {
      id: `layer-manual-${idx + 1}-${Date.now()}`,
      text: line,
      fontFamily: "'Montserrat', sans-serif",
      size: isFirst ? 15 : isSecond ? (is45 ? 30 : 36) : isLast ? 16 : 18,
      color: isFirst ? "#FFFFFF" : isSecond ? "#FFFFFF" : isLast ? "#0B1120" : "#E2E8F0",
      backgroundColor: isFirst ? "#FF5500" : isLast ? "#FFFFFF" : "transparent",
      isPill,
      shadowLevel: isSecond ? "hard" : "soft",
      isBold: isFirst || isSecond || isLast,
      isItalic: false,
      letterSpacing: isPill ? "wide" : "normal",
      boxWidth: isPill ? (line.length > 26 ? (is45 ? 80 : 86) : 0) : (is45 ? 80 : 86),
      textAlign: "center",
      x: 50,
      y: isFirst
        ? (is45 ? 16 : 8)
        : isSecond
        ? (is45 ? 26 : 20)
        : isLast
        ? (is45 ? 82 : 90)
        : Math.min(76, is45 ? 38 + (idx - 2) * 12 : 34 + (idx - 2) * 14),
    };
  });
}

export default function ImagenComercialPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const { activeProfile } = useProfile();

  const [user, setUser] = useState<any>(null);
  const [slides, setSlides] = useState<SlideData[]>([createInitialSlide("slide-1")]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Estados del Asistente Previo ("¿Qué quieres hacer?")
  const [isWizardCompleted, setIsWizardCompleted] = useState<boolean>(Boolean(editId));
  const [wizardContentType, setWizardContentType] = useState<"post" | "historia" | "carrusel">("post");
  const [wizardSlideCount, setWizardSlideCount] = useState<number>(3);
  const [wizardAspectRatio, setWizardAspectRatio] = useState<"4:5" | "1:1" | "9:16">("4:5");
  const [wizardDesignMode, setWizardDesignMode] = useState<"idea" | "clear">("idea");
  const [wizardIdea, setWizardIdea] = useState<string>("");
  const [wizardIncludeText, setWizardIncludeText] = useState<boolean>(true);
  const [wizardTextMode, setWizardTextMode] = useState<"agent" | "manual">("agent");
  const [wizardManualTexts, setWizardManualTexts] = useState<string[]>(["", "", "", "", ""]);
  const [wizardManualPrompts, setWizardManualPrompts] = useState<string[]>(["", "", "", "", ""]);
  const [isPlanningSlides, setIsPlanningSlides] = useState<boolean>(false);
  const [isGeneratingAllBases, setIsGeneratingAllBases] = useState<boolean>(false);

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState<boolean>(false);
  const [showSafeZoneGuide, setShowSafeZoneGuide] = useState<boolean>(true);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  // Estados de generación y carga
  const [isGeneratingBase, setIsGeneratingBase] = useState<boolean>(false);
  const [isRenderingFinal, setIsRenderingFinal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentLibraryDocId, setCurrentLibraryDocId] = useState<string | null>(editId || null);

  // Modales
  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);
  const [customFontName, setCustomFontName] = useState<string>("");
  const [customFontUrl, setCustomFontUrl] = useState<string>("");
  const [customFontFile, setCustomFontFile] = useState<File | null>(null);
  const [isUploadingFont, setIsUploadingFont] = useState<boolean>(false);

  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [publishAction, setPublishAction] = useState<"now" | "schedule">("now");
  const [publishFormat, setPublishFormat] = useState<"post" | "historia">("post");
  const [scheduleDateTime, setScheduleDateTime] = useState<string>("");
  const [postCaption, setPostCaption] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<string>("");

  // Redes sociales conectadas y seleccionadas
  const [connectedNetworks, setConnectedNetworks] = useState<{
    instagram: boolean;
    facebook: boolean;
    linkedin: boolean;
    tiktok: boolean;
    youtube: boolean;
    x: boolean;
  }>({
    instagram: false,
    facebook: false,
    linkedin: false,
    tiktok: false,
    youtube: false,
    x: false,
  });
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(["instagram", "facebook"]);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState<boolean>(false);
  const [isRemovingBgWithRemover, setIsRemovingBgWithRemover] = useState<boolean>(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const activeSlide = slides[activeSlideIndex] || slides[0];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Detectar redes sociales conectadas según tokens en activeProfile o documento de usuario
        try {
          const userSnap = await getDoc(doc(db, "users", u.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            const isDefault = activeProfile?.id === "default";
            const isValidToken = (t: any) => !!t && t !== "null" && t !== "undefined" && t !== "";
            const fbOK = isValidToken(activeProfile?.facebookToken_enc) || (isDefault && isValidToken(data.facebookToken_enc));
            const igOK = isValidToken(activeProfile?.instagramToken_enc) || (isDefault && isValidToken(data.instagramToken_enc));
            const liOK = isValidToken(activeProfile?.linkedinUserToken_enc) || isValidToken(activeProfile?.linkedinToken_enc) || (isDefault && (isValidToken(data.linkedinUserToken_enc) || isValidToken(data.linkedinToken_enc)));
            const ttOK = isValidToken(activeProfile?.tiktokToken_enc) || (isDefault && isValidToken(data.tiktokToken_enc));
            const ytOK = isValidToken(activeProfile?.youtubeToken_enc || activeProfile?.accounts?.youtube?.token) || (isDefault && isValidToken(data.youtubeToken_enc));
            const xOK = isValidToken(activeProfile?.xToken_enc || activeProfile?.accounts?.x?.token) || (isDefault && isValidToken(data.xToken_enc));

            const nets = {
              instagram: Boolean(igOK),
              facebook: Boolean(fbOK),
              linkedin: Boolean(liOK),
              tiktok: Boolean(ttOK),
              youtube: Boolean(ytOK),
              x: Boolean(xOK),
            };
            setConnectedNetworks(nets);

            const initialSelected: string[] = [];
            if (igOK) initialSelected.push("instagram");
            if (fbOK) initialSelected.push("facebook");
            if (liOK) initialSelected.push("linkedin");
            if (ttOK) initialSelected.push("tiktok");
            if (xOK) initialSelected.push("x");
            if (ytOK) initialSelected.push("youtube");
            setSelectedNetworks(initialSelected.length > 0 ? initialSelected : ["instagram"]);
          }
        } catch (netErr) {
          console.warn("Error leyendo redes sociales vinculadas:", netErr);
        }

        if (activeProfile?.logoUrl && !activeSlide.logoUrl) {
          setSlides((prev) =>
            prev.map((s, idx) => (idx === 0 ? { ...s, logoUrl: activeProfile.logoUrl, useLogo: true } : s))
          );
        }
        if (editId) {
          loadDesignForEditing(editId);
        }
      }
    });
    return () => unsub();
  }, [editId, activeProfile?.logoUrl, activeProfile?.id]);

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
        if (Array.isArray(data.slides) && data.slides.length > 0) {
          setSlides(data.slides);
          const initialSlideParam = searchParams.get("slide");
          const targetSlideIdx = initialSlideParam !== null
            ? Math.min(Math.max(0, parseInt(initialSlideParam, 10) || 0), data.slides.length - 1)
            : (data.activeSlideIndex || 0);
          setActiveSlideIndex(targetSlideIdx);
          if (data.slides.length > 1) {
            setWizardContentType("carrusel");
            setWizardSlideCount(data.slides.length);
          } else if (data.slides[0]?.aspectRatio === "9:16") {
            setWizardContentType("historia");
            setPublishFormat("historia");
          } else {
            setWizardContentType("post");
            setPublishFormat("post");
          }
        } else {
          const loadedSlide: SlideData = {
            id: "slide-1",
            prompt: data.prompt || "",
            baseImageUrl: data.baseImageUrl || "",
            aspectRatio: data.aspectRatio || "4:5",
            textLayers: Array.isArray(data.textLayers) ? data.textLayers : [],
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
          if (loadedSlide.aspectRatio === "9:16") {
            setWizardContentType("historia");
            setPublishFormat("historia");
          } else {
            setWizardContentType("post");
            setPublishFormat("post");
          }
        }
        if (Array.isArray(data.customFonts)) {
          setCustomFonts(data.customFonts);
        }
        setCurrentLibraryDocId(id);
        setIsWizardCompleted(true);
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

  // Detección inteligente de capas de texto en el prompt del slide activo
  const detectedTypographyLayers = useMemo(
    () => extractTypographyLayersFromPrompt(activeSlide.prompt, activeSlide.aspectRatio),
    [activeSlide.prompt, activeSlide.aspectRatio]
  );

  const handleApplyDetectedTypography = (layers: TextLayer[]) => {
    if (!layers || layers.length === 0) return;
    updateActiveSlide((s) => ({
      ...s,
      textLayers: layers,
    }));
    setSelectedLayerId(layers[0]?.id || null);
    setStatusMessage(`✨ ¡Se cargaron automáticamente ${layers.length} capas de texto desde el prompt!`);
    setTimeout(() => setStatusMessage(""), 4000);
  };

  const handlePromptChange = (val: string) => {
    updateActiveSlide((s) => {
      const updated = { ...s, prompt: val };
      // Si las capas actuales están completamente vacías y el nuevo prompt contiene capas detectables, auto-poblarlas
      const isCurrentlyEmpty = s.textLayers.every((l) => !l.text.trim());
      if (isCurrentlyEmpty) {
        const extracted = extractTypographyLayersFromPrompt(val, s.aspectRatio);
        if (extracted && extracted.length > 0) {
          updated.textLayers = extracted;
        }
      }
      return updated;
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

  // Generar todas las imágenes base del carrusel secuencialmente
  const handleGenerateAllCarouselBases = async (customSlidesList?: SlideData[]) => {
    const listToProcess = customSlidesList || slides;
    const slidesWithPrompt = listToProcess.filter((s) => s.prompt && s.prompt.trim().length > 0);
    if (slidesWithPrompt.length === 0) {
      setErrorMessage("Por favor asegúrate de que las diapositivas tengan una descripción visual antes de generar.");
      return;
    }

    setErrorMessage("");
    setIsGeneratingAllBases(true);
    setIsGeneratingBase(true);

    try {
      const token = user ? await user.getIdToken() : "";
      for (let i = 0; i < listToProcess.length; i++) {
        const slideItem = listToProcess[i];
        if (!slideItem.prompt.trim()) continue;

        setActiveSlideIndex(i);
        setStatusMessage(
          `✨ Nuestros agentes están generando el fondo de la diapositiva ${i + 1} de ${listToProcess.length}...`
        );

        const res = await fetch("/api/imagen-comercial/generate-base", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            prompt: slideItem.prompt,
            aspectRatio: slideItem.aspectRatio,
            rubro: activeProfile?.rubro || "Comercial",
            productName: activeProfile?.businessName || "",
          }),
        });

        const data = await res.json();
        if (res.ok && data.baseImageUrl) {
          setSlides((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, baseImageUrl: data.baseImageUrl, finalRenderUrl: undefined } : s
            )
          );
        }
      }
      setActiveSlideIndex(0);
      setStatusMessage(
        `✅ ¡Se generaron los fondos de las ${listToProcess.length} diapositivas con éxito! Ahora puedes ajustar tus textos o renderizar.`
      );
      setTimeout(() => setStatusMessage(""), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Error generando los fondos de las diapositivas.");
    } finally {
      setIsGeneratingAllBases(false);
      setIsGeneratingBase(false);
    }
  };

  // Subir imagen base manual si el usuario ya tiene su foto
  const handleUploadBaseImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vista previa inmediata con blob URL local
    const localUrl = URL.createObjectURL(file);
    updateActiveSlide((s) => ({
      ...s,
      baseImageUrl: localUrl,
      finalRenderUrl: undefined,
    }));
    setStatusMessage("Subiendo imagen base a tu nube...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "base_image");
      const token = user ? await user.getIdToken() : "";

      const uploadRes = await fetch("/api/imagen-comercial/upload-asset", {
        method: "POST",
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData?.url) {
          updateActiveSlide((s) => ({
            ...s,
            baseImageUrl: uploadData.url,
          }));
          setStatusMessage("✅ Imagen base guardada en la nube con éxito.");
          setTimeout(() => setStatusMessage(""), 3000);
          return;
        }
      }
    } catch (uploadErr) {
      console.warn("Upload asset failed, keeping local URL:", uploadErr);
    }
  };

  // Subir logo manual
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    updateActiveSlide((s) => ({
      ...s,
      logoUrl: localUrl,
      useLogo: true,
      logoTransparent: true,
      logoBlendMode: "screen",
      logoBgMode: "transparent",
    }));
    setStatusMessage("Subiendo logo a tu nube...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");
      const token = user ? await user.getIdToken() : "";

      const uploadRes = await fetch("/api/imagen-comercial/upload-asset", {
        method: "POST",
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData?.url) {
          updateActiveSlide((s) => ({
            ...s,
            logoUrl: uploadData.url,
          }));
          setStatusMessage("✅ Logo guardado en la nube con éxito.");
          setTimeout(() => setStatusMessage(""), 3000);
          return;
        }
      }
    } catch (uploadErr) {
      console.warn("Upload logo failed, keeping local URL:", uploadErr);
    }
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

  // Eliminar fondo de logo usando removeLogoBackground (BG Remover de alta precisión)
  const handleRemoveBgWithLogoRemover = async () => {
    if (!activeSlide.logoUrl) return;
    setIsRemovingBgWithRemover(true);
    setStatusMessage("Eliminando fondo con BG Remover...");
    try {
      const transparentDataUrl = await removeLogoBackground(activeSlide.logoUrl, {
        tolerance: 38,
        mode: "contiguous",
        feather: true,
      });
      updateActiveSlide((s) => ({
        ...s,
        logoUrl: transparentDataUrl,
        logoTransparent: true,
        logoBlendMode: "normal",
        logoBgMode: "transparent",
      }));
      setStatusMessage("✅ ¡Fondo eliminado con BG Remover con éxito!");
      setTimeout(() => setStatusMessage(""), 3500);
    } catch (err: any) {
      console.error("Error en BG Remover:", err);
      setErrorMessage("No se pudo procesar el fondo con BG Remover.");
    } finally {
      setIsRemovingBgWithRemover(false);
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

  // Renderizar versión final en alta resolución con el editor
  const handleRenderFinal = async () => {
    if (!activeSlide.baseImageUrl) {
      setErrorMessage("Primero debes generar o subir la imagen base.");
      return;
    }
    setErrorMessage("");
    setIsRenderingFinal(true);
    setStatusMessage("Procesando renderizado de alta fidelidad...");

    try {
      const token = user ? await user.getIdToken() : "";
      const carouselImages = slides.map((s, idx) => {
        if (idx === activeSlideIndex) return activeSlide.finalRenderUrl || activeSlide.baseImageUrl;
        return s.finalRenderUrl || s.baseImageUrl;
      }).filter(Boolean);

      // Preparar versión ligera y limpia de slides para Firestore/API (sin dataURLs pesadas)
      const sanitizedSlides = slides.map((s) => ({
        ...s,
        baseImageUrl: s.baseImageUrl?.startsWith("data:") ? "[imagen_local]" : s.baseImageUrl,
        logoUrl: s.logoUrl?.startsWith("data:") ? "[logo_local]" : s.logoUrl,
        finalRenderUrl: s.finalRenderUrl?.startsWith("data:") ? undefined : s.finalRenderUrl,
      }));

      // Capturar vista rápida de canvas del cliente como respaldo por si Butterfly Social se demora
      let clientDataUrl = "";
      if (canvasContainerRef.current) {
        try {
          const { toJpeg } = await import("html-to-image");
          clientDataUrl = await toJpeg(canvasContainerRef.current, {
            quality: 0.92,
            pixelRatio: 1.8,
            cacheBust: true,
          });
        } catch (e) {
          console.warn("Client fallback render ignored:", e);
        }
      }

      const res = await fetch("/api/imagen-comercial/render-final", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          baseImageUrl: activeSlide.baseImageUrl,
          clientDataUrl: clientDataUrl || undefined,
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
          prompt: activeSlide.prompt || (slides.length > 1 ? `Carrusel Comercial (${slides.length} diapositivas)` : "Cartel Comercial"),
          isCarousel: slides.length > 1,
          slideIndex: activeSlideIndex,
          carouselImages,
          coverImageUrl: slides[0]?.finalRenderUrl || slides[0]?.baseImageUrl || activeSlide.baseImageUrl,
          libraryDocId: currentLibraryDocId,
          commercialDesignData: {
            slides: sanitizedSlides,
            activeSlideIndex,
            customFonts,
          },
        }),
      });

      let data: any = {};
      const resText = await res.text();
      try {
        data = JSON.parse(resText);
      } catch (parseErr) {
        if (!res.ok) {
          throw new Error(`El servidor respondió con error ${res.status}: ${res.statusText || "El archivo o carrusel es muy pesado para el servidor"}`);
        }
      }

      if (!res.ok || !data.finalImageUrl) {
        throw new Error(data.error || "No se pudo renderizar la imagen final.");
      }

      if (data.libraryDocId) {
        setCurrentLibraryDocId(data.libraryDocId);
      }

      updateActiveSlide((s) => ({
        ...s,
        finalRenderUrl: data.finalImageUrl,
      }));
      setStatusMessage(
        slides.length > 1
          ? "✅ ¡Carrusel renderizado y guardado en tu Biblioteca como lote único!"
          : "✅ ¡Cartel renderizado y guardado en tu Biblioteca con éxito!"
      );
      setTimeout(() => setStatusMessage(""), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Error renderizando cartel.");
    } finally {
      setIsRenderingFinal(false);
    }
  };

  // Descargar imagen directamente como archivo sin abrir ninguna pestaña nueva
  const triggerDirectDownload = (dataUrlOrBlobUrl: string, filename?: string) => {
    const finalFilename =
      filename ||
      `cartel-comercial-hd-${activeSlide.aspectRatio.replace(":", "x")}-${Date.now()}.jpg`;

    const link = document.createElement("a");
    link.href = dataUrlOrBlobUrl;
    link.download = finalFilename;
    // IMPORTANTE: Sin target="_blank" para que el navegador descargue directamente el archivo
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCompleteImage = async () => {
    if (!activeSlide.baseImageUrl) return;

    setIsRenderingFinal(true);
    setStatusMessage("Procesando imagen completa en alta resolución con textos y logo...");

    // Deseleccionar temporalmente capa de texto o logo activo y guías para que no aparezcan en la descarga
    const previousSelectedLayerId = selectedLayerId;
    const previousDraggingLogo = isDraggingLogo;
    const previousShowSafeZoneGuide = showSafeZoneGuide;
    setSelectedLayerId(null);
    setIsDraggingLogo(false);
    setShowSafeZoneGuide(false);

    // Esperar un frame de React para que el DOM se dibuje sin bordes de selección ni guías
    await new Promise((r) => setTimeout(r, 80));

    const container = canvasContainerRef.current;
    if (!container) {
      setIsRenderingFinal(false);
      setSelectedLayerId(previousSelectedLayerId);
      setIsDraggingLogo(previousDraggingLogo);
      setShowSafeZoneGuide(previousShowSafeZoneGuide);
      return;
    }

    try {
      const { toJpeg } = await import("html-to-image");
      const dataUrl = await toJpeg(container, {
        quality: 0.98,
        pixelRatio: 2.5,
        cacheBust: true,
      });

      const filename = `cartel-comercial-hd-${activeSlide.aspectRatio.replace(":", "x")}-${Date.now()}.jpg`;
      triggerDirectDownload(dataUrl, filename);

      setStatusMessage("✅ ¡Cartel completo descargado exitosamente!");
      setTimeout(() => setStatusMessage(""), 4000);

      // En segundo plano: sincronizar render a Storage y Biblioteca
      try {
        const token = user ? await user.getIdToken() : "";
        fetch("/api/imagen-comercial/render-final", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            baseImageUrl: activeSlide.baseImageUrl,
            clientDataUrl: dataUrl,
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
              slides: slides.map((s) => ({
                ...s,
                baseImageUrl: s.baseImageUrl?.startsWith("data:") ? "[imagen_local]" : s.baseImageUrl,
                logoUrl: s.logoUrl?.startsWith("data:") ? "[logo_local]" : s.logoUrl,
                finalRenderUrl: s.finalRenderUrl?.startsWith("data:") ? undefined : s.finalRenderUrl,
              })),
              activeSlideIndex,
              customFonts,
            },
          }),
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data?.finalImageUrl) {
              updateActiveSlide((s) => ({ ...s, finalRenderUrl: data.finalImageUrl }));
            }
          }
        }).catch((e) => console.warn("Background upload ignored:", e));
      } catch (bgErr) {
        // Silencioso
      }
    } catch (err: any) {
      console.error("Error al exportar imagen completa:", err);
      setErrorMessage("No se pudo descargar la imagen completa.");
    } finally {
      setSelectedLayerId(previousSelectedLayerId);
      setIsDraggingLogo(previousDraggingLogo);
      setShowSafeZoneGuide(previousShowSafeZoneGuide);
      setIsRenderingFinal(false);
    }
  };

  // Generar copy con nuestros agentes basado en los textos de las imágenes
  const handleGenerateCopyFromSlides = async () => {
    setIsGeneratingCopy(true);
    setStatusMessage("Nuestros agentes están redactando el copy persuasivo...");
    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetch("/api/imagen-comercial/generate-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          slides,
          prompt: activeSlide.prompt,
          targetProfile: activeProfile,
          networks: selectedNetworks,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.copy) {
        throw new Error(data.error || "No se pudo generar el copy con nuestros agentes.");
      }

      setPostCaption(data.copy);
      setStatusMessage("✅ Copy generado con éxito por nuestros agentes.");
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error generando copy con nuestros agentes.");
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  // Selección de tipo de contenido en el Asistente Inicial
  const handleSelectWizardContentType = (type: "post" | "historia" | "carrusel") => {
    setWizardContentType(type);
    if (type === "historia") {
      setWizardAspectRatio("9:16");
      setPublishFormat("historia");
    } else {
      if (wizardAspectRatio === "9:16") {
        setWizardAspectRatio("4:5");
      }
      setPublishFormat("post");
    }
  };

  // Completar el Asistente Inicial y construir los slides + textos
  const handleCompleteWizard = async (autoGenerateBases = false) => {
    const totalSlides = wizardContentType === "carrusel" ? Math.min(Math.max(wizardSlideCount, 2), 5) : 1;
    const effectiveRatio: "4:5" | "1:1" | "9:16" =
      wizardContentType === "historia" ? "9:16" : wizardAspectRatio === "9:16" ? "4:5" : wizardAspectRatio;
    const defaultLogo = activeProfile?.logoUrl || "";

    setErrorMessage("");

    // MODO A: "Necesito que diseñen las imágenes (tengo una idea)"
    if (wizardDesignMode === "idea") {
      if (!wizardIdea.trim()) {
        setErrorMessage("Por favor cuéntanos brevemente de qué trata tu idea para que nuestros agentes diseñen las escenas.");
        return;
      }

      setIsPlanningSlides(true);
      setStatusMessage(
        totalSlides > 1
          ? `Nuestros agentes están diseñando la estructura, prompts visuales y capas de texto para tus ${totalSlides} diapositivas...`
          : "Nuestros agentes están diseñando el prompt visual y las capas de texto para tu pieza..."
      );

      try {
        const token = user ? await user.getIdToken() : "";
        const res = await fetch("/api/imagen-comercial/plan-slides", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            contentType: wizardContentType,
            slideCount: totalSlides,
            aspectRatio: effectiveRatio,
            idea: wizardIdea.trim(),
            includeText: wizardIncludeText,
            textMode: wizardTextMode,
            customTexts: wizardManualTexts.slice(0, totalSlides),
            businessName: activeProfile?.businessName || "",
            rubro: activeProfile?.rubro || "Comercial",
          }),
        });

        const data = await res.json();
        if (!res.ok || !Array.isArray(data.slides) || data.slides.length === 0) {
          throw new Error(data.error || "No se pudo planificar el diseño con nuestros agentes.");
        }

        const plannedSlides: SlideData[] = data.slides.slice(0, totalSlides).map((item: any, idx: number) => ({
          ...createInitialSlide(`slide-${idx + 1}-${Date.now()}`, effectiveRatio, defaultLogo),
          prompt: item.prompt || "",
          textLayers: wizardIncludeText && Array.isArray(item.textLayers) ? item.textLayers : [],
        }));

        setSlides(plannedSlides);
        setActiveSlideIndex(0);
        setSelectedLayerId(plannedSlides[0]?.textLayers[0]?.id || null);
        setPublishFormat(wizardContentType === "historia" ? "historia" : "post");
        setIsWizardCompleted(true);
        setStatusMessage(
          `✨ ¡Nuestros agentes prepararon ${
            totalSlides > 1 ? `los ${totalSlides} slides de tu carrusel` : "tu diseño"
          } con sus escenas visuales y capas de texto listas!`
        );
        setTimeout(() => setStatusMessage(""), 5000);

        if (autoGenerateBases) {
          await handleGenerateAllCarouselBases(plannedSlides);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || "Error al planificar las diapositivas con nuestros agentes.");
      } finally {
        setIsPlanningSlides(false);
      }
      return;
    }

    // MODO B: "Ya tengo la descripción clara de lo que necesito"
    const hasAtLeastOnePrompt = wizardManualPrompts.slice(0, totalSlides).some((p) => p.trim().length > 0);
    if (!hasAtLeastOnePrompt) {
      setErrorMessage("Por favor escribe o pega la descripción visual de al menos la primera diapositiva.");
      return;
    }

    const manualBuiltSlides: SlideData[] = Array.from({ length: totalSlides }).map((_, idx) => {
      const rawPrompt = (wizardManualPrompts[idx] || "").trim();
      const rawManualText = (wizardManualTexts[idx] || "").trim();

      let layers: TextLayer[] = [];
      if (wizardIncludeText) {
        if (rawManualText) {
          layers = buildLayersFromManualText(rawManualText, effectiveRatio);
        } else if (rawPrompt) {
          layers = extractTypographyLayersFromPrompt(rawPrompt, effectiveRatio);
        }
      }

      return {
        ...createInitialSlide(`slide-${idx + 1}-${Date.now()}`, effectiveRatio, defaultLogo),
        prompt: rawPrompt,
        textLayers: layers,
      };
    });

    setSlides(manualBuiltSlides);
    setActiveSlideIndex(0);
    setSelectedLayerId(manualBuiltSlides[0]?.textLayers[0]?.id || null);
    setPublishFormat(wizardContentType === "historia" ? "historia" : "post");
    setIsWizardCompleted(true);
    setStatusMessage("✅ Descripciones y capas de texto cargadas en nuestro editor.");
    setTimeout(() => setStatusMessage(""), 4000);

    if (autoGenerateBases) {
      await handleGenerateAllCarouselBases(manualBuiltSlides);
    }
  };

  // Reiniciar y volver al asistente inicial con campos en blanco
  const handleResetToWizard = () => {
    const defaultLogo = activeProfile?.logoUrl || "";
    setSlides([createInitialSlide("slide-1", "4:5", defaultLogo)]);
    setActiveSlideIndex(0);
    setSelectedLayerId(null);
    setCurrentLibraryDocId(null);
    setErrorMessage("");
    setStatusMessage("");
    setIsWizardCompleted(false);
  };

  // Gestión de slides para carrusel (1 a 5)
  const handleAddSlide = () => {
    if (slides.length >= 5) {
      alert("El límite para carruseles en la plataforma es de 5 diapositivas.");
      return;
    }
    const newSlideId = `slide-${slides.length + 1}-${Date.now()}`;
    // Crear diapositiva con escena visual y capas de texto completamente en blanco
    const newSlide: SlideData = {
      ...createInitialSlide(newSlideId, activeSlide.aspectRatio, activeSlide.logoUrl),
      useLogo: activeSlide.useLogo,
      logoTransparent: activeSlide.logoTransparent,
      logoBlendMode: activeSlide.logoBlendMode,
      logoBgMode: activeSlide.logoBgMode,
      logoX: activeSlide.logoX,
      logoY: activeSlide.logoY,
      logoWidth: activeSlide.logoWidth,
    };

    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
    setSelectedLayerId(null);
  };

  const handleRemoveSlide = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (slides.length <= 1) {
      alert("Un carrusel o afiche debe tener al menos 1 diapositiva.");
      return;
    }
    const confirmDelete = window.confirm(`¿Deseas eliminar la diapositiva ${idx + 1}?`);
    if (!confirmDelete) return;

    const newSlides = slides.filter((_, i) => i !== idx);
    setSlides(newSlides);

    // Ajustar slide activa
    if (activeSlideIndex >= newSlides.length) {
      setActiveSlideIndex(Math.max(0, newSlides.length - 1));
    } else if (activeSlideIndex === idx) {
      setActiveSlideIndex(Math.max(0, idx - 1));
    }
    setSelectedLayerId(null);
  };

  // Publicar o Agendar
  const handleExecutePublishOrSchedule = async () => {
    if (selectedNetworks.length === 0) {
      alert("Por favor selecciona al menos una red social para publicar.");
      return;
    }

    setIsPublishing(true);
    setPublishSuccess("");
    try {
      let targetUrl = activeSlide.finalRenderUrl;
      // Si la diapositiva no tiene render final HD, renderizarlo antes de publicar
      if (!targetUrl && activeSlide.baseImageUrl) {
        let clientDataUrl = "";
        if (canvasContainerRef.current) {
          try {
            const { toJpeg } = await import("html-to-image");
            clientDataUrl = await toJpeg(canvasContainerRef.current, { quality: 0.95, pixelRatio: 2.0 });
          } catch (e) {
            console.warn("No se pudo generar clientDataUrl previo:", e);
          }
        }

        const token = user ? await user.getIdToken() : "";
        const rRes = await fetch("/api/imagen-comercial/render-final", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            baseImageUrl: activeSlide.baseImageUrl,
            clientDataUrl,
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
              slides: slides.map((s) => ({
                ...s,
                baseImageUrl: s.baseImageUrl?.startsWith("data:") ? "[imagen_local]" : s.baseImageUrl,
                logoUrl: s.logoUrl?.startsWith("data:") ? "[logo_local]" : s.logoUrl,
                finalRenderUrl: s.finalRenderUrl?.startsWith("data:") ? undefined : s.finalRenderUrl,
              })),
              activeSlideIndex,
              customFonts,
            },
          }),
        });
        const rText = await rRes.text();
        let rData: any = {};
        try {
          rData = JSON.parse(rText);
        } catch (e) {
          console.warn("Could not parse render-final response as JSON:", e);
        }
        if (rRes.ok && rData.finalImageUrl) {
          targetUrl = rData.finalImageUrl;
          updateActiveSlide((s) => ({ ...s, finalRenderUrl: rData.finalImageUrl }));
        }
      }

      if (!targetUrl) {
        targetUrl = activeSlide.baseImageUrl;
      }
      if (!targetUrl) {
        throw new Error("No hay imagen disponible para publicar.");
      }

      const token = user ? await user.getIdToken() : "";
      const isSchedule = publishAction === "schedule";
      const resolvedType =
        slides.length > 1 ? "Carrusel" : publishFormat === "historia" ? "Historia" : "Post";

      const payload = {
        userId: user?.uid,
        profileId: activeProfile?.id || "default",
        type: resolvedType,
        imageUrl: targetUrl,
        carouselImages: slides.map((s) => s.finalRenderUrl || s.baseImageUrl).filter(Boolean),
        copy: postCaption || activeSlide.textLayers.map((l) => l.text).join("\n"),
        idea: activeSlide.prompt,
        aspectRatio: activeSlide.aspectRatio,
        networks: selectedNetworks,
        scheduledFor: isSchedule ? new Date(scheduleDateTime).toISOString() : new Date().toISOString(),
        status: isSchedule ? "scheduled" : "ready_to_publish",
        isCopyFinalized: true,
      };

      // 1. Crear documento en social_posts
      const newPostRef = await addDoc(collection(db, "social_posts"), {
        ...payload,
        createdAt: serverTimestamp(),
      });

      if (!isSchedule) {
        // 2. Publicar ahora vía /api/publish-now enviando postId
        const pubRes = await fetch("/api/publish-now", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ postId: newPostRef.id }),
        });
        const pubData = await pubRes.json();
        if (!pubRes.ok) throw new Error(pubData.error || "Error al publicar.");
        setPublishSuccess("🎉 ¡Publicado con éxito en tus redes sociales seleccionadas!");
      } else {
        // Agendar con Cloud Tasks
        try {
          await fetch("/api/tasks/schedule", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              postId: newPostRef.id,
              scheduledFor: new Date(scheduleDateTime).toISOString(),
            }),
          });
        } catch (schedErr) {
          console.warn("Schedule task notification:", schedErr);
        }
        setPublishSuccess("📅 ¡Programado con éxito en tu calendario de publicaciones!");
      }

      setTimeout(() => {
        setIsPublishModalOpen(false);
        setPublishSuccess("");
      }, 3000);
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
              Estudio de Diseño Comercial
            </span>
            {isWizardCompleted && (
              <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                {wizardContentType === "carrusel" || slides.length > 1
                  ? `Carrusel (${slides.length}/5 slides · ${activeSlide.aspectRatio})`
                  : wizardContentType === "historia"
                  ? `Historia (1 slide · 9:16)`
                  : `Post (1 slide · ${activeSlide.aspectRatio})`}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Imagen Comercial
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Genera imágenes base de alta resolución con nuestros agentes y estampa tipografías comerciales y logos con{" "}
            <strong>nuestro editor</strong>. Arrastra las capas libremente en el lienzo.
          </p>
        </div>

        {/* Acciones principales superiores */}
        <div className="flex items-center gap-2 flex-wrap">
          {isWizardCompleted && (
            <button
              type="button"
              onClick={handleResetToWizard}
              className="px-4 py-2.5 rounded-xl border border-orange-200 bg-orange-50/60 text-xs font-bold text-orange-700 hover:bg-orange-100 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>¿Qué quieres hacer? / Nueva idea</span>
            </button>
          )}
          <Link
            href="/automatizacion-rrss/panel/biblioteca"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <span>📚</span>
            <span>Biblioteca</span>
          </Link>
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

      {/* ASISTENTE PREVIO: "¿QUÉ QUIERES HACER?" */}
      {!isWizardCompleted ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in">
          {/* Paso 1: Tipo de pieza */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                1
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900">¿Qué quieres hacer hoy?</h2>
                <p className="text-xs text-slate-500">
                  Elige el tipo de publicación para configurar las diapositivas y el formato ideal.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[
                {
                  id: "post" as const,
                  icon: "📱",
                  title: "Post Individual",
                  desc: "1 sola imagen para el Feed (sin slides adicionales)",
                  badge: "1 Slide · 4:5 o 1:1",
                },
                {
                  id: "historia" as const,
                  icon: "⏱️",
                  title: "Historia (Story)",
                  desc: "1 sola imagen vertical pantalla completa",
                  badge: "1 Slide · Formato 9:16",
                },
                {
                  id: "carrusel" as const,
                  icon: "📚",
                  title: "Carrusel",
                  desc: "Secuencia deslizable de 2 hasta 5 imágenes",
                  badge: "2 a 5 Slides · 4:5 o 1:1",
                },
              ].map((option) => {
                const isSelected = wizardContentType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectWizardContentType(option.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20 shadow-xs"
                        : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{option.icon}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? "bg-orange-600 text-white border-orange-600"
                              : "bg-white text-slate-500 border-slate-200"
                          }`}
                        >
                          {option.badge}
                        </span>
                      </div>
                      <div className="font-black text-sm text-slate-900">{option.title}</div>
                      <p className="text-xs text-slate-500 leading-relaxed">{option.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sub-opciones de cantidad de slides (si es Carrusel) y Formato */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {wizardContentType === "carrusel" && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <label className="block text-xs font-extrabold text-slate-800">
                    ¿Cuántas imágenes tendrá tu carrusel? (Máximo 5)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setWizardSlideCount(num)}
                        className={`py-2 px-3 rounded-xl font-black text-xs border transition-all cursor-pointer ${
                          wizardSlideCount === num
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {num} Slides
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  Formato de proporción (Aspect Ratio)
                </label>
                {wizardContentType === "historia" ? (
                  <div className="py-2 px-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-black flex items-center justify-between">
                    <span>📱 Vertical Historia (9:16 — 1080×1920)</span>
                    <span className="text-[10px] uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-md">
                      Automático
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { ratio: "4:5" as const, label: "4:5 Vertical Feed (Recomendado)" },
                      { ratio: "1:1" as const, label: "1:1 Cuadrado Clásico" },
                    ].map((r) => (
                      <button
                        key={r.ratio}
                        type="button"
                        onClick={() => setWizardAspectRatio(r.ratio)}
                        className={`py-2 px-3 rounded-xl font-black text-xs border transition-all cursor-pointer ${
                          wizardAspectRatio === r.ratio
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Paso 2: ¿Necesita diseño desde una idea o ya tiene la descripción clara? */}
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                2
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900">¿Cómo quieres armar las imágenes?</h2>
                <p className="text-xs text-slate-500">
                  Puedes darnos tu idea para que nuestros agentes creen los prompts y textos, o pegar directamente la descripción si ya la tienes clara.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setWizardDesignMode("idea")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                  wizardDesignMode === "idea"
                    ? "border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20 shadow-xs"
                    : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-600">
                    Opción A · Asistido por Nuestros Agentes
                  </span>
                  {wizardDesignMode === "idea" && <Check className="w-4 h-4 text-orange-600 stroke-[3]" />}
                </div>
                <div className="font-black text-sm text-slate-900">
                  Necesito que me diseñen las imágenes (tengo una idea)
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Cuéntanos tu idea y nuestros agentes generarán los prompts visuales de cada imagen y ordenarán los textos en las capas de nuestro editor.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setWizardDesignMode("clear")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                  wizardDesignMode === "clear"
                    ? "border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20 shadow-xs"
                    : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                    Opción B · Descripción Directa
                  </span>
                  {wizardDesignMode === "clear" && <Check className="w-4 h-4 text-orange-600 stroke-[3]" />}
                </div>
                <div className="font-black text-sm text-slate-900">
                  Ya tengo la descripción clara de lo que necesito
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ingresa o pega directamente el prompt visual y los textos que quieres para tu post, historia o cada slide del carrusel.
                </p>
              </button>
            </div>
          </div>

          {/* Paso 3: Detalles de la Idea o Prompts + Textos */}
          <div className="space-y-5 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                3
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {wizardDesignMode === "idea"
                    ? "Describe tu idea y configura los textos"
                    : "Ingresa la descripción y textos de tus imágenes"}
                </h2>
                <p className="text-xs text-slate-500">
                  {wizardDesignMode === "idea"
                    ? "Con esta información generaremos los prompts de cada imagen y dejaremos los textos listos en las capas del editor."
                    : "Si pegas un prompt que ya trae textos entre comillas, los cargaremos automáticamente en las capas de texto."}
                </p>
              </div>
            </div>

            {wizardDesignMode === "idea" ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                    ¿De qué trata tu publicación o qué necesitas transmitir?
                  </label>
                  <textarea
                    rows={3}
                    value={wizardIdea}
                    onChange={(e) => setWizardIdea(e.target.value)}
                    placeholder={
                      wizardContentType === "carrusel"
                        ? "Ej: Quiero un carrusel mostrando los 3 errores que cometen las PyMEs al publicar en redes sociales y cómo resolverlos con automatización..."
                        : "Ej: Quiero promocionar nuestro servicio de diagnóstico gratuito para empresas con una estética moderna, tecnológica y profesional..."
                    }
                    className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-orange-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* ¿Llevarán texto? */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">
                        ¿Necesitas que las imágenes lleven texto sobre el lienzo?
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Los textos se ordenarán automáticamente en las capas editables de nuestro editor.
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setWizardIncludeText(true)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          wizardIncludeText
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        Sí, incluir textos
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardIncludeText(false)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          !wizardIncludeText
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        No, sin textos
                      </button>
                    </div>
                  </div>

                  {wizardIncludeText && (
                    <div className="space-y-3 pt-3 border-t border-slate-200/80">
                      <label className="block text-xs font-bold text-slate-700">
                        ¿Qué texto quieres poner en {wizardContentType === "carrusel" ? "las imágenes" : "la imagen"}?
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setWizardTextMode("agent")}
                          className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                            wizardTextMode === "agent"
                              ? "border-orange-500 bg-white font-black text-slate-900 shadow-2xs"
                              : "border-slate-200 bg-white/60 text-slate-600 hover:bg-white"
                          }`}
                        >
                          ✨ Que nuestros agentes propongan y ordenen los textos según mi idea
                        </button>
                        <button
                          type="button"
                          onClick={() => setWizardTextMode("manual")}
                          className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                            wizardTextMode === "manual"
                              ? "border-orange-500 bg-white font-black text-slate-900 shadow-2xs"
                              : "border-slate-200 bg-white/60 text-slate-600 hover:bg-white"
                          }`}
                        >
                          ✍️ Escribir yo mismo qué textos quiero poner
                        </button>
                      </div>

                      {wizardTextMode === "manual" && (
                        <div className="space-y-3 pt-2">
                          {Array.from({
                            length: wizardContentType === "carrusel" ? wizardSlideCount : 1,
                          }).map((_, idx) => (
                            <div key={idx} className="space-y-1">
                              <label className="block text-[11px] font-bold text-slate-700">
                                {wizardContentType === "carrusel"
                                  ? `Textos para Slide ${idx + 1} (usa saltos de línea para separar titular, bajada y botón)`
                                  : "Textos que quieres incluir en la imagen (usa saltos de línea para separar titular y bajada)"}
                              </label>
                              <textarea
                                rows={2}
                                value={wizardManualTexts[idx] || ""}
                                onChange={(e) => {
                                  const next = [...wizardManualTexts];
                                  next[idx] = e.target.value;
                                  setWizardManualTexts(next);
                                }}
                                placeholder="Ej:&#10;DIAGNÓSTICO GRATUITO&#10;Automatiza tus redes en 5 minutos&#10;Agenda hoy en nuestro link"
                                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:border-orange-500 focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* MODO DESCRIPCIÓN CLARA */
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      ¿Tus imágenes llevarán capas de texto editables?
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Si pegas un prompt con textos entre comillas o los escribes abajo, los ordenaremos en las capas del editor.
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setWizardIncludeText(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        wizardIncludeText
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      Sí, con texto
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardIncludeText(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        !wizardIncludeText
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      No, sin texto
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {Array.from({
                    length: wizardContentType === "carrusel" ? wizardSlideCount : 1,
                  }).map((_, idx) => {
                    const currentPromptVal = wizardManualPrompts[idx] || "";
                    const currentRatio = wizardContentType === "historia" ? "9:16" : wizardAspectRatio;
                    const autoDetected = extractTypographyLayersFromPrompt(currentPromptVal, currentRatio);
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                            {wizardContentType === "carrusel"
                              ? `Diapositiva ${idx + 1} de ${wizardSlideCount}`
                              : "Configuración de tu Imagen"}
                          </span>
                          {wizardIncludeText && autoDetected.length > 0 && (
                            <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                              ✨ {autoDetected.length} textos detectados automáticamente en el prompt
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Descripción visual (Prompt para generar el fondo)
                          </label>
                          <textarea
                            rows={3}
                            value={currentPromptVal}
                            onChange={(e) => {
                              const next = [...wizardManualPrompts];
                              next[idx] = e.target.value;
                              setWizardManualPrompts(next);
                            }}
                            placeholder="Pega o escribe aquí la descripción visual de la escena..."
                            className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:border-orange-500 focus:outline-none leading-relaxed"
                          />
                        </div>

                        {wizardIncludeText && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Textos para las capas del editor{" "}
                              <span className="font-normal text-slate-400">
                                (Opcional si ya vienen entre comillas dentro del prompt superior)
                              </span>
                            </label>
                            <textarea
                              rows={2}
                              value={wizardManualTexts[idx] || ""}
                              onChange={(e) => {
                                const next = [...wizardManualTexts];
                                next[idx] = e.target.value;
                                setWizardManualTexts(next);
                              }}
                              placeholder="Escribe aquí el titular, subtítulo o llamado a la acción (una línea por capa)..."
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:border-orange-500 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botones de Confirmación del Asistente */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const totalSlides =
                    wizardContentType === "carrusel" ? Math.min(Math.max(wizardSlideCount, 2), 5) : 1;
                  const effectiveRatio: "4:5" | "1:1" | "9:16" =
                    wizardContentType === "historia"
                      ? "9:16"
                      : wizardAspectRatio === "9:16"
                      ? "4:5"
                      : wizardAspectRatio;
                  const defaultLogo = activeProfile?.logoUrl || "";
                  const blankSlides = Array.from({ length: totalSlides }).map((_, idx) =>
                    createInitialSlide(`slide-${idx + 1}-${Date.now()}`, effectiveRatio, defaultLogo)
                  );
                  setSlides(blankSlides);
                  setActiveSlideIndex(0);
                  setSelectedLayerId(null);
                  setPublishFormat(wizardContentType === "historia" ? "historia" : "post");
                  setIsWizardCompleted(true);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 py-2 px-3 rounded-xl transition-colors text-left cursor-pointer"
              >
                Abrir el editor directamente en blanco →
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  disabled={isPlanningSlides || isGeneratingAllBases}
                  onClick={() => handleCompleteWizard(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isPlanningSlides ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                      <span>Preparando con Nuestros Agentes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-orange-400" />
                      <span>
                        {wizardDesignMode === "idea"
                          ? "Generar Prompts y Ordenar Textos →"
                          : "Cargar en Nuestro Editor →"}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isPlanningSlides || isGeneratingAllBases}
                  onClick={() => handleCompleteWizard(true)}
                  className="px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isPlanningSlides || isGeneratingAllBases ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Diseñando...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>
                        {wizardDesignMode === "idea"
                          ? "Generar Prompts, Textos y Crear Imágenes"
                          : "Cargar y Generar Fondos Ahora"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Selector de Slides (En Post e Historia solo muestra Slide 1 sin opción de agregar más; en Carrusel hasta 5) */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1">
                {wizardContentType === "carrusel" || slides.length > 1
                  ? "Diapositivas del Carrusel:"
                  : wizardContentType === "historia"
                  ? "Historia (1 Slide):"
                  : "Post Individual (1 Slide):"}
              </span>
              {slides.map((s, idx) => (
                <div key={s.id} className="relative flex items-center group">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSlideIndex(idx);
                      setSelectedLayerId(s.textLayers[0]?.id || null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      activeSlideIndex === idx
                        ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    } ${slides.length > 1 ? "pr-7" : ""}`}
                  >
                    <span>Slide {idx + 1}</span>
                    {s.baseImageUrl ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    )}
                  </button>

                  {slides.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSlide(idx, e)}
                      className={`absolute right-1.5 p-1 rounded-md transition-colors ${
                        activeSlideIndex === idx
                          ? "text-slate-400 hover:text-rose-300 hover:bg-slate-800"
                          : "text-slate-400 hover:text-rose-600 hover:bg-slate-200"
                      }`}
                      title={`Eliminar Diapositiva ${idx + 1}`}
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {slides.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleGenerateAllCarouselBases()}
                  disabled={isGeneratingBase || isGeneratingAllBases}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingAllBases ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Generar los {slides.length} Fondos del Carrusel</span>
                </button>
              )}

              {wizardContentType === "carrusel" && slides.length < 5 && (
                <button
                  onClick={handleAddSlide}
                  className="px-3.5 py-1.5 rounded-xl border border-dashed border-orange-300 bg-orange-50/50 hover:bg-orange-50 text-orange-700 font-bold text-xs flex items-center gap-1 transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Slide ({slides.length}/5)</span>
                </button>
              )}
            </div>
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
                    {(wizardContentType === "historia"
                      ? (["9:16"] as const)
                      : (["4:5", "1:1"] as const)
                    ).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() =>
                          setSlides((prev) => prev.map((s) => ({ ...s, aspectRatio: ratio })))
                        }
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
                    onChange={(e) => handlePromptChange(e.target.value)}
                    rows={3}
                    placeholder="Describe la composición visual, elementos 3D o escenario para el fondo limpio..."
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-orange-500 focus:outline-none transition-all leading-relaxed"
                  />
                </div>

                {/* Banner interactivo si se detectan capas de texto en el prompt */}
                {detectedTypographyLayers && detectedTypographyLayers.length > 0 && (
                  <div className="p-3 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-300 rounded-2xl flex items-center justify-between gap-2.5 animate-in fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">✨</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">
                          {detectedTypographyLayers.length} textos detectados en el prompt
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium truncate">
                          {detectedTypographyLayers.map((l) => l.text).filter(Boolean).slice(0, 2).join(" · ")}...
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyDetectedTypography(detectedTypographyLayers)}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-[11px] shadow-sm transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Cargar en Capas</span>
                      <span>→</span>
                    </button>
                  </div>
                )}

                {/* Presets Rápidos */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plantillas de prompt:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PROMPT_PRESETS.map((p) => (
                      <button
                        key={p.title}
                        onClick={() => handlePromptChange(p.prompt)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 transition-colors"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGenerateBaseImage}
                      disabled={isGeneratingBase}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isGeneratingBase ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-orange-400" />}
                      <span>
                        {slides.length > 1
                          ? `Generar Fondo Slide ${activeSlideIndex + 1}`
                          : "Generar Fondo con Agentes"}
                      </span>
                    </button>

                    <label className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Subir Foto</span>
                      <input type="file" accept="image/*" onChange={handleUploadBaseImage} className="hidden" />
                    </label>
                  </div>

                  {slides.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleGenerateAllCarouselBases()}
                      disabled={isGeneratingBase || isGeneratingAllBases}
                      className="w-full py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-black text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isGeneratingAllBases ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 text-orange-600" />
                      )}
                      <span>Generar los {slides.length} Fondos del Carrusel Automáticamente</span>
                    </button>
                  )}
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
              <div className="flex items-center gap-1.5">
                {detectedTypographyLayers && detectedTypographyLayers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleApplyDetectedTypography(detectedTypographyLayers)}
                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-500/15 to-amber-500/15 hover:from-orange-500/25 hover:to-amber-500/25 text-orange-700 border border-orange-300 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                    title="Extrae y carga los textos entre comillas especificados en el prompt"
                  >
                    <Sparkles className="w-3 h-3 text-orange-600" />
                    <span>Auto-extraer ({detectedTypographyLayers.length})</span>
                  </button>
                )}
                <button
                  onClick={handleAddTextLayer}
                  className="px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-[11px] flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span>Añadir Capa</span>
                </button>
              </div>
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={handleRemoveBgWithLogoRemover}
                            disabled={isRemovingBgWithRemover}
                            className="py-2 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] transition-all flex items-center gap-1 shadow-2xs disabled:opacity-50"
                            title="Elimina el fondo del logo usando nuestro algoritmo de BG Remover"
                          >
                            {isRemovingBgWithRemover ? (
                              <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                            ) : (
                              <Wand2 className="w-3 h-3 text-indigo-600" />
                            )}
                            <span>🪄 Quitar fondo (BG Remover)</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveBlackFromLogo}
                            className="py-2 px-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-[11px] transition-all flex items-center gap-1 shadow-2xs"
                            title="Recorta matemáticamente los píxeles negros en un archivo PNG transparente real"
                          >
                            <Sparkles className="w-3 h-3 text-orange-600" />
                            <span>Recortar negro</span>
                          </button>
                        </div>
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
            <div className="w-full flex items-center justify-between pb-4 border-b border-white/10 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Lienzo Drag & Drop ({activeSlide.aspectRatio})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeSlide.aspectRatio === "4:5" && (
                  <button
                    type="button"
                    onClick={() => setShowSafeZoneGuide((prev) => !prev)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                      showSafeZoneGuide
                        ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                        : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                    }`}
                    title="Muestra el área 1:1 visible en la cuadrícula del perfil de Instagram para evitar textos cortados"
                  >
                    <span>{showSafeZoneGuide ? "👁️ Guía Perfil (1:1) Activa" : "👁️ Ver Guía Perfil (1:1)"}</span>
                  </button>
                )}
                <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">
                  Arrastra los textos o el logo libremente
                </span>
              </div>
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

              {/* GUÍA DE ZONA SEGURA 1:1 PARA PERFIL DE INSTAGRAM (cuando aspectRatio === "4:5") */}
              {activeSlide.aspectRatio === "4:5" && showSafeZoneGuide && (
                <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between">
                  {/* Franja superior recortada (10% de alto = 135px en 4:5) */}
                  <div className="w-full h-[10%] bg-black/60 backdrop-blur-[1px] border-b border-dashed border-orange-400/80 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-orange-200 bg-black/70 px-2 py-0.5 rounded-full border border-orange-400/30">
                      ✂️ Se corta en cuadrícula de perfil (10% superior)
                    </span>
                  </div>

                  {/* Ventana Central 1:1 - Zona Segura */}
                  <div className="w-full h-[80%] border-2 border-dashed border-orange-400/60 relative flex flex-col justify-between p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black uppercase tracking-wider text-orange-300 bg-black/80 px-1.5 py-0.5 rounded border border-orange-400/20">
                        Zona Segura 1:1 (Visible en Perfil)
                      </span>
                      <span className="text-[8px] font-bold text-slate-300 bg-black/80 px-1.5 py-0.5 rounded border border-white/10">
                        Margen Lateral Seguro
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <span className="text-[8px] font-bold text-orange-200/90 bg-black/80 px-2 py-0.5 rounded border border-orange-400/20">
                        Ubica textos y botones dentro de este recuadro para que nunca se corten
                      </span>
                    </div>
                  </div>

                  {/* Franja inferior recortada (10% de alto = 135px en 4:5) */}
                  <div className="w-full h-[10%] bg-black/60 backdrop-blur-[1px] border-t border-dashed border-orange-400/80 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-orange-200 bg-black/70 px-2 py-0.5 rounded-full border border-orange-400/30">
                      ✂️ Se corta en cuadrícula de perfil (10% inferior)
                    </span>
                  </div>
                </div>
              )}

              {/* CAPAS DE TEXTO ARRASTRABLES */}
              {activeSlide.textLayers.map((layer) => {
                const isSelected = layer.id === selectedLayerId;
                const isPill = Boolean(layer.isPill);
                const isLongPill = isPill && (layer.text?.length || 0) > 26;
                const is45 = activeSlide.aspectRatio === "4:5";
                const defaultSafeWidth = is45 ? 80 : 88;
                const layerWidth = layer.boxWidth !== undefined && layer.boxWidth !== null
                  ? (layer.boxWidth === 0 ? (isLongPill ? `${defaultSafeWidth}%` : "max-content") : `${layer.boxWidth}%`)
                  : isPill
                  ? (isLongPill ? `${defaultSafeWidth}%` : "max-content")
                  : layer.maxWidth
                  ? `${Math.round((layer.maxWidth / 1080) * 100)}%`
                  : `${defaultSafeWidth}%`;

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
                      maxWidth: is45 ? "82%" : "92%",
                      boxSizing: "border-box",
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
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleRenderFinal}
                  disabled={isRenderingFinal || !activeSlide.baseImageUrl}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                  title="Renderiza el cartel en alta definición y lo guarda en tu Biblioteca para re-editarlo cuando quieras"
                >
                  {isRenderingFinal ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
                  <span>{isRenderingFinal ? "Guardando..." : "Renderizar y Guardar"}</span>
                </button>

                <button
                  onClick={handleDownloadCompleteImage}
                  disabled={!activeSlide.baseImageUrl || isRenderingFinal}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
                  title="Descarga el cartel directamente a tu computador"
                >
                  {isRenderingFinal ? <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" /> : <Download className="w-3.5 h-3.5 text-orange-400" />}
                  <span>{isRenderingFinal ? "Procesando..." : "Descargar Imagen"}</span>
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
      </>
      )}

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
                {/* Selección de Formato: Historia vs Post (para 1 slide) o Carrusel automático (para >1 slides) */}
                {slides.length === 1 ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      ¿Qué formato deseas publicar?
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPublishFormat("post")}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          publishFormat === "post"
                            ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0">📱</span>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 truncate">Post en el Feed</div>
                            <div className="text-[10px] text-slate-400 font-medium truncate">Publicación estándar</div>
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ml-1.5 ${
                            publishFormat === "post" ? "bg-indigo-600 text-white" : "border border-slate-300"
                          }`}
                        >
                          {publishFormat === "post" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPublishFormat("historia")}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          publishFormat === "historia"
                            ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0">⏱️</span>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 truncate">Historia (Story)</div>
                            <div className="text-[10px] text-slate-400 font-medium truncate">Duración 24 horas</div>
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ml-1.5 ${
                            publishFormat === "historia" ? "bg-indigo-600 text-white" : "border border-slate-300"
                          }`}
                        >
                          {publishFormat === "historia" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">📚</span>
                      <div>
                        <div className="text-xs font-black text-indigo-950">Formato automático: Carrusel</div>
                        <div className="text-[10px] text-indigo-600 font-medium">
                          Se publicarán las {slides.length} diapositivas diseñadas en secuencia
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0 shadow-xs">
                      {slides.length} Slides
                    </span>
                  </div>
                )}

                {/* Selector de Redes Sociales Conectadas */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Publicar en redes sociales
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Selecciona las plataformas activas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: "instagram",
                        name: "Instagram",
                        icon: (
                          <svg width="18" height="18" viewBox="0 0 24 24" aria-label="Instagram">
                            <defs>
                              <linearGradient id="modal-pub-ig-grad" x1="0" x2="1" y1="1" y2="0">
                                <stop offset="0%" stopColor="#f09433" />
                                <stop offset="25%" stopColor="#e6683c" />
                                <stop offset="50%" stopColor="#dc2743" />
                                <stop offset="75%" stopColor="#cc2366" />
                                <stop offset="100%" stopColor="#bc1888" />
                              </linearGradient>
                            </defs>
                            <path
                              fill="url(#modal-pub-ig-grad)"
                              d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "facebook",
                        name: "Facebook",
                        icon: (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-label="Facebook">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        ),
                      },
                      {
                        id: "linkedin",
                        name: "LinkedIn",
                        icon: (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2" aria-label="LinkedIn">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        ),
                      },
                      {
                        id: "tiktok",
                        name: "TikTok",
                        icon: (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000" aria-label="TikTok">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.41-.43-.61-.65v5.13c.04 2.11-.6 4.31-2.12 5.85-1.59 1.62-3.95 2.45-6.19 2.14-2.61-.31-4.99-2.22-5.74-4.79-.88-2.85-.02-6.22 2.19-8.15 1.72-1.53 4.12-2.11 6.36-1.57v4.18c-1.34-.37-2.89-.08-3.94.83-1.04.9-1.54 2.37-1.28 3.73.28 1.43 1.57 2.53 3.01 2.62 1.45.09 2.92-.85 3.39-2.22.25-.66.29-1.39.27-2.09V0z" />
                          </svg>
                        ),
                      },
                      {
                        id: "x",
                        name: "X (Twitter)",
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#0F1419" aria-label="X">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        ),
                      },
                      {
                        id: "youtube",
                        name: "YouTube",
                        icon: (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF0000" aria-label="YouTube">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        ),
                      },
                    ].map((net) => {
                      const isConnected = (connectedNetworks as any)[net.id];
                      const isSelected = selectedNetworks.includes(net.id);

                      return (
                        <button
                          key={net.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedNetworks(selectedNetworks.filter((n) => n !== net.id));
                            } else {
                              setSelectedNetworks([...selectedNetworks, net.id]);
                            }
                          }}
                          className={`p-2.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between gap-2 shadow-xs ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                              {net.icon}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-[11px] text-slate-800 truncate block">
                                {net.name}
                              </span>
                              <span
                                className={`text-[9px] font-medium block ${
                                  isConnected ? "text-emerald-600 font-semibold" : "text-slate-400"
                                }`}
                              >
                                {isConnected ? "● Conectada" : "○ Sin vincular"}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "border border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Campo de Copy con botón de generación con agentes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Texto del Copy para la publicación
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateCopyFromSlides}
                      disabled={isGeneratingCopy}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 disabled:opacity-50"
                    >
                      {isGeneratingCopy ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Redactando con agentes...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>Generar copy con nuestros agentes</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    placeholder="Escribe el texto persuasivo que acompañará la imagen o presiona 'Generar copy con nuestros agentes'..."
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
                      ? `📚 Carrusel con ${slides.length} diapositivas en formato ${activeSlide.aspectRatio}`
                      : publishFormat === "historia"
                      ? `⏱️ Historia (Story) en formato ${activeSlide.aspectRatio}`
                      : `📱 Post individual en el Feed en formato ${activeSlide.aspectRatio}`}
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
