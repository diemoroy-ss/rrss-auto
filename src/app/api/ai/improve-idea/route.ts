import { NextRequest, NextResponse } from 'next/server';
import { generateFreeText } from "../../../../lib/gemini-free";

export async function POST(req: NextRequest) {
  try {
    const { idea, businessType } = await req.json();

    if (!idea) {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }

    const systemInstruction = `Eres un experto en marketing digital y estratega de contenido para redes sociales. 
        Tu objetivo es tomar una idea básica de un usuario para un post y mejorarla para que sea más profesional, persuasiva y adaptada a su nicho de negocio.
        
        INSTRUCCIONES:
        1. Considera el "Rubro o Tipo de Negocio" proporcionado.
        2. Mantén la esencia de la idea original pero usa un lenguaje más dinámico y enfocado a la conversión.
        3. No entregues el post final, entrega la "Descripción Mejorada" que se usará para generar el diseño.
        4. Responde ÚNICAMENTE con la descripción mejorada, sin explicaciones ni introducciones.`;

    const prompt = `Negocio: ${businessType || "General"}\nIdea Original: ${idea}\n\nDescripción Mejorada:`;
    
    console.log(`[GEMINI-FREE] Improving idea for business: ${businessType || "General"} using gemini-2.5-flash`);
    
    const improvedIdea = (await generateFreeText(prompt, systemInstruction)) || "No se pudo mejorar la idea.";

    console.log("[GEMINI-FREE] Idea improved successfully.");
    return NextResponse.json({ improvedIdea });
  } catch (error: any) {
    console.error("[GEMINI-FREE ERROR] Failed to improve idea:", error);
    
    const statusCode = error.status || 500;
    const message = error.message || "Failed to improve idea";
    
    return NextResponse.json({ 
      error: message,
      details: error.toString(),
      engine: "gemini-free"
    }, { status: statusCode });
  }
}
