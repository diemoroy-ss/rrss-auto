const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envLocalPath = path.join(__dirname, '../.env.local');
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');

// Parse FIREBASE_SERVICE_ACCOUNT
const matches = envLocalContent.match(/FIREBASE_SERVICE_ACCOUNT='([\s\S]+?)'/);
const serviceAccount = JSON.parse(matches[1]);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function run() {
    console.log("Querying latest posts...");
    const snapshot = await db.collection("social_posts")
        .orderBy("scheduledFor", "desc")
        .limit(10)
        .get();

    if (snapshot.empty) {
        console.log("No posts found.");
        return;
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        console.log("-----------------------------------------");
        console.log(`ID: ${doc.id}`);
        console.log(`Status: ${data.status}`);
        console.log(`Networks: ${JSON.stringify(data.networks)}`);
        console.log(`Scheduled For: ${data.scheduledFor ? data.scheduledFor.toDate().toISOString() : 'N/A'}`);
        console.log(`Idea: ${data.idea}`);
        console.log(`imageUrl: ${data.imageUrl}`);
        console.log(`imageUrls: ${JSON.stringify(data.imageUrls)}`);
        console.log(`Publish Error: ${data.publishError}`);
    });
}

run().catch(console.error);
