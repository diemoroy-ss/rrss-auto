import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';
import { decrypt, encrypt } from '../../../lib/encryption';
import { getQuotaUsageAdmin, getPlanLimitAdmin } from '../../../lib/quota-admin';
import nodemailer from 'nodemailer';
import { renderAndUploadReel } from '../../../lib/video-renderer';

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

function explainError(msg: string): string {
    if (!msg) return "Error desconocido de la API.";
    const lower = msg.toLowerCase();
    if (lower.includes('token') || lower.includes('expired') || lower.includes('unauthorized') || lower.includes('code 190') || lower.includes('auth')) {
        return "La conexión expiró o el permiso fue revocado. Ve al Panel de Configuración y vuelve a conectar tu cuenta.";
    }
    if (lower.includes('video_url is required') || lower.includes('uploading your video file') || lower.includes('media_type') || lower.includes('format')) {
        return "La red social rechazó el archivo. Es probable que se requiriera un video válido (MP4) y no se pudo procesar correctamente.";
    }
    if (lower.includes('buffer') || lower.includes('tostring') || lower.includes('undefined')) {
        return "Error interno al procesar el archivo multimedia antes de enviarlo.";
    }
    if (lower.includes('timeout') || lower.includes('agotado') || lower.includes('wait') || lower.includes('not ready')) {
        return "El servidor de la red social tardó demasiado en procesar la publicación o no respondió a tiempo.";
    }
    return "Error general reportado por la plataforma.";
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
        
        // El bloqueo estricto ha sido eliminado para permitir Auto-Generación JIT.

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

        // Fallback: check businesses subcollection if targetProfile doesn't have youtube/x tokens
        if ((post.networks?.includes('youtube') || post.networks?.includes('x')) && !targetProfile.youtubeToken_enc && !targetProfile.xToken_enc && !targetProfile.accounts?.youtube && !targetProfile.accounts?.x) {
            try {
                const bSnap = await adminDb.collection('users').doc(uid).collection('businesses').doc(targetProfileId).get();
                if (bSnap.exists) {
                    const bData = bSnap.data();
                    if (bData?.accounts?.youtube) {
                        targetProfile.accounts = { ...(targetProfile.accounts || {}), youtube: bData.accounts.youtube };
                    }
                    if (bData?.accounts?.x) {
                        targetProfile.accounts = { ...(targetProfile.accounts || {}), x: bData.accounts.x };
                    }
                }
            } catch (e) {
                console.warn("Fallback business doc lookup failed:", e);
            }
        }

        // --- QUOTA CHECK ---
        const usedQuota = await getQuotaUsageAdmin(uid, profileId || 'default');
        const limit = await getPlanLimitAdmin(userData.plan || 'free', userData.email);
        const postNetworkCount = post.networks?.length || 1;
        
        if (usedQuota + postNetworkCount > limit) {
             return NextResponse.json({ error: "Límite de publicaciones del plan alcanzado. Mejora tu plan para seguir publicando." }, { status: 403 });
        }
        // -------------------

        // Check credentials decrypt validity beforehand (so we fail immediately if tokens are invalid)
        // Decrypt Facebook
        let plainFbToken = null;
        let pageId = null;
        if (post.networks?.includes('facebook')) {
            const fbToken = targetProfile.facebookToken_enc || userData.facebookToken_enc;
            const ivFb = targetProfile.iv_fb || userData.iv_fb;
            const tagFb = targetProfile.tag_fb || userData.tag_fb;
            pageId = targetProfile.facebookPageId || userData.facebookPageId;
            if (!fbToken || !pageId) {
                return NextResponse.json({ error: "Facebook: Cuenta no vinculada o configuración faltante." }, { status: 400 });
            }
            try {
                plainFbToken = decrypt(fbToken, ivFb, tagFb);
            } catch (e: any) {
                return NextResponse.json({ error: "Facebook: Error al desencriptar el token de acceso." }, { status: 500 });
            }
        }

        // Decrypt Instagram
        let plainIgToken = null;
        let igAccountId = null;
        if (post.networks?.includes('instagram')) {
            const igToken = targetProfile.instagramToken_enc || userData.instagramToken_enc;
            const ivIg = targetProfile.iv_ig || userData.iv_ig;
            const tagIg = targetProfile.tag_ig || userData.tag_ig;
            igAccountId = targetProfile.instagramAccountId || userData.instagramAccountId;
            if (!igToken || !igAccountId) {
                return NextResponse.json({ error: "Instagram: Cuenta no vinculada o configuración faltante." }, { status: 400 });
            }
            try {
                plainIgToken = decrypt(igToken, ivIg, tagIg);
            } catch (e: any) {
                return NextResponse.json({ error: "Instagram: Error al desencriptar el token de acceso." }, { status: 500 });
            }
        }

        // Decrypt LinkedIn
        let plainLiToken = null;
        let authorUrn = null;
        if (post.networks?.includes('linkedin')) {
            const liToken = targetProfile.linkedinUserToken_enc || targetProfile.linkedinToken_enc || userData.linkedinUserToken_enc || userData.linkedinToken_enc;
            const ivLi = targetProfile.iv_li_user || targetProfile.iv_li_token || userData.iv_li_user || userData.iv_li_token;
            const tagLi = targetProfile.tag_li_user || targetProfile.tag_li_token || userData.tag_li_user || userData.tag_li_token;
            const personUrn = targetProfile.linkedinPersonUrn || userData.linkedinPersonUrn;
            authorUrn = targetProfile.linkedinCompanyUrn || personUrn;
            if (!liToken || !authorUrn) {
                return NextResponse.json({ error: "LinkedIn: Cuenta no vinculada o configuración faltante." }, { status: 400 });
            }
            try {
                plainLiToken = decrypt(liToken, ivLi, tagLi);
            } catch (e: any) {
                return NextResponse.json({ error: "LinkedIn: Error al desencriptar el token de acceso." }, { status: 500 });
            }
        }

        // Decrypt TikTok
        let plainTtToken = null;
        if (post.networks?.includes('tiktok')) {
            const ttToken = targetProfile.tiktokToken_enc || userData.tiktokToken_enc;
            const ivTt = targetProfile.iv_tt || userData.iv_tt;
            const tagTt = targetProfile.tag_tt || userData.tag_tt;
            if (!ttToken) {
                return NextResponse.json({ error: "TikTok: Cuenta no vinculada o configuración faltante." }, { status: 400 });
            }
            try {
                plainTtToken = decrypt(ttToken, ivTt, tagTt);
            } catch (e: any) {
                return NextResponse.json({ error: "TikTok: Error al desencriptar el token de acceso." }, { status: 500 });
            }
        }

        // Decrypt Google Business
        let plainGbToken = null;
        let plainGbRefreshToken = null;
        if (post.networks?.includes('googleBusiness')) {
            const gbToken = targetProfile.googleBusinessToken_enc || userData.googleBusinessToken_enc;
            const ivGb = targetProfile.iv_gb || userData.iv_gb;
            const tagGb = targetProfile.tag_gb || userData.tag_gb;
            const gbRefreshToken = targetProfile.googleBusinessRefreshToken_enc || userData.googleBusinessRefreshToken_enc;
            const ivGbRef = targetProfile.iv_gb_refresh || userData.iv_gb_refresh;
            const tagGbRef = targetProfile.tag_gb_refresh || userData.tag_gb_refresh;

            if (!gbToken) {
                return NextResponse.json({ error: "Google Business: Cuenta no vinculada o configuración faltante." }, { status: 400 });
            }
            try {
                plainGbToken = decrypt(gbToken, ivGb, tagGb);
                if (gbRefreshToken && ivGbRef && tagGbRef) {
                    plainGbRefreshToken = decrypt(gbRefreshToken, ivGbRef, tagGbRef);
                }
            } catch (e: any) {
                return NextResponse.json({ error: "Google Business: Error al desencriptar el token de acceso." }, { status: 500 });
            }
        }

        // Decrypt YouTube
        let plainYtToken = null;
        let plainYtRefreshToken = null;
        if (post.networks?.includes('youtube')) {
            const ytAccount = targetProfile.accounts?.youtube || {};
            const ytToken = targetProfile.youtubeToken_enc || (typeof ytAccount.token === 'string' ? ytAccount.token : ytAccount.token?.encryptedData) || userData.youtubeToken_enc;
            const ivYt = targetProfile.iv_yt || ytAccount.iv || ytAccount.token?.iv || userData.iv_yt;
            const tagYt = targetProfile.tag_yt || ytAccount.authTag || ytAccount.tag || ytAccount.token?.authTag || userData.tag_yt;
            const ytRefreshToken = targetProfile.youtubeRefreshToken_enc || (typeof ytAccount.refreshToken === 'string' ? ytAccount.refreshToken : ytAccount.refreshToken?.encryptedData) || userData.youtubeRefreshToken_enc;
            const ivYtRef = targetProfile.iv_yt_refresh || ytAccount.iv_refresh || ytAccount.refreshToken?.iv || userData.iv_yt_refresh;
            const tagYtRef = targetProfile.tag_yt_refresh || ytAccount.tag_refresh || ytAccount.refreshToken?.authTag || userData.tag_yt_refresh;

            if (!ytToken) {
                return NextResponse.json({ error: "YouTube: Cuenta no vinculada. Por favor conecta tu canal en Configuración." }, { status: 400 });
            }
            try {
                plainYtToken = decrypt(ytToken, ivYt, tagYt);
                if (ytRefreshToken && ivYtRef && tagYtRef) {
                    plainYtRefreshToken = decrypt(ytRefreshToken, ivYtRef, tagYtRef);
                }
            } catch (e: any) {
                return NextResponse.json({ error: "YouTube: Error al desencriptar el token de acceso." }, { status: 500 });
            }
        }

        // Decrypt X (Twitter)
        let plainXToken = null;
        let plainXRefreshToken = null;
        if (post.networks?.includes('x')) {
            const xAccount = targetProfile.accounts?.x || {};
            const xToken = targetProfile.xToken_enc || (typeof xAccount.token === 'string' ? xAccount.token : xAccount.token?.encryptedData) || userData.xToken_enc;
            const ivX = targetProfile.iv_x || xAccount.iv || xAccount.token?.iv || userData.iv_x;
            const tagX = targetProfile.tag_x || xAccount.authTag || xAccount.tag || xAccount.token?.authTag || userData.tag_x;
            const xRefreshToken = targetProfile.xRefreshToken_enc || (typeof xAccount.refreshToken === 'string' ? xAccount.refreshToken : xAccount.refreshToken?.encryptedData) || userData.xRefreshToken_enc;
            const ivXRef = targetProfile.iv_x_refresh || xAccount.iv_refresh || xAccount.refreshToken?.iv || userData.iv_x_refresh;
            const tagXRef = targetProfile.tag_x_refresh || xAccount.tag_refresh || xAccount.refreshToken?.authTag || userData.tag_x_refresh;

            if (!xToken) {
                return NextResponse.json({ error: "X (Twitter): Cuenta no vinculada. Por favor conecta tu cuenta de X en Configuración." }, { status: 400 });
            }
            try {
                plainXToken = decrypt(xToken, ivX, tagX);
                if (xRefreshToken && ivXRef && tagXRef) {
                    plainXRefreshToken = decrypt(xRefreshToken, ivXRef, tagXRef);
                }
            } catch (e: any) {
                return NextResponse.json({ error: "X (Twitter): Error al desencriptar el token de acceso." }, { status: 500 });
            }
        }

        if (!post.networks || post.networks.length === 0) {
            return NextResponse.json({ error: "No se seleccionó ninguna red social para publicar." }, { status: 400 });
        }

        // --- UPDATE STATUS TO PUBLISHING ---
        await postRef.update({
            status: 'publishing',
            publishError: null,
            publishInfo: null
        });

        // --- RUN PUBLISH PROCESS IN BACKGROUND ---
        publishInBackground(postId, post, targetProfile, {
            plainFbToken, pageId,
            plainIgToken, igAccountId,
            plainLiToken, authorUrn,
            plainTtToken,
            plainGbToken,
            plainGbRefreshToken,
            plainYtToken,
            plainYtRefreshToken,
            plainXToken,
            plainXRefreshToken,
            uid, profileId
        }).catch(err => {
            console.error(`[CRITICAL] Background publish process failed for post ${postId}:`, err);
        });

        return NextResponse.json({ success: true, status: 'publishing' });

    } catch (e: any) {
        console.error("Immediate Publish Setup Error:", e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

async function publishInBackground(postId: string, post: any, targetProfile: any, creds: {
    plainFbToken: string | null; pageId: string | null;
    plainIgToken: string | null; igAccountId: string | null;
    plainLiToken: string | null; authorUrn: string | null;
    plainTtToken: string | null;
    plainGbToken: string | null;
    plainGbRefreshToken: string | null;
    plainYtToken: string | null;
    plainYtRefreshToken: string | null;
    plainXToken: string | null;
    plainXRefreshToken: string | null;
    uid: string; profileId: string | null;
}) {
    const postRef = adminDb.collection("social_posts").doc(postId);
    let successNetworks: string[] = [];
    let errorLog = '';
    let userErrorLog = '';
    let infoLog = '';

    // --- AGENTE 3: GENERADOR DE COPY PERSUASIVO Y DATOS DE CONTACTO ---
    const rawCaption = post.copy || post.postText || post.text || post.idea || '';
    const copyLooksLikeInstruction = (
        !post.copy ||
        post.copy === (post.text || '') ||
        post.copy === (post.postText || '') ||
        post.copy === post.idea ||
        post.copy.startsWith('Infografía') ||
        post.copy.startsWith('Desglose') ||
        post.copy.startsWith('Escenificación') ||
        post.copy.startsWith('Pitch') ||
        post.copy.startsWith('Carrusel') ||
        post.copy.startsWith('Post de') ||
        post.copy.startsWith('Secuencia') ||
        post.copy.startsWith('Consejos') ||
        post.copy.includes('mostrando') ||
        post.copy.includes('deslizable') ||
        post.copy.includes('visual y textual') ||
        post.copy.includes('capturas de pantalla') ||
        post.copy.includes('instrucción')
    );

    let caption = rawCaption;

    if (copyLooksLikeInstruction) {
        try {
            infoLog += `Iniciando Agente de Copy Persuasivo... `;
            const { generateCopyWithAgent } = await import('../../../lib/agents/agent-copy');
            const newCopy = await generateCopyWithAgent({
                idea: post.idea || post.text || 'Publicación promocional del negocio',
                targetProfile
            });
            post.copy = newCopy;
            caption = newCopy;
            await postRef.update({ 
                copy: newCopy,
                autoGenerated: true,
                autoGeneratedCopy: true,
                autoGeneratedAt: new Date().toISOString()
            });
            infoLog += `Copy generado y guardado exitosamente. `;
        } catch (copyErr: any) {
            console.error('[publishInBackground] Error en Agente de Copy:', copyErr);
            infoLog += `Fallo en Agente de Copy (se usará texto básico): ${copyErr.message}. `;
            caption = post.idea || post.text || '';
        }
    }

    const isReel = post.type === 'video_reel' || post.type === 'reel' || post.type === 'Reel' || 
                   (post.format && (post.format.toLowerCase().includes('reel') || post.format.toLowerCase().includes('short'))) ||
                   (post.type && (post.type.toLowerCase().includes('reel') || post.type.toLowerCase().includes('short')));

    let imageUrl = post.imageUrl;
    let videoUrl = post.videoUrl || post.mediaUrl || (isReel ? null : imageUrl);

    try {
        if (isReel) {
            if (!videoUrl) {
                infoLog += `Iniciando Agente 2 (Video Premium IA)... `;
                try {
                    const { generatePremiumVideoWithAgent } = await import('../../../lib/agents/agent-video-premium');
                    const generatedVideoUrl = await generatePremiumVideoWithAgent({
                        postId,
                        idea: post.idea || post.text || post.copy || '',
                        rubro: targetProfile?.rubro || targetProfile?.businessType || 'General',
                        businessDescription: targetProfile?.businessDescription || ''
                    });
                    videoUrl = generatedVideoUrl;
                    post.videoUrl = generatedVideoUrl;
                    await postRef.update({ 
                        videoUrl: generatedVideoUrl,
                        autoGenerated: true,
                        autoGeneratedPremiumVideo: true,
                        autoGeneratedAt: new Date().toISOString()
                    });
                    infoLog += `Video Premium generado exitosamente. `;
                } catch (premiumErr: any) {
                    console.warn('[publishInBackground] Error en Agente Premium, intentando fallback a Remotion:', premiumErr.message);
                    infoLog += `Fallo Video Premium (${premiumErr.message}), iniciando fallback a Remotion... `;
                    
                    try {
                        const { generateReelWithAgent } = await import('../../../lib/agents/agent-reel');
                        const { videoUrl: generatedVideoUrl } = await generateReelWithAgent({
                            postId,
                            post,
                            targetProfile,
                            userId: creds.uid
                        });
                        videoUrl = generatedVideoUrl;
                        post.videoUrl = generatedVideoUrl;
                        await postRef.update({ 
                            videoUrl: generatedVideoUrl,
                            autoGenerated: true,
                            autoGeneratedReel: true,
                            autoGeneratedAt: new Date().toISOString()
                        });
                        infoLog += `Reel 9:16 generado exitosamente por Remotion. `;
                    } catch (reelErr: any) {
                        console.error('[publishInBackground] Error crítico en Agente de Reel (Fallback):', reelErr);
                        errorLog += `Error Renderizando Reel (Fallback): ${reelErr.message}. `;
                        userErrorLog += `Error procesando video del Reel. `;
                        throw new Error(`Fallo en Agente de Reel tras intento fallido de Premium: ${reelErr.message}`);
                    }
                }
            }
        } else {
            if (!imageUrl && !videoUrl) {
                infoLog += `Iniciando Agente 1 (Generación de Imagen con Claude-Banana & n8n/Pollinations)... `;
                try {
                    const { generateImageWithAgent } = await import('../../../lib/agents/agent-image');
                    const isStoryPost = post.type === 'Historia' || post.type === 'Story' || (post.type && post.type.toLowerCase().includes('stor'));
                    const generatedImageUrl = await generateImageWithAgent({
                        idea: post.idea || caption || 'Fotografía promocional profesional',
                        rubro: targetProfile?.rubro || 'General',
                        businessDescription: targetProfile?.businessDescription || '',
                        aspectRatio: isStoryPost ? '9:16' : '1:1',
                        logoPrompt: targetProfile?.logoPrompt || '',
                        includeLogo: post.includeLogo === true || (post.includeLogo !== false && targetProfile?.alwaysIncludeLogo === true),
                    });
                    imageUrl = generatedImageUrl;
                    post.imageUrl = generatedImageUrl;
                    post.imageUrls = [generatedImageUrl];
                    await postRef.update({
                        imageUrl: generatedImageUrl,
                        imageUrls: [generatedImageUrl],
                        autoGenerated: true,
                        autoGeneratedImage: true,
                        autoGeneratedAt: new Date().toISOString()
                    });
                    infoLog += `Imagen generada exitosamente por Agente 1. `;
                } catch (imgErr: any) {
                    console.error('[publishInBackground] Error en Agente de Imagen:', imgErr);
                    errorLog += `Error Generando Imagen: ${imgErr.message}. `;
                }
            }
        }

        // FACEBOOK
        if (post.networks?.includes('facebook') && creds.plainFbToken && creds.pageId) {
            const plainToken = creds.plainFbToken;
            const pageId = creds.pageId;
            try {
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
                       userId: creds.uid,
                       profileId: creds.profileId || 'default',
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
                            file_url: videoUrl,
                            description: caption,
                            access_token: plainToken
                        })
                    });
                    
                    await adminDb.collection('external_posts').doc(fbData.id).set({
                       userId: creds.uid,
                       profileId: creds.profileId || 'default',
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
                       userId: creds.uid,
                       profileId: creds.profileId || 'default',
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
                const explanation = explainError(e.message);
                errorLog += `FB: ${e.message} (${explanation}). `;
                userErrorLog += `FB: No ok, ${explanation} `;
            }
        }

        // INSTAGRAM
        if (post.networks?.includes('instagram') && creds.plainIgToken && creds.igAccountId) {
            const plainToken = creds.plainIgToken;
            const igAccountId = creds.igAccountId;
            try {
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
                       userId: creds.uid,
                       profileId: creds.profileId || 'default',
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
                            video_url: videoUrl,
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
                       userId: creds.uid,
                       profileId: creds.profileId || 'default',
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
                    
                    // 2. Publish Media with retry logic
                    let igPubData = null;
                    let lastPublishError = null;
                    
                    for (let attempt = 0; attempt < 8; attempt++) {
                        try {
                            console.log(`[Instagram Publish] Attempting to publish container ${igMediaData.id} (attempt ${attempt + 1})...`);
                            igPubData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    creation_id: igMediaData.id,
                                    access_token: plainToken
                                })
                            });
                            break;
                        } catch (err: any) {
                            lastPublishError = err;
                            const isNotReady = err.message.toLowerCase().includes('ready') || 
                                               err.message.toLowerCase().includes('processed') || 
                                               err.message.toLowerCase().includes('wait') || 
                                               err.message.includes('2207027');
                            if (isNotReady && attempt < 7) {
                                console.warn(`[Instagram Publish] Container not ready yet. Waiting 3 seconds before retry...`);
                                await new Promise(r => setTimeout(r, 3000));
                            } else {
                                throw err;
                            }
                        }
                    }
                    
                    if (!igPubData) {
                        throw new Error(lastPublishError?.message || "Tiempo de espera agotado procesando la imagen en los servidores de Meta.");
                    }

                    await adminDb.collection('external_posts').doc(igPubData.id).set({
                       userId: creds.uid,
                       profileId: creds.profileId || 'default',
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
                const explanation = explainError(e.message);
                errorLog += `IG: ${e.message} (${explanation}). `;
                userErrorLog += `IG: No ok, ${explanation} `;
            }
        }

        // LINKEDIN
        if (post.networks?.includes('linkedin') && creds.plainLiToken && creds.authorUrn) {
            const plainToken = creds.plainLiToken;
            const authorUrn = creds.authorUrn;
            try {
                let mediaAssetUrn = null;

                if (imageUrl && !post.type?.toLowerCase().includes('reel')) {
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
                        
                        const imgRes = await fetch(imageUrl);
                        const imgBuffer = await imgRes.arrayBuffer();
                        
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
                   userId: creds.uid,
                   profileId: creds.profileId || 'default',
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
                const explanation = explainError(e.message);
                errorLog += `LI: ${e.message} (${explanation}). `;
                userErrorLog += `LinkedIn: No ok, ${explanation} `;
            }
        }

        // TIKTOK
        if (post.networks?.includes('tiktok') && creds.plainTtToken) {
            const plainToken = creds.plainTtToken;
            try {
                console.log(`[TikTok Publish] Downloading video from: ${imageUrl}`);
                const videoRes = await fetch(imageUrl);
                if (!videoRes.ok) throw new Error(`No se pudo descargar el video: HTTP ${videoRes.status}`);
                
                const videoBuffer = await videoRes.arrayBuffer();
                const videoSize = videoBuffer.byteLength;
                
                console.log(`[TikTok Publish] Video downloaded. Size: ${videoSize} bytes`);

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
                                privacy_level: "SELF_ONLY",
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
                   userId: creds.uid,
                   profileId: creds.profileId || 'default',
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
                const explanation = explainError(e.message);
                errorLog += `TikTok: ${e.message} (${explanation}). `;
                userErrorLog += `TikTok: No ok, ${explanation} `;
            }
        }

        // GOOGLE BUSINESS
        if (post.networks?.includes('googleBusiness') && creds.plainGbToken) {
            let plainToken = creds.plainGbToken;
            try {
                // Function to perform the API sequence
                const executeGooglePost = async (token: string) => {
                    // 1. Get Accounts
                    const accRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const accData = await accRes.json();
                    if (accData.error) {
                        if (accData.error.status === 'UNAUTHENTICATED' || accData.error.code === 401) {
                            throw new Error("UNAUTHENTICATED");
                        }
                        throw new Error(accData.error.message || "Failed to fetch Google Business accounts");
                    }
                    
                    const accounts = accData.accounts || [];
                    if (accounts.length === 0) throw new Error("No Google Business accounts found");
                    
                    const accountName = accounts[0].name;
                    
                    // 2. Get Locations
                    const locRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const locData = await locRes.json();
                    if (locData.error) throw new Error(locData.error.message || "Failed to fetch Google Business locations");
                    
                    const locations = locData.locations || [];
                    if (locations.length === 0) throw new Error("No verified locations found in this account");
                    
                    const locationName = locations[0].name;
                    const parentPath = `${accountName}/${locationName}`;

                    // 3. Post to mybusiness.googleapis.com v4
                    const postPayload: any = {
                       languageCode: "es",
                       summary: caption,
                       callToAction: { actionType: "LEARN_MORE", url: "https://santisoft.cl" } // default CTA
                    };

                    if (imageUrl) {
                       postPayload.media = [
                          {
                             mediaFormat: "PHOTO",
                             sourceUrl: imageUrl
                          }
                       ];
                    }

                    const postRes = await fetch(`https://mybusiness.googleapis.com/v4/${parentPath}/localPosts`, {
                        method: 'POST',
                        headers: { 
                           'Authorization': `Bearer ${token}`,
                           'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(postPayload)
                    });
                    const postData = await postRes.json();
                    
                    if (postData.error) throw new Error(postData.error.message || "Failed to publish on Google Business");

                    return postData;
                };

                try {
                    const postData = await executeGooglePost(plainToken);
                    successNetworks.push('googleBusiness');
                    await adminDb.collection('external_posts').doc(postData.name ? postData.name.replace(/\//g, '_') : `gb_${Date.now()}`).set({
                       userId: creds.uid,
                       profileId: creds.profileId || 'default',
                       network: 'googleBusiness',
                       caption: caption,
                       media_type: imageUrl ? 'IMAGE' : 'TEXT',
                       likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0,
                       created_time: new Date().toISOString(), timestamp: new Date()
                    });
                } catch (e: any) {
                    if (e.message === "UNAUTHENTICATED" && creds.plainGbRefreshToken) {
                        console.log("[Google Business] Access token expired, attempting to refresh...");
                        // Refresh Token
                        const tokenUrl = 'https://oauth2.googleapis.com/token';
                        const res = await fetch(tokenUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                client_id: process.env.GOOGLE_CLIENT_ID!,
                                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                                refresh_token: creds.plainGbRefreshToken,
                                grant_type: 'refresh_token'
                            })
                        });
                        const refreshData = await res.json();
                        if (refreshData.error) {
                            throw new Error("El token de Google ha expirado y no se pudo renovar. Por favor reconecta Google Business en Configuración.");
                        }
                        const newAccessToken = refreshData.access_token;
                        
                        // Update in DB (fire-and-forget for speed)
                        const encNewToken = encrypt(newAccessToken);
                        
                        const userRef = adminDb.collection('users').doc(creds.uid);
                        if (creds.profileId && creds.profileId !== 'default') {
                            const userDoc = await userRef.get();
                            const profiles = userDoc.data()?.profiles || [];
                            const pIdx = profiles.findIndex((p: any) => p.id === creds.profileId);
                            if (pIdx !== -1) {
                                profiles[pIdx].googleBusinessToken_enc = encNewToken.encryptedData;
                                profiles[pIdx].iv_gb = encNewToken.iv;
                                profiles[pIdx].tag_gb = encNewToken.authTag;
                                userRef.update({ profiles }).catch(console.error);
                            }
                        } else {
                            userRef.update({
                                googleBusinessToken_enc: encNewToken.encryptedData,
                                iv_gb: encNewToken.iv,
                                tag_gb: encNewToken.authTag
                            }).catch(console.error);
                        }

                        // Retry the post
                        const postData = await executeGooglePost(newAccessToken);
                        successNetworks.push('googleBusiness');
                        await adminDb.collection('external_posts').doc(postData.name ? postData.name.replace(/\//g, '_') : `gb_${Date.now()}`).set({
                           userId: creds.uid, profileId: creds.profileId || 'default',
                           network: 'googleBusiness', caption: caption, media_type: imageUrl ? 'IMAGE' : 'TEXT',
                           likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0,
                           created_time: new Date().toISOString(), timestamp: new Date()
                        });
                    } else {
                        throw e;
                    }
                }

            } catch (e: any) {
                console.error("Google Business Publish Error:", e.message);
                const explanation = explainError(e.message);
                errorLog += `GoogleBusiness: ${e.message} (${explanation}). `;
                userErrorLog += `Google Business: No ok, ${explanation} `;
            }
        }

        // YOUTUBE SHORTS
        if (post.networks?.includes('youtube') && creds.plainYtToken) {
            let plainToken = creds.plainYtToken;
            let ytVideoUrl = post.videoUrl || (videoUrl && videoUrl !== imageUrl ? videoUrl : null);

            if (isReel && !ytVideoUrl) {
                console.error('YouTube Publish Error: No videoUrl provided for Reel/Short');
                errorLog += `YouTube: Se requiere un archivo de video MP4 renderizado para publicar en YouTube Shorts. `;
                userErrorLog += `YouTube: Se requiere generar el video primero. `;
            } else {
                const executeYouTubePost = async (token: string) => {
                    const videoStreamRes = await fetch(ytVideoUrl);
                    if (!videoStreamRes.ok) {
                        throw new Error(`No se pudo descargar el video para YouTube (${videoStreamRes.status})`);
                    }
                    const videoBuffer = Buffer.from(await videoStreamRes.arrayBuffer());

                    const titleText = (caption || 'Video de Santisoft AI').slice(0, 95);
                    const descText = `${caption}\n\n#Shorts #SantisoftAI`;

                    const metadata = {
                        snippet: {
                            title: titleText,
                            description: descText,
                            tags: ['Shorts', 'SantisoftAI'],
                            categoryId: '22',
                        },
                        status: {
                            privacyStatus: 'public',
                            selfDeclaredMadeForKids: false,
                        },
                    };

                    const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json; charset=UTF-8',
                            'X-Upload-Content-Length': videoBuffer.length.toString(),
                            'X-Upload-Content-Type': 'video/mp4',
                        },
                        body: JSON.stringify(metadata),
                    });

                    if (!initRes.ok) {
                        if (initRes.status === 401) {
                            throw new Error('UNAUTHENTICATED');
                        }
                        const errBody = await initRes.text();
                        throw new Error(`YouTube Init Error: ${errBody}`);
                    }

                    const uploadUrl = initRes.headers.get('location');
                    if (!uploadUrl) {
                        throw new Error('No se recibió la URL de subida de YouTube.');
                    }

                    const uploadRes = await fetch(uploadUrl, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'video/mp4',
                            'Content-Length': videoBuffer.length.toString(),
                        },
                        body: videoBuffer,
                    });

                    const uploadData = await uploadRes.json();
                    if (uploadData.error) {
                        throw new Error(uploadData.error.message || 'Error al subir video a YouTube');
                    }

                    return uploadData;
                };

                try {
                    const ytData = await executeYouTubePost(plainToken);
                    successNetworks.push('youtube');
                    const videoId = ytData.id || `yt_${Date.now()}`;
                    await adminDb.collection('external_posts').doc(videoId).set({
                        userId: creds.uid,
                        profileId: creds.profileId || 'default',
                        network: 'youtube',
                        caption: caption,
                        media_type: 'VIDEO',
                        likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0,
                        created_time: new Date().toISOString(),
                        timestamp: new Date(),
                        permalink: `https://youtube.com/shorts/${videoId}`
                    });
                } catch (ytErr: any) {
                    if (ytErr.message === 'UNAUTHENTICATED' && creds.plainYtRefreshToken) {
                        console.log('[YouTube] Access token expired, attempting to refresh...');
                        try {
                            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: new URLSearchParams({
                                    client_id: process.env.GOOGLE_CLIENT_ID!,
                                    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                                    refresh_token: creds.plainYtRefreshToken,
                                    grant_type: 'refresh_token',
                                }),
                            });
                            const refreshData = await tokenRes.json();
                            if (refreshData.access_token) {
                                const newAccessToken = refreshData.access_token;
                                const encNewToken = encrypt(newAccessToken);

                                const userRef = adminDb.collection('users').doc(creds.uid);
                                const userDoc = await userRef.get();
                                const profiles = userDoc.data()?.profiles || [];
                                const pIdx = profiles.findIndex((p: any) => p.id === (creds.profileId || 'default'));
                                if (pIdx !== -1) {
                                    profiles[pIdx].youtubeToken_enc = encNewToken.encryptedData;
                                    profiles[pIdx].iv_yt = encNewToken.iv;
                                    profiles[pIdx].tag_yt = encNewToken.authTag;
                                    userRef.update({ profiles }).catch(console.error);
                                }

                                const ytData = await executeYouTubePost(newAccessToken);
                                successNetworks.push('youtube');
                                const videoId = ytData.id || `yt_${Date.now()}`;
                                await adminDb.collection('external_posts').doc(videoId).set({
                                    userId: creds.uid,
                                    profileId: creds.profileId || 'default',
                                    network: 'youtube',
                                    caption: caption,
                                    media_type: 'VIDEO',
                                    likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0,
                                    created_time: new Date().toISOString(),
                                    timestamp: new Date(),
                                    permalink: `https://youtube.com/shorts/${videoId}`
                                });
                            } else {
                                throw new Error('No se pudo renovar el token de YouTube.');
                            }
                        } catch (refreshErr: any) {
                            console.error('YouTube Token Refresh Error:', refreshErr.message);
                            const explanation = explainError(refreshErr.message);
                            errorLog += `YouTube: ${refreshErr.message} (${explanation}). `;
                            userErrorLog += `YouTube: No ok, ${explanation} `;
                        }
                    } else {
                        console.error('YouTube Publish Error:', ytErr.message);
                        const explanation = explainError(ytErr.message);
                        errorLog += `YouTube: ${ytErr.message} (${explanation}). `;
                        userErrorLog += `YouTube: No ok, ${explanation} `;
                    }
                }
            }
        }

        // X (TWITTER)
        if (post.networks?.includes('x') && creds.plainXToken) {
            let plainToken = creds.plainXToken;
            try {
                const tweetPayload: { text: string } = {
                    text: (caption || '').slice(0, 280),
                };

                const tweetRes = await fetch('https://api.twitter.com/2/tweets', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${plainToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(tweetPayload),
                });

                const tweetData = await tweetRes.json();
                if (tweetData.data?.id) {
                    successNetworks.push('x');
                    await adminDb.collection('external_posts').doc(tweetData.data.id).set({
                        userId: creds.uid,
                        profileId: creds.profileId || 'default',
                        network: 'x',
                        caption: caption,
                        media_type: 'TEXT',
                        likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0,
                        created_time: new Date().toISOString(),
                        timestamp: new Date(),
                        permalink: `https://x.com/i/status/${tweetData.data.id}`
                    });
                } else {
                    const errMsg = tweetData.detail || tweetData.title || JSON.stringify(tweetData.errors || tweetData);
                    throw new Error(errMsg);
                }
            } catch (xErr: any) {
                console.error('X Publish Error:', xErr.message);
                const explanation = explainError(xErr.message);
                errorLog += `X (Twitter): ${xErr.message} (${explanation}). `;
                userErrorLog += `X (Twitter): No ok, ${explanation} `;
            }
        }



        // --- SEAL ACCOUNT LOCKS ON SUCCESSFUL PUBLISH (non-business plans) ---
        if (successNetworks.length > 0) {
            try {
                const userRef = adminDb.collection('users').doc(creds.uid);
                const freshUserDoc = await userRef.get();
                const freshData = freshUserDoc.data() || {};
                const plansDoc = await adminDb.collection('system_config').doc('plans').get();
                const allPlans = plansDoc.exists ? plansDoc.data() as any : {};
                const planInfo = allPlans[freshData.plan || 'free'] || {};
                const isBusinessPlan = !!planInfo.multiAccount;

                if (!isBusinessPlan) {
                    const freshProfiles = freshData.profiles || [];
                    const pIdx = freshProfiles.findIndex((p: any) => p.id === (creds.profileId || 'default'));
                    if (pIdx !== -1) {
                        const profile = freshProfiles[pIdx];
                        const locks = profile.accountLocks || {};
                        // Seal each network that published successfully
                        if (successNetworks.includes('facebook') && profile.facebookPageId && !locks.facebook) {
                            locks.facebook = profile.facebookPageId;
                        }
                        if (successNetworks.includes('instagram') && profile.instagramAccountId && !locks.instagram) {
                            locks.instagram = profile.instagramAccountId;
                        }
                        if (successNetworks.includes('tiktok') && profile.tiktokUsername && !locks.tiktok) {
                            locks.tiktok = profile.tiktokUsername;
                        }
                        freshProfiles[pIdx] = { ...profile, accountLocks: locks };
                        await userRef.update({ profiles: freshProfiles });
                        console.log(`[Account Lock] Sealed accounts for profile ${creds.profileId} of user ${creds.uid}`);
                    }
                }
            } catch (lockErr: any) {
                console.error('[Account Lock] Failed to seal account locks:', lockErr.message);
            }
        }
        // -----------------------------------------------------------------------

        // --- UPDATE STATUS AT END ---
        if (successNetworks.length > 0) {
            await postRef.update({
                status: 'published',
                publishedAt: new Date(),
                publishError: userErrorLog || null,
                publishInfo: infoLog || null,
                publishedIn: successNetworks
            });
            console.log(`[Background Publish] Post ${postId} finished successfully. Published in: ${successNetworks.join(', ')}`);

            // --- SEND EMAIL NOTIFICATION ---
            try {
                const userDoc = await adminDb.collection('users').doc(creds.uid).get();
                const userData = userDoc.data();
                if (userData?.email && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD }
                    });
                    
                    const networkNames = successNetworks.join(', ');
                    const imageHtml = imageUrl ? `<div style="text-align: center; margin: 20px 0;"><img src="${imageUrl}" alt="Post Image" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" /></div>` : '';
                    
                    await transporter.sendMail({
                        from: `"Santisoft Automatización" <${process.env.SMTP_EMAIL}>`,
                        to: userData.email,
                        subject: `¡Tu post ha sido publicado con éxito! 🎉`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                <h2 style="color: #4F46E5;">¡Publicación Exitosa!</h2>
                                <p>Hola ${userData.name || 'usuario'},</p>
                                <p>Te informamos que tu publicación ha sido enviada exitosamente a las siguientes redes: <strong>${networkNames}</strong>.</p>
                                ${imageHtml}
                                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5; margin-top: 20px;">
                                    <p style="margin: 0; white-space: pre-wrap;"><em>"${caption}"</em></p>
                                </div>
                                <p style="margin-top: 30px; font-size: 12px; color: #999;">Este es un mensaje automático de Santisoft.</p>
                            </div>
                        `
                    });
                    console.log(`[Background Publish] Email sent to ${userData.email}`);
                }
            } catch (emailErr: any) {
                console.error("[Background Publish] Error sending email notification:", emailErr.message);
            }
        } else {
            await postRef.update({
                status: 'error',
                publishError: userErrorLog || 'No se pudo publicar en ninguna red'
            });
            console.log(`[Background Publish] Post ${postId} failed. Errors: ${errorLog}`);
        }

    } catch (e: any) {
        console.error(`[Background Publish Exception] Critical error for post ${postId}:`, e.message);
        errorLog += `Critical Error: ${e.message}`;
        userErrorLog += `Error crítico, contactar con administrador. `;
        await postRef.update({
            status: 'error',
            publishError: userErrorLog
        });
    } finally {
        // --- ADMIN LOGGING ---
        try {
            const userSnap = await adminDb.collection("users").doc(creds.uid).get();
            const userData = userSnap.exists ? userSnap.data()! : {};
            const clientEmail = userData.email || post.userEmail || 'Desconocido';

            await adminDb.collection("admin_logs").add({
                timestamp: new Date(),
                action: 'publish_post',
                postId: postId,
                userId: creds.uid,
                postType: post.type || 'Desconocido',
                clientEmail: clientEmail,
                status: errorLog ? 'error' : 'success',
                message: errorLog ? `Falló: ${errorLog}` : `Publicado exitosamente en: ${successNetworks.join(', ')}`,
                details: infoLog || ''
            });
        } catch (logErr) {
            console.error("[Background Publish] Error saving admin log:", logErr);
        }
    }
}
