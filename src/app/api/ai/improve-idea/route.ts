import { NextRequest, NextResponse } from 'next/server';
import { generateFreeText } from "../../../../lib/gemini-free";

export async function POST(req: NextRequest) {
  try {
    const { idea, businessType, imageUrl } = await req.json();

    if (!idea) {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }

    const systemInstruction = `Eres un experto en marketing digital y estratega de contenido para redes sociales. 
        Tu objetivo es tomar una idea básica de un usuario para un post y mejorarla para que sea más profesional, persuasiva y adaptada a su nicho de negocio.
        
        ${imageUrl ? 'IMPORTANTE: Se te ha proporcionado una imagen que el usuario quiere usar. Analiza visualmente la imagen para que el caption sea coherente con lo que se muestra (colores, productos, ambiente).' : ''}

        INSTRUCCIONES:
        1. Considera el "Rubro o Tipo de Negocio" proporcionado.
        2. Mantén la esencia de la idea original pero usa un lenguaje más dinámico y enfocado a la conversión.
        3. Si hay una imagen presente, asegúrate de que el texto potencie lo que se ve en ella.
        4. No entregues el post final, entrega la "Descripción Mejorada" que se usará para generar el diseño.
        5. Responde ÚNICAMENTE con la descripción mejorada, sin explicaciones ni introducciones.`;

    const prompt = `Negocio: ${businessType || "General"}\nIdea Original: ${idea}\n\nDescripción Mejorada:`;
    
    console.log(`[GEMINI-FREE] Improving idea for business: ${businessType || "General"} ${imageUrl ? '(WITH IMAGE CONTEXT)' : ''}`);
    
    const improvedIdea = (await generateFreeText(prompt, systemInstruction, false, imageUrl)) || "No se pudo mejorar la idea.";

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
