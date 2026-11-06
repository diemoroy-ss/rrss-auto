"use client";

import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../lib/firebase";
import {
  FaInstagram,
  FaSyncAlt,
  FaPlus,
  FaTrash,
  FaCheck,
  FaCopy,
  FaEye,
  FaWhatsapp,
} from "react-icons/fa";
import { FeedAuditDiagnosis, ExtractedProductItem, Plan14DayItem } from "../../types/demo-plan";
import Plan14DayViewer from "./Plan14DayViewer";

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

interface Plan14DayBuilderProps {
  initialBusiness?: string;
  initialOwner?: string;
  initialRubro?: string;
  initialPhone?: string;
  initialProducts?: ExtractedProductItem[];
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  storageFolder?: string;
  onPlanGenerated?: (result: {
    demoId: string;
    publicLink: string;
    whatsappMessage: string;
    plan14Days: Plan14DayItem[];
    feedAudit?: FeedAuditDiagnosis;
  }) => void;
}

export default function Plan14DayBuilder({
  initialBusiness = "",
  initialOwner = "",
  initialRubro = COMMON_NICHES[0].label,
  initialPhone = "",
  initialProducts = [],
  sellerName = "Asesor SocialPilot",
  sellerPhone,
  sellerEmail,
  storageFolder = "feed_audits",
  onPlanGenerated,
}: Plan14DayBuilderProps) {
  const [prospectBusiness, setProspectBusiness] = useState(initialBusiness);
  const [prospectName, setProspectName] = useState(initialOwner);
  const [countryCode, setCountryCode] = useState("+56");
  const [prospectPhone, setProspectPhone] = useState(initialPhone);
  const [rubro, setRubro] = useState(initialRubro);

  const [feedScreenshotFile, setFeedScreenshotFile] = useState<File | null>(null);
  const [feedScreenshotPreview, setFeedScreenshotPreview] = useState<string>("");
  const [isAnalyzingFeed, setIsAnalyzingFeed] = useState<boolean>(false);
  const [feedAuditData, setFeedAuditData] = useState<FeedAuditDiagnosis | null>(null);
  const [editableProducts, setEditableProducts] = useState<ExtractedProductItem[]>(initialProducts);

  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdIsPromo, setNewProdIsPromo] = useState(false);

  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [planGenerationStep, setPlanGenerationStep] = useState<string>("");
  const [generatedResult, setGeneratedResult] = useState<{
    demoId: string;
    publicLink: string;
    whatsappMessage: string;
    plan14Days: Plan14DayItem[];
    feedAudit?: FeedAuditDiagnosis;
  } | null>(null);

  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [copyWaSuccess, setCopyWaSuccess] = useState(false);

  useEffect(() => {
    if (initialBusiness && !prospectBusiness) setProspectBusiness(initialBusiness);
  }, [initialBusiness]);

  useEffect(() => {
    if (initialRubro) setRubro(initialRubro);
  }, [initialRubro]);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0 && editableProducts.length === 0) {
      setEditableProducts(initialProducts);
    }
  }, [initialProducts]);

  const handleFeedScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setFeedScreenshotPreview(base64);
      await runFeedAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  const runFeedAnalysis = async (imageBase64Override?: string) => {
    const imgData = imageBase64Override || feedScreenshotPreview;
    if (!imgData) {
      alert("Por favor sube una captura del feed de Instagram.");
      return;
    }
    setIsAnalyzingFeed(true);
    try {
      const res = await fetch("/api/vendedores/analyze-feed-screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imgData,
          prospectBusiness: prospectBusiness || undefined,
          rubro: rubro || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo analizar la captura con los agentes.");
      }
      setFeedAuditData(data.diagnosis);
      if (Array.isArray(data.diagnosis.extractedProducts) && data.diagnosis.extractedProducts.length > 0) {
        setEditableProducts(data.diagnosis.extractedProducts);
      }
    } catch (err: any) {
      console.error("Error analizando feed:", err);
      alert(err.message || "Error al analizar la captura con nuestros agentes.");
    } finally {
      setIsAnalyzingFeed(false);
    }
  };

  const handleAddProduct = () => {
    if (!newProdName.trim()) return;
    setEditableProducts((prev) => [
      ...prev,
      {
        name: newProdName.trim(),
        estimatedPrice: newProdPrice.trim() || undefined,
        isPromotion: newProdIsPromo,
      },
    ]);
    setNewProdName("");
    setNewProdPrice("");
    setNewProdIsPromo(false);
  };

  const handleRemoveProduct = (index: number) => {
    setEditableProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateProductPrice = (index: number, newPrice: string) => {
    setEditableProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, estimatedPrice: newPrice } : p))
    );
  };

  const handleGenerate14DayPlan = async () => {
    if (!prospectBusiness.trim()) {
      alert("Por favor ingresa el nombre del negocio o marca.");
      return;
    }
    setIsGeneratingPlan(true);
    setPlanGenerationStep("Nuestros agentes están diseñando los 14 días estratégicos...");

    try {
      let screenshotUrl = "";
      if (feedScreenshotFile) {
        try {
          setPlanGenerationStep("Guardando captura de Instagram...");
          const storageRef = ref(storage, `${storageFolder}/${Date.now()}_${feedScreenshotFile.name}`);
          const snap = await uploadBytes(storageRef, feedScreenshotFile);
          screenshotUrl = await getDownloadURL(snap.ref);
        } catch (uploadErr) {
          console.warn("No se pudo subir a Storage, continuando:", uploadErr);
        }
      }

      setPlanGenerationStep("Nuestros agentes están estructurando posts, historias y renderizando 4 imágenes ancla principales...");

      const fullPhone = prospectPhone.trim() ? `${countryCode}${prospectPhone.replace(/\D/g, "")}` : "";

      const res = await fetch("/api/vendedores/generate-14day-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectName: prospectName.trim() || undefined,
          prospectBusiness: prospectBusiness.trim(),
          prospectPhone: fullPhone || undefined,
          rubro: rubro || "Gastronomía & Restaurantes",
          feedScreenshotUrl: screenshotUrl || undefined,
          feedAudit: feedAuditData || undefined,
          products: editableProducts.length > 0 ? editableProducts : undefined,
          sellerName,
          sellerPhone,
          sellerEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al generar la propuesta de 14 días.");
      }

      const resultPayload = {
        demoId: data.demoId,
        publicLink: data.publicLink,
        whatsappMessage: data.whatsappMessage,
        plan14Days: data.plan14Days,
        feedAudit: data.feedAudit,
      };

      setGeneratedResult(resultPayload);
      if (onPlanGenerated) {
        onPlanGenerated(resultPayload);
      }
      setPlanGenerationStep("¡Planificación de 14 días lista!");

      setTimeout(() => {
        document.getElementById("builder-resultado-plan14")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (err: any) {
      console.error("Error generando plan 14 días:", err);
      alert(err.message || "Ocurrió un error al generar la planificación.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleDayRenderedLocally = (updatedDay: Plan14DayItem) => {
    if (!generatedResult) return;
    setGeneratedResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        plan14Days: prev.plan14Days.map((d) => (d.day === updatedDay.day ? updatedDay : d)),
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* PASO 1: DATOS BÁSICOS DEL PROSPECTO */}
      <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 text-xs font-black flex items-center justify-center border border-rose-100">
            1
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900">Datos de la Empresa / Prospecto</h2>
            <p className="text-[11px] text-slate-500">Información del negocio para personalizar la auditoría y propuesta de 14 días.</p>
          </div>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100 transition-all font-medium"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              WhatsApp de Contacto
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-2.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100 font-medium"
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
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100 transition-all font-medium"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100 font-medium"
            >
              {COMMON_NICHES.map((n) => (
                <option key={n.label} value={n.label}>
                  {n.icon} {n.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* PASO 2: ESCANEO DE FEED DE INSTAGRAM */}
      <section className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 text-xs font-black flex items-center justify-center border border-rose-100">
            2
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span>Auditoría de Feed de Instagram</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Visión Multimodal
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Sube una captura del Instagram del prospecto. Nuestros agentes analizarán el perfil, detectarán aciertos y fugas de venta, y extraerán los productos.
            </p>
          </div>
        </div>

        {/* DROPZONE */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Captura del Perfil o Feed
            </label>
            <div className="relative aspect-[4/5] rounded-2xl border-2 border-dashed border-slate-300 hover:border-rose-500 bg-slate-50 overflow-hidden flex flex-col items-center justify-center p-4 text-center transition-all cursor-pointer group">
              {feedScreenshotPreview ? (
                <>
                  <img
                    src={feedScreenshotPreview}
                    alt="Captura Feed"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white p-2">
                    <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl">
                      Cambiar Captura
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-xl mx-auto shadow-xs border border-rose-100">
                    <FaInstagram />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Arrastra o selecciona la captura de Instagram
                  </div>
                  <div className="text-[10px] text-slate-500">
                    PNG o JPG con publicaciones y bio visible
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFeedScreenshotChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {feedScreenshotPreview && (
              <button
                type="button"
                disabled={isAnalyzingFeed}
                onClick={() => runFeedAnalysis()}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                {isAnalyzingFeed ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin"></div>
                    <span>Analizando feed con agentes...</span>
                  </>
                ) : (
                  <>
                    <FaSyncAlt />
                    <span>Re-escanear Captura</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* DIAGNÓSTICO EN VIVO */}
          <div className="sm:col-span-7 space-y-3">
            {isAnalyzingFeed ? (
              <div className="h-full min-h-[280px] rounded-2xl border border-rose-100 bg-rose-50/40 p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-10 h-10 border-3 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs font-black text-slate-900">
                  Nuestros agentes están auditando el feed...
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Evaluando contraste visual, titulares con precios, frecuencia de fotos de apetito y extrayendo platos de la carta.
                </p>
              </div>
            ) : feedAuditData ? (
              <div className="space-y-3 animate-in fade-in duration-300">
                {/* Score */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">
                      Puntaje de Auditoría
                    </span>
                    <div className="text-xs text-slate-600 font-medium mt-0.5">
                      {feedAuditData.brandAestheticSummary}
                    </div>
                  </div>
                  <div className="text-center bg-white px-3 py-1.5 rounded-xl border border-rose-200 shrink-0">
                    <div className="text-xl font-black text-rose-600">
                      {feedAuditData.overallScore}/100
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Salud de Feed</div>
                  </div>
                </div>

                {/* Fugas */}
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <span>⚠️</span> 3 Oportunidades Clave / Fugas de Conversión:
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {(feedAuditData.detectedFlaws || []).map((flaw, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{flaw}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Fortalezas */}
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <span>✅</span> Fortalezas Actuales:
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {(feedAuditData.detectedStrengths || []).map((str, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[240px] rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
                <span className="text-2xl">📡</span>
                <p className="text-xs font-bold text-slate-700">Sin auditoría cargada aún</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Sube una captura de su Instagram a la izquierda para activar el diagnóstico en vivo y la extracción de productos.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PRODUCTOS / PLATOS EDITABLES */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>🍽️</span> Productos / Platos de la Carta ({editableProducts.length})
            </label>
            <span className="text-[10px] text-slate-500 font-medium">
              Nuestros agentes usarán estos productos para los 14 días.
            </span>
          </div>

          {editableProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {editableProducts.map((prod, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{prod.name}</span>
                      {prod.isPromotion && (
                        <span className="text-[9px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          PROMO
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={prod.estimatedPrice || ""}
                      onChange={(e) => handleUpdateProductPrice(idx, e.target.value)}
                      placeholder="Precio (ej. $9.990)"
                      className="mt-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-0.5 w-full focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar producto"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No se han detectado productos aún. Sube la captura para extraerlos o agrégalos manualmente:
            </p>
          )}

          {/* Input para agregar producto */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center pt-1">
            <input
              type="text"
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              placeholder="Nuevo plato o producto (ej. Chorrillana Manía)"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 font-medium"
            />
            <input
              type="text"
              value={newProdPrice}
              onChange={(e) => setNewProdPrice(e.target.value)}
              placeholder="Precio (ej. $12.990)"
              className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 font-medium"
            />
            <button
              type="button"
              onClick={handleAddProduct}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <FaPlus className="text-[10px]" /> Agregar
            </button>
          </div>
        </div>
      </section>

      {/* BOTÓN PRINCIPAL DE GENERACIÓN */}
      <div className="pt-2">
        <button
          type="button"
          disabled={isGeneratingPlan || !prospectBusiness.trim()}
          onClick={handleGenerate14DayPlan}
          className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-base shadow-lg shadow-rose-600/25 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
        >
          {isGeneratingPlan ? (
            <>
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-sm">{planGenerationStep || "Nuestros agentes están diseñando el plan de 14 días..."}</span>
            </>
          ) : (
            <>
              <span className="text-xl">✨</span>
              <span>Generar Auditoría + Plan 14 Días con Nuestros Agentes</span>
            </>
          )}
        </button>
      </div>

      {/* RESULTADO Y VISUALIZADOR DEL PLAN */}
      {generatedResult && (
        <section
          id="builder-resultado-plan14"
          className="bg-white border-2 border-rose-200 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-300"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Auditoría y Plan de 14 Días Listos para {prospectBusiness}
                </h3>
                <p className="text-xs text-slate-500">
                  Plan quincenal completo con diagnóstico de feed, radar de nicho y 4 imágenes ancla generadas.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 self-start sm:self-auto">
              14 DÍAS ACTIVOS
            </span>
          </div>

          {/* Enlace público y WhatsApp */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">
                🔗 Enlace Público de la Propuesta (Vista Cliente Aislada)
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Sin accesos internos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedResult.publicLink}
                className="flex-1 bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 select-all"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedResult.publicLink);
                  setCopyLinkSuccess(true);
                  setTimeout(() => setCopyLinkSuccess(false), 2500);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              >
                {copyLinkSuccess ? <FaCheck /> : <FaCopy />}
                <span>{copyLinkSuccess ? "Copiado" : "Copiar"}</span>
              </button>
              <a
                href={generatedResult.publicLink}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <FaEye /> <span>Abrir Demo</span>
              </a>
            </div>
          </div>

          {/* Mensaje de WhatsApp */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <FaWhatsapp className="text-emerald-600 text-base" /> Mensaje Personalizado de Prospección
              </label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedResult.whatsappMessage);
                  setCopyWaSuccess(true);
                  setTimeout(() => setCopyWaSuccess(false), 2500);
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
              >
                {copyWaSuccess ? <FaCheck className="text-emerald-600" /> : <FaCopy />}
                <span>{copyWaSuccess ? "¡Copiado!" : "Copiar Mensaje"}</span>
              </button>
            </div>
            <textarea
              rows={6}
              readOnly
              value={generatedResult.whatsappMessage}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 font-mono leading-relaxed"
            />
            {prospectPhone.trim() && (
              <a
                href={`https://wa.me/${countryCode}${prospectPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  generatedResult.whatsappMessage
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all"
              >
                <FaWhatsapp className="text-base" />
                <span>Enviar Propuesta por WhatsApp a {prospectName || prospectBusiness}</span>
              </a>
            )}
          </div>

          {/* VISUALIZADOR EMBEBIDO DEL PLAN */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Previsualización de los 14 Días Generados:
            </h4>
            <Plan14DayViewer
              plan14Days={generatedResult.plan14Days}
              businessName={prospectBusiness}
              rubro={rubro}
              demoId={generatedResult.demoId}
              showWatermark={true}
              onDayRendered={handleDayRenderedLocally}
            />
          </div>
        </section>
      )}
    </div>
  );
}
