import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { decrypt } from '../../../../lib/encryption';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing token" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        
        const { searchParams } = new URL(req.url);
        const profileId = searchParams.get('profileId');
        const origin = searchParams.get('origin') || 'http://localhost:3002';

        if (!profileId) {
            return NextResponse.json({ error: "profileId is required" }, { status: 400 });
        }

        const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const profiles = userDoc.data()?.profiles || [];
        const profile = profiles.find((p: any) => p.id === profileId);

        if (!profile || !profile.linkedinClientId_enc) {
            return NextResponse.json({ error: "LinkedIn Client ID is not configured" }, { status: 400 });
        }

        // Descifrar Client ID
        const clientId = decrypt(profile.linkedinClientId_enc, profile.iv_li_id, profile.tag_li_id);
        if (!clientId) {
             return NextResponse.json({ error: "Error decoding Client ID" }, { status: 500 });
        }

        // Construir Redirect URI para LinkedIn
        const redirectUri = `${origin}/api/linkedin/callback`;
        const scope = encodeURIComponent('w_member_social profile openid email');
        // El state pasaremos el profileId para saber a quien guardar el token cuando regrese
        const state = encodeURIComponent(`${decodedToken.uid}|${profileId}|${origin}`);

        const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

        return NextResponse.json({ url });

    } catch (error: any) {
        console.error("LinkedIn Auth Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
