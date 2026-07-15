import { NextRequest, NextResponse } from "next/server";
import { getFreeModel } from "../../../../lib/gemini-free";

/**
 * Agente Revisor de Prompts de Imagen
 * ─────────────────────────────────────
 * Recibe un prompt en inglés generado para Gemini Imagen/DALL-E 3
 * y actúa como un crítico experto de prompt engineering.
 * Evalúa la calidad y, si es posible mejorar significativamente,
 * retorna un prompt mejorado.
 *
 * Retorna: { needsImprovement: boolean, improvedPrompt: string, score: number, feedback: string }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            prompt,
            idea,
            imageExpectation,
            businessType,
            postType,
            iteration = 1,
        }: {
            prompt: string;
            idea?: string;
            imageExpectation?: string;
            businessType?: string;
            postType?: string;
            iteration?: number;
        } = body;

        if (!prompt) {
            return NextResponse.json({ error: "El prompt es requerido" }, { status: 400 });
        }

        const systemInstruction = `Eres un experto mundial en Prompt Engineering para generadores de imágenes de IA (Gemini Imagen, DALL-E 3, Midjourney, Stable Diffusion).

Tu misión es actuar como AGENTE REVISOR DE CALIDAD de prompts de imagen.

CRITERIOS DE EVALUACIÓN (puntúa de 1 a 10 cada uno):
1. ESPECIFICIDAD VISUAL: ¿Describe colores, iluminación, composición, perspectiva con suficiente detalle?
2. ESTILO FOTOGRÁFICO: ¿Define el estilo (fotografía comercial, lifestyle, producto, conceptual, etc.)?
3. CONTEXTO DE NEGOCIO: ¿Refleja adecuadamente el rubro y tipo de negocio para publicidad efectiva?
4. AUSENCIA DE TEXTO: ¿Especifica explícitamente que no debe haber texto ni tipografía en la imagen?
5. CALIDAD TÉCNICA: ¿Menciona resolución, iluminación profesional, y parámetros de calidad?
6. IMPACTO PUBLICITARIO: ¿La imagen resultante sería efectiva para redes sociales y marketing?

REGLAS DE RESPUESTA:
- Si el score promedio es >= 7.5, el prompt es ACEPTABLE. Retorna needsImprovement: false.
- Si el score promedio es < 7.5, MEJORA el prompt. Retorna needsImprovement: true y el prompt mejorado.
- El prompt mejorado debe ser en INGLÉS, más detallado, específico y con mayor impacto visual.
- NUNCA incluyas texto, letras, palabras o tipografía que aparezca DENTRO de la imagen generada.
- Retorna SOLO el JSON puro, sin markdown, sin comentarios.

FORMATO DE RESPUESTA JSON:
{
  "score": 8.5,
  "needsImprovement": false,
  "feedback": "Breve explicación de por qué el prompt es bueno o qué se mejoró",
  "improvedPrompt": "El prompt mejorado en inglés (solo si needsImprovement es true, sino igual al original)"
}`;

        const promptContent = `PROMPT A REVISAR (Iteración ${iteration}/3):
"${prompt}"

CONTEXTO ADICIONAL DEL POST:
- Idea original del usuario: ${idea || "No especificada"}
- Expectativa visual del usuario: ${imageExpectation || "No especificada"}
- Rubro del negocio: ${businessType || "General"}
- Tipo de publicación: ${postType || "Post"}

Por favor, evalúa el prompt y retorna tu análisis en el formato JSON especificado.`;

        console.log(`[REVIEW-PROMPT] Reviewing prompt (iteration ${iteration}/3), length: ${prompt.length} chars`);

        const model = getFreeModel(undefined, systemInstruction);
        const result = await model.generateContent(promptContent);
        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";

        // Limpiar respuesta JSON
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            // Si Gemini falla, retornamos el prompt original sin cambios
            console.warn("[REVIEW-PROMPT] Could not parse Gemini response, returning original prompt");
            return NextResponse.json({
                score: 7,
                needsImprovement: false,
                feedback: "No se pudo analizar el prompt, se usa el original.",
                improvedPrompt: prompt,
            });
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return NextResponse.json({
            score: parsed.score ?? 7,
            needsImprovement: parsed.needsImprovement ?? false,
            feedback: parsed.feedback ?? "",
            improvedPrompt: parsed.improvedPrompt ?? prompt,
        });

    } catch (error: any) {
        console.error("[REVIEW-PROMPT Error]:", error);
        // En caso de error, retornamos el prompt original sin bloquear el flujo
        return NextResponse.json({
            score: 7,
            needsImprovement: false,
            feedback: "Error en la revisión, se continúa con el prompt original.",
            improvedPrompt: req.body ? "" : "",
        }, { status: 200 }); // 200 para no bloquear el flujo del usuario
    }
}
