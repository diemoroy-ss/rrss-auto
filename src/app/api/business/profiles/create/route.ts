import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../../lib/firebase-admin';

export async function POST(req: Request) {
    try {
        if (!adminAuth || !adminDb) {
            return NextResponse.json({ error: 'Firebase Admin no inicializado' }, { status: 500 });
        }

        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Falta token de autenticación' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const { name, icon } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
        }

        const userRef = adminDb.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const userData = userDoc.data() || {};
        if (userData.plan !== 'business') {
            return NextResponse.json({ error: 'Solo usuarios Business pueden tener múltiples perfiles' }, { status: 403 });
        }

        const existingProfiles = userData.profiles || [];
        if (existingProfiles.length >= 10) {
            return NextResponse.json({ error: 'Límite de 10 perfiles alcanzado' }, { status: 400 });
        }

        const newProfile = {
            id: `prof_${Date.now()}`,
            name,
            icon: icon || '🏢',
            createdAt: new Date().toISOString()
        };

        await userRef.update({
            profiles: [...existingProfiles, newProfile]
        });

        return NextResponse.json({ success: true, profile: newProfile });
    } catch (error: any) {
        console.error('Error creating profile:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
