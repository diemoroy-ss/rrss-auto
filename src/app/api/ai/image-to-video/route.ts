import { NextRequest, NextResponse } from "next/server";
import { generatePremiumVideoWithAgent } from "../../../../lib/agents/agent-video-premium";

export async function POST(req: NextRequest) {
  try {
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
      userId = "system",
    } = body;

    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "La URL de la imagen base (imageUrl) es requerida y debe ser válida para animar el video." },
        { status: 400 }
      );
    }

    console.log(`[API /ai/image-to-video] Solicitud recibida. RenderMode: ${renderMode}, MotionStyle: ${motionStyle}`);

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
      userId,
    });

    return NextResponse.json({
      success: true,
      videoUrl,
      renderMode: renderMode === "remotion" ? "remotion" : "raw",
      motionStyle,
      postId,
    });
  } catch (err: any) {
    console.error("[API /ai/image-to-video] Error generando video vía n8n:", err);
    return NextResponse.json(
      { error: err.message || "Error al procesar el video con nuestros agentes en n8n." },
      { status: 500 }
    );
  }
}
