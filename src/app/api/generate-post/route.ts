import { NextRequest, NextResponse } from "next/server";
import { getFreeModel } from "../../../lib/gemini-free";

export async function POST(req: NextRequest) {
  try {
    const { rubro, promo, demoType = 'rrss', nombre, email } = await req.json();
    if (!rubro || !promo) {
      return NextResponse.json({ error: "Faltan parámetros rubro o promo" }, { status: 400 });
    }

    let systemInstruction = "";
    let prompt = "";

    if (demoType === 'blog') {
        systemInstruction = `Eres un experto SEO y copywriter. 
Crea un esquema corto y atractivo (outline) para un artículo de Blog SEO. 
Debe tener un título H1 persuasivo, y 3 subtítulos H2 sobre el tema. 
Mantén la extensión total por debajo de 150 palabras. Formatea en texto plano o Markdown básico.
Responde únicamente con el esquema. NO incluyas introducciones innecesarias.`;
        prompt = `Crea un esquema de artículo SEO para un negocio de: ${rubro}.\nEl tema central a posicionar es: ${promo}.`;
    } else {
        systemInstruction = `Eres un experto copywriter de marketing digital para redes sociales en negocios latinoamericanos.
Crea posts de alta calidad en español con emojis apropiados, copy sumamente persuasivo y exactamente 5 hashtags estratégicos.
Mantén la extensión total por debajo de 200 palabras.
Responde únicamente con el post resultante. NO incluyas introducciones, títulos, explicaciones ni etiquetas markdown de código.`;
        prompt = `Crea un post promocional para Instagram/Facebook para un negocio de: ${rubro}.\nEl tema o promoción a destacar es: ${promo}.`;
    }

    console.log(`[generate-post] Generando ${demoType} para Rubro: ${rubro}, Promo: ${promo}`);
    
    const model = getFreeModel(undefined, systemInstruction);
    const result = await model.generateContent(prompt);
    
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!text) {
      throw new Error("No se pudo obtener una respuesta válida del modelo de IA.");
    }

    // Enviar webhook de lead/demo a n8n de manera asíncrona para que le llegue el correo electrónico
    if (email) {
      const webhookUrl = process.env.NODE_ENV === 'production' 
        ? 'https://n8n.santisoft.cl/webhook/demo-ia'
        : 'https://n8n.santisoft.cl/webhook-test/demo-ia';

      console.log(`[generate-post] Enviando webhook de lead a n8n: ${webhookUrl} para ${email}`);
      
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre || "Lead Anónimo",
          email: email,
          rubro: rubro,
          promo: promo,
          demoType: demoType,
          generatedText: text,
          isLead: true,
          date: new Date().toISOString()
        })
      }).catch(err => {
        console.error("[generate-post n8n webhook error]:", err);
      });
    }

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[generate-post error]:", err);
    return NextResponse.json({ error: err.message || "Error al generar el post" }, { status: 500 });
  }
}
