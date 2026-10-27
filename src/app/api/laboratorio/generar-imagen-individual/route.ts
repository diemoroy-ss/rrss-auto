import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { HARDCODED_STYLES } from "../../../../lib/prompt-templates";
import { DEFAULT_TEXT_TEMPLATES } from "../../../../lib/text-templates";
import { generateFreeText } from "../../../../lib/gemini-free";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Limpia la fórmula maestra del estilo visual para que NO arrastre secciones
 * de tipografía pre-diseñadas ni corchetes que puedan provocar duplicación o triplicación
 * de textos en los afiches comerciales, y purga menciones de comida si el rubro no es gastronómico.
 */
function cleanStylePromptForSubject(
  rawPrompt: string,
  rawKeywords: string,
  subject: string,
  rubro: string
): { scenePrompt: string; cleanKeywords: string } {
  let promptText = rawPrompt || "";
  let keywords = rawKeywords || "";

  // 1. Quitar cualquier bloque de tipografía que traiga la plantilla del estilo
  promptText = promptText.replace(
    /GRAPHIC\s+DESIGN\s*&\s*ON-IMAGE\s+TYPOGRAPHY[\s\S]*?(?=(Luxury|Editorial|High-|Sophisticated|Modern|8k|$))/gi,
    ""
  );
  promptText = promptText.replace(
    /ON-IMAGE\s+TYPOGRAPHY[\s\S]*?(?=(Luxury|Editorial|High-|Sophisticated|Modern|8k|$))/gi,
    ""
  );
  promptText = promptText.replace(/STRICT\s+PLACEMENT\s+AND\s+NEGATIVE\s+RULE:[^\n\r]*/gi, "");

  // 2. Reemplazar corchetes de producto/objeto por el sujeto real
  promptText = promptText.replace(
    /\[(?:Nombre\s+del\s+Plato|Plato\s+Principal|Objeto|Sujeto|Estructura|Escenario)[^\]]*\]/gi,
    subject
  );
  // Eliminar cualquier otro corchete que haya quedado (titulares, kickers, botones, ingredientes de ejemplo)
  promptText = promptText.replace(/\[[^\]]+\]/g, "");

  // 3. Si el rubro NO es gastronomía, purgar términos de comida que hayan venido del estilo
  const isFoodRubro = /restauran|gastronom|comida|pizz|burger|hamburgues|sushi|cafe|cafeter|pastel|panader|bar|cervecer|parrill/i.test(
    rubro || ""
  );
  if (!isFoodRubro) {
    promptText = promptText
      .replace(
        /\b(restaurant|food|culinary|gourmet\s+dish|dining\s+experience|steak|wine\s+glass|candlelit\s+dining|appetizing|plating|chef|cookware|spices|sauce|broth|ramen|pizza|biryani|pasta|garlic|chicken|bowl|platter|tasty|meal|dish|rice|dining|recipe|menu\s+board|ingredients|cooking)\b/gi,
        "commercial subject"
      )
      .replace(/,\s*,/g, ",")
      .trim();

    keywords = keywords
      .replace(
        /\b(restaurant|food|culinary|gourmet|steak|wine|candlelit|broth|ramen|pizza|biryani|pasta|garlic|delicious|appetizing|chicken|bowl|platter|tasty|meal|dish|rice|dining|recipe|menu\s+board|ingredients|cooking|buena comida[^,]*|tu restaurante|experiencias que hacen volver)\b/gi,
        ""
      )
      .replace(/,\s*,/g, ",")
      .trim();
  }

  promptText = promptText.replace(/\n\s*\n\s*\n/g, "\n\n").trim();

  return { scenePrompt: promptText, cleanKeywords: keywords };
}

// Invoca el webhook de n8n para UNA SOLA IMAGEN de forma individual respetando el estilo visual y foto base
async function generateSingleImageWebhook(
  promptEnglish: string,
  rubro: string,
  productName: string,
  aspectRatio: "1:1" | "9:16" = "1:1",
  baseImageUrl?: string,
  extraOptions?: {
    styleReferenceUrl?: string;
    idea?: string;
    posterConfig?: any;
  }
): Promise<string> {
  const width = aspectRatio === "9:16" ? 720 : 1080;
  const height = aspectRatio === "9:16" ? 1280 : 1080;
  const seed = Math.floor(Math.random() * 1000000);

  const hasValidBase = Boolean(
    baseImageUrl && typeof baseImageUrl === "string" && baseImageUrl.startsWith("http")
  );

  const n8nWebhookUrl =
    process.env.NEXT_PUBLIC_N8N_PREVIEW_URL || "https://n8n.santisoft.cl/webhook/img-rrss-auto";

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const n8nRes = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptEnglish,
          promptEnglish,
          baseImageUrl: hasValidBase ? baseImageUrl : "",
          styleReferenceUrl: extraOptions?.styleReferenceUrl || "",
          idea: extraOptions?.idea || productName,
          imageExpectation: productName,
          businessType: rubro,
          rubro,
          dishOrProduct: productName,
          type: aspectRatio === "9:16" ? "Historia" : "Post",
          carouselCount: 1,
          allowImageRetouch: true,
          posterConfig: extraOptions?.posterConfig || null,
        }),
        signal: AbortSignal.timeout(75000), // 75s para nuestro modelo real en n8n
      });

      if (n8nRes.ok) {
        const rawData = await n8nRes.json().catch(() => ({}));
        const data = Array.isArray(rawData) ? rawData[0] : rawData;
        const candidateUrl =
          data?.img_url ||
          data?.imageUrl ||
          data?.url ||
          data?.outputUrl ||
          data?.output ||
          data?.image ||
          data?.data?.imageUrl ||
          data?.data?.url ||
          (typeof rawData === "string" && rawData.startsWith("http") ? rawData : null);

        if (candidateUrl && typeof candidateUrl === "string" && candidateUrl.startsWith("http")) {
          return candidateUrl;
        }
      }
    } catch (err) {
      console.warn(`[Generar Imagen Individual] Webhook de n8n intento ${attempt} falló:`, err);
    }
  }

  // Fallback a Flux (Pollinations) limpiando cualquier URL para evitar errores HTTP
  const cleanFluxPrompt = promptEnglish
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 380);

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanFluxPrompt)}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true&seed=${seed}`;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    let uid = "anon";
    if (authHeader?.startsWith("Bearer ") && adminAuth) {
      try {
        const token = authHeader.split("Bearer ")[1];
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch (authErr) {
        console.warn("[Generar Imagen Individual] Token no verificado:", authErr);
      }
    }

    const body = await req.json();
    const {
      demoId,
      pubIndex = 0,
      promptEnglish = "",
      rubro = "Comercio",
      productName = "Producto",
      aspectRatio = "1:1",
      isCommercialPoster,
      businessName,
      productDescription,
      price,
      idea,
      logoUrl,
      customBadgeText,
      styleId = "",
      styleTitle = "",
      stylePrompt = "",
      styleKeywords = "",
      baseImageUrl = "",
      templateId = "",
    } = body;

    if (!promptEnglish && !productName) {
      return NextResponse.json(
        { error: "Se requiere prompt o nombre de producto para generar la imagen." },
        { status: 400 }
      );
    }

    // Buscar definición del estilo visual en HARDCODED_STYLES
    const matchedStyle = HARDCODED_STYLES.find(
      (h) =>
        (styleId && h.id === styleId) ||
        (styleTitle && h.title.toLowerCase() === String(styleTitle).toLowerCase())
    );

    const effectiveStyleTitle = styleTitle || matchedStyle?.title || "";
    const effectiveStyleFormula = stylePrompt || matchedStyle?.prompt || "";
    const effectiveStyleKeywords = styleKeywords || matchedStyle?.styleKeywords || "";

    const { scenePrompt, cleanKeywords } = cleanStylePromptForSubject(
      effectiveStyleFormula,
      effectiveStyleKeywords,
      productName,
      rubro
    );

    let styleCraftedPrompt = "";
    if (scenePrompt) {
      const populatedFormula = scenePrompt.includes(productName)
        ? scenePrompt
        : `${scenePrompt}, featuring ${productName}`;
      styleCraftedPrompt = `MANDATORY VISUAL STYLE "${effectiveStyleTitle}": ${populatedFormula}. ${cleanKeywords ? `Keywords: ${cleanKeywords}.` : ""}`;
    }

    const isFoodRubro = /restauran|gastronom|comida|pizz|burger|hamburgues|sushi|cafe|cafeter|pastel|panader|bar|cervecer|parrill/i.test(
      rubro || ""
    );
    let cleanPromptEnglish = promptEnglish.replace(/https?:\/\/\S+/gi, "").trim();
    if (!isFoodRubro) {
      cleanPromptEnglish = cleanPromptEnglish
        .replace(
          /\b(restaurant|food|culinary|gourmet|steak|wine|broth|ramen|pizza|biryani|pasta|garlic|chicken|bowl|platter|tasty|meal|dish|rice|dining|recipe|menu\s+board|ingredients|cook)\b/gi,
          ""
        )
        .replace(/,\s*,/g, ",")
        .trim();
    }

    let combinedPrompt = styleCraftedPrompt
      ? `${styleCraftedPrompt}. Hero subject: ${productName}. ${cleanPromptEnglish}`.trim()
      : cleanPromptEnglish || `Commercial advertising photography of ${productName}, premium studio lighting, 8k resolution`;

    // Si hay una foto base de referencia subida por el vendedor, analizarla con Gemini Vision para anclar la anatomía exacta del producto dentro del estilo
    if (baseImageUrl && typeof baseImageUrl === "string" && baseImageUrl.startsWith("http")) {
      try {
        const visionPrompt = await generateFreeText(
          `Analyze the product in the attached image ("${productName}"). Write a concise 60-word English photography prompt that recreates THIS EXACT product transformed into the visual style "${effectiveStyleTitle || 'Commercial High-End'}" (${effectiveStyleFormula || combinedPrompt}). Include clean negative space at top and bottom margins. Output ONLY the English prompt without quotes.`,
          "You are an expert commercial photography director.",
          false,
          baseImageUrl,
          "generate_post"
        );
        if (visionPrompt && visionPrompt.trim().length > 20) {
          combinedPrompt = `${styleCraftedPrompt} ${visionPrompt.trim()}`.trim();
        }
      } catch (visionErr) {
        console.warn("[Generar Imagen Individual] No se pudo anclar con visión, continuando con prompt de estilo:", visionErr);
      }
    }

    const effectiveHeadline = (productDescription || productName || "OFERTA ESPECIAL").trim().toUpperCase();
    const effectiveBadge = (businessName || "").trim();
    const effectivePrice = (price || "").trim();
    const effectiveCta = (customBadgeText || `¡Cotiza hoy! · ${businessName || ""}`).replace(/·\s*$/, "").trim();

    const isBadgeShort = effectiveBadge.length > 0 && effectiveBadge.length <= 24;
    const isBadgeLong = effectiveBadge.length > 24;

    let finalPromptForWebhook = "";
    let posterConfigForN8n: any = null;

    if (isCommercialPoster) {
      const typoLines: string[] = [
        `POSTER & ADVERTISING LAYOUT SPECIFICATIONS:`,
        `- TYPOGRAPHY & LAYOUT (Exact Spanish text):`,
        `- CLEAN ADVERTISING COMPOSITION: All typography, headlines, badges, prices and CTA buttons MUST stay centered with generous breathing space away from the edges. Clean high-end social media commercial finish.`,
        `- MANDATORY ANTI-DUPLICATION RULE: Render the headline EXACTLY ONCE. Render the price badge EXACTLY ONCE. DO NOT REPEAT ANY WORD OR NUMBER. DO NOT RENDER MULTIPLE HEADLINES, DO NOT RENDER BACKGROUND WATERMARKS OF THE TEXT, DO NOT STAMP RANDOM ICONS OR LABELS.`,
        `- MANDATORY NEGATIVE INSTRUCTION: ABSOLUTELY DO NOT RENDER ANY MEASUREMENT ARROWS, LABELS, NUMBERS, PERCENTAGES, RED OR ORANGE GUIDELINES, DRAFTING MARKS, WIREFRAME BOXES, TECHNICAL RULERS, OR BOUNDING BOXES ON THE IMAGE. RENDER ONLY THE PRISTINE COMMERCIAL GRAPHIC ARTWORK AND TEXT.`,
      ];

      if (isBadgeShort) {
        typoLines.push(`- UPPER CENTER (Single small pill badge floating centered with generous breathing room from top edge): "${effectiveBadge}".`);
      }
      if (effectiveHeadline) {
        typoLines.push(`- MID-UPPER CENTER (Single centered compact headline broken into 1 to 3 short lines, well-centered with ample empty breathing space on left and right sides): "${effectiveHeadline}".`);
      }
      if (isBadgeLong) {
        typoLines.push(`- SUBTITLE (Single centered line below the headline in clean smaller secondary font): "${effectiveBadge}".`);
      }
      if (effectivePrice && effectivePrice !== effectiveHeadline && effectivePrice !== effectiveBadge) {
        typoLines.push(`- HIGHLIGHT BADGE (Single centered floating price badge with high contrast background): "${effectivePrice}".`);
      }
      if (effectiveCta) {
        typoLines.push(`- LOWER CENTER (Single centered pill button positioned cleanly above the lower edge with ample side margins): "${effectiveCta}".`);
      }
      typoLines.push(
        `Ultra-sharp vector typography, commercial graphic design, compact centered clean composition, professional studio advertising layout, 8k.`,
        ``,
        `TECHNICAL REQUIREMENTS:`,
        `- VERY IMPORTANT: IGNORE ANY PREVIOUS 'NO TEXT' INSTRUCTIONS. This is a promotional poster that requires text.`,
        `- Integrate the promotional text, values, and branding seamlessly as a professional graphic designer would.`,
        `- Ensure high contrast and absolute legibility of all written details.`,
        `- DO NOT ADD ANY RANDOM GIBBERISH, 'LOREM IPSUM', OR HALLUCINATED TYPOGRAPHY.`,
        `- ALL TEXT WRITTEN IN THE IMAGE MUST BE STRICTLY IN SPANISH (ESPAÑOL) AND MATCH THE REQUESTED COPY EXACTLY.`
      );

      finalPromptForWebhook = `commercial advertising flyer poster design, professional graphic design layout, high-quality promotional banner, square 1:1 format.\n\nMAIN VISUAL CONCEPT:\n${combinedPrompt}\nIndustry/Business type: ${rubro}.\n\n${typoLines.join("\n")}`;
      posterConfigForN8n = {
        enabled: true,
        includeLogo: false,
        includeBusinessName: Boolean(effectiveBadge),
        businessName: effectiveBadge,
        includeMainText: true,
        mainText: effectiveHeadline,
        includeSlogan: Boolean(effectiveBadge),
        sloganText: effectiveBadge,
        includePrice: Boolean(effectivePrice),
        priceText: effectivePrice,
        includeCta: Boolean(effectiveCta),
        ctaText: effectiveCta,
        visualStyle: "Moderno",
      };
    } else {
      finalPromptForWebhook = `${combinedPrompt}, clean background with breathing room at top and bottom margins, 8k resolution, STRICT NEGATIVE: no text, no typography, no letters, no words, no numbers, no watermarks`;
    }

    console.log(`[Generar Imagen Individual] Solicitando imagen 1-a-1 para pub #${pubIndex + 1} ("${productName}" en estilo "${effectiveStyleTitle || 'Comercial'}")...`);

    // Llamar al webhook para ESTA SOLA IMAGEN con nuestro modelo real en n8n
    const baseRawImageUrl = await generateSingleImageWebhook(
      finalPromptForWebhook,
      rubro,
      productName,
      aspectRatio === "9:16" ? "9:16" : "1:1",
      baseImageUrl || undefined,
      {
        styleReferenceUrl: matchedStyle?.previewUrl || "",
        idea: idea || productName,
        posterConfig: posterConfigForN8n,
      }
    );

    const isFallbackImage = baseRawImageUrl.includes("pollinations.ai");
    let finalComposedUrl = baseRawImageUrl;
    let commercialEditId: string | undefined;
    let appliedTemplateId = isFallbackImage ? templateId : "";
    let appliedTemplateName = isFallbackImage ? "" : (isCommercialPoster ? "Diseño Directo con Agentes" : "");

    // Elegir plantilla de texto al azar de DEFAULT_TEXT_TEMPLATES solo si se requiere respaldo
    const randomTpl =
      DEFAULT_TEXT_TEMPLATES.find((t) => t.id === templateId) ||
      DEFAULT_TEXT_TEMPLATES[Math.floor(Math.random() * DEFAULT_TEXT_TEMPLATES.length)];

    // Si se envió demoId, consultar datos y actualizar en Firestore
    if (demoId && adminDb) {
      try {
        const docRef = adminDb.collection("admin_prospect_demos").doc(demoId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          const demoData = docSnap.data();
          const publications = Array.isArray(demoData?.publications) ? [...demoData.publications] : [];
          const targetPub = publications[pubIndex] || {};

          const shouldComposeCommercial = isCommercialPoster ?? targetPub.isCommercialPoster ?? false;
          const effectiveLogo = logoUrl || demoData?.logoUrl || "";

          if (shouldComposeCommercial && isFallbackImage) {
            try {
              const { composeCommercialSlideWithEditor } = await import("../../../../lib/real-product-compositor");
              const composed = await composeCommercialSlideWithEditor({
                baseImageUrl: baseRawImageUrl,
                fallbackImageUrl: baseImageUrl || demoData?.baseImageUrl || matchedStyle?.previewUrl,
                productName: productName || targetPub.dishOrProductName || "Producto",
                productDescription: productDescription || targetPub.description || demoData?.offerText || targetPub.title || "",
                price: price || targetPub.productPrice || "",
                idea: idea || targetPub.hook || targetPub.title || "",
                rubro: rubro || demoData?.rubro || "Comercio",
                businessName: businessName || demoData?.prospectBusiness || demoData?.businessName || "Negocio",
                aspectRatio: aspectRatio === "9:16" ? "9:16" : "1:1",
                logoUrl: effectiveLogo || undefined,
                userId: uid,
                includeLogo: Boolean(effectiveLogo),
                saveEditableInLibrary: true,
                customBadgeText: customBadgeText || targetPub.badgeCustomText || "",
                skipAgentCopy: true,
                templateId: randomTpl?.id,
              });
              finalComposedUrl = composed.finalImageUrl;
              commercialEditId = composed.editDocId;
              appliedTemplateId = composed.templateId || randomTpl?.id || "";
              appliedTemplateName = composed.templateName || randomTpl?.name || "";
            } catch (cErr) {
              console.warn("[Generar Imagen Individual] Error componiendo texto comercial de respaldo:", cErr);
            }
          } else if (effectiveLogo && effectiveLogo.startsWith("http")) {
            try {
              const { overlayLogoOnImage } = await import("../../../../lib/image-watermark");
              finalComposedUrl = await overlayLogoOnImage(baseRawImageUrl, effectiveLogo, uid, {
                position: "top-left",
              });
            } catch {
              finalComposedUrl = baseRawImageUrl;
            }
          }

          if (publications[pubIndex]) {
            const isCarousel = targetPub.type === "carrusel";
            const updatedCarouselImages = Array.isArray(targetPub.carouselImages) && targetPub.carouselImages.length > 0
              ? [finalComposedUrl, ...targetPub.carouselImages.slice(1)]
              : [finalComposedUrl];

            publications[pubIndex] = {
              ...targetPub,
              imageUrl: finalComposedUrl,
              baseImageUrl: baseRawImageUrl,
              textTemplateId: appliedTemplateId,
              textTemplateName: appliedTemplateName,
              visualStyleId: styleId || effectiveStyleTitle,
              visualStyleTitle: effectiveStyleTitle,
              visualStylePrompt: effectiveStyleFormula,
              visualStyleKeywords: effectiveStyleKeywords,
              ...(isCarousel ? { carouselImages: updatedCarouselImages } : {}),
              ...(commercialEditId ? { commercialEditId } : {}),
            };
            await docRef.update({
              publications,
              ...(pubIndex === 0
                ? {
                    generatedImageUrl: finalComposedUrl,
                    selectedStyleTitle: effectiveStyleTitle,
                  }
                : {}),
            });
            console.log(`[Generar Imagen Individual] Muestra ${demoId} actualizada en Firestore con nueva imagen en pub #${pubIndex + 1}.`);
          }
        }
      } catch (dbErr) {
        console.warn("[Generar Imagen Individual] Error actualizando Firestore (no bloqueante):", dbErr);
      }
    } else if (isCommercialPoster && isFallbackImage) {
      try {
        const { composeCommercialSlideWithEditor } = await import("../../../../lib/real-product-compositor");
        const composed = await composeCommercialSlideWithEditor({
          baseImageUrl: baseRawImageUrl,
          fallbackImageUrl: baseImageUrl || matchedStyle?.previewUrl,
          productName,
          productDescription: productDescription || "",
          price: price || "",
          idea: idea || "",
          rubro,
          businessName: businessName || "Negocio",
          aspectRatio: aspectRatio === "9:16" ? "9:16" : "1:1",
          logoUrl: logoUrl || undefined,
          userId: uid,
          includeLogo: Boolean(logoUrl),
          saveEditableInLibrary: true,
          customBadgeText: customBadgeText || "",
          skipAgentCopy: true,
          templateId: randomTpl?.id,
        });
        finalComposedUrl = composed.finalImageUrl;
        appliedTemplateId = composed.templateId || randomTpl?.id || "";
        appliedTemplateName = composed.templateName || randomTpl?.name || "";
      } catch (cErr) {
        console.warn("[Generar Imagen Individual] Error componiendo texto comercial:", cErr);
      }
    } else if (logoUrl && logoUrl.startsWith("http")) {
      try {
        const { overlayLogoOnImage } = await import("../../../../lib/image-watermark");
        finalComposedUrl = await overlayLogoOnImage(baseRawImageUrl, logoUrl, uid, {
          position: "top-left",
        });
      } catch {
        finalComposedUrl = baseRawImageUrl;
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalComposedUrl,
      baseImageUrl: baseRawImageUrl,
      templateId: appliedTemplateId,
      templateName: appliedTemplateName,
      pubIndex,
      styleTitle: effectiveStyleTitle,
      styleId: styleId || effectiveStyleTitle,
      stylePrompt: effectiveStyleFormula,
      styleKeywords: effectiveStyleKeywords,
      editDocId: commercialEditId,
    });
  } catch (error: any) {
    console.error("[Generar Imagen Individual] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar la imagen individual con nuestros agentes." },
      { status: 500 }
    );
  }
}
