import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export type BadgeStyle = "sticker-circle" | "pill-fire" | "gold-gourmet" | "corner-ribbon";

export interface CompositeOptions {
  baseImageUrl: string;
  logoUrl?: string;
  logoPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center";
  logoSize?: number; // en px (80 a 200)
  logoTransparent?: boolean;
  offerText?: string;
  badgeCustomText?: string;
  badgeStyle?: BadgeStyle;
  dishOrProductName?: string;
  businessName?: string;
  userId?: string;
  /** Marca de agua que dice "Creado por Santisoft.cl" */
  includeSantisoftWatermark?: boolean;
}

/**
 * Registra los parámetros en Firestore collection "preview_renders"
 * y retorna la URL para renderizado mediante Butterfly Social.
 */
export async function createButterflyRender(options: CompositeOptions): Promise<{ renderId: string; butterflyUrl: string }> {
  const {
    baseImageUrl,
    logoUrl,
    logoPosition,
    logoSize = 100,
    logoTransparent = false,
    offerText,
    badgeCustomText,
    dishOrProductName,
    userId = "admin",
    includeSantisoftWatermark = true,
  } = options;

  // Mapear posición a coordenadas porcentuales (0-100%)
  const positionMap: Record<string, { x: number; y: number }> = {
    "top-left":     { x: 14, y: 14 },
    "top-right":    { x: 86, y: 14 },
    "bottom-left":  { x: 14, y: 86 },
    "bottom-right": { x: 86, y: 86 },
    "top-center":   { x: 50, y: 14 },
  };

  const coords = positionMap[logoPosition] || { x: 86, y: 14 };

  // El texto del badge en la imagen es EXCLUSIVAMENTE badgeCustomText o offerText.
  // dishOrProductName es solo referencia para el copy y prompt de imagen.
  const badgeText = badgeCustomText?.trim() || offerText?.trim() || "";

  const textLayers: any[] = [];
  if (badgeText && badgeText.length > 0) {
    textLayers.push({
      x: 50,
      y: 90,
      text: badgeText.toUpperCase(),
      color: "#ffffff",
      font: "Montserrat",
      size: 32,
      isBold: true,
      backgroundColor: "rgba(15, 23, 42, 0.88)",
      isPill: true,
      shadowLevel: "hard",
      letterSpacing: "wide"
    });
  }

  // Marca de agua Santisoft.cl
  if (includeSantisoftWatermark) {
    textLayers.push({
      x: 82,
      y: 96,
      text: "Creado por Santisoft.cl",
      color: "#ffffff",
      font: "Montserrat",
      size: 15,
      isBold: true,
      backgroundColor: "rgba(15, 23, 42, 0.82)",
      isPill: true,
      shadowLevel: "soft",
      letterSpacing: "normal"
    });
  }

  const docRef = await addDoc(collection(db, "preview_renders"), {
    baseImageUrl,
    userId,
    useLogo: Boolean(logoUrl),
    logoUrl: logoUrl || null,
    logoX: coords.x,
    logoY: coords.y,
    logoWidth: logoSize,
    logoBg: logoTransparent ? "transparent" : "white",
    textLayers,
    watermarkSantisoft: includeSantisoftWatermark,
    createdAt: new Date(),
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";
  const renderUrl = `${baseUrl}/render/preview?id=${docRef.id}`;
  const butterflyUrl = `https://butterfly.santisoft.cl/link-previews/v1?url=${encodeURIComponent(renderUrl)}`;

  return {
    renderId: docRef.id,
    butterflyUrl,
  };
}

/**
 * Compone la imagen base con el logo, texto y marca de agua en un lienzo HTML5 Canvas en memoria.
 * Funciona de manera instantánea en el navegador del admin, sin esperas de red ni dependencias externas.
 */
export async function compositeImageClient(options: CompositeOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Canvas sólo disponible en navegador"));
    }

    const canvas = document.createElement("canvas");
    const W = 1080;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    if (!ctx) return reject(new Error("No se pudo inicializar el contexto 2D"));

    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";

    baseImg.onload = () => {
      // 1. Dibujar imagen de fondo manteniendo proporción y cubriendo
      const scale = Math.max(W / baseImg.width, H / baseImg.height);
      const x = (W - baseImg.width * scale) / 2;
      const y = (H - baseImg.height * scale) / 2;
      ctx.drawImage(baseImg, x, y, baseImg.width * scale, baseImg.height * scale);

      // 2. Si hay logo, componerlo
      if (options.logoUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";

        logoImg.onload = () => {
          const lSize = Math.round((options.logoSize || 100) * 2.2); // Escala para lienzo 1080px
          const padding = options.logoTransparent ? 0 : 20;

          // Calcular posición según coordenadas
          const positionMap: Record<string, { x: number; y: number }> = {
            "top-left":     { x: 70, y: 70 },
            "top-right":    { x: W - lSize - 70, y: 70 },
            "bottom-left":  { x: 70, y: H - lSize - 120 },
            "bottom-right": { x: W - lSize - 70, y: H - lSize - 120 },
            "top-center":   { x: (W - lSize) / 2, y: 70 },
          };

          const pos = positionMap[options.logoPosition] || positionMap["top-right"];

          // Fondo tarjeta del logo si no es transparente
          if (!options.logoTransparent) {
            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
            ctx.shadowBlur = 28;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 10;
            ctx.fillStyle = "#ffffff";
            drawRoundedRect(ctx, pos.x, pos.y, lSize, lSize, 24);
            ctx.fill();
            ctx.restore();
          }

          // Ajustar logo dentro del contenedor
          const innerW = lSize - padding * 2;
          const innerH = lSize - padding * 2;
          const logoAspect = logoImg.width / logoImg.height;
          let drawW = innerW;
          let drawH = innerH;

          if (logoAspect > 1) {
            drawH = innerW / logoAspect;
          } else {
            drawW = innerH * logoAspect;
          }

          const drawX = pos.x + padding + (innerW - drawW) / 2;
          const drawY = pos.y + padding + (innerH - drawH) / 2;

          ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);

          const badgeText = options.badgeCustomText?.trim() || options.offerText?.trim() || "";

          // 3. Dibujar badge de oferta o producto si existe
          drawOfferBadge(ctx, badgeText, W, H, options.badgeStyle, options.logoPosition);

          // 4. Dibujar marca de agua Santisoft.cl si está activa
          if (options.includeSantisoftWatermark !== false) {
            drawSantisoftWatermark(ctx, W, H, Boolean(badgeText));
          }

          resolve(canvas.toDataURL("image/jpeg", 0.94));
        };

        logoImg.onerror = () => {
          const badgeText = options.badgeCustomText?.trim() || options.offerText?.trim() || "";

          // Si el logo falla por CORS, continuar con la base, el texto y la marca de agua
          drawOfferBadge(ctx, badgeText, W, H, options.badgeStyle, options.logoPosition);
          if (options.includeSantisoftWatermark !== false) {
            drawSantisoftWatermark(ctx, W, H, Boolean(badgeText));
          }
          resolve(canvas.toDataURL("image/jpeg", 0.94));
        };

        logoImg.src = options.logoUrl;
      } else {
        const badgeText = options.badgeCustomText?.trim() || options.offerText?.trim() || "";

        // Sin logo: dibujar solo badge y marca de agua
        drawOfferBadge(ctx, badgeText, W, H, options.badgeStyle, options.logoPosition);
        if (options.includeSantisoftWatermark !== false) {
          drawSantisoftWatermark(ctx, W, H, Boolean(badgeText));
        }
        resolve(canvas.toDataURL("image/jpeg", 0.94));
      }
    };

    baseImg.onerror = (e) => reject(new Error("No se pudo cargar la imagen base en Canvas"));
    baseImg.src = options.baseImageUrl;
  });
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawOfferBadge(
  ctx: CanvasRenderingContext2D,
  text: string | undefined,
  W: number,
  H: number,
  style: BadgeStyle = "sticker-circle",
  logoPosition: string = "top-right"
) {
  if (!text || text.trim().length === 0) return;
  const clean = text.trim();

  // Determinación de esquina opuesta al logo para no superponerse
  const isLogoOnRight = logoPosition.includes("right") || logoPosition === "top-center";
  const isLogoOnBottom = logoPosition.includes("bottom");

  // 1. ESTILO 1: STICKER CIRCULAR TROQUELADO (🔥 Sello de Oferta)
  if (style === "sticker-circle") {
    ctx.save();
    const R = 95;
    const cx = isLogoOnRight ? 165 : W - 165;
    const cy = isLogoOnBottom ? 165 : (isLogoOnRight ? 165 : 165);

    ctx.translate(cx, cy);
    ctx.rotate(-0.13); // -7.5 grados de rotación para look de sticker dinámico

    // Sombra 3D profunda del sticker
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 8;

    // Borde blanco grueso troquelado exterior
    ctx.beginPath();
    ctx.arc(0, 0, R + 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Limpiar sombra para capas internas
    ctx.shadowColor = "transparent";

    // Fondo degradado rojo fuego a naranja vivo
    const grad = ctx.createLinearGradient(-R, -R, R, R);
    grad.addColorStop(0, "#DC2626"); // Red 600
    grad.addColorStop(0.5, "#EF4444"); // Red 500
    grad.addColorStop(1, "#EA580C"); // Orange 600
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Anillo interior blanco punteado decorativo
    ctx.beginPath();
    ctx.arc(0, 0, R - 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Partición de texto en 1 o 2 líneas
    const words = clean.split(" ");
    let line1 = "";
    let line2 = "";

    if (words.length >= 2) {
      if (words.length === 2) {
        line1 = words[0];
        line2 = words[1];
      } else {
        // Ej: "Jueves 30% OFF" -> "Jueves" / "30% OFF"
        line1 = words[0];
        line2 = words.slice(1).join(" ");
      }
    } else {
      line1 = "";
      line2 = clean;
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (line1) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px 'Montserrat', sans-serif";
      ctx.fillText(line1.toUpperCase(), 0, -22);

      ctx.fillStyle = "#FEF08A"; // Amarillo brillante
      ctx.font = "900 32px 'Montserrat', sans-serif";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 2;
      ctx.fillText(line2.toUpperCase(), 0, 18);
    } else {
      ctx.fillStyle = "#FEF08A";
      ctx.font = "900 32px 'Montserrat', sans-serif";
      ctx.fillText(line2.toUpperCase(), 0, 0);
    }

    ctx.restore();
    return;
  }

  // 2. ESTILO 2: CÁPSULA FLOTANTE DE ALTA ENERGÍA (⚡ Fuego y Resplandor)
  if (style === "pill-fire") {
    ctx.save();
    ctx.font = "900 27px 'Montserrat', sans-serif";
    const fullText = "🔥 " + clean.toUpperCase();
    const metrics = ctx.measureText(fullText);
    const pillW = Math.min(metrics.width + 56, W - 140);
    const pillH = 68;
    const pillX = isLogoOnRight ? 60 : W - pillW - 60;
    const pillY = isLogoOnBottom ? 60 : H - pillH - 70;

    // Resplandor (glow) rojizo difuso
    ctx.shadowColor = "rgba(239, 68, 68, 0.65)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 6;

    // Degradado rojo a naranja fuego
    const grad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
    grad.addColorStop(0, "#EF4444");
    grad.addColorStop(1, "#F97316");
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 34);
    ctx.fill();

    // Borde brillante blanco semitransparente
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 34);
    ctx.stroke();

    // Texto blanco bold con sombra
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fullText, pillX + pillW / 2, pillY + pillH / 2, pillW - 30);

    ctx.restore();
    return;
  }

  // 3. ESTILO 3: SELLO DORADO GOURMET (⭐ Exclusivo y Elegante)
  if (style === "gold-gourmet") {
    ctx.save();
    ctx.font = "bold 25px 'Montserrat', sans-serif";
    const fullText = "⭐ " + clean.toUpperCase();
    const metrics = ctx.measureText(fullText);
    const pillW = Math.min(metrics.width + 52, W - 140);
    const pillH = 66;
    const pillX = isLogoOnRight ? 60 : W - pillW - 60;
    const pillY = isLogoOnBottom ? 60 : H - pillH - 70;

    // Sombra profunda
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;

    // Fondo obsidiana / carbón
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 18);
    ctx.fill();

    // Borde dorado metálico
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 18);
    ctx.stroke();

    // Filete interior dorado sutil
    ctx.strokeStyle = "rgba(253, 230, 138, 0.35)";
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, pillX + 4, pillY + 4, pillW - 8, pillH - 8, 14);
    ctx.stroke();

    // Texto dorado
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#FDE68A";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fullText, pillX + pillW / 2, pillY + pillH / 2, pillW - 30);

    ctx.restore();
    return;
  }

  // 4. ESTILO 4: CINTA TROQUELADA / RIBBON COMERCIAL (🏷️ Banderín)
  if (style === "corner-ribbon") {
    ctx.save();
    ctx.font = "900 25px 'Montserrat', sans-serif";
    const fullText = "🏷️ " + clean.toUpperCase();
    const metrics = ctx.measureText(fullText);
    const ribW = Math.min(metrics.width + 65, W - 100);
    const ribH = 64;
    const ribX = isLogoOnRight ? 0 : W - ribW;
    const ribY = isLogoOnBottom ? 70 : (isLogoOnRight ? 70 : 70);

    // Sombra 3D hacia abajo
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;

    ctx.beginPath();
    if (isLogoOnRight) {
      // Banderín pegado al margen izquierdo con muesca a la derecha
      ctx.moveTo(ribX, ribY);
      ctx.lineTo(ribX + ribW, ribY);
      ctx.lineTo(ribX + ribW - 16, ribY + ribH / 2);
      ctx.lineTo(ribX + ribW, ribY + ribH);
      ctx.lineTo(ribX, ribY + ribH);
    } else {
      // Banderín pegado al margen derecho con muesca a la izquierda
      ctx.moveTo(ribX + ribW, ribY);
      ctx.lineTo(ribX, ribY);
      ctx.lineTo(ribX + 16, ribY + ribH / 2);
      ctx.lineTo(ribX, ribY + ribH);
      ctx.lineTo(ribX + ribW, ribY + ribH);
    }
    ctx.closePath();

    // Gradiente rojo carmesí
    const grad = ctx.createLinearGradient(ribX, ribY, ribX + ribW, ribY);
    grad.addColorStop(0, "#B91C1C");
    grad.addColorStop(1, "#DC2626");
    ctx.fillStyle = grad;
    ctx.fill();

    // Borde inferior dorado fino
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (isLogoOnRight) {
      ctx.moveTo(ribX, ribY + ribH);
      ctx.lineTo(ribX + ribW, ribY + ribH);
    } else {
      ctx.moveTo(ribX, ribY + ribH);
      ctx.lineTo(ribX + ribW, ribY + ribH);
    }
    ctx.stroke();

    // Texto blanco
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const textCenterX = isLogoOnRight ? ribX + (ribW - 12) / 2 : ribX + ribW / 2 + 6;
    ctx.fillText(fullText, textCenterX, ribY + ribH / 2, ribW - 40);

    ctx.restore();
    return;
  }
}

function drawSantisoftWatermark(ctx: CanvasRenderingContext2D, W: number, H: number, hasOfferBadge: boolean) {
  ctx.save();
  const text = "Creado por Santisoft.cl";
  ctx.font = "bold 15px 'Montserrat', sans-serif";
  const metrics = ctx.measureText(text);
  const pillW = metrics.width + 42;
  const pillH = 34;
  
  // Si hay badge de oferta centrado abajo, posicionar en la esquina inferior derecha sin superponer
  const pillX = W - pillW - 32;
  const pillY = hasOfferBadge ? H - pillH - 18 : H - pillH - 28;

  // Sombra suave
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;

  // Cápsula oscura glassmorphism
  ctx.fillStyle = "rgba(15, 23, 42, 0.84)";
  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 17);
  ctx.fill();

  // Borde sutil
  ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Punto brillante índigo Santisoft
  ctx.fillStyle = "#818cf8";
  ctx.beginPath();
  ctx.arc(pillX + 16, pillY + pillH / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Texto
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px 'Montserrat', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, pillX + 26, pillY + pillH / 2);

  ctx.restore();
}
