import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Falta token de autenticación' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        
        if (!adminAuth || !adminDb) {
            return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
        }

        // Verify authenticated user (any user can read this config)
        await adminAuth.verifyIdToken(token);

        const docSnap = await adminDb.collection('settings').doc('strategy_config').get();
        
        if (docSnap.exists) {
            return NextResponse.json({ goals: docSnap.data()?.goals || [] });
        } else {
            // Default setup if nothing exists
            const defaultGoals = [
                { id: 'ventas', title: 'Ventas & Conversión', description: 'Maximizar pedidos y ventas directas mediante contenido persuasivo.', icon: '💰' },
                { id: 'autoridad', title: 'Autoridad & Marca', description: 'Posicionarte como el experto número 1 y referente de tu sector.', icon: '🎙️' },
                { id: 'viralidad', title: 'Viralidad & Alcance', description: 'Contenido diseñado para ser compartido masivamente y llegar a miles.', icon: '🚀' },
                { id: 'lealtad', title: 'Comunidad & Lealtad', description: 'Crear fans reales y embajadores que interactúen con cada publicación.', icon: '❤️' },
                { id: 'prospectos', title: 'Captación de Prospectos', description: 'Atraer mensajes directos y registros de clientes altamente interesados.', icon: '📥' }
            ];
            return NextResponse.json({ goals: defaultGoals });
        }
    } catch (error: any) {
        console.error('Error fetching strategies API:', error);
        return NextResponse.json({ error: 'Error del servidor al obtener estrategias' }, { status: 500 });
    }
}
