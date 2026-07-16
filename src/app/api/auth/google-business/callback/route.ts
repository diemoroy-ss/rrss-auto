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
            console.error("Google OAuth Error:", error);
            const [,, origin] = decodeURIComponent(state || "").split('|');
            return NextResponse.redirect(`${origin || 'http://localhost:3003'}/automatizacion-rrss/panel/configuracion?google-business=error`);
        }

        if (!code || !state) {
            return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
        }

        const decodedState = decodeURIComponent(state);
        const [uid, profileId, origin] = decodedState.split('|');

        if (!uid || !profileId) {
            return NextResponse.json({ error: "Invalid state" }, { status: 400 });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${origin}/api/auth/google-business/callback`;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: "Google credentials not configured" }, { status: 500 });
        }

        // Exchange code for tokens
        const tokenUrl = 'https://oauth2.googleapis.com/token';
        const res = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await res.json();
        if (tokenData.error) {
            console.error("Token Exchange Error:", tokenData.error);
            return NextResponse.redirect(`${origin}/automatizacion-rrss/panel/configuracion?google-business=error`);
        }

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;

        // Fetch Google Profile to get user name
        let googleBusinessName = "Mi Local Google";
        try {
            const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const profileData = await profileRes.json();
            if (profileData.name) {
                googleBusinessName = profileData.name;
            }
        } catch (e) {
            console.warn("Failed to fetch google user profile:", e);
        }

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

        const encToken = encrypt(accessToken);
        const encRefresh = refreshToken ? encrypt(refreshToken) : null;

        profiles[index] = {
            ...profiles[index],
            googleBusinessToken_enc: encToken.encryptedData,
            iv_gb: encToken.iv,
            tag_gb: encToken.authTag,
            googleBusinessName,
            ...(encRefresh ? {
                googleBusinessRefreshToken_enc: encRefresh.encryptedData,
                iv_gb_refresh: encRefresh.iv,
                tag_gb_refresh: encRefresh.authTag,
            } : {})
        };

        await userDocRef.update({ profiles });

        return NextResponse.redirect(`${origin}/automatizacion-rrss/panel/configuracion?google-business=success`);

    } catch (error: any) {
        console.error("Google Callback Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
