const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function run() {
    console.log("--- Firebase Storage CORS Diagnostic ---");
    
    // 1. Load credentials
    let serviceAccount;
    try {
        const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
        const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT='({[\s\S]*?})'/);
        if (!match) throw new Error("FIREBASE_SERVICE_ACCOUNT not found in .env.local");
        serviceAccount = JSON.parse(match[1]);
        console.log(`- Project ID from Service Account: ${serviceAccount.project_id}`);
    } catch (e) {
        console.error("- Error loading credentials:", e.message);
        return;
    }

    const storage = new Storage({
        projectId: serviceAccount.project_id,
        credentials: {
            client_email: serviceAccount.client_email,
            private_key: serviceAccount.private_key
        }
    });

    // 2. Try to list buckets (Requires Storage Admin / list permission)
    console.log("- enumerating buckets...");
    try {
        const [buckets] = await storage.getBuckets();
        if (buckets.length === 0) {
            console.log("  [!] No buckets found under this service account. Check permissions.");
        } else {
            console.log("  Found buckets:");
            buckets.forEach(b => console.log(`  -> ${b.name}`));
        }
    } catch (e) {
        console.log(`  [!] Error listing buckets: ${e.message}`);
    }

    // 3. Try to set CORS on common bucket variations
    const project = serviceAccount.project_id;
    const candidates = [
        `${project}.firebasestorage.app`,
        `${project}.appspot.com`,
        project
    ];

    const corsSettings = [
        {
            origin: ["*"],
            method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
            responseHeader: ["*"],
            maxAgeSeconds: 3600
        }
    ];

    for (const name of candidates) {
        console.log(`- Attempting to set CORS on bucket: ${name}`);
        try {
            await storage.bucket(name).setCorsConfiguration(corsSettings);
            console.log(`  [SUCCESS] CORS applied to ${name}`);
        } catch (e) {
            console.log(`  [FAILED] ${e.message}`);
        }
    }
    
    console.log("--- End of Diagnostic ---");
}

run();
