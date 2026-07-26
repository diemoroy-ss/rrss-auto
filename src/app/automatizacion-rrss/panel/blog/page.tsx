"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, getDocs, doc, getDoc, query, updateDoc, where, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface BlogPost {
  id: string;
  title: string;
  status: string; // 'published' | 'draft' | 'pending' | 'strategy' | 'strategy_draft'
  scheduledFor?: Date;
  createdAt: Date;
  metaDescription?: string;
  targetKeyword?: string;
  content?: string;
  htmlContent?: string;
  imageUrl?: string;
  slug?: string;
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
  const [apiKeyLastUsedAt, setApiKeyLastUsedAt] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  
  // Strategy State
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const [writingModalPost, setWritingModalPost] = useState<{ postId: string; title: string } | null>(null);
  // Visual Calendar State (Unified Blog + Social)
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [showStrategyList, setShowStrategyList] = useState(false);
  const [shareModalPost, setShareModalPost] = useState<{ title: string; slug: string; metaDescription: string } | null>(null);
  const [previewModalPost, setPreviewModalPost] = useState<BlogPost | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(""), 3500);
  };

  const parseDateField = (val: any): Date | undefined => {
      if (!val) return undefined;
      if (typeof val.toDate === 'function') return val.toDate();
      if (val.seconds) return new Date(val.seconds * 1000);
      if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
  };

  const fetchSocialPosts = async (uid: string) => {
      try {
          const q = query(collection(db, "social_posts"), where("userId", "==", uid));
          const snap = await getDocs(q);
          const fetched: any[] = [];
          snap.forEach(docSnap => {
              const d = docSnap.data();
              fetched.push({
                  id: docSnap.id,
                  title: d.idea || d.copy || "Post de Redes",
                  type: d.type || "Post",
                  scheduledFor: parseDateField(d.scheduledFor),
                  status: d.status
              });
          });
          setSocialPosts(fetched);
      } catch (e) {
          console.error("Error fetching social posts for unified calendar:", e);
      }
  };

  const checkAndAutoPublishPending = async () => {
    try {
      const res = await fetch('/api/cron/auto-publish', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.processedCount && data.processedCount > 0) {
          const q = query(collection(db, "blog_posts")); 
          const snap = await getDocs(q);
          const fetchedPosts: BlogPost[] = [];
          snap.forEach(docSnap => {
              const pd = docSnap.data();
              const scheduledFor = parseDateField(pd.scheduledFor);
              const createdAt = parseDateField(pd.createdAt) || new Date();
              fetchedPosts.push({
                  id: docSnap.id,
                  title: pd.title || "Sin título",
                  status: pd.status || "draft",
                  scheduledFor,
                  createdAt,
                  metaDescription: pd.metaDescription || "",
                  targetKeyword: pd.targetKeyword || "",
                  content: pd.content || "",
                  htmlContent: pd.htmlContent || "",
                  imageUrl: pd.imageUrl || "",
                  slug: pd.slug || ""
              });
          });
          fetchedPosts.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
          setPosts(fetchedPosts);
        }
      }
    } catch (e) {
      console.error("Auto-publish trigger error:", e);
    }
  };

  const fetchPosts = async () => {
      const q = query(collection(db, "blog_posts")); 
      const snap = await getDocs(q);
      const fetchedPosts: BlogPost[] = [];
      snap.forEach(docSnap => {
          const pd = docSnap.data();
          const scheduledFor = parseDateField(pd.scheduledFor);
          const createdAt = parseDateField(pd.createdAt) || new Date();
          fetchedPosts.push({
              id: docSnap.id,
              title: pd.title || "Sin título",
              status: pd.status || "draft",
              scheduledFor,
              createdAt,
              metaDescription: pd.metaDescription || "",
              targetKeyword: pd.targetKeyword || "",
              content: pd.content || "",
              htmlContent: pd.htmlContent || "",
              imageUrl: pd.imageUrl || "",
              slug: pd.slug || ""
          });
      });
      
      fetchedPosts.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
      setPosts(fetchedPosts);
      checkAndAutoPublishPending();
  };

  const handleGeneratePostImage = async (postId: string) => {
      setGeneratingImageId(postId);
      try {
          const res = await fetch('/api/ai/seo-generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ postId })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          await fetchPosts();
          if (previewModalPost && previewModalPost.id === postId) {
              setPreviewModalPost(prev => prev ? { 
                  ...prev, 
                  imageUrl: data.imageUrl, 
                  htmlContent: data.imageUrl 
                    ? `<div class="my-6"><img src="${data.imageUrl}" alt="${prev.title}" class="w-full rounded-2xl shadow-lg object-cover max-h-[480px]" /></div>\n` + (prev.htmlContent || prev.content || '') 
                    : prev.htmlContent 
              } : null);
          }
          showToast("🎨 " + data.message);
      } catch (err: any) {
          console.error("Error generating image:", err);
          showToast("❌ Error al generar imagen: " + err.message);
      } finally {
          setGeneratingImageId(null);
      }
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
        if (data.lastUsedAt) setApiKeyLastUsedAt(data.lastUsedAt);
      }
    } catch (e) {
      console.error('Error fetching API keys:', e);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKeys.length) {
      setConnectionTestResult({ success: false, message: 'Primero genera una API Key.' });
      return;
    }
    setTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const targetKey = newlyGeneratedKey || apiKeys[0]?.keyFull;
      const res = await fetch(`/api/blog-feed?apiKey=${encodeURIComponent(targetKey)}`);
      const data = await res.json();
      if (res.ok) {
        setConnectionTestResult({
          success: true,
          message: `¡Conexión comprobada con éxito! El API Feed está activo y funcionando.`,
          count: data.posts?.length || 0
        });
        if (user) fetchApiKeys(user);
      } else {
        setConnectionTestResult({
          success: false,
          message: data.error || 'No se pudo conectar al API Feed.'
        });
      }
    } catch (e: any) {
      setConnectionTestResult({
        success: false,
        message: 'Error de red: ' + e.message
      });
    } finally {
      setTestingConnection(false);
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
          // Check Plan limits (Admin users & spalezcom@gmail.com have unlimited)
          const isAdminUser = data.role === 'admin' || u.email === 'spalezcom@gmail.com' || u.email === 'diemoroy@gmail.com' || u.email === 'santisoftai@gmail.com';
          let limit = 0;

          if (isAdminUser) {
            limit = 999999;
          } else {
            try {
                const plansDoc = await getDoc(doc(db, "system_config", "plans"));
                if (plansDoc.exists()) {
                    const plansConfig = plansDoc.data() as any;
                    const planId = data.plan || 'free';
                    limit = plansConfig[planId]?.seoBlogsLimit || 0;
                }
            } catch(e) {}
            
            if (limit === 0) {
               router.push("/automatizacion-rrss/panel/planes");
               return;
            }
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
        await fetchSocialPosts(u.uid);
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

  const handleStartWriting = async (postId: string, action: 'publish_now' | 'keep_schedule' = 'publish_now') => {
      if (!user) return;
      setPublishingId(postId);
      setWritingModalPost(null);
      try {
          const response = await fetch('/api/ai/seo-write-now', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.uid, postId, action })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);

          await fetchPosts();
          showToast("✨ " + data.message);
      } catch (error: any) {
          console.error("Error writing post:", error);
          showToast("❌ Error: " + error.message);
      } finally {
          setPublishingId(null);
      }
  };

  const handleUpdatePostDateTime = async (postId: string, newDateString: string, newTimeString: string = '09:00') => {
      if (!newDateString) return;
      try {
          const [year, month, day] = newDateString.split('-').map(Number);
          const [hours, minutes] = (newTimeString || '09:00').split(':').map(Number);
          const updatedDate = new Date(year, month - 1, day, hours || 9, minutes || 0, 0);
          
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, scheduledFor: updatedDate } : p));

          await updateDoc(doc(db, "blog_posts", postId), {
              scheduledFor: updatedDate
          });
      } catch (error: any) {
          console.error("Error updating date:", error);
          showToast("❌ Error al actualizar fecha y hora");
      }
  };

  if (loading) {
     return <div className="animate-pulse space-y-4 max-w-2xl"><div className="h-10 bg-slate-200 rounded w-1/3"></div><div className="h-64 bg-slate-200 rounded"></div></div>;
  }

  const publishedPosts = posts.filter(p => p.status === 'published');
  const draftPosts = posts
    .filter(p => p.status === 'draft' || p.status === 'strategy_draft' || (p.status === 'strategy' && p.scheduledFor))
    .sort((a, b) => {
      const timeA = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
      const timeB = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
      return timeA - timeB;
    });
  const strategyPosts = posts
    .filter(p => p.status === 'strategy' || p.status === 'strategy_draft')
    .sort((a, b) => {
      const timeA = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
      const timeB = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
      return timeA - timeB;
    });

  const filteredStrategyPosts = strategyPosts.filter(p => {
    if (!selectedCalendarDate) return true;
    return p.scheduledFor && isSameDay(p.scheduledFor, selectedCalendarDate);
  });

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
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a href="/blog" target="_blank" className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 hover:shadow-md text-sm">
              🌐 Ver Blog Público
          </a>
          <button onClick={() => setShowConfig(true)} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 hover:shadow-md text-sm">
              ⚙️ Configurar Sitio Web
          </button>
        </div>
      </div>

      {/* ─── RESUMEN DE ESTADO DE LA APLICACIÓN Y SITIO CONFIGURADO ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* 1. Cuota Mensual */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shrink-0 font-bold">
            📊
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cuota Mensual</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${blogUsage >= blogLimit && blogLimit < 999999 ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
              <p className="text-lg font-black text-slate-900">
                {blogUsage} / {blogLimit >= 999999 ? '∞' : blogLimit} <span className="text-xs font-semibold text-slate-400">Blogs</span>
              </p>
            </div>
          </div>
        </div>

        {/* 2. Calendarizado */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${strategyPosts.length > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            📅
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calendarizado</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${strategyPosts.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {strategyPosts.length > 0 ? 'OK' : 'No'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {strategyPosts.length > 0 ? `${strategyPosts.length} post(s)` : 'Sin calendarizar'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Integración */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${(Boolean(apiKeyLastUsedAt) || apiKeys.length > 0 || Boolean(connectionTestResult?.success) || Boolean(wpUrl && wpUser) || Boolean(webhookStoreUrl)) ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            🔌
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Integrado</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${(Boolean(apiKeyLastUsedAt) || apiKeys.length > 0 || Boolean(connectionTestResult?.success) || Boolean(wpUrl && wpUser) || Boolean(webhookStoreUrl)) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {(Boolean(apiKeyLastUsedAt) || apiKeys.length > 0 || Boolean(connectionTestResult?.success) || Boolean(wpUrl && wpUser) || Boolean(webhookStoreUrl)) ? 'OK' : 'Pendiente'}
              </span>
              <span className="text-xs text-slate-500 font-bold capitalize">
                {integrationType === 'api_feed' ? 'API Feed' : integrationType === 'wordpress' ? 'WordPress' : 'Webhook'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Sitio Web Configurado */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 min-w-0">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${(scrapedUrl || wpUrl || webhookStoreUrl || businessType) ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
            🌐
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sitio Web Configurado</p>
            <div className="flex items-center gap-2 mt-1">
              {(scrapedUrl || wpUrl || webhookStoreUrl || businessType) ? (
                <>
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">OK</span>
                  <span className="text-xs font-bold text-slate-800 truncate" title={scrapedUrl || wpUrl || webhookStoreUrl || businessType}>
                    {(scrapedUrl || wpUrl || webhookStoreUrl || businessType).replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400 font-medium italic">Sin configurar</span>
              )}
            </div>
          </div>
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
                     Agendados (Ideas y Borradores)
                 </h2>
                 
                 {draftPosts.length === 0 ? (
                     <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                         No hay artículos agendados ni borradores pendientes.
                     </div>
                 ) : (
                     <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                         {draftPosts.map(post => {
                              const displayDateStr = post.scheduledFor 
                                ? `📅 Agendado: ${post.scheduledFor.toLocaleDateString()} a las ${String(post.scheduledFor.getHours()).padStart(2, '0')}:${String(post.scheduledFor.getMinutes()).padStart(2, '0')} hrs` 
                                : `Generado: ${post.createdAt ? post.createdAt.toLocaleDateString() : 'Recientemente'}`;

                              return (
                                  <div key={post.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors flex items-center justify-between gap-4">
                                      <div>
                                          <h4 className="font-bold text-slate-800 line-clamp-1">{post.title}</h4>
                                          <p className="text-xs text-slate-500 font-medium mt-1">{displayDateStr}</p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                          {post.status === 'strategy' ? (
                                              <button 
                                                  onClick={() => setWritingModalPost({ postId: post.id, title: post.title })}
                                                  className="text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                              >
                                                  ✍️ Escribir
                                              </button>
                                          ) : (
                                              <button 
                                                  onClick={() => setPreviewModalPost(post)}
                                                  className="text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                              >
                                                  👁️ Ver
                                              </button>
                                          )}
                                          <button 
                                              onClick={() => handlePublish(post.id)}
                                              disabled={publishingId === post.id || post.status === 'strategy'}
                                              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                          >
                                              {publishingId === post.id ? "..." : "Publicar 🌐"}
                                          </button>
                                      </div>
                                  </div>
                              );
                          })}
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
                     <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                         {publishedPosts.map(post => (
                              <div key={post.id} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col gap-2">
                                  <h4 className="font-bold text-slate-800 line-clamp-2">{post.title}</h4>
                                  <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                                     <div className="flex items-center gap-2">
                                         <span className="text-[10px] uppercase tracking-widest font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">En línea</span>
                                         <span className="text-xs text-slate-500 font-medium">{post.createdAt.toLocaleDateString()}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <a
                                             href={`https://santisoft.cl/es/blog/${(post as any).slug || post.id}`}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                         >
                                             👁️ Ver Artículo
                                         </a>
                                         <button
                                             onClick={() => setShareModalPost({ title: post.title, slug: (post as any).slug || post.id, metaDescription: post.metaDescription || '' })}
                                             className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                         >
                                             📢 Difundir en Redes
                                         </button>
                                     </div>
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
              {/* ─── BANNER INFORMATIVO: FUNCIONAMIENTO AUTOMÁTICO vs ANTICIPADO ─── */}
              <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-700/40 animate-in fade-in">
                  <div className="space-y-3">
                      <div className="flex items-center gap-2">
                          <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                              🤖 Modo de Funcionamiento Autopilot
                          </span>
                      </div>
                      <h3 className="text-xl font-black text-white">¿Cómo se redactan y publican tus artículos?</h3>
                      <div className="grid sm:grid-cols-2 gap-4 pt-1 text-xs text-indigo-100/90 font-medium">
                          <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                              <span className="text-2xl shrink-0">⏰</span>
                              <div>
                                  <strong className="text-white block font-bold text-sm mb-0.5">1. Publicación 100% Automática</strong>
                                  Si no haces nada, al llegar la fecha y hora agendada la IA escribirá (con doble revisión) y publicará tu artículo automáticamente en tu sitio web.
                              </div>
                          </div>
                          <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                              <span className="text-2xl shrink-0">✍️</span>
                              <div>
                                  <strong className="text-white block font-bold text-sm mb-0.5">2. Redactar con Anticipación</strong>
                                  Usa <i>"Empezar a Escribir"</i> en cualquier momento. Podrás revisar el borrador creado y elegir si **Publicar de Inmediato** o **Mantener Agendado**.
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* ─── CALENDARIO VISUAL DE PUBLICACIONES (UNIFICADO BLOG + REDES) ─── */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                              <span>📅</span> Calendario Visual de Publicaciones (Blog & Redes)
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Haz clic en cualquier día para filtrar las ideas programadas. Los artículos de blog destacan en <strong className="text-emerald-600 font-bold">verde</strong>.
                          </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                          <button
                              onClick={() => setCalendarMonth(prev => subMonths(prev, 1))}
                              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center transition-all shadow-sm active:scale-95"
                          >
                              ←
                          </button>
                          <span className="text-sm font-black text-slate-800 min-w-[130px] text-center capitalize">
                              {format(calendarMonth, "MMMM yyyy", { locale: es })}
                          </span>
                          <button
                              onClick={() => setCalendarMonth(prev => addMonths(prev, 1))}
                              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center transition-all shadow-sm active:scale-95"
                          >
                              →
                          </button>
                          
                          {selectedCalendarDate && (
                              <button
                                  onClick={() => setSelectedCalendarDate(null)}
                                  className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-all border border-indigo-200 shrink-0 shadow-sm"
                              >
                                  Ver Todos los Días
                              </button>
                          )}
                      </div>
                  </div>

                  {/* Leyenda de colores */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                          <span>🟢 Artículos de Blog</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm" />
                          <span>🔵 Post Redes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-purple-500 shadow-sm" />
                          <span>🟣 Carrusel Redes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                          <span>🟡 Story / Reel Redes</span>
                      </div>
                  </div>

                  {/* Grid Header Días de la Semana */}
                  <div className="grid grid-cols-7 gap-1 text-center font-black text-slate-400 text-[11px] uppercase tracking-wider mb-2">
                      <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
                  </div>

                  {/* Grid de Días del Mes */}
                  {(() => {
                      const monthStart = startOfMonth(calendarMonth);
                      const monthEnd = endOfMonth(monthStart);
                      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
                      const startDayIndex = getDay(monthStart);

                      return (
                          <div className="grid grid-cols-7 gap-1.5">
                              {/* Blank leading days */}
                              {Array.from({ length: startDayIndex }).map((_, i) => (
                                  <div key={`blank-${i}`} className="h-20 sm:h-24 bg-slate-50/40 rounded-2xl border border-slate-100/50" />
                              ))}

                              {/* Days of month */}
                              {daysInMonth.map(day => {
                                  const isToday = isSameDay(day, new Date());
                                  const isSelected = selectedCalendarDate && isSameDay(day, selectedCalendarDate);

                                  const blogPostsOnDay = posts.filter(p => p.scheduledFor && isSameDay(p.scheduledFor, day));
                                  const socialPostsOnDay = socialPosts.filter(sp => sp.scheduledFor && isSameDay(sp.scheduledFor, day));

                                  const hasItems = blogPostsOnDay.length > 0 || socialPostsOnDay.length > 0;

                                  return (
                                      <div
                                          key={day.toISOString()}
                                          onClick={() => {
                                              if (isSelected) {
                                                  setSelectedCalendarDate(null);
                                              } else {
                                                  setSelectedCalendarDate(day);
                                                  setShowStrategyList(true);
                                              }
                                          }}
                                          className={`h-20 sm:h-24 p-1.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between overflow-hidden ${
                                              isSelected 
                                                ? 'bg-indigo-50/90 border-indigo-500 shadow-md ring-2 ring-indigo-500/40' 
                                                : isToday 
                                                  ? 'bg-emerald-50/40 border-emerald-300 shadow-sm' 
                                                  : hasItems 
                                                    ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                                    : 'bg-white border-slate-100 hover:bg-slate-50'
                                          }`}
                                      >
                                          <div className="flex items-center justify-between shrink-0 mb-1">
                                              <span className={`text-xs font-black px-1.5 py-0.5 rounded-md ${isToday ? 'bg-emerald-500 text-white' : 'text-slate-700'}`}>
                                                  {format(day, 'd')}
                                              </span>
                                          </div>

                                          <div className="space-y-1 overflow-y-auto max-h-[50px] scrollbar-none">
                                              {/* Blog Post Badges (VERDE DESTACADO) */}
                                              {blogPostsOnDay.map(bp => (
                                                  <div
                                                      key={bp.id}
                                                      title={`📝 Blog: ${bp.title}`}
                                                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 shadow-sm transition-colors"
                                                  >
                                                      <span className="shrink-0">📝</span>
                                                      <span className="truncate">{bp.title}</span>
                                                  </div>
                                              ))}

                                              {/* Social Post Badges */}
                                              {socialPostsOnDay.map(sp => {
                                                  const t = (sp.type || '').toLowerCase();
                                                  let badgeBg = 'bg-indigo-500 text-white';
                                                  let icon = '📱';
                                                  if (t.includes('carrusel') || t.includes('carousel')) {
                                                      badgeBg = 'bg-purple-500 text-white';
                                                      icon = '🖼️';
                                                  } else if (t.includes('reel') || t.includes('video') || t.includes('stor') || t.includes('historia')) {
                                                      badgeBg = 'bg-amber-500 text-white';
                                                      icon = '🎬';
                                                  }

                                                  return (
                                                      <div
                                                          key={sp.id}
                                                          title={`📱 Redes (${sp.type}): ${sp.title}`}
                                                          className={`${badgeBg} font-bold text-[9px] px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 shadow-sm`}
                                                      >
                                                          <span className="shrink-0">{icon}</span>
                                                          <span className="truncate">{sp.title}</span>
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      );
                  })()}

                  {/* Botón Desplegable para Mostrar/Ocultar el Mapa de Contenidos */}
                  {strategyPosts.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-100">
                          <button
                              onClick={() => setShowStrategyList(prev => !prev)}
                              className="w-full bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 text-slate-800 font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-between text-sm group shadow-sm active:scale-98"
                          >
                              <div className="flex items-center gap-3">
                                  <span className="text-xl">🗺️</span>
                                  <div className="text-left">
                                      <span className="block font-black text-slate-900">
                                          {selectedCalendarDate 
                                              ? `Detalle de Ideas para el ${format(selectedCalendarDate, "d 'de' MMMM", { locale: es })} (${filteredStrategyPosts.length})` 
                                              : `Detalle del Mapa de Contenidos (${strategyPosts.length} ideas programadas)`}
                                      </span>
                                      <span className="text-xs text-slate-500 font-medium">
                                          {showStrategyList ? "Haz clic para contraer y ocultar la lista" : "Haz clic para desplegar y editar las tarjetas de contenido"}
                                      </span>
                                  </div>
                              </div>
                              <span className="text-xs font-black bg-white group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 px-4 py-2 rounded-xl border border-slate-200 group-hover:border-indigo-600 transition-all shrink-0 shadow-sm">
                                  {showStrategyList ? "🔼 Ocultar Lista" : "📋 Desplegar Lista ▾"}
                              </span>
                          </button>
                      </div>
                  )}
              </div>

              {strategyPosts.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10 min-h-[400px] flex flex-col items-center justify-center text-center">
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
              ) : showStrategyList ? (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 animate-in fade-in">
                      <div className="flex items-center justify-between mb-8">
                          <div>
                              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                🗺️ {selectedCalendarDate ? `Ideas Agendadas para ${format(selectedCalendarDate, "d 'de' MMMM", { locale: es })}` : 'Tu Mapa de Contenidos'}
                              </h2>
                              <p className="text-slate-500 font-medium mt-1">
                                {selectedCalendarDate ? `Mostrando ${filteredStrategyPosts.length} contenido(s) agendado(s) para este día.` : 'Estas son las ideas propuestas para posicionar tu sitio en Google.'}
                              </p>
                          </div>
                          <div className="flex items-center gap-2">
                              {selectedCalendarDate && (
                                <button onClick={() => setSelectedCalendarDate(null)} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 px-4 rounded-lg transition-colors border border-indigo-200">
                                    Ver Todas
                                </button>
                              )}
                              <button onClick={handleGenerateStrategy} disabled={generatingStrategy} className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors">
                                  {generatingStrategy ? "Regenerando..." : "Regenerar Mapa"}
                              </button>
                          </div>
                      </div>
                      
                      <div className="grid gap-4">
                          {filteredStrategyPosts.map((item, index) => {
                              const dObj = item.scheduledFor ? new Date(item.scheduledFor) : new Date();
                              const dateStr = dObj.toISOString().split('T')[0];
                              const hoursStr = String(dObj.getHours()).padStart(2, '0');
                              const minsStr = String(dObj.getMinutes()).padStart(2, '0');
                              const timeStr = `${hoursStr}:${minsStr}`;

                              return (
                                  <div key={item.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center gap-4 hover:border-indigo-200 hover:shadow-md transition-all">
                                      <div className="w-16 h-16 shrink-0 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl">
                                          {index + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                                          <p className="text-sm text-slate-500 mb-3">{item.metaDescription}</p>
                                          <div className="flex flex-wrap items-center gap-2">
                                              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600">
                                                  🔍 {item.targetKeyword || "Keywords"}
                                              </span>

                                              {(item.status === 'strategy_draft' || item.content || item.htmlContent) && (
                                                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg border border-indigo-200">
                                                      ✍️ Redactado (Listo)
                                                  </span>
                                              )}
                                              
                                              {/* Editable Date & Time Selector */}
                                              <div className="flex flex-wrap items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] font-bold px-3 py-1 rounded-xl shadow-sm">
                                                  <span>📅 Agendado:</span>
                                                  <input
                                                      type="date"
                                                      value={dateStr}
                                                      onChange={(e) => handleUpdatePostDateTime(item.id, e.target.value, timeStr)}
                                                      className="bg-white border border-emerald-300 text-emerald-950 font-bold px-2 py-0.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                                                  />
                                                  <span>a las</span>
                                                  <input
                                                      type="time"
                                                      value={timeStr}
                                                      onChange={(e) => handleUpdatePostDateTime(item.id, dateStr, e.target.value)}
                                                      className="bg-white border border-emerald-300 text-emerald-950 font-bold px-2 py-0.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
                                                  />
                                                  <span>hrs</span>
                                              </div>
                                          </div>
                                      </div>
                                      <div className="shrink-0 flex flex-wrap md:flex-nowrap gap-2">
                                          {(item.status === 'strategy_draft' || item.content || item.htmlContent) && (
                                              <button
                                                  onClick={() => setPreviewModalPost(item)}
                                                  className="w-full md:w-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-indigo-200 transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 shadow-sm"
                                              >
                                                  👁️ Ver Borrador
                                              </button>
                                          )}
                                          <button 
                                              onClick={() => setWritingModalPost({ postId: item.id, title: item.title })}
                                              disabled={publishingId === item.id || (blogUsage >= blogLimit && blogLimit < 999999)} 
                                              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:bg-slate-300 flex items-center justify-center gap-2 shrink-0"
                                          >
                                              {publishingId === item.id ? (
                                                  <>
                                                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                      Redactando...
                                                  </>
                                              ) : (blogUsage >= blogLimit && blogLimit < 999999) ? (
                                                  "Límite Excedido 🔒"
                                              ) : (
                                                  "✨ Empezar a Escribir →"
                                              )}
                                          </button>
                                          <button onClick={() => handleDeletePost(item.id)} className="w-full md:w-auto bg-rose-50 hover:bg-rose-100 text-rose-500 text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-rose-200">
                                              🗑️
                                          </button>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              ) : null}
          </div>
      )}

      {activeTab === 'integracion' && (
          <div className="space-y-8 max-w-4xl">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-2">🔌 Integraciones de Publicación</h2>
              <p className="text-slate-500 font-medium">Conecta tu sitio web para que Santisoft publique los artículos automáticamente. Elige el método según tu tecnología.</p>
            </div>

            {/* Status Indicator Banner — PRECEDES METHOD CARDS */}
            {integrationType === 'api_feed' && (
              <div className="space-y-4">
                <div className={`p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${apiKeyLastUsedAt || connectionTestResult?.success ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm' : 'bg-amber-50 border-amber-300 text-amber-950'}`}>
                  <div className="flex items-start gap-3.5">
                    <div className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${apiKeyLastUsedAt || connectionTestResult?.success ? 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-base">
                          {apiKeyLastUsedAt || connectionTestResult?.success ? 'Conexión Activa (OK)' : 'Esperando primera sincronización'}
                        </h4>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${apiKeyLastUsedAt || connectionTestResult?.success ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                          {apiKeyLastUsedAt || connectionTestResult?.success ? 'CONECTADO' : 'PENDIENTE'}
                        </span>
                      </div>
                      <p className="text-xs font-medium opacity-80 mt-1 leading-relaxed">
                        {apiKeyLastUsedAt 
                          ? `Última sincronización recibida desde tu web: ${new Date(apiKeyLastUsedAt).toLocaleString('es-CL')}`
                          : 'Genera tu API Key en la sección inferior y pégala en tu sitio web. Tan pronto como tu sitio consulte el feed, la conexión se marcará como OK automáticamente.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testingConnection || apiKeys.length === 0}
                    className="shrink-0 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                  >
                    {testingConnection ? 'Probando...' : '🧪 Probar Conexión'}
                  </button>
                </div>

                {connectionTestResult && (
                  <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in fade-in duration-300 ${connectionTestResult.success ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'}`}>
                    <span className="text-base">{connectionTestResult.success ? '🎉' : '❌'}</span>
                    <div>
                      <p>{connectionTestResult.message}</p>
                      {connectionTestResult.count !== undefined && (
                        <p className="text-[11px] font-normal opacity-80 mt-0.5">Se encontraron {connectionTestResult.count} artículo(s) publicados disponibles para tu sitio web.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Method selector cards — stacked full-width for readability */}
            <div className="space-y-4">

              {/* CARD 1 — API Feed */}
              <button
                onClick={() => { setIntegrationType('api_feed'); }}
                className={`w-full relative p-7 rounded-2xl border-2 text-left transition-all group ${integrationType === 'api_feed' ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md bg-white'}`}
              >
                {integrationType === 'api_feed' && <span className="absolute top-5 right-5 text-xs font-black bg-indigo-600 text-white px-3 py-1 rounded-full tracking-widest uppercase">Activo</span>}
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl ${integrationType === 'api_feed' ? 'bg-indigo-100' : 'bg-slate-100'}`}>🌐</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-black text-slate-900 text-xl">API Feed / SDK</h3>
                      <span className="text-xs font-black bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Recomendado</span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                      Ideal si tu sitio web está hecho con <strong>Next.js, React, Vue, Astro, PHP o cualquier framework</strong> sin un CMS tradicional.
                      En lugar de "empujar" el artículo a tu sitio, tu sitio <strong>lo jala desde nuestra API</strong> cuando lo necesita.
                      Esto significa que nunca pierdes un artículo por un error de conexión, y Google lo indexa correctamente porque el contenido se carga en el servidor (SSR/SSG).
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Next.js', color: 'bg-slate-900 text-white' },
                        { label: 'React', color: 'bg-sky-100 text-sky-700' },
                        { label: 'Vue', color: 'bg-green-100 text-green-700' },
                        { label: 'Astro', color: 'bg-purple-100 text-purple-700' },
                        { label: 'PHP / Laravel', color: 'bg-indigo-100 text-indigo-700' },
                        { label: 'Cualquier framework', color: 'bg-slate-100 text-slate-600' },
                      ].map(t => (
                        <span key={t.label} className={`text-xs font-bold px-3 py-1 rounded-full ${t.color}`}>{t.label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>

              {/* CARD 2 — WordPress */}
              <button
                onClick={() => setIntegrationType('wordpress')}
                className={`w-full relative p-7 rounded-2xl border-2 text-left transition-all group ${integrationType === 'wordpress' ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md bg-white'}`}
              >
                {integrationType === 'wordpress' && <span className="absolute top-5 right-5 text-xs font-black bg-indigo-600 text-white px-3 py-1 rounded-full tracking-widest uppercase">Activo</span>}
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl ${integrationType === 'wordpress' ? 'bg-indigo-100' : 'bg-slate-100'}`}>🔵</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-xl mb-2">WordPress</h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                      Santisoft <strong>empuja el artículo directamente a tu WordPress</strong> como borrador cada vez que lo publicas desde el panel.
                      Necesitas generar una <strong>Contraseña de Aplicación</strong> en tu perfil de WordPress (es diferente a tu contraseña normal).
                      Compatible con WordPress.com y WordPress self-hosted. Funciona con Yoast SEO, Rank Math y similares.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'WordPress.com', color: 'bg-blue-100 text-blue-700' },
                        { label: 'WP Self-hosted', color: 'bg-blue-100 text-blue-700' },
                        { label: 'Yoast SEO ✓', color: 'bg-slate-100 text-slate-600' },
                        { label: 'Rank Math ✓', color: 'bg-slate-100 text-slate-600' },
                      ].map(t => (
                        <span key={t.label} className={`text-xs font-bold px-3 py-1 rounded-full ${t.color}`}>{t.label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>

              {/* CARD 3 — Webhook/CMS */}
              <button
                onClick={() => setIntegrationType('webhook')}
                className={`w-full relative p-7 rounded-2xl border-2 text-left transition-all group ${integrationType === 'webhook' ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md bg-white'}`}
              >
                {integrationType === 'webhook' && <span className="absolute top-5 right-5 text-xs font-black bg-indigo-600 text-white px-3 py-1 rounded-full tracking-widest uppercase">Activo</span>}
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl ${integrationType === 'webhook' ? 'bg-indigo-100' : 'bg-slate-100'}`}>⚡</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-xl mb-2">Webhook / CMS (Shopify, Wix, Webflow)</h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                      Para plataformas CMS que <strong>no son WordPress</strong>. Nuestro motor n8n centralizado recibe el artículo y lo <strong>enruta automáticamente</strong> a tu plataforma.
                      Solo necesitas pegar la URL de tu tienda o sitio y el token de acceso que te da la plataforma.
                      También disponible como HTTP Request personalizado para integraciones a medida.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Shopify', color: 'bg-green-100 text-green-700' },
                        { label: 'Wix', color: 'bg-blue-100 text-blue-700' },
                        { label: 'Webflow', color: 'bg-purple-100 text-purple-700' },
                        { label: 'HTTP Custom', color: 'bg-slate-100 text-slate-600' },
                      ].map(t => (
                        <span key={t.label} className={`text-xs font-bold px-3 py-1 rounded-full ${t.color}`}>{t.label}</span>
                      ))}
                    </div>
                  </div>
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

      {/* ─── MODAL 1: OPCIONES DE REDACCIÓN (PUBLICAR vs MANTENER AGENDA) ─── */}
      {writingModalPost && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-md w-full relative space-y-6">
            <button onClick={() => setWritingModalPost(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold">
              ✕
            </button>
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto font-black">
                ✍️
              </div>
              <h3 className="text-xl font-black text-slate-900">Redactar con Inteligencia Artificial</h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-2 px-2">
                "{writingModalPost.title}"
              </p>
            </div>

            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-xs text-slate-600 font-medium space-y-1.5">
              <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                <span>🧠 Proceso de Calidad en 2 Pasos (Doble Revisión):</span>
              </p>
              <p>1. 📝 Generación del borrador (+800 palabras).</p>
              <p>2. 🔍 Revisión y pulido por Editor Jefe SEO.</p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleStartWriting(writingModalPost.postId, 'publish_now')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-3.5 px-5 rounded-2xl text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                🚀 Redactar y Publicar Ahora Mismo
              </button>
              <button
                onClick={() => handleStartWriting(writingModalPost.postId, 'keep_schedule')}
                className="w-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold py-3.5 px-5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
              >
                📅 Redactar y Mantener Agendado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: DIFUNDIR EN REDES SOCIALES Y LINKEDIN ─── */}
      {shareModalPost && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-md w-full relative space-y-6">
            <button onClick={() => setShareModalPost(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold">
              ✕
            </button>
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center text-3xl mx-auto font-black">
                📢
              </div>
              <h3 className="text-xl font-black text-slate-900">Difundir Artículo en Redes</h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-2 px-2">
                "{shareModalPost.title}"
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                ✨ Texto Sugerido para RRSS
              </label>
              <textarea
                readOnly
                value={`¡Nuevo artículo en nuestro blog! 🚀\n\n${shareModalPost.title}\n\n${shareModalPost.metaDescription ? shareModalPost.metaDescription + '\n\n' : ''}👉 Léelo completo aquí:\nhttps://santisoft.cl/es/blog/${shareModalPost.slug}`}
                className="w-full h-32 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none custom-scrollbar"
              />
              <button
                onClick={() => {
                  const text = `¡Nuevo artículo en nuestro blog! 🚀\n\n${shareModalPost.title}\n\n${shareModalPost.metaDescription ? shareModalPost.metaDescription + '\n\n' : ''}👉 Léelo completo aquí:\nhttps://santisoft.cl/es/blog/${shareModalPost.slug}`;
                  navigator.clipboard.writeText(text);
                  showToast("📋 ¡Texto completo copiado al portapapeles!");
                }}
                className="w-full mt-3 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-bold py-2.5 px-5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-indigo-200"
              >
                📋 Copiar Texto + Enlace
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {/* Copy Direct URL */}
              <button
                onClick={() => {
                  const url = `https://santisoft.cl/es/blog/${shareModalPost.slug}`;
                  navigator.clipboard.writeText(url);
                  showToast("📋 ¡Enlace copiado al portapapeles!");
                  setShareModalPost(null);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold py-3.5 px-5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 border border-slate-200"
              >
                📋 Copiar Enlace del Artículo
              </button>

              {/* Share to LinkedIn */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://santisoft.cl/es/blog/${shareModalPost.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareModalPost(null)}
                className="w-full bg-[#0A66C2] hover:bg-[#004182] active:scale-95 text-white font-bold py-3.5 px-5 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                💼 Compartir Directamente en LinkedIn
              </a>

              {/* Post on Connected User Social Networks */}
              <a
                href={`/automatizacion-rrss/panel/crear?title=${encodeURIComponent(shareModalPost.title)}&url=${encodeURIComponent(`https://santisoft.cl/es/blog/${shareModalPost.slug}`)}`}
                onClick={() => setShareModalPost(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold py-3.5 px-5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
              >
                📱 Publicar en Mis Redes Configuradas (Meta / Instagram / Facebook)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: PREVISUALIZACIÓN DE ARTÍCULO REDACTADO ─── */}
      {previewModalPost && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl p-6 md:p-8 max-w-3xl w-full max-h-[85vh] flex flex-col relative">
            <button onClick={() => setPreviewModalPost(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold text-lg">
              ✕
            </button>
            
            <div className="mb-4 pr-8">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${previewModalPost.status === 'published' ? 'bg-emerald-100 text-emerald-700' : previewModalPost.status === 'strategy_draft' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                  {previewModalPost.status === 'published' ? '✅ Publicado' : previewModalPost.status === 'strategy_draft' ? '✍️ Redactado (Listo)' : '📝 Borrador'}
                </span>
                {previewModalPost.scheduledFor && (
                  <span className="text-xs text-slate-500 font-semibold">
                    📅 Agendado: {previewModalPost.scheduledFor.toLocaleDateString()} a las {String(previewModalPost.scheduledFor.getHours()).padStart(2, '0')}:{String(previewModalPost.scheduledFor.getMinutes()).padStart(2, '0')} hrs
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{previewModalPost.title}</h2>
              {previewModalPost.metaDescription && (
                <p className="text-sm text-slate-500 font-medium mt-1">{previewModalPost.metaDescription}</p>
              )}
            </div>

            {/* Rendered HTML / Markdown Content */}
            <div className="flex-1 overflow-y-auto border-t border-b border-slate-100 my-3 py-4 text-slate-800 text-sm font-normal prose prose-indigo max-w-none">
              {previewModalPost.htmlContent || previewModalPost.content ? (
                <div dangerouslySetInnerHTML={{ __html: previewModalPost.htmlContent || previewModalPost.content || '' }} />
              ) : (
                <div className="p-8 text-center text-slate-400 font-medium">
                  No hay contenido redactado aún para este artículo.
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => handleGeneratePostImage(previewModalPost.id)}
                disabled={generatingImageId === previewModalPost.id}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center gap-2 active:scale-95 disabled:bg-slate-100"
              >
                {generatingImageId === previewModalPost.id ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                    Generando Imagen con IA...
                  </>
                ) : (
                  <>🎨 Generar Imagen Destacada</>
                )}
              </button>

              <div className="flex items-center gap-3">
                {previewModalPost.status !== 'published' && (
                  <button
                    onClick={() => {
                      const pId = previewModalPost.id;
                      setPreviewModalPost(null);
                      handlePublish(pId);
                    }}
                    disabled={publishingId === previewModalPost.id}
                    className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
                  >
                    🚀 Publicar Ahora Mismo
                  </button>
                )}
                <button
                  onClick={() => setPreviewModalPost(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl text-xs transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

