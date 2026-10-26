export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';
import { encrypt, verifySignedOAuthState, getSafeOrigin } from '../../../../../lib/encryption';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        const verifiedState = verifySignedOAuthState(state);
        const safeOrigin = verifiedState?.origin || getSafeOrigin();

        if (error) {
            console.error("Meta OAuth Error:", error);
            // Redirigir al panel con error a un origen seguro verificado
            return NextResponse.redirect(`${safeOrigin}/automatizacion-rrss/panel/configuracion?meta=error`);
        }

        if (!code || !verifiedState) {
            return NextResponse.json({ error: "Missing or invalid OAuth state" }, { status: 400 });
        }

        const { uid, profileId, origin } = verifiedState;

        const clientId = process.env.META_CLIENT_ID;
        const clientSecret = process.env.META_CLIENT_SECRET;
        const redirectUri = `${origin}/api/auth/meta/callback`;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: "Meta App no configurada" }, { status: 500 });
        }

        // 1. Obtener Short-Lived Token
        const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
        
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error("Token Error:", tokenData.error);
            return NextResponse.redirect(`${origin}/automatizacion-rrss/panel/configuracion?meta=error`);
        }

        const shortLivedToken = tokenData.access_token;

        // 2. Obtener Long-Lived Token
        const longTokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`;
        
        const longTokenRes = await fetch(longTokenUrl);
        const longTokenData = await longTokenRes.json();

        const userAccessToken = longTokenData.access_token || shortLivedToken; // Fallback si no devuelve long lived

        // 3. Guardar el User Access Token cifrado en el perfil
        const userDocRef = adminDb.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const profiles = userDoc.data()?.profiles || [];
        const index = profiles.findIndex((p: any) => p.id === profileId);

        if (index === -1) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const enc = encrypt(userAccessToken);
        
        const expiresIn = longTokenData.expires_in || tokenData.expires_in || 5184000;
        const metaTokenExpiresAt = Date.now() + expiresIn * 1000;

        profiles[index] = {
            ...profiles[index],
            metaUserToken_enc: enc.encryptedData,
            iv_meta_user: enc.iv,
            tag_meta_user: enc.authTag,
            metaTokenExpiresAt
        };

        // 4. Intentar renovar automáticamente la Página de Facebook y la cuenta de Instagram
        const currentProfile = profiles[index];
        let autoUpdated = false;

        try {
            const pageMap = new Map<string, any>();

            // Consultar páginas directas del usuario (/me/accounts)
            const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}&access_token=${userAccessToken}`;
            const pagesRes = await fetch(pagesUrl);
            const pagesData = await pagesRes.json();

            if (pagesData.data && Array.isArray(pagesData.data)) {
                for (const p of pagesData.data) {
                    pageMap.set(p.id, p);
                }
            }

            // Consultar portafolios comerciales (/me/businesses) si aplica
            try {
                const bizUrl = `https://graph.facebook.com/v19.0/me/businesses?fields=id,name,owned_pages{id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}},client_pages{id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}}&access_token=${userAccessToken}`;
                const bizRes = await fetch(bizUrl);
                const bizData = await bizRes.json();
                if (bizData.data && Array.isArray(bizData.data)) {
                    for (const biz of bizData.data) {
                        const owned = biz.owned_pages?.data || [];
                        const client = biz.client_pages?.data || [];
                        for (const p of [...owned, ...client]) {
                            if (!pageMap.has(p.id)) {
                                pageMap.set(p.id, p);
                            }
                        }
                    }
                }
            } catch (bizErr) {
                console.warn("[Meta Callback] Error consultando /me/businesses:", bizErr);
            }

            const allPages = Array.from(pageMap.values());
            console.log(`[Meta Callback] Total páginas encontradas: ${allPages.length}`);

            let targetPage = null;
            if (currentProfile.facebookPageId) {
                targetPage = allPages.find((p: any) => p.id === currentProfile.facebookPageId);
            }

            // Si no coincide con el anterior o no había anterior, pero solo hay una página disponible, vincularla automáticamente
            if (!targetPage && allPages.length === 1) {
                targetPage = allPages[0];
            }

            if (targetPage && targetPage.access_token) {
                const encFb = encrypt(targetPage.access_token);
                profiles[index].facebookToken_enc = encFb.encryptedData;
                profiles[index].iv_fb = encFb.iv;
                profiles[index].tag_fb = encFb.authTag;
                profiles[index].facebookPageId = targetPage.id;
                profiles[index].facebookPageName = targetPage.name;

                if (targetPage.instagram_business_account) {
                    const encIg = encrypt(targetPage.access_token);
                    profiles[index].instagramToken_enc = encIg.encryptedData;
                    profiles[index].iv_ig = encIg.iv;
                    profiles[index].tag_ig = encIg.authTag;
                    profiles[index].instagramAccountId = targetPage.instagram_business_account.id;
                    profiles[index].instagramUsername = targetPage.instagram_business_account.username;
                }

                autoUpdated = true;
                console.log(`[Meta Callback] Página auto-actualizada exitosamente: ${targetPage.name} (${targetPage.id})`);
            }
        } catch (pageErr) {
            console.error("[Meta Callback] Error al auto-renovar página:", pageErr);
        }

        await userDocRef.update({ profiles });

        if (autoUpdated) {
            return NextResponse.redirect(`${safeOrigin}/automatizacion-rrss/panel/configuracion?tab=conexiones&meta=updated`);
        } else if (!currentProfile.facebookPageId) {
            return NextResponse.redirect(`${safeOrigin}/automatizacion-rrss/panel/configuracion?tab=conexiones&meta=select`);
        } else {
            return NextResponse.redirect(`${safeOrigin}/automatizacion-rrss/panel/configuracion?tab=conexiones&meta=success`);
        }

    } catch (error: any) {
        console.error("Meta Callback Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
