import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

interface PlanConfig {
    postsLimit: number;
    videosLimit: number;
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
    // Free: 3 posts totales (período de prueba de 10 días, 0 videos)
    // Starter: 12 posts/mes, 3 videos/mes
    // Pro: 20 posts/mes, 8 videos/mes
    // Business: 60 posts/mes, 16 videos/mes
    // Agency: 200 posts/mes, 40 videos/mes
    return {
        free:     { postsLimit: 3,   videosLimit: 0  },
        starter:  { postsLimit: 12,  videosLimit: 3  },
        pro:      { postsLimit: 20,  videosLimit: 8  },
        elite:    { postsLimit: 20,  videosLimit: 8  }, // alias legacy → pro
        business: { postsLimit: 60,  videosLimit: 16 },
        agency:   { postsLimit: 200, videosLimit: 40 },
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
