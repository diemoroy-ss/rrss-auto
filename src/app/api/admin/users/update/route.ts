import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../../lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Falta token de autenticación' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        if (decodedToken.email !== 'admin@santisoft.cl' && decodedToken.email !== 'diemoroy@gmail.com') {
            return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, field, value } = body;

        if (!userId || !field || !value) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        await adminDb.collection('users').doc(userId).update({
            [field]: value
        });

        return NextResponse.json({ success: true, message: `Usuario actualizado (${field}: ${value})` });
    } catch (error: any) {
        console.error('Error actualizando usuario:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}
