"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  useProfile,
  DEFAULT_FIDELIZACION_CONFIG,
  type FidelizacionConfig,
  type CatalogoItem,
} from "../../../../contexts/ProfileContext";
import {
  FaGift,
  FaQrcode,
  FaUsers,
  FaCog,
  FaCopy,
  FaCheck,
  FaDownload,
  FaPrint,
  FaExternalLinkAlt,
  FaWhatsapp,
  FaInstagram,
  FaLock,
  FaReceipt,
  FaPlus,
  FaTrophy,
  FaCashRegister,
  FaRocket,
  FaToggleOn,
  FaToggleOff,
  FaSearch,
  FaCheckCircle,
  FaShieldAlt,
  FaSyncAlt,
} from "react-icons/fa";

const STAMP_ICONS = ["⭐", "☕", "🍔", "🍕", "🍣", "✂️", "💅", "🍺", "🛍️", "💎", "🔥", "🥐"];
const PRESET_COLORS = [
  { name: "Ámbar VIP", hex: "#f59e0b" },
  { name: "Esmeralda", hex: "#10b981" },
  { name: "Índigo", hex: "#6366f1" },
  { name: "Rosa Coral", hex: "#f43f5e" },
  { name: "Violeta", hex: "#8b5cf6" },
  { name: "Cian", hex: "#06b6d4" },
];

export default function FidelizacionPanelPage() {
  const router = useRouter();
  const { activeProfile, updateActiveProfile } = useProfile();

  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"config" | "kit" | "crm">("config");

  // Config state
  const [enabled, setEnabled] = useState<boolean>(false);
  const [config, setConfig] = useState<FidelizacionConfig>(DEFAULT_FIDELIZACION_CONFIG);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Catalog items for reward linking
  const [catalogItems, setCatalogItems] = useState<CatalogoItem[]>([]);

  // QR & Links
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copiedClub, setCopiedClub] = useState(false);
  const [copiedCaja, setCopiedCaja] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);

  // CRM Members state
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Sync profile config when activeProfile changes
  useEffect(() => {
    if (!activeProfile) return;
    setEnabled(activeProfile.fidelizacionEnabled === true);
    setConfig({
      ...DEFAULT_FIDELIZACION_CONFIG,
      ...(activeProfile.fidelizacionConfig || {}),
    });
  }, [activeProfile]);

  const profileId = activeProfile?.id || "default";

  const clubIdentifier = useMemo(() => {
    if (!user?.uid) return "";
    return `${user.uid}___${profileId}`;
  }, [user?.uid, profileId]);

  const publicClubUrl = useMemo(() => {
    if (!clubIdentifier) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://socialpilot.cl";
    return `${origin}/fideliza/${clubIdentifier}`;
  }, [clubIdentifier]);

  const cashierUrl = useMemo(() => {
    if (!clubIdentifier) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://socialpilot.cl";
    return `${origin}/fideliza/caja?id=${encodeURIComponent(clubIdentifier)}`;
  }, [clubIdentifier]);

  // Generate QR code
  useEffect(() => {
    if (!publicClubUrl) return;
    QRCode.toDataURL(publicClubUrl, {
      width: 900,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating Loyalty QR", err));
  }, [publicClubUrl]);

  // Load Catalog items so owner can pick a product as reward
  useEffect(() => {
    if (!user || !activeProfile?.id) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/catalogo?profileId=${activeProfile.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCatalogItems(data.items || []);
      } catch (e) {
        console.error("Error loading catalog for loyalty", e);
      }
    })();
  }, [user, activeProfile?.id]);

  // Load CRM Members
  const loadMembers = async () => {
    if (!clubIdentifier || !config.cashierPin) return;
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/public/fideliza/${encodeURIComponent(clubIdentifier)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cashier_list_members",
          pin: config.cashierPin,
        }),
      });
      const data = await res.json();
      if (res.ok && data.members) {
        setMembers(data.members);
      }
    } catch (e) {
      console.error("Error loading loyalty members", e);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "crm" && clubIdentifier) {
      loadMembers();
    }
  }, [activeTab, clubIdentifier]);

  const handleSaveConfig = async (overrideEnabled?: boolean) => {
    const nextEnabled = typeof overrideEnabled === "boolean" ? overrideEnabled : enabled;
    setSaving(true);
    setStatusMsg("");
    try {
      const cleanPin = String(config.cashierPin || "1234").replace(/\D/g, "").slice(0, 6) || "1234";
      const updatedConfig: FidelizacionConfig = {
        ...config,
        cashierPin: cleanPin,
        targetGoal: Math.max(2, Math.min(30, Number(config.targetGoal) || 5)),
        minPurchaseAmount: Math.max(0, Number(config.minPurchaseAmount) || 0),
        amountPerPoint: Math.max(100, Number(config.amountPerPoint) || 1000),
      };

      await updateActiveProfile({
        fidelizacionEnabled: nextEnabled,
        fidelizacionConfig: updatedConfig,
      });

      setEnabled(nextEnabled);
      setConfig(updatedConfig);
      setIframeKey((k) => k + 1);
      setStatusMsg("¡Configuración de Fidelización guardada y activa!");
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (e) {
      console.error("Error saving loyalty config", e);
      setStatusMsg("Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCatalogReward = (catalogItemId: string) => {
    if (!catalogItemId) {
      setConfig((prev) => ({ ...prev, rewardCatalogItemId: "", rewardProductId: "", rewardProductImage: "" }));
      return;
    }
    const found = catalogItems.find((i) => i.id === catalogItemId);
    if (found) {
      setConfig((prev) => ({
        ...prev,
        rewardCatalogItemId: found.id,
        rewardProductId: found.id,
        rewardProductImage: found.imageUrl || "",
        rewardTitle: `${found.name} ¡Gratis!`,
        rewardDescription: found.description || `Canjea tu ${found.name} sin costo al completar tu tarjeta.`,
      }));
    }
  };

  const handleManualStamp = async (member: any) => {
    if (!clubIdentifier) return;
    setActionLoadingId(member.id);
    try {
      const res = await fetch(`/api/public/fideliza/${encodeURIComponent(clubIdentifier)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate_pin",
          memberId: member.id,
          pin: config.cashierPin,
          bypassCooldown: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al sumar sello");
      await loadMembers();
      setStatusMsg(`Sello acreditado a ${member.name} (+WhatsApp enviado)`);
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleManualRedeem = async (member: any, rewardCode: string) => {
    if (!clubIdentifier) return;
    setActionLoadingId(member.id);
    try {
      const res = await fetch(`/api/public/fideliza/${encodeURIComponent(clubIdentifier)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cashier_redeem_reward",
          memberId: member.id,
          pin: config.cashierPin,
          rewardCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al canjear premio");
      await loadMembers();
      setStatusMsg(`Premio ${rewardCode} canjeado para ${member.name}`);
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePromoteOnSocialMedia = () => {
    const businessName = activeProfile?.name || "nuestro local";
    const ideaPrompt = `Lanzamiento oficial de nuestro ${config.programName} en ${businessName}. Por cada ${config.targetGoal} visitas te regalamos: ${config.rewardTitle}. ${
      config.welcomeBonus ? "Además, recibe tu primer sello gratis sólo por registrarte hoy escaneando nuestro código QR en el local o desde el link en nuestra biografía." : ""
    }`;
    router.push(`/automatizacion-rrss/panel/crear?idea=${encodeURIComponent(ideaPrompt)}`);
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    const cleanName = (activeProfile?.name || "mi-negocio").toLowerCase().replace(/[^a-z0-9]/g, "-");
    a.download = `qr-club-fidelizacion-${cleanName}.png`;
    a.click();
  };

  // CRM Metrics
  const crmStats = useMemo(() => {
    const totalMembers = members.length;
    const totalVisits = members.reduce((acc, m) => acc + (Number(m.totalVisits) || 0), 0);
    const totalRedeemed = members.reduce((acc, m) => acc + (Number(m.rewardsRedeemed) || 0), 0);
    const totalPending = members.reduce(
      (acc, m) => acc + (Array.isArray(m.pendingRewards) ? m.pendingRewards.length : 0),
      0
    );
    const totalSpent = members.reduce((acc, m) => acc + (Number(m.totalSpent) || 0), 0);
    return { totalMembers, totalVisits, totalRedeemed, totalPending, totalSpent };
  }, [members]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        (m.name || "").toLowerCase().includes(q) ||
        (m.phone || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
              <FaGift /> SocialPilot Fideliza · Retención Inteligente
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Club de Fidelización & Tarjeta de Sellos Digital
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Transforma compradores ocasionales en clientes frecuentes sin instalar apps. Tus clientes suman sellos validando con PIN en caja o fotografiando su boleta con nuestros agentes de visión, y reciben alertas automáticas por WhatsApp.
            </p>
          </div>

          {/* Master Switch */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Estado del Club</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    enabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                  }`}
                />
                <span className="font-black text-sm text-white">
                  {enabled ? "Club Activo para Clientes" : "Club Inactivo"}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleSaveConfig(!enabled)}
              disabled={saving}
              className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                enabled
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950"
              }`}
            >
              {enabled ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
              <span>{enabled ? "Activo (Desactivar)" : "Activar Club Ahora"}</span>
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div className="mt-4 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <FaCheckCircle className="text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-white/10">
          <button
            onClick={() => setActiveTab("config")}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "config"
                ? "bg-white text-slate-900 shadow-lg"
                : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <FaCog /> 1. Reglas, Premios y Seguridad
          </button>
          <button
            onClick={() => setActiveTab("kit")}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "kit"
                ? "bg-white text-slate-900 shadow-lg"
                : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <FaQrcode /> 2. Kit QR, Terminal de Caja y Difusión
          </button>
          <button
            onClick={() => setActiveTab("crm")}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "crm"
                ? "bg-white text-slate-900 shadow-lg"
                : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <FaUsers /> 3. Clientes Inscritos y Métricas ({members.length})
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: CONFIGURACIÓN Y REGLAS ===================== */}
      {activeTab === "config" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
          <div className="lg:col-span-7 space-y-6">
            {/* Bloque 1: Mecánica y Premio */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg">
                  🏆
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-base">Mecánica y Recompensa Principal</h2>
                  <p className="text-xs text-slate-500">Define cuántas visitas o compras necesita tu cliente y qué ganará.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de tu Club</label>
                  <input
                    type="text"
                    value={config.programName}
                    onChange={(e) => setConfig({ ...config, programName: e.target.value })}
                    placeholder="Ej: Club VIP, Coffee Lovers..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Acumulación</label>
                  <select
                    value={config.mode}
                    onChange={(e) => setConfig({ ...config, mode: e.target.value as "visits" | "amount" })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="visits">Por Visitas / Compras (Sellos)</option>
                    <option value="amount">Por Monto Gastado (Puntos)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {config.mode === "visits" ? "Meta de Sellos para el Premio" : "Meta de Puntos para el Premio"}
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={config.targetGoal}
                    onChange={(e) => setConfig({ ...config, targetGoal: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Recomendado: entre 4 y 8 visitas para alta motivación.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Compra Mínima para Sumar (CLP $)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={config.minPurchaseAmount || 0}
                    onChange={(e) => setConfig({ ...config, minPurchaseAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Deja en 0 si cualquier compra suma sello.</p>
                </div>
              </div>

              {/* Vincular con Catálogo */}
              {catalogItems.length > 0 && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
                  <label className="block text-xs font-black text-indigo-950 mb-1">
                    🛍️ Elegir premio desde tu Catálogo de Productos (Opcional)
                  </label>
                  <select
                    value={config.rewardCatalogItemId || ""}
                    onChange={(e) => handleSelectCatalogReward(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-indigo-200 text-xs font-bold text-slate-800 bg-white outline-none"
                  >
                    <option value="">-- Escribir premio personalizado manualmente --</option>
                    {catalogItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.price ? `($${item.price})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título del Premio / Recompensa</label>
                <input
                  type="text"
                  value={config.rewardTitle}
                  onChange={(e) => setConfig({ ...config, rewardTitle: e.target.value })}
                  placeholder="Ej: 1 Café de Especialidad Gratis / 50% Dcto en tu corte"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Condiciones o Descripción del Premio</label>
                <input
                  type="text"
                  value={config.rewardDescription}
                  onChange={(e) => setConfig({ ...config, rewardDescription: e.target.value })}
                  placeholder="Ej: Válido de lunes a viernes presentando tu código en caja."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Bloque 2: Validación Anti-Fraude */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                  <FaShieldAlt />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-base">Seguridad y Validación Anti-Fraude</h2>
                  <p className="text-xs text-slate-500">
                    Controla cómo se aprueban los sellos para que nadie sume puntos falsos.
                  </p>
                </div>
              </div>

              {/* PIN de Cajero */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FaLock className="text-amber-500" />
                    <span className="font-black text-sm text-slate-900">PIN Secreto de Cajero (Presencial)</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    El cajero ingresa este PIN en el celular del cliente o lo usa para entrar al Terminal de Caja (`/fideliza/caja`).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    maxLength={6}
                    value={config.cashierPin}
                    onChange={(e) =>
                      setConfig({ ...config, cashierPin: e.target.value.replace(/\D/g, "").slice(0, 6) })
                    }
                    className="w-28 text-center font-mono font-black text-lg tracking-widest px-3 py-2 rounded-xl border-2 border-amber-400 bg-white text-slate-900"
                    placeholder="1234"
                  />
                </div>
              </div>

              {/* Boleta OCR */}
              <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FaReceipt className="text-emerald-600" />
                    <span className="font-black text-sm text-slate-900">
                      Validación por Foto de Boleta / Voucher (Agentes de Visión)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Ideal para delivery o alto flujo: el cliente sube foto de su boleta o voucher Transbank/Getnet. Nuestros agentes verifican monto, fecha y bloquean folios repetidos automáticamente.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.allowReceiptOcr}
                  onChange={(e) => setConfig({ ...config, allowReceiptOcr: e.target.checked })}
                  className="mt-1 w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </label>

              {/* Max 1 por día */}
              <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <div className="space-y-1">
                  <span className="font-black text-sm text-slate-900 block">
                    🛡️ Escudo Anti-Abuso: Máximo 1 sello por cliente al día
                  </span>
                  <p className="text-xs text-slate-500">
                    Evita que un cliente divida su compra en varias boletas el mismo día para llenar la tarjeta de golpe.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.maxOnePerDay}
                  onChange={(e) => setConfig({ ...config, maxOnePerDay: e.target.checked })}
                  className="mt-1 w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Bloque 3: Aceleradores y Estilo */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
              <h2 className="font-black text-slate-900 text-base">Bonos de Bienvenida y Personalización</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">🎁 +1 Sello de Bienvenida</span>
                    <span className="text-[11px] text-slate-500">Al registrarse por primera vez</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.welcomeBonus}
                    onChange={(e) => setConfig({ ...config, welcomeBonus: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">📸 +1 Sello por Seguir en IG</span>
                    <span className="text-[11px] text-slate-500">Convierte clientes en seguidores</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.instagramBonus}
                    onChange={(e) => setConfig({ ...config, instagramBonus: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600"
                  />
                </label>
              </div>

              {/* Icono del sello */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Ícono de tus Sellos</label>
                <div className="flex flex-wrap gap-2">
                  {STAMP_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setConfig({ ...config, stampIcon: icon })}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all cursor-pointer ${
                        config.stampIcon === icon
                          ? "border-indigo-600 bg-indigo-50 scale-110 shadow-sm"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Color de la Tarjeta Digital</label>
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setConfig({ ...config, primaryColor: c.hex })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                        config.primaryColor === c.hex
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleSaveConfig()}
                  disabled={saving}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Guardando cambios..." : "💾 Guardar Configuración del Club"}
                </button>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Vista Previa Móvil */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 bg-slate-900 rounded-3xl p-5 text-white border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                    Simulador en Vivo
                  </span>
                  <h3 className="font-black text-sm">Así ven la tarjeta tus clientes</h3>
                </div>
                {publicClubUrl && (
                  <a
                    href={publicClubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5"
                  >
                    Abrir <FaExternalLinkAlt className="text-[10px]" />
                  </a>
                )}
              </div>

              <div className="rounded-2xl overflow-hidden border-4 border-slate-800 bg-slate-950 h-[560px]">
                {publicClubUrl ? (
                  <iframe
                    key={iframeKey}
                    src={publicClubUrl}
                    className="w-full h-full border-0"
                    title="Vista previa Fidelización"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Cargando vista previa...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: KIT QR, CAJA Y DIFUSIÓN ===================== */}
      {activeTab === "kit" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
            {/* Tarjeta 1: Link y QR del Cliente */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                  📱 1. Para tus Clientes
                </span>
                <h3 className="font-black text-lg text-slate-900">Enlace de la Tarjeta Digital</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pon este link en tu biografía de Instagram, envíalo por WhatsApp o imprímelo en el mostrador.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 break-all">
                  {publicClubUrl}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publicClubUrl);
                    setCopiedClub(true);
                    setTimeout(() => setCopiedClub(false), 2500);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedClub ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                  <span>{copiedClub ? "¡Link Copiado!" : "Copiar Link"}</span>
                </button>
                <a
                  href={publicClubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5"
                >
                  Ver <FaExternalLinkAlt />
                </a>
              </div>
            </div>

            {/* Tarjeta 2: Terminal de Caja para Empleados */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  <FaCashRegister /> 2. Para tu Personal / Cajero
                </span>
                <h3 className="font-black text-lg text-slate-900">Terminal de Caja Aislado</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tus empleados pueden abrir este link en la caja para sumar sellos o canjear premios usando sólo el PIN{" "}
                  <strong className="text-slate-900 font-mono bg-amber-100 px-1.5 py-0.5 rounded">
                    {config.cashierPin}
                  </strong>
                  , sin entrar a tus redes sociales.
                </p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 break-all">
                  {cashierUrl}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(cashierUrl);
                    setCopiedCaja(true);
                    setTimeout(() => setCopiedCaja(false), 2500);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedCaja ? <FaCheck /> : <FaCopy />}
                  <span>{copiedCaja ? "¡Copiado!" : "Copiar Link de Caja"}</span>
                </button>
                <a
                  href={cashierUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5"
                >
                  Abrir Caja <FaExternalLinkAlt />
                </a>
              </div>
            </div>

            {/* Tarjeta 3: Promoción en Redes con Agentes */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-black">
                  <FaRocket /> 3. Difusión Automática
                </span>
                <h3 className="font-black text-lg">Anuncia tu Club en Instagram y Facebook</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nuestros agentes redactan y diseñan un post invitando a tus seguidores a registrarse en tu{" "}
                  <strong>{config.programName}</strong> para ganar su <strong>{config.rewardTitle}</strong>.
                </p>
              </div>
              <button
                onClick={handlePromoteOnSocialMedia}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <FaRocket /> Crear Post Promocional Ahora
              </button>
            </div>
          </div>

          {/* Afiche Imprimible de Mostrador */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 print:hidden">
              <div>
                <h3 className="font-black text-lg text-slate-900">Afiche QR Listo para Imprimir (Mostrador / Mesas)</h3>
                <p className="text-xs text-slate-500">
                  Descarga el código QR o imprime el cartel directamente en tamaño A4 / Carta para tu local.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={downloadQr}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <FaDownload /> Descargar Sólo QR (PNG)
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <FaPrint /> Imprimir Cartel para Local
                </button>
              </div>
            </div>

            {/* Flyer Printable Area */}
            <div className="mt-6 max-w-md mx-auto bg-slate-950 text-white rounded-3xl p-8 text-center border-4 border-amber-500/40 shadow-2xl space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                {config.stampIcon} {config.programName}
              </div>
              <h2 className="text-2xl font-black leading-tight">{activeProfile?.name || "Nuestro Local"}</h2>
              <p className="text-amber-300 font-extrabold text-base">
                ¡Suma {config.targetGoal} visitas y gana {config.rewardTitle}!
              </p>

              {qrDataUrl && (
                <div className="bg-white p-4 rounded-3xl inline-block shadow-xl">
                  <img src={qrDataUrl} alt="QR Club Fidelización" className="w-56 h-56 mx-auto" />
                </div>
              )}

              <div className="space-y-1 text-xs text-slate-300">
                <p className="font-bold text-white text-sm">📱 Escanea con la cámara de tu celular</p>
                <p>Sin descargar aplicaciones · Recibe tus sellos en tu WhatsApp</p>
                {config.welcomeBonus && (
                  <p className="text-emerald-400 font-black pt-1">
                    🎁 ¡Recibe tu 1° sello GRATIS hoy sólo por registrarte!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: CLIENTES Y MÉTRICAS CRM ===================== */}
      {activeTab === "crm" && (
        <div className="space-y-6 print:hidden">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold uppercase text-slate-400">Socios Inscritos</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{crmStats.totalMembers}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold uppercase text-slate-400">Visitas / Sellos</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">{crmStats.totalVisits}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold uppercase text-slate-400">Premios por Canjear</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{crmStats.totalPending}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold uppercase text-slate-400">Premios Canjeados</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{crmStats.totalRedeemed}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
              <p className="text-[11px] font-bold uppercase text-slate-400">Compras Validadas</p>
              <p className="text-xl font-black text-slate-900 mt-1">
                ${crmStats.totalSpent.toLocaleString("es-CL")}
              </p>
            </div>
          </div>

          {/* Search & Refresh */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cliente por nombre, WhatsApp o correo..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadMembers}
                  disabled={loadingMembers}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <FaSyncAlt className={loadingMembers ? "animate-spin" : ""} /> Actualizar
                </button>
                <a
                  href={cashierUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2"
                >
                  <FaCashRegister /> Abrir Terminal de Caja
                </a>
              </div>
            </div>

            {loadingMembers ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">
                Cargando socios del club...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-base font-black text-slate-700">Aún no hay clientes registrados</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Comparte el enlace de tu Club o imprime el cartel QR de la pestaña anterior para que tus clientes empiecen a sumar visitas.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredMembers.map((member) => {
                  const pending: any[] = Array.isArray(member.pendingRewards) ? member.pendingRewards : [];
                  const cleanWa = String(member.phone || "").replace(/\D/g, "");
                  return (
                    <div
                      key={member.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{member.name}</span>
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                            {config.stampIcon} {member.currentStamps || 0} / {config.targetGoal}
                          </span>
                          {pending.length > 0 && (
                            <span className="text-xs font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <FaTrophy /> {pending.length} Premio(s) Listo(s)
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>📱 {member.phone}</span>
                          <span>· Visitas totales: {member.totalVisits || 0}</span>
                          <span>· Canjeados: {member.rewardsRedeemed || 0}</span>
                          {member.totalSpent > 0 && (
                            <span>· Gastado: ${Number(member.totalSpent).toLocaleString("es-CL")}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {cleanWa && (
                          <a
                            href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(
                              `¡Hola ${member.name}! Te escribimos de ${activeProfile?.name || "nuestro local"}. Tienes ${
                                member.currentStamps || 0
                              }/${config.targetGoal} sellos en tu tarjeta VIP.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5"
                          >
                            <FaWhatsapp /> WhatsApp
                          </a>
                        )}

                        <button
                          onClick={() => handleManualStamp(member)}
                          disabled={actionLoadingId === member.id}
                          className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <FaPlus /> +1 Sello
                        </button>

                        {pending.map((rew) => (
                          <button
                            key={rew.code}
                            onClick={() => handleManualRedeem(member, rew.code)}
                            disabled={actionLoadingId === member.id}
                            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <FaTrophy /> Canjear ({rew.code})
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
