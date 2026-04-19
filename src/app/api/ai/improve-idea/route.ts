import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { idea, businessType } = await req.json();

    if (!idea) {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_GENAI_API_KEY is not defined in environment variables.");
      return NextResponse.json({ error: "API Key configuration missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: `Eres un experto en marketing digital y estratega de contenido para redes sociales. 
        Tu objetivo es tomar una idea básica de un usuario para un post y mejorarla para que sea más profesional, persuasiva y adaptada a su nicho de negocio.
        
        INSTRUCCIONES:
        1. Considera el "Rubro o Tipo de Negocio" proporcionado.
        2. Mantén la esencia de la idea original pero usa un lenguaje más dinámico y enfocado a la conversión.
        3. No entregues el post final, entrega la "Descripción Mejorada" que se usará para generar el diseño.
        4. Responde ÚNICAMENTE con la descripción mejorada, sin explicaciones ni introducciones.`
    });

    const prompt = `Negocio: ${businessType || "General"}\nIdea Original: ${idea}\n\nDescripción Mejorada:`;
    
    console.log(`[AI] Improving idea for business: ${businessType || "General"} using ${model.model}`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const improvedIdea = response.text().trim();

    console.log("[AI] Idea improved successfully.");
    return NextResponse.json({ improvedIdea });
  } catch (error: any) {
    console.error("[AI ERROR] Failed to improve idea with Gemini:", error);
    
    // Check for specific Gemini errors (e.g., model not found, auth)
    const statusCode = error.status || 500;
    const message = error.message || "Failed to improve idea";
    
    return NextResponse.json({ 
      error: message,
      details: error.response?.data || error.toString(),
      model: "gemini-2.5-flash"
    }, { status: statusCode });
  }
}
