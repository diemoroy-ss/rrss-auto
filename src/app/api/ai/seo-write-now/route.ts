import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { generateFreeText } from "../../../../lib/gemini-free";
import { marked } from 'marked';
import { sendPublishedBlogEmail } from '../../../../lib/email-blog';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, postId, action = 'publish_now' } = body; // action: 'publish_now' | 'keep_schedule'

        if (!userId || !postId) {
            return NextResponse.json({ error: "Faltan parámetros requeridos (userId, postId)" }, { status: 400 });
        }

        if (!adminDb) {
            return NextResponse.json({ error: "Database not configured" }, { status: 500 });
        }

        // Fetch User and config
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const userData = userDoc.data()!;
        const config = userData.seoConfig || {};

        // Fetch Blog Post
        const docRef = adminDb.collection('blog_posts').doc(postId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
        }

        const post = docSnap.data()!;

        console.log(`[SEO-WRITE-NOW] Pass 1 - Writing draft for: ${post.title}`);

        // Pass 1: Initial Draft with Gemini
        const systemInstruction = `Eres un Redactor Experto en SEO, Marketing de Contenidos y Copywriting.
Tu tarea es escribir un artículo de blog completo, altamente optimizado para SEO y GEO (Generative Engine Optimization), en formato Markdown.

REGLAS SEO/GEO (CRÍTICAS):
1. Aplica E-E-A-T (Experiencia, Conocimiento, Autoridad, Confianza). Usa un tono de experto que domina el tema.
2. Estructura GEO: El primer párrafo debe responder directamente a la intención de búsqueda (para que ChatGPT/Perplexity lo cite de inmediato).
3. Usa abundante formato semántico: listas (bullet points), subtítulos (H2, H3), negritas para conceptos clave.
4. Longitud: Al menos 800 palabras.
5. Tono de voz: ${config.tone || 'Profesional'}
6. Público objetivo: ${config.audience || 'General'}`;

        const prompt = `Escribe un artículo completo sobre el siguiente tema:
Título (H1): ${post.title}
Palabra Clave Principal: ${post.targetKeyword || ''}
Descripción requerida: ${post.metaDescription || ''}

Entrega el artículo directamente en formato Markdown, sin texto introductorio ni conclusiones fuera del artículo.`;

        const draftMarkdown = await generateFreeText(prompt, systemInstruction, false);

        if (!draftMarkdown) {
            return NextResponse.json({ error: "Gemini no generó respuesta." }, { status: 500 });
        }

        // Pass 2: Review Loop (Editor Chief Critique & Refinement)
        console.log(`[SEO-WRITE-NOW] Pass 2 - Editor Review Loop for: ${post.title}`);
        const reviewInstruction = `Eres un Editor Jefe SEO y Corrector de Estilo. Tu tarea es pulir y perfeccionar el artículo borrador.
        
REGLAS DE HUMANIZER (CRÍTICAS):
- ELIMINA CUALQUIER PALABRA CLICHÉ DE IA: "Adéntrate", "Descubre", "Desata", "En resumen", "En conclusión", "Eleva tu", "Revoluciona", "El maravilloso mundo de".
- Transforma el texto para que fluya de manera 100% humana, natural y orgánica.
- Asegura que los párrafos no sean bloques pesados de texto. Usa oraciones directas.`;

        const reviewPrompt = `Revisa y perfecciona el siguiente borrador de artículo de blog:

Título: ${post.title}
Borrador inicial:
${draftMarkdown}

Puntos clave a revisar:
1. Aplica las REGLAS DE HUMANIZER estrictamente. Elimina muletillas de robot.
2. Formatea impecablemente los subtítulos (H2, H3) y listas.
3. Garantiza que la extensión sea sólida (+800 palabras).

Entrega únicamente la versión final perfeccionada en Markdown.`;

        const markdownContent = (await generateFreeText(reviewPrompt, reviewInstruction, false)) || draftMarkdown;

        // Convert Markdown to HTML
        const htmlContent = marked(markdownContent);

        // If user selected "keep_schedule": save content and mark as strategy_draft, keeping scheduled date & time
        if (action === 'keep_schedule') {
            await docRef.update({
                content: markdownContent,
                htmlContent,
                status: 'strategy_draft',
                updatedAt: new Date().toISOString(),
            });

            return NextResponse.json({
                success: true,
                message: `¡Artículo "${post.title}" redactado y guardado! Permanecerá agendado para su publicación automática en la fecha/hora indicada.`,
                status: 'strategy_draft'
            });
        }

        // Action === 'publish_now': Publish based on integration config
        const { integrationType, wpUrl, wpUser, wpPassword, webhookPlatform, webhookStoreUrl, webhookApiKey } = config;
        let isPushed = false;
        let pushError = null;

        if (integrationType === 'api_feed' || !integrationType) {
            isPushed = true;
        } else if (integrationType === 'wordpress') {
            if (wpUrl && wpUser && wpPassword) {
                try {
                    const baseUrl = wpUrl.replace(/\/$/, '');
                    const endpoint = `${baseUrl}/wp-json/wp/v2/posts`;
                    const authHeader = 'Basic ' + Buffer.from(`${wpUser}:${wpPassword}`).toString('base64');
                    
                    const wpRes = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                        body: JSON.stringify({
                            title: post.title,
                            content: htmlContent,
                            status: 'draft',
                        })
                    });
                    if (wpRes.ok) isPushed = true;
                    else pushError = await wpRes.text();
                } catch (err: any) {
                    pushError = err.message;
                }
            }
        } else if (integrationType === 'webhook') {
            try {
                const centralWebhookUrl = 'https://n8n.santisoft.cl/webhook/santisoft-seo-publish';
                const whRes = await fetch(centralWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: postId,
                        userId,
                        title: post.title,
                        htmlContent: htmlContent,
                        metaDescription: post.metaDescription || '',
                        targetKeyword: post.targetKeyword || '',
                        date: new Date().toISOString(),
                        platform: webhookPlatform || 'custom',
                        credentials: { storeUrl: webhookStoreUrl || '', apiKey: webhookApiKey || '' }
                    })
                });
                if (whRes.ok) isPushed = true;
                else pushError = await whRes.text();
            } catch (err: any) {
                pushError = err.message;
            }
        }

        const newStatus = (integrationType === 'api_feed' || isPushed) ? 'published' : 'draft';

        await docRef.update({
            content: markdownContent,
            htmlContent,
            status: newStatus,
            isPushedToSite: isPushed,
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastError: pushError || null,
        });

        // Send email notification to user
        if (userData.email && newStatus === 'published') {
            sendPublishedBlogEmail({
                toEmail: userData.email,
                postTitle: post.title,
                publishedAt: new Date().toLocaleDateString('es-CL'),
            }).catch(err => console.error("[SEO-WRITE-NOW] Email notification error:", err));
        }

        return NextResponse.json({
            success: true,
            message: `¡Artículo "${post.title}" redactado (2 revisiones) y ${newStatus === 'published' ? 'publicado' : 'guardado como borrador'} exitosamente!`,
            status: newStatus
        });

    } catch (error: any) {
        console.error("[SEO-WRITE-NOW] Fatal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
