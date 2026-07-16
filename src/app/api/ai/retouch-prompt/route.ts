import { NextRequest, NextResponse } from "next/server";
import { getFreeModel } from "../../../../lib/gemini-free";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt, instruction } = body;
 
        if (!prompt || !instruction) {
            return NextResponse.json({ error: "El prompt original y la instrucción son requeridos" }, { status: 400 });
        }
 
        const systemInstruction = `Eres un experto Director de Arte y Traductor Técnico. 
Tu tarea es tomar un prompt de generación de imagen existente en INGLÉS y una instrucción de retoque del usuario en ESPAÑOL.
Debes aplicar la instrucción al prompt original y retornar un nuevo prompt altamente detallado y descriptivo en INGLÉS, manteniendo la esencia del diseño pero aplicando el cambio solicitado.
Debes retornar un objeto JSON con la estructura exacta indicada a continuación:
{
  "prompt_english": "El nuevo prompt modificado en INGLÉS..."
}
REGLAS IMPORTANTES:
1. NO incluyas introducciones ni comillas invertidas markdown, solo el JSON puro.
2. Si el usuario pide remover texto, asegúrate de añadir instrucciones fuertes como "no text, textless, clear background" al prompt en inglés.
3. Si el usuario pide cambiar un color o elemento, reemplaza el existente en el prompt original.`;

        const promptContent = `Prompt Original (Inglés): "${prompt}"\nInstrucción de Retoque (Español): "${instruction}"`;

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
        console.error("Error in retouch-prompt API:", error);
        return NextResponse.json({ error: "Fallo al retocar el prompt.", details: error.message }, { status: 500 });
    }
}
