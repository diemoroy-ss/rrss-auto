import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Falta token' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (e) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        // Fetch user basic data for mapping safely
        const userRef = adminDb.collection("users").doc(decodedToken.uid);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const isAdmin = userSnap.data()?.role === 'admin' || decodedToken.email === 'diemoroy@gmail.com';
        if (!isAdmin) {
            return NextResponse.json({ error: 'No tienes permisos de Administrador' }, { status: 403 });
        }

        // 1. Get all users to build a map UID -> User Info
        const usersSnap = await adminDb.collection('users').get();
        const userMap: Record<string, any> = {};
        usersSnap.forEach(doc => {
            const u = doc.data();
            userMap[doc.id] = {
                name: u.name || 'Sin Nombre',
                email: u.email || 'Sin Email',
                profiles: u.profiles || []
            };
        });

        // 2. We fetch the latest 100 posts descending
        const postsSnap = await adminDb.collection('social_posts')
            .orderBy('scheduledFor', 'desc')
            .limit(100)
            .get();

        const posts: any[] = [];
        postsSnap.forEach(doc => {
            const p = doc.data();
            const ownerId = p.userId;
            const ownerInfo = userMap[ownerId] || { name: 'Desconocido', email: 'Desconocido' };
            
            let profileName = 'Perfil Principal';
            if (p.profileId && Array.isArray(ownerInfo.profiles)) {
                  const prf = ownerInfo.profiles.find((pf: any) => pf.id === p.profileId);
                  if (prf) profileName = prf.instagramUsername || prf.facebookPageName || prf.name || 'Perfil Secundario';
            }

            posts.push({
                id: doc.id,
                userId: ownerId,
                clientName: ownerInfo.name,
                clientEmail: ownerInfo.email,
                profileName,
                copy: p.copy || p.idea || '',
                type: p.type || 'Post',
                networks: p.networks || [],
                status: p.status || 'unknown',
                generatedBy: p.generatedBy || 'unknown',
                scheduledFor: p.scheduledFor ? p.scheduledFor.toDate().toISOString() : null,
                createdAt: p.createdAt ? p.createdAt.toDate().toISOString() : null,
            });
        });

        return NextResponse.json({ posts });
    } catch (e: any) {
        console.error("Error en admin/posts GET:", e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
