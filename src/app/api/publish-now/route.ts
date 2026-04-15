import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { decrypt } from '../../../lib/encryption';
import { getQuotaUsage, getPlanLimit } from '../../../lib/quota';

export async function POST(req: Request) {
    try {
        const { postId } = await req.json();

        if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 });

        const postRef = doc(db, "social_posts", postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });

        const post = postSnap.data();
        
        if (!post.imageUrl) return NextResponse.json({ error: "Imagen no generada. Debes generar la multimedia primero." }, { status: 400 });

        const uid = post.userId;
        const profileId = post.profileId;

        const userSnap = await getDoc(doc(db, "users", uid));
        if (!userSnap.exists()) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

        const userData = userSnap.data();
        let targetProfile: any = null;
        if (profileId && profileId !== 'default' && Array.isArray(userData.profiles)) {
            targetProfile = userData.profiles.find((p: any) => p.id === profileId);
        }
        if (!targetProfile) targetProfile = userData;

        // --- QUOTA CHECK ---
        const usedQuota = await getQuotaUsage(uid, profileId || 'default');
        const limit = getPlanLimit(userData.plan || 'free');
        const postNetworkCount = post.networks?.length || 1;
        
        if (usedQuota + postNetworkCount > limit) {
             return NextResponse.json({ error: "Límite de publicaciones del plan alcanzado. Mejora tu plan para seguir publicando." }, { status: 403 });
        }
        // -------------------

        let successNetworks = [];
        let errorLog = '';

        const caption = post.copy || post.text || post.idea || '';
        const imageUrl = post.imageUrl;

        // FACEBOOK
        if (post.networks?.includes('facebook') && targetProfile.facebookToken_enc) {
            try {
                const plainToken = decrypt(targetProfile.facebookToken_enc, targetProfile.iv_fb, targetProfile.tag_fb);
                const pageId = targetProfile.facebookPageId;
                
                if (post.type === 'Carrusel' && post.imageUrls && post.imageUrls.length > 1) {
                    const attachedMedia = [];
                    for (const url of post.imageUrls) {
                        const photoRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                url: url,
                                published: false,
                                access_token: plainToken
                            })
                        });
                        const photoData = await photoRes.json();
                        if (photoData.error) throw new Error(photoData.error.message);
                        attachedMedia.push({ media_fbid: photoData.id });
                    }
                    
                    const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: caption,
                            attached_media: attachedMedia,
                            access_token: plainToken
                        })
                    });
                    const fbData = await fbRes.json();
                    if (fbData.error) throw new Error(fbData.error.message);
                    
                    await setDoc(doc(db, 'external_posts', fbData.id), {
                       userId: uid,
                       profileId: profileId || 'default',
                       network: 'facebook',
                       caption: caption,
                       media_type: 'CAROUSEL_ALBUM',
                       likes: 0,
                       comments: 0,
                       shares: 0,
                       reach: 0,
                       impressions: 0,
                       created_time: new Date().toISOString(),
                       timestamp: new Date()
                    });
                } else if (post.type === 'Reel') {
                    const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/videos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            file_url: imageUrl,
                            description: caption,
                            access_token: plainToken
                        })
                    });
                    const fbData = await fbRes.json();
                    if (fbData.error) throw new Error(fbData.error.message);
                    
                    await setDoc(doc(db, 'external_posts', fbData.id), {
                       userId: uid,
                       profileId: profileId || 'default',
                       network: 'facebook',
                       caption: caption,
                       media_type: 'VIDEO',
                       likes: 0,
                       comments: 0,
                       shares: 0,
                       reach: 0,
                       impressions: 0,
                       created_time: new Date().toISOString(),
                       timestamp: new Date()
                    });
                } else {
                    const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: imageUrl,
                            message: caption,
                            access_token: plainToken
                        })
                    });
                    const fbData = await fbRes.json();
                    if (fbData.error) throw new Error(fbData.error.message);
                    
                    await setDoc(doc(db, 'external_posts', fbData.id), {
                       userId: uid,
                       profileId: profileId || 'default',
                       network: 'facebook',
                       caption: caption,
                       media_type: 'POST',
                       likes: 0,
                       comments: 0,
                       shares: 0,
                       reach: 0,
                       impressions: 0,
                       created_time: new Date().toISOString(),
                       timestamp: new Date()
                    });
                }

                successNetworks.push('facebook');
            } catch (e: any) {
                console.error("FB Publish Error:", e.message);
                errorLog += `FB: ${e.message}. `;
            }
        }

        // INSTAGRAM
        if (post.networks?.includes('instagram') && targetProfile.instagramToken_enc) {
            try {
                const plainToken = decrypt(targetProfile.instagramToken_enc, targetProfile.iv_ig, targetProfile.tag_ig);
                const igAccountId = targetProfile.instagramAccountId;
                
                if (post.type === 'Carrusel' && post.imageUrls && post.imageUrls.length > 1) {
                    const childrenIds = [];
                    for (const url of post.imageUrls) {
                        const itemRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({
                               image_url: url,
                               is_carousel_item: true,
                               access_token: plainToken
                           })
                        });
                        const itemData = await itemRes.json();
                        if (itemData.error) throw new Error(itemData.error.message);
                        childrenIds.push(itemData.id);
                    }

                    const igMediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                           media_type: 'CAROUSEL',
                           children: childrenIds,
                           caption: caption,
                           access_token: plainToken
                        })
                    });
                    const igMediaData = await igMediaRes.json();
                    if (igMediaData.error) throw new Error(igMediaData.error.message);
                    
                    const igPubRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            creation_id: igMediaData.id,
                            access_token: plainToken
                        })
                    });
                    const igPubData = await igPubRes.json();
                    if (igPubData.error) throw new Error(igPubData.error.message);

                    await setDoc(doc(db, 'external_posts', igPubData.id), {
                       userId: uid,
                       profileId: profileId || 'default',
                       network: 'instagram',
                       caption: caption,
                       media_type: 'CAROUSEL',
                       likes: 0,
                       comments: 0,
                       shares: 0,
                       reach: 0,
                       impressions: 0,
                       created_time: new Date().toISOString(),
                       timestamp: new Date()
                    });
                } else if (post.type === 'Reel') {
                    // 1. Create Reels Container
                    const igMediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            video_url: imageUrl,
                            caption: caption,
                            media_type: 'REELS',
                            access_token: plainToken
                        })
                    });
                    const igMediaData = await igMediaRes.json();
                    if (igMediaData.error) throw new Error(igMediaData.error.message);
                    
                    // 2. Poll for Processing Status
                    let isReady = false;
                    for (let i = 0; i < 8; i++) { // Esperar hasta 40 segundos.
                        await new Promise(r => setTimeout(r, 5000));
                        const statusRes = await fetch(`https://graph.facebook.com/v19.0/${igMediaData.id}?fields=status_code&access_token=${plainToken}`);
                        const statusData = await statusRes.json();
                        if (statusData.status_code === 'FINISHED') {
                            isReady = true;
                            break;
                        } else if (statusData.status_code === 'ERROR') {
                            throw new Error("Instagram Graph API falló al procesar el video del Reel transcurrido.");
                        }
                    }
                    if (!isReady) throw new Error("Tiempo de espera agotado procesando el Reel de Instagram en los servidores de Meta.");

                    // 3. Publish Media
                    const igPubRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            creation_id: igMediaData.id,
                            access_token: plainToken
                        })
                    });
                    const igPubData = await igPubRes.json();
                    if (igPubData.error) throw new Error(igPubData.error.message);

                    await setDoc(doc(db, 'external_posts', igPubData.id), {
                       userId: uid,
                       profileId: profileId || 'default',
                       network: 'instagram',
                       caption: caption,
                       media_type: 'REELS',
                       likes: 0,
                       comments: 0,
                       shares: 0,
                       reach: 0,
                       impressions: 0,
                       created_time: new Date().toISOString(),
                       timestamp: new Date()
                    });
                } else {
                    const isStory = post.type?.toLowerCase().includes('stor') || post.type?.toLowerCase().includes('historia');
                    // 1. Create Media Container
                    const igMediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image_url: imageUrl,
                            caption: caption,
                            media_type: isStory ? 'STORIES' : 'IMAGE',
                            access_token: plainToken
                        })
                    });
                    const igMediaData = await igMediaRes.json();
                    if (igMediaData.error) throw new Error(igMediaData.error.message);
                    
                    // 2. Publish Media
                    const igPubRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            creation_id: igMediaData.id,
                            access_token: plainToken
                        })
                    });
                    const igPubData = await igPubRes.json();
                    if (igPubData.error) throw new Error(igPubData.error.message);

                    await setDoc(doc(db, 'external_posts', igPubData.id), {
                       userId: uid,
                       profileId: profileId || 'default',
                       network: 'instagram',
                       caption: caption,
                       media_type: isStory ? 'STORIES' : 'IMAGE',
                       likes: 0,
                       comments: 0,
                       shares: 0,
                       reach: 0,
                       impressions: 0,
                       created_time: new Date().toISOString(),
                       timestamp: new Date()
                    });
                }

                successNetworks.push('instagram');
            } catch (e: any) {
                console.error("IG Publish Error:", e.message);
                errorLog += `IG: ${e.message}. `;
            }
        }

        // LINKEDIN
        if (post.networks?.includes('linkedin') && targetProfile.linkedinToken_enc && targetProfile.linkedinPersonUrn) {
            try {
                const plainToken = decrypt(targetProfile.linkedinToken_enc, targetProfile.iv_li_token, targetProfile.tag_li_token);
                const personUrn = targetProfile.linkedinPersonUrn;
                
                let mediaAssetUrn = null;

                // Si hay imagen, tenemos que subirla a LinkedIn Assets
                if (imageUrl && !post.type?.toLowerCase().includes('reel')) {
                    // 1. Register Upload
                    const regRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${plainToken}`,
                            'Content-Type': 'application/json',
                            'X-Restli-Protocol-Version': '2.0.0'
                        },
                        body: JSON.stringify({
                          "registerUploadRequest": {
                            "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                            "owner": personUrn,
                            "serviceRelationships": [
                              {
                                "relationshipType": "OWNER",
                                "identifier": "urn:li:userGeneratedContent"
                              }
                            ]
                          }
                        })
                    });
                    const regData = await regRes.json();
                    
                    if (regData.value?.asset && regData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl) {
                        mediaAssetUrn = regData.value.asset;
                        const uploadUrl = regData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
                        
                        // 2. Download Image into memory
                        const imgRes = await fetch(imageUrl);
                        const imgBuffer = await imgRes.arrayBuffer();
                        
                        // 3. Upload Image to LinkedIn
                        const uploadRes = await fetch(uploadUrl, {
                            method: 'PUT',
                            headers: {
                                // Content-Type is empty or standard octet-stream for binary
                                'Authorization': `Bearer ${plainToken}`
                            },
                            body: imgBuffer
                        });
                        
                        if (!uploadRes.ok) {
                             throw new Error("Failed to upload image bytes to LinkedIn.");
                        }
                    }
                }

                // Prepare Share payload
                const sharePayload: any = {
                    "author": personUrn,
                    "lifecycleState": "PUBLISHED",
                    "specificContent": {
                        "com.linkedin.ugc.ShareContent": {
                            "shareCommentary": {
                                "text": caption
                            },
                            "shareMediaCategory": mediaAssetUrn ? "IMAGE" : "NONE"
                        }
                    },
                    "visibility": {
                        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                    }
                };

                if (mediaAssetUrn) {
                    sharePayload.specificContent["com.linkedin.ugc.ShareContent"].media = [
                        {
                            "status": "READY",
                            "description": { "text": caption },
                            "media": mediaAssetUrn,
                            "title": { "text": "Publicación de Santisoft" }
                        }
                    ];
                }

                // 4. Create Post
                const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${plainToken}`,
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    },
                    body: JSON.stringify(sharePayload)
                });
                const postData = await postRes.json();
                
                if (postData.error || postData.message) {
                    throw new Error(postData.message || postData.error);
                }

                successNetworks.push('linkedin');
                
                await setDoc(doc(db, 'external_posts', postData.id || `li_${Date.now()}`), {
                   userId: uid,
                   profileId: profileId || 'default',
                   network: 'linkedin',
                   caption: caption,
                   media_type: mediaAssetUrn ? 'IMAGE' : 'TEXT',
                   likes: 0,
                   comments: 0,
                   shares: 0,
                   reach: 0,
                   impressions: 0,
                   created_time: new Date().toISOString(),
                   timestamp: new Date()
                });
            } catch (e: any) {
                console.error("LI Publish Error:", e.message);
                errorLog += `LI: ${e.message}. `;
            }
        }

        if (successNetworks.length > 0) {
            await updateDoc(postRef, {
                status: 'published',
                publishedAt: new Date(),
                publishError: errorLog || null
            });
            return NextResponse.json({ success: true, published: successNetworks, errors: errorLog });
        } else {
            // Even if errors, don't necessarily abort the app entirely
            await updateDoc(postRef, {
                status: 'error',
                publishError: errorLog || 'No se pudo publicar en ninguna red'
            });
            return NextResponse.json({ error: errorLog || "Error desconocido al publicar" }, { status: 500 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
