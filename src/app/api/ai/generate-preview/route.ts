import { NextRequest, NextResponse } from "next/server";
import { generateElevenLabsAudio } from "../../../../lib/elevenlabs";
import type { PosterConfig } from "../../../../types/poster";
import { runInBatches } from "../../../../lib/batch-processor";

// ═══════════════════════════════════════════════════════════════
// EXTRACTOR DE CONCEPTO VISUAL
// Analiza el texto libre del usuario y extrae solo el concepto
// visual esencial, quitando verbos de comando y frases genéricas.
// Ej: "Generar cartel donde todos nuestros servicios tienen 50% OFF"
//   → "servicios con 50% de descuento"
// ═══════════════════════════════════════════════════════════════
function extractVisualConcept(text: string): string {
    if (!text || text.trim().length < 3) return text;

    let cleaned = text.trim();

    // 1. Eliminar frases de comando al inicio (español e inglés)
    const commandPrefixes = [
        /^(genera[r]?|crea[r]?|haz|diseña[r]?|muestra[r]?|pon|agrega[r]?|incluye[r]?|quiero|necesito|hacer|produce|create|generate|design|make|show|add|include|put)\s+/i,
        /^(un|una|el|la|los|las|a|an|the)\s+/i,
        /^(cartel|banner|imagen|foto|diseño|poster|flyer|publicación|post|anuncio)\s+(publicitario|de|del|para|con)?\s*/i,
        /^(donde|en\s+el\s+que|que\s+muestre|con\s+texto|indicando)\s+/i,
    ];

    for (const prefix of commandPrefixes) {
        cleaned = cleaned.replace(prefix, "");
    }

    // 2. Limpiar múltiples espacios
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    // 3. Si el resultado quedó vacío o muy corto, usar el texto original
    if (cleaned.length < 5) return text.trim();

    // 4. Capitalizar primera letra
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function buildEnrichedGeminiPrompt(params: {
    rawIdeaPrompt: string;
    idea: string;
    imageExpectation: string;
    userProvidedCopy: string;
    businessType: string;
    postType: string;
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

    // Analizar y extraer el concepto visual esencial del texto del usuario
    // En vez de incluir el texto completo (ej: "Generar cartel donde..."), extraemos solo
    // el concepto clave (ej: "servicios con 50% de descuento hasta fin de mes")
    const visualConcept = extractVisualConcept(imageExpectation);

    // Enriquecer con la expectativa visual interpretada del usuario
    const userVisualContext = visualConcept
        ? `Visual concept to highlight: ${visualConcept}.`
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
            posterParts.push(`Include the business name prominently in the poster: "${posterConfig.businessName}".`);
        }

        if (posterConfig.includePrice && posterConfig.priceText) {
            // Renderizamos solo el texto del precio/promoción especificado,
            // sin concatenar todo el texto descriptivo del cliente, para evitar
            // que la IA escriba todo el prompt en el diseño.
            posterParts.push(`MAIN PROMOTIONAL HEADLINE of the poster (render this text large and prominently): "${posterConfig.priceText}".`);
        }

        if (posterConfig.includeSlogan && posterConfig.sloganText) {
            posterParts.push(`Integrate this key slogan as a subtitle in the layout: "${posterConfig.sloganText}".`);
        }

        if (posterConfig.ctaText) {
            posterParts.push(`Render a clear call-to-action button or banner at the bottom saying: "${posterConfig.ctaText}".`);
        }

        if (posterConfig.additionalNotes) {
            posterParts.push(`Additional flyer requirements: ${posterConfig.additionalNotes}.`);
        }

        if (posterParts.length > 0) {
            posterSpecs = `POSTER & ADVERTISING LAYOUT SPECIFICATIONS (RENDER ALL TEXT AND GRAPHICS DIRECTLY INTEGRATED IN THE IMAGE):\n${posterParts.map(p => `- ${p}`).join("\n")}`;
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
            ? `- VERY IMPORTANT: IGNORE ANY PREVIOUS 'NO TEXT' INSTRUCTIONS. This is a promotional poster that requires text.\n- Integrate the promotional text, values, and branding seamlessly as a professional graphic designer would.\n- Ensure high contrast and absolute legibility of all written details.\n- DO NOT ADD ANY RANDOM GIBBERISH, 'LOREM IPSUM', OR HALLUCINATED TYPOGRAPHY.\n- ALL TEXT WRITTEN IN THE IMAGE MUST BE STRICTLY IN SPANISH (ESPAÑOL) AND MATCH THE REQUESTED COPY EXACTLY.`
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
        // ═══════════════════════════════════════════════════════
        // Extraer contexto compartido para los builders de prompts
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
            // Prompt principal como string plano
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

        // Si es Carrusel con múltiples láminas, enviamos peticiones sincrónicas en lotes de máximo 3 en paralelo
        if (type === 'Carrusel' && enrichedPrompts.length > 1) {
            console.log(`[GENERATE-PREVIEW-PROXY] Procesando Carrusel de ${enrichedPrompts.length} láminas en lotes de 3 N8N...`);

            const batchResults = await runInBatches(enrichedPrompts, 3, async (slidePrompt, slideIdx) => {
                const slidePayload = {
                    ...n8nPayload,
                    promptEnglish: slidePrompt,
                    slideIndex: slideIdx,
                    totalSlides: enrichedPrompts.length,
                };

                console.log(`[GENERATE-PREVIEW-PROXY] Enviando lámina ${slideIdx + 1}/${enrichedPrompts.length} a N8N...`);
                const slideRes = await fetch(n8nUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(slidePayload)
                });

                if (!slideRes.ok) {
                    const errText = await slideRes.text();
                    console.error(`[GENERATE-PREVIEW-PROXY] Error N8N en lámina ${slideIdx + 1}:`, errText);
                    return null;
                }

                const slideData = await slideRes.json();
                const item = Array.isArray(slideData) ? slideData[0] : slideData;
                const imgUrl = item?.imageUrl || item?.url || item?.image || item?.outputUrl || (typeof slideData === 'string' ? slideData : '');
                return { slideIndex: slideIdx, imageUrl: imgUrl };
            });

            const validResults = batchResults.filter((r): r is { slideIndex: number; imageUrl: string } => r !== null && Boolean(r.imageUrl));
            const imageUrls = validResults.map(r => r.imageUrl);

            return NextResponse.json({
                success: true,
                type: 'Carrusel',
                imageUrls: imageUrls,
                imageUrl: imageUrls[0] || "",
                carouselCount: imageUrls.length
            });
        }

        // Para posts individuales o carrusel de 1 sola lámina:
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
