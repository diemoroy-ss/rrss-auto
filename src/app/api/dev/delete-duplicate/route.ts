import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

export async function GET() {
    try {
        if (!adminDb) {
            return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });
        }

        const snapshot = await adminDb.collection('blog_posts').where('slug', '==', 'por-que-automatizar-tus-redes-sociales-en-2026').get();
        if (snapshot.docs.length > 1) {
            const firstDocId = snapshot.docs[0].id;
            await adminDb.collection('blog_posts').doc(firstDocId).delete();
            return NextResponse.json({ success: true, message: "¡Articulo duplicado borrado con exito!", deletedId: firstDocId });
        } else {
            return NextResponse.json({ success: true, message: "No se encontraron duplicados." });
        }

    } catch (error: any) {
        console.error("Error deleting post:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
