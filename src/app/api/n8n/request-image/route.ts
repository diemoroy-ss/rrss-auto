import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getVertexModel } from "../../../../lib/vertexai";
import { getAiGenerationUsageAdmin, getAiPlanLimitAdmin, logAiGenerationAdmin } from "../../../../lib/quota-admin";
import { adminDb } from "../../../../lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const { secret, postId } = await req.json();

        const cronSecret = process.env.CRON_SECRET || 'santisoft-n8n-cron-key-123';
        if (secret !== cronSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!postId) {
            return NextResponse.json({ error: "postId is required" }, { status: 400 });
        }

        const postRef = doc(db, "social_posts", postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const postData = postSnap.data();
        const { idea, type, carouselCount, userId, profileId } = postData;

        // --- AI QUOTA ENFORCEMENT & BRAND CONTEXT ---
        let requiredType: 'image' | 'video' = type === 'Reel' ? 'video' : 'image';
        let requiredCount = type === 'Carrusel' ? Math.min(carouselCount || 3, 3) : 1;
        
        let brandContext = "";
        try {
            const userDoc = await adminDb.collection("users").doc(userId).get();
            const userData = userDoc.data() || {};
            const plan = userData.plan || 'free';
            
            const limit = await getAiPlanLimitAdmin(plan, requiredType);
            const usage = await getAiGenerationUsageAdmin(userId, requiredType);
            
            if (usage + requiredCount > limit) {
                console.warn(`[Quota] User ${userId} exceeded AI ${requiredType} limit (${usage}/${limit})`);
                return NextResponse.json({ error: `Has superado tu límite mensual de generación de ${requiredType === 'video' ? 'videos' : 'imágenes'} IA para tu plan.` }, { status: 403 });
            }
            
            // Fetch brand data from profile
            if (userData.profiles) {
                const prof = userData.profiles.find((p: any) => p.id === profileId) || userData.profiles[0];
                if (prof) {
                    const rubro = prof.rubro || "General";
                    const desc = prof.businessDescription || "";
                    if (rubro || desc) {
                        brandContext = `\nCONTEXTO DE MARCA (IMPORTANTE):\n- Rubro/Industria: ${rubro}\n- Descripción del Negocio: ${desc}\nAsegúrate de que los elementos visuales reflejen este rubro y negocio.`;
                    }
                }
            }
            
            // Log the generations upfront (or log them per image)
            for (let i = 0; i < requiredCount; i++) {
                await logAiGenerationAdmin(userId, profileId || 'default', requiredType, { postId });
            }
        } catch (qErr) {
            console.error("Error checking AI quota or fetching brand:", qErr);
        }
        // -----------------------------

        let prompts: string[] = [idea];

        // 1. Logic for prompts using Vertex AI
        if (type === 'Carrusel') {
            const actualCount = Math.min(carouselCount || 3, 3);
            const systemInstruction = `Eres un experto Director de Arte. Tu misión es generar una lista estructurada en JSON puro que contenga EXACTAMENTE ${actualCount} instrucciones descriptivas detalladas para un generador de imágenes de Inteligencia Artificial (Midjourney/DALL-E) en INGLÉS. Las imágenes conformarán un carrusel coherente secuencial.

INSTRUCCIONES CLAVE:
1. NO escribas otra cosa más que un Array JSON ("["..." , "..."]").
2. Escribe cada prompt en INGLÉS técnico y descriptivo enfocado en colores, iluminación y composición.
3. Asegura coherencia de Estilo Visual entre las imágenes.
4. NADA de comillas inversas markdown, solo el arreglo puro.${brandContext}`;

            const model = await getVertexModel(undefined, systemInstruction);
            const result = await model.generateContent(`Genera descripciones para: ${idea}`);
            const response = await result.response;
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
            
            try {
                const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
                const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(parsed)) prompts = parsed;
                }
            } catch (e) {
                console.error("Error parsing carousel JSON:", text);
            }
        } else if (type === 'Reel') {
            const systemInstruction = `Eres un experto Director de Fotografía. Tu misión es generar un ÚNICO prompt descriptivo en INGLÉS para un generador de Video por Inteligencia Artificial (RunwayML/Luma/Sora) que creará un Reel de 8 segundos.

INSTRUCCIONES CLAVE:
1. NO escribas introducciones ni comillas. Escribe SOLO el prompt técnico en inglés.
2. Especifica movimientos de cámara dinámicos pertinentes a RRSS.
3. Asegura impacto visual en formato vertical.${brandContext}`;

            const model = await getVertexModel(undefined, systemInstruction);
            const result = await model.generateContent(`Prompt de video para: ${idea}`);
            const response = await result.response;
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) prompts = [text];
        }

        // 2. Respond to n8n with the prompts
        return NextResponse.json({
            success: true,
            prompts: prompts,
            prompt_video: type === 'Reel' ? prompts[0] : undefined
        });

    } catch (error: any) {
        console.error("Request Image API Error (Vertex):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
