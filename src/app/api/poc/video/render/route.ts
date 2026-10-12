import { NextResponse } from 'next/server';
import { renderAndUploadReel } from '../../../../../lib/video-renderer';
import { adminDb } from '../../../../../lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { composition, userId, postId: inputPostId, showWatermark = false } = body;

    if (!composition || !composition.scenes || composition.scenes.length === 0) {
      return NextResponse.json({ error: 'La composición debe tener al menos una escena.' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido.' }, { status: 400 });
    }

    const postId = inputPostId || ('reel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

    // Garantizar que la duración total nunca supere los 10 segundos
    const rawTotalDuration = composition.scenes.reduce((sum: number, s: any) => sum + (s.duration || 3), 0);
    const scale = rawTotalDuration > 10 ? 10 / rawTotalDuration : 1;
    const clampedScenes = composition.scenes.map((s: any) => ({
      ...s,
      duration: Math.max(1, Math.round((s.duration || 3) * scale * 10) / 10),
    }));

    const postData = {
      id: postId,
      scenes: clampedScenes,
      audioScript: composition.audioScript || '',
      showWatermark: showWatermark,
    };

    console.log(`[API PoC Render] Renderizando video Remotion para post ${postId} (máx 10s)...`);
    const videoUrl = await renderAndUploadReel(postData, userId, postId);

    // Si ya existe en Firestore, actualizarlo también
    if (inputPostId && adminDb) {
      try {
        await adminDb.collection('social_posts').doc(inputPostId).update({
          videoUrl,
          mediaUrl: videoUrl,
          renderedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('[API PoC Render] No se actualizó el doc en Firestore:', e);
      }
    }

    return NextResponse.json({ success: true, videoUrl, postId });
  } catch (error: any) {
    console.error('Error al renderizar video Remotion en API:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al renderizar el video con Remotion.' },
      { status: 500 }
    );
  }
}
