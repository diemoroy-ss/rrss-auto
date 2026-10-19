import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { composeCommercialSlideWithEditor } from "../../../../lib/real-product-compositor";

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
      productName = "Producto Destacado",
      productDescription = "",
      price = "",
      customBadgeText = "",
      aspectRatio = "1:1",
      logoUrl = "",
      businessName = "Tu Negocio",
      rubro = "Comercio",
    } = body;

    if (!baseImageUrl) {
      return NextResponse.json(
        { error: "Se requiere la URL de la imagen base para renderizar el cartel." },
        { status: 400 }
      );
    }

    console.log(`[Renderizar Cartel] Renderizando afiche publicitario para Demo #${demoId || "nueva"} - Pub #${pubIndex + 1} ("${productName}")...`);

    const composed = await composeCommercialSlideWithEditor({
      baseImageUrl,
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
            publications[pubIndex] = {
              ...publications[pubIndex],
              imageUrl: composed.finalImageUrl,
              isCommercialPoster: true,
              ...(composed.editDocId ? { commercialEditId: composed.editDocId } : {}),
            };

            await docRef.update({
              publications,
              ...(pubIndex === 0 ? { generatedImageUrl: composed.finalImageUrl } : {}),
              updatedAt: new Date(),
            });
            console.log(`[Renderizar Cartel] ✅ Documento #${demoId} actualizado en Firestore con la nueva imagen renderizada.`);
          }
        }
      } catch (dbErr) {
        console.warn("[Renderizar Cartel] Error actualizando demo en Firestore:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: composed.finalImageUrl,
      editDocId: composed.editDocId,
    });
  } catch (error: any) {
    console.error("[Renderizar Cartel] ❌ Error renderizando cartel publicitario:", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo renderizar el cartel publicitario." },
      { status: 500 }
    );
  }
}
