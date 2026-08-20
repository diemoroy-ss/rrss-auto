const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let val = match[2].trim();
        if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);
        else if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
        env[match[1].trim()] = val;
    }
});

let sa = env.FIREBASE_SERVICE_ACCOUNT;
if (sa.startsWith("'") && sa.endsWith("'")) sa = sa.substring(1, sa.length - 1);
if (sa.startsWith('"') && sa.endsWith('"')) sa = sa.substring(1, sa.length - 1);

const serviceAccount = JSON.parse(sa);
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function checkPosts() {
    console.log("Fetching social_posts...");
    const snapshot = await db.collection('social_posts')
        .orderBy('scheduledFor', 'desc')
        .limit(20)
        .get();

    snapshot.forEach(doc => {
        const data = doc.data();
        const sf = data.scheduledFor ? data.scheduledFor.toDate().toISOString() : 'None';
        console.log(`ID: ${doc.id} | Status: ${data.status} | Scheduled: ${sf} | GCP Task: ${data.gcpTaskName || 'None'}`);
    });
}

checkPosts().catch(console.error);
