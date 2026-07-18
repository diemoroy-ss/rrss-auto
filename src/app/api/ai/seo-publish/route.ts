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

        const { integrationType, wpUrl, wpUser, wpPassword, webhookUrl, webhookPlatform } = config;

        if (integrationType === 'wordpress' && (!wpUrl || !wpUser || !wpPassword)) {
            return NextResponse.json({ error: "Faltan credenciales de WordPress en la configuración" }, { status: 400 });
        }

        if (integrationType === 'webhook' && !webhookUrl) {
            return NextResponse.json({ error: "Falta la URL del Webhook en la configuración" }, { status: 400 });
        }

        // Fetch Blog Post
        const postDoc = await adminDb.collection('blog_posts').doc(postId).get();
        if (!postDoc.exists) {
            return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
        }

        const postData = postDoc.data()!;
        const title = postData.title || 'Sin Título';
        const content = postData.content || postData.htmlContent || ''; // Ensure there is content
        const status = 'draft'; // Always push as draft for safety initially

        // Publish based on integration
        if (integrationType === 'wordpress') {
            // WordPress REST API
            const baseUrl = wpUrl.replace(/\/$/, ''); // Remove trailing slash
            const endpoint = `${baseUrl}/wp-json/wp/v2/posts`;
            
            const authHeader = 'Basic ' + Buffer.from(`${wpUser}:${wpPassword}`).toString('base64');
            
            const wpRes = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({
                    title: title,
                    content: content,
                    status: status,
                })
            });

            if (!wpRes.ok) {
                const errData = await wpRes.text();
                console.error("WP Error:", errData);
                return NextResponse.json({ error: `Error de WordPress: ${wpRes.statusText}` }, { status: wpRes.status });
            }
            
            // Mark as published internally?
            await postDoc.ref.update({ isPushedToSite: true, pushedAt: new Date() });

            return NextResponse.json({ success: true, message: "Borrador enviado a WordPress con éxito" });

        } else if (integrationType === 'webhook') {
            // Generic Webhook
            const payload = {
                id: postId,
                title: title,
                htmlContent: content,
                metaDescription: postData.metaDescription || '',
                targetKeyword: postData.targetKeyword || '',
                date: new Date().toISOString(),
                platform: webhookPlatform || 'custom'
            };

            const whRes = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!whRes.ok) {
                return NextResponse.json({ error: `Error del Webhook: ${whRes.statusText}` }, { status: whRes.status });
            }
            
            await postDoc.ref.update({ isPushedToSite: true, pushedAt: new Date() });

            return NextResponse.json({ success: true, message: "Enviado al Webhook con éxito" });
        }

        return NextResponse.json({ error: "Tipo de integración inválido" }, { status: 400 });

    } catch (error: any) {
        console.error("Publish API Error:", error);
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}
