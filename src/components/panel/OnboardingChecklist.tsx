"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BusinessProfile } from "../../contexts/ProfileContext";
import { SocialPost } from "../../types/dashboard";

interface OnboardingChecklistProps {
  activeProfile?: BusinessProfile | null;
  posts: SocialPost[];
  onScrollToPosts?: () => void;
}

export default function OnboardingChecklist({
  activeProfile,
  posts,
  onScrollToPosts,
}: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const dismissed = localStorage.getItem("socialpilot_checklist_dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  // 1. Identidad de marca (completada si tiene nombre y rubro)
  const isBrandConfigured = Boolean(
    activeProfile?.name &&
    (activeProfile?.rubro || activeProfile?.businessDescription)
  );

  // 2. Conexiones a redes sociales activas
  const isSocialConnected = Boolean(
    activeProfile?.instagramAccountId ||
    activeProfile?.instagramToken_enc ||
    activeProfile?.facebookToken_enc ||
    activeProfile?.facebookPageId ||
    activeProfile?.linkedinToken_enc ||
    activeProfile?.linkedinUserToken_enc ||
    activeProfile?.tiktokToken_enc ||
    activeProfile?.googleBusinessConnected
  );

  // 3. Primer post aprobado o publicado
  const hasApprovedPost = posts.some(
    (p) => p.status === "confirmed" || p.status === "published"
  );
  const hasPendingDrafts = posts.some((p) => p.status === "pending");

  // Calcular progreso
  const steps = [
    { completed: isBrandConfigured },
    { completed: isSocialConnected },
    { completed: hasApprovedPost },
  ];
  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const toggleDismiss = () => {
    const next = !isDismissed;
    setIsDismissed(next);
    localStorage.setItem("socialpilot_checklist_dismissed", String(next));
  };

  if (!isMounted) return null;

  // Si ya completó los 3 pasos y lo cerró, no mostramos nada
  if (completedCount === 3 && isDismissed) {
    return null;
  }

  // Vista contraída / minimizada
  if (isDismissed) {
    return (
      <div className="mb-6 flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">
            Ruta de Activación ({completedCount}/3 pasos completados)
          </span>
        </div>
        <button
          onClick={toggleDismiss}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
        >
          Mostrar guía ▾
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/40 p-6 shadow-sm transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 tracking-wide uppercase">
              🚀 Primeros Pasos
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {completedCount} de 3 completados ({progressPercent}%)
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-900 mt-1">
            Pon tus redes en piloto automático
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Sigue estos 3 pasos rápidos para que nuestros agentes publiquen por tu marca.
          </p>
        </div>

        <button
          onClick={toggleDismiss}
          className="self-start sm:self-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-100"
        >
          Ocultar ✕
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Grid de 3 pasos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Paso 1: Identidad */}
        <div
          className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
            isBrandConfigured
              ? "bg-white/90 border-emerald-200 shadow-sm"
              : "bg-white border-slate-200"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Paso 1</span>
              {isBrandConfigured ? (
                <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  ✓ Listo
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  Pendiente
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              ADN de Marca y Rubro
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isBrandConfigured
                ? `${activeProfile?.name || "Tu negocio"} tiene su rubro y estilo definidos.`
                : "Configura el nombre, rubro y estilo visual de tu marca."}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/automatizacion-rrss/panel/configuracion?tab=marca"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors inline-flex items-center gap-1"
            >
              {isBrandConfigured ? "Editar datos →" : "Completar perfil →"}
            </Link>
          </div>
        </div>

        {/* Paso 2: Redes Sociales */}
        <div
          className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
            isSocialConnected
              ? "bg-white/90 border-emerald-200 shadow-sm"
              : "bg-white border-orange-200 shadow-sm ring-2 ring-orange-500/10"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Paso 2</span>
              {isSocialConnected ? (
                <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  ✓ Conectado
                </span>
              ) : (
                <span className="text-xs font-bold text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-full border border-orange-200">
                  ⚡ Acción Clave
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Conectar Instagram o Facebook
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isSocialConnected
                ? "Tus cuentas están vinculadas y listas para recibir contenido."
                : "Vincula tu página en 1 clic para permitir la publicación directa de nuestros agentes."}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/automatizacion-rrss/panel/configuracion?tab=conexiones"
              className={`text-xs font-bold inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                isSocialConnected
                  ? "text-slate-600 hover:text-slate-900 bg-slate-100"
                  : "text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm"
              }`}
            >
              {isSocialConnected ? "Ver conexiones →" : "Vincular Redes en 1 Clic →"}
            </Link>
          </div>
        </div>

        {/* Paso 3: Primer Post */}
        <div
          className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
            hasApprovedPost
              ? "bg-white/90 border-emerald-200 shadow-sm"
              : hasPendingDrafts
              ? "bg-white border-amber-200 shadow-sm"
              : "bg-white border-slate-200"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Paso 3</span>
              {hasApprovedPost ? (
                <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  ✓ Aprobado
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  {hasPendingDrafts ? "Borradores Listos" : "Pendiente"}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Aprobar tu Primera Publicación
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {hasApprovedPost
                ? "¡Excelente! Ya tienes publicaciones confirmadas en tu calendario."
                : hasPendingDrafts
                ? "Tus agentes ya redactaron tus primeros borradores abajo. Solo revísalos y haz clic en Aprobar."
                : "Crea tu primer post o deja que nuestros agentes propongan una idea."}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            {hasApprovedPost ? (
              <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1">
                ✓ Publicación en marcha
              </span>
            ) : hasPendingDrafts ? (
              <button
                type="button"
                onClick={onScrollToPosts}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors inline-flex items-center gap-1"
              >
                Revisar borradores abajo ↓
              </button>
            ) : (
              <Link
                href="/automatizacion-rrss/panel/crear"
                className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors inline-flex items-center gap-1"
              >
                Crear nuevo post →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
