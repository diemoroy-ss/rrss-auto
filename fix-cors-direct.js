const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
let accountJson = '';
const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT='({[\s\S]*?})'/);
if (match) {
    accountJson = match[1];
}

const serviceAccount = JSON.parse(accountJson);

const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key
  }
});

const bucketName = 'santisoft-automatizacion.firebasestorage.app';

async function run() {
  try {
    console.log(`Setting CORS on: ${bucketName}`);
    
    const bucket = storage.bucket(bucketName);
    
    await bucket.setCorsConfiguration([
      {
        origin: ["*"],
        method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
        responseHeader: ["*"],
        maxAgeSeconds: 3600
      }
    ]);
    console.log(`SUCCESS ON BUCKET: ${bucketName}!`);
  } catch(e) {
    console.error("Error setting CORS:", e.message);
    if (e.code === 403) {
        console.error("Permission denied. Ensure the service account has Storage Admin permissions.");
    }
  }
}

run();
