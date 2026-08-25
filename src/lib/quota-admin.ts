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

const ADMIN_EMAILS = ['diemoroy@gmail.com', 'admin@santisoft.cl', 'spalezcom@gmail.com', 'santisoftai@gmail.com'];

export function isAdminAdmin(email?: string): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export async function getPlanLimitAdmin(plan: string, email?: string): Promise<number> {
    if (isAdminAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'business' || planId === 'agency' || planId === 'unlimited') return 999999;
    if (!adminDb) {
        return 4; // fallback
    }
    try {
        const plansDoc = await adminDb.collection("system_config").doc("plans").get();
        if (plansDoc.exists) {
            const config = plansDoc.data() as any;
            return config[planId]?.postsLimit ?? 4;
        }
    } catch (e) {
        console.error("Error fetching plans config in admin:", e);
    }
    
    // Fallback to hardcoded values if Firestore fails
    const fallbacks: Record<string, number> = {
        free:     3,      // 3 posts totales (prueba)
        starter:  12,     // 3 posts/semana
        pro:      20,     // 5 posts/semana
        elite:    20,     // alias legacy → pro
        business: 999999, // Business sin límites
        agency:   999999  // Agency ilimitado
    };
    return fallbacks[planId] ?? 3;
}

export async function getAiPlanLimitAdmin(plan: string, type: 'image' | 'video' | 'blog', email?: string): Promise<number> {
    if (isAdminAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'business' || planId === 'agency' || planId === 'unlimited') return 999999;
    if (!adminDb) return type === 'image' ? 5 : 0;
    try {
        const plansDoc = await adminDb.collection("system_config").doc("plans").get();
        if (plansDoc.exists) {
            const config = plansDoc.data() as any;
            if (type === 'image') return config[planId]?.aiImagesLimit ?? 5;
            if (type === 'video') return config[planId]?.aiVideosLimit ?? 0;
            if (type === 'blog') return config[planId]?.seoBlogsLimit ?? 0;
        }
    } catch (e) {
        console.error("Error fetching AI plans config in admin:", e);
    }
    // image: imágenes IA generadas con posts
    // video: videos PREMIUM (con voz+guión LangGraph) — Free/Starter = 0
    // blog: artículos SEO/GEO — solo Pro y Business
    const fallbacks: Record<string, { image: number, video: number, blog: number }> = {
        free:     { image: 5,      video: 0,      blog: 0      },
        starter:  { image: 20,     video: 0,      blog: 0      },
        pro:      { image: 50,     video: 8,      blog: 4      },
        elite:    { image: 50,     video: 8,      blog: 4      }, // alias legacy → pro
        business: { image: 999999, video: 999999, blog: 999999 },
        agency:   { image: 999999, video: 999999, blog: 999999 }, // ilimitado
    };
    return fallbacks[planId]?.[type] ?? (type === 'image' ? 5 : 0);
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
