import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountString) {
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      console.warn("No FIREBASE_SERVICE_ACCOUNT variable found. Admin SDK will fail if no default credentials exist.");
      admin.initializeApp();
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Exported instances
export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminStorage = admin.apps.length ? admin.storage() : null;

let firestoreInstance: admin.firestore.Firestore | null = null;
if (admin.apps.length) {
  try {
    firestoreInstance = admin.firestore();
    firestoreInstance.settings({
      preferRest: true,
      ignoreUndefinedProperties: true,
    });
  } catch (err) {
    console.warn("Warning configuring Firestore settings:", err);
    firestoreInstance = admin.firestore();
  }
}

export const adminDb = firestoreInstance;

if (!adminAuth || !adminDb) {
  console.error("CRITICAL: Firebase Admin failed to initialize. adminAuth or adminDb is null.");
}
