import { generateVideoPoCComposition, VideoComposition } from "../video-poc-service";
import { renderAndUploadReel } from "../video-renderer";
import { generateImageWithAgent } from "./agent-image";
import { adminDb } from "../firebase-admin";

export interface ReelAgentParams {
  postId: string;
  post: any;
  targetProfile: any;
  userId: string;
}

/**
 * Agente de Video / Reel:
 * Genera la composición estructurada de escenas 9:16, utiliza el Agente 1 (Imágenes)
 * para crear los fondos de cada escena (pasando por n8n e imagen de rubro),
 * y finalmente renderiza el MP4 vertical nativo usando Remotion.
 */
export async function generateReelWithAgent(params: ReelAgentParams): Promise<{ videoUrl: string; composition: VideoComposition }> {
  const { postId, post, targetProfile, userId } = params;
  const rubro = targetProfile?.rubro || targetProfile?.businessType || 'General';
  const businessDescription = targetProfile?.businessDescription || '';

  console.log(`[AgentReel] Iniciando Agente de Video/Reel para post ${postId}...`);

  // 1. Generar la estructura de composición con imágenes de fondo 9:16
  const topic = post.copy || post.idea || post.text || 'Post Promocional';
  const composition = await generateVideoPoCComposition({
    topic,
    rubro,
    style: 'vibrante'
  });

  // Actualizar el objeto post con la composición y guardar en Firestore
  post.scenes = composition.scenes;
  post.audioScript = composition.audioScript;

  if (adminDb) {
    await adminDb.collection("social_posts").doc(postId).update({
      scenes: composition.scenes,
      audioScript: composition.audioScript,
    });
  }

  // 3. Renderizar y subir el video MP4 con Remotion
  console.log(`[AgentReel] Renderizando video final 9:16 con Remotion...`);
  const videoUrl = await renderAndUploadReel(post, userId, postId);

  console.log(`[AgentReel] ✅ Reel renderizado y disponible en: ${videoUrl}`);
  return { videoUrl, composition };
}
