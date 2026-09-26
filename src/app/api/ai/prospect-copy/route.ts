import { NextRequest, NextResponse } from "next/server";
import { generateFreeText } from "../../../../lib/gemini-free";
import { sanitizeInput } from "../../../../lib/security";

export const maxDuration = 45;

/**
 * Endpoint para redactar copys de alta conversión y 100% humanizados
 * para el Generador de Muestras Comerciales.
 * Nuestros agentes adaptan el texto al plato, producto o servicio específico del cliente.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessName = "",
      rubro = "Comercial",
      dishOrProductName = "",
      offerText = "",
      phone = "",
    } = body;

    const safeBusinessName = sanitizeInput(businessName.trim() || "tu negocio");
    const safeDish = sanitizeInput(dishOrProductName.trim());
    const safeOffer = sanitizeInput(offerText.trim());
    const safeRubro = sanitizeInput(rubro.trim());
    const safePhone = sanitizeInput(phone.trim());

    const itemLabel = safeDish || "nuestra especialidad";

    const systemInstruction = `Eres un Copywriter senior de respuesta directa y community manager estratega. Tu función es redactar copys persuasivos, magnéticos y 100% humanizados para publicaciones en redes sociales (Instagram, Facebook y TikTok) enfocados en un producto estrella o plato específico de un negocio local.

REGLAS DE ORO DE HUMANIZACIÓN (INQUEBRANTABLES):
1. Tono 100% natural, directo ("tú a tú"), fresco y conversacional, como si le hablaras a un amigo o cliente con un café en la mano.
2. CERO muletillas o clichés de IA: Queda estrictamente PROHIBIDO usar expresiones como:
   - "En el vertiginoso mundo actual"
   - "En conclusión" / "En resumen"
   - "Desbloquea el potencial" / "Desata"
   - "Sumérgete en" / "Adéntrate"
   - "Descubre cómo" / "No te pierdas la oportunidad"
   - "Eleva tu experiencia" / "Un deleite para tus sentidos"
   - "El secreto mejor guardado"
3. TERMINOLOGÍA DE AGENTES: NUNCA menciones "IA" ni "Inteligencia Artificial". Si hiciera falta referirte al trabajo técnico o automatizado, habla de "nuestros agentes" o "nuestro equipo de agentes especializados".
4. ESTRUCTURA DEL COPY:
   - Gancho inicial atrapante (Hook de 1 a 2 líneas directas, sin rodeos, enfocado en el antojo o necesidad del plato/producto).
   - Desarrollo sensorial / beneficio tangible (detalles reales de sabor, textura, frescura, calidad o alivio que entrega el producto).
   - Si se especifica una oferta, menciónala de forma natural e irresistible.
   - Llamado a la acción (CTA) directo: invita a escribir por WhatsApp o visitarnos.
   - Si se proporciona número de contacto, inclúyelo de manera natural al cierre.
   - 3 a 5 hashtags estratégicos locales y del nicho al final.
5. FORMATO DE SALIDA:
   - Retorna ÚNICAMENTE el texto final del copy listo para publicar.
   - NO incluyas introducciones como "Aquí tienes el copy:", ni comillas al inicio o final, ni bloques de código markdown (\`\`\`).`;

    const userPrompt = `Redacta un post para redes sociales con los siguientes datos:
- Negocio: ${safeBusinessName}
- Rubro: ${safeRubro}
- Plato / Producto o Especialidad: ${itemLabel}
${safeOffer ? `- Oferta / Promoción: ${safeOffer}` : ""}
${safePhone ? `- WhatsApp de Contacto: ${safePhone}` : ""}

Escribe el copy completo listo para publicar:`;

    let generatedCopy = "";

    try {
      const rawText = await generateFreeText(userPrompt, systemInstruction, false);
      if (rawText && rawText.trim().length > 20) {
        // Limpiar comillas extras si vinieron del modelo
        generatedCopy = rawText
          .replace(/^```[a-z]*\n?/i, "")
          .replace(/\n?```$/i, "")
          .replace(/^["']+|["']+$/g, "")
          .trim();
      }
    } catch (agentErr: any) {
      console.warn("[prospect-copy] Fallback en llamada a modelo:", agentErr?.message || agentErr);
    }

    // Fallback humanizado de respaldo de alta calidad si el modelo no estuviese disponible
    if (!generatedCopy) {
      const contactLine = safePhone ? `\n\n📲 Pídelo directo al WhatsApp: ${safePhone}` : "\n\n📲 Escríbenos por mensaje directo para coordinar tu pedido.";
      const offerLine = safeOffer ? `\n\n🔥 Aprovecha hoy: ${safeOffer}.` : "";
      const hashtagRubro = safeRubro.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, "");
      const hashtagDish = safeDish ? `#${safeDish.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, "")}` : "";

      generatedCopy = `Si todavía no pruebas nuestro ${itemLabel}, no sabes de lo que te estás perdiendo.${offerLine}

En ${safeBusinessName} lo preparamos en su punto exacto, con ingredientes seleccionados y todo el cariño para que cada bocado o experiencia valga totalmente la pena.${contactLine}

¡Te esperamos! 🙌

#${hashtagRubro || "calidad"} ${hashtagDish} #${safeBusinessName.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, "")} #imperdible #calidadgarantizada`.trim();
    }

    return NextResponse.json({
      success: true,
      copy: generatedCopy,
      dishOrProductName: safeDish,
    });
  } catch (error: any) {
    console.error("[prospect-copy API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Error al generar copy con agentes" },
      { status: 500 }
    );
  }
}
