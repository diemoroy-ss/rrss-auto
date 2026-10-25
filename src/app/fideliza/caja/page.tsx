"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FaCashRegister,
  FaSearch,
  FaPlusCircle,
  FaGift,
  FaUserPlus,
  FaLock,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";

function CashierTerminalContent() {
  const searchParams = useSearchParams();
  const initialClubId = searchParams.get("id") || "";
  const initialPhone = searchParams.get("phone") || "";

  const [clubId, setClubId] = useState(initialClubId);
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [business, setBusiness] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialPhone);

  // Registro rápido en caja
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");

  useEffect(() => {
    if (initialClubId) setClubId(initialClubId);
    if (initialPhone) setSearchQuery(initialPhone);
  }, [initialClubId, initialPhone]);

  const handleLoginCashier = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clubId.trim() || !pin.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/fideliza/${encodeURIComponent(clubId.trim())}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cashier_list_members",
          pin: pin.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Acceso denegado");
      setBusiness(data.business);
      setConfig(data.config);
      setMembers(data.members || []);
      setAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStamp = async (memberId: string, memberName: string) => {
    setLoading(true);
    setError(null);
    setToast(null);
    try {
      const res = await fetch(`/api/public/fideliza/${encodeURIComponent(clubId.trim())}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate_pin",
          memberId,
          pin: pin.trim(),
          purchaseAmount: Number(purchaseAmount) || 0,
          bypassCooldown: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo acreditar");
      setPurchaseAmount("");
      setToast(
        data.unlockedNewReward
          ? `🎉 ¡${memberName} completó la meta y desbloqueó un premio (${data.latestRewardCode})!`
          : `✅ Sello acreditado a ${memberName}`
      );
      await handleLoginCashier();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRedeem = async (memberId: string, rewardCode: string, memberName: string) => {
    setLoading(true);
    setError(null);
    setToast(null);
    try {
      const res = await fetch(`/api/public/fideliza/${encodeURIComponent(clubId.trim())}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cashier_redeem_reward",
          memberId,
          pin: pin.trim(),
          rewardCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al canjear");
      setToast(`🥳 Premio ${rewardCode} canjeado para ${memberName}`);
      await handleLoginCashier();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/fideliza/${encodeURIComponent(clubId.trim())}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_or_login",
          name: newName || "Cliente",
          phone: newPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewName("");
      setNewPhone("");
      setToast(`✅ Socio ${data.member.name} registrado en el club.`);
      await handleLoginCashier();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.name || "").toLowerCase().includes(q) ||
      (m.phone || "").toLowerCase().includes(q) ||
      (m.cleanPhone || "").includes(q)
    );
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-2xl mx-auto">
              <FaCashRegister />
            </div>
            <h1 className="text-xl font-black">Terminal de Caja Fideliza</h1>
            <p className="text-xs text-slate-400">
              Ingresa el código del local y tu PIN de cajero para acreditar visitas y canjear premios.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950 border border-rose-500/40 text-xs text-rose-200 font-bold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLoginCashier} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                ID del Comercio
              </label>
              <input
                type="text"
                required
                placeholder="ID del comercio"
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                PIN de Cajero
              </label>
              <input
                type="password"
                inputMode="numeric"
                required
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-3 text-center text-xl tracking-[0.4em] font-black text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-black text-xs text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaLock />}
              <span>Abrir Terminal de Caja</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Caja */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-white/10 rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-xl font-black">
              <FaCashRegister />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                ● Terminal de Caja Activa
              </span>
              <h1 className="text-lg font-black text-white">{business?.name}</h1>
              <p className="text-xs text-slate-400">
                Meta: {config?.targetGoal} {config?.mode === "visits" ? "visitas" : "puntos"} → {config?.rewardTitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => setAuthenticated(false)}
            className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-800 self-start sm:self-center"
          >
            Bloquear Caja 🔒
          </button>
        </div>

        {toast && (
          <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between">
            <span>{toast}</span>
            <button onClick={() => setToast(null)}>✕</button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-950 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Registro Rápido de Cliente en Mostrador */}
        <form
          onSubmit={handleQuickRegister}
          className="bg-slate-900/80 border border-white/10 rounded-3xl p-4 flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 shrink-0">
            <FaUserPlus />
            <span>Inscribir Nuevo:</span>
          </div>
          <input
            type="text"
            placeholder="Nombre cliente"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full sm:flex-1 bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
          />
          <input
            type="tel"
            required
            placeholder="WhatsApp (+569...)"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="w-full sm:flex-1 bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shrink-0 cursor-pointer"
          >
            + Inscribir
          </button>
        </form>

        {/* Buscador y Monto Opcional */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <FaSearch className="absolute left-4 top-3.5 text-slate-500 text-sm" />
            <input
              type="text"
              placeholder="Buscar socio por teléfono o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 focus:border-orange-500 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-white outline-none"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Monto compra $ (opcional)"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 focus:border-orange-500 rounded-2xl px-4 py-3 text-sm font-semibold text-white outline-none"
            />
          </div>
        </div>

        {/* Lista de Socios */}
        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-3xl border border-white/5 text-slate-500 text-xs">
              No se encontraron clientes con ese criterio.
            </div>
          ) : (
            filteredMembers.map((m) => (
              <div
                key={m.id}
                className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{m.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {m.stamps || 0} / {config?.targetGoal} sellos
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    📱 {m.phone} · Visitas totales: {m.totalVisits || 0}
                  </p>

                  {/* Premios pendientes de este socio */}
                  {Array.isArray(m.pendingRewards) && m.pendingRewards.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.pendingRewards.map((rw: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => handleRedeem(m.id, rw.code, m.name)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
                        >
                          <FaGift />
                          <span>Canjear {rw.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAddStamp(m.id, m.name)}
                  disabled={loading}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shrink-0 shadow cursor-pointer"
                >
                  <FaPlusCircle />
                  <span>Sumar +1 Sello</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function CashierTerminalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          Cargando terminal...
        </div>
      }
    >
      <CashierTerminalContent />
    </Suspense>
  );
}
