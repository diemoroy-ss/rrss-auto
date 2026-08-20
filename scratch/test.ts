import { adminDb } from '../src/lib/firebase-admin';

async function main() {
    console.log("Fetching social_posts...");
    if (!adminDb) {
        console.error("adminDb is null");
        return;
    }
    const snap = await adminDb.collection('social_posts').orderBy('scheduledFor', 'desc').limit(100).get();
    snap.forEach(doc => {
        const d = doc.data();
        const sf = d.scheduledFor?.toDate();
        if (sf && sf.getDate() === 19 && sf.getMonth() === 7) { // month is 0-indexed, so 7 is August
            console.log(doc.id, d.status, sf, 'task:', d.gcpTaskName);
        }
    });
}
main().catch(console.error);
