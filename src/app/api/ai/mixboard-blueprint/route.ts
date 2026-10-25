import { NextRequest, NextResponse } from "next/server";
import { generateFreeText } from "../../../../lib/gemini-free";
import { MIXBOARD_PRESETS, MixboardPresetId } from "../../../../types/poster";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      idea,
      businessType,
      businessName,
      presetId = "dark_saas",
      aspectRatio = "1:1",
      existingTexts = {},
      isCarouselSequence = false,
      carouselCount = 5,
      slideNumber = 1,
      slideRole = "Portada / Gancho",
    }: {
      idea?: string;
      businessType?: string;
      businessName?: string;
      presetId?: MixboardPresetId;
      aspectRatio?: string;
      existingTexts?: {
        mainText?: string;
        sloganText?: string;
        priceText?: string;
        ctaText?: string;
      };
      isCarouselSequence?: boolean;
      carouselCount?: number;
      slideNumber?: number;
      slideRole?: string;
    } = body;

    if (!idea && !existingTexts?.mainText) {
      return NextResponse.json(
        { error: "Por favor proporciona una idea o texto base para que nuestros agentes estructuren el diseño." },
        { status: 400 }
      );
    }

    const preset = MIXBOARD_PRESETS.find((p) => p.id === presetId) || MIXBOARD_PRESETS[0];

    const systemInstruction = `Eres el Agente Director de Arte y Diseñador Gráfico Publicitario de Santisoft.
Tu especialidad es la metodología Google Mixboard: estructurar especificaciones de diseño publicitario de alto impacto comercial que integran armónicamente dirección de arte 3D/fotográfica y composición tipográfica nítida y jerárquica.

REGLAS ESTRICTAS DE COMPOSICIÓN Y REDACCIÓN:
1. IDIOMA DE LOS TEXTOS DEL CARTEL: Todos los textos visibles en el cartel (titulares, badges, precios, CTA) DEBEN ESTAR EN ESPAÑOL LATAM y ser 100% naturales, persuasivos y comerciales.
2. ESTRUCTURA DEL PROMPT DE IMAGEN:
   - Descripción de la escena, encuadre (${aspectRatio || "4:5"} o 1:1 o 9:16), fondo con atmósfera y paleta hexadecimal (${preset.backgroundPalette}).
   - Elementos visuales principales, iluminación de estudio, profundidad de campo y sombras de contacto.
   - Bloque final obligatorio con el encabezado exacto:
     "TYPOGRAPHY & LAYOUT (Exact Spanish text):"
     Con los siguientes puntos según aplique:
     - TOP CENTER (o TOP LEFT): Pill badge o kicker pequeño en mayúsculas (slogan/categoría/diagnóstico).
     - UPPER CENTER (o MIDDLE): Titular principal en mayúsculas, alto contraste y legible.
     - HIGHLIGHT / BADGE (opcional): Sticker de oferta o precio destacado si aplica.
     - BOTTOM RIGHT (o BOTTOM CENTER): Botón CTA o badge con llamada a la acción con flecha.
     - Cierre técnico: "Ultra-sharp vector typography, commercial graphic design, professional studio advertising layout, 8k."

3. FORMATO DE RESPUESTA:
   Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura (sin bloques markdown ni texto extra):
   {
     "blueprintPrompt": "El prompt completo en inglés con el bloque TYPOGRAPHY & LAYOUT (Exact Spanish text) al final",
     "extractedFields": {
       "sloganText": "Texto del badge superior en español (máx 35 caracteres)",
       "mainText": "Titular principal en español (máx 60 caracteres)",
       "priceText": "Texto de precio u oferta si aplica (ej. 50% OFF o Desde $9.990) o vacío",
       "ctaText": "Texto del botón de acción en español con emoji (ej. Desliza y ahorra 👉 o ¡Pide el tuyo!)",
       "primaryColor": "Código HEX principal recomendado para los acentos (ej: ${preset.paletteColors[3] || preset.paletteColors[1]})"
     }
   }`;

    const userPrompt = `Estructura el Blueprint publicitario estilo Mixboard con los siguientes datos:
- Idea / Oferta: "${idea || existingTexts.mainText || ""}"
- Negocio / Marca: "${businessName || "Negocio"}"
- Rubro / Nicho: "${businessType || "Comercio / Servicios"}"
- Preset Estético: "${preset.label}" (${preset.description})
- Formato: ${aspectRatio}
- Rol de la lámina: Slide ${slideNumber} (${slideRole})
${existingTexts.mainText ? `- Titular previo sugerido: "${existingTexts.mainText}"` : ""}
${existingTexts.priceText ? `- Precio/Oferta previa: "${existingTexts.priceText}"` : ""}
${existingTexts.sloganText ? `- Slogan previo: "${existingTexts.sloganText}"` : ""}
${existingTexts.ctaText ? `- CTA previo: "${existingTexts.ctaText}"` : ""}

Genera el JSON con el blueprintPrompt y extractedFields.`;

    const rawResponse = await generateFreeText(userPrompt, systemInstruction, true, undefined, "image_prompt");

    // Limpieza de JSON
    let cleanJson = rawResponse.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn("[mixboard-blueprint] Error parseando JSON de Gemini, aplicando fallback:", parseErr, rawResponse);
      const fallbackPrompt = `Vertical ${aspectRatio} commercial advertising poster, ${preset.backgroundPalette}. Center composition featuring ${idea || "commercial product"}.\n\nTYPOGRAPHY & LAYOUT (Exact Spanish text):\n- TOP CENTER: "${businessName?.toUpperCase() || "OFERTA EXCLUSIVA"}"\n- UPPER CENTER: "${existingTexts.mainText || idea || "TRANSFORMA TU NEGOCIO HOY"}"\n- BOTTOM RIGHT: "${existingTexts.ctaText || "Conoce más 👉"}"\nUltra-sharp vector typography, commercial graphic design, 8k.`;
      parsed = {
        blueprintPrompt: fallbackPrompt,
        extractedFields: {
          sloganText: businessName?.toUpperCase() || "OFERTA EXCLUSIVA",
          mainText: existingTexts.mainText || idea || "TRANSFORMA TU NEGOCIO HOY",
          priceText: existingTexts.priceText || "",
          ctaText: existingTexts.ctaText || "Conoce más 👉",
          primaryColor: preset.paletteColors[3] || "#FF5500",
        },
      };
    }

    return NextResponse.json({
      success: true,
      blueprintPrompt: parsed.blueprintPrompt,
      extractedFields: parsed.extractedFields,
      preset: preset,
    });
  } catch (err: any) {
    console.error("[mixboard-blueprint API Error]:", err);
    return NextResponse.json(
      {
        error: err.message || "Error al estructurar el blueprint con nuestros agentes.",
      },
      { status: 500 }
    );
  }
}
