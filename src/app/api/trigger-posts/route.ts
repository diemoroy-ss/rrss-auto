export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { decrypt } from '../../../lib/encryption';
import { getQuotaUsageAdmin, getPlanLimitAdmin } from '../../../lib/quota-admin';

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

        if (!adminDb) {
            return NextResponse.json({ error: "Firebase Admin SDK not initialized" }, { status: 500 });
        }
        const now = new Date();

        const [snapPending, snapConfirmed] = await Promise.all([
            adminDb.collection("social_posts")
                .where("status", "==", "pending")
                .where("scheduledFor", "<=", now)
                .get(),
            adminDb.collection("social_posts")
                .where("status", "==", "confirmed")
                .where("scheduledFor", "<=", now)
                .get()
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

            const userSnap = await adminDb.collection("users").doc(uid).get();
            if (!userSnap.exists) continue;

            const userData = userSnap.data()!;
            
            // Multi-tenant profile resolution
            let targetProfile: any = null;
            const targetProfileId = profileId || 'default';
            if (Array.isArray(userData.profiles)) {
                targetProfile = userData.profiles.find((p: any) => p.id === targetProfileId);
            }
            
            // Si no se encontró el perfil o es 'default', usamos la data global del usuario (Legacy support)
            if (!targetProfile) {
                targetProfile = userData;
            }

            // --- QUOTA CHECK ---
            const cacheKey = `${uid}_${profileId || 'default'}`;
            if (userUsageCache[cacheKey] === undefined) {
                 userUsageCache[cacheKey] = await getQuotaUsageAdmin(uid, profileId || 'default');
            }
            
            const limit = await getPlanLimitAdmin(userData.plan || 'free', userData.email);
            const postNetworkCount = postData.networks?.length || 1;
            
            if (userUsageCache[cacheKey] + postNetworkCount > limit) {
                 // Mark as quota exceeded so it doesn't get picked up repeatedly
                  await adminDb.collection("social_posts").doc(postId).update({
                      status: 'quota_exceeded'
                  });
                 continue; // Skip this post
            }

            // Dedicate quota locally so next posts from same user in this loop also account for it
            userUsageCache[cacheKey] += postNetworkCount;
            // -------------------

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

            // Enviar todos los datos recolectados a n8n
            jobs.push({
                postId,
                userId: uid,
                profileId: profileId || 'default',
                copy: postData.postText || postData.copy || postData.idea || '',
                title: (postData.postText || postData.copy || postData.idea || '').slice(0, 150), // TikTok title max 150 chars
                type: postData.type || 'Post',
                networks: postData.networks || [],
                imageUrl: postData.imageUrl || '',
                videoUrl: postData.videoUrl || postData.imageUrl || '',
                // TikTok-specific compliance fields (Direct Post API requirements)
                tiktok_privacy_level: postData.tiktokPrivacyLevel || 'PUBLIC_TO_EVERYONE',
                tiktok_disable_duet: postData.tiktokAllowDuet !== undefined ? !postData.tiktokAllowDuet : false,
                tiktok_disable_comment: postData.tiktokAllowComment !== undefined ? !postData.tiktokAllowComment : false,
                tiktok_disable_stitch: postData.tiktokAllowStitch !== undefined ? !postData.tiktokAllowStitch : false,
                tiktok_content_disclosure: postData.tiktokContentDisclosure || false,
                tiktok_your_brand: postData.tiktokYourBrand || false,
                tiktok_branded_content: postData.tiktokBrandedContent || false,
                tiktok_is_aigc: postData.tiktokIsAigc || false,
                credentials
            });
            
            // Mark as processing so it doesn't get picked up again
            await adminDb.collection("social_posts").doc(postId).update({
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
