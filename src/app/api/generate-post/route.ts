import { NextRequest, NextResponse } from "next/server";
import { getFreeModel } from "../../../lib/gemini-free";

export async function POST(req: NextRequest) {
  try {
    const { rubro, promo } = await req.json();
    if (!rubro || !promo) {
      return NextResponse.json({ error: "Faltan parámetros rubro o promo" }, { status: 400 });
    }

    const systemInstruction = `Eres un experto copywriter de marketing digital para redes sociales en negocios latinoamericanos.
Crea posts de alta calidad en español con emojis apropiados, copy sumamente persuasivo y exactamente 5 hashtags estratégicos.
Mantén la extensión total por debajo de 200 palabras.
Responde únicamente con el post resultante. NO incluyas introducciones, títulos, explicaciones ni etiquetas markdown de código.`;

    console.log(`[generate-post] Generando post para Rubro: ${rubro}, Promo: ${promo}`);
    
    const model = getFreeModel(undefined, systemInstruction);
    const result = await model.generateContent(
      `Crea un post promocional para Instagram/Facebook para un negocio de: ${rubro}.\nEl tema o promoción a destacar es: ${promo}.`
    );
    
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!text) {
      throw new Error("No se pudo obtener una respuesta válida del modelo de IA.");
    }

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[generate-post error]:", err);
    return NextResponse.json({ error: err.message || "Error al generar el post" }, { status: 500 });
  }
}
