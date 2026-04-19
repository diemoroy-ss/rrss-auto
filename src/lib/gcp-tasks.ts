import { CloudTasksClient } from '@google-cloud/tasks';

// Initialize the client.
// In local development or Vercel, we pass the credentials explicitly from env vars.
// We must parse the private key correctly to replace \n strings with real newlines.

const projectId = process.env.GCP_PROJECT_ID;
const clientEmail = process.env.GCP_CLIENT_EMAIL;
const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Optional chaining just in case it's not defined during build time
const client = (projectId && clientEmail && privateKey) 
    ? new CloudTasksClient({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        projectId: projectId,
    }) 
    : null;

/**
 * Encola un post para ser ejecutado en el tiempo exacto.
 * @param postId El ID del documento en la colección social_posts
 * @param scheduledFor Objeto Date con la fecha y hora exacta programada
 */
export async function enqueuePostTask(postId: string, scheduledFor: Date) {
    if (!client) {
        console.warn("[GCP TASKS] Cloud Tasks client is not initialized. Ensure GCP variables are set. Skipping queue.");
        return null;
    }

    const location = process.env.GCP_TASKS_LOCATION || 'us-central1';
    const queue = process.env.GCP_TASKS_QUEUE || 'social-posts-queue';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rrss.santisoft.cl';

    // The full path to the queue
    const parent = client.queuePath(projectId!, location, queue);

    const url = `${appUrl}/api/tasks/execute-post`;
    
    // We send the postId to the webhook executor
    const payload = JSON.stringify({ postId });

    const task: any = {
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
        const [response] = await client.createTask(request);
        console.log(`[GCP TASKS] Created task ${response.name}`);
        return response.name;
    } catch (error) {
        console.error(`[GCP TASKS] Error creating task for post ${postId}:`, error);
        throw error;
    }
}
