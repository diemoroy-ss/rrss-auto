"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useProfile } from "../../../../contexts/ProfileContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRef } from "react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { formatRelative } from "date-fns";

interface PostMetrics {
  likes?: number;
  comments?: number;
  shares?: number;
  reach?: number;
  impressions?: number;
}

interface SocialPost {
  id: string;
  idea: string;
  text?: string;
  copy?: string;
  type?: string;
  scheduledFor: any;
  networks: string[];
  status: 'pending' | 'confirmed' | 'published' | 'error';
  imageUrl?: string;
  createdAt: any;
  metrics?: PostMetrics; // The new metrics object
}

export default function MetricasDashboard() {
  const [user, setUser] = useState<any>(null);
  const [publishedPosts, setPublishedPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  // Aggregated Stats
  const [totalReach, setTotalReach] = useState(0);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [networkFilter, setNetworkFilter] = useState<'todos' | 'facebook' | 'instagram'>('todos');
  const { activeProfile } = useProfile();
  
  // AI Feature States
  const [showPosts, setShowPosts] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [showAiAnalysis, setShowAiAnalysis] = useState(true);
  const [hasNetworks, setHasNetworks] = useState(false);
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showN8nModal, setShowN8nModal] = useState(false);
  const [n8nLoading, setN8nLoading] = useState(false);
  const [n8nTarget, setN8nTarget] = useState<'whatsapp' | 'email'>('whatsapp');
  const [n8nValue, setN8nValue] = useState("");
  const [n8nCustomerName, setN8nCustomerName] = useState("");

  const chartData = [...publishedPosts].sort((a, b) => {
     const dateA = a.scheduledFor?.toMillis ? a.scheduledFor.toMillis() : 0;
     const dateB = b.scheduledFor?.toMillis ? b.scheduledFor.toMillis() : 0;
     return dateA - dateB; // chronological
  }).slice(-10).map((post) => {
     const dateObj = post.scheduledFor?.toDate ? post.scheduledFor.toDate() : new Date();
     return {
        name: format(dateObj, "d MMM", { locale: es }),
        Alcance: post.metrics?.reach || post.metrics?.impressions || 0,
        Interacciones: (post.metrics?.likes || 0) + (post.metrics?.comments || 0) + (post.metrics?.shares || 0)
     };
  });

  const handleDownloadReport = async () => {
    if (!aiAnalysis) {
        setSyncStatus({ type: 'error', text: 'Debes generar el análisis de IA antes de descargar el reporte.' });
        return;
    }
    
    setSyncStatus({ type: 'info', text: 'Generando reporte limpio en PDF...' });
    try {
        const generatedAt = format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es });
        const res = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                profileName: activeProfile?.name || 'Mi Marca',
                totalReach,
                totalInteractions,
                aiAnalysis,
                generatedAt,
            })
        });

        if (!res.ok) throw new Error('Error al generar PDF');
        
        const { pdfBase64 } = await res.json();
        
        // Convertir base64 a byte array y luego a Blob
        const byteCharacters = atob(pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Disparar descarga
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${activeProfile?.name?.replace(/\s+/g, '_') || 'Marca'}_RRSS.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setTimeout(() => setSyncStatus(null), 3000);
    } catch (e) {
        console.error("Error al descargar:", e);
        setSyncStatus({ type: 'error', text: 'No se pudo generar el PDF descargable.' });
    }
  };

  const shareTextWhatsApp = `¡Hola! Aquí tienes el resumen generado por Inteligencia Artificial para el rendimiento de la cuenta de ${activeProfile?.name || 'nuestra marca'}. Te adjunto el PDF del reporte enseguida.\n\n*Alcance Total:* ${totalReach.toLocaleString('es-ES')}\n*Interacciones Totales:* ${totalInteractions.toLocaleString('es-ES')}\n\nAnalizado por Santisoft IA 🤖`;
  const shareTextEmailBody = `Hola,%0D%0A%0D%0ATe comparto el estado actual del rendimiento de nuestras redes sociales.%0D%0A%0D%0AAlcance Total: ${totalReach.toLocaleString('es-ES')}%0D%0AInteracciones Totales: ${totalInteractions.toLocaleString('es-ES')}%0D%0A%0D%0ATe enviaré el reporte PDF generado por la IA de Santisoft adjunto en este correo.`;

  const handleSendToN8N = async () => {
    if (!n8nValue) return;
    
    if (!aiAnalysis) {
        setSyncStatus({ type: 'error', text: 'Debes generar el análisis de IA antes de enviar el reporte.' });
        setShowN8nModal(false);
        return;
    }
    
    setN8nLoading(true);
    try {
        console.log("📄 Solicitando PDF al servidor...");

        const generatedAt = format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es });

        // 1. Generate PDF server-side (avoids oklch / JSX issues on client)
        const pdfRes = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                profileName: activeProfile?.name || 'Mi Marca',
                totalReach,
                totalInteractions,
                aiAnalysis,
                generatedAt,
            })
        });

        if (!pdfRes.ok) {
            const errData = await pdfRes.json();
            throw new Error(errData.error || 'Error generando PDF');
        }

        const { pdfBase64 } = await pdfRes.json();
        console.log(`📦 PDF recibido (${Math.round(pdfBase64.length * 0.75 / 1024)} KB)`);

        // 2. Send to n8n
        console.log("📤 Enviando a n8n...");
        const res = await fetch('/api/n8n/send-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pdfBase64,
                message: shareTextWhatsApp.replace(/\\n/g, '\n'),
                customerName: n8nCustomerName,
                targetType: n8nTarget,
                targetValue: n8nValue,
                profileName: activeProfile?.name || 'Mi Marca'
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error("❌ Error en la API:", errorData);
            throw new Error(errorData.error || "Error al enviar a n8n");
        }
        
        console.log("✅ Reporte enviado con éxito");
        setSyncStatus({ type: 'success', text: `Reporte enviado con éxito a ${n8nValue}` });
        setShowN8nModal(false);
        setN8nValue("");
        setN8nCustomerName("");
        
    } catch (error) {
        console.error("N8N Send Error:", error);
        setSyncStatus({ type: 'error', text: 'No se pudo enviar el reporte por n8n. Intenta de nuevo.' });
    } finally {
        setN8nLoading(false);
        setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handleAnalyze = async () => {
     setAnalyzing(true);
     setAiAnalysis("");
     try {
       const res = await fetch("/api/ai/analyze-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ posts: publishedPosts, profileName: activeProfile?.name || 'Mi Marca' })
       });
       if (!res.ok) throw new Error("Error al analizar métricas");
       const data = await res.json();
       setAiAnalysis(data.analysis);
     } catch (e) {
       console.error("Error AI Analysis:", e);
       setAiAnalysis("<p>No se pudo generar el análisis en este momento. Intenta de nuevo más tarde o verifica tu conexión.</p>");
     } finally {
       setAnalyzing(false);
     }
  };

  const fetchMetrics = async (uid: string) => {
    try {
      setLoading(true);
      // Fetch the real analytical data from n8n synced external_posts
      const q = query(collection(db, "external_posts"), 
         where("userId", "==", uid),
         where("profileId", "==", activeProfile?.id || 'default')
      );
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(d => {
         const docData = d.data();
         
         // Meta uses ISO strings like '2024-03-20T...' we map it to Firestore's format for the UI
         let scheduledFor = null;
         const rawTimestamp = docData.timestamp || docData.created_time || docData.createdAt;

         if (rawTimestamp) {
            if (typeof rawTimestamp.toDate === 'function') {
               const parsedDate = rawTimestamp.toDate();
               scheduledFor = { toDate: () => parsedDate, toMillis: () => parsedDate.getTime() };
            } else {
               const parsedDate = new Date(rawTimestamp);
               if (!isNaN(parsedDate.getTime())) {
                  scheduledFor = { 
                     toDate: () => parsedDate, 
                     toMillis: () => parsedDate.getTime() 
                  };
               }
            }
         }

         let caption = docData.caption || docData.message || '';
         
         return {
            id: d.id,
            idea: caption ? caption : (docData.network === 'facebook' ? 'Post de Facebook sin texto' : 'Post de Instagram sin texto'),
            text: '', // Caption already set to idea
            type: docData.media_type || 'POST',
            scheduledFor: scheduledFor,
            networks: [docData.network || 'instagram'],
            status: 'published',
            metrics: {
               likes: docData.likes || 0,
               comments: docData.comments || 0,
               shares: docData.shares || 0,
               reach: docData.reach || docData.impressions || 0, // Fallback to impressions if reach is empty
               impressions: docData.impressions || 0,
            }
         } as SocialPost;
      });
      
      // Sort published by date (newest first)
      data.sort((a, b) => {
        const dateA = a.scheduledFor?.toMillis ? a.scheduledFor.toMillis() : 0;
        const dateB = b.scheduledFor?.toMillis ? b.scheduledFor.toMillis() : 0;
        return dateB - dateA;
      });
      
      setPublishedPosts(data);

      // Aggregate Metrics
      let reachSum = 0;
      let interactionSum = 0;
      
      data.forEach(post => {
         const m = post.metrics;
         if (m) {
             reachSum += (m.reach || 0);
             interactionSum += (m.likes || 0) + (m.comments || 0) + (m.shares || 0);
         }
      });

      setTotalReach(reachSum);
      setTotalInteractions(interactionSum);

    } catch (e) {
      console.error("Error fetching metrics", e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: 'info', text: 'Buscando el historial más reciente en los servidores de Meta...' });
    
    try {
      const response = await fetch('https://n8n.santisoft.cl/webhook/sincronizar-metricas', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });

      if (!response.ok) throw new Error("Error en el servidor de n8n");
      
      // Tras finalizar, volvemos a descargar los datos actualizados de Firestore
      if (user) await fetchMetrics(user.uid);
      
      setSyncStatus({ type: 'success', text: '¡Métricas sincronizadas perfectamente! Tus datos están al día.' });
      setTimeout(() => setSyncStatus(null), 5000);
      
    } catch (e) {
      setSyncStatus({ type: 'error', text: 'No pudimos sincronizar en este momento. Revisa tu conexión con n8n.' });
      setTimeout(() => setSyncStatus(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadAndCheck = async () => {
       if (user && activeProfile) {
          fetchMetrics(user.uid);
          
          let rootHasTokens = false;
          const isDefault = activeProfile.id === 'default';
          if (isDefault) {
             try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                   rootHasTokens = !!userDoc.data().facebookToken_enc || !!userDoc.data().instagramToken_enc;
                }
             } catch (e) {
                console.error(e);
             }
          }
          
          if (isMounted) {
              const fbOK = !!activeProfile.facebookToken_enc;
              const igOK = !!activeProfile.instagramToken_enc;
              setHasNetworks(fbOK || igOK || rootHasTokens);
          }
       }
    };
    loadAndCheck();
    return () => { isMounted = false; };
  }, [user, activeProfile?.id, activeProfile?.facebookToken_enc, activeProfile?.instagramToken_enc]);

  if (loading) return <div className="animate-pulse space-y-4 max-w-5xl"><div className="h-10 bg-slate-200 rounded w-1/3"></div><div className="h-64 bg-slate-200 rounded"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <style>{`
        @media print {
           @page { margin: 15mm; }
           body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
           .make-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
           h3 { page-break-after: avoid; }
           /* Overriding specific print styles */
           #printable-report-wrapper {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
           }
        }
      `}</style>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <span className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">📈</span>
             Rendimiento y Métricas
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg max-w-2xl">Visualiza el impacto de tus publicaciones automatizadas. Los datos se actualizan automáticamente desde tus perfiles de Meta.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleManualSync}
            disabled={isSyncing || !hasNetworks}
            className={`flex items-center gap-2 border font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all text-sm ${
                !hasNetworks 
                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700'
            }`}
            title={!hasNetworks ? "Conecta una cuenta en Configuración para sincronizar" : ""}
          >
            <span className={isSyncing ? "animate-spin" : ""}>{hasNetworks ? '🔄' : '⚠️'}</span> 
            {isSyncing ? 'Sincronizando...' : hasNetworks ? 'Actualizar Ahora' : 'Sin Redes'}
          </button>
          <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400">
             Últimos 30 días
          </div>
        </div>
      </div>

      {syncStatus && (
        <div className={`mt-2 px-6 py-4 rounded-2xl flex items-center gap-4 text-sm font-bold animate-in fade-in slide-in-from-top-4 shadow-lg border print:hidden ${
            syncStatus.type === 'info' ? 'bg-blue-50 text-blue-700 border-blue-100 shadow-blue-900/5' :
            syncStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-900/5' :
            'bg-rose-50 text-rose-700 border-rose-100 shadow-rose-900/5'
        }`}>
           {syncStatus.type === 'info' && <span className="flex h-5 w-5 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"></span><span className="relative inline-flex rounded-full h-5 w-5 bg-blue-500 flex items-center justify-center text-white text-[10px]">☁️</span></span>}
           {syncStatus.type === 'success' && <span className="text-emerald-500 bg-white p-1 rounded-full shadow-sm text-xs">✅</span>}
           {syncStatus.type === 'error' && <span className="text-rose-500 bg-white p-1 rounded-full shadow-sm text-xs">⚠️</span>}
           {syncStatus.text}
        </div>
      )}

      {publishedPosts.length === 0 ? (
        <div className="premium-card p-16 text-center bg-white">
           <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner animate-pulse">📊</div>
           <h3 className="text-2xl font-black text-slate-900 tracking-tight">Aún no hay datos suficientes</h3>
           <p className="text-slate-500 mt-4 leading-relaxed font-medium max-w-md mx-auto">Una vez que tus primeros posts programados se publiquen en tus redes, comenzaremos a recopilar datos de alcance e interacción aquí.</p>
           <Link href="/automatizacion-rrss/panel" className="inline-block mt-8 bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-indigo-600/40 hover:-translate-y-1 transition-all">
              Ver Mis Borradores
           </Link>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
            <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-indigo-100 transition-colors">
               <div className="absolute top-0 right-0 p-6 text-6xl opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all text-indigo-600 font-black">👁️</div>
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Alcance Total</h4>
               <div className="text-5xl font-black text-slate-900 tracking-tight">{totalReach.toLocaleString('es-ES')}</div>
               <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 w-fit px-3 py-1 rounded-lg">
                  <span className="text-[10px]">✨</span> Basado en {publishedPosts.length} posts
               </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-pink-100 transition-colors">
               <div className="absolute top-0 right-0 p-6 text-6xl opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all text-pink-600 font-black">❤️</div>
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Interacciones Totales</h4>
               <div className="text-5xl font-black text-slate-900 tracking-tight">{totalInteractions.toLocaleString('es-ES')}</div>
               <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 w-fit px-3 py-1 rounded-lg">
                  Likes, Comentarios y Shares
               </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group shadow-slate-900/20">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent"></div>
               <div className="absolute top-0 right-0 p-6 text-6xl opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all text-white font-black">🚀</div>
               <div className="relative z-10">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Posts Exitosos</h4>
                 <div className="text-5xl font-black text-white tracking-tight">{publishedPosts.length}</div>
                 <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-200 bg-white/10 w-fit px-3 py-1 rounded-lg backdrop-blur-md">
                    Entregados por el Bot
                 </div>
               </div>
            </div>
          </div>

          {/* AI Analyzer Section */}
          <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-xl shadow-slate-200/50 relative overflow-hidden group mt-8 mb-8 border-2 border-slate-100 print:shadow-none print:border-none print:p-0">
             <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none print:hidden"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-6 print:hidden">
                <div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 mb-3">
                      <span className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl border border-indigo-100 shadow-inner">🧠</span>
                      Inteligencia Analítica
                   </h3>
                   <p className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed">Nuestra IA evaluará tu rendimiento mensual, detectará qué formatos funcionan mejor y te dará consejos tácticos para maximizar resultados.</p>
                </div>
                <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                    <button
                       onClick={handleAnalyze}
                       disabled={analyzing || publishedPosts.length === 0 || !hasNetworks}
                       className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:pointer-events-none font-black text-lg px-8 py-5 rounded-2xl shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
                    >
                       {analyzing ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Analizando...</> : !hasNetworks ? 'Conecta RRSS para analizar' : 'Generar Reporte AI ✨'}
                    </button>
                    {aiAnalysis && (
                       <button
                          onClick={() => setShowAiAnalysis(!showAiAnalysis)}
                          className="w-full text-indigo-600 text-sm font-bold hover:text-indigo-800 transition-colors"
                       >
                          {showAiAnalysis ? 'Ocultar Análisis ☝️' : 'Mostrar Análisis 👇'}
                       </button>
                    )}
                </div>
             </div>

             {aiAnalysis && showAiAnalysis && (
                <div className="mt-8 pt-8 border-t border-slate-200 relative z-10 animate-in fade-in slide-in-from-top-4">
                   
                   {/* The Printable Container */}
                   <div id="printable-report-wrapper" ref={reportRef} className={`bg-slate-50 rounded-[24px] p-6 md:p-10 text-slate-700 border-2 border-slate-100 shadow-inner ${isExporting ? 'opacity-50' : ''}`}>
                      {/* Hidden Header for PDF Output */}
                      <div id="pdf-hidden-header" style={{ display: 'none' }} className="mb-8">
                         <h2 className="text-3xl font-black text-indigo-900 mb-2">Reporte Analítico de Rendimiento (IA)</h2>
                         <p className="text-slate-500 font-bold text-lg mb-6">{activeProfile?.name || 'Mi Marca'} - {format(new Date(), "MMMM yyyy", { locale: es })}</p>
                         <div className="flex gap-4 mb-6">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-1/2">
                               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Alcance Total</p>
                               <p className="text-2xl font-black text-slate-900">{totalReach.toLocaleString('es-ES')}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-1/2">
                               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Interacciones</p>
                               <p className="text-2xl font-black text-slate-900">{totalInteractions.toLocaleString('es-ES')}</p>
                            </div>
                         </div>
                      </div>

                      <div 
                         dangerouslySetInnerHTML={{ __html: aiAnalysis }} 
                         className="text-base leading-relaxed space-y-4 [&>h3]:text-xl [&>h3]:font-black [&>h3]:text-slate-900 [&>h3]:mt-8 [&>h3]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-3 [&>strong]:text-indigo-900" 
                      />

                      {/* Bar Chart */}
                      {chartData.length > 0 && (
                         <div className="mt-12 pt-8 border-t border-slate-200">
                             <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><span className="text-2xl">📊</span> Rendimiento de posts recientes</h3>
                             <div className="h-[300px] w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                 <ResponsiveContainer width="100%" height="100%">
                                     <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                         <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                         <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                         <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} yAxisId="left" />
                                         <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} orientation="right" yAxisId="right" />
                                         <Tooltip 
                                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                         />
                                         <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                         <Bar yAxisId="left" dataKey="Alcance" fill="#6366f1" radius={[4, 4, 0, 0]} name="Alcance" />
                                         <Bar yAxisId="right" dataKey="Interacciones" fill="#ec4899" radius={[4, 4, 0, 0]} name="Interacciones" />
                                     </BarChart>
                                 </ResponsiveContainer>
                             </div>
                         </div>
                      )}
                   </div>

                   {/* Actions Row */}
                   <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 relative z-20 print:hidden">
                      
                      <div className="flex flex-col gap-2 w-full sm:w-auto text-left">
                         <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Exportar y Compartir</h4>
                         <div className="flex gap-2">
                            <button 
                               onClick={handleDownloadReport}
                               className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-xl transition-all shadow-sm text-sm border-2 border-slate-200 flex items-center gap-2"
                            >
                                <span className="text-lg">📄</span> Descargar PDF
                            </button>
                            
                            <button 
                               onClick={() => setShowN8nModal(true)}
                               title="Enviar automáticamente vía n8n (WhatsApp o Email)"
                               className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 font-bold p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center border border-indigo-500/30 group"
                            >
                               <span className="text-xl group-hover:scale-110 transition-transform">🤖 Enviar Reporte</span>
                            </button>
                         </div>
                      </div>
                      
                      <button 
                         onClick={() => {
                            localStorage.setItem('metrics_ai_context', aiAnalysis);
                            router.push('/automatizacion-rrss/panel/estrategia');
                         }}
                         className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-black py-4 px-8 rounded-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/30"
                      >
                         Planificar con estos Insights 🚀
                      </button>
                   </div>

                </div>
             )}
          </div>

          <div className="flex justify-center mb-8 print:hidden">
             <button onClick={() => setShowPosts(!showPosts)} className="bg-white border-2 border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 font-bold px-8 py-3 rounded-full transition-colors flex items-center gap-2 shadow-sm focus:outline-none">
                {showPosts ? 'Ocultar Publicaciones ☝️' : 'Ver Todas las Publicaciones 📋'}
             </button>
          </div>

          {/* Ranking / Top Posts */}
          {showPosts && (
             <div className="mb-8 animate-in fade-in slide-in-from-top-4 print:hidden">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Top publicaciones</h3>
                   <p className="text-sm font-medium text-slate-500">Rendimiento individual de tus últimos contenidos</p>
                </div>
                
                <div className="flex items-center gap-2">
                   <button onClick={() => setNetworkFilter('todos')} className={`px-4 py-1.5 border rounded-lg text-sm font-medium transition-colors ${networkFilter === 'todos' ? 'border-slate-800 bg-slate-800 text-white shadow-md' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>Todos</button>
                   <button onClick={() => setNetworkFilter('facebook')} className={`px-4 py-1.5 border rounded-lg text-sm font-medium transition-colors ${networkFilter === 'facebook' ? 'border-slate-800 bg-slate-800 text-white shadow-md' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>Facebook</button>
                   <button onClick={() => setNetworkFilter('instagram')} className={`px-4 py-1.5 border rounded-lg text-sm font-medium transition-colors ${networkFilter === 'instagram' ? 'border-slate-800 bg-slate-800 text-white shadow-md' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>Instagram</button>
                </div>
             </div>

             <div className="flex flex-col gap-4">
                {publishedPosts.filter(p => networkFilter === 'todos' || p.networks.includes(networkFilter)).map((post, i) => {
                    let dateObj = new Date();
                    try {
                       const possibleDate = post.scheduledFor?.toDate ? post.scheduledFor.toDate() : new Date();
                       if (!isNaN(possibleDate.getTime())) {
                          dateObj = possibleDate;
                       }
                    } catch (e) {
                       // ignore and fallback to now
                    }
                    const dateStr = format(dateObj, "d MMM, yyyy", { locale: es });
                   
                   // Fallbacks
                   const likes = post.metrics?.likes || 0;
                   const reach = post.metrics?.reach || 0;
                   const comments = post.metrics?.comments || 0;
                   
                   const isFb = post.networks.includes('facebook');
                   const rankColor = i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-700' : 'text-slate-800';
                   const accentColor = isFb ? 'bg-blue-600' : 'bg-pink-500';

                   return (
                     <div key={post.id} className="pr-4 md:pr-10 p-4 md:py-3 md:pl-4 flex flex-col md:flex-row gap-4 items-start md:items-center group bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden transition-all hover:shadow-md hover:border-slate-300">
                        {/* Accent Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentColor}`}></div>
                        
                        <div className={`font-black text-xl w-10 text-center select-none ${rankColor} md:ml-4`}>
                           #{i + 1}
                        </div>

                        <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center shadow-sm ${isFb ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}`}>
                           {isFb ? (
                              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                           ) : (
                              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.07m0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                           )}
                        </div>

                        <div className="flex-1 min-w-0 pr-4 mt-2 md:mt-0 xl:max-w-xl">
                           <div className="flex items-center gap-3 mb-1.5">
                              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isFb ? 'text-blue-700 bg-blue-50' : 'text-pink-700 bg-pink-50'}`}>
                                 <span className={`w-1.5 h-1.5 rounded-full ${isFb ? 'bg-blue-500' : 'bg-pink-500'}`}></span>
                                 {isFb ? 'Facebook' : 'Instagram'}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">{dateStr}</span>
                           </div>
                           <p className="font-medium text-[15px] text-slate-800 leading-snug line-clamp-2 md:whitespace-pre-line">{post.idea}</p>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-100 md:border-none pl-12 md:pl-0 md:ml-auto">
                           <div className="flex flex-col items-center">
                              <span className="text-slate-500 mb-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></span>
                              <span className="font-bold text-slate-700 text-lg">{reach.toLocaleString('es-ES')}</span>
                           </div>
                           <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
                           <div className="flex flex-col items-center">
                              <span className="text-pink-400 mb-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>
                              <span className="font-bold text-slate-700 text-lg">{likes.toLocaleString('es-ES')}</span>
                           </div>
                           <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
                           <div className="flex flex-col items-center">
                              <span className="text-slate-400 mb-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></span>
                              <span className="font-bold text-slate-700 text-lg">{comments.toLocaleString('es-ES')}</span>
                           </div>
                        </div>

                     </div>
                   );
                })}
             </div>
          </div>
          )}
        </>
      )}

      {/* N8N Delivery Modal */}
      {showN8nModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-indigo-600 p-8 text-white relative">
                   <button onClick={() => setShowN8nModal(false)} className="absolute top-6 right-6 text-white/60 hover:text-white text-2xl">×</button>
                   <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-4 backdrop-blur-md">🤖</div>
                   <h3 className="text-2xl font-black tracking-tight">Enviar Reporte</h3>
                   <p className="text-indigo-100 text-sm font-medium mt-1">Automatización vía n8n</p>
                </div>
                
                <div className="p-8 space-y-6">
                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Canal de Envío</label>
                      <div className="grid grid-cols-2 gap-3">
                         <button 
                            onClick={() => setN8nTarget('whatsapp')}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${n8nTarget === 'whatsapp' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                         >
                            <span>🟢</span> WhatsApp
                         </button>
                         <button 
                            onClick={() => setN8nTarget('email')}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold transition-all ${n8nTarget === 'email' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                         >
                            <span>📩</span> Email
                         </button>
                      </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nombre del Cliente</label>
                      <input 
                         type="text" 
                         value={n8nCustomerName}
                         onChange={(e) => setN8nCustomerName(e.target.value)}
                         placeholder="Ej: Juan Pérez"
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-medium focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                   </div>

                   <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                         {n8nTarget === 'whatsapp' ? 'Número de WhatsApp' : 'Correo Electrónico'}
                      </label>
                      <input 
                         type="text" 
                         value={n8nValue}
                         onChange={(e) => setN8nValue(e.target.value)}
                         placeholder={n8nTarget === 'whatsapp' ? '56912345678' : 'cliente@ejemplo.com'}
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-medium focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                         {n8nTarget === 'whatsapp' ? '⚠️ Incluye el código de país (ej: 569 para Chile, 549 para Argentina).' : 'El reporte llegará como archivo adjunto personalizado.'}
                      </p>
                   </div>

                   <button 
                      onClick={handleSendToN8N}
                      disabled={n8nLoading || !n8nValue}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3"
                   >
                      {n8nLoading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Enviando...</> : 'Confirmar Envío 🚀'}
                   </button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
}
