import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../../lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Check Admin
        const userDoc = await adminDb.collection('users').doc(uid).get();
        const userData = userDoc.data();
        if (userData?.role !== 'admin' && decodedToken.email !== 'diemoroy@gmail.com') {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        const { plans } = await req.json();

        if (!plans) {
            return NextResponse.json({ error: 'Datos de planes faltantes' }, { status: 400 });
        }

        // Update system_config/plans
        await adminDb.collection('system_config').doc('plans').set(plans);

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error("Error updating plans:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
