import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

export async function GET() {
    try {
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
                tagline: "POR 10 DÍAS",
                price: 0,
                annualPrice: 0,
                postsLimit: 3,
                videosLimit: 3,
                aiImagesLimit: 10,
                aiVideosLimit: 3,
                seoBlogsLimit: 0,
                multiAccount: false,
                maxAccounts: 1,
                isPopular: false,
                ctaText: "Prueba Gratuita",
                features: [
                    "Todas las redes sociales",
                    "Video básico (imágenes IA)",
                    "Generación de textos IA",
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
                videosLimit: 12,
                aiImagesLimit: 50,
                aiVideosLimit: 12,
                seoBlogsLimit: 0,
                multiAccount: false,
                maxAccounts: 1,
                isPopular: false,
                ctaText: "Comenzar Starter",
                features: [
                    "Todas las redes sociales",
                    "Video básico (imágenes IA)",
                    "Calendario de programación",
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
                videosLimit: 20,
                aiImagesLimit: 100,
                aiVideosLimit: 20,
                seoBlogsLimit: 4,
                multiAccount: false,
                maxAccounts: 1,
                isPopular: true,
                ctaText: "Elegir Pro",
                features: [
                    "Video Premium: guión IA + voz",
                    "Blog SEO/GEO (Google + ChatGPT)",
                    "Meta Ads integrado",
                    "Radar de Nicho",
                    "Anual $849.900 (ahorras ~$170.000)"
                ]
            },
            business: {
                id: "business",
                name: "Business",
                tagline: "HASTA 2 CUENTAS",
                price: 149990,
                annualPrice: 1499900,
                postsLimit: 999999,
                videosLimit: 999999,
                aiImagesLimit: 999999,
                aiVideosLimit: 999999,
                seoBlogsLimit: 999999,
                multiAccount: true,
                maxAccounts: 2,
                isPopular: false,
                ctaText: "Elegir Business",
                features: [
                    "Todo lo de Pro, multi-perfil",
                    "Video Premium por cuenta",
                    "Blog SEO/GEO y Meta Ads por cuenta",
                    "Multi-cuenta independiente (2 perfiles)",
                    "Soporte dedicado prioritario"
                ]
            },
            agency: {
                id: "agency",
                name: "Agency",
                tagline: "HASTA 10 CUENTAS",
                price: 299990,
                annualPrice: 2999900,
                postsLimit: 999999,
                videosLimit: 999999,
                aiImagesLimit: 999999,
                aiVideosLimit: 999999,
                seoBlogsLimit: 999999,
                multiAccount: true,
                maxAccounts: 10,
                isPopular: false,
                ctaText: "Elegir Agency",
                features: [
                    "Todo lo de Business",
                    "Multi-cuenta masiva (10 perfiles)",
                    "Blog SEO/GEO escalable",
                    "Marca blanca (próximamente)",
                    "Ejecutivo de cuenta dedicado"
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

        return NextResponse.json({
            success: true,
            message: "system_config/plans actualizado con cuotas ilimitadas para Business/Agency",
            previousPlans: currentPlans,
            restoredPostsCount: restoredPosts.length,
            restoredPosts
        });
    } catch (e: any) {
        console.error("Error in fix-plans route:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
