import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase'; // We need admin sdk or just regular client if rules allow
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { decrypt } from '../../../lib/encryption';
import { getQuotaUsage, getPlanLimit } from '../../../lib/quota';

// This endpoint is meant to be called by N8N on a cron schedule (e.g. every 5 minutes)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('secret');

        // Simple protection against random people calling this endpoint
        const cronSecret = process.env.CRON_SECRET || 'santisoft-n8n-cron-key-123';
        if (secret !== cronSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();

        // Warning: Firebase Client SDK in Node environment might hit permission errors 
        // if your Firestore security rules block unauthenticated reads to 'social_posts' and 'users'.
        // For this API to work WITHOUT Firebase Admin SDK, rules must be somewhat open or 
        // we must use the REST API with a Service Account/API Key.
        // Fetch both pending and confirmed posts scheduled for now or earlier
        const qPending = query(
            collection(db, "social_posts"), 
            where("status", "==", "pending"),
            where("scheduledFor", "<=", now)
        );
        const qConfirmed = query(
            collection(db, "social_posts"), 
            where("status", "==", "confirmed"),
            where("scheduledFor", "<=", now)
        );

        const [snapPending, snapConfirmed] = await Promise.all([
            getDocs(qPending),
            getDocs(qConfirmed)
        ]);
        
        const allDocs = [...snapPending.docs, ...snapConfirmed.docs];
        const jobs: any[] = [];
        
        // Cache to avoid querying quota multiple times per user/profile in a single run
        const userUsageCache: Record<string, number> = {};

        for (const postDoc of allDocs) {
            const postData = postDoc.data();
            const postId = postDoc.id;
            const uid = postData.userId;
            const profileId = postData.profileId;

            if (!uid) continue;

            const userSnap = await getDoc(doc(db, "users", uid));
            if (!userSnap.exists()) continue;

            const userData = userSnap.data();
            
            // Multi-tenant profile resolution
            let targetProfile: any = null;
            if (profileId && profileId !== 'default' && Array.isArray(userData.profiles)) {
                targetProfile = userData.profiles.find((p: any) => p.id === profileId);
            }
            
            // Si no se encontró el perfil o es 'default', usamos la data global del usuario (Legacy support)
            if (!targetProfile) {
                targetProfile = userData;
            }

            // --- QUOTA CHECK ---
            const cacheKey = `${uid}_${profileId || 'default'}`;
            if (userUsageCache[cacheKey] === undefined) {
                 userUsageCache[cacheKey] = await getQuotaUsage(uid, profileId || 'default');
            }
            
            const limit = getPlanLimit(userData.plan || 'free');
            const postNetworkCount = postData.networks?.length || 1;
            
            if (userUsageCache[cacheKey] + postNetworkCount > limit) {
                 // Mark as quota exceeded so it doesn't get picked up repeatedly
                 await updateDoc(doc(db, "social_posts", postId), {
                     status: 'quota_exceeded'
                 });
                 continue; // Skip this post
            }

            // Dedicate quota locally so next posts from same user in this loop also account for it
            userUsageCache[cacheKey] += postNetworkCount;
            // -------------------

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

            // Enviar todos los datos recolectados a n8n
            jobs.push({
                postId,
                userId: uid,
                profileId: profileId || 'default',
                copy: postData.copy || postData.idea || '',
                type: postData.type || 'Post', // 'Post', 'Historia', 'Carrusel', etc.
                networks: postData.networks || [],
                credentials
            });
            
            // Mark as processing so it doesn't get picked up again
            // N8N MUST call POST /api/trigger-posts/status to mark as completed
            await updateDoc(doc(db, "social_posts", postId), {
                status: 'processing'
            });
        }

        return NextResponse.json({ 
            success: true, 
            jobsCount: jobs.length,
            jobs 
        });

    } catch (error: any) {
        console.error("Cron Trigger Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
