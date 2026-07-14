import { NextRequest, NextResponse } from "next/server";
import { generateElevenLabsAudio } from "../../../../lib/elevenlabs";
import type { PosterConfig } from "../../../../types/poster";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            idea, 
            promptEnglish, 
            promptsEnglish,
            videoPrompt, 
            voiceoverScript, 
            businessType, 
            type, 
            carouselCount, 
            userPlan, 
            email, 
            phone,
            profileId,
            /** Copy explícito del usuario — si existe, no se sobreescribe con Gemini */
            userProvidedCopy,
            /** Configuración del cartel publicitario (opcional) */
            posterConfig,
        }: {
            idea?: string;
            promptEnglish?: string;
            promptsEnglish?: string[];
            videoPrompt?: string;
            voiceoverScript?: string;
            businessType?: string;
            type?: string;
            carouselCount?: number;
            userPlan?: string;
            email?: string;
            phone?: string;
            profileId?: string;
            userProvidedCopy?: string;
            posterConfig?: PosterConfig | null;
        } = body;
        
        let n8nUrl = process.env.NEXT_PUBLIC_N8N_PREVIEW_URL;

        if (!n8nUrl) {
            n8nUrl = 'https://n8n.santisoft.cl/webhook/img-rrss-auto';
        }

        let audioUrl = "";

        // 1. Generate audio if it is a Reel
        if (type === 'Reel' && voiceoverScript && process.env.ELEVENLABS_API_KEY) {
            try {
                const userId = profileId || "default_user";
                const audioGenerated = await generateElevenLabsAudio(voiceoverScript, userId);
                if (audioGenerated) {
                    audioUrl = audioGenerated;
                }
            } catch (elevenErr: unknown) {
                console.error("[ElevenLabs Error in route]:", elevenErr);
            }
        }

        // 2. Prepare payload for n8n using already approved prompts
        let targetPrompts = [idea ?? ''];
        if (promptsEnglish && Array.isArray(promptsEnglish) && promptsEnglish.length > 0) {
            targetPrompts = promptsEnglish;
        } else if (promptEnglish) {
            targetPrompts = [promptEnglish];
        }

        console.log(`[GENERATE-PREVIEW-PROXY] Sending payload to n8n webhook at: ${n8nUrl}`);
        const n8nPayload = {
            idea,
            promptsEnglish: targetPrompts,
            videoPrompt: videoPrompt || "",
            audioUrl: audioUrl || "",
            voiceoverScript: voiceoverScript || "",
            businessType,
            type,
            carouselCount: type === 'Carrusel' ? (carouselCount || 3) : 1,
            email,
            phone,
            profileId,
            userProvidedCopy,
            posterConfig
        };

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
        console.error("[GENERATE-PREVIEW API PROXY Error]:", err);
        return NextResponse.json({ error: err.message || "Failed to communicate with pipeline" }, { status: 500 });
    }
}
