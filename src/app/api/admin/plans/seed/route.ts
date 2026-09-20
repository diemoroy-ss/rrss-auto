import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../../lib/firebase-admin';

const DEFAULT_PLANS = {
    free: {
        id: "free",
        name: "Free",
        tagline: "POR 10 DÍAS",
        price: 0,
        annualPrice: 0,
        postsLimit: 5,
        videosLimit: 0,
        aiImagesLimit: 8,
        aiVideosLimit: 0,
        seoBlogsLimit: 0,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Prueba Gratuita",
        features: [
            "5 publicaciones automáticas por 10 días",
            "8 imágenes con nuestros agentes",
            "Todas las redes sociales (IG, FB, TT, YT, X)",
            "1 perfil de marca"
        ]
    },
    starter: {
        id: "starter",
        name: "Starter",
        tagline: "EMPIEZA A AUTOMATIZAR",
        price: 24990,
        annualPrice: 249900,
        postsLimit: 20,
        videosLimit: 2,
        aiImagesLimit: 20,
        aiVideosLimit: 2,
        seoBlogsLimit: 0,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Comenzar Starter",
        features: [
            "20 publicaciones en redes al mes",
            "2 videos para Reels / TikTok / Shorts al mes",
            "20 imágenes con nuestros agentes al mes",
            "Todas las redes sociales",
            "1 perfil de marca",
            "Anual $249.900 (ahorras ~$50.000)"
        ]
    },
    growth: {
        id: "growth",
        name: "Growth",
        tagline: "ACELERA TU PRESENCIA",
        price: 44990,
        annualPrice: 449900,
        postsLimit: 40,
        videosLimit: 6,
        aiImagesLimit: 40,
        aiVideosLimit: 6,
        seoBlogsLimit: 2,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Elegir Growth",
        features: [
            "40 publicaciones en redes al mes",
            "6 videos con locución y guión al mes",
            "40 imágenes con nuestros agentes al mes",
            "2 artículos de Blog SEO/GEO al mes",
            "WhatsApp Bot: revisión y aprobación de posts",
            "Todas las redes sociales",
            "1 perfil de marca",
            "Anual $449.900 (ahorras ~$90.000)"
        ]
    },
    pro: {
        id: "pro",
        name: "Pro",
        tagline: "EL MÁS ELEGIDO",
        price: 89990,
        annualPrice: 899900,
        postsLimit: 80,
        videosLimit: 12,
        aiImagesLimit: 80,
        aiVideosLimit: 12,
        seoBlogsLimit: 8,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: true,
        ctaText: "Elegir Pro",
        features: [
            "80 publicaciones en redes al mes",
            "12 videos con locución y guión al mes",
            "80 imágenes con nuestros agentes al mes",
            "8 artículos de Blog SEO/GEO",
            "WhatsApp Bot completo: aprueba, crea copys y ejecuta Radar",
            "Meta Ads integrado + Radar de Nicho",
            "1 perfil de marca",
            "Anual $899.900 (ahorras ~$180.000)"
        ]
    },
    business: {
        id: "business",
        name: "Business",
        tagline: "HASTA 3 CUENTAS",
        price: 169990,
        annualPrice: 1699900,
        postsLimit: 200,
        videosLimit: 30,
        aiImagesLimit: 200,
        aiVideosLimit: 30,
        seoBlogsLimit: 20,
        multiAccount: true,
        maxAccounts: 3,
        isPopular: false,
        ctaText: "Elegir Business",
        features: [
            "200 publicaciones en redes al mes",
            "30 videos con locución y guión al mes",
            "200 imágenes con nuestros agentes al mes",
            "20 artículos de Blog SEO/GEO",
            "WhatsApp Bot multi-marca (alterna cuentas desde el chat)",
            "Hasta 3 marcas o cuentas independientes",
            "Soporte prioritario por WhatsApp",
            "Anual $1.699.900 (ahorras ~$340.000)"
        ]
    },
    agency: {
        id: "agency",
        name: "Agency",
        tagline: "HASTA 15 CUENTAS",
        price: 299990,
        annualPrice: 2999900,
        postsLimit: 999,
        videosLimit: 80,
        aiImagesLimit: 999,
        aiVideosLimit: 80,
        seoBlogsLimit: 50,
        multiAccount: true,
        maxAccounts: 15,
        isPopular: false,
        ctaText: "Elegir Agency",
        features: [
            "Publicaciones ilimitadas al mes (999)",
            "80 videos con locución y guión al mes",
            "Imágenes ilimitadas con nuestros agentes",
            "50 artículos de Blog SEO/GEO",
            "Hasta 15 marcas o clientes independientes",
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
