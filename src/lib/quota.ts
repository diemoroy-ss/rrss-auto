import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

interface PlanConfig {
    postsLimit: number;
    videosLimit: number;
    aiImagesLimit?: number;
    aiVideosLimit?: number;
    seoBlogsLimit?: number;
}

interface SystemPlansConfig {
    [planId: string]: PlanConfig | undefined;
}

// Memory cache to avoid excessive Firestore reads
let plansCache: SystemPlansConfig | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

async function getPlansConfig(): Promise<SystemPlansConfig> {
    const now = Date.now();
    if (plansCache && (now - lastCacheUpdate < CACHE_TTL)) {
        return plansCache;
    }

    try {
        const plansDoc = await getDoc(doc(db, "system_config", "plans"));
        if (plansDoc.exists()) {
            plansCache = plansDoc.data() as SystemPlansConfig;
            lastCacheUpdate = now;
            return plansCache;
        }
    } catch (e) {
        console.error("Error fetching plans config:", e);
    }
    
    // Fallback to hardcoded values if Firestore fails
    return {
        free:              { postsLimit: 5,   videosLimit: 0  },
        esencial:          { postsLimit: 15,  videosLimit: 8  },
        starter:           { postsLimit: 15,  videosLimit: 8  },
        crecimiento:       { postsLimit: 40,  videosLimit: 20 },
        growth:            { postsLimit: 40,  videosLimit: 20 },
        pro:               { postsLimit: 40,  videosLimit: 20 },
        elite:             { postsLimit: 80,  videosLimit: 20 },
        "piloto-automatico": { postsLimit: 120, videosLimit: 40 },
        piloto_automatico: { postsLimit: 120, videosLimit: 40 },
        business:          { postsLimit: 120, videosLimit: 40 },
        agency:            { postsLimit: 999, videosLimit: 80 },
    };
}

export async function getQuotaUsage(userId: string, profileId: string = 'default'): Promise<number> {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const q = query(
        collection(db, "social_posts"),
        where("userId", "==", userId),
        where("profileId", "==", profileId)
    );
    const snap = await getDocs(q);

    let used = 0;
    snap.docs.forEach(d => {
        const data = d.data();
        const dateObj = data.scheduledFor?.toDate ? data.scheduledFor.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date());
        
        if (dateObj >= firstDayOfMonth && ['published', 'processing', 'confirmed'].includes(data.status)) {
            used += (data.networks?.length || 1);
        }
    });

    return used;
}

const ADMIN_EMAILS = ['diemoroy@gmail.com', 'admin@santisoft.cl', 'spalezcom@gmail.com', 'santisoftai@gmail.com'];

export function isUserAdmin(email?: string): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export async function getPlanLimit(plan: string, email?: string): Promise<number> {
    if (isUserAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'unlimited') return 999999;
    const config = await getPlansConfig();
    return config[planId]?.postsLimit ?? (config['free']?.postsLimit || 3);
}

export async function getVideoPlanLimit(plan: string, email?: string): Promise<number> {
    if (isUserAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'unlimited') return 999999;
    const config = await getPlansConfig();
    return config[planId]?.videosLimit ?? (config['free']?.videosLimit || 0);
}

export interface UserQuotasResponse {
    plan: string;
    postsLimit: number;
    videoLimit: number;
    imageLimit: number;
    blogLimit: number;
    postsUsed: number;
    videosUsed: number;
    imagesUsed: number;
    blogsUsed: number;
}

export async function fetchUserQuotas(profileId: string = 'default'): Promise<UserQuotasResponse | null> {
    if (!auth?.currentUser) return null;
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`/api/user/quotas?profileId=${encodeURIComponent(profileId)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            return await res.json();
        }
    } catch {
        // Fallback silencioso
    }
    return null;
}

export async function getAiGenerationUsage(userId: string, type: 'image' | 'video' | 'blog'): Promise<number> {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const q = query(
        collection(db, "ai_generations"),
        where("userId", "==", userId),
        where("type", "==", type)
    );
    try {
        const snap = await getDocs(q);
        let used = 0;
        snap.docs.forEach(d => {
            const data = d.data();
            const dateObj = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
            if (dateObj >= firstDayOfMonth) {
                used += (data.count || 1);
            }
        });
        return used;
    } catch (e: any) {
        // Evitar spam de errores en consola si no hay reglas de cliente o no hay permisos
        return 0;
    }
}

export async function getAiPlanLimit(plan: string, type: 'image' | 'video' | 'blog', email?: string): Promise<number> {
    if (isUserAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'unlimited') return 999999;

    try {
        const config = await getPlansConfig();
        const planConfig = config[planId] as any;
        if (planConfig) {
            if (type === 'image' && planConfig.aiImagesLimit !== undefined) return planConfig.aiImagesLimit;
            if (type === 'video') {
                if (planConfig.aiVideosLimit !== undefined) return planConfig.aiVideosLimit;
                if (planConfig.videosLimit !== undefined) return planConfig.videosLimit;
            }
            if (type === 'blog' && planConfig.seoBlogsLimit !== undefined) return planConfig.seoBlogsLimit;
        }
    } catch (e) {
        console.error("Error reading AI plan limit from DB config:", e);
    }

    const fallbacks: Record<string, { image: number, video: number, blog: number }> = {
        free:     { image: 8,   video: 0,  blog: 0  },
        starter:  { image: 20,  video: 2,  blog: 0  },
        growth:   { image: 40,  video: 6,  blog: 2  },
        pro:      { image: 80,  video: 12, blog: 8  },
        elite:    { image: 80,  video: 12, blog: 8  },
        business: { image: 200, video: 30, blog: 20 },
        agency:   { image: 999, video: 80, blog: 50 },
    };
    return fallbacks[planId]?.[type] ?? (type === 'image' ? 8 : 0);
}

/**
 * Retorna el total de videos consumidos o programados este mes por el usuario.
 * Evalúa tanto la colección ai_generations como los posts con formato Reel/Video.
 */
export async function getVideoQuotaUsage(userId: string): Promise<number> {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    try {
        const [aiVideosUsed, postsSnap] = await Promise.all([
            getAiGenerationUsage(userId, 'video').catch(() => 0),
            getDocs(query(
                collection(db, "social_posts"),
                where("userId", "==", userId)
            ))
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
    } catch {
        return 0;
    }
}

