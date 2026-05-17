import type { VertexAI, GenerativeModel } from '@google-cloud/vertexai';

// We use dynamic imports to prevent the top-level load of @google-cloud/vertexai
// which can cause startup crashes if the environment is not perfectly configured.

const project = process.env.GCP_PROJECT_ID || 'veo-videos-ultra';
const location = process.env.GCP_TASKS_LOCATION || 'us-central1';

let vertexAIInstance: VertexAI | null = null;

/**
 * Lazily and dynamically initializes the Vertex AI client.
 */
export async function getVertexAI(): Promise<VertexAI | null> {
    if (vertexAIInstance) return vertexAIInstance;

    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKeyRaw = process.env.GCP_PRIVATE_KEY;

    if (!clientEmail || !privateKeyRaw) {
        console.warn("Vertex AI credentials missing (ENV). AI features will be unavailable.");
        return null;
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    try {
        // Dynamic import to avoid top-level crash
        const { VertexAI } = await import('@google-cloud/vertexai');

        vertexAIInstance = new VertexAI({
            project: project,
            location: location,
            googleAuthOptions: {
                credentials: {
                    client_email: clientEmail,
                    private_key: privateKey,
                },
                projectId: project,
            }
        });

        return vertexAIInstance;
    } catch (error) {
        console.error("Failed to load @google-cloud/vertexai dynamically:", error);
        return null;
    }
}

/**
 * Returns a configured model instance from Vertex AI (Async).
 */
export async function getVertexModel(modelName = 'gemini-2.5-flash', systemInstruction?: string): Promise<GenerativeModel> {
    const client = await getVertexAI();
    if (!client) {
        throw new Error("Vertex AI is not configured or failed to load.");
    }

    return client.getGenerativeModel({
         model: modelName,
         systemInstruction: systemInstruction ? {
              role: 'system',
              parts: [{ text: systemInstruction }]
         } : undefined
    });
}
