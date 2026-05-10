import { adminDb } from '../../lib/firebase-admin';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogIndex() {
    let posts = [];
    try {
        if (adminDb) {
            const snapshot = await adminDb.collection('blog_posts')
                .where('status', '==', 'published')
                .get();
            
            snapshot.forEach(doc => {
                posts.push({ id: doc.id, ...doc.data() });
            });

            // Ordenar por fecha en JavaScript para evitar error de índice compuesto en Firestore
            posts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    } catch (error) {
        console.error("Error fetching blog posts:", error);
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                        Blog de Santisoft
                    </h1>
                    <p className="mt-4 text-xl text-gray-600">
                        Aprende sobre automatización, SEO y redes sociales para hacer crecer tu negocio.
                    </p>
                </div>

                {posts.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        Aún no hay artículos publicados. ¡Vuelve pronto!
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post: any) => (
                            <Link key={post.id} href={`/blog/${post.slug}`} className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
                                {post.imageUrl && (
                                    <div className="flex-shrink-0">
                                        <img className="h-48 w-full object-cover" src={post.imageUrl} alt={post.title} />
                                    </div>
                                )}
                                <div className="flex-1 p-6 flex flex-col justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-indigo-600">
                                            {post.category || 'Automatización'}
                                        </p>
                                        <div className="block mt-2">
                                            <p className="text-xl font-semibold text-gray-900">{post.title}</p>
                                            <p className="mt-3 text-base text-gray-500 line-clamp-3">
                                                {post.metaDescription}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex items-center">
                                        <div className="flex-shrink-0">
                                            <span className="sr-only">{post.author || 'Equipo Santisoft'}</span>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">
                                                {post.author || 'Equipo Santisoft'}
                                            </p>
                                            <div className="flex space-x-1 text-sm text-gray-500">
                                                <time dateTime={post.createdAt}>
                                                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString('es-CL') : ''}
                                                </time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
