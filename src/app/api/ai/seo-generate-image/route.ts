import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { generateFreeText } from "../../../../lib/gemini-free";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { postId, customPrompt } = body;

        if (!postId) {
            return NextResponse.json({ error: "postId es requerido" }, { status: 400 });
        }

        if (!adminDb) {
            return NextResponse.json({ error: "Database not configured" }, { status: 500 });
        }

        const docRef = adminDb.collection('blog_posts').doc(postId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
        }

        const post = docSnap.data()!;
        const title = post.title || 'Artículo de Blog';

        console.log(`[SEO-GENERATE-IMAGE] Generating image for post: ${title}`);

        // 1. Generate optimized image prompt with Gemini
        let imagePrompt = customPrompt;
        if (!imagePrompt) {
            const bananaRules = `
LA REGLA DE LOS 7 COMPONENTES (OBLIGATORIA PARA PROMPTS EN INGLÉS):
Todo prompt para generador de imágenes DEBE construirse como prosa narrativa fluida integrando estos 7 elementos:
1. Subject: Quién o qué es.
2. Style: Tipo de imagen.
3. Environment: Dónde sucede, clima.
4. Lighting: Tipo de luz, dirección, color.
5. Action: Qué está pasando (verbos en tiempo presente).
6. Camera: Ángulo, tipo de lente.
7. Texture: Detalles táctiles.

PROHIBICIONES ESTRICTAS:
- NO uses listas separadas por comas. Usa narrativa lineal.
- NO uses palabras baneadas: "4K", "8K", "masterpiece", "highly detailed". Descríbelo con palabras reales.
- NO incluyas textos literales en el prompt de la imagen (la IA de imagen no escribe bien).`;

            const promptInstruction = `Eres un Director de Arte Experto. Tu tarea es escribir un prompt narrativo en INGLÉS para la imagen de portada de un blog sobre: "${title}".
Usa estrictamente la REGLA DE LOS 7 COMPONENTES (Subject, Style, Environment, Lighting, Action, Camera, Texture).
No agregues texto explicativo, notas ni markdown, SOLO entrega el prompt en inglés puro en formato de prosa.

${bananaRules}`;
            imagePrompt = (await generateFreeText(`Prompt de portada para: ${title}`, promptInstruction, false)) || `${title}, professional photography, modern corporate blog header`;
        }

        // Clean up prompt
        const cleanedPrompt = imagePrompt.replace(/[\r\n]+/g, ' ').replace(/"/g, '').trim();

        // 2. Call n8n Image Webhook
        let imageUrl = '';
        const n8nWebhookUrl = process.env.N8N_IMAGE_GENERATOR_URL || 'https://n8n.santisoft.cl/webhook/img-rrss-auto';

        try {
            const n8nRes = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: cleanedPrompt,
                    promptEnglish: cleanedPrompt,
                    idea: title,
                    type: 'Imagen',
                    postId
                })
            });

            if (n8nRes.ok) {
                const data = await n8nRes.json();
                imageUrl = data.img_url || data.imageUrl || data.url || '';
            } else {
                console.warn("[SEO-GENERATE-IMAGE] n8n webhook returned non-200, fallback to Pollinations");
            }
        } catch (err: any) {
            console.error("[SEO-GENERATE-IMAGE] n8n fetch error:", err);
        }

        // Fallback if n8n didn't return an image URL
        if (!imageUrl) {
            const encodedPrompt = encodeURIComponent(`${cleanedPrompt}, high quality photorealistic blog cover`);
            imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
        }

        // 3. Inject image into post HTML content at top if not present
        let updatedHtml = post.htmlContent || '';
        const imgHtmlTag = `<div className="my-6"><img src="${imageUrl}" alt="${title}" class="w-full rounded-2xl shadow-lg object-cover max-h-[480px]" /></div>\n`;

        if (updatedHtml && !updatedHtml.includes('src=')) {
            updatedHtml = imgHtmlTag + updatedHtml;
        } else if (updatedHtml && updatedHtml.includes('src=')) {
            // Replace existing top image tag if any
            updatedHtml = updatedHtml.replace(/<img[^>]*>/i, `<img src="${imageUrl}" alt="${title}" class="w-full rounded-2xl shadow-lg object-cover max-h-[480px]" />`);
        }

        // 4. Update Firestore doc
        await docRef.update({
            imageUrl,
            htmlContent: updatedHtml || `<img src="${imageUrl}" alt="${title}" class="w-full rounded-2xl shadow-lg object-cover max-h-[480px]" />`,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            imageUrl,
            message: "🎨 ¡Imagen destacada generada e insertada con éxito en el artículo!"
        });

    } catch (error: any) {
        console.error("[SEO-GENERATE-IMAGE] Fatal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
