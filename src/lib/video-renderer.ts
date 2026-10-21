import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { generateElevenLabsAudioWithTimestamps, WordTimestamp } from './elevenlabs';
import { adminStorage } from './firebase-admin';

export async function renderAndUploadReel(post: any, userId: string, postId: string): Promise<string> {
    console.log(`[VideoRenderer] Iniciando proceso de renderizado JIT para post ${postId}`);
    
    // 1. Generar Audio (si tiene guión y no se deshabilitó la locución)
    let audioUrl = '';
    let wordTimestamps: WordTimestamp[] = [];
    if (post.audioScript && post.includeVoiceover !== false) {
        console.log(`[VideoRenderer] Generando locución de voz para el Reel...`);
        try {
             const result = await generateElevenLabsAudioWithTimestamps(post.audioScript, userId);
             if (result.audioUrl) {
                 audioUrl = result.audioUrl;
                 if (post.includeSubtitles !== false) {
                     wordTimestamps = result.wordTimestamps;
                 }
                 console.log(`[VideoRenderer] Pista de audio adjuntada a Remotion: ${audioUrl}`);
             }
        } catch (e) {
             console.error(`[VideoRenderer] Error generando audio, continuando sin voz:`, e);
        }
    }

    // 2. Empaquetar proyecto Remotion
    console.log(`[VideoRenderer] Empaquetando composición Remotion...`);
    const rootPath = path.join(process.cwd(), 'src/remotion/index.ts');
    const bundled = await bundle(rootPath, () => undefined, {
        webpackOverride: (config) => config,
        ignoreRegisterRootWarning: true,
    } as any);

    // 2.1 Calcular duración requerida por la locución para evitar cortes (máximo 10s estricto)
    const wordCount = (post.audioScript || '').trim().split(/\s+/).filter(Boolean).length;
    const estimatedAudioSec = wordCount > 0 ? Math.min(10, Math.ceil((wordCount / 2.2) + 1.5)) : 9.5;
    const rawSceneSec = Math.min(10, (post.scenes || []).reduce((acc: number, s: any) => acc + (s.duration || 3.2), 0) || 9.5);
    // Duración máxima estricta de 10 segundos
    const finalTotalSec = Math.min(10, Math.max(rawSceneSec, estimatedAudioSec));

    const sceneCount = (post.scenes || []).length || 1;
    const adjustedSceneDuration = Math.round((finalTotalSec / sceneCount) * 10) / 10;
    const adjustedScenes = (post.scenes || []).map((s: any) => ({
        ...s,
        duration: adjustedSceneDuration
    }));
    const totalDurationInFrames = Math.min(300, Math.ceil(finalTotalSec * 30));

    console.log(`[VideoRenderer] Duración calibrada: ${finalTotalSec}s (${totalDurationInFrames} frames) para ${wordCount} palabras.`);

    const inputProps = {
        compositionId: postId,
        scenes: adjustedScenes,
        audioUrl: audioUrl,
        wordTimestamps: wordTimestamps,
        bgVideoUrl: post.bgVideoUrl || '',
        logoUrl: post.logoUrl || '',
        businessName: post.businessName || '',
        showWatermark: post.showWatermark ?? false,
        totalDurationInFrames: totalDurationInFrames,
        showSubtitles: post.includeSubtitles !== false,
    };

    console.log(`[VideoRenderer] Seleccionando composición...`);
    const composition = await selectComposition({
        serveUrl: bundled,
        id: 'SantisoftReel',
        inputProps,
    });

    // 3. Renderizar MP4
    const outputLocation = path.join(process.cwd(), 'tmp', `${postId}.mp4`);
    if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) {
        fs.mkdirSync(path.join(process.cwd(), 'tmp'), { recursive: true });
    }

    console.log(`[VideoRenderer] Renderizando Media (${composition.durationInFrames} frames)... esto puede tomar un momento.`);
    await renderMedia({
        composition,
        serveUrl: bundled,
        codec: 'h264',
        outputLocation,
        inputProps,
    });
    console.log(`[VideoRenderer] MP4 generado exitosamente en disco: ${outputLocation}`);

    // 4. Subir MP4 a Firebase Storage
    if (!adminStorage) {
        throw new Error("Storage no configurado en admin");
    }

    const bucket = adminStorage.bucket();
    const destination = `users/${userId}/reels/${postId}.mp4`;
    console.log(`[VideoRenderer] Subiendo MP4 a Firebase Storage: ${destination}`);
    
    await bucket.upload(outputLocation, {
        destination,
        metadata: {
            contentType: 'video/mp4',
        }
    });

    await bucket.file(destination).makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
    
    // Limpieza local
    try { fs.unlinkSync(outputLocation); } catch (e) {}

    console.log(`[VideoRenderer] Proceso finalizado. URL Pública: ${publicUrl}`);
    return publicUrl;
}

/**
 * Descarga un video MP4 desde una URL remota (ej: n8n / Kling / Runway / Fal.ai)
 * y lo persiste permanentemente en Firebase Storage.
 */
export async function persistRemoteVideoToStorage(
    remoteUrl: string, 
    userId: string = "system", 
    postId: string = `vid_${Date.now()}`
): Promise<string> {
    // Si ya está en nuestro Firebase Storage, no descargar de nuevo
    if (remoteUrl.includes("storage.googleapis.com") || remoteUrl.includes("firebasestorage.app")) {
        return remoteUrl;
    }

    if (!adminStorage) {
        console.warn("[VideoRenderer] adminStorage no disponible, usando URL remota directa.");
        return remoteUrl;
    }

    try {
        console.log(`[VideoRenderer] Descargando video remoto de n8n para almacenamiento permanente: ${remoteUrl}`);
        const res = await fetch(remoteUrl);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} al descargar video remoto`);
        }
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const bucket = adminStorage.bucket();
        const destination = `users/${userId}/reels/${postId}.mp4`;
        const file = bucket.file(destination);

        await file.save(buffer, {
            metadata: {
                contentType: "video/mp4",
            },
        });

        await file.makePublic().catch(() => {});
        const permanentUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
        console.log(`[VideoRenderer] ✅ Video guardado permanentemente en Firebase Storage: ${permanentUrl}`);
        return permanentUrl;
    } catch (err: any) {
        console.error(`[VideoRenderer] Error al persistir video en Firebase Storage:`, err.message);
        return remoteUrl; // fallback a la URL de n8n
    }
}

