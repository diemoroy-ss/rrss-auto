import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { generateFreeText } from "./gemini-free";
import { adminStorage } from "./firebase-admin";

export interface SceneChunk {
  id: string;
  duration: number; // en segundos
  text: string;
  assetUrl?: string; // URL en Firebase Storage
  audioUrl?: string; // URL en Firebase Storage
}

export interface VideoWorkflowState {
  threadId: string;
  rubro: string;
  idea: string;
  copy: string;
  imagePrompt: string;
  videoPrompt: string;
  scenes: SceneChunk[];
  renderedChunks: string[]; // URLs de los MP4 de Firebase Storage
  finalVideoUrl: string;
  status: 'initializing' | 'planning_prompts' | 'preparing_firebase_assets' | 'rendering_remotion_chunks' | 'stitching' | 'completed' | 'failed';
  errorMessage: string;
}

const videoChannels = {
  threadId: { value: (curr: string, next?: string) => next ?? curr, default: () => "" },
  rubro: { value: (curr: string, next?: string) => next ?? curr, default: () => "" },
  idea: { value: (curr: string, next?: string) => next ?? curr, default: () => "" },
  copy: { value: (curr: string, next?: string) => next ?? curr, default: () => "" },
  imagePrompt: { value: (curr: string, next?: string) => next ?? curr, default: () => "" },
  videoPrompt: { value: (curr: string, next?: string) => next ?? curr, default: () => "" },
  scenes: { value: (curr: SceneChunk[], next?: SceneChunk[]) => next ?? curr, default: () => [] },
  renderedChunks: { value: (curr: string[], next?: string[]) => next ? [...curr, ...next] : curr, default: () => [] },
  finalVideoUrl: { value: (curr: string, next?: string) => next ?? curr, default: () => "" },
  status: { value: (curr: string, next?: string) => next ?? curr, default: () => "initializing" },
  errorMessage: { value: (curr: string, next?: string) => next ?? curr, default: () => "" },
};

// 1. Nodo de Planificación y Generación de Prompts (Gemini)
async function generatePromptsNode(state: VideoWorkflowState): Promise<Partial<VideoWorkflowState>> {
  console.log(`[LangGraph Video] Generando guion y escenas para rubro: ${state.rubro}...`);
  
  const systemInstruction = `Eres un experto en Marketing Digital B2B y Dirección de Arte Cinematográfica.
El usuario quiere crear un video promocional de MÁXIMO 10 SEGUNDOS de duración.
Rubro: ${state.rubro}
Idea: ${state.idea}

Debes estructurar el guion en exactamente 3 escenas cortas de máximo 3.2 segundos cada una (duración total del video: máximo 10 segundos) y devolver EXACTAMENTE un JSON válido con la siguiente estructura:
{
  "copy": "Texto atractivo para redes sociales con emojis (max 300 chars)",
  "image_prompt": "Prompt profesional en inglés para generación de imagen estática de fondo sin texto",
  "video_prompt": "Prompt cinematográfico en inglés para animación de fondo (max 10 seconds)",
  "scenes": [
    { "id": "scene_1", "duration": 3.2, "text": "Gancho inicial impactante (0s-3.2s)" },
    { "id": "scene_2", "duration": 3.2, "text": "Problema y propuesta de valor (3.2s-6.4s)" },
    { "id": "scene_3", "duration": 3.2, "text": "Llamado a la acción (CTA) claro (6.4s-9.6s)" }
  ]
}`;

  try {
    const textResponse = await generateFreeText(systemInstruction, undefined, true);
    const result = JSON.parse(textResponse);

    const rawScenes = Array.isArray(result.scenes) && result.scenes.length > 0 
      ? result.scenes 
      : [{ id: "scene_1", duration: 3.2, text: state.idea }];

    const rawTotal = rawScenes.reduce((sum: number, s: any) => sum + (s.duration || 3.2), 0);
    const scale = rawTotal > 10 ? 10 / rawTotal : 1;
    const clampedScenes = rawScenes.map((s: any) => ({
      ...s,
      duration: Math.max(1, Math.round((s.duration || 3.2) * scale * 10) / 10)
    }));

    return {
      copy: result.copy || "Campaña promocional desarrollada por nuestros agentes",
      imagePrompt: result.image_prompt || "",
      videoPrompt: result.video_prompt || "",
      scenes: clampedScenes,
      status: 'preparing_firebase_assets'
    };
  } catch (error: any) {
    console.error("[LangGraph Video] Error en generatePromptsNode:", error);
    return { status: 'failed', errorMessage: "Error generando guion y prompts con nuestros agentes." };
  }
}

// 2. Nodo de Preparación y Caché en Firebase Storage
async function prepareFirebaseAssetsNode(state: VideoWorkflowState): Promise<Partial<VideoWorkflowState>> {
  console.log(`[LangGraph Video] Preparando y almacenando assets en Firebase Storage para ${state.scenes.length} escenas...`);
  
  const bucket = adminStorage?.bucket();

  const updatedScenes = await Promise.all(state.scenes.map(async (scene) => {
    let assetUrl = `https://firebasestorage.googleapis.com/v0/b/midominio.appspot.com/o/cache%2Fimg_${scene.id}.jpg?alt=media`;
    let audioUrl = `https://firebasestorage.googleapis.com/v0/b/midominio.appspot.com/o/cache%2Ftts_${scene.id}.mp3?alt=media`;

    if (bucket) {
      try {
        // Simulación de carga o validación de assets en Firebase Storage
        // En producción, aquí se descarga la imagen generada por IA o el audio TTS y se guarda en Firebase
        const fileRef = bucket.file(`assets/${state.threadId}/${scene.id}.json`);
        await fileRef.save(JSON.stringify({ text: scene.text, generatedAt: new Date().toISOString() }), {
          contentType: 'application/json'
        });
      } catch (e) {
        console.warn(`[Firebase Storage] No se pudo guardar en bucket, usando mock URLs. Error:`, e);
      }
    }

    return {
      ...scene,
      assetUrl,
      audioUrl
    };
  }));

  return { scenes: updatedScenes, status: 'rendering_remotion_chunks' };
}

// 3. Nodo de Renderizado Concurrente en Remotion sin n8n (Llamadas a Remotion Lambda / Workers directos)
async function renderRemotionChunksNode(state: VideoWorkflowState): Promise<Partial<VideoWorkflowState>> {
  console.log(`[LangGraph Video] Ejecutando render concurrente en Remotion para ${state.scenes.length} escenas...`);

  // Lanzamos todas las peticiones a Remotion Lambda en paralelo (Fan-out)
  const renderPromises = state.scenes.map(async (scene) => {
    console.log(`[Remotion Concurrente] Iniciando render de chunk ${scene.id} (${scene.duration}s)...`);

    // Llamada directa a la API de Remotion Lambda o Worker propio
    const remotionLambdaUrl = process.env.REMOTION_LAMBDA_URL || "https://remotion-lambda.santisoft.cl/render";
    
    try {
      // Simulación de llamada asíncrona a Remotion Lambda
      // const res = await fetch(remotionLambdaUrl, { method: 'POST', body: JSON.stringify({ scene, threadId: state.threadId }) });
      // const data = await res.json();
      // return data.outputUrl;
      
      // Esperamos 2 segundos simulando el tiempo de render de un chunk de 5s en Remotion Lambda
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `https://firebasestorage.googleapis.com/v0/b/midominio.appspot.com/o/rendered%2Fchunk_${state.threadId}_${scene.id}.mp4?alt=media`;
    } catch (error) {
      console.error(`[Remotion Error] Fallo al renderizar chunk ${scene.id}:`, error);
      throw error;
    }
  });

  try {
    const renderedChunks = await Promise.all(renderPromises);
    return { renderedChunks, status: 'stitching' };
  } catch (error: any) {
    return { status: 'failed', errorMessage: `Fallo el renderizado concurrente: ${error.message}` };
  }
}

// 4. Nodo de Unión y Concatenación (Stitching Fan-in)
async function stitchAndCompleteNode(state: VideoWorkflowState): Promise<Partial<VideoWorkflowState>> {
  console.log(`[LangGraph Video] Concatenando ${state.renderedChunks.length} fragmentos de video MP4...`);

  // Simulación de concatenación con FFMPEG o Remotion concat
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const finalVideoUrl = `https://firebasestorage.googleapis.com/v0/b/midominio.appspot.com/o/final%2Fvideo_${state.threadId}.mp4?alt=media`;

  console.log(`[LangGraph Video] Video completado exitosamente: ${finalVideoUrl}`);
  return { finalVideoUrl, status: 'completed' };
}

// Checkpointer global en memoria
const memorySaver = new MemorySaver();

export function createVideoWorkflow() {
  const workflow = new StateGraph<VideoWorkflowState>({ channels: videoChannels } as any)
    .addNode("generatePrompts", generatePromptsNode as any)
    .addNode("prepareAssets", prepareFirebaseAssetsNode as any)
    .addNode("renderRemotion", renderRemotionChunksNode as any)
    .addNode("stitchVideo", stitchAndCompleteNode as any)
    .addEdge(START, "generatePrompts")
    .addEdge("generatePrompts", "prepareAssets")
    .addEdge("prepareAssets", "renderRemotion")
    .addEdge("renderRemotion", "stitchVideo")
    .addEdge("stitchVideo", END);

  return workflow.compile({ checkpointer: memorySaver });
}

/**
 * Inicia el flujo de generación y renderizado de video en segundo plano de forma asíncrona.
 */
export async function startAsyncVideoGeneration(rubro: string, idea: string, threadId: string) {
  const app = createVideoWorkflow();
  const config = { configurable: { thread_id: threadId } };

  const initialState: VideoWorkflowState = {
    threadId,
    rubro,
    idea,
    copy: "",
    imagePrompt: "",
    videoPrompt: "",
    scenes: [],
    renderedChunks: [],
    finalVideoUrl: "",
    status: 'initializing',
    errorMessage: "",
  };

  // Iniciamos la ejecución de forma asíncrona para no bloquear la petición HTTP (evitando timeouts de Vercel)
  (app.invoke as any)(initialState, config).catch((err: any) => {
    console.error(`[LangGraph Video] Error fatal en segundo plano en hilo ${threadId}:`, err);
  });

  return {
    threadId,
    status: 'initializing',
    message: 'Flujo de renderizado de video iniciado en segundo plano.'
  };
}

/**
 * Permite consultar el estado en tiempo real del flujo de renderizado en curso.
 */
export async function getVideoWorkflowStatus(threadId: string) {
  const app = createVideoWorkflow();
  const config = { configurable: { thread_id: threadId } };

  try {
    const state = await app.getState(config);
    if (!state || !state.values) {
      return { status: 'not_found', errorMessage: 'No se encontró el hilo solicitado.' };
    }
    return {
      status: state.values.status,
      copy: state.values.copy,
      imagePrompt: state.values.imagePrompt,
      videoPrompt: state.values.videoPrompt,
      scenes: state.values.scenes,
      renderedChunks: state.values.renderedChunks,
      finalVideoUrl: state.values.finalVideoUrl,
      errorMessage: state.values.errorMessage,
    };
  } catch (error: any) {
    return { status: 'error', errorMessage: error.message };
  }
}
