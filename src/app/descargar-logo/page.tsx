"use client";

import { useRef, useEffect, useState } from "react";
import LogoMark from "../../components/LogoMark";

type BgOption = "dark" | "orange" | "white" | "transparent";

export default function DescargarLogoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bgType, setBgType] = useState<BgOption>("dark");
  const [size] = useState<number>(512);

  const drawLogo = (ctx: CanvasRenderingContext2D, width: number, height: number, bg: BgOption) => {
    ctx.clearRect(0, 0, width, height);

    // Background
    if (bg === "dark") {
      ctx.fillStyle = "#0A0A0B";
      ctx.fillRect(0, 0, width, height);
    } else if (bg === "white") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
    } else if (bg === "orange") {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#FFB000");
      bgGrad.addColorStop(0.55, "#FF6B00");
      bgGrad.addColorStop(1, "#FF3D00");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // Scale SVG path: viewBox 0 0 64 64 (V4 · Code Orbit <S>)
    const padding = width * 0.16;
    const drawSize = width - padding * 2;
    const scale = drawSize / 64;

    ctx.save();
    ctx.translate(padding, padding);
    ctx.scale(scale, scale);

    let paint: string | CanvasGradient;
    if (bg === "orange") {
      paint = "#FFFFFF";
    } else {
      const grad = ctx.createLinearGradient(6, 4, 58, 60);
      grad.addColorStop(0, "#FFB000");
      grad.addColorStop(0.5, "#FF6B00");
      grad.addColorStop(1, "#FF3D00");
      paint = grad;
    }

    // 1. Orbit ellipse rotated -30 deg around (32, 32)
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.ellipse(32, 32, 29.5, 11, (-30 * Math.PI) / 180, 0, Math.PI * 2);
    ctx.strokeStyle = paint;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();

    // 2. Code <S> path: M44 17H24L17 24.5L24 32H40L47 39.5L40 47H20
    ctx.beginPath();
    ctx.moveTo(44, 17);
    ctx.lineTo(24, 17);
    ctx.lineTo(17, 24.5);
    ctx.lineTo(24, 32);
    ctx.lineTo(40, 32);
    ctx.lineTo(47, 39.5);
    ctx.lineTo(40, 47);
    ctx.lineTo(20, 47);
    ctx.strokeStyle = paint;
    ctx.lineWidth = 6.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // 3. Satellite node: cx="57.2" cy="17.5" r="4.3"
    ctx.beginPath();
    ctx.arc(57.2, 17.5, 4.3, 0, Math.PI * 2);
    ctx.fillStyle = paint;
    ctx.fill();

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawLogo(ctx, size, size, bgType);
  }, [size, bgType]);

  const handleDownload = (downloadSize: number, background: BgOption, filename: string) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = downloadSize;
    tempCanvas.height = downloadSize;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    drawLogo(ctx, downloadSize, downloadSize, background);

    const link = document.createElement("a");
    link.download = filename;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  };

  const handleDownloadSvg = () => {
    const isWhite = bgType === "orange";
    const svgContent = `<svg width="1080" height="1080" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFB000"/>
      <stop offset="0.5" stop-color="#FF6B00"/>
      <stop offset="1" stop-color="#FF3D00"/>
    </linearGradient>
  </defs>
  <ellipse cx="32" cy="32" rx="29.5" ry="11" transform="rotate(-30 32 32)" stroke="${isWhite ? "#FFFFFF" : "url(#g)"}" stroke-width="2.6" opacity="0.88"/>
  <path d="M44 17H24L17 24.5L24 32H40L47 39.5L40 47H20" stroke="${isWhite ? "#FFFFFF" : "url(#g)"}" stroke-width="6.8" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="57.2" cy="17.5" r="4.3" fill="${isWhite ? "#FFFFFF" : "url(#g)"}"/>
</svg>`;
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `santisoft-isotipo-${isWhite ? "blanco" : "color"}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getPreviewBgStyle = (bg: BgOption): React.CSSProperties => {
    if (bg === "dark") return { background: "#0A0A0B" };
    if (bg === "white") return { background: "#FFFFFF" };
    if (bg === "orange") return { background: "linear-gradient(135deg, #FFB000, #FF6B00 55%, #FF3D00)" };
    return {
      background: "repeating-conic-gradient(#1b1b1f 0% 25%, #26262c 0% 50%) 50% / 16px 16px",
    };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#fff", fontFamily: "sans-serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <LogoMark size={36} />
          <span style={{ fontWeight: 900, letterSpacing: "1px", fontSize: "20px" }}>SANTISOFT</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "10px" }}>Kit de Logo para Redes Sociales y Web</h1>
        <p style={{ color: "#999", fontSize: "14px", marginBottom: "28px" }}>
          Elige el fondo y descarga el isotipo oficial en formato cuadrado o circular para Instagram, TikTok, LinkedIn, WhatsApp y web.
        </p>

        {/* Vista previa cuadrada + circular (como se ve en perfil de Instagram/TikTok) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", flexWrap: "wrap", marginBottom: "28px" }}>
          {/* Cuadrada */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              background: "repeating-conic-gradient(#1b1b1f 0% 25%, #26262c 0% 50%) 50% / 16px 16px",
              borderRadius: "24px",
              padding: "12px",
              display: "inline-block",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div
                style={{
                  width: "160px",
                  height: "160px",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: bgType === "dark" ? "1px solid rgba(255,255,255,0.08)" : "none",
                  ...getPreviewBgStyle(bgType),
                }}
              >
                <LogoMark size={108} color={bgType === "orange" ? "#FFFFFF" : "#FF6B00"} />
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "#aaa", marginTop: "8px", fontWeight: 600 }}>Vista Cuadrada (App / Post)</div>
          </div>

          {/* Circular (Perfil RRSS) */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
              borderRadius: "9999px",
              padding: "4px",
              display: "inline-block",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}>
              <div
                style={{
                  width: "160px",
                  height: "160px",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid #0A0A0B",
                  ...getPreviewBgStyle(bgType),
                }}
              >
                <LogoMark size={104} color={bgType === "orange" ? "#FFFFFF" : "#FF6B00"} />
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "#aaa", marginTop: "8px", fontWeight: 600 }}>Perfil Instagram / TikTok</div>
          </div>
        </div>

        {/* Canvas oculto de respaldo */}
        <canvas ref={canvasRef} width={size} height={size} style={{ display: "none" }} />

        {/* Opciones de Fondo */}
        <div style={{ marginBottom: "28px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}>
          {([
            { id: "dark", label: "Oscuro (Ideal RRSS)" },
            { id: "orange", label: "Naranja (Logo Blanco)" },
            { id: "white", label: "Blanco" },
            { id: "transparent", label: "Transparente (PNG)" },
          ] as const).map((item) => (
            <button
              key={item.id}
              onClick={() => setBgType(item.id)}
              style={{
                background: bgType === item.id ? "#FF6B00" : "#1c1c22",
                color: "#fff",
                border: bgType === item.id ? "1px solid #FF8533" : "1px solid #333",
                borderRadius: "10px",
                padding: "9px 16px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Botones de Descarga */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "420px", margin: "0 auto" }}>
          <button
            onClick={() => handleDownload(1080, bgType, `santisoft-logo-rrss-1080x1080-${bgType}.png`)}
            style={{
              background: "linear-gradient(135deg, #FFB000, #FF6B00 55%, #FF3D00)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "15px 20px",
              fontSize: "15px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 10px 25px -5px rgba(255, 107, 0, 0.4)"
            }}
          >
            📸 Descargar 1080 x 1080 px (Perfil Instagram / TikTok / LinkedIn)
          </button>

          <button
            onClick={() => handleDownload(512, bgType, `santisoft-logo-512x512-${bgType}.png`)}
            style={{
              background: "#1c1c20",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "12px",
              padding: "13px 20px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            📥 Descargar 512 x 512 px (Alta Resolución Web)
          </button>

          <button
            onClick={handleDownloadSvg}
            style={{
              background: "#1c1c20",
              color: "#ffb066",
              border: "1px solid #442a16",
              borderRadius: "12px",
              padding: "13px 20px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            ✨ Descargar SVG Vectorial (Escalable infinito)
          </button>

          <button
            onClick={() => handleDownload(120, bgType, `santisoft-logo-120x120-${bgType}.png`)}
            style={{
              background: "transparent",
              color: "#888",
              border: "1px solid #28282e",
              borderRadius: "12px",
              padding: "11px 20px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            ☁️ Descargar 120 x 120 px (Verificación Google Cloud)
          </button>
        </div>
      </div>
    </div>
  );
}
