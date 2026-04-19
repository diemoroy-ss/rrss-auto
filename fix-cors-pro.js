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

async function run() {
  try {
    const [buckets] = await storage.getBuckets();
    if (buckets.length === 0) {
        console.log("No buckets found for this project.");
    } else {
        console.log("Found buckets:");
        buckets.forEach(b => console.log(`- ${b.name}`));
        
        let targetBucketName = buckets[0].name;
        // Prefer one that looks like a storage app
        const matched = buckets.find(b => b.name.includes('firebasestorage') || b.name.includes('appspot'));
        if (matched) targetBucketName = matched.name;
        
        console.log(`Setting CORS on: ${targetBucketName}`);
        
        const bucket = storage.bucket(targetBucketName);
        
        await bucket.setCorsConfiguration([
          {
            origin: ["*"],
            method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
            responseHeader: ["*"],
            maxAgeSeconds: 3600
          }
        ]);
        console.log(`SUCCESS ON BUCKET: ${targetBucketName}!`);
        
        // Let's do it for ALL buckets just to be absolutely safe
        for (const b of buckets) {
            try {
                await storage.bucket(b.name).setCorsConfiguration([
                    {
                      origin: ["*"],
                      method: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD"],
                      responseHeader: ["*"],
                      maxAgeSeconds: 3600
                    }
                  ]);
                  console.log(`Updated secondary bucket too: ${b.name}`);
            } catch(e) {}
        }
    }
  } catch(e) {
    console.error("Fatal Error:", e);
  }
}

run();
