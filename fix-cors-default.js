const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function run() {
    const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
    const fbMatch = envFile.match(/FIREBASE_SERVICE_ACCOUNT='({[\s\S]*?})'/);
    const sa = JSON.parse(fbMatch[1]);

    const storageBucket = envFile.match(/NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=(.*)/)[1].trim();

    admin.initializeApp({
        credential: admin.credential.cert(sa),
        storageBucket: storageBucket
    });

    console.log(`- Project: ${sa.project_id}`);
    console.log(`- Env Storage Bucket: ${storageBucket}`);

    try {
        const bucket = admin.storage().bucket();
        console.log(`- Default bucket name: ${bucket.name}`);
        const [exists] = await bucket.exists();
        console.log(`- Exists? ${exists}`);
        
        if (exists) {
            console.log("- Applying CORS to default bucket...");
            await bucket.setCorsConfiguration([{
                origin: ["*"],
                method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
                responseHeader: ["*"],
                maxAgeSeconds: 3600
            }]);
            console.log("[SUCCESS]");
        }
    } catch (e) {
        console.log(`- Error: ${e.message}`);
    }
}

run();
