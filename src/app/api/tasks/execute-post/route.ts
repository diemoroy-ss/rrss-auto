import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { getQuotaUsageAdmin, getPlanLimitAdmin } from '../../../../lib/quota-admin';

/**
 * Este endpoint es llamado secretamente por Google Cloud Tasks
 * para publicar un post a N8N en un instante exacto.
 */
export async function POST(req: Request) {
    try {
        // Validación de Seguridad
        const authHeader = req.headers.get('Authorization');
        const cronSecret = process.env.CRON_SECRET;
        
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
            await adminDb.collection("admin_logs").add({
                timestamp: new Date(), action: 'execute_post_skipped', postId,
                status: 'skipped', message: `Omitido: el post estaba en estado ${postData.status} (no confirmado)`
            });
            return NextResponse.json({ message: "Post is not confirmed. Skipping auto-publish." });
        }

        const scheduledTime = postData.scheduledFor?.toDate().getTime() || 0;
        const now = Date.now();
        if (scheduledTime - now > 2 * 60 * 1000) { // Tolerancia de 2 minutos
            console.log(`[GCP EXECUTE] Post ${postId} was rescheduled for ${new Date(scheduledTime).toISOString()}. Skipping old obsolete task.`);
            await adminDb.collection("admin_logs").add({
                timestamp: new Date(), action: 'execute_post_skipped', postId,
                status: 'skipped', message: `Omitido: Tarea obsoleta, el post fue reagendado para el futuro.`
            });
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
        const limit = await getPlanLimitAdmin(userData.plan || 'free', userData.email);
        const postNetworkCount = postData.networks?.length || 1;
        
        if (usage + postNetworkCount > limit) {
             // Mark as quota exceeded
             await postRef.update({ status: 'quota_exceeded' });
             console.log(`[GCP EXECUTE] User ${uid} exceeded quota. Marking post ${postId} as failed.`);
             await adminDb.collection("admin_logs").add({
                timestamp: new Date(), action: 'execute_post_failed', postId, userId: uid,
                clientEmail: userData.email || 'Desconocido', postType: postData.type || 'Desconocido',
                status: 'error', message: `Falló: Cuota excedida (uso: ${usage}, límite: ${limit})`
             });
             return NextResponse.json({ error: "Quota exceeded" }, { status: 403 });
        }

        // Reenviar la petición de publicación al endpoint nativo de la App
        // Esto elimina por completo la necesidad de N8N
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const publishUrl = `${protocol}://${host}/api/publish-now`;

        console.log(`[GCP EXECUTE] Forwarding post ${postId} to native API: ${publishUrl}`);
        
        const publishRes = await fetch(publishUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cronSecret}`
            },
            body: JSON.stringify({ postId })
        });

        if (!publishRes.ok) {
            const errBody = await publishRes.text();
            console.error(`[GCP EXECUTE] Native Publish API failed: ${errBody}`);
            return NextResponse.json({ error: "Native Publish Failed" }, { status: 500 });
        }

        console.log(`[GCP EXECUTE] Success. Post ${postId} handed over to native publishing pipeline.`);
        return NextResponse.json({ success: true, message: "Handed over to native publish API" });

    } catch (error: any) {
        console.error("[GCP EXECUTE] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
