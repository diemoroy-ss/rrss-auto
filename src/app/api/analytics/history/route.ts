export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';

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

        const authUid = decodedToken.uid;
        const { searchParams } = new URL(req.url);
        const profileId = searchParams.get('profileId');

        if (!profileId) {
            return NextResponse.json({ error: 'profileId es requerido' }, { status: 400 });
        }

        const historyRef = adminDb
            .collection('users')
            .doc(authUid)
            .collection('businesses')
            .doc(profileId)
            .collection('analytics_history');

        const snap = await historyRef
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const history = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ history });
    } catch (error: any) {
        console.error('Error fetching analytics history in API:', error);
        return NextResponse.json({ error: 'Error del servidor al obtener historial' }, { status: 500 });
    }
}
