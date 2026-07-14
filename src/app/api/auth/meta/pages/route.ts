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

        // Consultar páginas
        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${userAccessToken}`;
        
        const res = await fetch(pagesUrl);
        const data = await res.json();

        console.log("DEBUG FB me/accounts response:", JSON.stringify(data));

        if (data.error) {
             return NextResponse.json({ error: data.error.message }, { status: 500 });
        }

        return NextResponse.json({ data: data.data || [] });

    } catch (error: any) {
        console.error("Meta Pages Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
