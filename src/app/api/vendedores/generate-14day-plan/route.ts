import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import { getFreeModel } from "../../../../lib/gemini-free";
import { sanitizeInput } from "../../../../lib/security";
import { Plan14DayItem, FeedAuditDiagnosis, ExtractedProductItem } from "../../../../types/demo-plan";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const N8N_IMAGE_WEBHOOK_URL = "https://n8n.santisoft.cl/webhook/img-rrss-auto";
const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";

/**
 * Renderiza la imagen publicitaria para un día del plan llamando a n8n con fallback a Pollinations
 */
async function renderPlanDayImage(
  item: Plan14DayItem,
  businessName: string,
  rubro: string
): Promise<string> {
  const isCommercial = item.post.hasText;
  const headline = item.post.headline || item.post.productName;
  const price = item.post.price || "";
  const directive = item.post.compositionDirective || `Hero commercial photo of ${item.post.productName}`;

  let englishPrompt = "";
  if (isCommercial) {
    englishPrompt = `Square 1:1 Instagram commercial advertising poster for "${businessName}" in Chile (${rubro}). ${directive}. Large bold typography overlay reading "${headline.toUpperCase()}", clear price badge "${price}", CTA button "PIDE POR WHATSAPP". Professional food and restobar graphic design, warm commercial studio lighting, 8k resolution.`;
  } else {
    englishPrompt = `Square 1:1 Instagram commercial food photography for "${businessName}" (${rubro}). ${directive}. 85mm lens f/1.4, clean editorial photo, mouth-watering textures, appetizing presentation on rustic table, warm ambient lighting, no text, no watermark, professional gastronomy advertising photography.`;
  }

  // 1. Intento con n8n
  try {
    const res = await fetch(N8N_IMAGE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: englishPrompt,
        promptEnglish: englishPrompt,
        businessType: rubro,
        rubro,
        dishOrProduct: item.post.productName,
        type: "rrss",
      }),
      signal: AbortSignal.timeout(22000),
    });

    if (res.ok) {
      const rawData = await res.json().catch(() => ({}));
      const data = Array.isArray(rawData) ? rawData[0] : rawData;
      const candidateUrl =
        data?.img_url ||
        data?.imageUrl ||
        data?.url ||
        data?.output ||
        data?.image ||
        (typeof rawData === "string" && rawData.startsWith("http") ? rawData : null);

      if (candidateUrl && typeof candidateUrl === "string" && candidateUrl.startsWith("http")) {
        return candidateUrl;
      }
    }
  } catch (err: any) {
    console.warn(`[renderPlanDayImage] Fallback para día ${item.day}:`, err?.message || err);
  }

  // 2. Fallback a Pollinations Flux de alta calidad
  const seed = Math.floor(Math.random() * 900000) + 100000;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPrompt)}?width=1080&height=1080&model=flux&nologo=true&enhance=true&seed=${seed}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessName = "",
      prospectName = "",
      rubro = "Gastronomía",
      phone = "",
      feedScreenshotUrl = "",
      feedAudit = null,
      products = [],
      sellerName = "Equipo Comercial",
      sellerPhone = "",
      sellerEmail = "",
    } = body;

    const safeBusiness = sanitizeInput(businessName.trim() || "tu negocio");
    const safeProspect = sanitizeInput(prospectName.trim() || safeBusiness);
    const safeRubro = sanitizeInput(rubro.trim() || "Gastronomía & Restobar");
    const safePhone = sanitizeInput(phone.trim());

    // Preparar resumen de productos disponibles para que los agentes los distribuyan en los 14 días
    const productCatalog = Array.isArray(products) && products.length > 0
      ? products.map((p: ExtractedProductItem) => `${p.name} (${p.estimatedPrice || "precio regular"}${p.isPromotion ? " - PROMO" : ""})`).join(", ")
      : `${safeBusiness} especialidad de la casa, tabla para compartir, sándwich de autor, cócteles 2x1, promo almuerzo`;

    // Preparar contexto del análisis de feed si está presente
    const auditSummary = feedAudit
      ? `Fugas detectadas en su feed actual: ${(feedAudit.detectedFlaws || []).join("; ")}. Fortalezas: ${(feedAudit.detectedStrengths || []).join("; ")}.`
      : "Diagnóstico inicial: falta de variedad entre fotos de apetito visual y carteles de conversión rápida hacia WhatsApp.";

    const systemInstruction = `Eres un Director de Estrategia Gastronómica y de Redes Sociales de nuestro equipo de agentes especializados.
Tu misión es diseñar una planificación quincenal estratégica (14 DÍAS) personalizada para "${safeBusiness}" (${safeRubro}).

REGLAS DE ORO DE HUMANIZACIÓN (AGENTS.md):
1. Tono 100% natural, directo ("tú a tú"), cercano y conversacional chileno/latinoamericano. Cero relleno corporativo.
2. CERO muletillas de IA (PROHIBIDO usar frases como "en el vertiginoso mundo", "en conclusión", "desbloquea el potencial", "sumérgete en", "un deleite para los sentidos", "no te pierdas").
3. NUNCA menciones "IA" ni "Inteligencia Artificial". Refiérete a "nuestros agentes" o "nuestro equipo de agentes especializados".
4. Alternancia estratégica de dirección de arte:
   - Alterna equilibradamente entre publicaciones con cartel publicitario (hasText: true, layouts: split_left, top_banner, bottom_third, recipe_ingredients) y fotografías limpias de apetito visual (hasText: false, layout: clean_photo).
   - Define tipografías intencionadas (bold_modern, elegant_serif, serif_script_mix, clean_minimal, script_handwritten).
5. Los 14 días corresponden a un ciclo de dos semanas:
   - Día 1: Lunes
   - Día 2: Martes
   - Día 3: Miércoles
   - Día 4: Jueves
   - Día 5: Viernes
   - Día 6: Sábado
   - Día 7: Domingo
   - Día 8: Lunes
   - Día 9: Martes
   - Día 10: Miércoles
   - Día 11: Jueves
   - Día 12: Viernes
   - Día 13: Sábado
   - Día 14: Domingo

FORMATO DE SALIDA OBLIGATORIO:
Debes responder ÚNICAMENTE un array JSON con los 14 objetos ordenados del día 1 al 14:
[
  {
    "day": 1,
    "weekday": "Lunes",
    "nicheTrend": string (tendencia de consumo detectada por el radar de nicho),
    "nicheInsight": string (justificación de comportamiento del consumidor ese día),
    "post": {
      "format": "Post" | "Reel" | "Carrusel",
      "headline": string (titular llamativo con la oferta o plato),
      "productName": string (producto específico de su carta),
      "price": string (ej: "$10.000 (4 unidades)", "$15.990 para 3"),
      "isPromo": boolean,
      "hasText": boolean,
      "artDirection": {
        "layout": "split_left" | "split_right" | "top_banner" | "bottom_third" | "recipe_ingredients" | "clean_photo",
        "layoutLabel": string (ej: "◧ Split Lateral Izquierdo", "⬆️ Cabecera Superior Bold", "📸 Fotografía Limpia"),
        "fontStyle": "bold_modern" | "elegant_serif" | "serif_script_mix" | "clean_minimal" | "script_handwritten",
        "fontLabel": string (ej: "🔥 Bold Impacto", "✨ Serif Elegante", "📰 Mix Editorial"),
        "reasoning": string (explicación breve de por qué nuestros agentes eligieron esa disposición)
      },
      "hook": string (gancho de primer segundo entre comillas),
      "copy": string (texto persuasivo y sensorial de 3 a 5 oraciones),
      "cta": string (llamado a la acción directo hacia WhatsApp o visita),
      "compositionDirective": string (directiva fotográfica en inglés para el generador de imágenes)
    },
    "story": {
      "time": string (ej: "13:00 hrs"),
      "objective": string,
      "hook": string,
      "interactiveType": "Encuesta" | "Deslizador" | "Caja de Preguntas" | "Cuenta Regresiva" | "Link WhatsApp" | "Votación 2x1",
      "interactiveLabel": string,
      "slideTexts": [string, string, string],
      "visualRecommendation": string
    }
  }
]`;

    const promptText = `Genera la planificación de 14 días para "${safeBusiness}" (${safeRubro}).
Productos base identificados: ${productCatalog}.
${auditSummary}
Responde únicamente el array JSON con los 14 días completos:`;

    let generatedDays: Plan14DayItem[] = [];

    try {
      const model = getFreeModel("gemini-3.7-flash", systemInstruction);
      const res = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      });

      const responseText = res.response.text();
      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          generatedDays = parsed;
        }
      }
    } catch (modelErr: any) {
      console.warn("[generate-14day-plan] Error generando plan con modelo:", modelErr?.message || modelErr);
    }

    // Si falló o vino incompleto, rellenar asegurando los 14 días
    if (!generatedDays || generatedDays.length < 14) {
      const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
      const baseDays: Plan14DayItem[] = [];

      for (let d = 1; d <= 14; d++) {
        const wIdx = (d - 1) % 7;
        const wName = weekdays[wIdx];
        const isPromoDay = [1, 3, 4, 7, 9, 11, 13, 14].includes(d);
        const hasTextDay = [1, 2, 3, 4, 6, 7, 9, 11, 13, 14].includes(d);

        baseDays.push({
          day: d,
          weekday: wName,
          nicheTrend: isPromoDay ? "Día de promociones de alto volumen y corte de rutina" : "Apetito visual y posicionamiento de plato insignia",
          nicheInsight: "En gastronomía y consumo local, alternar ofertas agresivas con autoridad de producto genera compras repetidas.",
          post: {
            format: "Post",
            headline: isPromoDay ? `Promo Especial ${wName} en ${safeBusiness}` : `Especialidad de la Casa · ${safeBusiness}`,
            productName: `Especialidad del Día ${d}`,
            price: isPromoDay ? "$10.000" : "$14.990",
            isPromo: isPromoDay,
            hasText: hasTextDay,
            artDirection: {
              layout: hasTextDay ? (d % 2 === 0 ? "top_banner" : "split_left") : "clean_photo",
              layoutLabel: hasTextDay ? (d % 2 === 0 ? "⬆️ Cabecera Superior Bold" : "◧ Split Lateral Izquierdo") : "📸 Fotografía Limpia",
              fontStyle: hasTextDay ? "bold_modern" : "clean_minimal",
              fontLabel: hasTextDay ? "🔥 Bold Impacto" : "✨ Sans Minimalista",
              reasoning: "Nuestros agentes calibraron el contraste para que el precio o producto destaque en el primer segundo de scroll.",
            },
            hook: isPromoDay ? `El ${wName.toLowerCase()} se pasa mejor en ${safeBusiness}.` : `Cuando el hambre aprieta, esto no falla nunca.`,
            copy: `Preparado fresco con ingredientes seleccionados y todo el sabor que buscas para cortar la semana. Pídelo para compartir o disfruta en nuestro salón.`,
            cta: `Escríbenos directo al WhatsApp para coordinar tu pedido o reservar mesa.`,
            compositionDirective: `Overhead commercial shot of gourmet ${safeRubro} specialty on dark wood table with warm restobar lighting`,
            isRendered: false,
          },
          story: {
            time: "13:00 hrs",
            objective: "Antojo temprano y activación de pedidos",
            hook: `¿${wName} de cocinar o de pasar por ${safeBusiness}?`,
            interactiveType: "Encuesta",
            interactiveLabel: "Encuesta: 'Pido ahora' vs 'Cocino en casa'",
            slideTexts: [
              `${wName} en ${safeBusiness}: la plancha ya está prendida.`,
              `Saliendo fresco directo a tu mesa o a tu puerta.`,
              `Toca abajo y te lo tenemos listo 👇`,
            ],
            visualRecommendation: "Primer plano vertical en video corto mostrando el vapor y los ingredientes frescos.",
          },
        });
      }
      generatedDays = baseDays;
    }

    // 2. Renderizar de inmediato las 4 imágenes ancla principales (Días 1, 3, 5 y 7) en paralelo
    const anchorDays = [1, 3, 5, 7];
    console.log(`[generate-14day-plan] Renderizando imágenes ancla para días ${anchorDays.join(", ")} de "${safeBusiness}"...`);

    const renderPromises = generatedDays.map(async (dayItem) => {
      if (anchorDays.includes(dayItem.day)) {
        try {
          const imgUrl = await renderPlanDayImage(dayItem, safeBusiness, safeRubro);
          return {
            ...dayItem,
            post: {
              ...dayItem.post,
              imageUrl: imgUrl,
              isRendered: true,
            },
          };
        } catch (err) {
          console.warn(`[generate-14day-plan] Error renderizando ancla día ${dayItem.day}:`, err);
          return {
            ...dayItem,
            post: {
              ...dayItem.post,
              isRendered: false,
            },
          };
        }
      }
      return {
        ...dayItem,
        post: {
          ...dayItem.post,
          isRendered: false,
        },
      };
    });

    const finalizedDays = await Promise.all(renderPromises);

    // 3. Guardar el documento en Firestore (`admin_prospect_demos`)
    const demoPayload = {
      prospectName: safeProspect,
      prospectBusiness: safeBusiness,
      prospectPhone: safePhone,
      rubro: safeRubro,
      feedScreenshotUrl: feedScreenshotUrl || "",
      feedAudit: feedAudit || null,
      plan14Days: finalizedDays,
      anchorRenderedDays: anchorDays,
      sellerName,
      sellerPhone,
      sellerEmail,
      createdAt: new Date().toISOString(),
      status: "generada",
      is14DayPlanDemo: true,
    };

    let savedId = "";
    if (adminDb) {
      const docRef = await adminDb.collection("admin_prospect_demos").add(demoPayload);
      savedId = docRef.id;
    } else {
      savedId = `demo_local_${Date.now()}`;
    }

    // 4. Construir copy de WhatsApp de prospección consultiva
    const publicLink = `${PUBLIC_APP_URL}/m/${savedId}`;
    const auditHighlight = feedAudit && Array.isArray(feedAudit.detectedFlaws) && feedAudit.detectedFlaws.length > 0
      ? `\n\n🔍 Detectamos 3 oportunidades clave en tu Instagram actual:\n• ${feedAudit.detectedFlaws[0]}\n• ${feedAudit.detectedFlaws[1] || feedAudit.detectedFlaws[0]}`
      : "";

    const whatsappMessage = `¡Hola ${safeProspect}! 👋 Estuvimos revisando el Instagram de ${safeBusiness} y nuestro equipo de agentes especializados preparó una auditoría exclusiva de su perfil y su planificación estratégica completa de 14 días:${auditHighlight}

🚀 Revisa aquí tu auditoría y el plan de 14 días listo con publicaciones e historias:
${publicLink}

Diseñamos la pauta con sus propios platos y promociones para que veas la calidad y el impacto que tendrían sus redes semana a semana sin quitarles tiempo.

¿Pudiste abrir el enlace para que me cuentes qué te pareció?`;

    return NextResponse.json({
      success: true,
      demoId: savedId,
      publicLink,
      whatsappMessage,
      plan14Days: finalizedDays,
      feedAudit,
    });
  } catch (error: any) {
    console.error("[generate-14day-plan API Exception]:", error);
    return NextResponse.json(
      { error: error?.message || "Error al generar la planificación de 14 días." },
      { status: 500 }
    );
  }
}
