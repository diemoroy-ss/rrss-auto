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
      businessData, 
      connectedPlatforms, 
      nicheContext, 
      postsPerWeek, 
      catalogoItems, 
      catalogUsage,
      selectedPromptStyles,
      usePromptStyles,
      isCommercialPoster
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
            .map((item: any) => `- ${item.type === "producto" ? "Producto" : "Servicio"}: "${item.name}"${item.description ? ` — ${item.description}` : ""}${item.price ? ` (${item.price})` : ""}`)
            .join("\n");
        
        if (catalogUsage === "all") {
            catalogContext = `\n\nCATÁLOGO DE PRODUCTOS/SERVICIOS (¡IMPORTANTE! BASA TODA LA ESTRATEGIA EXCLUSIVAMENTE EN ESTOS ÍTEMS, DEDICA CADA POST A UNO O VARIOS DE ELLOS):\n${catalogList}`;
        } else {
            catalogContext = `\n\nCATÁLOGO DE PRODUCTOS/SERVICIOS DE ESTA MARCA (incluye publicaciones específicas sobre estos ítems en la estrategia, mezclándolos con contenido general de valor):\n${catalogList}`;
        }
    }

    const enrichedNicheContext = (nicheContext || "") + catalogContext;

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
    // Si la cuota de imágenes es reducida y no hay fotos reales de catálogo, ajustar posts para no exceder cuota
    const catalogHasRealPhotos = (catalogoItems || []).some((item: any) => 
        Boolean((item.hasImage || item.imageUrl) && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('http'))
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
        catalogoItems || [],
        catalogUsage || "mixed",
        remainingPosts,
        remainingVideos,
        remainingImages,
        Boolean(isCommercialPoster)
    );

    console.log(`[STRATEGY] LangGraph Strategy generated successfully for plan ${userPlan} (posts: ${effectivePosts}, maxVideos: ${maxVideos}, remPosts: ${remainingPosts}, remVideos: ${remainingVideos}, remImages: ${remainingImages}).`);
    return NextResponse.json({ 
        strategy: result.strategy,
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

