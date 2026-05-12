import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';

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
        const origin = searchParams.get('origin') || 'http://localhost:3003';

        if (!profileId) {
            return NextResponse.json({ error: "profileId is required" }, { status: 400 });
        }

        const clientId = process.env.LINKEDIN_CLIENT_ID;
        if (!clientId) {
             return NextResponse.json({ error: "LinkedIn Client ID is not configured in environment" }, { status: 500 });
        }

        // Construir Redirect URI para LinkedIn
        const redirectUri = `${origin}/api/linkedin/callback`;
        // Use configured scope from env, or fallback to safe default (w_member_social profile openid email)
        // because requesting w_organization_social will fail if the app is not approved for Community Management API / Marketing Developer Platform
        const configuredScope = process.env.LINKEDIN_SCOPE || 'w_member_social profile openid email';
        const scope = encodeURIComponent(configuredScope);
        // El state pasaremos el profileId para saber a quien guardar el token cuando regrese
        const state = encodeURIComponent(`${decodedToken.uid}|${profileId}|${origin}`);

        const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

        return NextResponse.json({ url });

    } catch (error: any) {
        console.error("LinkedIn Auth Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
