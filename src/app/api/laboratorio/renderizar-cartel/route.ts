import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { composeCommercialSlideWithEditor } from "../../../../lib/real-product-compositor";
import { DEFAULT_TEXT_TEMPLATES } from "../../../../lib/text-templates";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    let uid = "vendedor";
    if (authHeader?.startsWith("Bearer ") && adminAuth) {
      try {
        const token = authHeader.split("Bearer ")[1];
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch (authErr) {
        console.warn("[Renderizar Cartel] Token no verificado:", authErr);
      }
    }

    const body = await req.json();
    const {
      demoId,
      pubIndex = 0,
      baseImageUrl,
      fallbackImageUrl = "",
      productName = "Producto Destacado",
      productDescription = "",
      price = "",
      customBadgeText = "",
      aspectRatio = "1:1",
      logoUrl = "",
      businessName = "Tu Negocio",
      rubro = "Comercio",
      templateId = "",
      currentTemplateId = "",
    } = body;

    if (!baseImageUrl) {
      return NextResponse.json(
        { error: "Se requiere la URL de la imagen base para renderizar el cartel." },
        { status: 400 }
      );
    }

    // Seleccionar una plantilla al azar de DEFAULT_TEXT_TEMPLATES (evitando repetir la actual si se re-renderiza)
    let chosenTemplateId = templateId;
    if (!chosenTemplateId) {
      const candidates = DEFAULT_TEXT_TEMPLATES.filter((t) => t.id !== currentTemplateId);
      const pool = candidates.length > 0 ? candidates : DEFAULT_TEXT_TEMPLATES;
      const randomTpl = pool[Math.floor(Math.random() * pool.length)];
      chosenTemplateId = randomTpl?.id || DEFAULT_TEXT_TEMPLATES[0].id;
    }

    // Si existe demo en Firestore, recuperar baseImageUrl limpia original de esa publicación para no sobre-estampar texto sobre texto
    let cleanSourceImageUrl = baseImageUrl;
    if (demoId && adminDb) {
      try {
        const existingSnap = await adminDb.collection("admin_prospect_demos").doc(demoId).get();
        if (existingSnap.exists) {
          const existingData = existingSnap.data();
          const pubItem = existingData?.publications?.[pubIndex];
          if (pubItem?.baseImageUrl && typeof pubItem.baseImageUrl === "string" && pubItem.baseImageUrl.startsWith("http")) {
            cleanSourceImageUrl = pubItem.baseImageUrl;
          }
        }
      } catch {
        // continuar con baseImageUrl enviado
      }
    }

    console.log(
      `[Renderizar Cartel] Renderizando Demo #${demoId || "nueva"} - Pub #${pubIndex + 1} ("${productName}") con plantilla "${chosenTemplateId}"...`
    );

    const composed = await composeCommercialSlideWithEditor({
      baseImageUrl: cleanSourceImageUrl,
      fallbackImageUrl: fallbackImageUrl || baseImageUrl,
      productName: productName.trim(),
      productDescription: productDescription.trim(),
      price: price.trim(),
      customBadgeText: customBadgeText.trim(),
      businessName: businessName.trim(),
      rubro,
      aspectRatio: aspectRatio === "9:16" ? "9:16" : "1:1",
      logoUrl: logoUrl || undefined,
      userId: uid,
      includeLogo: Boolean(logoUrl),
      saveEditableInLibrary: true,
      skipAgentCopy: true,
      templateId: chosenTemplateId,
    });

    // Actualizar Firestore para que la Landing pública refleje el cartel renderizado de inmediato
    if (demoId && adminDb) {
      try {
        const docRef = adminDb.collection("admin_prospect_demos").doc(demoId);
        const snap = await docRef.get();
        if (snap.exists) {
          const data = snap.data();
          const publications = Array.isArray(data?.publications) ? [...data.publications] : [];
          if (publications[pubIndex]) {
            const targetPub = publications[pubIndex];
            const isCarousel = targetPub.type === "carrusel";
            const updatedCarousel =
              isCarousel && Array.isArray(targetPub.carouselImages) && targetPub.carouselImages.length > 0
                ? [composed.finalImageUrl, ...targetPub.carouselImages.slice(1)]
                : targetPub.carouselImages;

            publications[pubIndex] = {
              ...targetPub,
              imageUrl: composed.finalImageUrl,
              baseImageUrl: cleanSourceImageUrl,
              isCommercialPoster: true,
              textTemplateId: composed.templateId,
              textTemplateName: composed.templateName,
              ...(isCarousel ? { carouselImages: updatedCarousel } : {}),
              ...(composed.editDocId ? { commercialEditId: composed.editDocId } : {}),
            };

            await docRef.update({
              publications,
              ...(pubIndex === 0 ? { generatedImageUrl: composed.finalImageUrl } : {}),
              updatedAt: new Date(),
            });
            console.log(`[Renderizar Cartel] ✅ Documento #${demoId} actualizado con plantilla "${composed.templateName}".`);
          }
        }
      } catch (dbErr) {
        console.warn("[Renderizar Cartel] Error actualizando demo en Firestore:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: composed.finalImageUrl,
      baseImageUrl: cleanSourceImageUrl,
      editDocId: composed.editDocId,
      templateId: composed.templateId,
      templateName: composed.templateName,
    });
  } catch (error: any) {
    console.error("[Renderizar Cartel] ❌ Error renderizando cartel publicitario:", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo renderizar el cartel publicitario." },
      { status: 500 }
    );
  }
}
