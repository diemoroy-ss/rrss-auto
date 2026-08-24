import { generateFreeText } from "../gemini-free";

export interface BannerCopyParams {
  idea: string;
  rubro?: string;
  businessName?: string;
  businessDescription?: string;
  promotions?: string;          // Promociones fijas (Nivel 1) o de la quincena (Nivel 2)
  customOffer?: string;         // Oferta específica del post (Nivel 3)
  aspectRatio?: '1:1' | '9:16';
}

export interface BannerCopyResult {
  badgeText: string;            // Etiqueta superior corta (ej: "🔥 PROMO DE LA SEMANA", "⚡ 2X1 HOY")
  mainHeadline: string;         // Titular principal de impacto (ej: "2X1 EN DOBLE SMASH", "CORTE & BARBA $12.000")
  benefitText: string;          // Detalle/beneficio secundario (ej: "Incluye papas rústicas y bebida", "Lavado incluido")
  ctaText: string;              // Llamado a la acción o ubicación (ej: "📍 Providencia 450 · Pide al WhatsApp")
  visualTheme: "food_bold" | "barber_vintage" | "beauty_chic" | "modern_clean" | "vibrant";
  badgeBgColor: string;         // Color hex del fondo del badge
  badgeTextColor: string;       // Color hex del texto del badge
  headlineColor: string;        // Color hex del titular
  benefitBgColor: string;       // Color hex/rgba de la caja del beneficio
  benefitTextColor: string;     // Color hex del texto del beneficio
  accentColor: string;          // Color secundario de acento
}

/**
 * Agente de Textos Publicitarios para Banners Comerciales:
 * Extrae la oferta, producto y promociones del cliente para generar micro-copys de alto impacto
 * optimizados para carteles publicitarios en el feed o stories de redes sociales.
 */
export async function generateBannerCopyWithAgent(params: BannerCopyParams): Promise<BannerCopyResult> {
  const {
    idea,
    rubro = "General",
    businessName = "Mi Negocio",
    businessDescription = "",
    promotions = "",
    customOffer = "",
    aspectRatio = "1:1"
  } = params;

  const isVertical = aspectRatio === "9:16";

  const systemInstruction = `Eres un Director de Arte y Copywriter Senior especializado en cartelería publicitaria y banners de venta para PyMEs y locales comerciales (gastronomía, barberías, salones de belleza, heladerías, cafeterías, tiendas locales).

Tu misión es transformar la idea del post y las promociones del negocio en textos comerciales para un CARTEL PUBLICITARIO de alto impacto que se estampará sobre una fotografía.

REGLAS CRÍTICAS DE REDACCIÓN DE BANNERS:
1. El titular principal (mainHeadline) debe ser MUY CORTO, DIRECTO y en MAYÚSCULAS (máximo 4 a 6 palabras). Debe detener el scroll de inmediato.
2. El badge (badgeText) es una etiqueta superior corta con emoji (máximo 3 palabras, ej: "🔥 PROMO JUEVES", "⚡ 2X1 HOY", "⭐ 20% OFF", "✂️ PROMO SEMANAL").
3. El beneficio (benefitText) es una frase complementaria que elimina objeciones o aclara qué incluye la promo (máximo 7 palabras, ej: "Incluye papas rústicas + salsa", "Con toalla caliente y lavado").
4. El CTA (ctaText) debe ser una llamada a la acción o ubicación (ej: "📍 Centro · Pide al WhatsApp", "🗓️ Agenda tu hora en el link").
5. SIEMPRE dale prioridad a los precios, descuentos, combos o promociones específicas que indique el cliente.
6. Cero relleno corporativo o frases genéricas como "descubre el poder", "calidad inigualable" o "lo mejor para ti".

FORMATO DE RESPUESTA:
Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta (sin bloques markdown ni explicaciones adicionales):
{
  "badgeText": "🔥 PROMO DE LA SEMANA",
  "mainHeadline": "2X1 EN DOBLE SMASH",
  "benefitText": "Incluye papas rústicas y bebida",
  "ctaText": "📍 Providencia 450 · WhatsApp en bio",
  "visualTheme": "food_bold",
  "badgeBgColor": "#ef4444",
  "badgeTextColor": "#ffffff",
  "headlineColor": "#ffffff",
  "benefitBgColor": "rgba(0,0,0,0.75)",
  "benefitTextColor": "#ffffff",
  "accentColor": "#fbbf24"
}`;

  const promptInput = `DATOS DEL NEGOCIO Y POST:
- Nombre del Negocio: "${businessName}"
- Rubro/Industria: "${rubro}"
- Descripción del Negocio: "${businessDescription}"
${promotions ? `- Promociones Fijas/Configuradas del Cliente: "${promotions}"` : ""}
${customOffer ? `- Oferta Especial para este post: "${customOffer}"` : ""}
- Tema/Idea del Post: "${idea}"
- Formato: ${isVertical ? "Vertical 9:16 (Stories/Reels)" : "Cuadrado 1:1 (Feed)"}

Genera el JSON del cartel publicitario con textos llamativos, persuasivos y adaptados a este negocio:`;

  try {
    const rawResponse = await generateFreeText(promptInput, systemInstruction, true);
    const cleanJson = rawResponse
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");

    const parsed: Partial<BannerCopyResult> = JSON.parse(cleanJson);

    // Paletas por defecto según rubro si el modelo no entrega alguna
    const defaultColors = getThemeDefaultsByNiche(rubro);

    return {
      badgeText: (parsed.badgeText || "🔥 OFERTA DESTACADA").toUpperCase(),
      mainHeadline: (parsed.mainHeadline || idea.slice(0, 30) || "PROMOCIÓN ESPECIAL").toUpperCase(),
      benefitText: parsed.benefitText || "Aprovecha hoy mismo en nuestro local",
      ctaText: parsed.ctaText || "👉 Escríbenos o visítanos hoy",
      visualTheme: parsed.visualTheme || defaultColors.theme,
      badgeBgColor: parsed.badgeBgColor || defaultColors.badgeBg,
      badgeTextColor: parsed.badgeTextColor || "#ffffff",
      headlineColor: parsed.headlineColor || "#ffffff",
      benefitBgColor: parsed.benefitBgColor || "rgba(0,0,0,0.75)",
      benefitTextColor: parsed.benefitTextColor || "#ffffff",
      accentColor: parsed.accentColor || defaultColors.accent
    };
  } catch (error) {
    console.warn("[AgentBannerCopy] Error parseando respuesta del agente, usando fallback calibrado por rubro:", error);
    return getFallbackBannerCopy(idea, rubro, promotions || customOffer);
  }
}

/**
 * Paletas de colores y temas preconfigurados por rubro
 */
function getThemeDefaultsByNiche(rubro: string): {
  theme: BannerCopyResult["visualTheme"];
  badgeBg: string;
  accent: string;
} {
  const r = rubro.toLowerCase();
  if (r.includes("hamburgue") || r.includes("comida") || r.includes("restauran") || r.includes("pizza") || r.includes("sushi") || r.includes("gastro")) {
    return { theme: "food_bold", badgeBg: "#dc2626", accent: "#fbbf24" }; // Rojo y Amarillo apetitoso
  }
  if (r.includes("barber") || r.includes("tatuaj") || r.includes("tatto") || r.includes("moto")) {
    return { theme: "barber_vintage", badgeBg: "#d97706", accent: "#f59e0b" }; // Ámbar / Dorado vintage
  }
  if (r.includes("peluquer") || r.includes("belleza") || r.includes("estetic") || r.includes("uñas") || r.includes("spa") || r.includes("salon")) {
    return { theme: "beauty_chic", badgeBg: "#db2777", accent: "#f472b6" }; // Rosa chic / Magenta
  }
  if (r.includes("helad") || r.includes("cafe") || r.includes("cafeter") || r.includes("postre") || r.includes("pasteler")) {
    return { theme: "vibrant", badgeBg: "#0284c7", accent: "#38bdf8" }; // Celeste vibrante / Menta
  }
  return { theme: "modern_clean", badgeBg: "#4f46e5", accent: "#818cf8" }; // Índigo moderno
}

/**
 * Fallback de seguridad en caso de fallo de red
 */
function getFallbackBannerCopy(idea: string, rubro: string, promoText: string): BannerCopyResult {
  const defaults = getThemeDefaultsByNiche(rubro);
  const headline = promoText
    ? promoText.slice(0, 35).toUpperCase()
    : idea ? idea.slice(0, 35).toUpperCase() : "PROMO EXCLUSIVA";

  return {
    badgeText: "⚡ PROMO DE LA SEMANA",
    mainHeadline: headline,
    benefitText: "Consulta disponibilidad y reserva tu lugar",
    ctaText: "👉 Escríbenos directamente al WhatsApp",
    visualTheme: defaults.theme,
    badgeBgColor: defaults.badgeBg,
    badgeTextColor: "#ffffff",
    headlineColor: "#ffffff",
    benefitBgColor: "rgba(0,0,0,0.78)",
    benefitTextColor: "#ffffff",
    accentColor: defaults.accent
  };
}
