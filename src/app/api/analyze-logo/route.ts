import { NextRequest, NextResponse } from "next/server";
import { generateFreeText } from "../../../lib/gemini-free";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { logoUrl, rubro = "General", businessDescription = "" } = body;

    if (!logoUrl || typeof logoUrl !== "string") {
      return NextResponse.json(
        { error: "logoUrl es requerido y debe ser un string." },
        { status: 400 }
      );
    }

    const sysInstruction = `Eres un experto en analisis visual y prompt engineering para modelos de generacion de imagen.
Tu tarea es analizar un logo empresarial y generar una descripcion textual detallada en INGLES que permita recrearlo con IA.

INSTRUCCIONES DE ANALISIS:
1. Describe la FORMA GEOMETRICA principal del logo (circular, rectangular, escudo, abstracta, etc.)
2. Describe los COLORES exactos usando terminos descriptivos (deep navy blue, warm crimson, forest green, etc.) — no uses hex codes.
3. Describe la TIPOGRAFIA si hay texto: estilo (sans-serif bold, serif italic), el texto literal que aparece, tamano relativo.
4. Describe los ELEMENTOS GRAFICOS: iconos, simbolos, figuras, lineas, patrones.
5. Describe el ESTILO VISUAL: minimalista, corporativo, vintage, moderno, geometrico, etc.
6. Describe la COMPOSICION: posicion de elementos entre si.

FORMATO DE SALIDA:
- Una sola descripcion en prosa, en INGLES, de 60 a 100 palabras.
- Debe estar escrita como si fuera parte de un prompt de imagen (descriptiva, especifica, sin listas).
- Empieza con la forma o elemento mas reconocible del logo.
- NO incluyas el nombre de la empresa a menos que aparezca como texto en el logo.
- NO uses palabras prohibidas: "4K", "8K", "masterpiece", "photorealistic", "ultra detailed".
- NO expliques que vas a hacer — responde DIRECTAMENTE con la descripcion.`;

    const userPrompt = `Analiza el logo de esta empresa:
Rubro: ${rubro}
Descripcion del negocio: ${businessDescription}

Genera la descripcion del logo para poder recrearlo con IA (responde solo con la descripcion en ingles, prosa de 60-100 palabras):`;

    const logoPrompt = await generateFreeText(
      userPrompt,
      sysInstruction,
      false,
      logoUrl,
      "logo-analysis"
    );

    return NextResponse.json({
      logoPrompt: logoPrompt.trim().replace(/^["']|["']$/g, ""),
    });
  } catch (error: any) {
    console.error("[API/analyze-logo] Error:", error);
    return NextResponse.json(
      { error: "Error analizando el logo.", detail: error.message },
      { status: 500 }
    );
  }
}

