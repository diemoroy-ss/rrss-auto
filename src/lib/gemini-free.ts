import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const FREE_MODEL_NAME = "gemini-2.5-flash";

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
 * Uses gemini-2.5-flash for maximum free quota.
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
 * Returns the raw text string.
 */
export async function generateFreeText(
    prompt: string,
    systemInstruction?: string,
    jsonMode = false
): Promise<string> {
    const model = getFreeModel(FREE_MODEL_NAME, systemInstruction);

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: jsonMode ? { responseMimeType: "application/json" } : undefined,
    });

    return result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}
