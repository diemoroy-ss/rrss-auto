const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envLocalPath = path.join(__dirname, '../.env.local');
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');

const matches = envLocalContent.match(/FIREBASE_SERVICE_ACCOUNT='([\s\S]+?)'/);
const serviceAccount = JSON.parse(matches[1]);

const encKeyMatches = envLocalContent.match(/ENCRYPTION_KEY="(.+?)"/);
const SECRET_KEY_RAW = encKeyMatches[1];

const SECRET_KEY = SECRET_KEY_RAW.length < 32 
    ? SECRET_KEY_RAW.padEnd(32, '0').slice(0, 32) 
    : SECRET_KEY_RAW.slice(0, 32);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

function decrypt(encryptedData, iv, authTag) {
    if (!encryptedData || !iv || !authTag) return '';
    try {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm', 
            Buffer.from(SECRET_KEY), 
            Buffer.from(iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error.message);
        return '';
    }
}

async function run() {
    const postSnap = await db.collection("social_posts").doc("jTXBv6x3JpaRB6Htum3m").get();
    const post = postSnap.data();
    const uid = post.userId;
    const profileId = post.profileId || 'default';

    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    let targetProfile = null;
    if (Array.isArray(userData.profiles)) {
        targetProfile = userData.profiles.find(p => p.id === profileId);
    }
    if (!targetProfile) targetProfile = userData;

    const igToken = targetProfile.instagramToken_enc || userData.instagramToken_enc;
    const ivIg = targetProfile.iv_ig || userData.iv_ig;
    const tagIg = targetProfile.tag_ig || userData.tag_ig;
    const igAccountId = targetProfile.instagramAccountId || userData.instagramAccountId;

    const plainToken = decrypt(igToken, ivIg, tagIg);

    // Create container
    const containerBody = {
        image_url: post.imageUrl,
        caption: "Test caption: " + Date.now()
    };
    
    console.log("Creating container...");
    const igMediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...containerBody,
            access_token: plainToken
        })
    });
    
    const igMediaData = await igMediaRes.json();
    console.log("Container ID:", igMediaData.id);

    if (!igMediaData.id) {
        console.error("No container ID returned!");
        process.exit(1);
    }

    // Poll status immediately and then every second
    for (let i = 0; i < 10; i++) {
        const statusRes = await fetch(`https://graph.facebook.com/v19.0/${igMediaData.id}?fields=status_code,status&access_token=${plainToken}`);
        const statusData = await statusRes.json();
        console.log(`Poll ${i}: status_code=${statusData.status_code}, full_response=${JSON.stringify(statusData)}`);
        await new Promise(r => setTimeout(r, 1000));
    }
}

run().catch(console.error);
