import { generateFreeText } from "../gemini-free";

export interface ProductVisualAnalysis {
  productType: string;
  detailedDescription: string;
  exactColors: string;
  geometryAndShape: string;
  materialsAndTextures: string;
  logosAndText: string;
  cleanVisualSubject: string;
}

/**
 * Agente Revisor de Producto Visual y Fusionador de Prompts:
 * Analiza la imagen base del cliente con visión computacional y construye un prompt maestro
 * donde el producto original es descrito con extrema precisión fotográfica, garantizando que el
 * modelo de imagen recree fielmente el producto subido (y no un objeto inventado o genérico).
 */
export async function analyzeAndAnchorProductPrompt(
  baseImageUrl: string,
  templatePrompt: string,
  userCustomizations?: string
): Promise<{ enrichedPrompt: string; analysis: ProductVisualAnalysis | null }> {
  try {
    const visionSystemInstruction = `You are a Senior Computer Vision & Advertising Art Director Agent.
Your job is to thoroughly inspect a client's uploaded product photograph and create an airtight, photorealistic visual description of the EXACT product.

CRITICAL DIRECTIVE:
Image generation models (Midjourney, Flux, Stable Diffusion) will hallucinate a random generic object if you simply say "the product". 
You must identify and describe the exact physical item (whether it is a specific cocktail glass, a perfume bottle, athletic sneakers, a cosmetic jar, a food plate, a tech gadget, or industrial equipment).

OUTPUT FORMAT: Strict JSON object:
{
  "productType": "concise name of the product (e.g. 'Citrus and Mango Tropical Cocktail in Tapered Glass')",
  "detailedDescription": "Photorealistic description (60-90 words in English) detailing the exact product shape, colors, visible layers, textures, glassware/container, garnish, coaster or base, and all distinguishing visual traits.",
  "exactColors": "Precise color palette (e.g. 'vibrant golden amber, citrus yellow, frosted white ice, candied orange garnish, terracotta brown coaster')",
  "geometryAndShape": "Exact geometry and proportions of the product",
  "materialsAndTextures": "Materials visible (clear glass, cold beverage, crushed ice, candied fruit, metal skewer, matte silicone)",
  "logosAndText": "Any visible logos, brand text, or 'none' if unbranded",
  "cleanVisualSubject": "A concise English phrase describing the exact product ready to insert as the hero subject (e.g. 'a tapered stemmed glass containing a golden-orange citrus cocktail topped with crushed ice and a skewered candied fruit garnish, resting on a round coaster')"
}`;

    const visionUserPrompt = `Thoroughly analyze this uploaded product photograph.
Target Advertising Template to apply around it: ${templatePrompt.slice(0, 300)}
User's Specific Customization / Changes: ${userCustomizations || "None specified"}

Return ONLY the strict JSON analysis:`;

    const rawResponse = await generateFreeText(
      visionUserPrompt,
      visionSystemInstruction,
      true, // jsonMode
      baseImageUrl,
      "product-vision-reviewer"
    );

    let parsedData: any = {};
    try {
      const cleanJson = rawResponse.replace(/```json\s*|```/g, "").trim();
      parsedData = JSON.parse(cleanJson);
    } catch (jsonErr) {
      console.warn("[AgentProductVision] JSON parse fallback:", jsonErr);
    }

    const cleanSubject = parsedData.cleanVisualSubject || parsedData.detailedDescription || "the exact physical product shown in the reference image";
    const detailedProduct = parsedData.detailedDescription || cleanSubject;

    // Adaptar variables genéricas en el prompt con el sujeto real inspeccionado
    let adaptedPrompt = templatePrompt;
    adaptedPrompt = adaptedPrompt
      .replace(/\[Producto[^\]]*\]/gi, cleanSubject)
      .replace(/\[Objeto[^\]]*\]/gi, cleanSubject)
      .replace(/\[Sujeto[^\]]*\]/gi, cleanSubject);

    // Fusión Maestra:
    // 1. Imagen base al inicio como referencia img2img
    // 2. Sujeto fotográfico exacto inspeccionado por el Agente
    // 3. Reglas estrictas de preservación de identidad visual
    // 4. Efectos y ambiente del template aplicados alrededor
    const cleanPromptBody = adaptedPrompt.replace(baseImageUrl, "").trim();
    const masterPrompt = `${baseImageUrl} High-end commercial advertising photograph featuring the EXACT physical product: ${detailedProduct}.
HERO PRODUCT PRESERVATION MANDATE: The central product MUST remain completely identical to the reference image in geometry, colors (${parsedData.exactColors || "matching reference image"}), materials, glassware, shape, proportions, and details. Do not replace, deform, or substitute the product.
SURROUNDING SCENE & EFFECTS: ${cleanPromptBody}`;

    console.log("[AgentProductVision] Master Anchored Prompt successfully built for product:", parsedData.productType || cleanSubject);

    return {
      enrichedPrompt: masterPrompt,
      analysis: parsedData as ProductVisualAnalysis
    };
  } catch (err: any) {
    console.error("[AgentProductVision] Error in agent visual review:", err);
    return {
      enrichedPrompt: `${baseImageUrl} Featuring the exact product from the reference image. ${templatePrompt.replace(baseImageUrl, "").trim()}`,
      analysis: null
    };
  }
}
