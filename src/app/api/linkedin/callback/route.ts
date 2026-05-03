import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { encrypt } from '../../../../lib/encryption';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
            console.error("LinkedIn OAuth Error:", error);
            const [,, origin] = decodeURIComponent(state || "").split('|');
            return NextResponse.redirect(`${origin || 'http://localhost:3003'}/automatizacion-rrss/panel/configuracion?linkedin=error`);
        }

        if (!code || !state) {
            return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
        }

        const decodedState = decodeURIComponent(state);
        const [uid, profileId, origin] = decodedState.split('|');

        if (!uid || !profileId) {
            return NextResponse.json({ error: "Invalid state" }, { status: 400 });
        }

        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        const redirectUri = `${origin}/api/linkedin/callback`;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: "LinkedIn App no configurada en entorno" }, { status: 500 });
        }

        // 1. Obtener Access Token
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        });

        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenParams.toString(),
        });

        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error("LinkedIn Token Error:", tokenData);
            return NextResponse.redirect(`${origin}/automatizacion-rrss/panel/configuracion?linkedin=error`);
        }

        const accessToken = tokenData.access_token;

        // 2. Obtener Info del Usuario para sacar el URN (person URN)
        const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        const meData = await meRes.json();
        const personUrn = `urn:li:person:${meData.sub}`;

        // 3. Guardar en Firebase
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

        profiles[index] = {
            ...profiles[index],
            linkedinUserToken_enc: encToken.encryptedData,
            iv_li_user: encToken.iv,
            tag_li_user: encToken.tag,
            linkedinPersonUrn: personUrn
        };

        await userDocRef.update({ profiles });

        return NextResponse.redirect(`${origin}/automatizacion-rrss/panel/configuracion?linkedin=success`);

    } catch (error: any) {
        console.error("LinkedIn Callback Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
