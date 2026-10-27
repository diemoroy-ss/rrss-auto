import sharp, { OverlayOptions } from "sharp";
import { adminStorage } from "./firebase-admin";
import { BannerCopyResult } from "./agents/agent-banner-copy";
import { DEFAULT_TEXT_TEMPLATES, TextTemplate } from "./text-templates";

export type PosterLayoutVariant =
  | "split_left"
  | "top_clean_header"
  | "editorial_magazine"
  | "bottom_impact_card";

export interface BannerCompositorOptions {
  baseImageUrl: string;
  fallbackImageUrl?: string;
  bannerCopy: BannerCopyResult;
  price?: string;
  logoUrl?: string;
  userId?: string;
  aspectRatio?: "1:1" | "9:16";
  includeLogo?: boolean;
  templateId?: string;
  layoutVariant?: PosterLayoutVariant;
}

/**
 * Escapa caracteres especiales para SVG XML seguro
 */
function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Divide un texto largo en líneas cortas para el titular SVG
 */
function wrapText(text: string, maxCharsPerLine: number = 18, maxLines: number = 2): string[] {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const words = clean.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + " " + word).length <= maxCharsPerLine) {
      currentLine = currentLine + " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const overflow = lines.slice(maxLines).join(" ");
    const combinedLast = `${kept[maxLines - 1]} ${overflow}`;
    kept[maxLines - 1] =
      combinedLast.length > maxCharsPerLine + 5
        ? combinedLast.slice(0, maxCharsPerLine + 3).trim() + "…"
        : combinedLast;
    return kept;
  }
  return lines;
}

/**
 * Selecciona una plantilla de DEFAULT_TEXT_TEMPLATES por ID o al azar
 */
export function resolveTextTemplate(templateId?: string): TextTemplate {
  if (templateId) {
    const found = DEFAULT_TEXT_TEMPLATES.find((t) => t.id === templateId);
    if (found) return found;
  }
  const idx = Math.floor(Math.random() * DEFAULT_TEXT_TEMPLATES.length);
  return DEFAULT_TEXT_TEMPLATES[idx] || DEFAULT_TEXT_TEMPLATES[0];
}

/**
 * Determina el arquetipo de layout limpio y sin colisiones a partir de la plantilla
 */
export function resolveLayoutVariant(
  tpl: TextTemplate,
  explicitVariant?: PosterLayoutVariant
): PosterLayoutVariant {
  if (explicitVariant) return explicitVariant;
  if (tpl.layoutPosition === "split_left") return "split_left";
  if (
    tpl.category === "Gourmet & Menú" ||
    tpl.category === "Lifestyle & Marca" ||
    tpl.id === "tpl-new-dish" ||
    tpl.id === "tpl-recipe-pasta-garlic"
  ) {
    return "editorial_magazine";
  }
  if (
    tpl.category === "Ofertas Flash" ||
    tpl.category === "Delivery" ||
    tpl.id === "tpl-express-ramen"
  ) {
    return "bottom_impact_card";
  }
  return "top_clean_header";
}

function normalizeSvgColor(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  if (color.startsWith("rgba")) return "#0f172a";
  return color;
}

/**
 * Motor de Composición de Banners Publicitarios (Sharp + SVG Vectorial Multi-Plantilla):
 * Utiliza las plantillas de DEFAULT_TEXT_TEMPLATES con 4 arquitecturas de diseño limpias
 * (Split Lateral, Cabecera Limpia, Editorial Revista y Tercio Inferior), garantizando
 * CERO solapamiento de textos/píldoras y dejando el producto central 100% despejado.
 */
export async function composeBannerOnImage(options: BannerCompositorOptions): Promise<string> {
  const {
    baseImageUrl,
    fallbackImageUrl,
    bannerCopy,
    price,
    logoUrl,
    userId = "system",
    aspectRatio = "1:1",
    includeLogo = true,
    templateId,
    layoutVariant: explicitVariant,
  } = options;

  const isVertical = aspectRatio === "9:16";
  const width = 1080;
  const height = isVertical ? 1920 : 1080;

  const tpl = resolveTextTemplate(templateId);
  const variant = resolveLayoutVariant(tpl, explicitVariant);

  console.log(
    `[BannerCompositor] Componiendo cartel ${width}x${height} | Plantilla: "${tpl.name}" (${tpl.id}) | Layout: ${variant}`
  );

  try {
    // 1. Descargar imagen base (15s timeout para soportar generación en vivo de Flux/n8n)
    let imageBuffer: Buffer | null = null;
    const candidateUrls = [baseImageUrl, fallbackImageUrl, tpl.previewSampleImage].filter(
      (u): u is string => Boolean(u && typeof u === "string" && u.startsWith("http"))
    );

    for (const urlToTry of candidateUrls) {
      try {
        const imageRes = await fetch(urlToTry, {
          signal: AbortSignal.timeout(15000),
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; SantisoftCompositor/2.0)",
          },
        });
        if (imageRes.ok) {
          const arrBuf = await imageRes.arrayBuffer();
          if (arrBuf.byteLength > 1000) {
            imageBuffer = Buffer.from(arrBuf);
            break;
          }
        }
      } catch (fetchErr: any) {
        console.warn(`[BannerCompositor] Intento descarga fallido (${urlToTry.slice(0, 70)}...):`, fetchErr?.message || fetchErr);
      }
    }

    if (!imageBuffer) {
      imageBuffer = await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 15, g: 23, b: 42, alpha: 1 },
        },
      })
        .png()
        .toBuffer();
    }

    // 2. Redimensionar imagen base al tamaño exacto
    const processedMain = sharp(imageBuffer).resize(width, height, {
      fit: "cover",
      position: "center",
    });

    // 3. Resolver colores y textos desde la plantilla + datos del producto
    const badgeBg = normalizeSvgColor(tpl.badgeBgColor || bannerCopy.badgeBgColor, "#fbbf24");
    const badgeTextCol = normalizeSvgColor(tpl.badgeTextColor || bannerCopy.badgeTextColor, "#0f172a");
    const headlineCol = normalizeSvgColor(tpl.headlineColor || bannerCopy.headlineColor, "#ffffff");
    const priceBg = normalizeSvgColor(tpl.priceBgColor, "#fbbf24");
    const priceTextCol = normalizeSvgColor(tpl.priceTextColor, "#0f172a");
    const ctaBg = normalizeSvgColor(tpl.ctaBgColor, "#fbbf24");
    const ctaTextCol = normalizeSvgColor(tpl.ctaTextColor, "#0f172a");

    const cleanPrice = (price || "").trim();

    // Evitar que el badge superior repita el precio si ya hay pastilla de precio dedicada
    let rawBadge = (bannerCopy.badgeText || tpl.badgeText || "DESTACADO").trim();
    if (cleanPrice && rawBadge.includes(cleanPrice)) {
      rawBadge = tpl.badgeText || "⭐ ESPECIALIDAD";
    }
    const badgeTextEscaped = escapeXml(rawBadge.toUpperCase());

    const rawHeadline = (bannerCopy.mainHeadline || "ESPECIALIDAD").trim().toUpperCase();
    const rawSub = (bannerCopy.benefitText || tpl.subheadlinePattern || "").trim();
    const rawCta = (bannerCopy.ctaText || tpl.ctaText || "¡ORDENA AHORA!").trim();

    const subTextEscaped = escapeXml(rawSub.length > 52 ? rawSub.slice(0, 50).trim() + "…" : rawSub);
    const ctaTextEscaped = escapeXml(rawCta.length > 32 ? rawCta.slice(0, 30).trim() : rawCta);
    const priceTextEscaped = escapeXml(cleanPrice);

    // 4. Construir la fila inferior combinada [ PRECIO ] + [ CTA ] (usada en layouts centrados)
    const buildBottomActionRow = (rowY: number) => {
      const pillHeight = 56;
      const ctaFontSize = 20;
      const ctaPillWidth = Math.min(480, Math.max(250, rawCta.length * 13 + 64));

      if (cleanPrice) {
        const pricePillWidth = Math.max(175, cleanPrice.length * 19 + 52);
        const gap = 16;
        const totalRowWidth = pricePillWidth + gap + ctaPillWidth;
        const startX = (width - totalRowWidth) / 2;
        const ctaX = startX + pricePillWidth + gap;

        return `
          <!-- Fila Inferior: Pastilla de Precio + Botón CTA (Sin colisiones) -->
          <g filter="url(#heavy-shadow)">
            <rect x="${startX}" y="${rowY}" width="${pricePillWidth}" height="${pillHeight}" rx="28" fill="${priceBg}" stroke="#ffffff" stroke-width="2" />
            <text
              x="${startX + pricePillWidth / 2}"
              y="${rowY + 37}"
              fill="${priceTextCol}"
              font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
              font-size="26"
              font-weight="900"
              letter-spacing="0.8"
              text-anchor="middle"
            >${priceTextEscaped}</text>
          </g>
          <g filter="url(#soft-shadow)">
            <rect x="${ctaX}" y="${rowY}" width="${ctaPillWidth}" height="${pillHeight}" rx="28" fill="rgba(15, 23, 42, 0.92)" stroke="${ctaBg}" stroke-width="2" />
            <text
              x="${ctaX + ctaPillWidth / 2}"
              y="${rowY + 35}"
              fill="#ffffff"
              font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
              font-size="${ctaFontSize}"
              font-weight="800"
              letter-spacing="0.6"
              text-anchor="middle"
            >${ctaTextEscaped}</text>
          </g>
        `;
      }

      const singleX = (width - ctaPillWidth) / 2;
      return `
        <g filter="url(#soft-shadow)">
          <rect x="${singleX}" y="${rowY}" width="${ctaPillWidth}" height="${pillHeight}" rx="28" fill="${ctaBg}" />
          <text
            x="${width / 2}"
            y="${rowY + 35}"
            fill="${ctaTextCol}"
            font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
            font-size="${ctaFontSize}"
            font-weight="900"
            letter-spacing="0.8"
            text-anchor="middle"
          >${ctaTextEscaped}</text>
        </g>
      `;
    };

    // 5. Construir el cuerpo SVG según el arquetipo de la plantilla seleccionada
    let layoutBodySvg = "";

    if (variant === "split_left") {
      // ═══════════════════════════════════════════════════════════════════════
      // ARQUETIPO A: SPLIT LATERAL IZQUIERDO (Producto libre a la derecha)
      // ═══════════════════════════════════════════════════════════════════════
      const lines = wrapText(rawHeadline, 13, 3);
      const fontSize = lines.length >= 3 ? 46 : 52;
      const lineHeight = Math.round(fontSize * 1.14);

      const badgeW = Math.min(340, Math.max(170, rawBadge.length * 12 + 48));
      const badgeX = width - badgeW - 44;
      const badgeY = isVertical ? 80 : 42;

      const isFoodHeadline = /pizz|burger|hamburgues|sushi|ramen|pasta|carne|parrill|taco|menu|menú|plato|sabor|horno|restauran/i.test(
        `${rawHeadline} ${rawSub}`
      );
      const rawScriptCandidate = tpl.secondaryScriptPattern || "Calidad garantizada";
      const safeScriptCandidate =
        !isFoodHeadline && /horno|cocina|sabor|chef|fresco|receta/i.test(rawScriptCandidate)
          ? "Calidad garantizada"
          : rawScriptCandidate;
      const scriptText = escapeXml(safeScriptCandidate);
      const blockStartY = isVertical ? 480 : 250;
      const headlineBaseY = blockStartY + 58;
      const afterHeadlineY = headlineBaseY + (lines.length - 1) * lineHeight;

      const subLines = wrapText(rawSub, 26, 2);
      const subStartY = afterHeadlineY + 46;
      const afterSubY = subLines.length > 0 ? subStartY + (subLines.length - 1) * 28 : afterHeadlineY + 12;

      const priceY = afterSubY + 26;
      const priceW = cleanPrice ? Math.max(165, cleanPrice.length * 18 + 44) : 0;
      const ctaY = cleanPrice ? priceY + 66 : afterSubY + 28;
      const ctaW = Math.min(380, Math.max(220, rawCta.length * 12 + 52));

      layoutBodySvg = `
        <rect x="0" y="0" width="${Math.round(width * 0.68)}" height="${height}" fill="url(#left-scrim)" />
        <rect x="0" y="${Math.round(height * 0.78)}" width="${width}" height="${Math.round(height * 0.22)}" fill="url(#bottom-scrim)" />

        <!-- Badge en esquina superior derecha -->
        <g filter="url(#soft-shadow)">
          <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="44" rx="22" fill="${badgeBg}" />
          <text
            x="${badgeX + badgeW / 2}"
            y="${badgeY + 28}"
            fill="${badgeTextCol}"
            font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
            font-size="16"
            font-weight="900"
            letter-spacing="1.2"
            text-anchor="middle"
          >${badgeTextEscaped}</text>
        </g>

        <!-- Kicker en cursiva -->
        <text
          x="60"
          y="${blockStartY}"
          fill="#fde68a"
          font-family="Georgia, 'Times New Roman', serif"
          font-size="25"
          font-style="italic"
          font-weight="700"
          filter="url(#heavy-shadow)"
          text-anchor="start"
        >${scriptText}</text>

        <!-- Titular alineado a la izquierda -->
        <g filter="url(#heavy-shadow)">
          ${lines
            .map(
              (line, i) => `
            <text
              x="60"
              y="${headlineBaseY + i * lineHeight}"
              fill="${headlineCol}"
              font-family="system-ui, -apple-system, Montserrat, 'Arial Black', sans-serif"
              font-size="${fontSize}"
              font-weight="900"
              letter-spacing="0.8"
              text-anchor="start"
            >${escapeXml(line)}</text>
          `
            )
            .join("")}
        </g>

        <!-- Subtítulo limpio sin caja -->
        <g filter="url(#heavy-shadow)">
          ${subLines
            .map(
              (sLine, i) => `
            <text
              x="60"
              y="${subStartY + i * 28}"
              fill="#f8fafc"
              font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
              font-size="21"
              font-weight="600"
              text-anchor="start"
            >${escapeXml(sLine)}</text>
          `
            )
            .join("")}
        </g>

        <!-- Precio en columna izquierda -->
        ${
          cleanPrice
            ? `
        <g filter="url(#heavy-shadow)">
          <rect x="60" y="${priceY}" width="${priceW}" height="50" rx="14" fill="${priceBg}" stroke="#ffffff" stroke-width="2" />
          <text
            x="${60 + priceW / 2}"
            y="${priceY + 34}"
            fill="${priceTextCol}"
            font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
            font-size="25"
            font-weight="900"
            text-anchor="middle"
          >${priceTextEscaped}</text>
        </g>
        `
            : ""
        }

        <!-- Botón CTA en columna izquierda -->
        <g filter="url(#soft-shadow)">
          <rect x="60" y="${ctaY}" width="${ctaW}" height="50" rx="25" fill="${ctaBg}" />
          <text
            x="${60 + ctaW / 2}"
            y="${ctaY + 32}"
            fill="${ctaTextCol}"
            font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
            font-size="18"
            font-weight="900"
            letter-spacing="0.8"
            text-anchor="middle"
          >${ctaTextEscaped}</text>
        </g>
      `;
    } else if (variant === "editorial_magazine") {
      // ═══════════════════════════════════════════════════════════════════════
      // ARQUETIPO B: PORTADA EDITORIAL / GOURMET (Sin píldoras invasivas)
      // ═══════════════════════════════════════════════════════════════════════
      const lines = wrapText(rawHeadline, 18, 2);
      const fontSize = lines.length > 1 ? 50 : 56;
      const lineHeight = Math.round(fontSize * 1.15);

      const kickerY = isVertical ? 105 : 56;
      const dividerY = kickerY + 16;
      const headlineBaseY = dividerY + 58;

      const footerRowY = height - (isVertical ? 135 : 104);
      const subY = footerRowY - 26;

      layoutBodySvg = `
        <rect x="0" y="0" width="${width}" height="${Math.round(height * 0.34)}" fill="url(#top-scrim)" />
        <rect x="0" y="${Math.round(height * 0.68)}" width="${width}" height="${Math.round(height * 0.32)}" fill="url(#bottom-scrim)" />

        <!-- Kicker Editorial Superior con línea dorada -->
        <g filter="url(#heavy-shadow)">
          <text
            x="${width / 2}"
            y="${kickerY}"
            fill="#fbbf24"
            font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
            font-size="17"
            font-weight="800"
            letter-spacing="4.5"
            text-anchor="middle"
          >${badgeTextEscaped}</text>
          <line x1="${width / 2 - 90}" y1="${dividerY}" x2="${width / 2 + 90}" y2="${dividerY}" stroke="#fbbf24" stroke-width="2" stroke-opacity="0.85" />
        </g>

        <!-- Titular Editorial Serif -->
        <g filter="url(#heavy-shadow)">
          ${lines
            .map(
              (line, i) => `
            <text
              x="${width / 2}"
              y="${headlineBaseY + i * lineHeight}"
              fill="${headlineCol}"
              font-family="Georgia, 'Times New Roman', serif"
              font-size="${fontSize}"
              font-weight="900"
              letter-spacing="1"
              text-anchor="middle"
            >${escapeXml(line)}</text>
          `
            )
            .join("")}
        </g>

        <!-- Subtítulo en cursiva en la base (nunca en el medio del plato) -->
        ${
          subTextEscaped
            ? `
        <text
          x="${width / 2}"
          y="${subY}"
          fill="#fef08a"
          font-family="Georgia, 'Times New Roman', serif"
          font-size="24"
          font-style="italic"
          font-weight="700"
          filter="url(#heavy-shadow)"
          text-anchor="middle"
        >${subTextEscaped}</text>
        `
            : ""
        }

        ${buildBottomActionRow(footerRowY)}
      `;
    } else if (variant === "bottom_impact_card") {
      // ═══════════════════════════════════════════════════════════════════════
      // ARQUETIPO C: BLOQUE DE IMPACTO INFERIOR (Tercio superior y central libre)
      // ═══════════════════════════════════════════════════════════════════════
      const lines = wrapText(rawHeadline, 19, 2);
      const fontSize = lines.length > 1 ? 48 : 54;
      const lineHeight = Math.round(fontSize * 1.14);

      const badgeW = Math.min(420, Math.max(200, rawBadge.length * 13 + 52));
      const badgeX = (width - badgeW) / 2;
      const badgeY = isVertical ? 84 : 38;

      const footerRowY = height - (isVertical ? 135 : 104);
      const subY = footerRowY - 26;
      const lastHeadlineY = subTextEscaped ? subY - 38 : footerRowY - 34;
      const firstHeadlineY = lastHeadlineY - (lines.length - 1) * lineHeight;

      layoutBodySvg = `
        <rect x="0" y="0" width="${width}" height="${Math.round(height * 0.16)}" fill="url(#top-scrim)" />
        <rect x="0" y="${Math.round(height * 0.54)}" width="${width}" height="${Math.round(height * 0.46)}" fill="url(#bottom-scrim)" />

        <!-- Badge compacto arriba -->
        <g filter="url(#soft-shadow)">
          <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="42" rx="21" fill="${badgeBg}" />
          <text
            x="${width / 2}"
            y="${badgeY + 27}"
            fill="${badgeTextCol}"
            font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
            font-size="16"
            font-weight="900"
            letter-spacing="1.2"
            text-anchor="middle"
          >${badgeTextEscaped}</text>
        </g>

        <!-- Titular en tercio inferior -->
        <g filter="url(#heavy-shadow)">
          ${lines
            .map(
              (line, i) => `
            <text
              x="${width / 2}"
              y="${firstHeadlineY + i * lineHeight}"
              fill="${headlineCol}"
              font-family="system-ui, -apple-system, Montserrat, 'Arial Black', sans-serif"
              font-size="${fontSize}"
              font-weight="900"
              letter-spacing="1"
              text-anchor="middle"
            >${escapeXml(line)}</text>
          `
            )
            .join("")}
        </g>

        <!-- Subtítulo limpio debajo del titular -->
        ${
          subTextEscaped
            ? `
        <text
          x="${width / 2}"
          y="${subY}"
          fill="#fde68a"
          font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
          font-size="22"
          font-weight="700"
          filter="url(#heavy-shadow)"
          text-anchor="middle"
        >${subTextEscaped}</text>
        `
            : ""
        }

        ${buildBottomActionRow(footerRowY)}
      `;
    } else {
      // ═══════════════════════════════════════════════════════════════════════
      // ARQUETIPO D: CABECERA SUPERIOR LIMPIA (Top Clean Header)
      // ═══════════════════════════════════════════════════════════════════════
      const lines = wrapText(rawHeadline, 19, 2);
      const fontSize = lines.length > 1 ? 48 : 54;
      const lineHeight = Math.round(fontSize * 1.14);

      const badgeW = Math.min(440, Math.max(210, rawBadge.length * 13 + 52));
      const badgeX = (width - badgeW) / 2;
      const badgeY = isVertical ? 84 : 36;

      // Garantizar al menos 20px de aire debajo del badge (badge termina en badgeY + 42)
      const headlineBaseY = badgeY + 42 + 54;
      const lastHeadlineY = headlineBaseY + (lines.length - 1) * lineHeight;
      const subY = lastHeadlineY + 38;
      const footerRowY = height - (isVertical ? 135 : 104);

      layoutBodySvg = `
        <rect x="0" y="0" width="${width}" height="${Math.round(height * 0.36)}" fill="url(#top-scrim)" />
        <rect x="0" y="${Math.round(height * 0.74)}" width="${width}" height="${Math.round(height * 0.26)}" fill="url(#bottom-scrim)" />

        <!-- 1. Badge Superior Centrado (termina en y=${badgeY + 42}) -->
        <g filter="url(#soft-shadow)">
          <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="42" rx="21" fill="${badgeBg}" />
          <text
            x="${width / 2}"
            y="${badgeY + 27}"
            fill="${badgeTextCol}"
            font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
            font-size="16"
            font-weight="900"
            letter-spacing="1.2"
            text-anchor="middle"
          >${badgeTextEscaped}</text>
        </g>

        <!-- 2. Titular Principal Despejado (sin tocar badge ni logo) -->
        <g filter="url(#heavy-shadow)">
          ${lines
            .map(
              (line, i) => `
            <text
              x="${width / 2}"
              y="${headlineBaseY + i * lineHeight}"
              fill="${headlineCol}"
              font-family="system-ui, -apple-system, Montserrat, 'Arial Black', sans-serif"
              font-size="${fontSize}"
              font-weight="900"
              letter-spacing="1"
              text-anchor="middle"
            >${escapeXml(line)}</text>
          `
            )
            .join("")}
        </g>

        <!-- 3. Subtítulo en texto limpio pegado al titular (CERO cajas en el medio del producto) -->
        ${
          subTextEscaped
            ? `
        <text
          x="${width / 2}"
          y="${subY}"
          fill="#fde68a"
          font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
          font-size="22"
          font-weight="700"
          filter="url(#heavy-shadow)"
          text-anchor="middle"
        >${subTextEscaped}</text>
        `
            : ""
        }

        <!-- 4. Barra Inferior con Precio + CTA lado a lado -->
        ${buildBottomActionRow(footerRowY)}
      `;
    }

    const svgOverlay = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="heavy-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#000000" flood-opacity="0.92" />
          </filter>

          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#000000" flood-opacity="0.55" />
          </filter>

          <linearGradient id="top-scrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.82" />
            <stop offset="55%" stop-color="#000000" stop-opacity="0.42" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </linearGradient>

          <linearGradient id="bottom-scrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#000000" stop-opacity="0" />
            <stop offset="50%" stop-color="#000000" stop-opacity="0.58" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.88" />
          </linearGradient>

          <linearGradient id="left-scrim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.88" />
            <stop offset="60%" stop-color="#000000" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </linearGradient>
        </defs>

        ${layoutBodySvg}

        <!-- Marca de Agua Oficial Santisoft.cl -->
        <g filter="url(#soft-shadow)">
          <rect x="${width - 176}" y="${height - 38}" width="144" height="26" rx="13" fill="rgba(15, 23, 42, 0.82)" stroke="rgba(255, 255, 255, 0.22)" stroke-width="1" />
          <circle cx="${width - 160}" cy="${height - 25}" r="3.5" fill="#818cf8" />
          <text
            x="${width - 98}"
            y="${height - 20}"
            fill="#ffffff"
            font-family="system-ui, -apple-system, Montserrat, Arial, sans-serif"
            font-size="11"
            font-weight="700"
            letter-spacing="0.4"
            text-anchor="middle"
          >santisoft.cl</text>
        </g>
      </svg>
    `;

    const svgBuffer = Buffer.from(svgOverlay);
    const composites: OverlayOptions[] = [{ input: svgBuffer, top: 0, left: 0 }];

    // 6. Descargar y superponer logo PNG si está configurado (en zona libre de colisión)
    if (includeLogo && logoUrl) {
      try {
        const logoRes = await fetch(logoUrl, { signal: AbortSignal.timeout(6000) });
        if (logoRes.ok) {
          const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
          const targetLogoSize = isVertical ? 140 : 110;

          const resizedLogo = await sharp(logoBuffer)
            .resize({ width: targetLogoSize, height: targetLogoSize, fit: "inside" })
            .png()
            .toBuffer();

          // En todos los layouts, la esquina superior izquierda (x=40, y=32) con tamaño compacto (110px)
          // o esquina superior derecha en editorial queda despejada
          const logoTop = isVertical ? 48 : 30;
          const logoLeft = variant === "split_left" ? 60 : 36;

          composites.push({
            input: resizedLogo,
            top: logoTop,
            left: logoLeft,
          });
        }
      } catch (logoErr) {
        console.warn("[BannerCompositor] No se pudo cargar logo PNG, continuando sin logo:", logoErr);
      }
    }

    // 7. Procesar la composición final en Sharp con calidad de imprenta
    const finalBuffer = await processedMain
      .composite(composites)
      .jpeg({ quality: 92 })
      .toBuffer();

    console.log(`[BannerCompositor] ✅ Composición completada (${variant}). Subiendo a Firebase Storage...`);

    // 8. Subir a Firebase Storage
    if (!adminStorage) {
      console.warn("[BannerCompositor] adminStorage no disponible, devolviendo baseImageUrl como fallback.");
      return baseImageUrl;
    }

    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "rrss-santisoft.firebasestorage.app";
    const bucket = adminStorage.bucket(bucketName);
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 8);
    const destination = `users/${userId}/commercial_banners/${timestamp}_${rand}.jpg`;
    const downloadToken = `${timestamp}_${rand}`;

    const file = bucket.file(destination);
    await file.save(finalBuffer, {
      metadata: {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=31536000",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    await file.makePublic().catch(() => {});
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media&token=${downloadToken}`;

    console.log(`[BannerCompositor] 🚀 Cartel comercial generado con éxito: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error("[BannerCompositor] ❌ Error componiendo banner:", error.message || error);
    return fallbackImageUrl || baseImageUrl;
  }
}
