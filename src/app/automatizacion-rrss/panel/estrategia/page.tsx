"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { doc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProfile } from "../../../../contexts/ProfileContext";
import { isUserAdmin } from "../../../../lib/quota";
import StatusModal from "../../../../components/StatusModal";
import VoiceMic from "../../../../components/VoiceMic";
import PromptStyleSelector from "../../../../components/strategy/PromptStyleSelector";
import { PromptTemplate } from "../../../../lib/prompt-templates";
import { appendContactInfo } from "../../../../lib/contact-helper";
import { getScheduleContinuityFromList, ScheduleContinuityResult } from "../../../../lib/schedule-continuity";

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
  visualStyle?: string;
  promptTemplateId?: string;
  previewUrl?: string;
  imageDirection?: string;
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
  const [promoMode, setPromoMode] = useState<'profile' | 'custom'>('profile');
  const [customPromotions, setCustomPromotions] = useState("");
  const [radarAnalysis, setRadarAnalysis] = useState<any>(null);
  const [useRadarContext, setUseRadarContext] = useState<boolean>(true);
  const [usePromptStyles, setUsePromptStyles] = useState<boolean>(false);
  const [selectedPromptStyles, setSelectedPromptStyles] = useState<PromptTemplate[]>([]);
  const [businessData, setBusinessData] = useState<any>({});
  const [postsThisMonth, setPostsThisMonth] = useState(0);
  const [hasNetworks, setHasNetworks] = useState(false);
  const [catalogoItems, setCatalogoItems] = useState<any[]>([]);
  const [catalogUsage, setCatalogUsage] = useState<'mixed' | 'all' | 'none'>('mixed');
  
  // Fecha y hora de inicio de la planificación
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    if (d.getHours() >= 18) d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [startTime, setStartTime] = useState<string>("10:00");
  const [scheduleContinuityInfo, setScheduleContinuityInfo] = useState<ScheduleContinuityResult | null>(null);

  const computePostDate = (startD: string, startT: string, dayOffset: number, suggestedTime?: string) => {
    const [y, m, d] = (startD || new Date().toISOString().split('T')[0]).split('-').map(Number);
    let baseDate = new Date(y, m - 1, d);

    // Si existen posts futuros agendados y la fecha seleccionada cae antes o igual a la última agendada,
    // garantizar que la estrategia continúe a partir del día siguiente al último agendado.
    if (scheduleContinuityInfo?.hasFuturePosts && scheduleContinuityInfo.lastScheduledDate) {
      if (baseDate.getTime() <= scheduleContinuityInfo.lastScheduledDate.getTime()) {
        const nextDay = new Date(scheduleContinuityInfo.lastScheduledDate);
        nextDay.setDate(nextDay.getDate() + 1);
        baseDate = nextDay;
      }
    }

    const targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + (dayOffset || 0));

    let timeStr = (dayOffset === 0 && startT) ? startT : (suggestedTime || startT || "10:00");
    if (timeStr && timeStr.includes(':')) {
      const [h, min] = timeStr.split(':').map(Number);
      targetDate.setHours(h || 10, min || 0, 0, 0);
    } else {
      targetDate.setHours(10, 0, 0, 0);
    }

    const now = new Date();
    if (targetDate.getTime() <= now.getTime()) {
      targetDate.setTime(now.getTime() + 30 * 60 * 1000);
    }
    return targetDate;
  };

  const { activeProfile } = useProfile();

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "confirm";
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const showModal = (type: any, title: string, message: string, onConfirm?: () => void) => {
    setModal({
        isOpen: true,
        type,
        title,
        message,
        onConfirm: onConfirm || (() => setModal(prev => ({ ...prev, isOpen: false })))
    });
  };

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
              
              const prof = activeProfile as any;
              setBusinessData({
                  businessName: prof?.name || prof?.businessName || (isDefault ? data.businessName || data.name : "") || "",
                  website: prof?.website || (isDefault ? data.website : "") || "",
                  phone: prof?.phone || (isDefault ? data.phone : "") || "",
                  whatsapp: prof?.whatsapp || prof?.phone || (isDefault ? data.whatsapp || data.phone : "") || "",
                  email: prof?.email || (isDefault ? data.email : "") || "",
                  address: prof?.address || (isDefault ? data.address : "") || "",
                  facebookUrl: prof?.facebookUrl || (isDefault ? data.facebookUrl : "") || "",
                  instagramUrl: prof?.instagramUrl || (isDefault ? data.instagramUrl : "") || "",
                  tiktokUrl: prof?.tiktokUrl || (isDefault ? data.tiktokUrl : "") || "",
                  twitterUrl: prof?.twitterUrl || (isDefault ? data.twitterUrl : "") || "",
                  linkedinUrl: prof?.linkedinUrl || (isDefault ? data.linkedinUrl : "") || "",
              });
              
              const fbOK = !!activeProfile?.facebookToken_enc || (isDefault && !!data.facebookToken_enc);
              const igOK = !!activeProfile?.instagramToken_enc || (isDefault && !!data.instagramToken_enc);
              const ttOK = !!activeProfile?.tiktokToken_enc || (isDefault && !!data.tiktokToken_enc);
              const liOK = !!activeProfile?.linkedinUserToken_enc || !!activeProfile?.linkedinToken_enc || (isDefault && (!!data.linkedinUserToken_enc || !!data.linkedinToken_enc));
              
              setHasNetworks(fbOK || igOK || ttOK || liOK);
              
              // Calculate posts this month
              const firstDayOfMonth = new Date();
              firstDayOfMonth.setDate(1);
              firstDayOfMonth.setHours(0, 0, 0, 0);

              const q = query(
                  collection(db, "social_posts"),
                  where("userId", "==", u.uid)
              );
              
              const querySnapshot = await getDocs(q);
              const allPosts = querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
              const count = allPosts.filter((d: any) => {
                  return d.createdAt && d.createdAt.toDate && d.createdAt.toDate() >= firstDayOfMonth;
              }).length;
              setPostsThisMonth(count);

              const cont = getScheduleContinuityFromList(allPosts, activeProfile?.id, 10);
              setScheduleContinuityInfo(cont);
              if (cont.hasFuturePosts) {
                  setStartDate(cont.nextDateString);
              }
          }
          
          // Fetch goals from secure API instead of client-side Firestore
          const token = await u.getIdToken();
          const res = await fetch("/api/strategies", {
              headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
              const data = await res.json();
              if (data.goals && Array.isArray(data.goals)) {
                  setGoals(data.goals);
              }
          } else {
              // Fallback default goals if API fails
              setGoals([
                  { id: 'ventas', title: 'Ventas & Conversión', description: 'Maximizar pedidos y ventas directas mediante contenido persuasivo.', icon: '💰' },
                  { id: 'autoridad', title: 'Autoridad & Marca', description: 'Posicionarte como el experto número 1 y referente de tu sector.', icon: '🎙️' },
                  { id: 'viralidad', title: 'Viralidad & Alcance', description: 'Contenido diseñado para ser compartido masivamente y llegar a miles.', icon: '🚀' },
                  { id: 'lealtad', title: 'Comunidad & Lealtad', description: 'Crear fans reales y embajadores que interactúen con cada publicación.', icon: '❤️' },
                  { id: 'prospectos', title: 'Captación de Prospectos', description: 'Atraer mensajes directos y registros de clientes altamente interesados.', icon: '📥' }
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

          // Cargar último análisis del Radar de Nicho para este perfil
          try {
              const radarRes = await fetch("/api/nicho/radar", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                  body: JSON.stringify({
                      checkCacheOnly: true,
                      userId: u.uid,
                      businessId: activeProfile?.id || 'default',
                      niche: activeProfile?.rubro || data.rubro || 'General'
                  })
              });
              if (radarRes.ok) {
                  const rData = await radarRes.json();
                  if (rData.success && rData.analysis) {
                      setRadarAnalysis(rData.analysis);
                  }
              }
          } catch (rErr) {
              console.warn("No se pudo cargar análisis previo del radar:", rErr);
          }

          // Load catalog items for context
          try {
              const token = await u.getIdToken();
              const catRes = await fetch(`/api/catalogo?profileId=${activeProfile?.id || 'default'}`, {
                  headers: { Authorization: `Bearer ${token}` },
              });
              const catData = await catRes.json();
              setCatalogoItems(catData.items || []);
          } catch (cErr) {
              console.warn("No se pudo cargar el catálogo:", cErr);
          }

        } catch (e) {
          console.error("Error fetching data:", e);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [activeProfile]);

  const handleGenerate = async () => {
      if (userPlan === 'free' && !isUserAdmin(user?.email)) return;
      if (!selectedGoal) {
          setError("Selecciona un objetivo para la estrategia.");
          return;
      }
      setGenerating(true);
      setError("");
      setStrategyResult(null);
      try {
         const activePromotions = promoMode === 'profile'
             ? (activeProfile?.promotions || "")
             : (customPromotions || activeProfile?.promotions || "");

         const res = await fetch("/api/ai/generate-strategy", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ 
                 goal: selectedGoal, 
                 goalName: goals.find(g => g.id === selectedGoal)?.title, 
                 businessType, 
                 expectations,
                 promotions: activePromotions,
                 nicheContext: useRadarContext && radarAnalysis ? (radarAnalysis.summary || JSON.stringify(radarAnalysis.trends || [])) : "",
                 businessData,
                 userId: user?.uid,
                 profileId: activeProfile?.id || 'default',
                 catalogUsage,
                 catalogoItems: catalogoItems.map((item: any) => ({
                     name: item.name,
                     description: item.description,
                     type: item.type,
                     price: item.price || null,
                 })),
                 usePromptStyles,
                 selectedPromptStyles: usePromptStyles ? selectedPromptStyles : [],
                 connectedPlatforms: {
                     facebook: !!activeProfile?.facebookToken_enc,
                     instagram: !!activeProfile?.instagramToken_enc,
                     tiktok: !!activeProfile?.tiktokToken_enc,
                     linkedin: !!activeProfile?.linkedinUserToken_enc || !!activeProfile?.linkedinToken_enc
                 }
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
    if (userPlan === "business") limit = 150;
    if (userPlan === "agency") limit = 999999;
    
    if (postsThisMonth + strategyResult.length > limit && !isUserAdmin(user?.email)) {
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
        showModal("confirm", "Sustituir Estrategia", `Tienes ${pendingAISnapshot.size} posts sugeridos de tu estrategia AI anterior. Al aceptar esta nueva planificación, los anteriores serán descartados para evitar conflictos. ¿Deseas continuar?`, () => {
            setModal(prev => ({ ...prev, isOpen: false }));
            executeAcceptPlan(pendingAISnapshot);
        });
        return;
    }

    executeAcceptPlan(pendingAISnapshot);
  };

  const executeAcceptPlan = async (pendingAISnapshot: any) => {
    setAccepting(true);
    try {
        // Delete old AI strategy posts
        for (const docSnap of pendingAISnapshot.docs) {
           await deleteDoc(doc(db, "social_posts", docSnap.id));
        }

        const postsRef = collection(db, "social_posts");
        for (const post of (strategyResult || [])) {
            const scheduledDate = computePostDate(startDate, startTime, post.dayOffset, post.suggestedTime);

            // Determine format for database mapping
            const fmt = post.format?.toLowerCase() || "";
            const postType = fmt.includes('reel') || fmt.includes('video') ? 'Reel' : (fmt.includes('historia') || fmt.includes('story') ? 'Story' : 'Post');

            const postBaseText = `${post.content}\n\n${post.cta}`;
            const finalTextWithContact = appendContactInfo(postBaseText, activeProfile);

            const newPostRef = await addDoc(postsRef, {
                userId: user.uid,
                profileId: activeProfile?.id || 'default',
                text: finalTextWithContact,
                idea: post.hook,
                type: postType,
                status: 'confirmed', // DIRECTAMENTE AGENDADO Y CONFIRMADO
                scheduledFor: scheduledDate,
                createdAt: new Date(),
                networks: ['instagram', 'facebook'], // Default
                generatedBy: 'ai_strategy',
                visualStyle: post.visualStyle || null,
                promptTemplateId: post.promptTemplateId || null,
                previewUrl: post.previewUrl || null,
                imageDirection: post.imageDirection || null
            });

            try {
                const idToken = await auth.currentUser?.getIdToken();
                await fetch('/api/tasks/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ postId: newPostRef.id, scheduledFor: scheduledDate.toISOString() })
                });
            } catch (scheduleErr) {
                console.error("Warning: Could not schedule GCP task", scheduleErr);
            }
        }
        showModal("success", "¡Planificación Agendada!", "Tus publicaciones han quedado inmediatamente agendadas y confirmadas en tu calendario de redes sociales.", () => {
            router.push("/automatizacion-rrss/panel");
        });
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

      <div className="bg-white p-6 md:p-8 rounded-[32px] border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          {userPlan === 'free' && !isUserAdmin(user?.email) && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center rounded-[32px]">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-6 shadow-2xl border-4 border-slate-700">🔒</div>
                  <h3 className="text-3xl font-black text-white mb-3">Función Premium</h3>
                  <p className="text-slate-200 font-medium max-w-md mb-8 leading-relaxed">El <strong className="text-white">Plan Free</strong> no cuenta con esta opción. Sube de nivel para desbloquear tu Estratega Digital AI y multiplicar tus resultados.</p>
                  <Link href="/automatizacion-rrss/panel/planes" className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/50 hover:-translate-y-1">
                      Ver Planes Pro
                  </Link>
              </div>
          )}

          <div className={`space-y-6 ${userPlan === 'free' && !isUserAdmin(user?.email) ? 'opacity-30 pointer-events-none blur-sm' : ''}`}>
             <div className="flex items-center justify-between">
               <h3 className="text-base font-black text-slate-900 tracking-tight">1. ¿Qué deseas lograr?</h3>
               {selectedGoal && (
                 <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-widest">
                   ✓ {goals.find(g => g.id === selectedGoal)?.title}
                 </span>
               )}
             </div>
             {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold text-sm">{error}</div>}
             
             {/* Horizontal scrollable carousel */}
             <div className="relative">
               <div className="flex flex-col sm:flex-row gap-3 sm:overflow-x-auto sm:pb-2 sm:hide-scrollbar sm:snap-x sm:snap-mandatory">
                 {goals.map(g => (
                   <button
                     key={g.id}
                     onClick={() => setSelectedGoal(g.id)}
                     className={`sm:snap-start shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left w-full sm:w-[200px] ${
                       selectedGoal === g.id
                       ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100 -translate-y-0.5'
                       : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white hover:-translate-y-0.5'
                     }`}
                   >
                     <span className={`text-xl shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${selectedGoal === g.id ? 'bg-white shadow-sm' : 'bg-white/80'}`}>
                       {g.icon || '🎯'}
                     </span>
                     <div className="min-w-0">
                       <div className={`font-black text-xs leading-tight ${selectedGoal === g.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                         {g.title}
                       </div>
                       <div className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug line-clamp-2">
                         {g.description}
                       </div>
                     </div>
                   </button>
                 ))}
               </div>
               {goals.length > 4 && (
                 <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
               )}
             </div>

              {/* NIVEL 2: PROMOCIONES PARA ESTA PLANIFICACIÓN */}
              <div className="p-6 bg-gradient-to-br from-amber-500/5 via-indigo-500/5 to-purple-500/5 rounded-3xl border-2 border-amber-400/30 space-y-4">
                  <div className="flex items-center gap-3">
                     <span className="text-2xl">🏷️</span>
                     <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">2. Promociones y Ofertas para esta Planificación</h3>
                        <p className="text-xs font-medium text-slate-500">Nuestros agentes incluirán estas promociones en los ganchos y carteles publicitarios.</p>
                     </div>
                  </div>

                  {/* Resumen de lo configurado en el perfil */}
                  {activeProfile?.promotions ? (
                    <div className="p-4 bg-white rounded-2xl border border-amber-200/60 shadow-sm text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 mb-1">📌 Promociones activas de tu perfil (Nivel 1):</p>
                      <p className="text-xs font-semibold text-slate-700 whitespace-pre-line">{activeProfile.promotions}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left">
                      <p className="text-xs text-amber-800 font-medium">
                        💡 No tienes promociones guardadas en tu perfil. Puedes escribir tus ofertas para esta estrategia aquí o configurarlas en <Link href="/automatizacion-rrss/panel/configuracion" className="underline font-bold">Configuración de Marca</Link>.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {activeProfile?.promotions && (
                      <label 
                        onClick={() => setPromoMode('profile')}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${promoMode === 'profile' ? 'bg-white border-amber-500 shadow-sm' : 'bg-white/60 border-slate-100 hover:bg-white'}`}
                      >
                        <input type="radio" name="promoMode" checked={promoMode === 'profile'} onChange={() => setPromoMode('profile')} className="accent-amber-600" />
                        <span className="text-xs font-bold text-slate-800">Usar las promociones habituales de mi perfil</span>
                      </label>
                    )}

                    <label 
                      onClick={() => setPromoMode('custom')}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${promoMode === 'custom' || !activeProfile?.promotions ? 'bg-white border-amber-500 shadow-sm' : 'bg-white/60 border-slate-100 hover:bg-white'}`}
                    >
                      <input type="radio" name="promoMode" checked={promoMode === 'custom' || !activeProfile?.promotions} onChange={() => setPromoMode('custom')} className="mt-0.5 accent-amber-600" />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-800">
                          {activeProfile?.promotions ? "Quiero cambiar o agregar una promo especial para estos 14 días" : "Escribir promociones u ofertas para este plan"}
                        </span>
                        {(promoMode === 'custom' || !activeProfile?.promotions) && (
                          <textarea
                            value={customPromotions}
                            onChange={e => setCustomPromotions(e.target.value)}
                            placeholder="Ej: Este fin de semana 3x2 en postres, o 20% OFF en corte y barba..."
                            rows={3}
                            className="w-full mt-2 bg-slate-50 border border-amber-200/60 p-3 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-amber-400 resize-none"
                          />
                        )}
                      </div>
                    </label>
                  </div>
              </div>

              {/* RADAR DE NICHO VINCULADO */}
              {radarAnalysis && (
                <div className="p-5 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl border-2 border-sky-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
                    <div className="flex items-center gap-3">
                       <span className="text-3xl">📡</span>
                       <div>
                          <div className="flex items-center gap-2">
                             <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Radar de Nicho Activo: {radarAnalysis.niche || activeProfile?.rubro}</h4>
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                            Se detectaron {radarAnalysis.trends?.length || 0} temas candentes y {radarAnalysis.ideas?.length || 0} ideas que alimentarán esta estrategia.
                          </p>
                       </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-sky-200 shadow-sm shrink-0">
                       <input 
                         type="checkbox" 
                         checked={useRadarContext} 
                         onChange={e => setUseRadarContext(e.target.checked)} 
                         className="w-4 h-4 accent-sky-600 rounded" 
                       />
                       <span className="text-xs font-bold text-sky-800">Conectar Radar</span>
                    </label>
                </div>
              )}

              {/* INTEGRACIÓN DEL CATÁLOGO DE PRODUCTOS/SERVICIOS */}
              {catalogoItems.length > 0 && (
                <div className="p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🛍️</span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Catálogo de Productos y Servicios</h3>
                        <p className="text-xs font-medium text-slate-500">
                          Tienes {catalogoItems.length} {catalogoItems.length === 1 ? 'ítem' : 'ítems'} en tu catálogo. ¿Cómo quieres integrarlos en este plan?
                        </p>
                      </div>
                    </div>
                    <Link href="/automatizacion-rrss/panel/catalogo" className="text-xs font-bold text-indigo-600 hover:underline">
                      Ver Catálogo
                    </Link>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <label 
                      onClick={() => setCatalogUsage('all')}
                      className={`flex-1 flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${catalogUsage === 'all' ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input type="radio" checked={catalogUsage === 'all'} onChange={() => setCatalogUsage('all')} className="accent-indigo-600" />
                        <span className="text-xs font-black text-slate-800">100% Catálogo</span>
                      </div>
                      <span className="text-[10px] text-slate-500 pl-5">Toda la estrategia se basará únicamente en tus productos o servicios.</span>
                    </label>

                    <label 
                      onClick={() => setCatalogUsage('mixed')}
                      className={`flex-1 flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${catalogUsage === 'mixed' ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input type="radio" checked={catalogUsage === 'mixed'} onChange={() => setCatalogUsage('mixed')} className="accent-indigo-600" />
                        <span className="text-xs font-black text-slate-800">A medias (Recomendado)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 pl-5">Mezcla tus productos/servicios con contenido general y de valor.</span>
                    </label>

                    <label 
                      onClick={() => setCatalogUsage('none')}
                      className={`flex-1 flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${catalogUsage === 'none' ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input type="radio" checked={catalogUsage === 'none'} onChange={() => setCatalogUsage('none')} className="accent-indigo-600" />
                        <span className="text-xs font-black text-slate-800">No usar catálogo</span>
                      </div>
                      <span className="text-[10px] text-slate-500 pl-5">Planificación libre, enfocada en branding o contenido general.</span>
                    </label>
                  </div>
                </div>
              )}

              {/* INTEGRACIÓN DE ESTILOS VISUALES DE PROMPTS IA */}
              <PromptStyleSelector
                enabled={usePromptStyles}
                onToggleEnabled={setUsePromptStyles}
                selectedStyles={selectedPromptStyles}
                onChangeSelectedStyles={setSelectedPromptStyles}
              />

              {/* FECHA Y HORA DE INICIO DE LA PLANIFICACIÓN */}
              <div className="p-6 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-white rounded-3xl border-2 border-indigo-100/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                      <span className="text-2xl">📅</span>
                      <div>
                          <h3 className="text-sm font-black text-slate-900 tracking-tight">Fecha y Hora de Inicio del Plan</h3>
                          <p className="text-xs font-medium text-slate-500">Define a partir de qué día y hora comenzará a publicarse esta estrategia.</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                            Fecha de Inicio (Primer Post)
                          </label>
                          <input 
                            type="date"
                            value={startDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 px-4 py-3 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all text-sm shadow-xs"
                          />
                      </div>

                      <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                            Hora Preferida
                          </label>
                          <input 
                            type="time"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 px-4 py-3 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all text-sm shadow-xs"
                          />
                      </div>
                  </div>

                  {scheduleContinuityInfo?.hasFuturePosts && (
                    <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-start gap-3">
                      <span className="text-xl shrink-0">🗓️</span>
                      <div className="text-xs text-emerald-900 leading-relaxed font-medium">
                        <strong className="font-black text-emerald-950 block mb-0.5">Continuación Inteligente de Calendario</strong>
                        Tienes publicaciones agendadas hasta el <strong>{scheduleContinuityInfo.lastScheduledDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>. Nuestros agentes han configurado el inicio de esta nueva estrategia para continuar el <strong>{new Date(startDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong> evitando cualquier solapamiento.
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-900 font-semibold">
                      <span>💡</span>
                      <span>
                        El primer contenido se programará para el <strong className="text-indigo-950 font-black">{new Date(startDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong> a las <strong className="text-indigo-950 font-black">{startTime} hrs</strong>, distribuyendo las siguientes publicaciones de forma progresiva.
                      </span>
                  </div>
              </div>

              <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight mb-3">Expectativas u Objetivos Especiales <span className="text-slate-400 font-medium">(Opcional)</span></h3>
                  <div className="relative">
                      <textarea 
                         value={expectations}
                         onChange={e => setExpectations(e.target.value)}
                         placeholder="Ej: Quiero enfocarme en vender zapatos rojos de verano... o lanzamos una nueva sucursal en Madrid..."
                         className="w-full bg-slate-50 border-2 border-slate-100 pl-4 pr-12 py-4 rounded-[20px] font-medium text-slate-700 outline-none focus:border-indigo-500 transition-colors resize-none mb-2 text-sm"
                         rows={3}
                      />
                      <VoiceMic 
                         onResult={(text) => setExpectations(prev => prev + (prev ? " " : "") + text)} 
                         className="absolute right-4 top-4 z-20"
                      />
                  </div>
                  <p className="text-xs text-slate-400 font-bold px-2">Combinado con tus <Link href="/automatizacion-rrss/panel/configuracion" className="text-indigo-500 underline">Datos de Negocio</Link>, nuestros agentes serán mucho más precisos.</p>
              </div>

             <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <p className="text-slate-400 font-bold text-xs">Negocio: <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{businessType || 'General'}</span></p>
                 
                 {!hasNetworks ? (
                    <Link href="/automatizacion-rrss/panel/configuracion" className="w-full sm:w-auto bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-amber-700 font-black py-3 px-8 rounded-[24px] transition-all flex items-center justify-center gap-2 shadow-sm hover:-translate-y-1 text-sm">
                       ⚠️ Vincula una Red Social para Planificar
                    </Link>
                 ) : (
                     <button
                        onClick={handleGenerate}
                        disabled={generating || !selectedGoal}
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black py-3 px-8 rounded-[24px] transition-all shadow-xl shadow-slate-900/20 hover:-translate-y-1 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3 text-sm"
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
                     {accepting ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando y Agendando...</> : <><span>✅</span> Aceptar y Agendar Planificación</>}
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
                                  const postDate = computePostDate(startDate, startTime, post.dayOffset, post.suggestedTime);
                                  const dateStr = postDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
                                  const timeStr = postDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' hrs';
                                  const formatColor = post.format.toLowerCase().includes('reel') ? 'bg-pink-50 text-pink-600 border border-pink-100' : post.format.toLowerCase().includes('historia') ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100';

                                  return (
                                     <div key={index} className="bg-slate-50 border-2 border-slate-100/60 rounded-3xl p-6 hover:bg-white hover:border-indigo-100 transition-all group relative overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md">
                                         <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-50/50 transition-colors"></div>
                                         <div className="flex items-center justify-between mb-4 relative z-10">
                                            <div className="flex flex-col">
                                                <span className="text-slate-800 font-black capitalize text-lg tracking-tight">{dateStr}</span>
                                                <span className="text-slate-500 font-bold tracking-widest uppercase text-[10px] flex items-center gap-2">
                                                    <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {timeStr}
                                                </span>
                                            </div>
                                            <span className={`${formatColor} font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-xl`}>{post.format}</span>
                                         </div>

                                         {/* Style badge if assigned */}
                                         {post.visualStyle && (
                                            <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-indigo-50/80 border border-indigo-100/90 mb-4 relative z-10">
                                              {post.previewUrl ? (
                                                <img 
                                                  src={post.previewUrl} 
                                                  alt={post.visualStyle} 
                                                  className="w-10 h-10 rounded-xl object-cover border border-indigo-200/80 shadow-xs shrink-0" 
                                                />
                                              ) : (
                                                <span className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-base shrink-0">🎨</span>
                                              )}
                                              <div className="min-w-0 flex-1">
                                                <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Estilo Visual Prompt IA</div>
                                                <div className="text-xs font-black text-indigo-950 truncate">{post.visualStyle}</div>
                                                {post.imageDirection && (
                                                  <div className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">{post.imageDirection}</div>
                                                )}
                                              </div>
                                            </div>
                                         )}
                                         
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
      <StatusModal 
        {...modal} 
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
