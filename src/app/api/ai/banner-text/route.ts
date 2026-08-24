import { NextRequest, NextResponse } from "next/server";
import { generateBannerCopyWithAgent, BannerCopyResult } from "../../../../lib/agents/agent-banner-copy";
import { composeBannerOnImage } from "../../../../lib/banner-compositor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "generate_text",
      idea,
      rubro = "General",
      businessName = "",
      businessDescription = "",
      promotions = "",
      customOffer = "",
      aspectRatio = "1:1",
      baseImageUrl,
      bannerCopy,
      logoUrl,
      userId = "system",
      includeLogo = true
    } = body;

    // 1. Solo generar los micro-copys publicitarios (Titular, Badge, Beneficio, Colores)
    if (action === "generate_text") {
      if (!idea && !promotions && !customOffer) {
        return NextResponse.json(
          { error: "Se requiere al menos una idea o promoción para generar los textos del cartel." },
          { status: 400 }
        );
      }

      const generatedCopy = await generateBannerCopyWithAgent({
        idea: idea || "Promoción Especial",
        rubro,
        businessName,
        businessDescription,
        promotions,
        customOffer,
        aspectRatio
      });

      return NextResponse.json({ bannerCopy: generatedCopy });
    }

    // 2. Estampar los textos (ya generados o editados) sobre la imagen base
    if (action === "compose_banner") {
      if (!baseImageUrl || !bannerCopy) {
        return NextResponse.json(
          { error: "Se requiere la URL de la imagen base y los textos del banner." },
          { status: 400 }
        );
      }

      const finalImageUrl = await composeBannerOnImage({
        baseImageUrl,
        bannerCopy,
        logoUrl,
        userId,
        aspectRatio,
        includeLogo
      });

      return NextResponse.json({ finalImageUrl });
    }

    // 3. Todo en uno: generar los textos y estamparlos sobre la imagen de inmediato
    if (action === "generate_and_compose") {
      if (!baseImageUrl) {
        return NextResponse.json(
          { error: "Se requiere la URL de la imagen base." },
          { status: 400 }
        );
      }

      const generatedCopy = await generateBannerCopyWithAgent({
        idea: idea || "Promoción Especial",
        rubro,
        businessName,
        businessDescription,
        promotions,
        customOffer,
        aspectRatio
      });

      const finalImageUrl = await composeBannerOnImage({
        baseImageUrl,
        bannerCopy: generatedCopy,
        logoUrl,
        userId,
        aspectRatio,
        includeLogo
      });

      return NextResponse.json({
        bannerCopy: generatedCopy,
        finalImageUrl
      });
    }

    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (error: any) {
    console.error("[API banner-text] Error procesando solicitud:", error);
    return NextResponse.json({ error: error.message || "Error procesando el banner." }, { status: 500 });
  }
}
