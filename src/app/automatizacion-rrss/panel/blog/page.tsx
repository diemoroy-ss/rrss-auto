"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, getDocs, doc, getDoc, query, updateDoc, where } from "firebase/firestore";
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
  const [activeTab, setActiveTab] = useState<'articulos' | 'calendario' | 'integracion'>('articulos');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  
  const [user, setUser] = useState<any>(null);
  const [businessType, setBusinessType] = useState("");
  
  const [blogLimit, setBlogLimit] = useState(0);
  const [blogUsage, setBlogUsage] = useState(0);

  // Config Modal State
  const [showConfig, setShowConfig] = useState(false);
  const [tone, setTone] = useState("Profesional y cercano");
  const [audience, setAudience] = useState("");
  const [keywords, setKeywords] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);

  // Integration State
  const [integrationType, setIntegrationType] = useState<'wordpress' | 'webhook'>('wordpress');
  const [wpUrl, setWpUrl] = useState("");
  const [wpUser, setWpUser] = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookPlatform, setWebhookPlatform] = useState("shopify");
  
  // Strategy State
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

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
          // Check Plan limits
          let limit = 0;
          try {
              const plansDoc = await getDoc(doc(db, "system_config", "plans"));
              if (plansDoc.exists()) {
                  const plansConfig = plansDoc.data() as any;
                  const planId = data.plan || 'free';
                  limit = plansConfig[planId]?.seoBlogsLimit || 0;
              }
          } catch(e) {}
          
          if (limit === 0 && data.role !== 'admin') {
             router.push("/automatizacion-rrss/panel/planes");
             return;
          }
          setBlogLimit(limit);

          // Get Usage
          const firstDay = new Date();
          firstDay.setDate(1);
          firstDay.setHours(0,0,0,0);
          try {
             const usageSnap = await getDocs(query(collection(db, "ai_generations"), 
                 where("userId", "==", u.uid), 
                 where("type", "==", "blog")
             ));
             let used = 0;
             usageSnap.docs.forEach(doc => {
                 const dt = doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date();
                 if (dt >= firstDay) used++;
             });
             setBlogUsage(used);
          } catch (e) {}

          setBusinessType(data.rubro || "");
          if (data.seoConfig) {
              setTone(data.seoConfig.tone || "Profesional y cercano");
              setAudience(data.seoConfig.audience || "");
              setKeywords(data.seoConfig.keywords || "");
              if (data.seoConfig.integrationType) setIntegrationType(data.seoConfig.integrationType);
              if (data.seoConfig.wpUrl) setWpUrl(data.seoConfig.wpUrl);
              if (data.seoConfig.wpUser) setWpUser(data.seoConfig.wpUser);
              if (data.seoConfig.wpPassword) setWpPassword(data.seoConfig.wpPassword);
              if (data.seoConfig.webhookUrl) setWebhookUrl(data.seoConfig.webhookUrl);
              if (data.seoConfig.webhookPlatform) setWebhookPlatform(data.seoConfig.webhookPlatform);
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
              seoConfig: { 
                  tone, audience, keywords, 
                  integrationType, wpUrl, wpUser, wpPassword, webhookUrl, webhookPlatform 
              }
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

  const handleScrapeWebsite = async () => {
      if (!scrapeUrl) {
          showToast("❌ Ingresa la URL de tu sitio web primero");
          return;
      }
      setScraping(true);
      try {
          const response = await fetch('/api/ai/scrape-seo-brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: scrapeUrl })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          
          if (result.data) {
              setTone(result.data.tone || tone);
              setAudience(result.data.audience || audience);
              setKeywords(result.data.keywords || keywords);
              showToast("✨ ¡Campos rellenados con éxito!");
          }
      } catch (error: any) {
          console.error(error);
          showToast("❌ Error al analizar la web: " + error.message);
      } finally {
          setScraping(false);
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

  const handlePublish = async (postId: string) => {
      setPublishingId(postId);
      try {
          const response = await fetch('/api/ai/seo-publish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.uid, postId })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          
          await fetchPosts();
          showToast("✅ " + data.message);
      } catch (error: any) {
          console.error(error);
          showToast("❌ Error: " + error.message);
      } finally {
          setPublishingId(null);
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
                      {/* Varita Magica */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100">
                          <label className="block text-xs font-bold text-indigo-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                              🪄 Auto-Completar con IA
                          </label>
                          <p className="text-xs text-slate-600 mb-3 font-medium">Ingresa la URL de tu sitio web y la IA extraerá el tono y keywords ideales.</p>
                          <div className="flex gap-2">
                              <input type="text" value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} placeholder="https://miempresa.com" className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                              <button onClick={handleScrapeWebsite} disabled={scraping} className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/20 text-sm">
                                  {scraping ? "Analizando..." : "Analizar Web"}
                              </button>
                          </div>
                      </div>
                      <div className="w-full h-px bg-slate-100 my-2"></div>
                      
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
          <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Cuota Mensual:</span>
              <div className="bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-1 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${blogUsage >= blogLimit && blogLimit < 999999 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                  <span className="text-sm font-bold text-slate-700">
                      {blogUsage} / {blogLimit >= 999999 ? '∞' : blogLimit} Blogs
                  </span>
              </div>
          </div>
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
        <button 
           onClick={() => setActiveTab('integracion')}
           className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'integracion' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            🔌 Integraciones
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
                                 <div className="flex items-center gap-2 shrink-0">
                                     <button className="text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg transition-colors">
                                         Ver
                                     </button>
                                     <button 
                                         onClick={() => handlePublish(post.id)}
                                         disabled={publishingId === post.id}
                                         className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                     >
                                         {publishingId === post.id ? "..." : "Publicar 🌐"}
                                     </button>
                                 </div>
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
                      <button onClick={handleGenerateStrategy} disabled={generatingStrategy || (blogUsage >= blogLimit && blogLimit < 999999)} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-3 hover:-translate-y-1">
                          {generatingStrategy ? (
                              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> Analizando nicho...</>
                          ) : (
                              <>✨ Generar Estrategia SEO del Mes {(blogUsage >= blogLimit && blogLimit < 999999) && " (Límite Alcanzado)"}</>
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
                                      <button disabled={blogUsage >= blogLimit && blogLimit < 999999} className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">
                                          {(blogUsage >= blogLimit && blogLimit < 999999) ? "Límite Excedido 🔒" : "Empezar a Escribir →"}
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'integracion' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10 max-w-3xl">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-2">🔌 Integración de Auto-Publicación</h2>
              <p className="text-slate-500 font-medium mb-8">Conecta tu sitio web para que Santisoft publique los artículos generados automáticamente como borradores (o directamente en vivo).</p>

              <div className="space-y-6">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tipo de Conexión</label>
                      <div className="flex gap-4">
                          <button onClick={() => setIntegrationType('wordpress')} className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 transition-all ${integrationType === 'wordpress' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                              WordPress
                          </button>
                          <button onClick={() => setIntegrationType('webhook')} className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 transition-all ${integrationType === 'webhook' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                              Webhook (Make/Zapier)
                          </button>
                      </div>
                  </div>

                  {integrationType === 'wordpress' && (
                      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">URL del Sitio Web</label>
                              <input type="text" value={wpUrl} onChange={e => setWpUrl(e.target.value)} placeholder="https://misitio.cl" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Usuario WP</label>
                                  <input type="text" value={wpUser} onChange={e => setWpUser(e.target.value)} placeholder="admin" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contraseña de Aplicación</label>
                                  <input type="password" value={wpPassword} onChange={e => setWpPassword(e.target.value)} placeholder="**** **** **** ****" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                              </div>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">Debes generar una Contraseña de Aplicación en tu panel de WordPress (Usuarios > Perfil).</p>
                      </div>
                  )}

                  {integrationType === 'webhook' && (
                      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">URL del Webhook</label>
                              <input type="text" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://hook.make.com/..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Plataforma de Destino</label>
                              <select value={webhookPlatform} onChange={e => setWebhookPlatform(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                                  <option value="shopify">Shopify</option>
                                  <option value="wix">Wix</option>
                                  <option value="webflow">Webflow</option>
                                  <option value="custom">Otra (HTTP Request custom)</option>
                              </select>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">Enviaremos un POST JSON con los campos: <code>title, htmlContent, metaDescription, keyword, platform</code> cuando presiones Publicar.</p>
                      </div>
                  )}

                  <button onClick={handleSaveConfig} disabled={savingConfig} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 px-8 rounded-xl transition-all">
                      {savingConfig ? "Guardando..." : "Guardar Integración"}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
