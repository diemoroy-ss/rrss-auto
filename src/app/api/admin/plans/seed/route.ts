import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../../lib/firebase-admin';

const DEFAULT_PLANS = {
    free: {
        id: "free",
        name: "Gratis",
        tagline: "SIEMPRE",
        price: 0,
        annualPrice: 0,
        postsLimit: 4,
        videosLimit: 0,
        aiImagesLimit: 5,
        aiVideosLimit: 0,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Comenzar Gratis",
        features: [
            "4 Posts automáticos/mes",
            "Publicación directa",
            "Marca de agua Santisoft",
            "Soporte comunitario"
        ]
    },
    pro: {
        id: "pro",
        name: "Pro",
        tagline: "AL MES",
        price: 19990,
        annualPrice: 199900,
        postsLimit: 20,
        videosLimit: 5,
        aiImagesLimit: 30,
        aiVideosLimit: 5,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: true,
        ctaText: "Empezar Pro",
        features: [
            "20 Posts automáticos/mes",
            "Publicación directa",
            "Sin marca de agua",
            "Soporte WhatsApp"
        ]
    },
    elite: {
        id: "elite",
        name: "Elite",
        tagline: "AL MES",
        price: 49990,
        annualPrice: 499900,
        postsLimit: 60,
        videosLimit: 15,
        aiImagesLimit: 100,
        aiVideosLimit: 15,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Contactar Ventas",
        features: [
            "60 Posts automáticos/mes",
            "Vista previa y edición",
            "Sin marca de agua",
            "Soporte 24/7"
        ]
    },
    business: {
        id: "business",
        name: "Business",
        tagline: "AL MES / 2 CUENTAS",
        price: 89990,
        annualPrice: 899900,
        postsLimit: 999999,
        videosLimit: 999999,
        aiImagesLimit: 300,
        aiVideosLimit: 50,
        multiAccount: true,
        maxAccounts: 5,
        isPopular: false,
        ctaText: "Contactar Ventas",
        features: [
            "Posts ilimitados/mes",
            "Multi-cuenta (hasta 5 marcas)",
            "Sin marca de agua",
            "Soporte 24/7 prioritario",
            "Estrategia IA por cuenta"
        ]
    }
};

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const userDoc = await adminDb.collection('users').doc(uid).get();
        const userData = userDoc.data();
        const adminEmails = ['diemoroy@gmail.com', 'spalezcom@gmail.com', 'admin@santisoft.cl'];
        if (userData?.role !== 'admin' && !adminEmails.includes(decodedToken.email || '')) {
            return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
        }

        await adminDb.collection('system_config').doc('plans').set(DEFAULT_PLANS);

        return NextResponse.json({ success: true, message: 'Planes inicializados correctamente.' });

    } catch (err: any) {
        console.error("Error seeding plans:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
