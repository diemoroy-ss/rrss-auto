"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, getDocs, doc, getDoc, query, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

interface BlogPost {
  id: string;
  title: string;
  status: string; // 'published' | 'draft' | 'pending' | 'strategy'
  scheduledFor?: Date;
  createdAt: Date;
  metaDescription?: string;
  targetKeyword?: string;
}

export default function SeoAutopilotPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'articulos' | 'calendario'>('articulos');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  
  const [user, setUser] = useState<any>(null);
  const [businessType, setBusinessType] = useState("");

  // Config Modal State
  const [showConfig, setShowConfig] = useState(false);
  const [tone, setTone] = useState("Profesional y cercano");
  const [audience, setAudience] = useState("");
  const [keywords, setKeywords] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  // Strategy State
  const [generatingStrategy, setGeneratingStrategy] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchPosts = async () => {
      const q = query(collection(db, "blog_posts")); 
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
              metaDescription: pd.metaDescription || "",
              targetKeyword: pd.targetKeyword || ""
          });
      });
      
      fetchedPosts.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
      setPosts(fetchedPosts);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
      try {
        const d = await getDoc(doc(db, "users", u.uid));
        const data = d.data();
        if (data) {
          const authorizedEmails = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com"];
          const userEmail = (u.email || "").toLowerCase();
          if (!authorizedEmails.includes(userEmail) && !data.hasSeoAutopilot && data.role !== 'admin') {
             router.push("/automatizacion-rrss/panel");
             return;
          }
          setBusinessType(data.rubro || "");
          if (data.seoConfig) {
              setTone(data.seoConfig.tone || "Profesional y cercano");
              setAudience(data.seoConfig.audience || "");
              setKeywords(data.seoConfig.keywords || "");
          }
        }
        await fetchPosts();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleSaveConfig = async () => {
      setSavingConfig(true);
      try {
          await updateDoc(doc(db, "users", user.uid), {
              seoConfig: { tone, audience, keywords }
          });
          setShowConfig(false);
          showToast("✅ Configuración guardada correctamente");
      } catch (error) {
          console.error("Error saving config:", error);
          showToast("❌ Error guardando la configuración");
      } finally {
          setSavingConfig(false);
      }
  };

  const handleGenerateStrategy = async () => {
      setGeneratingStrategy(true);
      try {
          const response = await fetch('/api/ai/seo-strategy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  userId: user.uid,
                  businessType,
                  tone,
                  audience,
                  keywords
              })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          
          await fetchPosts(); // Refresh list to show new calendar items
          showToast("✨ ¡Estrategia generada con éxito!");
      } catch (error: any) {
          console.error(error);
          showToast("❌ Error generando la estrategia: " + error.message);
      } finally {
          setGeneratingStrategy(false);
      }
  };

  if (loading) {
     return <div className="animate-pulse space-y-4 max-w-2xl"><div className="h-10 bg-slate-200 rounded w-1/3"></div><div className="h-64 bg-slate-200 rounded"></div></div>;
  }

  const publishedPosts = posts.filter(p => p.status === 'published');
  const draftPosts = posts.filter(p => p.status === 'draft');
  const strategyPosts = posts.filter(p => p.status === 'strategy');

  return (
    <div className="max-w-[1400px] mx-auto lg:mx-0 animate-in fade-in duration-500 pb-20 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm z-[200] animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
              {toastMessage}
          </div>
      )}

      {/* Config Modal */}
      {showConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-lg w-full relative">
                  <button onClick={() => setShowConfig(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                      ✖
                  </button>
                  <h3 className="text-2xl font-black text-slate-900 mb-6">Configuración del Cerebro SEO</h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tono de Voz</label>
                          <textarea rows={2} value={tone} onChange={e => setTone(e.target.value)} placeholder="Ej: Profesional, cercano, divertido..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Público Objetivo</label>
                          <textarea rows={2} value={audience} onChange={e => setAudience(e.target.value)} placeholder="Ej: Emprendedores de 25 a 40 años" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Palabras Clave (Opcional)</label>
                          <textarea rows={2} value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Ej: automatización, ventas, marketing" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" />
                      </div>
                      <button onClick={handleSaveConfig} disabled={savingConfig} className="w-full mt-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-xl transition-all">
                          {savingConfig ? "Guardando..." : "Guardar Configuración"}
                      </button>
                  </div>
              </div>
          </div>
      )}

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
        <div className="flex flex-wrap items-center gap-3">
          <a href="/blog" target="_blank" className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold py-2 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 hover:shadow-md">
              🌐 Ver Blog Público
          </a>
          <button onClick={() => setShowConfig(true)} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 hover:shadow-md">
              ⚙️ Configurar Sitio Web
          </button>
        </div>
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
          <div className="space-y-6">
              {strategyPosts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10 min-h-[500px] flex flex-col items-center justify-center text-center">
                      <div className="text-6xl mb-6 opacity-80">🗺️</div>
                      <h2 className="text-2xl font-black text-slate-900 mb-3">Calendario de Clúster Temático</h2>
                      <p className="text-slate-500 max-w-md font-medium mb-8">
                          La Inteligencia Artificial analizará tu rubro ({businessType || 'General'}) para generar un mapa de contenidos estratégico a 30 días vista.
                      </p>
                      <button onClick={handleGenerateStrategy} disabled={generatingStrategy} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-3 hover:-translate-y-1">
                          {generatingStrategy ? (
                              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> Analizando nicho...</>
                          ) : (
                              <>✨ Generar Estrategia SEO del Mes</>
                          )}
                      </button>
                  </div>
              ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
                      <div className="flex items-center justify-between mb-8">
                          <div>
                              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">🗺️ Tu Mapa de Contenidos</h2>
                              <p className="text-slate-500 font-medium mt-1">Estas son las ideas propuestas para posicionar tu sitio en Google.</p>
                          </div>
                          <button onClick={handleGenerateStrategy} disabled={generatingStrategy} className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors">
                              {generatingStrategy ? "Regenerando..." : "Regenerar Mapa"}
                          </button>
                      </div>
                      
                      <div className="grid gap-4">
                          {strategyPosts.map((item, index) => (
                              <div key={item.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center gap-4 hover:border-indigo-200 hover:shadow-md transition-all">
                                  <div className="w-16 h-16 shrink-0 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl">
                                      {index + 1}
                                  </div>
                                  <div className="flex-1">
                                      <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                                      <p className="text-sm text-slate-500 mb-3">{item.metaDescription}</p>
                                      <div className="flex flex-wrap gap-2">
                                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-600">
                                              🔍 {item.targetKeyword || "Keywords"}
                                          </span>
                                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">
                                              📅 Para {item.scheduledFor?.toLocaleDateString()}
                                          </span>
                                      </div>
                                  </div>
                                  <div className="shrink-0">
                                      <button className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">
                                          Empezar a Escribir →
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}
