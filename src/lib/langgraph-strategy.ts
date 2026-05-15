import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { generateFreeText } from "./gemini-free";

// 1. Definición del Estado del Grafo para Estrategia
export const StrategyAnnotation = Annotation.Root({
  businessType: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "General" }),
  goal: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "Ventas" }),
  expectations: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  connectedPlatforms: Annotation<string[]>({ reducer: (a, b) => b ?? a, default: () => ["Instagram", "Facebook"] }),
  analysis: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  rawStrategy: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  strategy: Annotation<any[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
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

// 5. Construcción del Grafo
export function createStrategyWorkflow() {
  return new StateGraph(StrategyAnnotation)
    .addNode("analyze", analysisNode)
    .addNode("plan", planningNode)
    .addNode("validate", validationNode)
    .addEdge(START, "analyze")
    .addEdge("analyze", "plan")
    .addEdge("plan", "validate")
    .addEdge("validate", END)
    .compile();
}

/**
 * Ejecuta el flujo completo de estrategia profesional
 */
export async function runProfessionalStrategyWorkflow(
    businessType: string, 
    goal: string, 
    expectations: string, 
    connectedPlatforms: string[]
) {
  const app = createStrategyWorkflow();
  const initialState = {
    businessType,
    goal,
    expectations,
    connectedPlatforms,
    analysis: "",
    rawStrategy: "",
    strategy: []
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
