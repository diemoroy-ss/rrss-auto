import { adminDb } from './firebase-admin';

export async function getQuotaUsageAdmin(userId: string, profileId: string = 'default'): Promise<number> {
    if (!adminDb) {
        return 0;
    }
    try {
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const snap = await adminDb.collection("social_posts")
            .where("userId", "==", userId)
            .get();

        let used = 0;
        snap.docs.forEach(d => {
            const data = d.data();
            if (profileId && profileId !== 'default' && data.profileId && data.profileId !== profileId) {
                return;
            }
            // In firebase-admin, Timestamp fields have a .toDate() method
            const dateObj = data.scheduledFor?.toDate ? data.scheduledFor.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date());
            
            if (dateObj >= firstDayOfMonth && ['published', 'processing', 'confirmed'].includes(data.status)) {
                used += (data.networks?.length || 1);
            }
        });

        return used;
    } catch (err) {
        console.error("Error in getQuotaUsageAdmin:", err);
        return 0;
    }
}

const ADMIN_EMAILS = ['diemoroy@gmail.com', 'admin@santisoft.cl', 'spalezcom@gmail.com', 'santisoftai@gmail.com'];

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
        free:                5,   // 5 posts totales (prueba de 10 días)
        esencial:            15,  // 15 posts/mes (~3 a 4 por semana)
        starter:             15,  // alias legacy → esencial
        crecimiento:         30,  // 30 posts/mes (grilla mensual completa)
        growth:              30,  // alias legacy → crecimiento
        pro:                 30,  // alias legacy → crecimiento
        elite:               30,  // alias legacy → crecimiento
        "piloto-automatico": 60,  // 60 posts/mes
        piloto_automatico:   60,  // 60 posts/mes
        business:            60,  // alias legacy → piloto automático
        agency:              999  // 999 posts/mes (ilimitado)
    };
    return fallbacks[planId] ?? 15;
}

export async function getAiPlanLimitAdmin(plan: string, type: 'image' | 'video' | 'blog', email?: string): Promise<number> {
    if (isAdminAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'unlimited') return 999999;
    if (!adminDb) return type === 'image' ? 15 : 0;
    try {
        const plansDoc = await adminDb.collection("system_config").doc("plans").get();
        if (plansDoc.exists) {
            const config = plansDoc.data() as any;
            if (type === 'image') return config[planId]?.aiImagesLimit ?? config[planId]?.postsLimit ?? 15;
            if (type === 'video') return config[planId]?.aiVideosLimit ?? config[planId]?.videosLimit ?? 0;
            if (type === 'blog') return config[planId]?.seoBlogsLimit ?? 0;
        }
    } catch (e) {
        console.error("Error fetching AI plans config in admin:", e);
    }
    // image: imágenes con nuestros agentes
    // video: videos (Reels/TikTok/Shorts)
    // blog: artículos SEO/GEO
    const fallbacks: Record<string, { image: number, video: number, blog: number }> = {
        free:                { image: 5,   video: 0,   blog: 0  },
        esencial:            { image: 15,  video: 8,   blog: 0  },
        starter:             { image: 15,  video: 8,   blog: 0  },
        crecimiento:         { image: 40,  video: 30,  blog: 4  },
        growth:              { image: 40,  video: 30,  blog: 4  },
        pro:                 { image: 40,  video: 30,  blog: 4  },
        elite:               { image: 40,  video: 30,  blog: 4  },
        "piloto-automatico": { image: 120, video: 60,  blog: 20 },
        piloto_automatico:   { image: 120, video: 60,  blog: 20 },
        business:            { image: 120, video: 60,  blog: 20 },
        agency:              { image: 999, video: 999, blog: 50 },
    };
    return fallbacks[planId]?.[type] ?? (type === 'image' ? 15 : 0);
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
        const dateObj = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
        if (dateObj >= firstDayOfMonth) {
            used += (data.count || 1);
        }
    });

    return used;
}

/**
 * Retorna el total de videos consumidos o comprometidos este mes para un usuario:
 * Considera el mayor valor entre generaciones de video registradas y publicaciones
 * agendadas/publicadas con formato Reel o Video.
 */
export async function getVideoQuotaUsageAdmin(userId: string): Promise<number> {
    if (!adminDb) return 0;
    try {
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const [aiVideosUsed, postsSnap] = await Promise.all([
            getAiGenerationUsageAdmin(userId, 'video').catch(() => 0),
            adminDb.collection("social_posts")
                .where("userId", "==", userId)
                .get()
        ]);

        let scheduledVideos = 0;
        postsSnap.docs.forEach(d => {
            const data = d.data();
            const dateObj = data.scheduledFor?.toDate ? data.scheduledFor.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date());
            if (dateObj >= firstDayOfMonth && ['published', 'processing', 'confirmed'].includes(data.status)) {
                const t = (data.type || '').toLowerCase();
                if (t.includes('reel') || t.includes('video')) {
                    scheduledVideos += 1;
                }
            }
        });

        return Math.max(aiVideosUsed, scheduledVideos);
    } catch (err) {
        console.error("Error in getVideoQuotaUsageAdmin:", err);
        return 0;
    }
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
