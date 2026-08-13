import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { getTaskModel } from "./ai-model-config";

const DEFAULT_PRIMARY_MODEL = "gemini-2.5-flash";

const DEFAULT_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];

let genAIInstance: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (genAIInstance) return genAIInstance;

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY is not configured. Set it in .env.local.");
  }

  genAIInstance = new GoogleGenerativeAI(apiKey);
  return genAIInstance;
}

/**
 * Returns a configured generative model from the Gemini API.
 */
export function getFreeModel(
  modelName: string = DEFAULT_PRIMARY_MODEL,
  systemInstruction?: string
): GenerativeModel {
  const genAI = getGenAI();

  return genAI.getGenerativeModel({
    model: modelName,
    ...(systemInstruction && {
      systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
    }),
  });
}

/**
 * Convenience wrapper: generates text with a single prompt.
 * Resolves the active model from Firestore for the given task, and includes automatic fallback.
 */
export async function generateFreeText(
  prompt: string,
  systemInstruction?: string,
  jsonMode = false,
  imageUrl?: string,
  taskKey?: string
): Promise<string> {
  let lastError: any = null;

  // Resolve assigned model from dynamic config if taskKey is provided
  let configuredModel: string | null = null;
  try {
    configuredModel = await getTaskModel(taskKey);
  } catch {
    configuredModel = DEFAULT_PRIMARY_MODEL;
  }

  // Pre-process image if provided
  let imagePart: any = null;
  if (imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mimeType = response.headers.get("content-type") || "image/jpeg";
      imagePart = {
        inlineData: {
          data: base64,
          mimeType,
        },
      };
    } catch (e) {
      console.error("[GEMINI-FREE] Failed to fetch image context:", e);
    }
  }

  // Build model execution queue: configuredModel first, then unique fallbacks
  const modelQueue = Array.from(
    new Set([configuredModel, ...DEFAULT_FALLBACK_MODELS].filter(Boolean))
  ) as string[];

  for (const modelName of modelQueue) {
    try {
      console.log(`[GEMINI-EXEC] Task [${taskKey || "general"}] generating with [${modelName}]...`);
      const model = getFreeModel(modelName, systemInstruction);

      const parts: any[] = [{ text: prompt }];
      if (imagePart) parts.push(imagePart);

      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig: jsonMode ? { responseMimeType: "application/json" } : undefined,
      });

      const text = result.response.text();
      if (text) return text.trim();
    } catch (error: any) {
      lastError = error;
      const status = error.status || error.message?.match(/\[(\d+)\]/)?.[1];
      console.warn(
        `[GEMINI-EXEC] Model ${modelName} failed (Status: ${status}). Detail: ${error.message}`
      );
      continue;
    }
  }

  throw lastError || new Error("All Gemini models failed to respond.");
}
