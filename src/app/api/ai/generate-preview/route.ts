import { NextRequest, NextResponse } from "next/server";
import { getVertexModel } from "../../../../lib/vertexai";
import { getVideoPlanLimit } from "../../../../lib/quota";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { idea, businessType, type, carouselCount, userPlan, email, phone } = body;
        const n8nUrl = process.env.NEXT_PUBLIC_N8N_PREVIEW_URL;

        if (!n8nUrl) {
            return NextResponse.json({ error: "N8N Preview URL not configured" }, { status: 500 });
        }

        if (type === 'Reel' && getVideoPlanLimit(userPlan || 'free') === 0) {
            return NextResponse.json({ error: "Plan actual no permite la generación de videos/reels." }, { status: 403 });
        }

        // 1. Generate visual prompts based on the idea using Vertex AI
        let prompts: string[] = [idea];
        
        try {
            if (type === 'Carrusel') {
                console.log("[VERTEX-AI] Generating carousel prompts for preview...");
                const systemInstruction = `Eres un experto Director de Arte. Tu misión es generar una lista estructurada en JSON puro que contenga EXACTAMENTE ${carouselCount || 3} instrucciones descriptivas detalladas para un generador de imágenes de Inteligencia Artificial (Midjourney/DALL-E) en INGLÉS. Las imágenes conformarán un carrusel coherente secuencial.

INSTRUCCIONES CLAVE:
1. NO escribas otra cosa más que un Array JSON ("["..." , "..."]").
2. Escribe cada prompt en INGLÉS técnico y descriptivo enfocado en colores, iluminación y composición.
3. Asegura coherencia de Estilo Visual entre las imágenes.
4. NADA de comillas inversas markdown, solo el arreglo puro.`;

                const model = getVertexModel("gemini-2.5-flash", systemInstruction);
                const result = await model.generateContent(`Genera las ${carouselCount || 3} descripciones visuales para esta idea de post: ${idea}`);
                const response = await result.response;
                const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
                
                const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
                const match = cleanedText.match(/\[[\s\S]*\]/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        prompts = parsed;
                    }
                }
            } else if (type === 'Reel') {
                console.log("[VERTEX-AI] Generating reel prompt for preview...");
                const systemInstruction = `Eres un experto Director de Fotografía. Tu misión es generar un ÚNICO prompt descriptivo en INGLÉS para un generador de Video por Inteligencia Artificial (RunwayML/Luma/Sora) que creará un Reel de 8 segundos.

INSTRUCCIONES CLAVE:
1. NO escribas introducciones ni comillas. Escribe SOLO el prompt técnico en inglés.
2. Especifica movimientos de cámara dinámicos pertinentes a RRSS (ej: slow pan, dynamic zoom, cinematic dolly track).
3. Asegura que la escena sea visualmente impactante, orientada a formato vertical (9:16).
4. El texto debe ser fluido y muy enfocado en la iluminación, textura y estilo cinemático.`;

                const model = getVertexModel("gemini-2.5-flash", systemInstruction);
                const result = await model.generateContent(`Genera el prompt de video para esta idea: ${idea}`);
                const response = await result.response;
                const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                if (text) {
                    prompts = [text];
                }
            }
        } catch (visError) {
            console.error("[VERTEX-AI] Error generating visual prompts, falling back to original idea:", visError);
        }

        // 2. Call n8n to generate the media
        const payloadToN8N = {
            ...body,
            prompts,
            prompt_video: type === 'Reel' && prompts.length > 0 ? prompts[0] : undefined
        };

        console.log(`[PROXY] Calling n8n: ${n8nUrl}`);
        const n8nResponse = await fetch(n8nUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadToN8N),
        });

        if (!n8nResponse.ok) {
            const errText = await n8nResponse.text();
            console.error(`[PROXY] n8n error: ${errText}`);
            return NextResponse.json({ error: `N8n error: ${errText}`, status: n8nResponse.status }, { status: 500 });
        }

        const rawText = await n8nResponse.text();
        let data;
        try {
            const rawData = JSON.parse(rawText);
            data = Array.isArray(rawData) ? rawData[0] : rawData;
        } catch (parseError) {
            console.error(`[PROXY] n8n returned non-JSON: ${rawText}`);
            return NextResponse.json({ error: "N8n response parse error" }, { status: 502 });
        }

        // Normalize response
        const imageUrl = data?.imageUrl || data?.image_url || data?.url || data?.finalUrl || data?.final_url;
        let suggestedCopy = data?.suggestedCopy || data?.copy || data?.text || "";

        // 3. Generate high-quality copy using Vertex AI
        try {
            console.log("[VERTEX-AI] Generating optimized copy...");
            const systemInstruction = `Eres un experto copywriter para redes sociales. 
Tu objetivo es tomar una idea básica y transformarla en un post altamente atractivo, persuasivo y listo para publicar.

Reglas:
1. NUNCA repitas la idea original tal cual. Mejórala significativamente.
2. Usa un tono adecuado para el rubro especificado.
3. Incluye emojis relevantes (sin exagerar).
4. Termina con un CALL TO ACTION potente. 
   ${email || phone ? `Usa estos datos de contacto en el CTA: ${email ? `Correo: ${email}` : ''} ${phone ? `Teléfono/WhatsApp: ${phone}` : ''}` : 'Si no hay datos de contacto, usa un CTA genérico como "Contáctanos por DM".'}
5. Termina con 3-5 hashtags estratégicos.
6. NO incluyas introducciones ni explicaciones, solo el texto del post.`;

            const model = getVertexModel("gemini-2.5-flash", systemInstruction);
            const prompt = `Rubro del negocio: ${businessType || 'General'}\nIdea base del post: ${idea}\n\nEscribe el copy optimizado:`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const enhancedCopy = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            
            if (enhancedCopy) {
                suggestedCopy = enhancedCopy;
            }
        } catch (aiError) {
            console.error("[VERTEX-AI] Copy generation error:", aiError);
        }

        return NextResponse.json({
            ...data,
            imageUrl,
            suggestedCopy
        });

    } catch (err: any) {
        console.error("[PROXY] Error generating preview:", err.message);
        return NextResponse.json({ error: err.message || "Error generating preview" }, { status: 500 });
    }
}
