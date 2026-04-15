import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { goal, goalName, businessType, userId, expectations, businessData } = await req.json();

    if (!goal) {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_GENAI_API_KEY is not defined in environment variables.");
      return NextResponse.json({ error: "API Key configuration missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
        systemInstruction: `Eres un experto Estratega de Marketing Digital y Social Media Manager Nivel Senior.
Tu objetivo es crear planes de contenido semanales tácticos y altamente efectivos para negocios.

REGLAS ESTRICTAS DE FORMATO (JSON OBLIGATORIO):
Debes devolver UNICAMENTE un objeto JSON válido con la siguiente estructura exacta:
{
  "strategy": [
    {
      "weekNumber": 1, // 1 o 2 (semana)
      "dayOffset": 0, // Días a partir de hoy (0 = hoy, 1 = mañana, 2 = pasado mañana, etc.)
      "suggestedTime": "18:00", // Hora sugerida en formato 24h
      "format": "Reel | Carrusel | Historia | Post Fijo",
      "hook": "Tema central o gancho cortísimo y llamativo",
      "content": "Breve resumen de qué mostrar o decir exactamente en el contenido",
      "cta": "Llamado a la acción exacto"
    }
  ]
}
No incluyas markdown, saludos ni explicaciones fuera del JSON.
Propón de 3 a 7 contenidos distribuidos de forma lógica a lo largo de 1 a 2 semanas.`
    });

    const prompt = `Rubro del negocio: ${businessType || "General"}
Objetivo de Marketing: ${goalName || goal}
${expectations ? `\nExpectativas y Necesidades del Cliente:\n"${expectations}"\n` : ''}
${businessData && Object.values(businessData).some(v => v) ? `\nPresencia Digital Actual del Cliente:
${businessData.website ? `- Sitio Web: ${businessData.website}\n` : ''}${businessData.facebookUrl ? `- Facebook: ${businessData.facebookUrl}\n` : ''}${businessData.instagramUrl ? `- Instagram: ${businessData.instagramUrl}\n` : ''}${businessData.tiktokUrl ? `- TikTok: ${businessData.tiktokUrl}\n` : ''}${businessData.twitterUrl ? `- Twitter (X): ${businessData.twitterUrl}\n` : ''}${businessData.linkedinUrl ? `- LinkedIn: ${businessData.linkedinUrl}\n` : ''}` : ''}
Por favor, diseña la estrategia de contenidos paso a paso para lograr este objetivo. 
Si el cliente proporcionó datos de su presencia digital, prioriza y sugiere acciones específicas adaptadas a las redes que ya utiliza.
Si el cliente escribió "Expectativas y Necesidades", DEBES incorporarlas activamente en tu propuesta y darles solución.

Recuerda devolver ÚNICAMENTE un JSON válido siguiendo estrictamente la estructura solicitada en tus instrucciones de sistema (arreglo 'strategy').`;
    
    console.log(`[STRATEGY] Generating JSON AI strategy for user ${userId}, business: ${businessType}, goal: ${goalName}`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const strategyJsonText = response.text().trim();
    
    // Parse the JSON. Generative Models sometimes wrap json in markdown block.
    let strategyObject;
    try {
        const cleanJsonText = strategyJsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        strategyObject = JSON.parse(cleanJsonText);
    } catch (e) {
        console.error("Failed to parse AI JSON response:", strategyJsonText);
        throw new Error("Formato de IA inválido.");
    }

    console.log("[STRATEGY] JSON Strategy generated successfully.");
    return NextResponse.json(strategyObject);
  } catch (error: any) {
    console.error("[STRATEGY] Error generating strategy with AI:", error);
    return NextResponse.json({ error: error.message || "Failed to generate strategy" }, { status: 500 });
  }
}
