"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import {
  FaGift,
  FaStar,
  FaCoffee,
  FaHeart,
  FaFire,
  FaCrown,
  FaCamera,
  FaKey,
  FaQrcode,
  FaInstagram,
  FaWhatsapp,
  FaCheckCircle,
  FaHistory,
  FaUtensils,
  FaTicketAlt,
  FaSignOutAlt,
  FaSpinner,
} from "react-icons/fa";

const STAMP_ICONS: Record<string, React.ReactNode> = {
  star: <FaStar />,
  coffee: <FaCoffee />,
  gift: <FaGift />,
  heart: <FaHeart />,
  fire: <FaFire />,
  crown: <FaCrown />,
};

export default function PublicFidelizaClientPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const loyaltyId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [member, setMember] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Formulario de registro/ingreso
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Modales de validación
  const [activeModal, setActiveModal] = useState<"none" | "pin" | "receipt" | "my_qr" | "redeem">("none");
  const [pinInput, setPinInput] = useState("");
  const [purchaseAmountInput, setPurchaseAmountInput] = useState("");
  const [selectedRewardCode, setSelectedRewardCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; title: string; text: string } | null>(null);
  const [memberQrUrl, setMemberQrUrl] = useState("");

  useEffect(() => {
    if (!loyaltyId) return;
    const urlPhone = searchParams.get("phone");
    const savedPhone =
      urlPhone ||
      (typeof window !== "undefined" ? localStorage.getItem(`sp_fideliza_phone_${loyaltyId}`) : null);

    loadClubData(savedPhone || undefined);
  }, [loyaltyId]);

  useEffect(() => {
    if (member?.cleanPhone && loyaltyId) {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://socialpilot.cl";
      const cashierScanUrl = `${origin}/fideliza/caja?id=${encodeURIComponent(loyaltyId)}&phone=${member.cleanPhone}`;
      QRCode.toDataURL(cashierScanUrl, { width: 400, margin: 2 }).then(setMemberQrUrl).catch(() => {});
    }
  }, [member?.cleanPhone, loyaltyId]);

  const loadClubData = async (phoneToFetch?: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = phoneToFetch ? `?phone=${encodeURIComponent(phoneToFetch)}` : "";
      const res = await fetch(`/api/public/fideliza/${loyaltyId}${query}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo cargar el club de beneficios");
      }
      setBusiness(data.business);
      setConfig(data.config);
      if (data.member) {
        setMember(data.member);
        setTransactions(data.transactions || []);
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterOrLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setSubmittingAuth(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/public/fideliza/${loyaltyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_or_login",
          name: nameInput,
          phone: phoneInput,
          email: emailInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al ingresar");

      setMember(data.member);
      if (typeof window !== "undefined") {
        localStorage.setItem(`sp_fideliza_phone_${loyaltyId}`, data.member.cleanPhone || phoneInput);
      }
      if (data.isNew && config?.welcomeBonus) {
        setFeedback({
          type: "success",
          title: "¡Bienvenido/a al Club!",
          text: "Hemos acreditado tu 1er sello de regalo por registrarte.",
        });
      }
      await loadClubData(data.member.cleanPhone || phoneInput);
    } catch (err: any) {
      setFeedback({ type: "error", title: "Atención", text: err.message });
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleValidatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim() || !member) return;
    setValidating(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/public/fideliza/${loyaltyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate_pin",
          memberId: member.id,
          pin: pinInput,
          purchaseAmount: Number(purchaseAmountInput) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo validar");

      setMember(data.member);
      setPinInput("");
      setPurchaseAmountInput("");
      setActiveModal("none");

      if (data.unlockedNewReward) {
        setFeedback({
          type: "success",
          title: "🎉 ¡Desbloqueaste tu Premio!",
          text: `Completaste la meta. Tu código de canje es ${data.latestRewardCode}.`,
        });
      } else {
        setFeedback({
          type: "success",
          title: "✅ ¡Sello Acreditado!",
          text: "Tu visita fue registrada correctamente.",
        });
      }
      await loadClubData(member.cleanPhone);
    } catch (err: any) {
      setFeedback({ type: "error", title: "No se pudo validar", text: err.message });
    } finally {
      setValidating(false);
    }
  };

  const compressImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1100;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = reject;
        img.src = ev.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !member) return;
    setValidating(true);
    setFeedback(null);
    try {
      const base64 = await compressImageToBase64(file);
      const res = await fetch(`/api/public/fideliza/${loyaltyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate_receipt",
          memberId: member.id,
          imageBase64: base64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al verificar la boleta");

      setMember(data.member);
      setActiveModal("none");
      setFeedback({
        type: "success",
        title: data.unlockedNewReward ? "🎉 ¡Premio Desbloqueado!" : "🧾 ¡Boleta Validada con Éxito!",
        text: data.unlockedNewReward
          ? `Has ganado: ${config?.rewardTitle}. Código: ${data.latestRewardCode}`
          : "Nuestros agentes verificaron tu comprobante y sumaron tu visita.",
      });
      await loadClubData(member.cleanPhone);
    } catch (err: any) {
      setFeedback({ type: "error", title: "Boleta no válida", text: err.message });
    } finally {
      setValidating(false);
      e.target.value = "";
    }
  };

  const handleInstagramBonus = async () => {
    if (!member) return;
    if (business?.instagramUsername) {
      const handle = business.instagramUsername.replace(/^@/, "").replace(/https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/$/, "");
      window.open(`https://instagram.com/${handle}`, "_blank");
    }
    setValidating(true);
    try {
      const res = await fetch(`/api/public/fideliza/${loyaltyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim_instagram_bonus",
          memberId: member.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMember(data.member);
      setFeedback({
        type: "success",
        title: "📸 ¡Sello Extra Acreditado!",
        text: "Gracias por seguirnos en Instagram. Sumamos +1 sello a tu tarjeta.",
      });
      await loadClubData(member.cleanPhone);
    } catch (err: any) {
      setFeedback({ type: "error", title: "Aviso", text: err.message });
    } finally {
      setValidating(false);
    }
  };

  const handleRedeemReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim() || !selectedRewardCode || !member) return;
    setValidating(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/public/fideliza/${loyaltyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cashier_redeem_reward",
          memberId: member.id,
          pin: pinInput,
          rewardCode: selectedRewardCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al canjear");

      setMember(data.member);
      setPinInput("");
      setActiveModal("none");
      setFeedback({
        type: "success",
        title: "🥳 ¡Premio Canjeado!",
        text: `Disfruta tu ${config?.rewardTitle}. ¡Gracias por tu preferencia!`,
      });
      await loadClubData(member.cleanPhone);
    } catch (err: any) {
      setFeedback({ type: "error", title: "No se pudo canjear", text: err.message });
    } finally {
      setValidating(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`sp_fideliza_phone_${loyaltyId}`);
    }
    setMember(null);
    setTransactions([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-300">Cargando Club de Beneficios...</p>
      </div>
    );
  }

  if (error || !business || !config) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="text-5xl mb-4">🎁</div>
        <h1 className="text-xl font-black mb-2">Club no disponible</h1>
        <p className="text-sm text-slate-400 max-w-xs">{error || "No encontramos este comercio."}</p>
      </div>
    );
  }

  const brandColor = config.primaryColor || "#FF6B00";
  const goal = Math.max(1, Number(config.targetGoal) || 4);
  const currentStamps = member?.stamps || 0;
  const remaining = Math.max(0, goal - currentStamps);
  const progressPct = Math.min(100, Math.round((currentStamps / goal) * 100));
  const stampIconNode = STAMP_ICONS[config.stampIcon || "star"] || <FaStar />;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16 selection:bg-orange-500 selection:text-white">
      {/* Cabecera superior con halo de color de marca */}
      <div
        className="relative overflow-hidden pt-8 pb-14 px-5 border-b border-white/10"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${brandColor}35 0%, #020617 75%)`,
        }}
      >
        <div className="max-w-md mx-auto flex flex-col items-center text-center">
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="w-20 h-20 rounded-3xl object-contain bg-white p-2 shadow-xl border border-white/20 mb-3"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black shadow-xl mb-3 text-white"
              style={{ backgroundColor: brandColor }}
            >
              {business.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-white/10 text-amber-300 border border-white/15 mb-2">
            ✨ {config.programName || "Club VIP"}
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white">{business.name}</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">{business.rubro}</p>

          {business.menuDigitalEnabled && (
            <Link
              href={`/menu/${loyaltyId}`}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-white border border-white/15 transition"
            >
              <FaUtensils className="text-amber-400" />
              <span>Ver Carta Digital / Catálogo</span>
            </Link>
          )}
        </div>
      </div>

      {/* Contenedor Principal Estilo Wallet */}
      <div className="max-w-md mx-auto px-4 -mt-8 space-y-5 relative z-10">
        {/* Mensaje de Alerta / Éxito */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-3 ${
              feedback.type === "success"
                ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-100"
                : "bg-rose-950/95 border-rose-500/40 text-rose-100"
            }`}
          >
            <div>
              <p className="text-xs font-black uppercase tracking-wider">
                {feedback.title}
              </p>
              <p className="text-xs mt-1 text-slate-200 leading-relaxed">{feedback.text}</p>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-white/60 hover:text-white text-sm font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* VISTA 1: CLIENTE AÚN NO IDENTIFICADO */}
        {!member ? (
          <div className="bg-slate-900/95 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 backdrop-blur-md">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 text-2xl mb-1">
                <FaGift />
              </div>
              <h2 className="text-lg font-black text-white">
                ¡Suma visitas y gana premios!
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Completa{" "}
                <strong className="text-white">
                  {goal} {config.mode === "visits" ? "visitas" : "puntos"}
                </strong>{" "}
                y llévate:{" "}
                <strong className="text-amber-400">{config.rewardTitle}</strong>
              </p>
              {config.welcomeBonus && (
                <p className="text-[11px] font-bold text-emerald-400 pt-1">
                  🎁 ¡Inscríbete hoy y recibe tu 1er sello gratis!
                </p>
              )}
            </div>

            <form onSubmit={handleRegisterOrLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tu Nombre
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Camila Soto"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 focus:border-orange-500 rounded-xl px-4 py-3 text-sm font-semibold text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tu WhatsApp (será tu N° de socio)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+56 9 1234 5678"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 focus:border-orange-500 rounded-xl px-4 py-3 text-sm font-semibold text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingAuth}
                className="w-full py-3.5 rounded-2xl font-black text-sm text-white shadow-lg transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: brandColor }}
              >
                {submittingAuth ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Activando tu tarjeta...</span>
                  </>
                ) : (
                  <>
                    <span>Abrir mi Tarjeta VIP</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-[11px] text-center text-slate-500">
              Si ya tienes cuenta, solo ingresa tu mismo número de WhatsApp para ver tus sellos.
            </p>
          </div>
        ) : (
          /* VISTA 2: TARJETA ACTIVA DEL SOCIO */
          <>
            {/* TARJETA VISUAL DE SELLOS (ESTILO WALLET) */}
            <div className="rounded-3xl p-6 shadow-2xl border border-white/15 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Socio/a Club VIP
                  </p>
                  <h2 className="text-lg font-black text-white">{member.name}</h2>
                  <p className="text-[11px] text-slate-400">{member.phone}</p>
                </div>
                <div className="text-right">
                  <span
                    className="inline-block px-3 py-1 rounded-2xl text-xs font-black text-white shadow"
                    style={{ backgroundColor: brandColor }}
                  >
                    {currentStamps} / {goal}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {config.mode === "visits" ? "Visitas" : "Puntos"}
                  </p>
                </div>
              </div>

              {/* Recompensa Meta */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 text-white shadow"
                  style={{ backgroundColor: brandColor }}
                >
                  <FaGift />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Tu Recompensa Meta
                  </p>
                  <p className="text-sm font-black text-white truncate">
                    {config.rewardTitle}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {remaining === 0
                      ? "¡Meta completada! Canjea tu premio."
                      : `Te ${remaining === 1 ? "falta 1 visita" : `faltan ${remaining} visitas`} para ganar.`}
                  </p>
                </div>
              </div>

              {/* Grilla de Sellos (si la meta es <= 12 mostramos casilleros individuales, sino barra) */}
              {goal <= 12 ? (
                <div className="grid grid-cols-4 gap-3 pt-1">
                  {Array.from({ length: goal }).map((_, idx) => {
                    const isFilled = idx < currentStamps;
                    const isLast = idx === goal - 1;
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-300 ${
                          isFilled
                            ? "border-amber-400 bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 scale-102"
                            : "border-white/10 bg-slate-950/70 text-slate-600"
                        }`}
                      >
                        <span className="text-xl">
                          {isFilled ? stampIconNode : isLast ? <FaGift className="text-amber-500/50" /> : idx + 1}
                        </span>
                        <span className="text-[9px] font-bold mt-1 uppercase opacity-80">
                          {isFilled ? "Listo" : isLast ? "Premio" : `Sello ${idx + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%`, backgroundColor: brandColor }}
                    />
                  </div>
                  <p className="text-xs text-right font-bold text-amber-400">{progressPct}% completado</p>
                </div>
              )}

              {config.rewardDescription && (
                <p className="text-[11px] text-slate-400 text-center italic">
                  {config.rewardDescription}
                </p>
              )}
            </div>

            {/* PREMIOS DESBLOQUEADOS LISTOS PARA CANJEAR */}
            {Array.isArray(member.pendingRewards) && member.pendingRewards.length > 0 && (
              <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-400 rounded-3xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
                  <FaTicketAlt />
                  <span>¡Tienes {member.pendingRewards.length} Premio(s) para Canjear!</span>
                </div>
                {member.pendingRewards.map((rw: any, i: number) => (
                  <div
                    key={i}
                    className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-black text-white">{rw.rewardTitle}</p>
                      <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                        Código: {rw.code}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRewardCode(rw.code);
                        setPinInput("");
                        setActiveModal("redeem");
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 transition cursor-pointer"
                    >
                      Canjear en Caja
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ACCIONES PARA SUMAR VISITA / SELLO */}
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                ¿Estás en el local o hiciste una compra?
              </h3>

              <div className="grid grid-cols-1 gap-2.5">
                {config.allowPinValidation !== false && (
                  <button
                    onClick={() => {
                      setPinInput("");
                      setActiveModal("pin");
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl font-black text-xs text-white flex items-center justify-between shadow-md transition hover:opacity-95 cursor-pointer"
                    style={{ backgroundColor: brandColor }}
                  >
                    <span className="flex items-center gap-2.5">
                      <FaKey className="text-base" />
                      <span>Validar con PIN del Cajero</span>
                    </span>
                    <span>→</span>
                  </button>
                )}

                {config.allowReceiptOcr !== false && (
                  <label className="w-full py-3.5 px-4 rounded-2xl font-black text-xs bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center justify-between transition cursor-pointer">
                    <span className="flex items-center gap-2.5">
                      {validating ? (
                        <FaSpinner className="animate-spin text-amber-400 text-base" />
                      ) : (
                        <FaCamera className="text-amber-400 text-base" />
                      )}
                      <span>
                        {validating
                          ? "Verificando boleta con nuestros agentes..."
                          : "Subir Foto de Boleta / Comprobante"}
                      </span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleReceiptUpload}
                      disabled={validating}
                      className="hidden"
                    />
                    <span>📷</span>
                  </label>
                )}

                <button
                  onClick={() => setActiveModal("my_qr")}
                  className="w-full py-3 px-4 rounded-2xl font-bold text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-white/10 flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <FaQrcode className="text-slate-400 text-base" />
                    <span>Mostrar mi QR de Socio al Cajero</span>
                  </span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* BONO EXTRA POR SEGUIR EN INSTAGRAM */}
            {config.instagramBonus && !member.instagramBonusClaimed && (
              <div className="bg-gradient-to-r from-pink-950/60 via-purple-950/60 to-indigo-950/60 border border-pink-500/30 rounded-3xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white text-lg shrink-0">
                    <FaInstagram />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">¡Gana +1 Sello Gratis!</p>
                    <p className="text-[11px] text-slate-300">
                      Sigue nuestro Instagram y suma un sello al instante.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleInstagramBonus}
                  disabled={validating}
                  className="px-3.5 py-2 rounded-xl bg-white text-slate-950 font-black text-xs shrink-0 hover:bg-slate-100 transition cursor-pointer"
                >
                  Seguir +1
                </button>
              </div>
            )}

            {/* HISTORIAL RECIENTE */}
            {transactions.length > 0 && (
              <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  <FaHistory />
                  <span>Últimos Movimientos</span>
                </div>
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0"
                    >
                      <div>
                        <p className="font-bold text-slate-200">{tx.note}</p>
                        <p className="text-[10px] text-slate-500">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("es-CL") : ""}
                        </p>
                      </div>
                      <span
                        className={`font-black ${
                          tx.type === "redeem" ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        {tx.type === "redeem" ? "Canjeado" : `+${tx.stampsAdded}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition"
              >
                <FaSignOutAlt />
                <span>Cambiar número de teléfono</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* MODAL: VALIDAR CON PIN DE CAJERO */}
      {activeModal === "pin" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-black text-white text-center">
              Validación en Mostrador
            </h3>
            <p className="text-xs text-slate-400 text-center">
              Pídele al cajero o encargado que ingrese su PIN de 4 dígitos para acreditar tu visita.
            </p>
            <form onSubmit={handleValidatePin} className="space-y-3">
              {(config.mode === "amount" || config.minPurchaseAmount > 0) && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Monto de Compra ($ CLP)
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 8500"
                    value={purchaseAmountInput}
                    onChange={(e) => setPurchaseAmountInput(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  PIN del Cajero
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  required
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-black text-white outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={validating}
                  className="flex-1 py-3 rounded-xl text-white text-xs font-black"
                  style={{ backgroundColor: brandColor }}
                >
                  {validating ? "Validando..." : "Confirmar Sello"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CANJEAR PREMIO EN CAJA */}
      {activeModal === "redeem" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <span className="text-3xl">🎁</span>
              <h3 className="text-lg font-black text-white mt-1">Canjear Recompensa</h3>
              <p className="text-xs font-mono font-bold text-amber-400 mt-1">
                Código: {selectedRewardCode}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Muéstrale esta pantalla al cajero para que ingrese su PIN y entregue tu{" "}
                <strong className="text-white">{config.rewardTitle}</strong>.
              </p>
            </div>
            <form onSubmit={handleRedeemReward} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                required
                placeholder="PIN Cajero"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-950 border border-white/20 rounded-xl px-4 py-3 text-center text-xl tracking-[0.3em] font-black text-white outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={validating}
                  className="flex-1 py-3 rounded-xl bg-amber-400 text-slate-950 text-xs font-black"
                >
                  {validating ? "Validando..." : "Confirmar Canje"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MI QR PERSONAL PARA EL CAJERO */}
      {activeModal === "my_qr" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
            <h3 className="text-lg font-black text-white">Tu QR de Socio</h3>
            <p className="text-xs text-slate-400">
              El cajero puede escanear este código o buscar tu teléfono{" "}
              <strong className="text-white">{member?.phone}</strong> en la terminal de caja.
            </p>
            {memberQrUrl && (
              <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-lg">
                <img src={memberQrUrl} alt="QR Socio" className="w-48 h-48" />
              </div>
            )}
            <button
              onClick={() => setActiveModal("none")}
              className="w-full py-3 rounded-xl bg-slate-800 text-white text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
