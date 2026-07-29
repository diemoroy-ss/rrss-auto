import { adminDb } from './src/lib/firebase-admin';

async function fixBrokenBlogPosts() {
    console.log("Fixing broken blog posts...");
    const snap = await adminDb.collection("blog_posts").get();
    
    let count = 0;
    for (const doc of snap.docs) {
        const data = doc.data();
        if (data.status === 'confirmed' || data.status === 'pending') {
            await doc.ref.update({ status: 'strategy_draft' });
            console.log(`Fixed post ${doc.id}`);
            count++;
        }
    }
    
    console.log(`Done. Fixed ${count} posts.`);
}

fixBrokenBlogPosts().catch(console.error);
