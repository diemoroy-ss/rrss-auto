import type { CloudTasksClient } from '@google-cloud/tasks';

// Initialize the client lazily to avoid build-time issues with Next.js bundling.
let client: CloudTasksClient | null = null;

function formatPrivateKey(key: string | undefined): string | undefined {
    if (!key) return undefined;
    
    // Support base64 encoded keys to bypass environment variable formatting issues
    if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
        try {
            const decoded = Buffer.from(key, 'base64').toString('utf-8');
            if (decoded.includes('-----BEGIN PRIVATE KEY-----')) {
                return decoded;
            }
        } catch (e) {
            // ignore
        }
    }
    
    let cleanKey = key.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    if (cleanKey.includes('\n') && cleanKey.split('\n').length > 3) return cleanKey;
    
    const match = cleanKey.match(/-----BEGIN PRIVATE KEY-----(.*?)-----END PRIVATE KEY-----/s);
    if (match) {
        const base64Part = match[1].replace(/\s+/g, '');
        const chunks = base64Part.match(/.{1,64}/g) || [];
        return `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
    }
    return cleanKey;
}

async function getClient(): Promise<CloudTasksClient | null> {
    if (client) return client;
    
    const projectId = process.env.GCP_PROJECT_ID;
    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKey = formatPrivateKey(process.env.GCP_PRIVATE_KEY);

    if (projectId && clientEmail && privateKey) {
        try {
            const { CloudTasksClient } = await import('@google-cloud/tasks');
            client = new CloudTasksClient({
                credentials: {
                    client_email: clientEmail,
                    private_key: privateKey,
                },
                projectId: projectId,
                fallback: true,
            });
            return client;
        } catch (e) {
            console.error("[GCP TASKS] Failed to load @google-cloud/tasks dynamically", e);
            return null;
        }
    }
    return null;
}

interface TaskPayload {
    httpRequest: {
        httpMethod: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';
        url: string;
        headers?: Record<string, string>;
        body?: string;
    };
    scheduleTime?: {
        seconds: number | string;
    };
}

/**
 * Encola un post para ser ejecutado en el tiempo exacto.
 * @param postId El ID del documento en la colección social_posts
 * @param scheduledFor Objeto Date con la fecha y hora exacta programada
 */
export async function enqueuePostTask(postId: string, scheduledFor: Date): Promise<string | null> {
    const clientInstance = await getClient();
    if (!clientInstance) {
        console.warn("[GCP TASKS] Cloud Tasks client is not initialized. Ensure GCP variables are set. Skipping queue.");
        return null;
    }

    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_TASKS_LOCATION || 'us-central1';
    const queue = process.env.GCP_TASKS_QUEUE || 'social-posts-queue';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rrss.santisoft.cl';

    // The full path to the queue
    const parent = clientInstance.queuePath(projectId!, location, queue);
    const url = `${appUrl}/api/tasks/execute-post`;
    
    // We send the postId to the webhook executor
    const payload = JSON.stringify({ postId });

    const task: TaskPayload = {
        httpRequest: {
            httpMethod: 'POST',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                // Add a secret cron key to prevent unauthorized hits to this endpoint
                'Authorization': `Bearer ${process.env.CRON_SECRET || 'santisoft-n8n-cron-key-123'}`
            },
            body: Buffer.from(payload).toString('base64'),
        },
    };

    // Set the schedule time
    // Convert Date object to seconds since epoch
    const seconds = Math.floor(scheduledFor.getTime() / 1000);
    task.scheduleTime = {
        seconds: seconds,
    };

    try {
        console.log(`[GCP TASKS] Sending task for post ${postId} scheduled at ${scheduledFor.toISOString()}`);
        const request = { parent: parent, task: task };
        const [response] = await clientInstance.createTask(request);
        console.log(`[GCP TASKS] Created task ${response.name}`);
        return response.name || null;
    } catch (error) {
        console.error(`[GCP TASKS] Error creating task for post ${postId}:`, error);
        throw error;
    }
}

/**
 * Elimina una tarea existente de la cola de Google Cloud Tasks.
 * @param taskName El nombre completo de la tarea (response.name devuelto al crear).
 */
export async function deletePostTask(taskName: string): Promise<boolean> {
    const clientInstance = await getClient();
    if (!clientInstance) {
        return false;
    }
    try {
        await clientInstance.deleteTask({ name: taskName });
        console.log(`[GCP TASKS] Deleted task ${taskName}`);
        return true;
    } catch (error: unknown) {
        const err = error as Error & { code?: number };
        // If the error code is 5 (NOT_FOUND), it means it already executed or was deleted.
        if (err.code !== 5) {
            console.error(`[GCP TASKS] Error deleting task ${taskName}:`, error);
        }
        return false;
    }
}

/**
 * Encola un post de BLOG para ser ejecutado en el tiempo exacto.
 * Llama al webhook ejecutor de blog.
 */
export async function enqueueBlogTask(postId: string, scheduledFor: Date): Promise<string | null> {
    const clientInstance = await getClient();
    if (!clientInstance) {
        console.warn("[GCP TASKS] Cloud Tasks client is not initialized. Skipping queue.");
        return null;
    }

    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_TASKS_LOCATION || 'us-central1';
    const queue = process.env.GCP_TASKS_QUEUE || 'social-posts-queue';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rrss.santisoft.cl';

    const parent = clientInstance.queuePath(projectId!, location, queue);
    const url = `${appUrl}/api/tasks/execute-blog`;
    
    const payload = JSON.stringify({ postId });

    const task: TaskPayload = {
        httpRequest: {
            httpMethod: 'POST',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET || 'santisoft-n8n-cron-key-123'}`
            },
            body: Buffer.from(payload).toString('base64'),
        },
    };

    const seconds = Math.floor(scheduledFor.getTime() / 1000);
    task.scheduleTime = { seconds: seconds };

    try {
        console.log(`[GCP TASKS] Sending BLOG task for post ${postId} scheduled at ${scheduledFor.toISOString()}`);
        const request = { parent: parent, task: task };
        const [response] = await clientInstance.createTask(request);
        console.log(`[GCP TASKS] Created BLOG task ${response.name}`);
        return response.name || null;
    } catch (error) {
        console.error(`[GCP TASKS] Error creating BLOG task for post ${postId}:`, error);
        throw error;
    }
}
