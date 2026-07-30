import { NextRequest, NextResponse } from "next/server";
import { getFreeModel } from "../../../../lib/gemini-free";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { rawPrompt } = body;
 
        if (!rawPrompt) {
            return NextResponse.json({ error: "El prompt original es requerido" }, { status: 400 });
        }
 
        const systemInstruction = `Eres un experto Ingeniero de Prompts. Tu tarea es analizar un prompt de imágenes en inglés y convertir sus elementos clave en variables con el formato [NOMBRE_EN_ESPANOL].
REGLAS ESTRICTAS:
1. Reemplaza los sujetos principales, fondos, estilos u objetos clave por variables entre corchetes, escritas en ESPAÑOL y en MAYÚSCULAS (ej. [PRODUCTO], [ACOMPAÑAMIENTO], [ESTILO]).
2. Si el prompt incluye texto que deba renderizarse impreso en la imagen (typography, text on image, "quotes"), tradúcelo automáticamente al español (o conviértelo en una variable [TEXTO]).
3. Mantén estrictamente TODO el resto de la instrucción técnica (cámara, iluminación, composición) en INGLÉS para que Midjourney/DALL-E lo entienda perfectamente.
4. No añadas introducciones, explicaciones, markdown, ni "Aquí tienes tu prompt". DEBES retornar ÚNICAMENTE el texto final del prompt.`;

        const model = getFreeModel(undefined, systemInstruction);
        const result = await model.generateContent(rawPrompt);
        const response = result.response;
        const formattedPrompt = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

        return NextResponse.json({
            success: true,
            formattedPrompt
        });

    } catch (error: any) {
        console.error("Error in format-prompt API:", error);
        return NextResponse.json({ error: "Fallo al formatear el prompt. Por favor reintenta.", details: error.message }, { status: 500 });
    }
}
