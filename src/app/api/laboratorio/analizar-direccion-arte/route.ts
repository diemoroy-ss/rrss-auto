import { NextRequest, NextResponse } from "next/server";
import { decideArtDirection, ArtDirectionInput } from "../../../../lib/agents/agent-art-director";

export const maxDuration = 45; // Permitir tiempo para inspección de visión multimodal

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      imageUrl,
      productName,
      postObjective = "auto",
      price,
      rubro = "gastronomía",
      captionIdea,
    } = body;

    if (!productName && !imageUrl) {
      return NextResponse.json(
        { error: "Se requiere al menos un nombre de producto o una imagen para analizar." },
        { status: 400 }
      );
    }

    const input: ArtDirectionInput = {
      imageUrl,
      productName: productName || "Plato Principal",
      postObjective,
      price,
      rubro,
      captionIdea,
    };

    const decision = await decideArtDirection(input);

    return NextResponse.json({
      success: true,
      decision,
    });
  } catch (error: any) {
    console.error("[API AnalizarDireccionArte] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al analizar la dirección de arte.",
      },
      { status: 500 }
    );
  }
}
