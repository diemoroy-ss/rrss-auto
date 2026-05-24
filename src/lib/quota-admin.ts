import { adminDb } from './firebase-admin';

export async function getQuotaUsageAdmin(userId: string, profileId: string = 'default'): Promise<number> {
    if (!adminDb) {
        throw new Error("Firebase Admin DB not initialized");
    }
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const snap = await adminDb.collection("social_posts")
        .where("userId", "==", userId)
        .where("profileId", "==", profileId)
        .get();

    let used = 0;
    snap.docs.forEach(d => {
        const data = d.data();
        // In firebase-admin, Timestamp fields have a .toDate() method
        const dateObj = data.scheduledFor?.toDate ? data.scheduledFor.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date());
        
        if (dateObj >= firstDayOfMonth && ['published', 'processing', 'confirmed'].includes(data.status)) {
            used += (data.networks?.length || 1);
        }
    });

    return used;
}

export async function getPlanLimitAdmin(plan: string): Promise<number> {
    if (!adminDb) {
        return 4; // fallback
    }
    try {
        const plansDoc = await adminDb.collection("system_config").doc("plans").get();
        if (plansDoc.exists) {
            const config = plansDoc.data() as any;
            const planId = plan || 'free';
            return config[planId]?.postsLimit ?? 4;
        }
    } catch (e) {
        console.error("Error fetching plans config in admin:", e);
    }
    
    // Fallback to hardcoded values if Firestore fails
    const fallbacks: Record<string, number> = {
        free: 4,
        pro: 20,
        elite: 60,
        business: 999999
    };
    return fallbacks[plan || 'free'] ?? 4;
}
