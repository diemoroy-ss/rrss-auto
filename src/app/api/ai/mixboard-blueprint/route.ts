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
      referenceImageUrl,
      competitorHookOrNote,
      postType = "Post",
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
      referenceImageUrl?: string;
      competitorHookOrNote?: string;
      postType?: string;
    } = body;

    if (!idea && !existingTexts?.mainText && !referenceImageUrl && !competitorHookOrNote) {
      return NextResponse.json(
        { error: "Por favor sube una imagen de referencia, pega un gancho o escribe una idea base para que nuestros agentes estructuren el diseño." },
        { status: 400 }
      );
    }

    const preset = MIXBOARD_PRESETS.find((p) => p.id === presetId) || MIXBOARD_PRESETS[0];
    const isCompetitorAdaptation = Boolean(referenceImageUrl || competitorHookOrNote);

    const systemInstruction = `Eres el Agente Director de Arte, Analista de Competencia y Estratega Publicitario de Santisoft.
Tu especialidad es la metodología Google Mixboard y la ingeniería inversa de anuncios ganadores: analizas qué hace que una publicación o anuncio convierta (su gancho, psicología, jerarquía visual y oferta) y lo adaptas de forma 100% original y personalizada al negocio del usuario.
IMPORTANTE: NUNCA menciones que eres una IA o Inteligencia Artificial. Habla siempre como "nuestros agentes" o "tu equipo de agentes".

REGLAS ESTRICTAS DE COMPOSICIÓN Y REDACCIÓN:
1. IDIOMA DE LOS TEXTOS DEL CARTEL: Todos los textos visibles en el cartel (titulares, insignias, precios, CTA y copy de redes) DEBEN ESTAR EN ESPAÑOL LATAM, sonar 100% naturales, directos ("tú a tú") y sin muletillas robóticas.
2. COMPOSICIÓN CENTRADA Y LIMPIA (ZONA SEGURA):
   - Toda la tipografía (titulares, insignias y botones) debe mantenerse compacta en el área central del lienzo con amplios márgenes libres a los lados, arriba y abajo.
   - PROHIBIDO incluir números de porcentajes, medidas en píxeles o coordenadas técnicas en el prompt de imagen para evitar que el renderizador dibuje reglas o márgenes.
   - El titular debe ser conciso (máximo 45 caracteres, dividido en 2 a 4 líneas cortas).
   - El botón CTA inferior debe ir centrado horizontalmente en la parte baja con buen margen respecto al borde inferior.
3. ESTRUCTURA DEL PROMPT DE IMAGEN (blueprintPrompt):
   - Descripción fotográfica/publicitaria de la escena, iluminación de estudio, paleta (${preset.backgroundPalette}) y sujeto comercial adaptado al negocio "${businessName || "del cliente"}" (${businessType || "Comercio / Servicios"}).
   - Si se adjuntó una imagen de referencia, imita su dirección de arte (iluminación, disposición espacial, estilo tipográfico y contraste cromático), pero reemplaza el producto/marca del competidor por el del usuario.
   - Bloque final con el encabezado:
     "TYPOGRAPHY & LAYOUT (Exact Spanish text):"
     - CLEAN ADVERTISING COMPOSITION: All typography, headlines, badges, prices and CTA buttons MUST stay centered with generous breathing space away from the edges.
     - MANDATORY NEGATIVE INSTRUCTION: ABSOLUTELY DO NOT RENDER ANY MEASUREMENT ARROWS, LABELS, NUMBERS, PERCENTAGES, RED OR ORANGE GUIDELINES, DRAFTING MARKS, OR BOUNDING BOXES ON THE IMAGE.
     - UPPER CENTER (Centered pill badge floating cleanly with generous top breathing room): Insignia o kicker pequeño en mayúsculas.
     - MID-UPPER CENTER (Centered compact headline broken into 2 to 4 short lines with ample empty breathing space on left and right sides): Titular principal en español.
     - HIGHLIGHT / BADGE (opcional): Sticker de oferta o precio destacado si aplica.
     - LOWER CENTER (Centered pill button positioned cleanly above the lower edge with ample side margins): Botón CTA centrado con llamada a la acción.
     - Cierre técnico: "Ultra-sharp vector typography, commercial graphic design, compact centered composition, professional studio advertising layout, 8k."

4. FORMATO DE RESPUESTA:
   Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura exacta (sin bloques markdown ni texto extra):
   {
     "competitorInsight": "Breve explicación en español (1 oración directa) del ángulo psicológico o estructura ganadora detectada y cómo nuestros agentes la adaptaron a tu marca",
     "blueprintPrompt": "El prompt completo en inglés para generar la imagen (sin porcentajes numéricos)",
     "extractedFields": {
       "sloganText": "Texto de la insignia superior en español (máx 35 caracteres)",
       "mainText": "Titular principal en español adaptado a la marca (máx 55 caracteres)",
       "priceText": "Texto de precio u oferta si aplica (ej. 20% OFF HOY o Evaluación Gratis) o vacío",
       "ctaText": "Texto del botón de acción en español (ej. Pide por WhatsApp 👉 o Reserva tu cupo)",
       "primaryColor": "Código HEX principal recomendado para los acentos (ej: ${preset.paletteColors[3] || preset.paletteColors[1]})",
       "postCopy": "Texto persuasivo para la descripción del post en Instagram/Facebook (3-4 líneas directas con gancho, beneficio y llamado a la acción)"
     }${postType === "Carrusel" || isCarouselSequence ? `,
     "adaptedSlides": [
       {
         "slideNumber": 1,
         "sloganText": "Insignia slide 1",
         "mainText": "Titular gancho slide 1",
         "ctaText": "Desliza 👉",
         "imageExpectation": "Descripción en español de la escena visual para el slide 1"
       }
     ]` : ""}
   }`;

    const userPrompt = `${isCompetitorAdaptation
      ? `MODO CLONADOR / ADAPTADOR DE COMPETENCIA EN 1 CLIC:
Analiza ${referenceImageUrl ? "la imagen del post/anuncio de referencia adjunta" : "el gancho/anuncio de referencia indicado"}, detecta su estructura persuasiva (gancho, oferta, disposición visual y llamado a la acción) y adáptalo de forma original para el siguiente negocio:`
      : `Estructura el Blueprint publicitario estilo Mixboard con los siguientes datos:`}
- Negocio / Marca del usuario: "${businessName || "Mi Negocio"}"
- Rubro / Nicho del usuario: "${businessType || "Comercio / Servicios"}"
- Idea o instrucción del usuario: "${idea || existingTexts.mainText || ""}"
${competitorHookOrNote ? `- Gancho / Texto de competencia o instrucción de adaptación: "${competitorHookOrNote}"` : ""}
- Preset Estético: "${preset.label}" (${preset.description})
- Formato de publicación: ${postType} (${aspectRatio})
- Rol de la lámina actual: Slide ${slideNumber} (${slideRole})
${postType === "Carrusel" || isCarouselSequence ? `- Cantidad total de láminas del carrusel: ${carouselCount} (incluye el arreglo adaptedSlides con las ${carouselCount} láminas secuenciales)` : ""}
${existingTexts.mainText ? `- Titular previo sugerido: "${existingTexts.mainText}"` : ""}
${existingTexts.priceText ? `- Precio/Oferta previa: "${existingTexts.priceText}"` : ""}
${existingTexts.sloganText ? `- Slogan previo: "${existingTexts.sloganText}"` : ""}
${existingTexts.ctaText ? `- CTA previo: "${existingTexts.ctaText}"` : ""}

Genera el JSON con competitorInsight, blueprintPrompt, extractedFields${postType === "Carrusel" || isCarouselSequence ? " y adaptedSlides" : ""}.`;

    const rawResponse = await generateFreeText(
      userPrompt,
      systemInstruction,
      true,
      referenceImageUrl || undefined,
      "image_prompt"
    );

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
      console.warn("[mixboard-blueprint] Error parseando JSON, aplicando fallback:", parseErr, rawResponse);
      const fallbackMain = existingTexts.mainText || competitorHookOrNote || idea || "CONOCE NUESTRA OFERTA EXCLUSIVA";
      const fallbackPrompt = `Commercial advertising poster, ${preset.backgroundPalette}. Center composition featuring ${idea || businessType || "commercial product"}.\n\nTYPOGRAPHY & LAYOUT (Exact Spanish text):\n- CLEAN ADVERTISING COMPOSITION: All typography, headlines, badges, prices and CTA buttons MUST stay centered with generous breathing space away from the edges.\n- MANDATORY NEGATIVE INSTRUCTION: ABSOLUTELY DO NOT RENDER ANY MEASUREMENT ARROWS, LABELS, NUMBERS, PERCENTAGES, RED OR ORANGE GUIDELINES, OR BOUNDING BOXES ON THE IMAGE.\n- UPPER CENTER: "${businessName?.toUpperCase() || "DESTACADO"}"\n- MID-UPPER CENTER: "${fallbackMain}"\n- LOWER CENTER: "${existingTexts.ctaText || "Escríbenos hoy 👉"}"\nUltra-sharp vector typography, commercial graphic design, 8k.`;
      parsed = {
        competitorInsight: "Estructura comercial directa con titular de alto impacto y llamado a la acción claro.",
        blueprintPrompt: fallbackPrompt,
        extractedFields: {
          sloganText: businessName?.toUpperCase() || "DESTACADO",
          mainText: fallbackMain,
          priceText: existingTexts.priceText || "",
          ctaText: existingTexts.ctaText || "Escríbenos hoy 👉",
          primaryColor: preset.paletteColors[3] || "#FF5500",
          postCopy: "",
        },
      };
    }

    return NextResponse.json({
      success: true,
      competitorInsight: parsed.competitorInsight || "",
      blueprintPrompt: parsed.blueprintPrompt,
      extractedFields: parsed.extractedFields,
      adaptedSlides: parsed.adaptedSlides || null,
      preset: preset,
    });
  } catch (err: any) {
    console.error("[mixboard-blueprint API Error]:", err);
    return NextResponse.json(
      {
        error: err.message || "Error al estructurar y adaptar el diseño con nuestros agentes.",
      },
      { status: 500 }
    );
  }
}
