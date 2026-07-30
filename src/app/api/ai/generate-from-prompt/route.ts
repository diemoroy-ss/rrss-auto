import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            promptText, 
            baseImageUrl,
            templateId,
            email, 
            profileId,
            businessType,
            isCommercialPoster
        } = body;
        
        // Define the webhook URL explicitly requested for this feature (Test mode)
        const n8nUrl = 'https://n8n.santisoft.cl/webhook-test/img-prompts';

        const n8nPayload = {
            promptText: promptText || "",
            baseImageUrl: baseImageUrl || "",
            templateId: templateId || "",
            email,
            profileId,
            businessType,
            isCommercialPoster: isCommercialPoster || false
        };

        console.log(`[GENERATE-FROM-PROMPT] Sending to n8n:`, n8nPayload);

        const response = await fetch(n8nUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(n8nPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`n8n webhook error: ${errorText || response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (err: any) {
        console.error("[GENERATE-FROM-PROMPT API Error]:", err);
        return NextResponse.json({ 
            error: err.message || "Failed to communicate with n8n pipeline",
            stack: err.stack,
            message: "Error al comunicarse con el pipeline de generación."
        }, { status: 500 });
    }
}
