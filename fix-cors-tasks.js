const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function run() {
    console.log("--- Testing Task SA (veo-videos-ultra) ---");
    const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
    
    // Extract GCP_TASKS credentials
    const projectId = envFile.match(/GCP_PROJECT_ID="(.*?)"/)[1];
    const clientEmail = envFile.match(/GCP_CLIENT_EMAIL="(.*?)"/)[1];
    const privateKey = envFile.match(/GCP_PRIVATE_KEY="(.*?)"/)[1].replace(/\\n/g, '\n');

    const storage = new Storage({
        projectId: projectId,
        credentials: {
            client_email: clientEmail,
            private_key: privateKey
        }
    });

    try {
        console.log(`- Listing buckets for project: ${projectId}`);
        const [buckets] = await storage.getBuckets();
        if (buckets.length === 0) {
            console.log("  [!] No buckets found in this project.");
        } else {
            console.log("  Buckets found:");
            buckets.forEach(b => console.log(`  -> ${b.name}`));
            
            // Try to set CORS for all found buckets
            const corsSettings = [{
                origin: ["*"],
                method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
                responseHeader: ["*"],
                maxAgeSeconds: 3600
            }];
            for (const b of buckets) {
                console.log(`  - Applying CORS to ${b.name}...`);
                await b.setCorsConfiguration(corsSettings);
                console.log("    [SUCCESS]");
            }
        }
    } catch (e) {
        console.log(`  [!] Error: ${e.message}`);
    }
}

run();
