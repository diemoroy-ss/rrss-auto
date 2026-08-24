export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../../lib/firebase-admin';
import { decrypt } from '../../../../../lib/encryption';

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

        if (!profileId) {
            return NextResponse.json({ error: "profileId is required" }, { status: 400 });
        }

        const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const profiles = userDoc.data()?.profiles || [];
        const profile = profiles.find((p: any) => p.id === profileId);

        if (!profile || !profile.metaUserToken_enc) {
            return NextResponse.json({ error: "Meta User Token is not configured" }, { status: 400 });
        }

        // Descifrar Token
        const userAccessToken = decrypt(profile.metaUserToken_enc, profile.iv_meta_user, profile.tag_meta_user);
        if (!userAccessToken) {
             return NextResponse.json({ error: "Error decoding Token" }, { status: 500 });
        }

        // 1. Verificar permisos otorgados para diagnóstico
        try {
            const permRes = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${userAccessToken}`);
            const permData = await permRes.json();
            console.log("[Meta Pages] Permisos del token:", JSON.stringify(permData));
        } catch (pErr) {
            console.warn("[Meta Pages] No se pudieron leer permisos:", pErr);
        }

        const pageMap = new Map<string, any>();

        // 2. Consultar páginas directas del usuario (/me/accounts)
        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}&access_token=${userAccessToken}`;
        const res = await fetch(pagesUrl);
        const data = await res.json();
        console.log("[Meta Pages] Respuesta /me/accounts:", JSON.stringify(data));

        if (data.data && Array.isArray(data.data)) {
            for (const page of data.data) {
                pageMap.set(page.id, page);
            }
        }

        // 3. Si no hay páginas o para complementar, consultar portfolios de negocios (/me/businesses)
        try {
            const bizUrl = `https://graph.facebook.com/v19.0/me/businesses?fields=id,name,owned_pages{id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}},client_pages{id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}}&access_token=${userAccessToken}`;
            const bizRes = await fetch(bizUrl);
            const bizData = await bizRes.json();
            console.log("[Meta Pages] Respuesta /me/businesses:", JSON.stringify(bizData));

            if (bizData.data && Array.isArray(bizData.data)) {
                for (const biz of bizData.data) {
                    const owned = biz.owned_pages?.data || [];
                    const client = biz.client_pages?.data || [];
                    for (const page of [...owned, ...client]) {
                        if (!pageMap.has(page.id)) {
                            pageMap.set(page.id, page);
                        }
                    }
                }
            }
        } catch (bizErr) {
            console.warn("[Meta Pages] Error consultando /me/businesses:", bizErr);
        }

        const allPages = Array.from(pageMap.values());
        console.log(`[Meta Pages] Total páginas encontradas: ${allPages.length}`);

        if (data.error && allPages.length === 0) {
             return NextResponse.json({ error: data.error.message }, { status: 500 });
        }

        // DIAGNÓSTICO TEMPORAL: incluir debug info en la respuesta cuando no hay páginas
        if (allPages.length === 0) {
            let debugInfo: any = {
                me_accounts_raw: data,
                biz_query_attempted: true,
            };
            try {
                const permRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${userAccessToken}`);
                debugInfo.me = await permRes.json();
                const bizRes2 = await fetch(`https://graph.facebook.com/v19.0/me/businesses?fields=id,name&access_token=${userAccessToken}`);
                debugInfo.businesses = await bizRes2.json();
            } catch (e) {}
            console.log("[Meta Pages] DEBUG SIN PÁGINAS:", JSON.stringify(debugInfo));
            return NextResponse.json({ data: [], _debug: debugInfo });
        }

        return NextResponse.json({ data: allPages });

    } catch (error: any) {
        console.error("Meta Pages Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
