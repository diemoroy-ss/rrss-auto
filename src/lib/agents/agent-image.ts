import { generateFreeText } from "../gemini-free";

export interface ImageAgentParams {
  idea: string;
  rubro?: string;
  businessDescription?: string;
  aspectRatio?: '1:1' | '9:16' | '16:9';
}

/**
 * Agente de Imagen: Usa la fórmula de 7 componentes de Claude-Banana para diseñar el prompt
 * alineado al rubro del negocio, luego consulta a n8n y hace fallback a Pollinations.
 */
export async function generateImageWithAgent(params: ImageAgentParams): Promise<string> {
  const { idea, rubro = 'General', businessDescription = '', aspectRatio = '1:1' } = params;

  let width = 1080;
  let height = 1080;
  if (aspectRatio === '9:16') {
    width = 1080;
    height = 1920;
  } else if (aspectRatio === '16:9') {
    width = 1920;
    height = 1080;
  }

  // 1. Diseñar el Prompt usando la técnica Claude-Banana (7 componentes)
  const sysInstruction = `Eres Claude Banana, un arquitecto de prompts para modelos de generación de imagen de alta fidelidad.
Tu objetivo es tomar la idea de un post y el rubro del cliente y generar UN ÚNICO PROMPT en INGLÉS descriptivo en prosa narrativa (100 a 150 palabras).

Sigue estrictamente la estructura de 7 componentes:
1. Subject: Relacionado directamente con el rubro (${rubro}) y la idea del post.
2. Style & Aesthetic: Fotografía comercial moderna, limpia, profesional.
3. Environment: Escenario o entorno coherente con el rubro.
4. Lighting & Atmosphere: Iluminación natural o de estudio, atractiva.
5. Action & Dynamics: Acción en tiempo presente.
6. Composition & Camera: Enfoque cinematográfico, nitidez.
7. Material & Texture: Texturas realistas.

REGLAS CRÍTICAS:
- NUNCA incluyas palabras prohibidas como "4K", "8K", "masterpiece", "photorealistic", "ultra detailed".
- El prompt DEBE estar en INGLÉS.
- Debe ser en texto plano continuo (prosa), SIN etiquetas, SIN listas, SIN comillas extra.`;

  const promptInput = `Negocio / Rubro: ${rubro}
Descripción del Negocio: ${businessDescription}
Idea o Tema del Post: ${idea}
Relación de Aspecto: ${aspectRatio}

Genera el prompt narrativo en inglés:`;

  let optimizedPrompt = '';
  try {
    optimizedPrompt = await generateFreeText(promptInput, sysInstruction, true);
    optimizedPrompt = optimizedPrompt.trim().replace(/^["']|["']$/g, '');
  } catch (err) {
    console.warn('[AgentImage] Error generando prompt con Claude-Banana, usando fallback directo:', err);
    optimizedPrompt = `Professional commercial photography representing ${rubro}, ${idea}, modern aesthetic, clean studio lighting, 8k resolution look without text`;
  }

  console.log(`[AgentImage] Prompt Claude-Banana generado (${aspectRatio}):`, optimizedPrompt);

  // 2. Intento Primario: Webhook de n8n
  const n8nWebhookUrl = 'https://n8n.santisoft.cl/webhook/img-rrss-auto';
  try {
    console.log(`[AgentImage] Intentando generar imagen vía n8n webhook (${n8nWebhookUrl})...`);
    
    // Timeout de 15 segundos para n8n
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const n8nRes = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: optimizedPrompt,
        rawIdea: idea,
        rubro: rubro,
        aspectRatio: aspectRatio,
        width: width,
        height: height
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (n8nRes.ok) {
      const data = await n8nRes.json();
      const n8nImageUrl = data.imageUrl || data.url || data.output || data.image;
      if (n8nImageUrl && typeof n8nImageUrl === 'string' && n8nImageUrl.startsWith('http')) {
        console.log(`[AgentImage] ✅ Imagen generada con éxito por n8n:`, n8nImageUrl);
        return n8nImageUrl;
      }
    }
    console.warn(`[AgentImage] ⚠️ n8n respondió sin una URL de imagen válida. Status: ${n8nRes.status}`);
  } catch (n8nErr: any) {
    console.warn(`[AgentImage] ⚠️ Fallo o Timeout al llamar al webhook de n8n:`, n8nErr.message || n8nErr);
  }

  // 3. Fallback: Pollinations con el prompt narrativo de Claude-Banana
  console.log(`[AgentImage] 🔄 Ejecutando Fallback a Pollinations con el prompt narrativo...`);
  const seed = Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(optimizedPrompt);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

  return pollinationsUrl;
}
