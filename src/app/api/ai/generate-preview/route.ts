import { NextRequest, NextResponse } from "next/server";
import { generateElevenLabsAudio } from "../../../../lib/elevenlabs";
import type { PosterConfig } from "../../../../types/poster";

// ═══════════════════════════════════════════════════════════════
// INGENIERÍA DE PROMPTS — construye el prompt definitivo para
// Gemini Imagen / DALL-E 3 que se envía al workflow de n8n.
// El objetivo es ser lo más descriptivo y específico posible,
// combinando TODA la información contextual disponible.
// ═══════════════════════════════════════════════════════════════
function buildEnrichedGeminiPrompt(params: {
    rawIdeaPrompt: string;      // Prompt en inglés generado por generate-prompt (Director de Arte IA)
    idea: string;               // Idea original del usuario
    imageExpectation: string;   // Descripción visual explícita del usuario
    userProvidedCopy: string;   // Texto/copy de la publicación
    businessType: string;       // Rubro del negocio
    postType: string;           // Post | Historia | Carrusel | Reel
    posterConfig?: PosterConfig | null;
}): string {
    const {
        rawIdeaPrompt,
        idea,
        imageExpectation,
        userProvidedCopy,
        businessType,
        postType,
        posterConfig,
    } = params;

    // Definir el formato de imagen según el tipo de publicación
    const formatMap: Record<string, string> = {
        "Post":     "square 1:1 format, ideal for Instagram and Facebook feed posts",
        "Historia": "vertical 9:16 format, ideal for Instagram Stories and WhatsApp Status",
        "Carrusel": "square 1:1 format, slide image for Instagram Carousel post",
        "Reel":     "vertical 9:16 cinematic format, ideal for Instagram Reels and TikTok",
    };
    const formatDescription = formatMap[postType] || "square 1:1 format";

    // Instrucción base de calidad fotográfica
    const qualityBase = [
        "ultra-high-quality commercial photograph",
        "professional studio lighting",
        "sharp focus with beautiful depth of field",
        "vibrant and rich colors",
        "8K resolution",
        "no text overlaid on the image",
        "no watermarks",
    ].join(", ");

    // Construir el prompt a partir del generado por el Director de Arte IA
    // Si hay prompt en inglés del Director de Arte, úsalo como base principal
    const artDirectorBase = rawIdeaPrompt
        ? rawIdeaPrompt
        : `A high-quality advertising image for a ${businessType || "business"} related to: ${idea}`;

    // Enriquecer con la expectativa visual explícita del usuario
    const userVisualContext = imageExpectation
        ? `Client visual direction: ${imageExpectation}.`
        : "";

    // Contexto del copy de la publicación para alinear el tono visual
    const copyContext = userProvidedCopy
        ? `The image must visually match this post caption: "${userProvidedCopy.substring(0, 200)}".`
        : "";

    // Contexto del rubro del negocio
    const businessContext = businessType
        ? `Industry/Business type: ${businessType}.`
        : "";

    const isPoster = !!posterConfig?.enabled;

    // Poster/banner specifications
    let posterSpecs = "";
    if (isPoster) {
        const posterParts: string[] = [];

        if (posterConfig.visualStyle) {
            const styleMap: Record<string, string> = {
                "Moderno":      "modern layout with professional typography, geometric layout, and clean marketing design",
                "Minimalista":  "minimalist clean ad with elegant negative space and clear focus",
                "Llamativo":    "high-impact bold banner with vibrant contrast and eye-catching advertisement text",
                "Elegante":     "sophisticated luxury print ad style with premium serif fonts and high-end aesthetics",
                "Profesional":  "clean corporate business flyer layout, very organized design",
                "Vibrante":     "vibrant energetic design with colorful branding overlays and modern typography",
            };
            posterParts.push(`Poster Visual Style: ${styleMap[posterConfig.visualStyle] || posterConfig.visualStyle}.`);
        }

        if (posterConfig.primaryColor) {
            posterParts.push(`Dominant brand color palette: ${posterConfig.primaryColor}.`);
        }

        if (posterConfig.includeBusinessName && posterConfig.businessName) {
            posterParts.push(`Include the business name typography integrated into the design: "${posterConfig.businessName}".`);
        }

        if (posterConfig.includePrice && posterConfig.priceText) {
            posterParts.push(`Render this promotional text clearly in a badge or main title: "${posterConfig.priceText}".`);
        }

        if (posterConfig.includeSlogan && posterConfig.sloganText) {
            posterParts.push(`Integrate this key slogan into the layout: "${posterConfig.sloganText}".`);
        }

        if (posterConfig.ctaText) {
            posterParts.push(`Render a clear call-to-action button or banner saying: "${posterConfig.ctaText}".`);
        }

        if (posterConfig.additionalNotes) {
            posterParts.push(`Additional flyer requirements: ${posterConfig.additionalNotes}.`);
        }

        if (posterParts.length > 0) {
            posterSpecs = `POSTER & ADVERTISING LAYOUT SPECIFICATIONS (RENDER TEXT AND GRAPHICS DIRECTLY IN THE IMAGE):\n${posterParts.map(p => `- ${p}`).join("\n")}`;
        }
    }

    // Ensamblado final del prompt
    const promptParts = [
        isPoster 
            ? "commercial advertising flyer poster design, professional graphic design layout, high-quality promotional banner"
            : `${qualityBase},`,
        `${formatDescription}.`,
        ``,
        `MAIN VISUAL CONCEPT:`,
        artDirectorBase,
        ``,
    ];

    if (userVisualContext)  promptParts.push(userVisualContext);
    if (copyContext)        promptParts.push(copyContext);
    if (businessContext)    promptParts.push(businessContext);
    if (posterSpecs)        promptParts.push(``, posterSpecs);

    // Ajustar los requerimientos técnicos según si es cartel publicitario o imagen lifestyle
    promptParts.push(
        ``,
        `TECHNICAL REQUIREMENTS:`,
        `- Professional graphic design and composition.`,
        `- Composition optimized for social media ${formatDescription}.`,
        isPoster 
            ? `- Integrate the promotional text, values, and branding seamlessly as a professional graphic designer would.\n- Ensure high contrast and absolute legibility of all written details.\n- The final image should look like a complete, ready-to-post advertising banner with text.`
            : `- NO text, letters, words, or typography rendered inside the image.\n- Background should complement the subject without overwhelming it.`,
        `- Lighting should be dramatic and cinematic, highlighting the main subject.`,
        `- Color grading: vibrant yet professional, suitable for advertising.`,
    );

    return promptParts.join("\n");
}

// ═══════════════════════════════════════════════════════════════
// Construye prompts enriquecidos para carruseles
// ═══════════════════════════════════════════════════════════════
function buildEnrichedCarouselPrompts(params: {
    rawPrompts: string[];
    idea: string;
    imageExpectation: string;
    userProvidedCopy: string;
    businessType: string;
    posterConfig?: PosterConfig | null;
}): string[] {
    return params.rawPrompts.map((rawPrompt, index) => {
        return buildEnrichedGeminiPrompt({
            rawIdeaPrompt: rawPrompt,
            idea: params.idea,
            imageExpectation: params.imageExpectation,
            userProvidedCopy: params.userProvidedCopy,
            businessType: params.businessType,
            postType: "Carrusel",
            posterConfig: params.posterConfig,
        }) + `\n\nCARROUSEL CONTEXT: This is slide ${index + 1} of the carousel sequence. Maintain visual consistency with all other slides (same style, color palette, and lighting treatment).`;
    });
}

// ═══════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            idea, 
            imageExpectation,
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
            imageExpectation?: string;
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

        // ═══════════════════════════════════════════════════════
        // 2. CONSTRUIR PROMPTS ENRIQUECIDOS PARA GEMINI
        //    Combinamos el prompt del Director de Arte IA con
        //    toda la información contextual del usuario.
        // ═══════════════════════════════════════════════════════
        const sharedContext = {
            idea: idea || "",
            imageExpectation: imageExpectation || "",
            userProvidedCopy: userProvidedCopy || "",
            businessType: businessType || "",
            posterConfig: posterConfig || null,
        };

        let enrichedPrompts: string[] = [];

        if (type === 'Carrusel' && promptsEnglish && Array.isArray(promptsEnglish) && promptsEnglish.length > 0) {
            // Carrusel: enriquecer cada slide individualmente
            enrichedPrompts = buildEnrichedCarouselPrompts({
                rawPrompts: promptsEnglish,
                ...sharedContext,
                postType: "Carrusel",
            } as any);
        } else {
            // Post / Historia / Reel: un solo prompt principal
            const rawPrompt = promptEnglish || promptsEnglish?.[0] || idea || "";
            const enriched = buildEnrichedGeminiPrompt({
                rawIdeaPrompt: rawPrompt,
                ...sharedContext,
                postType: type || "Post",
            });
            enrichedPrompts = [enriched];
        }

        console.log(`[GENERATE-PREVIEW-PROXY] Sending enriched prompts to n8n webhook at: ${n8nUrl}`);
        console.log(`[GENERATE-PREVIEW-PROXY] Prompt preview (first 300 chars): ${enrichedPrompts[0]?.substring(0, 300)}...`);

        // ═══════════════════════════════════════════════════════
        // 3. PAYLOAD FINAL AL WEBHOOK DE N8N
        // ═══════════════════════════════════════════════════════
        const n8nPayload: any = {
            idea,
            imageExpectation: imageExpectation || "",
            userProvidedCopy: userProvidedCopy || "",
            // Enviamos el prompt principal como string plano para evitar confusión en n8n
            promptEnglish: enrichedPrompts[0] || "",
            videoPrompt: videoPrompt || "",
            audioUrl: audioUrl || "",
            voiceoverScript: voiceoverScript || "",
            businessType,
            type,
            carouselCount: type === 'Carrusel' ? (carouselCount || 3) : 1,
            email,
            phone,
            profileId,
            posterConfig: posterConfig?.enabled ? posterConfig : null,
        };

        // Si es carrusel, agregamos la secuencia por separado por si n8n la requiere
        if (type === 'Carrusel') {
            n8nPayload.promptsEnglish = enrichedPrompts;
        }

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
        return NextResponse.json({ 
            error: err.message || "Failed to communicate with pipeline",
            stack: err.stack,
            message: "Error al comunicarse con el pipeline de n8n."
        }, { status: 500 });
    }
}
