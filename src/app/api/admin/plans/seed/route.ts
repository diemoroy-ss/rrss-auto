import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../../lib/firebase-admin';

const DEFAULT_PLANS = {
    free: {
        id: "free",
        name: "Free",
        tagline: "PRUEBA DE 10 DÍAS",
        price: 0,
        originalPrice: 0,
        annualPrice: 0,
        annualMonthlyPrice: 0,
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
            "5 publicaciones automáticas de prueba por 10 días",
            "5 imágenes con nuestros agentes",
            "1 Marca configurada (Instagram + Facebook)",
            "Calendario básico y planificación",
            "Aprobación y control desde la app"
        ]
    },
    esencial: {
        id: "esencial",
        name: "Plan PyME Esencial",
        tagline: "PRESENCIA ACTIVA · CERO BLOQUEOS",
        price: 59990,
        originalPrice: 89990,
        annualPrice: 647880,
        annualMonthlyPrice: 53990,
        postsLimit: 15,
        videosLimit: 8,
        aiImagesLimit: 15,
        aiVideosLimit: 8,
        seoBlogsLimit: 0,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Elegir Plan Esencial ($59.990)",
        features: [
            "1 Marca configurada (Instagram + Facebook)",
            "Clonación de Voz de Marca con nuestros agentes (textos con el tono real de tu negocio, cero robóticos)",
            "Calendario Hiper-Orgánico Mensual: 15 publicaciones estratégicas al mes (valor, autoridad y venta)",
            "Generador de Gráficas y Carruseles: Hasta 15 diseños mensuales listos con tu logo y colores corporativos",
            "8 Guiones de Reels + Secuencias de Stories listos para leer en 30 segundos frente al celular",
            "Escudo Policía Anti-Baneos: Protección automática contra shadowbans y bloqueos de alcance en Instagram",
            "Aprobación y control móvil directo desde WhatsApp",
            "Soporte directo por WhatsApp de lunes a viernes"
        ]
    },
    starter: {
        id: "starter",
        name: "Plan PyME Esencial",
        tagline: "PRESENCIA ACTIVA · CERO BLOQUEOS",
        price: 59990,
        originalPrice: 89990,
        annualPrice: 647880,
        annualMonthlyPrice: 53990,
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
            "1 Marca configurada (Instagram + Facebook)",
            "15 publicaciones al mes",
            "8 guiones de Reels y Stories"
        ]
    },
    crecimiento: {
        id: "crecimiento",
        name: "Plan PyME Crecimiento",
        tagline: "MÁQUINA DE VENTAS · MÁS ELEGIDO",
        badge: "🔥 MÁS ELEGIDO · SOLO 15 CUPOS",
        price: 99990,
        originalPrice: 149990,
        annualPrice: 1079880,
        annualMonthlyPrice: 89990,
        postsLimit: 30,
        videosLimit: 30,
        aiImagesLimit: 40,
        aiVideosLimit: 30,
        seoBlogsLimit: 4,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: true,
        bonusText: "🎁 BONO EXCLUSIVO (Solo 15 cupos): Setup 'Llave en Mano' GRATIS (Valor real $150.000 CLP) — Nosotros configuramos tu marca, extraemos tu voz desde tu web y dejamos tu primera quincena andando en una videollamada de 25 minutos.",
        ctaText: "Asegurar Cupo Crecimiento con Setup Gratis ($99.990)",
        features: [
            "Todo lo incluido en el Plan Esencial",
            "Multicanal Ilimitado (30 días): Instagram, Facebook, TikTok",
            "Módulo de Autoridad en LinkedIn para ventas y captación B2B",
            "Espía de Competencia Activo: Analiza qué anuncios y publicaciones le dan resultado a tus competidores",
            "Pack Publicidad Lista (Meta & Google Ads): Textos persuasivos y creativos listos para campañas pagadas",
            "Posicionamiento en Google y buscadores de nueva generación (SEO + GEO): Artículos de blog para que tu PyME aparezca recomendada",
            "Generador de Lead Magnets y Secuencias de Cierre por WhatsApp",
            "Atención prioritaria VIP por WhatsApp"
        ]
    },
    pro: {
        id: "pro",
        name: "Plan PyME Crecimiento",
        tagline: "MÁQUINA DE VENTAS",
        price: 99990,
        originalPrice: 149990,
        annualPrice: 1079880,
        annualMonthlyPrice: 89990,
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
            "30 publicaciones al mes",
            "Multicanal completo + Ads + Blog SEO"
        ]
    },
    growth: {
        id: "growth",
        name: "Plan PyME Crecimiento",
        tagline: "MÁQUINA DE VENTAS",
        price: 99990,
        originalPrice: 149990,
        annualPrice: 1079880,
        annualMonthlyPrice: 89990,
        postsLimit: 30,
        videosLimit: 30,
        aiImagesLimit: 40,
        aiVideosLimit: 30,
        seoBlogsLimit: 4,
        multiAccount: false,
        maxAccounts: 1,
        isPopular: false,
        ctaText: "Elegir Plan Crecimiento",
        features: [
            "30 publicaciones al mes",
            "Multicanal completo"
        ]
    },
    piloto_automatico: {
        id: "piloto_automatico",
        name: "Plan PyME Piloto Automático",
        tagline: "DONE-WITH-YOU · SERVICIO VIP",
        badge: "⚡ SETUP INICIAL GRATIS",
        price: 249990,
        originalPrice: 349990,
        annualPrice: 2699880,
        annualMonthlyPrice: 224990,
        postsLimit: 60,
        videosLimit: 60,
        aiImagesLimit: 120,
        aiVideosLimit: 60,
        seoBlogsLimit: 20,
        multiAccount: true,
        maxAccounts: 3,
        isPopular: false,
        bonusText: "🛡️ SERVICIO DONE-WITH-YOU: 2 sesiones ejecutivas al mes (20 min por Zoom) para generar las campañas, revisar métricas y dejar todo programado en vivo.",
        ctaText: "Postular a Piloto Automático ($249.990)",
        features: [
            "Todo el Plan Crecimiento Ilimitado incluido",
            "2 Sesiones Ejecutivas al Mes (20 min por Zoom): Ejecutamos el espía de competencia, generamos campañas y programamos todo el mes en vivo",
            "Optimización de Perfil de LinkedIn del Dueño + Casos de Éxito para cerrar negocios de mayor ticket",
            "Auditoría Trimestral de Conversión Web (CRO): Optimizamos tu web para que las visitas de redes compren",
            "Soporte Prioritario Directo por WhatsApp con tu estratega dedicado",
            "Monitoreo continuo de reputación y optimización de anuncios"
        ]
    },
    business: {
        id: "business",
        name: "Plan PyME Piloto Automático",
        tagline: "DONE-WITH-YOU VIP",
        price: 249990,
        originalPrice: 349990,
        annualPrice: 2699880,
        annualMonthlyPrice: 224990,
        postsLimit: 60,
        videosLimit: 60,
        aiImagesLimit: 120,
        aiVideosLimit: 60,
        seoBlogsLimit: 20,
        multiAccount: true,
        maxAccounts: 3,
        isPopular: false,
        ctaText: "Elegir Piloto Automático",
        features: [
            "60 publicaciones al mes",
            "Hasta 3 marcas o cuentas",
            "Sesiones quincenales por Zoom"
        ]
    },
    agency: {
        id: "agency",
        name: "Plan PyME Piloto Automático",
        tagline: "DONE-WITH-YOU VIP",
        price: 249990,
        originalPrice: 349990,
        annualPrice: 2699880,
        annualMonthlyPrice: 224990,
        postsLimit: 60,
        videosLimit: 60,
        aiImagesLimit: 120,
        aiVideosLimit: 60,
        seoBlogsLimit: 20,
        multiAccount: true,
        maxAccounts: 3,
        isPopular: false,
        ctaText: "Elegir Piloto Automático",
        features: [
            "60 publicaciones al mes",
            "Hasta 3 marcas o cuentas",
            "Sesiones quincenales por Zoom"
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
