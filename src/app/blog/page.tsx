import { adminDb } from '../../lib/firebase-admin';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogIndex() {
    let posts = [];
    let upcomingPosts = [];
    
    try {
        if (adminDb) {
            // Fetch Published Posts
            const snapshot = await adminDb.collection('blog_posts')
                .where('status', '==', 'published')
                .get();
            
            snapshot.forEach(doc => {
                posts.push({ id: doc.id, ...doc.data() });
            });
            posts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Fetch Upcoming Posts
            const upcomingSnapshot = await adminDb.collection('blog_posts')
                .where('status', 'in', ['draft', 'strategy', 'pending'])
                .get();
            
            upcomingSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.scheduledFor) {
                    upcomingPosts.push({ id: doc.id, ...data });
                }
            });
            upcomingPosts.sort((a: any, b: any) => {
                const dateA = a.scheduledFor.toDate ? a.scheduledFor.toDate() : new Date(a.scheduledFor);
                const dateB = b.scheduledFor.toDate ? b.scheduledFor.toDate() : new Date(b.scheduledFor);
                return dateA.getTime() - dateB.getTime();
            });
        }
    } catch (error) {
        console.error("Error fetching blog posts:", error);
    }

    return (
        <div className="min-h-screen bg-slate-50 font-AgBody flex flex-col">
            
            {/* CORPORATE NAVBAR */}
            <nav className="w-full bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 font-display font-black text-xl text-slate-900 hover:opacity-80 transition-opacity">
                        <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">🤖</span>
                        Santisoft <span className="text-indigo-600">Bot</span>
                    </Link>
                    
                    <Link href="/login" className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 hidden sm:block">
                        Empezar Gratis
                    </Link>
                </div>
            </nav>

            {/* HERO SECTION */}
            <header className="bg-slate-900 text-white py-24 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[100px] -mr-48 -mt-48 rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[100px] -ml-48 -mb-48 rounded-full"></div>
                
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-block px-4 py-1.5 bg-indigo-500/10 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-500/20">
                        Aprende y Crece
                    </div>
                    <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                        Blog de <span className="text-indigo-400">Santisoft</span>
                    </h1>
                    <p className="text-lg md:text-xl text-indigo-100/80 max-w-2xl mx-auto font-medium">
                        Estrategias, guías y novedades sobre automatización de redes sociales, Inteligencia Artificial y marketing digital.
                    </p>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 max-w-7xl mx-auto px-6 py-20 w-full grid lg:grid-cols-[1fr_300px] gap-12 items-start">
                
                {/* POSTS GRID */}
                <div>
                    {posts.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[32px] border border-slate-200 shadow-sm">
                            <div className="text-6xl mb-4 opacity-50">📝</div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No hay artículos publicados aún</h3>
                            <p className="text-slate-500">Estamos preparando contenido increíble. ¡Vuelve pronto!</p>
                        </div>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-2">
                            {posts.map((post: any) => (
                                <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col bg-white rounded-[32px] border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-indigo-900/5 hover:border-indigo-200 transition-all duration-300">
                                    {post.imageUrl ? (
                                        <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100 relative">
                                            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={post.imageUrl} alt={post.title} />
                                        </div>
                                    ) : (
                                        <div className="aspect-[16/9] w-full bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center border-b border-slate-100">
                                            <span className="text-6xl opacity-20">📝</span>
                                        </div>
                                    )}
                                    
                                    <div className="p-8 flex flex-col flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
                                                {post.category || 'Automatización'}
                                            </span>
                                            <span className="text-[11px] font-bold text-slate-400">
                                                {post.createdAt ? new Date(post.createdAt).toLocaleDateString('es-CL', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                            </span>
                                        </div>
                                        
                                        <h3 className="font-display text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                                            {post.title}
                                        </h3>
                                        
                                        <p className="text-slate-500 font-medium line-clamp-3 mb-6 flex-1">
                                            {post.metaDescription}
                                        </p>
                                        
                                        <div className="flex items-center gap-3 mt-auto">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm border border-slate-200">
                                                🤖
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">
                                                {post.author || 'Equipo Santisoft'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* SIDEBAR: UPCOMING POSTS */}
                {upcomingPosts.length > 0 && (
                    <aside className="sticky top-10 space-y-8">
                        <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
                                Próximamente...
                            </h3>
                            <div className="space-y-6">
                                {upcomingPosts.map((up) => {
                                    const date = up.scheduledFor.toDate ? up.scheduledFor.toDate() : new Date(up.scheduledFor);
                                    return (
                                        <div key={up.id} className="relative pl-4 border-l-2 border-slate-100">
                                            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>
                                            <h4 className="text-sm font-bold text-slate-700 leading-tight mb-1">
                                                {up.title}
                                            </h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Programado para: {date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>
                )}
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
