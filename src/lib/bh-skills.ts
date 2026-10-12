/**
 * bh-skills.ts
 * Módulo central de los skills BH (Brian Haro).
 * Cubre: Instagram/Reels, Stories, Calendarios, Anti-Ban, Espía de Competencia y Copywriting de Ads LATAM.
 * Cada función construye el prompt especializado para inyectar en LangGraph o llamar a Gemini directamente.
 */

import { generateFreeText } from "./gemini-free";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export type ReelObjective = "venta" | "educacion" | "viralidad" | "branding";
export type ReelNiche =
  | "gastronomia"
  | "servicios"
  | "ecommerce"
  | "personal_brand"
  | "educacion"
  | "general";
export type ReelTone = "informal" | "experto" | "divertido" | "inspiracional";
export type StoryObjective =
  | "venta"
  | "educacion"
  | "conexion"
  | "anuncio"
  | "encuesta";
export type GrowthStage = "despegue" | "traccion" | "escalado";

export interface ReelScriptInput {
  topic: string;
  niche: ReelNiche;
  objective: ReelObjective;
  tone?: ReelTone;
  durationSeconds?: 15 | 30 | 45 | 60;
  onCamera?: boolean; // true = talking head, false = texto animado
  brandVoice?: string; // extracto del voice guide si existe
}

export interface StorySequenceInput {
  topic: string;
  niche: ReelNiche;
  objective: StoryObjective;
  cta: string; // ej: "escríbeme al DM", "link en bio", "responde esta story"
  brandVoice?: string;
}

export interface CalendarInput {
  niche: ReelNiche;
  businessDescription: string;
  growthStage: GrowthStage;
  currentFollowers?: number;
  weeklyCapacity: 3 | 4 | 5 | 7; // Reels por semana que pueden grabar
  businessGoal: string; // ej: "vender consultas", "crecer a 5k seguidores"
  periodDays?: 14 | 30; // Default: 30
}

export interface AntiBanAuditInput {
  caption: string;
  hashtags: string[]; // sin el #, ej: ["marketing", "emprendedor"]
  contentType: "reel" | "story" | "feed_post";
}

export interface AntiBanAuditResult {
  score: number; // 0-100
  level: "seguro" | "precaucion" | "riesgo" | "peligro";
  bannedHashtags: string[];
  riskyHashtags: string[];
  captionIssues: string[];
  correctedCaption: string;
  correctedHashtags: string[];
  aptToPublish: boolean;
  rawReport: string;
}

// ─── ADS ESPÍA ────────────────────────────────

export type AdPlatform = "meta" | "tiktok" | "google" | "todas";

export interface AdSpyInput {
  /** Nombres de marcas o URLs de competidores a investigar (máx 5) */
  competitors: string[];
  niche: string;          // ej: "restaurantes", "agencias de marketing", "ecommerce de ropa"
  platform: AdPlatform;
  country?: string;       // código ISO-2 ej: "CO", "MX", "AR". Default: todos los países
  objective?: string;     // ej: "inspiración de copy", "identificar ángulos no explotados"
}

// ─── ADS COPYWRITER ───────────────────────────

export type AdObjective = "whatsapp" | "leads" | "ventas" | "trafico_local";
export type AdNicheLatam =
  | "gastronomia"
  | "salud_bienestar"
  | "educacion_cursos"
  | "servicios_profesionales"
  | "ecommerce"
  | "belleza_estetica"
  | "inmobiliaria"
  | "general";

export interface AdCopyInput {
  businessDescription: string;  // qué vende y a quién
  adObjective: AdObjective;
  niche: AdNicheLatam;
  platform: "meta" | "tiktok" | "ambas";
  dailyBudget?: number;         // USD/día estimado — afecta cuántas variantes generar
  country?: string;             // "CO", "MX", "AR", "PE", etc.
  city?: string;                // para localización de copy
  tone?: ReelTone;
  brandVoice?: string;
  /** Output del espía de competencia — si existe, los ángulos no explotados tienen prioridad */
  competitorIntelligence?: string;
  /** Testimonios o prueba social disponible */
  socialProof?: string;
}

export interface AdCopyResult {
  platform: string;
  objective: string;
  variants: AdVariant[];
  setupInstructions: string;
  rawOutput: string;
}

export interface AdVariant {
  name: string;           // "Ad A — Ángulo DOLOR"
  angle: string;          // "dolor" | "deseo" | "prueba_social" | "identidad"
  primaryText: string;
  headline: string;       // máx 40 chars
  description: string;    // máx 30 chars
  ctaButton: string;
  visualNote: string;
}

// ─────────────────────────────────────────────
// HASHTAGS EN LISTA NEGRA (sincronizados con el SKILL)
// ─────────────────────────────────────────────

const BANNED_HASHTAGS = new Set([
  "follow4follow","like4like","followforfollow","f4f","l4l",
  "likeforlike","followme","follow","likes","comment4comment",
  "sexy","sexyback","sexyboy","sexygirl","ass","booty",
  "snap","snapchat","hashtags","spamforspam","spam4spam",
  "200likes","500likes","1000likes","instafollow",
  "adult","18plus","onlyfans",
  "weed","cannabis","420","marijuana",
]);

const RISKY_HASHTAGS = new Set([
  "love","happy","instagood","photooftheday","beautiful",
  "fashion","style","travel","food","fitness",
  "selfie","girl","boy","fun","smile","amazing",
  "instadaily","tbt",
]);

// ─────────────────────────────────────────────
// BUILDERS DE PROMPTS
// ─────────────────────────────────────────────

/**
 * Construye el prompt para generar un guión de Reel.
 */
export function buildReelScriptPrompt(input: ReelScriptInput): string {
  const duration = Math.min(10, input.durationSeconds ?? 10);
  const midEnd = Math.max(4, duration - 3);
  const toneMap: Record<ReelTone, string> = {
    informal: "cercano, coloquial, como si hablaras con un amigo",
    experto: "autoridad relajada, no arrogante — sabes de lo que hablas pero no suenas pedante",
    divertido: "ligero, con humor sutil del nicho, entretenido",
    inspiracional: "motivador pero sin clichés, con historias reales",
  };
  const tone = input.tone ? toneMap[input.tone] : "natural, directo y humano";

  const nicheContext: Record<ReelNiche, string> = {
    gastronomia: "negocio gastronómico (restaurante, catering, chef, cafetería, pastelería)",
    servicios: "servicio profesional (consultoría, coaching, agencia, freelancer)",
    ecommerce: "tienda online o producto físico",
    personal_brand: "marca personal (creador, influencer, experto en un tema)",
    educacion: "educación o formación (cursos, talleres, academia)",
    general: "negocio general",
  };

  const objectiveInstructions: Record<ReelObjective, string> = {
    venta: `
Objetivo: VENTA DIRECTA (Reel dinámico de máximo ${duration} segundos)
Estructura obligatoria:
1. Hook (0-3s): Muestra el resultado final o dolor clave antes de explicar cómo
2. Problema y Solución (3-${midEnd}s): Presenta el valor directo de tu producto o servicio
3. CTA (${midEnd}-${duration}s): Uno solo y directo: "Escríbeme por DM" o "Link en bio"`,

    educacion: `
Objetivo: EDUCATIVO (Reel dinámico de máximo ${duration} segundos) — maximizar saves y shares
Estructura obligatoria:
1. Hook (0-3s): "El error que comete el 90% al hacer [X]" o "Cómo [resultado] rápido"
2. Micro-lección o Pasos (3-${midEnd}s): 2 puntos ultra concretos y de valor inmediato
3. CTA (${midEnd}-${duration}s): "Guárdalo para no olvidarlo"`,

    viralidad: `
Objetivo: VIRALIDAD / ALCANCE MASIVO (Reel dinámico de máximo ${duration} segundos)
Estructura obligatoria:
1. Hook (0-3s): Opinión fuerte, dato sorprendente o afirmación polarizante
2. Desarrollo (3-${midEnd}s): Tesis breve con 1 argumento contundente
3. CTA (${midEnd}-${duration}s): "¿Estás de acuerdo? Coméntalo abajo"`,

    branding: `
Objetivo: BRANDING / AUTORIDAD (Reel dinámico de máximo ${duration} segundos)
Estructura obligatoria:
1. Hook (0-3s): Anécdota o afirmación rápida de autoridad
2. Contexto e Insight (3-${midEnd}s): La lección directa aplicable
3. CTA (${midEnd}-${duration}s): "Sígueme para más"`,
  };

  return `Eres un guionista especialista en Instagram Reels para negocios de ${nicheContext[input.niche]}.

TEMA DEL REEL: ${input.topic}
DURACIÓN OBJETIVO: ${duration} segundos
TONO: ${tone}
FORMATO: ${input.onCamera !== false ? "Talking head (persona habla a cámara)" : "Texto animado (sin persona on-camera)"}
${input.brandVoice ? `\nVOZ DE MARCA (úsala como referencia de estilo):\n${input.brandVoice}` : ""}

${objectiveInstructions[input.objective]}

REGLAS ABSOLUTAS DE ESCRITURA:
- Cada línea del guión hablado debe tener máx 10 palabras (se lee más rápido)
- Una idea por segundo en el desarrollo
- PROHIBIDO usar frases de IA: "en el vertiginoso mundo", "desbloquea", "sumérgete", "potencia", "revoluciona", "increíble oportunidad"
- El texto debe sonar como una persona real hablando, no como un copy corporativo
- Números específicos siempre que sea posible ("47 días", "3 pasos", "el 78% de")
- El CTA va al FINAL, uno solo, específico

Entrega el guión en este formato EXACTO:

[GUIÓN: ${input.topic}]
[Duración: ${duration}s | Objetivo: ${input.objective}]

[00-03s] HOOK
Visual: [qué se ve en cámara]
Texto overlay: "[texto en pantalla]"
Narración: "[lo que dice la persona]"

[03-XXs] DESARROLLO
Visual: [qué se ve]
Narración: "[texto línea por línea]"

[XXs-fin] CTA
Narración: "[CTA exacto]"
Texto overlay: "[texto de refuerzo]"

---
CAPTION SUGERIDO (máx 2200 chars, conversacional):
[caption]

HASHTAGS (máx 5, de nicho específico, sin shadowban):
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5`;
}

/**
 * Construye el prompt para generar una secuencia de Stories.
 */
export function buildStorySequencePrompt(input: StorySequenceInput): string {
  const objectiveMap: Record<StoryObjective, string> = {
    venta: "VENTA DIRECTA — Hook → Problema → Solución → Prueba → CTA de compra/DM",
    educacion: "EDUCATIVO — Promesa → Pasos (3 máx) → Recap → CTA de guardado o profundización",
    conexion: "CONEXIÓN / COMUNIDAD — Historia personal → Conflicto → Cambio → Lección → Pregunta al DM",
    anuncio: "LANZAMIENTO / ANUNCIO — Teaser misterioso → Revelación → Beneficio → Detalles → CTA urgente",
    encuesta: "INVESTIGACIÓN / ENCUESTA — Contexto → Poll o Quiz → Resultado prometido → Próxima story",
  };

  return `Eres un especialista en Instagram Stories para negocios de tipo ${input.niche}.

TEMA: ${input.topic}
OBJETIVO: ${objectiveMap[input.objective]}
CTA FINAL: ${input.cta}
${input.brandVoice ? `\nVOZ DE MARCA:\n${input.brandVoice}` : ""}

Crea una secuencia de 5-7 Stories narrativas. 

REGLAS ABSOLUTAS:
- Máx 125 caracteres de texto por slide (límite real de Instagram)
- Una sola idea por slide
- Un sticker de interacción (Poll, Quiz, Slider, DM, Pregunta) por slide, máx
- Cero hashtags en Stories (son contraproducentes)
- Sin @ a cuentas externas
- El texto debe sonar humano, conversacional, directo — como un mensaje de WhatsApp a un amigo
- PROHIBIDO usar frases de IA: "increíble", "revolucionario", "potencia tu", "desbloquea"

Formato de entrega:

SLIDE 1 — [Función]
Texto: "[máx 125 chars]"
Visual: [descripción de imagen/video/fondo de color]
Sticker: [nombre + opciones si aplica]

SLIDE 2 — [Función]
[...]

SLIDE N — CTA FINAL
Texto: "[máx 125 chars]"
Acción: ${input.cta}
Sticker: [DM / Link / Pregunta]

---
TIPS DE PUBLICACIÓN:
- Hora recomendada: [rango]
- Seguimiento en 24h: [qué revisar]`;
}

/**
 * Construye el prompt para generar un calendario de contenido.
 */
export function buildCalendarPrompt(input: CalendarInput): string {
  const stageConfig = {
    despegue: { reels: "5-7 por semana", mix: "60% educativo / 30% entretenimiento / 10% venta", note: "Priorizar volumen y consistencia. El algoritmo necesita datos." },
    traccion: { reels: "4-5 por semana", mix: "40% educativo / 30% entretenimiento / 20% detrás de cámaras / 10% venta", note: "Ya hay datos. Doblar en los formatos que funcionaron." },
    escalado: { reels: "3-4 por semana", mix: "35% educativo / 25% autoridad / 25% detrás de cámaras / 15% venta", note: "Calidad sobre cantidad. La confianza es el activo principal." },
  };

  const stage = stageConfig[input.growthStage];
  const days = input.periodDays ?? 30;

  return `Eres un estratega de crecimiento orgánico en Instagram.

NEGOCIO: ${input.businessDescription}
NICHO: ${input.niche}
META: ${input.businessGoal}
ETAPA DE CRECIMIENTO: ${input.growthStage} (${input.currentFollowers ? `${input.currentFollowers} seguidores` : "seguidores no especificados"})
CAPACIDAD SEMANAL: ${input.weeklyCapacity} Reels por semana
PERÍODO: ${days} días
FRECUENCIA RECOMENDADA: ${stage.reels}
MIX DE CONTENIDO: ${stage.mix}
NOTA ESTRATÉGICA: ${stage.note}

Crea un calendario de ${days} días con exactamente ${input.weeklyCapacity} Reels por semana.

REGLAS:
- Cada Reel debe tener: tipo de contenido, tema específico (no genérico), hook sugerido, objetivo de la publicación
- Distribuir el mix correctamente según los porcentajes indicados
- Incluir días y horarios óptimos para el nicho
- Los temas deben ser específicos al negocio descrito, no genéricos
- Incluir métricas a revisar al final de cada semana

Formato:

CALENDARIO ${days} DÍAS — [Negocio/Nicho]
Etapa: ${input.growthStage} | Meta: ${input.businessGoal}

SEMANA 1
├─ [Día]: 🎓/😄/🎥/💰 [Tipo] — "[Tema específico]"
│   Hook: "[Frase de apertura sugerida]"
│   Objetivo: [saves / comentarios / shares / DMs]
[...]

MÉTRICAS A REVISAR SEMANALMENTE:
- [ ] Reach total
- [ ] Tasa de retención promedio  
- [ ] Saves y shares
- [ ] Nuevos seguidores originados en Reels

HORARIOS RECOMENDADOS PARA ESTE NICHO:
[lista de días y horarios]`;
}

/**
 * Construye el prompt para la auditoría anti-ban.
 */
export function buildAntiBanAuditPrompt(input: AntiBanAuditInput): string {
  return `Eres un auditor especializado en las políticas de moderación de Instagram (Meta).

TIPO DE CONTENIDO: ${input.contentType}

CAPTION A REVISAR:
"""
${input.caption}
"""

HASHTAGS A REVISAR: ${input.hashtags.map(h => `#${h}`).join(" ")}

Realiza una auditoría completa:

1. HASHTAGS: Identifica cuáles están en listas negras de shadowban, cuáles son de alto riesgo y cuáles son seguros.

2. CAPTION: Detecta palabras, frases o patrones que activan filtros automáticos de Meta:
   - Combinaciones de "gratis/regalo" + "ganar/ingreso"
   - Promesas de resultados extraordinarios no respaldadas
   - CTAs agresivos repetidos múltiples veces
   - Texto todo en mayúsculas
   - Frases que activan detección de spam financiero o de salud

3. SCORE: Calcula el score de riesgo (0-100) según:
   - Hashtag en lista negra permanente: +25 pts c/u (máx 50)
   - Palabra/frase de riesgo alto en caption: +15 pts c/u (máx 30)
   - Hashtag de riesgo moderado sin uso estratégico: +5 pts c/u (máx 10)
   - Más de 5 hashtags: +10 pts
   - Promesas no respaldadas: +10 pts

4. NIVEL DE ALERTA:
   - 0-20: 🟢 SEGURO
   - 21-40: 🟡 PRECAUCIÓN
   - 41-70: 🟠 RIESGO
   - 71-100: 🔴 PELIGRO

5. VERSIÓN CORREGIDA: Reescribe el caption y los hashtags eliminando todos los elementos de riesgo. Mantén el mismo mensaje central.

Responde en este formato JSON:
{
  "score": [número],
  "level": "[seguro|precaucion|riesgo|peligro]",
  "bannedHashtags": [lista de hashtags en lista negra],
  "riskyHashtags": [lista de hashtags de riesgo moderado],
  "captionIssues": [lista de problemas encontrados en el caption],
  "correctedCaption": "[caption corregido]",
  "correctedHashtags": [lista de hashtags seguros, máx 5],
  "aptToPublish": [true si score < 41, false si >= 41],
  "rawReport": "[reporte completo en texto, con emojis de semáforo, legible para el usuario]"
}`;
}

// ─────────────────────────────────────────────
// FUNCIONES DE EJECUCIÓN DIRECTA
// ─────────────────────────────────────────────

/**
 * Genera un guión de Reel usando Gemini.
 */
export async function generateReelScript(input: ReelScriptInput): Promise<string> {
  const prompt = buildReelScriptPrompt(input);
  return generateFreeText(prompt);
}

/**
 * Genera una secuencia de Stories usando Gemini.
 */
export async function generateStorySequence(input: StorySequenceInput): Promise<string> {
  const prompt = buildStorySequencePrompt(input);
  return generateFreeText(prompt);
}

/**
 * Genera un calendario de Reels usando Gemini.
 */
export async function generateReelCalendar(input: CalendarInput): Promise<string> {
  const prompt = buildCalendarPrompt(input);
  return generateFreeText(prompt);
}

/**
 * Audita contenido con el sistema anti-ban.
 * Primero hace validación local (hashtags en lista negra) y luego llama a Gemini para análisis profundo.
 */
export async function runAntiBanAudit(input: AntiBanAuditInput): Promise<AntiBanAuditResult> {
  // Pre-validación local rápida (sin LLM)
  const localBanned = input.hashtags.filter(h => BANNED_HASHTAGS.has(h.toLowerCase()));
  const localRisky = input.hashtags.filter(h => RISKY_HASHTAGS.has(h.toLowerCase()));

  // Si hay hashtags baneados localmente, calcular score mínimo
  const localScore = (localBanned.length * 25) + (localRisky.length * 5);

  // Llamar a Gemini para análisis profundo
  const prompt = buildAntiBanAuditPrompt(input);
  const rawResponse = await generateFreeText(prompt);

  // Intentar parsear el JSON de respuesta
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Asegurar que el score considera la validación local
      const finalScore = Math.max(parsed.score ?? 0, localScore);
      const levelMap = (s: number): AntiBanAuditResult["level"] => {
        if (s <= 20) return "seguro";
        if (s <= 40) return "precaucion";
        if (s <= 70) return "riesgo";
        return "peligro";
      };
      return {
        score: Math.min(finalScore, 100),
        level: levelMap(finalScore),
        bannedHashtags: [...new Set([...(parsed.bannedHashtags ?? []), ...localBanned])],
        riskyHashtags: [...new Set([...(parsed.riskyHashtags ?? []), ...localRisky])],
        captionIssues: parsed.captionIssues ?? [],
        correctedCaption: parsed.correctedCaption ?? input.caption,
        correctedHashtags: parsed.correctedHashtags ?? [],
        aptToPublish: finalScore < 41,
        rawReport: parsed.rawReport ?? rawResponse,
      };
    }
  } catch {
    // Si el JSON falla, devolver resultado básico con análisis local
  }

  // Fallback: resultado basado solo en validación local
  const fallbackScore = Math.min(localScore, 100);
  const fallbackLevel: AntiBanAuditResult["level"] = fallbackScore <= 20 ? "seguro" : fallbackScore <= 40 ? "precaucion" : fallbackScore <= 70 ? "riesgo" : "peligro";

  return {
    score: fallbackScore,
    level: fallbackLevel,
    bannedHashtags: localBanned,
    riskyHashtags: localRisky,
    captionIssues: [],
    correctedCaption: input.caption,
    correctedHashtags: input.hashtags.filter(h => !BANNED_HASHTAGS.has(h.toLowerCase())).slice(0, 5),
    aptToPublish: fallbackScore < 41,
    rawReport: rawResponse,
  };
}

// ─────────────────────────────────────────────
// BUILDER: ADS ESPÍA DE COMPETENCIA
// ─────────────────────────────────────────────

/**
 * Construye el prompt para el análisis de inteligencia de ads pagados de la competencia.
 */
export function buildAdSpyPrompt(input: AdSpyInput): string {
  const platformInstructions: Record<AdPlatform, string> = {
    meta: `
FUENTE PRINCIPAL: Meta Ad Library (https://www.facebook.com/ads/library/)
Busca cada competidor en: https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${input.country ?? "ALL"}&q=[NOMBRE_COMPETIDOR]
Analiza: ads activos, fechas de inicio, formatos, plataformas donde corren (FB/IG/Messenger).`,
    tiktok: `
FUENTE PRINCIPAL: TikTok Creative Center (https://ads.tiktok.com/business/creativecenter/)
Filtrar por industria relevante y región LATAM o ${input.country ?? "todos los países"}.
Extraer: CTR promedio, hook rate (% que ve los primeros 6s), duración de video óptima en el nicho.`,
    google: `
FUENTE PRINCIPAL: Google Ads Transparency Center (https://adstransparency.google.com/)
Busca cada competidor para ver sus anuncios de búsqueda y display activos.
Analiza: headlines de RSAs, extensiones activas, keywords que probablemente están pagando.`,
    todas: `
FUENTES A REVISAR (en orden de prioridad):
1. Meta Ad Library — https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${input.country ?? "ALL"}&q=[NOMBRE]
2. TikTok Creative Center — https://ads.tiktok.com/business/creativecenter/
3. Google Ads Transparency Center — https://adstransparency.google.com/
Comenzar con Meta ya que es la más completa para el mercado LATAM.`,
  };

  return `Eres un analista de inteligencia competitiva especializado en publicidad pagada para el mercado latinoamericano.

COMPETIDORES A INVESTIGAR: ${input.competitors.join(", ")}
NICHO/INDUSTRIA: ${input.niche}
PLATAFORMA: ${input.platform}
${input.country ? `PAÍS/REGIÓN: ${input.country}` : ""}
OBJETIVO DE LA INVESTIGACIÓN: ${input.objective ?? "Identificar ángulos ganadores y oportunidades no explotadas"}

${platformInstructions[input.platform]}

PRINCIPIO FUNDAMENTAL DE INTERPRETACIÓN:
- Ad activo > 30 días = rentable (el algoritmo no lo habría dejado vivir si no generara resultados)
- Ad activo > 90 días = ganador confirmado, ángulo probado en el tiempo
- Ad activo > 180 días = "evergreen winner" — duplicar y adaptar es una apuesta segura
- Muchas variantes del mismo concepto = están escalando ese ángulo agresivamente
- Ad muerto < 7 días = falló, evitar ese ángulo

PARA CADA COMPETIDOR, EXTRAER:
1. Total de ads activos y el más antiguo (en días)
2. Formatos que más usan (imagen, video, carrusel)
3. El hook de cada ad ganador (primeros 3 segundos o primera línea del texto)
4. El ángulo central: ¿dolor, deseo, prueba social, identidad, curiosidad?
5. El CTA y destino (WhatsApp, formulario, landing page, llamada)
6. Estimación de presupuesto: 1-3 ads = bajo, 4-10 = medio, 10+ = alto

DESPUÉS DE ANALIZAR TODOS LOS COMPETIDORES:
- Clasificar ángulos: saturados (todos los usan) / poco explotados (1-2 usan) / NO explotados (nadie usa — aquí está la oportunidad)
- Los ángulos no explotados son el insumo más valioso para crear copy diferenciado

FORMATO DE RESPUESTA:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕵️ REPORTE DE INTELIGENCIA DE ADS
Competidores: ${input.competitors.join(", ")}
Nicho: ${input.niche} | Plataforma: ${input.platform}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RESUMEN DE ACTIVIDAD PUBLICITARIA
[Tabla con: Competidor | Ads activos | Ad más antiguo | Formatos | Presupuesto est.]

🏆 CREATIVOS GANADORES (ads >30 días)
[Para cada ad ganador: marca, días activo, hook, ángulo, promesa, CTA, destino, por qué funciona]

🗺️ MAPA DE ÁNGULOS DEL MERCADO
SATURADOS: [ángulos usados por todos]
POCO EXPLOTADOS: [ángulos usados por 1-2]
❌ NO EXPLOTADOS (OPORTUNIDAD): [ángulos que nadie usa]

💡 RECOMENDACIONES PARA TU CAMPAÑA
[Ángulos prioritarios a testear, formatos dominantes del nicho, 3 hooks sugeridos, CTA recomendado]

⚠️ NOTAS
[Vigencia del reporte, advertencias, cuándo actualizar]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGLAS DE ESCRITURA:
- Cero análisis genérico — todo debe ser específico a los competidores y nicho indicados
- Si no puedes acceder a una fuente, indicarlo claramente y proporcionar el proceso manual paso a paso
- El reporte debe poder usarse directamente como input para un copywriter de ads`;
}

// ─────────────────────────────────────────────
// BUILDER: ADS COPYWRITER LATAM
// ─────────────────────────────────────────────

/**
 * Construye el prompt para generar copy de ads pagados calibrado para mercado LATAM.
 */
export function buildAdCopyPrompt(input: AdCopyInput): string {
  const objectiveInstructions: Record<AdObjective, string> = {
    whatsapp: `
OBJETIVO: MENSAJES A WHATSAPP
Estructura: Hook → Agitación/Promesa → Prueba social local → CTA ultra-específico
Regla de oro del CTA: decirle exactamente qué escribir. Ej: "Escríbeme la palabra PRECIO al WhatsApp y te respondo en menos de 5 minutos"
El CTA debe reducir la fricción al mínimo — no "Contáctanos", sino "Escríbeme HOY"`,
    leads: `
OBJETIVO: FORMULARIO DE LEADS (calificación previa a venta)
Estructura: Hook de dolor específico → Promesa con número concreto → Filtro de calificación → CTA a formulario
Regla: El hook debe ser tan específico que quien no califica se autoexcluye. Baja el costo por lead calificado.
CTA: "Déjame tus datos y te llamo hoy mismo" / "Regístrate y te contactamos en menos de 24h"`,
    ventas: `
OBJETIVO: VENTA DIRECTA (e-commerce o producto digital)
Estructura: Hook de resultado/transformación → Problema que resuelve → Diferenciador → Precio + condición → CTA de compra
Regla: Incluir prueba social numérica local. "Más de 500 pedidos en [país]" supera cualquier claim genérico.
CTA: "Compra ahora" / "Agregar al carrito" / "Obtener mi [producto]"`,
    trafico_local: `
OBJETIVO: TRÁFICO A TIENDA FÍSICA
Estructura: Hook de proximidad o exclusividad local → Qué encontrarán / qué se llevan → Reducir barrera (sin cita, abierto hoy) → CTA con ubicación
Regla CRÍTICA: Mencionar siempre la ciudad o el barrio. "En el centro de [ciudad]" convierte 3x más que una dirección genérica.
CTA: "Visítanos hoy" / "Ver ubicación" / "Ir ahora"`,
  };

  const platformSpecs: Record<"meta" | "tiktok" | "ambas", string> = {
    meta: `
ESPECS META ADS:
- Texto principal: 50-150 palabras para WhatsApp/leads, 30-80 para e-commerce
- La PRIMERA línea es el gancho (aparece antes del "ver más") — debe ser la más fuerte
- Headline: MÁXIMO 40 caracteres — la promesa más fuerte del ad
- Descripción: MÁXIMO 30 caracteres — refuerza el CTA
- Botones disponibles: "Enviar mensaje" (WhatsApp) / "Más información" / "Comprar" / "Registrarte" / "Llamar"`,
    tiktok: `
ESPECS TIKTOK ADS:
- Caption: MÁXIMO 100 caracteres — solo refuerza el hook visual, no cuenta la historia completa
- El copy real va en el VIDEO (texto overlay + narración)
- Estructura del video: [0-3s] Hook visual+verbal → [3-10s] Problema/promesa → [10-XXs] Demo/prueba → [últimos 3s] CTA directo
- Tono: más rápido, más crudo, menos producción = más confianza en TikTok`,
    ambas: `
ESPECS META ADS:
- Texto principal: 50-150 palabras | Headline: máx 40 chars | Descripción: máx 30 chars
- Primera línea = el gancho más fuerte (aparece antes del "ver más")
ESPECS TIKTOK ADS:
- Caption: máx 100 chars | Story real va en el video
- Formato: [0-3s] Hook → [3-10s] Promesa → [10-XXs] Demo → [últimos 3s] CTA`,
  };

  const budgetContext = input.dailyBudget
    ? input.dailyBudget < 20
      ? "Presupuesto MUY LIMITADO (<$20/día): generar 3 variantes de ángulo. Testing en fases de 5-7 días."
      : input.dailyBudget < 50
      ? "Presupuesto PEQUEÑO ($20-50/día): generar 3 variantes de ángulo + 2 de hook para el ganador."
      : "Presupuesto MEDIO ($50+/día): generar 3 ángulos + 3 hooks + 2 variantes de CTA. Testing más agresivo."
    : "Presupuesto no especificado: asumir presupuesto pequeño ($20-50/día), generar 3 variantes de ángulo.";

  return `Eres un copywriter especializado en anuncios pagados para el mercado latinoamericano.
Tu foco: PyMEs locales, español que suena como una persona real, copy que convierte sin sonar corporativo.

NEGOCIO: ${input.businessDescription}
OBJETIVO DEL AD: ${input.adObjective}
NICHO: ${input.niche}
PLATAFORMA: ${input.platform}
${input.country ? `PAÍS/MERCADO: ${input.country}` : ""}
${input.city ? `CIUDAD: ${input.city} — mencionarla en el copy para localización` : ""}
${input.brandVoice ? `\nVOZ DE MARCA:\n${input.brandVoice}` : ""}
${input.socialProof ? `\nPRUEBA SOCIAL DISPONIBLE:\n${input.socialProof}` : ""}
${input.competitorIntelligence ? `\nINTELIGENCIA DE COMPETENCIA (usar los ángulos NO EXPLOTADOS como prioridad):\n${input.competitorIntelligence}` : ""}

${objectiveInstructions[input.adObjective]}

${platformSpecs[input.platform]}

PRESUPUESTO: ${budgetContext}

FÓRMULA PARA ESTE MERCADO — ÁNGULOS A CUBRIR:
🔴 Ad A — DOLOR: Abre identificando el problema exacto que tiene el cliente ideal
🔵 Ad B — DESEO: Abre con la transformación/resultado que quiere lograr
🟡 Ad C — PRUEBA SOCIAL: Abre con un dato concreto de clientes reales o resultados medibles

PALABRAS Y FRASES PROHIBIDAS (matan conversiones en LATAM):
- "Desbloquea tu potencial" / "Revoluciona tu negocio" / "Solución de vanguardia"
- "En el competitivo mercado actual" / "Haz clic aquí para más información"
- Cualquier frase que suene traducida del inglés
- Más de 3 emojis por ad

REGLA MAESTRA: Si el ad suena a que fue traducido del inglés, reescribir. El cliente LATAM lo detecta al instante.

FORMATO DE RESPUESTA:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 SET DE ADS: [Nombre del negocio]
🎯 Objetivo: ${input.adObjective} | 📱 Plataforma: ${input.platform}
💰 Presupuesto: ${input.dailyBudget ? `$${input.dailyBudget}/día` : "a definir"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Para cada variante (A, B, C):]
🔴/🔵/🟡 AD [letra] — Ángulo: [NOMBRE]
Texto principal: "[copy completo]"
Headline (máx 40 chars): "[headline]"
Descripción (máx 30 chars): "[descripción]"
Botón CTA: [texto del botón]
Nota visual: [qué imagen o video usar]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INSTRUCCIONES DE CARGA EN META ADS MANAGER:
[Objetivo de campaña, configuración de audiencia sugerida, presupuesto por variante, duración del test, métrica de decisión]

🔄 SIGUIENTE PASO:
[Qué revisar después de 5-7 días y qué generar a continuación]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─────────────────────────────────────────────
// FUNCIONES DE EJECUCIÓN: ADS
// ─────────────────────────────────────────────

/**
 * Ejecuta el análisis de inteligencia de ads de la competencia.
 */
export async function runAdSpy(input: AdSpyInput): Promise<string> {
  const prompt = buildAdSpyPrompt(input);
  return generateFreeText(prompt);
}

/**
 * Genera copy de ads pagados para mercado LATAM.
 */
export async function generateAdCopy(input: AdCopyInput): Promise<string> {
  const prompt = buildAdCopyPrompt(input);
  return generateFreeText(prompt);
}
