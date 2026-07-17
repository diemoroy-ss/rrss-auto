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

export async function getAiPlanLimitAdmin(plan: string, type: 'image' | 'video'): Promise<number> {
    if (!adminDb) return type === 'image' ? 5 : 0;
    try {
        const plansDoc = await adminDb.collection("system_config").doc("plans").get();
        if (plansDoc.exists) {
            const config = plansDoc.data() as any;
            const planId = plan || 'free';
            return type === 'image' 
                ? (config[planId]?.aiImagesLimit ?? 5)
                : (config[planId]?.aiVideosLimit ?? 0);
        }
    } catch (e) {
        console.error("Error fetching AI plans config in admin:", e);
    }
    const fallbacks: Record<string, { image: number, video: number }> = {
        free: { image: 5, video: 0 },
        pro: { image: 30, video: 5 },
        elite: { image: 100, video: 15 },
        business: { image: 300, video: 50 }
    };
    return fallbacks[plan || 'free']?.[type] ?? (type === 'image' ? 5 : 0);
}

export async function getAiGenerationUsageAdmin(userId: string, type: 'image' | 'video'): Promise<number> {
    if (!adminDb) throw new Error("Firebase Admin DB not initialized");
    
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const snap = await adminDb.collection("ai_generations")
        .where("userId", "==", userId)
        .where("type", "==", type)
        .get();

    let used = 0;
    snap.docs.forEach(d => {
        const data = d.data();
        const dateObj = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        if (dateObj >= firstDayOfMonth) {
            used += 1;
        }
    });

    return used;
}

export async function logAiGenerationAdmin(userId: string, profileId: string, type: 'image' | 'video', metadata: any = {}): Promise<void> {
    if (!adminDb) return;
    try {
        await adminDb.collection("ai_generations").add({
            userId,
            profileId,
            type,
            metadata,
            createdAt: new Date()
        });
    } catch (e) {
        console.error("Error logging AI generation:", e);
    }
}
