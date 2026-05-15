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

    // 1. Create Media Container WITH media_type: 'IMAGE'
    const caption = "Test with IMAGE media type";
    const imageUrl = post.imageUrl;

    const containerBody = {
        image_url: imageUrl,
        caption: caption,
        media_type: 'IMAGE',
        access_token: plainToken
    };
    
    console.log("1. Creating container with media_type: 'IMAGE'...");
    const igMediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerBody)
    });
    
    const igMediaData = await igMediaRes.json();
    console.log("Container Response:", JSON.stringify(igMediaData));

    if (!igMediaData.id) {
        console.error("Failed to create container!");
        process.exit(1);
    }

    // 2. Publish Media
    console.log("2. Publishing media immediately...");
    const igPubRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            creation_id: igMediaData.id,
            access_token: plainToken
        })
    });

    const igPubData = await igPubRes.json();
    console.log("Publish Response:", JSON.stringify(igPubData));
}

run().catch(console.error);
