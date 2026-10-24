export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';
import { encrypt } from '../../../../../lib/encryption';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
            console.error("TikTok OAuth Error:", error);
            const [,, origin] = decodeURIComponent(state || "").split('|');
            return NextResponse.redirect(`${origin || 'http://localhost:3003'}/automatizacion-rrss/panel/configuracion?tiktok=error`);
        }

        if (!code || !state) {
            return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
        }

        const decodedState = decodeURIComponent(state);
        const [uid, profileId, origin] = decodedState.split('|');

        if (!uid || !profileId) {
            return NextResponse.json({ error: "Invalid state" }, { status: 400 });
        }

        const clientKey = process.env.TIKTOK_CLIENT_KEY;
        const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
        // La redirect_uri enviada al canjear el token debe ser idéntica a la autorizada en TikTok
        const approvedBase = "https://rrss.santisoft.cl";
        const redirectUri = `${approvedBase}/api/auth/tiktok/callback`;

        if (!clientKey || !clientSecret) {
            return NextResponse.json({ error: "TikTok App no configurada en entorno" }, { status: 500 });
        }

        // 1. Obtener Access Token de TikTok
        const tokenParams = new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
        });

        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenParams.toString(),
        });

        const tokenData = await tokenRes.json();

        if (tokenData.error || !tokenData.access_token) {
            console.error("TikTok Token Error:", tokenData);
            return NextResponse.redirect(`${origin}/automatizacion-rrss/panel/configuracion?tiktok=error`);
        }

        const accessToken = tokenData.access_token;
        const expiresIn = tokenData.expires_in;

        // 2. Obtener Perfil de TikTok (para sacar el username/display_name)
        let username = "Usuario de TikTok";
        try {
            const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            const userData = await userRes.json();
            if (userData.data && userData.data.user) {
                username = userData.data.user.display_name || username;
            }
        } catch (uErr) {
            console.warn("Could not fetch TikTok user info, falling back to default name:", uErr);
        }

        // 3. Cifrar Token y guardar en Firestore
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

        // --- ACCOUNT LOCK VALIDATION ---
        const plansDoc = await adminDb.collection('system_config').doc('plans').get();
        const allPlans = plansDoc.exists ? plansDoc.data() as any : {};
        const userPlan = userDoc.data()?.plan || 'free';
        const planInfo = allPlans[userPlan] || {};
        const isBusinessPlan = !!planInfo.multiAccount;

        if (!isBusinessPlan) {
            const targetProfile = profiles[index];
            const locks = targetProfile.accountLocks || {};
            const newTiktokUsername = username;
            // Lock is based on username. If locked and different → block.
            if (locks.tiktok && locks.tiktok !== newTiktokUsername) {
                return NextResponse.redirect(`${origin}/automatizacion-rrss/panel/configuracion?tiktok=locked`);
            }
        }
        // --------------------------------

        const encToken = encrypt(accessToken);
        const tiktokTokenExpiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;

        profiles[index] = {
            ...profiles[index],
            tiktokToken_enc: encToken.encryptedData,
            iv_tt: encToken.iv,
            tag_tt: encToken.authTag,
            tiktokUsername: username,
            ...(tiktokTokenExpiresAt ? { tiktokTokenExpiresAt } : {})
        };

        await userDocRef.update({ profiles });

        return NextResponse.redirect(`${origin}/automatizacion-rrss/panel/configuracion?tiktok=success`);

    } catch (error: any) {
        console.error("TikTok Callback Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
