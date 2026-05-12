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

        if (!profile || !profile.linkedinUserToken_enc) {
            return NextResponse.json({ error: "LinkedIn Token is not configured" }, { status: 400 });
        }

        // Descifrar Token
        const accessToken = decrypt(profile.linkedinUserToken_enc, profile.iv_li_user, profile.tag_li_user);
        if (!accessToken) {
             return NextResponse.json({ error: "Error decoding Token" }, { status: 500 });
        }

        // Consultar páginas de empresa (organizations)
        // Usamos la v2 API endpoint para organizationAcls
        const orgsUrl = `https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED`;
        
        const pages: any[] = [];
        try {
            const orgsRes = await fetch(orgsUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });
            
            if (orgsRes.ok) {
                const orgsData = await orgsRes.json();
                const orgElements = orgsData.elements || [];
                
                // Obtener detalles (nombre/logo) de cada organización
                for (const el of orgElements) {
                     const orgUrn = el.organization;
                     const orgId = orgUrn.split(':').pop();
                     
                     // Fetch org details
                     const detailRes = await fetch(`https://api.linkedin.com/v2/organizations/${orgId}`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'X-Restli-Protocol-Version': '2.0.0'
                        }
                     });
                     
                     if (detailRes.ok) {
                         const detailData = await detailRes.json();
                         pages.push({
                             id: orgId,
                             urn: orgUrn,
                             name: detailData.localizedName || 'Página de Empresa'
                         });
                     }
                }
            } else {
                console.warn(`LinkedIn Fetch Orgs Warning (Status ${orgsRes.status}). User likely doesn't have organization permissions or w_organization_social scope.`);
            }
        } catch (orgError) {
            console.error("Error fetching LinkedIn organizations:", orgError);
        }

        return NextResponse.json({ data: pages });

    } catch (error: any) {
        console.error("LinkedIn Pages Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
