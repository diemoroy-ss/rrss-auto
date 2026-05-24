import { NextRequest, NextResponse } from "next/server";
import { getFreeModel } from "../../../../lib/gemini-free";
import { generateElevenLabsAudio } from "../../../../lib/elevenlabs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { idea, businessType, type, carouselCount, userPlan, email, phone } = body;
        let n8nUrl = process.env.NEXT_PUBLIC_N8N_PREVIEW_URL;

        // Fallback to test URL as requested
        if (!n8nUrl) {
            n8nUrl = 'https://n8n.santisoft.cl/webhook-test/img-rrss-auto';
        }

        let videoPrompt = "";
        let voiceoverScript = "";
        let audioUrl = "";

        // 1. Generate visual prompts based on the idea using Vertex AI
        let prompts: string[] = [idea];

        try {
            if (type === 'Carrusel') {
                console.log("[GEMINI-FREE] Generating carousel prompts for preview...");
                const systemInstruction = `Eres un experto Director de Arte. Tu misión es generar una lista estructurada en JSON puro que contenga EXACTAMENTE ${carouselCount || 3} instrucciones descriptivas detalladas para un generador de imágenes de Inteligencia Artificial (Midjourney/DALL-E) en INGLÉS. Las imágenes conformarán un carrusel coherente secuencial.

INSTRUCCIONES CLAVE:
1. NO escribas otra cosa más que un Array JSON ("["..." , "..."])". 
2. Escribe cada prompt en INGLÉS técnico y descriptivo enfocado en colores, iluminación y composición.
3. Asegura coherencia de Estilo Visual entre las imágenes.
4. NADA de comillas inversas markdown, solo el arreglo puro.`;

                const model = getFreeModel(undefined, systemInstruction);
                const result = await model.generateContent(`Genera las ${carouselCount || 3} descripciones visuales para esta idea de post: ${idea}`);
                const response = result.response;
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
                console.log("[GEMINI-FREE] Generating Reel assets (image & video prompts + voiceover script)...");
                const systemInstruction = `Eres un experto Director de Arte y Guionista de Redes Sociales.
Tu tarea es analizar la idea del post y retornar un objeto JSON con la estructura exacta indicada a continuación:

{
  "image_prompt": "Un prompt detallado en INGLÉS para generar la imagen de portada/escena inicial del Reel en un generador de imágenes de IA. Debe ser visualmente impactante, descriptivo, en formato vertical (9:16) y sin texto.",
  "video_prompt": "Un prompt de animación en INGLÉS para un generador de Image-to-Video (como Runway o Luma). Describe el movimiento de la cámara, los elementos que se mueven, luces y efectos cinemáticos, partiendo desde la imagen inicial generada.",
  "voiceover_script": "Un guion de locución corto y persuasivo en ESPAÑOL de exactamente 15 a 20 palabras (ideal para un Reel de 8-10 segundos)."
}

IMPORTANTE: Escribe únicamente el JSON válido, sin formato markdown (NADA de comillas invertidas ni la palabra json).`;

                const model = getFreeModel(undefined, systemInstruction);
                const result = await model.generateContent(`Genera los assets para esta idea de Reel: ${idea}`);
                const response = result.response;
                const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";

                const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
                const match = cleanedText.match(/\{[\s\S]*\}/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    prompts = [parsed.image_prompt || idea];
                    videoPrompt = parsed.video_prompt || "";
                    voiceoverScript = parsed.voiceover_script || "";
                } else {
                    prompts = [idea];
                }

                // Generar locución de ElevenLabs
                if (voiceoverScript && process.env.ELEVENLABS_API_KEY) {
                    try {
                        const userId = body.profileId || "default_user";
                        const audioGenerated = await generateElevenLabsAudio(voiceoverScript, userId);
                        if (audioGenerated) {
                            audioUrl = audioGenerated;
                        }
                    } catch (elevenErr) {
                        console.error("[ElevenLabs Error in route]:", elevenErr);
                    }
                }
            }
        } catch (visError) {
            console.error("[GEMINI-FREE] Error generating visual prompts, falling back to original idea:", visError);
        }

        // 2. Call n8n to generate the media (Force 'Post' type for Reel to get a static cover image)
        const payloadToN8N = {
            ...body,
            type: type === 'Reel' ? 'Post' : type,
            prompts,
        };

        console.log(`[PROXY] Calling n8n: ${n8nUrl}`);
        let n8nResponse = await fetch(n8nUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadToN8N),
        });

        // Smart fallback: If the production webhook returns a 404 (meaning the workflow is inactive/not registered in n8n yet),
        // we automatically try the test webhook URL. This allows testing directly in the n8n editor via 'Listen for test event'.
        if (n8nResponse.status === 404 && n8nUrl.includes('/webhook/') && !n8nUrl.includes('/webhook-test/')) {
            const fallbackUrl = n8nUrl.replace('/webhook/', '/webhook-test/');
            console.log(`[PROXY] Production webhook returned 404 (workflow is likely inactive). Trying test fallback: ${fallbackUrl}`);
            try {
                const testResponse = await fetch(fallbackUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payloadToN8N),
                });
                if (testResponse.ok) {
                    console.log(`[PROXY] Fallback to test URL succeeded with status: ${testResponse.status}`);
                    n8nResponse = testResponse;
                } else {
                    console.error(`[PROXY] Fallback to test URL also failed with status: ${testResponse.status}`);
                }
            } catch (fallbackErr: any) {
                console.error(`[PROXY] Error during fallback fetch to ${fallbackUrl}:`, fallbackErr.message);
            }
        }

        if (!n8nResponse.ok) {
            const errText = await n8nResponse.text();
            console.error(`[PROXY] n8n error: ${errText}`);
            return NextResponse.json({ error: "No se pudo conectar con el servicio de generación de imágenes. Por favor, asegúrate de que el flujo esté activo o inténtalo de nuevo más tarde." }, { status: 500 });
        }

        const rawText = await n8nResponse.text();
        let data: any = null;
        
        try {
            const rawData = JSON.parse(rawText);
            data = Array.isArray(rawData) ? rawData[0] : rawData;
        } catch (parseError) {
            console.warn(`[PROXY] n8n returned non-JSON: ${rawText}. Checking if it is a plain URL...`);
            const trimmedText = rawText.trim();
            if (trimmedText.startsWith('http://') || trimmedText.startsWith('https://')) {
                data = { imageUrl: trimmedText };
            } else {
                return NextResponse.json({ 
                    error: "El servidor de generación devolvió una respuesta no válida. Por favor, vuelve a intentarlo en unos instantes.",
                    details: rawText.substring(0, 1000)
                }, { status: 502 });
            }
        }

        // Normalize response
        const imageUrl = data?.imageUrl || data?.image_url || data?.url || data?.finalUrl || data?.final_url;
        let suggestedCopy = data?.suggestedCopy || data?.copy || data?.text || "";

        if (!imageUrl) {
            console.error(`[PROXY] No imageUrl found in n8n response data:`, data);
            const errorMessage = data?.error || data?.message || "No se pudo generar la imagen. El servidor de diseño no devolvió una URL válida de imagen.";
            return NextResponse.json({ error: errorMessage }, { status: 422 });
        }

        // 3. Generate high-quality copy using Gemini Free
        try {
            console.log("[GEMINI-FREE] Generating optimized copy...");
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

            const model = getFreeModel(undefined, systemInstruction);
            const prompt = `Rubro del negocio: ${businessType || 'General'}\nIdea base del post: ${idea}\n\nEscribe el copy optimizado:`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const enhancedCopy = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (enhancedCopy) {
                suggestedCopy = enhancedCopy;
            }
        } catch (aiError) {
            console.error("[GEMINI-FREE] Copy generation error:", aiError);
        }

        return NextResponse.json({
            ...data,
            imageUrl,
            suggestedCopy,
            videoPrompt,
            voiceoverScript,
            audioUrl
        });

    } catch (err: any) {
        console.error("[PROXY] Error generating preview:", err.message);
        return NextResponse.json({ error: "No pudimos generar la previsualización debido a un problema técnico de red. Por favor, reinténtalo." }, { status: 500 });
    }
}
