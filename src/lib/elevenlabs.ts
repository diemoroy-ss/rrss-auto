import { adminStorage } from "./firebase-admin";

/**
 * Genera un archivo de audio MP3 utilizando la API de ElevenLabs (Text-to-Speech)
 * y lo almacena en Firebase Storage. Retorna la URL pública del recurso.
 */
export async function generateElevenLabsAudio(text: string, userId: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn("[ElevenLabs] No se encontró ELEVENLABS_API_KEY en las variables de entorno.");
    return null;
  }

  // Voz por defecto: Rachel (ID: 21m00Tcm4TlvDq8ikWAM) multilenguaje
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  try {
    console.log(`[ElevenLabs] Iniciando síntesis de voz para el usuario: ${userId}. Caracteres: ${text.length}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ElevenLabs API Error] Status: ${response.status}. Response: ${errText}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = adminStorage?.bucket();
    if (!bucket) {
      console.error("[ElevenLabs] El bucket de Firebase Storage no está disponible.");
      return null;
    }

    // Guardar el audio en la carpeta de subidas de redes sociales del usuario
    const filename = `user_assets/${userId}/voiceovers/voiceover_${Date.now()}.mp3`;
    const file = bucket.file(filename);

    await file.save(buffer, {
      contentType: "audio/mpeg",
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    // Formato de URL pública de Firebase Storage
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`;

    console.log(`[ElevenLabs] Audio de locución generado y guardado en: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("[ElevenLabs] Error durante la generación de audio:", error);
    return null;
  }
}
