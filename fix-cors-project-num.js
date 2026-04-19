const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function run() {
    console.log("--- Last Chance: Project Number Discovery ---");
    const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
    const fbMatch = envFile.match(/FIREBASE_SERVICE_ACCOUNT='({[\s\S]*?})'/);
    const sa = JSON.parse(fbMatch[1]);
    
    // Project Number from screenshot: 357773633637
    const projectNumber = "357773633637";
    
    const candidates = [
        `santisoft-automatizacion.firebasestorage.app`,
        `santisoft-automatizacion.appspot.com`,
        `${projectNumber}.appspot.com`,
        `project-${projectNumber}.appspot.com`
    ];

    const storage = new Storage({
        projectId: sa.project_id,
        credentials: sa
    });

    const corsSettings = [{
        origin: ["*"],
        method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
        responseHeader: ["*"],
        maxAgeSeconds: 3600
    }];

    for (const name of candidates) {
        console.log(`- Testing bucket: ${name}`);
        const bucket = storage.bucket(name);
        try {
            const [exists] = await bucket.exists();
            if (exists) {
                console.log(`  [FOUND!] Applying CORS...`);
                await bucket.setCorsConfiguration(corsSettings);
                console.log(`  [SUCCESS]`);
            } else {
                console.log(`  [NOT FOUND]`);
            }
        } catch (e) {
            console.log(`  [ERROR] ${e.message}`);
        }
    }
}

run();
