import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { decrypt } from '../../../../lib/encryption';
import { getQuotaUsageAdmin, getPlanLimitAdmin } from '../../../../lib/quota-admin';

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
        const targetProfileId = profileId || 'default';
        if (Array.isArray(userData.profiles)) {
            targetProfile = userData.profiles.find((p: any) => p.id === targetProfileId);
        }
        
        if (!targetProfile) {
            targetProfile = userData;
        }

        // --- QUOTA CHECK ---
        const usage = await getQuotaUsageAdmin(uid, profileId || 'default');
        const limit = await getPlanLimitAdmin(userData.plan || 'free');
        const postNetworkCount = postData.networks?.length || 1;
        
        if (usage + postNetworkCount > limit) {
             // Mark as quota exceeded
             await postRef.update({ status: 'quota_exceeded' });
             console.log(`[GCP EXECUTE] User ${uid} exceeded quota. Marking post ${postId} as failed.`);
             return NextResponse.json({ error: "Quota exceeded" }, { status: 403 });
        }

        const credentials: any = {};

        // Decrypt Facebook
        const fbToken = targetProfile.facebookToken_enc || userData.facebookToken_enc;
        const ivFb = targetProfile.iv_fb || userData.iv_fb;
        const tagFb = targetProfile.tag_fb || userData.tag_fb;
        const pageId = targetProfile.facebookPageId || userData.facebookPageId;

        if (postData.networks?.includes('facebook') && fbToken) {
            try {
                const plainToken = decrypt(fbToken, ivFb, tagFb);
                credentials.facebook = {
                    token: plainToken,
                    pageId: pageId
                };
            } catch(e) { console.error("Error decrypting FB", e); }
        }

        // Decrypt Instagram
        const igToken = targetProfile.instagramToken_enc || userData.instagramToken_enc;
        const ivIg = targetProfile.iv_ig || userData.iv_ig;
        const tagIg = targetProfile.tag_ig || userData.tag_ig;
        const igAccountId = targetProfile.instagramAccountId || userData.instagramAccountId;

        if (postData.networks?.includes('instagram') && igToken) {
            try {
                const plainToken = decrypt(igToken, ivIg, tagIg);
                credentials.instagram = {
                    token: plainToken,
                    accountId: igAccountId
                };
            } catch(e) { console.error("Error decrypting IG", e); }
        }

        // Decrypt TikTok
        const ttToken = targetProfile.tiktokToken_enc || userData.tiktokToken_enc;
        const ivTt = targetProfile.iv_tt || userData.iv_tt;
        const tagTt = targetProfile.tag_tt || userData.tag_tt;
        const ttOpenId = targetProfile.tiktokOpenId || userData.tiktokOpenId;

        if (postData.networks?.includes('tiktok') && ttToken) {
            try {
                const plainToken = decrypt(ttToken, ivTt, tagTt);
                credentials.tiktok = {
                    token: plainToken,
                    openId: ttOpenId
                };
            } catch(e) { console.error("Error decrypting TT", e); }
        }

        // Decrypt Google Business
        const gbToken = targetProfile.googleBusinessToken_enc || userData.googleBusinessToken_enc;
        const ivGb = targetProfile.iv_gb || userData.iv_gb;
        const tagGb = targetProfile.tag_gb || userData.tag_gb;

        if (postData.networks?.includes('googleBusiness') && gbToken) {
            try {
                const plainToken = decrypt(gbToken, ivGb, tagGb);
                credentials.googleBusiness = {
                    token: plainToken
                };
            } catch(e) { console.error("Error decrypting GB", e); }
        }

        // Enviar a N8N
        const n8nPayload = {
            postId,
            userId: uid,
            profileId: profileId || 'default',
            copy: postData.copy || postData.idea || '',
            title: (postData.copy || postData.idea || '').slice(0, 150), // TikTok title max 150 chars
            type: postData.type || 'Post',
            networks: postData.networks || [],
            imageUrl: postData.imageUrl || '',
            videoUrl: postData.videoUrl || postData.imageUrl || '',
            // TikTok-specific compliance fields (Direct Post API requirements)
            tiktok_privacy_level: 'PUBLIC_TO_EVERYONE',
            tiktok_disable_duet: false,
            tiktok_disable_comment: false,
            tiktok_disable_stitch: false,
            credentials
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
