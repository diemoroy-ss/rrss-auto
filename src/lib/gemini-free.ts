import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const FREE_MODEL_NAME = "gemini-3-flash";
const FALLBACK_MODELS = ["gemini-3-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"];

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
 * Returns a configured generative model from the free Gemini API tier.
 * Now uses gemini-3-flash by default for stability.
 */
export function getFreeModel(
    modelName: string = FREE_MODEL_NAME,
    systemInstruction?: string
): GenerativeModel {
    const genAI = getGenAI();

    return genAI.getGenerativeModel({
        model: modelName,
        ...(systemInstruction && {
            systemInstruction: { role: "system", parts: [{ text: systemInstruction }] }
        }),
    });
}

/**
 * Convenience wrapper: generates text with a single prompt.
 * Includes automatic fallback logic for 503 (Overloaded) and 429 (Quota) errors.
 * Returns the raw text string.
 */
export async function generateFreeText(
    prompt: string,
    systemInstruction?: string,
    jsonMode = false
): Promise<string> {
    let lastError: any = null;

    for (const modelName of FALLBACK_MODELS) {
        try {
            console.log(`[GEMINI-FREE] Attempting generation with ${modelName}...`);
            const model = getFreeModel(modelName, systemInstruction);

            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: jsonMode ? { responseMimeType: "application/json" } : undefined,
            });

            const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) return text;
        } catch (error: any) {
            lastError = error;
            const status = error.status || (error.message?.match(/\[(\d+)\]/)?.[1]);
            
            console.warn(`[GEMINI-FREE] Model ${modelName} failed (Status: ${status}).`);
            
            // If it's a 404, 503 or 429, we try the next one.
            // If it's a 400 (Bad Request), we stop because it's likely a prompt issue.
            if (status === "400") break;
            
            continue;
        }
    }

    throw lastError || new Error("All Gemini models failed to respond.");
}
