import { adminDb } from "./firebase-admin";

export interface TaskModelDefinition {
  key: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  recommendedType: "speed" | "quality" | "balanced";
  defaultModel: string;
}

export const AI_TASKS: TaskModelDefinition[] = [
  {
    key: "general",
    name: "Modelo General / Fallback",
    category: "General",
    description: "Modelo base utilizado cuando no se especifica una tarea particular o como respaldo primario.",
    icon: "⚡",
    recommendedType: "balanced",
    defaultModel: "gemini-3.7-flash",
  },
  {
    key: "copywriter",
    name: "Copywriter & Redacción de Posts",
    category: "Redes Sociales",
    description: "Generación de textos persuasivos, emojis, ganchos comerciales y hashtags para redes sociales.",
    icon: "✍️",
    recommendedType: "quality",
    defaultModel: "gemini-3.7-flash",
  },
  {
    key: "generate_post",
    name: "Generador Rápido de Demos & Posts",
    category: "Redes Sociales",
    description: "Creación instantánea de publicaciones de prueba para nuevos leads en la landing page.",
    icon: "🚀",
    recommendedType: "speed",
    defaultModel: "gemini-3.1-flash-lite",
  },
  {
    key: "prompts_ideas",
    name: "Ideas & Prompts de Imagen IA",
    category: "Creatividad",
    description: "Generador de prompts para carteles publicitarios, imágenes para DALL-E/Midjourney y reformulación de ideas.",
    icon: "✨",
    recommendedType: "quality",
    defaultModel: "gemini-3.7-flash",
  },
  {
    key: "seo_strategy",
    name: "Estrategias de Contenido SEO & GEO",
    category: "SEO / GEO",
    description: "Análisis de intenciones de búsqueda, arquitectura de pilares de contenido y optimización para ChatGPT/Perplexity.",
    icon: "🌐",
    recommendedType: "quality",
    defaultModel: "gemini-2.5-pro",
  },
  {
    key: "seo_articles",
    name: "Redactor de Artículos de Blog SEO",
    category: "SEO / GEO",
    description: "Redacción extensa de artículos completos, estructurados con H1, H2, H3, metadescripciones y enlaces.",
    icon: "📝",
    recommendedType: "quality",
    defaultModel: "gemini-2.5-pro",
  },
  {
    key: "video_script",
    name: "Guiones & PoC de Videos / Reels",
    category: "Multimedia",
    description: "Creación de estructuras de guion segundo a segundo, locución y escenas visuales para videos cortos.",
    icon: "🎬",
    recommendedType: "balanced",
    defaultModel: "gemini-3.7-flash",
  },
  {
    key: "niche_radar",
    name: "Radar de Nicho & Tendencias",
    category: "Inteligencia de Mercado",
    description: "Extracción y análisis de tendencias de búsqueda, preguntas frecuentes de la audiencia y dolores del cliente.",
    icon: "📡",
    recommendedType: "balanced",
    defaultModel: "gemini-3.7-flash",
  },
  {
    key: "metrics_analysis",
    name: "Análisis Inteligente de Métricas",
    category: "Analítica",
    description: "Interpretación de rendimiento de campañas de Meta Ads, alcance orgánico y recomendaciones de mejora.",
    icon: "📊",
    recommendedType: "speed",
    defaultModel: "gemini-3.7-flash-lite",
  },
  {
    key: "webchat",
    name: "Chatbot Asistente Web",
    category: "Conversación",
    description: "Respuestas directas y rápidas a prospectos en el widget de chat de la landing page.",
    icon: "💬",
    recommendedType: "speed",
    defaultModel: "gemini-3.1-flash-lite",
  },
  {
    key: "whatsapp_bot",
    name: "Agente de WhatsApp",
    category: "Conversación",
    description: "Atención automática y calificación de prospectos vía webhook de WhatsApp Cloud API.",
    icon: "📱",
    recommendedType: "speed",
    defaultModel: "gemini-3.7-flash-lite",
  },
];

// In-memory cache for ultra-fast lookups without Firestore billing overhead
let cachedConfig: Record<string, string> | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export async function getModelConfig(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedConfig && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  // Fallback defaults
  const defaults: Record<string, string> = {};
  AI_TASKS.forEach((t) => {
    defaults[t.key] = t.defaultModel;
  });

  if (!adminDb) {
    return defaults;
  }

  try {
    const docSnap = await adminDb.collection("system_config").doc("ai_models").get();
    if (docSnap.exists) {
      const data = docSnap.data();
      const tasks = data?.tasks || {};
      cachedConfig = { ...defaults, ...tasks };
      lastCacheTime = now;
      return cachedConfig;
    }
  } catch (error) {
    console.error("[AI-MODEL-CONFIG] Error fetching model config from firestore:", error);
  }

  cachedConfig = defaults;
  lastCacheTime = now;
  return defaults;
}

export async function getTaskModel(taskKey?: string): Promise<string> {
  const config = await getModelConfig();
  if (taskKey && config[taskKey]) {
    return config[taskKey];
  }
  return config["general"] || "gemini-3.7-flash";
}

export function invalidateModelConfigCache() {
  cachedConfig = null;
  lastCacheTime = 0;
}
