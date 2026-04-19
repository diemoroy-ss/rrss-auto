const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function run() {
    console.log("--- Firebase Storage CORS Fix (New Project: rrss-santisoft) ---");
    
    // 1. Load credentials from .env.local
    let serviceAccount;
    try {
        const envPath = path.join(__dirname, '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT='({[\s\S]*?})'/);
        if (!match) throw new Error("FIREBASE_SERVICE_ACCOUNT not found in .env.local");
        
        serviceAccount = JSON.parse(match[1]);
        console.log(`- Project ID: ${serviceAccount.project_id}`);
    } catch (e) {
        console.error("- Error loading credentials:", e.message);
        process.exit(1);
    }

    // 2. Initialize Firebase Admin
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    const bucketName = 'rrss-santisoft.firebasestorage.app';
    const storage = admin.storage();
    const bucket = storage.bucket(bucketName);

    // 3. Define CORS configuration
    const corsConfiguration = [
        {
            origin: ["*"],
            method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
            responseHeader: ["*"],
            maxAgeSeconds: 3600
        }
    ];

    console.log(`- Requesting CORS update for: ${bucketName}...`);
    try {
        await bucket.setCorsConfiguration(corsConfiguration);
        console.log(`\n[SUCCESS] CORS has been successfully applied to ${bucketName}!`);
    } catch (e) {
        console.error(`\n[ERROR] Failed to set CORS: ${e.message}`);
        console.log("\nTIP: Make sure you have clicked 'Get Started' in the Storage tab of the Firebase Console for 'rrss-santisoft'.");
    }
    
    console.log("\n--- End of Execution ---");
    process.exit();
}

run().catch(console.error);
