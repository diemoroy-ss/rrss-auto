import { NextRequest, NextResponse } from "next/server";
import { analyzeAndAnchorProductPrompt } from "../../../../lib/agents/agent-product-vision";

export const runtime = "nodejs";
export const maxDuration = 60;

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

        let enrichedPrompt = promptText || "";
        let productAnalysis = null;

        // Si se envió una imagen base, nuestro Agente Revisor de Producto inspecciona y fusiona el prompt
        if (baseImageUrl && typeof baseImageUrl === "string" && baseImageUrl.startsWith("http")) {
            console.log(`[GENERATE-FROM-PROMPT] Invoking Agent Visual Product Reviewer on base image:`, baseImageUrl);
            const agentResult = await analyzeAndAnchorProductPrompt(
                baseImageUrl,
                promptText || "",
                businessType
            );
            enrichedPrompt = agentResult.enrichedPrompt;
            productAnalysis = agentResult.analysis;
        }
        
        // Define the webhook URL explicitly requested for this feature (Production mode)
        const n8nUrl = 'https://n8n.santisoft.cl/webhook/img-prompts';

        const n8nPayload = {
            promptText: enrichedPrompt,
            baseImageUrl: baseImageUrl || "",
            templateId: templateId || "",
            email,
            profileId,
            businessType,
            isCommercialPoster: isCommercialPoster || false,
            productAnalysis: productAnalysis || null
        };

        console.log(`[GENERATE-FROM-PROMPT] Sending enriched payload to n8n:`, {
            productDetected: productAnalysis?.productType || "N/A",
            promptLength: enrichedPrompt.length,
            hasBaseImage: !!baseImageUrl
        });

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
        return NextResponse.json({
            ...data,
            productAnalysis
        });

    } catch (err: any) {
        console.error("[GENERATE-FROM-PROMPT API Error]:", err);
        return NextResponse.json({ 
            error: err.message || "Failed to communicate with n8n pipeline",
            stack: err.stack,
            message: "Error al comunicarse con el pipeline de generación."
        }, { status: 500 });
    }
}
