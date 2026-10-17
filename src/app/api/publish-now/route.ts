import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import { decrypt, encrypt } from '../../../lib/encryption';
import { getQuotaUsageAdmin, getPlanLimitAdmin, isAdminAdmin } from '../../../lib/quota-admin';
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
    if (lower.includes('unaudited_client') || lower.includes('sandbox') || lower.includes('guidelines')) {
        return "Tu App de TikTok está en modo desarrollo (Sandbox). En Sandbox, TikTok exige que tu cuenta esté agregada como tester en tu Developer Portal y en modo privado en el celular.";
    }
    if (lower.includes('token') || lower.includes('expired') || lower.includes('unauthorized') || lower.includes('code 190') || lower.includes('auth') || lower.includes('scope_not_authorized')) {
        return "La conexión de la red social expiró o el permiso fue revocado. Ve a Configuración y vuelve a conectar tu cuenta.";
    }
    if (lower.includes('video_url is required') || lower.includes('uploading your video file') || lower.includes('media_type') || lower.includes('format') || lower.includes('file_format')) {
        return "La red social requiere un archivo de video MP4 válido en formato vertical 9:16.";
    }
    if (lower.includes('buffer') || lower.includes('tostring') || lower.includes('undefined')) {
        return "Error al procesar el archivo multimedia antes de enviarlo.";
    }
    if (lower.includes('timeout') || lower.includes('agotado') || lower.includes('wait') || lower.includes('not ready')) {
        return "El servidor de la red social tardó demasiado en responder.";
    }
    return "Error reportado por la plataforma: " + msg.slice(0, 120);
}

export async function POST(req: Request) {
    try {
        // 1. Verificación de Seguridad: Token Bearer o CRON_SECRET interno
        const authHeader = req.headers.get("Authorization") || "";
        const cronSecret = process.env.CRON_SECRET;
        const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);
        let callerUid: string | null = null;
        let isCallerAdmin = false;

        if (!isCronAuthorized && authHeader.startsWith("Bearer ") && adminAuth) {
            try {
                const token = authHeader.split("Bearer ")[1];
                const decoded = await adminAuth.verifyIdToken(token);
                callerUid = decoded.uid;
                isCallerAdmin = isAdminAdmin(decoded.email);
            } catch (authErr) {
                console.warn("[publish-now] Token de sesión inválido:", authErr);
            }
        }

        if (!isCronAuthorized && !callerUid) {
            return NextResponse.json(
                { error: "No autorizado. Token de sesión o clave cron requerida." },
                { status: 401 }
            );
        }

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

        // 2. Validación de Propiedad del Post (IDOR protection)
        if (!isCronAuthorized && !isCallerAdmin && callerUid !== uid) {
            return NextResponse.json(
                { error: "No tienes permiso para publicar este post." },
                { status: 403 }
            );
        }

        const userSnap = await adminDb.collection("users").doc(uid).get();
        if (!userSnap.exists) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

        let userData = userSnap.data()!;
        let targetProfile: any = null;
        let targetProfileId = profileId || 'default';
        if (Array.isArray(userData.profiles)) {
            targetProfile = userData.profiles.find((p: any) => p.id === targetProfileId);
        }
        if (!targetProfile) targetProfile = userData;

        // Si es post de modo prueba, garantizar que use las cuentas y credenciales configuradas del usuario santisoftai@gmail.com
        // SEGURIDAD: Solo se permite testMode si la llamada viene de Cloud Tasks o de un administrador verificado
        let effectiveUid = uid;
        if ((post.isTestMode || post.testMode) && (isCronAuthorized || isCallerAdmin)) {
          try {
            const santiSnap = await adminDb.collection("users").where("email", "==", "santisoftai@gmail.com").limit(1).get();
            if (!santiSnap.empty) {
              const santiDoc = santiSnap.docs[0];
              effectiveUid = santiDoc.id;
              userData = santiDoc.data() || {};
              const sProfiles = Array.isArray(userData.profiles) ? userData.profiles : [];
              const profileWithTokens = sProfiles.find((p: any) => 
                p.instagramToken_enc || p.facebookToken_enc || p.tiktokToken_enc || p.googleBusinessToken_enc
              ) || sProfiles.find((p: any) => p.id === 'default') || sProfiles[0];
              if (profileWithTokens) {
                targetProfile = profileWithTokens;
                targetProfileId = profileWithTokens.id;
              } else {
                targetProfile = userData;
              }
            }
          } catch (santiErr) {
            console.warn("[publish-now] Error resolviendo credenciales santisoftai para test post:", santiErr);
          }
        }

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

        // Helper para asegurar trazabilidad total: NINGUNA operación puede quedar 'sin estado' (PF-07)
        const failPost = async (errorMessage: string, statusCode: number = 400) => {
            try {
                await postRef.update({
                    status: 'error',
                    publishError: errorMessage,
                    lastAttemptAt: new Date()
                });
                await adminDb.collection("admin_logs").add({
                    timestamp: new Date(),
                    action: 'publish_post_precheck_failed',
                    postId: postId,
                    userId: uid,
                    clientEmail: userData?.email || 'Desconocido',
                    status: 'error',
                    message: errorMessage
                }).catch(() => {});
            } catch (persistErr: any) {
                console.error("[publish-now] Error al registrar estado de fallo en post:", persistErr.message);
            }
            return NextResponse.json({ error: errorMessage }, { status: statusCode });
        };

        // --- QUOTA CHECK ---
        const usedQuota = await getQuotaUsageAdmin(uid, profileId || 'default');
        const limit = await getPlanLimitAdmin(userData.plan || 'free', userData.email);
        const postNetworkCount = post.networks?.length || 1;
        
        if (usedQuota + postNetworkCount > limit) {
             return await failPost("Límite de publicaciones del plan alcanzado. Mejora tu plan para seguir publicando.", 403);
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
                return await failPost("Facebook: Cuenta no vinculada o configuración faltante.", 400);
            }
            try {
                plainFbToken = decrypt(fbToken, ivFb, tagFb);
            } catch (e: any) {
                return await failPost("Facebook: Error al desencriptar el token de acceso.", 500);
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
                return await failPost("Instagram: Cuenta no vinculada o configuración faltante.", 400);
            }
            try {
                plainIgToken = decrypt(igToken, ivIg, tagIg);
            } catch (e: any) {
                return await failPost("Instagram: Error al desencriptar el token de acceso.", 500);
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
                return await failPost("LinkedIn: Cuenta no vinculada o configuración faltante.", 400);
            }
            try {
                plainLiToken = decrypt(liToken, ivLi, tagLi);
            } catch (e: any) {
                return await failPost("LinkedIn: Error al desencriptar el token de acceso.", 500);
            }
        }

        // Decrypt TikTok
        let plainTtToken = null;
        if (post.networks?.includes('tiktok')) {
            const ttToken = targetProfile.tiktokToken_enc || userData.tiktokToken_enc;
            const ivTt = targetProfile.iv_tt || userData.iv_tt;
            const tagTt = targetProfile.tag_tt || userData.tag_tt;
            if (!ttToken) {
                return await failPost("TikTok: Cuenta no vinculada o configuración faltante.", 400);
            }
            try {
                plainTtToken = decrypt(ttToken, ivTt, tagTt);
            } catch (e: any) {
                return await failPost("TikTok: Error al desencriptar el token de acceso.", 500);
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
                return await failPost("Google Business: Cuenta no vinculada o configuración faltante.", 400);
            }
            try {
                plainGbToken = decrypt(gbToken, ivGb, tagGb);
                if (gbRefreshToken && ivGbRef && tagGbRef) {
                    plainGbRefreshToken = decrypt(gbRefreshToken, ivGbRef, tagGbRef);
                }
            } catch (e: any) {
                return await failPost("Google Business: Error al desencriptar el token de acceso.", 500);
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
                return await failPost("YouTube: Cuenta no vinculada. Por favor conecta tu canal en Configuración.", 400);
            }
            try {
                plainYtToken = decrypt(ytToken, ivYt, tagYt);
                if (ytRefreshToken && ivYtRef && tagYtRef) {
                    plainYtRefreshToken = decrypt(ytRefreshToken, ivYtRef, tagYtRef);
                }
            } catch (e: any) {
                return await failPost("YouTube: Error al desencriptar el token de acceso.", 500);
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
                return await failPost("X (Twitter): Cuenta no vinculada. Por favor conecta tu cuenta de X en Configuración.", 400);
            }
            try {
                plainXToken = decrypt(xToken, ivX, tagX);
                if (xRefreshToken && ivXRef && tagXRef) {
                    plainXRefreshToken = decrypt(xRefreshToken, ivXRef, tagXRef);
                }
            } catch (e: any) {
                return await failPost("X (Twitter): Error al desencriptar el token de acceso.", 500);
            }
        }

        if (!post.networks || post.networks.length === 0) {
            return await failPost("No se seleccionó ninguna red social para publicar.", 400);
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
            uid: effectiveUid, profileId: targetProfileId
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
    const isExplicitlyFinalized = post.isCopyFinalized || post.creationMode === 'ai' || post.creationMode === 'manual';
    
    const copyLooksLikeInstruction = isExplicitlyFinalized ? false : (
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
    
    // Si el usuario finalizó explícitamente el copy en el editor, forzamos que TODAS las redes usen exactamente ese texto,
    // ignorando cualquier versión multi-red que se haya generado por error en el pasado.
    if (isExplicitlyFinalized) {
        post.copiesByNetwork = {
            facebook: caption,
            instagram: caption,
            youtube: caption,
            linkedin: caption,
            x: caption,
            tiktok: caption.length > 2200 ? caption.slice(0, 2197) + "..." : caption,
            defaultCopy: caption
        };
    }

    // Asegurar copys optimizados e independientes por red social (especialmente TikTok <= 140 chars)
    if (!isExplicitlyFinalized && (!post.copiesByNetwork || !post.copiesByNetwork.tiktok || post.copiesByNetwork.tiktok.length > 150 || copyLooksLikeInstruction)) {
        try {
            infoLog += `Generando copys especializados por red social (TikTok, Instagram, YouTube)... `;
            const { generateMultiNetworkCopiesWithAgent } = await import('../../../lib/agents/agent-copy');
            const multiCopies = await generateMultiNetworkCopiesWithAgent({
                idea: post.idea || post.text || post.copy || 'Publicación promocional del negocio',
                targetProfile,
                networks: post.networks || ['tiktok', 'instagram', 'facebook'],
                visualDirection: post.visualDirection || ''
            });
            post.copiesByNetwork = multiCopies;
            if (!post.copy || copyLooksLikeInstruction) {
                post.copy = multiCopies.instagram || multiCopies.defaultCopy;
                caption = post.copy;
            }
            await postRef.update({ 
                copiesByNetwork: multiCopies,
                copy: post.copy,
                autoGenerated: true,
                autoGeneratedCopy: true,
                autoGeneratedAt: new Date().toISOString()
            });
            infoLog += `Copys especializados generados y guardados exitosamente. `;
        } catch (copyErr: any) {
            console.error('[publishInBackground] Error en Agente de Copy Multi-Red:', copyErr);
            infoLog += `Fallo en Agente de Copy Multi-Red: ${copyErr.message}. `;
            caption = post.idea || post.text || post.copy || '';
        }
    }

    const isStory = Boolean(post.type?.toLowerCase().includes('stor') || post.type?.toLowerCase().includes('historia'));
    const isReel = !isStory && Boolean(
        post.type === 'video_reel' || post.type === 'reel' || post.type === 'Reel' || 
        (post.format && (post.format.toLowerCase().includes('reel') || post.format.toLowerCase().includes('short'))) ||
        (post.type && (post.type.toLowerCase().includes('reel') || post.type.toLowerCase().includes('short')))
    );

    let imageUrl = post.imageUrl;
    let videoUrl = post.videoUrl || post.mediaUrl || (isReel ? null : imageUrl);

    try {
        if (isReel) {
            const isAlreadyFullyRendered = Boolean(
                post.autoGeneratedReel && 
                post.videoUrl && 
                (post.videoUrl.includes('firebasestorage') || post.videoUrl.includes('storage.googleapis.com'))
            );

            if (!isAlreadyFullyRendered) {
                infoLog += `Componiendo Reel 9:16 con subtítulos Alex Hormozi y locución en Remotion... `;
                try {
                    let finalReelUrl = '';

                    if (Array.isArray(post.scenes) && post.scenes.length > 0) {
                        // Caso A: Post con escenas configuradas en Remotion
                        const { renderAndUploadReel } = await import('../../../lib/video-renderer');
                        finalReelUrl = await renderAndUploadReel({
                            ...post,
                            logoUrl: targetProfile?.logoUrl || post.logoUrl || '',
                            businessName: targetProfile?.name || ''
                        }, creds.uid, postId);
                    } else {
                        // Caso B: Generar Video Premium con n8n y superponer subtítulos y voz con Remotion
                        const rawExistingVideo = post.videoUrl || (post.imageUrl && (post.imageUrl.includes('.mp4') || post.imageUrl.includes('video')) ? post.imageUrl : null);
                        
                        if (rawExistingVideo) {
                            // Tenemos un video de fondo crudo, le estampamos Remotion (9:16 + subtítulos + voz)
                            const { generateVideoPoCComposition } = await import('../../../lib/video-poc-service');
                            const comp = await generateVideoPoCComposition({
                                topic: post.idea || post.text || post.copy || 'Reel Destacado',
                                rubro: targetProfile?.rubro || targetProfile?.businessType || 'General',
                                style: 'vibrante',
                                skipImages: true
                            });
                            const { renderAndUploadReel } = await import('../../../lib/video-renderer');
                            finalReelUrl = await renderAndUploadReel({
                                id: postId,
                                bgVideoUrl: rawExistingVideo,
                                scenes: comp.scenes,
                                audioScript: comp.audioScript,
                                showWatermark: post.showWatermark ?? false,
                                logoUrl: targetProfile?.logoUrl || post.logoUrl || '',
                                businessName: targetProfile?.name || ''
                            }, creds.uid, postId);
                        } else {
                            // Generar con agente de Video Premium con plantilla y resolución de imagen previa
                            let resolvedReelBaseImage: string | undefined = undefined;

                            // 1. Revisar si ya tiene foto de producto real subida
                            if (post.baseImageUrl && typeof post.baseImageUrl === 'string' && post.baseImageUrl.startsWith('http')) {
                                resolvedReelBaseImage = post.baseImageUrl;
                            } else if (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.startsWith('http') && !post.imageUrl.includes('.mp4') && !post.imageUrl.includes('.webm') && !post.imageUrl.includes('.mov')) {
                                resolvedReelBaseImage = post.imageUrl;
                            }

                            // 2. Si no tiene foto real, o needsBaseImageFirst es true:
                            // Primero generar la imagen publicitaria con nuestros agentes y luego el video
                            if (!resolvedReelBaseImage) {
                                infoLog += `Generando primero imagen publicitaria base con nuestros agentes para animación de video... `;
                                const { generateImageWithAgent } = await import('../../../lib/agents/agent-image');

                                const productFocus = post.productName 
                                    ? `Producto/servicio protagonista: "${post.productName}"${post.productDescription ? ` (${post.productDescription})` : ''}. ` 
                                    : '';

                                const imagePromptIdea = post.imageDirection 
                                    ? `${productFocus}${post.imageDirection}${post.visualStyle ? ` en estilo visual ${post.visualStyle}` : ''}. Contexto del post: ${post.idea || post.text || post.copy}`
                                    : `${productFocus}${post.idea || post.text || post.copy || 'Fotografía comercial publicitaria'}`;

                                try {
                                    resolvedReelBaseImage = await generateImageWithAgent({
                                        idea: imagePromptIdea,
                                        rubro: targetProfile?.rubro || targetProfile?.businessType || 'General',
                                        businessName: targetProfile?.name || '',
                                        businessDescription: targetProfile?.businessDescription || '',
                                        promotions: targetProfile?.promotions || '',
                                        customOffer: post.customOffer || '',
                                        productName: post.productName || undefined,
                                        productDescription: post.productDescription || undefined,
                                        bannerStyle: (targetProfile?.bannerStyle as any) || 'banner',
                                        aspectRatio: '9:16',
                                        logoPrompt: targetProfile?.logoPrompt || '',
                                        logoUrl: targetProfile?.logoUrl || '',
                                        userId: creds.uid,
                                        includeLogo: false,
                                        promptTemplateId: post.promptTemplateId || undefined,
                                        visualStyle: post.visualStyle || undefined,
                                        brandVisualIdentity: targetProfile?.visualIdentity || undefined,
                                    });
                                } catch (imgErr) {
                                    console.warn('[publishInBackground] Advertencia generando imagen previa para Reel:', imgErr);
                                }
                            }

                            const { generatePremiumVideoWithAgent } = await import('../../../lib/agents/agent-video-premium');
                            finalReelUrl = await generatePremiumVideoWithAgent({
                                postId,
                                idea: post.idea || post.text || post.copy || '',
                                rubro: targetProfile?.rubro || targetProfile?.businessType || 'General',
                                businessDescription: targetProfile?.businessDescription || '',
                                userId: creds.uid,
                                logoUrl: targetProfile?.logoUrl || post.logoUrl || '',
                                businessName: targetProfile?.name || '',
                                showWatermark: post.showWatermark ?? false,
                                imageUrl: resolvedReelBaseImage || undefined,
                                promptOverride: post.videoPrompt || undefined,
                                motionStyle: post.videoCommand || post.videoMotionStyle || 'cinematic_slow_push_in'
                            });
                        }
                    }

                    videoUrl = finalReelUrl;
                    post.videoUrl = finalReelUrl;
                    imageUrl = finalReelUrl;
                    post.imageUrl = finalReelUrl;
                    await postRef.update({ 
                        videoUrl: finalReelUrl,
                        imageUrl: finalReelUrl,
                        imageUrls: [finalReelUrl],
                        autoGenerated: true,
                        autoGeneratedReel: true,
                        autoGeneratedAt: new Date().toISOString()
                    });
                    infoLog += `Reel 9:16 con subtítulos Alex Hormozi y audio completado con éxito. `;
                } catch (reelErr: any) {
                    console.error('[publishInBackground] Error componiendo Reel en Remotion:', reelErr);
                    // Fallback de emergencia: Solo si realmente hay un video crudo (MP4/WebM/MOV)
                    const rawVid = post.videoUrl || (post.imageUrl && (post.imageUrl.includes('.mp4') || post.imageUrl.includes('.mov') || post.imageUrl.includes('.webm') || post.imageUrl.includes('video')) ? post.imageUrl : null);
                    if (rawVid) {
                        videoUrl = rawVid;
                        console.warn('[publishInBackground] Usando video crudo como fallback de emergencia.');
                    } else {
                        throw new Error(`Fallo al generar el video del Reel: ${reelErr.message}. Para publicar un Reel se requiere un archivo de video MP4.`);
                    }
                }
            } else {
                videoUrl = post.videoUrl;
            }
        } else {
            if (!imageUrl && !videoUrl) {
                infoLog += `Iniciando Agente 1 (Generación de Imagen con Claude-Banana & n8n/Pollinations)... `;
                try {
                    const { generateImageWithAgent } = await import('../../../lib/agents/agent-image');

                    // 1. Jerarquía Inteligente para Producto e Imagen Base:
                    // Nivel 1: Imagen base explícita del post o producto con foto real
                    // Nivel 2: Producto de catálogo asociado sin foto (generar desde cero con estilo)
                    // Nivel 3: Búsqueda dinámica en catálogo por coincidencia de texto
                    let resolvedBaseImage: string | undefined = undefined;
                    let resolvedProductName: string | undefined = post.productName || undefined;
                    let resolvedProductDesc: string | undefined = post.productDescription || undefined;
                    let resolvedProductPrice: string | undefined = post.productOfferPrice || post.productPrice || undefined;
                    let resolvedKeepOriginalPhoto: boolean = post.keepOriginalPhoto !== undefined
                        ? Boolean(post.keepOriginalPhoto)
                        : (targetProfile?.photoTreatment !== 'agent');
                    let resolvedFontStyle: any = post.fontStyle || "script_handwritten";
                    let imageSource: "uploaded_base" | "catalog_product" | "catalog_product_generated" | "business_description" = "business_description";

                    if (post.baseImageUrl && typeof post.baseImageUrl === 'string' && post.baseImageUrl.startsWith('http')) {
                        resolvedBaseImage = post.baseImageUrl;
                        imageSource = resolvedProductName ? "catalog_product" : "uploaded_base";
                    } else if (resolvedProductName) {
                        // Producto del catálogo asignado pero SIN foto previa: nuestros agentes generan la fotografía desde cero
                        imageSource = "catalog_product_generated";
                        console.log(`[publishInBackground] Post ${postId}: Producto de catálogo sin foto previa: "${resolvedProductName}". Nuestros agentes generarán la fotografía desde cero con el estilo visual.`);
                    } else {
                        try {
                            const catSnap = await adminDb
                                .collection("users")
                                .doc(post.userId)
                                .collection("catalogo")
                                .where("profileId", "==", post.profileId || "default")
                                .where("active", "==", true)
                                .get();

                            if (!catSnap.empty) {
                                const allItems = catSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
                                const postTextLower = `${post.idea || ""} ${post.text || ""} ${post.copy || ""} ${post.postText || ""}`.toLowerCase();
                                
                                const matchedItem = allItems.find((it) => {
                                    const nameLower = (it.name || "").toLowerCase();
                                    return nameLower.length > 2 && postTextLower.includes(nameLower);
                                });

                                const selectedItem = matchedItem || allItems.find((it) => it.imageUrl && it.imageUrl.startsWith("http")) || allItems[0];
                                if (selectedItem) {
                                    resolvedProductName = selectedItem.name;
                                    resolvedProductDesc = selectedItem.description;
                                    resolvedProductPrice = selectedItem.offerPrice || selectedItem.price || resolvedProductPrice;
                                    if (selectedItem.keepOriginalPhoto !== undefined) {
                                        resolvedKeepOriginalPhoto = Boolean(selectedItem.keepOriginalPhoto);
                                    }
                                    if (selectedItem.fontStyle) {
                                        resolvedFontStyle = selectedItem.fontStyle;
                                    }

                                    if (selectedItem.imageUrl && typeof selectedItem.imageUrl === "string" && selectedItem.imageUrl.startsWith("http")) {
                                        resolvedBaseImage = selectedItem.imageUrl;
                                        imageSource = "catalog_product";
                                        console.log(`[publishInBackground] Post ${postId}: Foto de catálogo vinculada: "${selectedItem.name}" (Foto Real: ${resolvedKeepOriginalPhoto})`);
                                    } else {
                                        imageSource = "catalog_product_generated";
                                        console.log(`[publishInBackground] Post ${postId}: Producto de catálogo sin foto vinculado: "${selectedItem.name}". Generando desde cero.`);
                                    }
                                }
                            }
                        } catch (catErr) {
                            console.warn('[publishInBackground] Error buscando producto en catálogo:', catErr);
                        }
                    }

                    let generatedImageUrl: string | null = null;
                    const isBannerMode = ((targetProfile?.bannerStyle as any) || 'banner') === 'banner';

                    if (resolvedKeepOriginalPhoto && resolvedBaseImage) {
                        if (isBannerMode) {
                            console.log(`[publishInBackground] 📸 Modo Foto Real + Cartel Publicitario activo para "${resolvedProductName}". Componiendo tipografía sobre foto original...`);
                            const { composeRealProductBanner } = await import("../../../lib/real-product-compositor");
                            generatedImageUrl = await composeRealProductBanner({
                                baseImageUrl: resolvedBaseImage,
                                productName: resolvedProductName || "Producto",
                                productDescription: resolvedProductDesc,
                                price: resolvedProductPrice,
                                idea: post.idea || caption,
                                rubro: targetProfile?.rubro || "Gastronomía",
                                businessName: targetProfile?.name || targetProfile?.businessName || "Mi Negocio",
                                fontStyle: resolvedFontStyle,
                                aspectRatio: isStory ? "9:16" : "1:1",
                                logoUrl: targetProfile?.logoUrl || "",
                                userId: creds.uid,
                                includeLogo: post.includeLogo === true || (post.includeLogo !== false && targetProfile?.alwaysIncludeLogo === true),
                            });
                        } else {
                            console.log(`[publishInBackground] 📸 Modo Foto Real Limpia (Sin Cartel) para "${resolvedProductName}". Usando foto original directa.`);
                            generatedImageUrl = resolvedBaseImage;
                        }
                    } else {
                        const productFocus = resolvedProductName 
                            ? `Producto/servicio protagonista: "${resolvedProductName}"${resolvedProductDesc ? ` (${resolvedProductDesc})` : ''}. ` 
                            : '';

                        const imagePromptIdea = post.imageDirection 
                            ? `${productFocus}${post.imageDirection}${post.visualStyle ? ` en estilo visual ${post.visualStyle}` : ''}. Contexto del post: ${post.idea || caption}`
                            : `${productFocus}${post.idea || caption || 'Fotografía promocional profesional'}`;

                        generatedImageUrl = await generateImageWithAgent({
                            idea: imagePromptIdea,
                            rubro: targetProfile?.rubro || 'General',
                            businessName: targetProfile?.name || '',
                            businessDescription: targetProfile?.businessDescription || '',
                            promotions: targetProfile?.promotions || '',
                            customOffer: post.customOffer || '',
                            productName: resolvedProductName,
                            productDescription: resolvedProductDesc,
                            bannerStyle: (targetProfile?.bannerStyle as any) || 'banner',
                            aspectRatio: isStory ? '9:16' : '1:1',
                            logoPrompt: targetProfile?.logoPrompt || '',
                            logoUrl: targetProfile?.logoUrl || '',
                            userId: creds.uid,
                            includeLogo: post.includeLogo === true || (post.includeLogo !== false && targetProfile?.alwaysIncludeLogo === true),
                            promptTemplateId: post.promptTemplateId || undefined,
                            visualStyle: post.visualStyle || undefined,
                            baseImageUrl: resolvedBaseImage,
                            brandVisualIdentity: targetProfile?.visualIdentity || undefined,
                        });
                    }
                    imageUrl = generatedImageUrl;
                    post.imageUrl = generatedImageUrl;
                    post.imageUrls = [generatedImageUrl];
                    await postRef.update({
                        imageUrl: generatedImageUrl,
                        imageUrls: [generatedImageUrl],
                        baseImageUrl: resolvedBaseImage || post.baseImageUrl || null,
                        productName: resolvedProductName || post.productName || null,
                        productDescription: resolvedProductDesc || post.productDescription || null,
                        hasProductImage: Boolean(resolvedBaseImage),
                        imageSource,
                        autoGenerated: true,
                        autoGeneratedImage: true,
                        autoGeneratedAt: new Date().toISOString()
                    });
                    infoLog += `Imagen generada exitosamente por Agente 1 (base: ${imageSource}). `;
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
                            message: post.copiesByNetwork?.facebook || post.facebookCopy || caption,
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
                } else if (isReel) {
                    if (!videoUrl) {
                        throw new Error("Facebook requiere un archivo de video MP4 válido para publicar Reels.");
                    }
                    const fbData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${pageId}/videos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            file_url: videoUrl,
                            description: post.copiesByNetwork?.facebook || post.facebookCopy || caption,
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
                    if (!imageUrl) {
                        throw new Error("Facebook requiere una imagen válida para publicar este post.");
                    }
                    const fbCaption = post.copiesByNetwork?.facebook || post.facebookCopy || caption;
                    const fbData = await fetchWithRetry(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: imageUrl,
                            message: fbCaption,
                            access_token: plainToken
                        })
                    });
                    
                    await adminDb.collection('external_posts').doc(fbData.id).set({
                       userId: creds.uid,
                       profileId: creds.profileId || 'default',
                       network: 'facebook',
                       caption: fbCaption,
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
                } else if (isReel) {
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
                    if (!imageUrl) {
                        throw new Error("Instagram requiere una imagen válida para publicar este post o historia.");
                    }
                    
                    const containerBody: any = {
                        image_url: imageUrl,
                        access_token: plainToken
                    };

                    if (isStory) {
                        containerBody.media_type = 'STORIES';
                    } else if (caption) {
                        containerBody.caption = post.copiesByNetwork?.instagram || post.instagramCopy || caption;
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
                                "text": post.copiesByNetwork?.linkedin || post.linkedinCopy || caption
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
                const targetMediaUrl = videoUrl || post.videoUrl || imageUrl || post.imageUrl;
                if (!targetMediaUrl) {
                    throw new Error("No se encontró ningún archivo de video MP4 generado para publicar en TikTok.");
                }

                console.log(`[TikTok Publish] Downloading video from: ${targetMediaUrl}`);
                const videoRes = await fetch(targetMediaUrl);
                if (!videoRes.ok) throw new Error(`No se pudo descargar el video para TikTok: HTTP ${videoRes.status}`);
                
                const videoBuffer = await videoRes.arrayBuffer();
                const videoSize = videoBuffer.byteLength;
                
                console.log(`[TikTok Publish] Video downloaded. Size: ${videoSize} bytes`);

                const privacyLevel = post.tiktokPrivacyLevel || "PUBLIC_TO_EVERYONE";
                const disableComment = post.tiktokAllowComment !== undefined ? !post.tiktokAllowComment : false;
                const disableDuet = post.tiktokAllowDuet !== undefined ? !post.tiktokAllowDuet : false;
                const disableStitch = post.tiktokAllowStitch !== undefined ? !post.tiktokAllowStitch : false;

                const postInfo: any = {
                    title: (post.copiesByNetwork?.tiktok || post.tiktokCopy || caption).slice(0, 150).trim() || 'Publicación',
                    privacy_level: privacyLevel,
                    disable_comment: disableComment,
                    disable_duet: disableDuet,
                    disable_stitch: disableStitch
                };

                if (post.tiktokContentDisclosure) {
                    if (post.tiktokYourBrand) postInfo.brand_organic_toggle = true;
                    if (post.tiktokBrandedContent) postInfo.brand_content_toggle = true;
                }
                if (post.tiktokIsAigc) {
                    postInfo.is_aigc = true;
                }

                let initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${plainToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        post_info: postInfo,
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

                const isGuidelinesError = initData.error?.code !== 'ok' && (
                    initData.error?.message?.toLowerCase().includes('guidelines') || 
                    JSON.stringify(initData).toLowerCase().includes('guidelines') ||
                    initData.error?.code === 'spam_or_sensitive_content' || 
                    initData.error?.code === 'unaudited_client_can_only_post_to_private_accounts' ||
                    initData.error?.code === 'invalid_params'
                );

                if (isGuidelinesError) {
                    console.warn('[TikTok Publish] Detected Sandbox mode or private account requirement. Retrying with SELF_ONLY privacy level...');
                    const sandboxPostInfo = { ...postInfo, privacy_level: "SELF_ONLY" };
                    initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${plainToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            post_info: sandboxPostInfo,
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
                        infoLog += "TikTok Sandbox: El video se subió exitosamente en modo privado 'Solo Yo' (Para publicarlo público a todo el mundo de forma directa, debes solicitar la revisión de tu App en el panel de desarrolladores de TikTok). ";
                    }
                }

                if (initData.error?.code !== 'ok' || !initData.data?.upload_url) {
                    const errCode = initData.error?.code || 'unknown_error';
                    const errMessage = initData.error?.message || JSON.stringify(initData);
                    throw new Error(`TikTok API error [${errCode}]: ${errMessage}`);
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

                    // 1. Título conciso y atractivo para YouTube Shorts (máximo 95 caracteres)
                    let cleanTitle = '';
                    if (post.idea && typeof post.idea === 'string' && post.idea.trim().length > 3) {
                        cleanTitle = post.idea.trim();
                    } else if (post.title && typeof post.title === 'string' && post.title.trim().length > 3) {
                        cleanTitle = post.title.trim();
                    } else {
                        const firstLine = (caption || '').split('\n')[0].trim();
                        cleanTitle = firstLine || 'Video de Santisoft';
                    }

                    cleanTitle = cleanTitle.replace(/^["']|["']$/g, '').trim();
                    if (cleanTitle.length > 95) {
                        cleanTitle = cleanTitle.slice(0, 92).trim();
                        const lastSpace = cleanTitle.lastIndexOf(' ');
                        if (lastSpace > 40) {
                            cleanTitle = cleanTitle.slice(0, lastSpace);
                        }
                    }

                    const titleText = cleanTitle;

                    // 2. Descripción completa con el copy persuasivo, datos de contacto y hashtags
                    let descText = (caption || post.copy || post.text || '').trim();
                    if (!descText.toLowerCase().includes('#shorts')) {
                        descText += '\n\n#Shorts #SantisoftAI';
                    }

                    const metadata = {
                        snippet: {
                            title: titleText,
                            description: descText,
                            tags: ['Shorts', 'SantisoftAI', 'MarketingDigital'],
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
