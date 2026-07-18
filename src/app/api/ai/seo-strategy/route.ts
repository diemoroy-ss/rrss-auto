import { NextRequest, NextResponse } from 'next/server';
import { generateFreeText } from "../../../../lib/gemini-free";
import { adminDb } from '../../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { userId, businessType, tone, audience, keywords, limit } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });
    }

    const requestedCount = limit >= 999999 ? 12 : Math.min(Math.max(limit || 4, 1), 12);

    const systemInstruction = `Eres un Experto SEO y Estratega de Contenidos. 
Tu tarea es generar un Clúster Temático mensual (estrategia de contenidos para un blog) de exactamente ${requestedCount} artículos altamente optimizados para SEO en Google.
Considera el tono de voz, el público objetivo y las palabras clave si se proporcionan.
Debes devolver tu respuesta EXCLUSIVAMENTE en formato JSON, sin texto adicional ni formateo markdown fuera del JSON válido.
El formato del JSON debe ser estrictamente un arreglo de objetos:
[
  {
    "title": "Título llamativo del artículo (H1)",
    "metaDescription": "Una meta descripción persuasiva de máximo 155 caracteres",
    "keyword": "Palabra clave principal tipo Long-Tail",
    "suggestedDateOffset": 7 // Días a partir de hoy propuestos para publicar
  }
]`;

    const prompt = `Rubro del Negocio: ${businessType || "No especificado"}
Tono de voz: ${tone || "Profesional y cercano"}
Público Objetivo: ${audience || "Público general"}
Palabras clave semilla: ${keywords || "Ninguna específica"}

Genera el arreglo JSON de ${requestedCount} artículos.`;
    
    console.log(`[SEO-AUTOPILOT] Generating strategy for: ${businessType || "General"}`);
    
    const responseText = await generateFreeText(prompt, systemInstruction, false);
    
    if (!responseText) {
        throw new Error("No response from Gemini");
    }

    // Limpiar respuesta por si incluye markdown
    const cleanedText = responseText.replace(/```json\n/g, '').replace(/```/g, '').trim();
    let strategy;
    try {
        strategy = JSON.parse(cleanedText);
    } catch (parseError) {
        console.error("JSON parse error:", cleanedText);
        throw new Error("Gemini returned invalid JSON");
    }

    // Guardar los artículos propuestos en Firestore como 'pending' (estrategia)
    const batch = adminDb.batch();
    const today = new Date();
    
    const savedItems = [];
    for (const item of strategy) {
        const scheduledDate = new Date(today);
        scheduledDate.setDate(today.getDate() + (item.suggestedDateOffset || 7));
        
        const docRef = adminDb.collection('blog_posts').doc();
        const postData = {
            userId,
            title: item.title,
            metaDescription: item.metaDescription,
            targetKeyword: item.keyword,
            status: 'strategy', // Es una idea del calendario, no un borrador redactado aún
            scheduledFor: scheduledDate,
            createdAt: new Date(),
            content: ""
        };
        batch.set(docRef, postData);
        savedItems.push({ id: docRef.id, ...postData });
    }

    await batch.commit();

    console.log("[SEO-AUTOPILOT] Strategy generated and saved successfully.");
    return NextResponse.json({ success: true, strategy: savedItems });
  } catch (error: any) {
    console.error("[SEO-AUTOPILOT ERROR] Failed to generate strategy:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
