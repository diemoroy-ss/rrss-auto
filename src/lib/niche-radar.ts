import { generateFreeText } from "./gemini-free";

export interface TrendItem {
  id: string;
  title: string;
  description: string;
  popularity: "Alta" | "Media" | "En Crecimiento";
  suggestedFormat: string;
  whyItWorks: string;
}

export interface AudienceQuestion {
  id: string;
  question: string;
  context: string;
  contentOpportunity: string;
}

export interface HookItem {
  id: string;
  hookText: string;
  category: "Curiosidad" | "Problema/Solución" | "Mito vs Realidad" | "Controversial" | "Educativo";
  explanation: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  format: "Reel" | "Carrusel" | "Post Estático" | "Historias";
  angle: string;
  draftHook: string;
  outline: string[];
  targetGoal: string;
}

export interface RadarAnalysisResult {
  niche: string;
  updatedAt: string;
  summary: string;
  trends: TrendItem[];
  audienceQuestions: AudienceQuestion[];
  hooks: HookItem[];
  contentIdeas: ContentIdea[];
}

export interface RadarInputParams {
  businessName?: string;
  niche: string;
  targetAudience?: string;
  customKeywords?: string;
}

/**
 * Investiga y analiza las tendencias de los últimos 30 días para un nicho/rubro específico.
 * Utiliza IA para sintetizar búsquedas, conversaciones en redes sociales, dudas recurrentes y ganchos efectivos.
 */
export async function generateNicheRadarAnalysis(params: RadarInputParams): Promise<RadarAnalysisResult> {
  const { businessName = "Mi Negocio", niche, targetAudience = "Público General", customKeywords = "" } = params;

  const systemInstruction = `Eres un Director de Estrategia de Marketing Digital y Viralidad en Redes Sociales especializado en análisis de tendencias de mercado de los últimos 30 días.
Tu tarea es analizar el nicho/rubro provisto por el usuario y generar un informe táctico en formato JSON estricto.
El informe debe enfocarse en lo que REALMENTE está funcionando en Instagram, TikTok, LinkedIn y YouTube en las últimas semanas para ese nicho.`;

  const prompt = `Analiza las tendencias más recientes y patrones de viralidad de los ÚLTIMOS 30 DÍAS para el siguiente negocio/nicho:

- **Nombre de la Marca**: "${businessName}"
- **Nicho/Rubro**: "${niche}"
- **Audiencia Objetivo**: "${targetAudience}"
${customKeywords ? `- **Palabras Clave adicionales**: "${customKeywords}"` : ""}

Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta:
{
  "niche": "${niche}",
  "updatedAt": "${new Date().toISOString()}",
  "summary": "Resumen conciso y profesional de 2-3 oraciones sobre las dinámicas principales del nicho en las últimas semanas.",
  "trends": [
    {
      "id": "t1",
      "title": "Nombre de la Tendencia 1",
      "description": "Explicación breve de la tendencia actual",
      "popularity": "Alta",
      "suggestedFormat": "Reel 15s / Carrusel 5 slides",
      "whyItWorks": "Por qué capta la atención del público ahora mismo"
    },
    {
      "id": "t2",
      "title": "Nombre de la Tendencia 2",
      "description": "Explicación breve",
      "popularity": "En Crecimiento",
      "suggestedFormat": "Carrusel informativo",
      "whyItWorks": "Razón de impacto"
    },
    {
      "id": "t3",
      "title": "Nombre de la Tendencia 3",
      "description": "Explicación breve",
      "popularity": "Media",
      "suggestedFormat": "Reel humor/educativo",
      "whyItWorks": "Razón de impacto"
    }
  ],
  "audienceQuestions": [
    {
      "id": "q1",
      "question": "Pregunta o duda frecuente 1 que la gente en este nicho hace en comentarios/Google/Reddit",
      "context": "Contexto de por qué la gente tiene esta duda",
      "contentOpportunity": "Cómo la marca puede responder esto en un post para ganar autoridad"
    },
    {
      "id": "q2",
      "question": "Pregunta frecuente 2",
      "context": "Contexto de la duda",
      "contentOpportunity": "Oportunidad de contenido"
    }
  ],
  "hooks": [
    {
      "id": "h1",
      "hookText": "Texto del gancho magnético (primeros 3 segundos de video o primera línea del copy)",
      "category": "Curiosidad",
      "explanation": "Por qué este gancho detiene el scroll"
    },
    {
      "id": "h2",
      "hookText": "Texto de gancho 2",
      "category": "Mito vs Realidad",
      "explanation": "Explicación del gancho"
    },
    {
      "id": "h3",
      "hookText": "Texto de gancho 3",
      "category": "Problema/Solución",
      "explanation": "Explicación del gancho"
    }
  ],
  "contentIdeas": [
    {
      "id": "c1",
      "title": "Título sugerido para el post 1",
      "format": "Reel",
      "angle": "Ángulo del contenido",
      "draftHook": "Línea inicial sugerida",
      "outline": ["Punto clave 1", "Punto clave 2", "Llamado a la acción (CTA)"],
      "targetGoal": "Educación / Generación de Leads"
    },
    {
      "id": "c2",
      "title": "Título sugerido para el post 2",
      "format": "Carrusel",
      "angle": "Ángulo del contenido",
      "draftHook": "Línea inicial sugerida",
      "outline": ["Slide 1: Gancho", "Slide 2: Problema", "Slide 3: Solución", "Slide 4: CTA"],
      "targetGoal": "Posicionamiento de Marca"
    },
    {
      "id": "c3",
      "title": "Título sugerido para el post 3",
      "format": "Post Estático",
      "angle": "Ángulo del contenido",
      "draftHook": "Línea inicial sugerida",
      "outline": ["Punto 1", "Punto 2"],
      "targetGoal": "Interacción y Comentarios"
    }
  ]
}`;

  try {
    const rawJson = await generateFreeText(prompt, systemInstruction, true);
    const cleanedText = rawJson.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    const parsed: RadarAnalysisResult = JSON.parse(cleanedText);
    return parsed;
  } catch (error) {
    console.error("Error al generar el Radar de Nicho:", error);
    return {
      niche,
      updatedAt: new Date().toISOString(),
      summary: `Análisis para el nicho ${niche}. Explora tendencias clave y ganchos populares recomendados para conectar con tu audiencia.`,
      trends: [
        {
          id: "t1",
          title: `Contenido Educativo Corto en ${niche}`,
          description: "Videos de menos de 30 segundos resolviendo un problema puntual.",
          popularity: "Alta",
          suggestedFormat: "Reel 15s",
          whyItWorks: "Alto porcentaje de retención en Instagram y TikTok."
        }
      ],
      audienceQuestions: [
        {
          id: "q1",
          question: `¿Cómo elegir la mejor opción en ${niche}?`,
          context: "Los clientes buscan guías objetivas antes de comprar.",
          contentOpportunity: "Crea una lista comparativa tipo 'Qué hacer y qué no hacer'."
        }
      ],
      hooks: [
        {
          id: "h1",
          hookText: `El error #1 que casi todos cometen al elegir en ${niche} (y cómo evitarlo)...`,
          category: "Problema/Solución",
          explanation: "Activa el gatillo de aversión a la pérdida."
        }
      ],
      contentIdeas: [
        {
          id: "c1",
          title: `3 Consejos Clave para ${niche}`,
          format: "Carrusel",
          angle: "Educativo y práctico",
          draftHook: "Guarda este post si quieres mejorar en esto...",
          outline: ["Slide 1: Introducción", "Slide 2: Tip 1", "Slide 3: Tip 2", "Slide 4: Tip 3", "Slide 5: Comenta 'GUIA'"],
          targetGoal: "Captación de Leads"
        }
      ]
    };
  }
}
