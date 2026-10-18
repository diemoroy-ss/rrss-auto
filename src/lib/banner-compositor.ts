import sharp, { OverlayOptions } from "sharp";
import { adminStorage } from "./firebase-admin";
import { BannerCopyResult } from "./agents/agent-banner-copy";

export interface BannerCompositorOptions {
  baseImageUrl: string;
  bannerCopy: BannerCopyResult;
  logoUrl?: string;
  userId?: string;
  aspectRatio?: "1:1" | "9:16";
  includeLogo?: boolean;
}

/**
 * Escapa caracteres especiales para SVG XML seguro
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Divide un texto largo en líneas cortas para el titular SVG
 */
function wrapText(text: string, maxCharsPerLine: number = 18): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 3); // Máximo 3 líneas para no saturar la foto
}

/**
 * Motor de Composición de Banners Publicitarios (Sharp + SVG Vectorial):
 * Estampa titulares gruesos, badges de descuento, pastillas de beneficio y logos
 * con 100% de nitidez vectorial y garantía de contraste sobre cualquier fondo fotográfico.
 */
export async function composeBannerOnImage(options: BannerCompositorOptions): Promise<string> {
  const {
    baseImageUrl,
    bannerCopy,
    logoUrl,
    userId = "system",
    aspectRatio = "1:1",
    includeLogo = true
  } = options;

  const isVertical = aspectRatio === "9:16";
  const width = 1080;
  const height = isVertical ? 1920 : 1080;

  console.log(`[BannerCompositor] Componiendo banner publicitario ${width}x${height} para usuario: ${userId}...`);

  try {
    // 1. Descargar imagen base
    const imageRes = await fetch(baseImageUrl);
    if (!imageRes.ok) throw new Error(`Error descargando imagen base: ${imageRes.status}`);
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // 2. Redimensionar imagen base al tamaño exacto
    let processedMain = sharp(imageBuffer).resize(width, height, { fit: "cover", position: "center" });

    // 3. Preparar líneas del titular y cálculos de posición
    const headlineLines = wrapText(bannerCopy.mainHeadline, isVertical ? 16 : 20);
    const headlineFontSize = headlineLines.length > 2 ? (isVertical ? 64 : 54) : (isVertical ? 74 : 64);
    const headlineLineHeight = headlineFontSize * 1.15;

    // Posicionamiento dinámico (Top vs Middle)
    const badgeY = isVertical ? 180 : 80;
    const headlineStartY = isVertical ? badgeY + 110 : badgeY + 95;
    const benefitY = headlineStartY + (headlineLines.length * headlineLineHeight) + 30;

    // CTA Bar Position (Bottom)
    const ctaY = height - (isVertical ? 140 : 100);

    // 4. Generar SVG Vectorial de alta fidelidad
    const badgeTextEscaped = escapeXml(bannerCopy.badgeText);
    const benefitTextEscaped = escapeXml(bannerCopy.benefitText);
    const ctaTextEscaped = escapeXml(bannerCopy.ctaText);

    // Calcular ancho estimado del badge pill
    const badgeWidth = Math.min(width - 120, Math.max(280, badgeTextEscaped.length * 22 + 60));
    const badgeX = (width - badgeWidth) / 2;

    // Calcular ancho del benefit pill
    const benefitWidth = Math.min(width - 120, Math.max(340, benefitTextEscaped.length * 16 + 80));
    const benefitX = (width - benefitWidth) / 2;

    const svgOverlay = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Filtro de sombra profunda para legibilidad sobre cualquier foto -->
          <filter id="heavy-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.9" />
          </filter>

          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.5" />
          </filter>

          <!-- Degradado de contraste superior e inferior -->
          <linearGradient id="top-scrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.75" />
            <stop offset="45%" stop-color="#000000" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </linearGradient>

          <linearGradient id="bottom-scrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#000000" stop-opacity="0" />
            <stop offset="60%" stop-color="#000000" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.85" />
          </linearGradient>
        </defs>

        <!-- 1. Capas de gradiente de contraste para asegurar 100% de legibilidad -->
        <rect x="0" y="0" width="${width}" height="${height * 0.45}" fill="url(#top-scrim)" />
        <rect x="0" y="${height * 0.65}" width="${width}" height="${height * 0.35}" fill="url(#bottom-scrim)" />

        <!-- 2. Badge Superior (Pastilla destacada de promoción) -->
        <g filter="url(#soft-shadow)">
          <rect x="${badgeX}" y="${badgeY}" width="${badgeWidth}" height="56" rx="28" fill="${bannerCopy.badgeBgColor}" />
          <text 
            x="${width / 2}" 
            y="${badgeY + 36}" 
            fill="${bannerCopy.badgeTextColor}" 
            font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif" 
            font-size="22" 
            font-weight="900" 
            letter-spacing="1.5"
            text-anchor="middle"
          >
            ${badgeTextEscaped}
          </text>
        </g>

        <!-- 3. Titular Principal en Mayúsculas con Sombra Gruesa -->
        <g filter="url(#heavy-shadow)">
          ${headlineLines
            .map(
              (line, idx) => `
            <text 
              x="${width / 2}" 
              y="${headlineStartY + (idx * headlineLineHeight)}" 
              fill="${bannerCopy.headlineColor}" 
              font-family="system-ui, -apple-system, Montserrat, 'Arial Black', Impact, sans-serif" 
              font-size="${headlineFontSize}" 
              font-weight="900" 
              letter-spacing="1.2"
              text-anchor="middle"
            >
              ${escapeXml(line)}
            </text>
          `
            )
            .join("")}
        </g>

        <!-- 4. Pastilla de Beneficio / Detalle de la Oferta -->
        <g filter="url(#soft-shadow)">
          <rect x="${benefitX}" y="${benefitY}" width="${benefitWidth}" height="52" rx="14" fill="${bannerCopy.benefitBgColor}" stroke="${bannerCopy.accentColor}" stroke-width="2" stroke-opacity="0.6" />
          <text 
            x="${width / 2}" 
            y="${benefitY + 33}" 
            fill="${bannerCopy.benefitTextColor}" 
            font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif" 
            font-size="20" 
            font-weight="700" 
            text-anchor="middle"
          >
            ${benefitTextEscaped}
          </text>
        </g>

        <!-- 5. Barra Inferior de Llamado a la Acción / Ubicación -->
        <g filter="url(#soft-shadow)">
          <rect x="40" y="${ctaY - 10}" width="${width - 80}" height="64" rx="20" fill="rgba(15, 23, 42, 0.88)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
          <text 
            x="${width / 2}" 
            y="${ctaY + 30}" 
            fill="#ffffff" 
            font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif" 
            font-size="21" 
            font-weight="800" 
            text-anchor="middle"
          >
            ${ctaTextEscaped}
          </text>
        </g>
      </svg>
    `;

    const svgBuffer = Buffer.from(svgOverlay);
    const composites: OverlayOptions[] = [{ input: svgBuffer, top: 0, left: 0 }];

    // 5. Descargar y superponer logo PNG si está configurado
    if (includeLogo && logoUrl) {
      try {
        const logoRes = await fetch(logoUrl);
        if (logoRes.ok) {
          const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
          const targetLogoWidth = isVertical ? 220 : 180;

          const resizedLogo = await sharp(logoBuffer)
            .resize({ width: targetLogoWidth, fit: "inside" })
            .png()
            .toBuffer();

          const logoMeta = await sharp(resizedLogo).metadata();
          const finalLogoWidth = logoMeta.width || targetLogoWidth;
          const finalLogoHeight = logoMeta.height || 60;

          // Ubicar el logo en la esquina superior izquierda o inferior
          const logoTop = isVertical ? 60 : 40;
          const logoLeft = 50;

          composites.push({
            input: resizedLogo,
            top: logoTop,
            left: logoLeft
          });
        }
      } catch (logoErr) {
        console.warn("[BannerCompositor] No se pudo cargar logo PNG, continuando sin logo:", logoErr);
      }
    }

    // 6. Procesar la composición final en Sharp con calidad de imprenta
    const finalBuffer = await processedMain
      .composite(composites)
      .jpeg({ quality: 92 })
      .toBuffer();

    console.log(`[BannerCompositor] ✅ Composición completada. Subiendo a Firebase Storage...`);

    // 7. Subir a Firebase Storage
    if (!adminStorage) {
      console.warn("[BannerCompositor] adminStorage no disponible, devolviendo baseImageUrl como fallback.");
      return baseImageUrl;
    }

    const bucket = adminStorage.bucket();
    const timestamp = Date.now();
    const destination = `users/${userId}/commercial_banners/${timestamp}.jpg`;

    const file = bucket.file(destination);
    await file.save(finalBuffer, {
      metadata: {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=31536000"
      }
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    console.log(`[BannerCompositor] 🚀 Cartel comercial generado con éxito: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error("[BannerCompositor] ❌ Error componiendo banner:", error.message || error);
    return baseImageUrl; // Fallback seguro a la foto sin textos en caso de error
  }
}
