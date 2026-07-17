import { NextResponse } from 'next/server';
import { encrypt } from '../../../lib/encryption';

async function validatefb(token: string, pageId: string) {
    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}?access_token=${token}&fields=name`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || "Token de Facebook inválido");
        return data.name || "Página de Facebook";
    } catch (e: any) {
        throw new Error(`Facebook: ${e.message}`);
    }
}

async function validateIg(token: string, accountId: string) {
    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${accountId}?access_token=${token}&fields=name,username`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || "Token de Instagram inválido");
        return data.username || "Usuario de Instagram";
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
        let fbPageName = "";
        let igUsername = "";
        try {
            if (setAccounts.facebook?.token && setAccounts.facebook?.pageId) {
                fbPageName = await validatefb(setAccounts.facebook.token, setAccounts.facebook.pageId);
            }
            if (setAccounts.instagram?.token && setAccounts.instagram?.accountId) {
                igUsername = await validateIg(setAccounts.instagram.token, setAccounts.instagram.accountId);
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

        // --- ACCOUNT LOCK VALIDATION (non-business plans) ---
        // Fetch plan config
        const plansDoc = await adminDb.collection('system_config').doc('plans').get();
        const allPlans = plansDoc.exists ? plansDoc.data() as any : {};
        const userPlan = userData.plan || 'free';
        const planInfo = allPlans[userPlan] || {};
        const isBusinessPlan = !!planInfo.multiAccount;

        if (!isBusinessPlan) {
            const targetProfile = profiles.find((p: any) => p.id === profileId);
            if (targetProfile) {
                const locks = targetProfile.accountLocks || {};

                // Facebook lock check
                if (setAccounts.facebook?.pageId && setAccounts.facebook.pageId !== "" && locks.facebook && locks.facebook !== setAccounts.facebook.pageId) {
                    return NextResponse.json({
                        error: `🔒 Tu cuenta ya está vinculada a la página "${targetProfile.facebookPageName || locks.facebook}". Para gestionar múltiples cuentas de Facebook, actualiza al Plan Business.`,
                        errorCode: 'ACCOUNT_LOCKED',
                        upgradeRequired: true
                    }, { status: 403 });
                }

                // Instagram lock check
                if (setAccounts.instagram?.accountId && setAccounts.instagram.accountId !== "" && locks.instagram && locks.instagram !== setAccounts.instagram.accountId) {
                    return NextResponse.json({
                        error: `🔒 Tu cuenta ya está vinculada al perfil de Instagram "@${targetProfile.instagramUsername || locks.instagram}". Para gestionar múltiples cuentas, actualiza al Plan Business.`,
                        errorCode: 'ACCOUNT_LOCKED',
                        upgradeRequired: true
                    }, { status: 403 });
                }
            }
        }
        // ---------------------------------------------------

        let profileFound = false;
        
        profiles = profiles.map((p: any) => {
            if (p.id === profileId) {
                profileFound = true;
                const newP = { ...p };
                
                if (setAccounts.facebook) {
                    const { token, pageId, adAccountId, name } = setAccounts.facebook;
                    
                    if (token) {
                        const { encryptedData, iv, authTag } = encrypt(token);
                        newP.facebookToken_enc = encryptedData;
                        newP.iv_fb = iv;
                        newP.tag_fb = authTag;
                    }
                    
                    if (pageId !== undefined) newP.facebookPageId = pageId;
                    if (adAccountId !== undefined) newP.metaAdAccountId = adAccountId;
                    
                    if (name !== undefined) {
                        newP.facebookPageName = name;
                    } else if (fbPageName) {
                        newP.facebookPageName = fbPageName;
                    }

                    // Specific Disconnect Logic
                    if (pageId === "") {
                        newP.facebookToken_enc = "";
                        newP.iv_fb = "";
                        newP.tag_fb = "";
                        newP.facebookPageName = "";
                    }
                }

                if (setAccounts.instagram) {
                    const { token, accountId, username } = setAccounts.instagram;
                    
                    if (token) {
                        const { encryptedData, iv, authTag } = encrypt(token);
                        newP.instagramToken_enc = encryptedData;
                        newP.iv_ig = iv;
                        newP.tag_ig = authTag;
                    }

                    if (accountId !== undefined) newP.instagramAccountId = accountId;
                    
                    if (username !== undefined) {
                        newP.instagramUsername = username;
                    } else if (igUsername) {
                        newP.instagramUsername = igUsername;
                    }

                    // Disconnect
                    if (accountId === "") {
                        newP.instagramToken_enc = "";
                        newP.iv_ig = "";
                        newP.tag_ig = "";
                        newP.instagramUsername = "";
                    }
                }

                if (setAccounts.linkedin) {
                    const { clientId, clientSecret, companyUrn, disconnect } = setAccounts.linkedin;
                    
                    if (companyUrn !== undefined) {
                        newP.linkedinCompanyUrn = companyUrn;
                    }

                    if (clientId && clientSecret) {
                        const encryptedId = encrypt(clientId);
                        const encryptedSecret = encrypt(clientSecret);
                        
                        newP.linkedinClientId_enc = encryptedId.encryptedData;
                        newP.linkedinClientSecret_enc = encryptedSecret.encryptedData;
                        newP.iv_li_id = encryptedId.iv;
                        newP.tag_li_id = encryptedId.authTag;
                        newP.iv_li_secret = encryptedSecret.iv;
                        newP.tag_li_secret = encryptedSecret.authTag;
                    } else if (clientId === "" || disconnect === true) { // Disconnect
                        newP.linkedinClientId_enc = "";
                        newP.linkedinClientSecret_enc = "";
                        newP.iv_li_id = "";
                        newP.tag_li_id = "";
                        newP.iv_li_secret = "";
                        newP.tag_li_secret = "";
                        newP.linkedinToken_enc = ""; // Also wipe access token if disconnected
                        newP.linkedinUserToken_enc = "";
                        newP.linkedinPersonUrn = "";
                        newP.linkedinCompanyUrn = "";
                    }
                }

                if (setAccounts.tiktok) {
                    const { disconnect } = setAccounts.tiktok;
                    if (disconnect === true) {
                        newP.tiktokToken_enc = "";
                        newP.iv_tt = "";
                        newP.tag_tt = "";
                        newP.tiktokUsername = "";
                        newP.tiktokTokenExpiresAt = null;
                    }
                }

                if (setAccounts.googleBusiness) {
                    const { disconnect } = setAccounts.googleBusiness;
                    if (disconnect === true) {
                        newP.googleBusinessToken_enc = "";
                        newP.iv_gb = "";
                        newP.tag_gb = "";
                        newP.googleBusinessName = "";
                        newP.googleBusinessRefreshToken_enc = "";
                        newP.iv_gb_refresh = "";
                        newP.tag_gb_refresh = "";
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
