"use client";

import Link from "next/link";
import { BusinessProfile } from "../../contexts/ProfileContext";
import {
  ContractedModules,
  SAAS_MODULES_CATALOG,
  getActiveModulesList,
  getUncontractedModulesList,
} from "../../lib/saas-modules";
import { getPlanConfig } from "../../lib/plans";

interface EcosystemClientHubProps {
  userUid?: string | null;
  userEmail?: string | null;
  userPlan?: string;
  activeProfile: BusinessProfile | null;
  contractedModules: ContractedModules;
  postsCount?: number;
}

export default function EcosystemClientHub({
  userUid,
  userEmail,
  userPlan = "esencial",
  activeProfile,
  contractedModules,
  postsCount = 0,
}: EcosystemClientHubProps) {
  const businessName =
    activeProfile?.businessName || activeProfile?.name || "Mi Negocio";
  const businessRubro =
    activeProfile?.rubro || activeProfile?.businessType || "Comercio & Servicios";
  const profileId = activeProfile?.id || "default";
  const planMeta = getPlanConfig(userPlan);

  const activeModules = getActiveModulesList(contractedModules);
  const availableAddons = getUncontractedModulesList(contractedModules);

  const publicMenuUrl = userUid
    ? `/menu/${userUid}___${profileId}`
    : "/menu/AGdJLwdz0QNhBPcRp1FdWWMooAb2___default";

  return (
    <section className="mb-8 space-y-4">
      {/* Barra Principal del Negocio y Estado de Servicios */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
            {activeProfile?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeProfile.logoUrl}
                alt={businessName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{activeProfile?.icon || "🏢"}</span>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {businessName}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Servicios Activos
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                {planMeta.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {businessRubro}
              {userEmail ? ` · Cuenta: ${userEmail}` : ""} ·{" "}
              <strong className="text-slate-700">
                {activeModules.length}{" "}
                {activeModules.length === 1 ? "módulo activo" : "módulos activos"}
              </strong>
            </p>
          </div>
        </div>

        {/* Accesos Rápidos Centrales */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/automatizacion-rrss/panel/catalogo"
            className="bg-orange-600 hover:bg-orange-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <span>🛍️</span> Productos y Promociones
          </Link>
          <Link
            href="/automatizacion-rrss/panel/configuracion"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-all flex items-center gap-2"
          >
            <span>🏢</span> Mi Negocio
          </Link>
          <Link
            href="/automatizacion-rrss/panel/planes"
            className="bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition-all"
          >
            Mi Suscripción
          </Link>
        </div>
      </div>

      {/* Tarjetas de Módulos Contratados + Catálogo Central */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Catálogo Central (Siempre activo en cualquier combinación) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg">
                🛍️
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Núcleo Central
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900">
              Catálogo de Productos y Promociones
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Registra tus productos, fotos, precios y ofertas una sola vez para usarlos en todos
              tus módulos.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/automatizacion-rrss/panel/catalogo"
              className="text-xs font-black text-orange-600 hover:text-orange-500"
            >
              Administrar catálogo →
            </Link>
          </div>
        </div>

        {/* Card 2: SocialPilot Marketing */}
        {contractedModules.marketing && (
          <div className="bg-white rounded-2xl border border-orange-200/90 p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg">
                  📣
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Activo · {postsCount} posts
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900">
                {SAAS_MODULES_CATALOG.marketing.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Crea publicaciones, Reels y calendario con productos de tu catálogo.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                href="/automatizacion-rrss/panel/crear"
                className="text-xs font-black text-orange-600 hover:text-orange-500"
              >
                + Crear publicación →
              </Link>
              <Link
                href="/automatizacion-rrss/panel/estrategia"
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
              >
                Estrategia
              </Link>
            </div>
          </div>
        )}

        {/* Card 3: SocialPilot Carta QR */}
        {contractedModules.qr && (
          <div className="bg-white rounded-2xl border border-amber-200/90 p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
                  🍽️
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Activo
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900">
                {SAAS_MODULES_CATALOG.qr.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Carta digital sincronizada con tus productos, categorías, precios y promociones.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                href="/automatizacion-rrss/panel/menu-qr"
                className="text-xs font-black text-amber-700 hover:text-amber-600"
              >
                Configurar Carta QR →
              </Link>
              <a
                href={publicMenuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-slate-500 hover:text-slate-900"
              >
                Ver Carta ↗
              </a>
            </div>
          </div>
        )}

        {/* Card 4: SocialPilot Fideliza */}
        {contractedModules.fideliza && (
          <div className="bg-white rounded-2xl border border-emerald-200/90 p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                  🎁
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Activo
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900">
                {SAAS_MODULES_CATALOG.fideliza.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Acumulación de sellos o puntos, recompensas y control antifraude en caja.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                href="/automatizacion-rrss/panel/fidelizacion"
                className="text-xs font-black text-emerald-700 hover:text-emerald-600"
              >
                Administrar Club →
              </Link>
              <a
                href="/fideliza/caja"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-slate-500 hover:text-slate-900"
              >
                Caja POS ↗
              </a>
            </div>
          </div>
        )}

        {/* Si algún módulo no está contratado y hay espacio en la grilla, mostrar invitación discreta */}
        {availableAddons.map((addon) => (
          <div
            key={addon.id}
            className="bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200">
                  Módulo Disponible
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-800">{addon.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{addon.tagline}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between">
              <Link
                href="/automatizacion-rrss/panel/planes"
                className="text-xs font-bold text-slate-700 hover:text-orange-600"
              >
                Conocer y activar →
              </Link>
              <a
                href={addon.publicDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-700"
              >
                Ver demo ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
