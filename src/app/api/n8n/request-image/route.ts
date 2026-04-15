import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { postId } = body;

        // Validar postId
        if (!postId) {
            return NextResponse.json({ error: "postId is required" }, { status: 400 });
        }

        const postRef = doc(db, "social_posts", postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
             return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const postData = postSnap.data();

        // 1. Marcar como que está generando (Para la UI de Spinner)
        await updateDoc(postRef, { isGeneratingImage: true, errorLog: null });

        // 2. Despachar a N8N
        // El usuario debe configurar su Webhook de "Receptor de IA" aquí:
        const N8N_GENERATOR_WEBHOOK = process.env.N8N_IMAGE_GENERATOR_URL || "https://n8n.santisoft.cl/webhook-test/generar-imagen";
        const CRON_SECRET = process.env.CRON_SECRET || 'santisoft-n8n-cron-key-123';

        const isCarousel = postData.type === 'Carrusel';
        const isReel = postData.type === 'Reel';
        const carouselCount = isCarousel ? (postData.carouselCount || 3) : 1;

        // Start background process for AI prompt generation + N8N ping
        const runBackground = async () => {
            const baseVisual = postData.text || postData.idea;
            let prompts = [baseVisual]; // Fallback to single text

            if (isCarousel) {
                try {
                    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
                    if (apiKey) {
                        const genAI = new GoogleGenerativeAI(apiKey);
                        const model = genAI.getGenerativeModel({ 
                            model: "gemini-2.5-flash",
                            systemInstruction: `Eres un experto Director de Arte. Tu misión es generar una lista estructurada en JSON puro que contenga EXACTAMENTE ${carouselCount} instrucciones descriptivas detalladas para un generador de imágenes de Inteligencia Artificial (Midjourney/DALL-E) en INGLÉS. Las imágenes conformarán un carrusel coherente secuencial.

INSTRUCCIONES CLAVE:
1. NO escribas otra cosa más que un Array JSON ("["..." , "..."]").
2. Escribe cada prompt en INGLÉS técnico y descriptivo enfocado en colores, iluminación y composición.
3. Asegura coherencia de Estilo Visual entre las ${carouselCount} imágenes.
4. NADA de comillas inversas markdown, solo el arreglo puro.`
                        });
                        const result = await model.generateContent(`Genera las ${carouselCount} descripciones visuales para esta idea de post: ${baseVisual}`);
                        const rawText = await result.response.text();
                        
                        // Extract array from markdown codeblocks if they sneak them in
                        const match = rawText.match(/\[[\s\S]*\]/);
                        if (match) {
                            const parsed = JSON.parse(match[0]);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                prompts = parsed;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error generating carousel prompts via Gemini, falling back to same text", e);
                    // generate simple variations if Gemini fails
                    prompts = Array.from({length: carouselCount}).map((_, i) => `${baseVisual}. Variation part ${i+1} of a sequence.`);
                }
            } else if (isReel) {
                try {
                    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
                    if (apiKey) {
                        const genAI = new GoogleGenerativeAI(apiKey);
                        const model = genAI.getGenerativeModel({ 
                            model: "gemini-2.5-flash",
                            systemInstruction: `Eres un experto Director de Fotografía. Tu misión es generar un ÚNICO prompt descriptivo en INGLÉS para un generador de Video por Inteligencia Artificial (RunwayML/Luma/Sora) que creará un Reel de 8 segundos.

INSTRUCCIONES CLAVE:
1. NO escribas introducciones ni comillas. Escribe SOLO el prompt técnico en inglés.
2. Especifica movimientos de cámara dinámicos pertinentes a RRSS (ej: slow pan, dynamic zoom, cinematic dolly track).
3. Asegura que la escena sea visualmente impactante, orientada a formato vertical (9:16).
4. El texto debe ser fluido y muy enfocado en la iluminación, textura y estilo cinemático.`
                        });
                        const result = await model.generateContent(`Genera el prompt de video para esta idea: ${baseVisual}`);
                        const rawText = await result.response.text();
                        prompts = [rawText.trim().replace(/^"|"$/g, '')];
                    }
                } catch (e) {
                    console.error("Error generating reel prompt via Gemini", e);
                }
            }

            const payloadToN8N = {
                secret: CRON_SECRET,
                postId,
                copy: baseVisual, // IMPORTANTE: enviamos la instrucción visual general
                prompts: prompts, // IMPORTANTE: array final de N prompts construidos por IA
                prompt_video: isReel && prompts.length > 0 ? prompts[0] : undefined, // Para flujos sencillos enfocados en 1 solo video
                type: postData.type || 'Post',
                carouselCount: carouselCount,
                networks: postData.networks || []
            };

            try {
                const n8nRes = await fetch(N8N_GENERATOR_WEBHOOK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payloadToN8N)
                });
                
                if (!n8nRes.ok) throw new Error("n8n Http " + n8nRes.status);
            } catch (webhookError) {
                console.error("Error pinging n8n webhook", webhookError);
                await updateDoc(postRef, { isGeneratingImage: false, errorLog: "No se pudo contactar al generador de n8n." });
            }
        };

        // Fire and forget
        runBackground();

        return NextResponse.json({ success: true, message: "Generación AI y Encolamiento iniciados." });
        
    } catch (error: any) {
        console.error("Request Image Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
