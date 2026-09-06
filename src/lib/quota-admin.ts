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

const ADMIN_EMAILS = ['diemoroy@gmail.com', 'admin@santisoft.cl', 'spalezcom@gmail.com', 'santisoftai@gmail.com', 'spagrupofugas@gmail.com'];

export function isAdminAdmin(email?: string): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export async function getPlanLimitAdmin(plan: string, email?: string): Promise<number> {
    if (isAdminAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'unlimited') return 999999;
    if (!adminDb) {
        return 3; // fallback
    }
    try {
        const plansDoc = await adminDb.collection("system_config").doc("plans").get();
        if (plansDoc.exists) {
            const config = plansDoc.data() as any;
            return config[planId]?.postsLimit ?? (config['free']?.postsLimit || 3);
        }
    } catch (e) {
        console.error("Error fetching plans config in admin:", e);
    }
    
    // Fallback to hardcoded values if Firestore fails
    const fallbacks: Record<string, number> = {
        free:     3,   // 3 posts totales (prueba de 10 días)
        starter:  12,  // 12 posts/mes
        pro:      20,  // 20 posts/mes
        elite:    20,  // alias legacy → pro
        business: 60,  // 60 posts/mes (30/cuenta)
        agency:   200  // 200 posts/mes (20/cuenta)
    };
    return fallbacks[planId] ?? 3;
}

export async function getAiPlanLimitAdmin(plan: string, type: 'image' | 'video' | 'blog', email?: string): Promise<number> {
    if (isAdminAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'unlimited') return 999999;
    if (!adminDb) return type === 'image' ? 8 : 0;
    try {
        const plansDoc = await adminDb.collection("system_config").doc("plans").get();
        if (plansDoc.exists) {
            const config = plansDoc.data() as any;
            if (type === 'image') return config[planId]?.aiImagesLimit ?? 8;
            if (type === 'video') return config[planId]?.aiVideosLimit ?? 0;
            if (type === 'blog') return config[planId]?.seoBlogsLimit ?? 0;
        }
    } catch (e) {
        console.error("Error fetching AI plans config in admin:", e);
    }
    // image: imágenes con nuestros agentes
    // video: videos (Reels/TikTok/Shorts)
    // blog: artículos SEO/GEO
    const fallbacks: Record<string, { image: number, video: number, blog: number }> = {
        free:     { image: 8,   video: 0,  blog: 0  },
        starter:  { image: 30,  video: 3,  blog: 0  },
        pro:      { image: 80,  video: 8,  blog: 4  },
        elite:    { image: 80,  video: 8,  blog: 4  }, // alias legacy → pro
        business: { image: 150, video: 16, blog: 12 },
        agency:   { image: 400, video: 40, blog: 25 },
    };
    return fallbacks[planId]?.[type] ?? (type === 'image' ? 8 : 0);
}

export async function getAiGenerationUsageAdmin(userId: string, type: 'image' | 'video' | 'blog'): Promise<number> {
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

export async function logAiGenerationAdmin(userId: string, profileId: string, type: 'image' | 'video' | 'blog', metadata: any = {}): Promise<void> {
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
