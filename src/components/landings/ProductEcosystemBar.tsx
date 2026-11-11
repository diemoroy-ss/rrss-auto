"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SocialPilotLogo from "../SocialPilotLogo";

export type ProductVertical = "marketing" | "menu" | "fideliza";

interface NavItem {
  label: string;
  href: string;
}

interface ProductEcosystemBarProps {
  vertical: ProductVertical;
  productBadge: string;
  accentColorClass: string;
  accentBgClass: string;
  accentBorderClass: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  navItems: NavItem[];
}

const ECOSYSTEM_LINKS: Array<{
  id: ProductVertical | "home";
  name: string;
  tag: string;
  href: string;
  dotColor: string;
}> = [
  {
    id: "home",
    name: "SocialPilot Ecosistema",
    tag: "Plataforma central",
    href: "/",
    dotColor: "bg-slate-900",
  },
  {
    id: "marketing",
    name: "SocialPilot Marketing",
    tag: "Contenido y redes",
    href: "/marketing",
    dotColor: "bg-[#E04F16]",
  },
  {
    id: "menu",
    name: "SocialPilot Carta QR",
    tag: "Menú interactivo",
    href: "/menu",
    dotColor: "bg-[#C2410C]",
  },
  {
    id: "fideliza",
    name: "SocialPilot Fideliza",
    tag: "Lealtad y recompensas",
    href: "/fideliza",
    dotColor: "bg-[#047857]",
  },
];

export default function ProductEcosystemBar({
  vertical,
  productBadge,
  accentColorClass,
  accentBgClass,
  accentBorderClass,
  ctaLabel,
  ctaHref,
  secondaryAction,
  navItems,
}: ProductEcosystemBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/90 bg-white/95 backdrop-blur-md">
      {/* Top Institutional Strip: Ecosystem Switcher */}
      <div className="border-b border-stone-200/70 bg-stone-100/80 px-4 py-1.5 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="hidden sm:inline-block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500 mr-1.5">
              Ecosistema SocialPilot:
            </span>
            {ECOSYSTEM_LINKS.map((item) => {
              const isCurrent = item.id === vertical;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                    isCurrent
                      ? "bg-stone-900 text-white font-semibold shadow-2xs"
                      : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-900"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isCurrent ? "bg-white" : item.dotColor
                    }`}
                  />
                  <span>{item.name.replace("SocialPilot ", "")}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-4 text-[11px] font-medium text-stone-600 shrink-0">
            <span>Una sola cuenta · Tres soluciones independientes</span>
            <span className="text-stone-300">|</span>
            <Link
              href="/login"
              className="font-semibold text-stone-900 hover:underline"
            >
              Ingresar al panel →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Product Navigation */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 rounded-lg"
            title="Volver al inicio de SocialPilot"
          >
            <SocialPilotLogo height={38} width={175} priority />
          </Link>
          <span className="text-stone-300 font-light text-lg select-none">/</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${accentBorderClass} ${accentBgClass} ${accentColorClass}`}
          >
            {productBadge}
          </span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Navegación del producto">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-stone-600 hover:text-stone-950 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {secondaryAction && (
            secondaryAction.onClick ? (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 hover:border-stone-400 transition-all cursor-pointer"
              >
                {secondaryAction.label}
              </button>
            ) : (
              <Link
                href={secondaryAction.href || "#"}
                className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 hover:border-stone-400 transition-all"
              >
                {secondaryAction.label}
              </Link>
            )
          )}

          <Link
            href={ctaHref}
            className="rounded-xl bg-stone-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-stone-800 transition-all"
          >
            {ctaLabel}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-800 hover:bg-stone-100"
            aria-expanded={mobileOpen}
            aria-label="Abrir menú de navegación"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="border-t border-stone-200 bg-white px-4 pt-3 pb-6 sm:hidden shadow-xl">
          <div className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-100"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-stone-200 flex flex-col gap-2.5">
            {secondaryAction && (
              secondaryAction.onClick ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    secondaryAction.onClick?.();
                  }}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 py-2.5 text-center text-xs font-bold text-stone-800"
                >
                  {secondaryAction.label}
                </button>
              ) : (
                <Link
                  href={secondaryAction.href || "#"}
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 py-2.5 text-center text-xs font-bold text-stone-800"
                >
                  {secondaryAction.label}
                </Link>
              )
            )}
            <Link
              href={ctaHref}
              onClick={() => setMobileOpen(false)}
              className="w-full rounded-xl bg-stone-950 py-3 text-center text-xs font-bold text-white"
            >
              {ctaLabel}
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full py-2 text-center text-xs font-semibold text-stone-600"
            >
              ¿Ya tienes cuenta? Iniciar sesión →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
