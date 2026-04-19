const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function run() {
    console.log("--- Firebase Storage CORS Fix (Direct Targeting) ---");
    
    // 1. Load credentials from .env.local
    let serviceAccount;
    try {
        const envPath = path.join(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) throw new Error(".env.local file not found");
        
        const envFile = fs.readFileSync(envPath, 'utf8');
        const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT='({[\s\S]*?})'/);
        if (!match) throw new Error("FIREBASE_SERVICE_ACCOUNT not found in .env.local pattern");
        
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

    const bucketName = 'santisoft-automatizacion.firebasestorage.app';
    const storage = admin.storage();
    const bucket = storage.bucket(bucketName);

    // 3. Define CORS configuration
    const corsConfiguration = [
        {
            origin: ["*"], // Allow all origins for maximum flexibility, or ["https://rrss.santisoft.cl"] for security
            method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
            responseHeader: ["*"],
            maxAgeSeconds: 3600
        }
    ];

    console.log(`- Requesting CORS update for: ${bucketName}...`);
    try {
        // setCorsConfiguration is available on the Bucket object returned by admin.storage().bucket()
        await bucket.setCorsConfiguration(corsConfiguration);
        console.log(`\n[SUCCESS] CORS has been successfully applied to ${bucketName}!`);
        console.log("- Origin: *");
        console.log("- Methods: GET, PUT, POST, DELETE, OPTIONS, HEAD");
    } catch (e) {
        console.error(`\n[ERROR] Failed to set CORS: ${e.message}`);
        if (e.code === 403) {
            console.error("\nTIP: The Service Account lacks 'Storage Admin' permissions.");
            console.error("Please ensure the SA has 'Storage Admin' role in the GCP Console IAM page.");
        } else if (e.code === 404) {
             console.error("\nTIP: The bucket name might be different. Checking common fallback...");
             try {
                const fallback = `${serviceAccount.project_id}.appspot.com`;
                console.log(`- Trying fallback bucket: ${fallback}`);
                await storage.bucket(fallback).setCorsConfiguration(corsConfiguration);
                console.log(`\n[SUCCESS] CORS has been successfully applied to ${fallback}!`);
             } catch (err) {
                console.error(`- Fallback also failed: ${err.message}`);
             }
        }
    }
    
    console.log("\n--- End of Execution ---");
    process.exit();
}

run().catch(console.error);
