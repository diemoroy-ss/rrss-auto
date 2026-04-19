const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
let accountJson = '';
const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT='({[\s\S]*?})'/);
if (match) {
    accountJson = match[1];
}

const serviceAccount = JSON.parse(accountJson);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function run() {
  try {
    const [buckets] = await admin.storage().getBuckets();
    if (buckets.length === 0) {
        console.log("NO hay ningun bucket en este Service Account.");
    } else {
        console.log("Buckets encontrados bajo este proyecto:");
        buckets.forEach(b => console.log(`- ${b.name}`));
        
        // Aplica CORS al primer bucket que encontremos
        const targetBucket = buckets[0];
        console.log(`Aplicando reglas CORS al bucket maestro: ${targetBucket.name}`);
        
        await targetBucket.setCorsConfiguration([
          {
            origin: ["*"],
            method: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
            responseHeader: ["Content-Type", "Access-Control-Allow-Origin", "x-goog-resumable"],
            maxAgeSeconds: 3600
          }
        ]);
        console.log(`¡EXITO TOTAL AL APLICAR CORS EN ${targetBucket.name}!`);
    }
  } catch(e) {
    console.error("Error catastrofico listando buckets:", e);
  }
}

run();
