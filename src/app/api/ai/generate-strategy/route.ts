import { NextRequest, NextResponse } from "next/server";
import { generateFreeText } from "../../../../lib/gemini-free";

export async function POST(req: NextRequest) {
    try {
        const { businessType, targetAudience, objective, channel } = await req.json();

        if (!businessType || !objective) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const systemInstruction = `Eres un experto Director de Marketing Digital. 
        Tu misión es crear una estrategia de contenido mensual resumida en 4 pilares clave.
        
        INSTRUCCIONES:
        1. Devuelve la respuesta en formato JSON puro.
        2. El JSON debe tener un campo "pilares" que sea un array de 4 objetos.
        3. Cada objeto debe tener: "titulo", "descripcion" y "ejemplo_idea".
        4. No incluyas explicaciones fuera del JSON.`;

        const prompt = `Rubro: ${businessType}\nAudiencia: ${targetAudience || "General"}\nObjetivo: ${objective}\nCanal: ${channel || "Instagram"}`;

        console.log(`[GEMINI-FREE] Generating strategy for ${businessType} using gemini-2.5-flash`);
        const strategyJson = await generateFreeText(prompt, systemInstruction, true);

        return NextResponse.json(JSON.parse(strategyJson || "{}"));

    } catch (error: any) {
        console.error("[STRATEGY AI ERROR]:", error);
        return NextResponse.json({ error: error.message || "Failed to generate strategy" }, { status: 500 });
    }
}
