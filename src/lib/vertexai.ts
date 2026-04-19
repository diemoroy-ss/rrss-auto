import { VertexAI, GoogleAuthOptions } from '@google-cloud/vertexai';

const project = process.env.GCP_PROJECT_ID || 'veo-videos-ultra';
const location = process.env.GCP_TASKS_LOCATION || 'us-central1';

// Initialize VertexAI client lazily to prevent crash if env vars are missing
let vertexAIInstance: VertexAI | null = null;

export function getVertexAI() {
    if (vertexAIInstance) return vertexAIInstance;

    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKey = process.env.GCP_PRIVATE_KEY 
        ? process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    if (!clientEmail || !privateKey) {
        console.warn("Vertex AI credentials missing. AI features will be unavailable.");
        return null;
    }

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
}

/**
 * Returns a configured model instance from Vertex AI.
 * We use 2.5-flash as the default balanced model for 2026.
 */
export function getVertexModel(modelName = 'gemini-2.5-flash', systemInstruction?: string) {
    const client = getVertexAI();
    if (!client) {
        throw new Error("Vertex AI is not configured. Please check environment variables.");
    }

    return client.getGenerativeModel({
         model: modelName,
         systemInstruction: systemInstruction ? {
              role: 'system',
              parts: [{ text: systemInstruction }]
         } : undefined
    });
}
