import { StateGraph, START, END, MemorySaver, Annotation } from "@langchain/langgraph";

import { generateFreeText } from "./gemini-free";

// Reglas y límites de caracteres según la plataforma
const PLATFORM_RULES: Record<string, { maxLength: number; tone: string; guidelines: string }> = {
  TikTok: {
    maxLength: 150,
    tone: "Casual, directo, muy breve",
    guidelines: "Debe ser extremadamente conciso, ideal para acompañar un video corto. No superar los 150 caracteres.",
  },
  Twitter: {
    maxLength: 280,
    tone: "Dinámico, conciso, impactante",
    guidelines: "No superar los 280 caracteres. Usar ganchos rápidos y directos.",
  },
  LinkedIn: {
    maxLength: 3000,
    tone: "Profesional, reflexivo, estructurado",
    guidelines: "Permite un desarrollo profundo, con párrafos bien espaciados y un llamado a la acción claro al final.",
  },
  Instagram: {
    maxLength: 2200,
    tone: "Visual, cercano, inspirador",
    guidelines: "Buen uso de saltos de línea, tono atractivo y hashtags relevantes.",
  },
  Facebook: {
    maxLength: 5000,
    tone: "Comunitario, conversacional",
    guidelines: "Fomentar la interacción, preguntas y comentarios.",
  },
};

// 1. Definimos el Estado del Grafo usando la API moderna de Annotation (v1.x+)
export const WorkflowAnnotation = Annotation.Root({
  topic: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  platform: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "LinkedIn" }),
  draft: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  critique: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
  finalPost: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => "" }),
});

export type WorkflowState = typeof WorkflowAnnotation.State;


// Helper para obtener reglas de plataforma
function getRules(platform?: string) {
  if (!platform) {
    return { maxLength: 1000, tone: "Profesional", guidelines: "Adaptarse a la red social." };
  }
  const foundKey = Object.keys(PLATFORM_RULES).find(
    (k) => k.toLowerCase() === platform.toLowerCase()
  );
  return foundKey
    ? PLATFORM_RULES[foundKey]
    : { maxLength: 1000, tone: "Profesional", guidelines: "Adaptarse a la red social especificada." };
}

// 2. Nodo 1: Generar el borrador inicial (Agente Redactor)
async function generateDraftNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  console.log(`[LangGraph Node] generateDraftNode - Iniciando para: ${state.topic}`);
  const rules = getRules(state.platform);

  const prompt = `Eres un redactor experto de contenidos para redes sociales.
Escribe un borrador atractivo sobre el siguiente tema: "${state.topic}".

=== REGLAS DE LA PLATAFORMA (${state.platform}) ===
- Límite Máximo de Caracteres: ${rules.maxLength}
- Tono: ${rules.tone}
- Directrices especiales: ${rules.guidelines}

¡IMPORTANTE! Cumple estrictamente con el límite de ${rules.maxLength} caracteres. Sé directo y preciso.`;

  const text = await generateFreeText(prompt);
  console.log(`[LangGraph Node] generateDraftNode - Completado. Longitud: ${text.length}`);
  return { draft: text };
}


// 3. Nodo 2: Revisión y crítica (Agente Editor)
async function critiqueNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  console.log(`[LangGraph Node] critiqueNode - Iniciando...`);
  const rules = getRules(state.platform);

  const prompt = `Eres un editor jefe de contenidos. Revisa el siguiente borrador para ${state.platform}:

Borrador (Longitud actual: ${state.draft.length} caracteres):
"""
${state.draft}
"""

=== REGLAS DE LA PLATAFORMA (${state.platform}) ===
- Límite Máximo de Caracteres: ${rules.maxLength} caracteres.

Verifica:
1. Si el borrador supera los ${rules.maxLength} caracteres, exige explícitamente y con firmeza que se recorte.
2. Evalúa la concisión, impacto del gancho inicial y llamados a la acción (CTA).
Sé directo y constructivo.`;

  const text = await generateFreeText(prompt);
  console.log(`[LangGraph Node] critiqueNode - Completado.`);
  return { critique: text };
}


// 4. Nodo 3: Versión final mejorada (Agente Pulidor)
async function refineNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  console.log(`[LangGraph Node] refineNode - Iniciando...`);
  const rules = getRules(state.platform);

  const prompt = `Eres un redactor perfeccionista. Tomando el borrador original y las críticas del editor, reescribe la versión final óptima para ${state.platform}.

Borrador Original:
"""
${state.draft}
"""

Crítica del Editor:
"""
${state.critique}
"""

=== REGLAS ESTRICTAS (${state.platform}) ===
- Límite Máximo: ${rules.maxLength} caracteres.
- Tono: ${rules.tone}

¡OBLIGATORIO! La versión final bajo NINGUNA CIRCUNSTANCIA debe superar los ${rules.maxLength} caracteres. Recorta texto si es necesario para asegurar que cumple la regla.
Produce únicamente el texto final listo para ser publicado.`;

  const text = await generateFreeText(prompt);
  console.log(`[LangGraph Node] refineNode - Completado. Longitud final: ${text.length}`);
  return { finalPost: text };
}


// Instancia global en memoria del Checkpointer (MemorySaver)
const memorySaver = new MemorySaver();

// 5. Construimos el Grafo con interrupción para Interacción Humana
export function createContentWorkflow() {
  const workflow = new StateGraph(WorkflowAnnotation)

    .addNode("generateDraft", generateDraftNode)
    .addNode("critiqueDraft", critiqueNode)
    .addNode("refineDraft", refineNode)
    .addEdge(START, "generateDraft")
    .addEdge("generateDraft", "critiqueDraft")
    .addEdge("critiqueDraft", "refineDraft")
    .addEdge("refineDraft", END);

  // Compilamos el grafo añadiendo el checkpointer y pausando ANTES de refineDraft
  return workflow.compile({
    checkpointer: memorySaver,
    interruptBefore: ["refineDraft"],
  });
}

/**
 * Función helper para INICIAR el flujo. Se detendrá automáticamente antes del pulido final.
 */
export async function startContentWorkflow(topic: string, platform: string = "LinkedIn", threadId: string) {
  const app = createContentWorkflow();
  const config = { configurable: { thread_id: threadId } };

  const initialState = {
    topic,
    platform,
    draft: "",
    critique: "",
    finalPost: "",
  };

  try {
    console.log(`[LangGraph] Iniciando hilo ${threadId} para: "${topic}" en ${platform}...`);
    await app.invoke(initialState, config);
    
    const currentState = await app.getState(config);
    console.log(`[LangGraph] Flujo pausado en hilo ${threadId} esperando aprobación humana.`);

    return {
      threadId,
      status: "paused_for_human_review",
      nextStep: currentState.next,
      currentState: currentState.values,
    };
  } catch (error: any) {
    console.error(`[LangGraph Error] startContentWorkflow fail:`, error);
    throw error;
  }

}

/**
 * Función helper para REANUDAR el flujo tras la interacción humana (aprobación o modificación)
 */
export async function resumeContentWorkflow(threadId: string, updatedCritique?: string) {
  const app = createContentWorkflow();
  const config = { configurable: { thread_id: threadId } };

  try {
    if (updatedCritique) {
      console.log(`[LangGraph] Humano actualizando crítica en hilo ${threadId}...`);
      await app.updateState(config, { critique: updatedCritique });
    }

    console.log(`[LangGraph] Reanudando hilo ${threadId}...`);
    const finalState = await app.invoke(null, config);
    console.log(`[LangGraph] Flujo completado en hilo ${threadId}.`);

    return {
      threadId,
      status: "completed",
      platform: finalState.platform,
      characterCount: finalState.finalPost?.length || 0,
      draft: finalState.draft,
      critique: finalState.critique,
      finalPost: finalState.finalPost,
    };
  } catch (error: any) {
    console.error(`[LangGraph Error] resumeContentWorkflow fail:`, error);
    throw error;
  }

}

// Grafo compilado SIN interrupciones para ejecución completa directa en UI
export function createFullContentWorkflow() {
  const workflow = new StateGraph(WorkflowAnnotation)

    .addNode("generateDraft", generateDraftNode)
    .addNode("critiqueDraft", critiqueNode)
    .addNode("refineDraft", refineNode)
    .addEdge(START, "generateDraft")
    .addEdge("generateDraft", "critiqueDraft")
    .addEdge("critiqueDraft", "refineDraft")
    .addEdge("refineDraft", END);

  return workflow.compile();
}

/**
 * Función helper para ejecutar el flujo completo directamente de principio a fin sin pausas.
 */
export async function runFullContentWorkflow(topic: string, platform: string = "LinkedIn") {
  const app = createFullContentWorkflow();
  const initialState = {
    topic,
    platform,
    draft: "",
    critique: "",
    finalPost: "",
  };

  try {
    console.log(`[LangGraph] Ejecutando flujo completo directo para: "${topic}" en ${platform}...`);
    const finalState = await app.invoke(initialState);
    console.log(`[LangGraph] Flujo directo completado con éxito.`);

    return {
      platform: finalState.platform,
      characterCount: finalState.finalPost?.length || 0,
      draft: finalState.draft,
      critique: finalState.critique,
      finalPost: finalState.finalPost,
    };
  } catch (error: any) {
    console.error(`[LangGraph Error] runFullContentWorkflow fail:`, error);
    throw error;
  }

}
