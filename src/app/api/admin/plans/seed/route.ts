import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../../lib/firebase-admin';

const DEFAULT_PLANS = {
    free: {
        id: "free",
        name: "Free",
        tagline: "POR 10 DÍAS",
        price: 0,
        annualPrice: 0,
        postsLimit: 3,
        videosLimit: 0,
        aiImagesLimit: 8,
        aiVideosLimit: 0,
        seoBlogsLimit: 0,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Prueba Gratuita",
        features: [
            "3 posts automáticos por 10 días",
            "8 imágenes con nuestros agentes",
            "Todas las redes sociales",
            "1 perfil de marca"
        ]
    },
    starter: {
        id: "starter",
        name: "Starter",
        tagline: "CLP / MES",
        price: 49990,
        annualPrice: 499900,
        postsLimit: 12,
        videosLimit: 3,
        aiImagesLimit: 30,
        aiVideosLimit: 3,
        seoBlogsLimit: 0,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Comenzar Starter",
        features: [
            "12 posts automáticos al mes",
            "3 videos para Reels / TikTok al mes",
            "30 imágenes al mes",
            "Todas las redes sociales",
            "1 perfil de marca",
            "Anual $499.900 (ahorras ~$100.000)"
        ]
    },
    pro: {
        id: "pro",
        name: "Pro",
        tagline: "CLP / MES",
        price: 84990,
        annualPrice: 849900,
        postsLimit: 20,
        videosLimit: 8,
        aiImagesLimit: 80,
        aiVideosLimit: 8,
        seoBlogsLimit: 4,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: true,
        ctaText: "Elegir Pro",
        features: [
            "20 posts automáticos al mes",
            "8 videos con locución y guión al mes",
            "80 imágenes al mes",
            "4 artículos de Blog SEO/GEO",
            "Meta Ads integrado",
            "Radar de Nicho",
            "1 perfil de marca",
            "Anual $849.900 (ahorras ~$170.000)"
        ]
    },
    business: {
        id: "business",
        name: "Business",
        tagline: "HASTA 2 CUENTAS",
        price: 149990,
        annualPrice: 1499900,
        postsLimit: 60,
        videosLimit: 16,
        aiImagesLimit: 150,
        aiVideosLimit: 16,
        seoBlogsLimit: 12,
        multiAccount: true,
        maxAccounts: 2,
        isPopular: false,
        ctaText: "Elegir Business",
        features: [
            "60 posts automáticos al mes",
            "16 videos con locución y guión al mes",
            "150 imágenes al mes",
            "12 artículos de Blog SEO/GEO",
            "Hasta 2 marcas o cuentas independientes",
            "Soporte dedicado prioritario",
            "Anual $1.499.900 (ahorras ~$300.000)"
        ]
    },
    agency: {
        id: "agency",
        name: "Agency",
        tagline: "HASTA 10 CUENTAS",
        price: 299990,
        annualPrice: 2999900,
        postsLimit: 200,
        videosLimit: 40,
        aiImagesLimit: 400,
        aiVideosLimit: 40,
        seoBlogsLimit: 25,
        multiAccount: true,
        maxAccounts: 10,
        isPopular: false,
        ctaText: "Elegir Agency",
        features: [
            "200 posts automáticos al mes",
            "40 videos con locución y guión al mes",
            "400 imágenes al mes",
            "25 artículos de Blog SEO/GEO",
            "Hasta 10 marcas o clientes independientes",
            "Ejecutivo de cuenta dedicado",
            "Anual $2.999.900 (ahorras ~$600.000)"
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
        const email = (decodedToken.email || "").toLowerCase();

        const adminEmails = ['diemoroy@gmail.com', 'spalezcom@gmail.com', 'santisoftai@gmail.com', 'admin@santisoft.cl'];
        const isSuperAdmin = adminEmails.includes(email);

        if (!isSuperAdmin) {
            const userDoc = await adminDb.collection('users').doc(uid).get();
            const userData = userDoc.data();
            if (userData?.role !== 'admin') {
                return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
            }
        }

        await adminDb.collection('system_config').doc('plans').set(DEFAULT_PLANS);

        return NextResponse.json({ success: true, message: 'Planes inicializados correctamente.' });

    } catch (err: any) {
        console.error("Error seeding plans:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
