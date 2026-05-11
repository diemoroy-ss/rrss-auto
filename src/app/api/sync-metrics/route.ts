import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
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

        const igTokenEnc = targetProfile.instagramToken_enc || userData.instagramToken_enc;
        const ivIg = targetProfile.iv_ig || userData.iv_ig;
        const tagIg = targetProfile.tag_ig || userData.tag_ig;
        const igToken = igTokenEnc ? decrypt(igTokenEnc, ivIg, tagIg) : null;

        // 2. Fetch external posts from Firestore
        const postsQuery = query(
            collection(db, "external_posts"),
            where("userId", "==", userId),
            where("profileId", "==", targetProfileId)
        );
        const postsSnap = await getDocs(postsQuery);

        if (postsSnap.empty) {
            return NextResponse.json({ success: true, message: "No hay publicaciones registradas para sincronizar." });
        }

        // Parse posts and sort by timestamp/created_time descending in memory
        const posts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        posts.sort((a: any, b: any) => {
            const dateA = a.timestamp ? (a.timestamp.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime()) : 0;
            const dateB = b.timestamp ? (b.timestamp.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime()) : 0;
            return dateB - dateA;
        });

        // Limit to latest 30 posts to avoid rate limit or slow response
        const postsToSync = posts.slice(0, 30);

        let syncedCount = 0;

        for (const post of postsToSync) {
            const postId = post.id;
            const network = post.network;

            let likes = post.likes || 0;
            let comments = post.comments || 0;
            let shares = post.shares || 0;
            let reach = post.reach || 0;
            let impressions = post.impressions || 0;
            let updated = false;

            if (network === 'facebook' && fbToken) {
                try {
                    // Fetch likes, comments, shares
                    const res = await fetch(`https://graph.facebook.com/v19.0/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${fbToken}`);
                    const data = await res.json();

                    if (!data.error) {
                        likes = data.likes?.summary?.total_count ?? likes;
                        comments = data.comments?.summary?.total_count ?? comments;
                        shares = data.shares?.count ?? shares;
                        updated = true;
                    }

                    // Fetch insights (reach, impressions) in a nested try-catch
                    try {
                        const insightRes = await fetch(`https://graph.facebook.com/v19.0/${postId}/insights?metric=post_impressions,post_impressions_unique&access_token=${fbToken}`);
                        const insightData = await insightRes.json();
                        if (Array.isArray(insightData.data)) {
                            const impItem = insightData.data.find((item: any) => item.name === 'post_impressions');
                            const reachItem = insightData.data.find((item: any) => item.name === 'post_impressions_unique');

                            impressions = impItem?.values?.[0]?.value ?? impressions;
                            reach = reachItem?.values?.[0]?.value ?? reach;
                        }
                    } catch (e) {
                        console.error(`FB Insights Error for post ${postId}:`, e);
                    }
                } catch (e) {
                    console.error(`FB Sync Error for post ${postId}:`, e);
                }
            } else if (network === 'instagram' && igToken) {
                try {
                    // Fetch likes and comments
                    const res = await fetch(`https://graph.facebook.com/v19.0/${postId}?fields=like_count,comments_count&access_token=${igToken}`);
                    const data = await res.json();

                    if (!data.error) {
                        likes = data.like_count ?? likes;
                        comments = data.comments_count ?? comments;
                        updated = true;
                    }

                    // Fetch insights (reach, impressions) in a nested try-catch
                    try {
                        const insightRes = await fetch(`https://graph.facebook.com/v19.0/${postId}/insights?metric=reach,impressions&access_token=${igToken}`);
                        const insightData = await insightRes.json();
                        if (Array.isArray(insightData.data)) {
                            const reachItem = insightData.data.find((item: any) => item.name === 'reach');
                            const impItem = insightData.data.find((item: any) => item.name === 'impressions');

                            reach = reachItem?.values?.[0]?.value ?? reach;
                            impressions = impItem?.values?.[0]?.value ?? impressions;
                        }
                    } catch (e) {
                        console.error(`IG Insights Error for post ${postId}:`, e);
                    }
                } catch (e) {
                    console.error(`IG Sync Error for post ${postId}:`, e);
                }
            }

            if (updated) {
                await updateDoc(doc(db, "external_posts", postId), {
                    likes,
                    comments,
                    shares,
                    reach,
                    impressions,
                    lastSyncedAt: new Date()
                });
                syncedCount++;
            }
        }

        return NextResponse.json({ success: true, message: `Sincronización finalizada. Se actualizaron ${syncedCount} publicaciones.` });

    } catch (e: any) {
        console.error("Sync Metrics endpoint failed:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
