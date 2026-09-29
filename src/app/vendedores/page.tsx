"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth, db, storage } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { HARDCODED_STYLES, promptCategories, PromptTemplate } from "../../lib/prompt-templates";
import { createButterflyRender, compositeImageClient, BadgeStyle } from "../../lib/image-compositor";
import { removeLogoBackground } from "../../lib/logo-bg-remover";
import LogoMark from "../../components/LogoMark";
import {
  FaWhatsapp,
  FaImage,
  FaUpload,
  FaCheck,
  FaMagic,
  FaCopy,
  FaEye,
  FaTrash,
  FaSearch,
  FaExternalLinkAlt,
  FaSignOutAlt,
  FaMobileAlt,
  FaKey,
  FaPlus,
  FaEdit,
  FaSyncAlt,
  FaPaperPlane
} from "react-icons/fa";

interface ProspectDemo {
  id?: string;
  prospectName: string;
  prospectBusiness: string;
  prospectPhone: string;
  rubro: string;
  offerText: string;
  badgeCustomText?: string;
  badgeStyle?: BadgeStyle;
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
  publicDemoUrl?: string;
  whatsappMessage?: string;
  createdAt?: any;
  status?: "borrador" | "generada" | "enviada";
  createdBy?: string;
  sellerEmail?: string;
  sellerName?: string;
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

const ADMIN_EMAILS = [
  "admin@santisoft.cl",
  "diemoroy@gmail.com",
  "spalezcom@gmail.com",
  "santisoftai@gmail.com",
];

const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";

export default function VendedoresPwaPage() {
  const router = useRouter();

  // Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loadingAuth, setLoadingAuth] = useState(true);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"crear" | "historial">("crear");

  // Step 1: Prospect Data
  const [prospectName, setProspectName] = useState("");
  const [prospectBusiness, setProspectBusiness] = useState("");
  const [countryCode, setCountryCode] = useState("+56");
  const [prospectPhone, setProspectPhone] = useState("");
  const [rubro, setRubro] = useState(COMMON_NICHES[0].label);
  const [offerText, setOfferText] = useState("");
  const [dishOrProductName, setDishOrProductName] = useState("");

  // Step 2: Assets & Logo
  const [badgeCustomText, setBadgeCustomText] = useState("");
  const [badgeStyle, setBadgeStyle] = useState<BadgeStyle>("sticker-circle");
  const [baseImageFile, setBaseImageFile] = useState<File | null>(null);
  const [baseImagePreview, setBaseImagePreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [removeLogoBg, setRemoveLogoBg] = useState(false);
  const [cleanedLogoUrl, setCleanedLogoUrl] = useState("");
  const [isRemovingLogoBg, setIsRemovingLogoBg] = useState(false);
  const [logoPosition, setLogoPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("top-right");

  // Step 3: Styles
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [allTemplates, setAllTemplates] = useState<PromptTemplate[]>(HARDCODED_STYLES);

  // Step 4: Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [canvasImageUrl, setCanvasImageUrl] = useState("");
  const [butterflyUrl, setButterflyUrl] = useState("");
  const [createdDemoId, setCreatedDemoId] = useState("");
  const [generatedPostCaption, setGeneratedPostCaption] = useState("");
  const [customWhatsappCopy, setCustomWhatsappCopy] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyPostSuccess, setCopyPostSuccess] = useState(false);

  // History State
  const [historyDemos, setHistoryDemos] = useState<ProspectDemo[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  // Estado Modal Cambiar Contraseña del Vendedor
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [newPassInput, setNewPassInput] = useState("");
  const [confirmPassInput, setConfirmPassInput] = useState("");
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassError, setChangePassError] = useState("");
  const [changePassSuccess, setChangePassSuccess] = useState("");

  // Input refs
  const baseImageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 1. PWA BeforeInstallPrompt listener
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      // Check if iOS
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosInstallModal(true);
      } else {
        alert("Para instalar la app, abre el menú de tu navegador (los tres puntos arriba a la derecha) y selecciona 'Instalar aplicación' o 'Agregar a la pantalla principal'.");
      }
    }
  };

  // 2. Auth Guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/vendedores/login");
        return;
      }
      setCurrentUser(user);

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.data()?.role || "user";
        setUserRole(role);

        const email = (user.email || "").toLowerCase();
        const isAllowed =
          email === "santisoftai@gmail.com" ||
          ADMIN_EMAILS.includes(email) ||
          role === "admin" ||
          role === "vendedor";

        if (!isAllowed) {
          await signOut(auth);
          router.replace("/vendedores/login");
          return;
        }

        // Si debe cambiar su contraseña inicial, abrir modal (solo para cuentas con contraseña tradicional)
        const isGoogleAccount =
          email.endsWith("@gmail.com") ||
          user.providerData.some((p) => p.providerId === "google.com");

        if (!isGoogleAccount && userDoc.data()?.mustChangePassword) {
          setShowChangePassModal(true);
        }

        // Cargar estilos desde Firestore
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
                previewUrl: data.previewImageUrl || data.previewUrl || "",
              } as PromptTemplate);
            }
          });
          HARDCODED_STYLES.forEach((style) => {
            if (!dbIds.has(style.id)) loaded.push(style);
          });
          setAllTemplates(loaded);
        } catch (err) {
          console.warn("No se pudo cargar prompt_library, usando estilos locales:", err);
        }
      } catch (err) {
        console.error("Error al validar rol de vendedor:", err);
        router.replace("/vendedores/login");
      } finally {
        setLoadingAuth(false);
      }
    });

    return () => unsub();
  }, [router]);

  // 3. Load History
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/muestras", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.demos)) {
          setHistoryDemos(data.demos);
        }
      }
    } catch (err) {
      console.warn("Error cargando historial de muestras:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "historial" && currentUser) {
      loadHistory();
    }
  }, [activeTab, currentUser]);

  // 4. Actualizar mensaje de WhatsApp automáticamente
  useEffect(() => {
    const namePart = prospectName.trim() ? `¡Hola ${prospectName.trim()}!` : "¡Hola!";
    const businessPart = prospectBusiness.trim() ? ` para ${prospectBusiness.trim()}` : "";
    const offerOrDish = dishOrProductName.trim()
      ? ` su especialidad "${dishOrProductName.trim()}"${offerText.trim() ? ` y la promo "${offerText.trim()}"` : ""}`
      : (offerText.trim() ? ` destacando "${offerText.trim()}"` : "");
    const offerPart = offerOrDish ? ` destacando${offerOrDish}` : "";

    const realImageUrl = generatedImageUrl?.startsWith("http") ? generatedImageUrl : null;
    const demoLink = createdDemoId
      ? `${PUBLIC_APP_URL}/m/${createdDemoId}`
      : (realImageUrl || "[ENLACE_DE_MUESTRA]");

    const defaultMsg = `${namePart} 👋 Estuve revisando lo que hacen en tu marca y le pedí a nuestro equipo de agentes que diseñara esta propuesta visual exclusiva${businessPart}${offerPart}:

🚀 Puedes ver la muestra interactiva y el copy listo para publicar aquí:
${demoLink}

Diseñamos este contenido con su identidad para que veas la calidad y el impacto que tendrían sus redes semana a semana sin quitarte tiempo.

¿Qué te parece el estilo?`;

    setCustomWhatsappCopy(defaultMsg);
  }, [prospectName, prospectBusiness, offerText, dishOrProductName, generatedImageUrl, createdDemoId]);

  // 5. Filtro de estilos
  const filteredTemplates = allTemplates.filter((template) => {
    const matchCategory = selectedCategory === "Todas" || template.category === selectedCategory;
    const matchSearch =
      searchTerm.trim() === "" ||
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  // 6. Carga de imagen base
  const handleBaseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBaseImageFile(file);
      setBaseImagePreview(URL.createObjectURL(file));
    }
  };

  // 7. Carga de logo y eliminación de fondo
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const originalPreview = URL.createObjectURL(file);
      setLogoPreview(originalPreview);

      if (removeLogoBg) {
        setIsRemovingLogoBg(true);
        try {
          const transparentDataUrl = await removeLogoBackground(file);
          setCleanedLogoUrl(transparentDataUrl);
        } catch (bgErr) {
          console.warn("Error eliminando fondo del logo:", bgErr);
        } finally {
          setIsRemovingLogoBg(false);
        }
      } else {
        setCleanedLogoUrl("");
      }
    }
  };

  const handleToggleRemoveLogoBg = async (checked: boolean) => {
    setRemoveLogoBg(checked);
    if (checked) {
      if (logoFile || logoPreview) {
        setIsRemovingLogoBg(true);
        try {
          const transparentDataUrl = await removeLogoBackground(logoFile || logoPreview);
          setCleanedLogoUrl(transparentDataUrl);
        } catch (bgErr) {
          console.warn("Error eliminando fondo del logo:", bgErr);
        } finally {
          setIsRemovingLogoBg(false);
        }
      }
    } else {
      setCleanedLogoUrl("");
    }
  };

  // 8. GENERAR MUESTRA CON AGENTES
  const handleGenerateSample = async () => {
    if (!prospectBusiness.trim()) {
      alert("Por favor indica al menos el nombre del negocio o marca del prospecto.");
      return;
    }

    setIsGenerating(true);
    setGeneratingStep("Preparando assets y datos...");

    try {
      let uploadedBaseImageUrl = baseImagePreview;
      let uploadedLogoUrl = logoPreview;

      // 1. Subir imagen base si existe
      if (baseImageFile && currentUser?.uid) {
        setGeneratingStep("Subiendo foto de producto...");
        const baseRef = ref(storage, `admin_demos/base_${Date.now()}_${baseImageFile.name}`);
        const snap = await uploadBytes(baseRef, baseImageFile);
        uploadedBaseImageUrl = await getDownloadURL(snap.ref);
      }

      // 2. Subir logo si existe
      if ((logoFile || cleanedLogoUrl) && currentUser?.uid) {
        setGeneratingStep("Subiendo logo del cliente...");
        let fileToUpload: File | Blob | null = logoFile;
        let ext = logoFile?.name ? logoFile.name.replace(/\.[^/.]+$/, "") : "logo";
        if (removeLogoBg && cleanedLogoUrl) {
          try {
            const blobRes = await fetch(cleanedLogoUrl);
            fileToUpload = await blobRes.blob();
            ext += "_clean.png";
          } catch (_) {}
        }

        if (fileToUpload) {
          const logoRef = ref(storage, `admin_demos/logo_${Date.now()}_${ext}`);
          const snap = await uploadBytes(logoRef, fileToUpload);
          uploadedLogoUrl = await getDownloadURL(snap.ref);
        }
      }

      // 3. Obtener o generar imagen base
      let rawBaseUrl = uploadedBaseImageUrl;
      if (!rawBaseUrl) {
        setGeneratingStep(`Fotografiando "${dishOrProductName.trim() || rubro}" con nuestros agentes...`);
        try {
          const token = await auth.currentUser?.getIdToken();
          const genRes = await fetch("/api/admin/muestras/generate-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              dishOrProductName: dishOrProductName.trim(),
              rubro: rubro || "Gastronomía",
              businessName: prospectBusiness.trim(),
              offerText: offerText.trim(),
              styleId: selectedTemplate?.id || null,
              styleTitle: selectedTemplate?.title || null,
              styleKeywords: selectedTemplate?.styleKeywords || null,
              stylePrompt: selectedTemplate?.prompt || null,
            }),
          });

          if (genRes.ok) {
            const genData = await genRes.json();
            if (genData.imageUrl?.startsWith("http")) {
              rawBaseUrl = genData.imageUrl;
            }
          }
        } catch (genErr) {
          console.warn("Error generando imagen base:", genErr);
        }

        // Fallback
        if (!rawBaseUrl) {
          const fallbackSeed = Math.floor(Math.random() * 100000);
          const dishPart = dishOrProductName.trim() ? `${dishOrProductName.trim()}, ` : "";
          const promptQuery = encodeURIComponent(`${dishPart}${rubro} commercial food advertising photography high quality professional lighting`);
          rawBaseUrl = `https://image.pollinations.ai/prompt/${promptQuery}?width=1080&height=1080&model=flux&nologo=true&seed=${fallbackSeed}`;
        }
      } else if (selectedTemplate?.prompt && rawBaseUrl?.startsWith("http")) {
        setGeneratingStep(`Aplicando estilo "${selectedTemplate.title}" con nuestros agentes...`);
        try {
          let promptEN = selectedTemplate.prompt;
          if (dishOrProductName.trim()) {
            promptEN = promptEN
              .replace(/\[Producto:[^\]]+\]/gi, dishOrProductName.trim())
              .replace(/\[Nombre del Producto:[^\]]+\]/gi, dishOrProductName.trim())
              .replace(/\[Objeto:[^\]]+\]/gi, dishOrProductName.trim());
          }
          if (prospectBusiness.trim()) {
            promptEN = promptEN.replace(/\[Marca o industria:[^\]]+\]/gi, prospectBusiness.trim());
          }

          const styleRes = await fetch("/api/ai/generate-from-prompt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              promptText: promptEN,
              baseImageUrl: rawBaseUrl,
              templateId: selectedTemplate.id,
              isCommercialPoster: true,
            }),
          });

          if (styleRes.ok) {
            const styleData = await styleRes.json();
            if (styleData.imageUrl && styleData.imageUrl.startsWith("http")) {
              rawBaseUrl = styleData.imageUrl;
            }
          }
        } catch (styleErr) {
          console.warn("Fallo estilizando imagen:", styleErr);
        }
      }

      setGeneratedImageUrl(rawBaseUrl);

      // 4. Composición con Logo y Sello
      setGeneratingStep("Componiendo flyer publicitario con logo y sello...");
      const effectiveLogo = (removeLogoBg && cleanedLogoUrl) ? cleanedLogoUrl : (uploadedLogoUrl || "");

      let clientCanvasDataUrl = "";
      try {
        clientCanvasDataUrl = await compositeImageClient({
          baseImageUrl: rawBaseUrl,
          logoUrl: effectiveLogo,
          logoPosition,
          logoSize: 100,
          logoTransparent: removeLogoBg,
          offerText: offerText.trim(),
          badgeCustomText: badgeCustomText.trim(),
          badgeStyle,
          dishOrProductName: dishOrProductName.trim(),
          businessName: prospectBusiness.trim(),
          includeSantisoftWatermark: true,
        });
        setCanvasImageUrl(clientCanvasDataUrl);
      } catch (canvasErr) {
        console.warn("Canvas compositing fallback a base:", canvasErr);
        setCanvasImageUrl(rawBaseUrl);
      }

      // 5. Butterfly Render para vista dinámica
      let butterflyUrlResult = "";
      try {
        const renderResult = await createButterflyRender({
          baseImageUrl: rawBaseUrl,
          logoUrl: effectiveLogo,
          logoPosition,
          logoSize: 100,
          logoTransparent: removeLogoBg,
          offerText: offerText.trim(),
          badgeCustomText: badgeCustomText.trim(),
          badgeStyle,
          dishOrProductName: dishOrProductName.trim(),
          businessName: prospectBusiness.trim(),
          userId: currentUser?.uid || "vendedor",
          includeSantisoftWatermark: true,
        });
        butterflyUrlResult = renderResult.butterflyUrl;
        setButterflyUrl(butterflyUrlResult);
      } catch (bErr) {
        console.warn("Butterfly render skipped:", bErr);
      }

      // 6. Redacción de Copy con Agentes
      setGeneratingStep("Redactando copy persuasivo y llamada a la acción...");
      let newPostCaption = "";
      try {
        const copyRes = await fetch("/api/ai/prospect-copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: prospectBusiness.trim(),
            rubro,
            dishOrProductName: dishOrProductName.trim(),
            offerText: offerText.trim(),
            phone: prospectPhone.trim(),
          }),
        });
        if (copyRes.ok) {
          const copyData = await copyRes.json();
          newPostCaption = copyData.caption || "";
          setGeneratedPostCaption(newPostCaption);
        }
      } catch (copyErr) {
        console.warn("Error redactando copy:", copyErr);
      }

      // 7. Guardar en Base de Datos vía API
      setGeneratingStep("Creando enlace de muestra interactiva...");
      const finalImageToSave = clientCanvasDataUrl || rawBaseUrl || butterflyUrlResult;
      const phoneToSave = prospectPhone.trim() ? `${countryCode}${prospectPhone.trim().replace(/^0+/, "")}` : "";

      let savedDemoId = "";
      try {
        const token = await auth.currentUser?.getIdToken();
        const saveRes = await fetch("/api/admin/muestras", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prospectName: prospectName.trim(),
            prospectBusiness: prospectBusiness.trim(),
            prospectPhone: phoneToSave,
            rubro,
            offerText: offerText.trim(),
            badgeCustomText: badgeCustomText.trim() || null,
            badgeStyle,
            dishOrProductName: dishOrProductName.trim() || null,
            generatedPostCaption: newPostCaption || null,
            baseImageUrl: uploadedBaseImageUrl || null,
            logoUrl: uploadedLogoUrl || null,
            logoPosition,
            logoSize: 100,
            logoTransparent: removeLogoBg,
            selectedStyleId: selectedTemplate?.id || null,
            selectedStyleTitle: selectedTemplate?.title || null,
            generatedImageUrl: rawBaseUrl,
            canvasImageUrl: clientCanvasDataUrl || rawBaseUrl,
            butterflyUrl: butterflyUrlResult || null,
            status: "generada",
          }),
        });

        if (saveRes.ok) {
          const saveJson = await saveRes.json();
          savedDemoId = saveJson.id;
          setCreatedDemoId(savedDemoId);
        }
      } catch (saveErr) {
        console.error("Error guardando demo:", saveErr);
      }

      // Scroll abajo hacia el resultado
      if (typeof window !== "undefined") {
        setTimeout(() => {
          const previewEl = document.getElementById("resultado-generacion");
          if (previewEl) {
            previewEl.scrollIntoView({ behavior: "smooth" });
          }
        }, 300);
      }
    } catch (err: any) {
      console.error("Error generando muestra:", err);
      alert(`Hubo un problema al generar la muestra: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setGeneratingStep("");
    }
  };

  // 9. Enviar por WhatsApp (1-click)
  const handleSendWhatsApp = async (overrideDemoId?: string, overridePhone?: string, overrideMsg?: string) => {
    const targetId = overrideDemoId || createdDemoId;
    const rawTargetPhone = overridePhone || (prospectPhone.trim() ? `${countryCode}${prospectPhone.trim().replace(/^0+/, "")}` : "");
    const cleanPhone = rawTargetPhone.replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");

    if (!cleanPhone) {
      alert("Por favor ingresa el número de WhatsApp del prospecto para enviar la muestra.");
      return;
    }

    const messageToSend = overrideMsg || customWhatsappCopy;

    // Actualizar estado a "enviada" en backend
    if (targetId) {
      try {
        const token = await auth.currentUser?.getIdToken();
        await fetch("/api/admin/muestras", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: targetId,
            status: "enviada",
          }),
        });
      } catch (_) {}
    }

    // Abrir WhatsApp Web o App directamente
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageToSend)}`;
    window.open(waUrl, "_blank");
  };

  // 10. Copiar enlace al portapapeles
  const handleCopyDemoLink = (demoId: string) => {
    const url = `${PUBLIC_APP_URL}/m/${demoId}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // 11. Copiar Copy del Post
  const handleCopyPostCaption = () => {
    if (!generatedPostCaption) return;
    navigator.clipboard.writeText(generatedPostCaption);
    setCopyPostSuccess(true);
    setTimeout(() => setCopyPostSuccess(false), 2500);
  };

  // 12. Cargar demo anterior al editor
  const handleLoadDemoToEdit = (demo: ProspectDemo) => {
    setProspectName(demo.prospectName || "");
    setProspectBusiness(demo.prospectBusiness || "");
    setRubro(demo.rubro || COMMON_NICHES[0].label);
    setOfferText(demo.offerText || "");
    setDishOrProductName(demo.dishOrProductName || "");
    setBadgeCustomText(demo.badgeCustomText || "");
    if (demo.badgeStyle) setBadgeStyle(demo.badgeStyle);

    if (demo.prospectPhone) {
      const matched = COUNTRY_CODES.find((c) => demo.prospectPhone.startsWith(c.code));
      if (matched) {
        setCountryCode(matched.code);
        setProspectPhone(demo.prospectPhone.slice(matched.code.length));
      } else {
        setProspectPhone(demo.prospectPhone.replace(/^\+/, ""));
      }
    }

    const mainImg = demo.canvasImageUrl || demo.generatedImageUrl || "";
    setGeneratedImageUrl(demo.generatedImageUrl || mainImg);
    setCanvasImageUrl(demo.canvasImageUrl || mainImg);
    setButterflyUrl(demo.butterflyUrl || "");
    setGeneratedPostCaption(demo.generatedPostCaption || "");
    setCreatedDemoId(demo.id || "");

    if (demo.whatsappMessage) {
      setCustomWhatsappCopy(demo.whatsappMessage);
    }

    setActiveTab("crear");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 13. Eliminar demo
  const handleDeleteDemo = async (demoId: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta muestra?")) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/muestras?id=${demoId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setHistoryDemos((prev) => prev.filter((d) => d.id !== demoId));
      } else {
        alert("No se pudo eliminar la muestra.");
      }
    } catch (err) {
      console.error("Error eliminando muestra:", err);
    }
  };

  // 13.5 Cambiar contraseña del vendedor
  const handleChangeMyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError("");
    setChangePassSuccess("");

    if (!newPassInput || newPassInput.length < 6) {
      setChangePassError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassInput !== confirmPassInput) {
      setChangePassError("Las contraseñas no coinciden. Verifícalas.");
      return;
    }

    setChangePassLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/vendedores/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: newPassInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar la contraseña");
      }

      setChangePassSuccess("¡Contraseña actualizada exitosamente!");
      setTimeout(() => {
        setShowChangePassModal(false);
        setNewPassInput("");
        setConfirmPassInput("");
        setChangePassSuccess("");
      }, 2000);
    } catch (err: any) {
      setChangePassError(err.message || "Error al actualizar contraseña");
    } finally {
      setChangePassLoading(false);
    }
  };

  // 14. Logout
  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/vendedores/login");
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-slate-500">Verificando acceso de vendedor...</p>
      </div>
    );
  }

  const cleanPhone = prospectPhone.trim().replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");
  const fullPhoneForPreview = cleanPhone ? `${countryCode}${cleanPhone}` : "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20 sm:pb-8">
      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
              <LogoMark size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">Santisoft Muestras</h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-none">
                {currentUser?.displayName || currentUser?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
              >
                <FaMobileAlt /> Instalar App
              </button>
            )}

            {/* Solo mostrar botón de clave para cuentas tradicionales (NO Google) */}
            {!currentUser?.email?.toLowerCase().endsWith("@gmail.com") &&
              !currentUser?.providerData.some((p) => p.providerId === "google.com") && (
                <button
                  onClick={() => {
                    setShowChangePassModal(true);
                    setNewPassInput("");
                    setConfirmPassInput("");
                    setChangePassError("");
                    setChangePassSuccess("");
                  }}
                  title="Cambiar mi contraseña"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  <FaKey className="text-xs text-indigo-600" />
                  <span className="hidden sm:inline">Clave</span>
                </button>
            )}

            <button
              onClick={handleSignOut}
              title="Cerrar Sesión"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
            >
              <FaSignOutAlt className="text-sm" />
            </button>
          </div>
        </div>

        {/* Banner de instalación en móviles si está disponible */}
        {isInstallable && (
          <div className="sm:hidden mt-2 p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">📲</span>
              <span className="text-xs text-indigo-900 font-bold">¿Instalar en tu pantalla de inicio?</span>
            </div>
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs"
            >
              Instalar
            </button>
          </div>
        )}
      </header>

      {/* TABS SWITCHER */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 sticky top-[57px] z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-center p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
          <button
            onClick={() => setActiveTab("crear")}
            className={`flex-1 sm:flex-initial sm:px-6 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "crear"
                ? "bg-white text-indigo-600 shadow-sm font-black"
                : "text-slate-500 hover:text-slate-900 font-bold hover:bg-white/50"
            }`}
          >
            <FaMagic className="text-xs" /> Nueva Muestra
          </button>
          <button
            onClick={() => setActiveTab("historial")}
            className={`flex-1 sm:flex-initial sm:px-6 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "historial"
                ? "bg-white text-indigo-600 shadow-sm font-black"
                : "text-slate-500 hover:text-slate-900 font-bold hover:bg-white/50"
            }`}
          >
            <FaSearch className="text-xs" /> Mis Muestras
            {historyDemos.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-black text-slate-700">
                {historyDemos.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-4xl w-full mx-auto px-4 py-6 sm:px-6 flex-1">
        {activeTab === "crear" ? (
          <div className="space-y-6">
            {/* PASO 1: DATOS DEL PROSPECTO */}
            <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black flex items-center justify-center border border-indigo-100">
                  1
                </span>
                <h2 className="text-sm sm:text-base font-black text-slate-900">Datos del Prospecto</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nombre del Negocio / Marca *
                  </label>
                  <input
                    type="text"
                    required
                    value={prospectBusiness}
                    onChange={(e) => setProspectBusiness(e.target.value)}
                    placeholder="Ej. Parrilladas Don Carlos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nombre del Dueño o Contacto
                  </label>
                  <input
                    type="text"
                    value={prospectName}
                    onChange={(e) => setProspectName(e.target.value)}
                    placeholder="Ej. Don Carlos Muñoz"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    WhatsApp del Prospecto
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-2xl px-2.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
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
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Rubro / Industria
                  </label>
                  <select
                    value={rubro}
                    onChange={(e) => setRubro(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
                  >
                    {COMMON_NICHES.map((n) => (
                      <option key={n.label} value={n.label}>
                        {n.icon} {n.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Plato, Producto o Servicio a Destacar
                  </label>
                  <input
                    type="text"
                    value={dishOrProductName}
                    onChange={(e) => setDishOrProductName(e.target.value)}
                    placeholder="Ej. Bife de Chorizo a las Brasas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Oferta, Promo o Gancho (Opcional)
                  </label>
                  <input
                    type="text"
                    value={offerText}
                    onChange={(e) => setOfferText(e.target.value)}
                    placeholder="Ej. 20% Dto los jueves o 2x1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                </div>
              </div>
            </section>

            {/* PASO 2: ASSETS (FOTO Y LOGO) */}
            <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black flex items-center justify-center border border-indigo-100">
                  2
                </span>
                <h2 className="text-sm sm:text-base font-black text-slate-900">Foto Real y Logo (Opcional)</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* FOTO BASE */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase text-slate-700">
                      📸 Foto Real del Producto
                    </label>
                    {baseImagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setBaseImageFile(null);
                          setBaseImagePreview("");
                        }}
                        className="text-[11px] text-rose-600 font-bold hover:underline"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  {baseImagePreview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <img
                        src={baseImagePreview}
                        alt="Preview Foto"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => baseImageInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-white"
                    >
                      <FaUpload className="mx-auto text-slate-400 text-lg mb-1" />
                      <p className="text-xs text-slate-700 font-bold">Subir foto desde tu celular</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Si no tienes foto real, nuestros agentes la generarán automáticamente.
                      </p>
                    </div>
                  )}
                  <input
                    ref={baseImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBaseImageChange}
                    className="hidden"
                  />
                </div>

                {/* LOGO */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase text-slate-700">
                      🏷️ Logo del Negocio
                    </label>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview("");
                          setCleanedLogoUrl("");
                        }}
                        className="text-[11px] text-rose-600 font-bold hover:underline"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  {logoPreview ? (
                    <div className="space-y-3">
                      <div className="relative h-24 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-2">
                        <img
                          src={removeLogoBg && cleanedLogoUrl ? cleanedLogoUrl : logoPreview}
                          alt="Preview Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      {/* Quitar fondo toggle */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={removeLogoBg}
                          onChange={(e) => handleToggleRemoveLogoBg(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <span>Quitar fondo del logo automáticamente</span>
                      </label>
                      {isRemovingLogoBg && (
                        <p className="text-[10px] text-indigo-600 font-bold animate-pulse">
                          Recortando fondo del logo...
                        </p>
                      )}

                      {/* Posición del Logo */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Posición del logo en el flyer:
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: "top-left", label: "↖ Arriba Izq" },
                            { id: "top-right", label: "↗ Arriba Der" },
                            { id: "bottom-left", label: "↙ Abajo Izq" },
                            { id: "bottom-right", label: "↘ Abajo Der" },
                          ].map((pos) => (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() => setLogoPosition(pos.id as any)}
                              className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all border ${
                                logoPosition === pos.id
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-white"
                    >
                      <FaUpload className="mx-auto text-slate-400 text-lg mb-1" />
                      <p className="text-xs text-slate-700 font-bold">Subir logo del cliente</p>
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG o WebP</p>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              </div>
            </section>

            {/* PASO 3: SELLO COMERCIAL (BADGE) */}
            <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black flex items-center justify-center border border-indigo-100">
                  3
                </span>
                <h2 className="text-sm sm:text-base font-black text-slate-900">Sello Publicitario en Flyer</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Texto en el Sello (Badge)
                  </label>
                  <input
                    type="text"
                    value={badgeCustomText}
                    onChange={(e) => setBadgeCustomText(e.target.value)}
                    placeholder="Ej. ¡OFERTA DE LA SEMANA! o 2X1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Si lo dejas vacío, usará el texto de la oferta o no pondrá sello.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Estilo de Sello
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "sticker-circle", label: "🔴 Círculo Sticker" },
                      { id: "pill-fire", label: "🔥 Fuego Pill" },
                      { id: "gold-gourmet", label: "✨ Gourmet Oro" },
                      { id: "corner-ribbon", label: "🎗️ Cinta Esquina" },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBadgeStyle(b.id as any)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-left border ${
                          badgeStyle === b.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* PASO 4: SELECCIÓN DE ESTILO VISUAL */}
            <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black flex items-center justify-center border border-indigo-100">
                    4
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">Estilo Visual Publicitario</h2>
                </div>
                {selectedTemplate && (
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="text-xs text-indigo-600 hover:underline font-bold"
                  >
                    Limpiar selección
                  </button>
                )}
              </div>

              {/* Categorías y Búsqueda */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <FaSearch className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar estilo (ej. Gourmet, Neón, Cyber, Blanco)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                </div>

                {/* Chips de Categoría */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {["Todas", ...promptCategories].slice(0, 8).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                        selectedCategory === cat
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid de Estilos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
                {filteredTemplates.slice(0, 24).map((template) => {
                  const isSelected = selectedTemplate?.id === template.id;
                  return (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all ${
                        isSelected
                          ? "border-indigo-600 ring-2 ring-indigo-600 shadow-md shadow-indigo-600/20 bg-indigo-50/50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="aspect-square relative overflow-hidden bg-slate-100">
                        {template.previewUrl ? (
                          <img
                            src={template.previewUrl}
                            alt={template.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <FaImage className="text-2xl" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                            <FaCheck className="text-[10px]" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{template.title}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {template.category}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* BOTÓN PRINCIPAL DE GENERACIÓN */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isGenerating || !prospectBusiness.trim()}
                onClick={handleGenerateSample}
                className="w-full py-4 px-6 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-600/25 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm">{generatingStep || "Nuestros agentes están trabajando..."}</span>
                  </>
                ) : (
                  <>
                    <FaMagic className="text-lg text-yellow-300" />
                    <span>Generar Muestra con Agentes</span>
                  </>
                )}
              </button>
            </div>

            {/* RESULTADO DE GENERACIÓN */}
            {(canvasImageUrl || generatedImageUrl) && (
              <section
                id="resultado-generacion"
                className="bg-white border-2 border-indigo-100 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-300"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎉</span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Muestra Lista para Enviar
                    </h3>
                  </div>
                  {createdDemoId && (
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      ID: {createdDemoId.slice(0, 8)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* IMAGEN GENERADA */}
                  <div className="space-y-3">
                    <div className="aspect-square relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                      <img
                        src={canvasImageUrl || generatedImageUrl || baseImagePreview || ""}
                        alt="Flyer Muestra"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (generatedImageUrl && target.src !== generatedImageUrl) {
                            target.src = generatedImageUrl;
                          } else if (baseImagePreview && target.src !== baseImagePreview) {
                            target.src = baseImagePreview;
                          }
                        }}
                      />
                    </div>

                    <div className="flex gap-2">
                      {createdDemoId && (
                        <a
                          href={`${PUBLIC_APP_URL}/m/${createdDemoId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-center text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <FaEye className="text-indigo-600" /> Ver Landing Pública
                        </a>
                      )}
                      {createdDemoId && (
                        <button
                          type="button"
                          onClick={() => handleCopyDemoLink(createdDemoId)}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <FaCopy className="text-indigo-600" />
                          {copySuccess ? "¡Copiado!" : "Copiar Enlace"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* COPY Y ENVÍO POR WHATSAPP */}
                  <div className="space-y-4">
                    {/* ENVIAR WHATSAPP BOTÓN GIGANTE */}
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                          <FaWhatsapp className="text-emerald-600 text-base" /> Envío Directo al Prospecto
                        </span>
                        {fullPhoneForPreview && (
                          <span className="text-xs font-bold text-emerald-700 font-mono">
                            {fullPhoneForPreview}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp()}
                        className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transform active:scale-[0.99] transition-all"
                      >
                        <FaWhatsapp className="text-lg" />
                        <span>Enviar Propuesta por WhatsApp</span>
                      </button>
                    </div>

                    {/* MENSAJE DE WHATSAPP EDITABLE */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Mensaje a Enviar por WhatsApp:
                      </label>
                      <textarea
                        rows={6}
                        value={customWhatsappCopy}
                        onChange={(e) => setCustomWhatsappCopy(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-sans leading-relaxed"
                      />
                    </div>

                    {/* COPY REDACTADO PARA EL POST */}
                    {generatedPostCaption && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            📝 Copy de Publicación Redactado por Agentes
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyPostCaption}
                            className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                          >
                            <FaCopy /> {copyPostSuccess ? "¡Copiado!" : "Copiar"}
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 line-clamp-3 whitespace-pre-wrap italic">
                          {generatedPostCaption}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : (
          /* PESTAÑA: MIS MUESTRAS (HISTORIAL DEL VENDEDOR) */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Buscar por negocio, contacto o teléfono..."
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={loadingHistory}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <FaSyncAlt className={loadingHistory ? "animate-spin" : ""} />
                  <span>Actualizar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("crear")}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <FaPlus /> <span>Nueva</span>
                </button>
              </div>
            </div>

            {loadingHistory ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-slate-500 font-bold">Cargando tus muestras...</p>
              </div>
            ) : historyDemos.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-xl">
                  📋
                </div>
                <h3 className="text-sm font-black text-slate-900">Aún no tienes muestras creadas</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Genera tu primera muestra comercial para sorprender a un prospecto por WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("crear")}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                >
                  <FaMagic /> Crear mi primera muestra
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {historyDemos
                  .filter((d) => {
                    const q = historySearch.toLowerCase();
                    return (
                      !q ||
                      d.prospectBusiness?.toLowerCase().includes(q) ||
                      d.prospectName?.toLowerCase().includes(q) ||
                      d.prospectPhone?.includes(q) ||
                      d.rubro?.toLowerCase().includes(q)
                    );
                  })
                  .map((demo) => {
                    const thumb = demo.canvasImageUrl || demo.generatedImageUrl || demo.baseImageUrl || "";
                    const isSent = demo.status === "enviada";

                    return (
                      <div
                        key={demo.id}
                        className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-3xl p-4 shadow-sm hover:shadow-md flex flex-col justify-between space-y-3 transition-all"
                      >
                        <div className="flex gap-3">
                          {thumb ? (
                            <a
                              href={`${PUBLIC_APP_URL}/m/${demo.id}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Ver muestra completa"
                              className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 hover:opacity-90 transition-opacity block group relative"
                            >
                              <img
                                src={thumb}
                                alt={demo.prospectBusiness}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (demo.generatedImageUrl && target.src !== demo.generatedImageUrl) {
                                    target.src = demo.generatedImageUrl;
                                  } else if (demo.baseImageUrl && target.src !== demo.baseImageUrl) {
                                    target.src = demo.baseImageUrl;
                                  }
                                }}
                              />
                            </a>
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                              <FaImage className="text-xl" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-black text-slate-900 truncate">
                                {demo.prospectBusiness}
                              </h4>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isSent
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {isSent ? "Enviada" : "Generada"}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 truncate">
                              👤 {demo.prospectName || "Sin contacto"}
                            </p>
                            {demo.dishOrProductName && (
                              <p className="text-[11px] text-indigo-600 font-bold truncate mt-0.5">
                                ⭐ {demo.dishOrProductName}
                              </p>
                            )}
                            {demo.prospectPhone && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                📞 {demo.prospectPhone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* ACCIONES DE LA TARJETA */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(demo.id, demo.prospectPhone, demo.whatsappMessage)}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                          >
                            <FaWhatsapp /> Enviar
                          </button>

                          {demo.id && (
                            <a
                              href={`${PUBLIC_APP_URL}/m/${demo.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
                              title="Ver Landing"
                            >
                              <FaExternalLinkAlt className="text-xs" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleLoadDemoToEdit(demo)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors"
                            title="Editar en formulario"
                          >
                            <FaEdit className="text-xs" />
                          </button>

                          {demo.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDemo(demo.id!)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Eliminar muestra"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL CAMBIAR CONTRASEÑA DEL VENDEDOR */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-[28px] max-w-sm w-full p-6 text-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm">
                  <FaKey />
                </span>
                <h3 className="text-base font-black text-slate-900">Cambiar mi Contraseña</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePassModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-light"
              >
                ✕
              </button>
            </div>

            {changePassSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <FaCheck /> {changePassSuccess}
              </div>
            ) : (
              <form onSubmit={handleChangeMyPassword} className="space-y-4">
                {changePassError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    ⚠️ {changePassError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirmar Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassInput}
                    onChange={(e) => setConfirmPassInput(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowChangePassModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={changePassLoading}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {changePassLoading ? "Guardando..." : "Actualizar Clave"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL INSTRUCCIONES INSTALACIÓN iOS */}
      {showIosInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-[28px] max-w-sm w-full p-6 text-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
              📲
            </div>
            <h3 className="text-base font-black text-slate-900">Instalar en tu iPhone</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              1. En Safari, toca el botón <strong>Compartir</strong> (el ícono cuadrado con flecha hacia arriba ⬆️ en la barra inferior).
              <br /><br />
              2. Desplázate hacia abajo y selecciona <strong>&quot;Añadir a pantalla de inicio&quot;</strong>.
              <br /><br />
              3. ¡Listo! Se abrirá a pantalla completa como una app nativa.
            </p>
            <button
              type="button"
              onClick={() => setShowIosInstallModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
