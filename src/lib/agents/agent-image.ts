import { generateFreeText } from "../gemini-free";

export interface ImageAgentParams {
  idea: string;
  rubro?: string;
  businessDescription?: string;
  aspectRatio?: '1:1' | '9:16' | '16:9';
  logoPrompt?: string;
  logoUrl?: string;     // URL del logo PNG original en Firebase Storage
  userId?: string;      // ID de usuario para almacenar la imagen con marca
  includeLogo?: boolean;
}

/**
 * Agente de Imagen: Usa la fórmula de 7 componentes de Claude-Banana para diseñar el prompt
 * fotográfico limpio, genera la imagen vía n8n (o Pollinations) y, si se solicita,
 * estampa el logo PNG real y nítido del cliente encima usando Sharp.
 */
export async function generateImageWithAgent(params: ImageAgentParams): Promise<string> {
  const { 
    idea, 
    rubro = 'General', 
    businessDescription = '', 
    aspectRatio = '1:1', 
    logoPrompt = '', 
    logoUrl = '', 
    userId = 'system',
    includeLogo = false 
  } = params;

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
  const isVerticalStory = aspectRatio === '9:16';
  const sysInstruction = `Eres Claude Banana, un arquitecto de prompts para modelos de generación de imagen de alta fidelidad.
Tu objetivo es tomar la idea de un post y el rubro del cliente y generar UN ÚNICO PROMPT en INGLÉS descriptivo en prosa narrativa (120 a 180 palabras).

REGLA DE ORO: El prompt DEBE evocar UNA FOTOGRAFÍA REAL tomada con cámara profesional. Nunca ilustración, render 3D ni animación.
${isVerticalStory ? 'FORMATO OBLIGATORIO: Vertical 9:16 (Instagram Story). Encuadre vertical dinámico de alto impacto con sujeto principal llamativo en el tercio medio/inferior y composición cinematográfica limpia.' : ''}

Estructura obligatoria de 7 componentes:
1. Subject (25%): Describe una persona real (edad aproximada, rasgos físicos específicos como tono de piel, expresión, ropa de trabajo/profesional). Directamente relacionado con el rubro (${rubro}) y la idea del post.
2. Style & Aesthetic (20%): "shot on Sony A7IV with 85mm f/1.4 lens" o "Canon EOS R5, 50mm prime lens" — fotografía documental/comercial, tonos de color cálidos/naturales. Sin filtros exagerados.
3. Environment (15%): Escenario real y cotidiano coherente con el rubro. Lugar de trabajo, oficina, local comercial, calle real.
4. Lighting & Atmosphere (15%): Luz natural suave desde ventana lateral, o luz de estudio softbox difusa. Temperaturas de color específicas (5500K luz de día, 3200K luz cálida de interior).
5. Action & Dynamics (10%): Acción natural y auténtica en tiempo presente — persona trabajando, atendiendo cliente, revisando documento.
6. Composition & Camera (10%): Encuadre específico: ${isVerticalStory ? '"vertical 9:16 composition, medium eye-level shot with clean visual focal point"' : '"medium close-up, rule of thirds, shallow depth of field with bokeh background"'}.
7. Material & Texture (5%): Detalles táctiles reales: textura de tela, madera, metal, piel humana con poros visibles.

REGLAS CRÍTICAS:
- NUNCA incluyas palabras prohibidas: "4K", "8K", "masterpiece", "photorealistic", "ultra detailed", "hyperrealistic", "best quality", "trending on ArtStation".
- El prompt DEBE estar en INGLÉS.
- Debe ser en texto plano continuo (prosa), SIN etiquetas, SIN listas, SIN comillas extra.
- Comienza el prompt directamente con la descripción del sujeto principal.
- Evita términos que activen modo ilustración: "cartoon", "anime", "digital art", "3D render", "CGI".
- No intentes dibujar texto ni logos con la IA; la fotografía debe ser limpia y realista.`;

  const promptInput = `Negocio / Rubro: ${rubro}
Descripción del Negocio: ${businessDescription}
Idea o Tema del Post: ${idea}
Relación de Aspecto: ${aspectRatio} (${isVerticalStory ? 'Formato Vertical Historia 9:16' : 'Formato Cuadrado Feed 1:1'})

Genera el prompt narrativo en inglés (prosa, 120-180 palabras, fotografía real de cámara):`;

  let optimizedPrompt = '';
  try {
    optimizedPrompt = await generateFreeText(promptInput, sysInstruction, true);
    optimizedPrompt = optimizedPrompt.trim().replace(/^["']|["']$/g, '');
  } catch (err) {
    console.warn('[AgentImage] Error generando prompt con Claude-Banana, usando fallback directo:', err);
    optimizedPrompt = `A professional business owner in their early 30s with warm olive skin, wearing a neat casual blazer, smiling confidently while working at a modern desk in a bright office. Shot on Canon EOS R5 with 85mm f/1.4 lens, natural side window light at 5500K. ${isVerticalStory ? 'Vertical 9:16 composition' : 'Medium close-up framing'} with shallow depth of field, background softly blurred showing a clean workspace. Scene related to ${rubro}. Authentic, documentary-style commercial photograph with realistic skin texture and natural colors. No text overlay.`;
  }

  console.log(`[AgentImage] Prompt Claude-Banana generado (${aspectRatio}):`, optimizedPrompt);

  let rawGeneratedUrl = '';

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
        includeLogo: includeLogo,
        logoPrompt: logoPrompt,
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
        rawGeneratedUrl = n8nImageUrl;
      }
    } else {
      console.warn(`[AgentImage] ⚠️ n8n respondió con status: ${n8nRes.status}`);
    }
  } catch (n8nErr: any) {
    console.warn(`[AgentImage] ⚠️ Fallo o Timeout al llamar al webhook de n8n:`, n8nErr.message || n8nErr);
  }

  // 3. Fallback si n8n no entregó imagen: Pollinations (Flux)
  if (!rawGeneratedUrl) {
    console.log(`[AgentImage] 🔄 Ejecutando Fallback a Pollinations (modelo flux) con el prompt narrativo...`);
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(optimizedPrompt);
    rawGeneratedUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true&seed=${seed}`;
  }

  // 4. Superposición del Logo PNG Real con Sharp (si el usuario lo solicitó y tiene logo configurado)
  if (includeLogo && logoUrl) {
    try {
      console.log(`[AgentImage] 🏷️ Estampando logo PNG real de la marca (${logoUrl}) sobre la imagen...`);
      const { overlayLogoOnImage } = await import('../image-watermark');
      const watermarkedUrl = await overlayLogoOnImage(rawGeneratedUrl, logoUrl, userId, {
        position: 'bottom-right',
        padding: isVerticalStory ? 48 : 36,
        logoWidthPercent: isVerticalStory ? 0.20 : 0.16
      });
      return watermarkedUrl;
    } catch (wmErr: any) {
      console.warn('[AgentImage] Error aplicando watermark de logo, devolviendo imagen sin marca:', wmErr.message || wmErr);
      return rawGeneratedUrl;
    }
  }

  return rawGeneratedUrl;
}
