import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, postId } = body;

        if (!userId || !postId) {
            return NextResponse.json({ error: "Faltan parámetros requerides (userId, postId)" }, { status: 400 });
        }

        // Fetch User and config
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }
        
        const userData = userDoc.data();
        const config = userData?.seoConfig;
        if (!config) {
            return NextResponse.json({ error: "No hay configuración SEO guardada" }, { status: 400 });
        }

        const { integrationType, wpUrl, wpUser, wpPassword, webhookPlatform, webhookStoreUrl, webhookApiKey } = config;

        if (integrationType === 'wordpress' && (!wpUrl || !wpUser || !wpPassword)) {
            return NextResponse.json({ error: "Faltan credenciales de WordPress en la configuración" }, { status: 400 });
        }

        // Fetch Blog Post
        const postDoc = await adminDb.collection('blog_posts').doc(postId).get();
        if (!postDoc.exists) {
            return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
        }

        const postData = postDoc.data()!;
        const title = postData.title || 'Sin Título';
        const content = postData.htmlContent || postData.content || '';

        // ─── API FEED: publish directly in Firestore ───
        // Article becomes instantly available via GET /api/blog-feed
        if (integrationType === 'api_feed') {
            await postDoc.ref.update({
                status: 'published',
                publishedAt: new Date().toISOString(),
                userId: userId,
            });
            return NextResponse.json({
                success: true,
                message: "✅ Artículo publicado. Disponible en tu API Feed.",
            });
        }

        // ─── WORDPRESS REST API ───
        if (integrationType === 'wordpress') {
            const baseUrl = wpUrl.replace(/\/$/, '');
            const endpoint = `${baseUrl}/wp-json/wp/v2/posts`;
            const authHeader = 'Basic ' + Buffer.from(`${wpUser}:${wpPassword}`).toString('base64');
            
            const wpRes = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({
                    title,
                    content,
                    status: 'draft',
                    meta: {
                        _yoast_wpseo_metadesc: postData.metaDescription || '',
                        _yoast_wpseo_title: postData.seoTitle || title,
                    }
                })
            });

            if (!wpRes.ok) {
                const errData = await wpRes.text();
                console.error("WP Error:", errData);
                return NextResponse.json({ error: `Error de WordPress: ${wpRes.statusText}` }, { status: wpRes.status });
            }
            
            await postDoc.ref.update({ isPushedToSite: true, pushedAt: new Date().toISOString() });
            return NextResponse.json({ success: true, message: "Borrador enviado a WordPress con éxito" });
        }

        // ─── WEBHOOK (n8n centralizado → Shopify, Wix, Webflow, custom) ───
        if (integrationType === 'webhook') {
            const centralWebhookUrl = 'https://n8n.santisoft.cl/webhook/santisoft-seo-publish';
            
            const payload = {
                id: postId,
                userId,
                title,
                htmlContent: content,
                metaDescription: postData.metaDescription || '',
                targetKeyword: postData.targetKeyword || '',
                date: new Date().toISOString(),
                platform: webhookPlatform || 'custom',
                credentials: {
                    storeUrl: webhookStoreUrl || '',
                    apiKey: webhookApiKey || ''
                }
            };

            const whRes = await fetch(centralWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!whRes.ok) {
                return NextResponse.json({ error: `Error del Webhook: ${whRes.statusText}` }, { status: whRes.status });
            }
            
            await postDoc.ref.update({ isPushedToSite: true, pushedAt: new Date().toISOString() });
            return NextResponse.json({ success: true, message: "Enviado al Webhook con éxito" });
        }

        return NextResponse.json({ error: "Tipo de integración inválido" }, { status: 400 });

    } catch (error: any) {
        console.error("Publish API Error:", error);
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}
