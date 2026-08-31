import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { generateFreeText } from "./gemini-free";

// 1. Definición del Estado del Grafo para Estrategia
export const StrategyAnnotation = Annotation.Root({
  businessType: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "General" }),
  goal: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "Ventas" }),
  expectations: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  promotions: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  businessData: Annotation<any>({ reducer: (a, b) => b ?? a, default: () => ({}) }),
  connectedPlatforms: Annotation<string[]>({ reducer: (a, b) => b ?? a, default: () => ["Instagram", "Facebook"] }),
  history: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "Sin historial." }),
  nicheContext: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  promptStyles: Annotation<any[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  postsPerWeek: Annotation<number>({ reducer: (a, b) => b ?? a, default: () => 5 }),
  analysis: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  rawStrategy: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  strategy: Annotation<any[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  revisionCount: Annotation<number>({ reducer: (a, b) => b ?? a, default: () => 0 }),
  feedback: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  approved: Annotation<boolean>({ reducer: (a, b) => b ?? a, default: () => false }),
});

export type StrategyState = typeof StrategyAnnotation.State;

// 2. Nodo 1: Análisis Estratégico
async function analysisNode(state: StrategyState): Promise<Partial<StrategyState>> {
  console.log(`[LangGraph Strategy] analysisNode - Analizando para: ${state.businessType}`);
  
  const prompt = `Eres un Director de Estrategia Digital Senior. 
Tu tarea es analizar los siguientes datos de un cliente y proponer los pilares de contenido para una estrategia de 7 a 14 días.

DATOS DEL CLIENTE:
- Rubro: ${state.businessType}
- Objetivo Principal: ${state.goal}
- Expectativas Especiales: ${state.expectations}
${state.promotions ? `- Promociones y Ofertas Clave del Local: "${state.promotions}"\n` : ""}- Redes Disponibles: ${state.connectedPlatforms.join(", ")}

PROPORCIONA:
1. Análisis del público objetivo.
2. 3 Pilares de contenido (ej: Educativo, Venta/Promociones, Entretenimiento).
3. Tono de comunicación recomendado.
4. Frecuencia de publicación sugerida.

Sé profesional y estratégico. NUNCA menciones que eres una IA o Inteligencia Artificial. Refiérete a ti mismo como parte de "nuestros agentes especializados".`;

  const analysis = await generateFreeText(prompt);
  return { analysis };
}

// 3. Nodo 2: Generación de Plan de Contenidos
async function planningNode(state: StrategyState): Promise<Partial<StrategyState>> {
  console.log(`[LangGraph Strategy] planningNode - Generando plan táctico...`);

  // BH Skills rules adaptation
  const mixDeContenido = "40% Educativo / 30% Entretenimiento o Conexión / 20% Autoridad (Detrás de cámaras) / 10% Venta Directa";
  const rules = `
REGLAS Y MENTALIDAD DE BH-SKILLS PARA CRECIMIENTO ORGÁNICO:
1. Mix de Contenido Obligatorio: ${mixDeContenido}.
2. Los temas deben ser ESPECÍFICOS, no genéricos. Resuelve dolores reales.
3. El Hook debe ser un "Scroll-Stopper" (ej. "El error que comete el 90% al hacer X").
4. Cero frases de IA ("en el vertiginoso mundo", "descubre", "sumérgete").
5. Los CTA (Call to Action) deben ser únicos y claros (ej. "Escríbenos al WhatsApp", "Visita el enlace en bio").
6. IMPORTANTE: NUNCA menciones que eres una IA o Inteligencia Artificial. Refiérete a ti mismo y a tus acciones como "nuestros agentes" o "nuestro equipo de agentes especializados". Tampoco hables de "lo que se puede hacer con IA".
7. REGLA OBLIGATORIA DE CONTACTO: Siempre incluye de forma clara los datos de contacto de la empresa en el cierre o CTA del post (WhatsApp, Sitio Web, Correo o Ubicación).`;

  const stylesContext = state.promptStyles && state.promptStyles.length > 0
    ? `\nESTILOS VISUALES DE PROMPTS IA SELECCIONADOS POR EL USUARIO PARA INSPIRAR O BASAR LAS IMÁGENES:
${state.promptStyles.map((s: any) => `- ID: "${s.id}" | Título: "${s.title}" | Categoría: "${s.category}" | Estilo: "${s.description}" | Preview: "${s.previewUrl || ''}"`).join('\n')}

INSTRUCCIÓN OBLIGATORIA DE ESTILOS VISUALES:
Distribuye y asigna inteligentemente entre los posts de la estrategia aquellos estilos visuales de Prompts IA de la lista anterior que mejor encajen con la idea de cada post.
Por cada post, incluye:
- "visualStyle": "Título del estilo asignado de la lista (ej: ${state.promptStyles[0]?.title || 'Meta Ads'})",
- "promptTemplateId": "ID exacto del estilo asignado (ej: ${state.promptStyles[0]?.id || 'style-meta-ads'})",
- "previewUrl": "URL de la imagen de previsualización del estilo asignado",
- "imageDirection": "Instrucción visual clara de cómo adaptar este estilo a este post específico"\n\n`
    : "";

  const contactLines: string[] = [];
  if (state.businessData?.businessName) contactLines.push(`- Nombre Empresa / Marca: ${state.businessData.businessName}`);
  if (state.businessData?.whatsapp || state.businessData?.phone) contactLines.push(`- WhatsApp / Teléfono de Contacto: ${state.businessData.whatsapp || state.businessData.phone}`);
  if (state.businessData?.website) contactLines.push(`- Sitio Web: ${state.businessData.website}`);
  if (state.businessData?.email) contactLines.push(`- Correo Electrónico: ${state.businessData.email}`);
  if (state.businessData?.address) contactLines.push(`- Dirección / Ubicación: ${state.businessData.address}`);

  const contactContext = contactLines.length > 0
    ? `\nDATOS DE CONTACTO OFICIALES DE LA EMPRESA (OBLIGATORIO: Integra estos canales en el contenido o CTA de los posts):\n${contactLines.join('\n')}\n\n`
    : "";

  const prompt = `Eres un Social Media Planner experto, entrenado con los mejores frameworks de crecimiento (BH Skills). 
Basándote en el siguiente análisis, genera un plan táctico de publicaciones.

ANÁLISIS ESTRATÉGICO:
${state.analysis}

${contactContext}${state.promotions ? `PROMOCIONES Y OFERTAS CLAVE DEL NEGOCIO (Incluye estas promociones, precios o combos reales en los ganchos y copys comerciales):\n"${state.promotions}"\n\n` : ""}${state.nicheContext ? `CONTEXTO DEL RADAR DE NICHO (Últimos 30 días):\n${state.nicheContext}\n\n` : ""}${stylesContext}

HISTORIAL DE POSTS Y RENDIMIENTO (Analiza esto para replicar qué formatos/ideas tuvieron más likes/alcance, y descarta lo que no sirvió):
${state.history}

${state.feedback ? `\n¡ATENCIÓN! El Agente Revisor rechazó tu última estrategia por el siguiente motivo:\n"${state.feedback}"\nCORRIGE Y MEJORA ESTA VERSIÓN PARA QUE SEA APROBADA.\n` : ""}

${rules}

REGLAS DE NEGOCIO:
- Si la plataforma incluye 'TikTok', el formato DEBE ser 'Reel' o 'Video'.
- Formatos permitidos: Reel, Carrusel, Historia, Post Fijo.

DEBES GENERAR UNA ESTRUCTURA DE JSON válida que contenga un arreglo 'strategy' con exactamente este formato por cada publicación:
{
  "weekNumber": 1, 
  "dayOffset": 0, // 0 = hoy, 1 = mañana... hasta 6
  "suggestedTime": "HH:MM",
  "format": "Formato exacto",
  "hook": "Gancho corto y potente",
  "content": "Resumen del contenido a grabar/diseñar",
  "cta": "Llamado a la acción (incluyendo canal de contacto)"${state.promptStyles && state.promptStyles.length > 0 ? `,\n  "visualStyle": "Nombre del estilo de Prompts IA asignado",\n  "promptTemplateId": "ID del estilo asignado",\n  "previewUrl": "URL de preview del estilo",\n  "imageDirection": "Idea de la imagen adaptada"` : ""}
}

GENERA EXACTAMENTE ${state.postsPerWeek} PUBLICACIONES DISTRIBUIDAS EN LOS PRÓXIMOS 7 DÍAS (weekNumber: 1, dayOffset: de 0 a 6).
DEVUELVE ÚNICAMENTE EL JSON.`;

  const rawStrategy = await generateFreeText(prompt);
  return { rawStrategy };
}

// 4. Nodo 3: Refinamiento y Validación
async function validationNode(state: StrategyState): Promise<Partial<StrategyState>> {
  console.log(`[LangGraph Strategy] validationNode - Validando y formateando JSON...`);

  const prompt = `Eres un QA de Contenidos y Experto en JSON. 
Tu objetivo es limpiar y validar el siguiente plan de contenidos para asegurar que sea un JSON perfectamente válido y que cumpla con las reglas de negocio.

PLAN ORIGINAL:
${state.rawStrategy}

REGLAS A VALIDAR:
1. El formato debe ser un objeto JSON con una propiedad "strategy" que sea un arreglo de objetos.
2. Si aparece 'TikTok' en el contexto, asegúrate de que sus formatos sean 'Reel'.
3. Los 'dayOffset' deben ser números coherentes (0 a 14).
4. El texto de 'hook' y 'cta' debe ser profesional y persuasivo.
5. Conserva los campos visuales si están presentes: 'visualStyle', 'promptTemplateId', 'previewUrl', 'imageDirection'.

DEVUELVE ÚNICAMENTE EL OBJETO JSON LIMPIO. SIN MARKDOWN.`;

  const cleanJsonText = await generateFreeText(prompt);
  
  let strategy = [];
  try {
      const clean = cleanJsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      const obj = JSON.parse(clean);
      strategy = obj.strategy || [];
  } catch (e) {
      console.error("[LangGraph Strategy] Error parsing final JSON:", e);
      // Fallback: intentar parsear el rawStrategy si el validation falló
      try {
        const cleanRaw = state.rawStrategy.replace(/```json/g, '').replace(/```/g, '').trim();
        const objRaw = JSON.parse(cleanRaw);
        strategy = objRaw.strategy || [];
      } catch (e2) {}
  }

  return { strategy };
}

// 4.5. Nodo 4: QA Revisor (Nuevo)
async function evaluationNode(state: StrategyState): Promise<Partial<StrategyState>> {
  console.log(`[LangGraph Strategy] evaluationNode - Revisión número ${state.revisionCount + 1}`);

  const prompt = `Eres un Revisor de Estrategia de Contenidos QA Senior.
Tu trabajo es revisar la estrategia de posts propuesta y verificar si cumple con las expectativas del cliente y si tiene sentido con el rendimiento histórico.

EXPECTATIVAS DEL CLIENTE:
${state.expectations || "No hay expectativas específicas. (Se espera alta calidad)."}

RENDIMIENTO HISTÓRICO:
${state.history}

ESTRATEGIA PROPUESTA:
${JSON.stringify(state.strategy, null, 2)}

INSTRUCCIONES:
1. Evalúa críticamente si la estrategia es coherente, si respeta lo que pidió el cliente, y si innova en base al historial (replicando lo que tuvo métricas altas y evitando lo que tuvo bajas).
2. Si la estrategia es muy buena, apruébala.
3. Si le falta precisión, no cumple la expectativa o repite mucho el historial, recházala y da retroalimentación detallada para que el Planner la mejore.

DEVUELVE ÚNICAMENTE UN JSON válido con este formato:
{
  "approved": boolean,
  "feedback": "razón de rechazo o de aprobación"
}
SIN MARKDOWN.`;

  const reviewText = await generateFreeText(prompt);
  let approved = false;
  let feedback = "No se pudo validar la estrategia.";
  try {
      const clean = reviewText.replace(/```json/g, '').replace(/```/g, '').trim();
      const obj = JSON.parse(clean);
      approved = !!obj.approved;
      feedback = obj.feedback || "";
  } catch (e) {
      console.error("[LangGraph Strategy] Error parsing review JSON:", e);
      approved = true; // Fallback to true if AI hallucinates
  }

  return { approved, feedback, revisionCount: state.revisionCount + 1 };
}

// 5. Construcción del Grafo
export function createStrategyWorkflow() {
  return new StateGraph(StrategyAnnotation)
    .addNode("analyze", analysisNode)
    .addNode("plan", planningNode)
    .addNode("validate", validationNode)
    .addNode("review", evaluationNode)
    .addEdge(START, "analyze")
    .addEdge("analyze", "plan")
    .addEdge("plan", "validate")
    .addEdge("validate", "review")
    .addConditionalEdges(
       "review",
       (state: StrategyState) => {
          if (state.approved || state.revisionCount >= 3) {
             console.log(`[LangGraph Strategy] Review completado. Aprobado: ${state.approved}. Ciclo: ${state.revisionCount}`);
             return "end";
          }
          console.log(`[LangGraph Strategy] Review fallido. Motivo: ${state.feedback}. Volviendo al plan...`);
          return "loop";
       },
       {
          end: END,
          loop: "plan"
       }
    )
    .compile();
}

/**
 * Ejecuta el flujo completo de estrategia profesional
 */
export async function runProfessionalStrategyWorkflow(
    businessType: string, 
    goal: string, 
    expectations: string, 
    connectedPlatforms: string[],
    history: string,
    nicheContext: string = "",
    postsPerWeek: number = 5,
    promotions: string = "",
    promptStyles: any[] = [],
    businessData: any = {}
) {
  const app = createStrategyWorkflow();
  const initialState = {
    businessType,
    goal,
    expectations,
    promotions,
    businessData,
    connectedPlatforms,
    history,
    nicheContext,
    promptStyles,
    postsPerWeek,
    analysis: "",
    rawStrategy: "",
    strategy: [],
    revisionCount: 0,
    feedback: "",
    approved: false
  };

  try {
    const finalState = await app.invoke(initialState);
    return {
      analysis: finalState.analysis,
      strategy: finalState.strategy
    };
  } catch (error) {
    console.error("[LangGraph Strategy] Error en el flujo:", error);
    throw error;
  }
}
