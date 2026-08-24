import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountString) {
      serviceAccountString = serviceAccountString.trim();
      if ((serviceAccountString.startsWith("'") && serviceAccountString.endsWith("'")) ||
          (serviceAccountString.startsWith('"') && serviceAccountString.endsWith('"'))) {
        serviceAccountString = serviceAccountString.slice(1, -1).trim();
      }
      let serviceAccount: any;
      try {
        serviceAccount = JSON.parse(serviceAccountString);
      } catch (parseErr) {
        try {
          const decoded = Buffer.from(serviceAccountString, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        } catch {
          throw parseErr;
        }
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'rrss-santisoft.firebasestorage.app',
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
