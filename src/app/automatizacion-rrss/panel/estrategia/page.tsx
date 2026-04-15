"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { doc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "../../../../contexts/ProfileContext";

interface StrategyGoal {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface StrategyPost {
  weekNumber: number;
  dayOffset: number;
  suggestedTime: string;
  format: string;
  hook: string;
  content: string;
  cta: string;
}

export default function EstrategiaPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState("free");
  const [businessType, setBusinessType] = useState("");
  const [goals, setGoals] = useState<StrategyGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [generating, setGenerating] = useState(false);
  const [strategyResult, setStrategyResult] = useState<StrategyPost[] | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [expectations, setExpectations] = useState("");
  const [businessData, setBusinessData] = useState<any>({});
  const [postsThisMonth, setPostsThisMonth] = useState(0);
  const [hasNetworks, setHasNetworks] = useState(false);
  const { activeProfile } = useProfile();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
              const data = userDoc.data();
              setUserPlan(data.plan || "free");
              
              // Phase 6: Aislamiento estricto de configuración de negocio
              const isDefault = activeProfile?.id === 'default';
              setBusinessType(activeProfile?.rubro || (isDefault ? data.rubro : "") || "");
              
              setBusinessData({
                  website: activeProfile?.website || (isDefault ? data.website : "") || "",
                  facebookUrl: activeProfile?.facebookUrl || (isDefault ? data.facebookUrl : "") || "",
                  instagramUrl: activeProfile?.instagramUrl || (isDefault ? data.instagramUrl : "") || "",
                  tiktokUrl: activeProfile?.tiktokUrl || (isDefault ? data.tiktokUrl : "") || "",
                  twitterUrl: activeProfile?.twitterUrl || (isDefault ? data.twitterUrl : "") || "",
                  linkedinUrl: activeProfile?.linkedinUrl || (isDefault ? data.linkedinUrl : "") || "",
              });
              
              const fbOK = !!activeProfile?.facebookToken_enc || (isDefault && !!data.facebookToken_enc);
              const igOK = !!activeProfile?.instagramToken_enc || (isDefault && !!data.instagramToken_enc);
              setHasNetworks(fbOK || igOK);
              
              // Calculate posts this month
              const firstDayOfMonth = new Date();
              firstDayOfMonth.setDate(1);
              firstDayOfMonth.setHours(0, 0, 0, 0);

              const q = query(
                  collection(db, "social_posts"),
                  where("userId", "==", u.uid)
              );
              
              const querySnapshot = await getDocs(q);
              const count = querySnapshot.docs.filter((doc: any) => {
                  const d = doc.data();
                  return d.createdAt && d.createdAt.toDate() >= firstDayOfMonth;
              }).length;
              setPostsThisMonth(count);
          }
          
          const settingsDoc = await getDoc(doc(db, "settings", "strategy_config"));
          if (settingsDoc.exists() && settingsDoc.data().goals) {
              setGoals(settingsDoc.data().goals);
          } else {
              // Fallback default goals if not set by admin yet
              setGoals([
                  { id: 'sales', title: 'Crecer en Clientes / Ventas', description: 'Enfocado en conversiones directas.', icon: '💰' },
                  { id: 'visibility', title: 'Mayor Visibilidad', description: 'Alcance masivo y reconocimiento de marca.', icon: '👁️' },
                  { id: 'engagement', title: 'Generar Comunidad', description: 'Mejorar interacciones y engagement.', icon: '🤝' }
              ]);
          }

          // Phase 9: Connect Analytics with Strategy via localStorage
          const savedAnalytics = localStorage.getItem('metrics_ai_context');
          if (savedAnalytics) {
              // Strip HTML tags for the textarea
              const cleanText = savedAnalytics.replace(/<[^>]*>?/gm, '');
              setExpectations(cleanText);
              localStorage.removeItem('metrics_ai_context');
          }

        } catch (e) {
          console.error("Error fetching data:", e);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleGenerate = async () => {
      if (userPlan === 'free' && user?.email !== 'diemoroy@gmail.com') return;
      if (!selectedGoal) {
          setError("Selecciona un objetivo para la estrategia.");
          return;
      }
      setGenerating(true);
      setError("");
      setStrategyResult(null);
      try {
         const res = await fetch("/api/ai/generate-strategy", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ 
                 goal: selectedGoal, 
                 goalName: goals.find(g => g.id === selectedGoal)?.title, 
                 businessType, 
                 expectations,
                 businessData,
                 userId: user?.uid,
                 profileId: activeProfile?.id || 'default'
             })
         });
         if (!res.ok) {
             const errData = await res.json();
             throw new Error(errData.error || "Error al generar la estrategia");
         }
         const data = await res.json();
         setStrategyResult(data.strategy);

         // Auto save entire JSON to history
         if (user) {
             const goalName = goals.find(g => g.id === selectedGoal)?.title || selectedGoal;
             await addDoc(collection(db, "user_strategies"), {
                 userId: user.uid,
                 profileId: activeProfile?.id || 'default',
                 goal: goalName,
                 businessType,
                 strategyJson: data.strategy,
                 createdAt: new Date()
             }).catch(e => console.error("Error saving strategy history:", e));
         }
      } catch (err: any) {
          setError(err.message || "Error al generar la estrategia.");
      } finally {
          setGenerating(false);
      }
  };

  const handleAcceptPlan = async () => {
    if (!strategyResult || !user) return;
    
    let limit = 4;
    if (userPlan === "pro") limit = 20;
    if (userPlan === "elite") limit = 60;
    if (userPlan === "business") limit = 999999;
    
    if (postsThisMonth + strategyResult.length > limit && user?.email !== 'diemoroy@gmail.com') {
       setError(`¡Límite Excedido! Tu plan permite ${limit} posts al mes. Ya tienes ${postsThisMonth} agendados y esta estrategia suma ${strategyResult.length}.`);
       return;
    }

    const activeId = activeProfile?.id || 'default';
    
    // Phase 9: Check for previous AI strategy posts pending
    const qPendingAI = query(
        collection(db, "social_posts"),
        where("userId", "==", user.uid),
        where("profileId", "==", activeId),
        where("status", "==", "pending"),
        where("generatedBy", "==", "ai_strategy")
    );
    
    const pendingAISnapshot = await getDocs(qPendingAI);
    
    if (pendingAISnapshot.size > 0) {
        if (!confirm(`Tienes ${pendingAISnapshot.size} posts sugeridos pendientes de tu estrategia AI anterior.\n\nAl aceptar esta nueva planificación, los posts anteriores de IA serán descartados y reemplazados para evitar conflicto. (Tus borradores manuales no se verán afectados).\n\n¿Deseas continuar?`)) {
            return;
        }
    }
    
    setAccepting(true);
    try {
        // Delete old AI strategy posts
        for (const docSnap of pendingAISnapshot.docs) {
           await deleteDoc(doc(db, "social_posts", docSnap.id));
        }

        const postsRef = collection(db, "social_posts");
        for (const post of strategyResult) {
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + post.dayOffset);
            
            // Try to parse suggested time HH:MM, fallback to 12:00
            try {
                if (post.suggestedTime && post.suggestedTime.includes(':')) {
                    const [hours, minutes] = post.suggestedTime.split(':');
                    scheduledDate.setHours(parseInt(hours, 10) || 12, parseInt(minutes, 10) || 0, 0, 0);
                } else {
                    scheduledDate.setHours(12, 0, 0, 0);
                }
            } catch (e) {
                scheduledDate.setHours(12, 0, 0, 0);
            }

            // Determine format for database mapping
            const fmt = post.format?.toLowerCase() || "";
            const postType = fmt.includes('reel') || fmt.includes('video') ? 'Reel' : (fmt.includes('historia') || fmt.includes('story') ? 'Story' : 'Post');

            await addDoc(postsRef, {
                userId: user.uid,
                profileId: activeProfile?.id || 'default',
                text: `${post.content}\n\n${post.cta}`,
                idea: post.hook,
                type: postType,
                status: 'pending',
                scheduledFor: scheduledDate,
                createdAt: new Date(),
                networks: ['instagram', 'facebook'], // Default
                generatedBy: 'ai_strategy'
            });
        }
        router.push("/automatizacion-rrss/panel");
    } catch(err) {
        console.error("Error accepting plan:", err);
        setError("Error al guardar la planificación en tu calendario.");
        setAccepting(false);
    }
  };

  if (loading) return <div className="p-8 font-bold text-slate-400">Cargando Estrategia...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <span className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-600/30 text-white">🚀</span>
          Estrategia Digital AI
        </h1>
        <p className="text-slate-500 font-medium mt-2 max-w-2xl leading-relaxed">
          Selecciona tu objetivo principal y nuestra Inteligencia Artificial diseñará un plan de contenidos semanal a medida para tu negocio.
        </p>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          {userPlan === 'free' && user?.email !== 'diemoroy@gmail.com' && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center rounded-[32px]">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-6 shadow-2xl border-4 border-slate-700">🔒</div>
                  <h3 className="text-3xl font-black text-white mb-3">Función Premium</h3>
                  <p className="text-slate-200 font-medium max-w-md mb-8 leading-relaxed">El <strong className="text-white">Plan Free</strong> no cuenta con esta opción. Sube de nivel para desbloquear tu Estratega Digital AI y multiplicar tus resultados.</p>
                  <Link href="/automatizacion-rrss/panel/planes" className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/50 hover:-translate-y-1">
                      Ver Planes Pro
                  </Link>
              </div>
          )}

          <div className={`space-y-8 ${userPlan === 'free' && user?.email !== 'diemoroy@gmail.com' ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
             <h3 className="text-xl font-black text-slate-900 tracking-tight">1. ¿Qué deseas lograr este mes?</h3>
             {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold">{error}</div>}
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {goals.map(g => (
                     <button
                        key={g.id}
                        onClick={() => setSelectedGoal(g.id)}
                        className={`text-left p-6 rounded-[24px] border-2 transition-all ${selectedGoal === g.id ? 'border-indigo-600 bg-indigo-50 shadow-md transform -translate-y-1' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 hover:-translate-y-1'}`}
                     >
                         <div className="text-4xl mb-4 bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">{g.icon || '🎯'}</div>
                         <h4 className={`font-black mb-2 text-lg ${selectedGoal === g.id ? 'text-indigo-900' : 'text-slate-800'}`}>{g.title}</h4>
                         <p className="text-sm text-slate-500 font-medium leading-relaxed">{g.description}</p>
                     </button>
                 ))}
             </div>

             <div>
                 <h3 className="text-lg font-black text-slate-900 tracking-tight mb-3">2. ¿Tienes alguna expectativa o necesidad especial? (Opcional)</h3>
                 <textarea 
                    value={expectations}
                    onChange={e => setExpectations(e.target.value)}
                    placeholder="Ej: Quiero enfocarme en vender zapatos rojos de verano... o lanzamos una nueva sucursal en Madrid..."
                    className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-[24px] font-medium text-slate-700 outline-none focus:border-indigo-500 transition-colors resize-none mb-2"
                    rows={3}
                 />
                 <p className="text-xs text-slate-400 font-bold px-4">Esta información extra, combinada con los <Link href="/automatizacion-rrss/panel/configuracion" className="text-indigo-500 underline">Datos de tu Negocio</Link>, hará que la IA sea mucho más precisa.</p>
             </div>

             <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                 <p className="text-slate-400 font-bold text-sm">Tu negocio actual: <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{businessType || 'General'}</span></p>
                 
                 {!hasNetworks ? (
                    <Link href="/automatizacion-rrss/panel/configuracion" className="w-full sm:w-auto bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-700 font-black py-4 px-10 rounded-[28px] transition-all flex items-center justify-center gap-3 shadow-sm hover:-translate-y-1">
                       ⚠️ Conecta Meta antes de Planificar
                    </Link>
                 ) : (
                     <button
                        onClick={handleGenerate}
                        disabled={generating || !selectedGoal}
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black py-4 px-10 rounded-[28px] transition-all shadow-xl shadow-slate-900/20 hover:-translate-y-1 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
                     >
                         {generating ? <><div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> Creando Plan...</> : 'Generar Estrategia AI 🧠'}
                     </button>
                 )}
             </div>
          </div>
      </div>

      {strategyResult && strategyResult.length > 0 && (
          <div className="bg-white border-2 border-slate-100 p-8 md:p-12 rounded-[32px] shadow-xl shadow-slate-200/50 animate-in slide-in-from-bottom-8 duration-700 space-y-12 relative overflow-hidden mt-8">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl pointer-events-none font-black text-indigo-500">
                  {goals.find(g => g.id === selectedGoal)?.icon || '✨'}
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 border-b border-slate-100 pb-8">
                 <div className="flex items-center gap-5">
                     <span className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl flex items-center justify-center text-3xl shadow-sm border border-indigo-100">🎯</span>
                     <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-1">Plan Táctico Semanal</h2>
                        <p className="text-indigo-600 font-bold tracking-widest text-xs uppercase flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Generado para {goals.find(g => g.id === selectedGoal)?.title}
                        </p>
                     </div>
                 </div>
                 <button
                    onClick={handleAcceptPlan}
                    disabled={accepting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-3 hover:-translate-y-1 group disabled:opacity-50 disabled:pointer-events-none"
                 >
                     {accepting ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</> : <><span>✅</span> Aceptar Planificación</>}
                 </button>
              </div>

              <div className="space-y-12 relative z-10">
                  {/* Group posts by weekNumber */}
                  {[...Array.from(new Set(strategyResult.map(p => p.weekNumber)))].sort().map(week => (
                      <div key={week} className="space-y-6">
                          <h3 className="text-slate-900 font-black text-2xl flex items-center gap-3">
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-1.5 rounded-full text-sm tracking-widest uppercase">Semana {week}</span>
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {strategyResult.filter(p => p.weekNumber === week).map((post, index) => {
                                  const dDate = new Date();
                                  dDate.setDate(dDate.getDate() + post.dayOffset);
                                  const dateStr = dDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
                                  const formatColor = post.format.toLowerCase().includes('reel') ? 'bg-pink-50 text-pink-600 border border-pink-100' : post.format.toLowerCase().includes('historia') ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100';

                                  return (
                                     <div key={index} className="bg-slate-50 border-2 border-slate-100/60 rounded-3xl p-6 hover:bg-white hover:border-indigo-100 transition-all group relative overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md">
                                         <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-50/50 transition-colors"></div>
                                         <div className="flex items-center justify-between mb-6 relative z-10">
                                            <div className="flex flex-col">
                                                <span className="text-slate-800 font-black capitalize text-lg tracking-tight">{dateStr}</span>
                                                <span className="text-slate-500 font-bold tracking-widest uppercase text-[10px] flex items-center gap-2">
                                                    <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {post.suggestedTime}
                                                </span>
                                            </div>
                                            <span className={`${formatColor} font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-xl`}>{post.format}</span>
                                         </div>
                                         
                                         <div className="flex-1 space-y-4 relative z-10">
                                            <div>
                                                <h4 className="text-indigo-900 font-black text-xl leading-tight mb-2">"{post.hook}"</h4>
                                                <p className="text-slate-600 text-sm font-medium leading-relaxed">{post.content}</p>
                                            </div>
                                         </div>

                                         <div className="mt-6 pt-4 border-t border-slate-200 relative z-10">
                                            <span className="absolute -top-3 left-4 bg-slate-50 group-hover:bg-white transition-colors text-slate-400 text-[9px] font-black uppercase tracking-widest px-2">Llamado a la acción</span>
                                            <p className="text-indigo-600 font-bold text-sm italic">🔸 {post.cta}</p>
                                         </div>
                                     </div>
                                  );
                              })}
                          </div>
                      </div>
                  ))}
              </div>
              
              <div className="flex justify-end pt-8 border-t border-slate-100 relative z-10">
                 <p className="text-slate-500 font-medium text-sm text-right max-w-md">Al Aceptar la Planificación, estos contenidos se enviarán a tu calendario de <strong className="text-slate-900">Próximos Posts</strong> como borradores. Podrás editarlos individualmente antes de publicar.</p>
              </div>
          </div>
      )}
    </div>
  );
}
