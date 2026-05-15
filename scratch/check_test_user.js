const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '../.env.local');
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');

const matches = envLocalContent.match(/FIREBASE_SERVICE_ACCOUNT='([\s\S]+?)'/);
const serviceAccount = JSON.parse(matches[1]);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const auth = admin.auth();
const db = admin.firestore();

async function run() {
    const email = 'tester-meta@santisoft.cl';
    try {
        const userRecord = await auth.getUserByEmail(email);
        const uid = userRecord.uid;
        
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
            console.log("User Data:", doc.data());
        } else {
            console.log("User doc not found!");
        }
    } catch (err) {
        console.error(err);
    }
}

run().catch(console.error);
