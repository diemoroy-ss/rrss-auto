import { NextRequest, NextResponse } from "next/server";
import { getFreeModel } from "../../../../lib/gemini-free";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt } = body;
 
        if (!prompt) {
            return NextResponse.json({ error: "El prompt en español es requerido" }, { status: 400 });
        }
 
        const systemInstruction = `Eres un experto Director de Arte y Traductor Técnico. 
Tu tarea es tomar la idea descriptiva del usuario en ESPAÑOL y traducirla a un prompt altamente detallado y descriptivo en INGLÉS enfocado en colores, composición, estilo de fotografía e iluminación, ideal para un motor de generación de imágenes como Midjourney o DALL-E 3.
Debes retornar un objeto JSON con la estructura exacta indicada a continuación:
{
  "prompt_english": "Un prompt altamente detallado y descriptivo en INGLÉS..."
}
REGLAS IMPORTANTES:
1. NO incluyas introducciones ni comillas invertidas markdown, solo el JSON puro.
2. Asegúrate de que el prompt instruya que NO haya texto superpuesto en la imagen.`;

        const promptContent = `Idea a traducir: "${prompt}"`;

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
            prompt_english: parsedResult.prompt_english
        });

    } catch (error: any) {
        console.error("Error in translate-prompt API:", error);
        return NextResponse.json({ error: "Fallo al traducir el prompt.", details: error.message }, { status: 500 });
    }
}
