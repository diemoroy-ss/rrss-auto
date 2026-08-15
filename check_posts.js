const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
let serviceAccountStr = '';
env.split('\n').forEach(line => {
    if (line.startsWith('FIREBASE_SERVICE_ACCOUNT=')) {
        serviceAccountStr = line.replace('FIREBASE_SERVICE_ACCOUNT=', '').trim();
    }
});

if (serviceAccountStr.startsWith("'") && serviceAccountStr.endsWith("'")) {
    serviceAccountStr = serviceAccountStr.substring(1, serviceAccountStr.length - 1);
}

const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(serviceAccountStr);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function check() {
  const posts = await db.collection('social_posts').orderBy('scheduledDate', 'desc').limit(10).get();
  posts.forEach(doc => {
    const data = doc.data();
    if (data.networks && data.networks.includes('youtube')) {
       console.log(doc.id, data.scheduledDate, data.videoUrl, data.status);
    }
  });
}

check().catch(console.error);
