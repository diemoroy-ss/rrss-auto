import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Falta token de autenticación' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        
        if (!adminAuth || !adminDb) {
            return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
        }

        const decodedToken = await adminAuth.verifyIdToken(token);
        
        // Check role in Firestore
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        const userEmail = (decodedToken.email || "").toLowerCase();
        const isSuperAdmin = userEmail === 'diemoroy@gmail.com' || userEmail === 'admin@santisoft.cl';
        const isAdmin = userData?.role === 'admin';

        if (!isSuperAdmin && !isAdmin) {
            return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        }

        const body = await req.json();
        const { goals } = body;

        if (!goals || !Array.isArray(goals)) {
            return NextResponse.json({ error: 'Formato de objetivos inválido' }, { status: 400 });
        }

        await adminDb.collection('settings').doc('strategy_config').set({
            goals,
            updatedAt: new Date().toISOString(),
            updatedBy: decodedToken.email
        }, { merge: true });

        return NextResponse.json({ success: true, message: 'Configuración de estrategias guardada' });
    } catch (error: any) {
        console.error('Error saving strategies:', error);
        return NextResponse.json({ error: 'Error del servidor al guardar estrategias' }, { status: 500 });
    }
}
