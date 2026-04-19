import { VertexAI, GoogleAuthOptions } from '@google-cloud/vertexai';

const project = process.env.GCP_PROJECT_ID || 'veo-videos-ultra';
const location = process.env.GCP_TASKS_LOCATION || 'us-central1';

// Handle private key correctly (it might have escaped newlines)
const privateKey = process.env.GCP_PRIVATE_KEY 
    ? process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

const authOptions: GoogleAuthOptions = {
    credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: privateKey,
    },
    projectId: project,
};

// Initialize VertexAI client
export const vertexAI = new VertexAI({
    project: project,
    location: location,
    googleAuthOptions: authOptions
});

/**
 * Returns a configured model instance from Vertex AI.
 * We use 2.5-flash as the default balanced model for 2026.
 */
export function getVertexModel(modelName = 'gemini-2.5-flash', systemInstruction?: string) {
    return vertexAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction ? {
             role: 'system',
             parts: [{ text: systemInstruction }]
        } : undefined
    });
}
