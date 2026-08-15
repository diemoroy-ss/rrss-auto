import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { generateElevenLabsAudio } from './elevenlabs';
import { adminStorage } from './firebase-admin';

export async function renderAndUploadReel(post: any, userId: string, postId: string): Promise<string> {
    console.log(`[VideoRenderer] Iniciando proceso de renderizado JIT para post ${postId}`);
    
    // 1. Generar Audio (si tiene guión)
    let audioUrl = '';
    if (post.audioScript && process.env.ELEVENLABS_API_KEY) {
        console.log(`[VideoRenderer] Generando locución con ElevenLabs...`);
        try {
             const url = await generateElevenLabsAudio(post.audioScript, userId);
             if (url) audioUrl = url;
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
    });

    const inputProps = {
        compositionId: postId,
        scenes: post.scenes || [],
        audioUrl: audioUrl,
        totalDurationInFrames: (post.scenes || []).reduce((acc: number, s: any) => acc + (s.duration * 30), 0) || 360,
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
