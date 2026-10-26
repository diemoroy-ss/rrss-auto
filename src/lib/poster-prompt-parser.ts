// src/lib/poster-prompt-parser.ts
// Parser inteligente para extraer textos, colores y llamado a la acción desde prompts de afiches

export interface ParsedPosterPrompt {
  mainText?: string;
  sloganText?: string;
  ctaText?: string;
  priceText?: string;
  primaryColor?: string;
  includeMainText?: boolean;
  includeSlogan?: boolean;
  includePrice?: boolean;
  includeCta?: boolean;
}

export function parsePromptTypographyAndDesign(rawText: string): ParsedPosterPrompt | null {
  if (!rawText || typeof rawText !== "string") return null;
  const text = rawText.trim();
  if (text.length < 5) return null;

  const result: ParsedPosterPrompt = {};

  // 1. Extraer códigos de color hex (priorizando colores de acento vibrantes sobre fondos oscuros o blancos)
  const hexMatches = text.match(/#[0-9A-Fa-f]{6}/g);
  if (hexMatches && hexMatches.length > 0) {
    const accentColors = hexMatches.filter((h) => {
      const hex = h.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 40 && brightness < 240; // Excluye negros casi puros y blancos
    });
    if (accentColors.length > 0) {
      result.primaryColor = accentColors[0].toLowerCase();
    } else {
      result.primaryColor = hexMatches[0].toLowerCase();
    }
  }

  // 2. Extraer líneas y citas entre comillas
  const quotedRegex = /"([^"]+)"|«([^«»]+)»|“([^“”]+)”/g;
  const lines = text.split(/\r?\n/);

  interface ExtractedQuote {
    line: string;
    quote: string;
  }

  const extractedQuotes: ExtractedQuote[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    let m: RegExpExecArray | null;
    while ((m = quotedRegex.exec(trimmed)) !== null) {
      const quoteContent = m[1] || m[2] || m[3];
      if (quoteContent && quoteContent.trim().length > 1) {
        extractedQuotes.push({
          line: trimmed,
          quote: quoteContent.trim(),
        });
      }
    }
  });

  // Si no hay comillas, verificar si hay formato tipo:
  // Headline: TEXTO
  // CTA: TEXTO
  // Slogan: TEXTO
  if (extractedQuotes.length === 0) {
    lines.forEach((line) => {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();

      // Titular
      if ((lower.startsWith("headline:") || lower.startsWith("titular:") || lower.startsWith("título:")) && !result.mainText) {
        const val = trimmed.split(":")[1]?.trim();
        if (val) result.mainText = val;
      }
      // Slogan / Badge
      else if ((lower.startsWith("slogan:") || lower.startsWith("badge:") || lower.startsWith("subtítulo:")) && !result.sloganText) {
        const val = trimmed.split(":")[1]?.trim();
        if (val) {
          result.sloganText = val;
          result.includeSlogan = true;
        }
      }
      // CTA
      else if ((lower.startsWith("cta:") || lower.startsWith("llamado a la acción:")) && !result.ctaText) {
        const val = trimmed.split(":")[1]?.trim();
        if (val) result.ctaText = val;
      }
    });

    return Object.keys(result).length > 0 ? result : null;
  }

  // 3. Clasificar cada cita según contexto de la línea y semántica del texto
  extractedQuotes.forEach((item) => {
    const l = item.line.toLowerCase();
    const q = item.quote;

    // Detectar CTA (Llamado a la acción)
    if (
      l.includes("cta") ||
      l.includes("call to action") ||
      l.includes("call-to-action") ||
      l.includes("bottom right") ||
      l.includes("bottom left") ||
      l.includes("sub-badge with arrow") ||
      l.includes("badge with arrow") ||
      q.includes("👉") ||
      q.includes("→") ||
      q.includes("►") ||
      /^(desliza|ahorra|pide|reserva|compra|escríbenos|visítanos|agenda|descubre|más info)/i.test(q)
    ) {
      if (!result.ctaText) {
        result.ctaText = q;
        return;
      }
    }

    // Detectar Headline / Titular Principal
    if (
      l.includes("headline") ||
      l.includes("titular") ||
      l.includes("título") ||
      l.includes("upper center") ||
      l.includes("center headline") ||
      l.includes("large bold") ||
      l.includes("main text") ||
      l.includes("main headline")
    ) {
      if (!result.mainText) {
        result.mainText = q;
        return;
      }
    }

    // Detectar Slogan / Badge / Kicker / Subtítulo
    if (
      l.includes("pill badge") ||
      l.includes("pill") ||
      l.includes("badge") ||
      l.includes("top center") ||
      l.includes("kicker") ||
      l.includes("slogan") ||
      l.includes("subtítulo") ||
      l.includes("subtitle") ||
      l.includes("sub-badge")
    ) {
      if (!result.sloganText) {
        result.sloganText = q;
        result.includeSlogan = true;
        return;
      }
    }

    // Detectar Precio o Promoción
    if (
      l.includes("precio") ||
      l.includes("price") ||
      l.includes("promo") ||
      l.includes("oferta") ||
      q.includes("$") ||
      q.includes("% off") ||
      q.includes("2x1")
    ) {
      if (!result.priceText) {
        result.priceText = q;
        result.includePrice = true;
        return;
      }
    }
  });

  // 4. Asignación inteligente por descarte si faltan campos
  const assignedQuotes = new Set([result.mainText, result.sloganText, result.ctaText, result.priceText].filter(Boolean));
  const unassigned = extractedQuotes.filter((item) => !assignedQuotes.has(item.quote));

  // Si no se asignó mainText, tomamos la cita no asignada más larga (el titular suele ser el más extenso)
  if (!result.mainText && unassigned.length > 0) {
    unassigned.sort((a, b) => b.quote.length - a.quote.length);
    result.mainText = unassigned[0].quote;
    assignedQuotes.add(result.mainText);
  }

  // Si no se asignó sloganText y quedan citas libres
  if (!result.sloganText) {
    const remainingForSlogan = unassigned.filter((item) => !assignedQuotes.has(item.quote));
    if (remainingForSlogan.length > 0) {
      result.sloganText = remainingForSlogan[0].quote;
      result.includeSlogan = true;
      assignedQuotes.add(result.sloganText);
    }
  }

  // Si no se asignó ctaText y quedan citas libres
  if (!result.ctaText) {
    const remainingForCta = unassigned.filter((item) => !assignedQuotes.has(item.quote));
    if (remainingForCta.length > 0) {
      result.ctaText = remainingForCta[0].quote;
    }
  }

  if (result.mainText) {
    result.includeMainText = true;
  }
  if (result.ctaText) {
    result.includeCta = true;
  }

  return Object.keys(result).length > 0 ? result : null;
}

export interface ExtractedPosterPromptData {
  sceneDescription: string;
  parsedTypography: ParsedPosterPrompt | null;
  isPosterPrompt: boolean;
}

/**
 * Analiza un texto que puede contener tanto la descripción visual de la escena como la
 * sección técnica de TYPOGRAPHY & LAYOUT. Separa ambos componentes y devuelve los textos
 * estructurados para cargar en los campos del formulario y el modelo.
 */
export function extractSceneAndTypography(rawText: string): ExtractedPosterPromptData {
  if (!rawText || typeof rawText !== "string") {
    return { sceneDescription: "", parsedTypography: null, isPosterPrompt: false };
  }

  const text = rawText.trim();
  const hasTypographyHeader = /typography\s*&\s*layout/i.test(text);
  const hasLayoutKeywords =
    /top\s+center/i.test(text) ||
    /upper\s+center/i.test(text) ||
    /bottom\s+right/i.test(text) ||
    /lower\s+center/i.test(text) ||
    /headline:/i.test(text) ||
    /titular:/i.test(text);
  const hasPosterKeywords =
    /(vertical|square|commercial|saas|marketing)\s+.*poster/i.test(text) ||
    /cartel\s+publicitario/i.test(text) ||
    /afiche/i.test(text);

  const parsedTypography = parsePromptTypographyAndDesign(text);

  let sceneDescription = text;

  if (hasTypographyHeader) {
    // Extraer todo lo que precede a TYPOGRAPHY & LAYOUT
    const splitIndex = text.search(/typography\s*&\s*layout/i);
    if (splitIndex > 0) {
      sceneDescription = text.substring(0, splitIndex).trim();
    }
  } else if (hasLayoutKeywords) {
    // Si no tiene el encabezado exacto pero tiene directivas tipográficas, filtrar las líneas
    const lines = text.split(/\r?\n/);
    const sceneLines = lines.filter((l) => {
      const lineLower = l.toLowerCase();
      return (
        !lineLower.includes("top center") &&
        !lineLower.includes("upper center") &&
        !lineLower.includes("bottom right") &&
        !lineLower.includes("lower center") &&
        !lineLower.includes("mid-upper center") &&
        !lineLower.includes("headline:") &&
        !lineLower.includes("slogan:") &&
        !lineLower.includes("cta:") &&
        !lineLower.includes("ultra-sharp vector typography")
      );
    });
    sceneDescription = sceneLines.join("\n").trim();
  }

  // Limpiar etiquetas de calidad técnica que suelen ir al pie
  sceneDescription = sceneDescription
    .replace(/ultra-sharp vector typography[^\r\n]*/gi, "")
    .replace(/commercial graphic design[^\r\n]*/gi, "")
    .replace(/,\s*8k\b/gi, "")
    .replace(/\b8k\b/gi, "")
    .trim();

  const isPosterPrompt = Boolean(
    (hasTypographyHeader || (hasLayoutKeywords && (hasPosterKeywords || text.includes('"')))) &&
    parsedTypography &&
    (parsedTypography.mainText || parsedTypography.sloganText || parsedTypography.ctaText)
  );

  return {
    sceneDescription: sceneDescription || text,
    parsedTypography,
    isPosterPrompt,
  };
}
