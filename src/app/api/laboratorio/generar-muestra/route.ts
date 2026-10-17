import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { generateFreeText } from "../../../../lib/gemini-free";
import { HARDCODED_STYLES } from "../../../../lib/prompt-templates";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Hasta 2 minutos para orquestar los agentes

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

// Genera una imagen vía n8n con fallback inmediato a Flux
async function generateSingleImage(
  promptEnglish: string,
  rubro: string,
  productName: string,
  aspectRatio: "1:1" | "9:16" = "1:1"
): Promise<string> {
  const width = aspectRatio === "9:16" ? 720 : 1080;
  const height = aspectRatio === "9:16" ? 1280 : 1080;
  const seed = Math.floor(Math.random() * 1000000);

  // Intento n8n con timeout de 10 segundos
  try {
    const n8nWebhookUrl = "https://n8n.santisoft.cl/webhook/img-rrss-auto";
    const n8nRes = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: promptEnglish,
        promptEnglish,
        businessType: rubro,
        rubro,
        dishOrProduct: productName,
        type: aspectRatio === "9:16" ? "story" : "rrss",
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (n8nRes.ok) {
      const rawData = await n8nRes.json().catch(() => ({}));
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
  } catch {
    // Si n8n demora o falla, pasamos al fallback sin bloquear al usuario
  }

  // Fallback rápido y confiable a Flux (Pollinations)
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(promptEnglish)}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true&seed=${seed}`;
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
      catalogUsage = "mixed",
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

    // Normalizar modo visual: "con_texto", "sin_texto" o "mixto"
    const finalImageTextMode: "con_texto" | "sin_texto" | "mixto" = isCommercialImageEngine
      ? (commercialIncludeText === false ? "sin_texto" : "con_texto")
      : imageTextOption === "con_texto" || imageTextOption === "sin_texto" || imageTextOption === "mixto"
      ? imageTextOption
      : isCommercialPoster
      ? "con_texto"
      : "mixto";

    // Validar cantidad: mínimo 1 y máximo 5
    const clampedCount = Math.max(1, Math.min(5, Number(postsCount) || 3));

    // Validar tipos de publicaciones: al menos 1
    const validAllowedTypes = (Array.isArray(allowedTypes) && allowedTypes.length > 0)
      ? allowedTypes.filter((t) => ["post", "carrusel", "reel"].includes(t))
      : ["post"];
    const finalAllowedTypes = validAllowedTypes.length > 0 ? validAllowedTypes : ["post"];

    console.log(`[Lab Generar Muestra] Solicitando ${clampedCount} posts para ${businessName} (${rubro}). Motor: ${visualStyleSource}. Modo imagen: ${finalImageTextMode}. Formatos permitidos:`, finalAllowedTypes);

    // Preparar contexto del catálogo
    const catalogFormatted = catalogItems.length > 0
      ? catalogItems.map((item, idx) => {
          const hasPic = Boolean(item.imageUrl && typeof item.imageUrl === "string" && item.imageUrl.startsWith("http"));
          return `Ítem #${idx + 1}: ID: "${item.id || idx}" | Nombre: "${item.name}" | Precio: "${item.offerPrice || item.price || 'Consultar'}" | Descripción: "${item.description || ''}" | Foto real: ${hasPic ? item.imageUrl : 'No tiene'}`;
        }).join("\n")
      : "No se proporcionó catálogo explícito.";

    // Preparar estilos visuales seleccionados
    const stylesContext = isCommercialImageEngine
      ? `Motor de Imagen Comercial Activo (Fondo comercial limpio + Capas vectoriales de nuestro editor). Idea visual solicitada: "${commercialIdea || body.offerText || body.dishOrProductName || `Destacar lo mejor de ${businessName} en ${rubro}`}". ${commercialCustomText ? `Texto comercial solicitado en capas: "${commercialCustomText}".` : ""}`
      : selectedStyles.length > 0
      ? selectedStyles.map((s) => `- ${s.title}: ${s.description} (Keywords: ${s.styleKeywords || s.description})`).join("\n")
      : HARDCODED_STYLES.slice(0, 3).map((s) => `- ${s.title}: ${s.description}`).join("\n");

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
1. Una ESTRATEGIA Y PLANIFICACIÓN integral para la marca "${businessName}" en el rubro "${rubro}".
2. EXACTAMENTE ${clampedCount} publicaciones publicitarias para redes sociales.

REGLAS ABSOLUTAS:
1. FORMATOS PERMITIDOS: Solo puedes asignar formatos que estén en esta lista: ${JSON.stringify(finalAllowedTypes)}.
   - "post": Publicación estándar de feed (1:1), fotografía o cartel publicitario.
   - "carrusel": Publicación de 3 diapositivas secuenciales (Slide 1: Gancho, Slide 2: Detalle/Beneficio, Slide 3: Oferta y llamado).
   - "reel": Video corto vertical (9:16) con guión estructurado (Gancho 0-3s, Demostración 3-15s, CTA 15-25s).
   Distribuye los formatos permitidos de forma atractiva entre las ${clampedCount} publicaciones.

2. HUMANIZACIÓN Y TONO:
   - Tono: ${toneInstruction}
   - Habla de "tú a tú", ritmo dinámico y fluido.
   - CERO frases robóticas ("en el vertiginoso mundo", "descubre", "sumérgete", "en conclusión").
   - NUNCA menciones "IA" o "Inteligencia Artificial". Refiérete siempre a "nuestros agentes" o "nuestro equipo de agentes especializados".

3. CARTEL COMERCIAL & TEXTOS EN IMAGEN (MOTOR: ${isCommercialImageEngine ? "IMAGEN COMERCIAL CON CAPAS" : finalImageTextMode.toUpperCase()}):
   ${
     isCommercialImageEngine
       ? "ESTÁS USANDO EL MOTOR DE IMAGEN COMERCIAL CON CAPAS DE NUESTRO EDITOR: En 'imagePromptEnglish' y 'carouselPrompts', describe una escena fotográfica o estudio comercial de altísima estética con el sujeto/producto en el 60% inferior y un área limpia de espacio negativo (copyspace) en el 35%-40% superior, e indica ESTRICTAMENTE: 'clean background photography, negative space in upper third, STRICT NEGATIVE: no text, no typography, no letters, no words, no watermarks'. Nuestro motor de capas estampará los textos comerciales limpios encima."
       : finalImageTextMode === "con_texto"
       ? "TODAS las publicaciones deben ser diseñadas como CARTEL COMERCIAL con tipografía publicitaria integrada ('isCommercialPoster': true). En 'imagePromptEnglish', incluye instrucciones explícitas de layout publicitario con titular en mayúsculas, subtítulo, badge de precio destacado (ej: '$24.900') y botón o sticker con llamado a la acción ('¡ORDENA AHORA!')."
       : finalImageTextMode === "sin_texto"
       ? "TODAS las publicaciones deben ser diseñadas como FOTOGRAFÍA LIMPIA sin textos superpuestos ('isCommercialPoster': false). En 'imagePromptEnglish', describe una fotografía comercial, editorial o de autor de alta estética centrada en el producto o servicio, indicando explícitamente: clean photography without text, no typography, no words, no overlays."
       : "Esta planificación es MIXTA: debes combinar publicaciones tipo CARTEL COMERCIAL ('isCommercialPoster': true) con tipografía visible de oferta y precio, y publicaciones de FOTOGRAFÍA LIMPIA ('isCommercialPoster': false) con alta estética y sin ningún texto superpuesto sobre la imagen. Alterna los formatos entre las publicaciones."
   }

4. CONTACTO Y LLAMADO A LA ACCIÓN:
   ${phone ? `- WhatsApp de contacto: ${phone}` : ""}
   ${website ? `- Sitio Web: ${website}` : ""}
   Incluye siempre un llamado a la acción (CTA) concreto en cada copy.

5. RESPUESTA ESTRICTA EN JSON:
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
        "format": "post" | "carrusel" | "reel",
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
      "type": "post" | "carrusel" | "reel",
      "title": "Título corto y atractivo",
      "dishOrProductName": "Nombre del plato o servicio asignado",
      "productPrice": "Precio asignado si aplica o null",
      "hook": "Gancho magnético para detener el scroll",
      "copy": "Texto completo y humanizado listo para publicar en redes",
      "cta": "Llamado a la acción con canal de contacto",
      "visualStyleTitle": "Nombre del estilo visual aplicado",
      "isCommercialPoster": true, // true si es cartel con textos y precios, false si es foto limpia sin textos superpuestos
      "imagePromptEnglish": "Prompt descriptivo en inglés (60 a 90 palabras) para fotografía profesional o cartel publicitario",
      "carouselPrompts": ["Prompt slide 1 en inglés", "Prompt slide 2 en inglés", "Prompt slide 3 en inglés"], // solo si type === 'carrusel'
      "reelScript": { // solo si type === 'reel'
        "hook3s": "Gancho inicial en los primeros 3 segundos",
        "body": "Desarrollo dinámico del reel en 15 segundos",
        "cta": "Llamado a la acción final"
      }
    }
  ]
}`;

    const userPromptContent = `Genera la estrategia y planificación de EXACTAMENTE ${clampedCount} publicaciones para:
- Marca: ${businessName}
- Rubro: ${rubro}
- Formatos a utilizar: ${finalAllowedTypes.join(", ")}
${customAgentInstruction ? `- Directriz personalizada del cliente: ${customAgentInstruction}` : ""}
${nicheContext ? `- Contexto del Radar de Nicho: ${nicheContext.substring(0, 400)}` : ""}

Catálogo disponible:
${catalogFormatted}

Estilos visuales:
${stylesContext}`;

    let generatedPlanText = "";
    try {
      generatedPlanText = await generateFreeText(userPromptContent, systemPrompt);
    } catch (llmErr: any) {
      console.error("[Lab Generar Muestra] Error al estructurar posts con Gemini:", llmErr);
      throw new Error("No fue posible estructurar las publicaciones con nuestros agentes. Intenta nuevamente.");
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

    // Fallback si la IA devolvió menos publicaciones de las requeridas
    if (!Array.isArray(parsedPublications) || parsedPublications.length === 0) {
      parsedPublications = [];
    }

    // Si faltan publicaciones para completar clampedCount, sintetizar las restantes usando el catálogo o rubro
    const defaultDays = ["Martes", "Jueves", "Viernes", "Sábado", "Domingo"];
    const defaultTimes = ["13:00 hrs", "19:30 hrs", "20:00 hrs", "21:00 hrs", "12:30 hrs"];

    while (parsedPublications.length < clampedCount) {
      const nextIdx = parsedPublications.length;
      const assignedType = finalAllowedTypes[nextIdx % finalAllowedTypes.length];
      const catalogItem = catalogItems[nextIdx % Math.max(1, catalogItems.length)] || null;
      const prodName = catalogItem?.name || `${businessName} Especial #${nextIdx + 1}`;
      const prodPrice = catalogItem?.offerPrice || catalogItem?.price || null;

      parsedPublications.push({
        id: `pub_${nextIdx + 1}`,
        type: assignedType,
        title: `${prodName} - Propuesta #${nextIdx + 1}`,
        dishOrProductName: prodName,
        productPrice: prodPrice,
        hook: `¿Buscabas la mejor opción de ${rubro.toLowerCase()} para compartir hoy?`,
        copy: `Te presentamos una de las opciones favoritas de ${businessName}. Preparada con los mejores ingredientes y el toque característico que nos distingue. Pídela hoy mismo y compruébalo.`,
        cta: phone ? `Escríbenos directamente al WhatsApp ${phone}` : "Contáctanos y haz tu pedido hoy",
        visualStyleTitle: isCommercialPoster ? "Cartel Comercial de Alto Impacto" : "Fotografía Gastronómica & Publicitaria",
        imagePromptEnglish: isCommercialPoster
          ? `Commercial food advertising poster layout for ${prodName}, strict two-tier composition: mouth-watering hero food dish positioned cleanly in LOWER 55%-60% of frame resting on a dark rustic table, UPPER 40%-45% features clean dark atmospheric negative space (copyspace) with bold crisp on-image typography text overlay reading "${prodName.toUpperCase()}", highlighted yellow price badge "${prodPrice || '$24.900'}" in upper corner, compact yellow CTA button "¡ORDENA AHORA!", STRICT RULE: all typography and text overlays must stay strictly in the upper negative space and NEVER overlap, touch or obscure the food dish, warm restaurant lighting, 8k resolution`
          : `Professional commercial advertising food photography of ${prodName}, appetizing warm lighting, rustic restaurant atmosphere, high-end plating, ultra-detailed 8k.`,
        carouselPrompts: assignedType === "carrusel" ? (isCommercialPoster ? [
          `Commercial poster cover for ${prodName}, two-tier composition, clean dark upper copyspace with bold on-image typography headline "${prodName.toUpperCase()}", food hero clean and unobstructed in lower 60%, advertising layout`,
          `Detailed macro close-up of fresh textures and ingredients of ${prodName}, promotional badge "INGREDIENTES FRESCOS" in upper corner`,
          `Complete meal combo spread for ${prodName} with beverage and sides on dark rustic table, vibrant yellow price badge "${prodPrice || '$24.900'}" in top margin and compact CTA button "¡ORDENA AHORA!" at bottom edge clear of food`
        ] : [
          `Appetizing hero shot of ${prodName}, rustic table setting`,
          `Detailed macro close-up of fresh textures and ingredients of ${prodName}`,
          `Complete meal combo spread with sides and refreshing drink, commercial poster`
        ]) : undefined,
        reelScript: assignedType === "reel" ? {
          hook3s: `Mira de cerca esta delicia de ${businessName}`,
          body: `Tomas en primer plano mostrando la preparación artesanal y el vapor saliendo del plato recién hecho.`,
          cta: `Pide la tuya hoy por WhatsApp antes de que se agote.`
        } : undefined
      });
    }

    // Asegurar que no exceda clampedCount y que cada formato sea válido
    parsedPublications = parsedPublications.slice(0, clampedCount).map((pub, idx) => {
      const assignedType = finalAllowedTypes.includes(pub.type) ? pub.type : finalAllowedTypes[idx % finalAllowedTypes.length];
      return {
        ...pub,
        id: pub.id || `pub_${idx + 1}`,
        type: assignedType,
      };
    });

    // Asegurar estrategia estructurada válida
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
        schedulePlan: parsedPublications.map((p, idx) => ({
          day: defaultDays[idx % defaultDays.length],
          time: defaultTimes[idx % defaultTimes.length],
          format: p.type,
          objective: `Posicionar ${p.dishOrProductName || businessName} y captar pedidos activos.`,
          hook: p.hook || `Propuesta destacada #${idx + 1}`,
          linkedPublicationId: p.id
        })),
        nicheOpportunities: [
          `Los usuarios de ${rubro.toLowerCase()} responden un 50% más rápido cuando la publicación muestra precio y canal directo de WhatsApp.`,
          "Las imágenes en formato vertical y carruseles tienen mayor tiempo de retención que posts planos.",
          "Publicar en horarios cercanos a las comidas o toma de decisión incrementa las consultas directas."
        ]
      };
    } else {
      // Sincronizar schedulePlan con las publicaciones reales
      if (!Array.isArray(parsedStrategy.schedulePlan) || parsedStrategy.schedulePlan.length === 0) {
        parsedStrategy.schedulePlan = parsedPublications.map((p, idx) => ({
          day: defaultDays[idx % defaultDays.length],
          time: defaultTimes[idx % defaultTimes.length],
          format: p.type,
          objective: `Posicionar ${p.dishOrProductName || businessName} y captar pedidos activos.`,
          hook: p.hook || `Propuesta destacada #${idx + 1}`,
          linkedPublicationId: p.id
        }));
      }
    }

    // Generar imágenes reales concurrentemente para cada publicación
    console.log(`[Lab Generar Muestra] Generando imágenes para las ${parsedPublications.length} publicaciones...`);
    const finalPublications = await Promise.all(
      parsedPublications.map(async (pub, idx) => {
        const prodName = pub.dishOrProductName || body.dishOrProductName || businessName;
        const catalogMatch = catalogItems.find((it) => it.name?.toLowerCase() === prodName.toLowerCase() || it.id === pub.productId);
        const hasCatalogRealPhoto = Boolean(catalogMatch?.imageUrl && catalogMatch.imageUrl.startsWith("http"));
        const effectiveRealPhotoUrl = hasCatalogRealPhoto
          ? catalogMatch.imageUrl
          : body.baseImageUrl && body.baseImageUrl.startsWith("http")
          ? body.baseImageUrl
          : "";

        // Determinar si esta publicación específica llevará texto comercial o foto limpia
        let postIsCommercial = true;
        if (finalImageTextMode === "con_texto") {
          postIsCommercial = true;
        } else if (finalImageTextMode === "sin_texto") {
          postIsCommercial = false;
        } else {
          // Modo mixto: si el agente definió boolean en pub.isCommercialPoster respetarlo, si no alternar
          postIsCommercial = typeof pub.isCommercialPoster === "boolean" ? pub.isCommercialPoster : (idx % 2 === 0);
        }

        const effectivePrice = pub.productPrice || productPrice || catalogMatch?.offerPrice || catalogMatch?.price || "";
        const effectiveDescription =
          commercialCustomText ||
          body.offerText ||
          catalogMatch?.description ||
          pub.title ||
          "";
        const effectiveIdea = commercialIdea || pub.hook || pub.title || prodName;

        let promptEnglish = pub.imagePromptEnglish || "";
        if (isCommercialImageEngine) {
          // En modo Imagen Comercial, el fondo base SIEMPRE es limpio sin letras incrustadas para que Nuestro Editor estampe las capas vectoriales
          if (!promptEnglish) {
            promptEnglish = `Professional commercial advertising studio photography for ${prodName} (${rubro}), subject positioned cleanly in lower 60% of frame, clean dark atmospheric negative space in upper 40% for overlays, dramatic studio lighting, 8k resolution, photorealistic, STRICT NEGATIVE: no text, no typography, no letters, no words, no watermark`;
          } else {
            promptEnglish = `${promptEnglish}, clean background with upper negative space, STRICT NEGATIVE: no text, no typography, no letters, no words, no watermark`;
          }
        } else if (!promptEnglish) {
          promptEnglish = postIsCommercial
            ? `Commercial food advertising poster layout for ${prodName}, two-tier composition: mouth-watering hero food dish positioned cleanly in LOWER 55%-60% of frame, UPPER 40%-45% features clean dark atmospheric negative space (copyspace) with bold crisp typography text overlay reading "${prodName.toUpperCase()}", highlighted yellow price badge "${effectivePrice || '$24.900'}" in upper corner, rounded yellow CTA button "¡ORDENA AHORA!", STRICT RULE: all rendered text overlays must stay strictly in the upper negative space and NEVER overlap, touch or obscure the food dish, warm restaurant lighting, 8k resolution`
            : `Professional commercial advertising food photography of ${prodName}, gourmet restaurant plating, dramatic warm lighting, 8k resolution, photorealistic, clean shot, STRICT NEGATIVE: no text, no typography, no letters, no words, no watermark, no overlays`;
        } else if (postIsCommercial && !promptEnglish.toLowerCase().includes("typography") && !promptEnglish.toLowerCase().includes("text overlay")) {
          promptEnglish = `Commercial advertising poster graphic design, two-tier composition with dark upper copyspace, bold crisp typography text overlay reading "${prodName.toUpperCase()}", price badge "${effectivePrice || '$24.900'}" in upper margin, compact CTA button "¡ORDENA AHORA!", STRICT RULE: typography must never overlap or cover the food hero in lower half, ${promptEnglish}`;
        } else if (!postIsCommercial) {
          promptEnglish = `${promptEnglish}, clean commercial photography, STRICT NEGATIVE: no text, no typography, no letters, no words, no watermark, no overlays`;
        }

        if (pub.type === "carrusel") {
          // Generar 3 slides para carrusel
          let coverUrl = "";
          let commercialEditId: string | undefined;

          const slidePrompts: string[] = Array.isArray(pub.carouselPrompts) && pub.carouselPrompts.length >= 3
            ? pub.carouselPrompts.map((p: string) =>
                isCommercialImageEngine
                  ? `${p}, clean background with upper negative space, STRICT NEGATIVE: no text, no typography, no letters`
                  : p
              )
            : [
                `${promptEnglish}, wide appetizing cover view`,
                `${promptEnglish}, close-up detailed texture, fresh ingredients in focus`,
                `${promptEnglish}, complete showcase with dramatic lighting`,
              ];

          const baseCoverUrl = effectiveRealPhotoUrl || (await generateSingleImage(slidePrompts[0], rubro, prodName, "1:1"));

          if ((effectiveRealPhotoUrl || isCommercialImageEngine) && postIsCommercial) {
            try {
              const { composeCommercialSlideWithEditor } = await import("../../../../lib/real-product-compositor");
              const composed = await composeCommercialSlideWithEditor({
                baseImageUrl: baseCoverUrl,
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
              });
              coverUrl = composed.finalImageUrl;
              commercialEditId = composed.editDocId;
            } catch (bErr) {
              console.warn("[Lab Generar Muestra] Error componiendo portada de carrusel, usando base:", bErr);
              coverUrl = baseCoverUrl;
            }
          } else {
            coverUrl = baseCoverUrl;
          }

          const [slide2, slide3] = await Promise.all([
            generateSingleImage(slidePrompts[1], rubro, prodName, "1:1"),
            generateSingleImage(slidePrompts[2], rubro, prodName, "1:1"),
          ]);

          const slideUrls = [coverUrl, slide2, slide3];

          return {
            ...pub,
            imageUrl: slideUrls[0],
            baseImageUrl: baseCoverUrl,
            carouselImages: slideUrls,
            isCommercialPoster: postIsCommercial,
            visualStyleSource,
            commercialEditId,
          };
        } else if (pub.type === "reel") {
          // Generar visual vertical 9:16 para reel
          let reelImageUrl = "";
          let commercialEditId: string | undefined;
          const reelPrompt = `${promptEnglish}, cinematic vertical framing, 9:16 aspect ratio, dramatic studio lighting`;
          const baseReelUrl = effectiveRealPhotoUrl || (await generateSingleImage(reelPrompt, rubro, prodName, "9:16"));

          if ((effectiveRealPhotoUrl || isCommercialImageEngine) && postIsCommercial) {
            try {
              const { composeCommercialSlideWithEditor } = await import("../../../../lib/real-product-compositor");
              const composed = await composeCommercialSlideWithEditor({
                baseImageUrl: baseReelUrl,
                productName: prodName,
                productDescription: effectiveDescription,
                price: effectivePrice,
                idea: effectiveIdea,
                rubro,
                businessName,
                aspectRatio: "9:16",
                logoUrl: body.logoUrl || undefined,
                userId,
                includeLogo: Boolean(body.logoUrl),
                saveEditableInLibrary: true,
                customBadgeText: badgeCustomText,
              });
              reelImageUrl = composed.finalImageUrl;
              commercialEditId = composed.editDocId;
            } catch (bErr) {
              console.warn("[Lab Generar Muestra] Error componiendo portada vertical Reel, usando base:", bErr);
              reelImageUrl = baseReelUrl;
            }
          } else {
            reelImageUrl = baseReelUrl;
          }

          return {
            ...pub,
            imageUrl: reelImageUrl,
            baseImageUrl: baseReelUrl,
            aspectRatio: "9:16",
            isCommercialPoster: postIsCommercial,
            visualStyleSource,
            commercialEditId,
          };
        } else {
          // Post estándar 1:1
          let finalImgUrl = "";
          let commercialEditId: string | undefined;
          const basePostUrl = effectiveRealPhotoUrl || (await generateSingleImage(promptEnglish, rubro, prodName, "1:1"));

          if ((effectiveRealPhotoUrl || isCommercialImageEngine) && postIsCommercial) {
            try {
              const { composeCommercialSlideWithEditor } = await import("../../../../lib/real-product-compositor");
              const composed = await composeCommercialSlideWithEditor({
                baseImageUrl: basePostUrl,
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
              });
              finalImgUrl = composed.finalImageUrl;
              commercialEditId = composed.editDocId;
            } catch (bErr) {
              console.warn("[Lab Generar Muestra] Error componiendo post 1:1 con capas, usando base:", bErr);
              finalImgUrl = basePostUrl;
            }
          } else {
            finalImgUrl = basePostUrl;
          }

          return {
            ...pub,
            imageUrl: finalImgUrl,
            baseImageUrl: basePostUrl,
            isCommercialPoster: postIsCommercial,
            visualStyleSource,
            commercialEditId,
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
      offerText: body.offerText || "",
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

    // Construir mensaje de WhatsApp profesional y humanizado listo para enviar
    const formatsDescription = finalAllowedTypes.map((t) => {
      if (t === "post") return "posts de diseño";
      if (t === "carrusel") return "carruseles interactivos";
      if (t === "reel") return "reels con guión dinámico";
      return t;
    }).join(", ");

    const whatsappMessage = `¡Hola ${businessName}! 👋 Estuve revisando lo que hacen y nuestro equipo de agentes especializados preparó esta propuesta con ${finalPublications.length} publicaciones listas para tus redes (${formatsDescription}) y la estrategia completa de publicación:

🚀 Puedes revisar la muestra interactiva y la planificación aquí:
${publicDemoUrl}

Diseñamos cada publicación pensando en captar clientes y mantener activo tu perfil sin que tengas que dedicarle horas de trabajo.

¿Qué te parece la propuesta?`;

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
