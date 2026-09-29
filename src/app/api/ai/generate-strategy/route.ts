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
      usePromptStyles
    } = await req.json();

    if (!goal) {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    // Convert connectedPlatforms object to array of names
    const platforms: string[] = [];
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
    // Si el usuario no seleccionó estilos manualmente en el generador, pero su perfil tiene un ADN de Identidad Visual configurado
    if (userId) {
        try {
            const userDoc = await adminDb.collection("users").doc(userId).get();
            const uData = userDoc.data() || {};
            userPlan = (uData.plan || "free").toLowerCase();

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

    // Calcular límites de publicaciones y videos según el plan
    let effectivePosts = postsPerWeek || 5;
    let maxVideos = 2;

    if (userPlan === 'free') {
        effectivePosts = 3; // 3 posts totales del período de prueba
        maxVideos = 0;      // 0 videos
    } else if (userPlan === 'starter') {
        effectivePosts = Math.min(postsPerWeek || 3, 3); // 3 posts por semana (~12/mes)
        maxVideos = 1;      // Máx 1 video por semana (~3/mes)
    } else if (userPlan === 'pro') {
        effectivePosts = Math.min(postsPerWeek || 5, 5); // 5 posts por semana (~20/mes)
        maxVideos = 2;      // Máx 2 videos por semana (~8/mes)
    } else if (userPlan === 'business') {
        effectivePosts = Math.min(postsPerWeek || 15, 15); // ~15 posts por semana (~60/mes)
        maxVideos = 4;      // Máx 4 videos por semana (~16/mes)
    } else if (userPlan === 'agency') {
        effectivePosts = Math.min(postsPerWeek || 50, 50); // ~50 posts por semana (~200/mes)
        maxVideos = 10;     // Máx 10 videos por semana (~40/mes)
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
        catalogUsage || "mixed"
    );

    console.log(`[STRATEGY] LangGraph Strategy generated successfully for plan ${userPlan} (posts: ${effectivePosts}, maxVideos: ${maxVideos}).`);
    return NextResponse.json({ 
        strategy: result.strategy,
        analysis: result.analysis 
    });
  } catch (error: any) {
    console.error("[STRATEGY] Error generating strategy with LangGraph:", error);
    return NextResponse.json({ error: error.message || "Failed to generate strategy" }, { status: 500 });
  }
}

