import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Para entornos locales o donde no hay GOOGLE_APPLICATION_CREDENTIALS
    // se requiere que el usuario baje su serviceAccountKey.json 
    // y establezca process.env.FIREBASE_SERVICE_ACCOUNT con el string JSON.
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountString) {
        const serviceAccount = JSON.parse(serviceAccountString);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        console.warn("No FIREBASE_SERVICE_ACCOUNT variable found. Admin SDK will fail if no default credentials exist.");
        // Fallback to default application credentials if running on GCP
        admin.initializeApp();
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
