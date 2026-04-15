import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

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

export function getPlanLimit(plan: string): number {
    if (plan === 'pro') return 20;
    if (plan === 'elite') return 60;
    if (plan === 'business') return 999999;
    return 4; // free
}

export function getVideoPlanLimit(plan: string): number {
    if (plan === 'pro') return 5;
    if (plan === 'elite') return 15;
    if (plan === 'business') return 999999;
    return 0; // free
}
