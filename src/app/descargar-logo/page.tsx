"use client";

import { useRef, useEffect, useState } from "react";
import LogoMark from "../../components/LogoMark";

export default function DescargarLogoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bgType, setBgType] = useState<"transparent" | "dark" | "white">("white");
  const [size, setSize] = useState<number>(120);

  const drawLogo = (ctx: CanvasRenderingContext2D, width: number, height: number, bg: string) => {
    ctx.clearRect(0, 0, width, height);

    // Background
    if (bg === "dark") {
      ctx.fillStyle = "#0A0A0B";
      ctx.fillRect(0, 0, width, height);
    } else if (bg === "white") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
    }

    // Scale SVG path: viewBox 0 0 64 64, path: M 64 8 L 32 8 L 8 32 L 56 32 L 32 56 L 0 56, stroke #FF6B00, strokeWidth 16
    const padding = width * 0.15;
    const drawSize = width - padding * 2;
    const scale = drawSize / 64;

    ctx.save();
    ctx.translate(padding, padding);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.moveTo(64, 8);
    ctx.lineTo(32, 8);
    ctx.lineTo(8, 32);
    ctx.lineTo(56, 32);
    ctx.lineTo(32, 56);
    ctx.lineTo(0, 56);

    ctx.strokeStyle = "#FF6B00";
    ctx.lineWidth = 16;
    ctx.lineCap = "butt";
    ctx.lineJoin = "bevel";
    ctx.stroke();

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawLogo(ctx, size, size, bgType);
  }, [size, bgType]);

  const handleDownload = (downloadSize: number, background: "transparent" | "dark" | "white", filename: string) => {
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

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: "#fff", fontFamily: "sans-serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <LogoMark size={32} />
          <span style={{ fontWeight: 900, letterSpacing: "1px", fontSize: "20px" }}>SANTISOFT AI</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "10px" }}>Descargar Logo Oficial</h1>
        <p style={{ color: "#888", fontSize: "14px", marginBottom: "30px" }}>
          Generador de logo en alta resolución para la <strong>Verificación de Marca de Google Cloud</strong> (120x120 px requerido).
        </p>

        {/* Vista previa */}
        <div style={{ 
          background: bgType === "white" ? "#fff" : bgType === "dark" ? "#141416" : "repeating-conic-gradient(#222 0% 25%, #333 0% 50%) 50% / 20px 20px", 
          borderRadius: "16px", 
          padding: "40px", 
          display: "inline-block", 
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          marginBottom: "24px"
        }}>
          <canvas ref={canvasRef} width={size} height={size} style={{ width: "160px", height: "160px", imageRendering: "pixelated" }} />
        </div>

        {/* Opciones de Fondo */}
        <div style={{ marginBottom: "24px" }}>
          <span style={{ fontSize: "13px", color: "#aaa", marginRight: "12px" }}>Fondo:</span>
          {(["white", "dark", "transparent"] as const).map((bg) => (
            <button
              key={bg}
              onClick={() => setBgType(bg)}
              style={{
                background: bgType === bg ? "#FF6B00" : "#222",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                margin: "0 4px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {bg === "white" ? "Blanco (Recomendado)" : bg === "dark" ? "Oscuro" : "Transparente"}
            </button>
          ))}
        </div>

        {/* Botones de Descarga */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px", margin: "0 auto" }}>
          <button
            onClick={() => handleDownload(120, bgType, "santisoft-logo-120x120.png")}
            style={{
              background: "#FF6B00",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "15px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            📥 Descargar 120 x 120 px (Especial para Google Cloud)
          </button>

          <button
            onClick={() => handleDownload(512, bgType, "santisoft-logo-512x512.png")}
            style={{
              background: "#1c1c20",
              color: "#ddd",
              border: "1px solid #333",
              borderRadius: "12px",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            📥 Descargar 512 x 512 px (Alta Resolución)
          </button>
        </div>
      </div>
    </div>
  );
}
