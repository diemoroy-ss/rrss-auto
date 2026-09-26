import { generateFreeText } from '../gemini-free';

export interface PremiumVideoAgentParams {
  postId: string;
  idea: string;
  rubro?: string;
  businessDescription?: string;
  userId?: string;
  logoUrl?: string;
  businessName?: string;
  showWatermark?: boolean;
  /** URL de imagen base para animación Image-to-Video */
  imageUrl?: string;
  /** Prompt cinematográfico directo (desde la biblioteca de prompts) */
  promptOverride?: string;
  /** Nombre o ID del estilo de movimiento (ej: cinematic_slow_push_in) */
  motionStyle?: string;
  /** 'raw': devuelve video puro de n8n; 'remotion': compone subtítulos y logo por encima */
  renderMode?: 'raw' | 'remotion';
}

export async function generatePremiumVideoWithAgent(params: PremiumVideoAgentParams): Promise<string> {
  const { 
    postId, 
    idea, 
    rubro = 'General', 
    businessDescription = '', 
    userId = 'system', 
    logoUrl = '', 
    businessName = '', 
    showWatermark = false,
    imageUrl,
    promptOverride,
    motionStyle = 'cinematic_slow_push_in',
    renderMode = 'raw'
  } = params;

  console.log(`[AgentVideoPremium] Iniciando generación para post: ${postId} (Modo: ${renderMode}, Image2Video: ${!!imageUrl})`);

  // 1. Resolver el prompt cinematográfico
  let optimizedPrompt = promptOverride?.trim() || '';

  if (!optimizedPrompt) {
    const sysInstruction = `Eres un experto director de cinematografía publicitaria.
Tu trabajo es tomar la idea base del usuario y convertirla en un prompt descriptivo, visual y detallado en INGLÉS para generar un video corto promocional de alta calidad en formato vertical 9:16 (vertical mobile format / TikTok/Reels ratio).
Debes detallar la iluminación, el movimiento de cámara, la acción principal y la atmósfera pensando en un encuadre vertical.
El video no tendrá texto, debe ser puro impacto visual para el rubro: ${rubro}.
Descripción del negocio: ${businessDescription}.
No devuelvas NADA MÁS que el prompt en inglés. Ni saludos ni comillas.
IMPORTANTE: Finaliza SIEMPRE tu prompt con el texto exacto --ar 9:16`;

    try {
      optimizedPrompt = await generateFreeText(idea || 'Video promocional publicitario', sysInstruction, true);
      optimizedPrompt = optimizedPrompt.trim().replace(/^["']|["']$/g, '');
    } catch (err) {
      console.warn('[AgentVideoPremium] Error generando prompt con agentes, aplicando fallback directo:', err);
      optimizedPrompt = `Cinematic slow motion vertical 9:16 commercial shot for a business in the ${rubro} industry. Professional lighting, ultra-clean commercial grading, high quality, photorealistic, shallow depth of field --ar 9:16`;
    }
  }

  console.log(`[AgentVideoPremium] Prompt de video final:`, optimizedPrompt);

  // 2. Determinar webhooks según si es Image-to-Video o Text-to-Video
  const isImageToVideo = !!imageUrl;
  
  const startWebhookUrl = isImageToVideo
    ? (process.env.NEXT_PUBLIC_N8N_IMAGE_TO_VIDEO_URL || 'https://n8n.santisoft.cl/webhook/image-to-video')
    : (process.env.NEXT_PUBLIC_N8N_VIDEO_PREMIUM_URL || 'https://n8n.santisoft.cl/webhook/video-premium');

  const statusWebhookUrl = isImageToVideo
    ? (process.env.NEXT_PUBLIC_N8N_IMAGE_TO_VIDEO_STATUS_URL || 'https://n8n.santisoft.cl/webhook/image-to-video-status')
    : (process.env.NEXT_PUBLIC_N8N_VIDEO_PREMIUM_STATUS_URL || 'https://n8n.santisoft.cl/webhook/video-premium-status');

  let jobId = '';

  try {
    const payload: Record<string, any> = {
      postId,
      prompt: optimizedPrompt,
      rubro,
      businessName,
      aspectRatio: '9:16',
      ratio: '9:16',
      orientation: 'portrait',
      dimension: '1080x1920',
      motionStyle,
      renderMode
    };

    if (imageUrl) {
      payload.imageUrl = imageUrl;
      payload.baseImageUrl = imageUrl;
    }

    const startRes = await fetch(startWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!startRes.ok) {
      throw new Error(`Error HTTP iniciando video en n8n: ${startRes.status}`);
    }

    const startData = await startRes.json();
    jobId = startData.jobId;

    if (!jobId) {
       console.warn('[AgentVideoPremium] n8n no devolvió un jobId explícito, usando postId como fallback.');
       jobId = postId;
    }
  } catch (err: any) {
    throw new Error(`Fallo al iniciar el webhook de video en n8n (${startWebhookUrl}): ${err.message}`);
  }

  console.log(`[AgentVideoPremium] Trabajo iniciado en n8n con jobId: ${jobId}. Iniciando polling en ${statusWebhookUrl}...`);

  // 3. Polling: Revisar el estado cada 10 segundos
  const MAX_POLLING_TIME_MS = 150000; // 2.5 minutos máximo
  const POLLING_INTERVAL_MS = 10000;  // 10 segundos
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_POLLING_TIME_MS) {
    try {
      const statusRes = await fetch(`${statusWebhookUrl}?jobId=${encodeURIComponent(jobId)}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        
        if (statusData.status === 'done' && (statusData.videoUrl || statusData.url)) {
          const rawVideoUrl = statusData.videoUrl || statusData.url;
          console.log(`[AgentVideoPremium] ✅ Video recibido de n8n: ${rawVideoUrl}`);

          // Si el switch está en 'raw', devolvemos el video tal cual sale del motor n8n
          if (renderMode === 'raw') {
            console.log(`[AgentVideoPremium] ⚡ Modo 'raw' activo: retornando video puro.`);
            return rawVideoUrl;
          }

          // Si el switch está en 'remotion', componemos subtítulos dinámicos y logo
          console.log(`[AgentVideoPremium] ✨ Modo 'remotion' activo: componiendo subtítulos Hormozi y logo...`);
          
          try {
            const { generateVideoPoCComposition } = await import('../video-poc-service');
            const composition = await generateVideoPoCComposition({
              topic: idea || businessName || rubro,
              rubro,
              style: 'vibrante',
              skipImages: true
            });

            const { renderAndUploadReel } = await import('../video-renderer');
            const finalCompositedUrl = await renderAndUploadReel({
              id: postId,
              bgVideoUrl: rawVideoUrl,
              scenes: composition.scenes,
              audioScript: composition.audioScript,
              showWatermark: showWatermark,
              logoUrl: logoUrl,
              businessName: businessName
            }, userId, postId);

            console.log(`[AgentVideoPremium] 🚀 Video compuesto con Remotion finalizado: ${finalCompositedUrl}`);
            return finalCompositedUrl;
          } catch (remotionErr: any) {
            console.warn('[AgentVideoPremium] Fallo al componer con Remotion, usando video n8n directo:', remotionErr.message);
            return rawVideoUrl;
          }
        } else if (statusData.status === 'error') {
          throw new Error(statusData.message || 'n8n reportó un error durante la generación del video.');
        } else {
          console.log(`[AgentVideoPremium] Video en progreso (jobId: ${jobId}, progreso: ${statusData.progress || 'calculando'}%)...`);
        }
      }
    } catch (pollErr: any) {
      console.warn(`[AgentVideoPremium] Error consultando estado (jobId: ${jobId}):`, pollErr.message);
    }

    // Esperar antes del siguiente intento
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
  }

  // Si salimos del bucle es porque se superó el timeout
  throw new Error(`Tiempo de espera agotado (${MAX_POLLING_TIME_MS/1000}s) esperando que n8n entregue el video.`);
}
