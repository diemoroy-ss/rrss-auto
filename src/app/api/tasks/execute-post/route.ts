import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { decrypt } from '../../../../lib/encryption';
import { getQuotaUsage, getPlanLimit } from '../../../../lib/quota';

/**
 * Este endpoint es llamado secretamente por Google Cloud Tasks
 * para publicar un post a N8N en un instante exacto.
 */
export async function POST(req: Request) {
    try {
        // Validación de Seguridad
        const authHeader = req.headers.get('Authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'santisoft-n8n-cron-key-123'}`;
        
        if (authHeader !== expectedAuth) {
            console.error("[GCP EXECUTE] Unauthorized request received");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { postId } = body;

        if (!postId) {
            return NextResponse.json({ error: "No postId provided" }, { status: 400 });
        }

        console.log(`[GCP EXECUTE] Initiating execution for post ${postId}`);

        // Buscar el post en base de datos
        const postRef = adminDb.collection('social_posts').doc(postId);
        const postSnap = await postRef.get();

        if (!postSnap.exists) {
            console.log(`[GCP EXECUTE] Post ${postId} no longer exists. Aborting.`);
            return NextResponse.json({ message: "Post not found, skipping." });
        }

        const postData = postSnap.data()!;
        
        // Solo permitimos la publicación automática de posts 'confirmed'
        // Si el post está en 'pending', es un borrador y no debe publicarse.
        if (postData.status !== 'confirmed') {
            console.log(`[GCP EXECUTE] Post ${postId} is in status '${postData.status}'. Skipping.`);
            return NextResponse.json({ message: "Post is not confirmed. Skipping auto-publish." });
        }

        // Si el post fue reagendado, la fecha programada será en el futuro respecto a esta tarea obsoleta.
        const scheduledTime = postData.scheduledFor?.toDate().getTime() || 0;
        const now = Date.now();
        if (scheduledTime - now > 2 * 60 * 1000) { // Tolerancia de 2 minutos
            console.log(`[GCP EXECUTE] Post ${postId} was rescheduled for ${new Date(scheduledTime).toISOString()}. Skipping old obsolete task.`);
            return NextResponse.json({ message: "Task is obsolete, post was rescheduled." });
        }

        const uid = postData.userId;
        const profileId = postData.profileId;

        // Fetch User
        const userRef = adminDb.collection('users').doc(uid);
        const userSnap = await userRef.get();
        
        if (!userSnap.exists) {
            console.log(`[GCP EXECUTE] User ${uid} for post ${postId} not found. Aborting.`);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userSnap.data()!;

        // Multi-tenant profile resolution
        let targetProfile: any = null;
        if (profileId && Array.isArray(userData.profiles)) {
            targetProfile = userData.profiles.find((p: any) => p.id === profileId);
        }
        
        if (!targetProfile) {
            targetProfile = userData;
        }

        // --- QUOTA CHECK ---
        const usage = await getQuotaUsage(uid, profileId || 'default');
        const limit = await getPlanLimit(userData.plan || 'free');
        const postNetworkCount = postData.networks?.length || 1;
        
        if (usage + postNetworkCount > limit) {
             // Mark as quota exceeded
             await postRef.update({ status: 'quota_exceeded' });
             console.log(`[GCP EXECUTE] User ${uid} exceeded quota. Marking post ${postId} as failed.`);
             return NextResponse.json({ error: "Quota exceeded" }, { status: 403 });
        }

        const credentials: any = {};

        // Decrypt Facebook
        if (postData.networks?.includes('facebook') && targetProfile.facebookToken_enc) {
            try {
                const plainToken = decrypt(targetProfile.facebookToken_enc, targetProfile.iv_fb, targetProfile.tag_fb);
                credentials.facebook = {
                    token: plainToken,
                    pageId: targetProfile.facebookPageId
                };
            } catch(e) { console.error("Error decrypting FB", e); }
        }

        // Decrypt Instagram
        if (postData.networks?.includes('instagram') && targetProfile.instagramToken_enc) {
            try {
                const plainToken = decrypt(targetProfile.instagramToken_enc, targetProfile.iv_ig, targetProfile.tag_ig);
                credentials.instagram = {
                    token: plainToken,
                    accountId: targetProfile.instagramAccountId
                };
            } catch(e) { console.error("Error decrypting IG", e); }
        }

        // Enviar a N8N
        const n8nPayload = {
            postId,
            userId: uid,
            profileId: profileId || 'default',
            copy: postData.copy || postData.idea || '',
            type: postData.type || 'Post', // 'Post', 'Historia', 'Carrusel', etc.
            networks: postData.networks || [],
            credentials
            // Optional: attach mediaUrl if they pre-generated it
        };

        const WEBHOOK_URL = 'https://n8n.santisoft.cl/webhook-test/auto-rrss-post'; // Asumiendo este es el nuevo nombre del webhook para posts
        // Wait, what webhook URL were they using before? 
        // In `/api/trigger-posts`, N8N just called the API and the API replied with JSON array.
        // There wasn't an explicit N8N webhook hit from the API, N8N pulled it.
        // So I must push directly to an execution webhook in N8N now!
        
        // Vamos a asumir que el cliente configurará el Webhook con esta URL en N8N
        const N8N_TARGET = process.env.N8N_POST_WEBHOOK_URL || 'https://n8n.santisoft.cl/webhook-test/auto-rrss-post';

        console.log(`[GCP EXECUTE] Sending payload to N8N: ${N8N_TARGET}`);
        const n8nResp = await fetch(N8N_TARGET, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Santisoft-Secret': process.env.CRON_SECRET || 'santisoft-n8n-cron-key-123'
            },
            body: JSON.stringify(n8nPayload)
        });

        if (!n8nResp.ok) {
            console.error(`[GCP EXECUTE] N8N returned ${n8nResp.status}`);
            return NextResponse.json({ error: "N8N Error" }, { status: 500 });
        }

        // Marcar el post como "processing" para que en la UI se vea amarillo
        await postRef.update({ status: 'processing' });
        
        console.log(`[GCP EXECUTE] Success. Post ${postId} marked as processing.`);
        return NextResponse.json({ success: true, message: "Pushed to N8N" });

    } catch (error: any) {
        console.error("[GCP EXECUTE] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
