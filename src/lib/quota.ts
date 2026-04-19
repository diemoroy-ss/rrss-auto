import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Memory cache to avoid excessive Firestore reads
let plansCache: any = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

async function getPlansConfig() {
    const now = Date.now();
    if (plansCache && (now - lastCacheUpdate < CACHE_TTL)) {
        return plansCache;
    }

    try {
        const plansDoc = await getDoc(doc(db, "system_config", "plans"));
        if (plansDoc.exists()) {
            plansCache = plansDoc.data();
            lastCacheUpdate = now;
            return plansCache;
        }
    } catch (e) {
        console.error("Error fetching plans config:", e);
    }
    
    // Fallback to hardcoded values if Firestore fails
    return {
        free: { postsLimit: 4, videosLimit: 0 },
        pro: { postsLimit: 20, videosLimit: 5 },
        elite: { postsLimit: 60, videosLimit: 15 },
        business: { postsLimit: 999999, videosLimit: 999999 }
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

export async function getPlanLimit(plan: string): Promise<number> {
    const config = await getPlansConfig();
    const planId = plan || 'free';
    return config[planId]?.postsLimit ?? (config['free']?.postsLimit || 4);
}

export async function getVideoPlanLimit(plan: string): Promise<number> {
    const config = await getPlansConfig();
    const planId = plan || 'free';
    return config[planId]?.videosLimit ?? (config['free']?.videosLimit || 0);
}
