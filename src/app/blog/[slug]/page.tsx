import { adminDb } from '../../../lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';

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

    // 1. Fetch main post
    const postSnapshot = await adminDb.collection('blog_posts').where('slug', '==', params.slug).limit(1).get();
    
    if (postSnapshot.empty) {
        return notFound();
    }

    const post = postSnapshot.docs[0].data();

    // 2. Fetch recent posts for the sidebar (excluding the current one)
    let recentPosts: any[] = [];
    try {
        const recentSnapshot = await adminDb.collection('blog_posts')
            .where('status', '==', 'published')
            .get();
        
        recentSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.slug !== params.slug) {
                recentPosts.push({ id: doc.id, ...data });
            }
        });

        // Sort by date and take top 5
        recentPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        recentPosts = recentPosts.slice(0, 5);
    } catch (e) {
        console.error("Error fetching recent posts", e);
    }

    return (
        <div className="min-h-screen bg-slate-50 font-AgBody flex flex-col">
            {/* CORPORATE NAVBAR */}
            <nav className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 font-display font-black text-xl text-slate-900 hover:opacity-80 transition-opacity">
                        <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">🤖</span>
                        Santisoft <span className="text-indigo-600">Bot</span>
                    </Link>
                    
                    <div className="flex gap-4 items-center">
                        <Link href="/blog" className="text-sm font-bold text-slate-500 hover:text-slate-900 hidden sm:block">
                            Ver más artículos
                        </Link>
                        <Link href="/login" className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30">
                            Empezar Gratis
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 lg:py-20 grid lg:grid-cols-[1fr_350px] gap-12 lg:gap-16 items-start">
                
                {/* LEFT COLUMN: MAIN ARTICLE */}
                <article className="bg-white rounded-[32px] border border-slate-200 p-8 md:p-12 shadow-sm">
                    <header className="mb-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
                                {post.category || 'Automatización'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                                {post.createdAt ? new Date(post.createdAt).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-slate-900 mb-6 leading-tight tracking-tight">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-4 text-slate-600 border-t border-b border-slate-100 py-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg border border-slate-200">🤖</div>
                            <div>
                                <p className="font-bold text-sm text-slate-900">{post.author || 'Equipo Santisoft'}</p>
                                <p className="text-xs text-slate-500">Inteligencia Artificial y Automatización</p>
                            </div>
                        </div>
                    </header>

                    {post.imageUrl && (
                        <div className="mb-12 rounded-[24px] overflow-hidden shadow-xl shadow-slate-200/50">
                            <img src={post.imageUrl} alt={post.title} className="w-full h-auto object-cover max-h-[600px]" />
                        </div>
                    )}

                    {/* Contenido HTML del Post */}
                    <div 
                        className="prose prose-lg prose-indigo prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-indigo-600 prose-img:rounded-2xl"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </article>

                {/* RIGHT COLUMN: SIDEBAR */}
                <aside className="sticky top-32 space-y-8">
                    
                    {/* CTA Box */}
                    <div className="bg-slate-900 rounded-[32px] p-8 text-center shadow-xl shadow-slate-900/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] rounded-full"></div>
                        <h3 className="text-2xl font-display font-bold text-white mb-4 relative z-10">¿Cansado de publicar a mano?</h3>
                        <p className="text-indigo-200 text-sm font-medium mb-6 relative z-10">Delega tus redes sociales a nuestra Inteligencia Artificial hoy mismo.</p>
                        <Link href="/login" className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 relative z-10">
                            Probar Santisoft Gratis
                        </Link>
                    </div>

                    {/* Recent Posts */}
                    {recentPosts.length > 0 && (
                        <div>
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                                Publicaciones Recientes
                            </h3>
                            <div className="space-y-4">
                                {recentPosts.map((rp) => (
                                    <Link key={rp.id} href={`/blog/${rp.slug}`} className="group flex gap-4 p-3 rounded-2xl hover:bg-white hover:shadow-sm hover:border hover:border-slate-200 border border-transparent transition-all">
                                        {rp.imageUrl ? (
                                            <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                                                <img src={rp.imageUrl} alt={rp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">
                                                📝
                                            </div>
                                        )}
                                        <div className="flex flex-col justify-center">
                                            <h4 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-tight mb-1">
                                                {rp.title}
                                            </h4>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {rp.createdAt ? new Date(rp.createdAt).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' }) : ''}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </main>

            {/* CORPORATE FOOTER */}
            <footer className="py-12 border-t border-slate-200 bg-white text-center mt-auto">
                <div className="flex justify-center gap-6 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <Link href="/" className="hover:text-indigo-600 transition-colors">Inicio</Link>
                    <Link href="/privacidad" className="hover:text-indigo-600 transition-colors">Privacidad</Link>
                    <Link href="/terminos" className="hover:text-indigo-600 transition-colors">Términos</Link>
                </div>
                <p className="text-slate-400 text-sm font-medium">© 2026 Santisoft. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
