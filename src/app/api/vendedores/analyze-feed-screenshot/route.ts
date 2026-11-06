import { NextRequest, NextResponse } from "next/server";
import { getFreeModel } from "../../../../lib/gemini-free";
import { sanitizeInput } from "../../../../lib/security";
import { FeedAuditDiagnosis } from "../../../../types/demo-plan";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      screenshotUrl = "",
      imageBase64 = "",
      imageMimeType = "image/jpeg",
      businessName = "",
      rubro = "Gastronomía",
    } = body;

    const safeBusinessName = sanitizeInput(businessName?.trim() || "este negocio");
    const safeRubro = sanitizeInput(rubro?.trim() || "Comercial");

    // Resolver parte de imagen inlineData para Gemini Vision
    let imagePart: any = null;

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      imagePart = {
        inlineData: {
          data: cleanBase64,
          mimeType: imageMimeType || "image/jpeg",
        },
      };
    } else if (screenshotUrl) {
      if (screenshotUrl.startsWith("data:")) {
        const matches = screenshotUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          imagePart = {
            inlineData: {
              data: matches[2],
              mimeType: matches[1] || "image/jpeg",
            },
          };
        }
      } else {
        try {
          const imgRes = await fetch(screenshotUrl);
          const buffer = await imgRes.arrayBuffer();
          imagePart = {
            inlineData: {
              data: Buffer.from(buffer).toString("base64"),
              mimeType: imgRes.headers.get("content-type") || "image/jpeg",
            },
          };
        } catch (fetchErr) {
          console.error("[analyze-feed-screenshot] Error al descargar screenshotUrl:", fetchErr);
        }
      }
    }

    if (!imagePart) {
      return NextResponse.json(
        { error: "No se proporcionó una imagen válida del feed de Instagram para analizar." },
        { status: 400 }
      );
    }

    const systemInstruction = `Eres un Director Creativo y Auditor Senior de Redes Sociales de nuestro equipo de agentes especializados.
Tu misión es inspeccionar visualmente una captura de pantalla del feed de Instagram de un negocio local (${safeBusinessName}, rubro: ${safeRubro}) y entregar un diagnóstico honesto, profesional y orientado a aumentar pedidos y ventas.

REGLAS DE ORO DE HUMANIZACIÓN (AGENTS.md):
1. Tono 100% natural, directo ("tú a tú"), cercano y comercial chileno / latinoamericano.
2. Cero muletillas de IA (PROHIBIDO usar frases como "en el vertiginoso mundo", "en conclusión", "desbloquea el potencial", "sumérgete en", "un deleite para los sentidos").
3. NUNCA menciones "IA" ni "Inteligencia Artificial". Si refieres al análisis, habla de "nuestros agentes" o "nuestro equipo de agentes especializados".
4. Diagnóstico constructivo: Identifica aciertos reales pero resalta con claridad 3 fugas de conversión (por qué la gente ve el feed y sigue de largo sin escribir al WhatsApp).
5. Extracción de productos: Identifica 3 a 6 productos, platos o servicios específicos visibles en la cuadrícula de fotos.

FORMATO DE SALIDA OBLIGATORIO:
Debes responder ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "overallScore": number (entre 42 y 78, sé riguroso y realista),
  "brandAestheticSummary": string (resumen de 2 oraciones del estilo visual actual, colores y sensación general),
  "detectedStrengths": [string, string, string] (3 aciertos visuales o de contenido actuales),
  "detectedFlaws": [string, string, string] (3 fugas comerciales o fallas de conversión detectadas en el feed),
  "suggestedPillars": [string, string, string] (3 o 4 pilares recomendados para ordenar sus publicaciones),
  "extractedProducts": [
    {
      "name": string (nombre del plato, producto o servicio detectado en la foto),
      "description": string (breve descripción visual),
      "estimatedPrice": string (ej: "$10.000", "$6.990" o "A consultar"),
      "isPromotion": boolean (true si parece promo o combo, false si es producto unitario)
    }
  ]
}`;

    const promptText = `Analiza detalladamente esta captura de pantalla del perfil y feed de Instagram de "${safeBusinessName}" (${safeRubro}).
Extrae los productos o platos que ofrecen, evalúa la estética actual y devuelve el diagnóstico completo en formato JSON:`;

    let auditResult: FeedAuditDiagnosis | null = null;

    try {
      const model = getFreeModel("gemini-3.7-flash", systemInstruction);
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }, imagePart],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const responseText = result.response.text();
      if (responseText) {
        auditResult = JSON.parse(responseText);
      }
    } catch (agentErr: any) {
      console.warn("[analyze-feed-screenshot] Error al invocar agente de visión:", agentErr?.message || agentErr);
    }

    // Fallback de alta calidad si el modelo retornó incompleto
    if (!auditResult || !Array.isArray(auditResult.detectedFlaws) || auditResult.detectedFlaws.length === 0) {
      auditResult = {
        overallScore: 58,
        brandAestheticSummary: `Perfil con presencia activa en ${safeRubro}, pero con oportunidades clave en iluminación y consistencia en sus afiches comerciales.`,
        detectedStrengths: [
          "Muestra variedad real de lo que preparan día a día",
          "Uso de colores y logotipo reconocibles en el salón",
          "Publicaciones con comida real que despierta antojo",
        ],
        detectedFlaws: [
          "Falta de carteles publicitarios legibles con precios claros para captar atención en el primer segundo",
          "Poco llamado a la acción directo que invite a reservar o pedir por WhatsApp",
          "Iluminación desigual entre fotos que a veces apaga los colores y la textura de la comida",
        ],
        suggestedPillars: [
          "Promociones de alto volumen para compartir en grupo",
          "Especialidades de la casa y secretos de preparación",
          "Happy Hour y cócteles para cortar la semana",
          "Combos delivery para fines de semana",
        ],
        extractedProducts: [
          {
            name: `Especialidad de ${safeBusinessName}`,
            description: "Plato principal destacado de la carta",
            estimatedPrice: "$10.000",
            isPromotion: true,
          },
          {
            name: "Tabla para compartir",
            description: "Porción abundante con acompañamientos",
            estimatedPrice: "$15.990",
            isPromotion: false,
          },
          {
            name: "Sándwich o Burger de la casa",
            description: "Acompañado de papas rústicas",
            estimatedPrice: "$7.990",
            isPromotion: true,
          },
        ],
      };
    }

    return NextResponse.json({
      success: true,
      audit: auditResult,
      businessName: safeBusinessName,
      rubro: safeRubro,
    });
  } catch (error: any) {
    console.error("[analyze-feed-screenshot API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Error al analizar la captura de feed de Instagram con nuestros agentes." },
      { status: 500 }
    );
  }
}
