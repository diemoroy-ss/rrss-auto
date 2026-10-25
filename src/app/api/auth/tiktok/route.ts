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

        const clientKey = process.env.TIKTOK_CLIENT_KEY;
        if (!clientKey) {
            return NextResponse.json({ error: "TikTok App no configurada en el servidor (TIKTOK_CLIENT_KEY faltante)" }, { status: 500 });
        }

        // TikTok sólo tiene aprobada la URI de rrss.santisoft.cl. Usamos Puente OAuth.
        const approvedBase = "https://rrss.santisoft.cl";
        const redirectUri = `${approvedBase}/api/auth/tiktok/callback`;
        const scopes = 'user.info.basic,video.publish,video.upload';
        
        // El origin real (ej: https://socialpilot.cl) viaja dentro de un state firmado criptográficamente
        const state = encodeURIComponent(createSignedOAuthState({
            uid: decodedToken.uid,
            profileId,
            origin
        }));

        const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

        return NextResponse.json({ url });

    } catch (error: any) {
        console.error("TikTok Auth Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
