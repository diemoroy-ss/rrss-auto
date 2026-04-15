import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { decrypt, encrypt } from '../../../../lib/encryption';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error || !state) {
            console.error("LinkedIn OAuth Error:", error, errorDescription);
            const fallbackOrigin = state?.split('|')?.[2] || 'http://localhost:3002';
            return NextResponse.redirect(`${fallbackOrigin}/automatizacion-rrss/panel/configuracion?error=${encodeURIComponent(errorDescription || 'Error auth')}`);
        }

        if (!code) {
             return new NextResponse("Authorization code missing", { status: 400 });
        }

        // Parse State: uid|profileId|origin
        const [uid, profileId, origin] = decodeURIComponent(state).split('|');
        if (!uid || !profileId || !origin) {
            return new NextResponse("Invalid state format", { status: 400 });
        }

        const userRef = adminDb.collection("users").doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) return new NextResponse("User not found", { status: 404 });

        let profiles = userDoc.data()?.profiles || [];
        const profileIndex = profiles.findIndex((p: any) => p.id === profileId);

        if (profileIndex === -1) {
            return new NextResponse("Profile not found", { status: 404 });
        }

        const profile = profiles[profileIndex];

        if (!profile.linkedinClientId_enc || !profile.linkedinClientSecret_enc) {
            return new NextResponse("LinkedIn API Credentials not found in Profile", { status: 400 });
        }

        // Decrypt ID & Secret
        const clientId = decrypt(profile.linkedinClientId_enc, profile.iv_li_id, profile.tag_li_id);
        const clientSecret = decrypt(profile.linkedinClientSecret_enc, profile.iv_li_secret, profile.tag_li_secret);
        
        if (!clientId || !clientSecret) {
            return new NextResponse("Failed to decrypt credentials", { status: 500 });
        }

        const redirectUri = `${origin}/api/linkedin/callback`;

        // Exchange code for Access Token
        const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
                client_id: clientId,
                client_secret: clientSecret
            }).toString()
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) {
            console.error("Token Exchange Error:", tokenData);
            return NextResponse.redirect(`${origin}/automatizacion-rrss/panel/configuracion?error=${encodeURIComponent('Token exchange failed')}`);
        }

        const accessToken = tokenData.access_token;

        // Fetch user URN via OpenID userinfo
        const userInfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });
        const userInfo = await userInfoRes.json();
        if (userInfo.error) {
            console.error("UserInfo Fetch Error:", userInfo);
            return NextResponse.redirect(`${origin}/automatizacion-rrss/panel/configuracion?error=${encodeURIComponent('Failed to fetch user URN')}`);
        }

        const personUrn = `urn:li:person:${userInfo.sub}`;

        // Encrypt the Access Token
        const encryptedToken = encrypt(accessToken);

        // Update the profile array
        profiles[profileIndex] = {
            ...profile,
            linkedinToken_enc: encryptedToken.encryptedData,
            iv_li_token: encryptedToken.iv,
            tag_li_token: encryptedToken.authTag,
            linkedinPersonUrn: personUrn
        };

        // Save to DB
        await userRef.update({ profiles });

        // Redirect back to React UI
        return NextResponse.redirect(`${origin}/automatizacion-rrss/panel/configuracion?success=linkedin_linked`);

    } catch (e: any) {
        console.error("Callback Error:", e);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
