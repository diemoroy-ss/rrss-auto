import { NextRequest, NextResponse } from 'next/server';
import { runProfessionalStrategyWorkflow } from '../../../../lib/langgraph-strategy';
import { adminDb } from '../../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { 
      goal, 
      goalName, 
      businessType, 
      userId, 
      profileId,
      expectations, 
      promotions, 
      includePromotions,
      promoImageMode,
      selectedPromotions,
      businessData, 
      connectedPlatforms, 
      nicheContext, 
      postsPerWeek, 
      catalogoItems, 
      catalogUsage,
      selectedPromptStyles,
      usePromptStyles,
      isCommercialPoster,
      feedAudit
    } = await req.json();

    if (!goal) {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    // Convert connectedPlatforms object to array of names
    let platforms: string[] = [];
    if (connectedPlatforms) {
        if (connectedPlatforms.facebook) platforms.push("Facebook");
        if (connectedPlatforms.instagram) platforms.push("Instagram");
        if (connectedPlatforms.tiktok) platforms.push("TikTok");
        if (connectedPlatforms.linkedin) platforms.push("LinkedIn");
    }
    
    // Fallback if none provided
    if (platforms.length === 0) platforms.push("Instagram", "Facebook");

    // Build catalog context string to inject into strategy workflow
    let catalogContext = "";
    if (catalogoItems && catalogoItems.length > 0 && catalogUsage !== "none") {
        const catalogList = catalogoItems
            .map((item: any) => `- ${item.type === "producto" ? "Producto" : "Servicio"}: "${item.name}"${item.category ? ` [Categoría: ${item.category}]` : ""}${item.description ? ` — ${item.description}` : ""}${item.price ? ` (Precio Normal: ${item.price})` : ""}${item.offerPrice ? ` [PRECIO OFERTA / PROMOCIÓN ACTIVA: ${item.offerPrice}]` : ""}`)
            .join("\n");
        
        if (catalogUsage === "all") {
            catalogContext = `\n\nCATÁLOGO DE PRODUCTOS/SERVICIOS (¡IMPORTANTE! BASA TODA LA ESTRATEGIA EXCLUSIVAMENTE EN ESTOS ÍTEMS Y SUS PROMOCIONES, DEDICA CADA POST A UNO O VARIOS DE ELLOS):\n${catalogList}`;
        } else {
            catalogContext = `\n\nCATÁLOGO DE PRODUCTOS/SERVICIOS DE ESTA MARCA (incluye publicaciones específicas sobre estos ítems y destaca las promociones activas en la estrategia, mezclándolos con contenido general de valor):\n${catalogList}`;
        }
    }

    // Build structured promotions context
    let structuredPromosContext = "";
    const activePromoList = (includePromotions !== false && Array.isArray(selectedPromotions)) ? selectedPromotions : [];
    if (activePromoList.length > 0) {
        const promoLines = activePromoList.map((p: any, idx: number) => {
            const linkedStr = Array.isArray(p.linkedProducts) && p.linkedProducts.length > 0
                ? ` | Productos/Servicios incluidos: ${p.linkedProducts.map((lp: any) => `"${lp.name}"${lp.price ? ` (${lp.price})` : ""}`).join(", ")}`
                : "";
            return `- Promoción #${idx + 1}: ID: "${p.id}" | Título Promo: "${p.name}" | Oferta: "${p.offerPrice || p.price || 'Especial'}"${p.price && p.offerPrice ? ` (Antes: ${p.price})` : ""} | Detalle: "${p.description || ''}"${linkedStr}`;
        }).join("\n");

        const imgRule = promoImageMode === "with_text"
            ? "REGLA VISUAL DE PROMOCIONES: TODAS las publicaciones de promociones deben ir CON TEXTO PUBLICITARIO (isCommercialPoster: true, promoImageMode: 'with_text')."
            : promoImageMode === "without_text"
            ? "REGLA VISUAL DE PROMOCIONES: TODAS las publicaciones de promociones deben ir SIN TEXTO EN LA IMAGEN (fotografía limpia del plato/producto, isCommercialPoster: false, promoImageMode: 'without_text'), dejando toda la oferta escrita en el copy."
            : "REGLA VISUAL DE PROMOCIONES: Alterna publicaciones de promociones CON TEXTO PUBLICITARIO (isCommercialPoster: true, promoImageMode: 'with_text') y SIN TEXTO EN LA IMAGEN (fotografía limpia, isCommercialPoster: false, promoImageMode: 'without_text').";

        structuredPromosContext = `\n\n🔥 PROMOCIONES ACTIVAS SELECCIONADAS PARA INCLUIR EN ESTA ESTRATEGIA (OBLIGATORIO: Programa publicaciones dedicadas a estas promociones):\n${promoLines}\n${imgRule}`;
    }

    const enrichedNicheContext = (nicheContext || "") + catalogContext + structuredPromosContext;

    console.log(`[STRATEGY] Starting Professional LangGraph strategy for user ${userId}`);

    // Fetch user post history with metrics
    let history = "No hay historial previo.";
    try {
        const postsSnap = await adminDb.collection('social_posts')
            .where('userId', '==', userId)
            .where('status', '==', 'published')
            .orderBy('timestamp', 'desc')
            .limit(15)
            .get();

        if (!postsSnap.empty) {
            const pastPosts = postsSnap.docs.map(doc => {
                const p = doc.data();
                return {
                    idea: p.idea || "",
                    copy: p.copy || p.text || "",
                    formato: p.type || "Desconocido",
                    redes: p.networks ? p.networks.join(',') : "",
                    likes: p.likes || 0,
                    comentarios: p.comments || 0,
                    compartidos: p.shares || 0,
                    alcance: p.reach || 0,
                    impresiones: p.impressions || 0,
                    fecha: p.publishedAt ? p.publishedAt.toDate().toISOString() : "Desconocida"
                };
            });
            history = JSON.stringify(pastPosts);
        }
    } catch (e: any) {
        console.warn("[STRATEGY] Error fetching user history:", e.message);
    }

    let promptStylesToPass = (usePromptStyles !== false && Array.isArray(selectedPromptStyles) && selectedPromptStyles.length > 0)
        ? selectedPromptStyles.map((s: any) => ({
            id: s.id,
            title: s.title,
            category: s.category,
            description: s.description,
            previewUrl: s.previewUrl || ""
        }))
        : [];

    let userPlan = "pro";
    let userEmail = "";
    // Si el usuario no seleccionó estilos manualmente en el generador, pero su perfil tiene un ADN de Identidad Visual configurado
    if (userId) {
        try {
            const userDoc = await adminDb.collection("users").doc(userId).get();
            const uData = userDoc.data() || {};
            userPlan = (uData.plan || "free").toLowerCase();
            userEmail = uData.email || "";

            if (promptStylesToPass.length === 0) {
                const profiles = uData.profiles || [];
                const prof = profiles.find((p: any) => p.id === profileId) || profiles[0];
                const vIdentity = prof?.visualIdentity;
                if (vIdentity?.styleMix && vIdentity.styleMix.length > 0) {
                    const { HARDCODED_STYLES } = await import('../../../../lib/prompt-templates');
                    promptStylesToPass = vIdentity.styleMix.map((sm: any) => {
                        const t = HARDCODED_STYLES.find(item => item.id === sm.styleId);
                        return t ? {
                            id: t.id,
                            title: t.title,
                            category: t.category,
                            description: t.description,
                            previewUrl: t.previewUrl || "",
                            weight: sm.weight
                        } : null;
                    }).filter(Boolean);
                    console.log(`[STRATEGY] Usando ${promptStylesToPass.length} estilos del ADN visual del perfil`);
                }
            }
        } catch (vErr) {
            console.warn("[STRATEGY] Error reading user doc / visualIdentity:", vErr);
        }
    }

    // 1. Cargar cuotas reales y límites del usuario
    const { 
        getPlanLimitAdmin, 
        getAiPlanLimitAdmin, 
        getQuotaUsageAdmin, 
        getAiGenerationUsageAdmin, 
        getVideoQuotaUsageAdmin,
        isAdminAdmin 
    } = await import('../../../../lib/quota-admin');

    const isAdmin = isAdminAdmin(userEmail);
    const { getPlanConfig } = await import('../../../../lib/plans');
    const planConfig = getPlanConfig(userPlan);

    // Filtrar plataformas disponibles según el plan del usuario (Esencial: solo IG y FB; Crecimiento/Piloto: Multicanal)
    if (!isAdmin) {
        platforms = platforms.filter(p => {
            const pLower = p.toLowerCase();
            return planConfig.allowedPlatforms.some(ap => pLower.includes(ap));
        });
        if (platforms.length === 0) {
            platforms = ["Instagram", "Facebook"];
        }
    }

    // 2. Límites según el plan configurado
    const postsLimit = await getPlanLimitAdmin(userPlan, userEmail);
    const videosLimit = await getAiPlanLimitAdmin(userPlan, 'video', userEmail);
    const imagesLimit = await getAiPlanLimitAdmin(userPlan, 'image', userEmail);

    // 3. Consumo actual acumulado del mes
    const postsUsed = await getQuotaUsageAdmin(userId, profileId || 'default');
    const videosUsed = await getVideoQuotaUsageAdmin(userId);
    const imagesUsed = await getAiGenerationUsageAdmin(userId, 'image');

    // 4. Cuotas pendientes / disponibles
    const remainingPosts = isAdmin ? 999999 : Math.max(0, postsLimit - postsUsed);
    const remainingVideos = isAdmin ? 999999 : Math.max(0, videosLimit - videosUsed);
    const remainingImages = isAdmin ? 999999 : Math.max(0, imagesLimit - imagesUsed);

    console.log(`[STRATEGY] Cuotas usuario ${userId} (${planConfig.id}): Posts ${postsUsed}/${postsLimit} (restan ${remainingPosts}), Videos ${videosUsed}/${videosLimit} (restan ${remainingVideos}), Imágenes ${imagesUsed}/${imagesLimit} (restan ${remainingImages})`);

    // Validación: Si el usuario ya completó el 100% de sus publicaciones mensuales
    if (!isAdmin && remainingPosts <= 0) {
        return NextResponse.json({ 
            error: `Has completado tu cuota de publicaciones de este mes (${postsUsed}/${postsLimit} posts del ${planConfig.name}). Puedes mejorar tu plan o esperar a tu próximo ciclo mensual para planificar nuevas publicaciones.` 
        }, { status: 403 });
    }

    // 5. Pacing de publicaciones por estrategia según el plan
    // Plan Esencial: 15 publicaciones estratégicas en el mes
    // Plan Crecimiento: 30 publicaciones (grilla mensual completa)
    // Plan Piloto Automático: 30 a 60 publicaciones
    let targetMonthlyPosts = planConfig.maxPostsPerMonth;
    if (isAdmin) targetMonthlyPosts = postsPerWeek || 30;

    let defaultPlanPosts = 15;
    if (planConfig.id === 'free') defaultPlanPosts = 3;
    else if (planConfig.id === 'esencial') defaultPlanPosts = 15;
    else if (planConfig.id === 'crecimiento') defaultPlanPosts = 30;
    else if (planConfig.id === 'piloto_automatico') defaultPlanPosts = 30;

    let effectivePosts = postsPerWeek ? Math.min(postsPerWeek, targetMonthlyPosts) : defaultPlanPosts;
    // Topado estrictamente por las publicaciones restantes del usuario
    effectivePosts = Math.min(effectivePosts, remainingPosts);
    effectivePosts = Math.max(1, effectivePosts);

    // 6. Asignación de Videos / Reels según plan y cuota pendiente real
    let maxVideos = 0;
    if (planConfig.maxReelsScripts > 0 && remainingVideos > 0) {
        // En esencial máx 8 reels en el mes; en crecimiento hasta 30; en piloto hasta 60
        const planAllowedReels = Math.min(planConfig.maxReelsScripts, remainingVideos);
        maxVideos = Math.min(planAllowedReels, effectivePosts);
    } else {
        maxVideos = 0; // Free o sin cuota de videos disponible
    }

    // 7. Consideración de Cuota de Imágenes
    const combinedItemsForStrategy = [
        ...activePromoList.map((p: any) => ({ ...p, type: 'promocion' })),
        ...(catalogoItems || [])
    ];

    const catalogHasRealPhotos = combinedItemsForStrategy.some((item: any) => 
        Boolean((item.hasImage || item.imageUrl) && typeof item.imageUrl === 'string' && (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('/')))
    );

    if (!isAdmin && remainingImages < (effectivePosts - maxVideos) && !catalogHasRealPhotos) {
        const affordableImagePosts = Math.max(0, remainingImages);
        const maxPossiblePosts = affordableImagePosts + maxVideos;
        if (maxPossiblePosts < effectivePosts) {
            console.log(`[STRATEGY] Ajustando posts de ${effectivePosts} a ${maxPossiblePosts} debido a cuota de imágenes (${remainingImages} restantes)`);
            effectivePosts = Math.max(1, maxPossiblePosts);
        }
    }
    
    const result = await runProfessionalStrategyWorkflow(
        businessType || "General",
        goalName || goal,
        expectations || "",
        platforms,
        history,
        enrichedNicheContext,
        effectivePosts,
        promotions || "",
        promptStylesToPass,
        businessData || {},
        userPlan,
        maxVideos,
        combinedItemsForStrategy,
        (catalogUsage === "none" && activePromoList.length > 0) ? "mixed" : (catalogUsage || "mixed"),
        remainingPosts,
        remainingVideos,
        remainingImages,
        Boolean(isCommercialPoster),
        feedAudit || null
    );

    // Normalizar promociones, imágenes CON texto vs SIN texto y formato tipográfico óptimo por Agente Director de Arte
    const { decideArtDirection } = await import('../../../../lib/agents/agent-art-director');
    const promoIdsSet = new Set(activePromoList.map((p: any) => p.id));
    let promoToggleIdx = 0;
    const visionCache = new Map<string, any>();

    const normalizedStrategy = await Promise.all((result.strategy || []).map(async (post: any, idx: number) => {
        const matchedPromo = activePromoList.find(
            (p: any) => p.id === post.productId || (p.name && post.productName && p.name.toLowerCase() === post.productName.toLowerCase())
        );
        const matchedCatalog = (catalogoItems || []).find(
            (c: any) => c.id === post.productId || (c.name && post.productName && c.name.toLowerCase() === post.productName.toLowerCase())
        );

        const isPromoPost = Boolean(
            post.isPromotion ||
            matchedPromo ||
            (post.productId && promoIdsSet.has(post.productId)) ||
            matchedCatalog?.offerPrice ||
            post.productOfferPrice
        );

        const itemRef = matchedPromo || matchedCatalog;
        const resolvedBaseImg = post.baseImageUrl || itemRef?.imageUrl || null;
        const resolvedProdName = post.productName || itemRef?.name || null;
        const resolvedProdDesc = post.productDescription || itemRef?.description || null;
        const resolvedPrice = post.productPrice || itemRef?.price || null;
        const resolvedOfferPrice = post.productOfferPrice || itemRef?.offerPrice || null;

        // Analizar con nuestro Agente Director de Arte qué formato de texto (layout + fuente) queda mejor en esta imagen
        let artDecision: any = null;
        try {
            const canUseVision = Boolean(resolvedBaseImg && typeof resolvedBaseImg === 'string' && resolvedBaseImg.startsWith('http') && visionCache.size < 4);
            const cacheKey = `${resolvedBaseImg || 'no-img'}::${isPromoPost ? 'promo' : 'reg'}`;

            if (resolvedBaseImg && visionCache.has(cacheKey)) {
                artDecision = visionCache.get(cacheKey);
            } else {
                artDecision = await decideArtDirection({
                    imageUrl: canUseVision ? resolvedBaseImg : undefined,
                    productName: resolvedProdName || businessType || "Publicación",
                    price: resolvedOfferPrice || resolvedPrice || undefined,
                    postObjective: isPromoPost ? "promo" : "auto",
                    rubro: businessType || "General",
                    captionIdea: `${post.hook || ""} ${post.content || ""}`,
                    isPromotion: isPromoPost,
                    variationIndex: idx,
                });
                if (resolvedBaseImg && canUseVision) {
                    visionCache.set(cacheKey, artDecision);
                }
            }
        } catch (artErr) {
            console.warn("[STRATEGY] Warning en decideArtDirection por post:", artErr);
        }

        let resolvedImgMode: 'with_text' | 'without_text' = post.promoImageMode || (post.isCommercialPoster ? 'with_text' : 'without_text');

        if (isPromoPost && includePromotions !== false) {
            if (promoImageMode === 'with_text') {
                resolvedImgMode = 'with_text';
            } else if (promoImageMode === 'without_text') {
                resolvedImgMode = 'without_text';
            } else if (promoImageMode === 'agent_auto') {
                resolvedImgMode = artDecision ? (artDecision.recommendedWithText ? 'with_text' : 'without_text') : 'with_text';
            } else if (promoImageMode === 'mixed') {
                resolvedImgMode = promoToggleIdx % 2 === 0 ? 'with_text' : 'without_text';
                promoToggleIdx++;
            }
        } else if (promoImageMode === 'agent_auto' && artDecision) {
            resolvedImgMode = artDecision.recommendedWithText ? 'with_text' : 'without_text';
        } else if (isCommercialPoster) {
            resolvedImgMode = 'with_text';
        }

        return {
            ...post,
            productId: post.productId || itemRef?.id || null,
            productName: resolvedProdName,
            productDescription: resolvedProdDesc,
            productPrice: resolvedPrice,
            productOfferPrice: resolvedOfferPrice,
            baseImageUrl: resolvedBaseImg,
            hasProductImage: Boolean(resolvedBaseImg),
            isPromotion: isPromoPost,
            promoImageMode: resolvedImgMode,
            isCommercialPoster: resolvedImgMode === 'with_text',
            layoutPosition: post.layoutPosition || artDecision?.layoutPosition || 'top_banner',
            fontStyle: post.fontStyle || artDecision?.fontStyle || (isPromoPost ? 'bold_modern' : 'serif_script_mix'),
            textFormatLabel: post.textFormatLabel || artDecision?.formatLabel || 'Cabecera Superior · Bold Impacto',
            artDirectionReasoning:
                post.artDirectionReasoning ||
                artDecision?.reasoning ||
                'Nuestros agentes seleccionaron este formato para destacar el mensaje sin cubrir el sujeto principal.',
        };
    }));

    console.log(`[STRATEGY] LangGraph Strategy generated successfully for plan ${userPlan} (posts: ${effectivePosts}, maxVideos: ${maxVideos}, remPosts: ${remainingPosts}, remVideos: ${remainingVideos}, remImages: ${remainingImages}).`);
    return NextResponse.json({ 
        strategy: normalizedStrategy,
        analysis: result.analysis,
        quotaInfo: {
            plan: userPlan,
            postsLimit,
            postsUsed,
            remainingPosts,
            videosLimit,
            videosUsed,
            remainingVideos,
            imagesLimit,
            imagesUsed,
            remainingImages,
            effectivePosts,
            maxVideos
        }
    });
  } catch (error: any) {
    console.error("[STRATEGY] Error generating strategy with LangGraph:", error);
    return NextResponse.json({ error: error.message || "Failed to generate strategy" }, { status: 500 });
  }
}

