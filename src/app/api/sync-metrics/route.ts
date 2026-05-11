import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { decrypt } from '../../../lib/encryption';

export async function POST(req: Request) {
    try {
        const { userId, profileId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const targetProfileId = profileId || 'default';

        // 1. Get user data for tokens
        const userSnap = await getDoc(doc(db, "users", userId));
        if (!userSnap.exists()) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const userData = userSnap.data();
        let targetProfile: any = null;
        if (Array.isArray(userData.profiles)) {
            targetProfile = userData.profiles.find((p: any) => p.id === targetProfileId);
        }
        if (!targetProfile) targetProfile = userData;

        // Decrypt tokens
        const fbTokenEnc = targetProfile.facebookToken_enc || userData.facebookToken_enc;
        const ivFb = targetProfile.iv_fb || userData.iv_fb;
        const tagFb = targetProfile.tag_fb || userData.tag_fb;
        const fbToken = fbTokenEnc ? decrypt(fbTokenEnc, ivFb, tagFb) : null;
        const pageId = targetProfile.facebookPageId || userData.facebookPageId;

        const igTokenEnc = targetProfile.instagramToken_enc || userData.instagramToken_enc;
        const ivIg = targetProfile.iv_ig || userData.iv_ig;
        const tagIg = targetProfile.tag_ig || userData.tag_ig;
        const igToken = igTokenEnc ? decrypt(igTokenEnc, ivIg, tagIg) : null;
        const igAccountId = targetProfile.instagramAccountId || userData.instagramAccountId;

        let syncedCount = 0;

        // 2. Fetch Facebook Published Posts (direct from Facebook Page)
        if (fbToken && pageId) {
            try {
                console.log(`[Sync Metrics] Fetching latest FB posts for page ${pageId}`);
                const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/published_posts?fields=id,message,created_time,shares,likes.summary(true),comments.summary(true)&access_token=${fbToken}&limit=20`);
                const fbData = await fbRes.json();

                if (fbData && Array.isArray(fbData.data)) {
                    for (const post of fbData.data) {
                        const postId = post.id;
                        let likes = post.likes?.summary?.total_count ?? 0;
                        let comments = post.comments?.summary?.total_count ?? 0;
                        let shares = post.shares?.count ?? 0;
                        let reach = 0;
                        let impressions = 0;

                        // Fetch insights for this post
                        try {
                            const insightRes = await fetch(`https://graph.facebook.com/v19.0/${postId}/insights?metric=post_impressions,post_impressions_unique&access_token=${fbToken}`);
                            const insightData = await insightRes.json();
                            if (Array.isArray(insightData.data)) {
                                const impItem = insightData.data.find((item: any) => item.name === 'post_impressions');
                                const reachItem = insightData.data.find((item: any) => item.name === 'post_impressions_unique');

                                impressions = impItem?.values?.[0]?.value ?? 0;
                                reach = reachItem?.values?.[0]?.value ?? 0;
                            }
                        } catch (e) {
                            console.error(`FB Insights Error for post ${postId}:`, e);
                        }

                        // Upsert into Firestore (external_posts)
                        await setDoc(doc(db, "external_posts", postId), {
                            userId,
                            profileId: targetProfileId,
                            network: 'facebook',
                            caption: post.message || '',
                            media_type: 'POST',
                            likes,
                            comments,
                            shares,
                            reach,
                            impressions,
                            created_time: post.created_time,
                            timestamp: new Date(post.created_time),
                            lastSyncedAt: new Date()
                        }, { merge: true });

                        syncedCount++;
                    }
                } else if (fbData.error) {
                    console.error("[Sync Metrics] FB API returned error:", fbData.error);
                }
            } catch (e) {
                console.error("[Sync Metrics] FB Fetch failed:", e);
            }
        }

        // 3. Fetch Instagram Media Posts (direct from Instagram Business Account)
        if (igToken && igAccountId) {
            try {
                console.log(`[Sync Metrics] Fetching latest IG media for account ${igAccountId}`);
                const igRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?fields=id,caption,timestamp,media_type,like_count,comments_count&access_token=${igToken}&limit=20`);
                const igData = await igRes.json();

                if (igData && Array.isArray(igData.data)) {
                    for (const media of igData.data) {
                        const mediaId = media.id;
                        let likes = media.like_count ?? 0;
                        let comments = media.comments_count ?? 0;
                        let reach = 0;
                        let impressions = 0;

                        // Fetch insights for this media
                        try {
                            const insightRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}/insights?metric=reach,impressions&access_token=${igToken}`);
                            const insightData = await insightRes.json();
                            if (Array.isArray(insightData.data)) {
                                const reachItem = insightData.data.find((item: any) => item.name === 'reach');
                                const impItem = insightData.data.find((item: any) => item.name === 'impressions');

                                reach = reachItem?.values?.[0]?.value ?? 0;
                                impressions = impItem?.values?.[0]?.value ?? 0;
                            }
                        } catch (e) {
                            console.error(`IG Insights Error for media ${mediaId}:`, e);
                        }

                        // Upsert into Firestore (external_posts)
                        await setDoc(doc(db, "external_posts", mediaId), {
                            userId,
                            profileId: targetProfileId,
                            network: 'instagram',
                            caption: media.caption || '',
                            media_type: media.media_type || 'POST',
                            likes,
                            comments,
                            shares: 0,
                            reach,
                            impressions,
                            created_time: media.timestamp,
                            timestamp: new Date(media.timestamp),
                            lastSyncedAt: new Date()
                        }, { merge: true });

                        syncedCount++;
                    }
                } else if (igData.error) {
                    console.error("[Sync Metrics] IG API returned error:", igData.error);
                }
            } catch (e) {
                console.error("[Sync Metrics] IG Fetch failed:", e);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Sincronización finalizada. Se sincronizaron e importaron un total de ${syncedCount} publicaciones de Facebook e Instagram.` 
        });

    } catch (e: any) {
        console.error("Sync Metrics endpoint failed:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
