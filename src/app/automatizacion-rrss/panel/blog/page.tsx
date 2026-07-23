"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, getDocs, doc, getDoc, query, updateDoc, where, deleteDoc } from "firebase/firestore";
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
  const [scrapedUrl, setScrapedUrl] = useState("");

  // Integration State
  const [integrationType, setIntegrationType] = useState<'wordpress' | 'webhook' | 'api_feed'>('api_feed');
  const [wpUrl, setWpUrl] = useState("");
  const [wpUser, setWpUser] = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookPlatform, setWebhookPlatform] = useState("shopify");
  const [webhookStoreUrl, setWebhookStoreUrl] = useState("");
  const [webhookApiKey, setWebhookApiKey] = useState("");

  // API Feed / SDK Key Management
  const [apiKeys, setApiKeys] = useState<{keyPreview: string; keyFull: string}[]>([]);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeSnippet, setActiveSnippet] = useState<'nextjs' | 'rest' | 'php'>('nextjs');

  
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

  const fetchApiKeys = async (currentUser: any) => {
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/blog-feed/keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch (e) {
      console.error('Error fetching API keys:', e);
    }
  };

  const handleGenerateKey = async () => {
    if (!user) return;
    setGeneratingKey(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/blog-feed/keys', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewlyGeneratedKey(data.key);
      await fetchApiKeys(user);
      showToast('✅ API Key generada. ¡Cópiala ahora!');
    } catch (e: any) {
      showToast('❌ ' + e.message);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (key: string) => {
    if (!user || !confirm('¿Revocar esta API Key? Los sitios que la usen dejarán de funcionar.')) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/blog-feed/keys', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchApiKeys(user);
      if (newlyGeneratedKey === key) setNewlyGeneratedKey(null);
      showToast('🗑️ API Key revocada');
    } catch (e: any) {
      showToast('❌ ' + e.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    });
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
              if (data.seoConfig.webhookStoreUrl) setWebhookStoreUrl(data.seoConfig.webhookStoreUrl);
              if (data.seoConfig.webhookApiKey) setWebhookApiKey(data.seoConfig.webhookApiKey);
              if (data.seoConfig.scrapedUrl) setScrapedUrl(data.seoConfig.scrapedUrl);
          }
        }
        await fetchPosts();
        await fetchApiKeys(u);
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
                  integrationType, wpUrl, wpUser, wpPassword, webhookUrl, webhookPlatform,
                  webhookStoreUrl, webhookApiKey, scrapedUrl
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
              setScrapedUrl(scrapeUrl);
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
                  keywords,
                  limit: blogLimit
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

  const handleDeletePost = async (postId: string) => {
      if (!confirm("¿Estás seguro de que quieres eliminar esta idea del mapa de contenidos?")) return;
      try {
          await deleteDoc(doc(db, "blog_posts", postId));
          await fetchPosts();
          showToast("🗑️ Contenido eliminado");
      } catch (error: any) {
          console.error("Error deleting post:", error);
          showToast("❌ Error al eliminar");
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
                          {scrapedUrl && (
                              <div className="mt-3 inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Sitio Analizado: {scrapedUrl}
                              </div>
                          )}
                      </div>
                      <div className="w-full h-px bg-slate-100 my-2"></div>
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tono de Voz</label>
                          <textarea rows={5} value={tone} onChange={e => setTone(e.target.value)} placeholder="Ej: Profesional, cercano, divertido..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Público Objetivo</label>
                          <textarea rows={5} value={audience} onChange={e => setAudience(e.target.value)} placeholder="Ej: Emprendedores de 25 a 40 años" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Palabras Clave (Opcional)</label>
                          <textarea rows={5} value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Ej: automatización, ventas, marketing" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" />
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
                                  <div className="shrink-0 flex gap-2">
                                      <button disabled={blogUsage >= blogLimit && blogLimit < 999999} className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all">
                                          {(blogUsage >= blogLimit && blogLimit < 999999) ? "Límite Excedido 🔒" : "Empezar a Escribir →"}
                                      </button>
                                      <button onClick={() => handleDeletePost(item.id)} className="w-full md:w-auto bg-rose-50 hover:bg-rose-100 text-rose-500 text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-rose-200">
                                          🗑️
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
          <div className="space-y-8 max-w-4xl">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-2">🔌 Integraciones de Publicación</h2>
              <p className="text-slate-500 font-medium">Conecta tu sitio web para que Santisoft publique los artículos automáticamente. Elige el método según tu tecnología.</p>
            </div>

            {/* Method selector cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => { setIntegrationType('api_feed'); handleSaveConfig(); }}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all ${integrationType === 'api_feed' ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                {integrationType === 'api_feed' && <span className="absolute top-3 right-3 text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">ACTIVO</span>}
                <div className="text-2xl mb-3">🌐</div>
                <h3 className="font-black text-slate-900 text-sm mb-1">API Feed / SDK</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Para React, Next.js, Vue, Astro, PHP, Laravel — cualquier framework. Jala los artículos directamente.</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {['Next.js', 'React', 'Vue', 'Astro', 'PHP'].map(t => (
                    <span key={t} className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </button>

              <button
                onClick={() => setIntegrationType('wordpress')}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all ${integrationType === 'wordpress' ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                {integrationType === 'wordpress' && <span className="absolute top-3 right-3 text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">ACTIVO</span>}
                <div className="text-2xl mb-3">🔵</div>
                <h3 className="font-black text-slate-900 text-sm mb-1">WordPress</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Santisoft empuja el artículo como borrador en tu WP vía REST API con tu contraseña de aplicación.</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {['WordPress.com', 'WP Self-hosted'].map(t => (
                    <span key={t} className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </button>

              <button
                onClick={() => setIntegrationType('webhook')}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all ${integrationType === 'webhook' ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                {integrationType === 'webhook' && <span className="absolute top-3 right-3 text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">ACTIVO</span>}
                <div className="text-2xl mb-3">⚡</div>
                <h3 className="font-black text-slate-900 text-sm mb-1">Webhook / CMS</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Motor n8n centralizado de Santisoft. Enruta automáticamente a tu plataforma CMS de destino.</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {['Shopify', 'Wix', 'Webflow', 'Custom'].map(t => (
                    <span key={t} className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </button>
            </div>

            {/* ─── API FEED CONFIG ─── */}
            {integrationType === 'api_feed' && (
              <div className="space-y-6">
                {/* API Keys section */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-black text-base flex items-center gap-2">🔑 Tus API Keys</h3>
                      <p className="text-slate-400 text-xs font-medium mt-0.5">Úsalas en el header <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300">x-api-key</code> de tu sitio web.</p>
                    </div>
                    <button
                      onClick={handleGenerateKey}
                      disabled={generatingKey || apiKeys.length >= 5}
                      className="shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all"
                    >
                      {generatingKey ? 'Generando...' : '+ Nueva Key'}
                    </button>
                  </div>

                  {newlyGeneratedKey && (
                    <div className="mb-4 bg-amber-500/20 border border-amber-400/30 rounded-xl p-4">
                      <p className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-2">⚠️ Cópiala ahora — no volverá a mostrarse completa</p>
                      <div className="flex items-center gap-3 bg-black/30 rounded-lg px-4 py-3">
                        <code className="flex-1 text-emerald-400 text-xs font-mono break-all">{newlyGeneratedKey}</code>
                        <button
                          onClick={() => copyToClipboard(newlyGeneratedKey)}
                          className="shrink-0 bg-white/10 hover:bg-white/20 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all"
                        >
                          {copiedKey ? '✅ Copiada' : '📋 Copiar'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {apiKeys.length === 0 ? (
                      <p className="text-slate-500 text-xs font-medium text-center py-4">No tienes API Keys generadas. Crea tu primera key.</p>
                    ) : (
                      apiKeys.map((k, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                          <code className="text-slate-300 text-xs font-mono">{k.keyPreview}</code>
                          <button
                            onClick={() => handleRevokeKey(k.keyFull)}
                            className="text-rose-400 hover:text-rose-300 text-xs font-bold px-3 py-1 rounded-lg hover:bg-rose-400/10 transition-all"
                          >
                            Revocar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Code snippets */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="flex border-b border-slate-200">
                    {[
                      { id: 'nextjs', label: '⚛️ Next.js / React' },
                      { id: 'rest', label: '🌐 REST / curl' },
                      { id: 'php', label: '🐘 PHP / Laravel' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSnippet(tab.id as any)}
                        className={`flex-1 py-3 text-xs font-bold transition-all ${activeSnippet === tab.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-950 p-6 overflow-x-auto">
                    {activeSnippet === 'nextjs' && (
                      <pre className="text-xs font-mono text-slate-300 whitespace-pre leading-6">{`// app/blog/page.tsx  (Next.js App Router — SSR/ISR)
// Instala: npm install   (no se requiere librería adicional)

export default async function BlogPage() {
  const res = await fetch('https://rrss.santisoft.cl/api/blog-feed', {
    headers: { 'x-api-key': process.env.SANTISOFT_API_KEY! },
    next: { revalidate: 3600 } // Revalida cada hora automáticamente
  });
  const { posts } = await res.json();

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <img src={post.imageUrl} alt={post.title} />
          <p>{post.excerpt}</p>
          <a href={\`/blog/\${post.slug}\`}>Leer →</a>
        </article>
      ))}
    </div>
  );
}

// app/blog/[slug]/page.tsx  (artículo individual)
export default async function PostPage({ params }) {
  const res = await fetch(
    \`https://rrss.santisoft.cl/api/blog-feed?slug=\${params.slug}\`,
    { headers: { 'x-api-key': process.env.SANTISOFT_API_KEY! } }
  );
  const { post } = await res.json();
  return <div dangerouslySetInnerHTML={{ __html: post.htmlContent }} />;
}

// .env.local
SANTISOFT_API_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`}
                      </pre>
                    )}

                    {activeSnippet === 'rest' && (
                      <pre className="text-xs font-mono text-slate-300 whitespace-pre leading-6">{`# GET lista de artículos
curl https://rrss.santisoft.cl/api/blog-feed \\
  -H "x-api-key: sk_live_XXXXXXXXXX"

# GET artículo por slug
curl "https://rrss.santisoft.cl/api/blog-feed?slug=mi-articulo" \\
  -H "x-api-key: sk_live_XXXXXXXXXX"

# GET con límite y query param (alternativa al header)
curl "https://rrss.santisoft.cl/api/blog-feed?apiKey=sk_live_XXXXXXXXXX&limit=5"

# Respuesta
{
  "posts": [
    {
      "id": "abc123",
      "title": "Título del artículo",
      "slug": "titulo-del-articulo",
      "excerpt": "Descripción corta...",
      "htmlContent": "<article>...</article>",
      "imageUrl": "https://...",
      "seoTitle": "Título SEO optimizado",
      "metaDescription": "Meta descripción...",
      "keywords": ["seo", "marketing"],
      "schema": { "@context": "https://schema.org", ... },
      "publishedAt": "2026-07-23T20:00:00Z"
    }
  ],
  "total": 1
}`}
                      </pre>
                    )}

                    {activeSnippet === 'php' && (
                      <pre className="text-xs font-mono text-slate-300 whitespace-pre leading-6">{`<?php
// PHP nativo
$apiKey = $_ENV['SANTISOFT_API_KEY'];
$ch = curl_init('https://rrss.santisoft.cl/api/blog-feed');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["x-api-key: $apiKey"]);
$response = curl_exec($ch);
$data = json_decode($response, true);
$posts = $data['posts'];

foreach ($posts as $post) {
    echo "<h2>{$post['title']}</h2>";
    echo "<p>{$post['excerpt']}</p>";
}

// Laravel / Guzzle
use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
    'x-api-key' => config('services.santisoft.api_key'),
])->get('https://rrss.santisoft.cl/api/blog-feed');

$posts = $response->json('posts');`}
                      </pre>
                    )}
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-4">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="font-bold text-indigo-900 text-sm">¿Qué ocurre cuando publicas un artículo?</p>
                    <p className="text-indigo-700 text-xs font-medium mt-1 leading-relaxed">Al pulsar "Publicar" en la pestaña Artículos, el contenido queda disponible inmediatamente en <code className="bg-indigo-100 px-1 rounded">/api/blog-feed</code>. Tu sitio web lo mostrará en el próximo ciclo de revalidación (normalmente 1 hora).</p>
                  </div>
                </div>

                <button onClick={handleSaveConfig} disabled={savingConfig} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 px-8 rounded-xl transition-all">
                  {savingConfig ? "Guardando..." : "Guardar como método activo"}
                </button>
              </div>
            )}

            {/* ─── WORDPRESS CONFIG ─── */}
            {integrationType === 'wordpress' && (
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm font-medium text-blue-800 flex gap-3">
                  <span className="text-xl">📋</span>
                  <span>Ve a WordPress → Usuarios → Tu perfil → desplázate hasta <strong>Contraseñas de Aplicación</strong>, crea una nueva y pégala aquí.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">URL del Sitio WordPress</label>
                  <input type="text" value={wpUrl} onChange={e => setWpUrl(e.target.value)} placeholder="https://misitio.cl" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Usuario WP</label>
                    <input type="text" value={wpUser} onChange={e => setWpUser(e.target.value)} placeholder="admin" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contraseña de Aplicación</label>
                    <input type="password" value={wpPassword} onChange={e => setWpPassword(e.target.value)} placeholder="xxxx xxxx xxxx xxxx" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                </div>
                <button onClick={handleSaveConfig} disabled={savingConfig} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 px-8 rounded-xl transition-all">
                  {savingConfig ? "Guardando..." : "Guardar Integración WordPress"}
                </button>
              </div>
            )}

            {/* ─── WEBHOOK CONFIG ─── */}
            {integrationType === 'webhook' && (
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="bg-indigo-100 text-indigo-800 p-4 rounded-xl text-sm font-medium flex gap-3">
                  <span className="text-xl">🤖</span>
                  <span>Nuestro motor n8n centralizado recibe el artículo y lo envía a tu plataforma. Solo elige el destino y pega tus credenciales.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Plataforma de Destino</label>
                  <select value={webhookPlatform} onChange={e => setWebhookPlatform(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                    <option value="shopify">Shopify</option>
                    <option value="wix">Wix</option>
                    <option value="webflow">Webflow</option>
                    <option value="custom">Otra / HTTP Custom</option>
                  </select>
                </div>
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">URL de la Tienda / Sitio</label>
                    <input type="text" value={webhookStoreUrl} onChange={e => setWebhookStoreUrl(e.target.value)} placeholder={`Ej: mitienda.${webhookPlatform}.com`} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Token de Acceso / API Key</label>
                    <input type="password" value={webhookApiKey} onChange={e => setWebhookApiKey(e.target.value)} placeholder="Token de la plataforma" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                </div>
                <button onClick={handleSaveConfig} disabled={savingConfig} className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 px-8 rounded-xl transition-all">
                  {savingConfig ? "Guardando..." : "Guardar Integración Webhook"}
                </button>
              </div>
            )}
          </div>
      )}
    </div>
  );
}

