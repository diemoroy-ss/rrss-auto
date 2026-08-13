import { NextRequest, NextResponse } from "next/server";
import { generateFreeText } from "../../../../lib/gemini-free";
import type { PosterConfig } from "../../../../types/poster";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      idea,
      businessType,
      postType,
      posterConfig,
      maxWords = 150
    }: {
      prompt?: string;
      idea?: string;
      businessType?: string;
      postType?: string;
      posterConfig?: PosterConfig | null;
      maxWords?: number;
    } = body;

    // Construir el contexto del cartel publicitario si está habilitado
    let posterContext = "";
    if (posterConfig && posterConfig.enabled) {
      posterContext = `
[Cartel Publicitario Habilitado]
- Estilo Visual: ${posterConfig.visualStyle || "Moderno"}
- Nombre del Negocio: ${posterConfig.includeBusinessName ? (posterConfig.businessName || "") : "No incluido"}
- Precio/Promoción: ${posterConfig.includePrice ? (posterConfig.priceText || "") : "No incluido"}
- Slogan/Llamado Gancho: ${posterConfig.includeSlogan ? (posterConfig.sloganText || "") : "No incluido"}
- Llamado a la Acción (CTA): ${posterConfig.ctaText || "No incluido"}
- Contacto: ${posterConfig.includeContact ? `${posterConfig.contactValue || ""} (${posterConfig.contactType || ""})` : "No incluido"}
- Notas Adicionales: ${posterConfig.additionalNotes || "Ninguna"}
      `.trim();
    }

    const systemInstruction = `Eres un redactor creativo, copywriter profesional de marketing digital y community manager experto. 
Tu tarea es redactar propuestas de copy para redes sociales persuasivas, atractivas y que conecten con el público.
Retorna siempre la respuesta en formato JSON estructurado con el siguiente formato exacto:
{
  "options": [
    "Opción de copy 1 con emojis y hashtags pertinentes",
    "Opción de copy 2 con emojis y hashtags pertinentes",
    "Opción de copy 3 con emojis y hashtags pertinentes"
  ]
}

REGLAS DE HUMANIZER (CRÍTICAS):
- PROHIBIDO usar palabras cliché de IA como: "Adéntrate", "Descubre", "Desata", "En resumen", "En conclusión", "Eleva tu", "Revoluciona", "El maravilloso mundo de".
- Escribe con un tono 100% conversacional, humano y auténtico, como si le hablaras a un cliente cara a cara.
- Usa oraciones variadas (algunas cortas, otras un poco más largas), ritmo dinámico y saltos de línea estratégicos.`;

    const userPrompt = `
Genera 3 opciones profesionales de copy para una publicación en redes sociales, aplicando distintos frameworks de copywriting en cada una.

[Estrategia de Opciones]
- Opción 1: Usa el framework PAS (Problema, Agitación, Solución).
- Opción 2: Usa el framework AIDA (Atención, Interés, Deseo, Acción).
- Opción 3: Usa el framework HSO (Gancho, Historia/Contexto rápido, Oferta/Llamado a la acción).

[Información del Post]
- Rubro/Negocio: ${businessType || "General"}
- Tipo de Publicación: ${postType || "Post"}
- Idea / Concepto: ${idea || ""}
- Texto base del usuario (si escribió algo): "${prompt || ""}"
${posterContext ? `\n[Detalles a integrar sobre el Cartel Publicitario]:\n${posterContext}` : ""}

[Restricciones]
- Tono: Profesional, empático, natural, adaptado a la audiencia de Latinoamérica.
- Longitud máxima de palabras por opción: ${maxWords} palabras.
- Debe incluir emojis pertinentes de forma natural (sin exagerar).
- Debe incluir de 3 a 5 hashtags relevantes al final de cada opción.
- Retorna ÚNICAMENTE el JSON estructurado solicitado. No agregues introducciones ni explicaciones.
    `.trim();

    console.log("[COPYWRITER] Generando sugerencias de copy...");
    const rawResult = await generateFreeText(userPrompt, systemInstruction, true);
    
    // Parsear el resultado JSON
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawResult);
    } catch (parseErr) {
      console.error("[COPYWRITER] Error parseando JSON de Gemini. Raw:", rawResult);
      // Intento de fallback si no vino en JSON limpio
      const match = rawResult.match(/\{[\s\S]*\}/);
      if (match) {
        parsedResult = JSON.parse(match[0]);
      } else {
        throw new Error("No se pudo obtener un JSON válido de la IA.");
      }
    }

    return NextResponse.json({
      options: parsedResult.options || []
    });

  } catch (err: any) {
    console.error("[COPYWRITER API Error]:", err);
    return NextResponse.json({ error: err.message || "Error al generar sugerencias de copy con IA" }, { status: 500 });
  }
}
