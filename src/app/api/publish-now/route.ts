import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { decrypt } from '../../../lib/encryption';
import { getQuotaUsageAdmin, getPlanLimitAdmin } from '../../../lib/quota-admin';

// Helper function to fetch Meta Graph API with retry mechanism to handle transient errors
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
            console.warn(`[API Retry] Request to ${url} failed (attempt ${i + 1}/${retries}): ${err.message}`);
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 1.5; // Exponential backoff
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

        const post = postSnap.data();
        
        if (!post.imageUrl) return NextResponse.json({ error: "Imagen no generada. Debes generar la multimedia primero." }, { status: 400 });

        const uid = post.userId;
        const profileId = post.profileId;

        const userSnap = await adminDb.collection("users").doc(uid).get();
        if (!userSnap.exists) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

        const userData = userSnap.data();
        let targetProfile: any = null;
        const targetProfileId = profileId || 'default';
        if (Array.isArray(userData.profiles)) {
            targetProfile = userData.profiles.find((p: any) => p.id === targetProfileId);
        }
        if (!targetProfile) targetProfile = userData;

        // --- QUOTA CHECK ---
        const usedQuota = await getQuotaUsageAdmin(uid, profileId || 'default');
        const limit = await getPlanLimitAdmin(userData.plan || 'free');
        const postNetworkCount = post.networks?.length || 1;
        
        if (usedQuota + postNetworkCount > limit) {
             return NextResponse.json({ error: "Límite de publicaciones del plan alcanzado. Mejora tu plan para seguir publicando." }, { status: 403 });
        }
        // -------------------

        let successNetworks = [];
        let errorLog = '';
        let infoLog = '';

        const caption = post.copy || post.text || post.idea || '';
        const imageUrl = post.imageUrl;

        if (!post.networks || post.networks.length === 0) {
            errorLog += "No se seleccionó ninguna red social para publicar. ";
        }

        // FACEBOOK
        if (post.networks?.includes('facebook')) {
            const fbToken = targetProfile.facebookToken_enc || userData.facebookToken_enc;
            const ivFb = targetProfile.iv_fb || userData.iv_fb;
            const tagFb = targetProfile.tag_fb || userData.tag_fb;
            const pageId = targetProfile.facebookPageId || userData.facebookPageId;

            if (fbToken) {
                try {
                    const plainToken = decrypt(fbToken, ivFb, tagFb);
                    
                    if (post.type === 'Carrusel' && post.imageUrls && post.imageUrls.length > 1) {
                        const attachedMedia = [];
                        for (const url of post.imageUrls) {
                            const photoData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    url: url,
                                    published: false,
                                    access_token: plainToken
                                })
                            });
                            attachedMedia.push({ media_fbid: photoData.id });
                        }
                        
                        const fbData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                message: caption,
                                attached_media: attachedMedia,
                                access_token: plainToken
                            })
                        });
                        
                        await adminDb.collection('external_posts').doc(fbData.id).set({
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
                        const fbData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${pageId}/videos`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                file_url: imageUrl,
                                description: caption,
                                access_token: plainToken
                            })
                        });
                        
                        await adminDb.collection('external_posts').doc(fbData.id).set({
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
                        const fbData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                url: imageUrl,
                                message: caption,
                                access_token: plainToken
                            })
                        });
                        
                        await adminDb.collection('external_posts').doc(fbData.id).set({
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
            } else {
                errorLog += `Facebook: Cuenta no vinculada o token faltante. `;
            }
        }

        // INSTAGRAM
        if (post.networks?.includes('instagram')) {
            const igToken = targetProfile.instagramToken_enc || userData.instagramToken_enc;
            const ivIg = targetProfile.iv_ig || userData.iv_ig;
            const tagIg = targetProfile.tag_ig || userData.tag_ig;
            const igAccountId = targetProfile.instagramAccountId || userData.instagramAccountId;

            if (igToken) {
                try {
                    const plainToken = decrypt(igToken, ivIg, tagIg);
                    
                    if (post.type === 'Carrusel' && post.imageUrls && post.imageUrls.length > 1) {
                        const childrenIds = [];
                        for (const url of post.imageUrls) {
                            const itemData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({
                                   image_url: url,
                                   is_carousel_item: true,
                                   access_token: plainToken
                               })
                            });
                            childrenIds.push(itemData.id);
                        }

                        const igMediaData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                               media_type: 'CAROUSEL',
                               children: childrenIds,
                               caption: caption,
                               access_token: plainToken
                            })
                        });
                        
                        const igPubData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                creation_id: igMediaData.id,
                                access_token: plainToken
                            })
                        });

                        await adminDb.collection('external_posts').doc(igPubData.id).set({
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
                        const igMediaData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                video_url: imageUrl,
                                caption: caption,
                                media_type: 'REELS',
                                access_token: plainToken
                            })
                        });
                        
                        // 2. Poll for Processing Status (Wait up to 60 seconds)
                        let isReady = false;
                        for (let i = 0; i < 12; i++) { // Esperar hasta 60 segundos.
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
                        const igPubData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                creation_id: igMediaData.id,
                                access_token: plainToken
                            })
                        });

                        await adminDb.collection('external_posts').doc(igPubData.id).set({
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
                        
                        const containerBody: any = {
                            image_url: imageUrl,
                            access_token: plainToken
                        };

                        if (isStory) {
                            containerBody.media_type = 'STORIES';
                        } else if (caption) {
                            containerBody.caption = caption;
                        }

                        // 1. Create Media Container
                        const igMediaData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(containerBody)
                        });
                        
                        // 2. Poll for Processing Status (Ensures Meta has downloaded the image - Wait up to 30 seconds)
                        let isReady = false;
                        for (let i = 0; i < 15; i++) { // Esperar hasta 30 segundos.
                            const statusRes = await fetch(`https://graph.facebook.com/v19.0/${igMediaData.id}?fields=status_code&access_token=${plainToken}`);
                            const statusData = await statusRes.json();
                            if (statusData.status_code === 'FINISHED') {
                                isReady = true;
                                break;
                            } else if (statusData.status_code === 'ERROR') {
                                throw new Error("Instagram Graph API falló al procesar la imagen.");
                            }
                            await new Promise(r => setTimeout(r, 2000));
                        }
                        if (!isReady) throw new Error("Tiempo de espera agotado procesando la imagen en los servidores de Meta.");

                        // 3. Publish Media
                        const igPubData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                creation_id: igMediaData.id,
                                access_token: plainToken
                            })
                        });

                        await adminDb.collection('external_posts').doc(igPubData.id).set({
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
            } else {
                errorLog += `Instagram: Cuenta no vinculada o token faltante. `;
            }
        }

        // LINKEDIN
        if (post.networks?.includes('linkedin')) {
            const liToken = targetProfile.linkedinUserToken_enc || targetProfile.linkedinToken_enc || userData.linkedinUserToken_enc || userData.linkedinToken_enc;
            const ivLi = targetProfile.iv_li_user || targetProfile.iv_li_token || userData.iv_li_user || userData.iv_li_token;
            const tagLi = targetProfile.tag_li_user || targetProfile.tag_li_token || userData.tag_li_user || userData.tag_li_token;
            const personUrn = targetProfile.linkedinPersonUrn || userData.linkedinPersonUrn;
            const authorUrn = targetProfile.linkedinCompanyUrn || personUrn;

            if (liToken && authorUrn) {
                try {
                    const plainToken = decrypt(liToken, ivLi, tagLi);
                    
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
                                "owner": authorUrn,
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
                        "author": authorUrn,
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
                    
                    await adminDb.collection('external_posts').doc(postData.id || `li_${Date.now()}`).set({
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
            } else {
                errorLog += `LinkedIn: Cuenta no vinculada o token faltante. `;
            }
        }

        // TIKTOK
        if (post.networks?.includes('tiktok')) {
            const ttToken = targetProfile.tiktokToken_enc || userData.tiktokToken_enc;
            const ivTt = targetProfile.iv_tt || userData.iv_tt;
            const tagTt = targetProfile.tag_tt || userData.tag_tt;

            if (ttToken && imageUrl) {
                try {
                    const plainToken = decrypt(ttToken, ivTt, tagTt);
                    
                    // --- Paso 1: Descargar el video desde Firebase Storage al servidor ---
                    console.log(`[TikTok Publish] Downloading video from: ${imageUrl}`);
                    const videoRes = await fetch(imageUrl);
                    if (!videoRes.ok) throw new Error(`No se pudo descargar el video: HTTP ${videoRes.status}`);
                    
                    const videoBuffer = await videoRes.arrayBuffer();
                    const videoSize = videoBuffer.byteLength;
                    
                    console.log(`[TikTok Publish] Video downloaded. Size: ${videoSize} bytes`);

                    // --- Paso 2: Inicializar la publicación con FILE_UPLOAD ---
                    let initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${plainToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            post_info: {
                                title: caption.slice(0, 150) || 'Publicación',
                                privacy_level: "PUBLIC_TO_EVERYONE",
                                disable_comment: false,
                                disable_duet: false,
                                disable_stitch: false
                            },
                            source_info: {
                                source: "FILE_UPLOAD",
                                video_size: videoSize,
                                chunk_size: videoSize,
                                total_chunk_count: 1
                            }
                        })
                    });

                    let initData = await initRes.json();
                    console.log('[TikTok Publish] First Init response:', JSON.stringify(initData));

                    // Si falla por las pautas de integración (generalmente porque la app está en modo Sandbox y requiere SELF_ONLY)
                    const isGuidelinesError = initData.error?.message?.toLowerCase().includes('guidelines') || 
                                              JSON.stringify(initData).toLowerCase().includes('guidelines') ||
                                              initData.error?.code === 'spam_or_sensitive_content' || 
                                              initData.error?.code === 'unaudited_client_can_only_post_to_private_accounts';

                    if (isGuidelinesError) {
                        console.warn('[TikTok Publish] Detected Sandbox mode or integration guidelines restriction. Retrying with SELF_ONLY privacy level...');
                        initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${plainToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                post_info: {
                                    title: caption.slice(0, 150) || 'Publicación',
                                    privacy_level: "SELF_ONLY", // Modo privado para pruebas en Sandbox
                                    disable_comment: false,
                                    disable_duet: false,
                                    disable_stitch: false
                                },
                                source_info: {
                                    source: "FILE_UPLOAD",
                                    video_size: videoSize,
                                    chunk_size: videoSize,
                                    total_chunk_count: 1
                                }
                            })
                        });
                        initData = await initRes.json();
                        console.log('[TikTok Publish] Sandbox retry Init response:', JSON.stringify(initData));
                        
                        if (initData.error?.code === 'ok' && initData.data?.upload_url) {
                            infoLog += "TikTok Sandbox: El video se subió exitosamente en modo privado 'Solo Yo' (Para hacerlo público de forma automática a todo el mundo en futuros videos, debes solicitar la revisión de tu App en el panel de desarrolladores de TikTok). ";
                        }
                    }

                    if (initData.error?.code !== 'ok' || !initData.data?.upload_url) {
                        const errMessage = initData.error?.message || JSON.stringify(initData);
                        throw new Error(`TikTok API error: ${errMessage} (Nota de Sandbox: Si tu App de TikTok está en modo de pruebas, TikTok exige que tu cuenta de TikTok esté configurada como 'Cuenta Privada' en tu celular para poder recibir videos de prueba).`);
                    }

                    const uploadUrl = initData.data.upload_url;
                    const publishId = initData.data.publish_id;

                    // --- Paso 3: Subir el video en un solo chunk ---
                    console.log(`[TikTok Publish] Uploading video chunk to: ${uploadUrl}`);
                    const uploadRes = await fetch(uploadUrl, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'video/mp4',
                            'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
                            'Content-Length': String(videoSize)
                        },
                        body: videoBuffer
                    });

                    if (!uploadRes.ok) {
                        const uploadErr = await uploadRes.text();
                        throw new Error(`Error subiendo video a TikTok: ${uploadRes.status} - ${uploadErr}`);
                    }

                    console.log(`[TikTok Publish] Upload successful. publish_id: ${publishId}`);
                    successNetworks.push('tiktok');

                    await adminDb.collection('external_posts').doc(publishId || `tt_${Date.now()}`).set({
                       userId: uid,
                       profileId: profileId || 'default',
                       network: 'tiktok',
                       caption: caption,
                       media_type: 'VIDEO',
                       publish_id: publishId,
                       likes: 0,
                       comments: 0,
                       shares: 0,
                       reach: 0,
                       impressions: 0,
                       created_time: new Date().toISOString(),
                       timestamp: new Date()
                    });

                } catch (e: any) {
                    console.error("TikTok Publish Error:", e.message);
                    errorLog += `TikTok: ${e.message}. `;
                }
            } else if (!imageUrl) {
                errorLog += `TikTok: Falta la URL del video para publicar. `;
            } else {
                errorLog += `TikTok: Cuenta no vinculada o token faltante. `;
            }
        }

        if (successNetworks.length > 0) {
            await postRef.update({
                status: 'published',
                publishedAt: new Date(),
                publishError: errorLog || null,
                publishInfo: infoLog || null,
                publishedIn: successNetworks
            });
            return NextResponse.json({ success: true, published: successNetworks, errors: errorLog || null, info: infoLog || null });

        } else {
            await postRef.update({
                status: 'error',
                publishError: errorLog || 'No se pudo publicar en ninguna red'
            });
            return NextResponse.json({ error: errorLog || "Error desconocido al publicar" }, { status: 500 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
