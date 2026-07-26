import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

export async function GET() {
    try {
        if (!adminDb) {
            return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });
        }

        // Find user spalezcom@gmail.com
        const userSnap = await adminDb.collection('users').where('email', '==', 'spalezcom@gmail.com').limit(1).get();
        if (userSnap.empty) {
            return NextResponse.json({ error: "Usuario spalezcom@gmail.com no encontrado" }, { status: 404 });
        }

        const userId = userSnap.docs[0].id;

        const legacyPosts = [
            {
                title: "AUTOMATIZACIÓN DE PROCESOS PARA PYMES CHILENAS: MULTIPLICA TU TIEMPO Y GANANCIAS CON IA",
                slug: "automatizacion-de-procesos-para-pymes-chilenas-multiplica-tu-tiempo-y-ganancias-con-ia",
                metaDescription: "La automatización de procesos empresariales es clave para que las PYMES chilenas optimicen recursos, reduzcan costos operativos y escalen su productividad con Inteligencia Artificial.",
                targetKeyword: "Automatización procesos PYMEs Chile",
                keywords: ["Automatización procesos PYMEs Chile", "Software a medida PYMEs", "Inteligencia Artificial empresas Chile", "Optimización procesos empresariales", "Desarrollo web para PYMEs"],
                content: `La automatización de procesos empresariales es clave para que las PYMES chilenas optimicen recursos, reduzcan costos operativos y escalen su productividad con Inteligencia Artificial.

## Por qué las PYMEs en Chile deben automatizarse hoy

En el entorno competitivo actual, las empresas chilenas enfrentan retos constantes en la gestión de clientes, facturación, seguimiento comercial y marketing. La integración de herramientas inteligentes y flujos automatizados permite ahorrar hasta un 70% del tiempo operativo diario.

### Beneficios Principales:
- **Reducción de errores humanos** en tareas repetitivas.
- **Respuesta instantánea** a prospectos vía WhatsApp y Webchat.
- **Escalabilidad comercial** sin necesidad de aumentar exponencialmente la nómina.

### Cómo comenzar:
Evalúa los cuellos de botella en tu negocio y conecta tus sistemas con soluciones de automatización a medida como Santisoft AI.`,
                htmlContent: `<p>La automatización de procesos empresariales es clave para que las PYMES chilenas optimicen recursos, reduzcan costos operativos y escalen su productividad con Inteligencia Artificial.</p><h2>Por qué las PYMEs en Chile deben automatizarse hoy</h2><p>En el entorno competitivo actual, las empresas chilenas enfrentan retos constantes en la gestión de clientes, facturación, seguimiento comercial y marketing. La integración de herramientas inteligentes y flujos automatizados permite ahorrar hasta un 70% del tiempo operativo diario.</p><h3>Beneficios Principales:</h3><ul><li><strong>Reducción de errores humanos</strong> en tareas repetitivas.</li><li><strong>Respuesta instantánea</strong> a prospectos vía WhatsApp y Webchat.</li><li><strong>Escalabilidad comercial</strong> sin necesidad de aumentar exponencialmente la nómina.</li></ul><h3>Cómo comenzar:</h3><p>Evalúa los cuellos de botella en tu negocio y conecta tus sistemas con soluciones de automatización a medida como Santisoft AI.</p>`,
                imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
                status: "published",
                publishedAt: "2026-06-17T12:00:00.000Z",
                createdAt: "2026-06-17T12:00:00.000Z",
                userId: userId,
            },
            {
                title: "AUTOMATIZACIÓN DE PROCESOS PARA PYMES EN CHILE: INNOVACIÓN Y EFICIENCIA CON IA",
                slug: "automatizacion-de-procesos-para-pymes-en-chile-innovacion-y-eficiencia-con-ia",
                metaDescription: "La automatización de procesos empresariales es la estrategia clave para que las PYMEs chilenas eliminen tareas repetitivas y aumenten sus ventas con IA.",
                targetKeyword: "automatizacion pymes chile",
                keywords: ["automatizacion pymes chile", "inteligencia artificial negocios"],
                content: `La automatización de procesos empresariales es la estrategia clave para que las PYMEs chilenas eliminen tareas repetitivas y aumenten sus ventas con IA.

## Innovación y eficiencia a tu alcance

Adoptar Inteligencia Artificial en tu negocio ya no es exclusivo de grandes corporaciones. Mediante asistentes virtuales, integración de redes sociales e IA generativa, tu PYME puede competir al más alto nivel.

### Claves de éxito:
1. Automatiza la captación y cualificación de leads.
2. Sincroniza tu catálogo e inventario en tiempo real.
3. Genera contenido para blogs y redes sociales automáticamente.`,
                htmlContent: `<p>La automatización de procesos empresariales es la estrategia clave para que las PYMEs chilenas eliminen tareas repetitivas y aumenten sus ventas con IA.</p><h2>Innovación y eficiencia a tu alcance</h2><p>Adoptar Inteligencia Artificial en tu negocio ya no es exclusivo de grandes corporaciones. Mediante asistentes virtuales, integración de redes sociales e IA generativa, tu PYME puede competir al más alto nivel.</p>`,
                imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
                status: "published",
                publishedAt: "2026-06-03T12:00:00.000Z",
                createdAt: "2026-06-03T12:00:00.000Z",
                userId: userId,
            },
            {
                title: "PYMES EN CHILE: ¿POR QUÉ EXCEL TE HACE PERDER DINERO EN GESTIÓN DE CLIENTES Y CÓMO SOLUCIONARLO?",
                slug: "pymes-en-chile-por-que-excel-te-hace-perder-dinero-en-gestion-de-clientes",
                metaDescription: "Las PYMEs en Chile están perdiendo dinero significativamente al confiar en planillas Excel para la gestión de clientes y seguimiento comercial. Descubre el software a medida.",
                targetKeyword: "PYMEs Chile gestión clientes",
                keywords: ["PYMEs Chile gestión clientes", "automatización procesos PYMEs", "excel vs crm"],
                content: `Las PYMEs en Chile están perdiendo dinero significativamente al confiar en planillas Excel para la gestión de clientes y seguimiento comercial. Descubre las ventajas del software a medida y los flujos automatizados.

## El costo oculto del Excel en tu empresa

Utilizar planillas manuales provoca pérdida de cotizaciones, falta de seguimiento oportuno a prospectos y datos desactualizados. Un sistema automatizado centraliza las interacciones y notifica a tu equipo de ventas al instante.`,
                htmlContent: `<p>Las PYMEs en Chile están perdiendo dinero significativamente al confiar en planillas Excel para la gestión de clientes y seguimiento comercial.</p><h2>El costo oculto del Excel en tu empresa</h2><p>Utilizar planillas manuales provoca pérdida de cotizaciones, falta de seguimiento oportuno a prospectos y datos desactualizados.</p>`,
                imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
                status: "published",
                publishedAt: "2026-05-27T12:00:00.000Z",
                createdAt: "2026-05-27T12:00:00.000Z",
                userId: userId,
            }
        ];

        const insertedIds: string[] = [];

        for (const post of legacyPosts) {
            // Check if already exists by slug
            const existing = await adminDb.collection('blog_posts')
                .where('userId', '==', userId)
                .where('slug', '==', post.slug)
                .limit(1)
                .get();

            if (existing.empty) {
                const newDoc = await adminDb.collection('blog_posts').add(post);
                insertedIds.push(newDoc.id);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Se migraron/agregaron ${insertedIds.length} artículos anteriores exitosamente.`,
            insertedIds,
        });

    } catch (error: any) {
        console.error("Error seeding legacy posts:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
