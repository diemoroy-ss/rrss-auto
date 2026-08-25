import { NextRequest, NextResponse } from "next/server";
import { generateFreeText } from "../../../../lib/gemini-free";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { idea, imageExpectation, businessType, type, carouselCount, regenerate, catalogoItem } = body;
 
        if (!idea) {
            return NextResponse.json({ error: "La idea principal es requerida" }, { status: 400 });
        }

        // Build product/service context string if catalogoItem is provided
        const productContext = catalogoItem?.name
            ? `\nFeatured product/service: "${catalogoItem.name}"${catalogoItem.description ? ` — ${catalogoItem.description}` : ""}.${catalogoItem.imageUrl ? " HE ADJUNTADO LA FOTO DE ESTE PRODUCTO/SERVICIO COMO IMAGEN DE REFERENCIA. Tu prompt DEBE incluir una descripción ultra-detallada de los elementos físicos, colores y textura de la imagen adjunta para que el generador DALL-E la recree con alta fidelidad." : " Incorporate this product/service as the visual and conceptual center of the image."}`
            : "";
 
        const bananaRules = `
LA REGLA DE LOS 7 COMPONENTES (OBLIGATORIA PARA PROMPTS EN INGLÉS):
Todo prompt para generador de imágenes DEBE construirse como prosa narrativa fluida de 100 a 150 palabras integrando estos 7 elementos:
1. Subject: Quién o qué es (rasgos físicos, vestimenta).
2. Style: Tipo de imagen (fotografía, ilustración, render 3D).
3. Environment: Dónde sucede, clima, época del año.
4. Lighting: Tipo de luz, dirección, atmósfera, color.
5. Action: Qué está pasando (verbos en tiempo presente).
6. Camera: Ángulo, tipo de lente, profundidad de campo.
7. Texture: Detalles táctiles (piel porosa, metal brillante, madera desgastada).

PROHIBICIONES ESTRICTAS:
- NO uses listas separadas por comas. Usa narrativa lineal.
- NO uses palabras baneadas: "4K", "8K", "masterpiece", "highly detailed", "ultra detailed", "trending on ArtStation", "hyperrealistic", "photorealistic", "best quality", "award-winning". Descríbelo con palabras reales.
- NO incluyas textos literales en el prompt de la imagen (la IA de imagen no escribe bien).`;

        let systemInstruction = "";
        let promptContent = "";

        if (type === 'Carrusel') {
            systemInstruction = `Eres un experto Director de Arte. Tu misión es generar una lista estructurada en JSON puro que contenga EXACTAMENTE ${carouselCount || 3} escenas secuenciales coherentes.
Debes retornar un objeto JSON con la siguiente estructura exacta:
{
  "prompts_english": ["Instrucción detallada de imagen 1 en INGLÉS para Midjourney/DALL-E 3 sin textos", "..."],
  "prompts_spanish": ["Explicación sencilla y hermosa en ESPAÑOL de lo que se verá en la imagen 1", "..."]
}

${bananaRules}

REGLAS ADICIONALES PARA CARRUSEL:
1. Asegura coherencia de Estilo Visual (Style) e Iluminación (Lighting) entre todas las imágenes de la secuencia.
2. NO incluyas introducciones ni comillas invertidas markdown, solo el JSON puro.`;

            promptContent = `Idea del Carrusel: ${idea}
Rubro del Negocio: ${businessType || "General"}
Expectativa Visual del Cliente: ${imageExpectation || "Estilo libre, profesional y moderno"}${productContext}`;

        } else if (type === 'Reel') {
            systemInstruction = `Eres un experto Director de Arte y Guionista de Redes Sociales.
Tu tarea es analizar la idea del post y retornar un objeto JSON con la estructura exacta indicada a continuación:
{
  "prompt_english": "Prompt altamente detallado en INGLÉS para la imagen inicial usando la REGLA DE LOS 7 COMPONENTES. Formato vertical (9:16).",
  "prompt_spanish": "Una descripción clara y concisa en ESPAÑOL de lo que se verá en la imagen de portada para que el cliente la entienda.",
  "video_prompt": "Un prompt de animación en INGLÉS para un generador de Image-to-Video (como Runway o Luma). Describe el movimiento de la cámara, luces y efectos cinemáticos, partiendo desde la imagen inicial generada.",
  "voiceover_script": "Un guion de locución corto y persuasivo en ESPAÑOL de exactamente 15 a 20 palabras (ideal para un Reel de 8-10 segundos)."
}

${bananaRules}

REGLAS IMPORTANTES:
1. NO incluyas introducciones ni comillas invertidas markdown, solo el JSON puro.`;

            promptContent = `Idea del Reel: ${idea}
Rubro del Negocio: ${businessType || "General"}
Expectativa Visual del Cliente: ${imageExpectation || "Estilo libre, profesional y moderno"}${productContext}`;

        } else {
            // Post / Historia (Single Image)
            systemInstruction = `Eres un experto Director de Arte y Diseñador Gráfico.
Tu tarea es generar un prompt de imagen y su explicación en base a la idea de post y las expectativas del cliente.
Debes retornar un objeto JSON con la estructura exacta indicada a continuación:
{
  "prompt_english": "Un prompt de imagen narrativo y altamente detallado en INGLÉS que cumple estrictamente la REGLA DE LOS 7 COMPONENTES.",
  "prompt_spanish": "Una explicación sencilla, clara y atractiva en ESPAÑOL de lo que representará la imagen para que el cliente la entienda."
}

${bananaRules}

REGLAS IMPORTANTES:
1. NO incluyas introducciones ni comillas invertidas markdown, solo el JSON puro.`;

            promptContent = `Idea del Post: ${idea}
Rubro del Negocio: ${businessType || "General"}
Expectativa Visual del Cliente: ${imageExpectation || "Estilo libre, profesional y moderno"}${productContext}`;
        }

        console.log(`[GENERATE-PROMPT] Generating prompts for type: ${type} (regenerate: ${!!regenerate})${catalogoItem ? ` | Product: ${catalogoItem.name}` : ""}`);
        
        if (regenerate) {
            systemInstruction += `\n\n¡IMPORTANTE!: Este es un reintento del usuario porque no le gustó la propuesta anterior. Por favor, genera un concepto/metáfora visual COMPLETAMENTE DIFERENTE al estándar, proponiendo un enfoque visual muy creativo, variando los elementos principales y la paleta de colores de forma innovadora.`;
        }

        const text = await generateFreeText(
            promptContent, 
            systemInstruction, 
            true, 
            catalogoItem?.imageUrl, 
            "generate_image_prompt"
        );

        // Clean JSON formatting from Gemini response
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error("No se pudo generar una respuesta JSON válida desde el modelo de IA.");
        }

        const parsedResult = JSON.parse(jsonMatch[0]);

        return NextResponse.json({
            success: true,
            data: parsedResult
        });

    } catch (error: any) {
        console.error("Error in generate-prompt API:", error);
        return NextResponse.json({ error: "Fallo al generar el prompt de la IA. Por favor reintenta.", details: error.message }, { status: 500 });
    }
}
