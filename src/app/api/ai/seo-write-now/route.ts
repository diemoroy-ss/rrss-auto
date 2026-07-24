import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { generateFreeText } from "../../../../lib/gemini-free";
import { marked } from 'marked';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, postId } = body;

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

        console.log(`[SEO-WRITE-NOW] Writing article for: ${post.title}`);

        // Generate content with Gemini
        const systemInstruction = `Eres un Redactor Experto en SEO, Marketing de Contenidos y Copywriting.
Tu tarea es escribir un artículo de blog completo, altamente optimizado para SEO, en formato Markdown.
Debe tener una introducción persuasiva, desarrollo profundo con subtítulos (H2, H3), viñetas, y una conclusión con llamado a la acción.
Longitud: Al menos 800 palabras.
Tono de voz: ${config.tone || 'Profesional'}
Público objetivo: ${config.audience || 'General'}`;

        const prompt = `Escribe un artículo completo sobre el siguiente tema:
Título (H1): ${post.title}
Palabra Clave Principal: ${post.targetKeyword || ''}
Descripción requerida: ${post.metaDescription || ''}

Entrega el artículo directamente en formato Markdown, sin texto introductorio ni conclusiones fuera del artículo.`;

        const markdownContent = await generateFreeText(prompt, systemInstruction, false);

        if (!markdownContent) {
            return NextResponse.json({ error: "Gemini no generó respuesta." }, { status: 500 });
        }

        // Convert Markdown to HTML
        const htmlContent = marked(markdownContent);

        // Publish based on integration config
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

        return NextResponse.json({
            success: true,
            message: `¡Artículo "${post.title}" redactado y ${newStatus === 'published' ? 'publicado' : 'guardado como borrador'} exitosamente!`,
            status: newStatus
        });

    } catch (error: any) {
        console.error("[SEO-WRITE-NOW] Fatal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
