export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { 
    getQuotaUsageAdmin, 
    getPlanLimitAdmin, 
    getAiPlanLimitAdmin, 
    getAiGenerationUsageAdmin, 
    getVideoQuotaUsageAdmin,
    checkUserTrialStatus
} from '../../../../lib/quota-admin';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Falta token de autenticación' }, { status: 401 });
        }

        if (!adminAuth || !adminDb) {
            return NextResponse.json({ error: 'Firebase Admin no configurado en servidor' }, { status: 500 });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (tokenErr: any) {
            return NextResponse.json({ error: 'Token de autenticación no válido' }, { status: 401 });
        }

        const userId = decodedToken.uid;
        const email = decodedToken.email || '';
        const { searchParams } = new URL(req.url);
        const profileId = searchParams.get('profileId') || 'default';

        // Obtener datos del usuario desde Firestore con Admin SDK
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const plan = userData?.plan || 'free';
        const userEmail = email || userData?.email || '';

        // Comprobar estado de la prueba gratuita de 7 días
        const trialStatus = checkUserTrialStatus(userData, userEmail);

        // Consultar cuotas y límites concurrentemente pasando userData
        const [
            postsLimit,
            videoLimit,
            imageLimit,
            blogLimit,
            postsUsed,
            videosUsed,
            imagesUsed,
            blogsUsed
        ] = await Promise.all([
            getPlanLimitAdmin(plan, userEmail, userData),
            getAiPlanLimitAdmin(plan, 'video', userEmail, userData),
            getAiPlanLimitAdmin(plan, 'image', userEmail, userData),
            getAiPlanLimitAdmin(plan, 'blog', userEmail, userData),
            getQuotaUsageAdmin(userId, profileId),
            getVideoQuotaUsageAdmin(userId),
            getAiGenerationUsageAdmin(userId, 'image').catch(() => 0),
            getAiGenerationUsageAdmin(userId, 'blog').catch(() => 0),
        ]);

        return NextResponse.json({
            plan,
            isTrial: trialStatus.isTrial,
            isTrialExpired: trialStatus.isExpired,
            trialDaysLeft: trialStatus.daysRemaining,
            trialEndsAt: trialStatus.trialEndsAt ? trialStatus.trialEndsAt.toISOString() : null,
            postsLimit,
            videoLimit,
            imageLimit,
            blogLimit,
            postsUsed,
            videosUsed,
            imagesUsed,
            blogsUsed
        });
    } catch (error: any) {
        console.error('Error in /api/user/quotas:', error);
        return NextResponse.json({ error: 'Error del servidor al calcular cuotas' }, { status: 500 });
    }
}
