import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { decrypt } from '../../../lib/encryption';

// Helper function to fetch Meta Graph API with retry mechanism
async function fetchWithRetry(url: string, options: any, retries = 3, delay = 2000): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            const data = await res.json();
            if (data.error) {
                throw new Error(data.error.message || JSON.stringify(data.error));
            }
            return data;
        } catch (err: any) {
            console.warn(`[Story API Retry] Request to ${url} failed (attempt ${i + 1}/${retries}): ${err.message}`);
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 1.5;
        }
    }
}

export async function POST(req: Request) {
    try {
        const { postId } = await req.json();

        if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 });

        if (!adminDb) {
            return NextResponse.json({ error: "Firebase Admin SDK not initialized" }, { status: 500 });
        }
        const postRef = adminDb.collection("social_posts").doc(postId);
        const postSnap = await postRef.get();

        if (!postSnap.exists) return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });

        const post = postSnap.data()!;
        
        // Use post's imageUrl (or first item in imageUrls if it's a carousel)
        const imageUrl = post.imageUrl || (post.imageUrls && post.imageUrls[0]);
        if (!imageUrl) return NextResponse.json({ error: "La publicación no tiene ninguna imagen válida para compartir." }, { status: 400 });

        const uid = post.userId;
        const profileId = post.profileId;

        const userSnap = await adminDb.collection("users").doc(uid).get();
        if (!userSnap.exists) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

        const userData = userSnap.data()!;
        let targetProfile: any = null;
        const targetProfileId = profileId || 'default';
        if (Array.isArray(userData.profiles)) {
            targetProfile = userData.profiles.find((p: any) => p.id === targetProfileId);
        }
        if (!targetProfile) targetProfile = userData;

        let successNetworks = [];
        let errorLog = '';

        // 1. INSTAGRAM STORY
        if (post.networks?.includes('instagram')) {
            const igToken = targetProfile.instagramToken_enc || userData.instagramToken_enc;
            const ivIg = targetProfile.iv_ig || userData.iv_ig;
            const tagIg = targetProfile.tag_ig || userData.tag_ig;
            const igAccountId = targetProfile.instagramAccountId || userData.instagramAccountId;

            if (igToken && igAccountId) {
                try {
                    const plainToken = decrypt(igToken, ivIg, tagIg);

                    // A. Create Stories Container
                    const igMediaData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image_url: imageUrl,
                            media_type: 'STORIES',
                            access_token: plainToken
                        })
                    });

                    // B. Poll for Processing Status
                    let isReady = false;
                    for (let i = 0; i < 6; i++) {
                        const statusRes = await fetch(`https://graph.facebook.com/v19.0/${igMediaData.id}?fields=status_code&access_token=${plainToken}`);
                        const statusData = await statusRes.json();
                        if (statusData.status_code === 'FINISHED') {
                            isReady = true;
                            break;
                        } else if (statusData.status_code === 'ERROR') {
                            throw new Error("Meta falló al procesar la imagen de la Historia.");
                        }
                        await new Promise(r => setTimeout(r, 2000));
                    }
                    if (!isReady) throw new Error("Tiempo de espera agotado procesando la Historia.");

                    // C. Publish Stories Container
                    await fetchWithRetry(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            creation_id: igMediaData.id,
                            access_token: plainToken
                        })
                    });

                    successNetworks.push('instagram');
                } catch (e: any) {
                    console.error("[Story API] Instagram Story Error:", e.message);
                    errorLog += `Instagram: ${e.message}. `;
                }
            } else {
                errorLog += `Instagram: Token de acceso o cuenta vinculada faltante. `;
            }
        }

        // 2. FACEBOOK PAGE STORY
        if (post.networks?.includes('facebook')) {
            const fbToken = targetProfile.facebookToken_enc || userData.facebookToken_enc;
            const ivFb = targetProfile.iv_fb || userData.iv_fb;
            const tagFb = targetProfile.tag_fb || userData.tag_fb;
            const pageId = targetProfile.facebookPageId || userData.facebookPageId;

            if (fbToken && pageId) {
                try {
                    const plainToken = decrypt(fbToken, ivFb, tagFb);

                    // A. Upload photo as unpublished
                    const photoData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: imageUrl,
                            published: false,
                            access_token: plainToken
                        })
                    });

                    // B. Publish photo to Page Stories
                    await fetchWithRetry(`https://graph.facebook.com/v19.0/${pageId}/photo_stories`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            photo_id: photoData.id,
                            access_token: plainToken
                        })
                    });

                    successNetworks.push('facebook');
                } catch (e: any) {
                    console.error("[Story API] Facebook Story Error:", e.message);
                    errorLog += `Facebook: ${e.message}. `;
                }
            } else {
                errorLog += `Facebook: Token de acceso o página vinculada faltante. `;
            }
        }

        if (successNetworks.length > 0) {
            // Log successful story publication in Firestore post doc if desired
            await postRef.update({
                storyPublishedAt: new Date(),
                storyPublishError: errorLog || null
            });

            // Generar una nueva tarjeta (card) para la historia en la lista de publicaciones
            try {
                const storyPostData = {
                    userId: uid,
                    profileId: profileId || 'default',
                    idea: `Historia: ${post.idea || (post.copy ? post.copy.slice(0, 30) : 'Sin título')}`,
                    type: 'Historia',
                    carouselCount: 1,
                    businessType: post.businessType || '',
                    scheduledFor: new Date(),
                    networks: successNetworks,
                    status: 'published',
                    createdAt: new Date(),
                    publishedAt: new Date(),
                    publishedIn: successNetworks,
                    copy: post.postText || post.copy || '',
                    imageUrl: imageUrl,
                    generatedBy: post.generatedBy || 'manual',
                    isStoryShare: true,
                    parentPostId: postId
                };
                await adminDb.collection("social_posts").add(storyPostData);
                console.log(`[Story API] Successfully created post card for story ${postId}`);
            } catch (errDb: any) {
                console.error("[Story API] Error creating social_posts card for story:", errDb.message);
            }

            return NextResponse.json({ success: true, published: successNetworks, errors: errorLog || null });
        } else {
            return NextResponse.json({ error: errorLog || "No se pudo publicar la historia en ninguna red." }, { status: 500 });
        }

    } catch (e: any) {
        console.error("[Story API Global Error]:", e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
