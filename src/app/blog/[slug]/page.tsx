import { adminDb } from '../../../lib/firebase-admin';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
    if (!adminDb) return { title: 'Blog Post' };

    const snapshot = await adminDb.collection('blog_posts').where('slug', '==', params.slug).limit(1).get();
    
    if (snapshot.empty) return { title: 'Post no encontrado' };

    const post = snapshot.docs[0].data();
    
    return {
        title: `${post.title} | Santisoft Blog`,
        description: post.metaDescription,
        openGraph: {
            title: post.title,
            description: post.metaDescription,
            images: post.imageUrl ? [{ url: post.imageUrl }] : [],
        }
    };
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
    if (!adminDb) return notFound();

    const snapshot = await adminDb.collection('blog_posts').where('slug', '==', params.slug).limit(1).get();
    
    if (snapshot.empty) {
        return notFound();
    }

    const post = snapshot.docs[0].data();

    return (
        <article className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <header className="mb-10 text-center">
                    <p className="text-sm font-medium text-indigo-600 mb-2">
                        {post.category || 'Automatización'}
                    </p>
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
                        {post.title}
                    </h1>
                    <div className="flex items-center justify-center space-x-4 text-gray-500 text-sm">
                        <span>{post.author || 'Equipo Santisoft'}</span>
                        <span>&bull;</span>
                        <time dateTime={post.createdAt}>
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString('es-CL', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            }) : ''}
                        </time>
                    </div>
                </header>

                {post.imageUrl && (
                    <div className="mb-12 rounded-2xl overflow-hidden shadow-xl">
                        <img src={post.imageUrl} alt={post.title} className="w-full h-auto object-cover max-h-[500px]" />
                    </div>
                )}

                <div 
                    className="prose prose-lg prose-indigo mx-auto text-gray-800"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </div>
        </article>
    );
}
