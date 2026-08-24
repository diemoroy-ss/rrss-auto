import { adminStorage } from "./firebase-admin";

/**
 * Genera un archivo de audio MP3 utilizando ElevenLabs (si la API key es válida)
 * o con Google TTS en Español Latino Neutro como fallback de alta disponibilidad,
 * y lo almacena en Firebase Storage para que Remotion lo renderice en el video final.
 */
export async function generateElevenLabsAudio(text: string, userId: string): Promise<string | null> {
  if (!text || !text.trim()) return null;

  const cleanText = text.trim();
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

  // 1. Intento Primario: ElevenLabs (si la clave empieza con sk_ o es válida)
  if (apiKey && apiKey.startsWith("sk_")) {
    try {
      console.log(`[TTS] Intentando síntesis con ElevenLabs para usuario ${userId}...`);
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const publicUrl = await uploadAudioBufferToStorage(buffer, userId);
        if (publicUrl) {
          console.log(`[TTS] Audio ElevenLabs generado y subido con éxito: ${publicUrl}`);
          return publicUrl;
        }
      } else {
        const errText = await response.text();
        console.warn(`[TTS] ElevenLabs devolvió status ${response.status}: ${errText}. Aplicando fallback a Google TTS...`);
      }
    } catch (e: any) {
      console.warn(`[TTS] Fallo en ElevenLabs (${e.message}), aplicando fallback a Google TTS...`);
    }
  }

  // 2. Fallback Secundario Automático: Google TTS (Español Latino Neutro) con soporte multilínea/chunks
  try {
    console.log(`[TTS] Generando locución en Español Latino Neutro con Google TTS...`);
    
    // Dividir en trozos de máx 140 caracteres respetando palabras completas
    const words = cleanText.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const word of words) {
      if ((currentChunk + " " + word).trim().length > 140) {
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        currentChunk = (currentChunk + " " + word).trim();
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());

    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      const q = encodeURIComponent(chunk);
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es-US&client=tw-ob&q=${q}`;

      const gRes = await fetch(googleTtsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (gRes.ok) {
        const arrayBuffer = await gRes.arrayBuffer();
        audioBuffers.push(Buffer.from(arrayBuffer));
      } else {
        console.warn(`[TTS] Error en fragmento Google TTS: Status ${gRes.status} para "${chunk}"`);
      }
    }

    if (audioBuffers.length > 0) {
      const finalAudioBuffer = Buffer.concat(audioBuffers);
      const publicUrl = await uploadAudioBufferToStorage(finalAudioBuffer, userId);
      if (publicUrl) {
        console.log(`[TTS] Audio Google TTS generado y subido con éxito: ${publicUrl} (${finalAudioBuffer.length} bytes)`);
        return publicUrl;
      }
    }
  } catch (gErr: any) {
    console.error("[TTS] Error generando audio con Google TTS:", gErr.message || gErr);
  }

  return null;
}

async function uploadAudioBufferToStorage(buffer: Buffer, userId: string): Promise<string | null> {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || 'rrss-santisoft.firebasestorage.app';
  const bucket = adminStorage?.bucket(bucketName);
  if (!bucket) {
    console.error("[TTS] Firebase Storage no está disponible en adminStorage.");
    return null;
  }

  const filename = `user_assets/${userId}/voiceovers/voiceover_${Date.now()}.mp3`;
  const file = bucket.file(filename);

  await file.save(buffer, {
    contentType: "audio/mpeg",
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

  await file.makePublic().catch(() => {});
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}
