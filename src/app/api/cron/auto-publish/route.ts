import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { generateFreeText } from "../../../../lib/gemini-free";
import { marked } from 'marked';
import { sendPublishedBlogEmail } from '../../../../lib/email-blog';

export async function GET(req: NextRequest) {
    return handleAutoPublish(req);
}

export async function POST(req: NextRequest) {
    return handleAutoPublish(req);
}

async function handleAutoPublish(req: NextRequest) {
    try {
        console.log("[CRON-AUTO-PUBLISH] Checking pending scheduled blog posts...");

        if (!adminDb) {
            return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
        }

        const now = new Date();
        const postsRef = adminDb.collection('blog_posts');
        
        // Fetch all candidates (strategy, strategy_draft, draft)
        const snap = await postsRef.get();

        const pendingDocs: any[] = [];

        snap.forEach(docSnap => {
            const data = docSnap.data();
            const status = data.status || '';

            // Only process posts that are pending publication
            if (['strategy', 'strategy_draft', 'draft'].includes(status)) {
                let scheduledDate: Date | null = null;
                const sf = data.scheduledFor;

                if (sf) {
                    if (typeof sf.toDate === 'function') scheduledDate = sf.toDate();
                    else if (sf.seconds) scheduledDate = new Date(sf.seconds * 1000);
                    else scheduledDate = new Date(sf);
                }

                // If scheduledFor is past or equal to now, or if missing for strategy_draft, mark for publishing
                if (scheduledDate && scheduledDate <= now) {
                    pendingDocs.push({ id: docSnap.id, ref: docSnap.ref, data, scheduledDate });
                }
            }
        });

        if (pendingDocs.length === 0) {
            console.log("[CRON-AUTO-PUBLISH] No pending scheduled posts to publish right now.");
            return NextResponse.json({ success: true, message: "No pending scheduled posts for current time", processedCount: 0 });
        }

        console.log(`[CRON-AUTO-PUBLISH] Found ${pendingDocs.length} pending posts scheduled on or before ${now.toISOString()}`);

        const results = [];

        for (const item of pendingDocs) {
            const { id: postId, ref: docRef, data: post } = item;
            const userId = post.userId;

            try {
                console.log(`[CRON-AUTO-PUBLISH] Processing post: "${post.title}" (${postId})`);

                // 1. Get user config
                let config: any = {};
                let userEmail = '';

                if (userId) {
                    const userDoc = await adminDb.collection('users').doc(userId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data()!;
                        config = userData.seoConfig || {};
                        userEmail = userData.email || '';
                    }
                }

                let markdownContent = post.content || '';
                let htmlContent = post.htmlContent || '';

                // 2. If content is missing, generate using Pass 1 + Pass 2 review
                if (!htmlContent) {
                    console.log(`[CRON-AUTO-PUBLISH] Content missing for "${post.title}". Generating with Gemini...`);

                    const tone = config.tone || 'Profesional y cercano';
                    const audience = config.audience || 'General';

                    // Pass 1: Initial Draft
                    const systemPromptPass1 = `Eres un Redactor SEO Senior y Copywriter Experto.
Escribe un artículo de blog extenso y altamente optimizado en formato Markdown.
Requisitos:
- Título principal claro H1.
- Introducción atrapante.
- Mínimo 3 secciones H2 con subtítulos H3 estructurados.
- Listas con viñetas o numéricas para facilitar la lectura.
- Conclusión con llamada a la acción clara.
- Tono: ${tone}
- Audiencia: ${audience}
- Extensión: al menos 800 palabras.
- IMPORTANTE: NUNCA menciones que eres una IA o Inteligencia Artificial. Refiérete a ti mismo y a tus acciones como "nuestros agentes" o "nuestro equipo de agentes especializados". Tampoco hables de "lo que se puede hacer con IA".`;

                    const userPromptPass1 = `Tema: ${post.title}
Palabra Clave: ${post.targetKeyword || ''}
Descripción: ${post.metaDescription || ''}`;

                    const rawDraft = await generateFreeText(userPromptPass1, systemPromptPass1, false);

                    // Pass 2: SEO Chief Editor Review
                    const systemPromptPass2 = `Eres el Editor General SEO de una agencia digital de elite.
Revisa y perfecciona el siguiente borrador de artículo de blog para garantizar la máxima calidad técnica, coherencia gramatical y fluidez SEO.
Asegúrate de que los encabezados H2 y H3 estén bien diferenciados, elimina redundancias y entrega SOLO el texto final en formato Markdown refinado.`;

                    const finalMarkdown = await generateFreeText(`Borrador a revisar:\n\n${rawDraft}`, systemPromptPass2, false) || rawDraft;

                    markdownContent = finalMarkdown || '';
                    htmlContent = await marked(finalMarkdown || '');
                }

                // 3. Publish to target integration
                const integrationType = config.integrationType || 'api_feed';
                let isPushed = false;
                let pushError = null;

                if (integrationType === 'api_feed') {
                    isPushed = true;
                } else if (integrationType === 'wordpress' && config.wpUrl && config.wpUser && config.wpPassword) {
                    try {
                        const baseUrl = config.wpUrl.replace(/\/$/, '');
                        const endpoint = `${baseUrl}/wp-json/wp/v2/posts`;
                        const authHeader = 'Basic ' + Buffer.from(`${config.wpUser}:${config.wpPassword}`).toString('base64');
                        
                        const wpRes = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                            body: JSON.stringify({
                                title: post.title,
                                content: htmlContent,
                                status: 'publish'
                            })
                        });
                        if (wpRes.ok) isPushed = true;
                        else pushError = await wpRes.text();
                    } catch (wpErr: any) {
                        pushError = wpErr.message;
                    }
                } else if (integrationType === 'webhook') {
                    try {
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
                                platform: config.webhookPlatform || 'custom',
                                credentials: { storeUrl: config.webhookStoreUrl || '', apiKey: config.webhookApiKey || '' }
                            })
                        });
                        if (whRes.ok) isPushed = true;
                        else pushError = await whRes.text();
                    } catch (whErr: any) {
                        pushError = whErr.message;
                    }
                }

                const publishedDateISO = new Date().toISOString();

                // 4. Update Firestore doc status to published
                await docRef.update({
                    content: markdownContent,
                    htmlContent: htmlContent,
                    status: 'published',
                    isPushedToSite: isPushed,
                    publishedAt: publishedDateISO,
                    updatedAt: publishedDateISO,
                    lastError: pushError || null
                });

                // 5. Send Publication Email Notification
                if (userEmail) {
                    sendPublishedBlogEmail({
                        toEmail: userEmail,
                        postTitle: post.title,
                        postUrl: `https://santisoft.cl/blog/${post.slug || ''}`,
                        publishedAt: new Date().toLocaleDateString('es-CL')
                    }).catch(err => console.error("[CRON-AUTO-PUBLISH] Email notification error:", err));
                }

                results.push({ postId, title: post.title, success: true, isPushed });

            } catch (err: any) {
                console.error(`[CRON-AUTO-PUBLISH] Error executing post ${postId}:`, err);
                results.push({ postId, title: post.title, success: false, error: err.message });
            }
        }

        return NextResponse.json({ success: true, processedCount: results.length, results });

    } catch (error: any) {
        console.error("[CRON-AUTO-PUBLISH] Fatal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
