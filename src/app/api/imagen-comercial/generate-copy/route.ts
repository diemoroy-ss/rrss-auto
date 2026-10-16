import { NextRequest, NextResponse } from "next/server";
import { generateCopyWithAgent } from "../../../../lib/agents/agent-copy";
import { adminAuth } from "../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (token && adminAuth) {
      try {
        await adminAuth.verifyIdToken(token);
      } catch (e) {
        // Token auth optional for internal convenience
      }
    }

    const body = await req.json();
    const { slides = [], prompt = "", targetProfile = null, networks = ["instagram", "facebook"] } = body;

    // Extraer todos los textos de las capas en las diapositivas
    const allSlideTexts: string[] = [];
    slides.forEach((s: any, idx: number) => {
      if (Array.isArray(s.textLayers) && s.textLayers.length > 0) {
        const slideContent = s.textLayers.map((l: any) => l.text).filter(Boolean).join(" | ");
        if (slideContent) {
          allSlideTexts.push(`[Diapositiva ${idx + 1}]: ${slideContent}`);
        }
      }
    });

    const combinedIdea = `
Diseño de Imagen Comercial para Redes Sociales.
${slides.length > 1 ? `Carrusel de ${slides.length} diapositivas.` : "Post comercial individual."}
Textos estampados en el diseño visual:
${allSlideTexts.length > 0 ? allSlideTexts.join("\n") : "Promoción comercial de producto o servicio"}

Concepto visual base:
${prompt || "Publicación comercial con propuesta de valor clara y atractiva"}
    `.trim();

    const copy = await generateCopyWithAgent({
      idea: combinedIdea,
      targetProfile: targetProfile || {
        rubro: "General",
        businessName: "",
      },
    });

    return NextResponse.json({ success: true, copy });
  } catch (error: any) {
    console.error("[imagen-comercial/generate-copy] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar copy con nuestros agentes." },
      { status: 500 }
    );
  }
}
