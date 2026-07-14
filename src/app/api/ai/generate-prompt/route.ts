import { NextRequest, NextResponse } from "next/server";
import { getFreeModel } from "../../../../lib/gemini-free";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { idea, imageExpectation, businessType, type, carouselCount, regenerate } = body;
 
        if (!idea) {
            return NextResponse.json({ error: "La idea principal es requerida" }, { status: 400 });
        }
 
        let systemInstruction = "";
        let promptContent = "";

        if (type === 'Carrusel') {
            systemInstruction = `Eres un experto Director de Arte. Tu misión es generar una lista estructurada en JSON puro que contenga EXACTAMENTE ${carouselCount || 3} escenas secuenciales coherentes.
Debes retornar un objeto JSON con la siguiente estructura exacta:
{
  "prompts_english": ["Instrucción detallada de imagen 1 en INGLÉS para Midjourney/DALL-E 3 sin textos", "..."],
  "prompts_spanish": ["Explicación sencilla y hermosa en ESPAÑOL de lo que se verá en la imagen 1", "..."]
}
REGLAS IMPORTANTES:
1. Asegura coherencia de Estilo Visual entre todas las imágenes.
2. NO incluyas introducciones ni comillas invertidas markdown, solo el JSON puro.`;

            promptContent = `Idea del Carrusel: ${idea}
Rubro del Negocio: ${businessType || "General"}
Expectativa Visual del Cliente: ${imageExpectation || "Estilo libre, profesional y moderno"}`;

        } else if (type === 'Reel') {
            systemInstruction = `Eres un experto Director de Arte y Guionista de Redes Sociales.
Tu tarea es analizar la idea del post y retornar un objeto JSON con la estructura exacta indicada a continuación:
{
  "prompt_english": "Un prompt detallado en INGLÉS para generar la imagen de portada/escena inicial del Reel en un generador de imágenes de IA. Debe ser visualmente impactante, descriptivo, en formato vertical (9:16) y sin texto.",
  "prompt_spanish": "Una descripción clara y concisa en ESPAÑOL de lo que se verá en la imagen de portada para que el cliente la entienda.",
  "video_prompt": "Un prompt de animación en INGLÉS para un generador de Image-to-Video (como Runway o Luma). Describe el movimiento de la cámara, luces y efectos cinemáticos, partiendo desde la imagen inicial generada.",
  "voiceover_script": "Un guion de locución corto y persuasivo en ESPAÑOL de exactamente 15 a 20 palabras (ideal para un Reel de 8-10 segundos)."
}
REGLAS IMPORTANTES:
1. NO incluyas introducciones ni comillas invertidas markdown, solo el JSON puro.`;

            promptContent = `Idea del Reel: ${idea}
Rubro del Negocio: ${businessType || "General"}
Expectativa Visual del Cliente: ${imageExpectation || "Estilo libre, profesional y moderno"}`;

        } else {
            // Post / Historia (Single Image)
            systemInstruction = `Eres un experto Director de Arte y Diseñador Gráfico.
Tu tarea es generar un prompt de imagen y su explicación en base a la idea de post y las expectativas del cliente.
Debes retornar un objeto JSON con la estructura exacta indicada a continuación:
{
  "prompt_english": "Un prompt altamente detallado y descriptivo en INGLÉS enfocado en colores, composición, estilo de fotografía e iluminación, ideal para DALL-E 3. Debe ser sin texto en la imagen.",
  "prompt_spanish": "Una explicación sencilla, clara y atractiva en ESPAÑOL de lo que representará la imagen para que el cliente la entienda."
}
REGLAS IMPORTANTES:
1. NO incluyas introducciones ni comillas invertidas markdown, solo el JSON puro.`;

            promptContent = `Idea del Post: ${idea}
Rubro del Negocio: ${businessType || "General"}
Expectativa Visual del Cliente: ${imageExpectation || "Estilo libre, profesional y moderno"}`;
        }

        console.log(`[GENERATE-PROMPT] Generating prompts for type: ${type} (regenerate: ${!!regenerate})`);
        
        if (regenerate) {
            systemInstruction += `\n\n¡IMPORTANTE!: Este es un reintento del usuario porque no le gustó la propuesta anterior. Por favor, genera un concepto/metáfora visual COMPLETAMENTE DIFERENTE al estándar, proponiendo un enfoque visual muy creativo, variando los elementos principales y la paleta de colores de forma innovadora.`;
        }

        const model = getFreeModel(undefined, systemInstruction);
        const result = await model.generateContent(promptContent);
        const response = result.response;
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";

        // Clean JSON formatting from Gemini response
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error("No se pudo generar una respuesta JSON válida desde el modelo de IA.");
        }

        const parsedResult = JSON.parse(jsonMatch[0]);

        return NextResponse.json({
            success: true,
            data: parsedResult
        });

    } catch (error: any) {
        console.error("Error in generate-prompt API:", error);
        return NextResponse.json({ error: "Fallo al generar el prompt de la IA. Por favor reintenta.", details: error.message }, { status: 500 });
    }
}
