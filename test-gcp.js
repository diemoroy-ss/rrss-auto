process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const fs = require('fs');
const { CloudTasksClient } = require('@google-cloud/tasks');

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
    const parts = line.split('=');
    if (parts.length > 1) {
        acc[parts[0]] = parts.slice(1).join('=').replace(/^['"](.*)['"]$/, '$1').replace(/\\n/g, '\n');
    }
    return acc;
}, {});

async function test() {
    const projectId = env.GCP_PROJECT_ID;
    const clientEmail = env.GCP_CLIENT_EMAIL;
    const privateKey = env.GCP_PRIVATE_KEY;

    console.log("Project:", projectId);
    console.log("Email:", clientEmail);
    console.log("Key length:", privateKey ? privateKey.length : 0);

    const client = new CloudTasksClient({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
        projectId: projectId,
        fallback: true,
    });

    const parent = client.queuePath(projectId, 'us-central1', 'social-posts-queue');
    const task = {
        httpRequest: {
            httpMethod: 'POST',
            url: 'https://rrss.santisoft.cl/api/tasks/execute-post',
            body: Buffer.from(JSON.stringify({ postId: 'test' })).toString('base64'),
        },
        scheduleTime: {
            seconds: Math.floor(Date.now() / 1000) + 60,
        }
    };

    try {
        const [response] = await client.createTask({ parent, task });
        console.log("Success:", response.name);
    } catch (e) {
        console.error("Error creating task:", e);
    }
}
test();
