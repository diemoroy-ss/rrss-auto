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

const auth = admin.auth();
const db = admin.firestore();

async function run() {
    const email = 'tester-meta@santisoft.cl';
    const password = 'MetaTest2026!';
    let uid;

    console.log(`Checking if user ${email} already exists in Firebase Auth...`);
    try {
        const userRecord = await auth.getUserByEmail(email);
        uid = userRecord.uid;
        console.log(`User already exists with UID: ${uid}. Updating password...`);
        await auth.updateUser(uid, {
            password: password
        });
        console.log("Password updated successfully.");
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.log("User does not exist. Creating new user in Firebase Auth...");
            const userRecord = await auth.createUser({
                email: email,
                password: password,
                emailVerified: true
            });
            uid = userRecord.uid;
            console.log(`User created successfully with UID: ${uid}`);
        } else {
            throw error;
        }
    }

    // Now write/update the corresponding document in Firestore 'users' collection
    console.log(`Setting up Firestore document in collection 'users' for UID: ${uid}...`);
    const userRef = db.collection('users').doc(uid);
    
    await userRef.set({
        email: email,
        plan: 'business', // Business level plan for testing limits/reels/carousels
        role: 'user',
        rubro: 'Agencia de Marketing',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        profiles: [
            {
                id: 'default',
                name: 'Marca de Prueba',
                rubro: 'Marketing Digital'
            }
        ]
    }, { merge: true });

    console.log(`\n==========================================`);
    console.log(`SUCCESS: Test user account is now active!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`==========================================`);
}

run().catch(console.error);
