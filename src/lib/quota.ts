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
    // Posts: límite mensual equivalente al ritmo semanal
    // Free: 3 posts totales (período de prueba, no mensual)
    // Starter: 3 posts/semana = ~12/mes
    // Pro: 5 posts/semana = ~20/mes
    // Business: 1 post/día = ~30/mes
    // Video Premium (con voz+guión): Free/Starter no tienen; Pro=8/mes; Business=20/mes
    return {
        free:     { postsLimit: 3,  videosLimit: 0  },
        starter:  { postsLimit: 12, videosLimit: 0  },
        pro:      { postsLimit: 20, videosLimit: 8  },
        elite:    { postsLimit: 20, videosLimit: 8  }, // alias legacy → pro
        business: { postsLimit: 30, videosLimit: 20 },
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

const ADMIN_EMAILS = ['diemoroy@gmail.com', 'admin@santisoft.cl', 'spalezcom@gmail.com'];

export function isUserAdmin(email?: string): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

export async function getPlanLimit(plan: string, email?: string): Promise<number> {
    if (isUserAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'business' || planId === 'agency' || planId === 'unlimited') return 999999;
    const config = await getPlansConfig();
    return config[planId]?.postsLimit ?? (config['free']?.postsLimit || 4);
}

export async function getVideoPlanLimit(plan: string, email?: string): Promise<number> {
    if (isUserAdmin(email)) return 999999;
    const planId = (plan || 'free').toLowerCase();
    if (planId === 'business' || planId === 'agency' || planId === 'unlimited') return 999999;
    const config = await getPlansConfig();
    return config[planId]?.videosLimit ?? (config['free']?.videosLimit || 0);
}
