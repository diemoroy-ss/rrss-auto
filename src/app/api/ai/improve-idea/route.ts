import { NextRequest, NextResponse } from 'next/server';
import { getVertexModel } from "../../../../lib/vertexai";

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

    const model = getVertexModel("gemini-2.5-flash", systemInstruction);

    const prompt = `Negocio: ${businessType || "General"}\nIdea Original: ${idea}\n\nDescripción Mejorada:`;
    
    console.log(`[AI] Improving idea for business: ${businessType || "General"} using Vertex AI ${model.model}`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const improvedIdea = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No se pudo mejorar la idea.";

    console.log("[AI] Idea improved successfully.");
    return NextResponse.json({ improvedIdea });
  } catch (error: any) {
    console.error("[AI ERROR] Failed to improve idea with Vertex AI:", error);
    
    const statusCode = error.status || 500;
    const message = error.message || "Failed to improve idea";
    
    return NextResponse.json({ 
      error: message,
      details: error.toString(),
      engine: "vertex-ai"
    }, { status: statusCode });
  }
}
