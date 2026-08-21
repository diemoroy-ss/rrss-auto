import { generateFreeText } from "../gemini-free";

export interface ImageAgentParams {
  idea: string;
  rubro?: string;
  businessDescription?: string;
  aspectRatio?: '1:1' | '9:16' | '16:9';
  logoPrompt?: string;   // Descripción textual del logo generada por Gemini Vision
  includeLogo?: boolean; // Si true, el logo se recrea dentro de la imagen
}

/**
 * Agente de Imagen: Usa la fórmula de 7 componentes de Claude-Banana para diseñar el prompt
 * alineado al rubro del negocio, luego consulta a n8n y hace fallback a Pollinations.
 */
export async function generateImageWithAgent(params: ImageAgentParams): Promise<string> {
  const { idea, rubro = 'General', businessDescription = '', aspectRatio = '1:1', logoPrompt = '', includeLogo = false } = params;

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
Tu objetivo es tomar la idea de un post y el rubro del cliente y generar UN ÚNICO PROMPT en INGLÉS descriptivo en prosa narrativa (120 a 180 palabras).

REGLA DE ORO: El prompt DEBE evocar UNA FOTOGRAFÍA REAL tomada con cámara profesional. Nunca ilustración, render 3D ni animación.

Estructura obligatoria de 7 componentes:
1. Subject (25%): Describe una persona real (edad aproximada, rasgos físicos específicos como tono de piel, expresión, ropa de trabajo/profesional). Directamente relacionado con el rubro (${rubro}) y la idea del post.
2. Style & Aesthetic (20%): "shot on Sony A7IV with 85mm f/1.4 lens" o "Canon EOS R5, 50mm prime lens" — fotografía documental/comercial, tonos de color cálidos/naturales. Sin filtros exagerados.
3. Environment (15%): Escenario real y cotidiano coherente con el rubro. Lugar de trabajo, oficina, local comercial, calle real.
4. Lighting & Atmosphere (15%): Luz natural suave desde ventana lateral, o luz de estudio softbox difusa. Temperaturas de color específicas (5500K luz de día, 3200K luz cálida de interior).
5. Action & Dynamics (10%): Acción natural y auténtica en tiempo presente — persona trabajando, atendiendo cliente, revisando documento.
6. Composition & Camera (10%): Encuadre específico: "medium close-up", "rule of thirds", "shallow depth of field with bokeh background".
7. Material & Texture (5%): Detalles táctiles reales: textura de tela, madera, metal, piel humana con poros visibles.

REGLAS CRÍTICAS:
- NUNCA incluyas palabras prohibidas: "4K", "8K", "masterpiece", "photorealistic", "ultra detailed", "hyperrealistic", "best quality", "trending on ArtStation".
- El prompt DEBE estar en INGLÉS.
- Debe ser en texto plano continuo (prosa), SIN etiquetas, SIN listas, SIN comillas extra.
- Comienza el prompt directamente con la descripción del sujeto principal.
- Evita términos que activen modo ilustración: "cartoon", "anime", "digital art", "3D render", "CGI".`;

  const promptInput = `Negocio / Rubro: ${rubro}
Descripción del Negocio: ${businessDescription}
Idea o Tema del Post: ${idea}
Relación de Aspecto: ${aspectRatio}

Genera el prompt narrativo en inglés (prosa, 120-180 palabras, fotografía real de cámara):`;

  let optimizedPrompt = '';
  try {
    optimizedPrompt = await generateFreeText(promptInput, sysInstruction, true);
    optimizedPrompt = optimizedPrompt.trim().replace(/^["']|["']$/g, '');
  } catch (err) {
    console.warn('[AgentImage] Error generando prompt con Claude-Banana, usando fallback directo:', err);
    optimizedPrompt = `A professional business owner in their early 30s with warm olive skin, wearing a neat casual blazer, smiling confidently while working at a modern desk in a bright office. Shot on Canon EOS R5 with 85mm f/1.4 lens, natural side window light at 5500K. Medium close-up framing with shallow depth of field, background softly blurred showing a clean workspace. Scene related to ${rubro}. Authentic, documentary-style commercial photograph with realistic skin texture and natural colors. No text overlay.`;
  }

  // Si el usuario activó "Incluir logo", se añade la descripción del logo al prompt
  if (includeLogo && logoPrompt) {
    optimizedPrompt += ` In the lower-right corner of the image, include a small tasteful brand mark: ${logoPrompt}. The brand mark should be subtle and not overpower the main scene.`;
    console.log('[AgentImage] 🏷️ Logo prompt inyectado en la imagen.');
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
      const n8nImageUrl = data.img_url || data.imageUrl || data.url || data.output || data.image;
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
  // Usando modelo "flux" que genera imágenes mucho más realistas que el modelo por defecto
  console.log(`[AgentImage] 🔄 Ejecutando Fallback a Pollinations (modelo flux) con el prompt narrativo...`);
  const seed = Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(optimizedPrompt);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true&seed=${seed}`;

  return pollinationsUrl;
}
