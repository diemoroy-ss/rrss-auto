import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../../lib/firebase-admin';

const DEFAULT_PLANS = {
    free: {
        id: "free",
        name: "Prueba Gratuita",
        tagline: "POR 10 DÍAS",
        price: 0,
        annualPrice: 0,
        postsLimit: 5,
        videosLimit: 0,
        aiImagesLimit: 5,
        aiVideosLimit: 0,
        seoBlogsLimit: 0,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Prueba Gratuita",
        features: [
            "5 publicaciones automáticas de prueba",
            "5 imágenes con nuestros agentes",
            "Conexión a Instagram y Facebook",
            "1 perfil de negocio"
        ]
    },
    esencial: {
        id: "esencial",
        name: "Plan PyME Esencial",
        tagline: "PRESENCIA ACTIVA",
        price: 59990,
        annualPrice: 599900,
        postsLimit: 15,
        videosLimit: 8,
        aiImagesLimit: 15,
        aiVideosLimit: 8,
        seoBlogsLimit: 0,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Elegir Plan Esencial",
        features: [
            "15 publicaciones estratégicas al mes (~3 a 4 por semana)",
            "8 guiones de Reels + secuencias de Stories listos para grabar",
            "15 imágenes y carruseles con tu logo y colores corporativos",
            "Clonación de voz de marca con agentes especializados (cero robótico)",
            "Escudo de protección anti-baneos y shadowban en Instagram",
            "Publicación automática directa en Instagram y Facebook"
        ]
    },
    starter: {
        id: "starter",
        name: "Plan Esencial (Legacy)",
        tagline: "PRESENCIA ACTIVA",
        price: 59990,
        annualPrice: 599900,
        postsLimit: 15,
        videosLimit: 8,
        aiImagesLimit: 15,
        aiVideosLimit: 8,
        seoBlogsLimit: 0,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Comenzar Esencial",
        features: [
            "15 publicaciones estratégicas al mes",
            "8 guiones de Reels / Stories",
            "Instagram y Facebook"
        ]
    },
    crecimiento: {
        id: "crecimiento",
        name: "Plan PyME Crecimiento",
        tagline: "MÁQUINA DE VENTAS (MÁS ELEGIDO)",
        price: 99990,
        annualPrice: 999900,
        postsLimit: 30,
        videosLimit: 30,
        aiImagesLimit: 40,
        aiVideosLimit: 30,
        seoBlogsLimit: 4,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: true,
        ctaText: "Elegir Plan Crecimiento",
        features: [
            "Bono Setup Llave en Mano GRATIS (Valor $150.000)",
            "30 publicaciones al mes (grilla mensual completa)",
            "30 guiones de Reels y videos verticales de alta retención",
            "Multicanal completo: Instagram, Facebook, TikTok y LinkedIn B2B",
            "Radar Espía de Competidores en Meta Ads y TikTok",
            "Generador de copies para Meta Ads con fórmulas de alta conversión",
            "Módulo de Blog SEO: 4 artículos de autoridad para Google y motores de IA",
            "Bot de WhatsApp interactivo para aprobar y pedir posts por audio"
        ]
    },
    pro: {
        id: "pro",
        name: "Plan Crecimiento (Legacy)",
        tagline: "MÁS ELEGIDO",
        price: 99990,
        annualPrice: 999900,
        postsLimit: 30,
        videosLimit: 30,
        aiImagesLimit: 40,
        aiVideosLimit: 30,
        seoBlogsLimit: 4,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: true,
        ctaText: "Elegir Crecimiento",
        features: [
            "30 publicaciones al mes",
            "30 guiones de Reels",
            "Multicanal completo + Ads + Blog SEO"
        ]
    },
    growth: {
        id: "growth",
        name: "Plan Crecimiento (Alias)",
        tagline: "MÁS ELEGIDO",
        price: 99990,
        annualPrice: 999900,
        postsLimit: 30,
        videosLimit: 30,
        aiImagesLimit: 40,
        aiVideosLimit: 30,
        seoBlogsLimit: 4,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Elegir Crecimiento",
        features: [
            "30 publicaciones al mes",
            "Multicanal completo"
        ]
    },
    piloto_automatico: {
        id: "piloto_automatico",
        name: "Plan Piloto Automático",
        tagline: "DONE-WITH-YOU VIP",
        price: 249990,
        annualPrice: 2499900,
        postsLimit: 60,
        videosLimit: 60,
        aiImagesLimit: 120,
        aiVideosLimit: 60,
        seoBlogsLimit: 20,
        multiAccount: true,
        maxAccounts: 3,
        isPopular: false,
        ctaText: "Contratar Piloto Automático VIP",
        features: [
            "60 publicaciones al mes (hasta 2 posts diarios por canal)",
            "60 guiones de Reels y videos dinámicos",
            "Hasta 3 marcas o cuentas comerciales independientes",
            "20 artículos de Blog SEO/GEO para dominar búsquedas locales",
            "Lanzamiento guiado de campañas pagadas de Meta Ads",
            "Estratega de contenidos dedicado asignado a tu negocio",
            "Soporte VIP prioritario 1-a-1 directo por WhatsApp"
        ]
    },
    business: {
        id: "business",
        name: "Piloto Automático (Legacy)",
        tagline: "VIP ENTERPRISE",
        price: 249990,
        annualPrice: 2499900,
        postsLimit: 60,
        videosLimit: 60,
        aiImagesLimit: 120,
        aiVideosLimit: 60,
        seoBlogsLimit: 20,
        multiAccount: true,
        maxAccounts: 3,
        isPopular: false,
        ctaText: "Elegir VIP",
        features: [
            "60 publicaciones al mes",
            "Hasta 3 marcas",
            "Soporte VIP dedicado"
        ]
    },
    agency: {
        id: "agency",
        name: "Agency Unlimited",
        tagline: "ILIMITADO PARA AGENCIAS",
        price: 499990,
        annualPrice: 4999900,
        postsLimit: 999,
        videosLimit: 999,
        aiImagesLimit: 999,
        aiVideosLimit: 999,
        seoBlogsLimit: 50,
        multiAccount: true,
        maxAccounts: 15,
        isPopular: false,
        ctaText: "Elegir Agency",
        features: [
            "Publicaciones ilimitadas (999 posts/mes)",
            "Reels y videos ilimitados",
            "Hasta 15 marcas o clientes independientes",
            "50 artículos de Blog SEO/GEO",
            "Ejecutivo de cuenta dedicado"
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

        return NextResponse.json({ success: true, message: 'Planes inicializados correctamente con la nueva estructura comercial.' });

    } catch (err: any) {
        console.error("Error seeding plans:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
