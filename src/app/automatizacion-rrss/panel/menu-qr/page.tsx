"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { auth } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useProfile } from "../../../../contexts/ProfileContext";
import type { CatalogoItem } from "../../../../contexts/ProfileContext";
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
  FaWhatsapp, 
  FaStore, 
  FaTag, 
  FaMobileAlt, 
  FaPrint,
  FaList,
  FaArrowRight,
  FaPalette,
  FaToggleOn,
  FaToggleOff,
  FaCheckCircle
} from "react-icons/fa";

export default function MenuQrPage() {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const [savingTheme, setSavingTheme] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const { activeProfile, updateActiveProfile } = useProfile();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const profileId = activeProfile?.id || "default";
  const isMenuEnabled = activeProfile?.menuDigitalEnabled === true;
  const currentThemeId: MenuThemeId = (activeProfile?.menuTheme as MenuThemeId) || DEFAULT_MENU_THEME;

  // Deterministic menu URL
  const menuIdentifier = useMemo(() => {
    if (!user?.uid) return "";
    return `${user.uid}___${profileId}`;
  }, [user?.uid, profileId]);

  const publicUrl = useMemo(() => {
    if (!menuIdentifier) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://rrss.santisoft.cl";
    return `${origin}/menu/${menuIdentifier}`;
  }, [menuIdentifier]);

  // Generate QR code whenever the public URL is ready
  useEffect(() => {
    if (!publicUrl) return;

    QRCode.toDataURL(publicUrl, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR", err));
  }, [publicUrl]);

  // Load catalog items to display summary
  useEffect(() => {
    if (!user || !activeProfile?.id) return;
    loadItems();
  }, [user, activeProfile]);

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/catalogo?profileId=${activeProfile?.id || "default"}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error("Error loading items for menu QR", e);
    } finally {
      setLoadingItems(false);
    }
  };

  const copyToClipboard = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSelectTheme = async (themeId: MenuThemeId) => {
    if (themeId === currentThemeId) return;
    setSavingTheme(true);
    try {
      await updateActiveProfile({ menuTheme: themeId });
      setIframeKey((prev) => prev + 1);
      setStatusMsg(`Estilo "${MENU_THEMES[themeId].name}" aplicado a tu carta digital.`);
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (e) {
      console.error("Error actualizando tema:", e);
    } finally {
      setSavingTheme(false);
    }
  };

  const handleToggleMenu = async (enabled: boolean) => {
    setToggling(true);
    try {
      await updateActiveProfile({ menuDigitalEnabled: enabled });
      setIframeKey((prev) => prev + 1);
      setStatusMsg(enabled ? "Carta digital activada para tus clientes." : "Carta digital pausada temporalmente.");
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (e) {
      console.error("Error toggling menu:", e);
    } finally {
      setToggling(false);
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    const cleanName = (activeProfile?.name || "menu-digital")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    a.download = `codigo-qr-carta-${cleanName}.png`;
    a.click();
  };

  const handlePrintTableTent = () => {
    if (typeof window === "undefined" || !qrDataUrl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const brandName = activeProfile?.name || "Nuestra Carta";
    const brandRubro = activeProfile?.rubro || "Gastronomía";
    const logoHtml = activeProfile?.logoUrl 
      ? `<img src="${activeProfile.logoUrl}" style="max-height: 80px; max-width: 140px; margin: 0 auto 16px; object-fit: contain;" />` 
      : `<div style="font-size: 38px; margin-bottom: 12px;">🍽️</div>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Soporte de Mesa QR - ${brandName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;900&display=swap');
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              margin: 0;
              padding: 40px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: #f8fafc;
            }
            .card {
              width: 380px;
              background: #ffffff;
              border: 3px solid #0f172a;
              border-radius: 28px;
              padding: 40px 32px;
              text-align: center;
              box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            }
            .title {
              font-size: 26px;
              font-weight: 900;
              color: #0f172a;
              margin: 0 0 6px 0;
            }
            .rubro {
              font-size: 13px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 24px;
            }
            .qr-wrapper {
              background: #f1f5f9;
              padding: 20px;
              border-radius: 24px;
              display: inline-block;
              margin-bottom: 20px;
            }
            .qr-img {
              width: 240px;
              height: 240px;
              display: block;
            }
            .instruction {
              font-size: 18px;
              font-weight: 900;
              color: #4f46e5;
              margin: 0 0 6px 0;
            }
            .sub-instruction {
              font-size: 12px;
              color: #64748b;
              font-weight: 600;
              margin: 0;
            }
            .footer {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px dashed #cbd5e1;
              font-size: 10px;
              color: #94a3b8;
              font-weight: 700;
            }
            @media print {
              body { background: white; padding: 0; }
              .card { border: 2px solid #000; box-shadow: none; margin: auto; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            ${logoHtml}
            <h1 class="title">${brandName}</h1>
            <div class="rubro">${brandRubro}</div>
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" class="qr-img" />
            </div>
            <p class="instruction">📱 Escanea con tu cámara</p>
            <p class="sub-instruction">Revisa nuestra carta completa con fotos, precios y promociones actualizadas</p>
            <div class="footer">CARTA DIGITAL INTELIGENTE</div>
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

  const offerCount = useMemo(() => {
    return items.filter((i) => Boolean(i.offerPrice)).length;
  }, [items]);

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.category || "General").filter(Boolean)));
  }, [items]);

  // Si la carta no está habilitada
  if (!isMenuEnabled) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-slate-100 shadow-xl text-center">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm">
            📱
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3">
            Carta Menú Digital & Código QR
          </h1>
          <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium mb-8 leading-relaxed">
            Esta función te permite tener tu carta digital en línea para mesas, vitrinas, cartas físicas y redes sociales.
            Tus clientes podrán escanear tu código QR, ver los precios reales y enviar pedidos directo a tu WhatsApp.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10 text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-2xl block mb-2">📸</span>
              <h4 className="font-bold text-xs text-slate-900">Fotos Reales</h4>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Muestra las fotos exactas de tus platos y productos sin alteración.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-2xl block mb-2">🏷️</span>
              <h4 className="font-bold text-xs text-slate-900">Precios y Ofertas</h4>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Destaca promociones del día y valores normales actualizados.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-2xl block mb-2">🎨</span>
              <h4 className="font-bold text-xs text-slate-900">5 Estilos de Carta</h4>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Elige fondos y paletas: Gourmet, Cafetería, Botánico, Street Food o Minimal.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => handleToggleMenu(true)}
              disabled={toggling}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {toggling ? "Habilitando..." : "✨ Habilitar Carta Digital para mi Negocio"}
            </button>
            <Link
              href="/automatizacion-rrss/panel/catalogo"
              className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm transition-all"
            >
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Carta Menú Digital Habilitada
          </div>
          <h1 className="text-3xl font-black text-slate-900">
            Carta Digital de {activeProfile?.name || "tu Marca"}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Personaliza el estilo visual, descarga tu código QR en alta definición y comparte tu enlace con tus clientes.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => handleToggleMenu(false)}
            disabled={toggling}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs transition-all"
            title="Pausar la carta digital temporalmente"
          >
            <FaToggleOn className="text-emerald-600 text-base" />
            <span>Carta Activa (Click para pausar)</span>
          </button>
          <Link
            href="/automatizacion-rrss/panel/catalogo"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs transition-all shadow-xs"
          >
            <FaList /> Editar Platos & Precios
          </Link>
          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-md shadow-indigo-500/25 active:scale-95"
            >
              <FaExternalLinkAlt /> Ver en Vivo
            </a>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <FaCheckCircle className="text-emerald-600 text-sm" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* ── SECCIÓN 1: SELECTOR DE ESTILOS Y FONDOS DE CARTA (5 TEMAS) ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-100 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
              <FaPalette />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                Estilo Visual & Fondo de tu Carta Digital
              </h2>
              <p className="text-slate-400 text-xs font-medium">
                Selecciona uno de los 5 ambientes diseñados por defecto. Los cambios se reflejan al instante.
              </p>
            </div>
          </div>
          {savingTheme && (
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 self-start sm:self-auto">
              <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              Guardando estilo...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {(Object.values(MENU_THEMES) as typeof MENU_THEMES[MenuThemeId][]).map((theme) => {
            const isSelected = currentThemeId === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white"
                }`}
              >
                <div>
                  {/* Header / Swatch */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-2xl">{theme.emoji}</span>
                    <div className="flex items-center gap-1">
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: theme.preview.bg }}
                        title="Fondo"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: theme.preview.accent }}
                        title="Acento"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: theme.preview.card }}
                        title="Tarjeta"
                      />
                    </div>
                  </div>

                  <h3 className="text-xs font-black text-slate-900 leading-tight mb-1">
                    {theme.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-snug mb-3">
                    {theme.tagline}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 mt-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Ideal para:
                  </span>
                  <p className="text-[10px] text-slate-600 font-medium line-clamp-2">
                    {theme.recommendedFor}
                  </p>

                  <div className="mt-3">
                    {isSelected ? (
                      <span className="w-full py-1.5 rounded-xl bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-xs">
                        <FaCheck className="text-[10px]" /> Activo
                      </span>
                    ) : (
                      <span className="w-full py-1.5 rounded-xl bg-white group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 font-bold text-[11px] flex items-center justify-center border border-slate-200 transition-colors">
                        Elegir estilo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: QR Card + Details & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: QR Code Box (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-100 shadow-xl text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Código QR Activo y Permanente
              </span>
            </div>

            {/* QR Image Box */}
            <div className="p-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl inline-block shadow-inner mx-auto mb-6">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Carta Digital"
                  className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl shadow-sm"
                />
              ) : (
                <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* URL Display and Copy */}
            <div className="mb-6">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                Enlace Directo a tu Carta
              </label>
              <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="bg-transparent text-xs font-bold text-slate-700 flex-1 px-2 outline-none select-all truncate"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-600 font-black text-xs border border-slate-200 transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  {copied ? <FaCheck className="text-emerald-500" /> : <FaCopy />}
                  <span>{copied ? "Copiado" : "Copiar"}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={downloadQr}
                disabled={!qrDataUrl}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
              >
                <FaDownload />
                <span>Descargar PNG HD</span>
              </button>

              <button
                onClick={handlePrintTableTent}
                disabled={!qrDataUrl}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <FaPrint />
                <span>Imprimir Mesa / Flyer</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400 font-semibold">
              <span>💡</span> Ideal para imprimir en acrílicos, servilleteros, cartas impresas o stickers.
            </div>
          </div>

          {/* Catalog Stats & Highlights */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-md">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <FaStore className="text-indigo-600" />
              <span>Estado de la Carta Digital</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-2xl font-black text-slate-900">{items.length}</span>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Productos / Platos</p>
              </div>
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                <span className="text-2xl font-black text-rose-600">{offerCount}</span>
                <p className="text-xs text-rose-700 font-bold mt-0.5">Promos Activas</p>
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Categorías en la Carta ({categories.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-100">
              <Link
                href="/automatizacion-rrss/panel/catalogo"
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center justify-between"
              >
                <span>Administrar y añadir más platos</span>
                <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Live Mobile Mockup / Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaMobileAlt className="text-indigo-600 text-lg" />
              <h2 className="text-lg font-black text-slate-900">Vista Previa Móvil</h2>
              <span className="text-xs text-slate-400 font-medium">
                ({MENU_THEMES[currentThemeId]?.name})
              </span>
            </div>
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>Pantalla completa</span>
                <FaExternalLinkAlt className="text-[10px]" />
              </a>
            )}
          </div>

          {/* Smartphone Mockup Frame */}
          <div className="relative mx-auto max-w-[420px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800">
            {/* Speaker & camera notch */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-950/80 mr-3" />
              <div className="w-8 h-1.5 rounded-full bg-slate-950/80" />
            </div>

            {/* Mockup screen with iframe */}
            <div className="relative w-full h-[680px] rounded-[36px] overflow-hidden bg-white">
              {publicUrl ? (
                <iframe
                  key={iframeKey}
                  src={`${publicUrl}?preview=${iframeKey}`}
                  title="Vista Previa de la Carta"
                  className="w-full h-full border-0 select-none"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                  Cargando vista previa...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
