import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { AI_TASKS, getModelConfig, invalidateModelConfigCache } from "../../../../lib/ai-model-config";

export interface GoogleGeminiModel {
  name: string;
  id: string;
  displayName: string;
  description: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods: string[];
  temperature?: number;
}

const FALLBACK_GEMINI_MODELS: GoogleGeminiModel[] = [
  {
    name: "models/gemini-2.5-flash",
    id: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    description: "Modelo multimodal de última generación, alta velocidad y excelente razonamiento para producción.",
    supportedGenerationMethods: ["generateContent", "countTokens"],
    inputTokenLimit: 1048576,
    outputTokenLimit: 8192,
  },
  {
    name: "models/gemini-2.5-pro",
    id: "gemini-2.5-pro",
    displayName: "Gemini 2.5 Pro",
    description: "El modelo más avanzado para razonamiento complejo, análisis profundo y redacción extensa.",
    supportedGenerationMethods: ["generateContent", "countTokens"],
    inputTokenLimit: 2097152,
    outputTokenLimit: 8192,
  },
  {
    name: "models/gemini-3.1-flash-lite",
    id: "gemini-3.1-flash-lite",
    displayName: "Gemini 3.1 Flash Lite",
    description: "Optimizado para latencia ultrabaja y costos mínimos en tareas repetitivas y respuestas rápidas.",
    supportedGenerationMethods: ["generateContent", "countTokens"],
    inputTokenLimit: 1048576,
    outputTokenLimit: 8192,
  },
  {
    name: "models/gemini-2.5-flash-lite",
    id: "gemini-2.5-flash-lite",
    displayName: "Gemini 2.5 Flash Lite",
    description: "Excelente balance para chatbots y análisis de datos en tiempo real.",
    supportedGenerationMethods: ["generateContent", "countTokens"],
    inputTokenLimit: 1048576,
    outputTokenLimit: 8192,
  },
  {
    name: "models/gemini-2.0-flash",
    id: "gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    description: "Versión de producción estable para procesamiento multimodal y generación de texto.",
    supportedGenerationMethods: ["generateContent", "countTokens"],
    inputTokenLimit: 1048576,
    outputTokenLimit: 8192,
  },
  {
    name: "models/gemini-3.5-flash",
    id: "gemini-3.5-flash",
    displayName: "Gemini 3.5 Flash",
    description: "Modelo estándar probado y confiable con ventana de contexto mejorada.",
    supportedGenerationMethods: ["generateContent", "countTokens"],
    inputTokenLimit: 1048576,
    outputTokenLimit: 8192,
  },
  {
    name: "models/gemini-3.5-pro",
    id: "gemini-3.5-pro",
    displayName: "Gemini 3.5 Pro",
    description: "Modelo de alto razonamiento para tareas complejas y procesamiento avanzado.",
    supportedGenerationMethods: ["generateContent", "countTokens"],
    inputTokenLimit: 2097152,
    outputTokenLimit: 8192,
  },
];

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("No autorizado");
  }

  const idToken = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  const uid = decodedToken.uid;
  const email = (decodedToken.email || "").toLowerCase();

  // Fast check by recognized admin emails
  if (["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com", "admin@santisoft.cl"].includes(email)) {
    return { uid, email };
  }

  // Fallback to firestore role check
  try {
    if (adminDb) {
      const userDoc = await adminDb.collection("users").doc(uid).get();
      const userData = userDoc.data();
      if (userData?.role === "admin") {
        return { uid, email };
      }
    }
  } catch (dbErr) {
    console.warn("[AI-MODELS-API] Firestore role lookup fallback error:", dbErr);
  }

  throw new Error("Permisos insuficientes");
}

export async function GET(req: Request) {
  try {
    await verifyAdmin(req);

    // 1. Fetch live models from Google Generative Language API
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    let availableModels: GoogleGeminiModel[] = [];

    if (apiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models)) {
            availableModels = data.models
              .filter((m: any) =>
                m.supportedGenerationMethods?.includes("generateContent")
              )
              .map((m: any) => ({
                name: m.name,
                id: m.name.replace(/^models\//, ""),
                displayName: m.displayName || m.name.replace(/^models\//, ""),
                description: m.description || "",
                inputTokenLimit: m.inputTokenLimit,
                outputTokenLimit: m.outputTokenLimit,
                supportedGenerationMethods: m.supportedGenerationMethods,
                temperature: m.temperature,
              }));
          }
        }
      } catch (fetchErr) {
        console.error("[AI-MODELS-API] Error querying Google listModels:", fetchErr);
      }
    }

    if (availableModels.length === 0) {
      availableModels = FALLBACK_GEMINI_MODELS;
    }

    // 2. Fetch current config from Firestore / cache
    let currentConfig: Record<string, string> = {};
    try {
      currentConfig = await getModelConfig();
    } catch {
      AI_TASKS.forEach(t => { currentConfig[t.key] = t.defaultModel; });
    }

    return NextResponse.json({
      success: true,
      models: availableModels,
      tasks: AI_TASKS,
      config: currentConfig,
      apiKeyConfigured: !!apiKey,
    });
  } catch (err: any) {
    console.error("[AI-MODELS-API] GET Error:", err);
    return NextResponse.json(
      { error: err.message || "Error al obtener modelos de IA" },
      { status: err.message === "No autorizado" ? 401 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin(req);
    const body = await req.json();
    const { tasks } = body;

    if (!tasks || typeof tasks !== "object") {
      return NextResponse.json(
        { error: "Formato de configuración inválido" },
        { status: 400 }
      );
    }

    if (adminDb) {
      try {
        await adminDb.collection("system_config").doc("ai_models").set(
          {
            tasks,
            updatedAt: new Date().toISOString(),
            updatedBy: admin.email,
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.error("[AI-MODELS-API] Error persisting to Firestore:", dbErr);
      }
    }

    // Invalidate local in-memory cache
    invalidateModelConfigCache();

    return NextResponse.json({
      success: true,
      message: "Configuración de modelos de IA actualizada correctamente",
      tasks,
    });
  } catch (err: any) {
    console.error("[AI-MODELS-API] POST Error:", err);
    return NextResponse.json(
      { error: err.message || "Error al guardar configuración" },
      { status: err.message === "No autorizado" ? 401 : 500 }
    );
  }
}
