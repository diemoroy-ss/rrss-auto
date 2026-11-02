import { generateFreeText } from "../gemini-free";
import {
  DEFAULT_TEXT_TEMPLATES,
  TextTemplate,
  LayoutPosition,
  TypographyStyle,
  IngredientItem,
} from "../text-templates";

export type PostObjective = "promo" | "recipe" | "hero" | "combo" | "launch" | "auto";

export interface ArtDirectionInput {
  imageUrl?: string;
  productName: string;
  postObjective?: PostObjective;
  price?: string;
  rubro?: string;
  captionIdea?: string;
  isPromotion?: boolean;
  preferredLayout?: LayoutPosition | "auto";
  preferredFontStyle?: TypographyStyle | "auto";
  variationIndex?: number;
}

export interface ArtDirectionOutput {
  layoutPosition: LayoutPosition;
  fontStyle: TypographyStyle;
  recommendedWithText: boolean;
  formatLabel: string;
  templateId: string;
  template: TextTemplate;
  reasoning: string;
  kickerText?: string;
  ingredients?: IngredientItem[];
  suggestedBadge?: string;
  compositionDirective: string;
}

const LAYOUT_LABELS: Record<LayoutPosition, string> = {
  split_left: "Split Lateral Izquierdo",
  split_right: "Split Lateral Derecho",
  top_banner: "Cabecera Superior",
  recipe_ingredients: "Ficha Editorial / Atributos",
};

const FONT_LABELS: Record<TypographyStyle, string> = {
  bold_modern: "Bold Impacto",
  bold_textured: "Bold Texturizado",
  elegant_serif: "Serif Elegante",
  script_handwritten: "Script Artesanal",
  clean_minimal: "Minimalista Limpio",
  serif_script_mix: "Mix Editorial",
};

export function getTextFormatLabel(
  layout: LayoutPosition,
  fontStyle: TypographyStyle
): string {
  return `${LAYOUT_LABELS[layout] || "Cabecera Superior"} · ${FONT_LABELS[fontStyle] || "Bold Impacto"}`;
}

/**
 * Directivas de encuadre fotográfico para inyectar en prompts de imagen
 * cuando la imagen será generada por nuestros agentes (adaptable a cualquier rubro).
 */
export function getCompositionDirective(
  layout: LayoutPosition,
  productName: string = "the main subject",
  rubro: string = "general"
): string {
  const isFood = /restauran|gastronom|comida|pizz|burger|hamburgues|sushi|cafe|cafeter|pastel|panader|bar|cervecer|parrill|restobar/i.test(
    rubro
  );
  const subjectLabel = productName || (isFood ? "the dish" : "the hero subject");

  switch (layout) {
    case "split_left":
      return `Asymmetric commercial advertising photography. The hero subject (${subjectLabel}) is framed specifically within the right 50% of the frame. The left 50% is an uncluttered, softly lit background with subtle bokeh, purposefully leaving expansive clean negative space for graphic design overlays. Subject must strictly NOT be centered. Clean render without any text, letters or watermarks.`;

    case "split_right":
      return `Asymmetric commercial advertising photography. The hero subject (${subjectLabel}) is framed strictly within the left 50% of the frame. The right 50% is an uncluttered, soft-focus background leaving wide open clean negative space for commercial graphic design. Clean render without any text, letters or watermarks.`;

    case "recipe_ingredients":
      return `Clean editorial presentation of ${subjectLabel} positioned in the middle third of the frame. Generous clean negative space at the upper header and lower footer margins for an editorial feature layout. Natural balanced lighting, high commercial appeal, clean render without any text, letters or watermarks.`;

    case "top_banner":
    default:
      return `Commercial hero photography of ${subjectLabel} positioned in the lower-middle half of the frame. Clean open atmospheric background at the top header leaving generous negative space for typography. Shallow depth of field, rich detail, clean photo without any text or letters.`;
  }
}

/**
 * Selecciona la mejor plantilla de la biblioteca para un layout, tipografía y objetivo determinado.
 */
export function matchBestTemplateForLayout(
  layout: LayoutPosition,
  objective: PostObjective = "auto",
  fontStyle?: TypographyStyle
): TextTemplate {
  if (layout === "split_left" || layout === "split_right") {
    if (objective === "combo") {
      return (
        DEFAULT_TEXT_TEMPLATES.find((t) => t.id === "tpl-split-burger-combo") ||
        DEFAULT_TEXT_TEMPLATES[0]
      );
    }
    if (objective === "launch" || fontStyle === "elegant_serif") {
      return (
        DEFAULT_TEXT_TEMPLATES.find((t) => t.id === "tpl-split-butter-chicken") ||
        DEFAULT_TEXT_TEMPLATES[0]
      );
    }
    return (
      DEFAULT_TEXT_TEMPLATES.find((t) => t.id === "tpl-split-pizza") ||
      DEFAULT_TEXT_TEMPLATES.find((t) => t.layoutPosition === "split_left") ||
      DEFAULT_TEXT_TEMPLATES[0]
    );
  }

  if (layout === "recipe_ingredients") {
    if (objective === "promo") {
      return (
        DEFAULT_TEXT_TEMPLATES.find((t) => t.id === "tpl-express-ramen") ||
        DEFAULT_TEXT_TEMPLATES[0]
      );
    }
    return (
      DEFAULT_TEXT_TEMPLATES.find((t) => t.id === "tpl-recipe-pasta-garlic") ||
      DEFAULT_TEXT_TEMPLATES[0]
    );
  }

  // top_banner
  if (fontStyle === "elegant_serif" || fontStyle === "serif_script_mix") {
    return (
      DEFAULT_TEXT_TEMPLATES.find((t) => t.id === "tpl-new-dish") ||
      DEFAULT_TEXT_TEMPLATES[0]
    );
  }
  if (objective === "promo") {
    return (
      DEFAULT_TEXT_TEMPLATES.find((t) => t.id === "tpl-flash-promo") ||
      DEFAULT_TEXT_TEMPLATES[0]
    );
  }
  return (
    DEFAULT_TEXT_TEMPLATES.find((t) => t.id === "tpl-artisan-burger") ||
    DEFAULT_TEXT_TEMPLATES[0]
  );
}

function normalizeLayout(raw: any, fallback: LayoutPosition = "top_banner"): LayoutPosition {
  if (
    raw === "split_left" ||
    raw === "split_right" ||
    raw === "top_banner" ||
    raw === "recipe_ingredients"
  ) {
    return raw;
  }
  return fallback;
}

function normalizeFontStyle(raw: any, fallback: TypographyStyle = "bold_modern"): TypographyStyle {
  if (
    raw === "bold_modern" ||
    raw === "elegant_serif" ||
    raw === "script_handwritten" ||
    raw === "clean_minimal" ||
    raw === "serif_script_mix"
  ) {
    return raw;
  }
  return fallback;
}

/**
 * Agente Director de Arte:
 * Analiza cada imagen (o planificación de post) y determina de forma autónoma:
 * 1. si conviene llevar texto superpuesto o lucir como foto limpia (recommendedWithText),
 * 2. la disposición espacial óptima (split_left, split_right, top_banner, recipe_ingredients),
 * 3. el estilo tipográfico ideal (bold_modern, elegant_serif, script_handwritten, clean_minimal, serif_script_mix),
 * adaptándose a cualquier rubro o industria del cliente.
 */
export async function decideArtDirection(
  input: ArtDirectionInput
): Promise<ArtDirectionOutput> {
  const {
    imageUrl,
    productName,
    postObjective = "auto",
    price,
    rubro = "General",
    captionIdea,
    isPromotion = false,
    preferredLayout,
    preferredFontStyle,
    variationIndex = 0,
  } = input;

  const isFood = /restauran|gastronom|comida|pizz|burger|hamburgues|sushi|cafe|cafeter|pastel|panader|bar|cervecer|parrill|restobar/i.test(
    rubro
  );
  const isHealthOrBeauty = /clinic|clínic|salud|medic|médic|dental|odont|estetic|estétic|spa|belleza|kinesi|psicol|dermat/i.test(
    rubro
  );
  const isProfessionalOrTech = /abogad|contab|consultor|inmobiliari|software|agencia|arquitect|ingenier|b2b|finanz/i.test(
    rubro
  );

  const effectiveSubject =
    productName ||
    (isFood ? "Especialidad de la Casa" : "Servicio Destacado");

  // ═══════════════════════════════════════════════════════════════
  // CASO A: FOTO PROPORCIONADA -> ANÁLISIS DE VISIÓN Y COMPOSICIÓN
  // ═══════════════════════════════════════════════════════════════
  if (imageUrl && imageUrl.startsWith("http")) {
    try {
      const visionSystemInstruction = `Eres el Agente Director de Arte y Tipógrafo Publicitario de nuestro equipo.
Tu misión es inspeccionar la imagen subida y determinar qué formato de texto (disposición espacial + estilo tipográfico) queda mejor sobre esta fotografía específica sin tapar el producto o sujeto principal.

1. DISPOSICIÓN DEL TEXTO ("layoutPosition"):
- "split_left": Si el producto/sujeto principal tiene más peso en el centro-derecha o derecha, o si la franja izquierda tiene espacio más limpio/desenfocado para colocar una columna de texto, precio y botón.
- "split_right": Si el sujeto principal está a la izquierda y el lado derecho de la imagen está más despejado.
- "top_banner": Si el producto/sujeto está centrado o en la mitad inferior, dejando la cabecera superior y la base libres para el titular y el precio.
- "recipe_ingredients": Si la imagen es cenital o editorial y se presta para cabecera superior + ficha de atributos, beneficios o ingredientes en la base.

2. ESTILO TIPOGRÁFICO ("fontStyle"):
- "bold_modern": Alto impacto comercial, ideal para promociones, combos, descuentos, precios fuertes o comida rápida/restobar.
- "elegant_serif": Sofisticado y editorial, ideal para gastronomía gourmet, clínicas, estética, joyería, vinos o servicios premium.
- "script_handwritten": Cálido, artesanal y cercano, ideal para pastelería, café, productos hechos a mano o promociones acogedoras.
- "clean_minimal": Moderno, corporativo y limpio, ideal para tecnología, servicios profesionales, salud, inmobiliaria o retail minimalista.
- "serif_script_mix": Combinación editorial de serif con acento en cursiva, ideal para lanzamientos, especialidades o fichas de producto.

3. RECOMENDACIÓN DE TEXTO ("recommendedWithText"):
- true: Si es una promoción, oferta con precio, combo o la imagen tiene buen espacio negativo para lucir como cartel publicitario.
- false: Si es una fotografía lifestyle o primer plano extremo donde cualquier texto encima restaría atractivo visual.

REGLA DE TONO HUMANO:
- "reasoning" DEBE ser una frase concisa, directa y 100% natural en español (máx 22 palabras), explicando por qué nuestros agentes eligieron ese formato para esta imagen (ej: "Sujeto a la derecha con fondo libre a la izquierda: nuestros agentes eligieron Split Izquierdo y letra Bold para destacar el precio").
- NUNCA menciones "IA" ni "inteligencia artificial"; habla siempre como "nuestros agentes".

FORMATO DE SALIDA (JSON estricto):
{
  "layoutPosition": "split_left" | "split_right" | "top_banner" | "recipe_ingredients",
  "fontStyle": "bold_modern" | "elegant_serif" | "script_handwritten" | "clean_minimal" | "serif_script_mix",
  "recommendedWithText": true | false,
  "reasoning": "Justificación breve y natural de nuestros agentes",
  "kickerText": "Frase corta de apoyo (máx 4 palabras, acorde al rubro)",
  "suggestedBadge": "Insignia corta (ej: '🔥 OFERTA', '⭐ DESTACADO', '✨ NUEVO')"
}`;

      const visionUserPrompt = `Analiza esta imagen comercial y recomienda el mejor formato de texto:
- Producto / Servicio / Promo: ${effectiveSubject}
- Precio / Oferta: ${price || "No especificado"}
- Es Promoción: ${isPromotion ? "Sí" : "No"}
- Objetivo del post: ${postObjective}
- Rubro del negocio: ${rubro}
- Contexto del post: ${captionIdea || "Publicación comercial"}

Devuelve únicamente el JSON:`;

      const rawResponse = await generateFreeText(
        visionUserPrompt,
        visionSystemInstruction,
        true,
        imageUrl,
        "art-director-vision"
      );

      const cleanJson = rawResponse.replace(/```json\s*|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      const finalLayout =
        preferredLayout && preferredLayout !== "auto"
          ? preferredLayout
          : normalizeLayout(parsed.layoutPosition, "top_banner");

      const finalFont =
        preferredFontStyle && preferredFontStyle !== "auto"
          ? preferredFontStyle
          : normalizeFontStyle(parsed.fontStyle, isPromotion ? "bold_modern" : "clean_minimal");

      const matchedTemplate = matchBestTemplateForLayout(finalLayout, postObjective, finalFont);

      return {
        layoutPosition: finalLayout,
        fontStyle: finalFont,
        recommendedWithText:
          typeof parsed.recommendedWithText === "boolean"
            ? parsed.recommendedWithText
            : Boolean(isPromotion || price || postObjective === "promo"),
        formatLabel: getTextFormatLabel(finalLayout, finalFont),
        templateId: matchedTemplate.id,
        template: matchedTemplate,
        reasoning:
          parsed.reasoning ||
          "Nuestros agentes ajustaron la posición y tipografía según los espacios libres de la foto para no cubrir el producto.",
        kickerText: parsed.kickerText || matchedTemplate.secondaryScriptPattern,
        ingredients:
          finalLayout === "recipe_ingredients" &&
          Array.isArray(parsed.ingredients) &&
          parsed.ingredients.length > 0
            ? parsed.ingredients.slice(0, 5)
            : matchedTemplate.ingredients,
        suggestedBadge: parsed.suggestedBadge || matchedTemplate.badgeText,
        compositionDirective: getCompositionDirective(finalLayout, effectiveSubject, rubro),
      };
    } catch (err) {
      console.warn(
        "[AgentArtDirector] Fallback en análisis de visión, aplicando análisis contextual por rubro:",
        err
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CASO B: ANÁLISIS CONTEXTUAL MULTI-RUBRO (O FALLBACK RÁPIDO)
  // ═══════════════════════════════════════════════════════════════
  const lowerName = effectiveSubject.toLowerCase();
  const lowerCaption = (captionIdea || "").toLowerCase();
  const combinedText = `${lowerName} ${lowerCaption}`;

  let determinedLayout: LayoutPosition = "top_banner";
  let determinedFont: TypographyStyle = "bold_modern";
  let recommendedWithText = Boolean(isPromotion || price || postObjective === "promo" || postObjective === "combo");
  let reasoning = "";
  let kicker = isFood ? "Especialidad de la Casa" : "Calidad Garantizada";
  let suggestedBadge = isPromotion ? "🔥 PROMOCIÓN" : "⭐ DESTACADO";
  let ingredients: IngredientItem[] | undefined;

  // 1. Detectar si es ficha educativa / atributos / ingredientes / paso a paso
  if (
    postObjective === "recipe" ||
    /receta|ingrediente|beneficio|incluye|paso a paso|ficha|propiedad|característic|kit|pack/i.test(
      combinedText
    )
  ) {
    determinedLayout = "recipe_ingredients";
    determinedFont = isHealthOrBeauty || isProfessionalOrTech ? "clean_minimal" : "serif_script_mix";
    recommendedWithText = true;
    reasoning =
      "Publicación con múltiples atributos: nuestros agentes eligieron la Ficha Editorial para desglosar los detalles sin saturar el centro.";
    kicker = isFood ? "Preparación de la Casa" : "Beneficios Clave";
    suggestedBadge = isPromotion ? "🔥 PACK ESPECIAL" : "✨ DETALLES";
  }
  // 2. Promociones fuertes, combos, 2x1, descuentos o precios explícitos
  else if (
    isPromotion ||
    postObjective === "combo" ||
    postObjective === "promo" ||
    Boolean(price) ||
    /2x1|3x2|promo|oferta|descuento|off|combo|pack|gratis|regalo|\$/i.test(combinedText)
  ) {
    // Alternar inteligentemente entre split_left, top_banner y split_right según el tipo de oferta o índice
    if (variationIndex % 3 === 1) {
      determinedLayout = "top_banner";
    } else if (variationIndex % 3 === 2) {
      determinedLayout = "split_right";
    } else {
      determinedLayout = "split_left";
    }

    if (isHealthOrBeauty) {
      determinedFont = "elegant_serif";
      reasoning =
        determinedLayout === "top_banner"
          ? "Promoción estética/salud: nuestros agentes eligieron Cabecera Superior con Serif Elegante para transmitir confianza y resaltar el valor."
          : "Oferta destacada: nuestros agentes aplicaron Split Lateral con tipografía Serif Elegante para separar el beneficio de la imagen.";
    } else if (isProfessionalOrTech) {
      determinedFont = "clean_minimal";
      reasoning =
        "Oferta comercial: nuestros agentes seleccionaron diseño limpio y tipografía Minimalista para máxima lectura en móvil.";
    } else {
      determinedFont = variationIndex % 2 === 0 ? "bold_modern" : "serif_script_mix";
      reasoning =
        determinedLayout === "split_left"
          ? "Promoción de alto impacto: nuestros agentes ubicaron la columna de texto a la izquierda con tipografía Bold para destacar precio y oferta."
          : determinedLayout === "split_right"
          ? "Balance visual en el feed: nuestros agentes ubicaron el bloque promocional a la derecha dejando el producto protagonista a la izquierda."
          : "Oferta directa: nuestros agentes eligieron Cabecera Superior con tipografía Bold para captar la atención en el primer segundo.";
    }

    recommendedWithText = true;
    kicker = "Por tiempo limitado";
    suggestedBadge = "🔥 OFERTA ESPECIAL";
  }
  // 3. Producto artesanal, cercano o historia de marca
  else if (/artesanal|casero|natural|orgánic|tradici|hecho a mano|dulce|postre|café/i.test(combinedText)) {
    determinedLayout = "top_banner";
    determinedFont = "script_handwritten";
    recommendedWithText = variationIndex % 2 === 0;
    reasoning =
      "Tono cercano y artesanal: nuestros agentes seleccionaron Cabecera Superior con tipografía Script para dar calidez sin tapar el producto.";
    kicker = "Hecho con dedicación";
    suggestedBadge = "✨ ARTESANAL";
  }
  // 4. Presentación de producto o servicio insignia (Hero Shot)
  else {
    determinedLayout = variationIndex % 2 === 0 ? "top_banner" : "split_left";
    determinedFont = isHealthOrBeauty
      ? "elegant_serif"
      : isProfessionalOrTech
      ? "clean_minimal"
      : "serif_script_mix";
    recommendedWithText = variationIndex % 2 === 0;
    reasoning = recommendedWithText
      ? "Presentación de producto: nuestros agentes eligieron diseño editorial despejado en el centro para lucir cada detalle."
      : "Fotografía protagonista: nuestros agentes recomiendan imagen limpia sin texto para destacar la calidad visual en el feed.";
    kicker = isFood ? "Especialidad de la Casa" : "Servicio Destacado";
    suggestedBadge = "⭐ DESTACADO";
  }

  if (preferredLayout && preferredLayout !== "auto") {
    determinedLayout = preferredLayout;
  }
  if (preferredFontStyle && preferredFontStyle !== "auto") {
    determinedFont = preferredFontStyle;
  }

  const matchedTemplate = matchBestTemplateForLayout(
    determinedLayout,
    postObjective,
    determinedFont
  );

  return {
    layoutPosition: determinedLayout,
    fontStyle: determinedFont,
    recommendedWithText,
    formatLabel: getTextFormatLabel(determinedLayout, determinedFont),
    templateId: matchedTemplate.id,
    template: matchedTemplate,
    reasoning,
    kickerText: kicker,
    ingredients,
    suggestedBadge,
    compositionDirective: getCompositionDirective(determinedLayout, effectiveSubject, rubro),
  };
}
