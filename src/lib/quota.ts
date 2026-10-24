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
        free:                { postsLimit: 5,   videosLimit: 0,  aiImagesLimit: 5,   seoBlogsLimit: 0 },
        esencial:            { postsLimit: 15,  videosLimit: 8,  aiImagesLimit: 15,  seoBlogsLimit: 0 },
        starter:             { postsLimit: 15,  videosLimit: 8,  aiImagesLimit: 15,  seoBlogsLimit: 0 },
        crecimiento:         { postsLimit: 30,  videosLimit: 30, aiImagesLimit: 40,  seoBlogsLimit: 4 },
        growth:              { postsLimit: 30,  videosLimit: 30, aiImagesLimit: 40,  seoBlogsLimit: 4 },
        pro:                 { postsLimit: 30,  videosLimit: 30, aiImagesLimit: 40,  seoBlogsLimit: 4 },
        elite:               { postsLimit: 30,  videosLimit: 30, aiImagesLimit: 40,  seoBlogsLimit: 4 },
        "piloto-automatico": { postsLimit: 60,  videosLimit: 60, aiImagesLimit: 120, seoBlogsLimit: 20 },
        piloto_automatico:   { postsLimit: 60,  videosLimit: 60, aiImagesLimit: 120, seoBlogsLimit: 20 },
        business:            { postsLimit: 60,  videosLimit: 60, aiImagesLimit: 120, seoBlogsLimit: 20 },
        agency:              { postsLimit: 999, videosLimit: 999, aiImagesLimit: 999, seoBlogsLimit: 50 },
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

export interface TrialStatus {
    isTrial: boolean;
    isExpired: boolean;
    daysRemaining: number;
    hoursRemaining: number;
    trialEndsAt: Date | null;
}

export function checkUserTrialStatus(userData?: any, userEmail?: string): TrialStatus {
    if (!userData) {
        return { isTrial: false, isExpired: false, daysRemaining: 0, hoursRemaining: 0, trialEndsAt: null };
    }
    
    if (isUserAdmin(userEmail || userData.email)) {
        return { isTrial: false, isExpired: false, daysRemaining: 999, hoursRemaining: 999, trialEndsAt: null };
    }

    const plan = (userData.plan || 'free').toLowerCase().trim();
    const isFreePlan = plan === 'free' || plan === 'demo' || plan === 'prueba';
    if (!isFreePlan) {
        return { isTrial: false, isExpired: false, daysRemaining: 999, hoursRemaining: 999, trialEndsAt: null };
    }

    const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // Estrictamente 7 días
    const now = Date.now();

    let trialEnd: Date;

    if (userData.trialEndsAt) {
        trialEnd = userData.trialEndsAt.toDate ? userData.trialEndsAt.toDate() : new Date(userData.trialEndsAt);
    } else if (userData.trialStartedAt) {
        const start = userData.trialStartedAt.toDate ? userData.trialStartedAt.toDate() : new Date(userData.trialStartedAt);
        trialEnd = new Date(start.getTime() + TRIAL_DURATION_MS);
    } else if (userData.createdAt) {
        const start = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
        trialEnd = new Date(start.getTime() + TRIAL_DURATION_MS);
    } else {
        trialEnd = new Date(0);
    }

    const diffMs = trialEnd.getTime() - now;
    const isExpired = diffMs <= 0;
    const daysRemaining = isExpired ? 0 : Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    const hoursRemaining = isExpired ? 0 : Math.max(0, Math.ceil(diffMs / (60 * 60 * 1000)));

    return {
        isTrial: true,
        isExpired,
        daysRemaining,
        hoursRemaining,
        trialEndsAt: trialEnd
    };
}

export async function getPlanLimit(plan: string, email?: string, userData?: any): Promise<number> {
    if (isUserAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'unlimited') return 999999;

    // Si la prueba de 7 días caducó, el límite es 0
    if (planId === 'free' && userData) {
        const trialStatus = checkUserTrialStatus(userData, email);
        if (trialStatus.isExpired) return 0;
    }

    const config = await getPlansConfig();
    return config[planId]?.postsLimit ?? (config['free']?.postsLimit || 3);
}

export async function getVideoPlanLimit(plan: string, email?: string, userData?: any): Promise<number> {
    if (isUserAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'unlimited') return 999999;

    if (planId === 'free' && userData) {
        const trialStatus = checkUserTrialStatus(userData, email);
        if (trialStatus.isExpired) return 0;
    }

    const config = await getPlansConfig();
    return config[planId]?.videosLimit ?? (config['free']?.videosLimit || 0);
}

export interface UserQuotasResponse {
    plan: string;
    isTrial?: boolean;
    isTrialExpired?: boolean;
    trialDaysLeft?: number;
    trialEndsAt?: string | null;
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

export async function getAiPlanLimit(plan: string, type: 'image' | 'video' | 'blog', email?: string, userData?: any): Promise<number> {
    if (isUserAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'unlimited') return 999999;

    if (planId === 'free' && userData) {
        const trialStatus = checkUserTrialStatus(userData, email);
        if (trialStatus.isExpired) return 0;
    }

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
        free:                { image: 5,   video: 0,  blog: 0  },
        esencial:            { image: 15,  video: 8,  blog: 0  },
        starter:             { image: 15,  video: 8,  blog: 0  },
        crecimiento:         { image: 40,  video: 30, blog: 4  },
        growth:              { image: 40,  video: 30, blog: 4  },
        pro:                 { image: 40,  video: 30, blog: 4  },
        elite:               { image: 40,  video: 30, blog: 4  },
        "piloto-automatico": { image: 120, video: 60, blog: 20 },
        piloto_automatico:   { image: 120, video: 60, blog: 20 },
        business:            { image: 120, video: 60, blog: 20 },
        agency:              { image: 999, video: 999, blog: 50 },
    };
    return fallbacks[planId]?.[type] ?? (type === 'image' ? 15 : 0);
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

