const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Parser manual de .env.local sin necesidad de librería dotenv
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
let accountJson = '';
const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT='({[\s\S]*?})'/);
if (match) {
    accountJson = match[1];
} else {
    throw new Error('No pude extraer FIREBASE_SERVICE_ACCOUNT');
}

const serviceAccount = JSON.parse(accountJson);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function run() {
  const corsRule = [
    {
      origin: ["*"],
      method: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
      responseHeader: ["Content-Type", "Access-Control-Allow-Origin", "x-goog-resumable"],
      maxAgeSeconds: 3600
    }
  ];

  try {
    const bucketName = 'santisoft-automatizacion.firebasestorage.app';
    console.log(`Attempting CORS on ${bucketName}...`);
    await admin.storage().bucket(bucketName).setCorsConfiguration(corsRule);
    console.log(`SUCCESS on ${bucketName}`);
  } catch(e) {
    console.log("Failed main bucket:", e.message);
    const altBucket = 'santisoft-automatizacion.appspot.com';
    console.log(`Attempting alternative bucket ${altBucket}...`);
    try {
        await admin.storage().bucket(altBucket).setCorsConfiguration(corsRule);
        console.log(`SUCCESS on ${altBucket}`);
    } catch(err2) {
        console.error("Failed alt bucket too:", err2.message);
    }
  }
}

run();
