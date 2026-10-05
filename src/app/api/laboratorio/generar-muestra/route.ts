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
  isCommercialPoster?: boolean;
  agentTone?: string;
  customAgentInstruction?: string;
  nicheContext?: string;
  userId?: string;
  profileId?: string;
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
      isCommercialPoster = false,
      agentTone = "directo_cercano",
      customAgentInstruction = "",
      nicheContext = "",
      userId = uid,
    } = body;

    // Validar cantidad: mínimo 1 y máximo 5
    const clampedCount = Math.max(1, Math.min(5, Number(postsCount) || 3));

    // Validar tipos de publicaciones: al menos 1
    const validAllowedTypes = (Array.isArray(allowedTypes) && allowedTypes.length > 0)
      ? allowedTypes.filter((t) => ["post", "carrusel", "reel"].includes(t))
      : ["post"];
    const finalAllowedTypes = validAllowedTypes.length > 0 ? validAllowedTypes : ["post"];

    console.log(`[Lab Generar Muestra] Solicitando ${clampedCount} posts para ${businessName} (${rubro}). Formatos permitidos:`, finalAllowedTypes);

    // Preparar contexto del catálogo
    const catalogFormatted = catalogItems.length > 0
      ? catalogItems.map((item, idx) => {
          const hasPic = Boolean(item.imageUrl && typeof item.imageUrl === "string" && item.imageUrl.startsWith("http"));
          return `Ítem #${idx + 1}: ID: "${item.id || idx}" | Nombre: "${item.name}" | Precio: "${item.offerPrice || item.price || 'Consultar'}" | Descripción: "${item.description || ''}" | Foto real: ${hasPic ? item.imageUrl : 'No tiene'}`;
        }).join("\n")
      : "No se proporcionó catálogo explícito.";

    // Preparar estilos visuales seleccionados
    const stylesContext = selectedStyles.length > 0
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
Tu misión es estructurar EXACTAMENTE ${clampedCount} publicaciones publicitarias para redes sociales para la marca "${businessName}" en el rubro "${rubro}".

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

3. CARTEL COMERCIAL:
   ${isCommercialPoster ? "Esta planificación está configurada con imágenes tipo Cartel Comercial. Cada publicación debe concebirse con tipografía publicitaria atractiva, precio u oferta destacada, titular comercial y CTA llamativo." : "Estilo fotográfico cuidado y apetitoso, centrado en el producto o servicio."}

4. CONTACTO Y LLAMADO A LA ACCIÓN:
   ${phone ? `- WhatsApp de contacto: ${phone}` : ""}
   ${website ? `- Sitio Web: ${website}` : ""}
   Incluye siempre un llamado a la acción (CTA) concreto en cada copy.

5. RESPUESTA ESTRICTA EN JSON:
Devuelve ÚNICAMENTE un objeto JSON con la clave "publications" que contenga un arreglo de EXACTAMENTE ${clampedCount} objetos con este formato:
{
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

    const userPromptContent = `Genera la planificación de ${clampedCount} publicaciones para:
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
    try {
      const cleanedJson = generatedPlanText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanedJson);
      parsedPublications = Array.isArray(parsed.publications) ? parsed.publications : [];
    } catch (parseErr) {
      console.warn("[Lab Generar Muestra] Fallo parseo JSON directo, buscando arreglo:", parseErr);
      const match = generatedPlanText.match(/\[[\s\S]*\]/);
      if (match) {
        parsedPublications = JSON.parse(match[0]);
      }
    }

    if (parsedPublications.length === 0) {
      throw new Error("El formato de publicaciones devuelto por los agentes no fue válido.");
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

    // Generar imágenes reales concurrentemente para cada publicación
    console.log(`[Lab Generar Muestra] Generando imágenes para las ${parsedPublications.length} publicaciones...`);
    const finalPublications = await Promise.all(
      parsedPublications.map(async (pub, idx) => {
        const prodName = pub.dishOrProductName || businessName;
        const catalogMatch = catalogItems.find((it) => it.name?.toLowerCase() === prodName.toLowerCase() || it.id === pub.productId);
        const hasCatalogRealPhoto = catalogMatch?.imageUrl && catalogMatch.imageUrl.startsWith("http");

        const promptEnglish = pub.imagePromptEnglish ||
          `Professional commercial advertising food photography of ${prodName}, gourmet restaurant plating, dramatic warm lighting, 8k resolution, photorealistic, no watermarks`;

        if (pub.type === "carrusel") {
          // Generar 3 slides para carrusel
          const slidePrompts: string[] = Array.isArray(pub.carouselPrompts) && pub.carouselPrompts.length >= 3
            ? pub.carouselPrompts
            : [
                `${promptEnglish}, wide appetizing cover view, commercial poster composition`,
                `${promptEnglish}, close-up detailed texture, fresh ingredients in focus`,
                `${promptEnglish}, complete delicious meal combo with beverage and sides, promotional showcase`,
              ];

          const slideUrls = await Promise.all(
            slidePrompts.slice(0, 3).map((sp) => generateSingleImage(sp, rubro, prodName, "1:1"))
          );

          return {
            ...pub,
            imageUrl: slideUrls[0],
            carouselImages: slideUrls,
            isCommercialPoster,
          };
        } else if (pub.type === "reel") {
          // Generar visual vertical 9:16 para reel
          const reelPrompt = `${promptEnglish}, cinematic vertical framing, 9:16 aspect ratio, dramatic motion blur, studio lighting`;
          const reelImageUrl = await generateSingleImage(reelPrompt, rubro, prodName, "9:16");

          return {
            ...pub,
            imageUrl: reelImageUrl,
            aspectRatio: "9:16",
            isCommercialPoster,
          };
        } else {
          // Post estándar 1:1
          let finalImgUrl = "";
          if (hasCatalogRealPhoto && !isCommercialPoster) {
            finalImgUrl = catalogMatch.imageUrl;
          } else {
            finalImgUrl = await generateSingleImage(promptEnglish, rubro, prodName, "1:1");
          }

          return {
            ...pub,
            imageUrl: finalImgUrl,
            isCommercialPoster,
          };
        }
      })
    );

    // Guardar la muestra en Firestore (admin_prospect_demos)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";
    const cleanPhone = (phone || "").replace(/[\s\+\-\(\)]/g, "");

    const newDemoData: any = {
      prospectBusiness: businessName,
      prospectName: businessName,
      prospectPhone: phone || "",
      rubro,
      status: "generada",
      createdBy: userId,
      sellerName: "Laboratorio de Pruebas",
      sellerEmail: "laboratorio@santisoft.cl",
      createdAt: new Date(),
      publications: finalPublications,
      dishOrProductName: finalPublications[0]?.dishOrProductName || businessName,
      generatedImageUrl: finalPublications[0]?.imageUrl || "",
      generatedPostCaption: finalPublications[0]?.copy || "",
      selectedStyleTitle: finalPublications[0]?.visualStyleTitle || "Personalizado",
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

    const whatsappMessage = `¡Hola ${businessName}! 👋 Estuve revisando lo que hacen y nuestro equipo de agentes especializados preparó esta propuesta con ${finalPublications.length} publicaciones listas para tus redes (${formatsDescription}):

🚀 Puedes revisar la muestra completa interactiva y los copys aquí:
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
    });
  } catch (error: any) {
    console.error("[Lab Generar Muestra] Error en generación de muestra:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar la muestra para el cliente." },
      { status: 500 }
    );
  }
}
