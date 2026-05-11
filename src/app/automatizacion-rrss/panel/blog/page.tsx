"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, getDocs, doc, getDoc, query } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

interface BlogPost {
  id: string;
  title: string;
  status: string; // 'published' | 'draft' | 'pending'
  scheduledFor?: Date;
  createdAt: Date;
  metaDescription?: string;
}

export default function SeoAutopilotPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'articulos' | 'calendario'>('articulos');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      try {
        const d = await getDoc(doc(db, "users", u.uid));
        const data = d.data();
        if (data) {
          const authorizedEmails = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com"];
          if (!authorizedEmails.includes(u.email || "") && !data.hasSeoAutopilot) {
             router.push("/automatizacion-rrss/panel");
             return;
          }
        }
        
        // Fetch posts
        const q = query(collection(db, "blog_posts")); // no orderBy to avoid missing index error
        const snap = await getDocs(q);
        const fetchedPosts: BlogPost[] = [];
        snap.forEach(docSnap => {
            const pd = docSnap.data();
            fetchedPosts.push({
                id: docSnap.id,
                title: pd.title || "Sin título",
                status: pd.status || "draft",
                scheduledFor: pd.scheduledFor?.toDate(),
                createdAt: pd.createdAt ? new Date(pd.createdAt) : new Date(),
                metaDescription: pd.metaDescription || ""
            });
        });
        
        fetchedPosts.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
        setPosts(fetchedPosts);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) {
     return <div className="animate-pulse space-y-4 max-w-2xl"><div className="h-10 bg-slate-200 rounded w-1/3"></div><div className="h-64 bg-slate-200 rounded"></div></div>;
  }

  const publishedPosts = posts.filter(p => p.status === 'published');
  const draftPosts = posts.filter(p => p.status !== 'published');

  return (
    <div className="max-w-[1400px] mx-auto lg:mx-0 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <span className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-600/30 text-white">📝</span>
             Autopilot SEO
          </h1>
          <p className="text-slate-500 mt-3 font-medium text-lg max-w-2xl">
            Gestiona los artículos generados por Inteligencia Artificial y revisa el calendario estratégico de publicaciones para posicionar en Google.
          </p>
        </div>
        <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2">
            ⚙️ Configurar Sitio Web
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl w-max">
        <button 
           onClick={() => setActiveTab('articulos')}
           className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'articulos' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            📚 Artículos Generados
        </button>
        <button 
           onClick={() => setActiveTab('calendario')}
           className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'calendario' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            📅 Calendario Estratégico
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'articulos' && (
          <div className="grid lg:grid-cols-2 gap-8">
             {/* Column 1: Por Publicar */}
             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
                 <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-6">
                     <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                     Por Publicar (Borradores)
                 </h2>
                 
                 {draftPosts.length === 0 ? (
                     <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                         No hay borradores pendientes de revisión.
                     </div>
                 ) : (
                     <div className="space-y-4">
                         {draftPosts.map(post => (
                             <div key={post.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors flex items-center justify-between gap-4">
                                 <div>
                                     <h4 className="font-bold text-slate-800 line-clamp-1">{post.title}</h4>
                                     <p className="text-xs text-slate-500 font-medium mt-1">Generado: {post.createdAt.toLocaleDateString()}</p>
                                 </div>
                                 <button className="shrink-0 text-xs font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg transition-colors">
                                     Revisar
                                 </button>
                             </div>
                         ))}
                     </div>
                 )}
             </div>

             {/* Column 2: Publicados */}
             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
                 <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-6">
                     <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                     Publicados
                 </h2>
                 
                 {publishedPosts.length === 0 ? (
                     <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                         No hay artículos publicados aún.
                     </div>
                 ) : (
                     <div className="space-y-4">
                         {publishedPosts.map(post => (
                             <div key={post.id} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col gap-2">
                                 <h4 className="font-bold text-slate-800 line-clamp-2">{post.title}</h4>
                                 <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] uppercase tracking-widest font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">En línea</span>
                                    <span className="text-xs text-slate-500 font-medium">{post.createdAt.toLocaleDateString()}</span>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
          </div>
      )}

      {activeTab === 'calendario' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10 min-h-[500px] flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-6 opacity-80">🗺️</div>
              <h2 className="text-2xl font-black text-slate-900 mb-3">Calendario de Clúster Temático</h2>
              <p className="text-slate-500 max-w-md font-medium mb-8">
                  La Inteligencia Artificial está analizando tu rubro para generar un mapa de contenidos estratégico a 30 días vista.
              </p>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 hover:-translate-y-1">
                  ✨ Generar Estrategia SEO del Mes
              </button>
          </div>
      )}
    </div>
  );
}
