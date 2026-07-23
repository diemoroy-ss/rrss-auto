import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { generateFreeText } from "../../../../lib/gemini-free";
import { marked } from 'marked';

export async function POST(req: NextRequest) {
    try {
        // Verify authorization
        const authHeader = req.headers.get('Authorization');
        const expectedSecret = process.env.CRON_SECRET || 'santisoft-n8n-cron-key-123';
        
        if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { postId } = body;

        if (!postId) {
            return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
        }

        console.log(`[EXECUTE-BLOG] Executing GCP Task for blog post: ${postId}`);

        const docRef = adminDb.collection('blog_posts').doc(postId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const post = doc.data()!;
        
        // Prevent double execution
        if (post.status !== 'strategy') {
            console.log(`[EXECUTE-BLOG] Post ${postId} is already processed (status: ${post.status}). Skipping.`);
            return NextResponse.json({ success: true, message: 'Already processed' });
        }

        const userId = post.userId;

        // Fetch User and config
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists) throw new Error("Usuario no encontrado");
        
        const userData = userDoc.data()!;
        const config = userData.seoConfig;
        if (!config) throw new Error("Sin configuración SEO");

        console.log(`[EXECUTE-BLOG] Generating article for Post: ${post.title}`);

        // Generate content with Gemini
        const systemInstruction = `Eres un Redactor Experto en SEO, Marketing de Contenidos y Copywriting.
Tu tarea es escribir un artículo de blog completo, altamente optimizado para SEO, en formato Markdown.
Debe tener una introducción persuasiva, desarrollo profundo con subtítulos (H2, H3), viñetas, y una conclusión con llamado a la acción.
Longitud: Al menos 800 palabras.
Tono de voz: ${config.tone || 'Profesional'}
Público objetivo: ${config.audience || 'General'}`;

        const prompt = `Escribe un artículo completo sobre el siguiente tema:
Título (H1): ${post.title}
Palabra Clave Principal: ${post.targetKeyword}
Descripción requerida: ${post.metaDescription}

Entrega el artículo directamente en formato Markdown, sin texto introductorio ni conclusiones fuera del artículo.`;

        const markdownContent = await generateFreeText(prompt, systemInstruction, false);
        if (!markdownContent) throw new Error("Gemini no retornó contenido");

        // Convert Markdown to HTML
        const htmlContent = marked(markdownContent);

        // Publish based on integration config
        const { integrationType, wpUrl, wpUser, wpPassword, webhookPlatform, webhookStoreUrl, webhookApiKey } = config;
        let isPushed = false;
        let pushError = null;

        if (integrationType === 'api_feed') {
            isPushed = true;
        } else if (integrationType === 'wordpress') {
            if (wpUrl && wpUser && wpPassword) {
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
            }
        } else if (integrationType === 'webhook') {
            const centralWebhookUrl = 'https://n8n.santisoft.cl/webhook/santisoft-seo-publish';
            const whRes = await fetch(centralWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: postId,
                    userId: userId,
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
        }

        const newStatus = (integrationType === 'api_feed' && isPushed) ? 'published' : 'draft';

        // Update status in Firestore
        await docRef.update({
            content: markdownContent,
            htmlContent: htmlContent,
            status: newStatus,
            isPushedToSite: isPushed,
            pushedAt: isPushed ? new Date() : null,
            updatedAt: new Date(),
            lastError: pushError || null,
            gcpTaskName: null // clear the task name since it's executed
        });

        console.log(`[EXECUTE-BLOG] Successfully processed post ${postId}`);
        return NextResponse.json({ success: true, isPushed, status: newStatus });

    } catch (error: any) {
        console.error("[EXECUTE-BLOG] Fatal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
