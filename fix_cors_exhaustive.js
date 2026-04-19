const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function testCredentials(name, credentials, projectId) {
    console.log(`\n--- Testing Credentials: ${name} (Project: ${projectId}) ---`);
    const storage = new Storage({
        projectId: projectId,
        credentials: credentials
    });

    try {
        console.log("- Listing buckets...");
        const [buckets] = await storage.getBuckets();
        if (buckets.length === 0) {
            console.log("  [!] No buckets found.");
        } else {
            console.log("  Buckets found:");
            buckets.forEach(b => console.log(`  -> ${b.name}`));
            return buckets;
        }
    } catch (e) {
        console.log(`  [!] Error listing or accessing buckets: ${e.message}`);
    }
    return [];
}

async function run() {
    const envPath = path.join(__dirname, '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');

    const corsSettings = [
        {
            origin: ["*"],
            method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
            responseHeader: ["*"],
            maxAgeSeconds: 3600
        }
    ];

    // 1. Analyze FIREBASE_SERVICE_ACCOUNT
    const fbMatch = envFile.match(/FIREBASE_SERVICE_ACCOUNT='({[\s\S]*?})'/);
    if (fbMatch) {
        const sa = JSON.parse(fbMatch[1]);
        const buckets = await testCredentials("Firebase SA", sa, sa.project_id);
        
        // If we found buckets, apply CORS to all of them
        for (const b of buckets) {
            console.log(`- Applying CORS to ${b.name}...`);
            try {
                await b.setCorsConfiguration(corsSettings);
                console.log(`  [SUCCESS]`);
            } catch(e) { console.log(`  [FAILED] ${e.message}`); }
        }
    }

    // 2. Analyze GCP_PROJECT_ID / Credentials (if any)
    const gcpProjectId = envFile.match(/GCP_PROJECT_ID="(.*?)"/);
    if (gcpProjectId) {
        // Since we don't have a separate JSON for GCP SA (usually they are shared or in env), 
        // let's try to use the Firebase SA but with the GCP project ID
        if (fbMatch) {
            const sa = JSON.parse(fbMatch[1]);
            const buckets = await testCredentials("Firebase SA on GCP Project", sa, gcpProjectId[1]);
            for (const b of buckets) {
                console.log(`- Applying CORS to ${b.name}...`);
                try {
                    await b.setCorsConfiguration(corsSettings);
                    console.log(`  [SUCCESS]`);
                } catch(e) { console.log(`  [FAILED] ${e.message}`); }
            }
        }
    }
    
    // 3. Brute force specific bucket names even if listing failed
    const projectIds = [];
    if (fbMatch) projectIds.push(JSON.parse(fbMatch[1]).project_id);
    if (gcpProjectId) projectIds.push(gcpProjectId[1]);
    
    console.log("\n--- Brute Force Attempt (Specific Names) ---");
    for (const pid of [...new Set(projectIds)]) {
        const candidates = [
            `${pid}.firebasestorage.app`,
            `${pid}.appspot.com`,
            pid
        ];
        const storage = new Storage({
            projectId: pid,
            credentials: fbMatch ? JSON.parse(fbMatch[1]) : undefined
        });
        
        for (const name of candidates) {
            console.log(`- Trying ${name} in project ${pid}...`);
            try {
                await storage.bucket(name).setCorsConfiguration(corsSettings);
                console.log(`  [SUCCESS] CORS applied to ${name}`);
            } catch (e) {
                console.log(`  [SKIP/ERROR] ${e.message}`);
            }
        }
    }

    console.log("\n--- Finished ---");
}

run().catch(console.error);
