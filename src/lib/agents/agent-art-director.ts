import { generateFreeText } from "../gemini-free";
import {
  DEFAULT_TEXT_TEMPLATES,
  TextTemplate,
  LayoutPosition,
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
}

export interface ArtDirectionOutput {
  layoutPosition: LayoutPosition;
  templateId: string;
  template: TextTemplate;
  reasoning: string;
  kickerText?: string;
  ingredients?: IngredientItem[];
  suggestedBadge?: string;
  compositionDirective: string;
}

/**
 * Directivas de encuadre fotográfico para inyectar en prompts de imagen
 * cuando la imagen será generada por nuestros agentes.
 */
export function getCompositionDirective(
  layout: LayoutPosition,
  productName: string = "the dish"
): string {
  switch (layout) {
    case "split_left":
      return `Asymmetric commercial advertising food photography. The hero ${productName} is framed specifically within the right 50% of the frame. The left 50% is an uncluttered, dimly lit surface with soft bokeh, purposefully leaving expansive clean negative space for graphic design overlays. Subject must strictly NOT be centered. Commercial restaurant lighting, clean render without any text, letters or typography.`;

    case "split_right":
      return `Asymmetric commercial advertising food photography. The hero ${productName} is framed strictly within the left 50% of the frame. The right 50% is an uncluttered, soft-focus background leaving wide open clean negative space for commercial graphic design. Clean render without any text, letters or typography.`;

    case "recipe_ingredients":
      return `Clean overhead flat-lay culinary presentation of ${productName} positioned in the middle third of the table. Generous clean negative space at the upper header and lower footer margins for a recipe card layout. Natural soft lighting, authentic kitchen aesthetic, clean render without any text, letters or watermarks.`;

    case "top_banner":
    default:
      return `Commercial hero food photography of ${productName} positioned in the lower-middle half of the frame at a 45-degree angle. Clean open atmospheric background at the top header leaving generous space for typography. Deep depth of field, appetizing texture, clean photo without any text or letters.`;
  }
}

/**
 * Selecciona la mejor plantilla de la biblioteca para un layout y objetivo determinado.
 */
export function matchBestTemplateForLayout(
  layout: LayoutPosition,
  objective: PostObjective = "auto"
): TextTemplate {
  if (layout === "split_left" || layout === "split_right") {
    if (objective === "combo") {
      return (
        DEFAULT_TEXT_TEMPLATES.find((t) => t.id === "tpl-split-burger-combo") ||
        DEFAULT_TEXT_TEMPLATES[0]
      );
    }
    if (objective === "launch") {
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

/**
 * Agente Director de Arte:
 * Decide de forma autónoma la disposición visual óptima (lateral, superior, o receta con ingredientes),
 * tanto analizando fotos reales existentes como planificando la composición para imágenes a generar.
 */
export async function decideArtDirection(
  input: ArtDirectionInput
): Promise<ArtDirectionOutput> {
  const {
    imageUrl,
    productName,
    postObjective = "auto",
    price,
    rubro = "gastronomía",
    captionIdea,
  } = input;

  const effectiveDish = productName || "Especialidad de la Casa";

  // ═══════════════════════════════════════════════════════════════
  // CASO A: FOTO REAL PROPORCIONADA -> ANÁLISIS DE VISIÓN Y ENCUADRE
  // ═══════════════════════════════════════════════════════════════
  if (imageUrl && imageUrl.startsWith("http")) {
    try {
      const visionSystemInstruction = `Eres el Agente Director de Arte y Fotógrafo Comercial del equipo.
Tu misión es inspeccionar la fotografía de producto subida y determinar la mejor disposición tipográfica para un afiche publicitario.

REGLAS DE DECISIÓN ESTÉTICA:
1. "split_left": Si el plato/producto principal está ubicado en el centro-derecho o derecho, dejando la franja izquierda con fondo desenfocado, mesa o espacio libre. O si el producto es un combo/hamburguesa/pizza con llamada a la acción comercial.
2. "split_right": Si el producto está a la izquierda y el espacio vacío está a la derecha.
3. "recipe_ingredients": Si la imagen muestra un plato cocinado con ingredientes visibles o el contexto menciona receta, preparación o pasta/sopa, dejando espacio arriba y abajo.
4. "top_banner": Si el plato está centrado o en el tercio inferior, con buen contraste en la cabecera superior.

REGLA HUMANA Y DE TONO:
- La justificación ("reasoning") DEBE ser una frase concisa, directa y natural en español (máx 20 palabras), explicando por qué nuestro equipo de agentes eligió ese diseño (ej: "Plato ubicado a la derecha: aplicamos Split Lateral para destacar el combo sin tapar la comida").
- NUNCA menciones "IA" ni "inteligencia artificial"; habla como "nuestros agentes" o en primera persona del equipo.

FORMATO DE SALIDA (JSON estricto):
{
  "layoutPosition": "split_left" | "split_right" | "top_banner" | "recipe_ingredients",
  "reasoning": "Frase breve y humana de dirección de arte",
  "kickerText": "Palabra o frase de remate en cursiva (ej: 'El Favorito del Chef', 'Una receta, mil momentos', 'Especial')",
  "suggestedBadge": "Insignia superior (ej: '⭐ DESTACADO', '🔥 COMBO IMPERDIBLE', '⏰ EN 15 MIN')",
  "ingredients": [
    { "icon": "emoji", "name": "Ingrediente", "amount": "cantidad" }
  ]
}`;

      const visionUserPrompt = `Inspecciona esta fotografía comercial:
- Producto: ${effectiveDish}
- Precio: ${price || "No especificado"}
- Objetivo del post: ${postObjective}
- Rubro: ${rubro}
- Texto o idea adicional: ${captionIdea || "Ninguna"}

Devuelve el JSON con la decisión de dirección de arte:`;

      const rawResponse = await generateFreeText(
        visionUserPrompt,
        visionSystemInstruction,
        true, // jsonMode
        imageUrl,
        "art-director-vision"
      );

      const cleanJson = rawResponse.replace(/```json\s*|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      const layout: LayoutPosition =
        parsed.layoutPosition === "split_right"
          ? "split_right"
          : parsed.layoutPosition === "recipe_ingredients"
          ? "recipe_ingredients"
          : parsed.layoutPosition === "top_banner"
          ? "top_banner"
          : "split_left";

      const matchedTemplate = matchBestTemplateForLayout(layout, postObjective);

      return {
        layoutPosition: layout,
        templateId: matchedTemplate.id,
        template: matchedTemplate,
        reasoning:
          parsed.reasoning ||
          "Nuestros agentes ajustaron la tipografía para no obstruir los detalles principales del plato.",
        kickerText: parsed.kickerText || matchedTemplate.secondaryScriptPattern,
        ingredients:
          layout === "recipe_ingredients" && Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0
            ? parsed.ingredients.slice(0, 5)
            : matchedTemplate.ingredients,
        suggestedBadge: parsed.suggestedBadge || matchedTemplate.badgeText,
        compositionDirective: getCompositionDirective(layout, effectiveDish),
      };
    } catch (err) {
      console.warn("[AgentArtDirector] Error en visión de foto real, aplicando heurística inteligente:", err);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CASO B: PLANIFICACIÓN PARA IMAGEN GENERADA (O FALLBACK SIN FOTO)
  // ═══════════════════════════════════════════════════════════════
  const lowerName = effectiveDish.toLowerCase();
  const lowerCaption = (captionIdea || "").toLowerCase();

  let determinedLayout: LayoutPosition = "top_banner";
  let reasoning = "";
  let kicker = "Recomendación del Chef";
  let suggestedBadge = "⭐ RECOMENDADO";
  let ingredients: IngredientItem[] | undefined;

  // Criterio 1: Recetas & Gastronomía Casera
  if (
    postObjective === "recipe" ||
    lowerName.includes("receta") ||
    lowerName.includes("pasta") ||
    lowerName.includes("ramen") ||
    lowerName.includes("sopa") ||
    lowerName.includes("ensalada") ||
    lowerCaption.includes("ingrediente") ||
    lowerCaption.includes("preparación")
  ) {
    determinedLayout = "recipe_ingredients";
    reasoning =
      "Contenido de receta: nuestros agentes eligieron la ficha con tira de ingredientes para destacar la frescura de la preparación.";
    kicker = "Una receta, mil momentos ♡";
    suggestedBadge = "🥗 RECETA DE LA CASA";
    ingredients = [
      { icon: "🧄", name: "Ajo", amount: "3 dientes" },
      { icon: "🫒", name: "Oliva", amount: "1 cda" },
      { icon: "🌿", name: "Hierbas", amount: "al gusto" },
      { icon: "🧀", name: "Queso", amount: "½ taza" },
    ];
  }
  // Criterio 2: Combos, Promos comerciales y Lanzamientos (Split Lateral)
  else if (
    postObjective === "combo" ||
    postObjective === "promo" ||
    postObjective === "launch" ||
    price ||
    lowerName.includes("combo") ||
    lowerName.includes("burger") ||
    lowerName.includes("hamburguesa") ||
    lowerName.includes("pizza") ||
    lowerName.includes("promo") ||
    lowerCaption.includes("pide") ||
    lowerCaption.includes("whatsapp")
  ) {
    determinedLayout = "split_left";
    reasoning =
      "Post comercial de alto impacto: nuestros agentes ubicaron el plato a la derecha para dar espacio al combo, precio y botón.";
    kicker = "Edición Especial";
    suggestedBadge = "🔥 BEST VALUE!";
  }
  // Criterio 3: Platos de Autor / Hero Shots
  else {
    determinedLayout = "top_banner";
    reasoning =
      "Plato insignia: nuestros agentes seleccionaron cabecera superior para dejar el centro completamente despejado para el producto.";
    kicker = "Especialidad de la Casa";
    suggestedBadge = "⭐ DESTACADO";
  }

  const matchedTemplate = matchBestTemplateForLayout(determinedLayout, postObjective);

  return {
    layoutPosition: determinedLayout,
    templateId: matchedTemplate.id,
    template: matchedTemplate,
    reasoning,
    kickerText: kicker,
    ingredients,
    suggestedBadge,
    compositionDirective: getCompositionDirective(determinedLayout, effectiveDish),
  };
}
