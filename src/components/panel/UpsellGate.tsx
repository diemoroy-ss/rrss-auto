"use client";

import React from "react";
import Link from "next/link";
import { Lock, Sparkles, MessageCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

interface UpsellGateProps {
  moduleName: string;
  badge?: string;
  title: string;
  description: string;
  benefits: string[];
  requiredPlanName?: string;
  upgradePlanId?: "crecimiento" | "piloto_automatico";
}

export default function UpsellGate({
  moduleName,
  badge = "Exclusivo Plan Crecimiento",
  title,
  description,
  benefits,
  requiredPlanName = "Plan PyME Crecimiento",
  upgradePlanId = "crecimiento",
}: UpsellGateProps) {
  const whatsappUrl = `https://wa.me/56934428848?text=${encodeURIComponent(
    `Hola Santisoft! Quiero activar el módulo de ${moduleName} y actualizar mi cuenta al ${requiredPlanName}. ¿Me ayudan con los detalles?`
  )}`;

  const checkoutUrl = `/confirmar-plan?plan=${upgradePlanId}`;

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-8 md:p-12 border border-slate-800 shadow-2xl shadow-indigo-950/40">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Badge & Lock Icon */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{badge}</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 text-white">
            {title}
          </h2>

          <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed mb-8">
            {description}
          </p>

          {/* Grid de beneficios desbloqueados */}
          <div className="w-full max-w-xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 mb-8 text-left backdrop-blur-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Lo que desbloqueas con este módulo:</span>
            </h4>
            <ul className="space-y-3">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
            <Link
              href={checkoutUrl}
              className="w-full sm:w-auto flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 text-center text-sm md:text-base flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Subir a {requiredPlanName}</span>
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-600/30 text-center text-sm md:text-base flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hablar por WhatsApp</span>
            </a>
          </div>

          <div className="mt-8">
            <Link
              href="/automatizacion-rrss/panel"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Panel de Publicaciones</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
