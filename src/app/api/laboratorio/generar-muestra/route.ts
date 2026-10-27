import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { generateFreeText } from "../../../../lib/gemini-free";
import { HARDCODED_STYLES } from "../../../../lib/prompt-templates";
import { DEFAULT_TEXT_TEMPLATES } from "../../../../lib/text-templates";

export const dynamic = "force-dynamic";
export const maxDuration = 180; // Hasta 3 minutos para orquestar los agentes y el modelo de imagen real

interface GenerateMuestraPayload {
  postsCount: number; // 1 a 5
  allowedTypes: ("post" | "carrusel" | "reel")[];
  businessName: string;
  rubro?: string;
  phone?: string;
  website?: string;
  catalogItems?: any[];
  catalogUsage?: "mixed" | "all";
  selectedStyles?: any[];
  visualStyleSource?: "preset_styles" | "commercial_image";
  commercialIdea?: string;
  commercialIncludeText?: boolean;
  commercialCustomText?: string;
  badgeCustomText?: string;
  productPrice?: string;
  isCommercialPoster?: boolean;
  imageTextOption?: "con_texto" | "sin_texto" | "mixto";
  agentTone?: string;
  customAgentInstruction?: string;
  nicheContext?: string;
  userId?: string;
  profileId?: string;
  prospectName?: string;
  offerText?: string;
  dishOrProductName?: string;
  sellerName?: string;
  sellerEmail?: string;
  logoUrl?: string;
  baseImageUrl?: string;
}

/**
 * Resuelve la definición completa de un estilo visual buscando en HARDCODED_STYLES
 * para contar siempre con su fórmula maestra (`prompt`), `styleKeywords` e `imageGenBehavior`.
 */
function enrichSelectedStyle(rawStyle: any) {
  if (!rawStyle) return null;
  const matched = HARDCODED_STYLES.find(
    (h) =>
      (rawStyle.id && h.id === rawStyle.id) ||
      (rawStyle.title && h.title.toLowerCase() === String(rawStyle.title).toLowerCase())
  );
  if (!matched) return rawStyle;
  return {
    ...matched,
    ...rawStyle,
    prompt: rawStyle.prompt || matched.prompt,
    styleKeywords: rawStyle.styleKeywords || matched.styleKeywords,
    description: rawStyle.description || matched.description,
    previewUrl: rawStyle.previewUrl || matched.previewUrl,
    imageGenBehavior: rawStyle.imageGenBehavior || matched.imageGenBehavior || "product",
  };
}

/**
 * Construye el prompt en inglés inyectando el producto dentro de la fórmula maestra del estilo visual.
 * Si `commercialOverlay.enabled` es true, integra el bloque `TYPOGRAPHY & LAYOUT (Exact Spanish text)`
 * idéntico a `/api/ai/generate-preview` para que nuestro modelo en n8n genere el afiche comercial completo.
 */
function buildStyledImagePrompt(
  styleObj: any,
  productSubject: string,
  extraSceneDetail: string,
  commercialOverlay?: {
    enabled: boolean;
    headline?: string;
    badgeText?: string;
    priceText?: string;
    ctaText?: string;
    businessName?: string;
    rubro?: string;
  }
): string {
  const cleanSubject = productSubject.trim() || "featured commercial product";
  let masterFormula = "";
  let styleHeader = "";

  if (!styleObj) {
    masterFormula = extraSceneDetail || `Professional commercial studio photography of ${cleanSubject}`;
  } else {
    masterFormula = String(styleObj.prompt || "");
    if (masterFormula.includes("[")) {
      masterFormula = masterFormula.replace(/\[[^\]]+\]/g, cleanSubject);
    } else if (masterFormula) {
      masterFormula = `${masterFormula}, featuring ${cleanSubject}`;
    } else {
      masterFormula = `Commercial photography of ${cleanSubject} in "${styleObj.title}" style (${styleObj.description || ""})`;
    }
    const keywords = styleObj.styleKeywords ? `Style keywords: ${styleObj.styleKeywords}.` : "";
    const detail = extraSceneDetail ? `Scene details: ${extraSceneDetail}.` : "";
    styleHeader = `MANDATORY VISUAL STYLE "${styleObj.title}": ${masterFormula}. ${keywords} ${detail}`.trim();
  }

  const baseScene = styleHeader || masterFormula;

  if (commercialOverlay?.enabled) {
    const headline = (commercialOverlay.headline || cleanSubject).trim().toUpperCase();
    const badge = (commercialOverlay.badgeText || commercialOverlay.businessName || "").trim();
    const price = (commercialOverlay.priceText || "").trim();
    const cta = (commercialOverlay.ctaText || `¡Cotiza hoy! · ${commercialOverlay.businessName || ""}`).replace(/·\s*$/, "").trim();

    const typoLines: string[] = [
      `POSTER & ADVERTISING LAYOUT SPECIFICATIONS:`,
      `- TYPOGRAPHY & LAYOUT (Exact Spanish text):`,
      `- CLEAN ADVERTISING COMPOSITION: All typography, headlines, badges, prices and CTA buttons MUST stay centered with generous breathing space away from the edges. Clean high-end social media commercial finish.`,
      `- MANDATORY NEGATIVE INSTRUCTION: ABSOLUTELY DO NOT RENDER ANY MEASUREMENT ARROWS, LABELS, NUMBERS, PERCENTAGES, RED OR ORANGE GUIDELINES, DRAFTING MARKS, WIREFRAME BOXES, TECHNICAL RULERS, OR BOUNDING BOXES ON THE IMAGE. RENDER ONLY THE PRISTINE COMMERCIAL GRAPHIC ARTWORK AND TEXT.`,
    ];

    if (badge) {
      typoLines.push(
        `- UPPER CENTER (Pill badge floating centered with generous breathing room from top edge): "${badge}".`
      );
    }
    if (headline) {
      typoLines.push(
        `- MID-UPPER CENTER (Centered compact headline broken into 2 to 4 short lines, well-centered with ample empty breathing space on left and right sides): "${headline}".`
      );
    }
    if (price && price !== headline) {
      typoLines.push(
        `- HIGHLIGHT BADGE (Centered floating badge with high contrast background): "${price}".`
      );
    }
    if (cta) {
      typoLines.push(
        `- LOWER CENTER (Centered pill badge positioned cleanly above the lower edge with ample side margins): "${cta}".`
      );
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

    return `commercial advertising flyer poster design, professional graphic design layout, high-quality promotional banner, square 1:1 format.\n\nMAIN VISUAL CONCEPT:\n${baseScene}\nIndustry/Business type: ${commercialOverlay.rubro || "Comercio"}.\n\n${typoLines.join("\n")}`;
  }

  return `${baseScene} Centered/balanced hero subject with clean negative space at top and bottom margins, 8k resolution, ultra-detailed commercial photography, STRICT NEGATIVE: no text, no typography, no letters, no words, no numbers, no price tags, no watermarks`.trim();
}

/**
 * Selecciona N plantillas de texto distintas al azar de DEFAULT_TEXT_TEMPLATES,
 * procurando variedad de disposiciones (superior, split lateral, editorial, inferior).
 */
function pickDistinctRandomTextTemplates(count: number) {
  const shuffled = [...DEFAULT_TEXT_TEMPLATES].sort(() => Math.random() - 0.5);
  const picked: typeof DEFAULT_TEXT_TEMPLATES = [];
  for (const tpl of shuffled) {
    if (picked.length < count) {
      picked.push(tpl);
    }
  }
  while (picked.length < count && DEFAULT_TEXT_TEMPLATES.length > 0) {
    picked.push(DEFAULT_TEXT_TEMPLATES[picked.length % DEFAULT_TEXT_TEMPLATES.length]);
  }
  return picked;
}

/**
 * Genera una imagen con nuestro modelo principal en n8n (`https://n8n.santisoft.cl/webhook/img-rrss-auto`),
 * utilizando el mismo contrato que `/api/ai/generate-preview` (Nuevo Post).
 */
async function generateSingleImage(
  promptEnglish: string,
  rubro: string,
  productName: string,
  aspectRatio: "1:1" | "9:16" = "1:1",
  timeoutMs = 75000,
  baseImageUrl?: string,
  extraOptions?: {
    styleReferenceUrl?: string;
    idea?: string;
    copyText?: string;
    posterConfig?: any;
  }
): Promise<string> {
  const width = aspectRatio === "9:16" ? 720 : 1080;
  const height = aspectRatio === "9:16" ? 1280 : 1080;
  const seed = Math.floor(Math.random() * 1000000);

  const hasValidBaseImage = Boolean(
    baseImageUrl && typeof baseImageUrl === "string" && baseImageUrl.startsWith("http")
  );

  const n8nWebhookUrl =
    process.env.NEXT_PUBLIC_N8N_PREVIEW_URL || "https://n8n.santisoft.cl/webhook/img-rrss-auto";

  // 1. Llamar a nuestro pipeline real en n8n (con hasta 2 intentos antes de cualquier respaldo)
  if (timeoutMs > 0) {
    const effectiveTimeout = Math.max(timeoutMs, 65000);
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const n8nPayload = {
          prompt: promptEnglish,
          promptEnglish,
          baseImageUrl: hasValidBaseImage ? baseImageUrl : "",
          styleReferenceUrl: extraOptions?.styleReferenceUrl || "",
          idea: extraOptions?.idea || productName,
          imageExpectation: productName,
          userProvidedCopy: extraOptions?.copyText || "",
          businessType: rubro,
          rubro,
          dishOrProduct: productName,
          type: aspectRatio === "9:16" ? "Historia" : "Post",
          carouselCount: 1,
          allowImageRetouch: true,
          posterConfig: extraOptions?.posterConfig || null,
        };

        const n8nRes = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(n8nPayload),
          signal: AbortSignal.timeout(effectiveTimeout),
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
        } else {
          const errText = await n8nRes.text().catch(() => "");
          console.warn(`[Lab Generar Muestra] n8n intento ${attempt} status ${n8nRes.status}:`, errText.slice(0, 200));
        }
      } catch (err: any) {
        console.warn(`[Lab Generar Muestra] n8n intento ${attempt} excepción:`, err?.message || err);
      }
    }
  }

  // 2. Respaldo de emergencia si el servidor n8n no responde tras 2 intentos
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
        console.warn("[Lab Generar Muestra] Token no verificado o expirado, continuando:", authErr);
      }
    }

    const body = (await req.json()) as GenerateMuestraPayload;
    const {
      postsCount = 3,
      allowedTypes = ["post", "carrusel", "reel"],
      businessName = "Mi Negocio",
      rubro = "Comercio Local",
      phone = "",
      website = "",
      catalogItems = [],
      selectedStyles = [],
      visualStyleSource = "preset_styles",
      commercialIdea = "",
      commercialIncludeText = true,
      commercialCustomText = "",
      badgeCustomText = "",
      productPrice = "",
      isCommercialPoster = false,
      imageTextOption = body.isCommercialPoster ? "con_texto" : "mixto",
      agentTone = "directo_cercano",
      customAgentInstruction = "",
      nicheContext = "",
      userId = uid,
    } = body;

    const isCommercialImageEngine = visualStyleSource === "commercial_image";

    // Enriquecer los estilos seleccionados con HARDCODED_STYLES para tener siempre su fórmula `.prompt`
    const enrichedStyles = (Array.isArray(selectedStyles) && selectedStyles.length > 0
      ? selectedStyles.map(enrichSelectedStyle).filter(Boolean)
      : HARDCODED_STYLES.slice(0, 3)
    );

    // Normalizar modo visual: "con_texto", "sin_texto" o "mixto"
    const finalImageTextMode: "con_texto" | "sin_texto" | "mixto" = isCommercialImageEngine
      ? (commercialIncludeText === false ? "sin_texto" : "con_texto")
      : imageTextOption === "con_texto" || imageTextOption === "sin_texto" || imageTextOption === "mixto"
      ? imageTextOption
      : isCommercialPoster
      ? "con_texto"
      : "mixto";

    // Validar cantidad: mínimo 1 y máximo 3
    const clampedCount = Math.max(1, Math.min(3, Number(postsCount) || 3));

    // Validar tipos de publicaciones de muestra: solo "post" y "carrusel"
    const validAllowedTypes = (Array.isArray(allowedTypes) && allowedTypes.length > 0)
      ? allowedTypes.filter((t) => ["post", "carrusel"].includes(t))
      : ["post", "carrusel"];
    const finalAllowedTypes = validAllowedTypes.length > 0 ? validAllowedTypes : ["post", "carrusel"];

    console.log(`[Lab Generar Muestra] Solicitando ${clampedCount} publicaciones de muestra y plan de 5 posts de nicho para ${businessName} (${rubro}). Motor: ${visualStyleSource}. Modo imagen: ${finalImageTextMode}. Estilos:`, enrichedStyles.map((s: any) => s.title));

    // Preparar contexto del catálogo
    const catalogFormatted = catalogItems.length > 0
      ? catalogItems.map((item, idx) => {
          const hasPic = Boolean(item.imageUrl && typeof item.imageUrl === "string" && item.imageUrl.startsWith("http"));
          return `Ítem #${idx + 1}: ID: "${item.id || idx}" | Nombre: "${item.name}" | Precio: "${item.offerPrice || item.price || 'Consultar'}" | Descripción: "${item.description || ''}" | Foto real: ${hasPic ? item.imageUrl : 'No tiene'}`;
        }).join("\n")
      : "No se proporcionó catálogo explícito.";

    // Preparar estilos visuales seleccionados (hasta 3) con su fórmula maestra
    const stylesContext = isCommercialImageEngine
      ? `Motor de Imagen Comercial Activo (Fondo comercial limpio + Capas vectoriales de nuestro editor). Idea visual solicitada: "${commercialIdea || body.offerText || body.dishOrProductName || `Destacar lo mejor de ${businessName} en ${rubro}`}". ${commercialCustomText ? `Texto comercial solicitado en capas: "${commercialCustomText}".` : ""}`
      : enrichedStyles.slice(0, 3).map((s: any, i: number) =>
          `- Muestra #${i + 1} -> Estilo OBLIGATORIO: "${s.title}" | Descripción: ${s.description} | Fórmula Fotográfica en Inglés: "${s.prompt}" | Keywords: ${s.styleKeywords || s.description}`
        ).join("\n");

    // Imagen de referencia subida por el vendedor (o del primer producto del catálogo)
    const referenceImgUrl =
      (body.baseImageUrl && typeof body.baseImageUrl === "string" && body.baseImageUrl.startsWith("http"))
        ? body.baseImageUrl
        : (catalogItems[0]?.imageUrl && typeof catalogItems[0]?.imageUrl === "string" && catalogItems[0].imageUrl.startsWith("http"))
        ? catalogItems[0].imageUrl
        : undefined;

    // Tono de voz de los agentes
    const toneMap: Record<string, string> = {
      directo_cercano: "Cercano, conversacional ('tú a tú'), amigable y empático.",
      urgencia_oferta: "Enfocado en ofertas irresistibles, escasez controlada y llamados a la acción inmediatos.",
      gourmet_elegante: "Sensorial, descriptivo, evocativo y de alta gama.",
      educativo_valor: "Autoridad práctica, consejos útiles, resolviendo problemas frecuentes del cliente.",
    };
    const toneInstruction = toneMap[agentTone] || toneMap.directo_cercano;

    // Prompt de estructuración para nuestros agentes con Gemini
    const systemPrompt = `Eres el Director Creativo y Estratega Senior de nuestro equipo de agentes especializados.
Tu misión es estructurar:
1. Una PLANIFICACIÓN SEMANAL ESTRATÉGICA acotada a EXACTAMENTE 5 PUBLICACIONES en 'strategy.schedulePlan' basadas en el Radar de Nicho para "${businessName}" en el rubro "${rubro}".
2. EXACTAMENTE ${clampedCount} publicaciones de muestra completas ('publications') diseñadas estrictamente según los estilos visuales seleccionados.

REGLAS ABSOLUTAS:
1. FORMATOS PERMITIDOS:
   - Para las MUESTRAS DISEÑADAS ('publications'): Solo puedes asignar formatos de esta lista: ${JSON.stringify(finalAllowedTypes)} (máximo 3 muestras, post o carrusel según configuración).
   - Para la PLANIFICACIÓN SEMANAL ('strategy.schedulePlan'): DEBE SER UN MIX ESTRATÉGICO Y VARIADO de 5 publicaciones que demuestre todo el potencial de las redes sociales para ${businessName}. Distribuye obligatoriamente:
     * 2 publicaciones de formato "post" (feed 1:1, cartel o foto de producto).
     * 1 publicación de formato "carrusel" (educativo, comparativa o secuencia deslizable).
     * 1 publicación de formato "reel" (video corto vertical 9:16 para viralidad y alcance).
     * 1 publicación de formato "historia" (stori interactiva con stickers, encuesta o llamado a DM).
     (Valores válidos para 'format' en schedulePlan: "post", "carrusel", "reel", "historia").

2. HUMANIZACIÓN Y TONO:
   - Tono: ${toneInstruction}
   - Habla de "tú a tú", ritmo dinámico y fluido.
   - CERO frases robóticas ("en el vertiginoso mundo", "descubre", "sumérgete", "en conclusión").
   - NUNCA menciones "IA" o "Inteligencia Artificial". Refiérete siempre a "nuestros agentes" o "nuestro equipo de agentes especializados".

3. ASIGNACIÓN ESTRICTA DE ESTILOS VISUALES Y USO DE IMAGEN BASE EN LAS MUESTRAS:
   - Para la publicación 1 ('pub_1'): Asigna OBLIGATORIAMENTE el Estilo #1: "${enrichedStyles[0]?.title || 'Estilo Comercial'}".
   - Para la publicación 2 ('pub_2'): Asigna OBLIGATORIAMENTE el Estilo #2: "${enrichedStyles[1]?.title || enrichedStyles[0]?.title || 'Estilo Comercial'}".
   - Para la publicación 3 ('pub_3'): Asigna OBLIGATORIAMENTE el Estilo #3: "${enrichedStyles[2]?.title || enrichedStyles[0]?.title || 'Estilo Comercial'}".
   - ${referenceImgUrl ? "SE ADJUNTÓ UNA FOTO REAL DEL PRODUCTO COMO IMAGEN BASE: Analiza visualmente el producto exacto de la foto adjunta (sus ingredientes, forma, colores, pan, queso, envase o textura) y descríbelo con precisión en inglés dentro de 'imagePromptEnglish', TRANSFORMÁNDOLO completamente al estilo visual asignado de cada muestra (ej. si el estilo es 'Explosión Controlada', los ingredientes de esa hamburguesa o producto flotan en el aire con iluminación dramática; si es 'Magazine Cover', aparece con estética editorial de revista de alta gama)." : "Si no hay foto adjunta, toma el producto o servicio indicado ('" + (body.dishOrProductName || businessName) + "') como sujeto protagonista para transformarlo en cada uno de los estilos seleccionados."}
   - IMPORTANTE SOBRE TEXTO EN LA IMAGEN: En 'imagePromptEnglish' y 'carouselPrompts', NUNCA pidas que el generador de imágenes dibuje letras ni tipografías dentro de la foto. Describe únicamente la fotografía escénica en el estilo visual seleccionado con espacio limpio arriba y abajo ('STRICT NEGATIVE: no text, no typography, no letters, no watermarks'), ya que nuestro motor de plantillas vectoriales estampará los textos comerciales limpios encima.

4. MODO DE CARTEL COMERCIAL (${finalImageTextMode.toUpperCase()}):
   ${
     finalImageTextMode === "con_texto"
       ? "Marca 'isCommercialPoster': true en todas las muestras para que nuestro motor de plantillas vectoriales estampe el titular, precio y llamado a la acción."
       : finalImageTextMode === "sin_texto"
       ? "Marca 'isCommercialPoster': false en todas las muestras para entregar fotografía pura sin textos."
       : "Modo MIXTO: alterna 'isCommercialPoster': true y false entre las muestras."
   }

5. CONTACTO Y LLAMADO A LA ACCIÓN:
   ${phone ? `- WhatsApp de contacto: ${phone}` : ""}
   ${website ? `- Sitio Web: ${website}` : ""}
   Incluye siempre un llamado a la acción (CTA) concreto en cada copy.

6. RESPUESTA ESTRICTA EN JSON:
Devuelve ÚNICAMENTE un objeto JSON válido con las claves "strategy" y "publications".
{
  "strategy": {
    "objective": "Objetivo comercial y estratégico claro para impulsar ventas y presencia de la marca",
    "targetAudience": "Perfil del cliente ideal en su localidad y lo que busca al comprar",
    "toneAndVoice": "Descripción del tono comunicacional 'tú a tú' y estilo persuasivo",
    "pillars": [
      {
        "name": "Nombre del pilar (ej. Ofertas & Combos)",
        "description": "Qué se comunica y por qué engancha a la audiencia",
        "percentage": 40,
        "icon": "🎯"
      },
      {
        "name": "Nombre del segundo pilar (ej. Calidad & Experiencia)",
        "description": "Detalles del producto o servicio que transmiten confianza",
        "percentage": 35,
        "icon": "⭐"
      },
      {
        "name": "Nombre del tercer pilar (ej. Comunidad & Recomendaciones)",
        "description": "Conexión con clientes y prueba social",
        "percentage": 25,
        "icon": "👥"
      }
    ],
    "schedulePlan": [
      {
        "day": "Día sugerido (ej. Martes)",
        "time": "Horario óptimo (ej. 20:00 hrs)",
        "format": "post" | "carrusel" | "reel" | "historia",
        "objective": "Objetivo comercial de esta publicación",
        "hook": "Gancho magnético usado para capturar la atención"
      }
    ],
    "nicheOpportunities": [
      "Oportunidad o dato clave del nicho detectado por nuestros agentes",
      "Segundo dato o recomendación práctica para superar a la competencia local",
      "Tercera recomendación de conversión directa"
    ]
  },
  "publications": [
    {
      "id": "pub_1",
      "type": "post" | "carrusel",
      "title": "Título corto y atractivo",
      "dishOrProductName": "Nombre del plato o servicio asignado",
      "productPrice": "Precio asignado si aplica o null",
      "hook": "Gancho magnético para detener el scroll",
      "copy": "Texto completo y humanizado listo para publicar en redes",
      "cta": "Llamado a la acción con canal de contacto",
      "visualStyleTitle": "Nombre exacto del estilo visual aplicado",
      "isCommercialPoster": true,
      "imagePromptEnglish": "Prompt fotográfico en inglés (60 a 90 palabras) fusionando la fórmula del estilo visual asignado con la descripción física del producto, SIN texto incrustado",
      "carouselPrompts": ["Prompt slide 1 en inglés en el estilo asignado", "Prompt slide 2 macro detalle en inglés en el estilo asignado", "Prompt slide 3 presentación completa en inglés en el estilo asignado"]
    }
  ]
}`;

    const userPromptContent = `Genera la estrategia y planificación de EXACTAMENTE ${clampedCount} publicaciones para:
- Marca: ${businessName}
- Rubro: ${rubro}
- Producto / Servicio principal: ${body.dishOrProductName || businessName}
${productPrice ? `- Precio destacado: ${productPrice}` : ""}
${commercialCustomText || body.offerText ? `- Texto de oferta / detalle: ${commercialCustomText || body.offerText}` : ""}
- Formatos a utilizar en muestras: ${finalAllowedTypes.join(", ")}
${customAgentInstruction ? `- Directriz personalizada del cliente: ${customAgentInstruction}` : ""}
${nicheContext ? `- Contexto del Radar de Nicho: ${nicheContext.substring(0, 400)}` : ""}

Catálogo disponible:
${catalogFormatted}

Estilos visuales obligatorios por muestra:
${stylesContext}`;

    let generatedPlanText = "";
    try {
      // Pasamos referenceImgUrl para que Gemini analice la foto base en la misma llamada (0ms extra)
      generatedPlanText = await generateFreeText(userPromptContent, systemPrompt, true, referenceImgUrl, "generate_post");
    } catch (llmErr: any) {
      console.warn("[Lab Generar Muestra] Reintentando estructuración en modo estándar:", llmErr);
      try {
        generatedPlanText = await generateFreeText(userPromptContent, systemPrompt, false, undefined, "generate_post");
      } catch (retryErr: any) {
        console.error("[Lab Generar Muestra] Error definitivo al estructurar posts:", retryErr);
        throw new Error("Nuestros agentes están procesando una alta demanda en este momento. Por favor intenta nuevamente en unos segundos.");
      }
    }

    // Parsear JSON devuelto
    let parsedPublications: any[] = [];
    let parsedStrategy: any = null;
    try {
      const cleanedJson = generatedPlanText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanedJson);
      parsedPublications = Array.isArray(parsed.publications) ? parsed.publications : [];
      parsedStrategy = parsed.strategy || null;
    } catch (parseErr) {
      console.warn("[Lab Generar Muestra] Fallo parseo JSON directo, buscando arreglo:", parseErr);
      const match = generatedPlanText.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          parsedPublications = JSON.parse(match[0]);
        } catch {}
      }
    }

    if (!Array.isArray(parsedPublications)) {
      parsedPublications = [];
    }

    // Si faltan publicaciones para completar clampedCount, sintetizar las restantes usando el estilo correspondiente
    while (parsedPublications.length < clampedCount) {
      const nextIdx = parsedPublications.length;
      const assignedType = finalAllowedTypes[nextIdx % finalAllowedTypes.length];
      const catalogItem = catalogItems[nextIdx % Math.max(1, catalogItems.length)] || null;
      const prodName = body.dishOrProductName || catalogItem?.name || `${businessName} Especial`;
      const prodPrice = productPrice || catalogItem?.offerPrice || catalogItem?.price || null;
      const fallbackStyle = enrichedStyles[nextIdx % enrichedStyles.length] || HARDCODED_STYLES[nextIdx % HARDCODED_STYLES.length];

      parsedPublications.push({
        id: `pub_${nextIdx + 1}`,
        type: assignedType,
        title: `${prodName}`,
        dishOrProductName: prodName,
        productPrice: prodPrice,
        hook: `¿Buscabas la mejor opción de ${rubro.toLowerCase()} para disfrutar hoy?`,
        copy: `Te presentamos ${prodName} de ${businessName}. Preparado con los mejores ingredientes y el sello único que nos distingue. Haz tu pedido hoy mismo y compruébalo.`,
        cta: phone ? `Escríbenos directamente al WhatsApp ${phone}` : "Contáctanos y haz tu pedido hoy",
        visualStyleTitle: fallbackStyle?.title || "Estilo Publicitario",
        imagePromptEnglish: buildStyledImagePrompt(fallbackStyle, prodName, ""),
      });
    }

    // Asegurar que no exceda clampedCount y que cada muestra tenga asignado su estilo correspondiente
    parsedPublications = parsedPublications.slice(0, clampedCount).map((pub, idx) => {
      const assignedType = finalAllowedTypes.includes(pub.type) ? pub.type : finalAllowedTypes[idx % finalAllowedTypes.length];
      const matchedStyle = enrichedStyles[idx % enrichedStyles.length] || null;

      return {
        ...pub,
        id: pub.id || `pub_${idx + 1}`,
        type: assignedType,
        visualStyleId: matchedStyle?.id || "",
        visualStyleTitle: matchedStyle?.title || pub.visualStyleTitle || "Estilo Publicitario",
        visualStylePrompt: matchedStyle?.prompt || "",
        visualStyleKeywords: matchedStyle?.styleKeywords || "",
      };
    });

    // Asegurar estrategia estructurada válida con EXACTAMENTE 5 publicaciones variadas en el Radar de Nicho
    const planDefaultDays = ["Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const planDefaultTimes = ["13:00 hrs", "19:30 hrs", "20:00 hrs", "21:00 hrs", "12:30 hrs"];
    const planDefaultFormats: ("post" | "carrusel" | "reel" | "historia")[] = [
      "post",
      "carrusel",
      "reel",
      "historia",
      "post",
    ];
    const planDefaultObjectives = [
      `Lanzamiento de oferta irresistible y antojable de la semana en ${rubro.toLowerCase()}.`,
      `Carrusel educativo y demostrativo de calidad frente a competidores locales.`,
      `Reel vertical dinámico (9:16) mostrando la preparación y detrás de cámaras para máximo alcance orgánico.`,
      `Historia interactiva con sticker de encuesta y botón directo a pedidos por WhatsApp.`,
      `Activación de fin de semana con cartel de promoción para cerrar ventas.`
    ];

    if (!parsedStrategy || typeof parsedStrategy !== "object") {
      parsedStrategy = {
        objective: `Aumentar la visibilidad de ${businessName} y activar ventas recurrentes con publicaciones de alto impacto visual y llamados a la acción claros.`,
        targetAudience: `Clientes de la zona interesados en ${rubro.toLowerCase()} que buscan calidad, rapidez y excelente relación precio-calidad.`,
        toneAndVoice: "Cercano, conversacional ('tú a tú'), directo y centrado en los beneficios del cliente.",
        pillars: [
          {
            name: "Ofertas & Antojos de Alta Demanda",
            description: "Promociones y combos destacados para detonar pedidos inmediatos.",
            percentage: 45,
            icon: "🔥"
          },
          {
            name: "Calidad de Producto & Experiencia",
            description: "Muestra de ingredientes frescos, preparación y lo que hace única a la marca.",
            percentage: 35,
            icon: "✨"
          },
          {
            name: "Comunidad & Conexión Local",
            description: "Testimonios, interacción y beneficios especiales para clientes habituales.",
            percentage: 20,
            icon: "🤝"
          }
        ],
        schedulePlan: [],
        nicheOpportunities: [
          `Los usuarios de ${rubro.toLowerCase()} responden un 50% más rápido cuando la publicación muestra precio y canal directo de WhatsApp.`,
          "Combinar Reels dinámicos, Carruseles e Historias interactivas multiplica por 3x el alcance orgánico semanal.",
          "Publicar en horarios cercanos a la toma de decisión incrementa las consultas directas."
        ]
      };
    }

    // Normalizar y forzar variedad real (post, carrusel, reel, historia) en las 5 publicaciones del Radar de Nicho
    let completeSchedulePlan: any[] = Array.isArray(parsedStrategy.schedulePlan) ? parsedStrategy.schedulePlan : [];
    completeSchedulePlan = completeSchedulePlan.map((item: any, idx: number) => {
      const rawFmt = String(item.format || "").toLowerCase();
      const validFmt = ["post", "carrusel", "reel", "historia"].includes(rawFmt)
        ? rawFmt
        : planDefaultFormats[idx % planDefaultFormats.length];
      return {
        ...item,
        day: item.day || planDefaultDays[idx % planDefaultDays.length],
        time: item.time || planDefaultTimes[idx % planDefaultTimes.length],
        format: validFmt,
        objective: item.objective || planDefaultObjectives[idx % planDefaultObjectives.length],
        hook: item.hook || `Propuesta estratégica #${idx + 1} para ${businessName}`,
        linkedPublicationId: parsedPublications[idx]?.id || undefined,
      };
    });

    while (completeSchedulePlan.length < 5) {
      const pIdx = completeSchedulePlan.length;
      completeSchedulePlan.push({
        day: planDefaultDays[pIdx % planDefaultDays.length],
        time: planDefaultTimes[pIdx % planDefaultTimes.length],
        format: planDefaultFormats[pIdx % planDefaultFormats.length],
        objective: planDefaultObjectives[pIdx % planDefaultObjectives.length],
        hook: `Especial de ${businessName} para clientes de ${rubro.toLowerCase()}`,
        linkedPublicationId: parsedPublications[pIdx]?.id || undefined,
      });
    }

    // Garantizar que si el LLM mandó puros "post", se inyecte variedad real (carrusel, reel, historia)
    const uniqueFormats = new Set(completeSchedulePlan.slice(0, 5).map((i: any) => i.format));
    if (uniqueFormats.size < 3) {
      completeSchedulePlan = completeSchedulePlan.slice(0, 5).map((item: any, idx: number) => ({
        ...item,
        format: planDefaultFormats[idx % planDefaultFormats.length],
      }));
    }

    parsedStrategy.schedulePlan = completeSchedulePlan.slice(0, 5);

    // Pre-seleccionar plantillas de texto distintas al azar de DEFAULT_TEXT_TEMPLATES para organizar los textos sin caos
    const randomTextTemplates = pickDistinctRandomTextTemplates(parsedPublications.length);

    // Generar imágenes reales concurrentemente para cada publicación aplicando el estilo visual seleccionado
    console.log(`[Lab Generar Muestra] Generando imágenes estilizadas para las ${parsedPublications.length} publicaciones...`);
    const finalPublications = await Promise.all(
      parsedPublications.map(async (pub, idx) => {
        const assignedStyle = enrichedStyles[idx % enrichedStyles.length] || null;
        const assignedTextTemplate = randomTextTemplates[idx % randomTextTemplates.length];
        const styleFallbackUrl = assignedStyle?.previewUrl || "";

        const prodName = body.dishOrProductName || pub.dishOrProductName || businessName;
        const catalogMatch = catalogItems.find(
          (it) => it.name?.toLowerCase() === prodName.toLowerCase() || it.id === pub.productId
        );
        const hasCatalogRealPhoto = Boolean(catalogMatch?.imageUrl && catalogMatch.imageUrl.startsWith("http"));
        const effectiveRealPhotoUrl = hasCatalogRealPhoto
          ? catalogMatch.imageUrl
          : (body.baseImageUrl && typeof body.baseImageUrl === "string" && body.baseImageUrl.startsWith("http"))
          ? body.baseImageUrl
          : "";

        // Determinar si esta publicación específica llevará plantilla de texto comercial o foto limpia
        let postIsCommercial = true;
        if (finalImageTextMode === "con_texto") {
          postIsCommercial = true;
        } else if (finalImageTextMode === "sin_texto") {
          postIsCommercial = false;
        } else {
          postIsCommercial = typeof pub.isCommercialPoster === "boolean" ? pub.isCommercialPoster : (idx % 2 === 0);
        }

        const effectivePrice = productPrice || pub.productPrice || catalogMatch?.offerPrice || catalogMatch?.price || "";
        const effectiveDescription =
          commercialCustomText ||
          body.offerText ||
          catalogMatch?.description ||
          pub.title ||
          "";
        const effectiveIdea = commercialIdea || pub.hook || pub.title || prodName;

        const commercialOverlayConfig = {
          enabled: postIsCommercial,
          headline: (commercialCustomText || prodName || pub.title || businessName).trim(),
          badgeText: (body.offerText || businessName).trim(),
          priceText: effectivePrice,
          ctaText: (badgeCustomText || `¡Cotiza hoy! · ${businessName}`).trim(),
          businessName,
          rubro,
        };

        const posterConfigForN8n = postIsCommercial
          ? {
              enabled: true,
              includeLogo: false,
              includeBusinessName: true,
              businessName,
              includeMainText: true,
              mainText: commercialOverlayConfig.headline,
              includeSlogan: Boolean(commercialOverlayConfig.badgeText),
              sloganText: commercialOverlayConfig.badgeText,
              includePrice: Boolean(effectivePrice),
              priceText: effectivePrice,
              includeCta: true,
              ctaText: commercialOverlayConfig.ctaText,
              visualStyle: "Moderno",
            }
          : null;

        // Construir el prompt en inglés (con TYPOGRAPHY & LAYOUT si lleva texto comercial, igual que en Nuevo Post)
        const promptEnglish = buildStyledImagePrompt(
          assignedStyle,
          prodName,
          pub.imagePromptEnglish || "",
          commercialOverlayConfig
        );

        // Prompt limpio de fotografía (para guardar como baseImageUrl si el vendedor luego aplica una plantilla vectorial manual)
        const cleanPhotoPromptEnglish = buildStyledImagePrompt(
          assignedStyle,
          prodName,
          pub.imagePromptEnglish || "",
          { enabled: false }
        );

        try {
          if (pub.type === "carrusel") {
            let coverUrl = "";
            let commercialEditId: string | undefined;

            const rawCarouselPrompts = Array.isArray(pub.carouselPrompts) && pub.carouselPrompts.length >= 3
              ? pub.carouselPrompts
              : [
                  `${prodName}, hero presentation`,
                  `Detailed close-up of ${prodName} showing premium quality and craftsmanship`,
                  `Complete presentation of ${prodName} in professional commercial setting`,
                ];

            const slidePrompts = rawCarouselPrompts.map((sp: string, sIdx: number) =>
              buildStyledImagePrompt(
                assignedStyle,
                prodName,
                sp,
                sIdx === 0 ? commercialOverlayConfig : { enabled: false }
              )
            );

            // Generar las láminas con nuestro modelo real en n8n (75s timeout)
            const [baseCoverUrl, slide2, slide3] = await Promise.all([
              generateSingleImage(slidePrompts[0], rubro, prodName, "1:1", 75000, effectiveRealPhotoUrl, {
                styleReferenceUrl: styleFallbackUrl,
                idea: effectiveIdea,
                copyText: pub.copy || "",
                posterConfig: posterConfigForN8n,
              }),
              generateSingleImage(slidePrompts[1], rubro, prodName, "1:1", 75000, effectiveRealPhotoUrl, {
                styleReferenceUrl: styleFallbackUrl,
                idea: effectiveIdea,
                copyText: pub.copy || "",
                posterConfig: null,
              }),
              generateSingleImage(slidePrompts[2], rubro, prodName, "1:1", 75000, effectiveRealPhotoUrl, {
                styleReferenceUrl: styleFallbackUrl,
                idea: effectiveIdea,
                copyText: pub.copy || "",
                posterConfig: null,
              }),
            ]);

            const isFallbackCover = baseCoverUrl.includes("pollinations.ai");

            if (postIsCommercial && isFallbackCover) {
              try {
                const { composeCommercialSlideWithEditor } = await import("../../../../lib/real-product-compositor");
                const composed = await composeCommercialSlideWithEditor({
                  baseImageUrl: baseCoverUrl,
                  fallbackImageUrl: effectiveRealPhotoUrl || styleFallbackUrl,
                  productName: prodName,
                  productDescription: effectiveDescription,
                  price: effectivePrice,
                  idea: effectiveIdea,
                  rubro,
                  businessName,
                  aspectRatio: "1:1",
                  logoUrl: body.logoUrl || undefined,
                  userId,
                  includeLogo: Boolean(body.logoUrl),
                  saveEditableInLibrary: true,
                  customBadgeText: badgeCustomText,
                  skipAgentCopy: true,
                  templateId: assignedTextTemplate?.id,
                });
                coverUrl = composed.finalImageUrl;
                commercialEditId = composed.editDocId;
              } catch (bErr) {
                console.warn("[Lab Generar Muestra] Error componiendo portada de respaldo, usando base:", bErr);
                coverUrl = baseCoverUrl;
              }
            } else if (body.logoUrl && body.logoUrl.startsWith("http")) {
              try {
                const { overlayLogoOnImage } = await import("../../../../lib/image-watermark");
                coverUrl = await overlayLogoOnImage(baseCoverUrl, body.logoUrl, userId, {
                  position: "top-left",
                });
              } catch {
                coverUrl = baseCoverUrl;
              }
            } else {
              coverUrl = baseCoverUrl;
            }

            const slideUrls = [coverUrl, slide2, slide3];

            return {
              ...pub,
              dishOrProductName: prodName,
              productPrice: effectivePrice || pub.productPrice,
              imagePromptEnglish: cleanPhotoPromptEnglish,
              imageUrl: slideUrls[0],
              baseImageUrl: baseCoverUrl,
              origBaseImageUrl: effectiveRealPhotoUrl || undefined,
              carouselImages: slideUrls,
              isCommercialPoster: postIsCommercial,
              visualStyleSource,
              visualStyleId: assignedStyle?.id || "",
              visualStyleTitle: assignedStyle ? assignedStyle.title : pub.visualStyleTitle || "Estilo Comercial",
              visualStylePrompt: assignedStyle?.prompt || "",
              visualStyleKeywords: assignedStyle?.styleKeywords || "",
              textTemplateId: isFallbackCover ? (assignedTextTemplate?.id || "") : "",
              textTemplateName: isFallbackCover ? (assignedTextTemplate?.name || "") : (postIsCommercial ? "Diseño Directo con Agentes" : ""),
              commercialEditId,
            };
          } else {
            // Post estándar 1:1
            let finalImgUrl = "";
            let commercialEditId: string | undefined;

            // Generar con nuestro modelo real en n8n (75s timeout, igual que en Nuevo Post)
            const basePostUrl = await generateSingleImage(
              promptEnglish,
              rubro,
              prodName,
              "1:1",
              75000,
              effectiveRealPhotoUrl,
              {
                styleReferenceUrl: styleFallbackUrl,
                idea: effectiveIdea,
                copyText: pub.copy || "",
                posterConfig: posterConfigForN8n,
              }
            );

            const isFallbackPost = basePostUrl.includes("pollinations.ai");

            if (postIsCommercial && isFallbackPost) {
              try {
                const { composeCommercialSlideWithEditor } = await import("../../../../lib/real-product-compositor");
                const composed = await composeCommercialSlideWithEditor({
                  baseImageUrl: basePostUrl,
                  fallbackImageUrl: effectiveRealPhotoUrl || styleFallbackUrl,
                  productName: prodName,
                  productDescription: effectiveDescription,
                  price: effectivePrice,
                  idea: effectiveIdea,
                  rubro,
                  businessName,
                  aspectRatio: "1:1",
                  logoUrl: body.logoUrl || undefined,
                  userId,
                  includeLogo: Boolean(body.logoUrl),
                  saveEditableInLibrary: true,
                  customBadgeText: badgeCustomText,
                  skipAgentCopy: true,
                  templateId: assignedTextTemplate?.id,
                });
                finalImgUrl = composed.finalImageUrl;
                commercialEditId = composed.editDocId;
              } catch (bErr) {
                console.warn("[Lab Generar Muestra] Error componiendo post 1:1 de respaldo, usando base:", bErr);
                finalImgUrl = basePostUrl;
              }
            } else if (body.logoUrl && body.logoUrl.startsWith("http")) {
              try {
                const { overlayLogoOnImage } = await import("../../../../lib/image-watermark");
                finalImgUrl = await overlayLogoOnImage(basePostUrl, body.logoUrl, userId, {
                  position: "top-left",
                });
              } catch {
                finalImgUrl = basePostUrl;
              }
            } else {
              finalImgUrl = basePostUrl;
            }

            return {
              ...pub,
              dishOrProductName: prodName,
              productPrice: effectivePrice || pub.productPrice,
              imagePromptEnglish: cleanPhotoPromptEnglish,
              imageUrl: finalImgUrl,
              baseImageUrl: basePostUrl,
              origBaseImageUrl: effectiveRealPhotoUrl || undefined,
              isCommercialPoster: postIsCommercial,
              visualStyleSource,
              visualStyleId: assignedStyle?.id || "",
              visualStyleTitle: assignedStyle ? assignedStyle.title : pub.visualStyleTitle || "Estilo Comercial",
              visualStylePrompt: assignedStyle?.prompt || "",
              visualStyleKeywords: assignedStyle?.styleKeywords || "",
              textTemplateId: isFallbackPost ? (assignedTextTemplate?.id || "") : "",
              textTemplateName: isFallbackPost ? (assignedTextTemplate?.name || "") : (postIsCommercial ? "Diseño Directo con Agentes" : ""),
              commercialEditId,
            };
          }
        } catch (itemErr) {
          console.warn(`[Lab Generar Muestra] Error procesando imagen de muestra #${idx + 1}, usando respaldo:`, itemErr);
          const safeUrl = effectiveRealPhotoUrl || styleFallbackUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(prodName)}?width=1080&height=1080&model=flux&nologo=true&enhance=true`;
          return {
            ...pub,
            dishOrProductName: prodName,
            imagePromptEnglish: promptEnglish,
            imageUrl: safeUrl,
            baseImageUrl: safeUrl,
            carouselImages: pub.type === "carrusel" ? [safeUrl, safeUrl, safeUrl] : undefined,
            isCommercialPoster: postIsCommercial,
            visualStyleSource,
            visualStyleTitle: assignedStyle ? assignedStyle.title : pub.visualStyleTitle || "Estilo Comercial",
            textTemplateId: assignedTextTemplate?.id || "",
            textTemplateName: assignedTextTemplate?.name || "",
          };
        }
      })
    );

    // Guardar la muestra en Firestore (admin_prospect_demos)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";
    const cleanPhone = (phone || "").replace(/[\s\+\-\(\)]/g, "");

    const newDemoData: any = {
      prospectBusiness: businessName,
      prospectName: body.prospectName || businessName,
      prospectPhone: phone || "",
      rubro,
      offerText: body.offerText || commercialCustomText || "",
      dishOrProductName: body.dishOrProductName || finalPublications[0]?.dishOrProductName || businessName,
      status: "generada",
      createdBy: userId,
      sellerName: body.sellerName || "Equipo Comercial",
      sellerEmail: body.sellerEmail || "vendedores@santisoft.cl",
      createdAt: new Date(),
      visualStyleSource,
      publications: finalPublications,
      strategy: parsedStrategy,
      generatedImageUrl: finalPublications[0]?.imageUrl || "",
      generatedPostCaption: finalPublications[0]?.copy || "",
      selectedStyleTitle: finalPublications[0]?.visualStyleTitle || "Personalizado",
      logoUrl: body.logoUrl || null,
      baseImageUrl: body.baseImageUrl || null,
    };

    let demoId = "";
    if (adminDb) {
      const docRef = await adminDb.collection("admin_prospect_demos").add(newDemoData);
      demoId = docRef.id;
      const publicDemoUrl = `${baseUrl}/m/${demoId}`;
      await docRef.update({ publicDemoUrl });
      newDemoData.id = demoId;
      newDemoData.publicDemoUrl = publicDemoUrl;
    } else {
      demoId = `demo_${Date.now()}`;
      newDemoData.id = demoId;
      newDemoData.publicDemoUrl = `${baseUrl}/m/${demoId}`;
    }

    const publicDemoUrl = `${baseUrl}/m/${demoId}`;

    // Construir mensaje de WhatsApp profesional y humanizado con landing, plan de 5 posts de nicho y muestras
    const scheduleItemsText = (parsedStrategy?.schedulePlan || []).slice(0, 5).map((item: any, i: number) => {
      const numEmoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"][i] || `•`;
      const fmtMap: Record<string, string> = {
        carrusel: "Carrusel (3 slides)",
        reel: "Reel Vertical (9:16)",
        historia: "Historia Interactiva",
        post: "Post (1:1 Feed)",
      };
      const fmtLabel = fmtMap[item.format] || "Post (1:1)";
      return `${numEmoji} ${item.day || `Día ${i + 1}`} · ${fmtLabel}\n   🎯 ${item.objective || item.hook || "Publicación estratégica"}`;
    }).join("\n\n");

    const samplesText = finalPublications.slice(0, 3).map((pub: any, i: number) => {
      const fmtIcon = pub.type === "carrusel" ? "🎠" : "📸";
      const briefCopy = (pub.copy || "").split("\n")[0] || pub.title || "Publicación de alto impacto";
      return `${fmtIcon} Muestra #${i + 1} (${pub.visualStyleTitle || "Estilo Visual"}): ${pub.title || pub.dishOrProductName}\n"${briefCopy.length > 110 ? briefCopy.substring(0, 107) + '...' : briefCopy}"`;
    }).join("\n\n");

    const whatsappMessage = `¡Hola ${businessName}! 👋 Estuve revisando lo que hacen y nuestro equipo de agentes especializados preparó esta propuesta estratégica con ${finalPublications.length} publicaciones de muestra listas y una planificación semanal basada en nuestro radar de nicho:

🚀 Ver propuesta interactiva completa:
${publicDemoUrl}

📅 Plan de Publicaciones Estratégico (Radar de Nicho):
${scheduleItemsText}

✨ Publicaciones de Muestra Diseñadas:
${samplesText}

Diseñamos este contenido con su identidad para que veas la calidad y el impacto que tendrían sus redes semana a semana sin quitarte tiempo.

¿Qué te parece la propuesta para comenzar esta semana?`;

    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    console.log(`[Lab Generar Muestra] ✅ Muestra generada con éxito: ${demoId} (${publicDemoUrl})`);

    return NextResponse.json({
      success: true,
      demoId,
      publicDemoUrl,
      whatsappUrl,
      whatsappMessage,
      publications: finalPublications,
      strategy: parsedStrategy,
    });
  } catch (error: any) {
    console.error("[Lab Generar Muestra] Error en generación de muestra:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar la muestra para el cliente." },
      { status: 500 }
    );
  }
}
