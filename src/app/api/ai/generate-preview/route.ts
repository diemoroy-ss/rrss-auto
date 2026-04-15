import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getVideoPlanLimit } from "../../../../lib/quota";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, businessType } = body;
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_PREVIEW_URL;

    if (!n8nUrl) {
      return NextResponse.json({ error: "N8N Preview URL not configured" }, { status: 500 });
    }

    const { type, carouselCount, userPlan } = body;

    if (type === 'Reel' && getVideoPlanLimit(userPlan || 'free') === 0) {
        return NextResponse.json({ error: "Plan actual no permite la generación de videos/reels." }, { status: 403 });
    }

    let prompts = [idea];
    
    if (type === 'Carrusel') {
        try {
            const apiKey = process.env.GOOGLE_GENAI_API_KEY;
            if (apiKey) {
                console.log("[PROXY] Generating carousel prompts for preview...");
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash",
                    systemInstruction: `Eres un experto Director de Arte. Tu misión es generar una lista estructurada en JSON puro que contenga EXACTAMENTE ${carouselCount || 3} instrucciones descriptivas detalladas para un generador de imágenes de Inteligencia Artificial (Midjourney/DALL-E) en INGLÉS. Las imágenes conformarán un carrusel coherente secuencial.\n\nINSTRUCCIONES CLAVE:\n1. NO escribas otra cosa más que un Array JSON ("["..." , "..."]").\n2. Escribe cada prompt en INGLÉS técnico y descriptivo enfocado en colores, iluminación y composición.\n3. Asegura coherencia de Estilo Visual entre las imágenes.\n4. NADA de comillas inversas markdown, solo el arreglo puro.`
                });
                const result = await model.generateContent(`Genera las ${carouselCount || 3} descripciones visuales para esta idea de post: ${idea}`);
                const rawText = await result.response.text();
                
                const match = rawText.match(/\[[\s\S]*\]/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        prompts = parsed;
                    }
                }
            }
        } catch (e) {
            console.error("[PROXY] Error generating carousel prompts via Gemini, falling back to same text", e);
            const count = carouselCount || 3;
            prompts = Array.from({length: count}).map((_, i) => `${idea}. Variation part ${i+1} of a sequence.`);
        }
    } else if (type === 'Reel') {
        try {
            const apiKey = process.env.GOOGLE_GENAI_API_KEY;
            if (apiKey) {
                console.log("[PROXY] Generating reel prompt for preview...");
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash",
                    systemInstruction: `Eres un experto Director de Fotografía. Tu misión es generar un ÚNICO prompt descriptivo en INGLÉS para un generador de Video por Inteligencia Artificial (RunwayML/Luma/Sora) que creará un Reel de 8 segundos.\n\nINSTRUCCIONES CLAVE:\n1. NO escribas introducciones ni comillas. Escribe SOLO el prompt técnico en inglés.\n2. Especifica movimientos de cámara dinámicos pertinentes a RRSS (ej: slow pan, dynamic zoom, cinematic dolly track).\n3. Asegura que la escena sea visualmente impactante, orientada a formato vertical (9:16).\n4. El texto debe ser fluido y muy enfocado en la iluminación, textura y estilo cinemático.`
                });
                const result = await model.generateContent(`Genera el prompt de video para esta idea: ${idea}`);
                const rawText = await result.response.text();
                prompts = [rawText.trim().replace(/^"|"$/g, '')];
            }
        } catch (e) {
            console.error("[PROXY] Error generating reel prompt via Gemini", e);
        }
    }

    const payloadToN8N = {
        ...body,
        prompts,
        prompt_video: type === 'Reel' && prompts.length > 0 ? prompts[0] : undefined
    };

    console.log(`[PROXY] Calling n8n: ${n8nUrl}`);
    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadToN8N),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[PROXY] n8n error: ${errText}`);
      return NextResponse.json({ error: `N8n error: ${errText}`, status: response.status }, { status: 500 });
    }

    const rawText = await response.text();
    let rawData;
    try {
        rawData = JSON.parse(rawText);
        console.log(`[PROXY] n8n response data: ${JSON.stringify(rawData)}`);
    } catch (parseError) {
        console.error(`[PROXY] n8n returned non-JSON: ${rawText}`);
        return NextResponse.json({ error: `El Webhook de n8n no devolvió un JSON válido. Revisa que el nodo 'Respond to Webhook' envíe un objeto JSON. Respuesta recibida: ${rawText.substring(0, 100)}` }, { status: 502 });
    }

    // n8n often returns an array [ { ... } ], we want just the object
    const data = Array.isArray(rawData) ? rawData[0] : rawData;

    // Try to find ANY image URL key
    const imageUrl = data?.imageUrl || data?.image_url || data?.url || data?.finalUrl || data?.final_url;
    
    // Normalize response for frontend
    let suggestedCopy = data?.suggestedCopy || data?.copy || data?.text || "";

    // ALWAYS generate a better copy using Gemini
    try {
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (apiKey && idea) {
            console.log("[PROXY] Generating optimized copy with Gemini...");
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                systemInstruction: `Eres un experto copywriter para redes sociales. 
Tu objetivo es tomar una idea básica y transformarla en un post altamente atractivo, persuasivo y listo para publicar.

Reglas:
1. NUNCA repitas la idea original tal cual. Mejórala significativamente.
2. Usa un tono adecuado para el rubro especificado.
3. Incluye emojis relevantes (sin exagerar).
4. Termina con 3-5 hashtags estratégicos.
5. NO incluyas introducciones ni explicaciones, solo el texto del post.` 
            });

            const prompt = `Rubro del negocio: ${businessType || 'General'}\nIdea base del post: ${idea}\n\nEscribe el copy optimizado:`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const enhancedCopy = response.text().trim();
            
            if (enhancedCopy) {
                suggestedCopy = enhancedCopy;
            }
        }
    } catch (aiError) {
        console.error("[PROXY] Error generating copy with Gemini, falling back to n8n copy:", aiError);
    }

    const normalizedData = {
      ...data,
      imageUrl: imageUrl, // Ensure we have a standard key for the frontend
      suggestedCopy: suggestedCopy
    };

    if (!imageUrl) {
      console.warn("[PROXY] No valid image URL found in n8n response:", JSON.stringify(data));
    }

    return NextResponse.json(normalizedData);
  } catch (err: any) {
    console.error("[PROXY] Error generating preview:", err.message);
    return NextResponse.json({ error: err.message || "Error proxying to n8n" }, { status: 500 });
  }
}
