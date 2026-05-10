import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

export async function GET() {
    try {
        if (!adminDb) {
            return NextResponse.json({ error: "Firebase Admin is not configured" }, { status: 500 });
        }

        const newPost = {
            title: "Por qué automatizar tus Redes Sociales en 2026: La Guía Definitiva",
            slug: "por-que-automatizar-tus-redes-sociales-en-2026",
            metaDescription: "Descubre cómo la automatización de redes sociales puede ahorrarte cientos de horas mensuales, aumentar tu alcance orgánico y multiplicar las conversiones de tu negocio.",
            category: "Automatización",
            author: "Diego Roy",
            imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            content: `
                <h2>El tiempo es tu activo más valioso</h2>
                <p>En el vertiginoso mundo digital de 2026, gestionar perfiles de Facebook, Instagram, LinkedIn y TikTok de forma manual ya no es una opción viable para negocios que buscan escalar. Pasamos de la era de la "publicación manual" a la era de la <strong>automatización inteligente</strong>.</p>
                
                <h3>¿Qué es la Automatización de Redes Sociales?</h3>
                <p>La automatización de redes sociales consiste en utilizar herramientas (como Santisoft) para programar, publicar y gestionar contenido en diferentes plataformas de manera simultánea y en piloto automático.</p>
                <ul>
                    <li><strong>Programación en Lote (Batching):</strong> Dedicas 2 horas a la semana para crear y programar el contenido de todo el mes.</li>
                    <li><strong>Publicación Multicanal:</strong> Un solo clic publica el mismo contenido adaptado para Instagram, Facebook y LinkedIn.</li>
                    <li><strong>Uso de IA:</strong> Generación de descripciones, copys y hasta artículos completos apoyados por Inteligencia Artificial (Gemini, ChatGPT).</li>
                </ul>

                <h2>Beneficios Inmediatos de Automatizar</h2>
                <p>Los negocios que adoptan herramientas de automatización experimentan ventajas competitivas masivas:</p>
                <ol>
                    <li><strong>Ahorro de Tiempo:</strong> Recuperas hasta 15 horas semanales que antes perdías saltando entre aplicaciones.</li>
                    <li><strong>Consistencia:</strong> El algoritmo de Meta (Instagram/Facebook) premia la constancia. Al tener todo programado, tu marca nunca deja de publicar, incluso si estás de vacaciones.</li>
                    <li><strong>Menos Errores:</strong> Al revisar todo el contenido en lote antes de programarlo, se reducen significativamente los errores tipográficos y de formato.</li>
                </ol>

                <h3>Cómo Santisoft te ayuda a lograrlo</h3>
                <p>Santisoft ha sido diseñado pensando en agencias, freelancers y dueños de negocio. Con nuestra conexión nativa a la API de Meta (Facebook Login for Business), garantizamos que tus tokens de acceso sean permanentes y seguros.</p>
                
                <p><strong>El SEO también importa:</strong> Con la nueva integración de <em>Piloto Automático SEO</em>, Santisoft no solo cuidará tus redes sociales, sino que también redactará y publicará artículos en tu blog (como este) para atraerte tráfico gratuito desde Google.</p>
                
                <h2>Conclusión</h2>
                <p>No dejes que tu competencia te gane terreno. Empieza a automatizar tus flujos de trabajo hoy mismo, recupera tu tiempo libre y observa cómo tu presencia digital crece sin esfuerzo.</p>
            `,
            status: "published",
            createdAt: new Date().toISOString()
        };

        const docRef = await adminDb.collection('blog_posts').add(newPost);

        return NextResponse.json({ success: true, message: "Artículo creado exitosamente", id: docRef.id, slug: newPost.slug });
    } catch (error: any) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
