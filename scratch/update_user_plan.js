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
    const targetEmail = "spalezcom@gmail.com";
    console.log(`Searching for user with email: ${targetEmail}`);

    const snapshot = await db.collection("users")
        .where("email", "==", targetEmail)
        .get();

    if (snapshot.empty) {
        console.error(`User with email ${targetEmail} not found!`);
        process.exit(1);
    }

    snapshot.forEach(async doc => {
        console.log(`Found user: ${doc.id}`);
        console.log("Current data:", JSON.stringify(doc.data()));

        console.log("Updating plan to 'business'...");
        await doc.ref.update({
            plan: 'business'
        });

        console.log("User plan successfully updated to 'business' (unlimited posts & videos)!");
    });
}

run().catch(console.error);
