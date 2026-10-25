"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FaGift,
  FaSearch,
  FaCashRegister,
  FaArrowRight,
  FaTrophy,
  FaStore,
  FaWhatsapp,
  FaStar,
  FaCheckCircle,
  FaMobileAlt,
  FaSyncAlt,
  FaChevronRight,
  FaUtensils,
} from "react-icons/fa";
import FidelizaLogo from "../../components/FidelizaLogo";

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

function FidelizaPortalContent() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [error, setError] = useState("");

  // Buscar automáticamente al cargar si viene en URL o localStorage
  useEffect(() => {
    const queryPhone = searchParams.get("phone");
    const storedPhone = typeof window !== "undefined" ? localStorage.getItem("sp_fideliza_phone") : null;
    const initialPhone = queryPhone || storedPhone;

    if (initialPhone) {
      setPhone(initialPhone);
      fetchCards(initialPhone);
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
      const res = await fetch(`/api/public/fideliza/lookup?phone=${encodeURIComponent(targetPhone.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al consultar tus tarjetas");

      setCards(data.cards || []);
      setSearched(true);
      setActivePhone(data.phone || cleanDigits.slice(-9));

      // Persistir teléfono en el dispositivo del cliente
      if (typeof window !== "undefined") {
        localStorage.setItem("sp_fideliza_phone", targetPhone.trim());
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    fetchCards(phone.trim());
  };

  const handleClearPhone = () => {
    setActivePhone(null);
    setCards([]);
    setSearched(false);
    setPhone("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("sp_fideliza_phone");
    }
  };

  // Métricas agregadas de la billetera multinegocio
  const totalStamps = cards.reduce((acc, c) => acc + c.currentStamps, 0);
  const totalRewardsReady = cards.reduce(
    (acc, c) => acc + (c.pendingRewardsCount > 0 ? c.pendingRewardsCount : c.currentStamps >= c.targetGoal ? 1 : 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <FidelizaLogo height={42} width={200} href="/fideliza" priority />
          <div className="flex items-center gap-2">
            <Link
              href="/fideliza/caja"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <FaCashRegister className="text-amber-400" />
              <span className="hidden sm:inline">Acceso</span>
              <span>Caja POS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto w-full px-4 py-8 sm:py-12 space-y-8">
        
        {/* Hero & Bienvenida */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-amber-300 text-xs font-black uppercase tracking-wider">
            <FaGift /> Billetera Digital Multinegocio
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Tus Tarjetas y Beneficios VIP
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Revisa tus sellos acumulados, avances y premios disponibles en todos tus comercios favoritos desde un solo lugar.
          </p>
        </div>

        {/* Buscador de Teléfono o Banner de Sesión Activa */}
        {!activePhone || !searched ? (
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4"
          >
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Ingresa tu número de WhatsApp
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FaWhatsapp className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 text-lg" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:border-amber-500 outline-none transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {loading ? <FaSyncAlt className="animate-spin" /> : <FaSearch />}
                <span>{loading ? "Buscando..." : "Abrir mi Billetera"}</span>
              </button>
            </div>
            {error && <p className="text-rose-400 text-xs font-bold pt-1">{error}</p>}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              💡 Tus tarjetas quedan guardadas en tu teléfono para que no tengas que ingresar tu número cada vez.
            </p>
          </form>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
                <FaMobileAlt />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Billetera Activa
                </span>
                <p className="text-sm font-black text-white flex items-center gap-2">
                  <span>+56 9 {activePhone.slice(-8)}</span>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    Conectado
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchCards(phone)}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Actualizar datos"
              >
                <FaSyncAlt className={loading ? "animate-spin" : ""} />
                <span>Actualizar</span>
              </button>
              <button
                onClick={handleClearPhone}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-xs font-bold text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                Cambiar número
              </button>
            </div>
          </div>
        )}

        {/* ── KPIs DE LA BILLETERA MULTINEGOCIO ── */}
        {searched && cards.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Comercios</span>
              <p className="text-2xl font-black text-white mt-0.5">{cards.length}</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Sellos</span>
              <p className="text-2xl font-black text-amber-400 mt-0.5">{totalStamps}</p>
            </div>
            <div className={`border rounded-2xl p-4 text-center ${totalRewardsReady > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-900/70 border-slate-800"}`}>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Premios Listos</span>
              <p className={`text-2xl font-black mt-0.5 ${totalRewardsReady > 0 ? "text-emerald-400 animate-pulse" : "text-slate-400"}`}>
                {totalRewardsReady}
              </p>
            </div>
          </div>
        )}

        {/* ── LISTADO DE TARJETAS DIGITALES DE DISTINTOS COMERCIOS ── */}
        {searched && (
          <div className="space-y-5">
            {cards.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 text-3xl flex items-center justify-center mx-auto">
                  <FaStore />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-lg text-white">No tienes tarjetas asociadas a este número</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Escanea el código QR en el mostrador o mesa de cualquier local asociado para registrarte y empezar a sumar tus visitas de inmediato.
                  </p>
                </div>
                <button
                  onClick={handleClearPhone}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                >
                  Probar con otro número
                </button>
              </div>
            ) : (
              cards.map((card) => {
                const isGoalReached = card.currentStamps >= card.targetGoal;
                const hasRewards = card.pendingRewardsCount > 0 || isGoalReached;

                return (
                  <div
                    key={card.memberId}
                    className={`rounded-3xl border-2 transition-all overflow-hidden shadow-2xl relative ${
                      hasRewards
                        ? "bg-gradient-to-b from-slate-900 to-slate-950 border-amber-500/60 shadow-amber-500/10"
                        : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Alerta de premio listo */}
                    {hasRewards && (
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[11px] px-4 py-1.5 flex items-center justify-between uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <span>🎁</span> ¡Premio Listo para Canjear!
                        </span>
                        <span className="text-[10px] font-extrabold bg-slate-950/20 px-2 py-0.5 rounded-full">
                          {card.rewardTitle}
                        </span>
                      </div>
                    )}

                    <div className="p-5 sm:p-6 space-y-5">
                      {/* Cabecera del Comercio */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {card.logoUrl ? (
                            <img
                              src={card.logoUrl}
                              alt={card.businessName}
                              className="w-14 h-14 rounded-2xl object-cover bg-white p-1 border border-white/10 shrink-0 shadow-md"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black flex items-center justify-center text-xl shrink-0 shadow-md">
                              {card.businessName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                                {card.programName}
                              </span>
                              {card.merchantCode && (
                                <span className="text-[9px] font-mono bg-white/10 text-slate-300 px-1.5 py-0.5 rounded">
                                  #{card.merchantCode}
                                </span>
                              )}
                            </div>
                            <h3 className="font-black text-lg text-white leading-tight truncate">
                              {card.businessName}
                            </h3>
                            <p className="text-xs text-slate-400 truncate">
                              {card.rubro || "Comercio Asociado"}
                            </p>
                          </div>
                        </div>

                        {/* Contador de sellos en badge */}
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-white/10 border border-white/10 text-white font-black text-xs">
                            <span className="text-amber-400">{card.stampIcon}</span>
                            <span>{card.currentStamps}</span>
                            <span className="text-slate-400 font-normal">/ {card.targetGoal}</span>
                          </span>
                        </div>
                      </div>

                      {/* Tablero Visual de Sellos Estampados */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium text-[11px]">
                            {isGoalReached ? (
                              <strong className="text-emerald-400">¡Meta de visitas alcanzada!</strong>
                            ) : (
                              <span>
                                Te faltan <strong className="text-white">{card.stampsRemaining}</strong> visitas para tu premio
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            {card.progressPercent}%
                          </span>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 rounded-full"
                            style={{ width: `${card.progressPercent}%` }}
                          />
                        </div>

                        {/* Cuadrícula de sellitos visuales */}
                        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 pt-2">
                          {Array.from({ length: Math.min(10, card.targetGoal) }).map((_, idx) => {
                            const isStampEarned = idx < card.currentStamps;
                            return (
                              <div
                                key={idx}
                                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                                  isStampEarned
                                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs shadow-amber-500/10 scale-102"
                                    : "bg-slate-950/60 text-slate-600 border border-dashed border-slate-800"
                                }`}
                                title={`Sello ${idx + 1}`}
                              >
                                {isStampEarned ? card.stampIcon : idx + 1}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Meta / Premio */}
                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm shrink-0">
                            <FaTrophy />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Premio a cobrar:</span>
                            <p className="font-black text-white truncate">{card.rewardTitle}</p>
                          </div>
                        </div>

                        <Link
                          href={`/fideliza/${card.clubId}?phone=${card.cleanPhone}`}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer"
                        >
                          <span>Abrir Tarjeta</span>
                          <FaChevronRight className="text-[10px]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tip para Guardar en el Celular */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-5 text-center space-y-2">
          <p className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
            <span>📱</span> Tip: Agrega Fideliza a tu Pantalla de Inicio
          </p>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
            En Safari o Chrome, presiona <strong>Compartir / Opciones</strong> y luego <strong>"Agregar a pantalla de inicio"</strong> para acceder a todas tus tarjetas con 1 toque sin instalar nada.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Tecnología de Fidelización de SocialPilot.cl</span>
          <Link
            href="https://socialpilot.cl/automatizacion-rrss/panel/fidelizacion"
            className="text-amber-400 hover:underline font-bold flex items-center gap-1"
          >
            <FaStore /> ¿Tienes un negocio? Activa tu Club VIP aquí <FaArrowRight />
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function FidelizaPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-sm font-bold">
          Cargando tu billetera digital...
        </div>
      }
    >
      <FidelizaPortalContent />
    </Suspense>
  );
}
