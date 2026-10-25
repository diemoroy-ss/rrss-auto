import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('secret') || req.headers.get('x-admin-secret');
        const expectedSecret = process.env.ADMIN_CRON_SECRET || process.env.CRON_SECRET;

        // Requiere clave secreta estricta configurada en .env
        if (!expectedSecret || secret !== expectedSecret) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        if (!adminDb) {
            return NextResponse.json({ error: "No admin DB" }, { status: 500 });
        }

        const plansRef = adminDb.collection('system_config').doc('plans');
        const plansSnap = await plansRef.get();
        const currentPlans = plansSnap.data() || {};

        const updatedPlans = {
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
            // Alias retrocompatibles
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
                isPopular: true,
                ctaText: "Elegir Plan Crecimiento",
                features: [
                    "30 publicaciones al mes",
                    "Multicanal completo + Ads + Blog SEO"
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

        await plansRef.set(updatedPlans, { merge: true });

        // Restore posts with status quota_exceeded
        const quotaExceededSnap = await adminDb.collection('social_posts')
            .where('status', '==', 'quota_exceeded')
            .get();

        const restoredPosts: string[] = [];
        for (const docSnap of quotaExceededSnap.docs) {
            await docSnap.ref.update({
                status: 'confirmed',
                publishError: null
            });
            restoredPosts.push(docSnap.id);
        }

        // Update user spagrupofugas@gmail.com to pro plan
        const userFugasSnap = await adminDb.collection('users')
            .where('email', '==', 'spagrupofugas@gmail.com')
            .get();
        
        let fugasUpdated = false;
        for (const docSnap of userFugasSnap.docs) {
            await docSnap.ref.update({
                plan: 'pro',
                role: 'user',
                isUnlimited: false
            });
            fugasUpdated = true;
        }

        return NextResponse.json({
            success: true,
            message: "system_config/plans actualizado con cuotas y spagrupofugas@gmail.com configurado",
            previousPlans: currentPlans,
            fugasUpdated,
            restoredPostsCount: restoredPosts.length,
            restoredPosts
        });
    } catch (e: any) {
        console.error("Error in fix-plans route:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
