export const dynamic = 'force-dynamic';

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

        const clientId = process.env.META_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json({ error: "Meta App no configurada en el servidor" }, { status: 500 });
        }

        const redirectUri = `${origin}/api/auth/meta/callback`;
        const scopes = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
        
        // Pass UID, profileId, and origin in state
        const state = encodeURIComponent(`${decodedToken.uid}|${profileId}|${origin}`);

        // Enviar siempre scopes explícitos de Páginas e Instagram con rerequest para forzar a Meta a solicitar permisos de activos
        const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code&auth_type=rerequest&scope=${encodeURIComponent(scopes)}`;

        return NextResponse.json({ url });

    } catch (error: any) {
        console.error("Meta Auth Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
