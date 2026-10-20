"use client";

import React from "react";
import type { PosterLayout, VisualStyle } from "../../types/poster";

interface PosterTemplatePreviewProps {
  layout: PosterLayout;
  visualStyle: VisualStyle;
  primaryColor?: string;
  mainText?: string;
  sloganText?: string;
  priceText?: string;
  includePrice?: boolean;
  ctaText?: string;
  businessName?: string;
  includeBusinessName?: boolean;
  includeLogo?: boolean;
  aspectRatio?: "1:1" | "4:5";
}

export default function PosterTemplatePreview({
  layout,
  visualStyle,
  primaryColor = "#f59e0b",
  mainText,
  sloganText,
  priceText,
  includePrice = false,
  ctaText = "¡Compra Ahora!",
  businessName = "Tu Marca",
  includeBusinessName = true,
  includeLogo = true,
  aspectRatio = "4:5",
}: PosterTemplatePreviewProps) {
  const displayTitle = mainText?.trim() || "TITULAR PRINCIPAL DEL AFICHE";
  const displaySlogan = sloganText?.trim() || "Frase gancho o propuesta de valor que complementa la oferta";
  const displayPrice = includePrice && priceText?.trim() ? priceText : (includePrice ? "$9.990 · 2x1" : "");
  const displayCta = ctaText?.trim() || "¡Pide el tuyo ahora!";
  const displayBrand = includeBusinessName ? (businessName?.trim() || "Tu Negocio") : null;

  return (
    <div className="w-full bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-white shadow-inner flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-3 px-1 text-[11px] text-slate-400 font-bold">
        <span className="flex items-center gap-1.5 uppercase tracking-wider text-amber-400">
          <span>👁️</span> Vista Previa del Esquema de Plantilla
        </span>
        <span className="bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-300 font-mono text-[10px]">
          {layout === "split_left" ? "Split Lateral" :
           layout === "top_banner" ? "Cabecera Superior" :
           layout === "recipe_ingredients" ? "Ficha Informativa" : "Automático"} · {aspectRatio}
        </span>
      </div>

      {/* Cartel Mockup Container */}
      <div
        className="w-full max-w-[280px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700/60 shadow-2xl relative flex flex-col justify-between p-3.5 select-none transition-all duration-300"
        style={{
          aspectRatio: aspectRatio === "4:5" ? "4/5" : "1/1",
          boxShadow: `0 10px 30px -10px ${primaryColor}25`
        }}
      >
        {/* Marca de agua de fondo simulando fotografía */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* ── LAYOUT 1: SPLIT LATERAL ── */}
        {layout === "split_left" && (
          <div className="relative z-10 h-full grid grid-cols-12 gap-2.5">
            {/* Columna Izquierda: Textos y CTA */}
            <div className="col-span-7 flex flex-col justify-between py-1 pr-1 border-r border-white/10">
              <div className="space-y-2">
                {displayBrand && (
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-slate-300">
                    {includeLogo && <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />}
                    <span className="truncate">{displayBrand}</span>
                  </div>
                )}
                <div>
                  <h5 className="text-[12px] font-black leading-tight tracking-tight uppercase line-clamp-3 text-white drop-shadow-md">
                    {displayTitle}
                  </h5>
                  {displaySlogan && (
                    <p className="text-[9px] text-slate-300 font-medium leading-tight mt-1 line-clamp-2">
                      {displaySlogan}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {displayPrice && (
                  <div
                    className="inline-block text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm"
                    style={{ backgroundColor: primaryColor, color: "#111827" }}
                  >
                    {displayPrice}
                  </div>
                )}
                <div className="w-full bg-white text-slate-950 text-[9px] font-black py-1 px-2 rounded-lg text-center uppercase tracking-wider shadow-sm truncate">
                  {displayCta}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Foto o Producto */}
            <div className="col-span-5 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/20 rounded-xl p-2 text-center">
              <span className="text-xl mb-1">📸</span>
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 leading-tight">
                Zona de Producto Despejada
              </span>
            </div>
          </div>
        )}

        {/* ── LAYOUT 2: CABECERA SUPERIOR ── */}
        {layout === "top_banner" && (
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Bloque Superior: Titular y Marca */}
            <div className="bg-slate-950/80 backdrop-blur-xs p-2 rounded-xl border border-white/10 space-y-1">
              {displayBrand && (
                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-300">
                  <span className="truncate">{displayBrand}</span>
                  {displayPrice && (
                    <span
                      className="px-1.5 py-0.5 rounded-sm font-bold"
                      style={{ backgroundColor: primaryColor, color: "#111827" }}
                    >
                      {displayPrice}
                    </span>
                  )}
                </div>
              )}
              <h5 className="text-[12px] font-black leading-tight tracking-tight uppercase text-white drop-shadow-md text-center">
                {displayTitle}
              </h5>
              {displaySlogan && (
                <p className="text-[8px] text-slate-300 font-medium text-center line-clamp-1">
                  {displaySlogan}
                </p>
              )}
            </div>

            {/* Centro: Foto libre */}
            <div className="flex-1 my-2 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/20 rounded-xl text-center p-2">
              <span className="text-2xl mb-1">📸</span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                Escena Fotográfica Central
              </span>
            </div>

            {/* Pie: CTA */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div
                className="w-full text-[9px] font-black py-1.5 px-3 rounded-lg text-center uppercase tracking-wider shadow-sm truncate"
                style={{ backgroundColor: primaryColor, color: "#111827" }}
              >
                {displayCta}
              </div>
            </div>
          </div>
        )}

        {/* ── LAYOUT 3: FICHA INFORMATIVA ── */}
        {layout === "recipe_ingredients" && (
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Cabecera */}
            <div className="text-center space-y-0.5">
              {displayBrand && (
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                  {displayBrand}
                </span>
              )}
              <h5 className="text-[11px] font-black uppercase text-white tracking-tight leading-tight">
                {displayTitle}
              </h5>
            </div>

            {/* Centro Foto */}
            <div className="h-20 my-1 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/20 rounded-xl">
              <span className="text-lg">🍽️ / 📦</span>
              <span className="text-[7px] font-black uppercase text-slate-400">Encuadre Cenital</span>
            </div>

            {/* Puntos de Información / Ficha */}
            <div className="grid grid-cols-3 gap-1 my-1">
              <div className="bg-white/10 rounded-md p-1 text-center">
                <span className="text-[7px] block font-bold text-amber-400">Punto 1</span>
                <span className="text-[7px] block text-slate-300 truncate">Calidad</span>
              </div>
              <div className="bg-white/10 rounded-md p-1 text-center">
                <span className="text-[7px] block font-bold text-amber-400">Punto 2</span>
                <span className="text-[7px] block text-slate-300 truncate">Rapidez</span>
              </div>
              <div className="bg-white/10 rounded-md p-1 text-center">
                <span className="text-[7px] block font-bold text-amber-400">Punto 3</span>
                <span className="text-[7px] block text-slate-300 truncate">Garantía</span>
              </div>
            </div>

            {/* Pie CTA */}
            <div className="flex items-center justify-between gap-1 pt-1">
              {displayPrice && (
                <span
                  className="text-[9px] font-black px-2 py-1 rounded-md"
                  style={{ backgroundColor: primaryColor, color: "#111827" }}
                >
                  {displayPrice}
                </span>
              )}
              <div className="flex-1 bg-white text-slate-900 text-[8px] font-black py-1 px-2 rounded-md text-center uppercase tracking-wider truncate">
                {displayCta}
              </div>
            </div>
          </div>
        )}

        {/* ── LAYOUT 4: AUTOMÁTICO (EQUILIBRADO) ── */}
        {(layout === "auto" || !layout) && (
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              {displayBrand && (
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-300 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  {displayBrand}
                </span>
              )}
              {displayPrice && (
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full shadow-md"
                  style={{ backgroundColor: primaryColor, color: "#111827" }}
                >
                  {displayPrice}
                </span>
              )}
            </div>

            <div className="my-auto py-2 text-center space-y-1.5">
              <span className="inline-block text-[8px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-md">
                Composición Dinámica
              </span>
              <h5 className="text-[13px] font-black uppercase leading-tight tracking-tight text-white drop-shadow-lg px-2">
                {displayTitle}
              </h5>
              {displaySlogan && (
                <p className="text-[9px] text-slate-200 font-medium px-2 line-clamp-2 drop-shadow-md">
                  {displaySlogan}
                </p>
              )}
            </div>

            <div className="pt-1">
              <div
                className="w-full text-[9px] font-black py-1.5 px-3 rounded-xl text-center uppercase tracking-wider shadow-lg truncate"
                style={{ backgroundColor: primaryColor, color: "#111827" }}
              >
                {displayCta}
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-400 font-medium text-center mt-3 max-w-xs leading-tight">
        💡 Los textos y elementos se integran respetando el contraste y estilo ({visualStyle}) sin tapar los detalles fotográficos.
      </p>
    </div>
  );
}
