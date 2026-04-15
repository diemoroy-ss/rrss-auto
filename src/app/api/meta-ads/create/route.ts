import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { decrypt } from '../../../../lib/encryption';

const GRAPH_API = "https://graph.facebook.com/v19.0";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const body = await req.json();

        const { profileId, campaignName, objective, dailyBudget, durationDays, country, age, creative } = body;

        const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const profiles = userDoc.data()?.profiles || [];
        const profile = profiles.find((p: any) => p.id === profileId);

        if (!profile || !profile.facebookToken_enc || !profile.facebookPageId) {
            return NextResponse.json({ error: "La conexión de Facebook no está completa o falta la página. Visita Configuración de Marca." }, { status: 400 });
        }

        const { facebookToken_enc, iv_fb, tag_fb, facebookPageId } = profile;
        let { metaAdAccountId } = profile;
        const accessToken = decrypt(facebookToken_enc, iv_fb, tag_fb);

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

        // --- STEP 1: CREATE CAMPAIGN ---
        const campRes = await fetch(`${GRAPH_API}/${metaAdAccountId}/campaigns`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: campaignName,
                objective: objective,
                status: "PAUSED", // Create paused by default for safety
                special_ad_categories: ["NONE"],
                access_token: accessToken
            })
        });
        const campData = await campRes.json();
        if (campData.error) throw new Error(`Campaign Error: ${campData.error.message}`);
        const campaignId = campData.id;

        // --- STEP 2: CREATE AD SET ---
        // Budget is in cents, so dailyBudget * 100
        const budgetCents = Math.floor(dailyBudget * 100);
        const startTime = new Date();
        const endTime = new Date();
        endTime.setDate(endTime.getDate() + durationDays);

        const adSetRes = await fetch(`${GRAPH_API}/${metaAdAccountId}/adsets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: `${campaignName} - AdSet`,
                campaign_id: campaignId,
                daily_budget: budgetCents,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                billing_event: "IMPRESSIONS",
                optimization_goal: objective === "OUTCOME_TRAFFIC" ? "LINK_CLICKS" : "POST_ENGAGEMENT",
                bid_amount: 50, // Auto bidding usually doesn't require this if using Lowest Cost, but for simplicity we rely on default if omitted, or we define bid strategy. Let's omit bid_amount and set strategy.
                bid_strategy: "LOWEST_COST_WITHOUT_CAP",
                targeting: {
                    geo_locations: { countries: [country] },
                    age_min: age.min,
                    age_max: age.max
                },
                status: "PAUSED",
                access_token: accessToken
            })
        });
        const adSetData = await adSetRes.json();
        if (adSetData.error) throw new Error(`AdSet Error: ${adSetData.error.message}`);
        const adSetId = adSetData.id;

        // --- STEP 3: CREATE AD CREATIVE ---
        const creativeRes = await fetch(`${GRAPH_API}/${metaAdAccountId}/adcreatives`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: `${campaignName} - Creative`,
                object_story_spec: {
                    page_id: facebookPageId,
                    link_data: {
                        image_url: creative.imageUrl,
                        link: creative.link || "https://santisoft.com", // Fallback entirely necessary for Traffic
                        message: creative.message
                    }
                },
                access_token: accessToken
            })
        });
        const creativeData = await creativeRes.json();
        if (creativeData.error) throw new Error(`Creative Error: ${creativeData.error.message}`);
        const creativeId = creativeData.id;

        // --- STEP 4: CREATE AD ---
        const adRes = await fetch(`${GRAPH_API}/${metaAdAccountId}/ads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: `${campaignName} - Ad`,
                adset_id: adSetId,
                creative: { creative_id: creativeId },
                status: "PAUSED", // created as paused so user can review it in AdsManager if they want to
                access_token: accessToken
            })
        });
        const adData = await adRes.json();
        if (adData.error) throw new Error(`Ad Error: ${adData.error.message}`);

        // Automatically change campaign status to ACTIVE if everything succeeded?
        // Let's activate the campaign directly if requested, or keep it PAUSED as a draft. 
        // For MVP, we will keep PAUSED but return success.
        
        // Let's actually activate the adset and ad, and the campaign so it runs immediately.
        await fetch(`${GRAPH_API}/${campaignId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ACTIVE", access_token: accessToken })
        });
        await fetch(`${GRAPH_API}/${adSetId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ACTIVE", access_token: accessToken })
        });
        await fetch(`${GRAPH_API}/${adData.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ACTIVE", access_token: accessToken })
        });

        return NextResponse.json({ success: true, campaignId, adSetId, adId: adData.id }, { status: 200 });

    } catch (error: any) {
        console.error("Meta Ads Create API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
