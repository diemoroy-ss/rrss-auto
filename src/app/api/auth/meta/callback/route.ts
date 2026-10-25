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
        
        const expiresIn = longTokenData.expires_in || tokenData.expires_in;
        const metaTokenExpiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;

        profiles[index] = {
            ...profiles[index],
            metaUserToken_enc: enc.encryptedData,
            iv_meta_user: enc.iv,
            tag_meta_user: enc.authTag,
            ...(metaTokenExpiresAt ? { metaTokenExpiresAt } : {})
        };

        await userDocRef.update({ profiles });

        return NextResponse.redirect(`${origin}/automatizacion-rrss/panel/configuracion?meta=success`);

    } catch (error: any) {
        console.error("Meta Callback Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
