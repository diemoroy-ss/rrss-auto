
// ═══════════════════════════════════════════════════════════════
// REGLA UNIVERSAL DE COMPOSICIÓN LIMPIA Y ZONA SEGURA (AUTO-INYECCIÓN)
// Aplica a TODO post con texto (Post 1:1, Post 4:5, Carruseles, etc.)
// ═══════════════════════════════════════════════════════════════
function autoEnforceSafeZoneInPrompt(prompt: string, forcePosterMode: boolean = false): string {
  if (!prompt || typeof prompt !== "string") return prompt;

  const hasTypography = forcePosterMode ||
    /typography\s*&\s*layout/i.test(prompt) || 
    /upper\s+center/i.test(prompt) || 
    /top\s+center/i.test(prompt) || 
    /safe\s+box/i.test(prompt) ||
    /lower\s+center/i.test(prompt) ||
    /bottom\s+right/i.test(prompt) ||
    /mid-upper/i.test(prompt) ||
    /poster\s*&\s*advertising/i.test(prompt) ||
    /commercial\s+advertising\s+flyer/i.test(prompt);

  if (!hasTypography) return prompt;

  let result = prompt;

  // 1. Inyectar o asegurar COMPOSICIÓN LIMPIA Y CENTRADA (sin números ni porcentajes que el modelo dibuje)
  const safeZoneDirective = "- CLEAN ADVERTISING COMPOSITION: All typography, headlines, badges, prices and CTA buttons MUST stay centered with generous breathing space away from the edges. Clean high-end social media commercial finish.\n- MANDATORY NEGATIVE INSTRUCTION: ABSOLUTELY DO NOT RENDER ANY MEASUREMENT ARROWS, LABELS, NUMBERS, PERCENTAGES, RED OR ORANGE GUIDELINES, DRAFTING MARKS, WIREFRAME BOXES, TECHNICAL RULERS, OR BOUNDING BOXES ON THE IMAGE. RENDER ONLY THE PRISTINE COMMERCIAL GRAPHIC ARTWORK AND TEXT.";

  if (/composition\s+safe\s+zone/i.test(result)) {
    result = result.replace(/-\s*COMPOSITION\s+SAFE\s+ZONE[^\r\n]*/gi, safeZoneDirective);
  } else if (/clean\s+advertising\s+composition/i.test(result)) {
    // Ya presente
  } else if (/typography\s*&\s*layout/i.test(result)) {
    result = result.replace(new RegExp("(typography\\s*&\\s*layout[^\\r\\n]*)", "i"), "$1\n" + safeZoneDirective);
  } else {
    result += "\n\n" + safeZoneDirective;
  }

  // 2. Reubicar TOP CENTER para que tenga aire superior natural
  result = result.replace(/-\s*TOP\s+CENTER\s*\(([^)]*)\)/gi, (_m, p1) => {
    return `- UPPER CENTER (Pill badge floating centered with generous breathing room from top edge, ${p1})`;
  });

  // 3. Forzar que el titular esté centrado y con márgenes limpios sin mencionar porcentajes
  result = result.replace(/-\s*(UPPER\s+CENTER|MID-UPPER\s+CENTER)\s*\(([^)]*)\)/gi, (_m, _prefix, p1) => {
    const cleaned = p1.replace(/maximum\s+\d+%\s+container\s+width/gi, "").replace(/at\s+least\s+\d+%\s+empty[^\,]*,?/gi, "").replace(/inside\s+\d+%\s+safe\s+area/gi, "").replace(/with\s+\d+%\s+side\s+margins/gi, "").replace(/positioned\s+\d+%\s+down/gi, "").trim();
    return `- MID-UPPER CENTER (Centered compact headline broken into 2 to 4 short lines, well-centered with ample empty breathing space on left and right sides, ${cleaned})`;
  });

  // 4. Forzar que el botón CTA inferior esté centrado horizontalmente
  result = result.replace(/-\s*(BOTTOM\s+RIGHT|LOWER\s+RIGHT|BOTTOM\s+LEFT|LOWER\s+LEFT|BOTTOM\s+CENTER|LOWER\s+CENTER)\s*\(([^)]*)\)/gi, (_m, _pos, p1) => {
    const cleaned = p1.replace(/above\s+\d+%\s+height\s+mark/gi, "").replace(/inside\s+\d+%\s+safe\s+zone/gi, "").replace(/with\s+at\s+least\s+\d+%\s+margins[^\,]*,?/gi, "").trim();
    return `- LOWER CENTER (Centered pill badge positioned cleanly above the lower edge with ample side margins, ${cleaned})`;
  });

  // 5. Eliminar cualquier residuo de porcentajes numéricos o referencias de márgenes técnicos en directivas
  result = result
    .replace(/\b\d+%\s*(safe\s*box|safe\s*area|safe\s*zone|margins?|height\s*mark|container\s*width|down|breathing\s*space)\b/gi, "")
    .replace(/above\s+\d+%\s+height\s+mark,?/gi, "")
    .replace(/minimum\s+\d+%\s+empty\s+margins[^\,\)]*,?/gi, "")
    .replace(/\b(strictly\s+)?inside\s+\d+%\s+safe\s+(area|zone|box),?/gi, "");

  return result;
}

import { NextRequest, NextResponse } from "next/server";
import { generateElevenLabsAudio } from "../../../../lib/elevenlabs";
import type { PosterConfig } from "../../../../types/poster";
import { runInBatches } from "../../../../lib/batch-processor";
import { extractSceneAndTypography } from "../../../../lib/poster-prompt-parser";

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

        if (posterConfig.additionalNotes) {
            posterParts.push(`Additional flyer requirements: ${posterConfig.additionalNotes}.`);
        }

        // Estructura Universal de Tipografía y Zona Segura para Todo Post con Texto
        const typoLines: string[] = [
            `TYPOGRAPHY & LAYOUT (Exact Spanish text):`,
            `- CLEAN ADVERTISING COMPOSITION: All typography, headlines, badges, prices and CTA buttons MUST stay centered with generous breathing space away from canvas edges. Clean high-end social media commercial finish.`,
            `- MANDATORY NEGATIVE INSTRUCTION: ABSOLUTELY DO NOT RENDER ANY MEASUREMENT ARROWS, LABELS, NUMBERS, PERCENTAGES, RED OR ORANGE GUIDELINES, DRAFTING MARKS, WIREFRAME BOXES, TECHNICAL RULERS, OR BOUNDING BOXES ON THE IMAGE. RENDER ONLY THE PRISTINE COMMERCIAL GRAPHIC ARTWORK AND TEXT.`
        ];

        const badgeText = posterConfig.includeSlogan && posterConfig.sloganText 
            ? posterConfig.sloganText 
            : "";
        if (badgeText) {
            typoLines.push(`- UPPER CENTER (Pill badge positioned cleanly floating near the top center with ample breathing room from borders): "${badgeText}".`);
        }

        const mainHeadline = (posterConfig.includeMainText && posterConfig.mainText) 
            ? posterConfig.mainText 
            : (posterConfig.mainText || (posterConfig.includePrice && posterConfig.priceText ? posterConfig.priceText : ""));
        if (mainHeadline) {
            typoLines.push(`- MID-UPPER CENTER (Centered compact headline broken into 2 to 4 short lines, well-centered with ample empty breathing space on left and right sides): "${mainHeadline}".`);
        }

        if (posterConfig.includePrice && posterConfig.priceText && posterConfig.priceText !== mainHeadline) {
            typoLines.push(`- HIGHLIGHT BADGE (Centered floating badge with high contrast background): "${posterConfig.priceText}".`);
        }

        if (posterConfig.includeCta && posterConfig.ctaText) {
            typoLines.push(`- LOWER CENTER (Clean pill button placed horizontally in the center with comfortable padding from bottom edge): "${posterConfig.ctaText}".`);
        }

        typoLines.push(`Ultra-sharp vector typography, commercial graphic design, compact centered clean composition, professional studio advertising layout, 8k.`);

        posterParts.push(`\n${typoLines.join("\n")}`);

        if (posterParts.length > 0) {
            posterSpecs = `POSTER & ADVERTISING LAYOUT SPECIFICATIONS:\n${posterParts.map(p => `- ${p}`).join("\n")}`;
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
        const slide = params.posterConfig?.slides?.[index];
        const mergedPosterConfig: PosterConfig | null | undefined = params.posterConfig ? {
            ...params.posterConfig,
            mainText: slide?.mainText ?? params.posterConfig.mainText,
            sloganText: slide?.sloganText ?? params.posterConfig.sloganText,
            priceText: slide?.priceText ?? params.posterConfig.priceText,
            ctaText: slide?.ctaText ?? params.posterConfig.ctaText,
            businessName: slide?.businessName ?? params.posterConfig.businessName,
            includeMainText: slide?.includeMainText !== undefined ? slide.includeMainText : params.posterConfig.includeMainText,
            includeSlogan: slide?.includeSlogan !== undefined ? slide.includeSlogan : params.posterConfig.includeSlogan,
            includePrice: slide?.includePrice !== undefined ? slide.includePrice : params.posterConfig.includePrice,
            includeCta: slide?.includeCta !== undefined ? slide.includeCta : params.posterConfig.includeCta,
            includeBusinessName: slide?.includeBusinessName !== undefined ? slide.includeBusinessName : params.posterConfig.includeBusinessName,
            includeLogo: slide?.includeLogo !== undefined ? slide.includeLogo : params.posterConfig.includeLogo,
        } : params.posterConfig;

        return buildEnrichedGeminiPrompt({
            rawIdeaPrompt: rawPrompt,
            idea: params.idea,
            imageExpectation: params.imageExpectation,
            userProvidedCopy: params.userProvidedCopy,
            businessType: params.businessType,
            postType: "Carrusel",
            posterConfig: mergedPosterConfig,
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
            catalogoItem,
            baseImageUrl,
            allowImageRetouch,
            styleReferenceUrl,
            retouchTargetImageUrl,
            retouchInstruction,
            isMixboardLab,
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
            catalogoItem?: { name: string; description: string; imageUrl: string | null } | null;
            baseImageUrl?: string | null;
            allowImageRetouch?: boolean;
            userId?: string;
            styleReferenceUrl?: string | null;
            retouchTargetImageUrl?: string | null;
            retouchInstruction?: string | null;
            isMixboardLab?: boolean;
        } = body;

        // ═══════════════════════════════════════════════════════
        // CONTROL DE CUOTAS DE IMÁGENES Y VIDEOS (PF-09 / METERING)
        // ═══════════════════════════════════════════════════════
        let effectiveUserId = body.userId;
        let effectiveUserEmail = email;
        let effectiveUserPlan = userPlan || 'free';

        const authHeader = req.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            try {
                const { adminAuth } = await import("../../../../lib/firebase-admin");
                if (adminAuth) {
                    const token = authHeader.split("Bearer ")[1];
                    const decoded = await adminAuth.verifyIdToken(token);
                    if (decoded?.uid) {
                        effectiveUserId = decoded.uid;
                        if (decoded.email) effectiveUserEmail = decoded.email;
                    }
                }
            } catch (authErr) {
                console.warn("[generate-preview] Could not verify idToken:", authErr);
            }
        }

        if (effectiveUserId) {
            try {
                const { adminDb } = await import("../../../../lib/firebase-admin");
                if (adminDb) {
                    const userSnap = await adminDb.collection("users").doc(effectiveUserId).get();
                    if (userSnap.exists) {
                        const uData = userSnap.data()!;
                        effectiveUserPlan = uData.plan || effectiveUserPlan;
                        if (uData.email) effectiveUserEmail = uData.email;
                    }
                }
            } catch (e) {
                console.warn("[generate-preview] Could not load user doc:", e);
            }

            // Validar cuotas contra Firestore
            const { getAiGenerationUsageAdmin, getAiPlanLimitAdmin, isAdminAdmin } = await import("../../../../lib/quota-admin");
            const isAdmin = isAdminAdmin(effectiveUserEmail);
            if (!isAdmin) {
                const requestedImages = type === 'Carrusel' ? (carouselCount || (promptsEnglish?.length || 3)) : 1;
                const imagesUsed = await getAiGenerationUsageAdmin(effectiveUserId, 'image');
                const imageLimit = await getAiPlanLimitAdmin(effectiveUserPlan, 'image', effectiveUserEmail);

                if (imagesUsed + requestedImages > imageLimit) {
                    return NextResponse.json({
                        error: `Límite mensual de imágenes alcanzado (${imagesUsed}/${imageLimit}). Mejora tu plan para seguir generando imágenes con tus agentes.`
                    }, { status: 403 });
                }

                if (type === 'Reel') {
                    const videosUsed = await getAiGenerationUsageAdmin(effectiveUserId, 'video');
                    const videoLimit = await getAiPlanLimitAdmin(effectiveUserPlan, 'video', effectiveUserEmail);
                    if (videosUsed + 1 > videoLimit) {
                        return NextResponse.json({
                            error: `Límite mensual de videos/reels alcanzado (${videosUsed}/${videoLimit}). Mejora tu plan para crear más videos con tus agentes.`
                        }, { status: 403 });
                    }
                }
            }
        }
        
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
        let effectiveUserCopy = userProvidedCopy || "";
        let effectiveIdea = idea || "";
        let effectiveImageExpectation = imageExpectation || "";
        let effectivePosterConfig: PosterConfig | null = posterConfig ? { ...posterConfig } : null;

        // Auto-detección y extracción si el usuario pegó un prompt completo de cartel en cualquier campo
        let candidatePromptForExtraction = "";
        if (userProvidedCopy && extractSceneAndTypography(userProvidedCopy).isPosterPrompt) {
            candidatePromptForExtraction = userProvidedCopy;
        } else if (imageExpectation && extractSceneAndTypography(imageExpectation).isPosterPrompt) {
            candidatePromptForExtraction = imageExpectation;
        } else if (idea && extractSceneAndTypography(idea).isPosterPrompt) {
            candidatePromptForExtraction = idea;
        }

        if (candidatePromptForExtraction) {
            const extracted = extractSceneAndTypography(candidatePromptForExtraction);
            if (extracted.isPosterPrompt) {
                if (!effectiveImageExpectation || effectiveImageExpectation.length < 15) {
                    effectiveImageExpectation = extracted.sceneDescription;
                }
                if (!effectiveIdea || effectiveIdea.length < 15) {
                    effectiveIdea = extracted.sceneDescription;
                }

                const parsed = extracted.parsedTypography;
                if (parsed) {
                    if (!effectivePosterConfig) {
                        effectivePosterConfig = {
                            enabled: true,
                            includeLogo: false,
                            includeBusinessName: false,
                            includeMainText: Boolean(parsed.mainText),
                            mainText: parsed.mainText || "",
                            includeSlogan: Boolean(parsed.sloganText),
                            sloganText: parsed.sloganText || "",
                            includePrice: Boolean(parsed.priceText),
                            priceText: parsed.priceText || "",
                            includeContact: false,
                            ctaText: parsed.ctaText || "¡Compra Ahora!",
                            includeCta: Boolean(parsed.ctaText),
                            primaryColor: parsed.primaryColor || "#ff5500",
                            visualStyle: "Moderno",
                        };
                    } else {
                        effectivePosterConfig.enabled = true;
                        if (parsed.mainText && !effectivePosterConfig.mainText) {
                            effectivePosterConfig.mainText = parsed.mainText;
                            effectivePosterConfig.includeMainText = true;
                        }
                        if (parsed.sloganText && !effectivePosterConfig.sloganText) {
                            effectivePosterConfig.sloganText = parsed.sloganText;
                            effectivePosterConfig.includeSlogan = true;
                        }
                        if (parsed.priceText && !effectivePosterConfig.priceText) {
                            effectivePosterConfig.priceText = parsed.priceText;
                            effectivePosterConfig.includePrice = true;
                        }
                        if (parsed.ctaText && (!effectivePosterConfig.ctaText || effectivePosterConfig.ctaText === "¡Contáctanos ahora!")) {
                            effectivePosterConfig.ctaText = parsed.ctaText;
                            effectivePosterConfig.includeCta = true;
                        }
                        if (parsed.primaryColor && !effectivePosterConfig.primaryColor) {
                            effectivePosterConfig.primaryColor = parsed.primaryColor;
                        }
                    }
                }

                if (candidatePromptForExtraction === userProvidedCopy) {
                    const headline = parsed?.mainText || "";
                    const slogan = parsed?.sloganText || "";
                    const cta = parsed?.ctaText || "";
                    effectiveUserCopy = [headline, slogan, cta].filter(Boolean).join(" · ");
                }
            }
        }

        // Extraer contexto compartido para los builders de prompts
        const sharedContext = {
            idea: effectiveIdea,
            imageExpectation: effectiveImageExpectation,
            userProvidedCopy: effectiveUserCopy,
            businessType: businessType || "",
            posterConfig: effectivePosterConfig,
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
            const rawPrompt = promptEnglish || promptsEnglish?.[0] || effectiveImageExpectation || effectiveIdea || "";
            const enriched = buildEnrichedGeminiPrompt({
                rawIdeaPrompt: rawPrompt,
                ...sharedContext,
                postType: type || "Post",
            });
            enrichedPrompts = [enriched];
        }

        // Si se envió una imagen base, nuestro Agente Revisor de Producto ancla visualmente sus rasgos
        let productAnalysis = null;
        if (baseImageUrl && typeof baseImageUrl === "string" && baseImageUrl.startsWith("http")) {
            try {
                console.log(`[GENERATE-PREVIEW-PROXY] Invocando Agente de Visión de Producto sobre imagen base:`, baseImageUrl);
                const { analyzeAndAnchorProductPrompt } = await import("../../../../lib/agents/agent-product-vision");
                const agentResult = await analyzeAndAnchorProductPrompt(
                    baseImageUrl,
                    enrichedPrompts[0] || "",
                    businessType
                );
                if (agentResult?.enrichedPrompt) {
                    enrichedPrompts[0] = agentResult.enrichedPrompt;
                }
                productAnalysis = agentResult?.analysis || null;
            } catch (visionErr) {
                console.warn("[GENERATE-PREVIEW-PROXY] Advertencia en Agente de Visión de Producto, continuando con prompt generado:", visionErr);
            }
        }

        console.log(`[GENERATE-PREVIEW-PROXY] Sending enriched prompts to n8n webhook at: ${n8nUrl}`);
        console.log(`[GENERATE-PREVIEW-PROXY] Prompt preview (first 300 chars): ${enrichedPrompts[0]?.substring(0, 300)}...`);

        // ═══════════════════════════════════════════════════════
        // 3. PAYLOAD FINAL AL WEBHOOK DE N8N
        // ═══════════════════════════════════════════════════════
        let enrichedIdea = effectiveIdea || "";
        if (catalogoItem && catalogoItem.name) {
            enrichedIdea += `\n\nCONTEXTO DE PRODUCTO/SERVICIO (Basa el copy del post específicamente en esto): "${catalogoItem.name}" - ${catalogoItem.description}`;
        }

        const effectiveStyleRef =
            styleReferenceUrl ||
            effectivePosterConfig?.slides?.[0]?.styleReferenceUrl ||
            effectivePosterConfig?.styleReferenceUrl ||
            "";

        const isPosterPost = Boolean(
            effectivePosterConfig?.enabled ||
            effectivePosterConfig?.mainText ||
            effectivePosterConfig?.priceText ||
            /typography|headline|cartel|afiche|poster|safe\s+box/i.test(enrichedPrompts[0] || "")
        );
        const finalPromptForN8n = autoEnforceSafeZoneInPrompt(enrichedPrompts[0] || "", isPosterPost);
        const n8nPayload: any = {
            prompt: finalPromptForN8n,
            promptEnglish: finalPromptForN8n,
            baseImageUrl: baseImageUrl || "",
            styleReferenceUrl: effectiveStyleRef,
            styleReferenceTraits: effectivePosterConfig?.slides?.[0]?.styleReferenceTraits || effectivePosterConfig?.styleReferenceTraits || [],
            retouchTargetImageUrl: retouchTargetImageUrl || "",
            retouchInstruction: retouchInstruction || "",
            isMixboardLab: Boolean(isMixboardLab || effectivePosterConfig?.isLabMode),
            allowImageRetouch: allowImageRetouch ?? effectivePosterConfig?.allowImageRetouch ?? true,
            productAnalysis: productAnalysis || null,
            idea: enrichedIdea,
            imageExpectation: effectiveImageExpectation,
            userProvidedCopy: effectiveUserCopy,
            videoPrompt: videoPrompt || "",
            audioUrl: audioUrl || "",
            voiceoverScript: voiceoverScript || "",
            businessType,
            type,
            carouselCount: type === 'Carrusel' ? (carouselCount || 3) : 1,
            email,
            phone,
            profileId,
            posterConfig: effectivePosterConfig?.enabled ? effectivePosterConfig : null,
        };

        // Si es Carrusel con múltiples láminas, enviamos peticiones sincrónicas en lotes de máximo 3 en paralelo
        if (type === 'Carrusel' && enrichedPrompts.length > 1) {
            console.log(`[GENERATE-PREVIEW-PROXY] Procesando Carrusel de ${enrichedPrompts.length} láminas en lotes de 3 N8N...`);

            const batchResults = await runInBatches(enrichedPrompts, 3, async (slidePrompt, slideIdx) => {
                const targetSlide = effectivePosterConfig?.slides?.[slideIdx];
                const slideStyleRef =
                    targetSlide?.styleReferenceUrl ||
                    (targetSlide?.lockStyleFromSlide1 ? (effectivePosterConfig?.slides?.[0]?.imageUrl || "") : effectiveStyleRef);

                const isPosterSlide = Boolean(
                    effectivePosterConfig?.enabled ||
                    targetSlide?.mainText ||
                    targetSlide?.priceText ||
                    /typography|headline|cartel|afiche|poster|safe\s+box/i.test(slidePrompt)
                );
                const finalSlidePrompt = autoEnforceSafeZoneInPrompt(slidePrompt, isPosterSlide);
                const slidePayload = {
                    ...n8nPayload,
                    prompt: finalSlidePrompt,
                    promptEnglish: finalSlidePrompt,
                    slideIndex: slideIdx,
                    totalSlides: enrichedPrompts.length,
                    baseImageUrl: targetSlide?.baseImageUrl || n8nPayload.baseImageUrl,
                    styleReferenceUrl: slideStyleRef || "",
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
                const imgUrl = item?.img_url || item?.imageUrl || item?.url || item?.image || item?.outputUrl || item?.output || item?.data?.imageUrl || item?.data?.url || (typeof slideData === 'string' && slideData.startsWith('http') ? slideData : '');
                return { slideIndex: slideIdx, imageUrl: imgUrl };
            });

            const validResults = batchResults.filter((r): r is { slideIndex: number; imageUrl: string } => r !== null && Boolean(r.imageUrl));
            const imageUrls = validResults.map(r => r.imageUrl);

            if (imageUrls.length > 0 && effectiveUserId) {
                try {
                    const { logAiGenerationAdmin } = await import("../../../../lib/quota-admin");
                    await logAiGenerationAdmin(effectiveUserId, profileId || 'default', 'image', {
                        count: imageUrls.length,
                        postType: 'Carrusel',
                        carouselCount: imageUrls.length,
                        prompt: enrichedPrompts[0]
                    });
                } catch (logErr) {
                    console.error("[generate-preview] Error registrando consumo de carrusel:", logErr);
                }
            }

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

        // Registrar consumo exitoso en Firestore para el cliente
        if (effectiveUserId) {
            try {
                const { logAiGenerationAdmin } = await import("../../../../lib/quota-admin");
                await logAiGenerationAdmin(effectiveUserId, profileId || 'default', 'image', {
                    count: 1,
                    postType: type || 'Post',
                    prompt: enrichedPrompts[0]
                });
                if (type === 'Reel') {
                    await logAiGenerationAdmin(effectiveUserId, profileId || 'default', 'video', {
                        count: 1,
                        postType: 'Reel',
                        audioUrl
                    });
                }
            } catch (logErr) {
                console.error("[generate-preview] Error registrando consumo de imagen/video:", logErr);
            }
        }

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
