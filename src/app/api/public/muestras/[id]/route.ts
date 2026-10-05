import { NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const demoId = params?.id;
    if (!demoId) {
      return NextResponse.json({ error: "Falta id de muestra" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Servicio de base de datos no disponible" }, { status: 500 });
    }

    const docSnap = await adminDb.collection("admin_prospect_demos").doc(demoId).get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Muestra no encontrada" }, { status: 404 });
    }

    const data = docSnap.data() || {};

    let isoDate: string | null = null;
    if (data.createdAt?.toDate) {
      isoDate = data.createdAt.toDate().toISOString();
    } else if (data.createdAt instanceof Date) {
      isoDate = data.createdAt.toISOString();
    } else if (typeof data.createdAt === "string") {
      isoDate = data.createdAt;
    }

    let plans: Record<string, any> | null = null;
    try {
      const plansDoc = await adminDb.collection("system_config").doc("plans").get();
      if (plansDoc.exists) {
        plans = plansDoc.data() || null;
      }
    } catch (plansErr) {
      console.warn("[API Public Muestras] Warning loading plans config:", plansErr);
    }

    return NextResponse.json({
      success: true,
      demo: {
        id: docSnap.id,
        prospectName: data.prospectName || "",
        prospectBusiness: data.prospectBusiness || "Tu Negocio",
        prospectPhone: data.prospectPhone || "",
        rubro: data.rubro || "Comercial",
        offerText: data.offerText || "",
        dishOrProductName: data.dishOrProductName || "",
        badgeCustomText: data.badgeCustomText || "",
        generatedPostCaption: data.generatedPostCaption || data.postCaption || "",
        generatedImageUrl: data.generatedImageUrl || "",
        generatedVideoUrl: data.generatedVideoUrl || "",
        remotionComposition: data.remotionComposition || null,
        videoStyleTitle: data.videoStyleTitle || "",
        videoPromptEnglish: data.videoPromptEnglish || "",
        logoUrl: data.logoUrl || "",
        selectedStyleTitle: data.selectedStyleTitle || "Estándar Comercial",
        createdAt: isoDate,
        publications: Array.isArray(data.publications) ? data.publications : [],
      },
      plans,
    });
  } catch (err: any) {
    console.error("[API Public Muestras Error]:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
