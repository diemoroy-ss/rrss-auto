import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { decrypt } from "../../../../lib/encryption";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        
        if (!adminAuth || !adminDb) {
            return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 500 });
        }

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

        const userData = userDoc.data();
        const profiles = userData?.profiles || [];
        const profile = profiles.find((p: any) => p.id === profileId);

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const { facebookToken_enc, iv_fb, tag_fb } = profile;
        let { metaAdAccountId } = profile;

        if (!facebookToken_enc) {
            return NextResponse.json({ error: "Meta Ads no configurado" }, { status: 400 });
        }

        // Decrypt token
        const decryptedTokenObj = decrypt(facebookToken_enc, iv_fb, tag_fb);
        const accessToken = decryptedTokenObj;

        if (!metaAdAccountId) {
            const adAccountsRes = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=account_id&access_token=${accessToken}`);
            const adAccountsData = await adAccountsRes.json();
            
            if (adAccountsData.data && adAccountsData.data.length > 0) {
                metaAdAccountId = adAccountsData.data[0].id;
                const updatedProfiles = profiles.map((p: any) => 
                   p.id === profileId ? { ...p, metaAdAccountId } : p
                );
                await adminDb.collection("users").doc(decodedToken.uid).update({ profiles: updatedProfiles });
            } else {
                return NextResponse.json({ error: "No se encontró Cuenta Publicitaria de Ads para esta conexión de Facebook." }, { status: 400 });
            }
        }

        // Fetch Campaigns and Insights from Meta API
        // Level: campaign
        // Fields: name, status, objective, insights.date_preset(last_30d){spend,impressions,clicks,cpc}
        const metaApiUrl = `https://graph.facebook.com/v19.0/${metaAdAccountId}/campaigns?fields=name,status,objective,insights.date_preset(last_30d){spend,impressions,clicks,cpc}&access_token=${accessToken}`;
        
        const response = await fetch(metaApiUrl);
        const metaData = await response.json();

        if (metaData.error) {
            console.error("Meta API Error:", metaData.error);
            return NextResponse.json({ error: metaData.error.message }, { status: 400 });
        }

        // Format data for frontend
        const campaigns = metaData.data.map((camp: any) => {
            const insight = camp.insights?.data?.[0] || {};
            return {
                id: camp.id,
                name: camp.name,
                status: camp.status,
                objective: camp.objective,
                spend: parseFloat(insight.spend || "0"),
                impressions: parseInt(insight.impressions || "0"),
                clicks: parseInt(insight.clicks || "0"),
                cpc: parseFloat(insight.cpc || "0")
            };
        });

        return NextResponse.json({ campaigns }, { status: 200 });

    } catch (error: any) {
        console.error("Meta Ads API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
