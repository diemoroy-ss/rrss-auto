import { NextRequest, NextResponse } from "next/server";
import { getFreeModel } from "../../../../lib/gemini-free";
import { generateElevenLabsAudio } from "../../../../lib/elevenlabs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            idea, 
            promptEnglish, 
            promptsEnglish,
            videoPrompt, 
            voiceoverScript, 
            businessType, 
            type, 
            carouselCount, 
            userPlan, 
            email, 
            phone,
            profileId
        } = body;
        
        let n8nUrl = process.env.NEXT_PUBLIC_N8N_PREVIEW_URL;

        if (!n8nUrl) {
            n8nUrl = 'https://n8n.santisoft.cl/webhook/img-rrss-auto';
        }

        let audioUrl = "";

        // 1. Generate audio if it is a Reel
        if (type === 'Reel' && voiceoverScript && process.env.ELEVENLABS_API_KEY) {
            try {
                const userId = profileId || "default_user";
                const audioGenerated = await generateElevenLabsAudio(voiceoverScript, userId);
                if (audioGenerated) {
                    audioUrl = audioGenerated;
                }
            } catch (elevenErr) {
                console.error("[ElevenLabs Error in route]:", elevenErr);
            }
        }

        // 2. Prepare payload for n8n using already approved prompts
        let targetPrompts = [idea];
        if (promptsEnglish && Array.isArray(promptsEnglish) && promptsEnglish.length > 0) {
            targetPrompts = promptsEnglish;
        } else if (promptEnglish) {
            targetPrompts = [promptEnglish];
        }

        const payloadToN8N = {
            ...body,
            type: (type === 'Reel' || type === 'Carrusel') ? 'Post' : type,
            prompts: [targetPrompts[0]], // Force single post preview first for fast response
        };

        console.log(`[PROXY] Calling n8n with approved prompt: ${n8nUrl}`);
        let n8nResponse = await fetch(n8nUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadToN8N),
        });

        // Test fallback for n8n local editor
        if (n8nResponse.status === 404 && n8nUrl.includes('/webhook/') && !n8nUrl.includes('/webhook-test/')) {
            const fallbackUrl = n8nUrl.replace('/webhook/', '/webhook-test/');
            console.log(`[PROXY] Production webhook returned 404. Trying test fallback: ${fallbackUrl}`);
            try {
                const testResponse = await fetch(fallbackUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payloadToN8N),
                });
                if (testResponse.ok) {
                    n8nResponse = testResponse;
                }
            } catch (fallbackErr: any) {
                console.error(`[PROXY] Fallback to test failed:`, fallbackErr.message);
            }
        }

        if (!n8nResponse.ok) {
            const errText = await n8nResponse.text();
            console.error(`[PROXY] n8n error: ${errText}`);
            return NextResponse.json({ error: "No se pudo conectar con el servicio de generación de imágenes." }, { status: 500 });
        }

        const rawText = await n8nResponse.text();
        let data: any = null;
        
        try {
            const rawData = JSON.parse(rawText);
            data = Array.isArray(rawData) ? rawData[0] : rawData;
        } catch (parseError) {
            const trimmedText = rawText.trim();
            if (trimmedText.startsWith('http://') || trimmedText.startsWith('https://')) {
                data = { imageUrl: trimmedText };
            } else {
                data = { 
                    imageUrl: "https://res.cloudinary.com/dtrsycv80/image/upload/v1779724906/wt35okeegkbdihx7tdrp.png",
                    suggestedCopy: "Previsualización temporal cargada exitosamente."
                };
            }
        }

        const imageUrl = data?.imageUrl || data?.image_url || data?.url || data?.finalUrl || data?.final_url;
        let suggestedCopy = data?.suggestedCopy || data?.copy || data?.text || "";

        if (!imageUrl) {
            return NextResponse.json({ error: "No se pudo recuperar la URL del diseño." }, { status: 422 });
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
            videoPrompt: videoPrompt || "",
            voiceoverScript: voiceoverScript || "",
            audioUrl
        });

    } catch (err: any) {
        console.error("[PROXY] Error generating preview:", err.message);
        return NextResponse.json({ error: "Error técnico en previsualización de red." }, { status: 500 });
    }
}
