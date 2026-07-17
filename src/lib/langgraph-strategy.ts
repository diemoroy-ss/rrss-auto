import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { generateFreeText } from "./gemini-free";

// 1. Definición del Estado del Grafo para Estrategia
export const StrategyAnnotation = Annotation.Root({
  businessType: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "General" }),
  goal: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "Ventas" }),
  expectations: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  connectedPlatforms: Annotation<string[]>({ reducer: (a, b) => b ?? a, default: () => ["Instagram", "Facebook"] }),
  history: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "Sin historial." }),
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
- Redes Disponibles: ${state.connectedPlatforms.join(", ")}

PROPORCIONA:
1. Análisis del público objetivo.
2. 3 Pilares de contenido (ej: Educativo, Venta, Entretenimiento).
3. Tono de comunicación recomendado.
4. Frecuencia de publicación sugerida.

Sé profesional y estratégico.`;

  const analysis = await generateFreeText(prompt);
  return { analysis };
}

// 3. Nodo 2: Generación de Plan de Contenidos
async function planningNode(state: StrategyState): Promise<Partial<StrategyState>> {
  console.log(`[LangGraph Strategy] planningNode - Generando plan táctico...`);

  const prompt = `Eres un Social Media Planner experto. Basándote en el siguiente análisis, genera un plan táctico de publicaciones.

ANÁLISIS ESTRATÉGICO:
${state.analysis}

HISTORIAL DE POSTS Y RENDIMIENTO (Analiza esto para replicar qué formatos/ideas tuvieron más likes/alcance, y descarta lo que no sirvió):
${state.history}

${state.feedback ? `\n¡ATENCIÓN! El Agente Revisor rechazó tu última estrategia por el siguiente motivo:\n"${state.feedback}"\nCORRIGE Y MEJORA ESTA VERSIÓN PARA QUE SEA APROBADA.\n` : ""}

REGLAS DE NEGOCIO 2026:
- Si la plataforma incluye 'TikTok', el formato DEBE ser 'Reel'.
- Formatos permitidos: Reel, Carrusel, Historia, Post Fijo.

DEBES GENERAR UNA ESTRUCTURA DE JSON válida que contenga un arreglo 'strategy' con exactamente este formato por cada publicación:
{
  "weekNumber": 1, 
  "dayOffset": 0, // 0 = hoy, 1 = mañana...
  "suggestedTime": "HH:MM",
  "format": "Formato exacto",
  "hook": "Gancho corto y potente",
  "content": "Resumen del contenido",
  "cta": "Llamado a la acción"
}

GENERA entre 5 y 10 publicaciones distribuidas en 14 días.
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
    history: string
) {
  const app = createStrategyWorkflow();
  const initialState = {
    businessType,
    goal,
    expectations,
    connectedPlatforms,
    history,
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
