export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminAuth } from '../../../../lib/firebase-admin';
import { createSignedOAuthState, getSafeOrigin } from '../../../../lib/encryption';

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
        const origin = getSafeOrigin(searchParams.get('origin'));

        if (!profileId) {
            return NextResponse.json({ error: "profileId is required" }, { status: 400 });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json({ error: "Google Client ID no configurado en el servidor. Por favor agrégalo en tu archivo .env.local" }, { status: 500 });
        }

        const redirectUri = `${origin}/api/auth/google-business/callback`;
        const scopes = 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
        
        const state = encodeURIComponent(createSignedOAuthState({
            uid: decodedToken.uid,
            profileId,
            origin
        }));

        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;

        return NextResponse.json({ url });

    } catch (error: any) {
        console.error("Google Business Auth Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
