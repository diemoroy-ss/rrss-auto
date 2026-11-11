"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductEcosystemBar from "../../components/landings/ProductEcosystemBar";
import ProductEcosystemFooter from "../../components/landings/ProductEcosystemFooter";

interface LoyaltyCard {
  memberId: string;
  clubId: string;
  merchantCode?: string;
  businessName: string;
  rubro?: string;
  logoUrl?: string | null;
  programName: string;
  rewardTitle: string;
  targetGoal: number;
  currentStamps: number;
  stampsRemaining: number;
  progressPercent: number;
  totalVisits: number;
  rewardsEarned: number;
  rewardsRedeemed: number;
  pendingRewards: Array<{ code: string; rewardTitle: string; createdAt: string }>;
  pendingRewardsCount: number;
  hasRewardReady: boolean;
  stampIcon: string;
  cleanPhone: string;
  lastVisitAt?: string | null;
  cardUrl: string;
}

type ClubPresetKey = "cafeteria" | "barberia" | "restaurante";

const CLUB_PRESETS: Record<
  ClubPresetKey,
  {
    label: string;
    businessName: string;
    programName: string;
    stampIcon: string;
    targetGoal: number;
    initialStamps: number;
    rewardTitle: string;
    rewardValue: string;
    ruleText: string;
  }
> = {
  cafeteria: {
    label: "Cafetería / Pastelería",
    businessName: "Tostaduría Central",
    programName: "Club Amantes del Café",
    stampIcon: "☕",
    targetGoal: 6,
    initialStamps: 4,
    rewardTitle: "Cappuccino Doble + Croissant de Mantequilla Gratis",
    rewardValue: "Valor premio: $6.490",
    ruleText: "1 sello por cada compra sobre $3.500",
  },
  barberia: {
    label: "Barbería / Estética",
    businessName: "estudio Nomo Barber",
    programName: "Club Clientes Frecuentes",
    stampIcon: "✂️",
    targetGoal: 5,
    initialStamps: 3,
    rewardTitle: "Corte Clásico + Perfilado de Barba con 50% OFF",
    rewardValue: "Ahorro cliente: $9.000",
    ruleText: "1 sello por cada sesión agendada",
  },
  restaurante: {
    label: "Restaurante / Local",
    businessName: "Koi Nikkei & Ramen",
    programName: "Pasaporte Koi VIP",
    stampIcon: "🍜",
    targetGoal: 5,
    initialStamps: 4,
    rewardTitle: "Entrada de Gyozas o Postre de la Casa Gratis",
    rewardValue: "Vinculado a Carta QR",
    ruleText: "1 sello por cada visita en salón o retiro",
  },
};

const FAQS_FIDELIZA = [
  {
    q: "¿Mis clientes tienen que descargar una aplicación en App Store o Google Play?",
    a: "No. Esa es la razón por la que Fideliza funciona en la fila de la caja: el cliente solo da su número de teléfono (o escanea el QR de tu mostrador) y ve su tarjeta de sellos directo en el navegador de su celular en 3 segundos.",
  },
  {
    q: "¿Cómo evito que alguien se agregue sellos solo o falsifique un premio?",
    a: "Ningún cliente puede sumarse puntos por su cuenta. Cada sello o canje se registra únicamente desde la Terminal de Caja (/fideliza/caja) protegida por el PIN privado de tu comercio, dejando registro de fecha, hora y movimiento.",
  },
  {
    q: "¿Puedo contratar SocialPilot Fideliza sin contratar Marketing ni Carta QR?",
    a: "Sí. Puedes contratar o activar SocialPilot Fideliza como un módulo independiente para tu comercio. Y si también usas Carta QR o Marketing, tus productos ya registrados sirven para configurar tus recompensas sin volver a digitarlos.",
  },
  {
    q: "¿Cómo cobra su premio el cliente cuando completa la meta de visitas?",
    a: "Al alcanzar la meta (por ejemplo, 6 de 6 sellos), el sistema desbloquea la recompensa en la tarjeta del cliente y genera un código único de canje. Tu cajero ingresa ese código o el teléfono del cliente en la Terminal de Caja, valida el premio con su PIN y el contador se reinicia para un nuevo ciclo.",
  },
  {
    q: "¿Qué pasa si el cliente cambia de teléfono o borra su historial?",
    a: "No pierde absolutamente nada. Sus sellos e historial están asociados a su número de WhatsApp/teléfono en la nube de SocialPilot, no a un cartón físico ni a una cookie temporal.",
  },
];

function FidelizaLandingAndWalletContent() {
  const searchParams = useSearchParams();

  // Simulator State (Merchant Landing)
  const [selectedClub, setSelectedClub] = useState<ClubPresetKey>("cafeteria");
  const [simStamps, setSimStamps] = useState<number>(CLUB_PRESETS.cafeteria.initialStamps);
  const [redeemedInSim, setRedeemedInSim] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Real Customer Wallet State (Preserved 100% for existing customers)
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [phone, setPhone] = useState("");
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [error, setError] = useState("");

  const activeClub = CLUB_PRESETS[selectedClub];
  const isGoalReached = simStamps >= activeClub.targetGoal;

  // Handle preset change
  const handleSelectClub = (key: ClubPresetKey) => {
    setSelectedClub(key);
    setSimStamps(CLUB_PRESETS[key].initialStamps);
    setRedeemedInSim(false);
  };

  // Auto-open customer wallet if ?phone= or ?billetera=1 is in URL
  useEffect(() => {
    const queryPhone = searchParams.get("phone");
    const walletParam = searchParams.get("billetera");
    const storedPhone =
      typeof window !== "undefined" ? localStorage.getItem("sp_fideliza_phone") : null;

    if (queryPhone) {
      setShowWalletModal(true);
      setPhone(queryPhone);
      fetchCards(queryPhone);
    } else if (walletParam === "1") {
      setShowWalletModal(true);
      if (storedPhone) {
        setPhone(storedPhone);
        fetchCards(storedPhone);
      }
    }
  }, [searchParams]);

  const fetchCards = async (targetPhone: string) => {
    const cleanDigits = targetPhone.replace(/\D/g, "");
    if (!cleanDigits || cleanDigits.length < 8) {
      setError("Por favor ingresa al menos 8 dígitos de tu número de teléfono.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/public/fideliza/lookup?phone=${encodeURIComponent(targetPhone.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al consultar tus tarjetas");

      setCards(data.cards || []);
      setSearched(true);
      setActivePhone(data.phone || cleanDigits.slice(-9));

      if (typeof window !== "undefined") {
        localStorage.setItem("sp_fideliza_phone", targetPhone.trim());
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setShowWalletModal(true);
    fetchCards(phone.trim());
  };

  return (
    <div className="min-h-screen bg-[#F5F9F6] text-[#0F172A] selection:bg-[#047857]/15 selection:text-[#047857]">
      {/* 1. Institutional & Product Navigation */}
      <ProductEcosystemBar
        vertical="fideliza"
        productBadge="Fideliza"
        accentColorClass="text-[#065F46]"
        accentBgClass="bg-[#047857]/10"
        accentBorderClass="border-[#047857]/30"
        ctaLabel="Crear mi Club de Fidelización"
        ctaHref="/registro?plan=crecimiento"
        secondaryAction={{
          label: "Soy cliente: Ver mis sellos",
          onClick: () => setShowWalletModal(true),
        }}
        navItems={[
          { label: "Simulador en Vivo", href: "#simulador" },
          { label: "Consultar Sellos", href: "#billetera-clientes" },
          { label: "Control en Caja", href: "#control-caja" },
          { label: "Casos de Uso", href: "#casos" },
          { label: "Planes", href: "#planes" },
          { label: "Preguntas", href: "#faq" },
        ]}
      />

      <main>
        {/* 2. HERO SECTION: Interactive Loyalty Stamp & Cashier Validation Simulator */}
        <section id="simulador" className="relative border-b border-emerald-950/10 pt-10 pb-20 lg:pt-16 lg:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
              {/* Left Column: Value Proposition */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/20 bg-emerald-950/5 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#065F46]">
                  <span className="h-2 w-2 rounded-full bg-[#047857]" />
                  <span>SocialPilot Fideliza · Retención de Clientes</span>
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-[52px] lg:leading-[1.06]">
                  Convierte una visita casual en tu{" "}
                  <span className="font-serif italic font-normal text-[#047857]">
                    cliente de todas las semanas.
                  </span>
                </h1>

                <p className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-600">
                  Tarjetas de sellos y recompensas digitales que funcionan en 5 segundos con el número de teléfono de tu cliente. Sin instalar aplicaciones en el celular, sin cartones que se pierden y con validación antifraude en tu caja.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                  <Link
                    href="/registro?plan=crecimiento"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#047857] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#047857]/20 hover:bg-[#065F46] transition-all"
                  >
                    <span>Activar Fideliza en mi negocio</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowWalletModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <span>🔍 Soy cliente: Consultar mis sellos</span>
                  </button>
                </div>

                {/* Key Proof Metrics */}
                <div className="grid grid-cols-3 gap-4 border-t border-emerald-950/10 pt-6">
                  <div>
                    <p className="font-mono text-2xl font-bold text-slate-950">0 Apps</p>
                    <p className="mt-0.5 text-xs text-slate-600">Se abre directo en el navegador del celular</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-slate-950">5 seg</p>
                    <p className="mt-0.5 text-xs text-slate-600">Para sumar un sello en caja con el teléfono</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-[#047857]">PIN Caja</p>
                    <p className="mt-0.5 text-xs text-slate-600">Validación antifraude de cada canje</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Loyalty Card & Cashier Simulator */}
              <div className="lg:col-span-6">
                <div className="rounded-[32px] border border-emerald-950/15 bg-white p-5 sm:p-7 shadow-[0_24px_60px_-15px_rgba(6,55,41,0.12)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#065F46]">
                      Simulador Interactivo · Prueba sumar un sello
                    </span>
                    <Link
                      href="/fideliza/caja"
                      className="font-mono text-[11px] font-bold text-slate-600 hover:text-slate-950 underline"
                    >
                      Ver Terminal de Caja real ↗
                    </Link>
                  </div>

                  {/* Selector de Rubro */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(Object.keys(CLUB_PRESETS) as ClubPresetKey[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleSelectClub(k)}
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all cursor-pointer ${
                          selectedClub === k
                            ? "border-[#063729] bg-[#063729] text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {CLUB_PRESETS[k].label}
                      </button>
                    ))}
                  </div>

                  {/* Digital Loyalty Pass Card */}
                  <div className="mt-4 rounded-3xl bg-gradient-to-br from-[#063729] via-[#064E3B] to-[#042F24] p-5 sm:p-6 text-white shadow-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          {activeClub.programName}
                        </span>
                        <h3 className="text-xl font-bold text-white mt-0.5">
                          {activeClub.businessName}
                        </h3>
                        <p className="text-xs text-emerald-100/80 mt-0.5">
                          {activeClub.ruleText}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 border border-white/15 px-3.5 py-2 text-right font-mono">
                        <span className="text-xs text-amber-300 mr-1">{activeClub.stampIcon}</span>
                        <span className="text-lg font-black text-white">{simStamps}</span>
                        <span className="text-xs text-emerald-200"> / {activeClub.targetGoal}</span>
                      </div>
                    </div>

                    {/* Stamp Grid */}
                    <div className="mt-5 grid grid-cols-6 gap-2.5">
                      {Array.from({ length: activeClub.targetGoal }).map((_, idx) => {
                        const earned = idx < simStamps;
                        return (
                          <div
                            key={idx}
                            className={`aspect-square rounded-2xl flex items-center justify-center text-base font-black transition-all duration-300 ${
                              earned
                                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 scale-105"
                                : "bg-white/10 text-white/40 border border-dashed border-white/25"
                            }`}
                          >
                            {earned ? activeClub.stampIcon : idx + 1}
                          </div>
                        );
                      })}
                    </div>

                    {/* Reward Box inside Card */}
                    <div className="mt-5 rounded-2xl bg-black/25 border border-white/15 p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                          {isGoalReached
                            ? "🎉 ¡META COMPLETADA! PREMIO LISTO PARA CANJE:"
                            : `Te faltan ${activeClub.targetGoal - simStamps} visitas para desbloquear:`}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                          {activeClub.rewardTitle}
                        </p>
                      </div>
                      <span className="rounded-lg bg-white/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-200">
                        {activeClub.rewardValue}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Cashier Controls */}
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase text-slate-500 block">
                        Acción en Terminal de Caja:
                      </span>
                      <p className="text-xs font-bold text-slate-900">
                        {redeemedInSim
                          ? "✓ Premio canjeado en caja con PIN · Ciclo reiniciado"
                          : isGoalReached
                          ? "Código generado: VIP-8492 · Listo para validar en caja"
                          : "Haz clic para simular una nueva visita del cliente"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isGoalReached ? (
                        <button
                          type="button"
                          onClick={() => {
                            setRedeemedInSim(false);
                            setSimStamps((prev) => Math.min(activeClub.targetGoal, prev + 1));
                          }}
                          className="rounded-xl bg-[#047857] px-4 py-2.5 font-mono text-xs font-bold text-white hover:bg-[#065F46] transition-all shadow-sm cursor-pointer"
                        >
                          + Sumar 1 Sello en Caja
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setRedeemedInSim(true);
                            setSimStamps(0);
                          }}
                          className="rounded-xl bg-amber-500 px-4 py-2.5 font-mono text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-sm cursor-pointer"
                        >
                          🎁 Validar Canje con PIN
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BARRA INTEGRADA PARA CLIENTES FINALES (Consulta real de sellos) */}
        <section id="billetera-clientes" className="border-b border-emerald-950/10 bg-[#063729] py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-6 space-y-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
                  ¿Acumulaste puntos en un comercio adherido?
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                  Consulta tu billetera de tarjetas y premios aquí mismo.
                </h2>
                <p className="text-sm text-emerald-100/80">
                  Ingresa tu número de teléfono para ver tus sellos acumulados y códigos de canje activos en cualquier negocio SocialPilot Fideliza.
                </p>
              </div>

              <div className="lg:col-span-6">
                <form
                  onSubmit={handleWalletSubmit}
                  className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-white/10 p-3 border border-white/15"
                >
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: +56 9 8765 4321"
                    className="flex-1 rounded-xl bg-white px-4 py-3.5 font-mono text-sm font-bold text-slate-950 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-amber-400 px-6 py-3.5 font-mono text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-amber-300 transition-all shrink-0 cursor-pointer"
                  >
                    {loading ? "Buscando..." : "Ver mis Tarjetas →"}
                  </button>
                </form>
                <div className="mt-2.5 flex items-center justify-between text-xs text-emerald-200/80 px-1">
                  <span>Sin contraseñas · Acceso inmediato con tu número</span>
                  <Link href="/fideliza/caja" className="font-semibold text-amber-300 hover:underline">
                    Acceso Terminal Cajero →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. EL PROBLEMA DE LA RETENCIÓN Y CONTROL ANTIFRAUDE */}
        <section id="control-caja" className="border-b border-emerald-950/10 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#047857]">
                Diseñado para el mostrador real
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Cero cartones perdidos. Cero aplicaciones que nadie descarga. Cero timbres falsos.
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Los programas de fidelización tradicionales fracasan por dos motivos: o son tarjetas de papel que el cliente olvida en casa, o son aplicaciones pesadas que nadie quiere bajar mientras espera en la caja.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-[#F5F9F6] p-7">
                <span className="font-mono text-xs font-bold uppercase text-[#047857]">
                  01 · Identificación con el teléfono
                </span>
                <h3 className="mt-3 text-xl font-bold text-slate-950">
                  Registro en 5 segundos en la fila
                </h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  Tu cliente dicta su número de WhatsApp en caja o lo ingresa desde el QR del mostrador. No necesita recordar claves ni llenar formularios eternos.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-[#F5F9F6] p-7">
                <span className="font-mono text-xs font-bold uppercase text-amber-700">
                  02 · Control Antifraude en Caja
                </span>
                <h3 className="mt-3 text-xl font-bold text-slate-950">
                  Validación con PIN de cajero
                </h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  Cada sello otorgado y cada recompensa canjeada exige el PIN de seguridad de tu local en la Terminal de Caja, impidiendo duplicaciones o cobros indebidos.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-[#F5F9F6] p-7">
                <span className="font-mono text-xs font-bold uppercase text-slate-800">
                  03 · Historial y Métricas de Visitas
                </span>
                <h3 className="mt-3 text-xl font-bold text-slate-950">
                  Conoce quiénes son tus mejores clientes
                </h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  Consulta en tu panel quiénes te visitan más seguido, cuántos sellos llevan acumulados, qué premios se han canjeado y cuándo fue su última compra.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. CASOS DE USO CONECTADOS AL CATÁLOGO */}
        <section id="casos" className="border-b border-emerald-950/10 bg-[#F5F9F6] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-5 space-y-4">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#047857]">
                  Reglas claras · Recompensas reales
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Tú defines la meta de visitas y el premio que mejor impulsa tu margen.
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Puedes configurar el ícono del sello, la cantidad de visitas necesarias y las condiciones de canje desde tu panel en cualquier momento. Y si usas el Catálogo Central de SocialPilot, vinculas tus productos reales como recompensa.
                </p>
                <div className="pt-2">
                  <Link
                    href="/registro?plan=crecimiento"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                  >
                    <span>Configurar las reglas de mi club</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <span className="text-2xl">☕</span>
                  <h3 className="mt-3 text-base font-bold text-slate-950">
                    Cafeterías y Panaderías
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    “Acumula 6 cafés y el 7° va por cuenta de la casa”. Aumenta la frecuencia de lunes a viernes de los clientes que trabajan cerca de tu local.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <span className="text-2xl">🍔</span>
                  <h3 className="mt-3 text-base font-bold text-slate-950">
                    Restaurantes, Sushi y Pizzerías
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    “En tu 5° pedido recibe una porción de gyozas o postre sin costo”. Haz que te pidan directo a ti en vez de irse a una app de reparto con 30% de comisión.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <span className="text-2xl">✂️</span>
                  <h3 className="mt-3 text-base font-bold text-slate-950">
                    Barberías, Salones y Centros Estéticos
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    “5 sesiones = 50% de descuento en tu próximo servicio o tratamiento capilar de regalo”. Asegura que el cliente agende siempre contigo cada mes.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <span className="text-2xl">🛍️</span>
                  <h3 className="mt-3 text-base font-bold text-slate-950">
                    Tiendas Especializadas y Pet Shops
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    “Suma 1 estrella por cada compra de alimento y desbloquea un bono de descuento en la 6ª visita”. Retención predecible todos los meses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. PLANES Y CONTRATACIÓN */}
        <section id="planes" className="border-b border-emerald-950/10 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#047857]">
                Planes transparentes
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Activa tu sistema de fidelización hoy mismo.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600">
                Con un par de clientes que vuelvan una vez más al mes, el sistema se paga por completo.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 items-stretch">
              {/* Plan Crecimiento (Incluye Fideliza + Carta QR + Marketing) */}
              <div className="rounded-3xl border-2 border-[#047857] bg-[#F5F9F6] p-8 flex flex-col justify-between shadow-xl shadow-[#047857]/10 relative">
                <div className="absolute -top-3.5 left-6 rounded-full bg-[#047857] px-3.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                  Club Fideliza Activo + Ecosistema
                </div>
                <div>
                  <span className="font-mono text-xs font-bold uppercase text-[#047857]">
                    SocialPilot Fideliza + Catálogo Central
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">
                    Plan Crecimiento
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-bold text-slate-950">$49.990</span>
                    <span className="text-xs text-slate-500">CLP / mes</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    Incluye el módulo completo de SocialPilot Fideliza (tarjetas ilimitadas, terminal de caja con PIN y control de canjes) junto con Carta QR y Marketing conectados.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs text-slate-800 font-medium">
                    <li>✓ <strong>Clientes y tarjetas de fidelización ilimitadas</strong></li>
                    <li>✓ Configuración de sellos, metas y recompensas</li>
                    <li>✓ Terminal de Caja (`/fideliza/caja`) con PIN antifraude</li>
                    <li>✓ Billetera digital sin necesidad de descargar apps</li>
                    <li>✓ Incluye además Carta QR y Marketing sincronizados</li>
                  </ul>
                </div>
                <Link
                  href="/registro?plan=crecimiento"
                  className="mt-8 block w-full rounded-xl bg-[#047857] py-3.5 text-center text-xs font-bold text-white hover:bg-[#065F46] transition-colors shadow-md"
                >
                  Empezar con SocialPilot Fideliza →
                </Link>
              </div>

              {/* Contratación Individual / A Medida */}
              <div className="rounded-3xl border border-slate-200 bg-slate-950 text-white p-8 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs font-bold uppercase text-amber-400">
                    ¿Solo necesitas Fideliza en tu comercio?
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-white">
                    Activación Independiente de Módulo
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-mono text-2xl font-bold text-emerald-400">
                      Habilitación Directa
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                    El comercio puede contratar SocialPilot Fideliza de manera 100% independiente sin activar Marketing ni Carta QR. Crea tu cuenta gratis y solicita la activación individual de tu módulo o pruébalo durante 7 días.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs text-slate-200">
                    <li>✓ Panel exclusivo con tu Catálogo Central y Fideliza</li>
                    <li>✓ Código QR de mostrador listo para imprimir</li>
                    <li>✓ Registro de clientes por WhatsApp / Teléfono</li>
                    <li>✓ Control de movimientos y premios canjeados</li>
                  </ul>
                </div>
                <div className="mt-8 space-y-2.5">
                  <Link
                    href="/registro?plan=free"
                    className="block w-full rounded-xl bg-white py-3.5 text-center text-xs font-bold text-slate-950 hover:bg-slate-200 transition-colors"
                  >
                    Crear cuenta y probar gratis →
                  </Link>
                  <a
                    href="https://wa.me/56934428848?text=Hola!%20Quiero%20contratar%20el%20m%C3%B3dulo%20independiente%20SocialPilot%20Fideliza%20para%20mi%20negocio."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center text-xs font-semibold text-emerald-300 hover:underline py-1"
                  >
                    Hablar con un especialista por WhatsApp ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. PREGUNTAS FRECUENTES */}
        <section id="faq" className="bg-[#F5F9F6] py-20 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                Preguntas frecuentes
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Todo sobre SocialPilot Fideliza
              </h2>
            </div>

            <div className="mt-10 space-y-3">
              {FAQS_FIDELIZA.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={item.q}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <span className="font-mono text-lg text-[#047857]">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 px-6 py-4 text-sm leading-relaxed text-slate-600">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* MODAL / DRAWER DE BILLETERA REAL PARA CLIENTES FINALES */}
      {showWalletModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Billetera Digital de Clientes Fideliza"
        >
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 text-white shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Billetera Digital SocialPilot Fideliza
                </span>
                <h3 className="text-xl font-bold text-white">
                  Consulta tus Sellos y Recompensas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWalletModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                Cerrar ✕
              </button>
            </div>

            <form onSubmit={handleWalletSubmit} className="mt-5 flex flex-col sm:flex-row gap-2.5">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Tu teléfono (ej: +56 9 8765 4321)"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-sm font-bold text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-amber-400 px-5 py-3 font-mono text-xs font-black uppercase text-slate-950 hover:bg-amber-300 transition-all cursor-pointer"
              >
                {loading ? "Buscando..." : "Buscar Tarjetas"}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-300">
                {error}
              </div>
            )}

            {searched && (
              <div className="mt-5 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {cards.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center space-y-2">
                    <p className="text-sm font-bold text-white">
                      Aún no encontramos tarjetas asociadas al número {activePhone}
                    </p>
                    <p className="text-xs text-slate-400">
                      Pide en tu comercio adherido que registren tu primera visita en caja o escanea el código QR de su mostrador.
                    </p>
                  </div>
                ) : (
                  cards.map((card) => (
                    <div
                      key={card.memberId}
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-white">{card.businessName}</p>
                          <p className="text-xs text-amber-400 font-semibold">{card.programName}</p>
                        </div>
                        <span className="rounded-xl bg-white/10 px-3 py-1 font-mono text-xs font-black text-white">
                          {card.stampIcon} {card.currentStamps} / {card.targetGoal}
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${card.progressPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-xs text-slate-300 truncate">
                          🎁 {card.rewardTitle}
                        </span>
                        <Link
                          href={`/fideliza/${card.clubId}?phone=${card.cleanPhone}`}
                          className="rounded-xl bg-amber-400 px-3.5 py-1.5 font-mono text-xs font-black text-slate-950 hover:bg-amber-300 shrink-0"
                        >
                          Abrir Tarjeta →
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ProductEcosystemFooter
        currentVertical="fideliza"
        tagline="SocialPilot Fideliza transforma compradores ocasionales en clientes recurrentes con tarjetas digitales sin fricción y control antifraude en caja."
      />
    </div>
  );
}

export default function FidelizaPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F9F6] text-slate-900 flex items-center justify-center text-sm font-bold">
          Cargando SocialPilot Fideliza...
        </div>
      }
    >
      <FidelizaLandingAndWalletContent />
    </Suspense>
  );
}
