import { generateFreeText } from "./gemini-free";

export interface VideoScene {
  id: string;
  duration: number; // en segundos (ej: 4)
  title: string;
  subtitle: string;
  highlightWords: string[];
  gradientBg: string; // ej: "from-purple-900 via-slate-900 to-indigo-950"
  textColor: string;
  accentColor: string;
  imagePrompt?: string;
  bgImageUrl?: string;
}

export interface VideoComposition {
  title: string;
  rubro: string;
  totalDuration: number;
  scenes: VideoScene[];
  audioScript: string;
  copyText: string;
}

export interface VideoPoCInputParams {
  topic: string;
  rubro?: string;
  style?: "cyberpunk" | "minimalista" | "corporativo" | "vibrante";
}

/**
 * Genera una composición estructurada de video en formato Reel 9:16 usando Gemini.
 * Incluye generación de imágenes dinámicas para el fondo con efecto cinematográfico.
 */
export async function generateVideoPoCComposition(params: VideoPoCInputParams): Promise<VideoComposition> {
  const { topic, rubro = "General", style = "vibrante" } = params;

  const systemInstruction = `Eres un Director de Arte y Productor de Video especializado en Reels, TikToks y YouTube Shorts virales de alto impacto.
Tu tarea es tomar una idea/tema y estructurar un video vertical 9:16 de exactamente 3 escenas (duración total 12-15 segundos).
Para cada escena debes incluir un prompt en inglés altamente descriptivo para generar una imagen estática cinematográfica de fondo sin texto.
Debes devolver UNICAMENTE un objeto JSON válido con el esquema indicado.`;

  const prompt = `Crea la estructura de escenas para un Reel promocional corto sobre el siguiente tema:

- **Tema / Idea**: "${topic}"
- **Rubro**: "${rubro}"
- **Estilo Visual**: "${style}"

Responde ÚNICAMENTE con un JSON con la siguiente estructura exacta:
{
  "title": "${topic}",
  "rubro": "${rubro}",
  "totalDuration": 12,
  "audioScript": "Guion corto de voz en off continuo para leer en 12 segundos.",
  "copyText": "Copy persuasivo para el post de Instagram/TikTok con hashtags.",
  "scenes": [
    {
      "id": "scene_1",
      "duration": 4,
      "title": "¡EL GANCHO INICIAL GIGANTE!",
      "subtitle": "Subtítulo explicativo del gancho",
      "highlightWords": ["GANCHO", "GIGANTE"],
      "gradientBg": "from-slate-950 via-purple-950 to-indigo-950",
      "textColor": "#FFFFFF",
      "accentColor": "#F59E0B",
      "imagePrompt": "Cinematic 8k resolution photo for ${rubro}, dramatic lighting, professional background, no text"
    },
    {
      "id": "scene_2",
      "duration": 4,
      "title": "CONSEJO #1 IMPACTANTE",
      "subtitle": "Detalle clave del consejo principal",
      "highlightWords": ["CONSEJO", "IMPACTANTE"],
      "gradientBg": "from-indigo-950 via-slate-900 to-slate-950",
      "textColor": "#FFFFFF",
      "accentColor": "#10B981",
      "imagePrompt": "Close up professional photography for ${rubro}, modern aesthetic, moody atmosphere, 8k"
    },
    {
      "id": "scene_3",
      "duration": 4,
      "title": "LLAMADO A LA ACCIÓN (CTA)",
      "subtitle": "Comenta 'REEL' para enviarte la guía completa",
      "highlightWords": ["REEL", "GUÍA"],
      "gradientBg": "from-purple-950 via-indigo-900 to-slate-950",
      "textColor": "#FFFFFF",
      "accentColor": "#FF6B00",
      "imagePrompt": "High-end commercial style image for ${rubro}, vibrant colors, bokeh blur background"
    }
  ]
}`;

  try {
    const rawJson = await generateFreeText(prompt, systemInstruction, true);
    const cleanedText = rawJson.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    const parsed: VideoComposition = JSON.parse(cleanedText);

    // Inyectar URLs de imágenes dinámicas basadas en los prompts generados por la IA
    if (parsed.scenes && Array.isArray(parsed.scenes)) {
      parsed.scenes = parsed.scenes.map((scene, idx) => {
        const seed = Math.floor(Math.random() * 100000) + idx * 42;
        const promptText = encodeURIComponent(scene.imagePrompt || `${rubro} ${topic} cinematic background`);
        const bgImageUrl = `https://image.pollinations.ai/prompt/${promptText}?width=1080&height=1920&nologo=true&seed=${seed}`;
        return {
          ...scene,
          bgImageUrl
        };
      });
    }

    return parsed;
  } catch (error) {
    console.error("Error al generar composición de video PoC:", error);
    const seed = Math.floor(Math.random() * 10000);
    return {
      title: topic,
      rubro,
      totalDuration: 12,
      audioScript: `Descubre los 3 consejos clave sobre ${topic}. Síguenos para más estrategias.`,
      copyText: `🔥 ${topic}. Guarda este Reel para aplicarlo hoy mismo en tu negocio. #Marketing #${rubro.replace(/\s+/g, '')}`,
      scenes: [
        {
          id: "scene_1",
          duration: 4,
          title: `¿CÓMO MEJORAR EN ${topic.toUpperCase()}?`,
          subtitle: "Descubre el secreto que nadie te cuenta",
          highlightWords: ["MEJORAR", "SECRETO"],
          gradientBg: "from-slate-950 via-purple-950 to-indigo-950",
          textColor: "#FFFFFF",
          accentColor: "#FF6B00",
          bgImageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(rubro + " " + topic)}?width=1080&height=1920&nologo=true&seed=${seed}`
        },
        {
          id: "scene_2",
          duration: 4,
          title: "ENFÓCATE EN LA ESTRATEGIA",
          subtitle: "No en la cantidad, sino en la relevancia",
          highlightWords: ["ESTRATEGIA", "RELEVANCIA"],
          gradientBg: "from-indigo-950 via-slate-900 to-slate-950",
          textColor: "#FFFFFF",
          accentColor: "#10B981",
          bgImageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(rubro + " business strategy") }?width=1080&height=1920&nologo=true&seed=${seed + 1}`
        },
        {
          id: "scene_3",
          duration: 4,
          title: "COMENTA 'REEL' Y RECIBE LA GUÍA",
          subtitle: "Te enviamos los pasos por mensaje directo",
          highlightWords: ["REEL", "MENSAJE"],
          gradientBg: "from-purple-950 via-indigo-900 to-slate-950",
          textColor: "#FFFFFF",
          accentColor: "#F59E0B",
          bgImageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(rubro + " success growth") }?width=1080&height=1920&nologo=true&seed=${seed + 2}`
        }
      ]
    };
  }
}
