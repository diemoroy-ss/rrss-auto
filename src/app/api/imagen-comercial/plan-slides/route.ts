import { NextRequest, NextResponse } from "next/server";
import { generateFreeText } from "../../../../lib/gemini-free";
import { adminAuth } from "../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (token && adminAuth) {
      try {
        await adminAuth.verifyIdToken(token);
      } catch (e) {
        // Optional auth check
      }
    }

    const body = await req.json();
    const {
      contentType = "post", // "post" | "historia" | "carrusel"
      slideCount = 1,
      aspectRatio = "4:5", // "4:5" | "1:1" | "9:16"
      idea = "",
      includeText = true,
      textMode = "agent", // "agent" | "manual"
      customTexts = [], // array of strings per slide if textMode === "manual"
      businessName = "",
      rubro = "Comercial",
    } = body;

    if (!idea || !idea.trim()) {
      return NextResponse.json(
        { error: "Por favor ingresa una idea o tema para diseñar las imágenes." },
        { status: 400 }
      );
    }

    const numSlides = contentType === "carrusel" ? Math.min(5, Math.max(2, Number(slideCount) || 3)) : 1;

    const systemInstruction = `Eres un Director de Arte Comercial y Estratega de Contenido Visual para redes sociales en Latinoamérica.
Tu objetivo es diseñar la estructura visual y tipográfica de ${numSlides} ${numSlides > 1 ? "diapositivas para un Carrusel" : contentType === "historia" ? "Historia vertical (9:16)" : "Post comercial"} para la marca "${businessName || "el negocio"}" del rubro "${rubro}".

REGLAS ESTRICTAS DE COPYWRITING Y HUMANIZACIÓN:
1. Todo texto en español debe sonar 100% natural, directo, cercano ("tú a tú") y persuasivo.
2. CERO muletillas robóticas: Prohibido usar "En el vertiginoso mundo", "Desbloquea el potencial", "Sumérgete en", "Revoluciona", "Soluciones integrales".
3. NUNCA menciones "IA" ni "Inteligencia Artificial" en los textos. Si el negocio es tecnológico o de automatización, usa "nuestros agentes" o "nuestro equipo de agentes".
4. El campo "prompt" de cada slide debe estar en INGLÉS y describir únicamente la ESCENA VISUAL DE FONDO (iluminación, colores, objetos 3D o fotografía comercial de producto/servicio, texturas y espacio negativo oscuro o limpio en la zona superior e inferior para que los textos que estampará nuestro editor sean 100% legibles). NUNCA pidas letras ni palabras dentro del prompt en inglés de la imagen de fondo, ya que los textos se colocan en capas separadas ("textLayers").

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "slides": [
    {
      "slideNumber": 1,
      "prompt": "Detailed visual scene prompt in English, commercial photography or high-end 3D render, studio lighting, clean negative space at top and bottom for text overlay, no text, no letters, 8k",
      "badge": "ETIQUETA CORTA EN MAYÚSCULAS (ej. OFERTA ESPECIAL / PASO 1 / DIAGNÓSTICO)",
      "headline": "TITULAR DE IMPACTO EN MAYÚSCULAS (máx 10 palabras)",
      "subheadline": "Bajada explicativa directa y clara de 1 o 2 líneas (máx 18 palabras)",
      "cta": "Llamado a la acción corto (ej. Desliza para ver más 👉 / Pide el tuyo hoy 🔥)"
    }
  ]
}`;

    const manualTextsContext =
      includeText && textMode === "manual" && Array.isArray(customTexts) && customTexts.some((t) => t && t.trim())
        ? `\nEL USUARIO SOLICITÓ INCLUIR ESTOS TEXTOS ESPECÍFICOS (úsarlos y ordénalos en badge, headline, subheadline o cta según corresponda en cada slide):\n${customTexts
            .map((t, i) => `Slide ${i + 1}: "${t}"`)
            .join("\n")}`
        : "";

    const userPrompt = `Diseña ${numSlides} ${numSlides > 1 ? "slides coherentes y secuenciales para un carrusel comercial" : `diseño de ${contentType}`} en formato ${aspectRatio}.
Idea o requerimiento del usuario: "${idea.trim()}"
Negocio: ${businessName || "Negocio local"} (${rubro})
¿Lleva textos estampados?: ${includeText ? "SÍ" : "NO (dejar badge, headline, subheadline y cta vacíos)"}
${manualTextsContext}

${
  numSlides > 1
    ? `Estructura narrativa del carrusel (${numSlides} slides):
- Slide 1: Gancho principal / Problema o Promesa irresistible + CTA "Desliza 👉"
- Slides intermedios: Beneficios concretos, pasos, comparativa o características clave (1 idea fuerte por slide).
- Slide ${numSlides}: Cierre de conversión, oferta clara o llamado a la acción directo.`
    : `Estructura de 1 sola imagen (${contentType}):
- Gancho superior (badge), Titular principal claro (headline), detalle persuasivo (subheadline) y llamado a la acción (cta).`
}`;

    const rawResponse = await generateFreeText(userPrompt, systemInstruction, true);
    let parsed: any = null;
    try {
      const cleaned = rawResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn("[plan-slides] Fallback JSON parse:", parseErr);
    }

    const rawSlides: any[] = Array.isArray(parsed?.slides) ? parsed.slides : [];

    // Construir los slides finales con capas de texto posicionadas para Butterfly Social
    const formattedSlides = Array.from({ length: numSlides }).map((_, idx) => {
      const item = rawSlides[idx] || {};
      const visualPrompt =
        item.prompt ||
        `Commercial high-end background for ${rubro}, ${idea.trim()}, studio lighting, clean negative space at top and bottom for typography, 8k, no text, no watermark`;

      const layers: any[] = [];
      const baseTs = Date.now() + idx * 100;

      if (includeText) {
        // Si el usuario ingresó texto manual para este slide y el modelo no lo separó, o si el modelo devolvió campos estructurados
        const manualRaw = textMode === "manual" && customTexts[idx] ? String(customTexts[idx]).trim() : "";

        const badgeText = (item.badge || "").trim();
        const headlineText = (item.headline || (manualRaw && !item.headline ? manualRaw : "")).trim();
        const subheadlineText = (item.subheadline || "").trim();
        const ctaText = (item.cta || "").trim();

        if (badgeText) {
          layers.push({
            id: `layer-${baseTs}-1`,
            text: badgeText.toUpperCase(),
            x: 50,
            y: aspectRatio === "9:16" ? 16 : 12,
            fontFamily: "'Montserrat', sans-serif",
            size: 13,
            color: "#FFFFFF",
            backgroundColor: "#FF5500",
            isPill: true,
            shadowLevel: "soft",
            isBold: true,
            isItalic: false,
            letterSpacing: "wide",
            boxWidth: 0,
            textAlign: "center",
          });
        }

        if (headlineText) {
          layers.push({
            id: `layer-${baseTs}-2`,
            text: headlineText,
            x: 50,
            y: aspectRatio === "9:16" ? 28 : 26,
            fontFamily: "'Montserrat', sans-serif",
            size: headlineText.length > 45 ? 22 : 26,
            color: "#FFFFFF",
            backgroundColor: "transparent",
            isPill: false,
            shadowLevel: "hard",
            isBold: true,
            isItalic: false,
            letterSpacing: "normal",
            boxWidth: 88,
            textAlign: "center",
          });
        }

        if (subheadlineText) {
          layers.push({
            id: `layer-${baseTs}-3`,
            text: subheadlineText,
            x: 50,
            y: aspectRatio === "9:16" ? 42 : 43,
            fontFamily: "'Outfit', sans-serif",
            size: 15,
            color: "#F8FAFC",
            backgroundColor: "transparent",
            isPill: false,
            shadowLevel: "hard",
            isBold: false,
            isItalic: false,
            letterSpacing: "normal",
            boxWidth: 84,
            textAlign: "center",
          });
        }

        if (ctaText) {
          layers.push({
            id: `layer-${baseTs}-4`,
            text: ctaText,
            x: 50,
            y: aspectRatio === "9:16" ? 86 : 88,
            fontFamily: "'Montserrat', sans-serif",
            size: 14,
            color: "#0F172A",
            backgroundColor: "#FFFFFF",
            isPill: true,
            shadowLevel: "hard",
            isBold: true,
            isItalic: false,
            letterSpacing: "normal",
            boxWidth: 0,
            textAlign: "center",
          });
        }
      }

      return {
        prompt: visualPrompt,
        aspectRatio,
        textLayers: layers,
      };
    });

    return NextResponse.json({
      success: true,
      slides: formattedSlides,
    });
  } catch (error: any) {
    console.error("[imagen-comercial/plan-slides] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al diseñar la propuesta con nuestros agentes." },
      { status: 500 }
    );
  }
}
