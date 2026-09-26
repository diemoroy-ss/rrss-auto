import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export interface CompositeOptions {
  baseImageUrl: string;
  logoUrl?: string;
  logoPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center";
  logoSize?: number; // en px (80 a 200)
  logoTransparent?: boolean;
  offerText?: string;
  businessName?: string;
  userId?: string;
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
    userId = "admin",
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

  const textLayers: any[] = [];
  if (offerText && offerText.trim().length > 0) {
    textLayers.push({
      x: 50,
      y: 90,
      text: offerText.trim().toUpperCase(),
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
 * Compone la imagen base con el logo y texto en un lienzo HTML5 Canvas en memoria.
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

          // 3. Dibujar badge de oferta si existe
          drawOfferBadge(ctx, options.offerText, W, H);

          resolve(canvas.toDataURL("image/jpeg", 0.94));
        };

        logoImg.onerror = () => {
          // Si el logo falla por CORS, continuar con la base y el texto
          drawOfferBadge(ctx, options.offerText, W, H);
          resolve(canvas.toDataURL("image/jpeg", 0.94));
        };

        logoImg.src = options.logoUrl;
      } else {
        // Sin logo: dibujar solo badge si hay
        drawOfferBadge(ctx, options.offerText, W, H);
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

function drawOfferBadge(ctx: CanvasRenderingContext2D, text: string | undefined, W: number, H: number) {
  if (!text || text.trim().length === 0) return;
  const clean = text.trim();

  ctx.save();
  ctx.font = "bold 32px 'Montserrat', sans-serif";
  const metrics = ctx.measureText(clean);
  const badgeW = Math.min(metrics.width + 60, W - 120);
  const badgeH = 68;
  const badgeX = (W - badgeW) / 2;
  const badgeY = H - badgeH - 60;

  // Sombra del badge
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;

  // Fondo translúcido premium
  ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 34);
  ctx.fill();

  // Texto centrado
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px 'Montserrat', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(clean, W / 2, badgeY + badgeH / 2, badgeW - 40);
  ctx.restore();
}
