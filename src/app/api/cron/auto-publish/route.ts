import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { generateFreeText } from "../../../../lib/gemini-free";
import { marked } from 'marked';

// Este endpoint es llamado por Vercel Cron o Google Cloud Scheduler
// URL: /api/cron/auto-publish
// Idealmente deberías configurar un secreto (ej: ?key=tu_secreto) en tu cron service
export async function GET(req: NextRequest) {
    try {
        console.log("[CRON] Iniciando proceso de Auto-Publicación SEO...");
        
        // 1. Buscar todos los posts programados para hoy (o antes) que aún estén en estado 'strategy'
        const today = new Date();
        const postsRef = adminDb.collection('blog_posts');
        const querySnapshot = await postsRef
            .where('status', '==', 'strategy')
            .where('scheduledFor', '<=', today)
            .get();

        if (querySnapshot.empty) {
            console.log("[CRON] No hay artículos programados para publicar hoy.");
            return NextResponse.json({ success: true, message: "No pending posts" });
        }

        console.log(`[CRON] Encontrados ${querySnapshot.size} artículos pendientes.`);

        const results = [];

        // 2. Procesar cada post
        for (const doc of querySnapshot.docs) {
            const post = doc.data();
            const postId = doc.id;
            const userId = post.userId;

            try {
                // Obtener config del usuario
                const userDoc = await adminDb.collection('users').doc(userId).get();
                if (!userDoc.exists) throw new Error("Usuario no encontrado");
                
                const userData = userDoc.data()!;
                const config = userData.seoConfig;
                if (!config) throw new Error("Sin configuración SEO");

                console.log(`[CRON] Generando artículo para Post: ${post.title}`);

                // Generar el contenido con Gemini
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

                // Convertir Markdown a HTML
                const htmlContent = marked(markdownContent);

                // 3. Publicar según la configuración del usuario
                const { integrationType, wpUrl, wpUser, wpPassword, webhookPlatform, webhookStoreUrl, webhookApiKey } = config;
                let isPushed = false;
                let pushError = null;

                if (integrationType === 'wordpress') {
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
                                status: 'draft', // Lo dejamos como borrador para que lo revisen, o 'publish' para full autopilot
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

                // 4. Actualizar estado en Firestore
                await doc.ref.update({
                    content: markdownContent,
                    htmlContent: htmlContent,
                    status: 'draft', // Cambia de strategy a draft
                    isPushedToSite: isPushed,
                    pushedAt: isPushed ? new Date() : null,
                    updatedAt: new Date(),
                    lastError: pushError || null
                });

                results.push({ postId, success: true, isPushed });
            } catch (err: any) {
                console.error(`[CRON] Error procesando post ${postId}:`, err);
                results.push({ postId, success: false, error: err.message });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error("[CRON] Error fatal:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
