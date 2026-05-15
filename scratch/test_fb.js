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
    const postId = "oCjZrOt0K6ZfZZ1SwuJg"; // The latest post that had the FB error
    const postSnap = await db.collection("social_posts").doc(postId).get();
    
    if (!postSnap.exists) {
        console.error("Post does not exist!");
        return;
    }
    
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

    const fbToken = targetProfile.facebookToken_enc || userData.facebookToken_enc;
    const ivFb = targetProfile.iv_fb || userData.iv_fb;
    const tagFb = targetProfile.tag_fb || userData.tag_fb;
    const pageId = targetProfile.facebookPageId || userData.facebookPageId;

    if (!fbToken) {
        console.error("No FB token found!");
        return;
    }

    const plainToken = decrypt(fbToken, ivFb, tagFb);
    console.log(`Page ID: ${pageId}`);
    console.log(`Token decrypted: ${plainToken ? 'YES' : 'NO'}`);
    console.log(`Image URL: ${post.imageUrl}`);
    console.log(`Caption: ${post.copy || post.text || post.idea}`);

    // Try posting to page photos
    const url = `https://graph.facebook.com/v19.0/${pageId}/photos`;
    const payload = {
        url: post.imageUrl,
        message: post.copy || post.text || post.idea || "Test post from Santisoft",
        access_token: plainToken
    };

    console.log("Sending request to FB /photos...");
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(data, null, 2));
}

run().catch(console.error);
