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
  const text = rawText.replace(/^(plaintext|markdown)\s*/i, "").trim();
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

  // 2. Extraer líneas y citas entre comillas con su contexto
  const quotedRegex = /"([^"]+)"|«([^«»]+)»|“([^“”]+)”/g;
  const rawLines = text.split(/\r?\n/);

  interface ExtractedItem {
    lineIndex: number;
    rawLine: string;
    quote: string;
  }

  const items: ExtractedItem[] = [];

  rawLines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    let m: RegExpExecArray | null;
    const re = /"([^"]+)"|«([^«»]+)»|“([^“”]+)”/g;
    while ((m = re.exec(trimmed)) !== null) {
      const quoteContent = m[1] || m[2] || m[3];
      if (quoteContent && quoteContent.trim().length > 1) {
        items.push({
          lineIndex,
          rawLine: trimmed,
          quote: quoteContent.trim(),
        });
      }
    }
  });

  // Si no hay comillas, verificar si hay formato tipo:
  // Headline: TEXTO
  // CTA: TEXTO
  // Slogan: TEXTO
  if (items.length === 0) {
    rawLines.forEach((line) => {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();

      // Titular
      if ((lower.startsWith("headline:") || lower.startsWith("header:") || lower.startsWith("titular:") || lower.startsWith("título:")) && !result.mainText) {
        const val = trimmed.split(":")[1]?.trim();
        if (val) result.mainText = val;
      }
      // Slogan / Badge
      else if ((lower.startsWith("slogan:") || lower.startsWith("badge:") || lower.startsWith("subtítulo:") || lower.startsWith("body:")) && !result.sloganText) {
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

  // 3. Detectar tarjetas / puntos emparejados (Title + Body dentro de bloques estructurados)
  // Ej:
  // Title (Bold Red/Orange): "❌ 1. HACERLO TÚ MISMO"
  // Body (White): "Pierdes tus domingos..."
  const pairedCardTexts: string[] = [];
  const usedItemIndices = new Set<number>();

  for (let i = 0; i < items.length - 1; i++) {
    if (usedItemIndices.has(i)) continue;
    const curr = items[i];
    const next = items[i + 1];

    const currLineLower = curr.rawLine.toLowerCase();
    const nextLineLower = next.rawLine.toLowerCase();

    const isCardTitle =
      (currLineLower.includes("title") || currLineLower.includes("título") || currLineLower.includes("card") || currLineLower.includes("item") || /^[❌✅\d\.\-•]/.test(curr.quote)) &&
      !currLineLower.includes("header") &&
      !currLineLower.includes("top header") &&
      !currLineLower.includes("headline") &&
      !currLineLower.includes("main title");

    const isCardBody =
      nextLineLower.includes("body") ||
      nextLineLower.includes("desc") ||
      nextLineLower.includes("texto") ||
      nextLineLower.includes("text:") ||
      nextLineLower.includes("white):");

    if (isCardTitle && isCardBody && next.lineIndex - curr.lineIndex <= 3) {
      const sep = /[:\.\-—]\s*$/.test(curr.quote) ? " " : ": ";
      pairedCardTexts.push(`${curr.quote}${sep}${next.quote}`);
      usedItemIndices.add(i);
      usedItemIndices.add(i + 1);
      i++; // Avanzar al siguiente ya emparejado
    }
  }

  // 4. Clasificar cada cita restante según contexto de la línea y semántica del texto
  items.forEach((item, index) => {
    if (usedItemIndices.has(index)) return;

    const l = item.rawLine.toLowerCase();
    const q = item.quote;

    // Detectar CTA (Llamado a la acción explícito)
    const isCtaLine =
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
      /^(desliza|ahorra|pide|reserva|compra|escríbenos|visítanos|agenda|descubre|más info)/i.test(q);

    if (isCtaLine && !result.ctaText) {
      result.ctaText = q;
      usedItemIndices.add(index);
      return;
    }

    // Detectar Headline / Titular Principal / Header
    const isHeaderLine =
      l.includes("header") ||
      l.includes("top header") ||
      l.includes("headline") ||
      l.includes("titular") ||
      l.includes("título") ||
      l.includes("upper center") ||
      l.includes("center headline") ||
      l.includes("large bold") ||
      l.includes("main text") ||
      l.includes("main headline") ||
      l.includes("main title") ||
      l.includes("top title") ||
      l.includes("bold title") ||
      l.includes("encabezado");

    if (isHeaderLine && !result.mainText) {
      result.mainText = q;
      usedItemIndices.add(index);
      return;
    }

    // Detectar Slogan / Badge / Kicker / Subtítulo
    const isBadgeLine =
      l.includes("pill badge") ||
      l.includes("pill") ||
      l.includes("badge") ||
      l.includes("top center") ||
      l.includes("kicker") ||
      l.includes("slogan") ||
      l.includes("subtítulo") ||
      l.includes("subtitle") ||
      l.includes("sub-badge");

    if (isBadgeLine && !result.sloganText) {
      result.sloganText = q;
      result.includeSlogan = true;
      usedItemIndices.add(index);
      return;
    }

    // Detectar Precio o Promoción
    const isPriceLine =
      l.includes("precio") ||
      l.includes("price") ||
      l.includes("promo") ||
      l.includes("oferta") ||
      q.includes("$") ||
      q.includes("% off") ||
      q.includes("2x1");

    if (isPriceLine && !result.priceText) {
      result.priceText = q;
      result.includePrice = true;
      usedItemIndices.add(index);
      return;
    }
  });

  // 5. Integrar tarjetas emparejadas (Card 1, Card 2, etc.)
  if (pairedCardTexts.length > 0) {
    if (!result.mainText) {
      // Si no había un encabezado superior, el primer card actúa como titular
      result.mainText = pairedCardTexts[0];
      if (pairedCardTexts.length > 1) {
        result.sloganText = pairedCardTexts.slice(1).join("\n\n");
        result.includeSlogan = true;
      }
    } else {
      // Si ya hay un encabezado superior, todas las tarjetas van al cuerpo/slogan
      const cardsCombined = pairedCardTexts.join("\n\n");
      if (result.sloganText) {
        result.sloganText = `${result.sloganText}\n\n${cardsCombined}`;
      } else {
        result.sloganText = cardsCombined;
      }
      result.includeSlogan = true;
    }
  }

  // 6. Asignación inteligente por descarte para citas restantes (nunca perder contenido)
  const remaining = items.filter((_, idx) => !usedItemIndices.has(idx));

  if (!result.mainText && remaining.length > 0) {
    remaining.sort((a, b) => b.quote.length - a.quote.length);
    result.mainText = remaining[0].quote;
    remaining.splice(0, 1);
  }

  if (remaining.length > 0) {
    const remainingQuotes = remaining.map((r) => r.quote);
    if (result.sloganText) {
      result.sloganText = `${result.sloganText}\n\n${remainingQuotes.join("\n\n")}`;
    } else {
      result.sloganText = remainingQuotes.join("\n\n");
    }
    result.includeSlogan = true;
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

  const text = rawText.replace(/^(plaintext|markdown)\s*/i, "").trim();
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

  // Limpiar etiquetas de calidad técnica que suelen ir al pie y prefijos tipo plaintext
  sceneDescription = sceneDescription
    .replace(/^(plaintext|markdown)\s*/i, "")
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
