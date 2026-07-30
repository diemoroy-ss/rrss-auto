import { NextRequest, NextResponse } from "next/server";
import { getFreeModel } from "../../../../lib/gemini-free";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { rawPrompt, isCommercialPoster } = body;
 
        if (!rawPrompt) {
            return NextResponse.json({ error: "El prompt original es requerido" }, { status: 400 });
        }
 
        let systemInstruction = `Eres un experto Ingeniero de Prompts. Tu tarea es analizar un prompt de imágenes en inglés y convertir sus elementos clave en variables utilizando la sintaxis [NOMBRE_GENERICO:ejemplo].
REGLAS ESTRICTAS:
1. Reemplaza los sujetos principales, fondos, estilos u objetos clave por variables. El nombre de la variable antes de los dos puntos (:) debe ser GENÉRICO, en ESPAÑOL y en MAYÚSCULAS (ej. PRODUCTO_PRINCIPAL, ACOMPAÑAMIENTO, COLOR_FONDO).
2. Después de los dos puntos (:), incluye la traducción corta del elemento original como sugerencia de ejemplo (ej. si el original era 'french fries', escribe [ACOMPAÑAMIENTO_1:papas fritas]. Si era 'cheeseburger', escribe [PRODUCTO_PRINCIPAL:hamburguesa con queso]).\n`;

        if (isCommercialPoster) {
            systemInstruction += `3. CRÍTICO: Este prompt es para un Cartel Comercial donde el texto tipográfico se agregará más tarde en post-producción. ELIMINA por completo y permanentemente cualquier instrucción original que pida agregar textos impresos, tipografía, letreros, frases, ofertas o "quotes" dentro de la imagen. La imagen debe generarse SIN NINGÚN TEXTO.\n`;
        } else {
            systemInstruction += `3. Si el prompt incluye texto que deba renderizarse impreso en la imagen (typography, text on image, "quotes"), tradúcelo automáticamente al español (o conviértelo en una variable [TEXTO_PROMOCIONAL:Oferta Especial]).\n`;
        }

        systemInstruction += `4. Mantén estrictamente TODO el resto de la instrucción técnica (cámara, iluminación, composición) en INGLÉS para que Midjourney/DALL-E lo entienda perfectamente.
5. No añadas introducciones, explicaciones, markdown, ni "Aquí tienes tu prompt". DEBES retornar ÚNICAMENTE el texto final del prompt.`;

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
