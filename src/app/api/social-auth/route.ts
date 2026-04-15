import { NextResponse } from 'next/server';
import { encrypt } from '../../../lib/encryption';

async function validatefb(token: string, pageId: string) {
    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}?access_token=${token}&fields=name`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || "Token de Facebook inválido");
        return true;
    } catch (e: any) {
        throw new Error(`Facebook: ${e.message}`);
    }
}

async function validateIg(token: string, accountId: string) {
    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${accountId}?access_token=${token}&fields=name,username`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || "Token de Instagram inválido");
        return true;
    } catch (e: any) {
        throw new Error(`Instagram: ${e.message}`);
    }
}

import { adminAuth, adminDb } from '../../../lib/firebase-admin';

export async function POST(req: Request) {
    try {
        if (!adminAuth || !adminDb) {
            return NextResponse.json({ error: 'Firebase Admin no inicializado' }, { status: 500 });
        }

        const body = await req.json();
        const { idToken, uid, setAccounts, profileId } = body;

        if (!idToken || !uid || !profileId) {
            return NextResponse.json({ error: "idToken, uid, and profileId are required" }, { status: 400 });
        }

        // 1. Authenticate Request via Admin SDK
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
            if (decodedToken.uid !== uid) throw new Error("Token mismatch");
        } catch (e) {
            return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
        }

        // 2. Validate external Tokens
        try {
            if (setAccounts.facebook?.token && setAccounts.facebook?.pageId) {
                await validatefb(setAccounts.facebook.token, setAccounts.facebook.pageId);
            }
            if (setAccounts.instagram?.token && setAccounts.instagram?.accountId) {
                await validateIg(setAccounts.instagram.token, setAccounts.instagram.accountId);
            }
        } catch (valError: any) {
            return NextResponse.json({ error: valError.message }, { status: 400 });
        }

        // 3. Update Isolated Profile Data
        const userRef = adminDb.collection("users").doc(uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User no encontrado" }, { status: 404 });
        }

        const userData = userDoc.data() || {};
        let profiles = userData.profiles || [];
        
        let profileFound = false;
        
        profiles = profiles.map((p: any) => {
            if (p.id === profileId) {
                profileFound = true;
                const newP = { ...p };
                
                if (setAccounts.facebook) {
                    const { token, pageId, adAccountId } = setAccounts.facebook;
                    if (token) {
                        const { encryptedData, iv, authTag } = encrypt(token);
                        newP.facebookToken_enc = encryptedData;
                        newP.iv_fb = iv;
                        newP.tag_fb = authTag;
                        newP.facebookPageId = pageId || '';
                        newP.metaAdAccountId = adAccountId || '';
                    } else if (pageId === "") { // Disconnect
                        newP.facebookToken_enc = "";
                        newP.iv_fb = "";
                        newP.tag_fb = "";
                        newP.facebookPageId = "";
                        newP.metaAdAccountId = "";
                    }
                }

                if (setAccounts.instagram) {
                    const { token, accountId } = setAccounts.instagram;
                    if (token) {
                        const { encryptedData, iv, authTag } = encrypt(token);
                        newP.instagramToken_enc = encryptedData;
                        newP.iv_ig = iv;
                        newP.tag_ig = authTag;
                        newP.instagramAccountId = accountId || '';
                    } else if (accountId === "") { // Disconnect
                        newP.instagramToken_enc = "";
                        newP.iv_ig = "";
                        newP.tag_ig = "";
                        newP.instagramAccountId = "";
                    }
                }

                if (setAccounts.linkedin) {
                    const { clientId, clientSecret } = setAccounts.linkedin;
                    if (clientId && clientSecret) {
                        const encryptedId = encrypt(clientId);
                        const encryptedSecret = encrypt(clientSecret);
                        
                        newP.linkedinClientId_enc = encryptedId.encryptedData;
                        newP.linkedinClientSecret_enc = encryptedSecret.encryptedData;
                        // Use a single IV, tag for simplicity, or we can use the main one. The encrypt function generates a random IV each time, so we need to store them.
                        // Let's store the secret's IV and tag in iv_li and tag_li. For the ID, we can store iv_li_id, tag_li_id... wait.
                        // Because encrypt() returns a different IV/Tag for each call, we should store them.
                        newP.iv_li_id = encryptedId.iv;
                        newP.tag_li_id = encryptedId.authTag;
                        newP.iv_li_secret = encryptedSecret.iv;
                        newP.tag_li_secret = encryptedSecret.authTag;
                    } else if (clientId === "") { // Disconnect
                        newP.linkedinClientId_enc = "";
                        newP.linkedinClientSecret_enc = "";
                        newP.iv_li_id = "";
                        newP.tag_li_id = "";
                        newP.iv_li_secret = "";
                        newP.tag_li_secret = "";
                        newP.linkedinToken_enc = ""; // Also wipe access token if disconnected
                        newP.linkedinPersonUrn = "";
                    }
                }
                
                return newP;
            }
            return p;
        });

        if (!profileFound) {
            return NextResponse.json({ error: "Perfil Business no encontrado dentro del usuario" }, { status: 404 });
        }

        await userRef.update({ profiles });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error in social-auth API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
