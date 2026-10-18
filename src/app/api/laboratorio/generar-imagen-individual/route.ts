import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Invoca el webhook de n8n para UNA SOLA IMAGEN de forma individual
async function generateSingleImageWebhook(
  promptEnglish: string,
  rubro: string,
  productName: string,
  aspectRatio: "1:1" | "9:16" = "1:1"
): Promise<string> {
  const width = aspectRatio === "9:16" ? 720 : 1080;
  const height = aspectRatio === "9:16" ? 1280 : 1080;
  const seed = Math.floor(Math.random() * 1000000);

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
      signal: AbortSignal.timeout(20000), // Hasta 20s para una sola imagen individual
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
  } catch (err) {
    console.warn("[Generar Imagen Individual] Webhook de n8n demoró o falló, usando Flux:", err);
  }

  // Fallback a Flux (Pollinations)
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
    } = body;

    if (!promptEnglish && !productName) {
      return NextResponse.json(
        { error: "Se requiere prompt o nombre de producto para generar la imagen." },
        { status: 400 }
      );
    }

    console.log(`[Generar Imagen Individual] Solicitando imagen 1-a-1 para pub #${pubIndex + 1} ("${productName}" en ${rubro})...`);

    // Llamar al webhook para ESTA SOLA IMAGEN
    const effectivePrompt = promptEnglish || `Commercial advertising photography of ${productName}, premium studio lighting, 8k resolution`;
    const baseRawImageUrl = await generateSingleImageWebhook(
      effectivePrompt,
      rubro,
      productName,
      aspectRatio === "9:16" ? "9:16" : "1:1"
    );

    let finalComposedUrl = baseRawImageUrl;
    let commercialEditId: string | undefined;

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
          if (shouldComposeCommercial) {
            try {
              const { composeCommercialSlideWithEditor } = await import("../../../../lib/real-product-compositor");
              const composed = await composeCommercialSlideWithEditor({
                baseImageUrl: baseRawImageUrl,
                productName: productName || targetPub.dishOrProductName || "Producto",
                productDescription: productDescription || targetPub.description || targetPub.title || "",
                price: price || targetPub.productPrice || "",
                idea: idea || targetPub.hook || targetPub.title || "",
                rubro: rubro || demoData?.rubro || "Comercio",
                businessName: businessName || demoData?.businessName || "Negocio",
                aspectRatio: aspectRatio === "9:16" ? "9:16" : "1:1",
                logoUrl: logoUrl || demoData?.logoUrl || undefined,
                userId: uid,
                includeLogo: Boolean(logoUrl || demoData?.logoUrl),
                saveEditableInLibrary: true,
                customBadgeText: customBadgeText || targetPub.badgeCustomText || "",
              });
              finalComposedUrl = composed.finalImageUrl;
              commercialEditId = composed.editDocId;
            } catch (cErr) {
              console.warn("[Generar Imagen Individual] Error componiendo texto comercial con editor:", cErr);
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
              ...(isCarousel ? { carouselImages: updatedCarouselImages } : {}),
              ...(commercialEditId ? { commercialEditId } : {}),
            };
            await docRef.update({
              publications,
              ...(pubIndex === 0 ? { generatedImageUrl: finalComposedUrl } : {}),
            });
            console.log(`[Generar Imagen Individual] Muestra ${demoId} actualizada en Firestore con nueva imagen en pub #${pubIndex + 1}.`);
          }
        }
      } catch (dbErr) {
        console.warn("[Generar Imagen Individual] Error actualizando Firestore (no bloqueante):", dbErr);
      }
    } else if (isCommercialPoster) {
      try {
        const { composeCommercialSlideWithEditor } = await import("../../../../lib/real-product-compositor");
        const composed = await composeCommercialSlideWithEditor({
          baseImageUrl: baseRawImageUrl,
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
        });
        finalComposedUrl = composed.finalImageUrl;
      } catch (cErr) {
        console.warn("[Generar Imagen Individual] Error componiendo texto comercial:", cErr);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalComposedUrl,
      baseImageUrl: baseRawImageUrl,
      pubIndex,
    });
  } catch (error: any) {
    console.error("[Generar Imagen Individual] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar la imagen individual con nuestros agentes." },
      { status: 500 }
    );
  }
}
