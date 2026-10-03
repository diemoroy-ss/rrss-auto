"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { auth, storage } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useProfile, BusinessProfile, CatalogoItem } from "../../../../contexts/ProfileContext";
import { HARDCODED_STYLES, PromptTemplate } from "../../../../lib/prompt-templates";
import { TEST_COMPANY_TEMPLATES } from "../../../../lib/test-company-templates";
import TestCompanyModal from "../../../../components/catalogo/TestCompanyModal";
import { 
  MENU_THEMES, 
  DEFAULT_MENU_THEME, 
  MenuThemeId 
} from "../../../../lib/menu-themes";
import {
  FaQrcode,
  FaDownload,
  FaExternalLinkAlt,
  FaCopy,
  FaCheck,
  FaStore,
  FaMobileAlt,
  FaPalette,
  FaCheckCircle,
  FaRedo,
  FaToggleOn,
  FaToggleOff,
  FaPrint
} from "react-icons/fa";

export default function LaboratorioPage() {
  const [user, setUser] = useState<any>(null);
  const [userToken, setUserToken] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  const { activeProfile, updateProfileById, profiles, setActiveProfile, loadProfiles } = useProfile();

  // Test Profiles Filter
  const testProfiles = profiles.filter((p) => p.isTestProfile === true || p.id.startsWith("prof_test_"));

  // ID de la empresa de prueba seleccionada en el Laboratorio
  const [selectedTestId, setSelectedTestId] = useState<string>("");

  // Auto-seleccionar y mantener sincronizado el perfil de prueba
  useEffect(() => {
    if (testProfiles.length > 0) {
      // Si el activeProfile actual de la app es un perfil de prueba y es diferente del selectedTestId, sincronizarlo
      if (activeProfile && testProfiles.some((tp) => tp.id === activeProfile.id)) {
        if (selectedTestId !== activeProfile.id) {
          setSelectedTestId(activeProfile.id);
          return;
        }
      }

      const exists = testProfiles.some((tp) => tp.id === selectedTestId);
      if (!selectedTestId || !exists) {
        const firstTestId = testProfiles[0].id;
        setSelectedTestId(firstTestId);
        setActiveProfile(firstTestId);
      }
    }
  }, [testProfiles, activeProfile?.id, selectedTestId]);

  const currentTestProfile: BusinessProfile | null =
    testProfiles.find((tp) => tp.id === selectedTestId) ||
    (activeProfile && testProfiles.find((tp) => tp.id === activeProfile.id)) ||
    (testProfiles.length > 0 ? testProfiles[0] : null);

  const isCurrentTest = Boolean(currentTestProfile);

  const handleSelectTestProfile = (id: string) => {
    setSelectedTestId(id);
    setActiveProfile(id);
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState<"marca" | "catalogo" | "menu_qr" | "comandos" | "radar_estrategia">("marca");

  // Notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Tab: Carta Menú Digital & QR
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedQrLink, setCopiedQrLink] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const [savingMenuTheme, setSavingMenuTheme] = useState(false);
  const [togglingMenuDigital, setTogglingMenuDigital] = useState(false);

  // Tab 1: Datos de Marca
  const [brandForm, setBrandForm] = useState({
    name: "",
    icon: "🏢",
    rubro: "",
    businessDescription: "",
    promotions: "",
    website: "",
    includeWebsiteInCopy: true,
    email: "",
    includeEmailInCopy: false,
    phone: "",
    includePhoneInCopy: true,
    logoUrl: "",
    alwaysIncludeLogo: false,
    bannerStyle: "banner" as "banner" | "clean",
  });
  const [savingBrand, setSavingBrand] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Tab 2: Catálogo
  const [catalogItems, setCatalogItems] = useState<CatalogoItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogoItem | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    type: "producto" as "producto" | "servicio",
    category: "",
    price: "",
    offerPrice: "",
    imageUrl: "",
    tags: "",
    keepOriginalPhoto: true,
    fontStyle: "bold_modern" as "script_handwritten" | "bold_modern" | "elegant_serif" | "clean_minimal",
  });
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const productImageRef = useRef<HTMLInputElement>(null);

  // Tab 3: Comandos de Agentes y Estilos
  const [agentTone, setAgentTone] = useState("directo_cercano");
  const [customAgentInstruction, setCustomAgentInstruction] = useState("");
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([
    "style-everyday-real",
    "style-ads-hero-shot",
  ]);
  const [savingAgents, setSavingAgents] = useState(false);

  // Tab 4: Radar de Nicho & Estrategia Visual
  const [loadingRadar, setLoadingRadar] = useState(false);
  const [radarData, setRadarData] = useState<any>(null);
  const [strategyGoal, setStrategyGoal] = useState("ventas");
  const [catalogUsage, setCatalogUsage] = useState<"all" | "mixed">("mixed");
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [strategyPosts, setStrategyPosts] = useState<any[]>([]);
  const [savingToCalendar, setSavingToCalendar] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "mockup">("grid");

  // Auth setup
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const token = await u.getIdToken();
          setUserToken(token);
        } catch (e) {
          console.error("Error getting token", e);
        }
      }
      setLoadingUser(false);
    });
    return () => unsub();
  }, []);

  const userEmail = (user?.email || "").toLowerCase().trim();
  const isAdminUser = ["santisoftai@gmail.com", "diemoroy@gmail.com", "spalezcom@gmail.com", "admin@santisoft.cl"].includes(userEmail);

  // Sincronizar formulario de marca al cambiar la empresa de prueba activa
  useEffect(() => {
    if (currentTestProfile) {
      setBrandForm({
        name: currentTestProfile.name || "",
        icon: currentTestProfile.icon || "🏢",
        rubro: currentTestProfile.rubro || "",
        businessDescription: currentTestProfile.businessDescription || "",
        promotions: currentTestProfile.promotions || "",
        website: currentTestProfile.website || "",
        includeWebsiteInCopy: currentTestProfile.includeWebsiteInCopy !== false,
        email: currentTestProfile.email || "",
        includeEmailInCopy: currentTestProfile.includeEmailInCopy === true,
        phone: currentTestProfile.phone || "",
        includePhoneInCopy: currentTestProfile.includePhoneInCopy !== false,
        logoUrl: currentTestProfile.logoUrl || "",
        alwaysIncludeLogo: currentTestProfile.alwaysIncludeLogo === true,
        bannerStyle: currentTestProfile.bannerStyle || "banner",
      });

      if (currentTestProfile.selectedPromptStyleIds && currentTestProfile.selectedPromptStyleIds.length > 0) {
        setSelectedStyleIds(currentTestProfile.selectedPromptStyleIds);
      }
    } else {
      setBrandForm({
        name: "",
        icon: "🏢",
        rubro: "",
        businessDescription: "",
        promotions: "",
        website: "",
        includeWebsiteInCopy: true,
        email: "",
        includeEmailInCopy: false,
        phone: "",
        includePhoneInCopy: true,
        logoUrl: "",
        alwaysIncludeLogo: false,
        bannerStyle: "banner",
      });
      setSelectedStyleIds(["style-everyday-real", "style-ads-hero-shot"]);
    }
  }, [currentTestProfile?.id]);

  // Cargar catálogo cada vez que cambia el perfil de prueba
  useEffect(() => {
    if (user && currentTestProfile?.id) {
      loadCatalog(currentTestProfile.id);
    } else {
      setCatalogItems([]);
    }
  }, [user, currentTestProfile?.id]);

  const loadCatalog = async (overrideProfileId?: string) => {
    const targetProfileId = overrideProfileId || currentTestProfile?.id;
    if (!user || !targetProfileId) return;
    setLoadingCatalog(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/catalogo?profileId=${targetProfileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCatalogItems(data.items || []);
    } catch (e) {
      console.error("Error cargando catálogo en laboratorio:", e);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  // Configuración de Carta Menú & QR para la Empresa de Prueba
  const profileId = currentTestProfile?.id || "";
  const isMenuEnabled = currentTestProfile?.menuDigitalEnabled === true;
  const currentMenuThemeId: MenuThemeId = (currentTestProfile?.menuTheme as MenuThemeId) || DEFAULT_MENU_THEME;

  const menuIdentifier = user?.uid && profileId ? `${user.uid}___${profileId}` : "";
  const publicMenuUrl = typeof window !== "undefined" && menuIdentifier
    ? `${window.location.origin}/menu/${menuIdentifier}`
    : menuIdentifier
      ? `https://rrss.santisoft.cl/menu/${menuIdentifier}`
      : "";

  // Generar código QR para la carta digital de esta empresa
  useEffect(() => {
    if (!publicMenuUrl) return;

    QRCode.toDataURL(publicMenuUrl, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR in Lab", err));
  }, [publicMenuUrl]);

  const handleToggleMenuDigital = async (enabled: boolean) => {
    if (!currentTestProfile?.id) {
      showNotification("Selecciona una empresa de prueba primero.", true);
      return;
    }
    setTogglingMenuDigital(true);
    try {
      await updateProfileById(currentTestProfile.id, { menuDigitalEnabled: enabled });
      setIframeKey((prev) => prev + 1);
      showNotification(
        enabled
          ? "¡Carta Menú Digital habilitada para esta empresa de prueba!"
          : "Carta Menú Digital pausada."
      );
    } catch (e: any) {
      showNotification("Error al actualizar la carta digital.", true);
    } finally {
      setTogglingMenuDigital(false);
    }
  };

  const handleSelectMenuTheme = async (themeId: MenuThemeId) => {
    if (!currentTestProfile?.id || themeId === currentMenuThemeId) return;
    setSavingMenuTheme(true);
    try {
      await updateProfileById(currentTestProfile.id, { menuTheme: themeId });
      setIframeKey((prev) => prev + 1);
      showNotification(`Tema "${MENU_THEMES[themeId].name}" aplicado a la carta digital.`);
    } catch (e: any) {
      showNotification("Error al guardar estilo de carta.", true);
    } finally {
      setSavingMenuTheme(false);
    }
  };

  const copyQrLink = () => {
    if (!publicMenuUrl) return;
    navigator.clipboard.writeText(publicMenuUrl);
    setCopiedQrLink(true);
    showNotification("¡Enlace copiado al portapapeles!");
    setTimeout(() => setCopiedQrLink(false), 2500);
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    const cleanName = (currentTestProfile?.name || "empresa-prueba")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    a.download = `qr-menu-${cleanName}.png`;
    a.click();
  };

  const handlePrintTableTent = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Carta Menú QR - ${currentTestProfile?.name || "Empresa"}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              margin: 0;
              background-color: #f8fafc;
            }
            .tent-card {
              background: white;
              border: 2px dashed #cbd5e1;
              border-radius: 24px;
              padding: 40px;
              max-width: 360px;
              text-align: center;
              box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            }
            .logo-placeholder { font-size: 40px; margin-bottom: 8px; }
            h1 { font-size: 24px; font-weight: 900; margin: 0 0 6px 0; color: #0f172a; }
            p.rubro { font-size: 13px; font-weight: 700; color: #64748b; margin: 0 0 24px 0; text-transform: uppercase; letter-spacing: 1px; }
            .qr-wrapper { background: #f8fafc; padding: 16px; border-radius: 20px; border: 1px solid #e2e8f0; display: inline-block; margin-bottom: 20px; }
            .qr-img { width: 220px; height: 220px; display: block; }
            p.instruction { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0 0 6px 0; }
            p.sub-instruction { font-size: 11px; color: #64748b; margin: 0 0 16px 0; line-height: 1.4; }
            .footer { font-size: 9px; font-weight: 800; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="tent-card">
            <div class="logo-placeholder">${currentTestProfile?.icon || "🍽️"}</div>
            <h1>${currentTestProfile?.name || "Nuestra Carta"}</h1>
            <p class="rubro">${currentTestProfile?.rubro || "Gastronomía & Servicios"}</p>
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" class="qr-img" />
            </div>
            <p class="instruction">📱 Escanea con tu cámara</p>
            <p class="sub-instruction">Revisa nuestra carta completa con fotos, precios y promociones actualizadas</p>
            <div class="footer">CARTA DIGITAL • SANTISOFT</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const itemsWithPrice = catalogItems.filter((i) => Boolean(i.price)).length;
  const itemsWithOffer = catalogItems.filter((i) => Boolean(i.offerPrice)).length;

  // Guardar Marca
  const handleSaveBrand = async () => {
    if (!currentTestProfile?.id) {
      showNotification("Selecciona o crea una empresa de prueba primero.", true);
      return;
    }
    setSavingBrand(true);
    try {
      await updateProfileById(currentTestProfile.id, {
        name: brandForm.name,
        icon: brandForm.icon,
        rubro: brandForm.rubro,
        businessDescription: brandForm.businessDescription,
        promotions: brandForm.promotions,
        website: brandForm.website,
        includeWebsiteInCopy: brandForm.includeWebsiteInCopy,
        email: brandForm.email,
        includeEmailInCopy: brandForm.includeEmailInCopy,
        phone: brandForm.phone,
        includePhoneInCopy: brandForm.includePhoneInCopy,
        logoUrl: brandForm.logoUrl,
        alwaysIncludeLogo: brandForm.alwaysIncludeLogo,
        bannerStyle: brandForm.bannerStyle,
      });
      showNotification("¡Datos de marca de la empresa de prueba guardados con éxito!");
    } catch (e: any) {
      showNotification(e.message || "Error al guardar marca", true);
    } finally {
      setSavingBrand(false);
    }
  };

  // Subir Logo
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !currentTestProfile?.id) return;
    setUploadingLogo(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/profiles/${currentTestProfile.id}/logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setBrandForm((prev) => ({ ...prev, logoUrl: url }));
      await updateProfileById(currentTestProfile.id, { logoUrl: url });
      showNotification("Logo de prueba subido y vinculado.");
    } catch (err: any) {
      showNotification("Error al subir el logo", true);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Guardar / Crear Producto
  const handleSaveProduct = async () => {
    if (!currentTestProfile?.id) {
      showNotification("Selecciona o crea una empresa de prueba primero.", true);
      return;
    }
    if (!productForm.name.trim() || !productForm.description.trim()) {
      showNotification("El nombre y la descripción son obligatorios.", true);
      return;
    }
    setSavingProduct(true);
    try {
      const token = await user.getIdToken();
      const tagsArray = productForm.tags
        ? productForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        type: productForm.type,
        category: productForm.category.trim() || null,
        price: productForm.price.trim() || null,
        offerPrice: productForm.offerPrice.trim() || null,
        imageUrl: productForm.imageUrl.trim() || null,
        tags: tagsArray,
        profileId: currentTestProfile.id,
        keepOriginalPhoto: productForm.keepOriginalPhoto,
        fontStyle: productForm.fontStyle,
        includePriceInCopy: true,
      };

      if (editingProduct) {
        const res = await fetch("/api/catalogo", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: editingProduct.id, ...payload }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        showNotification("Producto actualizado.");
      } else {
        const res = await fetch("/api/catalogo", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        showNotification("Producto agregado al catálogo de prueba.");
      }

      setShowAddProductModal(false);
      setEditingProduct(null);
      await loadCatalog(currentTestProfile.id);
    } catch (e: any) {
      showNotification(e.message || "Error al guardar producto", true);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("¿Eliminar este ítem del catálogo de prueba?")) return;
    try {
      const token = await user.getIdToken();
      await fetch("/api/catalogo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      await loadCatalog(currentTestProfile?.id);
      showNotification("Ítem eliminado.");
    } catch (e) {
      showNotification("Error eliminando ítem", true);
    }
  };

  // Guardar Comandos de Agentes
  const handleSaveAgentCommands = async () => {
    if (!currentTestProfile?.id) {
      showNotification("Selecciona una empresa de prueba primero.", true);
      return;
    }
    setSavingAgents(true);
    try {
      await updateProfileById(currentTestProfile.id, {
        selectedPromptStyleIds: selectedStyleIds,
      });
      showNotification("¡Directrices y estilos de agentes guardados para esta empresa!");
    } catch (e: any) {
      showNotification(e.message || "Error al guardar comandos", true);
    } finally {
      setSavingAgents(false);
    }
  };

  // Ejecutar Radar de Nicho
  const handleRunRadar = async () => {
    const rubroActual = currentTestProfile?.rubro || brandForm.rubro;
    if (!rubroActual) {
      showNotification("Por favor especifica el Rubro / Industria en la pestaña Datos de Marca.", true);
      return;
    }
    setLoadingRadar(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/nicho/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          niche: rubroActual,
          userId: user.uid,
          businessId: currentTestProfile?.id || "demo",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al analizar radar");
      setRadarData(data.analysis || data);
      showNotification(`¡Radar de nicho analizado para ${rubroActual}!`);
    } catch (e: any) {
      showNotification(e.message || "Error en radar de nicho", true);
    } finally {
      setLoadingRadar(false);
    }
  };

  // Generar Estrategia Visual de Prueba
  const handleGenerateStrategy = async () => {
    setGeneratingStrategy(true);
    setStrategyPosts([]);
    try {
      const activePromotions = currentTestProfile?.promotions || brandForm.promotions;
      const activeRubro = currentTestProfile?.rubro || brandForm.rubro;

      const selectedStyles = HARDCODED_STYLES.filter((s) => selectedStyleIds.includes(s.id));

      const res = await fetch("/api/ai/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: strategyGoal,
          goalName: strategyGoal === "ventas" ? "Ventas & Conversión" : "Autoridad & Alcance",
          businessType: activeRubro,
          expectations: customAgentInstruction || "Generar posts visuales impactantes con fotos reales y llamados a la acción claros.",
          promotions: activePromotions,
          nicheContext: radarData ? JSON.stringify(radarData.trends || radarData.summary || "") : "",
          businessData: {
            businessName: currentTestProfile?.name || brandForm.name,
            phone: currentTestProfile?.phone || brandForm.phone,
            website: currentTestProfile?.website || brandForm.website,
            address: "Local Comercial",
          },
          userId: user.uid,
          profileId: currentTestProfile?.id || "demo",
          catalogUsage,
          catalogoItems: catalogItems.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            type: item.type,
            price: item.price || null,
            offerPrice: item.offerPrice || null,
            imageUrl: item.imageUrl || null,
            keepOriginalPhoto: item.keepOriginalPhoto !== false,
            fontStyle: item.fontStyle || "bold_modern",
            hasImage: Boolean(item.imageUrl && item.imageUrl.startsWith("http")),
          })),
          usePromptStyles: true,
          selectedPromptStyles: selectedStyles,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar estrategia");

      setStrategyPosts(data.strategy || []);
      showNotification(`¡Estrategia de prueba generada con ${data.strategy?.length || 0} publicaciones!`);
    } catch (e: any) {
      showNotification(e.message || "Error al generar la estrategia", true);
    } finally {
      setGeneratingStrategy(false);
    }
  };

  // Guardar Posts en Calendario
  const handleSaveToCalendar = async () => {
    if (strategyPosts.length === 0) return;
    setSavingToCalendar(true);
    try {
      const token = await user.getIdToken();
      for (const post of strategyPosts) {
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + (post.dayOffset || 1));

        await fetch("/api/generate-post", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            userId: user.uid,
            profileId: currentTestProfile?.id || "demo",
            text: `${post.content}\n\n${post.cta}`,
            idea: post.hook,
            type: post.format?.toLowerCase().includes("reel") ? "Reel" : "Post",
            scheduledFor: scheduledDate.toISOString(),
            status: "draft",
            imageUrl: post.baseImageUrl || post.previewUrl || null,
          }),
        });
      }
      showNotification("¡Publicaciones de prueba guardadas en el calendario bajo esta empresa!");
    } catch (e) {
      showNotification("Error guardando publicaciones en calendario", true);
    } finally {
      setSavingToCalendar(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-bold text-slate-400">
        Cargando Laboratorio...
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <span className="text-6xl mb-4">🔒</span>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Acceso Restringido</h2>
        <p className="text-slate-500 text-sm mb-6">
          Esta herramienta es un laboratorio de pruebas visuales reservado exclusivamente para la administración.
        </p>
        <Link
          href="/automatizacion-rrss/panel"
          className="px-6 py-3 bg-indigo-600 text-white font-black rounded-xl text-sm"
        >
          Volver al Panel Principal
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8 animate-in fade-in duration-200">
      
      {/* ── TOP HEADER / HERO DEL LABORATORIO ── */}
      <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-purple-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-52 h-52 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
                🧪 Modo Sandbox Aislado
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Sin Redes Reales
              </span>
              <span className="text-xs text-slate-400 font-mono">santisoftai@gmail.com</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Laboratorio de Pruebas & Empresas Demo
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium mt-1 max-w-2xl leading-relaxed">
              Configura marcas de prueba con fotos reales, calibra directrices de agentes, analiza radares de nicho y genera estrategias visuales para verificar cómo quedarán los posts antes de publicarlos en clientes reales.
            </p>
          </div>

          {/* Selector de Empresa de Prueba Activa */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-3 min-w-[280px] shrink-0">
            <div className="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center justify-between">
              <span>Empresa Activa en el Lab:</span>
              <span className="text-slate-400">{testProfiles.length} guardadas</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={currentTestProfile?.id || ""}
                onChange={(e) => {
                  if (e.target.value) handleSelectTestProfile(e.target.value);
                }}
                className="flex-1 bg-slate-900 border border-purple-700/50 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-400"
              >
                {testProfiles.length === 0 && <option value="">Sin empresas de prueba</option>}
                {testProfiles.map((tp) => (
                  <option key={tp.id} value={tp.id}>
                    {tp.icon || "🏢"} {tp.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-all shadow-md shrink-0"
                title="Crear nueva empresa de prueba"
              >
                + Nueva
              </button>
            </div>

            {isCurrentTest && (
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/10">
                <span className="text-purple-200 truncate font-medium">{currentTestProfile?.rubro || "Rubro no definido"}</span>
                {isMenuEnabled ? (
                  <button
                    onClick={() => setActiveTab("menu_qr")}
                    className="text-emerald-300 font-bold hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Carta QR Activa
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab("menu_qr")}
                    className="text-slate-400 hover:text-white font-medium flex items-center gap-1 shrink-0"
                  >
                    <span>📱</span>
                    Activar Carta QR
                  </button>
                )}
              </div>
            )}

            {!isCurrentTest && (
              <div className="text-[11px] text-amber-300 font-semibold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                ⚠️ No tienes empresas de prueba creadas. Haz clic en &quot;+ Nueva&quot; para crear tu primera empresa de prueba o usar una plantilla.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notificaciones */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl animate-in zoom-in-95">
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs font-bold rounded-2xl animate-in zoom-in-95">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Si no hay empresas de prueba creadas */}
      {!isCurrentTest ? (
        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-dashed border-purple-200 text-center space-y-4 shadow-sm animate-in fade-in">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner">
            🧪
          </div>
          <h3 className="text-xl font-black text-slate-900">
            Aún no tienes empresas de prueba creadas
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            El laboratorio te permite crear empresas ficticias (ej: Hamburgueserías, Cafeterías, Salones de Belleza) con fotos reales, cartas QR y catálogo completo para validar las estrategias de nuestros agentes antes de publicarlas.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-600/30 transition-all inline-flex items-center gap-2"
            >
              <span>+ Crear Primera Empresa de Prueba</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── BARRA DE PESTAÑAS (5 PILARES) ── */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab("marca")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 ${
            activeTab === "marca"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>🏪</span>
          <span>1. Datos de Marca</span>
        </button>

        <button
          onClick={() => setActiveTab("catalogo")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 ${
            activeTab === "catalogo"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>🛍️</span>
          <span>2. Catálogo ({catalogItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("menu_qr")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 ${
            activeTab === "menu_qr"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : isMenuEnabled
                ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-black shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>📱</span>
          <span>3. Carta Menú & QR</span>
          {isMenuEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("comandos")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 ${
            activeTab === "comandos"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>✨</span>
          <span>4. Comandos de Agentes</span>
        </button>

        <button
          onClick={() => setActiveTab("radar_estrategia")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 ${
            activeTab === "radar_estrategia"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>🚀</span>
          <span>5. Radar & Estrategia Visual</span>
          {strategyPosts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-purple-700 font-bold">
              {strategyPosts.length} posts
            </span>
          )}
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: DATOS DE MARCA (Sin Redes)                           */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === "marca" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">Identidad de Marca (Sin Redes Conectadas)</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Datos base de la empresa que nuestros agentes tomarán en cuenta al redactar copys y montar composiciones.
              </p>
            </div>
            <button
              onClick={handleSaveBrand}
              disabled={savingBrand}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <span>{savingBrand ? "Guardando..." : "💾 Guardar Marca"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo y Estampa */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                Logo de la Empresa
              </label>
              <div className="w-28 h-28 bg-white rounded-2xl border-2 border-dashed border-purple-200 flex items-center justify-center overflow-hidden mb-3 relative shadow-inner">
                {brandForm.logoUrl ? (
                  <img src={brandForm.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-4xl text-slate-300">🖼️</span>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs font-bold text-purple-600">
                    Subiendo...
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={logoInputRef}
                onChange={handleUploadLogo}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-xs"
              >
                {brandForm.logoUrl ? "Cambiar Logo" : "Subir Logo"}
              </button>

              <label className="mt-4 flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={brandForm.alwaysIncludeLogo}
                  onChange={(e) => setBrandForm({ ...brandForm, alwaysIncludeLogo: e.target.checked })}
                  className="accent-purple-600"
                />
                <span>Estampar logo en posts</span>
              </label>
            </div>

            {/* Campos Principales */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Empresa *</label>
                  <input
                    type="text"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    placeholder="Ej: Hamburguesería La Fusión"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rubro / Industria *</label>
                  <input
                    type="text"
                    value={brandForm.rubro}
                    onChange={(e) => setBrandForm({ ...brandForm, rubro: e.target.value })}
                    placeholder="Ej: Gastronomía & Hamburguesas Gourmet"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción del Negocio</label>
                <textarea
                  rows={3}
                  value={brandForm.businessDescription}
                  onChange={(e) => setBrandForm({ ...brandForm, businessDescription: e.target.value })}
                  placeholder="Describe qué vende, cuál es la calidad de sus productos y a quién va dirigido."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Promociones y Ofertas Frecuentes</label>
                <input
                  type="text"
                  value={brandForm.promotions}
                  onChange={(e) => setBrandForm({ ...brandForm, promotions: e.target.value })}
                  placeholder="Ej: 2x1 martes en Smash Burgers, 20% descuento con retiro en local."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Contacto Simulado y Estilo de Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Datos de Contacto Simulados</h4>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={brandForm.phone}
                  onChange={(e) => setBrandForm({ ...brandForm, phone: e.target.value })}
                  placeholder="Teléfono / WhatsApp de prueba (+56 9...)"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 shrink-0">
                  <input
                    type="checkbox"
                    checked={brandForm.includePhoneInCopy}
                    onChange={(e) => setBrandForm({ ...brandForm, includePhoneInCopy: e.target.checked })}
                    className="accent-purple-600"
                  />
                  <span>En copy</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={brandForm.website}
                  onChange={(e) => setBrandForm({ ...brandForm, website: e.target.value })}
                  placeholder="Sitio Web de prueba (https://...)"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 shrink-0">
                  <input
                    type="checkbox"
                    checked={brandForm.includeWebsiteInCopy}
                    onChange={(e) => setBrandForm({ ...brandForm, includeWebsiteInCopy: e.target.checked })}
                    className="accent-purple-600"
                  />
                  <span>En copy</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Estilo Visual por Defecto</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBrandForm({ ...brandForm, bannerStyle: "banner" })}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                    brandForm.bannerStyle === "banner"
                      ? "border-purple-600 bg-purple-50/60 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xl block mb-1">🏷️</span>
                  <div className="text-xs font-black text-slate-900">Cartel Publicitario</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Texto y precio superpuesto con tipografía atractiva.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBrandForm({ ...brandForm, bannerStyle: "clean" })}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                    brandForm.bannerStyle === "clean"
                      ? "border-purple-600 bg-purple-50/60 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xl block mb-1">📸</span>
                  <div className="text-xs font-black text-slate-900">Solo Fotografía Limpia</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Sin textos gráficos encima de la imagen.</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: CATÁLOGO (Productos & Servicios)                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === "catalogo" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Productos & Servicios de Prueba ({catalogItems.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Los productos cargados aquí son las referencias directas que nuestros agentes utilizarán para crear las publicaciones.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("menu_qr")}
                className={`px-3.5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${
                  isMenuEnabled
                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
                title="Ver Carta Menú Digital y Código QR de esta empresa"
              >
                <span>📱</span>
                <span>Carta Menú & QR {isMenuEnabled ? "(Activo)" : ""}</span>
              </button>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: "",
                    description: "",
                    type: "producto",
                    category: "",
                    price: "",
                    offerPrice: "",
                    imageUrl: "",
                    tags: "",
                    keepOriginalPhoto: true,
                    fontStyle: "bold_modern",
                  });
                  setShowAddProductModal(true);
                }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>+ Agregar Producto / Servicio</span>
              </button>
            </div>
          </div>

          {loadingCatalog ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">Cargando catálogo...</div>
          ) : catalogItems.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl">
              <span className="text-4xl">📦</span>
              <h4 className="text-sm font-bold text-slate-700 mt-2">Catálogo vacío</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Agrega productos con fotos reales, precios y ofertas para probar las estrategias de contenido y tu carta menú digital.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  + Agregar Primer Ítem
                </button>
                <button
                  onClick={() => setActiveTab("menu_qr")}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  📱 Configurar Carta Menú & QR
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {catalogItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border-2 border-slate-100 hover:border-purple-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Imagen con badges */}
                    <div className="h-44 bg-slate-100 relative overflow-hidden group">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl text-slate-300 font-black">
                          {item.type === "servicio" ? "🛠️" : "📦"}
                        </div>
                      )}

                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-xs">
                          {item.type}
                        </span>
                        {item.keepOriginalPhoto && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                            📸 Foto Real
                          </span>
                        )}
                      </div>

                      {item.offerPrice && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                          Oferta
                        </span>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="p-4">
                      <h4 className="text-sm font-black text-slate-900 line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex items-baseline gap-2 mt-3">
                        {item.offerPrice ? (
                          <>
                            <span className="text-sm font-black text-emerald-600">{item.offerPrice}</span>
                            <span className="text-xs text-slate-400 line-through font-bold">{item.price}</span>
                          </>
                        ) : (
                          <span className="text-sm font-black text-slate-800">{item.price || "Sin precio"}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Tipografía: {item.fontStyle || "bold"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingProduct(item);
                          setProductForm({
                            name: item.name,
                            description: item.description,
                            type: item.type,
                            category: item.category || "",
                            price: item.price || "",
                            offerPrice: item.offerPrice || "",
                            imageUrl: item.imageUrl || "",
                            tags: (item.tags || []).join(", "),
                            keepOriginalPhoto: item.keepOriginalPhoto !== false,
                            fontStyle: item.fontStyle || "bold_modern",
                          });
                          setShowAddProductModal(true);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-purple-600 hover:bg-white rounded-lg transition-all"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(item.id)}
                        className="px-2.5 py-1 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 3: CARTA MENÚ DIGITAL & CÓDIGO QR                        */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === "menu_qr" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Top Control Banner: Estado y Acciones de la Carta */}
          <div className={`p-6 sm:p-7 rounded-3xl border-2 transition-all ${
            isMenuEnabled
              ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-emerald-300 shadow-sm"
              : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md ${
                  isMenuEnabled ? "bg-emerald-600 text-white shadow-emerald-500/30" : "bg-slate-200 text-slate-500"
                }`}>
                  📱
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isMenuEnabled
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {isMenuEnabled ? "🟢 Carta Digital Activa" : "⚪ Carta Digital Inactiva"}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Empresa de Prueba: {currentTestProfile?.name || "Sin nombre"}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    Carta Menú Digital con Código QR
                  </h3>
                  <p className="text-xs text-slate-600 font-medium max-w-2xl mt-0.5 leading-relaxed">
                    {isMenuEnabled
                      ? `Cualquier cliente que escanee el código QR o acceda al enlace verá la carta en vivo con tus ${catalogItems.length} productos, fotos reales, precios y ofertas.`
                      : "Esta función permite a tus clientes escanear un código QR desde la mesa o vitrina para consultar el catálogo y hacer pedidos directos por WhatsApp."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleMenuDigital(!isMenuEnabled)}
                  disabled={togglingMenuDigital}
                  className={`px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-md flex items-center gap-2 ${
                    isMenuEnabled
                      ? "bg-white hover:bg-rose-50 text-rose-700 border-2 border-rose-200"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25"
                  }`}
                >
                  {isMenuEnabled ? (
                    <>
                      <FaToggleOn className="text-lg text-emerald-600" />
                      <span>{togglingMenuDigital ? "Actualizando..." : "Pausar Carta Digital"}</span>
                    </>
                  ) : (
                    <>
                      <FaToggleOff className="text-lg opacity-70" />
                      <span>{togglingMenuDigital ? "Activando..." : "✨ Activar Carta Menú Digital"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Main Grid: Columna Izquierda (Controles + Temas) / Columna Derecha (Simulador Móvil) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Columna Izquierda (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Tarjeta del Código QR y Enlace */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-purple-50 text-purple-600 rounded-xl text-lg font-black">
                      <FaQrcode />
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Código QR de la Empresa de Prueba
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Listo para descargar en alta definición o probar escaneando con tu teléfono.
                      </p>
                    </div>
                  </div>
                  {publicMenuUrl && (
                    <a
                      href={publicMenuUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <span>Abrir en nueva pestaña</span>
                      <FaExternalLinkAlt className="text-[10px]" />
                    </a>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Visualizador QR */}
                  <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-purple-200 flex flex-col items-center justify-center shrink-0 shadow-inner">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={`QR Carta ${currentTestProfile?.name}`}
                        className="w-44 h-44 rounded-xl shadow-xs"
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400 font-bold">
                        Generando QR...
                      </div>
                    )}
                    <span className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-wider">
                      {currentTestProfile?.icon || "🍽️"} {currentTestProfile?.name || "Carta Demo"}
                    </span>
                  </div>

                  {/* Acciones y Enlace Directo */}
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                        Enlace Público de la Carta:
                      </label>
                      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <input
                          type="text"
                          readOnly
                          value={publicMenuUrl}
                          className="flex-1 bg-transparent text-xs font-bold text-slate-700 px-2 outline-none select-all truncate"
                        />
                        <button
                          type="button"
                          onClick={copyQrLink}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-purple-700 font-black text-xs rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
                        >
                          {copiedQrLink ? <FaCheck className="text-emerald-600" /> : <FaCopy />}
                          <span>{copiedQrLink ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={downloadQr}
                        disabled={!qrDataUrl}
                        className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <FaDownload />
                        <span>Descargar PNG HD</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintTableTent}
                        disabled={!qrDataUrl}
                        className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <FaPrint />
                        <span>Imprimir Mesa / Display</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500 font-medium">
                      <span>🛍️ <b>{catalogItems.length}</b> productos</span>
                      <span>•</span>
                      <span>🏷️ <b>{itemsWithPrice}</b> con precio</span>
                      <span>•</span>
                      <span>💥 <b>{itemsWithOffer}</b> ofertas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selector de 5 Estilos y Fondos de Carta */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-lg font-black">
                      <FaPalette />
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Estilos Visuales & Fondos de Carta
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Selecciona uno de los 5 ambientes predeterminados para personalizar la presentación.
                      </p>
                    </div>
                  </div>
                  {savingMenuTheme && (
                    <span className="text-xs font-bold text-purple-600 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      Aplicando estilo...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {(Object.values(MENU_THEMES) as typeof MENU_THEMES[MenuThemeId][]).map((theme) => {
                    const isSelected = currentMenuThemeId === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => handleSelectMenuTheme(theme.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/40 shadow-sm ring-2 ring-purple-500/20"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-2xl">{theme.emoji}</span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                                style={{ backgroundColor: theme.preview.bg }}
                                title="Fondo"
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                                style={{ backgroundColor: theme.preview.accent }}
                                title="Color de Acento"
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                                style={{ backgroundColor: theme.preview.card }}
                                title="Tarjeta"
                              />
                            </div>
                          </div>

                          <h5 className="text-xs font-black text-slate-900 leading-tight">
                            {theme.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                            {theme.tagline}
                          </p>

                          <div className="text-[10px] text-slate-400 mt-2 font-semibold">
                            <b>Recomendado:</b> {theme.recommendedFor}
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {isSelected ? "Activo" : "Click para aplicar"}
                          </span>
                          {isSelected ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-black text-[10px] flex items-center gap-1 shadow-xs">
                              <FaCheck className="text-[9px]" /> Seleccionado
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-purple-600 group-hover:underline">
                              Seleccionar →
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botón rápido para ir al Catálogo */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700">
                  ¿Quieres agregar más productos, platos, fotos o precios a esta carta?
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("catalogo")}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-purple-700 font-black text-xs rounded-xl border border-slate-200 transition-all shrink-0"
                >
                  Ir al Catálogo ({catalogItems.length}) →
                </button>
              </div>

            </div>

            {/* Columna Derecha (5 cols): Simulador Móvil Interactivo */}
            <div className="lg:col-span-5 flex flex-col items-center space-y-3">
              <div className="w-full flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <FaMobileAlt className="text-purple-600" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Simulador Móvil en Vivo
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIframeKey((k) => k + 1)}
                    className="p-1.5 text-slate-500 hover:text-purple-600 rounded-lg text-xs font-bold transition-all"
                    title="Recargar vista previa"
                  >
                    <FaRedo className="text-xs" />
                  </button>
                  {publicMenuUrl && (
                    <a
                      href={publicMenuUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-purple-600 hover:underline flex items-center gap-1"
                    >
                      <span>Pantalla completa</span>
                      <FaExternalLinkAlt className="text-[9px]" />
                    </a>
                  )}
                </div>
              </div>

              {/* Marco de Smartphone */}
              <div className="w-full max-w-[360px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 relative">
                {/* Dynamic Island / Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950 mr-2" />
                  <div className="w-6 h-1 rounded-full bg-slate-950" />
                </div>

                {/* Pantalla con Iframe */}
                <div className="w-full h-[620px] rounded-[40px] overflow-hidden bg-white relative">
                  {publicMenuUrl ? (
                    <iframe
                      key={iframeKey}
                      src={`${publicMenuUrl}?preview=${iframeKey}`}
                      title={`Carta Digital ${currentTestProfile?.name}`}
                      className="w-full h-full border-0 select-none"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs font-bold">
                      Cargando vista previa...
                    </div>
                  )}
                </div>

                {/* Home Indicator */}
                <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
              </div>

              <p className="text-[11px] text-slate-400 font-medium text-center max-w-xs leading-snug">
                Así verán exactamente la carta tus clientes al escanear el código QR con cualquier teléfono móvil.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 4: COMANDOS DE AGENTES & ESTILOS VISUALES                */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === "comandos" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">Comandos & Estilos de Imagen para Agentes</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Selecciona qué directrices de tono y qué estilos fotográficos utilizarán nuestros agentes para esta empresa.
              </p>
            </div>
            <button
              onClick={handleSaveAgentCommands}
              disabled={savingAgents}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition-all"
            >
              <span>{savingAgents ? "Guardando..." : "💾 Guardar Comandos"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tono y Ángulo */}
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                Tono de Voz de los Agentes
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "directo_cercano", title: "Directo & Cercano (Tú a tú)", icon: "🤝", desc: "Humano, ágil y conversacional" },
                  { id: "urgencia_oferta", title: "Promocional & Ofertas", icon: "💥", desc: "Alto impacto de precios y descuentos" },
                  { id: "gourmet_elegante", title: "Elegante & Sensorial", icon: "🍷", desc: "Aspiracional, artesanal y detallista" },
                  { id: "educativo_valor", title: "Educativo & Autoridad", icon: "💡", desc: "Tips, beneficios y resolución de dudas" },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setAgentTone(tone.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      agentTone === tone.id
                        ? "border-purple-600 bg-purple-50/60 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xl block mb-1">{tone.icon}</span>
                    <div className="text-xs font-black text-slate-900">{tone.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{tone.desc}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Directriz personalizada adicional para los agentes (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={customAgentInstruction}
                  onChange={(e) => setCustomAgentInstruction(e.target.value)}
                  placeholder="Ej: Destacar siempre que el pan brioche es horneado todos los días y que la carne nunca se congela..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white resize-none"
                />
              </div>
            </div>

            {/* Estilos Visuales de Imagen */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                  Estilos de Imagen Activos ({selectedStyleIds.length} seleccionados)
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedStyleIds(HARDCODED_STYLES.map((s) => s.id))}
                  className="text-[11px] font-bold text-purple-600 hover:underline"
                >
                  Seleccionar todos
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {HARDCODED_STYLES.map((style) => {
                  const isChecked = selectedStyleIds.includes(style.id);
                  return (
                    <div
                      key={style.id}
                      onClick={() => {
                        setSelectedStyleIds((prev) =>
                          isChecked ? prev.filter((id) => id !== style.id) : [...prev, style.id]
                        );
                      }}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked
                          ? "border-purple-600 bg-purple-50/50 shadow-xs"
                          : "border-slate-100 hover:border-slate-200 bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 accent-purple-600 rounded"
                      />
                      <div>
                        <div className="text-xs font-black text-slate-900">{style.title}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                          {style.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 5: RADAR DE NICHO & ESTRATEGIA VISUAL                   */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === "radar_estrategia" && (
        <div className="space-y-8">
          
          {/* Radar de Nicho Widget */}
          <div className="bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 p-6 sm:p-8 rounded-3xl border-2 border-indigo-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-indigo-100 rounded-2xl">📡</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Radar de Nicho para {brandForm.rubro || "tu rubro"}</h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Descubre temas virales, dudas frecuentes y tendencias actuales en tu sector para incorporarlas a la estrategia.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRunRadar}
                disabled={loadingRadar}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center gap-2"
              >
                <span>{loadingRadar ? "Escaneando tendencias..." : "📡 Analizar Tendencias del Nicho"}</span>
              </button>
            </div>

            {radarData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-indigo-100 animate-in fade-in">
                <div className="bg-white/90 p-4 rounded-2xl border border-indigo-100">
                  <span className="text-[10px] font-black uppercase text-indigo-600 block mb-1">🔥 Tendencias Top</span>
                  <div className="text-xs font-bold text-slate-800 space-y-1">
                    {(radarData.trends || []).slice(0, 3).map((t: any, idx: number) => (
                      <div key={idx} className="line-clamp-1">• {t.topic || t.title || t}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/90 p-4 rounded-2xl border border-indigo-100">
                  <span className="text-[10px] font-black uppercase text-indigo-600 block mb-1">🎣 Ganchos Virales</span>
                  <div className="text-xs font-bold text-slate-800 space-y-1">
                    {(radarData.hooks || []).slice(0, 3).map((h: any, idx: number) => (
                      <div key={idx} className="line-clamp-1">• &quot;{h.hook || h}&quot;</div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/90 p-4 rounded-2xl border border-indigo-100">
                  <span className="text-[10px] font-black uppercase text-indigo-600 block mb-1">❓ Dudas Frecuentes</span>
                  <div className="text-xs font-bold text-slate-800 space-y-1">
                    {(radarData.questions || []).slice(0, 3).map((q: any, idx: number) => (
                      <div key={idx} className="line-clamp-1">• {q.question || q}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generador de Estrategia */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Generar Estrategia Visual de Prueba</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Nuestros agentes elaborarán publicaciones completas combinando el catálogo de la empresa con los estilos seleccionados.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateStrategy}
                  disabled={generatingStrategy}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
                >
                  <span>{generatingStrategy ? "Generando posts con agentes..." : "🚀 Generar Estrategia Visual"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Objetivo de la Estrategia</label>
                <select
                  value={strategyGoal}
                  onChange={(e) => setStrategyGoal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="ventas">💰 Ventas & Pedidos Directos</option>
                  <option value="autoridad">🎙️ Autoridad de Marca & Posicionamiento</option>
                  <option value="viralidad">🚀 Viralidad & Alcance Máximo</option>
                  <option value="comunidad">❤️ Comunidad & Fidelización</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enfoque del Catálogo</label>
                <select
                  value={catalogUsage}
                  onChange={(e) => setCatalogUsage(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="mixed">🌟 Mixto (Combinar productos con contenido de valor del nicho)</option>
                  <option value="all">🎯 Exclusivo (Todos los posts dedicados a productos del catálogo)</option>
                </select>
              </div>
            </div>

            {/* Selector de Vista de Resultados */}
            {strategyPosts.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">
                    Previsualización ({strategyPosts.length} posts creados)
                  </span>
                  <div className="flex items-center bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Grilla Detallada
                    </button>
                    <button
                      onClick={() => setViewMode("mockup")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        viewMode === "mockup" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      📱 Feed Celular
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveToCalendar}
                  disabled={savingToCalendar}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <span>{savingToCalendar ? "Guardando..." : "📅 Guardar en Calendario de Pruebas"}</span>
                </button>
              </div>
            )}

            {/* Grilla Detallada de Posts */}
            {strategyPosts.length > 0 && viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {strategyPosts.map((post, idx) => (
                  <div
                    key={idx}
                    className="rounded-3xl border-2 border-slate-100 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Cabecera del Post */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                          {post.format || "Post"}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          Día +{post.dayOffset} • {post.suggestedTime || "10:00"}
                        </span>
                      </div>

                      {/* Hook & Copy */}
                      <h4 className="text-sm font-black text-slate-900 mb-2 leading-tight">
                        &quot;{post.hook}&quot;
                      </h4>
                      <p className="text-xs text-slate-600 font-medium whitespace-pre-line mb-3 leading-relaxed">
                        {post.content}
                      </p>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-700 mb-3">
                        👉 {post.cta}
                      </div>

                      {/* Dirección visual / Foto del producto */}
                      <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block mb-1">
                          🎨 Dirección Visual del Agente:
                        </span>
                        <p className="text-[11px] text-purple-900 font-medium italic">
                          {post.imageDirection || post.visualStyle || "Fotografía de producto con composición publicitaria."}
                        </p>

                        {post.baseImageUrl && (
                          <div className="mt-2.5 rounded-lg overflow-hidden border border-purple-200 h-28 bg-white relative">
                            <img src={post.baseImageUrl} alt="Producto" className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Foto Real Vinculada
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${post.hook}\n\n${post.content}\n\n${post.cta}`);
                          showNotification("Copy copiado al portapapeles.");
                        }}
                        className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                      >
                        <span>📋 Copiar Copy</span>
                      </button>
                      <span className="text-[10px] font-bold text-slate-400">Post #{idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vista Feed Mockup Celular */}
            {strategyPosts.length > 0 && viewMode === "mockup" && (
              <div className="flex justify-center py-6">
                <div className="w-[360px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-800">
                  <div className="bg-white rounded-[2.5rem] overflow-hidden min-h-[580px] flex flex-col">
                    {/* Header Mock */}
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">
                          {brandForm.icon || "🏢"}
                        </span>
                        <span className="text-xs font-black text-slate-900 truncate max-w-[150px]">
                          {brandForm.name || "Marca Demo"}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Feed Demo</span>
                    </div>

                    {/* Grilla 3 columnas estilo Instagram */}
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 flex-1">
                      {strategyPosts.map((post, i) => (
                        <div key={i} className="aspect-square bg-slate-200 relative group overflow-hidden">
                          {post.baseImageUrl ? (
                            <img src={post.baseImageUrl} alt="Post" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700 flex flex-col items-center justify-center p-2 text-center text-white">
                              <span className="text-lg mb-1">{post.format === "Reel" ? "🎬" : "📸"}</span>
                              <span className="text-[9px] font-bold line-clamp-2 leading-tight">
                                {post.hook}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-white text-[10px] font-bold">
                            {post.cta}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}

      {/* ── MODAL AGREGAR / EDITAR PRODUCTO EN EL CATÁLOGO ── */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingProduct ? "Editar Ítem de Catálogo" : "Nuevo Ítem en Catálogo de Prueba"}
              </h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Ej: Hamburguesa Doble Cheddar"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
                <select
                  value={productForm.type}
                  onChange={(e) => setProductForm({ ...productForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                >
                  <option value="producto">Producto</option>
                  <option value="servicio">Servicio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  placeholder="Ej: Especiales, Promos"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Precio Normal</label>
                <input
                  type="text"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="Ej: $8.990"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Precio Oferta (Opcional)</label>
                <input
                  type="text"
                  value={productForm.offerPrice}
                  onChange={(e) => setProductForm({ ...productForm, offerPrice: e.target.value })}
                  placeholder="Ej: $7.490"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-600 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Descripción de Producto / Servicio *</label>
              <textarea
                rows={2}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Ingredientes, detalles de preparación o beneficios que los agentes destacarán."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white resize-none"
              />
            </div>

            {/* Foto Real */}
            <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">Foto Real del Producto</label>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://... URL de foto o usa el botón"
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                />
                
                <input
                  type="file"
                  ref={productImageRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    setUploadingProductImage(true);
                    try {
                      const storageRef = ref(storage, `users/${user.uid}/catalogo/${Date.now()}_${file.name}`);
                      await uploadBytes(storageRef, file);
                      const url = await getDownloadURL(storageRef);
                      setProductForm((prev) => ({ ...prev, imageUrl: url }));
                      showNotification("Foto de producto subida.");
                    } catch (err) {
                      showNotification("Error subiendo foto", true);
                    } finally {
                      setUploadingProductImage(false);
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => productImageRef.current?.click()}
                  disabled={uploadingProductImage}
                  className="px-3 py-1.5 bg-white border border-slate-300 font-bold text-xs text-slate-700 rounded-xl hover:bg-slate-100 shrink-0"
                >
                  {uploadingProductImage ? "..." : "Subir Foto"}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.keepOriginalPhoto}
                    onChange={(e) => setProductForm({ ...productForm, keepOriginalPhoto: e.target.checked })}
                    className="accent-purple-600"
                  />
                  <span>Usar foto real intocable (nuestros agentes solo montan el texto)</span>
                </label>
              </div>
            </div>

            {/* Tipografía */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estilo Tipográfico Preferido</label>
              <select
                value={productForm.fontStyle}
                onChange={(e) => setProductForm({ ...productForm, fontStyle: e.target.value as any })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
              >
                <option value="bold_modern">💥 Bold Promocional (Ofertas / Comida rápida / Rappi)</option>
                <option value="script_handwritten">✍️ Cursiva Cálida (Cafeterías / Panaderías)</option>
                <option value="elegant_serif">🍷 Elegante Serif (Gourmet / Salud / Estética)</option>
                <option value="clean_minimal">⚡ Moderno Sans (Limpio y directo)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={savingProduct || uploadingProductImage}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md"
              >
                {savingProduct ? "Guardando..." : "Guardar Ítem"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Nueva Empresa de Prueba */}
      <TestCompanyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userToken={userToken}
        onCompanyCreated={async () => {
          await loadProfiles();
          await loadCatalog();
        }}
      />
    </div>
  );
}
