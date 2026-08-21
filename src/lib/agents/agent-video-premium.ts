import { generateFreeText } from '../gemini-free';

export interface PremiumVideoAgentParams {
  postId: string;
  idea: string;
  rubro?: string;
  businessDescription?: string;
}

export async function generatePremiumVideoWithAgent(params: PremiumVideoAgentParams): Promise<string> {
  const { postId, idea, rubro = 'General', businessDescription = '' } = params;

  console.log(`[AgentVideoPremium] Iniciando generación para post: ${postId}`);

  // 1. Generar prompt optimizado con Gemini
  const sysInstruction = `Eres un experto director de cinematografía de IA (Sora, Runway Gen-2, Luma Dream Machine).
Tu trabajo es tomar la idea base del usuario y convertirla en un prompt descriptivo, visual y detallado en INGLÉS para generar un video corto promocional de alta calidad en formato vertical 9:16 (vertical mobile format / TikTok/Reels ratio).
Debes detallar la iluminación, el movimiento de cámara, la acción principal y la atmósfera pensando en un encuadre vertical.
El video no tendrá texto, debe ser puro impacto visual para el rubro: ${rubro}.
Descripción del negocio: ${businessDescription}.
No devuelvas NADA MÁS que el prompt en inglés. Ni saludos ni comillas.`;

  let optimizedPrompt = '';
  try {
    optimizedPrompt = await generateFreeText(idea || 'Video promocional impactante', sysInstruction, true);
    optimizedPrompt = optimizedPrompt.trim().replace(/^["']|["']$/g, '');
  } catch (err) {
    console.warn('[AgentVideoPremium] Error generando prompt con Gemini, usando fallback directo:', err);
    optimizedPrompt = `Cinematic slow motion vertical 9:16 shot for a business in the ${rubro} industry. Professional lighting, 4k resolution, high quality, photorealistic, depth of field.`;
  }

  console.log(`[AgentVideoPremium] Prompt de video generado:`, optimizedPrompt);

  // 2. Iniciar el trabajo en el Webhook de n8n
  const startWebhookUrl = process.env.NEXT_PUBLIC_N8N_VIDEO_PREMIUM_URL || 'https://n8n.santisoft.cl/webhook/video-premium';
  const statusWebhookUrl = process.env.NEXT_PUBLIC_N8N_VIDEO_PREMIUM_STATUS_URL || 'https://n8n.santisoft.cl/webhook/video-premium-status';

  let jobId = '';

  try {
    const startRes = await fetch(startWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        prompt: optimizedPrompt,
        rubro,
        aspectRatio: '9:16'
      })
    });

    if (!startRes.ok) {
      throw new Error(`Error HTTP iniciando video en n8n: ${startRes.status}`);
    }

    const startData = await startRes.json();
    jobId = startData.jobId;

    if (!jobId) {
       // Si n8n no devuelve jobId explícito, usamos el postId como fallback (si el flujo en n8n lo soporta)
       console.warn('[AgentVideoPremium] n8n no devolvió un jobId, usando postId como fallback.');
       jobId = postId;
    }
  } catch (err: any) {
    throw new Error(`Fallo al iniciar el webhook de video premium: ${err.message}`);
  }

  console.log(`[AgentVideoPremium] Trabajo iniciado en n8n con jobId: ${jobId}. Iniciando polling...`);

  // 3. Polling: Revisar el estado cada 15 segundos
  const MAX_POLLING_TIME_MS = 120000; // 2 minutos máximo (ajustable)
  const POLLING_INTERVAL_MS = 15000;  // 15 segundos
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_POLLING_TIME_MS) {
    try {
      const statusRes = await fetch(`${statusWebhookUrl}?jobId=${encodeURIComponent(jobId)}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        
        if (statusData.status === 'done' && statusData.videoUrl) {
          console.log(`[AgentVideoPremium] ✅ Video premium completado. URL: ${statusData.videoUrl}`);
          return statusData.videoUrl;
        } else if (statusData.status === 'error') {
          throw new Error('n8n reportó un error durante la generación del video.');
        }
      }
    } catch (pollErr: any) {
      console.warn(`[AgentVideoPremium] Error consultando estado (jobId: ${jobId}):`, pollErr.message);
      // No rompemos el bucle por un fallo de red temporal, seguimos intentando
    }

    // Esperar antes del siguiente intento
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
  }

  // Si salimos del bucle es porque se superó el timeout
  throw new Error(`Timeout agotado (${MAX_POLLING_TIME_MS/1000}s) esperando que n8n entregue el video premium.`);
}
