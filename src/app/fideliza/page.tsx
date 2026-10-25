"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FaGift,
  FaSearch,
  FaCashRegister,
  FaArrowRight,
  FaTrophy,
  FaStore,
  FaWhatsapp,
} from "react-icons/fa";
import FidelizaLogo from "../../components/FidelizaLogo";

export default function FidelizaPortalPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    setSearched(false);
    try {
      const res = await fetch(`/api/public/fideliza/lookup?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al consultar tarjetas");
      setCards(data.cards || []);
      setSearched(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <FidelizaLogo height={40} width={190} href="https://fideliza.socialpilot.cl" priority />
          <div className="flex items-center gap-2">
            <Link
              href="/fideliza/caja"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <FaCashRegister className="text-amber-400" />
              <span>Acceso Caja</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto w-full px-4 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
            <FaGift /> Billetera Digital de Clientes
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Mis Tarjetas de Fidelización
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Ingresa tu número de WhatsApp para ver tus sellos acumulados y premios disponibles en tus locales favoritos.
          </p>
        </div>

        {/* Phone Lookup Form */}
        <form
          onSubmit={handleSearch}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
        >
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Tu Número de WhatsApp
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FaWhatsapp className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 text-lg" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:border-amber-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <FaSearch />
              <span>{loading ? "Buscando..." : "Ver mis Tarjetas"}</span>
            </button>
          </div>
          {error && <p className="text-rose-400 text-xs font-bold">{error}</p>}
        </form>

        {/* Results */}
        {searched && (
          <div className="space-y-3">
            {cards.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-2">
                <p className="font-black text-base text-slate-200">
                  No encontramos tarjetas asociadas a ese número
                </p>
                <p className="text-xs text-slate-400">
                  Escanea el código QR en el mostrador de tu local favorito para inscribirte y recibir tu primer sello.
                </p>
              </div>
            ) : (
              cards.map((card) => (
                <Link
                  key={card.memberId}
                  href={`/fideliza/${card.clubId}?phone=${card.cleanPhone}`}
                  className="block bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 transition-all shadow-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {card.logoUrl ? (
                        <img
                          src={card.logoUrl}
                          alt={card.businessName}
                          className="w-14 h-14 rounded-2xl object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl shrink-0">
                          {card.stampIcon}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                          {card.programName}
                        </span>
                        <h3 className="font-black text-base text-white truncate">
                          {card.businessName}
                        </h3>
                        <p className="text-xs text-slate-400 truncate">
                          Meta: {card.rewardTitle}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white font-black text-xs">
                        {card.stampIcon} {card.currentStamps} / {card.targetGoal}
                      </span>
                      {card.pendingRewardsCount > 0 && (
                        <span className="block text-[11px] font-black text-emerald-400">
                          🎁 {card.pendingRewardsCount} premio listo
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </main>

      {/* Footer for Businesses */}
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
