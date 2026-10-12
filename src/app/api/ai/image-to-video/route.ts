import { NextRequest, NextResponse } from "next/server";
import { generatePremiumVideoWithAgent } from "../../../../lib/agents/agent-video-premium";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { 
  getVideoQuotaUsageAdmin, 
  getAiPlanLimitAdmin, 
  isAdminAdmin, 
  logAiGenerationAdmin 
} from "../../../../lib/quota-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    let effectiveUserId = "system";
    let userEmail = "";
    let userPlan = "free";

    if (authHeader?.startsWith("Bearer ") && adminAuth) {
      try {
        const token = authHeader.split("Bearer ")[1];
        const decoded = await adminAuth.verifyIdToken(token);
        effectiveUserId = decoded.uid;
        userEmail = decoded.email || "";

        if (adminDb) {
          const userDoc = await adminDb.collection("users").doc(effectiveUserId).get();
          if (userDoc.exists) {
            userPlan = userDoc.data()?.plan || "free";
          }
        }
      } catch (authErr) {
        console.warn("[API /ai/image-to-video] Token verification notice:", authErr);
      }
    }

    const body = await req.json();
    const {
      imageUrl,
      prompt,
      motionStyle = "cinematic_slow_push_in",
      businessName = "",
      rubro = "General",
      renderMode = "raw",
      postId = `vid_${Date.now()}`,
      showWatermark = false,
      logoUrl = "",
      profileId = "default",
      userId: reqUserId
    } = body;

    const finalUserId = reqUserId || effectiveUserId;

    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "La URL de la imagen base (imageUrl) es requerida y debe ser válida para animar el video." },
        { status: 400 }
      );
    }

    // Verificación de cuota de video
    const isAdmin = isAdminAdmin(userEmail);
    if (!isAdmin && effectiveUserId !== "system") {
      const [limit, used] = await Promise.all([
        getAiPlanLimitAdmin(userPlan, "video", userEmail),
        getVideoQuotaUsageAdmin(effectiveUserId)
      ]);

      if (used >= limit) {
        return NextResponse.json(
          { 
            error: "Has alcanzado el límite mensual de videos generado con nuestros agentes para tu plan.",
            quotaExceeded: true,
            used,
            limit
          },
          { status: 403 }
        );
      }
    }

    console.log(`[API /ai/image-to-video] Procesando generación de video para usuario ${finalUserId}. RenderMode: ${renderMode}, MotionStyle: ${motionStyle}`);

    const videoUrl = await generatePremiumVideoWithAgent({
      postId,
      idea: prompt || `Video publicitario para ${businessName || rubro}`,
      imageUrl,
      promptOverride: prompt,
      motionStyle,
      renderMode: renderMode === "remotion" ? "remotion" : "raw",
      rubro,
      businessName,
      logoUrl,
      showWatermark,
      userId: finalUserId,
    });

    // Registrar consumo en cuota
    if (finalUserId && finalUserId !== "system") {
      await logAiGenerationAdmin(finalUserId, profileId, "video", {
        prompt,
        motionStyle,
        imageUrl,
        videoUrl,
        renderMode
      }).catch(err => console.warn("Error logging video generation quota:", err));
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      renderMode: renderMode === "remotion" ? "remotion" : "raw",
      motionStyle,
      postId,
    });
  } catch (err: any) {
    console.error("[API /ai/image-to-video] Error generando video vía webhook:", err);
    return NextResponse.json(
      { error: err.message || "Error al procesar el video con nuestros agentes." },
      { status: 500 }
    );
  }
}
